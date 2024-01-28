import {Router} from "express";
import {
    googleAuthHandler,
    getUrl,
    login,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword
} from "../controllers/authController";

const router = Router();

router.route('/login').post(login)
router.route('/register').post(register)
router.route('/verify_email').post(verifyEmail)
router.route('/forgot_password').post(forgotPassword)
router.route('/reset_password').post(resetPassword)

router.post('/url', getUrl)
router.route('/google').get(googleAuthHandler)

export default router;