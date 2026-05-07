import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json() as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      provider: "credentials",
      onboardingCompleted: false,
    });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Register error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
