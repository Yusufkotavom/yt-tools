import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';
import { VideoService } from '../services/videoService';
import { AppError } from '../middleware/errorHandler';
import { getParam, getQuery } from '../utils/query';

export class VideoController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channelId = getQuery(req.query, 'channelId');
      const videos = await VideoService.getAll(req.user!.id, channelId);
      res.json({ success: true, data: videos });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get videos';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const video = await VideoService.getById(id, req.user!.id);
      res.json({ success: true, data: video });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const channelId = req.body.channelId as string | undefined;
      const isLoop = req.body.isLoop === 'true';
      const loopCount = parseInt(req.body.loopCount) || 0;

      const video = await VideoService.create(req.user!.id, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        isLoop,
        loopCount,
        channelId,
      });

      res.status(201).json({
        success: true,
        data: video,
        message: 'Video uploaded successfully',
      });
    } catch (error) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      const message = error instanceof Error ? error.message : 'Failed to upload video';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const video = await VideoService.update(id, req.user!.id, req.body);
      res.json({ success: true, data: video, message: 'Video updated successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const video = await VideoService.getById(id, req.user!.id);

      if (fs.existsSync(video.path)) fs.unlinkSync(video.path);

      await VideoService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete video';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async toggleLoop(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const video = await VideoService.toggleLoop(id, req.user!.id);
      res.json({
        success: true,
        data: video,
        message: `Loop ${video.isLoop ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle loop';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getLoopVideos(req: AuthRequest, res: Response) {
    try {
      const videos = await VideoService.getLoopVideos(req.user!.id);
      res.json({ success: true, data: videos });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get loop videos';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async serveFile(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const video = await VideoService.getById(id, req.user!.id);

      if (!fs.existsSync(video.path)) throw new AppError('File not found', 404);

      const stat = fs.statSync(video.path);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(video.path, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': video.mimeType,
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType,
        });
        fs.createReadStream(video.path).pipe(res);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({ success: false, error: message });
    }
  }
}
