#!/usr/bin/env tsx

/**
 * Test script to verify property listing creation workflow
 * This simulates what SOFIA should do when a user requests property creation
 */

import { join } from "node:path";
import { config } from "dotenv";

// Load environment variables
config({ path: join(process.cwd(), ".env.local") });

import { getZyprusDataTool } from "../lib/ai/tools/get-zyprus-data";

async function testPropertyListingFlow() {
  console.log("🏠 Testing Property Listing Creation Workflow\n");
  console.log("=".repeat(50));

  // Step 1: Simulate user request
  const userRequest =
    "Create a 2 bedroom apartment in Nicosia, Engomi for €250,000";
  console.log(`📝 User Request: "${userRequest}"\n`);

  // Step 2: SOFIA should first get taxonomy data (silently)
  console.log("Step 1: Fetching Zyprus taxonomy data...");
  try {
    const taxonomyResult = await getZyprusDataTool.execute({
      resourceType: "all",
      refreshCache: false,
    });

    if (!taxonomyResult.success) {
      console.error("❌ Failed to fetch taxonomy:", taxonomyResult.error);
      return;
    }

    console.log("✅ Taxonomy data fetched successfully!");
    console.log(`  - Locations: ${taxonomyResult.data.locations.length}`);
    console.log(
      `  - Property Types: ${taxonomyResult.data.propertyTypes.length}`
    );
    console.log(
      `  - Indoor Features: ${taxonomyResult.data.indoorFeatures.length}`
    );
    console.log(
      `  - Outdoor Features: ${taxonomyResult.data.outdoorFeatures.length}`
    );

    // Step 3: SOFIA should match user input to taxonomy
    console.log("\nStep 2: Matching user input to taxonomy...");

    // Find Nicosia or Engomi location
    const locations = taxonomyResult.data.locations;
    const nicosiaLocation = locations.find(
      (loc) =>
        loc.name.toLowerCase().includes("nicosia") ||
        loc.name.toLowerCase().includes("engomi")
    );

    if (nicosiaLocation) {
      console.log(
        `✅ Found location: ${nicosiaLocation.name} (${nicosiaLocation.id})`
      );
    } else {
      console.log("⚠️  Could not find Nicosia/Engomi location");
      console.log("Available locations:");
      locations
        .slice(0, 5)
        .forEach((loc) => console.log(`  - ${loc.name} (${loc.id})`));
    }

    // Find apartment property type
    const propertyTypes = taxonomyResult.data.propertyTypes;
    const apartmentType = propertyTypes.find(
      (type) =>
        type.name.toLowerCase().includes("apartment") ||
        type.name.toLowerCase().includes("flat")
    );

    if (apartmentType) {
      console.log(
        `✅ Found property type: ${apartmentType.name} (${apartmentType.id})`
      );
    } else {
      console.log("⚠️  Could not find Apartment property type");
      console.log("Available property types:");
      propertyTypes
        .slice(0, 5)
        .forEach((type) => console.log(`  - ${type.name} (${type.id})`));
    }

    // Step 4: Create the listing with real UUIDs
    if (nicosiaLocation && apartmentType) {
      console.log("\nStep 3: Creating property listing with real UUIDs...");
      console.log(`  Location ID: ${nicosiaLocation.id}`);
      console.log(`  Property Type ID: ${apartmentType.id}`);
      console.log("  Price: €250,000");
      console.log("  Bedrooms: 2");
      console.log("  Bathrooms: 1");
      console.log("  Size: 85m²");

      // Note: We can't actually execute createListingTool here without a real session
      // but this shows the correct workflow
      console.log("\n✅ This is the correct workflow SOFIA should follow!");
      console.log("1. Silently fetch taxonomy data");
      console.log("2. Match user input to real UUIDs");
      console.log("3. Create listing with validated data");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("Test complete!");
}

// Run the test
testPropertyListingFlow().catch(console.error);
