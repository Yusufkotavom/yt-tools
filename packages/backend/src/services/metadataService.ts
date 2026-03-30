import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { MetadataCreateInput, MetadataUpdateInput } from '../types';

export class MetadataService {
  static async getAll(userId: string, channelId?: string) {
    const where: Record<string, unknown> = {};
    if (channelId) {
      where.channelId = channelId;
    } else {
      where.channel = { userId };
    }

    return prisma.metadata.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
        thumbnails: {
          select: {
            id: true,
            path: true,
            filename: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const metadata = await prisma.metadata.findFirst({
      where: {
        id,
        channel: { userId },
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
        thumbnails: true,
      },
    });

    if (!metadata) {
      throw new AppError('Metadata not found', 404);
    }

    return metadata;
  }

  static async create(userId: string, data: MetadataCreateInput) {
    const channel = await prisma.channel.findFirst({
      where: { id: data.channelId, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    return prisma.metadata.create({
      data: {
        ...data,
        publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
      },
    });
  }

  static async update(id: string, userId: string, data: MetadataUpdateInput) {
    const metadata = await prisma.metadata.findFirst({
      where: {
        id,
        channel: { userId },
      },
    });

    if (!metadata) {
      throw new AppError('Metadata not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.publishAt) {
      updateData.publishAt = new Date(data.publishAt);
    }

    return prisma.metadata.update({
      where: { id },
      data: updateData,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
      },
    });
  }

  static async delete(id: string, userId: string) {
    const metadata = await prisma.metadata.findFirst({
      where: {
        id,
        channel: { userId },
      },
    });

    if (!metadata) {
      throw new AppError('Metadata not found', 404);
    }

    return prisma.metadata.delete({ where: { id } });
  }
}
