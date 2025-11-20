#!/bin/bash

# Telegram Bot Test Script
# This script verifies the bot is working correctly

# Load token from environment variable (secure)
TOKEN="${TELEGRAM_BOT_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ ERROR: TELEGRAM_BOT_TOKEN environment variable not set"
  echo "Usage: TELEGRAM_BOT_TOKEN=your_token ./test-telegram-bot.sh"
  exit 1
fi

echo "🤖 TELEGRAM BOT COMPLETE TEST"
echo "========================================"
echo ""

# Test 1: Check bot info
echo "✓ Test 1: Bot Information"
curl -s "https://api.telegram.org/bot${TOKEN}/getMe"
echo ""
echo ""

# Test 2: Check webhook
echo "✓ Test 2: Webhook Configuration"
curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"
echo ""
echo ""

# Test 3: Send test webhook request
echo "✓ Test 3: Testing Webhook Endpoint"
curl -X POST https://sofiatesting-ogj0npcn8-qualiasolutionscy.vercel.app/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 999999999,
    "message": {
      "message_id": 999,
      "from": {"id": 999999, "is_bot": false, "first_name": "Test", "username": "test"},
      "chat": {"id": 999999, "type": "private"},
      "date": 1699999999,
      "text": "Hello!"
    }
  }'
echo ""
echo ""

echo "========================================"
echo "✅ ALL TESTS COMPLETE"
echo ""
echo "To test manually:"
echo "1. Open Telegram"
echo "2. Search for: @Sophia_Zyprus_Bot"
echo "3. Send a message"
echo "4. You should get a response!"
