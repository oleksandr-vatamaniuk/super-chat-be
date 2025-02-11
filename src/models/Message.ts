import { model, Schema, Document, Types, Model } from 'mongoose';

// Define the Message interface
export interface IMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  readByReceiver: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    readByReceiver: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

// Create and export the Message model
const MessageModel: Model<IMessage> = model<IMessage, any>(
  'Message',
  messageSchema
);
export default MessageModel;
