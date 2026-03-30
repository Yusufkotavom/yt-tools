import { Router } from 'express';
import { VideoController } from '../controllers/videoController';
import { authenticate } from '../middleware/auth';
import { uploadVideo } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', VideoController.getAll);
router.get('/loops', VideoController.getLoopVideos);
router.get('/:id', VideoController.getById);
router.get('/:id/file', VideoController.serveFile);
router.post('/upload', uploadVideo.single('file'), VideoController.upload);
router.put('/:id', VideoController.update);
router.put('/:id/loop', VideoController.toggleLoop);
router.delete('/:id', VideoController.delete);

export default router;
