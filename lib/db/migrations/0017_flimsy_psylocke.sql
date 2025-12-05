CREATE TABLE IF NOT EXISTS "LeadForwardingRotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" varchar(50) NOT NULL,
	"lastForwardedToAgentId" uuid,
	"forwardCount" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "LeadForwardingRotation_region_unique" UNIQUE("region")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TelegramGroup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" bigint NOT NULL,
	"groupName" varchar(256) NOT NULL,
	"groupType" varchar(32) NOT NULL,
	"region" varchar(50),
	"isActive" boolean DEFAULT true NOT NULL,
	"leadRoutingEnabled" boolean DEFAULT true NOT NULL,
	"defaultForwardTo" uuid,
	"alternateForwardTo" uuid,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TelegramGroup_groupId_unique" UNIQUE("groupId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TelegramLead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceGroupId" bigint NOT NULL,
	"sourceGroupName" varchar(256),
	"originalMessageId" varchar(64),
	"originalMessageText" text,
	"senderTelegramId" bigint,
	"senderName" varchar(256),
	"propertyReferenceId" varchar(64),
	"propertyUrl" text,
	"propertyTitle" text,
	"propertyRegion" varchar(50),
	"propertyOwnerId" uuid,
	"clientName" varchar(256),
	"clientPhone" varchar(64),
	"clientEmail" varchar(256),
	"clientLanguage" varchar(20),
	"forwardedToAgentId" uuid,
	"forwardedToTelegramId" bigint,
	"forwardedToName" varchar(256),
	"forwardedMessageId" varchar(64),
	"groupAckMessageId" varchar(64),
	"status" varchar(32) DEFAULT 'forwarded' NOT NULL,
	"errorMessage" text,
	"agentResponseAt" timestamp,
	"closedAt" timestamp,
	"closedReason" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ZyprusAgent" ALTER COLUMN "telegramUserId" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "ownerName" varchar(256);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "ownerPhone" varchar(64);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "swimmingPool" varchar(32);--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "hasParking" boolean;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "hasAirConditioning" boolean;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "backofficeNotes" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "googleMapsUrl" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "verandaArea" real;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "plotArea" real;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "reviewStatus" varchar(32) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "firstReviewerId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "secondReviewerId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "submittedByAgentId" uuid;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "reviewNotes" text;--> statement-breakpoint
ALTER TABLE "PropertyListing" ADD COLUMN "reviewedAt" timestamp;--> statement-breakpoint
ALTER TABLE "ZyprusAgent" ADD COLUMN "canReceiveLeads" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LeadForwardingRotation" ADD CONSTRAINT "LeadForwardingRotation_lastForwardedToAgentId_ZyprusAgent_id_fk" FOREIGN KEY ("lastForwardedToAgentId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TelegramGroup" ADD CONSTRAINT "TelegramGroup_defaultForwardTo_ZyprusAgent_id_fk" FOREIGN KEY ("defaultForwardTo") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TelegramGroup" ADD CONSTRAINT "TelegramGroup_alternateForwardTo_ZyprusAgent_id_fk" FOREIGN KEY ("alternateForwardTo") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TelegramLead" ADD CONSTRAINT "TelegramLead_propertyOwnerId_ZyprusAgent_id_fk" FOREIGN KEY ("propertyOwnerId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TelegramLead" ADD CONSTRAINT "TelegramLead_forwardedToAgentId_ZyprusAgent_id_fk" FOREIGN KEY ("forwardedToAgentId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "LeadForwardingRotation_region_idx" ON "LeadForwardingRotation" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramGroup_groupId_idx" ON "TelegramGroup" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramGroup_groupType_idx" ON "TelegramGroup" USING btree ("groupType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramGroup_region_idx" ON "TelegramGroup" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramGroup_isActive_idx" ON "TelegramGroup" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_sourceGroupId_idx" ON "TelegramLead" USING btree ("sourceGroupId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_propertyReferenceId_idx" ON "TelegramLead" USING btree ("propertyReferenceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_forwardedToAgentId_idx" ON "TelegramLead" USING btree ("forwardedToAgentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_status_idx" ON "TelegramLead" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_createdAt_idx" ON "TelegramLead" USING btree ("createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_agent_status_idx" ON "TelegramLead" USING btree ("forwardedToAgentId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TelegramLead_group_createdAt_idx" ON "TelegramLead" USING btree ("sourceGroupId","createdAt" DESC NULLS LAST);