
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/backend/lib/mongodb";
import { TelegramLogModel } from "@/backend/models/TelegramLog";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return new Response("Unauthorized", { status: 403 });

    await dbConnect();
    
    const logs = await TelegramLogModel.find({})
      .sort({ timestamp: -1 })
      .populate('memberId', 'name')
      .limit(100) // Limit to the last 100 logs for performance
      .lean();

    return NextResponse.json(logs, { status: 200 });

  } catch (error) {
    console.error("Get Telegram Logs Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

    