import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageDocument extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  content: string;
  type: "text" | "note";
  noteId?: mongoose.Types.ObjectId;
  noteTitle?: string;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    content: { type: String, default: "" },
    type: { type: String, enum: ["text", "note"], default: "text" },
    noteId: { type: Schema.Types.ObjectId, ref: "Note" },
    noteTitle: { type: String },
    shareToken: { type: String },
  },
  { timestamps: true },
);

MessageSchema.index({ groupId: 1, createdAt: -1 });

const MessageModel: Model<IMessageDocument> =
  mongoose.models.Message || mongoose.model<IMessageDocument>("Message", MessageSchema);

export default MessageModel;
