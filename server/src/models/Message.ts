import { Schema, model, Document } from "mongoose";

// What a message looks like in MongoDB
export interface IMessage extends Document {
  roomId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: { type: String, required: true, index: true }, // indexed — we query by roomId a lot
    message: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

export const Message = model<IMessage>("Message", MessageSchema);
