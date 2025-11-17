"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface SystemStatus {
  systemEnabled: boolean;
  integrations: Record<
    string,
    {
      enabled: boolean;
      lastCheck: string | null;
      lastSuccess: string | null;
      consecutiveFailures: number;
    }
  >;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/system");
      if (res.ok) {
        const json = await res.json();
        setStatus(json);
      }
    } catch (error) {
      console.error("Error fetching system status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleSystem = async (enabled: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${enabled ? "enable" : "disable"} SOFIA entirely? ${!enabled ? "This will stop all AI interactions!" : ""}`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_system", enabled }),
      });

      if (res.ok) {
        await fetchStatus();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update system status");
      }
    } catch (error) {
      console.error("Error toggling system:", error);
      alert("Failed to update system status");
    } finally {
      setUpdating(false);
    }
  };

  const toggleIntegration = async (service: string, enabled: boolean) => {
    try {
      setUpdating(true);
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_integration",
          service,
          enabled,
        }),
      });

      if (res.ok) {
        await fetchStatus();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update integration");
      }
    } catch (error) {
      console.error("Error toggling integration:", error);
      alert("Failed to update integration");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">System Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Control SOFIA's operation and integrations
        </p>
      </div>

      {/* Emergency Controls */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">
          Emergency Controls
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Use these controls to disable SOFIA entirely in case of emergency
        </p>
        <div className="flex items-center justify-between bg-white rounded-lg p-4">
          <div>
            <p className="font-bold text-lg">Global System Status</p>
            <p className="text-sm text-muted-foreground">
              {status?.systemEnabled
                ? "SOFIA is currently operational"
                : "SOFIA is currently disabled"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${
                status?.systemEnabled ? "text-green-600" : "text-red-600"
              }`}
            >
              {status?.systemEnabled ? "ENABLED" : "DISABLED"}
            </span>
            <Switch
              checked={status?.systemEnabled}
              onCheckedChange={toggleSystem}
              disabled={updating}
            />
          </div>
        </div>
      </div>

      {/* Integration Controls */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Integration Controls</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enable or disable individual integrations
        </p>
        <div className="space-y-3">
          {status?.integrations &&
            Object.entries(status.integrations).map(([service, data]) => (
              <div
                key={service}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium capitalize">{service}</p>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    {data.lastSuccess && (
                      <span>
                        Last success:{" "}
                        {new Date(data.lastSuccess).toLocaleString()}
                      </span>
                    )}
                    {data.consecutiveFailures > 0 && (
                      <span className="text-red-600">
                        {data.consecutiveFailures} consecutive failures
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-medium ${
                      data.enabled ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                  <Switch
                    checked={data.enabled}
                    onCheckedChange={(enabled) =>
                      toggleIntegration(service, enabled)
                    }
                    disabled={updating}
                  />
                </div>
              </div>
            ))}
          {(!status?.integrations ||
            Object.keys(status.integrations).length === 0) && (
            <p className="text-muted-foreground text-center py-4">
              No integrations configured yet
            </p>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-medium">
              {process.env.NODE_ENV || "development"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Irreversible actions - use with caution
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() =>
              alert("Cache clearing functionality will be implemented")
            }
          >
            Clear All Caches
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() =>
              alert("This would restart all services (not implemented)")
            }
          >
            Restart Services
          </Button>
        </div>
      </div>
    </div>
  );
}
