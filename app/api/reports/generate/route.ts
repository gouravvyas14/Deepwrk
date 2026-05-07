import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import WeeklyReportModel from "@/models/WeeklyReport";
import UserModel from "@/models/User";
import { generateWeeklyReport } from "@/lib/claude";
import { getWeekStart, getWeekEnd, getDayName } from "@/lib/utils";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());

    const sessions = await FocusSessionModel.find({
      userId: user._id,
      status: "completed",
      startedAt: { $gte: weekStart, $lte: weekEnd },
    }).lean();

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    const prevSessions = await FocusSessionModel.find({
      userId: user._id,
      status: "completed",
      startedAt: { $gte: prevWeekStart, $lte: prevWeekEnd },
    }).lean();

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);
    const prevTotalMinutes = prevSessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);

    const moodScores = sessions.filter((s) => s.moodAfter).map((s) => s.moodAfter!);
    const avgMood = moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : 0;

    const byDay: Record<number, number> = {};
    const categoryCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};

    for (const s of sessions) {
      const d = s.dayOfWeek ?? 0;
      byDay[d] = (byDay[d] ?? 0) + (s.actualDuration ?? 0);
      const cat = s.taskCategory ?? "other";
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
      const h = s.hourOfDay ?? 0;
      hourCount[h] = (hourCount[h] ?? 0) + 1;
    }

    const sortedDays = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays[0] ? getDayName(parseInt(sortedDays[0][0])) : "N/A";
    const worstDay = sortedDays[sortedDays.length - 1]
      ? getDayName(parseInt(sortedDays[sortedDays.length - 1]![0]))
      : "N/A";

    const peakHour = Object.entries(hourCount).reduce<[number, number]>(
      (best, [h, count]) => (count > best[1] ? [parseInt(h), count] : best),
      [9, 0],
    )[0];

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const mins = byDay[i] ?? 0;
      return {
        day: getDayName(i),
        hours: Math.round((mins / 60) * 10) / 10,
        sessions: sessions.filter((s) => s.dayOfWeek === i).length,
      };
    });

    const { reportText, score, actionItems } = await generateWeeklyReport({
      userName: user.name,
      role: user.role ?? "professional",
      weekStart: weekStart.toDateString(),
      weekEnd: weekEnd.toDateString(),
      totalHours: totalMinutes / 60,
      totalSessions: sessions.length,
      avgMood,
      bestDay,
      worstDay,
      peakHour,
      topCategories,
      dailyBreakdown,
      previousWeekHours: prevTotalMinutes / 60,
    });

    const report = await WeeklyReportModel.findOneAndUpdate(
      { userId: user._id, weekStart },
      {
        weekStart,
        weekEnd,
        totalFocusHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalSessions: sessions.length,
        avgMoodScore: Math.round(avgMood * 10) / 10,
        bestDay,
        worstDay,
        peakHour,
        reportText,
        score,
        actionItems,
        generatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
