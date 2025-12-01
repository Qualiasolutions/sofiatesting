"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import type { User } from "next-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminHeaderProps = {
  user: User;
  role: string;
};

export function AdminHeader({ user, role }: AdminHeaderProps) {
  const initials =
    user.email?.split("@")[0].substring(0, 2).toUpperCase() || "AD";

  const roleLabel = role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="font-medium text-muted-foreground text-sm">
          Role:{" "}
          <span className="font-semibold text-foreground">{roleLabel}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Button asChild size="sm" variant="outline">
          <Link href="/">Return to Chat</Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="relative h-9 w-9 rounded-full" variant="ghost">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm leading-none">{user.email}</p>
                <p className="text-muted-foreground text-xs leading-none">
                  {roleLabel}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link className="cursor-pointer" href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link className="cursor-pointer" href="/">
                <UserIcon className="mr-2 h-4 w-4" />
                User Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link className="cursor-pointer" href="/api/auth/signout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
