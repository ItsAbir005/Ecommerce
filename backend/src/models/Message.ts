import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  shipmentId: mongoose.Types.ObjectId;
  senderMode: "customer" | "driver";
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true },
    senderMode: { type: String, enum: ["customer", "driver"], required: true },
    senderId: { type: Schema.Types.ObjectId, required: true }, // reference to User or Driver depending on senderMode
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
