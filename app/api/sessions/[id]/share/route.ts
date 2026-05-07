import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import FocusSessionModel from "@/models/FocusSession";
import UserModel from "@/models/User";
import { randomBytes } from "crypto";

export async function POST(
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

    const focusSession = await FocusSessionModel.findOne({ _id: id, userId: user._id });
    if (!focusSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Reuse existing token or generate a new one
    const token = focusSession.shareToken ?? randomBytes(20).toString("hex");
    if (!focusSession.shareToken) {
      await FocusSessionModel.findByIdAndUpdate(id, { $set: { shareToken: token } });
    }

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.json({ shareUrl: `${base}/shared/session/${token}` });
  } catch (error) {
    console.error("Share session error:", error);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
