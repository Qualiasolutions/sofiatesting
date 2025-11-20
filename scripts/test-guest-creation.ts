#!/usr/bin/env tsx
import { createGuestUser } from "../lib/db/queries";

async function testGuestCreation() {
  try {
    console.log("Creating guest user...");
    const result = await createGuestUser();
    console.log("✅ Guest user created successfully:");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create guest user:");
    console.error(error);
    process.exit(1);
  }
}

testGuestCreation();
