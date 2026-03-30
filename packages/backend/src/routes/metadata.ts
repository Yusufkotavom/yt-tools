import { Router } from 'express';
import { MetadataController } from '../controllers/metadataController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', MetadataController.getAll);
router.get('/:id', MetadataController.getById);
router.post('/', MetadataController.create);
router.put('/:id', MetadataController.update);
router.delete('/:id', MetadataController.delete);

export default router;
