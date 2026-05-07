import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DailyPlanModel from "@/models/DailyPlan";
import UserModel from "@/models/User";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, blockId } = await params;
    const body = await req.json() as { status?: string; sessionId?: string; order?: number; difficulty?: string };

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateFields: Record<string, unknown> = {};
    if (body.status) updateFields["blocks.$.status"] = body.status;
    if (body.sessionId) updateFields["blocks.$.sessionId"] = body.sessionId;
    if (body.order !== undefined) updateFields["blocks.$.order"] = body.order;
    if (body.difficulty) updateFields["blocks.$.difficulty"] = body.difficulty;

    const plan = await DailyPlanModel.findOneAndUpdate(
      { _id: id, userId: user._id, "blocks._id": blockId },
      { $set: updateFields },
      { new: true },
    );

    if (!plan) return NextResponse.json({ error: "Plan or block not found" }, { status: 404 });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Update block error:", error);
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 });
  }
}
