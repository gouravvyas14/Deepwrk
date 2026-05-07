import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

// Save FCM token for the current user (deduplicated)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json() as { token?: string };
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    await connectDB();
    await UserModel.findOneAndUpdate(
      { email: session.user.email },
      { $addToSet: { fcmTokens: token } },
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}

// Remove a token (called on logout or when token refreshes)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json() as { token?: string };
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    await connectDB();
    await UserModel.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { fcmTokens: token } },
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove token" }, { status: 500 });
  }
}
