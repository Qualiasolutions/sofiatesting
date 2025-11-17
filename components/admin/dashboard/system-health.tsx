import { db } from "@/lib/db/client";
import { systemHealthLog, integrationStatus } from "@/lib/db/schema";
import { desc, and, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export async function SystemHealthCard() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Get integration status
  const integrations = await db
    .select()
    .from(integrationStatus)
    .orderBy(desc(integrationStatus.lastCheckAt))
    .limit(10);

  // Get recent health logs
  const recentLogs = await db
    .select()
    .from(systemHealthLog)
    .where(gte(systemHealthLog.timestamp, oneHourAgo))
    .orderBy(desc(systemHealthLog.timestamp))
    .limit(5);

  const getStatusIcon = (isEnabled: boolean, hasRecentFailures: boolean) => {
    if (!isEnabled) return <Clock className="h-4 w-4 text-gray-500" />;
    if (hasRecentFailures)
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (isEnabled: boolean, hasRecentFailures: boolean) => {
    if (!isEnabled) {
      return (
        <Badge variant="secondary" className="text-xs">
          disabled
        </Badge>
      );
    }
    const variant = hasRecentFailures ? "secondary" : "default";
    return (
      <Badge variant={variant} className="text-xs">
        {hasRecentFailures ? "issues" : "active"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No integration data available
          </p>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Integrations</h4>
            {integrations.map((integration) => (
              <div
                key={integration.service}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    integration.isEnabled,
                    integration.consecutiveFailures > 0
                  )}
                  <span className="text-sm font-medium capitalize">
                    {integration.service.replace(/_/g, " ")}
                  </span>
                </div>
                {getStatusBadge(
                  integration.isEnabled,
                  integration.consecutiveFailures > 0
                )}
              </div>
            ))}
          </div>
        )}

        {recentLogs.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-semibold">Recent Events</h4>
            {recentLogs.map((log) => {
              const isHealthy = log.status === "healthy";
              const isDegraded = log.status === "degraded";
              return (
                <div key={log.id} className="flex items-start gap-2">
                  {isHealthy ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isDegraded ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {log.service.replace(/_/g, " ")}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground">
                        {log.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
