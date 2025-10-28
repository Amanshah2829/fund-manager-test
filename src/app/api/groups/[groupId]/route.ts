
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { PaymentModel } from "@/backend/models/Payment";
import { WithdrawalModel } from "@/backend/models/Withdrawal";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    const group = await GroupModel.findById(params.groupId).populate('members').lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }
    
    const payments = await PaymentModel.find({ groupId: params.groupId })
      .populate('memberId', 'name')
      .sort({ date: -1 })
      .lean();

    const withdrawals = await WithdrawalModel.find({ groupId: params.groupId })
      .populate('winnerId', 'name')
      .sort({ date: -1 })
      .lean();
      
    const groupDetails = { ...group, payments, withdrawals };

    return NextResponse.json(groupDetails, { status: 200 });
  } catch (error) {
    console.error("Get Group Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized: No token provided", { status: 401 });
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized: Invalid token or role", { status: 401 });

    await dbConnect();
    
    const { groupId } = params;
    const body = await request.json();
    const { name, amountPerCycle, totalMembers } = body;

    if (!name || !amountPerCycle || !totalMembers) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const group = await GroupModel.findOne({ _id: groupId, ownerId: user.userId });
    if (!group) {
      return NextResponse.json({ message: "Group not found or you are not the owner" }, { status: 404 });
    }

    group.name = name;
    group.amountPerCycle = amountPerCycle;
    group.totalMembers = totalMembers;
    
    await group.save();

    return NextResponse.json(group, { status: 200 });

  } catch (error) {
    console.error("Update Group Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    