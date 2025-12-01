/**
 * Direct Admin User Creation (No Server-Only Dependencies)
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Schema definitions (inline to avoid server-only issues)
const _schema = {
  user: {
    tableName: "User",
  },
  adminUserRole: {
    tableName: "AdminUserRole",
  },
};

async function createAdmin(email: string) {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ POSTGRES_URL not found in environment");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    // Find user
    const users: any[] = await db.execute(
      postgres.typed`SELECT * FROM "User" WHERE email = ${email} LIMIT 1`
    );

    if (users.length === 0) {
      console.error(`❌ User with email ${email} not found.`);
      console.log("\n💡 Please register an account first at:");
      console.log("   https://sofiatesting.vercel.app/register");
      await client.end();
      process.exit(1);
    }

    const foundUser = users[0];
    console.log(`✅ Found user: ${foundUser.email} (${foundUser.id})`);

    // Check if already admin
    const existingAdmins: any[] = await db.execute(
      postgres.typed`SELECT * FROM "AdminUserRole" WHERE "userId" = ${foundUser.id} LIMIT 1`
    );

    if (existingAdmins.length > 0) {
      console.log(
        `⚠️  User is already an admin with role: ${existingAdmins[0].role}`
      );
      console.log("\nUpdating to superadmin...");

      await db.execute(
        postgres.typed`
          UPDATE "AdminUserRole"
          SET
            role = 'superadmin',
            permissions = '{"agents": {"view": true, "create": true, "edit": true, "delete": true}, "health": {"view": true}, "integrations": {"view": true, "edit": true}, "settings": {"view": true, "edit": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "whatsapp": {"view": true, "edit": true}}'::jsonb
          WHERE "userId" = ${foundUser.id}
        `
      );

      console.log("✅ Updated to superadmin!");
    } else {
      console.log("\n🔧 Creating superadmin role...");

      await db.execute(
        postgres.typed`
          INSERT INTO "AdminUserRole" ("userId", "role", "permissions", "createdAt", "createdBy")
          VALUES (
            ${foundUser.id},
            'superadmin',
            '{"agents": {"view": true, "create": true, "edit": true, "delete": true}, "health": {"view": true}, "integrations": {"view": true, "edit": true}, "settings": {"view": true, "edit": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "whatsapp": {"view": true, "edit": true}}'::jsonb,
            NOW(),
            ${foundUser.id}
          )
        `
      );

      console.log("✅ Superadmin role created!");
    }

    console.log("\n🎉 Success!");
    console.log("\n📋 Admin Details:");
    console.log(`   Email: ${foundUser.email}`);
    console.log(`   User ID: ${foundUser.id}`);
    console.log("   Role: superadmin");
    console.log("\n🔗 You can now access the admin panel at:");
    console.log("   https://sofiatesting.vercel.app/admin");
    console.log("   https://sofiatesting.vercel.app/admin/agents-registry");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await client.end();
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("\nUsage: npx tsx scripts/create-admin-direct.ts <email>");
  console.log(
    "Example: npx tsx scripts/create-admin-direct.ts admin@zyprus.com"
  );
  process.exit(1);
}

createAdmin(email);
