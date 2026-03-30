import { Response } from 'express';
import { AuthRequest } from '../types';
import { ChannelService } from '../services/channelService';
import { getParam } from '../utils/query';

export class ChannelController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channels = await ChannelService.getAll(req.user!.id);
      res.json({ success: true, data: channels });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get channels';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const channel = await ChannelService.getById(id, req.user!.id);
      res.json({ success: true, data: channel });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Channel not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const channel = await ChannelService.create(req.user!.id, data);
      res.status(201).json({
        success: true,
        data: channel,
        message: 'Channel created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create channel';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const data = req.body;
      const channel = await ChannelService.update(id, req.user!.id, data);
      res.json({
        success: true,
        data: channel,
        message: 'Channel updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update channel';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      await ChannelService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Channel deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete channel';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await ChannelService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(400).json({ success: false, error: message });
    }
  }
}
