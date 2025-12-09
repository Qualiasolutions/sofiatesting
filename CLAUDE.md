# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Key documents:** `IMPLEMENTATION_PLAN.md` (task tracking), `docs/PRD.md` (requirements), `docs/ARCHITECTURE.md` (system design)

**Slash commands** (`.claude/commands/`): `/deploy-checklist`, `/test-all`, `/tool-audit`, `/new-tool <name> <desc>`, `/telegram-debug`, `/db-check`

**Skills** (global `~/.claude/skills/`): `sofia-debugger` (debug SOFIA issues), `cyprus-calculator` (property tax calculations)

## Project Overview

**SOFIA v3.1.0** - Next.js 15 AI assistant for Zyprus Property Group (Cyprus real estate). Core features:
- AI chat with Cyprus real estate tools (VAT, transfer fees, capital gains calculators)
- Property listing management with Zyprus API integration (Drupal JSON:API)
- Telegram and WhatsApp bot integrations
- Document generation (38 DOCX templates via `docx` package)

## AI Configuration

**Google Gemini API is mandatory** - set `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`. Using **Tier 1** (paid) for higher rate limits.

| Model ID | Actual Model | Use Case |
|----------|-------------|----------|
| `chat-model` | `gemini-3-pro-preview` | **Default** - Best reasoning, 1M context, multimodal |
| `chat-model-gemini3` | `gemini-3-pro-preview` | Explicit alias for default |
| `chat-model-pro` | `gemini-2.5-pro` | Previous gen reasoning fallback |
| `chat-model-flash` | `gemini-2.5-flash` | Fast with good quality |
| `chat-model-flash-lite` | `gemini-2.5-flash-lite` | Ultra-fast, cost-efficient |
| `title-model` | `gemini-2.5-flash` | Chat title generation |
| `artifact-model` | `gemini-3-pro-preview` | Uses default model |

See `lib/ai/providers.ts` for implementation details.

## Database

**Supabase PostgreSQL** - Project ID: `ebgsbtqtkdgaafqejjye`, Region: eu-west-3 (Paris)

**CRITICAL**: Vercel requires **Session Pooler** format (IPv4):
```bash
POSTGRES_URL="postgresql://postgres.ebgsbtqtkdgaafqejjye:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
# NOT: postgresql://postgres:[PASSWORD]@db.ebgsbtqtkdgaafqejjye.supabase.co:5432/postgres (will fail)
```

**Schema**: `User`, `Chat`, `Message_v2`, `PropertyListing`, `Vote_v2` (Drizzle ORM with CASCADE deletes)

## Authentication

1. Guest vs Regular users with different rate limits (`lib/ai/entitlements.ts`)
2. Redis (Upstash) for rate limiting

## Commands

```bash
pnpm dev              # Dev server (Turbo)
pnpm build            # Production build
pnpm lint             # Ultracite check
pnpm format           # Ultracite auto-fix

pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Drizzle Studio GUI
pnpm db:push          # Push schema directly (skip migrations)
pnpm db:pull          # Pull schema from database
pnpm db:check         # Check schema consistency

pnpm test:unit        # All unit tests
pnpm test:ai-models   # Test AI model connectivity
PLAYWRIGHT=True pnpm test  # E2E tests (requires dev server)

# Single test file (node:test runner via tsx)
pnpm exec tsx --test tests/unit/your-file.test.ts

# Run specific Playwright test
PLAYWRIGHT=True pnpm exec playwright test tests/e2e/your-file.spec.ts

# Test parallel image uploads
pnpm test:unit:parallel-uploads
```

**Test file locations:**
- `tests/unit/` - Unit tests (Node.js test runner via tsx)
- `tests/e2e/` - Playwright E2E tests
- `tests/manual/` - Manual test scripts (e.g., `test-ai-models.ts`, `test-zyprus-api.ts`)

## Adding AI Tools

**CRITICAL**: Tools require DUAL registration in `app/(chat)/api/chat/route.ts`:

```typescript
// 1. Import
import { calculateVATTool } from "@/lib/ai/tools/calculate-vat";

// 2. Add to BOTH arrays (keys must match exactly, case-sensitive)
experimental_activeTools: ["calculateVAT", "createListing", "createLandListing", ...],
tools: { calculateVAT: calculateVATTool, createListing: createListingTool, ... }
```

Tool file structure (`lib/ai/tools/`): export `description`, `parameters` (Zod), and `execute` function.

**Property vs Land tools**: Properties have `createListing`/`uploadListing`, land has `createLandListing`/`uploadLandListing` with different field schemas.

## Streaming Chat Architecture

**Main endpoint**: `app/(chat)/api/chat/route.ts` → SSE via `JsonToSseTransformStream`
**Resume endpoint**: `app/(chat)/api/chat/[id]/stream/route.ts` → AI SDK `resumeStream` for reconnection

Key patterns:
- `pruneConversationHistory()` prevents unbounded token growth
- `stopWhen: stepCountIs(5)` limits tool call chains
- `smoothStream({ chunking: "word" })` for smooth streaming
- System prompt cached 24h via `unstable_cache`
- Token tracking with `tokenlens` library

**SSE Event Types**: `0:` text, `2:` tool call, `3:` tool result, `d:` done

## Integrations

**Telegram** (`lib/telegram/`): Webhook at `/api/telegram/webhook`, typing indicators, message splitting, group lead management

**WhatsApp** (`lib/whatsapp/`): Document detection + DOCX generation via `wasenderapi` npm package (~$6/month). Supports base64 file attachments for document sending.

**Zyprus API** (`lib/zyprus/`): Drupal JSON:API backend for property/land listings. OAuth 2.0 auth, auto-upload as unpublished drafts. See Zyprus API Quick Reference section below.

## Active Tools

**Property**: `createListing`, `listListings`, `uploadListing`
**Land**: `createLandListing`, `uploadLandListing`
**Calculators**: `calculateTransferFees`, `calculateCapitalGains`, `calculateVAT`
**Taxonomy**: `getZyprusData`
**Documents**: `sendDocument` (email DOCX templates to users)
**UX**: `requestSuggestions`

Tool files: `lib/ai/tools/` - each exports `description`, `parameters` (Zod), `execute`.

Disabled: `createDocument`, `updateDocument`, `getGeneralKnowledge` (knowledge embedded in `docs/knowledge/`, cached 24h in system prompt)

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
├── (chat)/           # Chat UI + /api/chat streaming endpoint
├── (admin)/          # Admin dashboard (listings review, user management)
├── api/              # REST endpoints (listings, templates, telegram, whatsapp)
└── properties/       # Property management UI

lib/
├── ai/               # providers.ts, prompts.ts, tools/, conversation-pruning.ts
├── db/               # schema.ts, queries.ts, migrations/
├── telegram/         # Telegram bot
├── whatsapp/         # WhatsApp bot + DOCX
└── zyprus/           # Zyprus API client

docs/
├── knowledge/        # Cyprus real estate knowledge (embedded in system prompt)
├── templates/        # 38 document templates
└── guides/           # Setup guides
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
| Zyprus API 404 errors | Run `pnpm exec tsx tests/manual/test-zyprus-api.ts` to discover correct endpoint names |
| "Unable to create listing" | Check Vercel logs for taxonomy errors; vocabulary names may have changed |
| Sentry "Project not found" | Verify `SENTRY_PROJECT` env var matches Sentry project slug (not display name) |

## Key Patterns

- **Soft deletes**: Check `deletedAt IS NULL` in queries
- **Error responses**: Use `ChatSDKError` from `lib/errors.ts`
- **DB schema changes**: `pnpm db:generate` → `pnpm db:migrate` → `pnpm build`
- **Circuit breaker**: `opossum` package for API resilience
- **Document generation**: DOCX files via `docx` package
- **Lead routing**: SOPHIA spec rules in `lib/telegram/lead-router.ts` for agent assignment

---

## Zyprus API Quick Reference

**Architecture**: `lib/zyprus/client.ts` (API client with OAuth 2.0), `lib/zyprus/taxonomy-cache.ts` (Redis-backed cache with 1h TTL and in-memory fallback)

### Critical Configuration

```typescript
// MANDATORY headers for ALL requests
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/vnd.api+json",
  "Accept": "application/vnd.api+json",
  "User-Agent": "SophiaAI"  // REQUIRED - Cloudflare whitelist
}
```

### Key Gotchas

1. **Indoor features vocabulary**: Use `indoor_property_views` (NOT `indoor_property_features`). The Drupal field is `field_indoor_property_features` but references `taxonomy_term--indoor_property_views`.

2. **Coordinates**: POINT format uses LON first: `"POINT (33.0413 34.6841)"` = LON LAT

3. **AI-generated listings**: Always set `status: false` (unpublished draft), `field_ai_state: "draft"`, `field_ai_generated: true`

4. **Land vs Property**: Different field prefixes - `field_land_price` vs `field_price`, `field_land_map` vs `field_map`

### Debugging

```bash
# Test all Zyprus API endpoints and discover vocabularies
pnpm exec tsx tests/manual/test-zyprus-api.ts
```

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Missing User-Agent | Add `User-Agent: SophiaAI` header |
| 404 on taxonomy | Wrong vocabulary name | Run test script above |
| 422 Unprocessable | Invalid UUID | Verify taxonomy IDs from cache |