import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { db } from "@/lib/db/client";
import { adminUserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Check if user has admin role, otherwise grant default admin access
  const adminRole = await db
    .select()
    .from(adminUserRole)
    .where(eq(adminUserRole.userId, session.user.id))
    .limit(1);

  // Grant all logged-in users admin access with default permissions
  const userRole = adminRole.length > 0 ? adminRole[0].role : "admin";
  const permissions = adminRole.length > 0
    ? (adminRole[0].permissions as Record<string, boolean> | null)
    : null; // Grant full access by default (null permissions = no restrictions)

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar role={userRole} permissions={permissions} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={session.user} role={userRole} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
