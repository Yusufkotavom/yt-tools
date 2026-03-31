import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ChannelCreateInput, ChannelUpdateInput } from '../types';

const transformChannel = <
  T extends {
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
  },
>(
  channel: T
) => {
  const { accessToken, refreshToken, tokenExpiresAt, ...rest } = channel;
  return {
    ...rest,
    youtubeConnected: Boolean(refreshToken || accessToken),
    youtubeTokenExpiresAt: tokenExpiresAt ?? null,
  };
};

export class ChannelService {
  static async getAll(userId: string) {
    const channels = await prisma.channel.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            schedules: true,
            thumbnails: true,
            streamKeys: true,
            metadata: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return channels.map((channel) => transformChannel(channel));
  }

  static async getById(id: string, userId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            schedules: true,
            thumbnails: true,
            streamKeys: true,
            metadata: true,
          },
        },
      },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    return transformChannel(channel);
  }

  static async create(userId: string, data: ChannelCreateInput) {
    const existingChannel = await prisma.channel.findFirst({
      where: { youtubeId: data.youtubeId, userId },
    });

    if (existingChannel) {
      throw new AppError('Channel already exists', 400);
    }

    const channel = await prisma.channel.create({
      data: {
        ...data,
        userId,
      },
    });

    return transformChannel(channel);
  }

  static async update(id: string, userId: string, data: ChannelUpdateInput) {
    const channel = await prisma.channel.findFirst({
      where: { id, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.tokenExpiresAt) {
      updateData.tokenExpiresAt = new Date(data.tokenExpiresAt);
    }

    const updated = await prisma.channel.update({
      where: { id },
      data: updateData,
    });

    return transformChannel(updated);
  }

  static async delete(id: string, userId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    return prisma.channel.delete({ where: { id } });
  }

  static async getStats(userId: string) {
    const channels = await prisma.channel.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            schedules: true,
            thumbnails: true,
            streamKeys: true,
            metadata: true,
          },
        },
      },
    });

    const totalChannels = channels.length;
    const activeChannels = channels.filter((c) => c.isActive).length;
    const totalSchedules = channels.reduce(
      (sum, c) => sum + c._count.schedules,
      0
    );
    const totalThumbnails = channels.reduce(
      (sum, c) => sum + c._count.thumbnails,
      0
    );
    const totalStreamKeys = channels.reduce(
      (sum, c) => sum + c._count.streamKeys,
      0
    );

    return {
      totalChannels,
      activeChannels,
      totalSchedules,
      totalThumbnails,
      totalStreamKeys,
    };
  }
}
