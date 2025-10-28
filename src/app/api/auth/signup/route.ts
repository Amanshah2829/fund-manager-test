
import { type NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import dbConnect from "@/backend/lib/mongodb";
import { UserModel } from "@/backend/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ message: "Name, email, password, and phone are required" }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 });
    }
    
    const existingPhone = await UserModel.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json({ message: "An account with this phone number already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
      groups: []
    });

    await newUser.save();

    return NextResponse.json({ message: "Admin user created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    