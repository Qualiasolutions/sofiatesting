# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Check `IMPLEMENTATION_PLAN.md` before starting work** - tracks optimization tasks and deployment status.

**Slash commands** (`.claude/commands/`): `/deploy-checklist`, `/test-all`, `/tool-audit`, `/new-tool <name> <desc>`, `/telegram-debug`, `/db-check`

## Project Overview

SOFIA is a Next.js 15 AI assistant for Zyprus Property Group (Cyprus real estate). Core features:
- AI chat with Cyprus real estate tools (VAT, transfer fees, capital gains calculators)
- Property listing management with Zyprus API integration
- Telegram and WhatsApp bot integrations
- Document generation (38 templates)

## AI Configuration

**Google Gemini API is mandatory** - set `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`.

| Model ID | Actual Model | Use Case |
|----------|-------------|----------|
| `chat-model` | Gemini 2.5 Flash | Default (best price-performance) |
| `chat-model-pro` | Gemini 2.5 Pro | Complex reasoning |
| `chat-model-flash-lite` | Gemini 2.5 Flash-Lite | Ultra-fast, cheapest |

## Database

**Supabase PostgreSQL** - Project ID: `ebgsbtqtkdgaafqejjye`, Region: eu-west-3 (Paris)

**CRITICAL**: Vercel requires **Session Pooler** format (IPv4):
```bash
POSTGRES_URL="postgresql://postgres.ebgsbtqtkdgaafqejjye:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
# NOT: postgresql://postgres:[PASSWORD]@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres (will fail)
```

**Schema**: `User`, `Chat`, `Message_v2`, `PropertyListing`, `Vote_v2` (Drizzle ORM with CASCADE deletes)

## Authentication

1. Access gate: `qualia-access=granted` cookie required
2. Guest vs Regular users with different rate limits (`lib/ai/entitlements.ts`)
3. Redis (Upstash) for rate limiting

## Commands

```bash
pnpm dev              # Dev server (Turbo)
pnpm build            # Production build
pnpm lint / format    # Ultracite check / fix

pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Drizzle Studio GUI

pnpm test:unit                    # All unit tests
pnpm exec tsx --test tests/unit/FILE.test.ts  # Single test file
pnpm test:ai-models               # Test AI model connectivity
PLAYWRIGHT=True pnpm test         # E2E tests (requires dev server)
```

## Adding AI Tools

**CRITICAL**: Tools require DUAL registration in `app/(chat)/api/chat/route.ts`:

```typescript
// 1. Import
import { calculateVATTool } from "@/lib/ai/tools/calculate-vat";

// 2. Add to BOTH arrays (keys must match exactly, case-sensitive)
experimental_activeTools: ["calculateVAT", ...],
tools: { calculateVAT: calculateVATTool, ... }
```

Tool file structure (`lib/ai/tools/`): export `description`, `parameters` (Zod), and `execute` function.

## Streaming Chat Architecture

**Endpoint**: `app/(chat)/api/chat/route.ts` → SSE via `JsonToSseTransformStream`

Key patterns:
- `pruneConversationHistory()` prevents unbounded token growth
- `stopWhen: stepCountIs(5)` limits tool call chains
- `smoothStream({ chunking: "word" })` for smooth streaming
- System prompt cached 24h via `unstable_cache`
- Token tracking with tokenlens library

**SSE Event Types**: `0:` text, `2:` tool call, `3:` tool result, `d:` done

## Integrations

**Telegram** (`lib/telegram/`): Webhook at `/api/telegram/webhook`, typing indicators, message splitting

**WhatsApp** (`lib/whatsapp/`): Document detection + DOCX generation

**Zyprus API** (`lib/zyprus/`): Property listings with Redis-cached taxonomy (1h TTL), retry with exponential backoff

## Active Tools

| Tool | Description |
|------|-------------|
| `calculateTransferFees` | Property transfer fees |
| `calculateCapitalGains` | Capital gains tax |
| `calculateVAT` | VAT calculations |
| `createListing` | Create property listing |
| `listListings` | Query listings |
| `uploadListing` | Upload to Zyprus |
| `getZyprusData` | Fetch taxonomy |
| `requestSuggestions` | Follow-up suggestions |

Disabled: `createDocument`, `updateDocument`, `getGeneralKnowledge` (knowledge now embedded in system prompt)

## Code Style (Ultracite/Biome)

Key rules to follow:
- `enum` → use `as const` objects
- `any` → use proper types
- `.forEach()` → use `for...of`
- `function(){}` → use arrow functions
- `<button>` → always add `type` attribute
- Array index keys → use stable IDs

See `.cursor/rules/ultracite.mdc` for full ruleset.

## Project Structure

```
app/
├── (auth)/           # Auth pages
├── (chat)/           # Chat interface + /api/chat streaming endpoint
├── (admin)/          # Admin dashboard (agents, logs, status)
├── api/              # REST endpoints (listings, templates, telegram, whatsapp)
└── properties/       # Property management UI

lib/
├── ai/               # providers.ts, prompts.ts, tools/, conversation-pruning.ts
├── db/               # schema.ts, queries.ts, migrations/
├── telegram/         # Bot integration
├── whatsapp/         # Bot + DOCX generation
└── zyprus/           # API client with Redis cache
```

## Environment Variables

Required:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=  # or GEMINI_API_KEY
POSTGRES_URL=                   # Session Pooler format (see Database section)
AUTH_SECRET=                    # NextAuth JWT key
```

Optional integrations: `TELEGRAM_BOT_TOKEN`, `ZYPRUS_CLIENT_ID`, `ZYPRUS_CLIENT_SECRET`, `ZYPRUS_API_URL`

See `.env.example` for complete list.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 503 Errors | Check GEMINI_API_KEY in Vercel |
| DNS errors on Vercel | Use Session Pooler, not direct connection |
| Tool not working | Verify dual registration (both arrays) |
| Drizzle type errors | Run `pnpm db:generate` |
| "Cannot find module" | Check path aliases (@/lib, @/app) |

## Key Patterns

- **Soft deletes**: Check `deletedAt IS NULL` in queries
- **Error responses**: Use `ChatSDKError` from `lib/errors.ts`
- **DB schema changes**: `pnpm db:generate` → `pnpm db:migrate` → `pnpm build`
- **Streaming**: Use `JsonToSseTransformStream` for SSE
- **Conversation pruning**: `pruneConversationHistory()` prevents unbounded token growth
- **Tool call limits**: `stopWhen: stepCountIs(5)` limits chained tool calls