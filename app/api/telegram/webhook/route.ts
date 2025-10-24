import { handleTelegramMessage } from "@/lib/telegram/message-handler";
import type { TelegramUpdate } from "@/lib/telegram/types";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Telegram Bot Webhook Handler
 * This endpoint receives updates from Telegram Bot API
 * Set webhook URL: https://your-domain.com/api/telegram/webhook
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramUpdate;

    console.log("Telegram webhook received:", {
      update_id: body.update_id,
      has_message: !!body.message,
      has_edited_message: !!body.edited_message,
    });

    // Handle new message
    if (body.message) {
      await handleTelegramMessage(body.message);
      return NextResponse.json({ ok: true });
    }

    // Handle edited message
    if (body.edited_message) {
      // You can handle edited messages if needed
      console.log("Edited message received, ignoring for now");
      return NextResponse.json({ ok: true });
    }

    // No message to process
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);

    // Return 200 even on error to prevent Telegram from retrying
    // (log the error for debugging)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "SOFIA Telegram Bot",
    timestamp: new Date().toISOString(),
  });
}
