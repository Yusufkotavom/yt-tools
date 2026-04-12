import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SimpleLiveController } from '../controllers/simpleLiveController';

const router = Router();

router.use(authenticate);

router.get('/status', SimpleLiveController.getStatus);
router.post('/start', SimpleLiveController.start);
router.post('/stop', SimpleLiveController.stop);
router.post('/stop-all', SimpleLiveController.stopAll);

export default router;
