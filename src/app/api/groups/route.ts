
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized: No token provided", { status: 401 });
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized: Invalid token or role", { status: 401 });
    
    await dbConnect();
    const groups = await GroupModel.find({ ownerId: user.userId }).populate('members').sort({ createdAt: -1 });
    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    console.error("Groups GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
     const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized: Invalid token or role", { status: 401 });

    await dbConnect();
    const body = await request.json();

    const { name, amountPerCycle, totalMembers, cyclePeriod } = body;

    if (!name || !amountPerCycle || !totalMembers || !cyclePeriod) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    const newGroup = new GroupModel({
      name,
      amountPerCycle,
      totalMembers,
      cyclePeriod,
      ownerId: user.userId, // Use the ID from the token
      currentCycle: 1,
      members: []
    });

    await newGroup.save();

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Group POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    