import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";
import { generateAnalyticsInsights } from "@/lib/claude";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30");

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await FocusSessionModel.find({
      userId: user._id,
      status: "completed",
      startedAt: { $gte: since },
    }).lean();

    if (sessions.length < 3) {
      return NextResponse.json({
        insights: [
          "Complete at least 3 focus sessions to unlock AI insights.",
          "Your data will be analyzed to find your peak performance patterns.",
          "Start tracking your focus today to get personalized recommendations.",
        ],
      });
    }

    let totalMinutes = 0;
    let totalMood = 0;
    let moodCount = 0;
    const hourBuckets = { morning: 0, afternoon: 0, evening: 0 };
    const hourMinutes = { morning: 0, afternoon: 0, evening: 0 };
    const hourCount: Record<number, number> = {};
    const categoryCount: Record<string, number> = {};

    for (const s of sessions) {
      totalMinutes += s.actualDuration ?? 0;
      if (s.moodAfter) { totalMood += s.moodAfter; moodCount++; }

      const h = s.hourOfDay ?? 0;
      hourCount[h] = (hourCount[h] ?? 0) + 1;

      const dur = s.actualDuration ?? 0;
      if (h >= 5 && h < 12) { hourBuckets.morning++; hourMinutes.morning += dur; }
      else if (h >= 12 && h < 17) { hourBuckets.afternoon++; hourMinutes.afternoon += dur; }
      else { hourBuckets.evening++; hourMinutes.evening += dur; }

      const cat = s.taskCategory ?? "other";
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
    }

    const peakHour = Object.entries(hourCount).reduce<[number, number]>(
      (best, [h, count]) => (count > best[1] ? [parseInt(h), count] : best),
      [9, 0],
    )[0];

    const topCategory = Object.entries(categoryCount).reduce<[string, number]>(
      (best, [cat, count]) => (count > best[1] ? [cat, count] : best),
      ["other", 0],
    )[0];

    const insights = await generateAnalyticsInsights({
      totalSessions: sessions.length,
      avgDailyHours: totalMinutes / days / 60,
      avgMood: moodCount > 0 ? totalMood / moodCount : 0,
      peakHour,
      morningAvg: hourBuckets.morning > 0 ? hourMinutes.morning / hourBuckets.morning : 0,
      afternoonAvg: hourBuckets.afternoon > 0 ? hourMinutes.afternoon / hourBuckets.afternoon : 0,
      eveningAvg: hourBuckets.evening > 0 ? hourMinutes.evening / hourBuckets.evening : 0,
      streakDays: user.currentStreak,
      topCategory,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
