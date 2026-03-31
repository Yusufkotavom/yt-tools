import { Response } from 'express';
import { AuthRequest } from '../types';
import { LiveService } from '../services/liveService';

export class LiveController {
  static async getStatus(req: AuthRequest, res: Response) {
    try {
      const status = await LiveService.getStatus(req.user!.id);
      res.json({ success: true, data: status });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get live status';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async start(req: AuthRequest, res: Response) {
    try {
      const {
        streamKeyId,
        videoId,
        channelId,
        title,
        description,
        thumbnailId,
        privacyStatus,
      } = req.body;

      if (!videoId || !channelId || !title) {
        res.status(400).json({
          success: false,
          error: 'channelId, videoId, and title are required',
        });
        return;
      }

      const session = await LiveService.start(req.user!.id, {
        streamKeyId,
        videoId,
        channelId,
        title,
        description,
        thumbnailId,
        privacyStatus,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'Live stream started',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start live stream';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async stop(req: AuthRequest, res: Response) {
    try {
      const sessionId =
        typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;
      const session = await LiveService.stop(req.user!.id, sessionId);
      res.json({
        success: true,
        data: session,
        message: 'Stopping live stream',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop live stream';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async stopAll(req: AuthRequest, res: Response) {
    try {
      const sessions = await LiveService.stopAll(req.user!.id);
      res.json({
        success: true,
        data: sessions,
        message: 'Stopping all active live streams',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop all live streams';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async startFromSchedule(req: AuthRequest, res: Response) {
    try {
      const { scheduleId, streamKeyId, videoId, thumbnailId } = req.body;
      if (!scheduleId || !videoId) {
        res.status(400).json({
          success: false,
          error: 'scheduleId and videoId are required',
        });
        return;
      }

      const session = await LiveService.startFromSchedule(req.user!.id, scheduleId, {
        streamKeyId,
        videoId,
        thumbnailId,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'Live stream started from schedule',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start live from schedule';
      res.status(400).json({ success: false, error: message });
    }
  }
}
