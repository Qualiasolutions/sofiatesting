ALTER TABLE "LandListing" ADD COLUMN "titleDeedNumber" text;--> statement-breakpoint
ALTER TABLE "LandListing" ADD COLUMN "ownerName" varchar(256);--> statement-breakpoint
ALTER TABLE "LandListing" ADD COLUMN "ownerPhone" varchar(64);--> statement-breakpoint
ALTER TABLE "LandListing" ADD COLUMN "ownerEmail" varchar(256);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "titleDeedNumber" text;