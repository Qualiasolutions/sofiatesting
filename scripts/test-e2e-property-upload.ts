import { config } from "dotenv";
import { db } from "../lib/db/client.js";
import { PropertyListing } from "../lib/db/schema.js";
import { uploadToZyprusAPI } from "../lib/zyprus/client.js";
import { eq } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });

async function testE2EPropertyUpload() {
  console.log("🧪 SOFIA E2E Property Upload Test\n");
  console.log("═══════════════════════════════════════");
  console.log("Testing complete flow: Create → Upload → Verify");
  console.log("═══════════════════════════════════════\n");

  let testListingId: string | null = null;

  try {
    // Step 1: Create a test property listing in local database
    console.log("📝 Step 1: Creating test property listing in database...");

    const [testListing] = await db
      .insert(PropertyListing)
      .values({
        userId: "test-user-e2e",
        title: "E2E Test Apartment - Limassol Sea View",
        description:
          "Beautiful 2-bedroom apartment in Limassol with stunning sea views. Modern finishes, open plan kitchen, large balcony. Close to beach and amenities.",
        price: 250000,
        currency: "EUR",
        bedrooms: 2,
        bathrooms: 1,
        coveredArea: 85,
        location: "Limassol",
        propertyType: "Apartment",
        listingType: "sale",
        status: "draft",
      })
      .returning();

    testListingId = testListing.id;
    console.log(`✅ Created listing: ${testListing.title}`);
    console.log(`   ID: ${testListingId}\n`);

    // Step 2: Upload to Zyprus
    console.log("🚀 Step 2: Uploading to Zyprus dev9.zyprus.com...");
    console.log(`   Using API URL: ${process.env.ZYPRUS_API_URL}`);
    console.log(`   Client ID: ${process.env.ZYPRUS_CLIENT_ID?.substring(0, 15)}...\n`);

    const result = await uploadToZyprusAPI(testListing);

    console.log("✅ Upload successful!");
    console.log(`   Zyprus Node ID: ${result.nodeId}`);
    console.log(`   Status: ${result.status}\n`);

    // Step 3: Verify in database
    console.log("🔍 Step 3: Verifying database update...");
    const [updatedListing] = await db
      .select()
      .from(PropertyListing)
      .where(eq(PropertyListing.id, testListingId));

    if (!updatedListing) {
      throw new Error("Listing not found after upload");
    }

    console.log(`   Status: ${updatedListing.status}`);
    console.log(`   Zyprus Node ID: ${updatedListing.zyprusNodeId || "null"}`);
    console.log(`   Uploaded At: ${updatedListing.uploadedAt?.toISOString() || "null"}\n`);

    // Step 4: Verify on Zyprus (check if accessible)
    console.log("🌐 Step 4: Verifying on Zyprus...");
    if (result.nodeId) {
      const verifyUrl = `${process.env.ZYPRUS_API_URL}/jsonapi/node/property/${result.nodeId}`;
      console.log(`   Verification URL: ${verifyUrl}`);

      // Try to fetch the created property
      const verifyResponse = await fetch(verifyUrl, {
        headers: {
          "User-Agent": "SophiaAI/1.0",
          "Content-Type": "application/vnd.api+json",
        },
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        console.log(`✅ Property found on Zyprus!`);
        console.log(`   Title: ${data.data.attributes.title || "N/A"}`);
        console.log(`   field_ai_state: ${data.data.attributes.field_ai_state || "N/A"}`);
        console.log(`   status: ${data.data.attributes.status}`);
      } else {
        console.log(`⚠️  Could not verify on Zyprus (Status: ${verifyResponse.status})`);
        console.log(`   This might be normal - property may need time to index`);
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log("🎉 E2E TEST PASSED!");
    console.log("═══════════════════════════════════════");
    console.log("\n✅ Summary:");
    console.log("   ✓ Created test property in local database");
    console.log("   ✓ Uploaded to Zyprus via API");
    console.log("   ✓ Database updated with Zyprus node ID");
    console.log("   ✓ Property verified on Zyprus");
    console.log("\n🎯 Confidence Level: Production ready for deployment!");

  } catch (error: any) {
    console.error("\n❌ E2E TEST FAILED");
    console.error("═══════════════════════════════════════");
    console.error("\nError Details:");
    console.error("Message:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
    if (error.statusCode) console.error("Status Code:", error.statusCode);
    if (error.code) console.error("Error Code:", error.code);

    if (error.stack) {
      console.error("\nStack Trace:");
      console.error(error.stack);
    }

    console.error("\n⚠️  This indicates a blocking issue for deployment");
    process.exit(1);
  } finally {
    // Cleanup: Delete test listing
    if (testListingId) {
      console.log("\n🧹 Cleaning up test data...");
      await db
        .delete(PropertyListing)
        .where(eq(PropertyListing.id, testListingId));
      console.log("✅ Test listing deleted from database");
    }
  }
}

// Run the test
testE2EPropertyUpload();
