import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import {
  adminUserRole,
  agentExecutionLog,
  adminAuditLog,
  whatsappConversation,
  user,
} from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Admin Logs API
 * Returns agent execution logs, audit logs, and WhatsApp conversations
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
    const type = searchParams.get("type") || "agent"; // agent, audit, whatsapp
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const agentType = searchParams.get("agentType");
    const timeRange = searchParams.get("timeRange") || "7d";

    // Calculate date threshold
    let dateThreshold: Date | null = null;
    if (timeRange === "24h") {
      dateThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (timeRange === "7d") {
      dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    if (type === "agent") {
      // Get agent execution logs
      const whereConditions = [
        dateThreshold ? gte(agentExecutionLog.timestamp, dateThreshold) : sql`true`,
        agentType ? eq(agentExecutionLog.agentType, agentType) : sql`true`,
      ];

      const logs = await db
        .select()
        .from(agentExecutionLog)
        .where(and(...whereConditions))
        .orderBy(desc(agentExecutionLog.timestamp))
        .limit(limit)
        .offset(offset);

      const [{ count: total }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentExecutionLog)
        .where(and(...whereConditions));

      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (type === "audit") {
      // Get audit logs
      const whereConditions = [
        dateThreshold ? gte(adminAuditLog.timestamp, dateThreshold) : sql`true`,
      ];

      const logs = await db
        .select({
          id: adminAuditLog.id,
          adminUserId: adminAuditLog.adminUserId,
          adminEmail: user.email,
          action: adminAuditLog.action,
          targetType: adminAuditLog.targetType,
          targetId: adminAuditLog.targetId,
          changes: adminAuditLog.changes,
          ipAddress: adminAuditLog.ipAddress,
          timestamp: adminAuditLog.timestamp,
        })
        .from(adminAuditLog)
        .leftJoin(user, eq(adminAuditLog.adminUserId, user.id))
        .where(and(...whereConditions))
        .orderBy(desc(adminAuditLog.timestamp))
        .limit(limit)
        .offset(offset);

      const [{ count: total }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminAuditLog)
        .where(and(...whereConditions));

      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (type === "whatsapp") {
      // Get WhatsApp conversations
      const conversations = await db
        .select({
          id: whatsappConversation.id,
          phoneNumber: whatsappConversation.phoneNumber,
          userId: whatsappConversation.userId,
          userEmail: user.email,
          status: whatsappConversation.status,
          metadata: whatsappConversation.metadata,
          createdAt: whatsappConversation.createdAt,
          lastMessageAt: whatsappConversation.lastMessageAt,
        })
        .from(whatsappConversation)
        .leftJoin(user, eq(whatsappConversation.userId, user.id))
        .orderBy(desc(whatsappConversation.lastMessageAt))
        .limit(limit)
        .offset(offset);

      const [{ count: total }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(whatsappConversation);

      return NextResponse.json({
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({ error: "Invalid log type" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
