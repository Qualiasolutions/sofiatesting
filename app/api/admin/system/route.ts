import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import { adminUserRole, integrationStatus, adminAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * System Control API
 * Manages global system on/off toggles and integration controls
 */

const SYSTEM_ENABLED_KEY = "sofia:system:enabled";
const DEFAULT_SYSTEM_STATE = true;

/**
 * Get system status
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

    // Get system enabled status from Redis
    const systemEnabled = (await kv.get(SYSTEM_ENABLED_KEY)) ?? DEFAULT_SYSTEM_STATE;

    // Get all integration statuses
    const integrations = await db.select().from(integrationStatus).execute();

    return NextResponse.json({
      systemEnabled,
      integrations: integrations.reduce(
        (acc, integration) => {
          acc[integration.service] = {
            enabled: integration.isEnabled,
            lastCheck: integration.lastCheckAt,
            lastSuccess: integration.lastSuccessAt,
            consecutiveFailures: integration.consecutiveFailures,
            config: integration.config,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    });
  } catch (error) {
    console.error("Error fetching system status:", error);
    return NextResponse.json(
      { error: "Failed to fetch system status" },
      { status: 500 }
    );
  }
}

/**
 * Update system status
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
    if (!permissions?.manage_settings) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, service, enabled } = body;

    if (action === "toggle_system") {
      // Toggle entire system on/off
      const newState = typeof enabled === "boolean" ? enabled : !DEFAULT_SYSTEM_STATE;
      await kv.set(SYSTEM_ENABLED_KEY, newState);

      // Log audit event
      await db.insert(adminAuditLog).values({
        adminUserId: session.user.id,
        action: "system_toggle",
        targetType: "system",
        targetId: "sofia",
        changes: {
          enabled: newState,
          previousState: !newState,
        },
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `System ${newState ? "enabled" : "disabled"} successfully`,
        systemEnabled: newState,
      });
    }

    if (action === "toggle_integration") {
      // Toggle specific integration
      if (!service) {
        return NextResponse.json(
          { error: "Service name required" },
          { status: 400 }
        );
      }

      // Check if integration exists
      const existing = await db
        .select()
        .from(integrationStatus)
        .where(eq(integrationStatus.service, service));

      if (existing.length === 0) {
        // Create new integration status
        await db.insert(integrationStatus).values({
          service,
          isEnabled: enabled ?? true,
          lastCheckAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update existing integration
        await db
          .update(integrationStatus)
          .set({
            isEnabled: enabled ?? !existing[0].isEnabled,
            updatedAt: new Date(),
          })
          .where(eq(integrationStatus.service, service));
      }

      // Log audit event
      await db.insert(adminAuditLog).values({
        adminUserId: session.user.id,
        action: "integration_toggle",
        targetType: "integration",
        targetId: service,
        changes: {
          enabled: enabled ?? !existing[0]?.isEnabled,
          previousState: existing[0]?.isEnabled,
        },
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Integration ${service} ${enabled ? "enabled" : "disabled"}`,
        service,
        enabled: enabled ?? !existing[0]?.isEnabled,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating system status:", error);
    return NextResponse.json(
      { error: "Failed to update system status" },
      { status: 500 }
    );
  }
}
