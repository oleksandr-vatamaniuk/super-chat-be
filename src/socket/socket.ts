import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { markMessagesAsRead } from '../controllers/messageController';
import { isAccessTokenValid, JWTUserPayload } from '../utils/jwt';
import { UnauthenticatedError } from '../errors';

const app = express();

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: [ process.env.FRONTEND as string],
    methods: ['GET', 'POST'],
  },
});

io.engine.use((req, _, next) => {
  const isHandshake = req._query.sid === undefined;
  if (!isHandshake) {
    return next();
  }

  const authorization = req.headers['authorization'];

  if (!authorization) {
    return next(new UnauthenticatedError('Not Authenticated'));
  }

  try {
    const token = authorization!.split(' ')[1];
    const payload = isAccessTokenValid(token);

    req.user = payload as JWTUserPayload;
    console.info('WebSocket Connected', req.user.userId);
  } catch (error) {
    console.error(error);
    return next(new UnauthenticatedError('Not Authenticated'));
  }

  return next();
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  const userPayload = (socket.request as any).user as JWTUserPayload;
  const { userId } = userPayload;
  if (!userId) {
    console.error('User ID not found in socket request');
    return;
  } else {
    userSocketMap[`${userId}`] = socket.id;
  }

  io.emit('onlineUsers', Object.keys(userSocketMap));

  socket.on('markAsRead', async (chatId, callback) => {
    try {
      const resut = await markMessagesAsRead(userId, chatId);
      callback({
        modifiedCount: (resut as any).modifiedCount,
      });
    } catch (error) {
      callback(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    delete userSocketMap[`${userId}`];
    io.emit('onlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server };
