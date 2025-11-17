"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  changes: any;
  ipAddress: string | null;
  timestamp: string;
}

interface AuditResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [timeRange, setTimeRange] = useState("7d");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/logs?type=audit&page=${page}&limit=50&timeRange=${timeRange}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, timeRange]);

  if (loading && !data) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative actions and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("24h")}
          >
            24h
          </Button>
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
          >
            7d
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
          >
            30d
          </Button>
          <Button
            variant={timeRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("all")}
          >
            All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Actions</p>
          <p className="text-2xl font-bold">{data?.pagination.total || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Time Range</p>
          <p className="text-2xl font-bold capitalize">{timeRange}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Page</p>
          <p className="text-2xl font-bold">
            {data?.pagination.page} / {data?.pagination.totalPages || 1}
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-card border rounded-lg">
        {data?.logs && data.logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.adminEmail || (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{log.targetType}</p>
                      <p className="text-muted-foreground text-xs">
                        {log.targetId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.changes && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:underline">
                          View changes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-w-md">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </details>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ipAddress || (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-2">
              No audit logs found
            </p>
            <p className="text-sm text-muted-foreground">
              Admin actions will appear here
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
