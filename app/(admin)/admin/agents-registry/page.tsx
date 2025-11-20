import { Suspense } from "react";
import { db } from "@/lib/db/client";
import { zyprusAgent } from "@/lib/db/schema";
import { desc, count, eq, isNull } from "drizzle-orm";
import { AgentsRegistryClient } from "./page-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    region?: string;
    role?: string;
    isActive?: string;
    search?: string;
  }>;
}

interface SearchParams {
  page?: string;
  limit?: string;
  region?: string;
  role?: string;
  isActive?: string;
  search?: string;
}

async function getAgentsData(searchParams: SearchParams) {
  const page = Number.parseInt(searchParams.page || "1");
  const limit = Number.parseInt(searchParams.limit || "50");
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];
  if (searchParams.region) {
    conditions.push(eq(zyprusAgent.region, searchParams.region));
  }
  if (searchParams.role) {
    conditions.push(eq(zyprusAgent.role, searchParams.role));
  }
  if (searchParams.isActive !== undefined) {
    conditions.push(eq(zyprusAgent.isActive, searchParams.isActive === "true"));
  }

  // Get agents
  const agents = await db
    .select()
    .from(zyprusAgent)
    .orderBy(desc(zyprusAgent.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [totalCount] = await db.select({ count: count() }).from(zyprusAgent);

  // Get metrics
  const [activeCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(eq(zyprusAgent.isActive, true));

  const [registeredCount] = await db
    .select({ count: count() })
    .from(zyprusAgent)
    .where(isNull(zyprusAgent.registeredAt));

  return {
    agents,
    pagination: {
      page,
      limit,
      total: totalCount.count,
      totalPages: Math.ceil(totalCount.count / limit),
    },
    metrics: {
      total: totalCount.count,
      active: activeCount.count,
      pending: registeredCount.count,
    },
  };
}

export default async function AgentsRegistryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getAgentsData(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents Registry</h1>
          <p className="text-muted-foreground">
            Manage Zyprus real estate agents across all platforms
          </p>
        </div>
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total Agents
              </span>
              <span className="text-3xl font-bold">{data.metrics.total}</span>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Active Agents
              </span>
              <span className="text-3xl font-bold text-green-600">
                {data.metrics.active}
              </span>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pending Registration
              </span>
              <span className="text-3xl font-bold text-orange-600">
                {data.metrics.pending}
              </span>
            </div>
          </Card>
        </div>
      </Suspense>

      <AgentsRegistryClient
        initialAgents={data.agents}
        initialPagination={data.pagination}
        searchParams={params}
      />
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
