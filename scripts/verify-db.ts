console.log("Starting verification script...");

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const run = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  console.log(
    "Connecting to:",
    process.env.POSTGRES_URL.replace(/:[^:]*@/, ":****@")
  );
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    const result = await sql`SELECT count(*) FROM "User"`;
    console.log("✅ Connection successful!");
    console.log("User count:", result[0].count);
  } catch (err) {
    console.error("❌ Connection failed or table not found");
    console.error(err);
  } finally {
    await sql.end();
  }
};

run();
