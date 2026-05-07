export interface IUser {
  _id: string;
  name: string;
  email: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IFocusBlock {
  _id: string;
  title: string;
  estimatedMinutes: number;
  category: string;
  order: number;
  status: "pending" | "active" | "completed" | "skipped";
  difficulty?: "easy" | "medium" | "hard";
  sessionId?: string;
}

export interface IDailyPlan {
  _id: string;
  userId: string;
  date: Date;
  rawInput: string;
  blocks: IFocusBlock[];
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  createdAt: Date;
}

export interface IFocusSession {
  _id: string;
  userId: string;
  taskTitle: string;
  taskCategory?: string;
  plannedDuration?: number;
  actualDuration?: number;
  moodBefore?: number;
  moodAfter?: number;
  notes?: string;
  status: "completed" | "abandoned" | "paused";
  startedAt: Date;
  completedAt?: Date;
  hourOfDay?: number;
  dayOfWeek?: number;
  blockId?: string;
}

export interface IWeeklyReport {
  _id: string;
  userId: string;
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

export interface DashboardStats {
  todayHours: number;
  dailyGoalHours: number;
  currentStreak: number;
  sessionsToday: number;
  weeklyHours: number;
  lastWeekHours: number;
}

export interface AnalyticsOverview {
  avgDailyHours: number;
  bestDay: { day: string; hours: number };
  avgMoodScore: number;
  totalSessions: number;
}

export interface HeatmapData {
  day: number;
  hour: number;
  value: number;
}

export interface ChartDataPoint {
  date: string;
  hours: number;
  sessions: number;
  mood?: number;
}
