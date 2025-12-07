import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  // Test token validity
  let isValid = false;
  if (token) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/getMe`
      );
      const data = await response.json();
      isValid = data.ok === true;
    } catch (_error) {
      // ignore
    }
  }

  return NextResponse.json({
    hasToken: !!token,
    tokenPrefix: token ? `${token.substring(0, 20)}...` : "none",
    tokenLength: token?.length || 0,
    isValid,
  });
}
