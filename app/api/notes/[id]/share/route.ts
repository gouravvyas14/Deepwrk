import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import NoteModel from "@/models/Note";
import UserModel from "@/models/User";
import { randomBytes } from "crypto";

export async function POST(
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

    const note = await NoteModel.findOne({ _id: id, userId: user._id });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const token = note.shareToken ?? randomBytes(20).toString("hex");
    if (!note.shareToken) {
      await NoteModel.findByIdAndUpdate(id, { $set: { shareToken: token } });
    }

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.json({ shareUrl: `${base}/shared/note/${token}` });
  } catch {
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
