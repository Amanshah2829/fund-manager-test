
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken, comparePassword, hashPassword } from "@/lib/auth";
import dbConnect from "@/backend/lib/mongodb";
import { UserModel } from "@/backend/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    await dbConnect();

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Current and new passwords are required" }, { status: 400 });
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.password) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 403 });
    }

    const newHashedPassword = await hashPassword(newPassword);
    user.password = newHashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    