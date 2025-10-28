
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { WithdrawalModel } from "@/backend/models/Withdrawal";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    const { groupId } = params;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    if (group.currentCycle >= group.totalMembers) {
      return NextResponse.json({ message: "This group has completed all its cycles." }, { status: 400 });
    }
    
    // Optional: Check if the current cycle's auction has been recorded before advancing
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const currentWithdrawal = await WithdrawalModel.findOne({ groupId, month: currentMonth, year: currentYear });
    
    // NOTE: For simplicity, we allow advancing without a recorded auction. 
    // In a real-world scenario, you might want to enforce this.
    // if(!currentWithdrawal) {
    //     return NextResponse.json({ message: `Auction for the current cycle (${group.currentCycle}) must be recorded before advancing.` }, { status: 400 });
    // }

    group.currentCycle += 1;
    await group.save();

    return NextResponse.json({ message: "Cycle advanced successfully", currentCycle: group.currentCycle }, { status: 200 });

  } catch (error) {
    console.error("Next Cycle Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    