#!/bin/bash

# SOFIA Telegram Bot Setup Script
# This script helps you set up and configure your Telegram bot

set -e

echo "🤖 SOFIA Telegram Bot Setup"
echo "================================"
echo ""

# Check if VERCEL_URL is provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide your Vercel deployment URL"
  echo ""
  echo "Usage: ./scripts/setup-telegram-bot.sh <your-app-url>"
  echo "Example: ./scripts/setup-telegram-bot.sh https://sofia-bot.vercel.app"
  echo ""
  exit 1
fi

VERCEL_URL=$1
WEBHOOK_URL="$VERCEL_URL/api/telegram/webhook"

echo "🔍 Checking bot status..."
echo ""

# Check bot info
STATUS_RESPONSE=$(curl -s "$VERCEL_URL/api/telegram/setup")

if echo "$STATUS_RESPONSE" | grep -q "\"status\":\"ok\""; then
  echo "✅ Bot is configured and running!"
  echo ""
  echo "Bot Information:"
  echo "$STATUS_RESPONSE" | jq '.'
  echo ""
else
  echo "⚠️  Bot status check failed. Response:"
  echo "$STATUS_RESPONSE"
  echo ""
fi

# Ask if user wants to set webhook
read -p "Do you want to set/update the webhook? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "🔗 Setting webhook to: $WEBHOOK_URL"
  echo ""
  
  WEBHOOK_RESPONSE=$(curl -s -X POST "$VERCEL_URL/api/telegram/setup" \
    -H "Content-Type: application/json" \
    -d "{\"webhookUrl\": \"$WEBHOOK_URL\"}")
  
  if echo "$WEBHOOK_RESPONSE" | grep -q "\"success\":true"; then
    echo "✅ Webhook set successfully!"
    echo ""
    echo "Webhook Information:"
    echo "$WEBHOOK_RESPONSE" | jq '.'
    echo ""
    echo "🎉 Your bot is ready to receive messages!"
    echo ""
    echo "To test your bot:"
    echo "1. Open Telegram"
    echo "2. Search for your bot username"
    echo "3. Send a message"
    echo ""
  else
    echo "❌ Failed to set webhook. Response:"
    echo "$WEBHOOK_RESPONSE"
    echo ""
    echo "Possible issues:"
    echo "- TELEGRAM_BOT_TOKEN not set in Vercel environment variables"
    echo "- Bot token is invalid"
    echo "- Network connectivity issues"
    echo ""
  fi
fi

echo "📊 Next Steps:"
echo "1. Test your bot by sending a message on Telegram"
echo "2. Monitor logs: vercel logs --follow"
echo "3. Check webhook status: curl $VERCEL_URL/api/telegram/setup"
echo ""
echo "📚 Full documentation: TELEGRAM_BOT_SETUP.md"
echo ""
