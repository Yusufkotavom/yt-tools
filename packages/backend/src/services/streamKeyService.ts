import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { StreamKeyCreateInput, StreamKeyUpdateInput } from '../types';
import { YoutubeLiveService } from './youtubeLiveService';

export class StreamKeyService {
  static async getAll(userId: string, channelId?: string) {
    const where: Record<string, unknown> = { userId };
    if (channelId) {
      where.channelId = channelId;
    }

    return prisma.streamKey.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    return streamKey;
  }

  static async create(userId: string, data: StreamKeyCreateInput) {
    const { autoCreateYoutubeStream, ...persistData } = data;
    const channel = await prisma.channel.findFirst({
      where: { id: persistData.channelId, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const liveStream = autoCreateYoutubeStream
      ? await YoutubeLiveService.resolveOrCreateYouTubeStream(userId, persistData.channelId, {
          streamKeyValue: persistData.keyValue,
          youtubeLiveStreamId: persistData.youtubeLiveStreamId,
          title: persistData.name,
          createIfMissing: true,
        })
      : null;

    return prisma.streamKey.create({
      data: {
        ...persistData,
        userId,
        expiresAt: persistData.expiresAt ? new Date(persistData.expiresAt) : undefined,
        youtubeLiveStreamId: persistData.youtubeLiveStreamId || liveStream?.id,
        youtubeStreamName: persistData.youtubeStreamName || liveStream?.streamName,
        youtubeIngestionAddress:
          persistData.youtubeIngestionAddress || liveStream?.ingestionAddress,
      },
    });
  }

  static async update(id: string, userId: string, data: StreamKeyUpdateInput) {
    const { autoCreateYoutubeStream, ...persistData } = data;
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    const updateData: Record<string, unknown> = { ...persistData };
    if (persistData.expiresAt) {
      updateData.expiresAt = new Date(persistData.expiresAt);
    }

    const liveStream = autoCreateYoutubeStream
      ? await YoutubeLiveService.resolveOrCreateYouTubeStream(
          userId,
          streamKey.channelId,
          {
            streamKeyValue: persistData.keyValue || streamKey.keyValue,
            youtubeLiveStreamId:
              persistData.youtubeLiveStreamId || streamKey.youtubeLiveStreamId || undefined,
            title: persistData.name || streamKey.name,
            createIfMissing: true,
          }
        )
      : null;

    return prisma.streamKey.update({
      where: { id },
      data: {
        ...updateData,
        youtubeLiveStreamId:
          persistData.youtubeLiveStreamId || liveStream?.id || streamKey.youtubeLiveStreamId,
        youtubeStreamName:
          persistData.youtubeStreamName || liveStream?.streamName || streamKey.youtubeStreamName,
        youtubeIngestionAddress:
          persistData.youtubeIngestionAddress ||
          liveStream?.ingestionAddress ||
          streamKey.youtubeIngestionAddress,
      },
    });
  }

  static async resolveOrCreate(id: string, userId: string) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    const liveStream = await YoutubeLiveService.resolveOrCreateYouTubeStream(
      userId,
      streamKey.channelId,
      {
        streamKeyValue: streamKey.keyValue,
        youtubeLiveStreamId: streamKey.youtubeLiveStreamId || undefined,
        title: streamKey.name,
        createIfMissing: true,
      }
    );

    return prisma.streamKey.update({
      where: { id },
      data: {
        youtubeLiveStreamId: liveStream.id,
        youtubeStreamName: liveStream.streamName,
        youtubeIngestionAddress: liveStream.ingestionAddress,
      },
    });
  }

  static async delete(id: string, userId: string) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    return prisma.streamKey.delete({ where: { id } });
  }

  static async toggleActive(id: string, userId: string) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    return prisma.streamKey.update({
      where: { id },
      data: { isActive: !streamKey.isActive },
    });
  }

  static async markUsed(id: string, userId: string) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    return prisma.streamKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
