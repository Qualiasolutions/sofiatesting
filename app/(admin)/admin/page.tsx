import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/admin/dashboard/overview";
import { SystemHealthCard } from "@/components/admin/dashboard/system-health";
import { RecentActivityCard } from "@/components/admin/dashboard/recent-activity";
import { QuickActionsCard } from "@/components/admin/dashboard/quick-actions";
import { LoadingCard } from "@/components/admin/dashboard/loading-card";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor SOFIA AI Assistant system health and performance
        </p>
      </div>

      <Suspense fallback={<LoadingCard />}>
        <DashboardOverview userId={session.user.id} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<LoadingCard />}>
          <SystemHealthCard />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <QuickActionsCard />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingCard />}>
        <RecentActivityCard userId={session.user.id} />
      </Suspense>
    </div>
  );
}
