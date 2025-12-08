import fs from "fs";

// Sofia project credentials from .env.vercel-pulled
const SUPABASE_URL = "https://zmwgoagpxefdruyhkfoh.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk";

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

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
      await executeSQL(stmt);
      console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
    } catch (err) {
      console.error(`✗ Statement ${i + 1} failed:`, err.message);
      console.error("Statement:", stmt.substring(0, 100) + "...");
    }
  }

  console.log("\nMigration complete!");
}

applyMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
