import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth/admin";
import { db } from "@/lib/db/client";

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

  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test, NOW() as timestamp`);

    return NextResponse.json({
      status: "connected",
      message: "Database connection successful!",
      timestamp: (result[0] as { timestamp: string }).timestamp,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
