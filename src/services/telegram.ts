/**
 * @fileOverview A service for handling Telegram bot logic.
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

async function handleLinkCommand(chatId: number, message: string): Promise<string> {
  const parts = message.split(' ');
  if (parts.length < 2 || !/^\d{6}$/.test(parts[1])) {
    return "Invalid command format. Please use `/link 123456` with the 6-digit code you were given.";
  }
  const linkCode = parts[1];

  const userToLink = await UserModel.findOne({ telegramLinkCode: linkCode });

  if (!userToLink) {
    return "❌ Invalid linking code. Please double-check the code and try again or contact your foreman.";
  }

  if (userToLink.telegramId && userToLink.telegramId === chatId.toString()) {
     return `✅ This Telegram account is already linked to *${userToLink.name}*. Send /status to see your details.`;
  }
  
  // Check if a different user is already linked to this telegramId
  const existingTelegramUser = await UserModel.findOne({ telegramId: chatId.toString() });
  if (existingTelegramUser) {
      return `This Telegram account is already in use by *${existingTelegramUser.name}*. Please contact your foreman to resolve this.`;
  }

  userToLink.telegramId = chatId.toString();
  userToLink.telegramLinkCode = undefined; // Remove the code after successful linking
  await userToLink.save();

  return `✅ Success! Your Telegram account is now linked to *${userToLink.name}*. You will now receive notifications here.\n\nSend /status to see your chit fund details.`;
}

async function getStatusReply(user: any): Promise<string> {
    const groups = await GroupModel.find({ members: user._id }).lean();
    if (!groups.length) {
      return `Hello ${user.name}! You are not currently a member of any active chit fund groups.`;
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
        let dividend = lastWithdrawal?.dividend || 0;
        const amountDue = group.amountPerCycle - dividend;
        statusText += `*${currentMonth} Payment*: ⚠️ Pending. Amount due is *₹${amountDue.toFixed(2)}* (after dividend deduction of ₹${dividend.toFixed(2)}).\n`;
      }

      const winning = await WithdrawalModel.findOne({ groupId: group._id, winnerId: user._id });
      if (winning) {
        statusText += `*Auction Status*: You have already won an auction in this group.\n`;
      } else {
        statusText += `*Auction Status*: You have not yet won an auction in this group.\n`;
      }
    }
    statusText += `\n\n- - - - - - - - - - - - -\n\nTo see this again, just send /status.`;
    return statusText;
}

async function getPaymentReply(user: any): Promise<string> {
    const groups = await GroupModel.find({ members: user._id }).lean();
    if (!groups.length) return `Hello ${user.name}! You are not currently a member of any active chit fund groups.`;
    
    let replyText = `Hello *${user.name}*!\n\nHere is your payment summary for the current cycle:\n`;
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    for (const group of groups) {
        const payment = await PaymentModel.findOne({ groupId: group._id, memberId: user._id, month: currentMonth, year: currentYear }).lean();
        
        replyText += `\n\n*Group: ${group.name}*`;

        if (payment) {
            replyText += `\n*Status*: ✅ Paid`;
            replyText += `\n*Amount*: ₹${payment.amount.toLocaleString()}`;
            replyText += `\n*Date*: ${new Date(payment.date).toLocaleDateString()}`;
        } else {
            const lastWithdrawal = await WithdrawalModel.findOne({ groupId: group._id }).sort({ date: -1 });
            let dividend = lastWithdrawal?.dividend || 0;
            const amountDue = group.amountPerCycle - dividend;

            replyText += `\n*Status*: ⚠️ Pending`;
            replyText += `\n*Contribution*: ₹${group.amountPerCycle.toLocaleString()}`;
            replyText += `\n*Last Dividend*: -₹${dividend.toFixed(2)}`;
            replyText += `\n*Amount Due*: *₹${amountDue.toFixed(2)}*`;
        }
    }
    return replyText;
}

async function getStatementReply(user: any): Promise<string> {
    const payments = await PaymentModel.find({ memberId: user._id }).sort({ date: -1 }).limit(5).populate('groupId', 'name');
    if (!payments.length) return `Hello *${user.name}*! No payment history found.`;

    let replyText = `Hello *${user.name}*!\n\nHere are your last 5 transactions:\n`;

    for (const payment of payments) {
        const group = payment.groupId as any;
        replyText += `\n\n*Group*: ${group.name}`;
        replyText += `\n*Date*: ${new Date(payment.date).toLocaleDateString()}`;
        replyText += `\n*Period*: ${payment.month} ${payment.year}`;
        replyText += `\n*Amount*: ₹${payment.amount.toLocaleString()}`;
    }
    
    return replyText;
}

async function getContactReply(): Promise<string> {
    const admin = await UserModel.findOne({ role: 'admin' }).lean();
    if (!admin) return "Foreman contact information is not available at the moment.";

    let replyText = `*Foreman Contact Information*\n\n`;
    replyText += `*Name*: ${admin.name}\n`;
    if(admin.email) replyText += `*Email*: ${admin.email}\n`;
    if(admin.phone) replyText += `*Phone*: ${admin.phone}\n`;
    
    return replyText;
}


export async function processTelegramMessage({ chatId, message }: TelegramBotInput): Promise<TelegramBotOutput> {
  let reply = "";
  const command = message.toLowerCase().split(' ')[0];

  if (command.startsWith('/link')) {
    reply = await handleLinkCommand(chatId, message);
    return { reply };
  }

  const user = await UserModel.findOne({ telegramId: chatId.toString() });

  if (!user) {
    reply = "Your Telegram account is not yet linked. Please ask your foreman for your unique 6-digit code and send it to me in the format: `/link 123456`";
    return { reply };
  }
  
  switch(command) {
    case '/start':
    case '/help':
      reply = `Hello *${user.name}*!\n\nI'm your chit fund assistant. Here are the commands you can use:\n\n` +
              `*/status* - Get a full overview of your groups and payment status.\n` +
              `*/payment* - See the amount due for the current cycle.\n` +
              `*/statement* - View your recent transaction history.\n` +
              `*/contact* - Get contact information for the foreman.`;
      break;
    case '/status':
      reply = await getStatusReply(user);
      break;
    case '/payment':
      reply = await getPaymentReply(user);
      break;
    case '/statement':
      reply = await getStatementReply(user);
      break;
    case '/contact':
      reply = await getContactReply();
      break;
    default:
      reply = `Sorry, that's not a valid command. Please use one of the following options:\n\n` +
              `*/status* - Get a full overview of your groups and payment status.\n` +
              `*/payment* - See the amount due for the current cycle.\n` +
              `*/statement* - View your recent transaction history.\n` +
              `*/contact* - Get contact information for the foreman.\n` +
              `*/help* - To see this list of commands again.`;
      break;
  }

  return { reply };
}
