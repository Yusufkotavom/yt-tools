import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const uploadDir = path.resolve(config.upload.dir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});
