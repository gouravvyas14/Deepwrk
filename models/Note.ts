import mongoose, { Schema, Document, Model } from "mongoose";

export interface INoteDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INoteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    shareToken: { type: String, sparse: true, index: true },
  },
  { timestamps: true },
);

NoteSchema.index({ userId: 1, updatedAt: -1 });

const NoteModel: Model<INoteDocument> =
  mongoose.models.Note || mongoose.model<INoteDocument>("Note", NoteSchema);

export default NoteModel;
