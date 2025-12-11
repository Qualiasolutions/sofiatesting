const { Client } = require('pg');

async function applyMigration() {
  const client = new Client(process.env.POSTGRES_URL);

  try {
    await client.connect();

    console.log('Applying migration for new PropertyListing columns...');

    // Add new columns if they don't exist
    const alterTableSQL = `
      ALTER TABLE "PropertyListing"
      ADD COLUMN IF NOT EXISTS "coveredVeranda" real,
      ADD COLUMN IF NOT EXISTS "uncoveredVeranda" real,
      ADD COLUMN IF NOT EXISTS "storageRoom" boolean,
      ADD COLUMN IF NOT EXISTS "floor" varchar(50),
      ADD COLUMN IF NOT EXISTS "condition" varchar(32),
      ADD COLUMN IF NOT EXISTS "hasElevator" boolean,
      ADD COLUMN IF NOT EXISTS "hasTitleDeeds" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "titleDeedDocumentUrl" text;
    `;

    await client.query(alterTableSQL);
    console.log('✅ Migration applied successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

applyMigration();