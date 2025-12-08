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

  const keys = {
    gemini: process.env.GEMINI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  };

  const activeKey = keys.gemini || keys.google;

  if (!activeKey) {
    return NextResponse.json({ error: "No API key found" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`
    );
    const data = await response.json();

    // Never expose key prefix in response
    return NextResponse.json({
      hasGeminiKey: !!keys.gemini,
      hasGoogleKey: !!keys.google,
      isValid: !data.error,
      modelCount: data.models?.length || 0,
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
