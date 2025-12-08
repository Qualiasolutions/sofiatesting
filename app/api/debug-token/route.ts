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

  // Never expose token prefix in response
  return NextResponse.json({
    hasToken: !!token,
    isValid,
  });
}
