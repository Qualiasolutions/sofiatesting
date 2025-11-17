import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { getCache } from "@/lib/zyprus/taxonomy-cache";

export async function ZyprusStatus() {
  const hasZyprusCredentials =
    !!process.env.ZYPRUS_CLIENT_ID && !!process.env.ZYPRUS_CLIENT_SECRET;

  let taxonomyData = null;
  let isHealthy = false;
  let errorMessage = null;

  if (hasZyprusCredentials) {
    try {
      taxonomyData = await getCache();
      isHealthy = !!taxonomyData;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Zyprus Property API
        </CardTitle>
        {hasZyprusCredentials ? (
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
        {!hasZyprusCredentials ? (
          <p className="text-sm text-muted-foreground">
            Zyprus API credentials not configured. Set ZYPRUS_CLIENT_ID and
            ZYPRUS_CLIENT_SECRET in environment variables.
          </p>
        ) : (
          <>
            {isHealthy && taxonomyData && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Taxonomy Data</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Property Types:</span>
                  <span>{taxonomyData.propertyTypes?.size || 0}</span>
                  <span className="text-muted-foreground">Locations:</span>
                  <span>{taxonomyData.locations?.size || 0}</span>
                  <span className="text-muted-foreground">Indoor Features:</span>
                  <span>{taxonomyData.indoorFeatures?.size || 0}</span>
                  <span className="text-muted-foreground">Outdoor Features:</span>
                  <span>{taxonomyData.outdoorFeatures?.size || 0}</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded bg-destructive/10 p-3">
                <p className="text-sm font-semibold text-destructive">
                  API Error
                </p>
                <p className="text-xs text-destructive mt-1">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Cache Information</h4>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  Cache TTL: <span className="font-mono">1 hour</span>
                </p>
                <p className="text-muted-foreground">
                  Storage: <span className="font-mono">Redis (Vercel KV)</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Taxonomy data is cached to reduce API calls and improve
                  performance when creating property listings.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
