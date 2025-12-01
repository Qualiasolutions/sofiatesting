import Link from "next/link";
import { MessageSquare, LayoutDashboard, Building2 } from "lucide-react";

export default function PortalPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
            Qualia AI Agents Suite™
          </h1>
          <p className="text-xl text-muted-foreground">
            Select a module to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Chat Module */}
          <Link
            href="/chat"
            className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-1"
          >
            <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Chat with SOFIA</h2>
            <p className="text-sm text-muted-foreground text-center">
              AI Assistant for Real Estate Services
            </p>
          </Link>

          {/* Admin Module */}
          <Link
            href="/admin"
            className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-1"
          >
            <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground text-center">
              System Management & Configuration
            </p>
          </Link>

          {/* Properties Module */}
          <Link
            href="/properties"
            className="group relative flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-1"
          >
            <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Properties</h2>
            <p className="text-sm text-muted-foreground text-center">
              Listing Management & Search
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
