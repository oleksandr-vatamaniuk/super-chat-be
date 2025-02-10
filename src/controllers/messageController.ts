import Message from '../models/Message';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Chat, { IChat } from '../models/Chat';
import { getReceiverSocketId, io } from '../socket/socket';

export const sendMessage = async (req: Request, res: Response) => {
  const { message } = req.body as any;
  const { id: receiverId } = req.params;
  const { userId: senderId } = req.user as any;

  // ts-ignore
  let conversation: IChat | null = await Chat.findOne({
    participants: { $all: [senderId, receiverId] },
  }).exec();

  if (!conversation) {
    conversation = (await Chat.create({
      participants: [senderId, receiverId],
    })) as IChat;
  }

  const newMessage = new Message({
    senderId,
    receiverId,
    message,
  });

  if (newMessage) {
    conversation.messages.push(newMessage._id);
  }

  await Promise.all([(conversation as any).save(), newMessage.save()]);

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('newMessage', newMessage);
  }

  res.status(StatusCodes.CREATED).json(newMessage);
};

export const getMessages = async (req: Request, res: Response) => {
  const { id: userToChatId } = req.params;
  const { userId: senderId } = req.user as any;

  const conversation = (await Chat.findOne({
    participants: { $all: [senderId, userToChatId] },
  }).populate('messages')) as IChat;

  if (!conversation) return res.status(200).json([]);

  const messages = conversation.messages;

  res.status(StatusCodes.OK).json(messages);
};

export const markMessagesAsRead = async (readUser, updateUser) => {
  const updateResult = await Message.updateMany(
    {
      receiverId: readUser,
      senderId: updateUser,
      readByReceiver: false,
    },
    { $set: { readByReceiver: true } }
  );

  return updateResult;
};

export const findMessages = async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { searchText } = req.body as any;

  const messages = await Message.find({
    message: { $regex: searchText, $options: 'i' }, // Case-insensitive text match
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).sort({ createdAt: -1 }); // Sort by the latest messages first

  return res.status(StatusCodes.OK).json(messages);
};
