import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import {
  adminUserRole,
  systemHealthLog,
  integrationStatus,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Check health of various services
 */
async function checkServiceHealth() {
  const checks = {
    database: { status: "healthy", responseTime: 0 },
    redis: { status: "unknown", responseTime: 0 },
    aiGateway: { status: "unknown", responseTime: 0 },
    telegram: { status: "unknown", responseTime: 0 },
    zyprus: { status: "unknown", responseTime: 0 },
  };

  // Database check
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database.responseTime = Date.now() - start;
    checks.database.status = "healthy";
  } catch (error) {
    checks.database.status = "down";
    console.error("Database health check failed:", error);
  }

  // Redis check (KV)
  try {
    const { kv } = await import("@vercel/kv");
    const start = Date.now();
    await kv.ping();
    checks.redis.responseTime = Date.now() - start;
    checks.redis.status = "healthy";
  } catch (error) {
    checks.redis.status = "down";
    console.error("Redis health check failed:", error);
  }

  // AI Gateway check
  try {
    const hasKey = !!process.env.AI_GATEWAY_API_KEY;
    checks.aiGateway.status = hasKey ? "healthy" : "down";
    checks.aiGateway.responseTime = 0;
  } catch (error) {
    checks.aiGateway.status = "down";
  }

  // Telegram check
  try {
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    checks.telegram.status = hasToken ? "healthy" : "down";
    checks.telegram.responseTime = 0;
  } catch (error) {
    checks.telegram.status = "down";
  }

  // Zyprus check
  try {
    const hasCredentials =
      !!process.env.ZYPRUS_CLIENT_ID && !!process.env.ZYPRUS_CLIENT_SECRET;
    checks.zyprus.status = hasCredentials ? "healthy" : "down";
    checks.zyprus.responseTime = 0;
  } catch (error) {
    checks.zyprus.status = "down";
  }

  return checks;
}

/**
 * Admin Health Check API
 * Returns current health status of all services
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const adminRole = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, session.user.id));

    if (adminRole.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform health checks
    const healthChecks = await checkServiceHealth();

    // Get integration statuses from database
    const integrationStatuses = await db
      .select()
      .from(integrationStatus)
      .execute();

    // Get recent health logs
    const recentLogs = await db
      .select()
      .from(systemHealthLog)
      .orderBy(desc(systemHealthLog.timestamp))
      .limit(50);

    // Calculate overall system status
    const allHealthy = Object.values(healthChecks).every(
      (check) => check.status === "healthy"
    );
    const anyDown = Object.values(healthChecks).some(
      (check) => check.status === "down"
    );

    const overallStatus = allHealthy
      ? "healthy"
      : anyDown
        ? "degraded"
        : "healthy";

    return NextResponse.json({
      overall: overallStatus,
      services: healthChecks,
      integrations: integrationStatuses,
      recentLogs: recentLogs.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking system health:", error);
    return NextResponse.json(
      { error: "Failed to check system health" },
      { status: 500 }
    );
  }
}

/**
 * Log health check results
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const adminRole = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, session.user.id));

    if (adminRole.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform health check and log results
    const healthChecks = await checkServiceHealth();

    // Insert health logs
    for (const [service, check] of Object.entries(healthChecks)) {
      await db.insert(systemHealthLog).values({
        service: service as any,
        status: check.status as any,
        responseTimeMs: check.responseTime,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Health check logged successfully",
      checks: healthChecks,
    });
  } catch (error) {
    console.error("Error logging health check:", error);
    return NextResponse.json(
      { error: "Failed to log health check" },
      { status: 500 }
    );
  }
}
