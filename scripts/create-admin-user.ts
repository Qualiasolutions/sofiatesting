/**
 * Create Admin User Script
 *
 * This script creates an admin user with superadmin role.
 * Run with: npx tsx scripts/create-admin-user.ts <email>
 */

import { db } from "@/lib/db/client";
import { user, adminUserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function createAdminUser(email: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    // Find user by email
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      console.error(`❌ User with email ${email} not found.`);
      console.log("\n💡 Please register an account first at /register");
      process.exit(1);
    }

    const foundUser = existingUser[0];
    console.log(`✅ Found user: ${foundUser.email} (${foundUser.id})`);

    // Check if already admin
    const existingAdmin = await db
      .select()
      .from(adminUserRole)
      .where(eq(adminUserRole.userId, foundUser.id))
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      console.log(`⚠️  User is already an admin with role: ${existingAdmin[0].role}`);
      console.log("\nUpdating to superadmin...");

      await db
        .update(adminUserRole)
        .set({
          role: "superadmin",
          permissions: {
            agents: { view: true, create: true, edit: true, delete: true },
            health: { view: true },
            integrations: { view: true, edit: true },
            settings: { view: true, edit: true },
            users: { view: true, create: true, edit: true, delete: true },
            whatsapp: { view: true, edit: true },
          },
        })
        .where(eq(adminUserRole.userId, foundUser.id));

      console.log("✅ Updated to superadmin!");
    } else {
      console.log("\n🔧 Creating superadmin role...");

      await db.insert(adminUserRole).values({
        userId: foundUser.id,
        role: "superadmin",
        permissions: {
          agents: { view: true, create: true, edit: true, delete: true },
          health: { view: true },
          integrations: { view: true, edit: true },
          settings: { view: true, edit: true },
          users: { view: true, create: true, edit: true, delete: true },
          whatsapp: { view: true, edit: true },
        },
        createdBy: foundUser.id,
      });

      console.log("✅ Superadmin role created!");
    }

    console.log("\n🎉 Success!");
    console.log(`\n📋 Admin Details:`);
    console.log(`   Email: ${foundUser.email}`);
    console.log(`   User ID: ${foundUser.id}`);
    console.log(`   Role: superadmin`);
    console.log(`\n🔗 You can now access the admin panel at:`);
    console.log(`   http://localhost:3000/admin`);
    console.log(`   http://localhost:3000/admin/agents-registry`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("\nUsage: npx tsx scripts/create-admin-user.ts <email>");
  console.log("Example: npx tsx scripts/create-admin-user.ts admin@zyprus.com");
  process.exit(1);
}

createAdminUser(email);
