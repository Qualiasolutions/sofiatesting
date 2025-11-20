import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { zyprusAgent } from "../lib/db/schema";
import * as XLSX from "xlsx";
import { randomBytes } from "crypto";

// Load environment variables
config({ path: ".env.local" });

/**
 * Standalone Seed Script: Import Zyprus Agents from Excel Spreadsheet
 *
 * This version doesn't use the server-only client, so it can run in Node.js directly
 *
 * Usage:
 *   pnpm tsx scripts/seed-agents-standalone.ts
 */

interface AgentRow {
  "Fulla Name": string;
  "Mobile Phone": string | number;
  "Email use to communicate": string;
  Region: string;
  Role: string;
}

function normalizePhoneNumber(phone: string | number): string {
  if (typeof phone === "number") {
    const phoneStr = phone.toString();
    if (phoneStr.startsWith("357")) {
      return `+${phoneStr}`;
    }
    return `+357${phoneStr}`;
  }

  let cleaned = phone.trim();
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("357")) {
      cleaned = `+${cleaned}`;
    } else {
      cleaned = `+357${cleaned.replace(/\s+/g, "")}`;
    }
  }

  return cleaned;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

async function seedAgents(excelPath: string) {
  console.log("🚀 Starting Zyprus Agent Import");
  console.log(`📄 Reading Excel file: ${excelPath}\n`);

  // Create database connection
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<AgentRow>(worksheet);

    console.log(`📊 Found ${rawData.length} agents in Excel file\n`);

    // Transform data for database
    const agents = rawData
      .filter((row) => row["Fulla Name"] && row["Email use to communicate"])
      .map((row) => ({
        fullName: row["Fulla Name"].trim(),
        email: normalizeEmail(row["Email use to communicate"]),
        phoneNumber: row["Mobile Phone"]
          ? normalizePhoneNumber(row["Mobile Phone"])
          : null,
        region: row.Region.trim(),
        role: row.Role.trim(),
        isActive: true,
        inviteToken: generateInviteToken(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    console.log(`✅ Processed ${agents.length} valid agents\n`);

    // Regional breakdown
    const regionCounts = agents.reduce(
      (acc, agent) => {
        acc[agent.region] = (acc[agent.region] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📍 Regional Breakdown:");
    Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([region, count]) => {
        console.log(`   ${region}: ${count} agents`);
      });

    // Role breakdown
    const roleCounts = agents.reduce(
      (acc, agent) => {
        acc[agent.role] = (acc[agent.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\n👥 Role Breakdown:");
    Object.entries(roleCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([role, count]) => {
        console.log(`   ${role}: ${count} agents`);
      });

    console.log("\n💾 Inserting agents into database...");

    // Insert agents
    const inserted = await db
      .insert(zyprusAgent)
      .values(agents)
      .returning({ id: zyprusAgent.id, email: zyprusAgent.email });

    console.log(`\n✅ Successfully inserted ${inserted.length} agents!`);

    console.log("\n📋 Sample Agents:");
    inserted.slice(0, 5).forEach((agent, idx) => {
      const agentData = agents.find((a) => a.email === agent.email);
      console.log(
        `   ${idx + 1}. ${agentData?.fullName} (${agentData?.region}) - ${agent.email}`
      );
    });

    console.log("\n🎉 Agent import completed successfully!");
    console.log(
      "\n📧 Next steps:\n   1. Send registration invites to agents\n   2. Agents register using invite tokens\n   3. Link Telegram/WhatsApp accounts"
    );

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing agents:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    await client.end();
    process.exit(1);
  }
}

// Main execution
const excelPath =
  process.argv[2] || "/home/qualiasolutions/Downloads/Untitled spreadsheet.xlsx";

seedAgents(excelPath);
