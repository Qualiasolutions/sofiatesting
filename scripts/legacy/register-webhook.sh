#!/bin/bash

# Telegram bot credentials
BOT_TOKEN="8281384553:AAEgfB-R2N6CxPmP0xKg453A_5XZNnf7haI"
WEBHOOK_SECRET="cdbdcb21896b278b8811cbbb22378161592712db5c4067a8d9948e76dddb5815"
WEBHOOK_URL="https://sofiatesting.vercel.app/api/telegram/webhook"

echo "Registering Telegram webhook..."

# Delete existing webhook first
echo "Deleting old webhook..."
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook" | jq

# Set new webhook with secret token
echo "Setting new webhook..."
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"url\": \"${WEBHOOK_URL}\",
        \"secret_token\": \"${WEBHOOK_SECRET}\",
        \"allowed_updates\": [\"message\", \"edited_message\", \"callback_query\"],
        \"max_connections\": 100,
        \"drop_pending_updates\": false
    }" | jq

# Verify webhook
echo "Verifying webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq