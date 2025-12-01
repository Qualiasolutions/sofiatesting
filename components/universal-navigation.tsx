"use client";

import {
  LayoutGrid,
  MessageSquare,
  LayoutDashboard,
  Building2,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UniversalNavigation() {
  const pathname = usePathname();

  // Don't show on the portal page itself if you want, but "Universal" implies everywhere.
  // It's useful even on the home page to see what's available or jump around.

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-md bg-background/80 backdrop-blur-sm border-muted-foreground/20 hover:bg-accent"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="sr-only">Open Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Navigation</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              <span>Portal Home</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/chat" className="flex items-center cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Chat with SOFIA</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/properties" className="flex items-center cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              <span>Properties</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
