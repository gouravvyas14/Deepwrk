import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  provider: "credentials" | "google";
  timezone: string;
  dailyGoalHours: number;
  workWindowStart: number;
  workWindowEnd: number;
  role?: string;
  primaryGoal?: string;
  defaultSessionMinutes: number;
  breakMinutes: number;
  accentColor: string;
  onboardingCompleted: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, select: false },
    image: { type: String },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    timezone: { type: String, default: "Asia/Kolkata" },
    dailyGoalHours: { type: Number, default: 4, min: 1, max: 16 },
    workWindowStart: { type: Number, default: 9, min: 0, max: 23 },
    workWindowEnd: { type: Number, default: 18, min: 0, max: 23 },
    role: { type: String },
    primaryGoal: { type: String },
    defaultSessionMinutes: { type: Number, default: 45 },
    breakMinutes: { type: Number, default: 5 },
    accentColor: { type: String, default: "indigo" },
    onboardingCompleted: { type: Boolean, default: false },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true },
);

const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
