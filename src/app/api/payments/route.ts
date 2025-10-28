
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { PaymentModel } from "@/backend/models/Payment";
import { GroupModel } from "@/backend/models/Group";
import { UserModel } from "@/backend/models/User";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { groupId, memberId, month, year } = body;

    if (!groupId || !memberId || !month || !year) {
      return NextResponse.json({ message: "Missing required fields: groupId, memberId, month, and year are required." }, { status: 400 });
    }
    
    const group = await GroupModel.findById(groupId);
    if (!group) {
        return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }
    
    const memberExists = await UserModel.findById(memberId);
    if(!memberExists) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    // Check if payment already exists
    const existingPayment = await PaymentModel.findOne({ groupId, memberId, month, year });
    if(existingPayment) {
        return NextResponse.json({ message: "Payment for this member for this period already exists." }, { status: 409 });
    }

    const newPayment = new PaymentModel({
      groupId,
      memberId,
      amount: group.amountPerCycle,
      date: new Date(),
      month,
      year,
      status: 'paid'
    });

    await newPayment.save();
    
    // --- Telegram Notification ---
    if (memberExists.telegramId) {
      try {
        const message = `✅ Your contribution of *₹${newPayment.amount.toLocaleString()}* has been received for ${month}, ${year} in *${group.name}*.\n\nThank you!`;
        await sendTelegramMessage(memberExists.telegramId, message, { memberId: memberExists._id, groupId: group._id });
      } catch (e) {
        console.error(`Payment recorded, but failed to send Telegram message to ${memberExists.telegramId}`, e);
        return NextResponse.json(
            { ...newPayment.toObject(), warning: "Payment recorded, but Telegram notification failed. Check logs." },
            { status: 201 }
        );
      }
    }

    return NextResponse.json(newPayment, { status: 201 });

  } catch (error) {
    console.error("Payment POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal server error", error: errorMessage }, { status: 500 });
  }
}

    