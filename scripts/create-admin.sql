-- Create Admin User SQL Script
-- Run this script after replacing YOUR_EMAIL with your registered email address

-- Step 1: Check if user exists (replace YOUR_EMAIL)
SELECT id, email FROM "User" WHERE email = 'YOUR_EMAIL';

-- Step 2: Create admin role (replace USER_ID_FROM_STEP_1)
-- Make sure to replace 'USER_ID_FROM_STEP_1' with the actual UUID from step 1
INSERT INTO "AdminUserRole" ("userId", "role", "permissions", "createdAt", "createdBy")
VALUES (
  'USER_ID_FROM_STEP_1',  -- Replace this with the UUID from step 1
  'superadmin',
  '{"agents": {"view": true, "create": true, "edit": true, "delete": true}, "health": {"view": true}, "integrations": {"view": true, "edit": true}, "settings": {"view": true, "edit": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "whatsapp": {"view": true, "edit": true}}'::jsonb,
  NOW(),
  'USER_ID_FROM_STEP_1'  -- Same UUID as above
)
ON CONFLICT ("userId")
DO UPDATE SET
  role = 'superadmin',
  permissions = '{"agents": {"view": true, "create": true, "edit": true, "delete": true}, "health": {"view": true}, "integrations": {"view": true, "edit": true}, "settings": {"view": true, "edit": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "whatsapp": {"view": true, "edit": true}}'::jsonb;

-- Step 3: Verify admin was created
SELECT * FROM "AdminUserRole" WHERE "userId" = 'USER_ID_FROM_STEP_1';
