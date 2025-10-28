
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { UserModel } from "@/backend/models/User";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Update a member's details
export async function PUT(request: NextRequest, { params }: { params: { groupId: string, memberId: string } }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const adminUser = verifyToken(token);
    if (!adminUser || adminUser.role !== 'admin') return new Response("Unauthorized", { status: 403 });

    await dbConnect();
    const { memberId } = params;
    const { name, phone, telegramId } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone are required" }, { status: 400 });
    }

    const userToUpdate = await UserModel.findById(memberId);
    if (!userToUpdate) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    // Check for uniqueness of phone number if it's being changed
    if (phone !== userToUpdate.phone) {
        const existingPhone = await UserModel.findOne({ phone });
        if (existingPhone) {
            return NextResponse.json({ message: "This phone number is already registered to another member." }, { status: 409 });
        }
    }

    userToUpdate.name = name;
    userToUpdate.phone = phone;
    userToUpdate.telegramId = telegramId || ''; // Update or clear telegramId

    await userToUpdate.save();

    return NextResponse.json({ message: "Member updated successfully", user: userToUpdate }, { status: 200 });

  } catch (error) {
    console.error("Update Member Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


// Remove a member from a group
export async function DELETE(request: NextRequest, { params }: { params: { groupId: string, memberId: string } }) {
  try {
    await dbConnect();
    const { groupId, memberId } = params;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Remove member from group
    group.members = group.members.filter((id: any) => id.toString() !== memberId);
    await group.save();
    
    // Also remove group from user's list of groups
    await UserModel.findByIdAndUpdate(memberId, { $pull: { groups: groupId } });

    return NextResponse.json({ message: "Member removed successfully" }, { status: 200 });

  } catch (error) {
    console.error("Remove Member Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    