import { Suspense } from "react";

// Prevent static generation - this page needs real-time data
export const dynamic = "force-dynamic";

import { db } from "@/lib/db/client";
import { agentExecutionLog, zyprusAgent } from "@/lib/db/schema";
import { desc, eq, and, gt, or } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Smartphone, User, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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
        <h2 className="text-3xl font-bold tracking-tight">Live Activity</h2>
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
              <Badge variant="secondary" className="ml-2">
                {onlineAgents.length}
              </Badge>
            </CardTitle>
            <CardDescription>Agents active in the last 15 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              {onlineAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agents currently online.
                </div>
              ) : (
                <div className="space-y-4">
                  {onlineAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${agent.email}`} />
                          <AvatarFallback>{agent.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.fullName}</p>
                          <p className="text-sm text-muted-foreground">{agent.role} • {agent.region}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Online
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {agent.lastActiveAt ? formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true }) : ''}
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
                <div className="text-center py-8 text-muted-foreground">
                  No recent WhatsApp messages.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((msg) => {
                    const metadata = msg.metadata as any;
                    const isReceived = msg.action === "message_received";
                    
                    return (
                      <div key={msg.id} className={`flex ${isReceived ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          isReceived 
                            ? 'bg-muted text-foreground rounded-tl-none' 
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium opacity-70">
                              {isReceived ? (metadata?.from || 'Unknown') : 'Sophia AI'}
                            </span>
                            <span className="text-[10px] opacity-50">
                              {format(new Date(msg.timestamp), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{metadata?.message || '-'}</p>
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
