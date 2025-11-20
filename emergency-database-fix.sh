#!/bin/bash

echo "Emergency Database Connection Fix"
echo "================================="

# Use pooler connection which should work better from Vercel
SUPABASE_PROJECT="zmwgoagpxefdruyhkfoh"
SUPABASE_HOST="db.zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_POOLER="db.zmwgoagpxefdruyhkfoh.supabase.co:6543"  # Use pooler port
SUPABASE_URL="https://zmwgoagpxefdruyhkfoh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjg1MzYsImV4cCI6MjA3NDgwNDUzNn0.xHPWqTjzYe3Dt_MrzyHDl0wzu4irvwSTO8ygLntkNoc"

# Try different connection formats
echo "Attempting to fix with pooler connection..."

# Update with pooler connection (better for serverless)
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres.zmwgoagpxefdruyhkfoh:${SUPABASE_POOLER}/postgres?sslmode=require" | vercel env add POSTGRES_URL production

vercel env rm DATABASE_URL production -y
echo "postgresql://postgres.zmwgoagpxefdruyhkfoh:${SUPABASE_POOLER}/postgres?sslmode=require" | vercel env add DATABASE_URL production

# Use standard host for other connections
vercel env rm POSTGRES_HOST production -y
echo "${SUPABASE_HOST}" | vercel env add POSTGRES_HOST production

# Keep Supabase public keys the same
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "${SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "${SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo ""
echo "✅ Emergency database fix applied!"
echo ""
echo "Changes made:"
echo "- Using connection pooler for better Vercel connectivity"
echo "- Added sslmode=require parameter"
echo "- Kept existing Supabase project configuration"
echo ""
echo "Next: Run 'vercel --prod --force' to redeploy"