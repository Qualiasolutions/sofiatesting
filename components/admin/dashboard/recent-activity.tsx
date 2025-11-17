import { db } from "@/lib/db/client";
import { adminAuditLog, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityCardProps {
  userId: string;
}

export async function RecentActivityCard({ userId }: RecentActivityCardProps) {
  const recentActivity = await db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      targetType: adminAuditLog.targetType,
      targetId: adminAuditLog.targetId,
      timestamp: adminAuditLog.timestamp,
      changes: adminAuditLog.changes,
      userEmail: user.email,
    })
    .from(adminAuditLog)
    .leftJoin(user, eq(user.id, adminAuditLog.adminUserId))
    .orderBy(desc(adminAuditLog.timestamp))
    .limit(10);

  const getActionBadge = (action: string) => {
    const variant =
      action === "create"
        ? "default"
        : action === "update"
        ? "secondary"
        : action === "delete"
        ? "destructive"
        : "outline";

    return (
      <Badge variant={variant} className="text-xs">
        {action}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getActionBadge(activity.action)}
                    <span className="text-sm font-medium">
                      {activity.targetType || "System"}
                    </span>
                  </div>
                  {activity.targetId && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      ID: {activity.targetId}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {activity.userEmail || "System"}
                    </p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
