import { Router } from 'express';
import { isAuth } from '../middlewares/isAuth';
import { deleteChat, getUserChats } from '../controllers/chatController';

const router = Router();

router.route('/').get(isAuth, getUserChats);
router.route('/:id').delete(isAuth, deleteChat);

export default router;
