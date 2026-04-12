import { Response } from 'express';
import { AuthRequest } from '../types';
import { SimpleLiveService } from '../services/simpleLiveService';

export class SimpleLiveController {
  static getStatus(req: AuthRequest, res: Response) {
    try {
      const status = SimpleLiveService.getStatus(req.user!.id);
      res.json({ success: true, data: status });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get live status';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async start(req: AuthRequest, res: Response) {
    try {
      const {
        rtmpUrl,
        streamKey,
        serverUrl,
        videoId,
        title,
        loop,
        loopCount,
        videoBitrate,
        audioBitrate,
        resolution,
        framerate,
      } = req.body;

      if (!videoId || !title) {
        res.status(400).json({
          success: false,
          error: 'videoId and title are required',
        });
        return;
      }

      if (!rtmpUrl && !streamKey) {
        res.status(400).json({
          success: false,
          error: 'rtmpUrl or streamKey is required',
        });
        return;
      }

      const session = await SimpleLiveService.start(req.user!.id, {
        rtmpUrl,
        streamKey,
        serverUrl,
        videoId,
        title,
        loop,
        loopCount,
        videoBitrate,
        audioBitrate,
        resolution,
        framerate,
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

  static stop(req: AuthRequest, res: Response) {
    try {
      const sessionId =
        typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined;
      const session = SimpleLiveService.stop(req.user!.id, sessionId);
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

  static stopAll(req: AuthRequest, res: Response) {
    try {
      const sessions = SimpleLiveService.stopAll(req.user!.id);
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
}
