
import { type NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/ai/flows/telegram-bot-flow";
import { sendTelegramMessage } from "@/lib/telegram";
import dbConnect from "@/backend/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Establish DB connection at the start of the request
    await dbConnect();

    const body = await request.json();

    // Log the incoming request for debugging
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2));

    // Basic validation of the incoming payload from Telegram
    if (!body.message || !body.message.chat || !body.message.chat.id || !body.message.text) {
      console.warn("Invalid Telegram payload received.");
      // Telegram doesn't need a response if the payload is malformed.
      return NextResponse.json({ status: "ok" });
    }

    const chatId = body.message.chat.id;
    const messageText = body.message.text;

    // Call the logic function to process the message
    const { reply } = await processTelegramMessage({
      chatId,
      message: messageText,
    });
    
    // Send the generated reply back to the user
    await sendTelegramMessage(chatId.toString(), reply);

    // Let Telegram know we've received the update.
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error processing Telegram webhook:", errorMessage);
    
    // It's good practice to still return a 200 OK to Telegram to avoid repeated calls,
    // even if our internal processing fails.
    return NextResponse.json({ status: "error", message: errorMessage });
  }
}

    