import { Router } from 'express';
import authRoutes from './auth';
import scheduleRoutes from './schedule';
import thumbnailRoutes from './thumbnail';
import videoRoutes from './video';
import streamKeyRoutes from './streamKey';
import channelRoutes from './channel';
import metadataRoutes from './metadata';
import liveRoutes from './live';
import simpleLiveRoutes from './simpleLive';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/thumbnails', thumbnailRoutes);
router.use('/videos', videoRoutes);
router.use('/stream-keys', streamKeyRoutes);
router.use('/channels', channelRoutes);
router.use('/metadata', metadataRoutes);
router.use('/live', liveRoutes);
router.use('/simple-live', simpleLiveRoutes);

export default router;
