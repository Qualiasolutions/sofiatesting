import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        {hasZyprusCredentials ? (
          <>
            {isHealthy && taxonomyData && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Taxonomy Data</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Property Types:</span>
                  <span>{taxonomyData.propertyTypes?.size || 0}</span>
                  <span className="text-muted-foreground">Locations:</span>
                  <span>{taxonomyData.locations?.size || 0}</span>
                  <span className="text-muted-foreground">
                    Indoor Features:
                  </span>
                  <span>{taxonomyData.indoorFeatures?.size || 0}</span>
                  <span className="text-muted-foreground">
                    Outdoor Features:
                  </span>
                  <span>{taxonomyData.outdoorFeatures?.size || 0}</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded bg-destructive/10 p-3">
                <p className="font-semibold text-destructive text-sm">
                  API Error
                </p>
                <p className="mt-1 text-destructive text-xs">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Cache Information</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Cache TTL: <span className="font-mono">1 hour</span>
                </p>
                <p className="text-muted-foreground">
                  Storage: <span className="font-mono">Redis (Vercel KV)</span>
                </p>
                <p className="mt-2 text-muted-foreground text-xs">
                  Taxonomy data is cached to reduce API calls and improve
                  performance when creating property listings.
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Zyprus API credentials not configured. Set ZYPRUS_CLIENT_ID and
            ZYPRUS_CLIENT_SECRET in environment variables.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
