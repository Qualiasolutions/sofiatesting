import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WhatsAppStatus() {
  // Check if WaSenderAPI is configured
  const isConfigured = !!(
    process.env.WASENDER_API_KEY && process.env.WASENDER_INSTANCE_ID
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp (WaSenderAPI)
        </CardTitle>
        <Badge variant={isConfigured ? "default" : "secondary"}>
          {isConfigured ? "Configured" : "Not Configured"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="space-y-1">
              <p className="font-medium text-sm">WhatsApp integration active</p>
              <p className="text-muted-foreground text-sm">
                Using WaSenderAPI for message handling
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium text-sm">
                WhatsApp integration not configured
              </p>
              <p className="text-muted-foreground text-sm">
                Set up WaSenderAPI to enable WhatsApp messaging
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Setup Instructions:</h4>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm">
            <li>
              Create account at{" "}
              <Link
                className="text-primary hover:underline"
                href="https://wasenderapi.com"
                target="_blank"
              >
                wasenderapi.com
              </Link>{" "}
              (~$6/month)
            </li>
            <li>Connect WhatsApp number via QR code scan</li>
            <li>
              Set environment variables:
              <ul className="mt-1 ml-4 list-inside list-disc text-xs">
                <li>
                  <code>WASENDER_API_KEY</code> - API key from dashboard
                </li>
                <li>
                  <code>WASENDER_INSTANCE_ID</code> - Instance ID
                </li>
                <li>
                  <code>WASENDER_WEBHOOK_SECRET</code> - For webhook security
                </li>
              </ul>
            </li>
            <li>
              Set webhook URL in WaSenderAPI dashboard:
              <code className="ml-1 text-xs">
                https://your-domain/api/whatsapp/webhook
              </code>
            </li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1" variant="outline">
            <Link href="https://wasenderapi.com/dashboard" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              WaSenderAPI Dashboard
            </Link>
          </Button>
          <Button asChild className="flex-1" variant="outline">
            <Link href="https://wasenderapi.com/docs" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              API Documentation
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
