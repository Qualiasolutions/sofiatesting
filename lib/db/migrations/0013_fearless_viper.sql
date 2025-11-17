CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adminUserId" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"targetType" varchar(50),
	"targetId" uuid,
	"changes" jsonb,
	"ipAddress" varchar(45),
	"userAgent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AdminUserRole" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"role" varchar(20) NOT NULL,
	"permissions" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AgentExecutionLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"agentType" varchar(50) NOT NULL,
	"userId" uuid,
	"chatId" uuid,
	"action" varchar(100) NOT NULL,
	"durationMs" integer,
	"tokensUsed" integer,
	"modelUsed" varchar(50),
	"costUsd" numeric(10, 6),
	"success" boolean NOT NULL,
	"errorMessage" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CalculatorUsageLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"calculatorType" varchar(50) NOT NULL,
	"userId" uuid,
	"inputs" jsonb NOT NULL,
	"outputs" jsonb NOT NULL,
	"source" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "DocumentGenerationLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"userId" uuid,
	"chatId" uuid,
	"templateType" varchar(50) NOT NULL,
	"templateName" varchar(100),
	"source" varchar(20) NOT NULL,
	"success" boolean NOT NULL,
	"errorMessage" text,
	"durationMs" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "IntegrationStatus" (
	"service" varchar(50) PRIMARY KEY NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"lastCheckAt" timestamp,
	"lastSuccessAt" timestamp,
	"consecutiveFailures" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"errorLog" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SystemHealthLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"service" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"responseTimeMs" integer,
	"errorRate" numeric,
	"metrics" jsonb,
	"details" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserActivitySummary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"messageCount" integer DEFAULT 0 NOT NULL,
	"documentCount" integer DEFAULT 0 NOT NULL,
	"calculatorCount" integer DEFAULT 0 NOT NULL,
	"listingCount" integer DEFAULT 0 NOT NULL,
	"totalTokensUsed" integer DEFAULT 0 NOT NULL,
	"totalCostUsd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"channels" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WhatsAppConversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phoneNumber" varchar(20) NOT NULL,
	"userId" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastMessageAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_User_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentExecutionLog" ADD CONSTRAINT "AgentExecutionLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentExecutionLog" ADD CONSTRAINT "AgentExecutionLog_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CalculatorUsageLog" ADD CONSTRAINT "CalculatorUsageLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocumentGenerationLog" ADD CONSTRAINT "DocumentGenerationLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocumentGenerationLog" ADD CONSTRAINT "DocumentGenerationLog_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserActivitySummary" ADD CONSTRAINT "UserActivitySummary_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AdminAuditLog_timestamp_idx" ON "AdminAuditLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminUserId_idx" ON "AdminAuditLog" USING btree ("adminUserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_idx" ON "AdminAuditLog" USING btree ("targetType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentExecutionLog_timestamp_idx" ON "AgentExecutionLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentExecutionLog_agentType_idx" ON "AgentExecutionLog" USING btree ("agentType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentExecutionLog_userId_idx" ON "AgentExecutionLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentExecutionLog_success_idx" ON "AgentExecutionLog" USING btree ("success");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AgentExecutionLog_agentType_timestamp_idx" ON "AgentExecutionLog" USING btree ("agentType","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CalculatorUsageLog_timestamp_idx" ON "CalculatorUsageLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CalculatorUsageLog_calculatorType_idx" ON "CalculatorUsageLog" USING btree ("calculatorType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CalculatorUsageLog_userId_idx" ON "CalculatorUsageLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CalculatorUsageLog_source_idx" ON "CalculatorUsageLog" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_timestamp_idx" ON "DocumentGenerationLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_templateType_idx" ON "DocumentGenerationLog" USING btree ("templateType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_userId_idx" ON "DocumentGenerationLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_source_idx" ON "DocumentGenerationLog" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "SystemHealthLog_timestamp_idx" ON "SystemHealthLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "SystemHealthLog_service_idx" ON "SystemHealthLog" USING btree ("service");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "SystemHealthLog_status_idx" ON "SystemHealthLog" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "SystemHealthLog_service_timestamp_idx" ON "SystemHealthLog" USING btree ("service","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserActivitySummary_userId_date_idx" ON "UserActivitySummary" USING btree ("userId","date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "UserActivitySummary_date_idx" ON "UserActivitySummary" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WhatsAppConversation_phoneNumber_idx" ON "WhatsAppConversation" USING btree ("phoneNumber");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WhatsAppConversation_userId_idx" ON "WhatsAppConversation" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WhatsAppConversation_status_idx" ON "WhatsAppConversation" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation" USING btree ("lastMessageAt");