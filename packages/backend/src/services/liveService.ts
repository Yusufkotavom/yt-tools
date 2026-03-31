import fs from 'fs';
import path from 'path';
import { ChildProcess, spawn } from 'child_process';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';
import { YoutubeLiveService } from './youtubeLiveService';

interface StartLiveInput {
  streamKeyId: string;
  videoId: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnailId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

interface LiveSession {
  userId: string;
  streamKeyId: string;
  streamKeyName: string;
  videoId: string;
  videoName: string;
  channelId?: string;
  title: string;
  description?: string;
  thumbnailId?: string;
  thumbnailFilename?: string;
  rtmpUrlMasked: string;
  youtubeBroadcastId?: string;
  youtubeWatchUrl?: string;
  youtubeStatus?: string;
  status: 'starting' | 'live' | 'stopping' | 'stopped' | 'error';
  startedAt: string;
  endedAt?: string;
  lastError?: string;
  pid?: number;
  note: string;
}

interface LiveRuntimeSession {
  session: LiveSession;
  process: ChildProcess | null;
  recentLogs: string[];
  stopRequested: boolean;
}

const sessions = new Map<string, LiveRuntimeSession>();
const MAX_LOG_LINES = 200;

const maskRtmpUrl = (url: string): string => {
  const parts = url.split('/');
  if (parts.length === 0) return '***';
  const last = parts[parts.length - 1];
  if (!last) return url;
  parts[parts.length - 1] = `${last.slice(0, 3)}***`;
  return parts.join('/');
};

const buildRtmpUrl = (serverUrl: string | null, keyValue: string): string => {
  if (keyValue.startsWith('rtmp://') || keyValue.startsWith('rtmps://')) {
    return keyValue;
  }

  const server = (serverUrl || 'rtmp://a.rtmp.youtube.com/live2').replace(/\/+$/, '');
  return `${server}/${keyValue}`;
};

const appendLog = (runtime: LiveRuntimeSession, log: string) => {
  runtime.recentLogs.push(log);
  if (runtime.recentLogs.length > MAX_LOG_LINES) {
    runtime.recentLogs.splice(0, runtime.recentLogs.length - MAX_LOG_LINES);
  }
};

const serialize = (runtime: LiveRuntimeSession | undefined) => {
  if (!runtime) return null;
  return {
    ...runtime.session,
    recentLogs: runtime.recentLogs,
  };
};

export class LiveService {
  static async getStatus(userId: string) {
    const runtime = sessions.get(userId);
    if (
      runtime &&
      runtime.session.youtubeBroadcastId &&
      runtime.session.channelId &&
      (runtime.session.status === 'starting' || runtime.session.status === 'live')
    ) {
      try {
        runtime.session.youtubeStatus = await YoutubeLiveService.getBroadcastStatus(
          userId,
          runtime.session.channelId,
          runtime.session.youtubeBroadcastId
        );
      } catch (error) {
        runtime.session.lastError =
          error instanceof Error ? error.message : 'Failed to refresh YouTube status';
      }
    }

    return serialize(runtime);
  }

  static async start(userId: string, input: StartLiveInput) {
    const existing = sessions.get(userId);
    if (existing && (existing.session.status === 'starting' || existing.session.status === 'live')) {
      throw new AppError('A live stream is already running. Stop it first.', 400);
    }

    const [channel, streamKey, video, thumbnail] = await Promise.all([
      prisma.channel.findFirst({ where: { id: input.channelId, userId } }),
      prisma.streamKey.findFirst({ where: { id: input.streamKeyId, userId } }),
      prisma.video.findFirst({ where: { id: input.videoId, userId } }),
      input.thumbnailId
        ? prisma.thumbnail.findFirst({ where: { id: input.thumbnailId, userId } })
        : Promise.resolve(null),
    ]);

    if (!channel) throw new AppError('Channel not found', 404);
    if (!streamKey) throw new AppError('Stream key not found', 404);
    if (!streamKey.isActive) throw new AppError('Selected stream key is inactive', 400);
    if (streamKey.expiresAt && streamKey.expiresAt < new Date()) {
      throw new AppError('Selected stream key is expired', 400);
    }
    if (!video) throw new AppError('Video not found', 404);
    if (!fs.existsSync(video.path)) throw new AppError('Video file not found on disk', 404);
    if (input.thumbnailId && !thumbnail) throw new AppError('Thumbnail not found', 404);

    if (streamKey.channelId !== input.channelId) {
      throw new AppError('Stream key is not linked to selected channel', 400);
    }
    if (video.channelId && video.channelId !== input.channelId) {
      throw new AppError('Video is not linked to selected channel', 400);
    }
    if (thumbnail?.channelId && thumbnail.channelId !== input.channelId) {
      throw new AppError('Thumbnail is not linked to selected channel', 400);
    }

    const rtmpUrl = buildRtmpUrl(streamKey.serverUrl, streamKey.keyValue);
    const broadcast = await YoutubeLiveService.createAndBindBroadcast(userId, {
      channelId: input.channelId,
      streamKeyValue: streamKey.keyValue,
      title: input.title,
      description: input.description,
      privacyStatus: input.privacyStatus,
      thumbnailPath: thumbnail?.path,
    });

    const ffmpegArgs = [
      '-re',
      ...(video.isLoop ? ['-stream_loop', '-1'] : []),
      '-i',
      path.resolve(video.path),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-f',
      'flv',
      rtmpUrl,
    ];

    const ffmpeg = spawn(config.live.ffmpegPath, ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const runtime: LiveRuntimeSession = {
      session: {
        userId,
        streamKeyId: streamKey.id,
        streamKeyName: streamKey.name,
        videoId: video.id,
        videoName: video.originalName,
        channelId: input.channelId,
        title: input.title,
        description: input.description,
        thumbnailId: input.thumbnailId,
        thumbnailFilename: thumbnail?.filename,
        rtmpUrlMasked: maskRtmpUrl(rtmpUrl),
        youtubeBroadcastId: broadcast.broadcastId,
        youtubeWatchUrl: broadcast.watchUrl,
        youtubeStatus: broadcast.youtubeStatus,
        status: 'starting',
        startedAt: new Date().toISOString(),
        pid: ffmpeg.pid,
        note: 'Metadata and thumbnail are published to YouTube before streaming starts.',
      },
      process: ffmpeg,
      recentLogs: [],
      stopRequested: false,
    };

    sessions.set(userId, runtime);

    ffmpeg.stderr.on('data', (data) => {
      const text = data.toString();
      appendLog(runtime, text.trim());

      if (runtime.session.status === 'starting' && (text.includes('Press [q]') || text.includes('frame='))) {
        runtime.session.status = 'live';
        if (runtime.session.youtubeBroadcastId && runtime.session.channelId) {
          void YoutubeLiveService.transitionToLive(
            userId,
            runtime.session.channelId,
            runtime.session.youtubeBroadcastId
          ).then((status) => {
            runtime.session.youtubeStatus = status;
          });
        }
      }
    });

    ffmpeg.stdout.on('data', (data) => {
      appendLog(runtime, data.toString().trim());
    });

    ffmpeg.on('error', (error) => {
      runtime.session.status = 'error';
      runtime.session.lastError = error.message;
      runtime.session.endedAt = new Date().toISOString();
      appendLog(runtime, `ffmpeg error: ${error.message}`);
    });

    ffmpeg.on('close', (code, signal) => {
      runtime.process = null;
      runtime.session.pid = undefined;
      runtime.session.endedAt = new Date().toISOString();

      if (runtime.stopRequested) {
        runtime.session.status = 'stopped';
        return;
      }

      if (code === 0) {
        runtime.session.status = 'stopped';
        return;
      }

      runtime.session.status = 'error';
      runtime.session.lastError = `ffmpeg exited with code ${code ?? 'unknown'} signal ${signal ?? 'none'}`;
    });

    await prisma.streamKey.update({
      where: { id: streamKey.id },
      data: { lastUsedAt: new Date() },
    });

    return serialize(runtime);
  }

  static async stop(userId: string) {
    const runtime = sessions.get(userId);
    if (!runtime) {
      throw new AppError('No live stream session found', 404);
    }

    if (!runtime.process || runtime.session.status === 'stopped' || runtime.session.status === 'error') {
      return serialize(runtime);
    }

    runtime.stopRequested = true;
    runtime.session.status = 'stopping';
    if (runtime.session.youtubeBroadcastId && runtime.session.channelId) {
      void YoutubeLiveService.transitionToComplete(
        userId,
        runtime.session.channelId,
        runtime.session.youtubeBroadcastId
      ).then((status) => {
        runtime.session.youtubeStatus = status;
      });
    }

    runtime.process.kill('SIGTERM');

    setTimeout(() => {
      if (runtime.process && runtime.session.status === 'stopping') {
        runtime.process.kill('SIGKILL');
      }
    }, 5000);

    return serialize(runtime);
  }
}
