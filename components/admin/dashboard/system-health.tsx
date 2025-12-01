import { desc, gte } from "drizzle-orm";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db/client";
import { systemHealthLog } from "@/lib/db/schema";

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
          <p className="text-muted-foreground text-sm">
            No health events in the last hour
          </p>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recent Events</h4>
            {recentLogs.map((log) => {
              const isHealthy = log.status === "healthy";
              const isDegraded = log.status === "degraded";
              return (
                <div className="flex items-start gap-2" key={log.id}>
                  {isHealthy ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isDegraded ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">
                      {log.service.replace(/_/g, " ")}
                    </p>
                    {log.details && (
                      <p className="text-muted-foreground text-xs">
                        {log.details}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
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
