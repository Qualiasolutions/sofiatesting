import { NextResponse } from "next/server";
import { getTelegramClient } from "@/lib/telegram/client";

/**
 * Telegram Bot Setup Endpoint
 * Use this to set up the webhook and check bot status
 *
 * GET /api/telegram/setup - Get bot info and webhook status
 * POST /api/telegram/setup - Set up webhook
 */

export async function GET() {
  try {
    const client = getTelegramClient();

    // Get bot info
    const botInfo = await client.getMe();

    // Get webhook info
    const webhookInfo = await client.getWebhookInfo();

    return NextResponse.json({
      bot: botInfo,
      webhook: webhookInfo,
      status: "ok",
    });
  } catch (error) {
    console.error("Error getting bot info:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Make sure TELEGRAM_BOT_TOKEN is set in environment variables",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "webhookUrl is required in request body" },
        { status: 400 }
      );
    }

    const client = getTelegramClient();

    // Set webhook
    const success = await client.setWebhook(webhookUrl);

    if (success) {
      const webhookInfo = await client.getWebhookInfo();
      return NextResponse.json({
        success: true,
        message: "Webhook set successfully",
        webhook: webhookInfo,
      });
    }

    return NextResponse.json(
      { success: false, message: "Failed to set webhook" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const client = getTelegramClient();

    // Delete webhook (useful for local testing)
    const success = await client.deleteWebhook();

    return NextResponse.json({
      success,
      message: success
        ? "Webhook deleted successfully"
        : "Failed to delete webhook",
    });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
