import { Suspense } from "react";
import { IntegrationsOverview } from "@/components/admin/integrations/overview";
import { TelegramStatus } from "@/components/admin/integrations/telegram-status";
import { WhatsAppStatus } from "@/components/admin/integrations/whatsapp-status";
import { ZyprusStatus } from "@/components/admin/integrations/zyprus-status";
import { AIGatewayStatus } from "@/components/admin/integrations/ai-gateway-status";
import { LoadingCard } from "@/components/admin/dashboard/loading-card";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Manage external service integrations and API connections
        </p>
      </div>

      <Suspense fallback={<LoadingCard />}>
        <IntegrationsOverview />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<LoadingCard />}>
          <TelegramStatus />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <WhatsAppStatus />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <ZyprusStatus />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <AIGatewayStatus />
        </Suspense>
      </div>
    </div>
  );
}
