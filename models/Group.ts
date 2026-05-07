import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  joinedAt: Date;
}

export interface IGroupInvite {
  email: string;
  invitedAt: Date;
}

export interface IGroupDocument extends Document {
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IGroupMember[];
  pendingInvites: IGroupInvite[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        email: { type: String, required: true },
        name: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    pendingInvites: [
      {
        email: { type: String, required: true },
        invitedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

GroupSchema.index({ ownerId: 1 });
GroupSchema.index({ "members.userId": 1 });
GroupSchema.index({ "pendingInvites.email": 1 });

const GroupModel: Model<IGroupDocument> =
  mongoose.models.Group || mongoose.model<IGroupDocument>("Group", GroupSchema);

export default GroupModel;
