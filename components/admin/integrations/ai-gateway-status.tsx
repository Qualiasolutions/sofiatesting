import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, XCircle } from "lucide-react";

export async function AIGatewayStatus() {
  const hasAIGatewayKey = !!process.env.AI_GATEWAY_API_KEY;

  // AI Gateway is MANDATORY - application won't work without it
  const isHealthy = hasAIGatewayKey;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Gateway (Vercel)
        </CardTitle>
        {isHealthy ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAIGatewayKey ? (
          <div className="rounded bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">
              CRITICAL: AI Gateway is not configured!
            </p>
            <p className="text-xs text-destructive mt-1">
              SOFIA requires AI_GATEWAY_API_KEY to function. The application
              will not work without this configuration.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-mono">Vercel AI Gateway</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Available Models</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Claude Haiku 4.5</span>
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Claude Sonnet 4.5</span>
                  <Badge variant="outline" className="text-xs">
                    Premium
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>GPT-4o Mini</span>
                  <Badge variant="outline" className="text-xs">
                    Budget
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Features</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Streaming responses (Server-Sent Events)</li>
                <li>✓ Tool execution (Cyprus calculators)</li>
                <li>✓ Prompt caching (Anthropic models)</li>
                <li>✓ Token tracking and analytics</li>
                <li>✓ Rate limiting per user type</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
