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
    const range = searchParams.get("range") ?? "7";

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(range));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 14);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);

    const [todaySessions, weekSessions, lastWeekSessions, userDoc] = await Promise.all([
      FocusSessionModel.find({
        userId: user._id,
        status: "completed",
        startedAt: { $gte: today, $lt: tomorrow },
      }).lean(),
      FocusSessionModel.find({
        userId: user._id,
        status: "completed",
        startedAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
      }).lean(),
      FocusSessionModel.find({
        userId: user._id,
        status: "completed",
        startedAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
      }).lean(),
      UserModel.findById(user._id).lean(),
    ]);

    const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);
    const lastWeekMinutes = lastWeekSessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);

    return NextResponse.json({
      todayHours: Math.round((todayMinutes / 60) * 10) / 10,
      sessionsToday: todaySessions.length,
      weeklyHours: Math.round((weekMinutes / 60) * 10) / 10,
      lastWeekHours: Math.round((lastWeekMinutes / 60) * 10) / 10,
      currentStreak: userDoc?.currentStreak ?? 0,
      dailyGoalHours: userDoc?.dailyGoalHours ?? 4,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
