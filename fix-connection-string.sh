#!/bin/bash

echo "Fixing Malformed Database Connection String"
echo "========================================"

# Correct connection format
SUPABASE_PROJECT="zmwgoagpxefdruyhkfoh"
SUPABASE_HOST="db.zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_POOLER="db.zmwgoagpxefdruyhkfoh.supabase.co:6543"
SUPABASE_URL="https://zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjg1MzYsImV4cCI6MjA3NDgwNDUzNn0.xHPWqTjzYe3Dt_MrzyHDl0wzu4irvwSTO8ygLntkNoc"

# Fix malformed connection strings
echo "Fixing POSTGRES_URL..."
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:Zambelis123!@${SUPABASE_HOST}/postgres?sslmode=require" | vercel env add POSTGRES_URL production

echo "Fixing DATABASE_URL..."
vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:Zambelis123!@${SUPABASE_HOST}/postgres?sslmode=require" | vercel env add DATABASE_URL production

# Keep other variables correct
vercel env rm POSTGRES_HOST production -y
echo "${SUPABASE_HOST}" | vercel env add POSTGRES_HOST production

vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "${SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "${SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo ""
echo "✅ Fixed malformed database connection strings!"
echo ""
echo "Previous error: postgresql://postgres.zmwgoagpxefdruyhkfoh:db.zmwgoagpxefdruyhkfoh.supabase.co:6543/postgres"
echo "New format: postgresql://postgres:Zambelis123!@db.zmwgoagpxefdruyhkfoh.supabase.co/postgres"