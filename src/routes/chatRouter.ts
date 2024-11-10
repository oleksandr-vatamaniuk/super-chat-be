import {Router} from "express";
import {isAuth} from "../middlewares/isAuth";
import {getUserChats} from "../controllers/chatController";

const router = Router()

router.route('/').get(isAuth, getUserChats)


export default router;