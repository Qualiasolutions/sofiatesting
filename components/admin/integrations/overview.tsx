import { db } from "@/lib/db/client";
import { integrationStatus } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export async function IntegrationsOverview() {
  const integrations = await db.select().from(integrationStatus);

  const getStatusIcon = (isEnabled: boolean, hasFailures: boolean) => {
    if (!isEnabled) return <Clock className="h-5 w-5 text-gray-500" />;
    if (hasFailures) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (isEnabled: boolean, hasFailures: boolean) => {
    if (!isEnabled) {
      return (
        <Badge variant="secondary" className="text-xs">
          disabled
        </Badge>
      );
    }
    const variant = hasFailures ? "destructive" : "default";
    return (
      <Badge variant={variant} className="text-xs">
        {hasFailures ? "degraded" : "active"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No integration data available. Integrations will be populated as
            they are checked.
          </p>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.service}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(
                    integration.isEnabled,
                    integration.consecutiveFailures > 0
                  )}
                  <div>
                    <h4 className="font-semibold capitalize">
                      {integration.service.replace(/_/g, " ")}
                    </h4>
                    {integration.errorLog && (
                      <p className="text-sm text-muted-foreground">
                        {integration.errorLog}
                      </p>
                    )}
                    {integration.lastCheckAt && (
                      <p className="text-xs text-muted-foreground">
                        Last checked:{" "}
                        {formatDistanceToNow(new Date(integration.lastCheckAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                    {integration.consecutiveFailures > 0 && (
                      <p className="text-xs text-destructive">
                        Consecutive failures: {integration.consecutiveFailures}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(
                    integration.isEnabled,
                    integration.consecutiveFailures > 0
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
