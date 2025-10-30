
import dbConnect from "@/backend/lib/mongodb";
import { SettingModel } from "@/backend/models/Setting";
import { TelegramLogModel } from "@/backend/models/TelegramLog";

interface LogDetails {
    memberId?: string;
    groupId?: string;
}

async function logTelegramAttempt(chatId: string, text: string, status: 'Success' | 'Failed', error?: string, logDetails: LogDetails = {}) {
    try {
        await dbConnect();
        await new TelegramLogModel({
            ...logDetails,
            recipient: chatId,
            message: text,
            status: status,
            error: error,
        }).save();
    } catch (dbError) {
        // This is a critical failure in the logging system itself.
        console.error("CRITICAL: Failed to write to TelegramLogModel.", dbError);
    }
}

/**
 * Sends a message to a given Telegram chat ID and robustly logs the attempt.
 * @param chatId The chat ID to send the message to.
 * @param text The message text. Supports Markdown.
 */
export async function sendTelegramMessage(chatId: string, text: string, logDetails: LogDetails = {}) {
  try {
    await dbConnect();
    const tokenSetting = await SettingModel.findOne({ key: 'telegramBotToken' });
    const TELEGRAM_BOT_TOKEN = tokenSetting?.value;

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("Telegram Bot Token is not configured in settings.");
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API Error: ${errorData.description || 'Unknown error'}`);
    }

    // Log success without holding up the response
    logTelegramAttempt(chatId, text, 'Success', undefined, logDetails);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error sending Telegram message:", errorMessage);
    // Log failure without holding up the response
    logTelegramAttempt(chatId, text, 'Failed', errorMessage, logDetails);
    // Re-throw the error to be handled by the calling function if needed
    throw error;
  }
}
