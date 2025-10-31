import { NextResponse } from "next/server";
import { getZyprusTaxonomyTerms } from "@/lib/zyprus/client";
import { auth } from "@/app/(auth)/auth";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const vocabularyType = searchParams.get("type");

  if (!vocabularyType) {
    return NextResponse.json(
      { error: "Vocabulary type is required" },
      { status: 400 }
    );
  }

  // Valid vocabulary types for Zyprus
  const validTypes = [
    "indoor_property_views",
    "outdoor_property_features",
    "listing_type",
    "property_type",
    "price_modifier",
    "title_deed",
  ];

  if (!validTypes.includes(vocabularyType)) {
    return NextResponse.json(
      { error: "Invalid vocabulary type" },
      { status: 400 }
    );
  }

  try {
    const terms = await getZyprusTaxonomyTerms(vocabularyType);
    return NextResponse.json({ success: true, terms });
  } catch (error: any) {
    console.error("Failed to fetch taxonomy terms:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch taxonomy terms",
        code: error.code || "FETCH_ERROR"
      },
      { status: error.statusCode || 500 }
    );
  }
}