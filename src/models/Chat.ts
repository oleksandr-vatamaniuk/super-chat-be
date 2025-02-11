import { Schema, model, Types, Model } from 'mongoose';

export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

const Chat: Model<IChat> = model<IChat, any>('Chat', ChatSchema);
export default Chat;
