import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ScheduleCreateInput, ScheduleUpdateInput } from '../types';
import { YoutubeLiveService } from './youtubeLiveService';

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
    const { syncToYoutube, ...persistData } = data;
    const channel = await prisma.channel.findFirst({
      where: { id: persistData.channelId, userId },
    });

    if (!channel) {
      throw new AppError('Channel not found', 404);
    }

    const created = await prisma.streamSchedule.create({
      data: {
        ...persistData,
        userId,
        scheduledAt: new Date(persistData.scheduledAt),
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

    const shouldSync = syncToYoutube !== false;
    if (!shouldSync) {
      return created;
    }

    try {
      const synced = await YoutubeLiveService.createScheduledBroadcast(userId, {
        channelId: persistData.channelId,
        title: persistData.title,
        description: persistData.description,
        scheduledAt: new Date(persistData.scheduledAt),
        privacyStatus:
          (persistData.privacy as 'public' | 'unlisted' | 'private') || 'public',
      });

      return prisma.streamSchedule.update({
        where: { id: created.id },
        data: {
          youtubeBroadcastId: synced.broadcastId,
          youtubeWatchUrl: synced.watchUrl,
          youtubeSyncStatus: 'synced',
          youtubeSyncError: null,
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
    } catch (error) {
      return prisma.streamSchedule.update({
        where: { id: created.id },
        data: {
          youtubeSyncStatus: 'sync_error',
          youtubeSyncError: error instanceof Error ? error.message : 'Failed to sync schedule',
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
  }

  static async update(id: string, userId: string, data: ScheduleUpdateInput) {
    const { syncToYoutube, ...persistData } = data;
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    const updateData: Record<string, unknown> = { ...persistData };
    if (persistData.scheduledAt) {
      updateData.scheduledAt = new Date(persistData.scheduledAt);
    }

    const updated = await prisma.streamSchedule.update({
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

    const shouldSync = syncToYoutube !== false;
    if (!shouldSync) {
      return updated;
    }

    if (!updated.youtubeBroadcastId) {
      return updated;
    }

    try {
      await YoutubeLiveService.updateScheduledBroadcast(
        userId,
        updated.channelId,
        updated.youtubeBroadcastId,
        {
          title: persistData.title,
          description: persistData.description,
          scheduledAt: persistData.scheduledAt
            ? new Date(persistData.scheduledAt)
            : undefined,
          privacyStatus:
            persistData.privacy as 'public' | 'unlisted' | 'private' | undefined,
        }
      );

      return prisma.streamSchedule.update({
        where: { id: updated.id },
        data: {
          youtubeSyncStatus: 'synced',
          youtubeSyncError: null,
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
    } catch (error) {
      return prisma.streamSchedule.update({
        where: { id: updated.id },
        data: {
          youtubeSyncStatus: 'sync_error',
          youtubeSyncError:
            error instanceof Error ? error.message : 'Failed to update YouTube schedule',
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
  }

  static async delete(id: string, userId: string) {
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    if (schedule.youtubeBroadcastId) {
      try {
        await YoutubeLiveService.deleteBroadcast(
          userId,
          schedule.channelId,
          schedule.youtubeBroadcastId
        );
      } catch {
        // Keep delete behavior best-effort for YouTube cleanup.
      }
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
