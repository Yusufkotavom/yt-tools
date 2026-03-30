import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { AuthRequest } from '../types';
import { ThumbnailService } from '../services/thumbnailService';
import { AppError } from '../middleware/errorHandler';
import { getParam, getQuery } from '../utils/query';

export class ThumbnailController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channelId = getQuery(req.query, 'channelId');
      const thumbnails = await ThumbnailService.getAll(req.user!.id, channelId);
      res.json({ success: true, data: thumbnails });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get thumbnails';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const thumbnail = await ThumbnailService.getById(id, req.user!.id);
      res.json({ success: true, data: thumbnail });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Thumbnail not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const metadata = await sharp(req.file.path).metadata();
      const channelId = req.body.channelId as string | undefined;
      const metadataId = req.body.metadataId as string | undefined;

      const thumbnail = await ThumbnailService.create(req.user!.id, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        width: metadata.width,
        height: metadata.height,
        mimeType: req.file.mimetype,
        channelId,
        metadataId,
      });

      res.status(201).json({
        success: true,
        data: thumbnail,
        message: 'Thumbnail uploaded successfully',
      });
    } catch (error) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      const message = error instanceof Error ? error.message : 'Failed to upload thumbnail';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const thumbnail = await ThumbnailService.getById(id, req.user!.id);

      if (fs.existsSync(thumbnail.path)) {
        fs.unlinkSync(thumbnail.path);
      }

      await ThumbnailService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Thumbnail deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete thumbnail';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async setDefault(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const thumbnail = await ThumbnailService.setDefault(id, req.user!.id);
      res.json({
        success: true,
        data: thumbnail,
        message: 'Default thumbnail set successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default thumbnail';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getDefault(req: AuthRequest, res: Response) {
    try {
      const thumbnail = await ThumbnailService.getDefault(req.user!.id);
      res.json({ success: true, data: thumbnail });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No default thumbnail';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async serveFile(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const thumbnail = await ThumbnailService.getById(id, req.user!.id);

      if (!fs.existsSync(thumbnail.path)) {
        throw new AppError('File not found', 404);
      }

      res.sendFile(path.resolve(thumbnail.path));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({ success: false, error: message });
    }
  }
}
