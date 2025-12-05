import { NextResponse } from "next/server";

export async function GET() {
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

    // Test 2: Get webhook info
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const webhookData = await webhookResponse.json();

    return NextResponse.json({
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + "...",
      botInfo: meData,
      webhookInfo: webhookData,
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
