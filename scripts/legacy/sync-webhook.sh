#!/bin/bash

BOT_TOKEN="8281384553:AAEgfB-R2N6CxPmP0xKg453A_5XZNnf7haI"
CURRENT_SECRET="625d7c413693615dfea4073995621d454b43a04e2f4535fd49d0e55d73a9ccba"
WEBHOOK_URL="https://sofiatesting.vercel.app/api/telegram/webhook"

echo "Syncing webhook with current production secret..."

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"'"${WEBHOOK_URL}"'","secret_token":"'"${CURRENT_SECRET}"'","allowed_updates":["message","edited_message","callback_query"],"max_connections":100,"drop_pending_updates":true}' | jq

echo ""
echo "Verifying webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq