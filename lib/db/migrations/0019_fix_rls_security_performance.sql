-- Migration: Fix RLS Security - Part 5
-- Add RLS policies for TelegramLead

CREATE POLICY "Agents can view their forwarded leads" ON "TelegramLead"
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR "forwardedToAgentId" IN (
      SELECT id FROM "ZyprusAgent" WHERE "userId" = (SELECT auth.uid())
    )
    OR "propertyOwnerId" IN (
      SELECT id FROM "ZyprusAgent" WHERE "userId" = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM "AdminUserRole"
      WHERE "userId" = (SELECT auth.uid())
      AND "role" IN ('superadmin', 'admin', 'support')
    )
  );

CREATE POLICY "Agents can update their forwarded leads" ON "TelegramLead"
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR "forwardedToAgentId" IN (
      SELECT id FROM "ZyprusAgent" WHERE "userId" = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM "AdminUserRole"
      WHERE "userId" = (SELECT auth.uid())
      AND "role" IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Service role can insert telegram leads" ON "TelegramLead"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete telegram leads" ON "TelegramLead"
  FOR DELETE USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM "AdminUserRole"
      WHERE "userId" = (SELECT auth.uid())
      AND "role" = 'superadmin'
    )
  );
