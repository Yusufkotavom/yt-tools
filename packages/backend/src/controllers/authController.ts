import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/authService';

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ success: false, error: message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = await AuthService.updateProfile(req.user!.id, req.body);
      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(400).json({ success: false, error: message });
    }
  }
}
