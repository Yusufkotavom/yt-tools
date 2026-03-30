import { Response } from 'express';
import { AuthRequest } from '../types';
import { ScheduleService } from '../services/scheduleService';
import { getParam, getQuery } from '../utils/query';

export class ScheduleController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const channelId = getQuery(req.query, 'channelId');
      const schedules = await ScheduleService.getAll(req.user!.id, channelId);
      res.json({ success: true, data: schedules });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get schedules';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const schedule = await ScheduleService.getById(id, req.user!.id);
      res.json({ success: true, data: schedule });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Schedule not found';
      res.status(404).json({ success: false, error: message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const schedule = await ScheduleService.create(req.user!.id, data);
      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Schedule created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create schedule';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      const data = req.body;
      const schedule = await ScheduleService.update(id, req.user!.id, data);
      res.json({
        success: true,
        data: schedule,
        message: 'Schedule updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update schedule';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = getParam(req, 'id');
      await ScheduleService.delete(id, req.user!.id);
      res.json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete schedule';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getUpcoming(req: AuthRequest, res: Response) {
    try {
      const limitParam = getQuery(req.query, 'limit');
      const limit = limitParam ? parseInt(limitParam) : 10;
      const schedules = await ScheduleService.getUpcoming(req.user!.id, limit);
      res.json({ success: true, data: schedules });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get upcoming schedules';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getByDateRange(req: AuthRequest, res: Response) {
    try {
      const startDate = getQuery(req.query, 'startDate');
      const endDate = getQuery(req.query, 'endDate');
      const channelId = getQuery(req.query, 'channelId');

      if (!startDate || !endDate) {
        res.status(400).json({ success: false, error: 'startDate and endDate are required' });
        return;
      }

      const schedules = await ScheduleService.getByDateRange(
        req.user!.id,
        new Date(startDate),
        new Date(endDate),
        channelId
      );
      res.json({ success: true, data: schedules });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get schedules';
      res.status(400).json({ success: false, error: message });
    }
  }
}
