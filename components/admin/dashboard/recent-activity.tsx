import { formatDistanceToNow } from "date-fns";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db/client";
import { adminAuditLog, user } from "@/lib/db/schema";

type RecentActivityCardProps = {
  userId: string;
};

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
      <Badge className="text-xs" variant={variant}>
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
          <p className="text-muted-foreground text-sm">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                className="flex items-start justify-between gap-4"
                key={activity.id}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getActionBadge(activity.action)}
                    <span className="font-medium text-sm">
                      {activity.targetType || "System"}
                    </span>
                  </div>
                  {activity.targetId && (
                    <p className="mt-1 font-mono text-muted-foreground text-xs">
                      ID: {activity.targetId}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-muted-foreground text-xs">
                      {activity.userEmail || "System"}
                    </p>
                    <span className="text-muted-foreground text-xs">·</span>
                    <p className="text-muted-foreground text-xs">
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
