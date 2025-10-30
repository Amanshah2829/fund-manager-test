import { type NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/services/telegram";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const body = await request.json();

    // Basic validation of the Telegram payload
    // Not a valid message, but return 'ok' to Telegram to avoid retries.
    if (!body.message || !body.message.chat || !body.message.chat.id || !body.message.text) {
      return NextResponse.json({ status: "ok" });
    }

    const chatId = body.message.chat.id;
    const messageText = body.message.text;

    // Asynchronously process the message and send the reply
    // Do not await this, so we can return a 200 OK response to Telegram immediately.
    processTelegramMessage({
      chatId,
      message: messageText,
    }).then(async ({ reply }) => {
      // The processTelegramMessage function now handles its own errors,
      // so we just need to send the reply it generates.
      await sendTelegramMessage(chatId!.toString(), reply);
    }).catch(async (processingError) => {
        // This secondary catch is for unexpected errors in the processTelegramMessage promise itself.
        const errorMessage = processingError instanceof Error ? processingError.message : "An unknown error occurred";
        console.error(`Error processing message for chat ${chatId}: ${errorMessage}`);
        
        try {
            await sendTelegramMessage(chatId.toString(), `🚨 I'm sorry, but an internal error occurred. The admin has been notified.`);
        } catch (e) {
            // Ignore secondary error, the primary one is logged.
        }
    });

    // Immediately return a 200 OK response to Telegram to prevent timeouts and retries.
    return NextResponse.json({ status: "ok" });
}
