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

interface WhatsAppConversation {
  id: string;
  phoneNumber: string;
  userId: string | null;
  userEmail: string | null;
  status: string;
  metadata: any;
  createdAt: string;
  lastMessageAt: string | null;
}

interface WhatsAppResponse {
  conversations: WhatsAppConversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function WhatsAppPage() {
  const [data, setData] = useState<WhatsAppResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/logs?type=whatsapp&page=${page}&limit=50`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [page]);

  if (loading && !data) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">WhatsApp Tracking</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp Agent Tracking</h1>
        <p className="text-muted-foreground">
          Monitor agents who have texted SOFIA via WhatsApp
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Conversations</p>
          <p className="text-2xl font-bold">{data?.pagination.total || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold">
            {data?.conversations.filter((c) => c.status === "active").length ||
              0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Paused</p>
          <p className="text-2xl font-bold">
            {data?.conversations.filter((c) => c.status === "paused").length ||
              0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Ended</p>
          <p className="text-2xl font-bold">
            {data?.conversations.filter((c) => c.status === "ended").length ||
              0}
          </p>
        </div>
      </div>

      {/* WhatsApp Integration Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> WhatsApp integration is ready but not yet
          connected. When you connect WhatsApp, all conversations will appear
          here.
        </p>
      </div>

      {/* Conversations Table */}
      <div className="bg-card border rounded-lg">
        {data?.conversations && data.conversations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>First Message</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.conversations.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell className="font-mono">
                    {conversation.phoneNumber}
                  </TableCell>
                  <TableCell>
                    {conversation.userEmail || (
                      <span className="text-muted-foreground">Guest</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        conversation.status === "active"
                          ? "bg-green-100 text-green-800"
                          : conversation.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {conversation.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(conversation.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {conversation.lastMessageAt
                      ? new Date(conversation.lastMessageAt).toLocaleString()
                      : "No messages yet"}
                  </TableCell>
                  <TableCell>
                    {conversation.metadata?.messageCount || 0} messages
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-2">
              No WhatsApp conversations yet
            </p>
            <p className="text-sm text-muted-foreground">
              Connect WhatsApp integration to start tracking conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
