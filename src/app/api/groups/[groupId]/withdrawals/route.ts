
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { GroupModel } from "@/backend/models/Group";
import { WithdrawalModel } from "@/backend/models/Withdrawal";
import { UserModel } from "@/backend/models/User";
import { sendTelegramMessage } from "@/lib/telegram";
import { SettingModel } from "@/backend/models/Setting";

export const dynamic = 'force-dynamic';

const FOREMAN_COMMISSION_RATE = 0.05; // 5%

// Record a new withdrawal (auction)
export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();
    const { groupId } = params;
    const body = await request.json();
    const { winnerId, bidAmount, month, year } = body;

    if (!winnerId || !bidAmount || !month || !year) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
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
        return NextResponse.json({ message: "An auction has already been recorded for this cycle." }, { status: 409 });
    }
    
    // Check if winner has already won a bid
    const hasWinnerAlreadyWon = await WithdrawalModel.findOne({ groupId, winnerId });
    if(hasWinnerAlreadyWon) {
        return NextResponse.json({ message: "This member has already won a bid in a previous cycle." }, { status: 409 });
    }

    const totalPot = group.amountPerCycle * group.totalMembers;
    const discount = totalPot - bidAmount;
    const foremanCommission = discount * FOREMAN_COMMISSION_RATE;
    const remainingDiscount = discount - foremanCommission;
    const dividend = remainingDiscount / (group.totalMembers);


    const newWithdrawal = new WithdrawalModel({
      groupId,
      winnerId,
      bidAmount,
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
          const message = `🎉 Auction Result for *${group.name}* (${month} ${year}) 🎉\n\n*Winner*: ${winner.name}\n*Bid Amount*: ₹${bidAmount.toLocaleString()}\n\nYour dividend for this cycle is *₹${dividend.toFixed(2)}*. This amount will be deducted from your next contribution.\n\nThank you!`;
          await sendTelegramMessage(member.telegramId, message, { memberId: member._id, groupId: group._id });
        } catch (e) {
            console.error(`Failed to send Telegram message to member ${member.name} (${member.telegramId})`, e);
        }
      }
    }
    
    // Notify admin
    if (adminChatId) {
        try {
            const adminMessage = `🔔 *New Auction Recorded in ${group.name}*\n\n*Winner*: ${winner.name}\n*Bid*: ₹${bidAmount.toLocaleString()}\n*Dividend per member*: ₹${dividend.toFixed(2)}`;
            await sendTelegramMessage(adminChatId, adminMessage, { groupId: group._id });
        } catch (e) {
            console.error(`Failed to send admin Telegram message to ${adminChatId}`, e);
        }
    }


    return NextResponse.json(newWithdrawal, { status: 201 });

  } catch (error) {
    console.error("Withdrawal POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    