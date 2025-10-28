// DISABLED - PropertyListing table not in production yet
// import type { PropertyListing } from "@/lib/db/schema";

// Temporary placeholder type
type PropertyListing = any;

export class ZyprusAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ZyprusAPIError";
  }
}

export async function uploadToZyprusAPI(listing: PropertyListing): Promise<{
  listingId: string;
  listingUrl: string;
}> {
  const apiUrl = process.env.ZYPRUS_API_URL || "https://api.zyprus.com/v1";
  const apiKey = process.env.ZYPRUS_API_KEY;

  if (!apiKey) {
    throw new ZyprusAPIError(
      "ZYPRUS_API_KEY not configured",
      "CONFIG_ERROR"
    );
  }

  // Build Schema.org RealEstateListing payload
  const payload = {
    "@type": "RealEstateListing",
    name: listing.name,
    description: listing.description,
    address: listing.address,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
    },
    numberOfRooms: listing.numberOfRooms,
    numberOfBathroomsTotal: listing.numberOfBathroomsTotal,
    floorSize: {
      "@type": "QuantitativeValue",
      value: listing.floorSize,
      unitCode: "MTK", // Square meters
    },
    amenityFeature: listing.amenityFeature || [],
    propertyType: listing.propertyType,
    image: listing.image || [],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${apiUrl}/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ZyprusAPIError(
        errorData.message || `API error: ${response.status}`,
        errorData.code || "API_ERROR",
        response.status
      );
    }

    const data = await response.json();
    return {
      listingId: data.id || data.listing_id,
      listingUrl: data.url || `https://www.zyprus.com/Cyprus/property/${data.id}`,
    };
  } catch (error) {
    if (error instanceof ZyprusAPIError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ZyprusAPIError(
          "Request timeout after 30 seconds",
          "TIMEOUT"
        );
      }
      throw new ZyprusAPIError(
        `Network error: ${error.message}`,
        "NETWORK_ERROR"
      );
    }

    throw new ZyprusAPIError(
      "Unknown error occurred",
      "UNKNOWN"
    );
  }
}

export function isPermanentError(error: ZyprusAPIError): boolean {
  const permanentCodes = [
    "AUTH_FAILED",
    "INVALID_DATA",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFIG_ERROR",
  ];
  return permanentCodes.includes(error.code);
}
