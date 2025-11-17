import { Suspense } from "react";
import { AgentExecutionTable } from "@/components/admin/agents/execution-table";
import { AgentMetrics } from "@/components/admin/agents/metrics";
import { LoadingCard } from "@/components/admin/dashboard/loading-card";

// Force dynamic rendering to avoid build-time database connections
export const dynamic = "force-dynamic";

export default function AgentLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Monitoring</h1>
        <p className="text-muted-foreground">
          Track AI agent executions, performance metrics, and conversation logs
        </p>
      </div>

      <Suspense fallback={<LoadingCard />}>
        <AgentMetrics />
      </Suspense>

      <Suspense fallback={<LoadingCard />}>
        <AgentExecutionTable />
      </Suspense>
    </div>
  );
}
