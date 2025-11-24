import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * IntegrationsOverview - Placeholder component
 * TODO: Implement integrationStatus table in schema when needed
 */
export async function IntegrationsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Integration monitoring coming soon. Status tracking for Telegram,
          Zyprus API, and other services will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}
