ALTER TABLE "PropertyListing" ADD COLUMN "propertyTypeId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "locationId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "indoorFeatureIds" uuid[];--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "outdoorFeatureIds" uuid[];--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "priceModifierId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "titleDeedId" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_locationId_idx" ON "PropertyListing" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_propertyTypeId_idx" ON "PropertyListing" USING btree ("propertyTypeId");