import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { WithdrawalModel } from "@/backend/models/Withdrawal";
import { UserModel } from "@/backend/models/User";
import { sendTelegramMessage } from "@/lib/telegram";
import { SettingModel } from "@/backend/models/Setting";

export const dynamic = 'force-dynamic';

const FOREMAN_COMMISSION_RATE = 0.05; // 5%

// Record a new withdrawal (auction or FCFS)
export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    const { groupId } = params;
    const body = await request.json();
    const { winnerId, type, bidAmount, month, year } = body;

    if (!winnerId || !type || !month || !year) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (type === 'auction' && !bidAmount) {
        return NextResponse.json({ message: "Bid amount is required for auction type" }, { status: 400 });
    }

    const group = await GroupModel.findById(groupId).populate('members');
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const winner = await UserModel.findById(winnerId);
    if (!winner) {
        return NextResponse.json({ message: "Winner not found" }, { status: 404 });
    }

    // Check if a withdrawal for this cycle already exists
    const existingWithdrawal = await WithdrawalModel.findOne({ groupId, month, year });
    if(existingWithdrawal) {
        return NextResponse.json({ message: "A withdrawal has already been recorded for this cycle." }, { status: 409 });
    }
    
    // Check if winner has already won a bid
    const hasWinnerAlreadyWon = await WithdrawalModel.findOne({ groupId, winnerId });
    if(hasWinnerAlreadyWon) {
        return NextResponse.json({ message: "This member has already won a prize in a previous cycle." }, { status: 409 });
    }

    const totalPot = group.amountPerCycle * group.totalMembers;
    const foremanCommission = totalPot * FOREMAN_COMMISSION_RATE;

    let finalBidAmount = 0;
    let dividend = 0;
    let telegramMessage: string;

    if (type === 'auction') {
      finalBidAmount = bidAmount;
      const discount = totalPot - finalBidAmount;
      const distributableAmount = discount - foremanCommission;
      
      if (distributableAmount < 0) {
          return NextResponse.json({ message: "Bid amount is too high. The discount does not cover the foreman's commission." }, { status: 400 });
      }
      dividend = distributableAmount / group.totalMembers;
      telegramMessage = `🎉 Auction Result for *${group.name}* (${month} ${year}) 🎉\n\n*Winner*: ${winner.name}\n*Winning Bid*: ₹${finalBidAmount.toLocaleString()}\n\nYour dividend for this cycle is *₹${dividend.toFixed(2)}*. This amount will be deducted from your next contribution.`;

    } else { // FCFS
      finalBidAmount = totalPot - foremanCommission;
      dividend = 0;
      telegramMessage = `🎉 Withdrawal for *${group.name}* (${month} ${year}) 🎉\n\n*Recipient*: ${winner.name}\n*Amount*: ₹${finalBidAmount.toLocaleString()}\n\nThis was a 'First Come, First Served' withdrawal. There is no dividend for this cycle.`;
    }

    const newWithdrawal = new WithdrawalModel({
      groupId,
      winnerId,
      type,
      bidAmount: finalBidAmount,
      dividend,
      foremanCommission,
      date: new Date(),
      month,
      year
    });

    await newWithdrawal.save();
    
    // --- Telegram Notification ---
    const adminSetting = await SettingModel.findOne({ key: 'telegramChatId' });
    const adminChatId = adminSetting?.value;

    const allMembers = group.members as any[];
    for (const member of allMembers) {
      if (member.telegramId) {
        try {
          await sendTelegramMessage(member.telegramId, telegramMessage, { memberId: member._id, groupId: group._id });
        } catch (e) {
            console.error(`Failed to send Telegram message to member ${member.name} (${member.telegramId})`, e);
        }
      }
    }
    
    // Notify admin
    if (adminChatId) {
        try {
            const adminMessage = `🔔 *New Withdrawal Recorded in ${group.name} (${type})*\n\n*Winner*: ${winner.name}\n*Amount*: ₹${finalBidAmount.toLocaleString()}\n*Dividend per member*: ₹${dividend.toFixed(2)}`;
            await sendTelegramMessage(adminChatId, adminMessage, { groupId: group._id });
        } catch (e) {
            console.error(`Failed to send admin Telegram message to ${adminChatId}`, e);
        }
    }


    return NextResponse.json(newWithdrawal, { status: 201 });

  } catch (error) {
    console.error("Withdrawal POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal server error", error: errorMessage }, { status: 500 });
  }
}
