import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";
import { getDayName } from "@/lib/utils";

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

    if (sessions.length === 0) {
      return NextResponse.json({
        avgDailyHours: 0,
        bestDay: { day: "N/A", hours: 0 },
        avgMoodScore: 0,
        totalSessions: 0,
      });
    }

    const byDay: Record<number, number> = {};
    let totalMinutes = 0;
    let totalMood = 0;
    let moodCount = 0;

    for (const s of sessions) {
      const d = s.dayOfWeek ?? 0;
      byDay[d] = (byDay[d] ?? 0) + (s.actualDuration ?? 0);
      totalMinutes += s.actualDuration ?? 0;
      if (s.moodAfter) {
        totalMood += s.moodAfter;
        moodCount++;
      }
    }

    const bestDayIndex = Object.entries(byDay).reduce<[number, number]>(
      (best, [day, mins]) => (mins > best[1] ? [parseInt(day), mins] : best),
      [0, 0],
    );

    return NextResponse.json({
      avgDailyHours: Math.round((totalMinutes / days / 60) * 10) / 10,
      bestDay: {
        day: getDayName(bestDayIndex[0]),
        hours: Math.round((bestDayIndex[1] / 60) * 10) / 10,
      },
      avgMoodScore: moodCount > 0 ? Math.round((totalMood / moodCount) * 10) / 10 : 0,
      totalSessions: sessions.length,
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
