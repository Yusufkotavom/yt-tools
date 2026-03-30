import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface VideoCreateData {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  mimeType: string;
  isLoop?: boolean;
  loopCount?: number;
  channelId?: string;
}

interface VideoUpdateData {
  isLoop?: boolean;
  loopCount?: number;
}

export class VideoService {
  static async getAll(userId: string, channelId?: string) {
    const where: Record<string, unknown> = { userId };
    if (channelId) where.channelId = channelId;

    return prisma.video.findMany({
      where,
      include: {
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const video = await prisma.video.findFirst({
      where: { id, userId },
      include: {
        channel: { select: { id: true, name: true } },
      },
    });

    if (!video) throw new AppError('Video not found', 404);
    return video;
  }

  static async create(userId: string, data: VideoCreateData) {
    if (data.channelId) {
      const channel = await prisma.channel.findFirst({
        where: { id: data.channelId, userId },
      });
      if (!channel) throw new AppError('Channel not found', 404);
    }

    return prisma.video.create({
      data: { ...data, userId },
    });
  }

  static async update(id: string, userId: string, data: VideoUpdateData) {
    const video = await prisma.video.findFirst({
      where: { id, userId },
    });

    if (!video) throw new AppError('Video not found', 404);

    return prisma.video.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    const video = await prisma.video.findFirst({
      where: { id, userId },
    });

    if (!video) throw new AppError('Video not found', 404);

    return prisma.video.delete({ where: { id } });
  }

  static async toggleLoop(id: string, userId: string) {
    const video = await prisma.video.findFirst({
      where: { id, userId },
    });

    if (!video) throw new AppError('Video not found', 404);

    return prisma.video.update({
      where: { id },
      data: { isLoop: !video.isLoop },
    });
  }

  static async getLoopVideos(userId: string) {
    return prisma.video.findMany({
      where: { userId, isLoop: true },
      include: {
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
