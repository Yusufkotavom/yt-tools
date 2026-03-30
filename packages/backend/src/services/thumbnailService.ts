import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Thumbnail } from '@prisma/client';

interface ThumbnailCreateData {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  channelId?: string;
  metadataId?: string;
}

export class ThumbnailService {
  static async getAll(userId: string, channelId?: string) {
    const where: Record<string, unknown> = { userId };
    if (channelId) {
      where.channelId = channelId;
    }

    return prisma.thumbnail.findMany({
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
    const thumbnail = await prisma.thumbnail.findFirst({
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

    if (!thumbnail) {
      throw new AppError('Thumbnail not found', 404);
    }

    return thumbnail;
  }

  static async create(userId: string, data: ThumbnailCreateData) {
    if (data.channelId) {
      const channel = await prisma.channel.findFirst({
        where: { id: data.channelId, userId },
      });
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }
    }

    return prisma.thumbnail.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async delete(id: string, userId: string) {
    const thumbnail = await prisma.thumbnail.findFirst({
      where: { id, userId },
    });

    if (!thumbnail) {
      throw new AppError('Thumbnail not found', 404);
    }

    return prisma.thumbnail.delete({ where: { id } });
  }

  static async setDefault(id: string, userId: string) {
    const thumbnail = await prisma.thumbnail.findFirst({
      where: { id, userId },
    });

    if (!thumbnail) {
      throw new AppError('Thumbnail not found', 404);
    }

    // Unset previous default
    await prisma.thumbnail.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return prisma.thumbnail.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  static async getDefault(userId: string) {
    return prisma.thumbnail.findFirst({
      where: { userId, isDefault: true },
    });
  }
}
