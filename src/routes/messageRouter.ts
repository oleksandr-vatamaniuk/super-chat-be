import {Router} from "express";
import {isAuth} from "../middlewares/isAuth";
import {findMessages, getMessages, sendMessage} from "../controllers/messageController";

const router = Router()

router.route('/:id').get(isAuth, getMessages)
router.route('/send/:id').post(isAuth, sendMessage)
router.route('/find-messages').post(isAuth, findMessages)


export default router;