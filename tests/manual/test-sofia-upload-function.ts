import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

// Mock the listing structure that uploadToZyprusAPI expects
const mockListing = {
  id: `test-${Date.now()}`,
  title: "Test Property - Modern Apartment",
  description:
    "Beautiful 2-bedroom apartment in Limassol with sea views. Modern finishes, open kitchen, large balcony.",
  price: 250_000,
  currency: "EUR",
  bedrooms: 2,
  bathrooms: 1,
  floorSize: 85, // Note: field name is floorSize, not coveredArea
  location: "Limassol",
  propertyType: "Apartment",
  listingType: "sale",
  status: "draft",
  locationId: "7dbc931e-90eb-4b89-9ac8-b5e593831cf8", // Acropolis, Strovolos
  propertyTypeId: null, // Will use default
  image: [], // Empty array - no images
};

async function testActualUploadFunction() {
  console.log("🧪 Testing ACTUAL SOFIA Upload Function\n");
  console.log("═══════════════════════════════════════");
  console.log("Using real uploadToZyprusAPI from lib/zyprus/client.ts");
  console.log("═══════════════════════════════════════\n");

  try {
    // Dynamically import the upload function (to avoid server-only issues)
    const { uploadToZyprusAPI } = await import("../lib/zyprus/client.js");

    console.log("📝 Test listing:");
    console.log(`   Title: ${mockListing.title}`);
    console.log(`   Price: €${mockListing.price.toLocaleString()}`);
    console.log(`   Bedrooms: ${mockListing.bedrooms}`);
    console.log(`   Images: ${mockListing.image.length} (empty array)\n`);

    console.log("🚀 Uploading to Zyprus...\n");

    const result = await uploadToZyprusAPI(mockListing as any);

    console.log("✅ UPLOAD SUCCESSFUL!\n");
    console.log("═══════════════════════════════════════");
    console.log("Result:");
    console.log(`   Node ID: ${result.nodeId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message || "N/A"}`);
    console.log("═══════════════════════════════════════\n");

    console.log("🎉 SOFIA upload function works with empty images!");
    console.log("✅ Production deployment is SAFE");
  } catch (error: any) {
    console.error("\n❌ UPLOAD FAILED\n");
    console.error("═══════════════════════════════════════");
    console.error("Error:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    if (error.statusCode) {
      console.error("Status:", error.statusCode);
    }

    if (error.message?.includes("field_gallery_")) {
      console.error("\n⚠️  CRITICAL: Zyprus API requires at least one image!");
      console.error(
        "   Action required: Update SOFIA to enforce image requirement"
      );
    }

    console.error("\n⛔ DEPLOYMENT BLOCKED");
    process.exit(1);
  }
}

testActualUploadFunction();
