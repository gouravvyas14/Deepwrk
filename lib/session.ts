import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import type { IUserDocument } from "@/models/User";

export async function getAuthenticatedUser(): Promise<IUserDocument | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  await connectDB();
  return UserModel.findOne({ email: session.user.email });
}
