import fs from "fs";
import postgres from "postgres";

// Supavisor Session Mode (port 5432 on pooler) - supports DDL and IPv4
const DATABASE_URL =
  "postgresql://postgres.zmwgoagpxefdruyhkfoh:Zambelis123!@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";

const sql = postgres(DATABASE_URL);

async function applyMigration() {
  const migrationSQL = fs.readFileSync(
    "lib/db/migrations/0020_fix_rls_performance_warnings.sql",
    "utf8"
  );

  // Split by semicolons and filter empty statements
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.startsWith("--") || stmt.length === 0) continue;

    try {
      await sql.unsafe(stmt);
      console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
    } catch (err) {
      console.error(`✗ Statement ${i + 1} failed:`, err.message);
      console.error("Statement:", stmt.substring(0, 100) + "...");
    }
  }

  console.log("\nMigration complete!");
  await sql.end();
}

applyMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
