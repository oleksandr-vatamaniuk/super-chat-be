import { Server } from "socket.io";
import http from "http";
import express from "express";
import {markMessagesAsRead} from "../controllers/messageController";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000','http://localhost:8000'],
        methods: ['GET', 'POST']
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};


const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;

    console.log('connection',userId);

    if (userId) {
        userSocketMap[`${userId}`] = socket.id;
    }

    io.emit('onlineUsers', Object.keys(userSocketMap))

    socket.on('markAsRead', async (chatId, callback) => {
        console.log(`user chatId ${chatId}`, userId)

        try {
            const resut =  await markMessagesAsRead(userId, chatId)
            callback({
                modifiedCount: (resut as any).modifiedCount
            })
        } catch (error){
            callback(error)
        }
    })

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[`${userId}`];
        io.emit('onlineUsers', Object.keys(userSocketMap))
    });
});

export { app, io, server };