import { Router } from 'express';
import { ThumbnailController } from '../controllers/thumbnailController';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', ThumbnailController.getAll);
router.get('/default', ThumbnailController.getDefault);
router.get('/:id', ThumbnailController.getById);
router.get('/:id/file', ThumbnailController.serveFile);
router.post('/upload', uploadImage.single('file'), ThumbnailController.upload);
router.put('/:id/default', ThumbnailController.setDefault);
router.delete('/:id', ThumbnailController.delete);

export default router;
