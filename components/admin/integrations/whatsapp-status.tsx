import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function WhatsAppStatus() {
  // WhatsApp is currently disabled (lib/integrations/whatsapp-DISABLED/)
  const isEnabled = false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Business
        </CardTitle>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              WhatsApp integration is prepared but not yet activated
            </p>
            <p className="text-sm text-muted-foreground">
              The codebase includes WhatsApp Business API integration code in{" "}
              <code className="text-xs">lib/integrations/whatsapp-DISABLED/</code>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">To Enable WhatsApp:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Set up Meta Business Account</li>
            <li>Configure WhatsApp Business API credentials</li>
            <li>Set environment variables:
              <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                <li>WHATSAPP_BUSINESS_ACCOUNT_ID</li>
                <li>WHATSAPP_PHONE_NUMBER_ID</li>
                <li>WHATSAPP_ACCESS_TOKEN</li>
                <li>WHATSAPP_WEBHOOK_VERIFY_TOKEN</li>
              </ul>
            </li>
            <li>Rename directory to enable code</li>
            <li>Deploy webhook endpoint</li>
          </ol>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link
            href="https://developers.facebook.com/docs/whatsapp/business-management-api"
            target="_blank"
          >
            View WhatsApp Business API Documentation
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
