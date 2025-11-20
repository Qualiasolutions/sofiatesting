#!/bin/bash

echo "Fixing Supabase Connection in Vercel Production..."
echo "================================================"

# Correct Supabase project details
SUPABASE_PROJECT="zmwgoagpxefdruyhkfoh"
SUPABASE_HOST="db.zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_URL="https://zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjg1MzYsImV4cCI6MjA3NDgwNDUzNn0.xHPWqTjzYe3Dt_MrzyHDl0wzu4irvwSTO8ygLntkNoc"

# Database password (same as before)
DB_PASSWORD="Zambelis123!"

# Update all database URLs
echo "Updating database connections..."
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add POSTGRES_URL production

vercel env rm POSTGRES_URL_NON_POOLING production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add POSTGRES_URL_NON_POOLING production

vercel env rm POSTGRES_URL_NO_SSL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add POSTGRES_URL_NO_SSL production

vercel env rm POSTGRES_PRISMA_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add POSTGRES_PRISMA_URL production

vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add DATABASE_URL production

vercel env rm DATABASE_URL_UNPOOLED production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:5432/postgres" | vercel env add DATABASE_URL_UNPOOLED production

# Update host
vercel env rm POSTGRES_HOST production -y
echo "${SUPABASE_HOST}" | vercel env add POSTGRES_HOST production

# Update Supabase public keys
echo "Updating Supabase public keys..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "${SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "${SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo ""
echo "================================================"
echo "✅ Fixed Supabase connection to correct project!"
echo ""
echo "Project: ${SUPABASE_PROJECT}"
echo "Host: ${SUPABASE_HOST}"
echo ""
echo "Next step: Run 'vercel --prod --force' to redeploy"