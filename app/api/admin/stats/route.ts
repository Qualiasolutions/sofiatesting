import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import {
  adminUserRole,
  user,
  message,
  documentGenerationLog,
  propertyListing,
  agentExecutionLog,
  calculatorUsageLog,
  chat,
} from "@/lib/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Admin Stats API
 * Returns dashboard statistics
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d"; // 24h, 7d, 30d, all

    // Calculate date threshold
    let dateThreshold: Date | null = null;
    if (timeRange === "24h") {
      dateThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (timeRange === "7d") {
      dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch all stats in parallel
    const [
      totalUsersResult,
      totalMessagesResult,
      totalDocumentsResult,
      totalListingsResult,
      totalCostResult,
      totalTokensResult,
      recentActivityResult,
      activeChatsResult,
      calculatorUsageResult,
      modelUsageResult,
    ] = await Promise.all([
      // Total users
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(sql`${user.deletedAt} IS NULL`),

      // Total messages (filtered by time)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(message)
        .where(
          dateThreshold ? gte(message.createdAt, dateThreshold) : sql`true`
        ),

      // Total documents (filtered by time)
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documentGenerationLog)
        .where(
          and(
            eq(documentGenerationLog.success, true),
            dateThreshold
              ? gte(documentGenerationLog.timestamp, dateThreshold)
              : sql`true`
          )
        ),

      // Total listings
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(propertyListing)
        .where(sql`${propertyListing.deletedAt} IS NULL`),

      // Total cost from agent execution
      db
        .select({
          totalCost: sql<string>`COALESCE(SUM(${agentExecutionLog.costUsd}), 0)`,
        })
        .from(agentExecutionLog)
        .where(
          dateThreshold ? gte(agentExecutionLog.timestamp, dateThreshold) : sql`true`
        ),

      // Total tokens used
      db
        .select({
          totalTokens: sql<number>`COALESCE(SUM(${agentExecutionLog.tokensUsed}), 0)::int`,
        })
        .from(agentExecutionLog)
        .where(
          dateThreshold ? gte(agentExecutionLog.timestamp, dateThreshold) : sql`true`
        ),

      // Recent agent activity (last 10)
      db
        .select({
          id: agentExecutionLog.id,
          timestamp: agentExecutionLog.timestamp,
          agentType: agentExecutionLog.agentType,
          action: agentExecutionLog.action,
          success: agentExecutionLog.success,
          userId: agentExecutionLog.userId,
          durationMs: agentExecutionLog.durationMs,
          modelUsed: agentExecutionLog.modelUsed,
        })
        .from(agentExecutionLog)
        .orderBy(desc(agentExecutionLog.timestamp))
        .limit(10),

      // Active chats (last 24h)
      db
        .select({ count: sql<number>`count(DISTINCT ${message.chatId})::int` })
        .from(message)
        .where(gte(message.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),

      // Calculator usage breakdown
      db
        .select({
          calculatorType: calculatorUsageLog.calculatorType,
          count: sql<number>`count(*)::int`,
        })
        .from(calculatorUsageLog)
        .where(
          dateThreshold
            ? gte(calculatorUsageLog.timestamp, dateThreshold)
            : sql`true`
        )
        .groupBy(calculatorUsageLog.calculatorType),

      // Model usage breakdown
      db
        .select({
          model: agentExecutionLog.modelUsed,
          count: sql<number>`count(*)::int`,
          totalCost: sql<string>`COALESCE(SUM(${agentExecutionLog.costUsd}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${agentExecutionLog.tokensUsed}), 0)::int`,
        })
        .from(agentExecutionLog)
        .where(
          and(
            sql`${agentExecutionLog.modelUsed} IS NOT NULL`,
            dateThreshold
              ? gte(agentExecutionLog.timestamp, dateThreshold)
              : sql`true`
          )
        )
        .groupBy(agentExecutionLog.modelUsed),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers: totalUsersResult[0]?.count || 0,
        totalMessages: totalMessagesResult[0]?.count || 0,
        totalDocuments: totalDocumentsResult[0]?.count || 0,
        totalListings: totalListingsResult[0]?.count || 0,
        totalCost: parseFloat(totalCostResult[0]?.totalCost || "0"),
        totalTokens: totalTokensResult[0]?.totalTokens || 0,
        activeChats: activeChatsResult[0]?.count || 0,
      },
      recentActivity: recentActivityResult,
      calculatorUsage: calculatorUsageResult,
      modelUsage: modelUsageResult,
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
