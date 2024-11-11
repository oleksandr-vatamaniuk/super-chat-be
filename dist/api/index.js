"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cloudinary_1 = require("cloudinary");
const process = __importStar(require("process"));
const authRouter_1 = __importDefault(require("../routes/authRouter"));
const userRoutes_1 = __importDefault(require("../routes/userRoutes"));
const chatRouter_1 = __importDefault(require("../routes/chatRouter"));
const messageRouter_1 = __importDefault(require("../routes/messageRouter"));
const http_status_codes_1 = require("http-status-codes");
const connectDB_1 = require("../db/connectDB");
const error_handler_1 = __importDefault(require("../middlewares/error-handler"));
const not_found_1 = __importDefault(require("../middlewares/not-found"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authController_1 = require("../controllers/authController");
const morgan_1 = __importDefault(require("morgan"));
const socket_1 = require("../socket/socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 8000;
socket_1.app.use((0, morgan_1.default)('tiny'));
socket_1.app.use((0, cors_1.default)({ credentials: true, origin: true }));
socket_1.app.set('trust proxy', true);
socket_1.app.use(express_1.default.json());
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});
socket_1.app.use((0, cookie_parser_1.default)(process.env.REFRESH_TOKEN_SECRET));
socket_1.app.get('/', (_, res) => {
    res.send('<h1>SUPER CHAT APP - BE</h1>');
});
socket_1.app.get('/api/v1', (_, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: 'OK' });
});
socket_1.app.get('/api/v1/refresh_token', authController_1.refreshTokenHandler);
socket_1.app.use('/api/v1/auth', authRouter_1.default);
socket_1.app.use('/api/v1/user', userRoutes_1.default);
socket_1.app.use('/api/v1/chat', chatRouter_1.default);
socket_1.app.use('/api/v1/message', messageRouter_1.default);
socket_1.app.use(not_found_1.default);
socket_1.app.use(error_handler_1.default);
(async () => {
    try {
        await (0, connectDB_1.connectDB)(process.env.MONGO_URI);
        socket_1.server.listen(PORT, async () => {
            console.log(`Server is listening on port ${PORT}...`);
        });
    }
    catch (error) {
        console.log(error);
    }
})();
exports.default = socket_1.app;
//# sourceMappingURL=index.js.map