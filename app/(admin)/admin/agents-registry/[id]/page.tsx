// Prevent static generation - this page needs real-time data
export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db/client";
import { zyprusAgent } from "@/lib/db/schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getAgentDetails(id: string) {
  const [agent] = await db
    .select()
    .from(zyprusAgent)
    .where(eq(zyprusAgent.id, id));

  if (!agent) {
    return null;
  }

  // Get recent logs for this agent (mocked if no logs yet)
  // In real implementation:
  // const logs = await db.select().from(agentExecutionLog).where(eq(agentExecutionLog.userId, agent.userId)).orderBy(desc(agentExecutionLog.timestamp)).limit(10);

  const logs: any[] = []; // Placeholder

  return { agent, logs };
}

export default async function AgentDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAgentDetails(id);

  if (!data) {
    notFound();
  }

  const { agent, logs } = data;

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button asChild size="icon" variant="outline">
          <Link href="/admin/agents-registry">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-bold text-3xl tracking-tight">
            {agent.fullName}
          </h2>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Badge variant="outline">{agent.role}</Badge>
            <span className="text-sm">•</span>
            <span className="text-sm">{agent.email}</span>
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            className="px-4 py-1 text-base"
            variant={agent.isActive ? "default" : "destructive"}
          >
            {agent.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{agent.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{agent.phoneNumber || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{agent.region}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Joined {format(new Date(agent.createdAt), "PPP")}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Connected Accounts</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" /> Telegram
                </span>
                <Badge variant={agent.telegramUserId ? "secondary" : "outline"}>
                  {agent.telegramUserId ? "Linked" : "Not Linked"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="h-3 w-3" /> WhatsApp
                </span>
                <Badge
                  variant={agent.whatsappPhoneNumber ? "secondary" : "outline"}
                >
                  {agent.whatsappPhoneNumber ? "Linked" : "Not Linked"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Stats */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key metrics for this agent</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="font-bold text-2xl">0</div>
                <div className="text-muted-foreground text-xs">Total Chats</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="font-bold text-2xl">0</div>
                <div className="text-muted-foreground text-xs">
                  Documents Generated
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="font-bold text-2xl">0</div>
                <div className="text-muted-foreground text-xs">
                  Properties Listed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-4">{/* Log list would go here */}</div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No recent activity recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
