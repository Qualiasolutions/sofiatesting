import { db } from "./queries";

async function applyMigration() {
  try {
    console.log('Applying migration for new PropertyListing columns...');

    // Add new columns if they don't exist
    await db.execute(sql`
      ALTER TABLE "PropertyListing"
      ADD COLUMN IF NOT EXISTS "coveredVeranda" real,
      ADD COLUMN IF NOT EXISTS "uncoveredVeranda" real,
      ADD COLUMN IF NOT EXISTS "storageRoom" boolean,
      ADD COLUMN IF NOT EXISTS "floor" varchar(50),
      ADD COLUMN IF NOT EXISTS "condition" varchar(32),
      ADD COLUMN IF NOT EXISTS "hasElevator" boolean,
      ADD COLUMN IF NOT EXISTS "hasTitleDeeds" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "titleDeedDocumentUrl" text;
    `);

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });