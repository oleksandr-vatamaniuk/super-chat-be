"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
router.route('/login').post(authController_1.login);
router.route('/logOut').get(isAuth_1.isAuth, authController_1.logout);
router.route('/register').post(authController_1.register);
router.route('/verify_email').post(authController_1.verifyEmail);
router.route('/forgot_password').post(authController_1.forgotPassword);
router.route('/reset_password').post(authController_1.resetPassword);
router.route('/google').post(authController_1.googleAuthHandler);
exports.default = router;
//# sourceMappingURL=authRouter.js.map