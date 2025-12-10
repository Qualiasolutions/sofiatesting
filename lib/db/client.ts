import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  // Connection settings optimized for Vercel serverless + Supabase pooler
  connect_timeout: 30, // 30 seconds connection timeout (increased for cold starts)
  idle_timeout: 0, // Disable idle timeout (let pooler manage)
  max: 1, // Single connection for serverless
  // Disable prepared statements for Supabase Transaction Pooler compatibility
  prepare: false,
  // SSL required for Supabase
  ssl: "require",
});

export const db = drizzle(client);
