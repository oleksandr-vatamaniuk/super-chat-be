import { Request, Response } from 'express';
import Chat from '../models/Chat';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { BadRequestError } from '../errors';
import Message from '../models/Message';
import { getReceiverSocketId, io } from '../socket/socket';
import User from '../models/User';

export const getUserChats = async (req: Request, res: Response) => {
  const { userId } = req.user as any;

  const userObjectId = new Types.ObjectId(userId);

  const chats = await Chat.aggregate([
    {
      $match: {
        participants: {
          $in: [userObjectId],
        },
      },
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'messages',
        foreignField: '_id',
        as: 'messages',
        pipeline: [
          {
            $sort: { createdAt: 1 }, // Sort messages by createdAt in descending order
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participants',
        pipeline: [
          {
            $project: {
              name: 1,
              avatar: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        unreadMessagesCount: {
          $size: {
            $filter: {
              input: '$messages',
              as: 'message',
              cond: {
                $and: [
                  { $eq: ['$$message.readByReceiver', false] },
                  { $eq: ['$$message.receiverId', userObjectId] },
                ],
              },
            },
          },
        },
      },
    },
    // {
    //     $addFields: {
    //         lastMessage: {
    //             $slice: ["$messages", -1], // Limits to the most recent message only
    //         },
    //     },
    // },
    {
      $addFields: {
        lastMessage: {
          $arrayElemAt: ['$messages', -1], // Gets the last message only
        },
      },
    },
    // {
    //     $addFields: {
    //         participants: {
    //             $filter: {
    //                 input: "$participants",
    //                 as: "participant",
    //                 cond: { $ne: ["$$participant._id", userObjectId] },
    //             },
    //         },
    //     },
    // },
    {
      $addFields: {
        participant: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$participants',
                as: 'participant',
                cond: { $ne: ['$$participant._id', userObjectId] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        participants: 0,
        messages: 0,
        createdAt: 0,
        __v: 0,
        updatedAt: 0,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  res.status(StatusCodes.OK).json(chats);
};

export const deleteChat = async (req: Request, res: Response) => {
  const { userId } = req.user as any;

  const { id: participantId } = req.params;

  const chat = await Chat.findOne({
    participants: {
      $all: [new Types.ObjectId(participantId), new Types.ObjectId(userId)],
    },
  });

  if (!chat) throw new BadRequestError('No such chat');

  await Message.deleteMany({ _id: { $in: chat.messages } });

  await Chat.deleteOne({ _id: chat._id });

  const receiverSocketId = getReceiverSocketId(participantId);

  if (receiverSocketId) {
    const participant = await User.findOne({ _id: userId });

    io.to(receiverSocketId).emit('deleteChat', {
      chatId: chat._id,
      participant,
    });
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Successfully deleted chat', id: chat._id });
};
