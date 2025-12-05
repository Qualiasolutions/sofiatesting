// Prevent static generation - this page needs real-time data
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { and, desc, eq, sql } from "drizzle-orm";
import { Download, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db/client";
import { agentExecutionLog } from "@/lib/db/schema";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    agentType?: string;
    status?: string;
    search?: string;
  }>;
};

async function getLogs(searchParams: {
  page?: string;
  agentType?: string;
  status?: string;
  search?: string;
}) {
  const page = Number(searchParams.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (searchParams.agentType) {
    conditions.push(eq(agentExecutionLog.agentType, searchParams.agentType));
  }
  if (searchParams.status) {
    conditions.push(
      eq(agentExecutionLog.success, searchParams.status === "success")
    );
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
          <h2 className="font-bold text-3xl tracking-tight">Agent Logs</h2>
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
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search actions..." />
              </div>
              <Button size="icon" variant="outline">
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
                    <TableCell
                      className="py-8 text-center text-muted-foreground"
                      colSpan={8}
                    >
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.logs.map((log) => (
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      key={log.id}
                    >
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.agentType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.modelUsed || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.durationMs ? `${log.durationMs}ms` : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.tokensUsed?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.costUsd
                          ? `$${Number(log.costUsd).toFixed(6)}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge
                            className="border-green-200 bg-green-50 text-green-700"
                            variant="outline"
                          >
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
            <Button disabled={data.page <= 1} size="sm" variant="outline">
              Previous
            </Button>
            <div className="text-muted-foreground text-sm">
              Page {data.page} of {data.totalPages}
            </div>
            <Button
              disabled={data.page >= data.totalPages}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
