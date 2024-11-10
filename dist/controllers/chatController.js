"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChats = void 0;
const Chat_1 = __importDefault(require("../models/Chat"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const getUserChats = async (req, res) => {
    const { userId } = req.user;
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const chats = await Chat_1.default.aggregate([
        {
            $match: {
                participants: {
                    $in: [
                        userObjectId
                    ],
                },
            },
        },
        {
            $lookup: {
                from: "messages",
                localField: "messages",
                foreignField: "_id",
                as: "messages",
                pipeline: [
                    {
                        $sort: { createdAt: 1 }
                    },
                ],
            },
        },
        {
            $lookup: {
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
        {
            $addFields: {
                lastMessage: {
                    $arrayElemAt: ["$messages", -1],
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
            $sort: {
                createdAt: -1,
            },
        },
    ]);
    res.status(http_status_codes_1.StatusCodes.OK).json(chats);
};
exports.getUserChats = getUserChats;
//# sourceMappingURL=chatController.js.map