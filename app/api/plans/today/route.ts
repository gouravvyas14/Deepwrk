import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DailyPlanModel from "@/models/DailyPlan";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const plan = await DailyPlanModel.findOne({
      userId: user._id,
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    return NextResponse.json(plan ?? null);
  } catch (error) {
    console.error("Today plan error:", error);
    return NextResponse.json({ error: "Failed to fetch today's plan" }, { status: 500 });
  }
}
