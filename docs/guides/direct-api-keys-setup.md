# Direct API Keys Setup for Local Development

## What Was Changed

The provider configuration now supports **direct API keys** from Anthropic and OpenAI, bypassing the Vercel AI Gateway for local development. This eliminates the need for AI Gateway credits during development.

## Setup Instructions

### Option 1: Anthropic API Key (Recommended for SOFIA)

1. **Get your API key** from [Anthropic Console](https://console.anthropic.com/)
2. **Add to `.env.local`**:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```
3. **Restart dev server**: `pnpm dev`

**Models available with Anthropic key:**
- `chat-model-sonnet` → Claude Sonnet 4.5 (direct)
- `chat-model-haiku` → Claude 3.5 Haiku (direct)
- `chat-model` → Claude Sonnet 4.5 (direct)
- `artifact-model` → Claude Sonnet 4.5 (direct)

**Cost:** ~$3/M input tokens, ~$15/M output tokens

### Option 2: OpenAI API Key

1. **Get your API key** from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Add to `.env.local`**:
   ```bash
   OPENAI_API_KEY=sk-xxxxx
   ```
3. **Restart dev server**: `pnpm dev`

**Models available with OpenAI key:**
- `chat-model-gpt4o` → GPT-4o (direct)
- `chat-model-gpt4o-mini` → GPT-4o Mini (direct)
- `title-model` → GPT-4o Mini (direct)

**Cost:** ~$2.50/M input tokens, ~$10/M output tokens

### Option 3: Both API Keys (Full Coverage)

Add both keys to `.env.local` for complete model coverage:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

## How It Works

The provider configuration (`lib/ai/providers.ts`) now has three modes:

1. **Test Environment** (`PLAYWRIGHT=True`)
   - Uses mock models for testing
   - No API calls made

2. **Direct API Keys** (Has `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`)
   - Uses direct Anthropic/OpenAI SDKs
   - Bypasses AI Gateway
   - Lower latency, no gateway costs
   - Console message: "🔑 Using direct AI provider keys: Anthropic OpenAI"

3. **AI Gateway** (No direct keys)
   - Uses Vercel AI Gateway
   - Requires `AI_GATEWAY_API_KEY` and credits
   - Best for production deployments

## Provider Priority

If you have both direct keys and AI Gateway key:
- **Direct keys take priority** for local development
- Gateway is used as fallback if specific provider key is missing

Example:
- Has `ANTHROPIC_API_KEY` only → Uses direct Anthropic, falls back to gateway for OpenAI models
- Has `OPENAI_API_KEY` only → Uses direct OpenAI, falls back to gateway for Anthropic models
- Has both → All models use direct providers

## Verifying Setup

After adding API keys, check the console logs:

```bash
pnpm dev
```

Look for:
```
🔑 Using direct AI provider keys: Anthropic OpenAI
```

## Testing

Send a test message in the chat interface. The response should stream without any gateway errors.

## Cost Comparison

| Method | Setup | Cost Model | Best For |
|--------|-------|-----------|----------|
| **Direct Anthropic** | API key only | Pay per token | Local dev, SOFIA documents |
| **Direct OpenAI** | API key only | Pay per token | Local dev, quick testing |
| **AI Gateway** | Gateway key + credits | Pre-paid credits | Production, team usage |

## Production Deployment

For production on Vercel:
- Gateway is recommended for unified billing and monitoring
- Remove direct API keys from production environment
- Add credits to your Vercel AI Gateway account

## Troubleshooting

### Error: "Insufficient funds"
- You're still using the AI Gateway (no direct keys detected)
- Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to `.env.local`
- Restart dev server

### Error: "API key invalid"
- Check your API key format
- Anthropic: `sk-ant-api03-...`
- OpenAI: `sk-...`
- Regenerate key if needed

### Models not using direct providers
- Check console logs for "🔑 Using direct AI provider keys"
- Verify environment variables are loaded: `echo $ANTHROPIC_API_KEY`
- Restart dev server after adding keys

## Files Modified

- `lib/ai/providers.ts` - Added direct provider support with fallback logic
- `.env.example` - Documented new environment variables
- `package.json` - Added `@ai-sdk/anthropic` and `@ai-sdk/openai`

## Next Steps

1. Add your preferred API key(s) to `.env.local`
2. Restart the dev server: `pnpm dev`
3. Test chat functionality
4. For production, set up AI Gateway with credits

---
**Last Updated**: November 3, 2025
