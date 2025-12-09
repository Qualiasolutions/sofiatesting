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

async function discoverPropertyFields(token: string): Promise<void> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  console.log(`\n${"=".repeat(60)}`);
  console.log("DISCOVERING PROPERTY FIELDS (Looking for reviewer/instructor)");
  console.log("=".repeat(60));

  // Fetch a single property with ALL fields included
  const url = `${apiUrl}/jsonapi/node/property?page[limit]=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "SophiaAI",
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch property: ${response.status}`);
      return;
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const property = data.data[0];
      console.log(`\nSample Property ID: ${property.id}`);
      console.log(`Title: ${property.attributes?.title}`);

      console.log("\n--- ALL ATTRIBUTES ---");
      const attrs = Object.keys(property.attributes || {}).sort();
      for (const key of attrs) {
        const value = property.attributes[key];
        // Highlight fields that might be reviewer/instructor related
        if (key.toLowerCase().includes("reviewer") ||
            key.toLowerCase().includes("instructor") ||
            key.toLowerCase().includes("draft") ||
            key.toLowerCase().includes("ai_")) {
          console.log(`  ⭐ ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`  ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
        }
      }

      console.log("\n--- ALL RELATIONSHIPS ---");
      const rels = Object.keys(property.relationships || {}).sort();
      for (const key of rels) {
        const rel = property.relationships[key];
        // Highlight fields that might be reviewer/instructor related
        if (key.toLowerCase().includes("reviewer") ||
            key.toLowerCase().includes("instructor") ||
            key.toLowerCase().includes("user")) {
          console.log(`  ⭐ ${key}: ${JSON.stringify(rel.data)}`);
        } else {
          const dataInfo = rel.data
            ? (Array.isArray(rel.data) ? `[${rel.data.length} items]` : rel.data.type)
            : "null";
          console.log(`  ${key}: ${dataInfo}`);
        }
      }
    } else {
      console.log("No properties found in the system");
    }
  } catch (error) {
    console.error("Error fetching property:", error);
  }
}

async function findLaurenUuid(token: string): Promise<string | null> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  console.log(`\n${"=".repeat(60)}`);
  console.log("FINDING LAUREN ELLINGHAM'S USER UUID");
  console.log("=".repeat(60));

  // Try to query users endpoint
  const endpoints = [
    "/jsonapi/user/user",
    "/jsonapi/user--user",
  ];

  for (const endpoint of endpoints) {
    const url = `${apiUrl}${endpoint}?filter[name][operator]=CONTAINS&filter[name][value]=Lauren`;
    console.log(`\nTrying: ${endpoint}`);

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
        console.log(`Found ${data.data?.length || 0} users matching "Lauren"`);

        if (data.data && data.data.length > 0) {
          for (const user of data.data) {
            console.log(`  - ${user.attributes?.name || user.attributes?.display_name}: ${user.id}`);
            if (user.attributes?.name?.toLowerCase().includes("lauren") ||
                user.attributes?.display_name?.toLowerCase().includes("lauren")) {
              console.log(`\n✅ LAUREN'S UUID: ${user.id}`);
              return user.id;
            }
          }
        }
      } else {
        console.log(`  Status: ${response.status} (may not have permission)`);
      }
    } catch (error) {
      console.log(`  Error: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  // Also try without filter to see all users
  console.log("\nTrying to list all users (no filter)...");
  try {
    const response = await fetch(`${apiUrl}/jsonapi/user/user?page[limit]=50`, {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "SophiaAI",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.data?.length || 0} total users`);

      if (data.data) {
        for (const user of data.data) {
          const name = user.attributes?.name || user.attributes?.display_name || "Unknown";
          console.log(`  - ${name}: ${user.id}`);
          if (name.toLowerCase().includes("lauren")) {
            console.log(`\n✅ LAUREN'S UUID: ${user.id}`);
            return user.id;
          }
        }
      }
    }
  } catch (error) {
    console.log(`Error listing users: ${error instanceof Error ? error.message : "Unknown"}`);
  }

  console.log("\n❌ Could not find Lauren's UUID - may need to check Zyprus admin");
  return null;
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

  // NEW: Discover property fields first
  await discoverPropertyFields(token);

  // NEW: Find Lauren's UUID
  await findLaurenUuid(token);

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
