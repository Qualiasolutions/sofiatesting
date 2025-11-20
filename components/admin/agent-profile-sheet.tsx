"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { AgentEditModal } from "@/components/admin/agent-edit-modal";
import {
  LinkTelegramModal,
  LinkWhatsAppModal,
} from "@/components/admin/platform-link-modals";

interface Agent {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  region: string;
  role: string;
  isActive: boolean;
  telegramUserId: number | null;
  whatsappPhoneNumber: string | null;
  lastActiveAt: Date | null;
  registeredAt: Date | null;
  inviteSentAt: Date | null;
  inviteToken: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentStats {
  totalSessions: number;
  totalMessages: number;
  totalDocuments: number;
  totalCalculations: number;
  totalListings: number;
  totalTokens: number;
  totalCost: string;
  platforms: {
    web: number;
    telegram: number;
    whatsapp: number;
  };
}

interface AgentProfileSheetProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function AgentProfileSheet({
  agent,
  open,
  onOpenChange,
  onRefresh,
}: AgentProfileSheetProps) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  useEffect(() => {
    if (open && agent) {
      fetchAgentStats();
    }
  }, [open, agent]);

  const fetchAgentStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl">{agent.fullName}</SheetTitle>
              <SheetDescription>
                {agent.role} • {agent.region}
              </SheetDescription>
            </div>
            {agent.isActive ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{agent.email}</span>
              </div>
              {agent.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agent.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{agent.region}</span>
              </div>
            </div>
          </Card>

          {/* Platform Connections */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Platform Connections</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Web Account</span>
                {agent.registeredAt ? (
                  <Badge variant="default">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Not Registered</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Telegram</span>
                {agent.telegramUserId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTelegramModalOpen(true)}
                  >
                    <Badge variant="default" className="mr-2">Connected</Badge>
                    Manage
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTelegramModalOpen(true)}
                  >
                    Link Account
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                {agent.whatsappPhoneNumber ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsappModalOpen(true)}
                  >
                    <Badge variant="default" className="mr-2">Connected</Badge>
                    Manage
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsappModalOpen(true)}
                  >
                    Link Account
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Activity Statistics */}
          {stats && (
            <Card className="p-4">
              <h3 className="mb-3 font-semibold">Activity Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <div className="text-sm text-muted-foreground">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalCalculations}</div>
                  <div className="text-sm text-muted-foreground">Calculations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalListings}</div>
                  <div className="text-sm text-muted-foreground">Listings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${stats.totalCost}</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
              </div>
            </Card>
          )}

          {/* Timestamps */}
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Timestamps</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(agent.createdAt), "PPP")}
                </span>
              </div>
              {agent.registeredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Registered</span>
                  <span className="text-sm">
                    {format(new Date(agent.registeredAt), "PPP")}
                  </span>
                </div>
              )}
              {agent.lastActiveAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Active</span>
                  <span className="text-sm">
                    {format(new Date(agent.lastActiveAt), "PPP p")}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {agent.notes && (
            <Card className="p-4">
              <h3 className="mb-3 font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground">{agent.notes}</p>
            </Card>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center gap-2">
            <Button className="flex-1" onClick={() => setEditModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Agent
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Send Invite
            </Button>
            <Button variant="outline" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Agent Edit Modal */}
      <AgentEditModal
        agent={agent}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          onRefresh();
          fetchAgentStats(); // Refresh stats after edit
        }}
      />

      {/* Platform Linking Modals */}
      <LinkTelegramModal
        agentId={agent.id}
        agentName={agent.fullName}
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
        currentTelegramUserId={agent.telegramUserId}
        onSuccess={() => {
          onRefresh();
          fetchAgentStats();
        }}
      />

      <LinkWhatsAppModal
        agentId={agent.id}
        agentName={agent.fullName}
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
        currentWhatsAppPhone={agent.whatsappPhoneNumber}
        onSuccess={() => {
          onRefresh();
          fetchAgentStats();
        }}
      />
    </Sheet>
  );
}
