import { eq } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import { adminUserRole } from "@/lib/db/schema";

export type AdminRole = "superadmin" | "admin" | "support" | "analyst";

export type AdminCheckResult = {
  isAdmin: boolean;
  userId: string | null;
  role: AdminRole | null;
  error?: string;
};

/**
 * Check if the current user has admin privileges
 * Returns user info if admin, or error details if not
 */
export const checkAdminAuth = async (): Promise<AdminCheckResult> => {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      isAdmin: false,
      userId: null,
      role: null,
      error: "Authentication required",
    };
  }

  const userId = session.user.id;

  // Check if user has admin role
  const adminRoles = await db
    .select()
    .from(adminUserRole)
    .where(eq(adminUserRole.userId, userId))
    .limit(1);

  if (adminRoles.length === 0) {
    return {
      isAdmin: false,
      userId,
      role: null,
      error: "Admin access required",
    };
  }

  const [adminRecord] = adminRoles;

  return {
    isAdmin: true,
    userId,
    role: adminRecord.role as AdminRole,
  };
};

/**
 * Check if admin has a specific permission level
 */
export const hasAdminPermission = (
  role: AdminRole | null,
  requiredRoles: AdminRole[]
): boolean => {
  if (!role) {
    return false;
  }
  return requiredRoles.includes(role);
};

/**
 * Permission hierarchy for admin roles
 * superadmin > admin > support > analyst
 */
export const ADMIN_ROLE_HIERARCHY: Record<AdminRole, number> = {
  superadmin: 4,
  admin: 3,
  support: 2,
  analyst: 1,
};

/**
 * Check if a role has at least the minimum required level
 */
export const hasMinimumRole = (
  role: AdminRole | null,
  minimumRole: AdminRole
): boolean => {
  if (!role) {
    return false;
  }
  return ADMIN_ROLE_HIERARCHY[role] >= ADMIN_ROLE_HIERARCHY[minimumRole];
};
