import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth/admin";

export async function GET() {
  // Only allow in development or for admins
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 500 });
  }

  try {
    // Test 1: Get bot info
    const meResponse = await fetch(
      `https://api.telegram.org/bot${token}/getMe`
    );
    const meData = await meResponse.json();

    // Test 2: Get webhook info (redact sensitive URL)
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const webhookData = await webhookResponse.json();

    // Never expose token or full webhook URL
    return NextResponse.json({
      hasToken: true,
      botInfo: meData.ok
        ? {
            id: meData.result?.id,
            username: meData.result?.username,
            isBot: meData.result?.is_bot,
          }
        : null,
      webhookConfigured: !!webhookData.result?.url,
      webhookPendingUpdates: webhookData.result?.pending_update_count || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
