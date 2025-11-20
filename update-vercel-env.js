#!/usr/bin/env node

const { execSync } = require('child_process');

const envVars = [
  {
    key: 'POSTGRES_URL',
    value: 'postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres'
  },
  {
    key: 'POSTGRES_URL_NON_POOLING',
    value: 'postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres'
  },
  {
    key: 'POSTGRES_HOST',
    value: 'db.ebgsbtqtkdgaafqejjye.supabase.co'
  },
  {
    key: 'POSTGRES_PASSWORD',
    value: 'Zambelis123!'
  },
  {
    key: 'POSTGRES_USER',
    value: 'postgres'
  },
  {
    key: 'POSTGRES_DATABASE',
    value: 'postgres'
  },
  {
    key: 'POSTGRES_PRISMA_URL',
    value: 'postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres'
  },
  {
    key: 'DATABASE_URL',
    value: 'postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres'
  },
  {
    key: 'DATABASE_URL_UNPOOLED',
    value: 'postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://ebgsbtqtkdgaafqejjye.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0'
  }
];

console.log('🚀 Starting Vercel environment variable updates...\n');

for (const { key, value } of envVars) {
  try {
    console.log(`📝 Updating ${key}...`);
    
    // Use echo with newline to pipe the value
    const cmd = `echo "${value}" | vercel env add ${key} production 2>&1`;
    const output = execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log(`✅ ${key} updated successfully`);
    if (output) console.log(`   Output: ${output.trim()}`);
  } catch (error) {
    console.error(`❌ Failed to update ${key}`);
    console.error(`   Error: ${error.message}`);
    if (error.stdout) console.error(`   Stdout: ${error.stdout}`);
    if (error.stderr) console.error(`   Stderr: ${error.stderr}`);
  }
  console.log('');
}

console.log('✨ Environment variable update complete!');
console.log('\n📦 Next step: Deploy to production with:');
console.log('   vercel --prod');
