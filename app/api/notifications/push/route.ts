import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

    const { title, body, tag } = await req.json() as {
      title: string;
      body?: string;
      tag?: string;
    };
    if (!title) return NextResponse.json({ ok: false }, { status: 400 });

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email }).select("fcmTokens _id");
    if (!user?.fcmTokens?.length) return NextResponse.json({ ok: true, sent: 0 });

    const { adminMessaging } = await import("@/lib/firebase-admin");

    const results = await Promise.allSettled(
      user.fcmTokens.map((token: string) =>
        adminMessaging.send({
          token,
          notification: { title, body: body ?? "" },
          data: { tag: tag ?? "" },
          webpush: {
            notification: {
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              silent: false,
            },
          },
        }),
      ),
    );

    // Prune stale tokens
    const staleTokens: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        const code = (result.reason as { code?: string })?.code ?? "";
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-argument") {
          staleTokens.push(user.fcmTokens[i]);
        }
      }
    });
    if (staleTokens.length > 0) {
      await UserModel.findByIdAndUpdate(user._id, {
        $pull: { fcmTokens: { $in: staleTokens } },
      });
    }

    return NextResponse.json({
      ok: true,
      sent: results.filter((r) => r.status === "fulfilled").length,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
