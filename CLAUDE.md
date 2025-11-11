# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Implementation Tracking

**ALWAYS** check `IMPLEMENTATION_PLAN.md` before starting ANY work. This file tracks:
- All optimization tasks and their status
- Testing protocols
- Deployment checklists
- Recent changes (11 tasks completed as of 2025-01-10)

## Project Overview

SOFIA is a production-grade Next.js 15 application serving as Zyprus Property Group's AI Assistant for Cyprus real estate operations.

### Core Functionality
- Cyprus real estate document generation (38 templates)
- Property listing management with Zyprus API integration
- AI chat interface with specialized real estate tools
- Telegram bot integration for external support
- VAT, transfer fee, and capital gains tax calculators

## Architecture

### AI Model Configuration (lib/ai/providers.ts)

**CRITICAL**: AI Gateway is MANDATORY - no fallback options exist.

```bash
AI_GATEWAY_API_KEY=required  # Application will not start without this
```

Available models via Vercel AI Gateway:
- `chat-model` → Claude Haiku 4.5 (default, $1.00/M input, $5.00/M output)
- `chat-model-sonnet` → Claude Sonnet 4.5 ($3.00/M input, $15.00/M output)
- `chat-model-gpt4o` → GPT-4o Mini ($0.15/M input, $0.60/M output)

### Database Architecture

PostgreSQL with Drizzle ORM. Key tables:
- `User` - Authentication and profiles
- `Chat` - Conversation sessions
- `Message_v2` - Chat messages with parts
- `PropertyListing` - Real estate listings
- `Vote_v2` - Message feedback

Recent optimizations:
- Composite indexes on (userId, createdAt) for faster queries
- CASCADE deletes for automatic cleanup
- Enhanced error logging in all catch blocks

### Authentication & Rate Limiting

1. **Access Gate**: `qualia-access=granted` cookie required
2. **Session Types**: Guest (auto-created) vs Regular users
3. **Rate Limits**: Different quotas per user type (lib/ai/entitlements.ts)
4. **Redis**: Used for rate limiting via Upstash

## Development Commands

```bash
# Core development
pnpm dev                    # Start dev server with Turbo
pnpm build                  # Production build
pnpm start                  # Start production server

# Database management
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate            # Apply migrations
pnpm db:studio             # Launch Drizzle Studio GUI

# Code quality
pnpm lint                  # Run Ultracite checks
pnpm format                # Auto-fix with Ultracite

# Testing
pnpm test                  # Playwright E2E (requires PLAYWRIGHT=True)
pnpm test:unit             # Unit tests
pnpm test:ai-models        # Test AI model connectivity
```

## Key Implementation Patterns

### Adding New AI Tools

1. Create tool in `lib/ai/tools/`
2. Export from tool file
3. Register in `app/(chat)/api/chat/route.ts`:
   ```typescript
   const tools = {
     yourTool: yourToolImplementation,
     // ...
   };
   experimental_activeTools: ["yourTool"]
   ```

### Streaming Chat Architecture

Main endpoint: `app/(chat)/api/chat/route.ts`

Features:
- Server-Sent Events using `JsonToSseTransformStream`
- Token tracking with tokenlens
- Message persistence in PostgreSQL
- Tool execution for real estate calculations
- Anthropic prompt caching (when using Claude models)

### Telegram Integration

- Webhook: `/api/telegram/webhook`
- Handler: `lib/telegram/message-handler.ts`
- Optimized typing indicators (3-second intervals)
- Automatic message splitting for long responses

### Property Listing Flow

1. Create via AI tool or API endpoint
2. Status progression: `draft` → `queued` → `uploading` → `uploaded`
3. Redis-cached Zyprus taxonomy (1-hour TTL)
4. Retry logic with exponential backoff
5. Upload attempts tracked in `ListingUploadAttempt` table

## Recent Optimizations (from IMPLEMENTATION_PLAN.md)

### Completed (Week 3)
- ✅ Database indexes for 10-100x faster queries
- ✅ Telegram typing indicators reduced by 90%
- ✅ System prompt caching (50-100ms saved per request)
- ✅ Redis cache for Zyprus taxonomy (95% fewer API calls)
- ✅ Anthropic prompt caching ($2-5 saved per 1000 requests)
- ✅ Optimized pagination queries (50% fewer database round-trips)
- ✅ CASCADE deletes (75% fewer deletion queries)
- ✅ Enhanced error logging across all database operations
- ✅ Environment variable consolidation

### Pending
- Paid membership tier implementation (requires billing integration)

## Project Structure

```
app/
├── (auth)/              # Authentication pages
├── (chat)/              # Main chat interface
│   ├── api/chat/        # Streaming AI endpoint
│   └── chat/[id]/       # Individual chat sessions
├── api/
│   ├── listings/        # Property CRUD
│   ├── templates/       # Template metadata
│   └── telegram/        # Telegram webhook
└── properties/          # Property management UI

lib/
├── ai/
│   ├── providers.ts     # AI Gateway configuration
│   ├── prompts.ts       # System prompts (cached)
│   └── tools/           # Cyprus real estate tools
├── db/
│   ├── schema.ts        # Drizzle schema with indexes
│   └── queries.ts       # Database operations
├── telegram/            # Bot integration
└── zyprus/              # API client with Redis cache
```

## Environment Variables

Required for operation:
```bash
# Critical - no fallback
AI_GATEWAY_API_KEY=        # Vercel AI Gateway key

# Database (auto-generated by Vercel)
POSTGRES_URL=              # PostgreSQL connection
REDIS_URL=                 # Redis/KV for caching

# Authentication
AUTH_SECRET=               # NextAuth JWT signing

# Integrations
TELEGRAM_BOT_TOKEN=        # Telegram bot
ZYPRUS_CLIENT_ID=          # Zyprus OAuth
ZYPRUS_CLIENT_SECRET=      # Zyprus OAuth
```

See `.env.example` for complete documentation with setup instructions.

## Testing Strategy

1. **Unit Tests**: `pnpm test:unit`
2. **E2E Tests**: `PLAYWRIGHT=True pnpm test`
3. **Model Tests**: `pnpm test:ai-models`
4. **Build Verification**: `pnpm build`

Always verify after database migrations:
```bash
pnpm db:generate
pnpm db:migrate
pnpm build
```

## Deployment

```bash
# Vercel auto-deploys on push to main
git push origin main

# Manual deployment
npx vercel --prod

# Migrations apply automatically on Vercel
```

Monitor after deployment:
- Check Vercel logs: `vercel logs sofiatesting.vercel.app`
- Verify AI Gateway costs in Vercel dashboard
- Monitor Redis memory usage
- Check error rates in production logs

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 503 Errors | Verify AI_GATEWAY_API_KEY is set |
| Rate limit exceeded | Check user type and message count in database |
| Database errors | Run `pnpm db:migrate` |
| Tool not working | Verify registration in chat route |
| Slow queries | Check indexes exist (migration 0011) |
| High API costs | Monitor Anthropic prompt caching hit rate |

## Important Notes

1. **No Gemini/Google AI**: All Google dependencies removed
2. **Soft deletes**: Always check `deletedAt IS NULL` in queries
3. **Streaming format**: Use `JsonToSseTransformStream` for SSE
4. **Tool execution**: Tools must be registered in both `tools` object and `experimental_activeTools` array
5. **Prompt caching**: Only works with Claude models, not GPT-4o Mini