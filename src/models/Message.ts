import { model, Schema } from 'mongoose';
import * as mongoose from 'mongoose';

const messageSchema = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
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

const Message = model('Message', messageSchema);
export default Message;
