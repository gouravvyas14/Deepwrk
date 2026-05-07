import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import GroupModel from "@/models/Group";
import UserModel from "@/models/User";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await GroupModel.findOne({
      _id: id,
      $or: [{ ownerId: user._id }, { "members.userId": user._id }],
    }).lean();

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ ...group, currentUserId: user._id.toString() });
  } catch {
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}
