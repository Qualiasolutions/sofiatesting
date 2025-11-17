import { db } from "@/lib/db/client";
import { agentExecutionLog } from "@/lib/db/schema";
import { sql, gte, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Clock, CheckCircle2, XCircle } from "lucide-react";

export async function AgentMetrics() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const [totalExecutions, successfulExecutions, avgDuration, recentFailures] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentExecutionLog)
        .where(gte(agentExecutionLog.timestamp, oneDayAgo))
        .then((r) => r[0]?.count || 0),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentExecutionLog)
        .where(
          and(
            gte(agentExecutionLog.timestamp, oneDayAgo),
            sql`${agentExecutionLog.success} = true`
          )
        )
        .then((r) => r[0]?.count || 0),

      db
        .select({
          avg: sql<number>`COALESCE(AVG(${agentExecutionLog.durationMs}), 0)::int`,
        })
        .from(agentExecutionLog)
        .where(
          and(
            gte(agentExecutionLog.timestamp, oneDayAgo),
            sql`${agentExecutionLog.durationMs} IS NOT NULL`
          )
        )
        .then((r) => r[0]?.avg || 0),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentExecutionLog)
        .where(
          and(
            gte(agentExecutionLog.timestamp, oneDayAgo),
            sql`${agentExecutionLog.success} = false`
          )
        )
        .then((r) => r[0]?.count || 0),
    ]);

  const successRate =
    totalExecutions > 0
      ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
      : "0.0";

  const metrics = [
    {
      title: "Total Executions (24h)",
      value: totalExecutions.toLocaleString(),
      description: "Agent interactions",
      icon: Bot,
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: `${successfulExecutions} successful`,
      icon: CheckCircle2,
    },
    {
      title: "Avg Duration",
      value: `${avgDuration}ms`,
      description: "Last 24 hours",
      icon: Clock,
    },
    {
      title: "Failures (24h)",
      value: recentFailures.toLocaleString(),
      description: "Error executions",
      icon: XCircle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
