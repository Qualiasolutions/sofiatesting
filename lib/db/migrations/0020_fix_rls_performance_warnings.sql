-- Migration: Fix RLS Performance Warnings
-- Addresses two types of Supabase linter warnings:
-- 1. auth_rls_initplan - wrap auth.role() and auth.uid() in (SELECT ...)
-- 2. multiple_permissive_policies - remove duplicate policies

-- ============================================================================
-- PART 1: Fix LeadForwardingRotation RLS policies
-- ============================================================================

-- Drop existing policy and recreate with optimized auth calls
DROP POLICY IF EXISTS "Service role can manage lead forwarding rotation" ON "LeadForwardingRotation";

CREATE POLICY "Service role can manage lead forwarding rotation" ON "LeadForwardingRotation"
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- PART 2: Fix TelegramGroup RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage telegram groups" ON "TelegramGroup";

CREATE POLICY "Admins can manage telegram groups" ON "TelegramGroup"
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- PART 3: Fix TelegramLead RLS policies
-- ============================================================================

-- Drop all TelegramLead policies and recreate with optimized auth calls
DROP POLICY IF EXISTS "Agents can view their forwarded leads" ON "TelegramLead";
DROP POLICY IF EXISTS "Agents can update their forwarded leads" ON "TelegramLead";
DROP POLICY IF EXISTS "Service role can insert telegram leads" ON "TelegramLead";
DROP POLICY IF EXISTS "Service role can delete telegram leads" ON "TelegramLead";

CREATE POLICY "Agents can view their forwarded leads" ON "TelegramLead"
  FOR SELECT USING (
    (SELECT auth.role()) = 'service_role'
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
    (SELECT auth.role()) = 'service_role'
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
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Service role can delete telegram leads" ON "TelegramLead"
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM "AdminUserRole"
      WHERE "userId" = (SELECT auth.uid())
      AND "role" = 'superadmin'
    )
  );

-- ============================================================================
-- PART 4: Fix assets table RLS policies (remove duplicates + optimize)
-- ============================================================================

-- Drop all duplicate and original policies
DROP POLICY IF EXISTS "Users can delete own assets" ON "assets";
DROP POLICY IF EXISTS "Users can delete their own assets" ON "assets";
DROP POLICY IF EXISTS "Users can insert own assets" ON "assets";
DROP POLICY IF EXISTS "Users can insert their own assets" ON "assets";
DROP POLICY IF EXISTS "Users can update own assets" ON "assets";
DROP POLICY IF EXISTS "Users can update their own assets" ON "assets";
DROP POLICY IF EXISTS "Users can view own assets" ON "assets";
DROP POLICY IF EXISTS "Users can view their own assets" ON "assets";

-- Recreate single optimized policies (using user_id column)
CREATE POLICY "Users can view own assets" ON "assets"
  FOR SELECT USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can insert own assets" ON "assets"
  FOR INSERT WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can update own assets" ON "assets"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can delete own assets" ON "assets"
  FOR DELETE USING ("user_id" = (SELECT auth.uid()));

-- ============================================================================
-- PART 5: Fix director_settings table RLS policies (remove duplicates + optimize)
-- ============================================================================

-- Drop all duplicate and original policies
DROP POLICY IF EXISTS "Users can insert own director settings" ON "director_settings";
DROP POLICY IF EXISTS "Users can insert their own director settings" ON "director_settings";
DROP POLICY IF EXISTS "Users can update own director settings" ON "director_settings";
DROP POLICY IF EXISTS "Users can update their own director settings" ON "director_settings";
DROP POLICY IF EXISTS "Users can view own director settings" ON "director_settings";
DROP POLICY IF EXISTS "Users can view their own director settings" ON "director_settings";

-- Recreate single optimized policies (using user_id column)
CREATE POLICY "Users can view own director settings" ON "director_settings"
  FOR SELECT USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can insert own director settings" ON "director_settings"
  FOR INSERT WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can update own director settings" ON "director_settings"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));

-- ============================================================================
-- PART 6: Fix projects table RLS policies (optimize auth calls)
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete their own projects" ON "projects";
DROP POLICY IF EXISTS "Users can insert their own projects" ON "projects";
DROP POLICY IF EXISTS "Users can update their own projects" ON "projects";
DROP POLICY IF EXISTS "Users can view their own projects" ON "projects";

-- Recreate with optimized auth calls (using user_id column)
CREATE POLICY "Users can view their own projects" ON "projects"
  FOR SELECT USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own projects" ON "projects"
  FOR INSERT WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can update their own projects" ON "projects"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own projects" ON "projects"
  FOR DELETE USING ("user_id" = (SELECT auth.uid()));

-- ============================================================================
-- PART 7: Fix scenes table RLS policies (remove duplicates + optimize)
-- ============================================================================

-- Drop all duplicate and original policies
DROP POLICY IF EXISTS "Users can delete own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can delete their own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can insert own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can insert their own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can update own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can update their own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can view own scenes" ON "scenes";
DROP POLICY IF EXISTS "Users can view their own scenes" ON "scenes";

-- Recreate single optimized policies (using user_id column)
CREATE POLICY "Users can view own scenes" ON "scenes"
  FOR SELECT USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can insert own scenes" ON "scenes"
  FOR INSERT WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can update own scenes" ON "scenes"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "Users can delete own scenes" ON "scenes"
  FOR DELETE USING ("user_id" = (SELECT auth.uid()));
