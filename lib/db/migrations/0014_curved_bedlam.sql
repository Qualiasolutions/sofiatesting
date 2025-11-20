CREATE TABLE IF NOT EXISTS "AgentChatSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid NOT NULL,
	"chatId" uuid,
	"platform" varchar(20) NOT NULL,
	"platformUserId" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"endedAt" timestamp,
	"messageCount" integer DEFAULT 0,
	"documentCount" integer DEFAULT 0,
	"calculatorCount" integer DEFAULT 0,
	"listingCount" integer DEFAULT 0,
	"totalTokensUsed" integer DEFAULT 0,
	"totalCostUsd" numeric(10, 6) DEFAULT '0',
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ZyprusAgent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"fullName" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"phoneNumber" varchar(20),
	"region" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"telegramUserId" bigint,
	"whatsappPhoneNumber" varchar(20),
	"lastActiveAt" timestamp,
	"registeredAt" timestamp,
	"inviteSentAt" timestamp,
	"inviteToken" varchar(64),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ZyprusAgent_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentChatSession" ADD CONSTRAINT "AgentChatSession_agentId_ZyprusAgent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."ZyprusAgent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentChatSession" ADD CONSTRAINT "AgentChatSession_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ZyprusAgent" ADD CONSTRAINT "ZyprusAgent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_agentId_idx" ON "AgentChatSession" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_chatId_idx" ON "AgentChatSession" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_platform_idx" ON "AgentChatSession" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_startedAt_idx" ON "AgentChatSession" USING btree ("startedAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_agentId_startedAt_idx" ON "AgentChatSession" USING btree ("agentId","startedAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentChatSession_platform_startedAt_idx" ON "AgentChatSession" USING btree ("platform","startedAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_email_idx" ON "ZyprusAgent" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_phoneNumber_idx" ON "ZyprusAgent" USING btree ("phoneNumber");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_region_idx" ON "ZyprusAgent" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_role_idx" ON "ZyprusAgent" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_isActive_idx" ON "ZyprusAgent" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_telegramUserId_idx" ON "ZyprusAgent" USING btree ("telegramUserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_whatsappPhoneNumber_idx" ON "ZyprusAgent" USING btree ("whatsappPhoneNumber");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_userId_idx" ON "ZyprusAgent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_inviteToken_idx" ON "ZyprusAgent" USING btree ("inviteToken");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ZyprusAgent_region_isActive_idx" ON "ZyprusAgent" USING btree ("region","isActive");