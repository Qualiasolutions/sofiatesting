#!/bin/bash

echo "Starting Vercel Production Environment Update..."
echo "================================================"

# Database URLs (Supabase)
echo "Updating database connections to Supabase..."
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_URL production

vercel env rm POSTGRES_URL_NON_POOLING production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_URL_NON_POOLING production

vercel env rm POSTGRES_URL_NO_SSL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_URL_NO_SSL production

vercel env rm POSTGRES_PRISMA_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_PRISMA_URL production

vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add DATABASE_URL production

vercel env rm DATABASE_URL_UNPOOLED production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add DATABASE_URL_UNPOOLED production

# Database credentials
vercel env rm POSTGRES_HOST production -y
echo "db.ebgsbtqtkdgaafqejjye.supabase.co" | vercel env add POSTGRES_HOST production

vercel env rm POSTGRES_PASSWORD production -y
echo "Zambelis123!" | vercel env add POSTGRES_PASSWORD production

vercel env rm POSTGRES_USER production -y
echo "postgres" | vercel env add POSTGRES_USER production

vercel env rm POSTGRES_DATABASE production -y
echo "postgres" | vercel env add POSTGRES_DATABASE production

# Supabase public keys
echo "Adding Supabase public keys..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "https://ebgsbtqtkdgaafqejjye.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Fix API keys (remove newlines)
echo "Fixing API keys (removing newlines)..."
vercel env rm ADMIN_API_KEY production -y
echo "d9611641d007e0d9a2b42eb176a335f1e8c124e9d71e247027529ae092b10b21" | vercel env add ADMIN_API_KEY production

vercel env rm AI_GATEWAY_API_KEY production -y
echo "vck_57uN4ziqmVNirEwQgOBN3DyCFs8j8BGPVl2Y1Z5WgVMuM4xLOr33wXUv" | vercel env add AI_GATEWAY_API_KEY production

vercel env rm TELEGRAM_BOT_TOKEN production -y
echo "8281384553:AAEgfB-R2N6CxPmP0xKg453A_5XZNnf7haI" | vercel env add TELEGRAM_BOT_TOKEN production

# Remove deprecated Neon variables
echo "Removing deprecated Neon environment variables..."
vercel env rm NEON_PROJECT_ID production -y
vercel env rm PGHOST production -y
vercel env rm PGHOST_UNPOOLED production -y
vercel env rm PGPASSWORD production -y
vercel env rm PGUSER production -y
vercel env rm PGDATABASE production -y

# Remove unnecessary variables
vercel env rm TELEGRAM_WEBHOOK_SECRET production -y
vercel env rm CRON_SECRET production -y

echo ""
echo "================================================"
echo "✅ Environment variables updated successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel --prod' to deploy with new environment"
echo "2. Monitor deployment at https://vercel.com/qualiasolutionscy/sofiatesting"
echo "3. Test at https://sofiatesting.vercel.app"