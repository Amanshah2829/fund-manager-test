'use server';
/**
 * @fileOverview A Telegram bot AI agent.
 *
 * - processTelegramMessage - A function that handles incoming messages from the Telegram bot.
 * - TelegramBotInput - The input type for the processTelegramMessage function.
 * - TelegramBotOutput - The return type for the processTelegramMessage function.
 */

import { UserModel } from '@/backend/models/User';
import { GroupModel } from '@/backend/models/Group';
import { PaymentModel } from '@/backend/models/Payment';
import { WithdrawalModel } from '@/backend/models/Withdrawal';

export interface TelegramBotInput {
  chatId: number;
  message: string;
}

export interface TelegramBotOutput {
  reply: string;
}

export async function processTelegramMessage({ chatId, message }: TelegramBotInput): Promise<TelegramBotOutput> {
  let reply = "Sorry, I didn't understand that. Please send 'status' to get your details.";

  const user = await UserModel.findOne({ telegramId: chatId.toString() });

  if (!user) {
    reply = "Sorry, your Telegram account is not linked to any member in our system. Please contact your chit fund foreman to get it linked.";
    return { reply };
  }

  if (message.toLowerCase().includes('status')) {
    const groups = await GroupModel.find({ members: user._id }).lean();
    if (!groups.length) {
      reply = `Hello ${user.name}! You are not currently a member of any active chit fund groups.`;
      return { reply };
    }

    let statusText = `Hello *${user.name}*!\n\nHere is your chit fund status:\n`;

    for (const group of groups) {
      statusText += `\n\n- - - - - - - - - - - - -\n\n`;
      statusText += `*Group: ${group.name}*\n`;
      statusText += `*Contribution*: ₹${group.amountPerCycle.toLocaleString()} per cycle\n`;
      statusText += `*Current Cycle*: ${group.currentCycle} of ${group.totalMembers}\n`;

      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      const payment = await PaymentModel.findOne({
        groupId: group._id,
        memberId: user._id,
        month: currentMonth,
        year: currentYear,
      }).lean();

      if (payment) {
        statusText += `*${currentMonth} Payment*: ✅ Paid on ${new Date(payment.date).toLocaleDateString()}\n`;
      } else {
        const lastWithdrawal = await WithdrawalModel.findOne({ groupId: group._id }).sort({ date: -1 });
        let dividend = 0;
        if (lastWithdrawal) {
          dividend = lastWithdrawal.dividend;
        }
        const amountDue = group.amountPerCycle - dividend;
        statusText += `*${currentMonth} Payment*: ⚠️ Pending. Amount due is ₹${amountDue.toFixed(2)} (after dividend deduction of ₹${dividend.toFixed(2)}).\n`;
      }

      const winning = await WithdrawalModel.findOne({ groupId: group._id, winnerId: user._id });
      if (winning) {
        statusText += `*Auction Status*: You have already won an auction in this group.\n`;
      } else {
        statusText += `*Auction Status*: You have not yet won an auction in this group.\n`;
      }
    }

    statusText += `\n\n- - - - - - - - - - - - -\n\nTo see this again, just send 'status'.`;
    reply = statusText;
  }

  return { reply };
}

    