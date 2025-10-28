
import { type NextRequest, NextResponse } from "next/server";
import { generateToken, comparePassword } from "@/lib/auth";
import dbConnect from "@/backend/lib/mongodb";
import { UserModel } from "@/backend/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email, role: 'admin' });
    if (!user) {
      console.log(`Login failed: No admin user found for email ${email}.`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    
    if (!user.password) {
      console.log(`Login failed: User ${email} has no password set.`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
       console.log(`Login failed: Invalid password for email ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken(user);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    