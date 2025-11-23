import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  // Increase connection timeout for Supabase (handles cold starts)
  connect_timeout: 30, // 30 seconds (was default 10s)
  idle_timeout: 20, // Keep connections alive
  max_lifetime: 60 * 30, // 30 minutes max connection lifetime
  // Connection pooling for serverless
  max: 1, // Limit connections in serverless environment
  // Enable keepalive to prevent connection drops
  keep_alive: 5, // Send keepalive every 5 seconds
  // Disable prepared statements for Supabase Transaction Pooler compatibility
  prepare: false,
});

export const db = drizzle(client);
