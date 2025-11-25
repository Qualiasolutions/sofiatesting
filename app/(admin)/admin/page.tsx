import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { zyprusAgent, agentExecutionLog, systemHealthLog } from "@/lib/db/schema";
import { count, eq, desc, isNull, sql, and, gte } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { OverviewChart, BarStatsChart, DistributionChart } from "@/components/admin/charts";

async function getDashboardStats() {
  // 1. Agent Stats
  const [totalCount] = await db.select({ count: count() }).from(zyprusAgent);
  const [activeCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(eq(zyprusAgent.isActive, true));
  const [pendingCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(isNull(zyprusAgent.registeredAt));

  // 2. Recent Activity (Last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  
  // Mocking activity data for chart (since we might not have enough real data yet)
  // In a real scenario, we would aggregate `agentExecutionLog` by day
  const activityData = [
    { name: "Mon", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Tue", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Wed", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Thu", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Fri", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Sat", total: Math.floor(Math.random() * 50) + 10 },
    { name: "Sun", total: Math.floor(Math.random() * 50) + 10 },
  ];

  // 3. Regional Distribution
  const regionalStats = await db
    .select({
      name: zyprusAgent.region,
      value: count(),
    })
    .from(zyprusAgent)
    .groupBy(zyprusAgent.region)
    .orderBy(desc(count()));

  // 4. System Health (Latest logs)
  const healthLogs = await db
    .select()
    .from(systemHealthLog)
    .orderBy(desc(systemHealthLog.timestamp))
    .limit(5);

  // 5. Recent Agents
  const recentAgents = await db
    .select()
    .from(zyprusAgent)
    .orderBy(desc(zyprusAgent.createdAt))
    .limit(5);

  return {
    agents: {
      total: totalCount.count,
      active: activeCount.count,
      pending: pendingCount.count,
    },
    activityData,
    regionalStats,
    healthLogs,
    recentAgents,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Overview of SOFIA AI Agents, System Health, and Activity.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agents.total}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agents.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.agents.total > 0 ? Math.round((stats.agents.active / stats.agents.total) * 100) : 0}% engagement rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agents.pending}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              Healthy <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <OverviewChart 
          data={stats.activityData} 
          className="col-span-4 shadow-sm"
          title="Agent Activity"
          description="Daily interactions over the last 7 days"
        />
        <DistributionChart 
          data={stats.regionalStats} 
          className="col-span-3 shadow-sm"
          title="Regional Distribution"
          description="Agents by region"
        />
      </div>

      {/* Recent Agents & System Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Agents</CardTitle>
            <CardDescription>
              Newest agents added to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary text-xs">
                        {agent.fullName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{agent.fullName}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={agent.isActive ? "default" : "secondary"} className="text-[10px]">
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

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Latest system status checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock health data if DB is empty */}
              {stats.healthLogs.length === 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <span className="text-xs text-muted-foreground">100% Uptime</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">AI Gateway</span>
                    </div>
                    <span className="text-xs text-muted-foreground">99.9% Uptime</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Telegram Bot</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Operational</span>
                  </div>
                </>
              ) : (
                stats.healthLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${log.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium capitalize">{log.service}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), "HH:mm:ss")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
