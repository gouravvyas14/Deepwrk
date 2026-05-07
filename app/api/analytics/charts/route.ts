import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";

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
    })
      .select("startedAt actualDuration moodAfter taskCategory")
      .lean();

    const byDate: Record<string, { minutes: number; sessions: number; moods: number[] }> = {};
    const categoryCount: Record<string, number> = {};
    const durationBuckets: Record<string, number> = {
      "0-15": 0,
      "15-30": 0,
      "30-45": 0,
      "45-60": 0,
      "60-90": 0,
      "90+": 0,
    };

    for (const s of sessions) {
      const date = s.startedAt.toISOString().split("T")[0]!;
      if (!byDate[date]) byDate[date] = { minutes: 0, sessions: 0, moods: [] };
      byDate[date].minutes += s.actualDuration ?? 0;
      byDate[date].sessions += 1;
      if (s.moodAfter) byDate[date].moods.push(s.moodAfter);

      const cat = s.taskCategory ?? "other";
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;

      const dur = s.actualDuration ?? 0;
      if (dur <= 15) durationBuckets["0-15"]!++;
      else if (dur <= 30) durationBuckets["15-30"]!++;
      else if (dur <= 45) durationBuckets["30-45"]!++;
      else if (dur <= 60) durationBuckets["45-60"]!++;
      else if (dur <= 90) durationBuckets["60-90"]!++;
      else durationBuckets["90+"]!++;
    }

    const dailyData = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const date = d.toISOString().split("T")[0]!;
      const data = byDate[date] ?? { minutes: 0, sessions: 0, moods: [] };
      const avgMood = data.moods.length > 0
        ? Math.round((data.moods.reduce((a, b) => a + b, 0) / data.moods.length) * 10) / 10
        : 0;
      return {
        date,
        hours: Math.round((data.minutes / 60) * 10) / 10,
        sessions: data.sessions,
        mood: avgMood,
      };
    });

    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    const distributionData = Object.entries(durationBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    return NextResponse.json({ dailyData, categoryData, distributionData });
  } catch (error) {
    console.error("Charts error:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
