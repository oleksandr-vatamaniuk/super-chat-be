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
exports.server = exports.io = exports.app = exports.getReceiverSocketId = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const process = __importStar(require("process"));
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [process.env.FRONTEND],
        methods: ['GET', 'POST']
    },
});
exports.io = io;
const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};
exports.getReceiverSocketId = getReceiverSocketId;
const userSocketMap = {};
io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    const userId = socket.handshake.query.userId;
    console.log('connection', userId);
    if (userId) {
        userSocketMap[`${userId}`] = socket.id;
    }
    io.emit('onlineUsers', Object.keys(userSocketMap));
    socket.on('markAsRead', async (chatId, callback) => {
        console.log(`user chatId ${chatId}`, userId);
        try {
            const resut = await (0, messageController_1.markMessagesAsRead)(userId, chatId);
            callback({
                modifiedCount: resut.modifiedCount
            });
        }
        catch (error) {
            callback(error);
        }
    });
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[`${userId}`];
        io.emit('onlineUsers', Object.keys(userSocketMap));
    });
});
//# sourceMappingURL=socket.js.map