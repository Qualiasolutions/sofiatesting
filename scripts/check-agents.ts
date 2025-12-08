import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const zyprusAgent = pgTable("ZyprusAgent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId"),
  fullName: text("fullName").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  region: varchar("region", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  canReceiveLeads: boolean("canReceiveLeads").notNull().default(true),
  telegramUserId: varchar("telegramUserId", { length: 64 }),
  whatsappPhoneNumber: varchar("whatsappPhoneNumber", { length: 20 }),
  lastActiveAt: timestamp("lastActiveAt"),
  registeredAt: timestamp("registeredAt"),
  inviteSentAt: timestamp("inviteSentAt"),
  inviteToken: varchar("inviteToken", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

async function main() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL or DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  const agents = await db.select().from(zyprusAgent);
  console.log("=== REGISTERED AGENTS ===");
  console.log("Total:", agents.length);
  console.log("");
  for (const agent of agents) {
    console.log("Name:", agent.fullName);
    console.log("  Email:", agent.email);
    console.log("  Phone:", agent.phoneNumber || "Not set");
    console.log("  Region:", agent.region || "Not set");
    console.log("  Role:", agent.role || "Not set");
    console.log("  Telegram ID:", agent.telegramUserId || "Not set");
    console.log("  WhatsApp:", agent.whatsappPhoneNumber || "Not set");
    console.log("  Active:", agent.isActive);
    console.log("  Can Receive Leads:", agent.canReceiveLeads);
    console.log("");
  }

  await client.end();
  process.exit(0);
}
main().catch(console.error);
