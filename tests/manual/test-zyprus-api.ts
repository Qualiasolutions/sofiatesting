import { config } from "dotenv";
import {
  getZyprusLocations,
  getZyprusTaxonomyTerms,
} from "../lib/zyprus/client";

// Load environment variables
config({ path: ".env.local" });

async function testZyprusAPI() {
  console.log("🧪 Testing Zyprus API Integration\n");
  console.log("API URL:", process.env.ZYPRUS_API_URL);
  console.log(
    "Client ID:",
    `${process.env.ZYPRUS_CLIENT_ID?.substring(0, 15)}...\n`
  );

  try {
    // Test 1: Locations
    console.log("1️⃣  Testing Locations Endpoint...");
    const locations = await getZyprusLocations();
    console.log(`✅ SUCCESS: Fetched ${locations.length} locations`);
    if (locations[0]) {
      console.log(
        `   Sample: ${locations[0].attributes.title} (${locations[0].id})`
      );
    }

    // Test 2: Property Types
    console.log("\n2️⃣  Testing Property Types Taxonomy...");
    const propertyTypes = await getZyprusTaxonomyTerms("property_type");
    console.log(`✅ SUCCESS: Fetched ${propertyTypes.length} property types`);
    if (propertyTypes[0]) {
      console.log(
        `   Sample: ${propertyTypes[0].attributes.name} (${propertyTypes[0].id})`
      );
    }

    // Test 3: Indoor Features
    console.log("\n3️⃣  Testing Indoor Features Taxonomy...");
    const indoorFeatures = await getZyprusTaxonomyTerms(
      "indoor_property_features"
    );
    console.log(`✅ SUCCESS: Fetched ${indoorFeatures.length} indoor features`);

    // Test 4: Outdoor Features
    console.log("\n4️⃣  Testing Outdoor Features Taxonomy...");
    const outdoorFeatures = await getZyprusTaxonomyTerms(
      "outdoor_property_features"
    );
    console.log(
      `✅ SUCCESS: Fetched ${outdoorFeatures.length} outdoor features`
    );

    // Test 5: Price Modifiers
    console.log("\n5️⃣  Testing Price Modifiers Taxonomy...");
    const priceModifiers = await getZyprusTaxonomyTerms("price_modifier");
    console.log(`✅ SUCCESS: Fetched ${priceModifiers.length} price modifiers`);

    // Test 6: Title Deeds
    console.log("\n6️⃣  Testing Title Deeds Taxonomy...");
    const titleDeeds = await getZyprusTaxonomyTerms("title_deed");
    console.log(`✅ SUCCESS: Fetched ${titleDeeds.length} title deed types`);

    console.log("\n═══════════════════════════════════════");
    console.log("🎉 ALL ZYPRUS API TESTS PASSED!");
    console.log("═══════════════════════════════════════");
    console.log("\nTotal API calls: 6");
    console.log(
      `Total resources fetched: ${
        locations.length +
        propertyTypes.length +
        indoorFeatures.length +
        outdoorFeatures.length +
        priceModifiers.length +
        titleDeeds.length
      }`
    );
  } catch (error: any) {
    console.error("\n❌ ZYPRUS API TEST FAILED");
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Code:", error.code);
    }
    if (error.statusCode) {
      console.error("Status:", error.statusCode);
    }
    process.exit(1);
  }
}

testZyprusAPI();
