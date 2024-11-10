"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuth_1 = require("../middlewares/isAuth");
const userController_1 = require("../controllers/userController");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
router.route('/').get(isAuth_1.isAuth, userController_1.getCurrentUser);
router.route('/update-user').post(isAuth_1.isAuth, userController_1.updateUser);
router.route('/update-user-password').patch(isAuth_1.isAuth, userController_1.updateUserPassword);
router.route('/update-avatar').patch(isAuth_1.isAuth, upload_1.uploadFile, userController_1.updateUserAvatar);
router.route('/:id').get(isAuth_1.isAuth, userController_1.getSingleUser);
router.route('/find-users').post(isAuth_1.isAuth, userController_1.findUsersByName);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map