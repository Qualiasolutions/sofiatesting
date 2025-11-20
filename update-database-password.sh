#!/bin/bash

echo "Updating Database Password to Zambelis123!"
echo "=========================================="

# SOFIA Database Configuration with correct password
SUPABASE_HOST="db.ebgsbtqtkdgaafqejjye.supabase.co"
SUPABASE_URL="https://ebgsbtqtkdgaafqejjye.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MzUwOSwiZXhwIjoyMDc5MTY5NTA5fQ.zarFvLHxa2cgxy4IOur_XzJ62owXFjtxCNpMWdrjRkw"
DB_PASSWORD="Zambelis123!"
DB_PORT="5432"

echo "Database: ${SUPABASE_HOST}:${DB_PORT}"
echo "Password: ${DB_PASSWORD}"
echo ""

# Update Vercel environment variables with correct password
echo "Updating Vercel environment variables..."

vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require" | vercel env add POSTGRES_URL production

vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require" | vercel env add DATABASE_URL production

vercel env rm POSTGRES_URL_NON_POOLING production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require" | vercel env add POSTGRES_URL_NON_POOLING production

vercel env rm POSTGRES_URL_NO_SSL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres" | vercel env add POSTGRES_URL_NO_SSL production

vercel env rm POSTGRES_PRISMA_URL production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require" | vercel env add POSTGRES_PRISMA_URL production

vercel env rm DATABASE_URL_UNPOOLED production -y
echo "postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require" | vercel env add DATABASE_URL_UNPOOLED production

# Update database credentials
vercel env rm POSTGRES_HOST production -y
echo "${SUPABASE_HOST}" | vercel env add POSTGRES_HOST production

vercel env rm POSTGRES_PORT production -y
echo "${DB_PORT}" | vercel env add POSTGRES_PORT production

vercel env rm POSTGRES_PASSWORD production -y
echo "${DB_PASSWORD}" | vercel env add POSTGRES_PASSWORD production

vercel env rm POSTGRES_USER production -y
echo "postgres" | vercel env add POSTGRES_USER production

vercel env rm POSTGRES_DATABASE production -y
echo "postgres" | vercel env add POSTGRES_DATABASE production

# Keep Supabase keys the same
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "${SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "${SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y
echo "${SUPABASE_SERVICE_KEY}" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Update local environment file
echo "Updating local .env.local..."
cat > .env.local << EOF
# SOFIA Supabase Database (ebgsbtqtkdgaafqejjye) - Correct Password
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require"
POSTGRES_URL="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require"
POSTGRES_URL_NO_SSL="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres"
POSTGRES_PRISMA_URL="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_HOST}:${DB_PORT}/postgres?sslmode=require"
POSTGRES_HOST="${SUPABASE_HOST}"
POSTGRES_PORT="${DB_PORT}"
POSTGRES_PASSWORD="${DB_PASSWORD}"
POSTGRES_USER="postgres"
POSTGRES_DATABASE="postgres"

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY}"

# Other existing variables
AUTH_SECRET="ziV2voDfCXoQYbEEYZAEm/KiK6MNYgzN/mzPagPHeXQ="
AI_GATEWAY_API_KEY=vck_57uN4ziqmVNirEwQgOBN3DyCFs8j8BGPVl2Y1Z5WgVMuM4xLOr33wXUv
TELEGRAM_BOT_TOKEN=7927866073:AAFe9pZpsFPxrMv20TuETnvpKy2Y5gUQpFs
REDIS_URL="rediss://default:ARjqAAImcDI1MjhmNGZiYzdlOTE0ZGZiYTQ1ODVhY2RiNDBhMTUzNXAyNjM3OA@central-glider-6378.upstash.io:6379"
ZYPRUS_API_URL="https://dev9.zyprus.com"
ZYPRUS_CLIENT_ID="5Al3Dbs3X9Oqbi8PAjPh5wUfcfrothnub7gI8nOvLig"
ZYPRUS_CLIENT_SECRET="M7wH"%zuyf8")KZ"
ZYPRUS_SITE_URL="https://dev9.zyprus.com/"
EOF

echo ""
echo "✅ Updated database password to Zambelis123!"
echo ""
echo "Connection string: postgresql://postgres:Zambelis123!@${SUPABASE_HOST}:${DB_PORT}/postgres"
echo ""
echo "Next: Deploy with 'vercel --prod --force'"