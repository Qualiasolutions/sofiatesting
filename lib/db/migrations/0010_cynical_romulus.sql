CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_idx" ON "Chat" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_createdAt_idx" ON "Message_v2" USING btree ("chatId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_userId_status_idx" ON "PropertyListing" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PropertyListing_draftExpiresAt_idx" ON "PropertyListing" USING btree ("draftExpiresAt");