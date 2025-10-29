
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { UserModel } from "@/backend/models/User";

export const dynamic = 'force-dynamic';

function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Add a member to a group
export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    const { groupId } = params;
    const body = await request.json();
    const { name, phone, telegramId } = body;

    if (!name || !phone) {
        return NextResponse.json({ message: "Name and phone number are required." }, { status: 400 });
    }

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }
    
    // Check if group is full
    if (group.members.length >= group.totalMembers) {
      return NextResponse.json({ message: "Group is already full" }, { status: 400 });
    }

    // Check if a user with this phone number already exists
    const existingUserByPhone = await UserModel.findOne({ phone });
    if (existingUserByPhone) {
      // Check if this user is already a member of this specific group
      const isAlreadyMember = group.members.some(memberId => memberId.equals(existingUserByPhone._id));
      if (isAlreadyMember) {
        return NextResponse.json({ message: "A member with this phone number is already in this group." }, { status: 409 });
      }
    }
    
    // Generate a unique link code
    let linkCode = generateLinkCode();
    let existingCodeUser = await UserModel.findOne({ telegramLinkCode: linkCode });
    while (existingCodeUser) {
        linkCode = generateLinkCode();
        existingCodeUser = await UserModel.findOne({ telegramLinkCode: linkCode });
    }
    
    const newUser = new UserModel({
        name,
        phone,
        telegramId: telegramId || null,
        telegramLinkCode: linkCode,
        role: 'user', // Explicitly set the role
        groups: [group._id]
    });

    await newUser.save();

    // Add new member to the group's member list
    group.members.push(newUser._id);
    await group.save();
    
    return NextResponse.json({ message: "Member added successfully", user: newUser }, { status: 201 });

  } catch (error) {
    console.error("Add Member Error:", error);
    if (error instanceof Error && (error as any).code === 11000) {
      // This will now more gracefully handle any other unique constraint violations
      const field = Object.keys((error as any).keyPattern)[0];
      return NextResponse.json({ message: `A user with this ${field} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
