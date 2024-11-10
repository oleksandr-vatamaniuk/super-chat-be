"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuth_1 = require("../middlewares/isAuth");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
router.route('/').get(isAuth_1.isAuth, chatController_1.getUserChats);
exports.default = router;
//# sourceMappingURL=chatRouter.js.map