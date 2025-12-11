ALTER TABLE "PropertyListing" ADD COLUMN "coveredVeranda" real;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "uncoveredVeranda" real;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "storageRoom" boolean;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "floor" varchar(50);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "condition" varchar(32);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "hasElevator" boolean;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "hasTitleDeeds" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "titleDeedDocumentUrl" text;