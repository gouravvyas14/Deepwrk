import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import WeeklyReportModel from "@/models/WeeklyReport";
import UserModel from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const report = await WeeklyReportModel.findOne({ userId: user._id })
      .sort({ weekStart: -1 })
      .lean();

    return NextResponse.json(report ?? null);
  } catch (error) {
    console.error("Latest report error:", error);
    return NextResponse.json({ error: "Failed to fetch latest report" }, { status: 500 });
  }
}
