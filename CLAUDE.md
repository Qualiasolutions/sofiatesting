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
- `chat-model` → Gemini 2.5 Flash (default, $0.075/M input, $0.30/M output) - Best price-performance with thinking
- `chat-model-pro` → Gemini 2.5 Pro ($1.25/M input, $5.00/M output) - Most powerful reasoning model
- `chat-model-flash-lite` → Gemini 2.5 Flash-Lite ($0.0375/M input, $0.15/M output) - Ultra-fast and cheapest

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

**CRITICAL**: Tools require DUAL registration to function properly.

1. Create tool in `lib/ai/tools/` (e.g., `calculate-vat.ts`)
2. Export tool definition with `description`, `parameters`, and `execute` function
3. Register in `app/(chat)/api/chat/route.ts`:
   ```typescript
   // Step 1: Import the tool
   import { calculateVAT } from "@/lib/ai/tools/calculate-vat";

   // Step 2: Add to tools object
   const tools = {
     calculateVAT: calculateVAT,
     // ...other tools
   };

   // Step 3: Add to experimental_activeTools array (MUST MATCH KEY NAME)
   experimental_activeTools: ["calculateVAT"]
   ```

**Common Mistake**: Forgetting to add tool name to `experimental_activeTools` array. The tool will be imported but won't be available to the AI model.

### Streaming Chat Architecture

Main endpoint: `app/(chat)/api/chat/route.ts`

**Response Format**: Server-Sent Events (SSE) using custom `JsonToSseTransformStream`

The chat endpoint streams responses in real-time:
1. Client sends POST with messages array and model selection
2. Server validates rate limits and authentication
3. Calls `streamText()` from Vercel AI SDK with selected model
4. Transforms JSON stream to SSE format for browser consumption
5. Persists final message and tool results to PostgreSQL
6. Tracks token usage with tokenlens library

**Key Features**:
- **Model Selection**: User can choose between Haiku (default), Sonnet, or GPT-4o Mini
- **Tool Execution**: AI can call Cyprus real estate calculation tools
- **Prompt Caching**: Anthropic models cache system prompt (5-minute TTL)
- **Token Tracking**: Input/output tokens counted for billing
- **Error Handling**: Catches streaming errors and returns proper error responses

**Response Event Types**:
- `0:` - Text delta (streaming content)
- `2:` - Tool call
- `3:` - Tool result
- `d:` - Done (final message metadata)

Client-side: `app/(chat)/chat/[id]/page.tsx` uses `useChat()` hook to handle SSE stream parsing.

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

### Template System

SOFIA includes 38 Cyprus real estate document templates:
- **Location**: Templates stored as metadata in database
- **Smart Extraction**: AI extracts required fields from conversation context
- **Document Types**: Contracts, agreements, listings, legal documents
- **API**: `/api/templates` provides template metadata
- **Rendering**: Templates use variables with `{{fieldName}}` syntax

Available tools in `lib/ai/tools/`:
- `calculate-transfer-fees.ts` - Property transfer fees
- `calculate-capital-gains.ts` - Capital gains tax
- `calculate-vat.ts` - VAT calculations
- `create-listing.ts` - Property listing creation
- `list-listings.ts` - Query property listings
- `create-document.ts` - Template-based document generation
- `update-document.ts` - Document modifications

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

### Production Issues

| Issue | Solution |
|-------|----------|
| 503 Errors | Verify AI_GATEWAY_API_KEY is set in Vercel |
| Rate limit exceeded | Check user type and message count in database |
| Database errors | Run `pnpm db:migrate` |
| Tool not working | Verify dual registration (tools object + experimental_activeTools) |
| Slow queries | Check indexes exist (migration 0011) |
| High API costs | Monitor Anthropic prompt caching hit rate |

### Development Issues

| Issue | Solution |
|-------|----------|
| Build fails with Tailwind errors | Run `pnpm install` to ensure @tailwindcss/postcss is installed |
| "Cannot find module" errors | Check imports use correct path aliases (@/lib, @/app) |
| Drizzle type errors | Run `pnpm db:generate` after schema changes |
| Hot reload not working | Restart dev server with `pnpm dev` |
| Tests failing | Ensure PLAYWRIGHT=True env var for E2E tests |
| Database connection fails | Check POSTGRES_URL in .env.local |
| AI models not responding | Verify AI_GATEWAY_API_KEY and check Vercel AI Gateway dashboard |

## Important Notes

1. **No Gemini/Google AI**: All Google dependencies removed - AI Gateway only
2. **Soft deletes**: Always check `deletedAt IS NULL` in queries
3. **Streaming format**: Use `JsonToSseTransformStream` for SSE responses
4. **Tool execution**: Tools must be registered in both `tools` object and `experimental_activeTools` array
5. **Prompt caching**: Only works with Claude models (Haiku/Sonnet), not GPT-4o Mini
6. **Git status**: Check `git status` before making changes - there are uncommitted admin components
7. **Database schema changes**: Always run `pnpm db:generate` → `pnpm db:migrate` → `pnpm build` in sequence
8. **Testing after migrations**: Run full test suite after schema changes to verify integrity

## Working with Uncommitted Changes

Current uncommitted files (as of last check):
- `app/(admin)/` - Admin interface components (new)
- `components/admin/` - Admin UI components (new)
- `components/ui/table.tsx` - Table component (new)
- `app/(chat)/api/chat/route.ts` - Modified chat endpoint
- `lib/ai/prompts.ts` - Modified prompts
- `lib/db/schema.ts` - Database schema changes
- Migration files (0013)

**Before making changes**: Run `git status` to see current uncommitted work. Coordinate with existing changes to avoid conflicts.