import { Suspense } from "react";
import { db } from "@/lib/db/client";
import { agentExecutionLog, zyprusAgent } from "@/lib/db/schema";
import { desc, eq, and, like, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    agentType?: string;
    status?: string;
    search?: string;
  }>;
}

async function getLogs(searchParams: { page?: string; agentType?: string; status?: string; search?: string }) {
  const page = Number(searchParams.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (searchParams.agentType) {
    conditions.push(eq(agentExecutionLog.agentType, searchParams.agentType));
  }
  if (searchParams.status) {
    conditions.push(eq(agentExecutionLog.success, searchParams.status === "success"));
  }
  // Note: search implementation would depend on what we're searching (e.g., action name)

  const logs = await db
    .select({
      id: agentExecutionLog.id,
      timestamp: agentExecutionLog.timestamp,
      agentType: agentExecutionLog.agentType,
      action: agentExecutionLog.action,
      durationMs: agentExecutionLog.durationMs,
      tokensUsed: agentExecutionLog.tokensUsed,
      costUsd: agentExecutionLog.costUsd,
      success: agentExecutionLog.success,
      errorMessage: agentExecutionLog.errorMessage,
      modelUsed: agentExecutionLog.modelUsed,
    })
    .from(agentExecutionLog)
    .where(and(...conditions))
    .orderBy(desc(agentExecutionLog.timestamp))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentExecutionLog)
    .where(and(...conditions));

  return {
    logs,
    total: Number(countResult.count),
    page,
    totalPages: Math.ceil(Number(countResult.count) / limit),
  };
}

export default async function LogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getLogs(params);

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Logs</h2>
          <p className="text-muted-foreground">
            Detailed execution logs of all agent interactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Execution History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search actions..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Agent Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.agentType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.modelUsed || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.durationMs ? `${log.durationMs}ms` : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.tokensUsed?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.costUsd ? `$${Number(log.costUsd).toFixed(6)}` : "-"}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Simple Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" disabled={data.page <= 1}>
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </div>
            <Button variant="outline" size="sm" disabled={data.page >= data.totalPages}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
