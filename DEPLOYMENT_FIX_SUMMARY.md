# SOFIA Production Deployment Fix - 2025-11-20

## Problem Analysis

### Errors Identified
1. **500 Error on `/api/history`** - Database connection issues
2. **400 Error on `/api/chat`** - Missing Gemini API key configuration

### Root Causes
1. **Database Configuration**: Vercel production was still pointing to old Neon database instead of new Supabase instance
2. **Gemini API Key**: Vercel had `GEMINI_API_KEY` but the `@ai-sdk/google` library expects `GOOGLE_GENERATIVE_AI_API_KEY`

## Changes Made

### 1. Fixed Gemini API Key Configuration (`lib/ai/providers.ts`)
- **Problem**: SDK expects `GOOGLE_GENERATIVE_AI_API_KEY`, but Vercel only had `GEMINI_API_KEY`
- **Solution**: Added polyfill to copy `GEMINI_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` if missing
- **Additional**: Updated validation to accept either key name

```typescript
// Polyfill for Vercel's GEMINI_API_KEY if GOOGLE_GENERATIVE_AI_API_KEY is missing
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}
```

### 2. Updated Vercel Production Environment Variables
Updated the following environment variables to point to new Supabase instance (`ebgsbtqtkdgaafqejjye`):

#### Database Connection Variables
- `POSTGRES_URL`: postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
- `POSTGRES_URL_NON_POOLING`: postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres  
- `POSTGRES_HOST`: db.ebgsbtqtkdgaafqejjye.supabase.co
- `POSTGRES_PASSWORD`: Zambelis123!
- `POSTGRES_USER`: postgres
- `POSTGRES_DATABASE`: postgres
- `POSTGRES_PRISMA_URL`: postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
- `DATABASE_URL`: postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
- `DATABASE_URL_UNPOOLED`: postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres

#### Supabase Public Variables
- `NEXT_PUBLIC_SUPABASE_URL`: https://ebgsbtqtkdgaafqejjye.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0

### 3. Updated Deployment Script (`update-vercel-env.sh`)
- Added `vercel env rm` commands before each `vercel env add` to avoid interactive prompts
- Added DATABASE_URL and DATABASE_URL_UNPOOLED variables
- Script now runs fully automated

## Models Configuration

SOFIA uses **3 Gemini models** (all from Google's Gemini 2.5 family):

1. **Gemini 2.5 Flash** (`chat-model`) - Default
   - Best price-performance ratio with thinking capabilities
   - $0.075/M input, $0.30/M output
   
2. **Gemini 2.5 Pro** (`chat-model-pro`)
   - Most powerful reasoning model
   - Extended context, advanced thinking
   - $1.25/M input, $5.00/M output
   
3. **Gemini 2.5 Flash-Lite** (`chat-model-flash-lite`)
   - Ultra-fast and cheapest option
   - Optimized for high throughput, simple tasks
   - $0.0375/M input, $0.15/M output

All models use the single `GEMINI_API_KEY` environment variable (polyfilled to `GOOGLE_GENERATIVE_AI_API_KEY`).

## Deployment Steps Executed

1. ✅ Updated `lib/ai/providers.ts` with API key polyfill
2. ✅ Updated `update-vercel-env.sh` script
3. ✅ Ran `./update-vercel-env.sh` to update all Vercel production environment variables
4. ✅ Deployed to production: `vercel --prod --yes`

## Deployment Result

**Deployment URL**: https://sofiatesting.vercel.app
**Inspect URL**: https://vercel.com/qualiasolutionscy/sofiatesting/98WPC2itvozZiH9Q76BppFbtJcoG

## Verification Steps

To verify the fixes:

1. ✅ Database connection - Supabase postgres logs show healthy connections
2. ⏳ `/api/chat` endpoint - Should now work with Gemini API key
3. ⏳ `/api/history` endpoint - Should now work with Supabase database

## Files Modified

1. `lib/ai/providers.ts` - Added Gemini API key polyfill
2. `update-vercel-env.sh` - Enhanced with remove commands and additional variables
3. `.env.local` - Local development environment (matches production)

## Next Steps

1. Test the live application at https://sofiatesting.vercel.app/access
2. Verify chat functionality works
3. Check browser console for any remaining errors
4. Test all 3 Gemini models (Flash, Pro, Flash-Lite)
