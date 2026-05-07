import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import DailyPlanModel from "@/models/DailyPlan";
import UserModel from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      taskTitle: string;
      taskCategory?: string;
      plannedDuration?: number;
      blockId?: string;
      moodBefore?: number;
      difficulty?: "easy" | "medium" | "hard";
    };

    if (!body.taskTitle?.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const focusSession = await FocusSessionModel.create({
      userId: user._id,
      taskTitle: body.taskTitle,
      taskCategory: body.taskCategory ?? "other",
      plannedDuration: body.plannedDuration ?? user.defaultSessionMinutes,
      moodBefore: body.moodBefore,
      status: "paused",
      startedAt: new Date(),
      blockId: body.blockId,
    });

    // Persist difficulty override on the plan block if provided
    if (body.blockId && body.difficulty) {
      await DailyPlanModel.findOneAndUpdate(
        { userId: user._id, "blocks._id": body.blockId },
        { $set: { "blocks.$.difficulty": body.difficulty } },
      );
    }

    return NextResponse.json(focusSession, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const mood = searchParams.get("mood");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const query: Record<string, unknown> = { userId: user._id };

    if (mood) query.moodAfter = parseInt(mood);
    if (search) query.taskTitle = { $regex: search, $options: "i" };
    if (status) query.status = status;
    if (from || to) {
      query.startedAt = {};
      if (from) (query.startedAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.startedAt as Record<string, unknown>).$lte = new Date(to);
    }

    const [sessions, total] = await Promise.all([
      FocusSessionModel.find(query)
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FocusSessionModel.countDocuments(query),
    ]);

    return NextResponse.json({ sessions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
