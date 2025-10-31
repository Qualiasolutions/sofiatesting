CREATE TABLE IF NOT EXISTS "ListingUploadAttempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listingId" uuid NOT NULL,
	"attemptNumber" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"errorMessage" text,
	"errorCode" text,
	"apiResponse" jsonb,
	"attemptedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"durationMs" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PropertyListing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"address" jsonb NOT NULL,
	"price" numeric NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"numberOfRooms" integer NOT NULL,
	"numberOfBathroomsTotal" numeric NOT NULL,
	"floorSize" numeric NOT NULL,
	"propertyType" varchar(50),
	"amenityFeature" jsonb,
	"image" jsonb,
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
DO $$ BEGIN
 ALTER TABLE "ListingUploadAttempt" ADD CONSTRAINT "ListingUploadAttempt_listingId_PropertyListing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."PropertyListing"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PropertyListing" ADD CONSTRAINT "PropertyListing_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PropertyListing" ADD CONSTRAINT "PropertyListing_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ListingUploadAttempt_listingId_idx" ON "ListingUploadAttempt" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ListingUploadAttempt_attemptedAt_idx" ON "ListingUploadAttempt" USING btree ("attemptedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_userId_idx" ON "PropertyListing" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_status_idx" ON "PropertyListing" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_createdAt_idx" ON "PropertyListing" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_deletedAt_idx" ON "PropertyListing" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_chatId_idx" ON "PropertyListing" USING btree ("chatId");