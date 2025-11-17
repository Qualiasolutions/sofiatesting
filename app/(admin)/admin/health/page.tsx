import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { adminUserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getHealthData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/health`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function HealthPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user is admin
  const adminRole = await db
    .select()
    .from(adminUserRole)
    .where(eq(adminUserRole.userId, session.user.id));

  if (!adminRole || adminRole.length === 0) {
    redirect("/");
  }

  const healthData = await getHealthData();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-muted-foreground">Monitor service health and uptime</p>
      </div>

      {/* Overall Status */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-4 h-4 rounded-full ${
              healthData?.overall === "healthy"
                ? "bg-green-500"
                : healthData?.overall === "degraded"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <div>
            <h2 className="text-2xl font-bold capitalize">
              {healthData?.overall || "Unknown"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Last checked: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Service Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {healthData?.services &&
          Object.entries(healthData.services).map(([service, data]: [string, any]) => (
            <div key={service} className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold capitalize">{service}</h3>
                <div
                  className={`w-3 h-3 rounded-full ${
                    data.status === "healthy"
                      ? "bg-green-500"
                      : data.status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
              </div>
              <p className="text-sm text-muted-foreground capitalize mb-1">
                Status: {data.status}
              </p>
              {data.responseTime > 0 && (
                <p className="text-sm text-muted-foreground">
                  Response: {data.responseTime}ms
                </p>
              )}
            </div>
          ))}
      </div>

      {/* Integration Status */}
      {healthData?.integrations && healthData.integrations.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Integration Status</h2>
          <div className="space-y-3">
            {healthData.integrations.map((integration: any) => (
              <div
                key={integration.service}
                className="flex items-center justify-between p-3 bg-muted/50 rounded"
              >
                <div>
                  <p className="font-medium capitalize">{integration.service}</p>
                  <p className="text-sm text-muted-foreground">
                    Last success:{" "}
                    {integration.lastSuccessAt
                      ? new Date(integration.lastSuccessAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      integration.isEnabled ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {integration.isEnabled ? "Enabled" : "Disabled"}
                  </p>
                  {integration.consecutiveFailures > 0 && (
                    <p className="text-sm text-red-600">
                      {integration.consecutiveFailures} failures
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Health Logs */}
      {healthData?.recentLogs && healthData.recentLogs.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Health Checks</h2>
          <div className="space-y-2">
            {healthData.recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.status === "healthy"
                        ? "bg-green-500"
                        : log.status === "degraded"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium capitalize">{log.service}</span>
                  <span className="text-muted-foreground capitalize">
                    {log.status}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
