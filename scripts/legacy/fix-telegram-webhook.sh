#!/bin/bash

# Fix Telegram Webhook Script
# Purpose: Re-register webhook with Telegram to fix secret token mismatch

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Telegram Webhook Fix Script ===${NC}"
echo ""

# Load environment variables
if [ -f ".env.production.local" ]; then
    echo -e "${YELLOW}Loading production environment variables...${NC}"
    export $(cat .env.production.local | grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_WEBHOOK_SECRET)=' | xargs)
else
    echo -e "${RED}Error: .env.production.local not found!${NC}"
    echo "Run: vercel env pull .env.production.local --environment production --yes"
    exit 1
fi

# Check required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_WEBHOOK_SECRET" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+[SET]}"
    echo "TELEGRAM_WEBHOOK_SECRET: ${TELEGRAM_WEBHOOK_SECRET:+[SET]}"
    exit 1
fi

# Webhook URL
WEBHOOK_URL="https://sofiatesting.vercel.app/api/telegram/webhook"

echo -e "${YELLOW}Step 1: Getting current webhook info...${NC}"
CURRENT_WEBHOOK=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
echo "$CURRENT_WEBHOOK" | jq '.'

echo ""
echo -e "${YELLOW}Step 2: Deleting existing webhook...${NC}"
DELETE_RESULT=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook")
echo "$DELETE_RESULT" | jq '.'

echo ""
echo -e "${YELLOW}Step 3: Setting new webhook with secret...${NC}"
SET_RESULT=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{
        \"url\": \"${WEBHOOK_URL}\",
        \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\",
        \"allowed_updates\": [\"message\", \"edited_message\", \"callback_query\"],
        \"max_connections\": 100,
        \"drop_pending_updates\": false
    }")
echo "$SET_RESULT" | jq '.'

echo ""
echo -e "${YELLOW}Step 4: Verifying new webhook...${NC}"
VERIFY_WEBHOOK=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
echo "$VERIFY_WEBHOOK" | jq '.'

# Check if webhook was set successfully
if echo "$VERIFY_WEBHOOK" | grep -q "\"url\":\"${WEBHOOK_URL}\""; then
    echo ""
    echo -e "${GREEN}✅ SUCCESS! Webhook has been re-registered with new secret token${NC}"
    echo ""
    echo -e "${GREEN}Test the bot now:${NC}"
    echo "1. Open Telegram"
    echo "2. Send a message to @SOFIACyprusBot"
    echo "3. You should get a response!"
    echo ""
    echo -e "${YELLOW}Monitor logs with:${NC}"
    echo "vercel logs sofiatesting.vercel.app --since 5m"
else
    echo ""
    echo -e "${RED}❌ ERROR: Webhook registration may have failed${NC}"
    echo "Please check the output above for error details"
    exit 1
fi