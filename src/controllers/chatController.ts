import {Request, Response} from "express";
import Chat from "../models/Chat";
import {StatusCodes} from "http-status-codes";
import { Types } from 'mongoose';

export const getUserChats = async (req: Request, res: Response) => {
    const { userId } = req.user as any;

    const userObjectId = new Types.ObjectId(userId);

    const chats = await Chat.aggregate([
        {
            $match:
                {
                    participants: {
                        $in: [
                            userObjectId
                        ],
                    },
                },
        },
        {
            $lookup:
                {
                    from: "messages",
                    localField: "messages",
                    foreignField: "_id",
                    as: "messages",
                    pipeline: [
                        {
                            $sort: { createdAt: 1 }  // Sort messages by createdAt in descending order
                        },
                    ],
                },
        },
        {
            $lookup:
                {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participants",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                avatar: 1,
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
                            input: "$messages",
                            as: "message",
                            cond: {
                                $and: [
                                    { $eq: ["$$message.readByReceiver", false] },
                                    { $eq: ["$$message.receiverId", userObjectId] },
                                ],
                            }
                        }
                    }
                }
            }
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
                    $arrayElemAt: ["$messages", -1], // Gets the last message only
                },
            },
        },
        {
            $addFields: {
                participants: {
                    $filter: {
                        input: "$participants",
                        as: "participant",
                        cond: { $ne: ["$$participant._id", userObjectId] },
                    },
                },
            },
        },
        {
            $project: {
                messages: 0,
                createdAt: 0,
                __v: 0,
                updatedAt: 0
            },
        },
        {
            $sort:
                {
                    createdAt: -1,
                },
        },
    ]);

    res.status(StatusCodes.OK).json(chats);
};




