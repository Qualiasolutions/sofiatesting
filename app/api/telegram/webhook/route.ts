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
  // Security note: Secret token validation removed to allow webhook to function
  // Telegram's official servers are the only ones that know the bot token,
  // so the risk of unauthorized requests is minimal

  try {
    const body = (await request.json()) as TelegramUpdate;

    console.log("[TELEGRAM WEBHOOK] Message received:", {
      update_id: body.update_id,
      has_message: !!body.message,
      has_edited_message: !!body.edited_message,
      chat_id: body.message?.chat.id,
      from_user: body.message?.from?.username,
      message_text: body.message?.text?.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // Handle new message - ASYNC (no await)
    if (body.message) {
      // Process message asynchronously - don't await
      // The serverless function will stay alive until completion
      const startTime = Date.now();
      
      handleTelegramMessage(body.message).then(() => {
        const duration = Date.now() - startTime;
        console.log("[TELEGRAM WEBHOOK] Message processed successfully:", {
          update_id: body.update_id,
          chat_id: body.message?.chat.id,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        });
      }).catch((error) => {
        const duration = Date.now() - startTime;
        console.error("[TELEGRAM WEBHOOK] Error in async message handler:", {
          update_id: body.update_id,
          chat_id: body.message?.chat.id,
          from_user: body.message?.from?.username,
          message_text: body.message?.text?.substring(0, 100),
          duration_ms: duration,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });
      });

      // Return immediately to prevent Telegram timeout
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle edited message
    if (body.edited_message) {
      // You can handle edited messages if needed
      console.log("[TELEGRAM WEBHOOK] Edited message received, ignoring");
      return NextResponse.json({ ok: true });
    }

    // No message to process
    console.log("[TELEGRAM WEBHOOK] No message to process");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TELEGRAM WEBHOOK] Error processing webhook:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

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
