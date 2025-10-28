
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import { PaymentModel } from "@/backend/models/Payment";
import { GroupModel } from "@/backend/models/Group";
import { UserModel } from "@/backend/models/User";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let notificationWarning = "";
  try {
    await dbConnect();
    const body = await request.json();
    const { groupId, memberIds, month, year } = body;

    if (!groupId || !Array.isArray(memberIds) || memberIds.length === 0 || !month || !year) {
      return NextResponse.json({ message: "Missing or invalid required fields." }, { status: 400 });
    }
    
    const group = await GroupModel.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const operations = memberIds.map(memberId => ({
        updateOne: {
            filter: { groupId, memberId, month, year },
            update: { 
                $setOnInsert: {
                    groupId,
                    memberId,
                    amount: group.amountPerCycle,
                    date: new Date(),
                    month,
                    year,
                    status: 'paid'
                }
            },
            upsert: true
        }
    }));

    const result = await PaymentModel.bulkWrite(operations);

    // --- Telegram Notifications ---
    try {
        const users = await UserModel.find({ _id: { $in: memberIds }, telegramId: { $ne: null, $exists: true } });
        
        for (const user of users) {
            if (user.telegramId) {
                try {
                    const message = `✅ Your contribution of *₹${group.amountPerCycle.toLocaleString()}* has been received for ${month}, ${year} in *${group.name}*.\n\nThank you!`;
                    await sendTelegramMessage(user.telegramId, message, { memberId: user._id, groupId });
                } catch (e) {
                    console.error(`Failed to send Telegram message to ${user.telegramId}`, e);
                    notificationWarning = "Payments were recorded, but some Telegram notifications failed to send. Check logs for details.";
                }
            }
        }
    } catch (e) {
        console.error("Error during Telegram notification batch processing.", e);
        notificationWarning = "Payments recorded, but Telegram notifications failed. Check logs.";
    }


    return NextResponse.json({ 
        message: "Bulk payments processed.",
        successfulCount: result.upsertedCount + result.matchedCount,
        warning: notificationWarning || undefined
    }, { status: 201 });

  } catch (error) {
    console.error("Bulk Payment POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal server error", error: errorMessage }, { status: 500 });
  }
}

    