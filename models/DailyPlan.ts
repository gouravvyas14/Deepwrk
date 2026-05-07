import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  estimatedMinutes: number;
  category: string;
  order: number;
  status: "pending" | "active" | "completed" | "skipped";
  difficulty?: "easy" | "medium" | "hard";
  sessionId?: mongoose.Types.ObjectId;
}

export interface IDailyPlanDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  rawInput: string;
  blocks: IBlockDocument[];
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlockDocument>({
  title: { type: String, required: true },
  estimatedMinutes: { type: Number, required: true },
  category: { type: String, default: "other" },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "active", "completed", "skipped"],
    default: "pending",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
  },
  sessionId: { type: Schema.Types.ObjectId, ref: "FocusSession" },
});

const DailyPlanSchema = new Schema<IDailyPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    rawInput: { type: String, required: true },
    blocks: [BlockSchema],
    totalPlannedMinutes: { type: Number, default: 0 },
    totalActualMinutes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

DailyPlanSchema.index({ userId: 1, date: -1 });

const DailyPlanModel: Model<IDailyPlanDocument> =
  mongoose.models.DailyPlan ||
  mongoose.model<IDailyPlanDocument>("DailyPlan", DailyPlanSchema);

export default DailyPlanModel;
