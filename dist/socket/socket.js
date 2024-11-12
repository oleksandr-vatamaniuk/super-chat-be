"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = exports.app = exports.getReceiverSocketId = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
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