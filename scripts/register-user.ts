/**
 * Register a new user in the database
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { genSaltSync, hashSync } from "bcrypt-ts";

async function registerUser(email: string, password: string, name?: string) {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ POSTGRES_URL not found in environment");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log(`🔍 Checking if user ${email} exists...`);

    // Check if user already exists
    const existingUsers: any[] = await client`SELECT * FROM "User" WHERE email = ${email} LIMIT 1`;

    if (existingUsers.length > 0) {
      console.log(`⚠️  User ${email} already exists!`);
      console.log(`   User ID: ${existingUsers[0].id}`);
      console.log(`   Created: ${existingUsers[0].createdAt}`);

      // Ask if we should update password
      console.log("\n🔐 Updating password...");
      const salt = genSaltSync(10);
      const hashedPassword = hashSync(password, salt);

      await db.execute(
        postgres.sql`
          UPDATE "User"
          SET password = ${hashedPassword}
          WHERE email = ${email}
        `
      );

      console.log("✅ Password updated successfully!");
      await client.end();
      process.exit(0);
    }

    console.log("🔧 Creating new user...");

    // Hash password
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);

    // Create user
    const result: any[] = await db.execute(
      postgres.sql`
        INSERT INTO "User" (id, email, password)
        VALUES (gen_random_uuid(), ${email}, ${hashedPassword})
        RETURNING id, email, "createdAt"
      `
    );

    const newUser = result[0];

    console.log("✅ User created successfully!");
    console.log(`\n📋 User Details:`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Created: ${newUser.createdAt}`);
    console.log(`\n🔗 You can now login at:`);
    console.log(`   http://localhost:3000/login (development)`);
    console.log(`   https://sofiatesting.vercel.app/login (production)`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await client.end();
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("❌ Please provide email and password");
  console.log("\nUsage: npx tsx scripts/register-user.ts <email> <password>");
  console.log("Example: npx tsx scripts/register-user.ts listing@zyprus.com 123123123");
  process.exit(1);
}

registerUser(email, password);
