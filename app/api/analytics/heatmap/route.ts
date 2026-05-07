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
    const days = parseInt(searchParams.get("days") ?? "90");

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
      .select("dayOfWeek hourOfDay actualDuration")
      .lean();

    const heatmap: Record<string, number> = {};

    for (const s of sessions) {
      const key = `${s.dayOfWeek}-${s.hourOfDay}`;
      heatmap[key] = (heatmap[key] ?? 0) + (s.actualDuration ?? 0);
    }

    const result = Object.entries(heatmap).map(([key, minutes]) => {
      const [day, hour] = key.split("-").map(Number);
      return { day, hour, value: Math.round((minutes / 60) * 10) / 10 };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Heatmap error:", error);
    return NextResponse.json({ error: "Failed to fetch heatmap" }, { status: 500 });
  }
}
