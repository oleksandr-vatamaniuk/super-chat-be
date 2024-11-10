import {Router} from "express";
import {isAuth} from "../middlewares/isAuth";
import {getMessages, sendMessage} from "../controllers/messageController";

const router = Router()

router.route('/:id').get(isAuth, getMessages)
router.route('/send/:id').post(isAuth, sendMessage)


export default router;