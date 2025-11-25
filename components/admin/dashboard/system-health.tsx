import { db } from "@/lib/db/client";
import { systemHealthLog } from "@/lib/db/schema";
import { desc, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export async function SystemHealthCard() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Get recent health logs
  const recentLogs = await db
    .select()
    .from(systemHealthLog)
    .where(gte(systemHealthLog.timestamp, oneHourAgo))
    .orderBy(desc(systemHealthLog.timestamp))
    .limit(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No health events in the last hour
          </p>
        ) : (
          <div className="space-y-3">
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
