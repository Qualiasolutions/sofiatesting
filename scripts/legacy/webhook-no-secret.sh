#!/bin/bash
BOT_TOKEN="8281384553:AAEgfB-R2N6CxPmP0xKg453A_5XZNnf7haI"
WEBHOOK_URL="https://sofiatesting.vercel.app/api/telegram/webhook"

echo "Setting webhook WITHOUT secret token..."
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"${WEBHOOK_URL}\",\"drop_pending_updates\":true}" | jq

echo ""
echo "Verifying..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq