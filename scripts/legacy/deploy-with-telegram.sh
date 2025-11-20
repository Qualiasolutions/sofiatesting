#!/bin/bash

# SOFIA Complete Deployment Script with Telegram Bot Setup
# This script deploys to Vercel and sets up the Telegram webhook

set -e

echo "🚀 SOFIA Deployment Script"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI is not installed."
  echo "Install it with: npm i -g vercel"
  exit 1
fi

echo "1️⃣  Building application..."
echo ""
pnpm build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix errors and try again."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

echo "2️⃣  Deploying to Vercel..."
echo ""

# Deploy to production
DEPLOY_OUTPUT=$(vercel --prod 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract the deployment URL
VERCEL_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$VERCEL_URL" ]; then
  echo "⚠️  Could not extract deployment URL automatically."
  read -p "Please enter your Vercel URL: " VERCEL_URL
fi

echo ""
echo "✅ Deployed to: $VERCEL_URL"
echo ""

# Ask if user wants to set up Telegram bot
read -p "Do you want to set up the Telegram bot webhook? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "3️⃣  Setting up Telegram bot..."
  echo ""
  
  # Check if TELEGRAM_BOT_TOKEN is set
  if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "⚠️  TELEGRAM_BOT_TOKEN is not set in your environment."
    echo ""
    echo "To set it up:"
    echo "1. Run: vercel env add TELEGRAM_BOT_TOKEN"
    echo "2. Paste your bot token from @BotFather"
    echo "3. Select: Production, Preview, Development"
    echo "4. Run this script again"
    echo ""
  else
    ./scripts/setup-telegram-bot.sh "$VERCEL_URL"
  fi
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📍 URLs:"
echo "   Web App: $VERCEL_URL"
echo "   Telegram Webhook: $VERCEL_URL/api/telegram/webhook"
echo "   Bot Setup: $VERCEL_URL/api/telegram/setup"
echo ""
echo "🔍 Monitoring:"
echo "   View logs: vercel logs --follow"
echo "   Check status: curl $VERCEL_URL/api/telegram/setup"
echo ""
echo "📚 Documentation:"
echo "   Telegram Bot: docs/guides/telegram-bot-setup.md"
echo "   AI Gateway: docs/guides/ai-gateway-setup.md"
echo ""
