import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import { adminUserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Admin Setup Endpoint
 * Creates the first superadmin user
 * This endpoint can only be used once per user
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is already an admin
    const existingAdmin = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, session.user.id));

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        {
          error: "User is already an admin",
          role: existingAdmin[0].role,
        },
        { status: 400 }
      );
    }

    // Create superadmin role with full permissions
    const [newAdmin] = await db
      .insert(adminUserRole)
      .values({
        userId: session.user.id,
        role: "superadmin",
        permissions: {
          view_system_health: true,
          manage_integrations: true,
          manage_calculators: true,
          view_agent_logs: true,
          view_analytics: true,
          manage_users: true,
          view_audit_logs: true,
          manage_settings: true,
        },
        createdAt: new Date(),
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Superadmin role created successfully",
      admin: {
        userId: newAdmin.userId,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin role" },
      { status: 500 }
    );
  }
}

/**
 * Get current admin status
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminRole = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, session.user.id));

    if (adminRole.length === 0) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({
      isAdmin: true,
      role: adminRole[0].role,
      permissions: adminRole[0].permissions,
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
