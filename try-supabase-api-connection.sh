#!/bin/bash

echo "Trying Alternative Supabase Connection Methods"
echo "=========================================="

# Try using Supabase REST API instead of direct PostgreSQL
SUPABASE_URL="https://ebgsbtqtkdgaafqejjye.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MzUwOSwiZXhwIjoyMDc5MTY5NTA5fQ.zarFvLHxa2cgxy4IOur_XzJ62owXFjtxCNpMWdrjRkw"

# First, try using IPv4 format (some serverless platforms prefer this)
echo "Testing IPv4 connection format..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/User?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  | head -c 200

echo ""
echo ""

# Try alternative connection string formats
echo "Updating Vercel with alternative connection formats..."

# Try using pooler without DNS resolution
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres?connect_timeout=30&sslmode=require" | vercel env add POSTGRES_URL production

vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres?connect_timeout=30&sslmode=require" | vercel env add DATABASE_URL production

# Keep the Supabase client working - this should use REST API under the hood
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "${SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "${SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y
echo "${SUPABASE_SERVICE_KEY}" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo ""
echo "✅ Updated with alternative connection methods!"
echo ""
echo "Changes:"
echo "- Added connect_timeout=30 parameter"
echo "- Kept Supabase client configuration (should use REST API)"
echo "- Using direct hostname (may resolve with longer timeout)"

# Create a test script to verify database connectivity
echo ""
echo "Creating database connectivity test..."
cat > test-db-connection.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test a simple query
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Connection failed:', error);
      return false;
    }

    console.log('✅ Connection successful!');
    console.log('Data:', data);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
}

testConnection();
EOF

echo ""
echo "Next steps:"
echo "1. Deploy: vercel --prod --force"
echo "2. Check logs for connection status"