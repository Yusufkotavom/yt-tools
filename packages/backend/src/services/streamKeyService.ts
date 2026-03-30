import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { StreamKeyCreateInput, StreamKeyUpdateInput } from '../types';

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
    const channel = await prisma.channel.findFirst({
      where: { id: data.channelId, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    return prisma.streamKey.create({
      data: {
        ...data,
        userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  static async update(id: string, userId: string, data: StreamKeyUpdateInput) {
    const streamKey = await prisma.streamKey.findFirst({
      where: { id, userId },
    });

    if (!streamKey) {
      throw new AppError('Stream key not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.expiresAt) {
      updateData.expiresAt = new Date(data.expiresAt);
    }

    return prisma.streamKey.update({
      where: { id },
      data: updateData,
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
