import { NextResponse } from "next/server";
import { handleTelegramMessage } from "@/lib/telegram/message-handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const maxDuration = 60;

/**
 * Telegram Bot Webhook Handler
 * This endpoint receives updates from Telegram Bot API
 * Set webhook URL: https://your-domain.com/api/telegram/webhook
 *
 * Security: Validates X-Telegram-Bot-Api-Secret-Token header
 * Set webhook with secret_token parameter to enable validation
 */
export async function POST(request: Request) {
  // Validate secret token (if configured)
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secretToken !== expectedSecret) {
    console.warn("Telegram webhook rejected - invalid secret token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "SOFIA Telegram Bot",
    timestamp: new Date().toISOString(),
  });
}
