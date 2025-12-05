import { tool } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getUserContext } from "@/lib/ai/context";
import { createLandListing } from "@/lib/db/queries";

export const createLandListingTool = tool({
  description:
    "Create a land/plot listing draft for zyprus.com. Use getZyprusData tool with resourceType='all_land' first to get valid UUIDs for land types, locations, infrastructure, and other taxonomy terms.",
  inputSchema: z.object({
    name: z
      .string()
      .min(10)
      .max(200)
      .describe("Land title (e.g., 'Building Plot in Paphos with Sea View')"),
    description: z
      .string()
      .min(20)
      .max(2000)
      .describe("Detailed land description including location, features, zoning info"),
    price: z
      .number()
      .positive()
      .max(100_000_000)
      .describe("Price in Euros (e.g., 150000)"),
    landSize: z
      .number()
      .positive()
      .describe("Land area in square meters (e.g., 2000)"),
    landTypeId: z
      .string()
      .uuid()
      .describe(
        "Land type UUID from zyprus.com (Plot, Field, Agricultural, etc.). Use getZyprusData tool with resourceType='all_land'."
      ),
    locationId: z
      .string()
      .uuid()
      .describe(
        "Location UUID from zyprus.com (required). Use getZyprusData tool to fetch available locations."
      ),
    listingTypeId: z
      .string()
      .uuid()
      .describe(
        "Listing type UUID (For Sale, For Rent, Exchange). Use getZyprusData tool."
      ),
    // Optional building permissions
    buildingDensity: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Building density percentage allowed (e.g., 60 for 60%)"),
    siteCoverage: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Site coverage percentage allowed (e.g., 50 for 50%)"),
    maxFloors: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe("Maximum number of floors allowed"),
    maxHeight: z
      .number()
      .positive()
      .optional()
      .describe("Maximum building height in meters"),
    // Optional features
    infrastructureIds: z
      .array(z.string().uuid())
      .optional()
      .describe(
        "Infrastructure UUIDs (Electricity, Water, Road Access, etc.). Use getZyprusData tool."
      ),
    viewIds: z
      .array(z.string().uuid())
      .optional()
      .describe(
        "View UUIDs (Sea View, Mountain View, etc.). Use getZyprusData tool."
      ),
    // Optional taxonomy
    priceModifierId: z
      .string()
      .uuid()
      .optional()
      .describe("Price modifier UUID (Guide Price, etc.). Use getZyprusData tool."),
    titleDeedId: z
      .string()
      .uuid()
      .optional()
      .describe("Title deed UUID. Use getZyprusData tool."),
    // Optional location
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional()
      .describe("GPS coordinates of the land (latitude, longitude)"),
    // Optional metadata
    referenceId: z
      .string()
      .max(50)
      .optional()
      .describe("Your internal reference number for this land"),
    // Required images
    imageUrls: z
      .array(z.string().url())
      .min(1, "At least one land image is required for Zyprus listings")
      .describe(
        "Land image URLs (REQUIRED - at least 1 image). Use chat uploads or external URLs."
      ),
  }),
  execute: async ({
    name,
    description,
    price,
    landSize,
    landTypeId,
    locationId,
    listingTypeId,
    buildingDensity,
    siteCoverage,
    maxFloors,
    maxHeight,
    infrastructureIds,
    viewIds,
    priceModifierId,
    titleDeedId,
    coordinates,
    referenceId,
    imageUrls,
  }) => {
    try {
      // Get session for user authentication (web) or context (WhatsApp/Telegram)
      const session = await auth();
      const context = getUserContext();
      const userId = session?.user?.id ?? context?.user.id;

      if (!userId) {
        return {
          success: false,
          error: "Authentication required to create land listing",
        };
      }

      // Validate required fields
      if (!locationId) {
        return {
          success: false,
          error:
            "Location ID is required. Use the getZyprusData tool to fetch available locations first.",
        };
      }

      if (!landTypeId) {
        return {
          success: false,
          error:
            "Land type ID is required. Use the getZyprusData tool with resourceType='all_land' to fetch available land types.",
        };
      }

      if (!listingTypeId) {
        return {
          success: false,
          error:
            "Listing type ID is required. Use the getZyprusData tool to fetch available listing types (For Sale, For Rent, etc.).",
        };
      }

      // Create land listing in database
      const listing = await createLandListing({
        userId,
        name,
        description,
        price: price.toString(),
        currency: "EUR",
        landSize: landSize.toString(),
        landTypeId,
        locationId,
        listingTypeId,
        buildingDensity: buildingDensity?.toString(),
        siteCoverage: siteCoverage?.toString(),
        maxFloors,
        maxHeight: maxHeight?.toString(),
        infrastructureIds,
        viewIds,
        priceModifierId,
        titleDeedId,
        coordinates,
        referenceId,
        image: imageUrls,
        status: "draft",
        draftExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        success: true,
        listingId: listing.id,
        message: `✅ **Land Listing Draft Created!**

📋 **Land Summary**
${name}
📍 Location ID: ${locationId}
💰 €${price.toLocaleString()}
📐 ${landSize.toLocaleString()}m²
🏗️ Land Type: Set
🏷️ Listing Type: Set
${buildingDensity ? `📊 Building Density: ${buildingDensity}%` : ""}
${siteCoverage ? `📊 Site Coverage: ${siteCoverage}%` : ""}
${maxFloors ? `🏢 Max Floors: ${maxFloors}` : ""}
${maxHeight ? `📏 Max Height: ${maxHeight}m` : ""}
${infrastructureIds && infrastructureIds.length > 0 ? `⚡ Infrastructure: ${infrastructureIds.length} selected` : ""}
${viewIds && viewIds.length > 0 ? `👁️ Views: ${viewIds.length} selected` : ""}
${coordinates ? `📍 GPS: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : ""}
${referenceId ? `🔖 Reference: ${referenceId}` : ""}
${imageUrls && imageUrls.length > 0 ? `📸 Images: ${imageUrls.length} photo${imageUrls.length > 1 ? "s" : ""}` : ""}

Status: **Draft** (expires in 7 days)

Say "upload land listing" to publish to zyprus.com`,
      };
    } catch (error) {
      console.error("Error creating land listing:", error);
      return {
        success: false,
        error: "Failed to create land listing. Please try again.",
      };
    }
  },
});
