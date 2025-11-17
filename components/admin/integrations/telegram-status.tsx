import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";

export async function TelegramStatus() {
  const hasTelegramToken = !!process.env.TELEGRAM_BOT_TOKEN;

  let botInfo = null;
  let webhookInfo = null;
  let isHealthy = false;

  if (hasTelegramToken) {
    try {
      // Check bot info
      const botResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,
        { next: { revalidate: 300 } } // Cache for 5 minutes
      );
      if (botResponse.ok) {
        const data = await botResponse.json();
        botInfo = data.result;
      }

      // Check webhook info
      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
        { next: { revalidate: 300 } }
      );
      if (webhookResponse.ok) {
        const data = await webhookResponse.json();
        webhookInfo = data.result;
        isHealthy = webhookInfo.url && webhookInfo.last_error_date === 0;
      }
    } catch (error) {
      console.error("Telegram health check failed:", error);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Telegram Bot
        </CardTitle>
        {hasTelegramToken ? (
          isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )
        ) : (
          <Badge variant="secondary">Not Configured</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTelegramToken ? (
          <p className="text-sm text-muted-foreground">
            Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN in
            environment variables.
          </p>
        ) : (
          <>
            {botInfo && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Bot Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono">@{botInfo.username}</span>
                  <span className="text-muted-foreground">Name:</span>
                  <span>{botInfo.first_name}</span>
                  <span className="text-muted-foreground">Can Join Groups:</span>
                  <span>{botInfo.can_join_groups ? "Yes" : "No"}</span>
                </div>
              </div>
            )}

            {webhookInfo && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-semibold">Webhook Status</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Webhook URL:</span>
                    <Badge variant={webhookInfo.url ? "default" : "destructive"}>
                      {webhookInfo.url ? "Set" : "Not Set"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Updates:</span>
                    <span>{webhookInfo.pending_update_count || 0}</span>
                  </div>
                  {webhookInfo.last_error_message && (
                    <div className="rounded bg-destructive/10 p-2">
                      <p className="text-xs text-destructive">
                        {webhookInfo.last_error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
