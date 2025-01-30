import multer from 'multer';
import * as path from 'path';
import { BadRequestError } from '../errors';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB
    files: 1, // Only one file
  },
  fileFilter: function (_, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(
        new BadRequestError('Only images files supported to upload')
      );
    }
    callback(null, true);
  },
});

export const uploadFile = upload.single('image');
