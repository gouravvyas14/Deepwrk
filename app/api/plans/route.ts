import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DailyPlanModel from "@/models/DailyPlan";
import UserModel from "@/models/User";
import { generateFocusPlan } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawInput, date, append } = await req.json() as { rawInput: string; date?: string; append?: boolean };
    if (!rawInput?.trim()) {
      return NextResponse.json({ error: "Task input is required" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const planDate = date ? new Date(date) : new Date();
    planDate.setHours(0, 0, 0, 0);

    const blocks = await generateFocusPlan(
      rawInput,
      user.dailyGoalHours,
      user.role ?? "professional",
    );

    const newBlockMinutes = blocks.reduce((sum, b) => sum + b.estimatedMinutes, 0);
    const existing = await DailyPlanModel.findOne({ userId: user._id, date: planDate });

    let plan;
    if (existing && append) {
      // Append — tack new blocks onto the existing plan, preserving completed work
      const maxOrder = existing.blocks.reduce((m: number, b: { order: number }) => Math.max(m, b.order), 0);
      const newBlocks = blocks.map((b, i) => ({ ...b, status: "pending" as const, order: maxOrder + i + 1 }));
      plan = await DailyPlanModel.findByIdAndUpdate(
        existing._id,
        {
          $push: { blocks: { $each: newBlocks } },
          $inc: { totalPlannedMinutes: newBlockMinutes },
        },
        { new: true },
      );
    } else if (existing) {
      // Replace — regenerate the full plan
      plan = await DailyPlanModel.findByIdAndUpdate(
        existing._id,
        {
          rawInput,
          blocks: blocks.map((b) => ({ ...b, status: "pending" })),
          totalPlannedMinutes: newBlockMinutes,
          totalActualMinutes: 0,
        },
        { new: true },
      );
    } else {
      plan = await DailyPlanModel.create({
        userId: user._id,
        date: planDate,
        rawInput,
        blocks: blocks.map((b) => ({ ...b, status: "pending" })),
        totalPlannedMinutes: newBlockMinutes,
        totalActualMinutes: 0,
      });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Failed to generate focus plan" }, { status: 500 });
  }
}
