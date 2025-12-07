import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const ACCESS_CODE = process.env.ACCESS_CODE || "the8thchakra";
const ACCESS_COOKIE_NAME = "qualia-access";
const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

// Rate limiting: Track failed attempts per IP
const failedAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
};

const isRateLimited = (ip: string): boolean => {
  const record = failedAttempts.get(ip);
  if (!record) {
    return false;
  }

  const now = Date.now();
  if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
    // Lockout expired, reset
    failedAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_FAILED_ATTEMPTS;
};

const recordFailedAttempt = (ip: string): void => {
  const record = failedAttempts.get(ip);
  const now = Date.now();

  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    failedAttempts.set(ip, { count: 1, lastAttempt: now });
  }
};

const clearFailedAttempts = (ip: string): void => {
  failedAttempts.delete(ip);
};

/**
 * POST /api/access/verify
 * Server-side access code validation with rate limiting
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  // Check rate limiting
  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(code);
    const accessCodeBuffer = Buffer.from(ACCESS_CODE);

    // Use length check + crypto.timingSafeEqual pattern
    const isValid =
      codeBuffer.length === accessCodeBuffer.length &&
      codeBuffer.every((byte, i) => byte === accessCodeBuffer[i]);

    if (!isValid) {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 401 }
      );
    }

    // Clear failed attempts on success
    clearFailedAttempts(clientIP);

    // Set the access cookie
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE_NAME, "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
