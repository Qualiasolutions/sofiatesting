# SOFIA Telegram Bot Setup Guide

This guide will help you set up the SOFIA Telegram bot for forwarding messages and chatting with users.

## 🤖 What This Bot Does

- **Receives messages** from Telegram users
- **Forwards them to SOFIA AI** (same AI that powers the web interface)
- **Returns AI responses** back to Telegram users
- **Maintains conversation history** - each Telegram user gets their own persistent chat session
- **Uses Gemini 2.5 Flash** by default (fastest and cheapest model for high-volume messaging)
- **Supports calculator tools** - transfer fees, capital gains, VAT calculations

## 📋 Prerequisites

1. A Telegram account
2. Your application deployed to Vercel (or a publicly accessible URL)
3. Database configured (PostgreSQL)

## 🚀 Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Send** `/newbot` to BotFather
3. **Follow the prompts**:
   - Choose a name for your bot (e.g., "SOFIA Property Assistant")
   - Choose a username (must end in 'bot', e.g., "sofia_property_bot")
4. **Copy the bot token** - looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Save this token** - you'll need it for the next step

## 🔧 Step 2: Configure Environment Variables

### For Vercel Deployment:

```bash
# Add the Telegram bot token to Vercel
vercel env add TELEGRAM_BOT_TOKEN

# Paste your token when prompted
# Choose: Production, Preview, Development (select all)
```

### For Local Development:

Add to your `.env.local` file:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## 📦 Step 3: Deploy to Vercel

```bash
# Make sure you're in the project directory
cd /home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting

# Build and deploy
vercel --prod
```

After deployment, you'll get a URL like: `https://your-app.vercel.app`

## 🔗 Step 4: Set Up Webhook

### Option A: Using the Setup API (Recommended)

After deploying, use this curl command to set up the webhook:

```bash
curl -X POST https://your-app.vercel.app/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-app.vercel.app/api/telegram/webhook"}'
```

**Replace `your-app.vercel.app` with your actual Vercel URL!**

### Option B: Using Telegram Bot API Directly

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## ✅ Step 5: Verify Setup

Check if your webhook is set up correctly:

```bash
curl https://your-app.vercel.app/api/telegram/setup
```

You should see:
- Bot information (username, name, etc.)
- Webhook URL
- Status: "ok"

## 🧪 Step 6: Test Your Bot

1. **Open Telegram**
2. **Search** for your bot username (e.g., @sofia_property_bot)
3. **Send** `/start` or any message
4. **SOFIA should respond** within a few seconds!

## 📊 How It Works

```
Telegram User
     ↓
  Message sent
     ↓
Telegram Bot API
     ↓
Webhook → /api/telegram/webhook
     ↓
Message Handler
     ↓
SOFIA AI (Gemini 2.5 Flash)
     ↓
Response sent back
     ↓
Telegram User receives message
```

## 💾 User & Chat Management

- **Each Telegram user** automatically gets a database user created (email: `telegram_<id>@sofia.bot`)
- **Each user gets their own persistent chat** - conversation history is maintained across sessions
- **Chat ID format**: `telegram_<telegram_user_id>_chat`
- **All messages are saved** to the database for continuity

## 🛠️ API Endpoints

### 1. Webhook Endpoint
- **URL**: `/api/telegram/webhook`
- **Method**: POST (handled by Telegram)
- **Purpose**: Receives updates from Telegram Bot API

### 2. Setup Endpoint
- **URL**: `/api/telegram/setup`
- **Methods**: 
  - GET - Check bot status and webhook info
  - POST - Set webhook URL
  - DELETE - Remove webhook (for local testing)

## 🔍 Monitoring & Debugging

### Check Bot Status
```bash
curl https://your-app.vercel.app/api/telegram/setup
```

### View Logs in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Logs** tab
4. Filter by "telegram" to see bot activity

### Common Issues

**Bot doesn't respond:**
- Check webhook is set: `curl https://your-app.vercel.app/api/telegram/setup`
- Check Vercel logs for errors
- Verify `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables

**"TELEGRAM_BOT_TOKEN is required" error:**
- Add the token to Vercel: `vercel env add TELEGRAM_BOT_TOKEN`
- Redeploy: `vercel --prod`

**Database errors:**
- Verify `POSTGRES_URL` is set
- Check database connection in Vercel logs

**Webhook already set to different URL:**
- Delete old webhook: `curl -X DELETE https://your-app.vercel.app/api/telegram/setup`
- Set new webhook (see Step 4)

## 🔐 Security Notes

- ✅ Webhook endpoint validates Telegram updates
- ✅ Bot only processes text messages (ignores other types for now)
- ✅ Each Telegram user is isolated with their own database user
- ✅ All responses go through the same AI system as the web app
- ⚠️ Bot token is sensitive - never commit it to git
- ⚠️ Only share your bot username, never the token

## 💰 Cost Considerations

**Default Model**: Gemini 2.5 Flash
- **Cost**: ~$0.30/M input tokens, ~$2.50/M output tokens
- **Estimated**: ~$12/day for 10,000 messages
- **Why**: 8x cheaper than Grok, perfect for high-volume Telegram chats

**To switch models**, edit `/lib/telegram/message-handler.ts`:

```typescript
// Change this line:
model: myProvider.languageModel("chat-model-gemini"),

// To:
model: myProvider.languageModel("chat-model-claude"), // Best accuracy
// OR
model: myProvider.languageModel("chat-model"), // Grok Vision
```

## 📱 Bot Commands (Optional)

You can add commands to your bot via @BotFather:

1. Send `/setcommands` to @BotFather
2. Select your bot
3. Add commands like:
```
start - Start chatting with SOFIA
help - Get help information
fees - Calculate property transfer fees
vat - Calculate VAT for new builds
tax - Calculate capital gains tax
```

4. Handle these in your code by checking `message.text.startsWith('/')` in the message handler

## 🎯 Next Steps

1. **Test thoroughly** - Send various messages to ensure responses are correct
2. **Monitor costs** - Check Vercel AI Gateway dashboard
3. **Customize responses** - Edit prompts in `/lib/ai/prompts.ts`
4. **Add features** - Support images, documents, or custom commands
5. **Scale up** - Bot can handle thousands of concurrent users

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test webhook connection
4. Review error messages in console logs

## 🎉 You're Done!

Your SOFIA Telegram bot is now live and ready to chat with users. The web interface acts as your admin panel where you can test and monitor conversations.

**Share your bot**: Send users to `https://t.me/your_bot_username`
