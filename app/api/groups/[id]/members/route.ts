import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import GroupModel from "@/models/Group";
import UserModel from "@/models/User";

// POST /api/groups/[id]/members — invite a user by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { email } = await req.json() as { email?: string };
    if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const inviteEmail = email.trim().toLowerCase();

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await GroupModel.findById(id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Only owner can invite
    if (group.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Only the group owner can invite members" }, { status: 403 });
    }

    // Check if already a member
    if (group.members.some((m) => m.email === inviteEmail)) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    // Check if already invited
    if (group.pendingInvites.some((i) => i.email === inviteEmail)) {
      return NextResponse.json({ error: "Invite already sent" }, { status: 409 });
    }

    // If the invitee already has an account, add them directly; otherwise queue as pending
    const invitee = await UserModel.findOne({ email: inviteEmail });
    if (invitee) {
      group.members.push({ userId: invitee._id, email: invitee.email, name: invitee.name, joinedAt: new Date() });
    } else {
      group.pendingInvites.push({ email: inviteEmail, invitedAt: new Date() });
    }

    await group.save();
    return NextResponse.json(group);
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members — remove a member (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { email } = await req.json() as { email?: string };
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const group = await GroupModel.findById(id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Only the group owner can remove members" }, { status: 403 });
    }

    group.members = group.members.filter((m) => m.email !== email);
    group.pendingInvites = group.pendingInvites.filter((i) => i.email !== email);
    await group.save();

    return NextResponse.json(group);
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
