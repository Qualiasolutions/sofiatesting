import { createCircuitBreaker } from "@/lib/circuit-breakers";
import type { PropertyListing } from "@/lib/db/schema";

export class ZyprusAPIError extends Error {
  code: string;
  statusCode?: number;
  details?: string;
  errors?: any[];

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: string,
    errors?: any[]
  ) {
    super(message);
    this.name = "ZyprusAPIError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.errors = errors;
  }
}

type OAuthToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

type JsonApiResource = {
  type: string;
  id?: string;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
};

type JsonApiDocument = {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  meta?: Record<string, any>;
};

let cachedToken: OAuthToken | null = null;
let tokenExpiresAt = 0;

/**
 * Internal OAuth token fetch (wrapped by circuit breaker)
 */
async function fetchAccessTokenInternal(): Promise<string> {
  const now = Date.now();

  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const clientId = process.env.ZYPRUS_CLIENT_ID;
  const clientSecret = process.env.ZYPRUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ZyprusAPIError(
      "ZYPRUS_CLIENT_ID or ZYPRUS_CLIENT_SECRET not configured",
      "CONFIG_ERROR"
    );
  }

  try {
    const response = await fetch(`${apiUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "SophiaAI/1.0",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ZyprusAPIError(
        errorData.error_description || `OAuth error: ${response.status}`,
        errorData.error || "OAUTH_ERROR",
        response.status
      );
    }

    const tokenData: OAuthToken = await response.json();
    cachedToken = tokenData;
    tokenExpiresAt = now + tokenData.expires_in * 1000;

    return tokenData.access_token;
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }

    throw new ZyprusAPIError(
      `OAuth token error: ${error instanceof Error ? error.message : "Unknown error"}`,
      "OAUTH_ERROR"
    );
  }
}

// Circuit breaker for OAuth token fetch
const oauthBreaker = createCircuitBreaker(fetchAccessTokenInternal, {
  name: "ZyprusOAuth",
  timeout: 10_000, // 10 second timeout
  errorThresholdPercentage: 60, // Allow more failures before opening (OAuth is critical)
  resetTimeout: 60_000, // Wait 1 minute before trying again
});

/**
 * Get OAuth token for API authentication (with circuit breaker and caching)
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && tokenExpiresAt > now + 300_000) {
    return cachedToken.access_token;
  }

  // Fetch new token through circuit breaker
  return await oauthBreaker.fire();
}

/**
 * Get available locations from Zyprus
 */
export async function getZyprusLocations(): Promise<any[]> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const token = await getAccessToken();

  try {
    const response = await fetch(`${apiUrl}/jsonapi/node/location`, {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "SophiaAI/1.0",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ZyprusAPIError(
        errorData.errors?.[0]?.title || `API error: ${response.status}`,
        errorData.errors?.[0]?.code || "API_ERROR",
        response.status
      );
    }

    const data: JsonApiDocument = await response.json();
    return Array.isArray(data.data) ? data.data : [data.data];
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }

    throw new ZyprusAPIError(
      `Failed to fetch locations: ${error instanceof Error ? error.message : "Unknown error"}`,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Get taxonomy terms for property features
 */
export async function getZyprusTaxonomyTerms(
  vocabularyType: string
): Promise<any[]> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const token = await getAccessToken();

  try {
    const response = await fetch(
      `${apiUrl}/jsonapi/taxonomy_term/${vocabularyType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "SophiaAI/1.0",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ZyprusAPIError(
        errorData.errors?.[0]?.title || `API error: ${response.status}`,
        errorData.errors?.[0]?.code || "API_ERROR",
        response.status
      );
    }

    const data: JsonApiDocument = await response.json();
    return Array.isArray(data.data) ? data.data : [data.data];
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }

    throw new ZyprusAPIError(
      `Failed to fetch taxonomy terms: ${error instanceof Error ? error.message : "Unknown error"}`,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Internal property upload function (wrapped by circuit breaker)
 */
async function uploadToZyprusAPIInternal(
  listing: PropertyListing & {
    locationId?: string;
    indoorFeatureIds?: string[];
    outdoorFeatureIds?: string[];
    listingTypeId?: string;
    propertyTypeId?: string;
    priceModifierId?: string;
    titleDeedId?: string;
    yearBuilt?: number;
    referenceId?: string;
  }
): Promise<{
  listingId: string;
  listingUrl: string;
}> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const token = await getAccessToken();

  // Upload images to field_gallery_ endpoint if present (PARALLEL UPLOADS)
  const imageIds: string[] = [];
  if (listing.image && Array.isArray(listing.image)) {
    const imageUrls = listing.image as string[];
    const totalImages = imageUrls.length;

    console.log(`Starting PARALLEL upload of ${totalImages} images to Zyprus`);

    // Create upload promise for each image
    const uploadPromises = imageUrls.map(async (imageUrl, i) => {
      console.log(`Uploading image ${i + 1}/${totalImages}: ${imageUrl}`);

      try {
        // Fetch image from URL (supports both external URLs and Vercel Blob URLs)
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(
            `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
          );
        }

        const imageBlob = await imageResponse.blob();
        const contentType =
          imageResponse.headers.get("content-type") || "image/jpeg";

        // Determine file extension from content type
        const ext = contentType.split("/")[1] || "jpg";
        const filename = `property-image-${i + 1}.${ext}`;

        // IMPORTANT: Zyprus expects raw binary upload with Content-Disposition header
        // NOT multipart/form-data (as per Postman collection spec)
        const uploadResponse = await fetch(
          `${apiUrl}/jsonapi/node/property/field_gallery_`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "User-Agent": "SophiaAI/1.0",
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `file; filename="${filename}"`,
            },
            body: imageBlob,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(
            `Upload failed: ${uploadResponse.status} - ${errorText}`
          );
        }

        const data = await uploadResponse.json();
        console.log(`Successfully uploaded image ${i + 1}: ${data.data.id}`);
        return { index: i, id: data.data.id, url: imageUrl };
      } catch (imgError) {
        console.error(
          `Error processing image ${i + 1} (${imageUrl}):`,
          imgError
        );
        throw imgError; // Re-throw to mark as rejected in Promise.allSettled
      }
    });

    // Execute all uploads in parallel and collect results
    const results = await Promise.allSettled(uploadPromises);

    // Extract successful image IDs (preserve original order)
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        imageIds.push(result.value.id);
      } else {
        console.error(
          `Image ${i + 1} upload failed:`,
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error"
        );
      }
    });

    console.log(
      `Parallel image upload complete: ${imageIds.length}/${totalImages} successful (${((imageIds.length / totalImages) * 100).toFixed(1)}%)`
    );
  }

  // Build JSON:API payload for Drupal with correct field names
  const payload: JsonApiDocument = {
    data: {
      type: "node--property",
      attributes: {
        status: false, // MANDATORY: false to prevent unexpected display
        title: listing.name,
        body: {
          value: listing.description,
          format: "plain_text",
        },
        field_ai_state: "draft", // CRUCIAL: track AI-generated properties
        field_price: String(listing.price), // Price as string
        field_covered_area: Number.parseFloat(String(listing.floorSize)), // Parse as float
        field_land_size: Number.parseFloat(
          String((listing as any).landSize || listing.floorSize)
        ), // Parse as float
        field_no_bedrooms: Number.parseInt(String(listing.numberOfRooms), 10), // Parse as integer
        field_no_bathrooms: Number.parseFloat(
          String(listing.numberOfBathroomsTotal)
        ), // Parse as float (allows 2.5, etc.)
        field_no_kitchens: Number.parseInt(
          String((listing as any).numberOfKitchens || 1),
          10
        ), // Parse as integer
        field_no_living_rooms: Number.parseInt(
          String((listing as any).numberOfLivingRooms || 1),
          10
        ), // Parse as integer
        field_own_reference_id: listing.referenceId || `AI-${Date.now()}`,
        field_year_built: Number.parseInt(
          String(listing.yearBuilt || new Date().getFullYear()),
          10
        ), // Parse as integer
        field_new_build: false,
        field_map: (listing.address as any)?.geo
          ? {
              value: `POINT (${(listing.address as any).geo.longitude} ${(listing.address as any).geo.latitude})`,
              geo_type: "Point",
              lat: (listing.address as any).geo.latitude,
              lon: (listing.address as any).geo.longitude,
            }
          : undefined,
      },
      relationships: {},
    },
  };

  // Add relationships only if IDs are provided
  const relationships: any = {};

  // Use a default location if not provided (first available location)
  // You should ideally fetch this dynamically or configure it
  const DEFAULT_LOCATION_ID = "7dbc931e-90eb-4b89-9ac8-b5e593831cf8"; // Acropolis, Strovolos
  const DEFAULT_PROPERTY_TYPE_ID = "e3c4bd56-f8c4-4672-b4a2-23d6afe6ca44"; // Apartment

  if (listing.locationId) {
    relationships.field_location = {
      data: {
        type: "node--location",
        id: listing.locationId,
      },
    };
  } else {
    // Use default location if not provided
    relationships.field_location = {
      data: {
        type: "node--location",
        id: DEFAULT_LOCATION_ID,
      },
    };
  }

  if (listing.indoorFeatureIds?.length) {
    relationships.field_indoor_property_features = {
      data: listing.indoorFeatureIds.map((id) => ({
        type: "taxonomy_term--indoor_property_views",
        id,
      })),
    };
  }

  if (listing.outdoorFeatureIds?.length) {
    relationships.field_outdoor_property_features = {
      data: listing.outdoorFeatureIds.map((id) => ({
        type: "taxonomy_term--outdoor_property_features",
        id,
      })),
    };
  }

  if (listing.listingTypeId) {
    relationships.field_listing_type = {
      data: {
        type: "taxonomy_term--listing_type",
        id: listing.listingTypeId,
      },
    };
  }

  if (listing.propertyTypeId) {
    relationships.field_property_type = {
      data: {
        type: "taxonomy_term--property_type",
        id: listing.propertyTypeId,
      },
    };
  } else {
    // Use default property type if not provided
    relationships.field_property_type = {
      data: {
        type: "taxonomy_term--property_type",
        id: DEFAULT_PROPERTY_TYPE_ID,
      },
    };
  }

  if (listing.priceModifierId) {
    relationships.field_price_modifier = {
      data: {
        type: "taxonomy_term--price_modifier",
        id: listing.priceModifierId,
      },
    };
  }

  if (listing.titleDeedId) {
    relationships.field_title_deed = {
      data: {
        type: "taxonomy_term--title_deed",
        id: listing.titleDeedId,
      },
    };
  }

  if (imageIds.length > 0) {
    relationships.field_gallery_ = {
      data: imageIds.map((id) => ({
        type: "file--file",
        id,
      })),
    };
  }

  // Add default empty array for gallery if no images
  if (!relationships.field_gallery_) {
    relationships.field_gallery_ = {
      data: [],
    };
  }

  // Always add relationships (even if some are empty)
  (payload.data as JsonApiResource).relationships = relationships;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    const response = await fetch(`${apiUrl}/jsonapi/node/property`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "User-Agent": "SophiaAI/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Zyprus API Response Error:", {
        status: response.status,
        errors: errorData.errors,
        fullResponse: errorData,
      });

      // Build detailed error message
      let errorMessage = `API error: ${response.status}`;
      let errorDetails = "";

      if (errorData.errors && Array.isArray(errorData.errors)) {
        const errors = errorData.errors
          .map(
            (err: any) =>
              `${err.title || ""} - ${err.detail || ""} (${err.source?.pointer || "unknown field"})`
          )
          .join("; ");
        errorMessage = errors || errorMessage;
        errorDetails = JSON.stringify(errorData.errors);
      }

      throw new ZyprusAPIError(
        errorMessage,
        errorData.errors?.[0]?.code || "API_ERROR",
        response.status,
        errorDetails,
        errorData.errors
      );
    }

    const responseData: JsonApiDocument = await response.json();
    const propertyData = responseData.data as JsonApiResource;

    return {
      listingId: propertyData.id || "",
      listingUrl: `${process.env.ZYPRUS_SITE_URL || "https://dev9.zyprus.com"}/property/${propertyData.id}`,
    };
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ZyprusAPIError("Request timeout after 30 seconds", "TIMEOUT");
      }
      throw new ZyprusAPIError(
        `Network error: ${error.message}`,
        "NETWORK_ERROR"
      );
    }

    throw new ZyprusAPIError("Unknown error occurred", "UNKNOWN");
  }
}

/**
 * Get existing property listings from Zyprus
 */
export async function getZyprusListings(): Promise<any[]> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://dev9.zyprus.com";
  const token = await getAccessToken();

  try {
    const response = await fetch(`${apiUrl}/jsonapi/node/property`, {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "SophiaAI/1.0",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ZyprusAPIError(
        errorData.errors?.[0]?.title || `API error: ${response.status}`,
        errorData.errors?.[0]?.code || "API_ERROR",
        response.status
      );
    }

    const data: JsonApiDocument = await response.json();
    return Array.isArray(data.data) ? data.data : [data.data];
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }

    throw new ZyprusAPIError(
      `Failed to fetch listings: ${error instanceof Error ? error.message : "Unknown error"}`,
      "NETWORK_ERROR"
    );
  }
}

// Circuit breaker for property upload
const uploadBreaker = createCircuitBreaker(uploadToZyprusAPIInternal, {
  name: "ZyprusUpload",
  timeout: 45_000, // 45 second timeout (allows for image uploads)
  errorThresholdPercentage: 50, // 50% failure rate trips circuit
  resetTimeout: 30_000, // Wait 30 seconds before trying again
  volumeThreshold: 3, // Need at least 3 failed requests to trip
});

/**
 * Upload property listing to Zyprus API (with circuit breaker)
 */
export async function uploadToZyprusAPI(
  listing: PropertyListing & {
    locationId?: string;
    indoorFeatureIds?: string[];
    outdoorFeatureIds?: string[];
    listingTypeId?: string;
    propertyTypeId?: string;
    priceModifierId?: string;
    titleDeedId?: string;
    yearBuilt?: number;
    referenceId?: string;
  }
): Promise<{
  listingId: string;
  listingUrl: string;
}> {
  return await uploadBreaker.fire(listing);
}

/**
 * Check if error is permanent (should not retry)
 */
export function isPermanentError(error: ZyprusAPIError): boolean {
  const permanentCodes = [
    "AUTH_FAILED",
    "INVALID_DATA",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFIG_ERROR",
    "OAUTH_ERROR",
  ];
  return permanentCodes.includes(error.code);
}

/**
 * Export circuit breakers for monitoring/admin
 */
export const zyprusCircuitBreakers = {
  oauth: oauthBreaker,
  upload: uploadBreaker,
};
