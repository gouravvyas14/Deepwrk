import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";
import DailyPlanModel from "@/models/DailyPlan";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const focusSession = await FocusSessionModel.findOne({ _id: id, userId: user._id }).lean();
    if (!focusSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json(focusSession);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as {
      status?: "completed" | "abandoned" | "paused";
      moodAfter?: number;
      notes?: string;
      actualDuration?: number;
    };

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.moodAfter) updateData.moodAfter = body.moodAfter;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.actualDuration !== undefined) updateData.actualDuration = body.actualDuration;

    if (body.status === "completed" || body.status === "abandoned") {
      updateData.completedAt = new Date();
      const focusSession = await FocusSessionModel.findById(id);
      if (focusSession && !body.actualDuration) {
        const durationMs = Date.now() - focusSession.startedAt.getTime();
        updateData.actualDuration = Math.round(durationMs / 60000);
      }
    }

    const focusSession = await FocusSessionModel.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: updateData },
      { new: true },
    );

    if (!focusSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (body.status === "completed" && focusSession.blockId) {
      await DailyPlanModel.findOneAndUpdate(
        { userId: user._id, "blocks._id": focusSession.blockId },
        { $set: { "blocks.$.status": "completed" } },
      );
    }

    return NextResponse.json(focusSession);
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
