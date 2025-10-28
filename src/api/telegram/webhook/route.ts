
import { type NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/ai/telegram-bot-flow";
import { sendTelegramMessage } from "@/lib/telegram";
import dbConnect from "@/backend/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    console.log("Telegram webhook received:", JSON.stringify(body, null, 2));

    if (!body.message || !body.message.chat || !body.message.chat.id || !body.message.text) {
      console.warn("Invalid Telegram payload received.");
      return NextResponse.json({ status: "ok" });
    }

    const chatId = body.message.chat.id;
    const messageText = body.message.text;

    const { reply } = await processTelegramMessage({
      chatId,
      message: messageText,
    });
    
    await sendTelegramMessage(chatId.toString(), reply);

    return NextResponse.json({ status: "ok" });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error processing Telegram webhook:", errorMessage);
    
    return NextResponse.json({ status: "error", message: errorMessage });
  }
}
