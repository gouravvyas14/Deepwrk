import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFocusSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  taskTitle: string;
  taskCategory?: string;
  plannedDuration?: number;
  actualDuration?: number;
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  shareToken?: string;
  status: "completed" | "abandoned" | "paused";
  startedAt: Date;
  completedAt?: Date;
  hourOfDay?: number;
  dayOfWeek?: number;
  blockId?: mongoose.Types.ObjectId;
}

const FocusSessionSchema = new Schema<IFocusSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskTitle: { type: String, required: true },
    taskCategory: { type: String, default: "other" },
    plannedDuration: { type: Number },
    actualDuration: { type: Number },
    moodBefore: { type: Number, min: 1, max: 5 },
    moodAfter: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    shareToken: { type: String, sparse: true, index: true },
    status: {
      type: String,
      enum: ["completed", "abandoned", "paused"],
      required: true,
    },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    hourOfDay: { type: Number, min: 0, max: 23 },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    blockId: { type: Schema.Types.ObjectId, ref: "DailyPlan" },
  },
  { timestamps: true },
);

FocusSessionSchema.pre("save", function () {
  if (this.startedAt) {
    this.hourOfDay = this.startedAt.getHours();
    this.dayOfWeek = this.startedAt.getDay();
  }
});

FocusSessionSchema.index({ userId: 1, startedAt: -1 });
FocusSessionSchema.index({ userId: 1, status: 1 });

const FocusSessionModel: Model<IFocusSessionDocument> =
  mongoose.models.FocusSession ||
  mongoose.model<IFocusSessionDocument>("FocusSession", FocusSessionSchema);

export default FocusSessionModel;
