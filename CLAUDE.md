# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Starting Any Work

**ALL AGENTS MUST:**
1. **READ** `IMPLEMENTATION_PLAN.md` in the root directory
2. **CHECK** current task status and priority
3. **UPDATE** checkboxes as you work
4. **TEST** after completing each item
5. **DEPLOY** and verify in production

The `IMPLEMENTATION_PLAN.md` is the single source of truth for all optimization work. It tracks:
- 10 prioritized optimization tasks
- Testing protocols for each task
- Deployment checklists
- Performance metrics before/after
- Completion status and notes

**Never start optimization work without consulting IMPLEMENTATION_PLAN.md first.**

---

## Project Overview

SOFIA is a production-grade Next.js 15 application serving as the Zyprus Property Group AI Assistant. It handles real estate document drafting, property listing management, and operates an AI-assisted support desk with Telegram bot integration. Built on Vercel's AI SDK with PostgreSQL persistence and custom real estate tooling.

## Development Commands

### Core Development
```bash
pnpm install              # Install dependencies
pnpm dev                  # Start Next.js dev server with Turbo
pnpm build                # Production build
pnpm start                # Start production server
```

### Code Quality
```bash
pnpm lint                 # Run Ultracite linting (checks only)
pnpm format               # Run Ultracite formatting (auto-fix)
```

### Database Operations
```bash
pnpm db:generate          # Generate Drizzle migrations from schema changes
pnpm db:migrate           # Apply pending migrations to database
pnpm db:studio            # Launch Drizzle Studio GUI
pnpm db:push              # Push schema directly to database (no migrations)
pnpm db:pull              # Pull schema from database
pnpm db:check             # Check migration consistency
pnpm db:up                # Upgrade Drizzle Kit
```

### Testing
```bash
pnpm test                 # Run Playwright E2E tests (requires PLAYWRIGHT=True env var)
```

**Important**: Before running tests, ensure:
1. Development server is running (`pnpm dev`)
2. Environment variable `PLAYWRIGHT=True` is set
3. Database is migrated and accessible
4. Access code cookie (`qualia-access`) is properly handled in test setup

## Architecture

### AI System Architecture

The AI system uses a multi-model approach with Vercel AI SDK:

**Model Configuration** (`lib/ai/providers.ts`):
- Primary model: Gemini 1.5 Flash (default chat, title generation, artifacts)
- Premium models via AI Gateway: Claude Sonnet 4.5, Claude Haiku, GPT-4o
- Test environment uses mock models from `lib/ai/models.mock.ts`

**System Prompt Loading** (`lib/ai/prompts.ts`):
- Core instructions loaded from `docs/knowledge/sophia-ai-assistant-instructions.md`
- Dynamic date replacement for template placeholders
- Critical field extraction logic for real estate forms embedded in system prompt
- Geo-location hints (city, country, lat/lon) passed from request headers

**Tool Registration** (`app/(chat)/api/chat/route.ts:164-180`):
```typescript
experimental_activeTools: [
  "calculateTransferFees",
  "calculateCapitalGains",
  "calculateVAT",
  "createListing",
  "listListings",
  "uploadListing"
]
```
All tools are Cyprus real estate domain-specific. When adding new tools:
1. Create tool definition in `lib/ai/tools/`
2. Export from tool file
3. Register in chat route's `tools` object and `experimental_activeTools` array

**Tool Structure**:
- `calculate-capital-gains.ts` - CGT calculations for property sales
- `calculate-transfer-fees.ts` - Cyprus transfer fee calculator
- `calculate-vat.ts` - VAT calculation for real estate
- `create-listing.ts` - Creates property listing draft in database
- `list-listings.ts` - Retrieves user's property listings
- `upload-listing.ts` - Submits listing to Zyprus API via OAuth

### Authentication Flow

SOFIA uses a two-tier access system (`middleware.ts`, `app/(auth)/auth.ts`):

**Tier 1 - Access Code Gate**:
- All page routes require `qualia-access=granted` cookie
- Cookie set via `/access` page (hardcoded access code check)
- API routes bypass this check

**Tier 2 - NextAuth Session**:
- Guest users: Auto-provisioned via `/api/auth/guest`
- Regular users: Email/password authentication with bcrypt
- Rate limiting:
  - Guests: Limited messages per day (see `lib/ai/entitlements.ts`)
  - Regular: Higher quota
- Session managed via JWT with custom `type` field (`guest` | `regular`)

**User Type Detection**: `guestRegex` pattern in `lib/constants.ts` identifies guest sessions.

### Database Schema

**Core Tables** (`lib/db/schema.ts`):
- `User` - Authentication and user profiles
- `Chat` - Conversation sessions with visibility control
- `Message_v2` - Chat messages with parts/attachments (v2 schema)
- `Vote_v2` - Message feedback system
- `Stream` - Resumable stream tracking

**Property Listing Tables** (Schema.org RealEstateListing compliant):
- `PropertyListing` - Core listing data with JSON fields for address, features, images
- `ListingUploadAttempt` - Audit log for Zyprus API uploads with retry tracking

**Key Fields**:
- `PropertyListing.status`: `draft` → `queued` → `uploading` → `uploaded` | `failed`
- `PropertyListing.lastContext`: Stores AI usage metrics (tokenlens)
- Soft delete: `deletedAt` timestamp field
- Draft expiration: `draftExpiresAt` for auto-cleanup

**Migration Workflow**:
1. Modify `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration file
3. Review migration in `lib/db/migrations/`
4. Run `pnpm db:migrate` to apply (via `lib/db/migrate.ts`)

### External API Integration

**Zyprus Property API** (`lib/zyprus/client.ts`):
- OAuth2 client credentials flow with token caching (5-minute buffer)
- JSON:API format for all requests
- Image upload: Fetches from URL → uploads to `/jsonapi/node/property/field_gallery_`
- Property creation: POST to `/jsonapi/node/property` with relationships
- Default fallbacks: Location ID and Property Type ID configured for missing data
- Retry logic: `isPermanentError()` distinguishes retryable vs permanent failures

**Critical Zyprus Fields**:
- `field_ai_state`: Always set to `"draft"` to track AI-generated properties
- `status`: Always `false` to prevent unexpected public display
- Numeric fields: Parse with `parseInt`/`parseFloat` (no strings)
- Relationships: Must reference existing taxonomy terms and nodes by UUID

**Telegram Bot** (`lib/telegram/client.ts`):
- Webhook-based message handling at `/api/telegram/webhook`
- Long message splitting (4096 char limit) with paragraph-aware chunking
- Typing indicators via `sendChatAction`
- HTML parse mode for formatted messages

### Route Organization

**App Router Structure**:
```
app/
├── (auth)/           # Login, register, auth configuration
├── (chat)/           # Main chat UI and streaming API
│   ├── page.tsx      # Chat home page
│   ├── chat/[id]/    # Individual chat sessions
│   └── api/chat/     # Main AI streaming endpoint (route.ts)
├── access/           # Access code gate page
├── properties/       # Property listing UI
└── api/              # REST endpoints
    ├── listings/     # CRUD for property listings
    ├── templates/    # Template metadata endpoints
    └── telegram/     # Telegram webhook handler
```

**API Route Conventions**:
- All routes validate session (except webhook with secret token)
- Use `ChatSDKError` for consistent error responses
- Streaming endpoints use `JsonToSseTransformStream` for SSE
- Rate limiting checked per user type in chat routes

### Middleware Behavior

The middleware (`middleware.ts`) runs on all routes except static assets:

1. **Health Check**: `/ping` → returns 200 for Playwright
2. **Access Code Check**: Validates `qualia-access` cookie (redirects to `/access` if missing)
3. **Auth Bypass**: Allows `/api/auth/*` routes through
4. **Guest Auto-Login**: Redirects unauthenticated users to `/api/auth/guest`
5. **Registered User Redirect**: Prevents authenticated users from accessing `/login` or `/register`

### Testing Architecture

**Playwright Configuration** (`playwright.config.ts`):
- Base URL: `http://localhost:3000`
- Parallel execution: 8 workers locally, 2 on CI
- Test timeout: 240 seconds (generous for AI response times)
- All tests require access cookie setup

**Test Structure** (`tests/e2e/`):
```
developer-registration.test.ts    # Template 07 end-to-end flow
margarita-extraction.test.ts      # Field extraction from user input
margarita-simple.test.ts          # Simplified extraction test
sophia-formatting.test.ts         # Output format validation
artifacts.test.ts                 # Document creation tests
chat.test.ts                      # Basic chat functionality
session.test.ts                   # Auth and session tests
```

**Common Test Patterns**:
- Set `qualia-access=granted` cookie before navigation
- Use `page.waitForSelector()` with generous timeouts for AI responses
- Validate streaming responses incrementally
- Check database state after tool executions

## Environment Configuration

**Required Variables** (see `.env.example`):
```bash
AUTH_SECRET                     # NextAuth JWT signing key
GEMINI_API_KEY                  # Primary model API key
POSTGRES_URL                    # Database connection string
REDIS_URL                       # Rate limiting and caching
BLOB_READ_WRITE_TOKEN          # Vercel Blob for image storage
TELEGRAM_BOT_TOKEN             # @BotFather token
ZYPRUS_CLIENT_ID               # OAuth client ID
ZYPRUS_CLIENT_SECRET           # OAuth client secret
ZYPRUS_API_URL                 # Default: https://dev9.zyprus.com
ZYPRUS_SITE_URL                # Default: https://dev9.zyprus.com
```

**Optional Variables**:
```bash
AI_GATEWAY_API_KEY             # For Claude/GPT-4 via Vercel AI Gateway
GOOGLE_GENERATIVE_AI_API_KEY   # Alternative to GEMINI_API_KEY
```

## Code Patterns and Conventions

### Adding New AI Tools

1. Create tool definition file in `lib/ai/tools/`:
```typescript
import { z } from 'zod';
import { tool } from 'ai';

export const myNewTool = tool({
  description: 'Clear description for AI model',
  parameters: z.object({
    param: z.string().describe('Parameter description')
  }),
  execute: async ({ param }) => {
    // Implementation
    return { result: 'value' };
  }
});
```

2. Register in chat route (`app/(chat)/api/chat/route.ts`):
```typescript
experimental_activeTools: [...existing, "myNewTool"],
tools: { ...existing, myNewTool: myNewTool }
```

3. Update system prompt if tool requires special instructions

### Working with Property Listings

**Creating Listings**:
- Always set `status: "draft"` initially
- Use `createListing` tool from chat or direct API call to `/api/listings/create`
- Validate required fields: name, description, price, rooms, bathrooms, floorSize

**Uploading to Zyprus**:
- Call `uploadListing` tool with listing ID
- Tool handles retry logic (3 attempts with exponential backoff)
- Check `ListingUploadAttempt` table for detailed error logs
- Permanent errors (auth, validation) won't retry automatically

**Image Handling**:
- Upload to Vercel Blob first via `/api/listings/upload`
- Store URLs in `PropertyListing.image` JSON array
- Zyprus client fetches and re-uploads to Drupal during submission

### Error Handling

**Structured Error System** (`lib/errors.ts`):
- `ChatSDKError` class with predefined error codes
- Consistent JSON response format
- AI Gateway errors mapped to user-friendly messages

**Common Error Codes**:
- `unauthorized:chat` - No valid session
- `forbidden:chat` - User doesn't own resource
- `rate_limit:chat` - Message quota exceeded
- `bad_request:api` - Invalid request body
- `bad_request:activate_gateway` - AI Gateway billing issue

## Documentation Structure

All documentation lives under `docs/`:
```
docs/
├── README.md                    # Documentation index
├── guides/                      # Setup and deployment guides
│   ├── ai-gateway-setup.md
│   ├── telegram-bot-setup.md
│   ├── zyprus-api-setup.md
│   └── deployment-ready.md
├── knowledge/                   # Domain knowledge and implementation
│   ├── sophia-ai-assistant-instructions.md
│   ├── cyprus-real-estate-knowledge-base.md
│   └── property-listing-implementation.md
├── templates/                   # Template system documentation
│   └── overview.md
└── updates/                     # Change logs
    ├── claude-model-config.md
    └── chat-api-fix.md
```

Start with `docs/README.md` to locate specific documentation.

## Common Pitfalls

1. **System Prompt Changes**: Main instructions file is at `docs/knowledge/sophia-ai-assistant-instructions.md`
2. **Migration Apply**: Always run `pnpm db:migrate` after generating migrations, not `pnpm db:push` (push skips migration history)
3. **Tool Registration**: Tools must be added to BOTH `tools` object AND `experimental_activeTools` array in chat route
4. **Access Cookie**: Playwright tests fail without proper access cookie setup in beforeEach hook
5. **Zyprus UUID Fields**: All relationships (location, property type, features) require exact UUIDs from Zyprus taxonomy
6. **Guest vs Regular Users**: Check user type when implementing features - guests have stricter rate limits
7. **Streaming Response Format**: Use `JsonToSseTransformStream` for SSE, not raw JSON responses
8. **Image Upload Order**: Upload images to Blob BEFORE creating property listing to store URLs
9. **Database Soft Deletes**: Check `deletedAt IS NULL` in queries to exclude soft-deleted records
10. **Model Selection**: Default model is Gemini Flash; premium models require AI Gateway setup
