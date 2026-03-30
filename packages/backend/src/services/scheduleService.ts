import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ScheduleCreateInput, ScheduleUpdateInput } from '../types';

export class ScheduleService {
  static async getAll(userId: string, channelId?: string) {
    const where: Record<string, unknown> = { userId };
    if (channelId) {
      where.channelId = channelId;
    }

    return prisma.streamSchedule.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
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

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    return schedule;
  }

  static async create(userId: string, data: ScheduleCreateInput) {
    const channel = await prisma.channel.findFirst({
      where: { id: data.channelId, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    return prisma.streamSchedule.create({
      data: {
        ...data,
        userId,
        scheduledAt: new Date(data.scheduledAt),
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

  static async update(id: string, userId: string, data: ScheduleUpdateInput) {
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduledAt) {
      updateData.scheduledAt = new Date(data.scheduledAt);
    }

    return prisma.streamSchedule.update({
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
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    return prisma.streamSchedule.delete({ where: { id } });
  }

  static async getUpcoming(userId: string, limit = 10) {
    return prisma.streamSchedule.findMany({
      where: {
        userId,
        scheduledAt: { gte: new Date() },
        status: { in: ['scheduled', 'live'] },
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
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  static async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    channelId?: string
  ) {
    const where: Record<string, unknown> = {
      userId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (channelId) {
      where.channelId = channelId;
    }

    return prisma.streamSchedule.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            youtubeId: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
