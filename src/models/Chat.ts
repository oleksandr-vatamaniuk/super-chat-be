import { Schema, model} from 'mongoose';
import * as mongoose from "mongoose";

const ChatSchema = new Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: [],
        }
    ],
}, {timestamps: true})

const Chat = model("Chat", ChatSchema);
export default Chat;