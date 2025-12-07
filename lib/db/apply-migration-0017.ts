// Standalone migration script - run with: pnpm exec tsx lib/db/apply-migration-0017.ts
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL || "";
if (!connectionString) {
  console.error("POSTGRES_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 30,
});
const db = drizzle(client);

/**
 * Apply migration 0017 for Telegram lead management.
 * Run with: pnpm exec tsx lib/db/apply-migration-0017.ts
 */
async function applyMigration() {
  console.log("⏳ Applying migration 0017...");

  try {
    // 1. Create new tables
    console.log("Creating LeadForwardingRotation table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "LeadForwardingRotation" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "region" varchar(50) NOT NULL,
        "lastForwardedToAgentId" uuid,
        "forwardCount" integer DEFAULT 0 NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "LeadForwardingRotation_region_unique" UNIQUE("region")
      )
    `);

    console.log("Creating TelegramGroup table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "TelegramGroup" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "groupId" bigint NOT NULL,
        "groupName" varchar(256) NOT NULL,
        "groupType" varchar(32) NOT NULL,
        "region" varchar(50),
        "isActive" boolean DEFAULT true NOT NULL,
        "leadRoutingEnabled" boolean DEFAULT true NOT NULL,
        "defaultForwardTo" uuid,
        "alternateForwardTo" uuid,
        "lastMessageAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "TelegramGroup_groupId_unique" UNIQUE("groupId")
      )
    `);

    console.log("Creating TelegramLead table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "TelegramLead" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "sourceGroupId" bigint NOT NULL,
        "sourceGroupName" varchar(256),
        "originalMessageId" varchar(64),
        "originalMessageText" text,
        "senderTelegramId" bigint,
        "senderName" varchar(256),
        "propertyReferenceId" varchar(64),
        "propertyUrl" text,
        "propertyTitle" text,
        "propertyRegion" varchar(50),
        "propertyOwnerId" uuid,
        "clientName" varchar(256),
        "clientPhone" varchar(64),
        "clientEmail" varchar(256),
        "clientLanguage" varchar(20),
        "forwardedToAgentId" uuid,
        "forwardedToTelegramId" bigint,
        "forwardedToName" varchar(256),
        "forwardedMessageId" varchar(64),
        "groupAckMessageId" varchar(64),
        "status" varchar(32) DEFAULT 'forwarded' NOT NULL,
        "errorMessage" text,
        "agentResponseAt" timestamp,
        "closedAt" timestamp,
        "closedReason" varchar(100),
        "notes" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // 2. Modify ZyprusAgent.telegramUserId from bigint to varchar(64)
    console.log("Modifying ZyprusAgent.telegramUserId to varchar(64)...");
    await db.execute(sql`
      ALTER TABLE "ZyprusAgent" ALTER COLUMN "telegramUserId" SET DATA TYPE varchar(64) USING "telegramUserId"::varchar(64)
    `);

    // 3. Add new columns to PropertyListing (with IF NOT EXISTS check)
    console.log("Adding new columns to PropertyListing...");
    const propertyColumns = [
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "ownerName" varchar(256)`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "ownerPhone" varchar(64)`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "swimmingPool" varchar(32)`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "hasParking" boolean`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "hasAirConditioning" boolean`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "backofficeNotes" text`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "googleMapsUrl" text`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "verandaArea" real`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "plotArea" real`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "reviewStatus" varchar(32) DEFAULT 'pending'`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "firstReviewerId" uuid`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "secondReviewerId" uuid`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "submittedByAgentId" uuid`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "reviewNotes" text`,
      `ALTER TABLE "PropertyListing" ADD COLUMN IF NOT EXISTS "reviewedAt" timestamp`,
    ];

    for (const colSql of propertyColumns) {
      await db.execute(sql.raw(colSql));
    }

    // 4. Add canReceiveLeads column to ZyprusAgent
    console.log("Adding canReceiveLeads column to ZyprusAgent...");
    await db.execute(sql`
      ALTER TABLE "ZyprusAgent" ADD COLUMN IF NOT EXISTS "canReceiveLeads" boolean DEFAULT true NOT NULL
    `);

    // 5. Add foreign key constraints
    console.log("Adding foreign key constraints...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "LeadForwardingRotation" ADD CONSTRAINT "LeadForwardingRotation_lastForwardedToAgentId_ZyprusAgent_id_fk"
        FOREIGN KEY ("lastForwardedToAgentId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "TelegramGroup" ADD CONSTRAINT "TelegramGroup_defaultForwardTo_ZyprusAgent_id_fk"
        FOREIGN KEY ("defaultForwardTo") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "TelegramGroup" ADD CONSTRAINT "TelegramGroup_alternateForwardTo_ZyprusAgent_id_fk"
        FOREIGN KEY ("alternateForwardTo") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "TelegramLead" ADD CONSTRAINT "TelegramLead_propertyOwnerId_ZyprusAgent_id_fk"
        FOREIGN KEY ("propertyOwnerId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "TelegramLead" ADD CONSTRAINT "TelegramLead_forwardedToAgentId_ZyprusAgent_id_fk"
        FOREIGN KEY ("forwardedToAgentId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    // 6. Create indexes
    console.log("Creating indexes...");
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "LeadForwardingRotation_region_idx" ON "LeadForwardingRotation" USING btree ("region")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramGroup_groupId_idx" ON "TelegramGroup" USING btree ("groupId")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramGroup_groupType_idx" ON "TelegramGroup" USING btree ("groupType")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramGroup_region_idx" ON "TelegramGroup" USING btree ("region")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramGroup_isActive_idx" ON "TelegramGroup" USING btree ("isActive")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_sourceGroupId_idx" ON "TelegramLead" USING btree ("sourceGroupId")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_propertyReferenceId_idx" ON "TelegramLead" USING btree ("propertyReferenceId")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_forwardedToAgentId_idx" ON "TelegramLead" USING btree ("forwardedToAgentId")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_status_idx" ON "TelegramLead" USING btree ("status")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_createdAt_idx" ON "TelegramLead" USING btree ("createdAt" DESC NULLS LAST)`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_agent_status_idx" ON "TelegramLead" USING btree ("forwardedToAgentId","status")`
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "TelegramLead_group_createdAt_idx" ON "TelegramLead" USING btree ("sourceGroupId","createdAt" DESC NULLS LAST)`
    );

    console.log("✅ Migration 0017 applied successfully!");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

applyMigration();
