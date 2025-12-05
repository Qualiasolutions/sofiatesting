import { NextResponse } from "next/server";

export async function GET() {
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

    return NextResponse.json({
      hasGeminiKey: !!keys.gemini,
      hasGoogleKey: !!keys.google,
      keyPrefix: activeKey.substring(0, 20) + "...",
      keyLength: activeKey.length,
      isValid: !data.error,
      error: data.error,
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
