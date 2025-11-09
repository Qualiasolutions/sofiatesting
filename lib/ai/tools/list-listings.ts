import { tool } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getListingsByUserId } from "@/lib/db/queries";

const STATUS_EMOJIS: Record<string, string> = {
  draft: "📝",
  queued: "⏳",
  uploading: "⬆️",
  uploaded: "✅",
  failed: "❌",
  published: "✅",
};

export const listListingsTool = tool({
  description:
    "Show user's property listings with status. Displays recent listings created by the user.",
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Number of listings to show (max 50)"),
  }),
  execute: async ({ limit }) => {
    try {
      // Get session for user authentication
      const session = await auth();
      if (!session?.user?.id) {
        return {
          success: false,
          error: "Authentication required to view listings",
        };
      }

      // Get listings from database
      const listings = await getListingsByUserId({
        userId: session.user.id,
        limit: Math.min(limit, 100), // Max 100 listings
      });

      if (listings.length === 0) {
        return {
          success: true,
          message:
            "You haven't created any listings yet. Start by saying 'create a listing'",
        };
      }

      const formatted = listings
        .map((listing, index: number) => {
          const emoji = STATUS_EMOJIS[listing.status] || "❓";
          const price = Number.parseFloat(listing.price);
          const createdDate = new Date(listing.createdAt).toLocaleDateString();

          let statusLine = `Status: ${listing.status}`;
          if (listing.zyprusListingUrl) {
            statusLine += ` | [View Listing](${listing.zyprusListingUrl})`;
          }

          return `${index + 1}. ${emoji} **${listing.name}**
   📍 ${(listing.address as any).addressLocality} | 💰 €${price.toLocaleString()}
   🛏️ ${listing.numberOfRooms} bed | 🚿 ${listing.numberOfBathroomsTotal} bath | 📐 ${listing.floorSize}m²
   ${statusLine}
   Created: ${createdDate}`;
        })
        .join("\n\n");

      return {
        success: true,
        message: `📋 **Your Property Listings** (${listings.length} total)\n\n${formatted}`,
      };
    } catch (error) {
      console.error("Error listing properties:", error);
      return {
        success: false,
        error: "Failed to retrieve listings",
      };
    }
  },
});
