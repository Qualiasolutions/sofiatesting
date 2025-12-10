# 400 Bad Request Errors Fix - 2025-01-24

## Problem
After cleaning up and redeploying, the app shows:
```
GET /api/history?limit=20 400 (Bad Request)
POST /api/chat 400 (Bad Request)
```

## Likely Root Cause
**Database connection failure** - The POSTGRES_URL environment variable may have incorrect credentials.

According to CLEANUP_SUMMARY.md, the password should be `Zambelis1!` but this needs verification.

## Diagnosis Steps

### 1. Check Runtime Logs
```bash
vercel logs sofiatesting.vercel.app --output=raw | grep -i "error\|postgres\|database"
```

### 2. Verify Database Connection String
The POSTGRES_URL should look like:
```
postgres://postgres.ebgsbtqtkdgaafqejjye:Zambelis1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Key requirements:**
- Port: `6543` (Transaction Pooler, NOT 5432)
- Password: `Zambelis1!`
- Parameters: `sslmode=require&pgbouncer=true`
- `prepare: false` in lib/db/client.ts (already set ✓)

### 3. Test Database Connection
Create a test endpoint to verify database connectivity:

```typescript
// app/api/test-db/route.ts
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    return Response.json({ status: "connected", result });
  } catch (error) {
    return Response.json({
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
```

## Solution Options

### Option A: Verify & Update POSTGRES_URL Password
If password is incorrect:
```bash
vercel env rm POSTGRES_URL production --yes
vercel env add POSTGRES_URL production
# Paste the correct connection string with Zambelis1! password
```

### Option B: Check Supabase Dashboard
1. Go to Supabase project settings
2. Navigate to Database → Connection String
3. Copy the "Transaction Pooler" connection string (port 6543)
4. Ensure password is `Zambelis1!`
5. Update Vercel env var if different

### Option C: Reset Database Password
If you're unsure of the password:
1. Go to Supabase project
2. Settings → Database → Database Password
3. Reset password to `Zambelis1!` (or new secure password)
4. Update all POSTGRES_URL variants in Vercel

## Verification After Fix

1. **Check API health:**
```bash
curl https://sofiatesting.vercel.app/api/test-db
# Should return: {"status":"connected"}
```

2. **Test in browser:**
- Go to https://sofiatesting.vercel.app
- Should load without 400 errors in console
- Chat history should appear (if user has any)

3. **Send a message:**
- Type: "Hello Sofia"
- Should get Gemini response without errors

## Current Environment Variables
As of cleanup (2025-01-24):

**Database (Production):**
- POSTGRES_URL (pooled, port 6543)
- POSTGRES_URL_NON_POOLING (direct, port 5432)
- POSTGRES_HOST
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DATABASE
- POSTGRES_PORT
- DATABASE_URL (alias)
- DATABASE_URL_UNPOOLED (alias)
- POSTGRES_PRISMA_URL (alias)
- POSTGRES_URL_NO_SSL (alias)

**AI:**
- GEMINI_API_KEY = AIzaSyDaua64g2H0teEaf7aKigLp9jHrctK4uwg ✓

**Other:**
- AUTH_SECRET ✓
- TELEGRAM_BOT_TOKEN ✓
- ZYPRUS_CLIENT_ID, ZYPRUS_CLIENT_SECRET ✓
- REDIS_URL ✓

## Next Steps
1. Check Vercel logs for specific database error
2. Verify POSTGRES_URL has correct password
3. Create test-db endpoint if needed
4. Redeploy after fixing credentials
