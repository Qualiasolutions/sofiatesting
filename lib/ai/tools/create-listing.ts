import { tool } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createPropertyListing } from "@/lib/db/queries";

// Cyprus cities for validation
const CYPRUS_LOCATIONS = [
  "limassol",
  "nicosia",
  "paphos",
  "larnaca",
  "famagusta",
  "protaras",
  "ayia napa",
  "polis",
  "troodos",
  "kyrenia",
];

export const createListingTool = tool({
  description:
    "Create a property listing draft for zyprus.com with all required property details. Use getZyprusData tool first to get valid location UUIDs, property type UUIDs, and feature UUIDs from zyprus.com. Do not guess UUIDs - always fetch them from the API first.",
  inputSchema: z.object({
    name: z
      .string()
      .min(10)
      .max(200)
      .describe("Property title (e.g., 'Luxury Villa in Limassol')"),
    description: z
      .string()
      .min(20)
      .max(2000)
      .describe("Detailed property description"),
    locationId: z
      .string()
      .uuid()
      .describe("Location UUID from zyprus.com (required). Use getZyprusData tool to fetch available locations first."),
    propertyTypeId: z
      .string()
      .uuid()
      .optional()
      .describe("Property type UUID from zyprus.com. Use getZyprusData tool to fetch available property types."),
    price: z
      .number()
      .positive()
      .max(100_000_000)
      .describe("Price in Euros (e.g., 500000)"),
    bedrooms: z
      .number()
      .int()
      .positive()
      .min(1)
      .max(20)
      .describe("Number of bedrooms"),
    bathrooms: z
      .number()
      .positive()
      .min(0.5)
      .max(10)
      .describe("Number of bathrooms (can be decimal like 2.5)"),
    squareFootage: z
      .number()
      .positive()
      .min(10)
      .max(10_000)
      .describe("Property size in square meters"),
    indoorFeatureIds: z
      .array(z.string().uuid())
      .optional()
      .describe("Indoor feature UUIDs from zyprus.com. Use getZyprusData tool to fetch available indoor features."),
    outdoorFeatureIds: z
      .array(z.string().uuid())
      .optional()
      .describe("Outdoor feature UUIDs from zyprus.com. Use getZyprusData tool to fetch available outdoor features."),
    priceModifierId: z
      .string()
      .uuid()
      .optional()
      .describe("Price modifier UUID from zyprus.com (e.g., 'Guide Price'). Use getZyprusData tool to fetch options."),
    titleDeedId: z
      .string()
      .uuid()
      .optional()
      .describe("Title deed UUID from zyprus.com. Use getZyprusData tool to fetch available title deed types."),
    features: z
      .array(z.string())
      .optional()
      .describe("[DEPRECATED] Use indoorFeatureIds/outdoorFeatureIds instead"),
    imageUrls: z
      .array(z.string().url())
      .optional()
      .describe("Property image URLs (from chat uploads or external URLs)"),
  }),
  execute: async ({
    name,
    description,
    locationId,
    propertyTypeId,
    price,
    bedrooms,
    bathrooms,
    squareFootage,
    indoorFeatureIds,
    outdoorFeatureIds,
    priceModifierId,
    titleDeedId,
    features,
    imageUrls,
  }) => {
    try {
      // Get session for user authentication
      const session = await auth();
      if (!session?.user?.id) {
        return {
          success: false,
          error: "Authentication required to create listing",
        };
      }

      // Validate required locationId
      if (!locationId) {
        return {
          success: false,
          error: "Location ID is required. Use the getZyprusData tool to fetch available locations first.",
        };
      }

      // Create listing directly in database with taxonomy data
      const listing = await createPropertyListing({
        userId: session.user.id,
        name,
        description,
        address: {
          streetAddress: "",
          addressLocality: "Cyprus", // Will be populated from locationId at upload time
          addressCountry: "CY",
          locationId, // Store location ID for upload
        },
        price: price.toString(),
        currency: "EUR",
        numberOfRooms: bedrooms,
        numberOfBathroomsTotal: bathrooms.toString(),
        floorSize: squareFootage.toString(),
        // Store taxonomy IDs for upload
        propertyTypeId,
        indoorFeatureIds,
        outdoorFeatureIds,
        priceModifierId,
        titleDeedId,
        // Deprecated: still support old text features for backward compatibility
        propertyType: "", // Deprecated field - using propertyTypeId instead
        amenityFeature: features || [],
        image: imageUrls || [], // Store image URLs
        status: "draft",
        draftExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        success: true,
        listingId: listing.id,
        message: `✅ **Listing Draft Created!**

📋 **Property Summary**
${name}
📍 Location ID: ${locationId}
💰 €${price.toLocaleString()}
🛏️ ${bedrooms} bedroom${bedrooms > 1 ? "s" : ""} | 🚿 ${bathrooms} bath${bathrooms > 1 ? "s" : ""}
📐 ${squareFootage}m²
${propertyTypeId ? `🏠 Property Type ID: ${propertyTypeId}` : ""}
${indoorFeatureIds && indoorFeatureIds.length > 0 ? `🏠 Indoor Features: ${indoorFeatureIds.length} selected` : ""}
${outdoorFeatureIds && outdoorFeatureIds.length > 0 ? `🌳 Outdoor Features: ${outdoorFeatureIds.length} selected` : ""}
${priceModifierId ? `🏷️ Price Modifier ID: ${priceModifierId}` : ""}
${titleDeedId ? `📜 Title Deed ID: ${titleDeedId}` : ""}
${features && features.length > 0 ? `✨ Features: ${features.join(", ")}` : ""}
${imageUrls && imageUrls.length > 0 ? `📸 Images: ${imageUrls.length} photo${imageUrls.length > 1 ? "s" : ""}` : ""}

Status: **Draft** (expires in 7 days)

Say "upload listing" to publish to zyprus.com`,
      };
    } catch (error) {
      console.error("Error creating listing:", error);
      return {
        success: false,
        error: "Failed to create listing. Please try again.",
      };
    }
  },
});
