import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import GroupModel from "@/models/Group";
import UserModel from "@/models/User";

// GET  /api/groups — list groups the current user owns or is a member of
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const groups = await GroupModel.find({
      $or: [{ ownerId: user._id }, { "members.userId": user._id }],
    }).lean();

    return NextResponse.json(groups);
  } catch (error) {
    console.error("List groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST /api/groups — create a new group
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description } = await req.json() as { name?: string; description?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await GroupModel.create({
      name: name.trim(),
      description: description?.trim(),
      ownerId: user._id,
      members: [{ userId: user._id, email: user.email, name: user.name, joinedAt: new Date() }],
      pendingInvites: [],
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
