
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/backend/lib/mongodb";
import { SettingModel } from "@/backend/models/Setting";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized", { status: 403 });

    await dbConnect();
    
    const telegramBotTokenSetting = await SettingModel.findOne({ key: 'telegramBotToken' }).lean();
    const telegramChatIdSetting = await SettingModel.findOne({ key: 'telegramChatId' }).lean();

    return NextResponse.json({
        telegramBotToken: telegramBotTokenSetting?.value ? '********' : '', // Return a masked token for security
        telegramChatId: telegramChatIdSetting?.value || ''
    }, { status: 200 });

  } catch (error) {
    console.error("Get Settings Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized", { status: 403 });

    await dbConnect();

    const { telegramBotToken, telegramChatId } = await request.json();
    
    if (telegramChatId !== undefined) {
        await SettingModel.findOneAndUpdate(
            { key: 'telegramChatId' },
            { key: 'telegramChatId', value: telegramChatId },
            { upsert: true, new: true }
        );
    }
    
    // Only update token if a new, non-masked one is provided
    if (telegramBotToken && !telegramBotToken.includes('*')) { 
        await SettingModel.findOneAndUpdate(
            { key: 'telegramBotToken' },
            { key: 'telegramBotToken', value: telegramBotToken },
            { upsert: true, new: true }
        );
    }

    return NextResponse.json({ message: "Settings updated successfully." }, { status: 200 });

  } catch (error) {
    console.error("Update Settings Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    