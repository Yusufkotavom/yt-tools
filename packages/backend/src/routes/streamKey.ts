import { Router } from 'express';
import { StreamKeyController } from '../controllers/streamKeyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', StreamKeyController.getAll);
router.get('/:id', StreamKeyController.getById);
router.post('/', StreamKeyController.create);
router.post('/:id/resolve-or-create', StreamKeyController.resolveOrCreate);
router.put('/:id', StreamKeyController.update);
router.put('/:id/toggle', StreamKeyController.toggleActive);
router.put('/:id/used', StreamKeyController.markUsed);
router.delete('/:id', StreamKeyController.delete);

export default router;
