"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuth_1 = require("../middlewares/isAuth");
const messageController_1 = require("../controllers/messageController");
const router = (0, express_1.Router)();
router.route('/:id').get(isAuth_1.isAuth, messageController_1.getMessages);
router.route('/send/:id').post(isAuth_1.isAuth, messageController_1.sendMessage);
exports.default = router;
//# sourceMappingURL=messageRouter.js.map