import { Router } from 'express';
import { isAuth } from '../middlewares/isAuth';
import {
  findUsersByName,
  getCurrentUser,
  getSingleUser,
  updateUser,
  updateUserAvatar,
  updateUserPassword,
} from '../controllers/userController';
import { uploadFile } from '../middlewares/upload';

const router = Router();

router.route('/').get(isAuth, getCurrentUser);
router.route('/update-user').post(isAuth, updateUser);
router.route('/update-user-password').patch(isAuth, updateUserPassword);
router.route('/update-avatar').patch(isAuth, uploadFile, updateUserAvatar);

router.route('/:id').get(isAuth, getSingleUser);
router.route('/find-users').post(isAuth, findUsersByName);

export default router;
