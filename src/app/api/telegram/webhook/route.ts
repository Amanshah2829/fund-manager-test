import { type NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/services/telegram";
import { sendTelegramMessage } from "@/lib/telegram";
import dbConnect from "@/backend/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let chatId: number | undefined;

  try {
    await dbConnect();

    const body = await request.json();

    // Basic validation of the Telegram payload
    if (!body.message || !body.message.chat || !body.message.chat.id || !body.message.text) {
      // Not a valid message, but return 'ok' to Telegram to avoid retries.
      return NextResponse.json({ status: "ok" });
    }

    chatId = body.message.chat.id;
    const messageText = body.message.text;

    // Asynchronously process the message and send the reply
    // Do not await this, so we can return a 200 OK response to Telegram immediately.
    processTelegramMessage({
      chatId,
      message: messageText,
    }).then(async ({ reply }) => {
      await sendTelegramMessage(chatId!.toString(), reply);
    }).catch(async (processingError) => {
        const errorMessage = processingError instanceof Error ? processingError.message : "An unknown error occurred";
        console.error(`Error processing message for chat ${chatId}: ${errorMessage}`);
        // Try to inform the user about the error.
        if (chatId) {
            try {
                await sendTelegramMessage(chatId.toString(), `🚨 I'm sorry, but an internal error occurred while processing your request. The admin has been notified.`);
            } catch (e) {
                // Ignore secondary error, the primary one is more important.
            }
        }
    });

    // Immediately return a 200 OK response to Telegram
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Webhook route error:", errorMessage);
    
    // We must return a 200 OK even if there's an error in our initial parsing,
    // otherwise Telegram will keep retrying and spamming the logs.
    // The specific error is logged on the server.
    return NextResponse.json({ status: "ok" });
  }
}
