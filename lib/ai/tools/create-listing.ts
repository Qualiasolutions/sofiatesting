import { tool } from "ai";
import { z } from "zod";
import { createPropertyListing } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";

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
    "Create a property listing draft for zyprus.com with all required property details",
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
    location: z
      .string()
      .min(3)
      .describe("City or area in Cyprus (e.g., 'Limassol')"),
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
      .max(10000)
      .describe("Property size in square meters"),
    propertyType: z
      .enum(["villa", "apartment", "house", "townhouse", "land", "commercial"])
      .optional()
      .describe("Type of property"),
    features: z
      .array(z.string())
      .optional()
      .describe("Property features/amenities (e.g., ['sea view', 'pool'])"),
  }),
  execute: async ({
    name,
    description,
    location,
    price,
    bedrooms,
    bathrooms,
    squareFootage,
    propertyType,
    features,
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

      // Validate Cyprus location
      const isValidLocation = CYPRUS_LOCATIONS.some((loc: string) =>
        location.toLowerCase().includes(loc)
      );

      if (!isValidLocation) {
        return {
          success: false,
          error: `Location must be in Cyprus. Valid areas: ${CYPRUS_LOCATIONS.join(", ")}`,
        };
      }

      // Create listing directly in database
      const listing = await createPropertyListing({
        userId: session.user.id,
        name,
        description,
        address: {
          streetAddress: "",
          addressLocality: location,
          addressCountry: "CY",
        },
        price: price.toString(),
        currency: "EUR",
        numberOfRooms: bedrooms,
        numberOfBathroomsTotal: bathrooms.toString(),
        floorSize: squareFootage.toString(),
        propertyType,
        amenityFeature: features || [],
        status: "draft",
        draftExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        success: true,
        listingId: listing.id,
        message: `✅ **Listing Draft Created!**

📋 **Property Summary**
${name}
📍 ${location}
💰 €${price.toLocaleString()}
🛏️ ${bedrooms} bedroom${bedrooms > 1 ? "s" : ""} | 🚿 ${bathrooms} bath${bathrooms > 1 ? "s" : ""}
📐 ${squareFootage}m²
${propertyType ? `🏠 Type: ${propertyType}` : ""}
${features && features.length > 0 ? `✨ Features: ${features.join(", ")}` : ""}

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
