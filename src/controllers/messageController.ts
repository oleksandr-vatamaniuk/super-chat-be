import Message from "../models/Message";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import Chat from "../models/Chat";
import {getReceiverSocketId, io} from "../socket/socket";

export const sendMessage = async (req: Request, res: Response) => {
    const {
        message
    } = req.body as any;
    const { id: receiverId } = req.params;
    const {userId: senderId} = req.user as any;
    let isNewChat = false;

    let conversation = await Chat.findOne({
        participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
        conversation = await Chat.create({
            participants: [senderId, receiverId],
        });
        isNewChat = true;
    }

    const newMessage = new Message({
        senderId,
        receiverId,
        message,
    });

    if (newMessage) {
        conversation.messages.push(newMessage._id);
    }

    // this will run in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        if (isNewChat){
            io.to(receiverSocketId).emit("newChat", conversation);
        } else {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
    }

    res.status(StatusCodes.CREATED).json(newMessage);
}

export const getMessages = async (req: Request, res: Response) => {
    const { id: userToChatId } = req.params;
    const {userId: senderId} = req.user as any;

    const conversation = await Chat.findOne({
        participants: { $all: [senderId, userToChatId] },
    }).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(StatusCodes.OK).json(messages);
}

export const markMessagesAsRead = async (readUser, updateUser) => {
    const updateResult = await Message.updateMany(
        {
            receiverId: readUser,
            senderId: updateUser,
            readByReceiver: false
        },
        { $set: { readByReceiver: true } }
    );

    return updateResult;
};