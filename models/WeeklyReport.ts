import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklyReportDocument extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  totalFocusHours: number;
  totalSessions: number;
  avgMoodScore: number;
  bestDay?: string;
  worstDay?: string;
  peakHour?: number;
  reportText: string;
  score: number;
  actionItems: string[];
  generatedAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    totalFocusHours: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    avgMoodScore: { type: Number, default: 0 },
    bestDay: { type: String },
    worstDay: { type: String },
    peakHour: { type: Number },
    reportText: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, default: 50 },
    actionItems: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

WeeklyReportSchema.index({ userId: 1, weekStart: -1 });

const WeeklyReportModel: Model<IWeeklyReportDocument> =
  mongoose.models.WeeklyReport ||
  mongoose.model<IWeeklyReportDocument>("WeeklyReport", WeeklyReportSchema);

export default WeeklyReportModel;
