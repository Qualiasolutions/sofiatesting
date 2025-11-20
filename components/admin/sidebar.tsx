"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Calculator,
  Bot,
  MessageSquare,
  Settings,
  Database,
  FileText,
  Users,
  Shield,
  UserCog,
} from "lucide-react";

interface AdminSidebarProps {
  role: string;
  permissions: Record<string, boolean> | null;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    requiredPermission: null,
  },
  {
    name: "System Health",
    href: "/admin/health",
    icon: Activity,
    requiredPermission: "view_system_health",
  },
  {
    name: "Integrations",
    href: "/admin/integrations",
    icon: Database,
    requiredPermission: "manage_integrations",
  },
  {
    name: "Calculators",
    href: "/admin/calculators",
    icon: Calculator,
    requiredPermission: "manage_calculators",
  },
  {
    name: "Agent Logs",
    href: "/admin/agents",
    icon: Bot,
    requiredPermission: "view_agent_logs",
  },
  {
    name: "Agents Registry",
    href: "/admin/agents-registry",
    icon: UserCog,
    requiredPermission: "manage_users",
  },
  {
    name: "WhatsApp",
    href: "/admin/whatsapp",
    icon: MessageSquare,
    requiredPermission: "view_agent_logs",
  },
  {
    name: "Telegram",
    href: "/admin/telegram",
    icon: MessageSquare,
    requiredPermission: "manage_integrations",
  },
  {
    name: "Documents",
    href: "/admin/documents",
    icon: FileText,
    requiredPermission: "view_analytics",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    requiredPermission: "manage_users",
  },
  {
    name: "Audit Logs",
    href: "/admin/audit",
    icon: Shield,
    requiredPermission: "view_audit_logs",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    requiredPermission: "manage_settings",
  },
];

export function AdminSidebar({ role, permissions }: AdminSidebarProps) {
  const pathname = usePathname();

  const hasPermission = (requiredPermission: string | null) => {
    if (!requiredPermission) return true;
    if (role === "superadmin") return true;
    return permissions?.[requiredPermission] === true;
  };

  const filteredNavigation = navigationItems.filter((item) =>
    hasPermission(item.requiredPermission)
  );

  return (
    <aside className="w-64 border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6" />
          <span>SOFIA Admin</span>
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
