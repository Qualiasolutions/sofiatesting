import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import {
  adminUserRole,
  user,
  userActivitySummary,
  agentExecutionLog,
} from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Admin Users API
 * Manages user viewing and admin role assignment
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get all users with their admin roles and recent activity
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      })
      .from(user)
      .where(sql`${user.deletedAt} IS NULL`)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Get admin roles for these users
    const userIds = users.map((u) => u.id);
    const adminRoles = await db
      .select()
      .from(adminUserRole)
      .where(sql`${adminUserRole.userId} IN ${userIds}`);

    // Get recent activity summaries (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activitySummaries = await db
      .select({
        userId: userActivitySummary.userId,
        totalMessages: sql<number>`SUM(${userActivitySummary.messageCount})::int`,
        totalDocuments: sql<number>`SUM(${userActivitySummary.documentCount})::int`,
        totalCost: sql<string>`SUM(${userActivitySummary.totalCostUsd})`,
        totalTokens: sql<number>`SUM(${userActivitySummary.totalTokensUsed})::int`,
      })
      .from(userActivitySummary)
      .where(gte(userActivitySummary.date, sevenDaysAgo))
      .groupBy(userActivitySummary.userId);

    // Get total user count
    const [{ count: totalUsers }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(sql`${user.deletedAt} IS NULL`);

    // Combine data
    const enrichedUsers = users.map((u) => {
      const admin = adminRoles.find((a) => a.userId === u.id);
      const activity = activitySummaries.find((a) => a.userId === u.id);

      return {
        ...u,
        isAdmin: !!admin,
        adminRole: admin?.role || null,
        permissions: admin?.permissions || null,
        recentActivity: {
          messages: activity?.totalMessages || 0,
          documents: activity?.totalDocuments || 0,
          cost: parseFloat(activity?.totalCost || "0"),
          tokens: activity?.totalTokens || 0,
        },
      };
    });

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * Manage user admin roles
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role and permissions
    const adminRole = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, session.user.id));

    if (adminRole.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissions = adminRole[0].permissions as any;
    if (!permissions?.manage_users && adminRole[0].role !== "superadmin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId, role, customPermissions } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (action === "promote") {
      // Promote user to admin
      const newRole = role || "admin";
      const defaultPermissions = {
        view_system_health: true,
        manage_integrations: newRole === "superadmin",
        manage_calculators: newRole === "superadmin" || newRole === "admin",
        view_agent_logs: true,
        view_analytics: true,
        manage_users: newRole === "superadmin",
        view_audit_logs: newRole === "superadmin" || newRole === "admin",
        manage_settings: newRole === "superadmin",
      };

      // Check if user already has admin role
      const existing = await db
        .select()
        .from(adminUserRole)
        .where(eq(adminUserRole.userId, userId));

      if (existing.length > 0) {
        // Update existing role
        await db
          .update(adminUserRole)
          .set({
            role: newRole,
            permissions: customPermissions || defaultPermissions,
          })
          .where(eq(adminUserRole.userId, userId));
      } else {
        // Create new admin role
        await db.insert(adminUserRole).values({
          userId,
          role: newRole,
          permissions: customPermissions || defaultPermissions,
          createdAt: new Date(),
          createdBy: session.user.id,
        });
      }

      return NextResponse.json({
        success: true,
        message: `User promoted to ${newRole}`,
      });
    }

    if (action === "demote") {
      // Remove admin role
      await db.delete(adminUserRole).where(eq(adminUserRole.userId, userId));

      return NextResponse.json({
        success: true,
        message: "Admin role removed",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing user role:", error);
    return NextResponse.json(
      { error: "Failed to manage user role" },
      { status: 500 }
    );
  }
}
