import { formatDistanceToNow } from "date-fns";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db/client";
import { agentExecutionLog, user } from "@/lib/db/schema";

export async function AgentExecutionTable() {
  const executions = await db
    .select({
      id: agentExecutionLog.id,
      timestamp: agentExecutionLog.timestamp,
      modelUsed: agentExecutionLog.modelUsed,
      agentType: agentExecutionLog.agentType,
      action: agentExecutionLog.action,
      success: agentExecutionLog.success,
      tokensUsed: agentExecutionLog.tokensUsed,
      durationMs: agentExecutionLog.durationMs,
      errorMessage: agentExecutionLog.errorMessage,
      userEmail: user.email,
    })
    .from(agentExecutionLog)
    .leftJoin(user, eq(user.id, agentExecutionLog.userId))
    .orderBy(desc(agentExecutionLog.timestamp))
    .limit(50);

  const getStatusBadge = (success: boolean) => {
    const variant = success ? "default" : "destructive";

    return (
      <Badge className="text-xs" variant={variant}>
        {success ? "success" : "error"}
      </Badge>
    );
  };

  const formatTokens = (tokens: number | null) => {
    if (tokens === null) {
      return "N/A";
    }
    return tokens.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Agent Executions</CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No agent executions logged yet
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Agent Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDistanceToNow(new Date(execution.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.userEmail || "Guest"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {execution.agentType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.action}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {execution.modelUsed || "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(execution.success)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatTokens(execution.tokensUsed)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {execution.durationMs
                        ? `${execution.durationMs}ms`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
