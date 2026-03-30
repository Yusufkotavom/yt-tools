import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ScheduleController.getAll);
router.get('/upcoming', ScheduleController.getUpcoming);
router.get('/range', ScheduleController.getByDateRange);
router.get('/:id', ScheduleController.getById);
router.post('/', ScheduleController.create);
router.put('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);

export default router;
