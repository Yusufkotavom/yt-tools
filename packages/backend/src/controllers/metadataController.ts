import { Response } from 'express';
import { AuthRequest } from '../types';
import { MetadataService } from '../services/metadataService';
import { getParam, getQuery } from '../utils/query';

export class MetadataController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channelId = getQuery(req.query, 'channelId');
      const metadata = await MetadataService.getAll(req.user!.id, channelId);
      res.json({ success: true, data: metadata });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get metadata';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const metadata = await MetadataService.getById(id, req.user!.id);
      res.json({ success: true, data: metadata });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Metadata not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const metadata = await MetadataService.create(req.user!.id, data);
      res.status(201).json({
        success: true,
        data: metadata,
        message: 'Metadata created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create metadata';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const data = req.body;
      const metadata = await MetadataService.update(id, req.user!.id, data);
      res.json({
        success: true,
        data: metadata,
        message: 'Metadata updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update metadata';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      await MetadataService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Metadata deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete metadata';
      res.status(400).json({ success: false, error: message });
    }
  }
}
