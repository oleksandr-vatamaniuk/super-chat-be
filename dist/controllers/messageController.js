"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesAsRead = exports.getMessages = exports.sendMessage = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const http_status_codes_1 = require("http-status-codes");
const Chat_1 = __importDefault(require("../models/Chat"));
const socket_1 = require("../socket/socket");
const sendMessage = async (req, res) => {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const { userId: senderId } = req.user;
    let isNewChat = false;
    let conversation = await Chat_1.default.findOne({
        participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
        conversation = await Chat_1.default.create({
            participants: [senderId, receiverId],
        });
        isNewChat = true;
    }
    const newMessage = new Message_1.default({
        senderId,
        receiverId,
        message,
    });
    if (newMessage) {
        conversation.messages.push(newMessage._id);
    }
    await Promise.all([conversation.save(), newMessage.save()]);
    const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
    if (receiverSocketId) {
        if (isNewChat) {
            socket_1.io.to(receiverSocketId).emit("newChat", conversation);
        }
        else {
            socket_1.io.to(receiverSocketId).emit("newMessage", newMessage);
        }
    }
    res.status(http_status_codes_1.StatusCodes.CREATED).json(newMessage);
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    const { id: userToChatId } = req.params;
    const { userId: senderId } = req.user;
    const conversation = await Chat_1.default.findOne({
        participants: { $all: [senderId, userToChatId] },
    }).populate("messages");
    if (!conversation)
        return res.status(200).json([]);
    const messages = conversation.messages;
    res.status(http_status_codes_1.StatusCodes.OK).json(messages);
};
exports.getMessages = getMessages;
const markMessagesAsRead = async (readUser, updateUser) => {
    const updateResult = await Message_1.default.updateMany({
        receiverId: readUser,
        senderId: updateUser,
        readByReceiver: false
    }, { $set: { readByReceiver: true } });
    return updateResult;
};
exports.markMessagesAsRead = markMessagesAsRead;
//# sourceMappingURL=messageController.js.map