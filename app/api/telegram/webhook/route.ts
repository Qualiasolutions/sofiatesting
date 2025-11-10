import { NextResponse } from "next/server";
import { handleTelegramMessage } from "@/lib/telegram/message-handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

// Extended duration to allow AI responses to complete (Telegram timeout is 60s)
export const maxDuration = 60;

/**
 * Telegram Bot Webhook Handler
 * This endpoint receives updates from Telegram Bot API
 * Set webhook URL: https://your-domain.com/api/telegram/webhook
 *
 * Security: Validates X-Telegram-Bot-Api-Secret-Token header
 * Set webhook with secret_token parameter to enable validation
 *
 * ASYNC PROCESSING:
 * - Returns 200 OK immediately to prevent Telegram timeout
 * - Processes message asynchronously in background
 * - Serverless function stays alive until processing completes (up to maxDuration)
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
      chat_id: body.message?.chat.id,
      from_user: body.message?.from?.username,
    });

    // Handle new message - ASYNC (no await)
    if (body.message) {
      // Process message asynchronously - don't await
      // The serverless function will stay alive until completion
      handleTelegramMessage(body.message).catch((error) => {
        console.error("Error in async Telegram message handler:", {
          update_id: body.update_id,
          chat_id: body.message?.chat.id,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
      });

      // Return immediately to prevent Telegram timeout
      return NextResponse.json({ ok: true }, { status: 200 });
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
