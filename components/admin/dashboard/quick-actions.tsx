"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  RefreshCw,
  FileText,
  Settings,
  Activity,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export function QuickActionsCard() {
  const actions = [
    {
      label: "View System Health",
      href: "/admin/health",
      icon: Activity,
    },
    {
      label: "Manage Integrations",
      href: "/admin/integrations",
      icon: Database,
    },
    {
      label: "Agent Logs",
      href: "/admin/agents",
      icon: MessageSquare,
    },
    {
      label: "Document Analytics",
      href: "/admin/documents",
      icon: FileText,
    },
    {
      label: "Calculator Settings",
      href: "/admin/calculators",
      icon: Settings,
    },
    {
      label: "Refresh Data",
      href: "#",
      icon: RefreshCw,
      onClick: () => window.location.reload(),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="justify-start"
              asChild={action.href !== "#"}
              onClick={action.onClick}
            >
              {action.href !== "#" ? (
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              ) : (
                <>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
