import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ChildProcess, spawn } from 'child_process';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

interface SimpleLiveInput {
  rtmpUrl?: string;
  streamKey?: string;
  serverUrl?: string;
  videoId: string;
  title: string;
  loop?: boolean;
  loopCount?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  resolution?: string;
  framerate?: string;
}

interface SimpleLiveSession {
  id: string;
  userId: string;
  videoId: string;
  videoName: string;
  title: string;
  rtmpUrlMasked: string;
  status: 'starting' | 'live' | 'stopping' | 'stopped' | 'error';
  startedAt: string;
  endedAt?: string;
  lastError?: string;
  pid?: number;
  loop: boolean;
  loopCount: number;
  videoBitrate: string;
  audioBitrate: string;
  resolution: string;
  framerate: string;
  recentLogs: string[];
}

interface SimpleRuntime {
  session: SimpleLiveSession;
  process: ChildProcess | null;
  stopRequested: boolean;
}

const sessions = new Map<string, SimpleRuntime>();
const userSessionIds = new Map<string, Set<string>>();
const MAX_LOG_LINES = 200;

const maskRtmpUrl = (url: string): string => {
  const parts = url.split('/');
  if (parts.length === 0) return '***';
  const last = parts[parts.length - 1];
  if (!last) return url;
  parts[parts.length - 1] = `${last.slice(0, 3)}***`;
  return parts.join('/');
};

const buildRtmpUrl = (input: SimpleLiveInput): string => {
  if (input.rtmpUrl) {
    return input.rtmpUrl;
  }
  const server = (input.serverUrl || 'rtmp://a.rtmp.youtube.com/live2').replace(/\/+$/, '');
  return `${server}/${input.streamKey || ''}`;
};

const appendLog = (runtime: SimpleRuntime, log: string) => {
  runtime.session.recentLogs.push(log);
  if (runtime.session.recentLogs.length > MAX_LOG_LINES) {
    runtime.session.recentLogs.splice(0, runtime.session.recentLogs.length - MAX_LOG_LINES);
  }
};

const getUserSessions = (userId: string) => {
  const ids = userSessionIds.get(userId);
  if (!ids) return [] as SimpleRuntime[];

  return [...ids]
    .map((id) => sessions.get(id))
    .filter((runtime): runtime is SimpleRuntime => Boolean(runtime))
    .sort(
      (a, b) =>
        new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime()
    );
};

const isSessionActive = (runtime: SimpleRuntime) =>
  runtime.session.status === 'starting' ||
  runtime.session.status === 'live' ||
  runtime.session.status === 'stopping';

export class SimpleLiveService {
  static getStatus(userId: string) {
    const userSessions = getUserSessions(userId);
    return userSessions.map((runtime) => ({
      ...runtime.session,
      recentLogs: runtime.session.recentLogs.slice(-20),
    }));
  }

  private static stopRuntime(runtime: SimpleRuntime) {
    if (
      !runtime.process ||
      runtime.session.status === 'stopped' ||
      runtime.session.status === 'error'
    ) {
      return { ...runtime.session };
    }

    runtime.stopRequested = true;
    runtime.session.status = 'stopping';

    runtime.process.kill('SIGTERM');

    setTimeout(() => {
      if (runtime.process && runtime.session.status === 'stopping') {
        runtime.process.kill('SIGKILL');
      }
    }, 5000);

    return { ...runtime.session };
  }

  static async start(userId: string, input: SimpleLiveInput) {
    const activeSessions = getUserSessions(userId).filter(isSessionActive);
    if (activeSessions.length >= config.live.maxConcurrent) {
      throw new AppError(
        `Max concurrent live sessions reached (${config.live.maxConcurrent})`,
        400
      );
    }

    const video = await prisma.video.findFirst({
      where: { id: input.videoId, userId },
    });

    if (!video) throw new AppError('Video not found', 404);
    if (!fs.existsSync(video.path)) throw new AppError('Video file not found on disk', 404);

    const rtmpUrl = buildRtmpUrl(input);
    if (!rtmpUrl) throw new AppError('RTMP URL or stream key is required', 400);

    const videoBitrate = input.videoBitrate || '4500k';
    const audioBitrate = input.audioBitrate || '128k';
    const resolution = input.resolution || '1920x1080';
    const framerate = input.framerate || '30';
    const useLoop = input.loop ?? video.isLoop;
    const loopCount = input.loopCount ?? video.loopCount ?? 0;

    const ffmpegArgs = [
      '-re',
      ...(useLoop ? ['-stream_loop', loopCount > 0 ? String(loopCount) : '-1'] : []),
      '-i',
      path.resolve(video.path),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-b:v',
      videoBitrate,
      '-maxrate',
      videoBitrate,
      '-bufsize',
      `${parseInt(videoBitrate) * 2}k`,
      '-pix_fmt',
      'yuv420p',
      '-s',
      resolution,
      '-r',
      framerate,
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      '-ar',
      '44100',
      '-f',
      'flv',
      rtmpUrl,
    ];

    const ffmpeg = spawn(config.live.ffmpegPath, ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const sessionId = randomUUID();

    const runtime: SimpleRuntime = {
      session: {
        id: sessionId,
        userId,
        videoId: video.id,
        videoName: video.originalName,
        title: input.title,
        rtmpUrlMasked: maskRtmpUrl(rtmpUrl),
        status: 'starting',
        startedAt: new Date().toISOString(),
        pid: ffmpeg.pid,
        loop: useLoop,
        loopCount,
        videoBitrate,
        audioBitrate,
        resolution,
        framerate,
        recentLogs: [],
      },
      process: ffmpeg,
      stopRequested: false,
    };

    sessions.set(sessionId, runtime);
    if (!userSessionIds.has(userId)) {
      userSessionIds.set(userId, new Set());
    }
    userSessionIds.get(userId)!.add(sessionId);

    ffmpeg.stderr.on('data', (data) => {
      const text = data.toString();
      appendLog(runtime, text.trim());

      if (
        runtime.session.status === 'starting' &&
        (text.includes('Press [q]') || text.includes('frame='))
      ) {
        runtime.session.status = 'live';
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

    return { ...runtime.session };
  }

  static stop(userId: string, sessionId?: string) {
    const userSessions = getUserSessions(userId);
    if (userSessions.length === 0) {
      throw new AppError('No live session found', 404);
    }

    if (sessionId) {
      const target = sessions.get(sessionId);
      if (!target || target.session.userId !== userId) {
        throw new AppError('Live session not found', 404);
      }
      return this.stopRuntime(target);
    }

    const activeSessions = userSessions.filter(isSessionActive);
    if (activeSessions.length === 0) {
      throw new AppError('No active live session found', 404);
    }

    if (activeSessions.length > 1) {
      throw new AppError(
        'Multiple active sessions found. Provide sessionId to stop a specific live.',
        400
      );
    }

    return this.stopRuntime(activeSessions[0]);
  }

  static stopAll(userId: string) {
    const activeSessions = getUserSessions(userId).filter(isSessionActive);
    if (activeSessions.length === 0) {
      throw new AppError('No active live session found', 404);
    }

    return activeSessions.map((runtime) => this.stopRuntime(runtime));
  }
}
