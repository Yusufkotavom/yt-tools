import { Router } from 'express';
import { ChannelController } from '../controllers/channelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/youtube/callback', ChannelController.youtubeCallback);

router.use(authenticate);

router.get('/', ChannelController.getAll);
router.get('/stats', ChannelController.getStats);
router.get('/:id/youtube/connect-url', ChannelController.getYoutubeConnectUrl);
router.post('/:id/youtube/disconnect', ChannelController.disconnectYoutube);
router.get('/:id', ChannelController.getById);
router.post('/', ChannelController.create);
router.put('/:id', ChannelController.update);
router.delete('/:id', ChannelController.delete);

export default router;
