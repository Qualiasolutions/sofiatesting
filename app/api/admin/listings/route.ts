import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/client";
import { propertyListing, user } from "@/lib/db/schema";

/**
 * GET /api/admin/listings - Get all property listings for admin review
 * Returns all listings, with optional status filter
 */
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // draft, uploaded, failed
    const limit = Math.min(
      Number.parseInt(url.searchParams.get("limit") || "50", 10),
      200
    );

    // Build query
    let query = db
      .select({
        id: propertyListing.id,
        name: propertyListing.name,
        description: propertyListing.description,
        price: propertyListing.price,
        currency: propertyListing.currency,
        propertyType: propertyListing.propertyType,
        status: propertyListing.status,
        reviewStatus: propertyListing.reviewStatus,
        zyprusListingId: propertyListing.zyprusListingId,
        zyprusListingUrl: propertyListing.zyprusListingUrl,
        createdAt: propertyListing.createdAt,
        updatedAt: propertyListing.updatedAt,
        address: propertyListing.address,
        numberOfRooms: propertyListing.numberOfRooms,
        numberOfBathroomsTotal: propertyListing.numberOfBathroomsTotal,
        floorSize: propertyListing.floorSize,
        ownerName: propertyListing.ownerName,
        ownerPhone: propertyListing.ownerPhone,
        swimmingPool: propertyListing.swimmingPool,
        hasParking: propertyListing.hasParking,
        hasAirConditioning: propertyListing.hasAirConditioning,
        backofficeNotes: propertyListing.backofficeNotes,
        googleMapsUrl: propertyListing.googleMapsUrl,
        reviewNotes: propertyListing.reviewNotes,
        userId: propertyListing.userId,
        userEmail: user.email,
      })
      .from(propertyListing)
      .leftJoin(user, eq(propertyListing.userId, user.id))
      .orderBy(desc(propertyListing.createdAt))
      .limit(limit);

    // Apply status filter if provided
    if (status) {
      query = query.where(eq(propertyListing.status, status)) as typeof query;
    }

    const listings = await query;

    return NextResponse.json({
      success: true,
      listings,
      count: listings.length,
    });
  } catch (error) {
    console.error("Failed to get admin listings:", error);
    return NextResponse.json(
      { error: "Failed to get listings" },
      { status: 500 }
    );
  }
}
