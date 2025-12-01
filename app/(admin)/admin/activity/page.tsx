// Prevent static generation - this page needs real-time data
export const dynamic = "force-dynamic";

import { format, formatDistanceToNow } from "date-fns";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { Smartphone, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db/client";
import { agentExecutionLog, zyprusAgent } from "@/lib/db/schema";

async function getActivityData() {
  // 1. Get Online Agents (active in last 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const onlineAgents = await db
    .select()
    .from(zyprusAgent)
    .where(gt(zyprusAgent.lastActiveAt, fifteenMinutesAgo))
    .orderBy(desc(zyprusAgent.lastActiveAt));

  // 2. Get Recent WhatsApp Messages
  const recentMessages = await db
    .select()
    .from(agentExecutionLog)
    .where(
      and(
        eq(agentExecutionLog.agentType, "whatsapp"),
        or(
          eq(agentExecutionLog.action, "message_received"),
          eq(agentExecutionLog.action, "message_sent")
        )
      )
    )
    .orderBy(desc(agentExecutionLog.timestamp))
    .limit(50);

  return { onlineAgents, recentMessages };
}

export default async function ActivityPage() {
  const { onlineAgents, recentMessages } = await getActivityData();

  return (
    <div className="space-y-6 p-8 pt-6">
      <div>
        <h2 className="font-bold text-3xl tracking-tight">Live Activity</h2>
        <p className="text-muted-foreground">
          Real-time monitoring of agent presence and WhatsApp conversations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Online Agents Column */}
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Online Agents
              <Badge className="ml-2" variant="secondary">
                {onlineAgents.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Agents active in the last 15 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              {onlineAgents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No agents currently online.
                </div>
              ) : (
                <div className="space-y-4">
                  {onlineAgents.map((agent) => (
                    <div
                      className="flex items-center justify-between rounded-lg border bg-card/50 p-4"
                      key={agent.id}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${agent.email}`}
                          />
                          <AvatarFallback>
                            {agent.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.fullName}</p>
                          <p className="text-muted-foreground text-sm">
                            {agent.role} • {agent.region}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-medium text-green-500 text-sm">
                          <span className="relative mr-1 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                          </span>
                          Online
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {agent.lastActiveAt
                            ? formatDistanceToNow(
                                new Date(agent.lastActiveAt),
                                { addSuffix: true }
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* WhatsApp Feed Column */}
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              WhatsApp Feed
            </CardTitle>
            <CardDescription>Live conversation stream</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              {recentMessages.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recent WhatsApp messages.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((msg) => {
                    const metadata = msg.metadata as any;
                    const isReceived = msg.action === "message_received";

                    return (
                      <div
                        className={`flex ${isReceived ? "justify-start" : "justify-end"}`}
                        key={msg.id}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isReceived
                              ? "rounded-tl-none bg-muted text-foreground"
                              : "rounded-tr-none bg-primary text-primary-foreground"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-xs opacity-70">
                              {isReceived
                                ? metadata?.from || "Unknown"
                                : "Sophia AI"}
                            </span>
                            <span className="text-[10px] opacity-50">
                              {format(new Date(msg.timestamp), "HH:mm")}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">
                            {metadata?.message || "-"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
