
import dbConnect from "@/backend/lib/mongodb";
import { SettingModel } from "@/backend/models/Setting";
import { TelegramLogModel } from "@/backend/models/TelegramLog";

interface LogDetails {
    memberId?: string;
    groupId?: string;
}

/**
 * Sends a message to a given Telegram chat ID and robustly logs the attempt.
 * @param chatId The chat ID to send the message to.
 * @param text The message text. Supports Markdown.
 */
export async function sendTelegramMessage(chatId: string, text: string, logDetails: LogDetails = {}) {
  await dbConnect(); // Ensure DB is connected first.
  let logStatus: 'Success' | 'Failed' = 'Failed';
  let logError: string | undefined;

  try {
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

    logStatus = 'Success';
    console.log(`Telegram message sent successfully to ${chatId}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error sending Telegram message:", errorMessage);
    logError = errorMessage;
    logStatus = 'Failed';
  } finally {
    // This block ALWAYS runs, ensuring a log is created.
    try {
      await new TelegramLogModel({
        ...logDetails,
        recipient: chatId,
        message: text,
        status: logStatus,
        error: logError,
      }).save();
    } catch (dbError) {
      console.error("CRITICAL: Failed to write to TelegramLogModel.", dbError);
    }
  }
}

    