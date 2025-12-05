CREATE TABLE IF NOT EXISTS "LandListing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"landSize" numeric NOT NULL,
	"landTypeId" uuid NOT NULL,
	"locationId" uuid,
	"listingTypeId" uuid NOT NULL,
	"priceModifierId" uuid,
	"titleDeedId" uuid,
	"buildingDensity" numeric,
	"siteCoverage" numeric,
	"maxFloors" integer,
	"maxHeight" numeric,
	"infrastructureIds" uuid[],
	"viewIds" uuid[],
	"coordinates" jsonb,
	"image" jsonb,
	"referenceId" text,
	"phoneNumber" varchar(20),
	"notes" text,
	"duplicateDetected" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"zyprusListingId" text,
	"zyprusListingUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"publishedAt" timestamp,
	"deletedAt" timestamp,
	"draftExpiresAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "listingTypeId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "propertyStatusId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "viewIds" uuid[];--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "yearBuilt" integer;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "referenceId" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "energyClass" varchar(5);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "videoUrl" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "phoneNumber" varchar(20);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "propertyNotes" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "duplicateDetected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "coordinates" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LandListing" ADD CONSTRAINT "LandListing_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LandListing" ADD CONSTRAINT "LandListing_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_userId_idx" ON "LandListing" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_status_idx" ON "LandListing" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_createdAt_idx" ON "LandListing" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_deletedAt_idx" ON "LandListing" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_chatId_idx" ON "LandListing" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_locationId_idx" ON "LandListing" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_landTypeId_idx" ON "LandListing" USING btree ("landTypeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_userId_status_idx" ON "LandListing" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_userId_createdAt_idx" ON "LandListing" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LandListing_draftExpiresAt_idx" ON "LandListing" USING btree ("draftExpiresAt");