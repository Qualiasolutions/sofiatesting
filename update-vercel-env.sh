#!/bin/bash

# Update Vercel production environment variables for new Supabase database

echo "Updating POSTGRES_URL..."
vercel env rm POSTGRES_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_URL production

echo "Updating POSTGRES_URL_NON_POOLING..."
vercel env rm POSTGRES_URL_NON_POOLING production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add POSTGRES_URL_NON_POOLING production

echo "Updating POSTGRES_HOST..."
vercel env rm POSTGRES_HOST production -y
echo "db.ebgsbtqtkdgaafqejjye.supabase.co" | vercel env add POSTGRES_HOST production

echo "Updating POSTGRES_PASSWORD..."
vercel env rm POSTGRES_PASSWORD production -y
echo "Zambelis123!" | vercel env add POSTGRES_PASSWORD production

echo "Updating POSTGRES_USER..."
vercel env rm POSTGRES_USER production -y
echo "postgres" | vercel env add POSTGRES_USER production

echo "Updating POSTGRES_DATABASE..."
vercel env rm POSTGRES_DATABASE production -y
echo "postgres" | vercel env add POSTGRES_DATABASE production

echo "Updating DATABASE_URL..."
vercel env rm DATABASE_URL production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add DATABASE_URL production

echo "Updating DATABASE_URL_UNPOOLED..."
vercel env rm DATABASE_URL_UNPOOLED production -y
echo "postgresql://postgres:Zambelis123!@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres" | vercel env add DATABASE_URL_UNPOOLED production

echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
echo "https://ebgsbtqtkdgaafqejjye.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZ3NidHF0a2RnYWFmcWVqanllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM1MDksImV4cCI6MjA3OTE2OTUwOX0.MF0_QsG8Zi3Yul47IIU-1pEXO-o7LJ4MrtBOZgNwlm0" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "Done! Environment variables updated."
echo "Run 'vercel --prod' to redeploy with new environment variables."
