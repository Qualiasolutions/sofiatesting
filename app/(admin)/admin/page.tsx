import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { zyprusAgent } from "@/lib/db/schema";
import { count, eq, desc, isNull, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

async function getAgentStats() {
  // Total agents
  const [totalCount] = await db.select({ count: count() }).from(zyprusAgent);

  // Active agents
  const [activeCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(eq(zyprusAgent.isActive, true));

  // Pending registration
  const [pendingCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(isNull(zyprusAgent.registeredAt));

  // Registered agents
  const [registeredCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(sql`${zyprusAgent.registeredAt} IS NOT NULL`);

  // Regional breakdown
  const regionalStats = await db
    .select({
      region: zyprusAgent.region,
      count: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${zyprusAgent.isActive} then 1 else 0 end)`,
    })
    .from(zyprusAgent)
    .groupBy(zyprusAgent.region)
    .orderBy(sql`count(*) DESC`);

  // Recent agents (last 10)
  const recentAgents = await db
    .select()
    .from(zyprusAgent)
    .orderBy(desc(zyprusAgent.createdAt))
    .limit(10);

  // Platform connections
  const [platformStats] = await db
    .select({
      withWeb: sql<number>`sum(case when ${zyprusAgent.registeredAt} IS NOT NULL then 1 else 0 end)`,
      withTelegram: sql<number>`sum(case when ${zyprusAgent.telegramUserId} IS NOT NULL then 1 else 0 end)`,
      withWhatsApp: sql<number>`sum(case when ${zyprusAgent.whatsappPhoneNumber} IS NOT NULL then 1 else 0 end)`,
    })
    .from(zyprusAgent);

  return {
    total: totalCount.count,
    active: activeCount.count,
    pending: pendingCount.count,
    registered: registeredCount.count,
    regionalStats,
    recentAgents,
    platformStats,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const stats = await getAgentStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor SOFIA AI Assistant and Zyprus Agent Registry
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all regions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.active / stats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.registered}</div>
            <p className="text-xs text-muted-foreground">
              Web accounts created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting registration
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Regional Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
            <CardDescription>Agents by region with activity status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.regionalStats.map((region) => (
                <div key={region.region} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{region.region}</span>
                      <span className="text-xs text-muted-foreground">
                        {region.active} active of {region.count} total
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {Math.round((region.active / region.count) * 100)}% active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
            <CardDescription>Multi-platform integration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Web Platform</span>
                    <span className="text-xs text-muted-foreground">Registered accounts</span>
                  </div>
                </div>
                <Badge variant="default">{stats.platformStats.withWeb} agents</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900">
                    <MessageSquare className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Telegram</span>
                    <span className="text-xs text-muted-foreground">Linked accounts</span>
                  </div>
                </div>
                <Badge variant="secondary">{stats.platformStats.withTelegram} agents</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">WhatsApp</span>
                    <span className="text-xs text-muted-foreground">Linked accounts</span>
                  </div>
                </div>
                <Badge variant="secondary">{stats.platformStats.withWhatsApp} agents</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Agents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Agents</CardTitle>
            <CardDescription>Latest agents added to the system</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/agents-registry">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{agent.fullName}</span>
                  <span className="text-sm text-muted-foreground">{agent.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{agent.region}</Badge>
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(agent.createdAt), "MMM dd")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/agents-registry">
                <Users className="mr-2 h-4 w-4" />
                Manage Agents
              </Link>
            </Button>
            <Button variant="outline" className="justify-start">
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Agent
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Import from Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
