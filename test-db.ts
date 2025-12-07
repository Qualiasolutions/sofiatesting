import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const MASK_PASSWORD_PATTERN = /:[^:]*@/;

const testConnection = async () => {
  console.log("Testing connection...");
  // Try unpooled first
  const url = process.env.POSTGRES_URL_UNPOOLED || process.env.POSTGRES_URL;
  console.log("Using URL:", url?.replace(MASK_PASSWORD_PATTERN, ":***@")); // Mask password

  if (!url) {
    console.error("URL missing");
    return;
  }
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 10 });
    const result = await sql`SELECT 1 as result`;
    console.log("Connection successful:", result);
    await sql.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
};

testConnection();
