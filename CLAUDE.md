# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Key documents:**
- `IMPLEMENTATION_PLAN.md` - Task tracking and deployment status
- `docs/PRD.md` - Product requirements (WHAT we build)
- `docs/ARCHITECTURE.md` - System design (HOW it's built)

**Slash commands** (`.claude/commands/`): `/deploy-checklist`, `/test-all`, `/tool-audit`, `/new-tool <name> <desc>`, `/telegram-debug`, `/db-check`

**Skills**: `sofia-debugger` (debug SOFIA issues), `cyprus-calculator` (property tax calculations)

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
| `chat-model-flash` | Gemini 2.5 Flash | Alias for chat-model |
| `chat-model-pro` | Gemini 2.5 Pro | Complex reasoning, extended context |
| `chat-model-gemini3` | Gemini 3n Pro Preview | Latest model, 1M context, multi-modal, audio input |
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
pnpm lint             # Ultracite check
pnpm format           # Ultracite auto-fix

pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Drizzle Studio GUI

pnpm test:unit        # All unit tests
pnpm test:ai-models   # Test AI model connectivity
PLAYWRIGHT=True pnpm test  # E2E tests (requires dev server)

# Single test file (node:test runner via tsx)
pnpm exec tsx --test tests/unit/your-file.test.ts

# Run specific Playwright test
PLAYWRIGHT=True pnpm exec playwright test tests/e2e/your-file.spec.ts
```

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

**Endpoint**: `app/(chat)/api/chat/route.ts` → SSE via `JsonToSseTransformStream`

Key patterns:
- `pruneConversationHistory()` prevents unbounded token growth
- `stopWhen: stepCountIs(5)` limits tool call chains
- `smoothStream({ chunking: "word" })` for smooth streaming
- System prompt cached 24h via `unstable_cache`
- Token tracking with tokenlens library

**SSE Event Types**: `0:` text, `2:` tool call, `3:` tool result, `d:` done

## Integrations

**Telegram** (`lib/telegram/`): Webhook at `/api/telegram/webhook`, typing indicators, message splitting, group lead management

**WhatsApp** (`lib/whatsapp/`): Document detection + DOCX generation, uses WaSender API with base64 file support

**Zyprus API** (`lib/zyprus/`): Full property and land listing management with auto-upload as unpublished drafts - see detailed section below

## Active Tools

**Property**: `createListing`, `listListings`, `uploadListing`
**Land**: `createLandListing`, `uploadLandListing`
**Calculators**: `calculateTransferFees`, `calculateCapitalGains`, `calculateVAT`
**Taxonomy**: `getZyprusData`
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

## Key Patterns

- **Soft deletes**: Check `deletedAt IS NULL` in queries
- **Error responses**: Use `ChatSDKError` from `lib/errors.ts`
- **DB schema changes**: `pnpm db:generate` → `pnpm db:migrate` → `pnpm build`
- **Streaming**: Use `JsonToSseTransformStream` for SSE
- **Conversation pruning**: `pruneConversationHistory()` prevents unbounded token growth
- **Tool call limits**: `stopWhen: stepCountIs(5)` limits chained tool calls

---

## Zyprus API Integration (Detailed)

The Zyprus API is a **Drupal JSON:API** backend for property/land listings at `https://zyprus.com`. This section documents the complete implementation for future agents.

### Architecture Overview

```
lib/zyprus/
├── client.ts           # Core API client with all upload/fetch functions
├── taxonomy-cache.ts   # In-memory taxonomy caching (1h TTL)
├── types.ts            # TypeScript interfaces
└── README.md           # Quick reference

lib/ai/tools/
├── create-listing.ts   # AI tool: create local listing draft
├── upload-listing.ts   # AI tool: upload to Zyprus API
└── get-zyprus-data.ts  # AI tool: fetch taxonomy options
```

### Authentication

**OAuth 2.0 Client Credentials Flow**:
```typescript
// Environment variables
ZYPRUS_CLIENT_ID=xxx
ZYPRUS_CLIENT_SECRET=xxx
ZYPRUS_API_URL=https://zyprus.com  // optional, defaults to https://zyprus.com

// Token endpoint
POST https://zyprus.com/oauth/token
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&client_id=xxx&client_secret=xxx
```

**MANDATORY Headers for ALL requests**:
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/vnd.api+json",
  "Accept": "application/vnd.api+json",
  "User-Agent": "SophiaAI"  // REQUIRED - Cloudflare whitelist (exact value)
}
```

### Content Types

| Type | JSON:API Type | Endpoint | Description |
|------|---------------|----------|-------------|
| Property | `node--property` | `/jsonapi/node/property` | Apartments, villas, houses |
| Land | `node--land` | `/jsonapi/node/land` | Plots, agricultural land |
| Location | `node--location` | `/jsonapi/node/location` | Cyprus locations |
| Taxonomy | `taxonomy_term--{vocab}` | `/jsonapi/taxonomy_term/{vocab}` | All dropdown values |

### Taxonomy Vocabularies

Fetched via `getZyprusTaxonomyTerms(vocabulary)` and cached in memory:

| Vocabulary ID | Field | Used By | Items |
|---------------|-------|---------|-------|
| `property_type` | Villa, Apartment, House, etc. | Property | 18 |
| `land_type` | Plot, Agricultural, Residential, etc. | Land | 4 |
| `indoor_property_views` | Air conditioning, Fireplace, etc. | Property | 34 |
| `outdoor_property_features` | Pool, Garden, Parking, etc. | Property | 18 |
| `infrastructure_` | Electricity, Water, Road Access | Land | 4 |
| `property_views` | Sea View, Mountain View, City View | Both | 8 |
| `property_status` | Off-plan, Resale | Both | 2 |
| `listing_type` | Sale, Rent | Both | 2 |
| `price_modifier` | Price, Per sqm, Negotiable, etc. | Both | 5 |
| `title_deed` | Available, Pending, etc. | Both | 4 |

**IMPORTANT**: The indoor features vocabulary is `indoor_property_views` (NOT `indoor_property_features`).
The Drupal relationship field is `field_indoor_property_features` but uses `taxonomy_term--indoor_property_views`.

### Property Upload Payload

**CRITICAL Fields** - Must be set exactly as shown:
```typescript
{
  data: {
    type: "node--property",
    attributes: {
      title: "Property Title",
      status: false,  // MANDATORY: Always false (unpublished draft)
      field_ai_state: "draft",  // MANDATORY: AI-generated draft state
      field_ai_generated: true,  // Track AI-generated content
      field_ai_message: { value: "Generated by SOFIA AI from chat xxx" },
      field_ai_probably_exists: false,  // Duplicate detection flag

      // Pricing
      field_price: 450000,
      field_price_label: "€450,000",

      // Property details
      field_bedrooms: 3,
      field_bathrooms: 2,
      field_covered_area: 150,  // sqm
      field_plot_area: 500,     // sqm
      field_year_built: 2020,
      field_reference_id: "ZYP-12345",

      // Coordinates - POINT format with LON first
      field_map: {
        value: "POINT (33.0413 34.6841)",  // LON LAT order!
        geo_type: "Point",
        lat: 34.6841,
        lon: 33.0413,
        latlon: "34.6841,33.0413"  // LAT,LON for search
      },

      // Optional
      field_energy_class: "A",
      field_video_url: "https://youtube.com/...",
      field_description: { value: "Description HTML", format: "basic_html" }
    },
    relationships: {
      // Location (required)
      field_property_location: {
        data: { type: "node--location", id: "location-uuid" }
      },
      // Property type (required)
      field_property_type: {
        data: { type: "taxonomy_term--property_type", id: "type-uuid" }
      },
      // Listing type (For Sale, For Rent)
      field_listing_type: {
        data: { type: "taxonomy_term--listing_type", id: "listing-type-uuid" }
      },
      // Property status
      field_property_status: {
        data: { type: "taxonomy_term--property_status", id: "status-uuid" }
      },
      // Views (multi-value)
      field_property_views: {
        data: [
          { type: "taxonomy_term--property_views", id: "view1-uuid" },
          { type: "taxonomy_term--property_views", id: "view2-uuid" }
        ]
      },
      // Features (multi-value) - NOTE: indoor uses "indoor_property_views" vocabulary
      field_indoor_property_features: {
        data: [{ type: "taxonomy_term--indoor_property_views", id: "uuid" }]
      },
      field_outdoor_property_features: {
        data: [{ type: "taxonomy_term--outdoor_property_features", id: "uuid" }]
      }
    }
  }
}
```

### Land Upload Payload

Land uses **different field names** than Property:
```typescript
{
  data: {
    type: "node--land",
    attributes: {
      title: "Land Title",
      status: false,
      field_ai_state: "draft",
      field_ai_generated: true,

      field_land_price: 200000,
      field_land_size: 4000,  // sqm
      field_building_density: 0.8,
      field_site_coverage: 0.5,
      field_maximum_floors: 2,
      field_maximum_height: 8.3,
      field_land_reference_id: "LAND-123",

      field_land_map: {
        value: "POINT (33.0413 34.6841)",
        geo_type: "Point",
        lat: 34.6841,
        lon: 33.0413,
        latlon: "34.6841,33.0413"
      }
    },
    relationships: {
      field_land_location: { data: { type: "node--location", id: "uuid" } },
      field_land_type: { data: { type: "taxonomy_term--land_type", id: "uuid" } },
      field_infrastructure: {  // Multi-value
        data: [{ type: "taxonomy_term--infrastructure_", id: "uuid" }]
      },
      field_land_views: {  // Note: field_land_views not field_property_views
        data: [{ type: "taxonomy_term--property_views", id: "uuid" }]
      }
    }
  }
}
```

### File/Image Upload

**Two-step process**: 1) Upload binary file 2) Link to listing

```typescript
// Step 1: Upload file
POST /jsonapi/node/property/{nodeId}/field_property_gallery
Content-Type: application/octet-stream
Content-Disposition: file; filename="image.jpg"
Body: <binary data>

// Response includes file UUID for relationship linking
```

**Available upload functions** in `client.ts`:
- `uploadFilesToZyprus()` - Generic file upload
- `uploadFloorPlanImages()` - Floor plan images to `field_floor_plan`
- `uploadFloorPlanPdf()` - Floor plan PDF to `field_floor_plan_pdf`
- `uploadEpcPdf()` - Energy certificate to `field_epc_pdf`

### Duplicate Detection

Before uploading, check for duplicates:
```typescript
const result = await checkForDuplicates({
  referenceId: "ZYP-123",
  locationId: "location-uuid",
  price: 450000,
  title: "Sea View Villa"
});

// Returns:
{
  hasDuplicate: true,
  confidence: "high" | "medium" | "low",
  matchType: "reference_id" | "location_price" | "title_similarity",
  existingListingId: "uuid",
  existingListingTitle: "Existing Villa"
}
```

### Listing Retrieval

```typescript
// Get single listing
const listing = await getListingFromZyprus("listing-uuid");

// Search listings
const results = await searchZyprusListings({
  aiState: "draft",      // Filter by AI state
  aiGenerated: true,     // Only AI-generated
  locationId: "uuid",    // Filter by location
  minPrice: 100000,
  maxPrice: 500000
});
```

### Circuit Breaker Pattern

All API calls use Opossum circuit breaker for resilience:
```typescript
// Breakers defined in client.ts
const propertyUploadBreaker = new CircuitBreaker(uploadFn, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// Automatically opens circuit after failures, prevents cascade
```

### Taxonomy Cache

In-memory cache with 1-hour TTL (`taxonomy-cache.ts`):
```typescript
// Force refresh
await forceRefreshCache();

// Find by name (fuzzy match)
const locationId = await findLocationByName("Limassol");
const typeId = await findPropertyTypeByName("Villa");

// Get all for user selection
const locations = await getAllLocations();  // [{name, id}]
const types = await getAllPropertyTypes();
```

### AI Tools for Zyprus

| Tool | Description |
|------|-------------|
| `createListing` | Create local draft in database |
| `uploadListing` | Upload draft to Zyprus API |
| `getZyprusData` | Fetch taxonomy (locations, types, features) |

**getZyprusData resourceTypes**:
- `locations` - Cyprus locations
- `property_types` - Property types
- `land_types` - Land types
- `indoor_features` - Indoor amenities
- `outdoor_features` - Outdoor amenities
- `infrastructure` - Land infrastructure
- `property_views` - View types
- `property_status` - Listing status
- `listing_types` - Sale/Rent/Exchange
- `price_modifiers` - Price labels
- `title_deeds` - Title deed status
- `all` - All property taxonomies
- `all_land` - All land taxonomies

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired/invalid | Re-authenticate |
| 403 Forbidden | Missing User-Agent header | Add `User-Agent: SophiaAI` (exact value) |
| 403 on field_phone_number | OAuth client lacks permission | Field removed from payload - don't re-add |
| 404 on taxonomy | Wrong vocabulary machine name | Run `tests/manual/test-zyprus-api.ts` to discover correct names |
| 422 Unprocessable | Invalid relationship UUID | Verify taxonomy IDs from cache |
| 500 Server Error | Malformed JSON:API payload | Check data structure |

**Debugging Taxonomy 404s**: Run `pnpm exec tsx tests/manual/test-zyprus-api.ts` to test all endpoints
and discover available vocabularies. Check property relationships to find actual vocabulary names.

**Unpublished Listings**: AI-generated listings are created with `status: false` (unpublished draft).
The public URL won't work until a Zyprus admin reviews and publishes the listing. This is intentional
to prevent unreviewed AI content from going live.

### Postman MCP Integration

The Postman MCP server provides tools for API documentation and testing. Key tools used for Zyprus API:

```typescript
// Available Postman MCP tools:
mcp__postman__getWorkspaces      // List workspaces
mcp__postman__getCollections     // List collections in workspace
mcp__postman__getCollection      // Get collection details with requests
mcp__postman__getEnvironments    // Get environment variables
mcp__postman__runCollection      // Execute collection tests

// To explore an API:
1. getWorkspaces() → find workspace ID
2. getCollections(workspaceId) → find collection ID
3. getCollection(collectionId) → get all endpoints/requests
4. Extract endpoints, headers, body schemas from collection items
```

**Postman Collection Structure**:
- Collections contain folders and requests
- Each request has: method, URL, headers, body, auth
- Use `item` array to traverse folders/requests recursively
- Request body in `request.body.raw` (JSON string)
- Headers in `request.header` array

### Environment Variables

```bash
# Required for Zyprus integration
ZYPRUS_CLIENT_ID=your-client-id
ZYPRUS_CLIENT_SECRET=your-client-secret
ZYPRUS_API_URL=https://zyprus.com  # Optional, defaults to this

# For Postman MCP (if using)
POSTMAN_API_KEY=your-postman-api-key
```