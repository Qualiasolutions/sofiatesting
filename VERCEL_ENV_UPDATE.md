# Vercel Environment Variables Update Guide

## New Supabase Database Credentials

Update these environment variables in your Vercel project dashboard:
https://vercel.com/qualiasolutionscy/sofiatesting/settings/environment-variables

### Database Connection Variables (Update existing):

**POSTGRES_URL**
```
postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
```

**POSTGRES_URL_NON_POOLING**
```
postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
```

**POSTGRES_HOST**
```
db.ebgsbtqtkdgaafqejjye.supabase.co
```

**POSTGRES_PASSWORD**
```
Zambelis123!
```

**POSTGRES_USER**
```
postgres
```

**POSTGRES_DATABASE**
```
postgres
```

**POSTGRES_PRISMA_URL**
```
postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
```

**DATABASE_URL**
```
postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
```

**DATABASE_URL_UNPOOLED**
```
postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres
```

### New Supabase Variables (Add these):

**NEXT_PUBLIC_SUPABASE_URL**
```
https://ebgsbtqtkdgaafqejjye.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0
```

### Variables to Remove (old Neon DB):
- NEON_PROJECT_ID
- PGDATABASE
- PGHOST
- PGHOST_UNPOOLED
- PGPASSWORD
- PGUSER
- POSTGRES_URL_NO_SSL
- POSTGRES_PRISMA_URL (Prisma is not used)

> [!IMPORTANT]
> **Prisma**: This project does NOT use Prisma. You can safely remove `POSTGRES_PRISMA_URL`.
> **Postgres Variables**: The `POSTGRES_*` variables (URL, HOST, etc.) are **REQUIRED** but must point to your Supabase instance as shown above. Supabase IS a Postgres database.

## After updating:
Redeploy your production deployment from the Vercel dashboard or run:
```bash
vercel --prod
```

## New Supabase Project Details:
- Project Name: sofia-testing-clean
- Project ID: ebgsbtqtkdgaafqejjye
- Region: eu-west-3
- Status: ACTIVE_HEALTHY
- Dashboard: https://supabase.com/dashboard/project/ebgsbtqtkdgaafqejjye
