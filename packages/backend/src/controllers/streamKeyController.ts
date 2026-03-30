import { Response } from 'express';
import { AuthRequest } from '../types';
import { StreamKeyService } from '../services/streamKeyService';
import { getParam, getQuery } from '../utils/query';

export class StreamKeyController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channelId = getQuery(req.query, 'channelId');
      const streamKeys = await StreamKeyService.getAll(req.user!.id, channelId);
      res.json({ success: true, data: streamKeys });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stream keys';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const streamKey = await StreamKeyService.getById(id, req.user!.id);
      res.json({ success: true, data: streamKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stream key not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const streamKey = await StreamKeyService.create(req.user!.id, data);
      res.status(201).json({
        success: true,
        data: streamKey,
        message: 'Stream key created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create stream key';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const data = req.body;
      const streamKey = await StreamKeyService.update(id, req.user!.id, data);
      res.json({
        success: true,
        data: streamKey,
        message: 'Stream key updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update stream key';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      await StreamKeyService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Stream key deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete stream key';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async toggleActive(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const streamKey = await StreamKeyService.toggleActive(id, req.user!.id);
      res.json({
        success: true,
        data: streamKey,
        message: `Stream key ${streamKey.isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle stream key';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async markUsed(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const streamKey = await StreamKeyService.markUsed(id, req.user!.id);
      res.json({
        success: true,
        data: streamKey,
        message: 'Stream key marked as used',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark stream key as used';
      res.status(400).json({ success: false, error: message });
    }
  }
}
