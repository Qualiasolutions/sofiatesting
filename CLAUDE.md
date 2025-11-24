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

**CRITICAL**: Google Gemini API is MANDATORY - no fallback options exist.

```bash
GOOGLE_GENERATIVE_AI_API_KEY=required  # Or GEMINI_API_KEY
# Application will not start without this at runtime (skipped during build)
```

Available models via Google Gemini API:
- `chat-model` → Gemini 2.0 Flash (default) - Best price-performance with thinking
- `chat-model-pro` → Gemini 1.5 Pro - Most powerful reasoning model
- `chat-model-flash-lite` → Gemini 2.0 Flash-Lite - Ultra-fast and cheapest
- `chat-model-flash` → Gemini 2.0 Flash (alias)

### Database Architecture

**Supabase PostgreSQL** (Project: `sofia-testing-clean`, ID: `ebgsbtqtkdgaafqejjye`)
- **Region**: eu-west-3 (Paris)
- **Connection**: Session Pooler (IPv4-compatible for Vercel)
- **ORM**: Drizzle ORM

**CRITICAL - Vercel IPv4 Compatibility:**
Vercel is IPv4-only and requires the **Session Pooler** connection format:
```bash
# Correct format for Vercel production:
POSTGRES_URL="postgresql://postgres.ebgsbtqtkdgaafqejjye:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"

# DO NOT USE the direct connection format on Vercel:
# postgresql://postgres:[PASSWORD]@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres  # ❌ Will fail with DNS errors
```

**Database Schema:**
- `User` - Authentication and profiles
- `Chat` - Conversation sessions
- `Message_v2` - Chat messages with parts
- `PropertyListing` - Real estate listings
- `Vote_v2` - Message feedback

**Recent optimizations:**
- Composite indexes on (userId, createdAt) for faster queries
- CASCADE deletes for automatic cleanup
- Enhanced error logging in all catch blocks
- Session Pooler for IPv4 compatibility (Nov 2025)

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
   import { calculateVATTool } from "@/lib/ai/tools/calculate-vat";

   // Step 2: Add to experimental_activeTools array
   experimental_activeTools: [
     "calculateVAT",  // MUST match the key in tools object below
     // ...other tool names
   ],

   // Step 3: Add to tools object (MUST MATCH NAME IN activeTools)
   tools: {
     calculateVAT: calculateVATTool,  // Key must match string in activeTools
     // ...other tools
   }
   ```

**Common Mistakes**:
- Forgetting to add tool name to `experimental_activeTools` array
- Mismatching keys between `experimental_activeTools` and `tools` object
- Using wrong casing (keys are case-sensitive)

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
- **Model Selection**: User can choose between different Gemini models (Flash, Pro, Flash-Lite)
- **Tool Execution**: AI can call Cyprus real estate calculation tools
- **System Prompt Caching**: Base prompt cached for 24 hours via `unstable_cache`
- **Token Tracking**: Input/output tokens counted via tokenlens library
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

### Recent Deployment Fixes (Nov 24, 2025)
- ✅ Fixed production database connection issues
- ✅ Migrated to Supabase Session Pooler for IPv4 compatibility
- ✅ Resolved "Tenant or user not found" errors
- ✅ Cleaned up broken environment variables
- ✅ Verified database connectivity with `/api/test-db` endpoint
- ✅ Production deployment now fully operational

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
# Critical - no fallback (only one required)
GOOGLE_GENERATIVE_AI_API_KEY=  # Google Gemini API (preferred)
GEMINI_API_KEY=                 # Alternative env var name (Vercel convention)

# Database - MUST use Session Pooler for Vercel (IPv4)
POSTGRES_URL="postgresql://postgres.ebgsbtqtkdgaafqejjye:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres.ebgsbtqtkdgaafqejjye:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"

# Authentication
AUTH_SECRET=               # NextAuth JWT signing key

# Integrations
TELEGRAM_BOT_TOKEN=        # Telegram bot token
ZYPRUS_CLIENT_ID=          # Zyprus OAuth client ID
ZYPRUS_CLIENT_SECRET=      # Zyprus OAuth secret
ZYPRUS_API_URL=            # Zyprus API endpoint
ZYPRUS_SITE_URL=           # Zyprus site URL
```

**Getting Supabase Connection String:**
1. Go to: https://supabase.com/dashboard/project/ebgsbtqtkdgaafqejjye/settings/database
2. Select **"Session pooler"** (NOT Direct Connection)
3. Copy the URI with your password
4. Update both POSTGRES_URL and POSTGRES_URL_NON_POOLING in Vercel

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
- Monitor Google AI API quota at https://aistudio.google.com
- Monitor Redis memory usage in Vercel KV dashboard
- Check error rates in production logs

## Common Issues & Solutions

### Production Issues

| Issue | Solution |
|-------|----------|
| 503 Errors | Verify GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is set in Vercel |
| 500 Error: "Tenant or user not found" | Database password incorrect - update POSTGRES_URL in Vercel with correct password |
| "getaddrinfo ENOTFOUND db.ebgsbtqtkdgaafqejjye.supabase.co" | Using wrong connection format - switch to Session Pooler (aws-1-eu-west-3.pooler.supabase.com) |
| Database connection fails on Vercel | Vercel is IPv4-only - use Session Pooler, NOT direct connection |
| Guest auth endpoint failing | Check POSTGRES_URL and AUTH_SECRET are set correctly in Vercel |
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
| AI models not responding | Verify GOOGLE_GENERATIVE_AI_API_KEY is set and check Google AI Studio for quota limits |

## Important Notes

1. **Gemini API Only**: Uses Google Gemini API directly (not Vercel AI Gateway)
2. **Soft deletes**: Always check `deletedAt IS NULL` in queries
3. **Streaming format**: Use `JsonToSseTransformStream` for SSE responses
4. **Tool execution**: Tools must be registered in both `tools` object and passed to `streamText()`
5. **Prompt caching**: Base system prompt cached via Next.js `unstable_cache` (24h TTL)
6. **Git status**: Check `git status` before making changes - there are uncommitted admin components
7. **Database schema changes**: Always run `pnpm db:generate` → `pnpm db:migrate` → `pnpm build` in sequence
8. **Testing after migrations**: Run full test suite after schema changes to verify integrity
9. **Vercel IPv4 Requirement**: ALWAYS use Session Pooler connection format for production - direct connection will fail with DNS errors
10. **Supabase MCP Integration**: Can use `mcp__supabase__*` tools to manage database, projects, and deployments programmatically

## Git Workflow

**ALWAYS** run `git status` before making changes to avoid conflicts.

Current uncommitted files:
- `lib/telegram/message-handler.ts` - Modified (typing indicator optimization)
- `"GENERAL KNOWLEDGE.html"` - Untracked file
- `scripts/check-telegram-webhook.ts` - Untracked script
- `scripts/check-webhook.mjs` - Untracked script

Use `git diff <file>` to review changes before committing.