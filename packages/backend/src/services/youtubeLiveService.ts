import fs from 'fs';
import jwt from 'jsonwebtoken';
import { google, youtube_v3 } from 'googleapis';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload',
];

interface AuthState {
  userId: string;
  channelId: string;
  ts: number;
}

interface BroadcastInput {
  channelId: string;
  streamKeyValue: string;
  title: string;
  description?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  thumbnailPath?: string;
}

interface BroadcastResult {
  broadcastId: string;
  watchUrl: string;
  youtubeStatus: string;
  streamId: string;
  streamTitle: string;
}

const normalizeStreamKey = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('rtmp://') || trimmed.startsWith('rtmps://')) {
    const parts = trimmed.split('/').filter(Boolean);
    return parts[parts.length - 1] || trimmed;
  }
  return trimmed;
};

export class YoutubeLiveService {
  private static createOAuthClient() {
    if (
      !config.youtube.clientId ||
      !config.youtube.clientSecret ||
      !config.youtube.redirectUri
    ) {
      throw new AppError(
        'YouTube OAuth is not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI.',
        500
      );
    }

    return new google.auth.OAuth2(
      config.youtube.clientId,
      config.youtube.clientSecret,
      config.youtube.redirectUri
    );
  }

  private static async getAuthorizedYoutube(
    userId: string,
    channelId: string
  ): Promise<{
    youtube: youtube_v3.Youtube;
    channel: {
      id: string;
      youtubeId: string;
      accessToken: string | null;
      refreshToken: string | null;
      tokenExpiresAt: Date | null;
    };
  }> {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, userId },
      select: {
        id: true,
        youtubeId: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true,
      },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    if (!channel.refreshToken) {
      throw new AppError('Channel is not connected to YouTube. Connect it first.', 400);
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({
      access_token: channel.accessToken ?? undefined,
      refresh_token: channel.refreshToken,
      expiry_date: channel.tokenExpiresAt?.getTime(),
    });

    await oauth2Client.getAccessToken();

    const creds = oauth2Client.credentials;
    if (creds.access_token || creds.expiry_date || creds.refresh_token) {
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          accessToken: creds.access_token ?? channel.accessToken,
          refreshToken: creds.refresh_token ?? channel.refreshToken,
          tokenExpiresAt: creds.expiry_date
            ? new Date(creds.expiry_date)
            : channel.tokenExpiresAt,
        },
      });
    }

    return {
      youtube: google.youtube({ version: 'v3', auth: oauth2Client }),
      channel,
    };
  }

  static getConnectUrl(userId: string, channelId: string) {
    const oauth2Client = this.createOAuthClient();
    const stateToken = jwt.sign(
      {
        userId,
        channelId,
        ts: Date.now(),
      } as AuthState,
      config.jwt.secret,
      { expiresIn: '10m' }
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: YOUTUBE_SCOPES,
      state: stateToken,
    });
  }

  static async handleOAuthCallback(code: string, state: string) {
    let decoded: AuthState;
    try {
      decoded = jwt.verify(state, config.jwt.secret) as AuthState;
    } catch {
      throw new AppError('Invalid OAuth state', 400);
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: decoded.channelId,
        userId: decoded.userId,
      },
      select: {
        id: true,
      },
    });

    if (!channel) {
      throw new AppError('Channel not found for OAuth callback', 404);
    }

    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new AppError('Failed to obtain YouTube access token', 400);
    }

    await prisma.channel.update({
      where: { id: decoded.channelId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    return decoded;
  }

  static async disconnectChannel(userId: string, channelId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, userId },
      select: { id: true },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    await prisma.channel.update({
      where: { id: channelId },
      data: {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      },
    });
  }

  private static async resolveYouTubeStream(
    youtube: youtube_v3.Youtube,
    streamKeyValue: string
  ) {
    const normalized = normalizeStreamKey(streamKeyValue);

    const list = await youtube.liveStreams.list({
      part: ['id', 'snippet', 'cdn', 'status'],
      mine: true,
      maxResults: 50,
    });

    const streams = list.data.items || [];
    const match = streams.find((stream) => {
      const name = stream.cdn?.ingestionInfo?.streamName ?? '';
      return (
        name === normalized ||
        (normalized.length > 0 && normalized.endsWith(name)) ||
        (name.length > 0 && name.endsWith(normalized))
      );
    });

    if (!match || !match.id) {
      throw new AppError(
        'Failed to map stream key to a YouTube live stream. Make sure this stream key belongs to your connected YouTube channel.',
        400
      );
    }

    return {
      id: match.id,
      title: match.snippet?.title || 'Live Stream',
    };
  }

  static async createAndBindBroadcast(
    userId: string,
    input: BroadcastInput
  ): Promise<BroadcastResult> {
    const { youtube } = await this.getAuthorizedYoutube(userId, input.channelId);
    const stream = await this.resolveYouTubeStream(youtube, input.streamKeyValue);

    const scheduledStart = new Date(Date.now() + 60_000).toISOString();

    const create = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title: input.title,
          description: input.description,
          scheduledStartTime: scheduledStart,
        },
        status: {
          privacyStatus: input.privacyStatus || 'public',
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: false,
          enableAutoStop: false,
          monitorStream: {
            enableMonitorStream: true,
          },
        },
      },
    });

    const broadcastId = create.data.id;
    if (!broadcastId) {
      throw new AppError('Failed to create YouTube broadcast', 400);
    }

    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id: broadcastId,
      streamId: stream.id,
    });

    if (input.thumbnailPath && fs.existsSync(input.thumbnailPath)) {
      await youtube.thumbnails.set({
        videoId: broadcastId,
        media: {
          body: fs.createReadStream(input.thumbnailPath),
        },
      });
    }

    return {
      broadcastId,
      watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
      youtubeStatus: create.data.status?.lifeCycleStatus || 'created',
      streamId: stream.id,
      streamTitle: stream.title,
    };
  }

  static async transitionToLive(userId: string, channelId: string, broadcastId: string) {
    const { youtube } = await this.getAuthorizedYoutube(userId, channelId);

    try {
      await youtube.liveBroadcasts.transition({
        part: ['status'],
        id: broadcastId,
        broadcastStatus: 'testing',
      });
    } catch {
      // Ignore if preconditions are not met yet.
    }

    try {
      const result = await youtube.liveBroadcasts.transition({
        part: ['status'],
        id: broadcastId,
        broadcastStatus: 'live',
      });
      return result.data.status?.lifeCycleStatus || 'live';
    } catch {
      return 'testing';
    }
  }

  static async getBroadcastStatus(userId: string, channelId: string, broadcastId: string) {
    const { youtube } = await this.getAuthorizedYoutube(userId, channelId);

    const result = await youtube.liveBroadcasts.list({
      part: ['id', 'status'],
      id: [broadcastId],
    });

    return result.data.items?.[0]?.status?.lifeCycleStatus || 'unknown';
  }

  static async transitionToComplete(
    userId: string,
    channelId: string,
    broadcastId: string
  ) {
    const { youtube } = await this.getAuthorizedYoutube(userId, channelId);

    try {
      const result = await youtube.liveBroadcasts.transition({
        part: ['status'],
        id: broadcastId,
        broadcastStatus: 'complete',
      });
      return result.data.status?.lifeCycleStatus || 'complete';
    } catch {
      return 'complete';
    }
  }
}
