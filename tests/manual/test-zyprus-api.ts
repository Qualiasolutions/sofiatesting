/**
 * Test Zyprus API Connectivity and Endpoint Discovery
 *
 * This script tests what JSON:API endpoints are available on the Zyprus Drupal backend
 * Run with: pnpm exec tsx tests/manual/test-zyprus-api.ts
 */

import { config } from "dotenv";

// Load env vars FIRST
config({ path: ".env.local" });

type OAuthToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

async function getAccessToken(): Promise<string> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const clientId = process.env.ZYPRUS_CLIENT_ID;
  const clientSecret = process.env.ZYPRUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("ZYPRUS_CLIENT_ID or ZYPRUS_CLIENT_SECRET not configured");
  }

  console.log(`\nGetting OAuth token from ${apiUrl}/oauth/token...`);

  const response = await fetch(`${apiUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "SophiaAI",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth failed: ${response.status} - ${errorText}`);
  }

  const tokenData: OAuthToken = await response.json();
  console.log(`Got access token (expires in ${tokenData.expires_in}s)`);
  return tokenData.access_token;
}

async function testEndpoint(
  token: string,
  endpoint: string
): Promise<{ status: number; ok: boolean; data?: any; error?: string }> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const url = `${apiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "SophiaAI",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: response.status,
        ok: true,
        data: Array.isArray(data.data)
          ? {
              count: data.data.length,
              sample:
                data.data[0]?.attributes?.name ||
                data.data[0]?.attributes?.title,
            }
          : data,
      };
    }
    const errorText = await response.text();
    return {
      status: response.status,
      ok: false,
      error: errorText.slice(0, 200),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("ZYPRUS API ENDPOINT DISCOVERY TEST");
  console.log("=".repeat(60));

  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  console.log(`\nAPI URL: ${apiUrl}`);
  console.log(`Client ID: ${process.env.ZYPRUS_CLIENT_ID ? "Set" : "Missing"}`);
  console.log(
    `Client Secret: ${process.env.ZYPRUS_CLIENT_SECRET ? "Set" : "Missing"}`
  );

  // Get OAuth token
  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    console.error("\nFailed to get OAuth token:", error);
    process.exit(1);
  }

  // Test JSON:API root to see available resources
  console.log(`\n${"=".repeat(60)}`);
  console.log("TESTING JSON:API ROOT ENDPOINT");
  console.log("=".repeat(60));

  const rootResult = await testEndpoint(token, "/jsonapi");
  if (rootResult.ok) {
    console.log("\n/jsonapi is accessible");
    // Parse available resources from links
    const links = rootResult.data?.links || {};
    const availableResources = Object.keys(links).filter(
      (key) => key !== "self" && key !== "meta"
    );
    console.log(
      `\nAvailable JSON:API resources (${availableResources.length} total):`
    );

    // Filter to show taxonomy and node resources
    const taxonomyResources = availableResources.filter((r) =>
      r.includes("taxonomy_term")
    );
    const nodeResources = availableResources.filter((r) =>
      r.includes("node--")
    );

    console.log("\nNode types:");
    for (const resource of nodeResources.slice(0, 15)) {
      console.log(`  - ${resource}`);
    }
    if (nodeResources.length > 15) {
      console.log(`  ... and ${nodeResources.length - 15} more`);
    }

    console.log("\nTaxonomy vocabularies:");
    for (const resource of taxonomyResources) {
      console.log(`  - ${resource}`);
    }
  } else {
    console.log(
      `\n/jsonapi failed: ${rootResult.status} - ${rootResult.error}`
    );
  }

  // Test specific endpoints we're using
  console.log(`\n${"=".repeat(60)}`);
  console.log("TESTING CURRENT TAXONOMY ENDPOINTS");
  console.log("=".repeat(60));

  const taxonomyEndpoints = [
    "/jsonapi/taxonomy_term/property_type",
    "/jsonapi/taxonomy_term/indoor_property_views", // NOTE: Drupal uses "indoor_property_views" not "indoor_property_features"
    "/jsonapi/taxonomy_term/outdoor_property_features",
    "/jsonapi/taxonomy_term/price_modifier",
    "/jsonapi/taxonomy_term/title_deed",
    "/jsonapi/taxonomy_term/land_type",
    "/jsonapi/taxonomy_term/infrastructure_",
    "/jsonapi/taxonomy_term/property_views",
    "/jsonapi/taxonomy_term/property_status",
    "/jsonapi/taxonomy_term/listing_type",
  ];

  for (const endpoint of taxonomyEndpoints) {
    const result = await testEndpoint(token, endpoint);
    const status = result.ok ? "OK" : "FAIL";
    const info = result.ok
      ? `${result.data?.count || 0} items${result.data?.sample ? ` (e.g., "${result.data.sample}")` : ""}`
      : `${result.status} - ${result.error?.slice(0, 50)}`;
    console.log(
      `[${status}] ${endpoint.replace("/jsonapi/taxonomy_term/", "")}: ${info}`
    );
  }

  // Test node endpoints
  console.log(`\n${"=".repeat(60)}`);
  console.log("TESTING NODE ENDPOINTS");
  console.log("=".repeat(60));

  const nodeEndpoints = [
    "/jsonapi/node/location",
    "/jsonapi/node/property",
    "/jsonapi/node/land",
  ];

  for (const endpoint of nodeEndpoints) {
    const result = await testEndpoint(token, endpoint);
    const status = result.ok ? "OK" : "FAIL";
    const info = result.ok
      ? `${result.data?.count || 0} items${result.data?.sample ? ` (e.g., "${result.data.sample}")` : ""}`
      : `${result.status} - ${result.error?.slice(0, 50)}`;
    console.log(
      `[${status}] ${endpoint.replace("/jsonapi/node/", "")}: ${info}`
    );
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

main().catch(console.error);
