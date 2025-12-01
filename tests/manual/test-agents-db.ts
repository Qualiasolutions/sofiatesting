import { config } from "dotenv";
import { count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { zyprusAgent } from "../../lib/db/schema";

// Load environment variables
config({ path: ".env.local" });

async function testAgentsDatabase() {
  console.log("🧪 Testing Agent Registry Database\n");

  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    // Test 1: Count total agents
    console.log("📊 Test 1: Count total agents");
    const [totalCount] = await db.select({ count: count() }).from(zyprusAgent);
    console.log(`   ✅ Total agents: ${totalCount.count}\n`);

    // Test 2: Count by region
    console.log("📍 Test 2: Agents by region");
    const byRegion = await db
      .select({
        region: zyprusAgent.region,
        count: sql<number>`count(*)`,
      })
      .from(zyprusAgent)
      .groupBy(zyprusAgent.region)
      .orderBy(sql`count(*) DESC`);

    byRegion.forEach((r) => {
      console.log(`   ${r.region}: ${r.count} agents`);
    });
    console.log();

    // Test 3: Count by role
    console.log("👥 Test 3: Agents by role");
    const byRole = await db
      .select({
        role: zyprusAgent.role,
        count: sql<number>`count(*)`,
      })
      .from(zyprusAgent)
      .groupBy(zyprusAgent.role)
      .orderBy(sql`count(*) DESC`);

    byRole.forEach((r) => {
      console.log(`   ${r.role}: ${r.count} agents`);
    });
    console.log();

    // Test 4: Check CEO
    console.log("👑 Test 4: Find CEO");
    const [ceo] = await db
      .select()
      .from(zyprusAgent)
      .where(eq(zyprusAgent.role, "CEO"))
      .limit(1);

    if (ceo) {
      console.log(`   ✅ CEO: ${ceo.fullName} (${ceo.email})`);
      console.log(`      Region: ${ceo.region}`);
      console.log(`      Phone: ${ceo.phoneNumber}`);
      console.log(`      Active: ${ceo.isActive}`);
    }
    console.log();

    // Test 5: Check Limassol managers
    console.log("🏢 Test 5: Limassol managers");
    const managers = await db
      .select()
      .from(zyprusAgent)
      .where(eq(zyprusAgent.role, "Manager Limassol"));

    managers.forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.fullName} (${m.email})`);
    });
    console.log();

    // Test 6: Check agents with invite tokens
    console.log("🎫 Test 6: Agents with invite tokens");
    const withTokens = await db
      .select({ count: sql<number>`count(*)` })
      .from(zyprusAgent)
      .where(sql`${zyprusAgent.inviteToken} IS NOT NULL`);

    console.log(`   ✅ Agents with invite tokens: ${withTokens[0].count}`);
    console.log();

    // Test 7: Check registered vs pending
    console.log("📝 Test 7: Registration status");
    const [registered] = await db
      .select({ count: sql<number>`count(*)` })
      .from(zyprusAgent)
      .where(sql`${zyprusAgent.registeredAt} IS NOT NULL`);

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(zyprusAgent)
      .where(sql`${zyprusAgent.registeredAt} IS NULL`);

    console.log(`   ✅ Registered: ${registered.count}`);
    console.log(`   ⏳ Pending registration: ${pending.count}`);
    console.log();

    // Test 8: Sample agent with all fields
    console.log("🔍 Test 8: Sample agent (full details)");
    const [sample] = await db
      .select()
      .from(zyprusAgent)
      .where(eq(zyprusAgent.email, "maria@zyprus.com"))
      .limit(1);

    if (sample) {
      console.log(`   Name: ${sample.fullName}`);
      console.log(`   Email: ${sample.email}`);
      console.log(`   Phone: ${sample.phoneNumber}`);
      console.log(`   Region: ${sample.region}`);
      console.log(`   Role: ${sample.role}`);
      console.log(`   Active: ${sample.isActive}`);
      console.log(
        `   Invite Token: ${sample.inviteToken?.substring(0, 16)}...`
      );
      console.log(
        `   Telegram Linked: ${sample.telegramUserId ? "Yes" : "No"}`
      );
      console.log(
        `   WhatsApp Linked: ${sample.whatsappPhoneNumber ? "Yes" : "No"}`
      );
      console.log(`   Created: ${sample.createdAt?.toISOString()}`);
    }
    console.log();

    console.log("✅ All database tests passed!");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing database:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    await client.end();
    process.exit(1);
  }
}

testAgentsDatabase();
