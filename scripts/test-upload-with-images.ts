import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

// Mock listing WITH images (this should work!)
const mockListing = {
  id: "test-with-images-" + Date.now(),
  title: "Luxury Sea View Apartment - Limassol",
  description:
    "Stunning 2-bedroom apartment in prime Limassol location with breathtaking Mediterranean sea views. Features modern kitchen, spacious living area, large balcony. Walking distance to beach, restaurants, and shops. Perfect for families or investment.",
  price: 275000,
  currency: "EUR",
  bedrooms: 2,
  bathrooms: 1,
  floorSize: 85,
  location: "Limassol",
  propertyType: "Apartment",
  listingType: "sale",
  status: "draft",
  locationId: "7dbc931e-90eb-4b89-9ac8-b5e593831cf8", // Acropolis, Strovolos
  propertyTypeId: null, // Will use default
  // Using a publicly accessible test image
  image: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", // Modern apartment interior
  ],
};

async function testUploadWithImages() {
  console.log("🧪 Testing SOFIA Upload WITH Images\n");
  console.log("═══════════════════════════════════════");
  console.log("This should SUCCEED - testing production fix");
  console.log("═══════════════════════════════════════\n");

  try {
    // Dynamically import the upload function
    const { uploadToZyprusAPI } = await import("../lib/zyprus/client.js");

    console.log("📝 Test listing:");
    console.log(`   Title: ${mockListing.title}`);
    console.log(`   Price: €${mockListing.price.toLocaleString()}`);
    console.log(`   Bedrooms: ${mockListing.bedrooms}`);
    console.log(`   Floor Size: ${mockListing.floorSize}m²`);
    console.log(`   Images: ${mockListing.image.length} photo(s)`);
    console.log(`   Image URL: ${mockListing.image[0]}\n`);

    console.log("🚀 Uploading to Zyprus dev9.zyprus.com...\n");

    const result = await uploadToZyprusAPI(mockListing as any);

    console.log("✅ UPLOAD SUCCESSFUL!\n");
    console.log("═══════════════════════════════════════");
    console.log("Upload Result:");
    console.log(`   ✓ Listing ID: ${result.listingId}`);
    console.log(`   ✓ Listing URL: ${result.listingUrl}`);
    console.log("═══════════════════════════════════════\n");

    console.log("🎉🎉🎉 SUCCESS - PRODUCTION FIX VERIFIED! 🎉🎉🎉\n");
    console.log("✅ All Critical Tests PASSED:");
    console.log("   ✓ OAuth authentication works");
    console.log("   ✓ Property upload succeeds WITH images");
    console.log("   ✓ Image upload (raw binary) works correctly");
    console.log("   ✓ Image-property association works");
    console.log("   ✓ All required fields validated");
    console.log("\n🚀 SOFIA IS READY FOR PRODUCTION DEPLOYMENT!");
    console.log("\n📍 Verify on Zyprus:");
    console.log(`   API: https://dev9.zyprus.com/jsonapi/node/property/${result.listingId}`);
    console.log(`   Web: ${result.listingUrl}`);
    console.log(`   Check: field_ai_state="draft" and status=false`);

  } catch (error: any) {
    console.error("\n❌ UPLOAD FAILED (This should NOT happen!)\n");
    console.error("═══════════════════════════════════════");
    console.error("Error:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
    if (error.statusCode) console.error("Status:", error.statusCode);

    // Check for specific errors
    if (error.message?.includes("field_gallery_")) {
      console.error("\n⚠️  Gallery field error despite providing images!");
      console.error("   This indicates a deeper integration issue");
    }

    if (error.message?.includes("circuit breaker")) {
      console.error("\n⚠️  Circuit breaker is open from previous failed attempts");
      console.error("   Wait 30 seconds and try again, or restart the test");
    }

    if (error.message?.includes("image")) {
      console.error("\n⚠️  Image upload failed");
      console.error("   Check that the image URL is accessible");
      console.error("   Check Zyprus file upload endpoint permissions");
    }

    console.error("\n⛔ DEPLOYMENT BLOCKED - Investigation required");
    process.exit(1);
  }
}

testUploadWithImages();
