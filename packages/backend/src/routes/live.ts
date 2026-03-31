import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { LiveController } from '../controllers/liveController';

const router = Router();

router.use(authenticate);

router.get('/status', LiveController.getStatus);
router.post('/start', LiveController.start);
router.post('/stop', LiveController.stop);
router.post('/stop-all', LiveController.stopAll);
router.post('/start-from-schedule', LiveController.startFromSchedule);

export default router;
