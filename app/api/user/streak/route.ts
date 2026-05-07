import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import FocusSessionModel from "@/models/FocusSession";

export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todaySessions = await FocusSessionModel.countDocuments({
      userId: user._id,
      status: "completed",
      startedAt: { $gte: today },
    });

    if (todaySessions === 0) {
      return NextResponse.json({ streak: user.currentStreak });
    }

    const lastActive = user.lastActiveDate;
    let newStreak = user.currentStreak;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const lastActiveDay = new Date(lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);

      if (lastActiveDay.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActiveDay.getTime() === today.getTime()) {
        // Same day - no change
      } else {
        newStreak = 1;
      }
    }

    const longest = Math.max(newStreak, user.longestStreak);

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          currentStreak: newStreak,
          longestStreak: longest,
          lastActiveDate: today,
        },
      },
      { new: true },
    );

    return NextResponse.json({ streak: updatedUser?.currentStreak ?? newStreak });
  } catch (error) {
    console.error("Streak update error:", error);
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
  }
}
