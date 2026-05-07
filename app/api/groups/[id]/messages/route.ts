import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import GroupModel from "@/models/Group";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";

export async function GET(
  req: NextRequest,
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
    });
    if (!group) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const before = req.nextUrl.searchParams.get("before");
    const query: Record<string, unknown> = { groupId: id };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(messages.reverse());
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as {
      content?: string;
      type?: "text" | "note";
      noteId?: string;
      noteTitle?: string;
      shareToken?: string;
    };

    await connectDB();

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await GroupModel.findOne({
      _id: id,
      "members.userId": user._id,
    });
    if (!group) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const message = await MessageModel.create({
      groupId: id,
      userId: user._id,
      userName: user.name || user.email,
      content: body.content ?? "",
      type: body.type ?? "text",
      noteId: body.noteId || undefined,
      noteTitle: body.noteTitle || undefined,
      shareToken: body.shareToken || undefined,
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
