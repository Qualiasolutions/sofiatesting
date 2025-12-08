CREATE TABLE IF NOT EXISTS "DocumentSend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"documentTitle" varchar(256) NOT NULL,
	"documentUrl" text NOT NULL,
	"documentContent" text,
	"recipientName" varchar(256),
	"recipientEmail" varchar(256),
	"recipientPhone" varchar(64),
	"method" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"errorMessage" text,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocumentSend" ADD CONSTRAINT "DocumentSend_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocumentSend" ADD CONSTRAINT "DocumentSend_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentSend_userId_idx" ON "DocumentSend" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentSend_chatId_idx" ON "DocumentSend" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentSend_status_idx" ON "DocumentSend" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "DocumentSend_createdAt_idx" ON "DocumentSend" USING btree ("createdAt" DESC NULLS LAST);