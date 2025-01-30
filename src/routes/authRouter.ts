import { Router } from 'express';
import {
  login,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleAuthHandler,
  logout,
  resendEmailVerification,
} from '../controllers/authController';
import { isAuth } from '../middlewares/isAuth';

const router = Router();

router.route('/login').post(login);
router.route('/logOut').post(isAuth, logout);
router.route('/register').post(register);
router.route('/verify_email').post(verifyEmail);
router.route('/resend_verify_email').post(resendEmailVerification);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password').post(resetPassword);
router.route('/google').get(googleAuthHandler);

export default router;
