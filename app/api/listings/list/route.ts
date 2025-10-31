import { auth } from "@/app/(auth)/auth";
import { getListingsByUserId } from "@/lib/db/queries";
import { NextResponse } from "next/server";

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
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const listings = await getListingsByUserId({
      userId: session.user.id,
      limit: Math.min(limit, 100), // Max 100 listings
    });

    return NextResponse.json({
      success: true,
      listings: listings.map(listing => ({
        id: listing.id,
        name: listing.name,
        description: listing.description,
        price: listing.price,
        currency: listing.currency,
        propertyType: listing.propertyType,
        status: listing.status,
        zyprusListingUrl: listing.zyprusListingUrl,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        address: listing.address,
        numberOfRooms: listing.numberOfRooms,
        numberOfBathroomsTotal: listing.numberOfBathroomsTotal,
        floorSize: listing.floorSize,
      })),
      count: listings.length,
    });
  } catch (error) {
    console.error("Failed to get listings:", error);
    return NextResponse.json(
      { error: "Failed to get listings" },
      { status: 500 }
    );
  }
}