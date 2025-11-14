# SOFIA - System Architecture Documentation

**Version:** 3.0.0
**Product:** SOFIA (Sophia AI Assistant)
**Client:** Zyprus Property Group
**Last Updated:** November 14, 2025
**Status:** Production Active

---

## 1. Overview

### 1.1 System Purpose and Scope

SOFIA is a production-grade AI-powered assistant for Cyprus real estate operations. The system automates document generation, property listing management, and client support through conversational AI interfaces, reducing document creation time from 30-45 minutes to under 2 minutes while ensuring compliance with Cyprus real estate regulations.

**Core Capabilities:**
- 38 Cyprus real estate document templates (registrations, viewing forms, marketing agreements, communications)
- AI-powered field extraction and document generation
- Property listing creation and upload to Zyprus platform
- Cyprus tax calculators (VAT, transfer fees, capital gains)
- Multi-channel support (web UI + Telegram bot)
- Real-time streaming responses with tool execution

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Web Browser    │  │  Telegram App    │  │   Mobile Device  │ │
│  │  (React 19 UI)   │  │  (Bot Webhook)   │  │  (Responsive)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼────────────────────┼────────────────────┼─────────────┘
            │                     │                     │
┌───────────┼─────────────────────┼─────────────────────┼─────────────┐
│           │      NEXT.JS 15 APP LAYER (VERCEL)        │             │
│           ▼                     ▼                     ▼             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   APP ROUTER                                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │
│  │  │  (chat)/    │  │   api/      │  │ (auth)/     │        │    │
│  │  │  Chat UI    │  │  API Routes  │  │  Auth Pages │        │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │    │
│  └─────────┼─────────────────┼─────────────────┼───────────────┘    │
│            │                 │                 │                    │
│  ┌─────────▼─────────────────▼─────────────────▼───────────────┐   │
│  │               MIDDLEWARE & ROUTING                            │   │
│  │  • Access Gate (cookie validation)                            │   │
│  │  • Rate Limiting (Redis-backed)                               │   │
│  │  • Authentication (NextAuth.js)                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
            │                     │                     │
┌───────────┼─────────────────────┼─────────────────────┼─────────────┐
│           │      BUSINESS LOGIC LAYER                  │             │
│           ▼                     ▼                     ▼             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────┐  │
│  │   AI Integration  │  │  Data Layer       │  │  External API │  │
│  │   (lib/ai/)       │  │  (lib/db/)        │  │  (lib/zyprus/,│  │
│  │                   │  │                   │  │   lib/telegram/)│  │
│  │  • Providers      │  │  • Schema         │  │                │  │
│  │  • Prompts        │  │  • Queries        │  │  • Zyprus      │  │
│  │  • Tools          │  │  • Migrations     │  │  • Telegram    │  │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬──────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
┌───────────▼─────────────────────▼─────────────────────▼─────────────┐
│                    INFRASTRUCTURE LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Vercel AI    │  │  PostgreSQL  │  │    Redis     │  │  Vercel ││
│  │   Gateway    │  │  (Database)  │  │   (Cache)    │  │  Blob   ││
│  │  (REQUIRED)  │  │              │  │              │  │ (Files) ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│  Claude 4.5 Haiku   7 tables         Taxonomy cache    Document    │
│  Claude 4.5 Sonnet  Drizzle ORM      Rate limiting     storage     │
│  GPT-4o Mini        Indexes          Sessions                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Technologies

**Frontend:**
- Next.js 15.3.0 (App Router, React Server Components)
- React 19.0 RC (Concurrent Rendering, Suspense)
- Tailwind CSS 4.0 (Utility-first styling)
- shadcn/ui (Accessible component library)

**Backend:**
- Node.js 20+ (Runtime)
- Next.js API Routes (Serverless functions)
- Server-Sent Events (SSE) for streaming

**AI & ML:**
- Vercel AI SDK 5.0 (MANDATORY gateway)
- Claude 4.5 Haiku/Sonnet (Anthropic)
- GPT-4o Mini (OpenAI)
- tokenlens (Token tracking)

**Data:**
- PostgreSQL (Vercel Postgres)
- Drizzle ORM 0.34
- Redis (Vercel KV / Upstash)

**External:**
- Zyprus Property API (OAuth 2.0)
- Telegram Bot API (Webhook)

---

## 2. Architecture Principles

### 2.1 Design Philosophy

**Performance First:**
- Optimized database queries with composite indexes (10-100x faster)
- Redis caching for external API data (95% fewer calls)
- Anthropic prompt caching ($2-5 saved per 1000 requests)
- Streaming responses for perceived speed

**Reliability & Resilience:**
- AI Gateway as single point of failure (MANDATORY, no fallback)
- Graceful degradation on external service failures
- In-memory cache fallback for Redis failures
- Retry logic with exponential backoff (Zyprus uploads)
- Circuit breaker pattern for API stability

**Developer Experience:**
- Type-safe with TypeScript 5.6
- Monorepo structure with pnpm workspaces
- Comprehensive error logging with context
- Database migrations managed by Drizzle

**Cost Optimization:**
- Claude Haiku as default (best value: $1.00/M input)
- Prompt caching for 50-70% cost reduction
- Redis cache to minimize expensive API calls
- Time-based typing indicators (90% fewer calls)

### 2.2 Key Decisions and Trade-offs

**Decision 1: AI Gateway as MANDATORY dependency**
- **Why:** Unified access to multiple models, centralized billing, observability
- **Trade-off:** Single point of failure, vendor lock-in to Vercel
- **Mitigation:** No mitigation - AI Gateway is critical infrastructure
- **Impact:** Application will not start without `AI_GATEWAY_API_KEY`

**Decision 2: Server-Sent Events (SSE) for streaming**
- **Why:** Real-time responses, better UX than polling
- **Trade-off:** More complex client code, connection management
- **Benefit:** Perceived performance, progressive disclosure of AI responses

**Decision 3: PostgreSQL with Drizzle ORM**
- **Why:** Type safety, migrations, excellent TypeScript support
- **Trade-off:** Learning curve vs. Prisma/TypeORM
- **Benefit:** Better type inference, smaller bundle size

**Decision 4: Soft deletes for data recovery**
- **Why:** Data recovery, audit trails, compliance
- **Trade-off:** Queries must always check `deletedAt IS NULL`
- **Benefit:** 90-day recovery window, no accidental data loss

**Decision 5: Telegram bot via webhook (not polling)**
- **Why:** Lower latency, more efficient
- **Trade-off:** Requires public endpoint, webhook security
- **Benefit:** Real-time responses, no polling overhead

### 2.3 Non-Functional Requirements

**Performance:**
- Chat response time: <2s (simple), <3s (with tool)
- Document generation: <90s average
- Database queries: <100ms (95th percentile)
- Page load: <1.5s initial

**Scalability:**
- 50 concurrent users (production target)
- 200 messages/hour peak load
- 100 documents/day
- Horizontal scaling via Vercel (automatic)

**Availability:**
- 99.5% uptime during business hours (Cyprus time: 08:00-20:00 EET)
- Graceful degradation on external service failures
- Automatic recovery from transient errors

**Security:**
- TLS 1.3 for all connections
- bcrypt password hashing
- JWT session tokens (30-day expiration)
- Access gate cookie (`qualia-access=granted`)
- Rate limiting per user type

**Maintainability:**
- Comprehensive error logging with context
- Database migration system
- Automated testing (Playwright E2E, Vitest unit)
- Documentation in CLAUDE.md, PRD.md, ARCHITECTURE.md

---

## 3. System Components

### 3.1 Frontend Layer

#### Next.js 15 App Router Structure

```
app/
├── (auth)/              # Authentication pages (login, register)
│   ├── login/
│   │   └── page.tsx     # Login form with email/password
│   └── register/
│       └── page.tsx     # Registration form
│
├── (chat)/              # Main chat interface (protected)
│   ├── api/chat/
│   │   └── route.ts     # Main streaming AI endpoint (POST)
│   ├── chat/[id]/
│   │   └── page.tsx     # Individual chat session UI
│   └── page.tsx         # Chat list/history
│
├── api/
│   ├── listings/        # Property CRUD endpoints
│   │   ├── route.ts     # GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts # PUT (update), DELETE (soft delete)
│   ├── telegram/
│   │   └── webhook/
│   │       └── route.ts # Telegram webhook handler (POST)
│   ├── templates/
│   │   └── route.ts     # Template metadata (GET)
│   └── files/
│       └── upload/
│           └── route.ts # File upload handler
│
├── properties/          # Property management UI
│   ├── page.tsx         # Property list
│   └── [id]/
│       └── page.tsx     # Property detail/edit
│
└── layout.tsx           # Root layout with providers
```

#### React 19 Components

**Key Components:**
- `<Chat />` - Main chat interface with message list and input
- `<MultimodalInput />` - Text input with file upload support
- `<MessageList />` - Virtualized message rendering
- `<ArtifactRenderer />` - Document preview with syntax highlighting
- `<PropertyForm />` - Property listing creation/edit form
- `<Calculator />` - Cyprus tax calculator widgets

**State Management:**
- React 19 `use()` hook for async data
- SWR for data fetching and caching
- Zustand for global UI state (modals, sidebars)
- useOptimistic for optimistic updates

**Styling:**
- Tailwind CSS 4.0 for utility classes
- CSS variables for theming
- Dark mode support via next-themes
- Responsive design (mobile-first)

### 3.2 API Layer

#### Route Handlers (app/api/)

**Main Chat Endpoint: `POST /api/chat`**

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/app/(chat)/api/chat/route.ts`

Flow:
```
1. Parse request body (message, chatId, selectedChatModel, visibility)
2. Authenticate user (NextAuth session)
3. Check rate limits (Redis-backed, per user type)
4. Load chat history from PostgreSQL
5. Save user message to database
6. Stream AI response via SSE:
   a. Load system prompt (cached 24h)
   b. Call AI Gateway with streaming
   c. Execute tools if invoked (calculators, listings, documents)
   d. Track tokens with tokenlens
   e. Send SSE events to client
7. Save assistant message to database
8. Return streaming response
```

Key features:
- Server-Sent Events via `JsonToSseTransformStream`
- Token tracking with tokenlens
- Message persistence in PostgreSQL
- Tool execution for real estate calculations
- Anthropic prompt caching (Claude models only)
- Geolocation hints for context

**Listing API: `/api/listings`**

Endpoints:
- `GET /api/listings` - List user's listings (paginated)
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Soft delete listing
- `POST /api/listings/:id/upload` - Queue for Zyprus upload

Validation: Zod schemas for all inputs

**Template API: `/api/templates`**

Endpoint: `GET /api/templates`
Returns: JSON metadata for all 38 templates
Cache: Static data, 24h cache

**Telegram Webhook: `POST /api/telegram/webhook`**

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/app/api/telegram/webhook/route.ts`

Validation:
- `X-Telegram-Bot-Api-Secret-Token` header check
- IP whitelist for Telegram servers

Handler: `lib/telegram/message-handler.ts`

#### Middleware Pipeline

```
Request → Access Gate → Rate Limiting → Auth → Route Handler → Response
```

**Access Gate:**
- Checks for `qualia-access=granted` cookie
- Redirects to access code page if missing
- 30-day cookie expiration

**Rate Limiting:**
- Redis-backed via Upstash
- Per-user quotas:
  - Guest: 100 messages/day
  - Regular: 10,000 messages/day
  - Paid: Unlimited (planned)
- Reset: Daily at midnight Cyprus time

**Authentication:**
- NextAuth.js 5.0 Beta
- JWT sessions with 30-day expiration
- Guest users auto-created
- Regular users via email/password

### 3.3 AI Integration Layer

#### AI Gateway Configuration (MANDATORY)

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/ai/providers.ts`

**Critical Requirement:**
- AI Gateway is the ONLY way to access AI models
- No fallback options exist
- Application will not start without `AI_GATEWAY_API_KEY`

**Configuration:**
```typescript
import { gateway } from "@ai-sdk/gateway";

const defaultModel = gateway("anthropic/claude-haiku-4.5");

export const myProvider = customProvider({
  languageModels: {
    "chat-model": defaultModel,           // Claude Haiku 4.5
    "chat-model-sonnet": gateway("anthropic/claude-sonnet-4.5"),
    "chat-model-gpt4o": gateway("openai/gpt-4o-mini"),
    "title-model": defaultModel,
    "artifact-model": defaultModel,
  },
});
```

**Available Models:**

| Model ID | Provider | Model Name | Cost (Input/Output per 1M tokens) |
|----------|----------|------------|-----------------------------------|
| `chat-model` | Anthropic | Claude 4.5 Haiku | $1.00 / $5.00 |
| `chat-model-sonnet` | Anthropic | Claude 4.5 Sonnet | $3.00 / $15.00 |
| `chat-model-gpt4o` | OpenAI | GPT-4o Mini | $0.15 / $0.60 |

Default: Claude Haiku 4.5 (best value: fast, smart, affordable)

#### Model Selection Logic

```typescript
// User selects model in UI
selectedChatModel: "chat-model" | "chat-model-sonnet" | "chat-model-gpt4o"

// Provider resolves to actual model
const model = myProvider.languageModel(selectedChatModel);

// Used in streamText()
const result = streamText({
  model: model,
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: convertToModelMessages(uiMessages),
  tools: { /* ... */ },
  experimental_activeTools: [/* ... */],
});
```

#### Prompt Engineering

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/ai/prompts.ts`

**System Prompt Architecture:**

```typescript
export function systemPrompt({ selectedChatModel, requestHints }) {
  // For Anthropic models: Use array format with prompt caching
  if (selectedChatModel === "chat-model-sonnet" ||
      selectedChatModel === "chat-model-haiku") {
    return [
      {
        type: "text",
        text: getBaseSystemPrompt(), // Cached 24h
        cache_control: { type: "ephemeral" }, // Anthropic caching
      },
      {
        type: "text",
        text: getDynamicSystemPrompt(requestHints), // Not cached
      },
    ] as any; // Type assertion for AI SDK compatibility
  }

  // For GPT models: Use string format (no caching)
  return `${getBaseSystemPrompt()}\n\n${getDynamicSystemPrompt(requestHints)}`;
}
```

**Prompt Components:**

1. **Base Instructions (Cached 24h):**
   - SOFIA's identity and purpose
   - 38 template definitions
   - Field extraction rules
   - Document formatting rules
   - Cyprus real estate knowledge
   - Tool usage instructions
   - ~2,442 lines of instructions

2. **Dynamic Context (Not Cached):**
   - Current date/time (Cyprus timezone)
   - User geolocation hints (city, country)
   - Request-specific context
   - Model-specific adjustments

**Prompt Caching (Anthropic Only):**

Benefits:
- 50-70% cost reduction on Claude models
- 50-100ms faster responses
- Cache lasts 5 minutes (Anthropic spec)
- Automatic cache hit detection

Implementation:
```typescript
cache_control: { type: "ephemeral" } // Added to base prompt
```

Savings: $2-5 per 1,000 requests (Claude models)

#### Tool Execution Framework

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/ai/tools/`

**Registered Tools:**

```typescript
tools: {
  // Cyprus calculators
  calculateTransferFees: calculateTransferFeesTool,
  calculateCapitalGains: calculateCapitalGainsTool,
  calculateVAT: calculateVATTool,

  // Property listings
  createListing: createListingTool,
  listListings: listListingsTool,
  uploadListing: uploadListingTool,

  // Zyprus data
  getZyprusData: getZyprusDataTool,

  // Document generation
  createDocument: createDocument({ session, dataStream }),
  updateDocument: updateDocument({ session, dataStream }),
  requestSuggestions: requestSuggestions({ session, dataStream }),
},

experimental_activeTools: [
  "calculateTransferFees",
  "calculateCapitalGains",
  "calculateVAT",
  "createListing",
  "listListings",
  "uploadListing",
  "getZyprusData",
  "createDocument",
  "updateDocument",
  "requestSuggestions",
],
```

**Tool Implementation Pattern:**

```typescript
export const calculateTransferFeesTool = {
  description: "Calculate Cyprus property transfer fees",
  parameters: z.object({
    propertyValue: z.number().describe("Property value in euros"),
    isFirstTransfer: z.boolean().optional(),
  }),
  execute: async ({ propertyValue, isFirstTransfer }) => {
    // Calculate fees based on Cyprus brackets
    // Return formatted result
  },
};
```

**Tool Execution Flow:**

```
1. AI model detects need for tool
2. Generates tool call with parameters
3. Vercel AI SDK validates against Zod schema
4. execute() function runs
5. Result streamed back to AI model
6. AI incorporates result in response
7. Response streamed to client
```

### 3.4 Data Layer

#### PostgreSQL Schema (7 Tables)

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/db/schema.ts`

**Entity-Relationship Diagram (ASCII):**

```
┌──────────────┐
│     User     │
│              │
│  id (PK)     │◄──────────────┐
│  email       │                │
│  password    │                │
└──────────────┘                │
       ▲                        │
       │                        │
       │ userId                 │ userId
       │                        │
┌──────┴───────┐         ┌──────┴───────┐
│     Chat     │         │  Property    │
│              │         │   Listing    │
│  id (PK)     │◄────┐   │              │
│  userId (FK) │     │   │  id (PK)     │
│  title       │     │   │  userId (FK) │
│  visibility  │     │   │  chatId (FK) │
│  createdAt   │     │   │  name        │
│  lastContext │     │   │  description │
└──────────────┘     │   │  price       │
       ▲             │   │  status      │
       │             │   │  deletedAt   │
       │ chatId      │   └──────────────┘
       │             │          │
┌──────┴───────┐    │          │ listingId
│  Message_v2  │    │          │
│              │    │   ┌──────▼───────────┐
│  id (PK)     │    │   │  ListingUpload   │
│  chatId (FK) │◄───┤   │     Attempt      │
│  role        │    │   │                  │
│  parts       │    │   │  id (PK)         │
│  createdAt   │    │   │  listingId (FK)  │
└──────────────┘    │   │  attemptNumber   │
       ▲            │   │  status          │
       │            │   │  errorMessage    │
       │ messageId  │   └──────────────────┘
       │            │
┌──────┴───────┐   │
│   Vote_v2    │   │
│              │   │
│  chatId (FK) │───┘
│  messageId(FK)│
│  isUpvoted   │
└──────────────┘
       ▲
       │ chatId
       │
┌──────┴───────┐
│    Stream    │
│              │
│  id (PK)     │
│  chatId (FK) │
│  createdAt   │
└──────────────┘
```

**Table Descriptions:**

1. **User** (Authentication and profiles)
   - `id` (UUID, primary key)
   - `email` (unique)
   - `password` (hashed with bcrypt-ts)
   - **Index:** `email` (unique)

2. **Chat** (Conversation sessions)
   - `id` (UUID, primary key)
   - `userId` (foreign key → User)
   - `title` (auto-generated from first message)
   - `visibility` (public, private)
   - `createdAt`, `lastContext` (token usage)
   - **Indexes:**
     - `(userId, createdAt DESC)` - Composite for pagination (10-100x faster)
   - **CASCADE:** Delete deletes messages, votes, streams

3. **Message_v2** (Chat messages with parts)
   - `id` (UUID, primary key)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `role` (user, assistant, system)
   - `parts` (JSONB, message content parts)
   - `attachments` (JSONB, file attachments)
   - `createdAt`
   - **Indexes:**
     - `(chatId, createdAt ASC)` - Composite for message history

4. **Vote_v2** (Message feedback)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `messageId` (foreign key → Message_v2, CASCADE delete)
   - `isUpvoted` (boolean)
   - **Primary Key:** `(chatId, messageId)`

5. **PropertyListing** (Real estate listings)
   - `id` (UUID, primary key)
   - `userId` (foreign key → User)
   - `chatId` (foreign key → Chat, optional)
   - `name`, `description`, `price`, `address`
   - `numberOfRooms`, `numberOfBathroomsTotal`, `floorSize`
   - `propertyTypeId`, `locationId` (Zyprus taxonomy UUIDs)
   - `indoorFeatureIds`, `outdoorFeatureIds` (arrays)
   - `status` (draft, queued, uploading, uploaded, failed)
   - `zyprusListingId`, `zyprusListingUrl`
   - `createdAt`, `updatedAt`, `publishedAt`, `deletedAt`
   - **Indexes:**
     - `(userId, createdAt DESC)` - Composite for user listings
     - `(userId, status)` - Composite for filtered queries
     - `deletedAt` - For soft delete queries

6. **ListingUploadAttempt** (Upload retry tracking)
   - `id` (UUID, primary key)
   - `listingId` (foreign key → PropertyListing)
   - `attemptNumber`, `status`, `errorMessage`, `errorCode`
   - `apiResponse` (JSONB)
   - `attemptedAt`, `completedAt`, `durationMs`
   - **Index:** `listingId`

7. **Stream** (Chat streaming metadata)
   - `id` (UUID, primary key)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `createdAt`

**Migration History:**
- 0001-0010: Initial schema + features
- 0011: Composite indexes for performance (10-100x faster)
- 0012: CASCADE deletes (75% fewer deletion queries)

#### Index Strategy

**Composite Indexes (High Performance):**

```sql
-- Chat pagination (userId + createdAt DESC)
CREATE INDEX Chat_userId_createdAt_idx
ON Chat (userId, createdAt DESC);

-- Message history (chatId + createdAt ASC)
CREATE INDEX Message_v2_chatId_createdAt_idx
ON Message_v2 (chatId, createdAt ASC);

-- Property listings (userId + createdAt DESC)
CREATE INDEX PropertyListing_userId_createdAt_idx
ON PropertyListing (userId, createdAt DESC);

-- Property filtering (userId + status)
CREATE INDEX PropertyListing_userId_status_idx
ON PropertyListing (userId, status);
```

**Performance Impact:**
- User chat list queries: 10-100x faster
- Message history loading: 5-10x faster
- Property listing queries: 10-100x faster
- Enables efficient cursor-based pagination

**Soft Delete Pattern:**
- All queries must check `deletedAt IS NULL`
- 90-day recovery window
- Periodic cleanup via cron job

#### CASCADE Delete Relationships

**Implementation (Migration 0012):**

```sql
-- Before: Manual cascade in application code (4+ queries)
DELETE FROM Vote WHERE chatId = ?;
DELETE FROM Message WHERE chatId = ?;
DELETE FROM Stream WHERE chatId = ?;
DELETE FROM Chat WHERE id = ?;

-- After: Single query with CASCADE (1 query, 75% reduction)
DELETE FROM Chat WHERE id = ?;
-- Database automatically deletes related votes, messages, streams
```

**Benefits:**
- 75% fewer deletion queries
- Atomic operations (no race conditions)
- Cleaner application code
- Guaranteed referential integrity

### 3.5 Caching Layer

#### Redis (Vercel KV)

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/zyprus/taxonomy-cache.ts`

**Zyprus Taxonomy Cache:**

Purpose: Cache Zyprus property types, features, locations (expensive API call)

Implementation:
```typescript
const CACHE_KEY = "zyprus:taxonomy:v1";
const CACHE_TTL = 3600; // 1 hour

// Serialize Maps to plain objects for Redis storage
function serializeCache(cache) {
  return {
    propertyTypes: Array.from(cache.propertyTypes.entries()),
    locations: Array.from(cache.locations.entries()),
    indoorFeatures: Array.from(cache.indoorFeatures.entries()),
    outdoorFeatures: Array.from(cache.outdoorFeatures.entries()),
  };
}

// Deserialize objects back to Maps
function deserializeCache(data) {
  return {
    propertyTypes: new Map(data.propertyTypes),
    locations: new Map(data.locations),
    indoorFeatures: new Map(data.indoorFeatures),
    outdoorFeatures: new Map(data.outdoorFeatures),
  };
}

// Stale-while-revalidate pattern
export async function getCache() {
  const cached = await kv.get(CACHE_KEY);
  if (cached) {
    // Return stale data immediately
    const deserialized = deserializeCache(cached);

    // Refresh in background if near expiration
    refreshCacheInBackground();

    return deserialized;
  }

  // Cache miss: fetch and store
  const fresh = await fetchFromZyprusAPI();
  await kv.set(CACHE_KEY, serializeCache(fresh), { ex: CACHE_TTL });
  return fresh;
}
```

**Fallback Strategy:**
- Primary: Redis (Vercel KV)
- Fallback: In-memory cache (if Redis fails)
- Resilience: Never block on cache failures

**Performance Impact:**
- 95% reduction in Zyprus API calls
- 200-500ms faster per listing operation
- Cost savings on Zyprus API usage

#### Next.js unstable_cache

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/ai/prompts.ts`

**System Prompt Caching:**

```typescript
import { unstable_cache as cache } from "next/cache";

const loadSophiaInstructions = cache(
  async () => {
    const file = path.join(process.cwd(), "lib/ai/sofia-base-instructions.txt");
    return await fs.readFile(file, "utf-8");
  },
  ["sophia-base-prompt"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);
```

**Performance Impact:**
- 50-100ms saved per request (file I/O eliminated)
- Lower compute costs
- Cache hit rate: ~99% after warmup

#### Anthropic Prompt Cache

**Mechanism:**
- Anthropic caches static prompt parts for 5 minutes
- Identified by `cache_control: { type: "ephemeral" }` marker
- Automatic cache hit detection

**Implementation:**
```typescript
{
  type: "text",
  text: getBaseSystemPrompt(), // 2,442 lines cached
  cache_control: { type: "ephemeral" },
}
```

**Cost Savings:**
- $2-5 per 1,000 requests (50-70% reduction)
- Only works with Claude models (not GPT-4o)
- Cache lasts 5 minutes (Anthropic spec)

### 3.6 External Integrations

#### Zyprus Property API (OAuth 2.0)

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/zyprus/client.ts`

**Authentication:**
```typescript
// OAuth 2.0 Client Credentials Flow
const tokenResponse = await fetch(`${ZYPRUS_API_URL}/oauth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "client_credentials",
    client_id: process.env.ZYPRUS_CLIENT_ID,
    client_secret: process.env.ZYPRUS_CLIENT_SECRET,
  }),
});

const { access_token, expires_in } = await tokenResponse.json();
```

**Endpoints Used:**
- `GET /api/taxonomy` - Fetch property types, features, locations
- `POST /api/listings` - Create property listing
- `PUT /api/listings/:id` - Update listing
- `GET /api/listings/:id` - Fetch listing details
- `DELETE /api/listings/:id` - Remove listing

**Rate Limits:**
- 100 requests/minute
- 5 concurrent uploads
- Handled via queue + exponential backoff

**Error Handling:**
- Circuit breaker pattern (Opossum library)
- Threshold: 50% error rate
- Timeout: 30 seconds
- Reset timeout: 60 seconds
- Upload attempts tracked in database

**Retry Logic:**
```typescript
// Exponential backoff: 1s, 2s, 4s, 8s, 16s
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const result = await uploadListing(listing);
    return result; // Success
  } catch (error) {
    if (attempt === 5) throw error; // Max retries
    await sleep(Math.pow(2, attempt) * 1000);
  }
}
```

#### Telegram Bot API (Webhook)

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/telegram/`

**Webhook Setup:**
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://sofiatesting.vercel.app/api/telegram/webhook" \
  -d "secret_token=${TELEGRAM_SECRET_TOKEN}"
```

**Authentication:**
- Header validation: `X-Telegram-Bot-Api-Secret-Token`
- IP whitelist: Telegram server IPs only
- Webhook URL: `POST /api/telegram/webhook`

**Message Handler:**

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/telegram/message-handler.ts`

Flow:
```
1. Validate webhook secret token
2. Ignore bot messages
3. Get or create user in database
4. Get or create persistent chat session
5. Load chat history from PostgreSQL
6. Save user message
7. Stream AI response (Gemini Flash for speed)
8. Send typing indicator (time-based, every 3s)
9. Save assistant message
10. Format response for Telegram (Markdown → HTML)
11. Split long responses (4096 char limit)
12. Send response to user
```

**Optimizations:**

Typing Indicators (90% reduction):
```typescript
// Before: Every 500 characters (many API calls)
if (fullResponse.length % 500 === 0) {
  await sendChatAction({ chatId });
}

// After: Every 3 seconds (time-based)
const TYPING_INTERVAL_MS = 3000;
let lastTypingIndicator = Date.now();

if (Date.now() - lastTypingIndicator >= TYPING_INTERVAL_MS) {
  await sendChatAction({ chatId });
  lastTypingIndicator = Date.now();
}
```

Performance: 90% fewer Telegram API calls, 10-20ms faster per response

**Message Formatting:**
```typescript
// Convert Markdown to Telegram HTML
function formatForTelegram(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") // Bold
    .replace(/\*(.+?)\*/g, "<i>$1</i>") // Italic
    .replace(/```[\s\S]*?```/g, (match) => `<code>${match}</code>`) // Code
    .replace(/\n/g, "<br>"); // Line breaks
}
```

**Rate Limits:**
- 30 messages/second to same user (Telegram limit)
- Handled via queue

#### Vercel AI SDK

**Integration Points:**

1. **streamText()** - Main streaming function
```typescript
const result = await streamText({
  model: myProvider.languageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: convertToModelMessages(uiMessages),
  temperature: 0,
  tools: { /* ... */ },
  experimental_activeTools: [/* ... */],
  experimental_transform: smoothStream({ chunking: "word" }),
});
```

2. **createUIMessageStream()** - SSE stream wrapper
```typescript
const stream = createUIMessageStream({
  execute: ({ writer: dataStream }) => {
    result.consumeStream();
    dataStream.merge(result.toUIMessageStream());
  },
  generateId: generateUUID,
  onFinish: async ({ messages }) => {
    await saveMessages({ messages });
  },
});
```

3. **JsonToSseTransformStream** - SSE formatting
```typescript
return new Response(
  stream.pipeThrough(new JsonToSseTransformStream())
);
```

---

## 4. Data Flow Diagrams

### 4.1 Document Generation Flow

```
┌─────────────┐
│    USER     │
│  "I need a  │
│   seller    │
│registration"│
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│            1. FRONTEND (React Component)                  │
│  • User types message in <MultimodalInput />              │
│  • Message sent to POST /api/chat                         │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│         2. API ROUTE (app/(chat)/api/chat/route.ts)      │
│  • Authenticate user (NextAuth session)                   │
│  • Check rate limits (Redis)                              │
│  • Load chat history from PostgreSQL                      │
│  • Save user message to database                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│           3. AI GATEWAY (Vercel AI SDK)                   │
│  • Load system prompt (cached 24h)                        │
│  • Call Claude Haiku 4.5 via AI Gateway                   │
│  • Streaming response (SSE)                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│          4. FIELD EXTRACTION (AI Processing)              │
│  • Parse message: "seller registration"                   │
│  • Detect template: reg-01 (Standard Seller)              │
│  • Extract fields: None provided yet                      │
│  • Required fields: client name, property, passport, etc. │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│        5. RESPONSE GENERATION (AI Output)                 │
│  • Format response: "Please provide: ..."                 │
│  • List missing fields with examples                      │
│  • Stream response to client (SSE)                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│         6. SAVE MESSAGE (Database)                        │
│  • Save assistant message to PostgreSQL                   │
│  • Track token usage with tokenlens                       │
│  • Update chat context                                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│        7. FRONTEND RENDERS (React UI)                     │
│  • Display AI response in <MessageList />                 │
│  • User provides missing information                      │
│  • Process repeats (steps 1-7) until all fields present   │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼ (After all fields provided)
┌──────────────────────────────────────────────────────────┐
│         8. DOCUMENT GENERATION (Final Step)               │
│  • AI detects all required fields present                 │
│  • Generate complete document in bold Markdown            │
│  • Include all fields in formatted template               │
│  • Stream document to client                              │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    USER     │
│  Views/edits│
│  document   │
└─────────────┘
```

**Example Interaction:**

```
User: "I need a seller registration"

AI: "Please provide:

Please provide the client's full name (e.g., John Smith, Maria Papadopoulos)

Please provide the property registration (e.g., Reg. No. 0/1789 Germasogeia, Limassol)"

---

User: "Client is Maria Papadopoulos, property is Reg No. 0/1789 Limassol"

AI: "Please provide:

Please provide the client's passport information (e.g., Passport No. K12345678, Issued by Cyprus, Expiry 14/02/2031)

Please provide the marketing price (e.g., €350,000)"

---

User: "Passport K99887766, Cyprus, expiry 20/05/2030. Price €425,000"

AI: [Generates complete document]

**Subject: Registration – Maria Papadopoulos – Reg No. 0/1789 – Limassol**

**Dear XXXXXXXX,**

**This email is to provide you with a registration.**

**Client Name:** Maria Papadopoulos
**Property Registration:** Reg. No. 0/1789 Germasogeia, Limassol
**Passport:** Passport No. K99887766, Issued by Cyprus, Expiry 20/05/2030
**Marketing Price:** €425,000
[... complete document ...]
```

### 4.2 Property Listing Flow

```
┌─────────────┐
│    USER     │
│"Create a 3BR│
│ apartment in│
│   Limassol" │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│       1. AI TOOL INVOCATION (createListing)               │
│  • AI detects property listing intent                     │
│  • Extracts: bedrooms=3, type=apartment, location=Limassol│
│  • Invokes createListing tool with parameters             │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     2. TAXONOMY CACHE LOOKUP (Redis)                      │
│  • Check Redis for cached Zyprus taxonomy                 │
│  • Cache hit: Return cached data (95% of requests)        │
│  • Cache miss: Fetch from Zyprus API, store in Redis      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│       3. FIELD MAPPING (Taxonomy Resolution)              │
│  • Map "apartment" → propertyTypeId (UUID)                │
│  • Map "Limassol" → locationId (UUID)                     │
│  • Map "3BR" → numberOfRooms = 3                          │
│  • Extract any features mentioned                         │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      4. CREATE LISTING (Database)                         │
│  • Generate UUID for listing                              │
│  • Save to PropertyListing table                          │
│  • Status: "draft"                                        │
│  • Associate with userId and chatId                       │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      5. AI RESPONSE (Confirmation)                        │
│  • "I've created a draft listing for a 3-bedroom..."     │
│  • Provide listing ID and URL                             │
│  • Ask if user wants to upload to Zyprus                  │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼ (User confirms upload)
┌──────────────────────────────────────────────────────────┐
│      6. QUEUE UPLOAD (uploadListing tool)                 │
│  • Update listing status: "queued"                        │
│  • Add to upload queue                                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      7. ZYPRUS UPLOAD (Background Job)                    │
│  • Update status: "uploading"                             │
│  • Call Zyprus API: POST /api/listings                    │
│  • Retry with exponential backoff (up to 5 attempts)      │
│  • Log attempt in ListingUploadAttempt table              │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼ (Success)
┌──────────────────────────────────────────────────────────┐
│      8. UPDATE STATUS (Database)                          │
│  • Update status: "uploaded"                              │
│  • Save zyprusListingId and zyprusListingUrl              │
│  • Set publishedAt timestamp                              │
│  • Log successful attempt                                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    USER     │
│   Notified  │
│  of success │
└─────────────┘
```

**Status Progression:**
1. `draft` - Listing created, not ready for upload
2. `queued` - Ready for upload, waiting for processing
3. `uploading` - Active upload to Zyprus API in progress
4. `uploaded` - Successfully synced to Zyprus platform
5. `failed` - Upload error, requires manual review

**Error Handling:**
- Upload failures logged with error code and message
- Automatic retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum 5 retry attempts
- Circuit breaker pattern for API stability

### 4.3 Telegram Bot Flow

```
┌─────────────┐
│  TELEGRAM   │
│    USER     │
│ "Calculate  │
│ VAT on €300k"│
└──────┬──────┘
       │
       ▼ (Telegram sends webhook)
┌──────────────────────────────────────────────────────────┐
│     1. WEBHOOK ENDPOINT (POST /api/telegram/webhook)      │
│  • Validate X-Telegram-Bot-Api-Secret-Token header        │
│  • Parse incoming message JSON                            │
│  • Extract: chat.id, message.text, from.id, from.name     │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│    2. MESSAGE HANDLER (lib/telegram/message-handler.ts)   │
│  • Ignore bot messages (from.is_bot = true)               │
│  • Handle commands: /help, /templates                     │
│  • Send typing indicator (every 3 seconds)                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      3. USER MANAGEMENT (Database)                        │
│  • Get or create User in database                         │
│  • Map Telegram user ID to UUID                           │
│  • Get or create persistent Chat session                  │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│       4. AI PROCESSING (Gemini Flash)                     │
│  • Load chat history from PostgreSQL                      │
│  • Add Telegram-specific system prompt (friendly tone)    │
│  • Stream AI response                                     │
│  • Execute tools if needed (calculateVAT)                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      5. TOOL EXECUTION (calculateVAT)                     │
│  • Parse parameters: propertyValue = 300000               │
│  • Calculate VAT (Cyprus brackets)                        │
│  • Return formatted result                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      6. RESPONSE FORMATTING (Markdown → HTML)             │
│  • Convert **bold** to <b>bold</b>                        │
│  • Convert *italic* to <i>italic</i>                      │
│  • Convert ```code``` to <code>code</code>                │
│  • Replace \n with <br>                                   │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      7. MESSAGE SPLITTING (4096 char limit)               │
│  • Check message length                                   │
│  • If > 4096 chars, split into chunks                     │
│  • Preserve HTML tags across splits                       │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      8. SEND TO TELEGRAM (API Call)                       │
│  • Call Telegram API: sendMessage                         │
│  • Include reply_to_message_id for threading              │
│  • Parse mode: HTML                                       │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│      9. SAVE MESSAGES (Database)                          │
│  • Save user message to Message_v2 table                  │
│  • Save assistant message to Message_v2 table             │
│  • Associate with Chat session                            │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  TELEGRAM   │
│    USER     │
│   Receives  │
│  response   │
└─────────────┘
```

**Telegram-Specific Features:**

1. **Friendly Personality:**
```
TELEGRAM CHAT PERSONALITY:
You are SOFIA - the Zyprus Property Group AI Assistant, but with a friendly, conversational tone suitable for Telegram messaging.

GUIDELINES:
- Be warm, friendly, and approachable in your responses
- Use emojis occasionally when appropriate (🏠💼📊💰)
- Keep paragraphs relatively short for better mobile readability
- If someone greets you, greet them back warmly
```

2. **Time-Based Typing Indicators:**
```typescript
const TYPING_INTERVAL_MS = 3000; // 3 seconds
let lastTypingIndicator = Date.now();

for await (const textPart of result.textStream) {
  fullResponse += textPart;

  const now = Date.now();
  if (now - lastTypingIndicator >= TYPING_INTERVAL_MS) {
    await telegramClient.sendChatAction({ chatId });
    lastTypingIndicator = now;
  }
}
```

3. **Message Splitting:**
```typescript
// Telegram limit: 4096 characters per message
async function sendLongMessage({ chatId, text, replyToMessageId }) {
  const chunks = splitMessage(text, 4096);
  for (const chunk of chunks) {
    await sendMessage({ chatId, text: chunk, replyToMessageId });
  }
}
```

---

## 5. Database Schema

### 5.1 Complete Entity-Relationship Diagram

See Section 3.4 for detailed ERD.

### 5.2 Schema with All Columns

**User Table:**
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(64)
);
```

**Chat Table:**
```sql
CREATE TABLE "Chat" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id),
  title TEXT NOT NULL,
  visibility VARCHAR NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  createdAt TIMESTAMP NOT NULL,
  lastContext JSONB
);

CREATE INDEX Chat_userId_createdAt_idx ON "Chat" (userId, createdAt DESC);
```

**Message_v2 Table:**
```sql
CREATE TABLE "Message_v2" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatId UUID NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL,
  parts JSON NOT NULL,
  attachments JSON NOT NULL,
  createdAt TIMESTAMP NOT NULL
);

CREATE INDEX Message_v2_chatId_createdAt_idx ON "Message_v2" (chatId, createdAt ASC);
```

**Vote_v2 Table:**
```sql
CREATE TABLE "Vote_v2" (
  chatId UUID NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  messageId UUID NOT NULL REFERENCES "Message_v2"(id) ON DELETE CASCADE,
  isUpvoted BOOLEAN NOT NULL,
  PRIMARY KEY (chatId, messageId)
);
```

**PropertyListing Table:**
```sql
CREATE TABLE "PropertyListing" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id),
  chatId UUID REFERENCES "Chat"(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address JSONB NOT NULL,
  price NUMERIC NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  numberOfRooms INTEGER NOT NULL,
  numberOfBathroomsTotal NUMERIC NOT NULL,
  floorSize NUMERIC NOT NULL,
  propertyType VARCHAR(50), -- DEPRECATED
  propertyTypeId UUID,
  locationId UUID,
  indoorFeatureIds UUID[],
  outdoorFeatureIds UUID[],
  priceModifierId UUID,
  titleDeedId UUID,
  amenityFeature JSONB, -- DEPRECATED
  image JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  zyprusListingId TEXT,
  zyprusListingUrl TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now(),
  publishedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  draftExpiresAt TIMESTAMP
);

CREATE INDEX PropertyListing_userId_idx ON "PropertyListing" (userId);
CREATE INDEX PropertyListing_status_idx ON "PropertyListing" (status);
CREATE INDEX PropertyListing_deletedAt_idx ON "PropertyListing" (deletedAt);
CREATE INDEX PropertyListing_userId_createdAt_idx ON "PropertyListing" (userId, createdAt DESC);
CREATE INDEX PropertyListing_userId_status_idx ON "PropertyListing" (userId, status);
```

**ListingUploadAttempt Table:**
```sql
CREATE TABLE "ListingUploadAttempt" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listingId UUID NOT NULL REFERENCES "PropertyListing"(id),
  attemptNumber INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  errorMessage TEXT,
  errorCode TEXT,
  apiResponse JSONB,
  attemptedAt TIMESTAMP NOT NULL DEFAULT now(),
  completedAt TIMESTAMP,
  durationMs INTEGER
);

CREATE INDEX ListingUploadAttempt_listingId_idx ON "ListingUploadAttempt" (listingId);
```

**Stream Table:**
```sql
CREATE TABLE "Stream" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatId UUID NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP NOT NULL
);
```

### 5.3 Index Strategy Details

See Section 3.4 for index strategy and performance impact.

### 5.4 CASCADE Delete Relationships

See Section 3.4 for CASCADE delete implementation and benefits.

---

## 6. API Endpoints

### 6.1 Chat API

**POST /api/chat**
- **Purpose:** Stream AI responses with tool execution
- **Authentication:** NextAuth session required
- **Rate Limit:** 100 msgs/day (guest), 10k msgs/day (regular)
- **Request Body:**
  ```json
  {
    "id": "uuid",
    "message": {
      "id": "uuid",
      "role": "user",
      "parts": [{ "type": "text", "text": "..." }]
    },
    "selectedChatModel": "chat-model",
    "selectedVisibilityType": "private"
  }
  ```
- **Response:** Server-Sent Events (SSE) stream
- **Tools:** calculators, listings, documents
- **Implementation:** `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/app/(chat)/api/chat/route.ts`

**DELETE /api/chat?id={chatId}**
- **Purpose:** Delete chat and all related messages/votes
- **Authentication:** Required (must own chat)
- **CASCADE:** Automatic deletion of messages, votes, streams

### 6.2 Listing API

**GET /api/listings**
- **Purpose:** List user's property listings
- **Authentication:** Required
- **Query Params:** `limit` (default: 10)
- **Response:** Array of listings (soft-deleted excluded)

**POST /api/listings**
- **Purpose:** Create new property listing
- **Authentication:** Required
- **Request Body:** PropertyListing schema (Zod validated)
- **Response:** Created listing with ID

**PUT /api/listings/:id**
- **Purpose:** Update listing
- **Authentication:** Required (must own listing)
- **Request Body:** Partial PropertyListing schema

**DELETE /api/listings/:id**
- **Purpose:** Soft delete listing
- **Authentication:** Required (must own listing)
- **Implementation:** Sets `deletedAt` timestamp

**POST /api/listings/:id/upload**
- **Purpose:** Queue listing for Zyprus upload
- **Authentication:** Required
- **Process:** Update status to "queued", trigger background job

### 6.3 Template API

**GET /api/templates**
- **Purpose:** List all 38 document templates
- **Authentication:** None (public metadata)
- **Response:** Array of template metadata
- **Cache:** 24h static cache

### 6.4 Telegram Webhook API

**POST /api/telegram/webhook**
- **Purpose:** Receive incoming Telegram messages
- **Authentication:** `X-Telegram-Bot-Api-Secret-Token` header
- **Request Body:** Telegram Update object
- **Response:** 200 OK (empty body)
- **Handler:** Processes message asynchronously
- **Implementation:** `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/app/api/telegram/webhook/route.ts`

### 6.5 File Upload API

**POST /api/files/upload**
- **Purpose:** Upload files to Vercel Blob
- **Authentication:** Required
- **Request Body:** FormData with file
- **Response:** File URL
- **Storage:** Vercel Blob

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌─────────────┐
│    USER     │
│  Opens app  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     1. ACCESS GATE CHECK (Middleware)                     │
│  • Check for qualia-access cookie                         │
│  • If missing: Redirect to /access                        │
│  • If present: Continue to next middleware                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     2. SESSION CHECK (NextAuth)                           │
│  • Check for next-auth.session-token cookie               │
│  • If missing: Create guest session automatically         │
│  • If present: Load user from database                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     3. RATE LIMIT CHECK (Redis)                           │
│  • Get message count in last 24h                          │
│  • Guest: 100 msgs/day, Regular: 10k msgs/day            │
│  • If exceeded: Return 429 error                          │
│  • If OK: Proceed to route handler                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     4. ROUTE HANDLER (API Endpoint)                       │
│  • Process request                                        │
│  • Return response                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    USER     │
│  Receives   │
│  response   │
└─────────────┘
```

**Access Gate Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const accessCookie = request.cookies.get("qualia-access");

  if (!accessCookie || accessCookie.value !== "granted") {
    return NextResponse.redirect(new URL("/access", request.url));
  }

  return NextResponse.next();
}
```

**Session Types:**
- **Guest:** Auto-created, 100 messages/day, no data persistence
- **Regular:** Email/password, 10,000 messages/day, full features
- **Paid:** (Planned) Unlimited messages, premium models

### 7.2 Authorization Patterns

**Resource Ownership Check:**
```typescript
// Example: Delete chat endpoint
const chat = await getChatById({ id });

if (chat?.userId !== session.user.id) {
  return new ChatSDKError("forbidden:chat").toResponse();
}

await deleteChatById({ id });
```

**Rate Limiting:**
```typescript
// Redis-backed rate limiting
const messageCount = await getMessageCountByUserId({
  id: session.user.id,
  differenceInHours: 24,
});

const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;

if (messageCount >= maxMessages) {
  return new ChatSDKError("rate_limit:chat").toResponse();
}
```

### 7.3 Data Encryption

**At Rest:**
- PostgreSQL database encrypted (Vercel managed)
- Redis encrypted (Vercel KV / Upstash managed)
- Vercel Blob encrypted (Vercel managed)

**In Transit:**
- TLS 1.3 for all HTTPS connections
- Enforced HTTPS (HTTP auto-redirects)
- Secure WebSocket connections (wss://)

**Password Security:**
```typescript
import { hashSync } from "bcrypt-ts";

export function generateHashedPassword(password: string): string {
  return hashSync(password, 10); // 10 salt rounds
}
```

**Session Management:**
```typescript
// NextAuth JWT configuration
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
jwt: {
  secret: process.env.AUTH_SECRET,
  maxAge: 30 * 24 * 60 * 60,
},
```

### 7.4 Rate Limiting Implementation

**User Type Entitlements:**

Location: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/lib/ai/entitlements.ts`

```typescript
export const entitlementsByUserType: Record<UserType, Entitlement> = {
  guest: {
    maxMessagesPerDay: 100,
    allowedModels: ["chat-model", "chat-model-gpt4o"],
  },
  regular: {
    maxMessagesPerDay: 10_000,
    allowedModels: ["chat-model", "chat-model-sonnet", "chat-model-gpt4o"],
  },
  paid: { // Planned
    maxMessagesPerDay: Infinity,
    allowedModels: ["chat-model", "chat-model-sonnet", "chat-model-gpt4o"],
  },
};
```

**Rate Limit Check:**
```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

const [stats] = await db
  .select({ count: count(message.id) })
  .from(message)
  .innerJoin(chat, eq(message.chatId, chat.id))
  .where(
    and(
      eq(chat.userId, userId),
      gte(message.createdAt, twentyFourHoursAgo),
      eq(message.role, "user")
    )
  );

return stats?.count ?? 0;
```

### 7.5 Environment Variable Management

**Critical Variables (MANDATORY):**
```bash
AI_GATEWAY_API_KEY=        # Vercel AI Gateway key (REQUIRED - no fallback)
POSTGRES_URL=              # PostgreSQL connection string
AUTH_SECRET=               # NextAuth JWT signing secret
```

**Database Variables (Auto-generated by Vercel):**
```bash
POSTGRES_URL=              # Primary connection
POSTGRES_PRISMA_URL=       # Prisma-compatible URL
POSTGRES_URL_NON_POOLING=  # Direct connection
POSTGRES_USER=             # Database user
POSTGRES_PASSWORD=         # Database password
POSTGRES_HOST=             # Database host
POSTGRES_DATABASE=         # Database name
```

**Redis Variables:**
```bash
REDIS_URL=                 # Redis connection string
UPSTASH_REDIS_REST_URL=    # Upstash REST API URL
UPSTASH_REDIS_REST_TOKEN=  # Upstash REST API token
```

**Integration Variables:**
```bash
ZYPRUS_CLIENT_ID=          # Zyprus OAuth client ID
ZYPRUS_CLIENT_SECRET=      # Zyprus OAuth client secret
ZYPRUS_API_URL=            # https://dev9.zyprus.com
ZYPRUS_SITE_URL=           # https://dev9.zyprus.com
TELEGRAM_BOT_TOKEN=        # Telegram bot token
TELEGRAM_SECRET_TOKEN=     # Webhook validation token
```

**Security Best Practices:**
- Never commit secrets to version control
- Use Vercel environment variables (encrypted at rest)
- Separate dev/staging/production environments
- Rotate secrets regularly
- Audit access to secrets

---

## 8. Performance Optimizations

### 8.1 Database Indexes (10-100x faster)

**Implementation (Migration 0011):**
```sql
-- Chat pagination (userId + createdAt DESC)
CREATE INDEX Chat_userId_createdAt_idx
ON Chat (userId, createdAt DESC);

-- Property listings (userId + createdAt DESC)
CREATE INDEX PropertyListing_userId_createdAt_idx
ON PropertyListing (userId, createdAt DESC);

-- Property filtering (userId + status)
CREATE INDEX PropertyListing_userId_status_idx
ON PropertyListing (userId, status);
```

**Performance Impact:**
- User chat list queries: 10-100x faster
- Property listing queries: 10-100x faster
- Pagination queries: 50% fewer round-trips

### 8.2 Telegram Typing Indicators (90% fewer calls)

**Before:**
```typescript
if (fullResponse.length % 500 === 0) {
  await sendChatAction({ chatId });
}
// Result: ~10-20 API calls per long response
```

**After:**
```typescript
const TYPING_INTERVAL_MS = 3000;
let lastTypingIndicator = Date.now();

if (Date.now() - lastTypingIndicator >= TYPING_INTERVAL_MS) {
  await sendChatAction({ chatId });
  lastTypingIndicator = Date.now();
}
// Result: ~1-2 API calls per long response (90% reduction)
```

**Performance Impact:**
- 90% fewer Telegram API calls
- 10-20ms faster per response
- Reduced API rate limit risk

### 8.3 System Prompt Caching (50-100ms saved)

**Implementation:**
```typescript
const loadSophiaInstructions = cache(
  async () => {
    const file = path.join(process.cwd(), "lib/ai/sofia-base-instructions.txt");
    return await fs.readFile(file, "utf-8");
  },
  ["sophia-base-prompt"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);
```

**Performance Impact:**
- 50-100ms saved per request (file I/O eliminated)
- Lower compute costs
- Cache hit rate: ~99% after warmup

### 8.4 Redis Taxonomy Cache (95% fewer API calls)

**Implementation:**
```typescript
const CACHE_KEY = "zyprus:taxonomy:v1";
const CACHE_TTL = 3600; // 1 hour

export async function getCache() {
  const cached = await kv.get(CACHE_KEY);
  if (cached) {
    const deserialized = deserializeCache(cached);
    refreshCacheInBackground();
    return deserialized;
  }

  const fresh = await fetchFromZyprusAPI();
  await kv.set(CACHE_KEY, serializeCache(fresh), { ex: CACHE_TTL });
  return fresh;
}
```

**Performance Impact:**
- 95% reduction in Zyprus API calls
- 200-500ms faster per listing operation
- Cost savings on Zyprus API usage
- Stale-while-revalidate pattern for optimal UX

### 8.5 Anthropic Prompt Caching ($2-5 saved per 1k requests)

**Implementation:**
```typescript
// Split system prompt into cacheable and dynamic parts
{
  type: "text",
  text: getBaseSystemPrompt(), // 2,442 lines cached
  cache_control: { type: "ephemeral" },
}
```

**Performance Impact:**
- $2-5 savings per 1,000 requests
- 50-70% cost reduction on Claude models
- Cache lasts 5 minutes (Anthropic spec)
- Only applies to Anthropic models (not GPT-4o)

### 8.6 Pagination Optimization (50% fewer queries)

**Before:**
```typescript
// 2 queries: lookup reference chat + get chats
const referenceChat = await db
  .select()
  .from(chat)
  .where(eq(chat.id, startingAfter));

const filteredChats = await db
  .select()
  .from(chat)
  .where(gt(chat.createdAt, referenceChat[0].createdAt));
```

**After:**
```typescript
// 1 query: subquery for reference chat timestamp
const filteredChats = await db
  .select()
  .from(chat)
  .where(
    and(
      eq(chat.userId, userId),
      gt(
        chat.createdAt,
        db.select({ createdAt: chat.createdAt })
          .from(chat)
          .where(eq(chat.id, startingAfter))
          .limit(1)
      )
    )
  );
```

**Performance Impact:**
- 50% fewer database round-trips
- 30-40% faster pagination
- Lower latency for chat list loading

### 8.7 CASCADE Deletes (75% fewer queries)

**Implementation (Migration 0012):**
```sql
ALTER TABLE Message_v2
DROP CONSTRAINT Message_v2_chatId_fkey,
ADD CONSTRAINT Message_v2_chatId_fkey
FOREIGN KEY (chatId) REFERENCES Chat(id) ON DELETE CASCADE;
```

**Performance Impact:**
- 75% fewer deletion queries (4 → 1)
- Atomic operations (no race conditions)
- Cleaner application code
- Guaranteed referential integrity

### 8.8 Enhanced Error Logging

**Implementation:**
```typescript
// Before
catch (_error) {
  throw new ChatSDKError("bad_request:database", "Failed to save chat");
}

// After
catch (error) {
  console.error("Database error in saveChat:", {
    chatId: id,
    userId,
    title,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw new ChatSDKError("bad_request:database", "Failed to save chat");
}
```

**Performance Impact:**
- Better debugging in production
- Faster issue resolution
- Context-rich error logs
- Lower MTTR (Mean Time To Repair)

### 8.9 Environment Variable Consolidation

**Before:**
- `.env.local` (development)
- `.env.telegram` (Telegram-specific)
- `.env.development.local` (duplicate)

**After:**
- `.env.local` (single source of truth)
- `.env.example` (comprehensive documentation)

**Performance Impact:**
- Better developer experience
- Clearer setup process
- Reduced confusion
- Faster onboarding

---

## 9. Deployment Architecture

### 9.1 Vercel Deployment Pipeline

```
┌─────────────┐
│    GIT      │
│   PUSH to   │
│    main     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     1. VERCEL BUILD (Automatic)                           │
│  • Detect Next.js 15 project                              │
│  • Install dependencies (pnpm install)                    │
│  • Run linter (pnpm lint)                                 │
│  • Build production bundle (pnpm build)                   │
│  • Generate optimized assets                              │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     2. DATABASE MIGRATIONS (Automatic)                    │
│  • Apply pending migrations (Drizzle)                     │
│  • Create indexes if new                                  │
│  • Update schema                                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     3. DEPLOY TO PREVIEW (Branch)                         │
│  • Unique preview URL generated                           │
│  • Test preview deployment                                │
│  • Run smoke tests                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼ (If main branch)
┌──────────────────────────────────────────────────────────┐
│     4. DEPLOY TO PRODUCTION (Main Branch)                 │
│  • Deploy to sofiatesting.vercel.app                      │
│  • Update DNS records                                     │
│  • Enable production environment variables                │
│  • Start serverless functions                             │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│     5. HEALTH CHECKS                                      │
│  • Verify app responds (200 OK)                           │
│  • Check AI Gateway connectivity                          │
│  • Test database connection                               │
│  • Monitor error rates                                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ PRODUCTION  │
│   LIVE      │
└─────────────┘
```

**Deployment Configuration:**

File: `vercel.json`
```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"], // EU region for GDPR compliance
  "functions": {
    "app/(chat)/api/chat/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 9.2 Environment Configuration

**Vercel Environment Variables:**

1. **Production:**
   - All secrets encrypted at rest
   - Auto-injected at build time
   - Separate namespace from preview/development

2. **Preview:**
   - Same as production (for testing)
   - Unique database (preview branch)
   - Separate AI Gateway quota

3. **Development:**
   - Local `.env.local` file
   - Not committed to version control
   - Separate services for testing

**Variable Precedence:**
```
System Variables (Vercel) > .env.production > .env.local > .env
```

### 9.3 Database Migrations

**Automatic Migration on Deploy:**

Location: Vercel Build Step

```bash
# Vercel automatically runs:
pnpm db:migrate
```

**Migration Process:**
1. Drizzle detects pending migrations
2. Applies migrations in order (0001, 0002, ...)
3. Updates migration tracking table
4. Continues build if successful
5. Fails build if migration errors

**Rollback Strategy:**
- Manual rollback via Vercel CLI
- Database snapshot restore (PostgreSQL)
- Previous deployment rollback (Vercel)

### 9.4 Monitoring and Logging

**Vercel Analytics:**
- Page load performance
- API route latency
- Error rates
- User geography

**Vercel Logs:**
- Real-time streaming logs
- Function invocation logs
- Build logs
- Database query logs

**Error Tracking:**
- Enhanced error logging (Task #8)
- Context-rich error messages
- Stack traces in production
- User ID tracking

**Monitoring Commands:**
```bash
# View production logs
vercel logs sofiatesting.vercel.app

# View build logs
vercel inspect <deployment-url>

# View function logs
vercel logs --follow
```

---

## 10. Code Organization

### 10.1 Directory Structure

```
/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/

app/
├── (auth)/                      # Authentication pages
│   ├── login/
│   │   └── page.tsx            # Login form with email/password
│   └── register/
│       └── page.tsx            # Registration form
│
├── (chat)/                      # Main chat interface (protected)
│   ├── api/chat/
│   │   ├── route.ts            # Main streaming AI endpoint (POST)
│   │   └── schema.ts           # Zod validation schemas
│   ├── chat/[id]/
│   │   └── page.tsx            # Individual chat session UI
│   ├── actions.ts              # Server actions (title generation)
│   └── page.tsx                # Chat list/history
│
├── api/
│   ├── listings/               # Property CRUD endpoints
│   │   ├── route.ts            # GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts        # PUT (update), DELETE (soft delete)
│   ├── telegram/
│   │   └── webhook/
│   │       └── route.ts        # Telegram webhook handler (POST)
│   ├── templates/
│   │   └── route.ts            # Template metadata (GET)
│   └── files/
│       └── upload/
│           └── route.ts        # File upload handler
│
├── properties/                 # Property management UI
│   ├── page.tsx                # Property list
│   └── [id]/
│       └── page.tsx            # Property detail/edit
│
├── layout.tsx                  # Root layout with providers
├── globals.css                 # Global styles (Tailwind)
└── page.tsx                    # Landing page

components/
├── chat/                       # Chat-specific components
│   ├── message.tsx             # Individual message renderer
│   ├── message-list.tsx        # Virtualized message list
│   ├── multimodal-input.tsx    # Text + file input
│   └── message-actions.tsx     # Copy, edit, delete
│
├── ui/                         # shadcn/ui components
│   ├── button.tsx              # Button component
│   ├── input.tsx               # Input component
│   ├── dialog.tsx              # Modal dialog
│   └── ...                     # 30+ components
│
├── artifact.tsx                # Document preview renderer
├── artifact-actions.tsx        # Document actions
├── property-form.tsx           # Property listing form
└── calculator.tsx              # Cyprus tax calculators

lib/
├── ai/
│   ├── providers.ts            # AI Gateway configuration
│   ├── prompts.ts              # System prompts (cached)
│   ├── entitlements.ts         # User quotas by type
│   ├── sofia-base-instructions.txt  # Base prompt (2,442 lines)
│   └── tools/                  # Cyprus real estate tools
│       ├── calculate-vat.ts
│       ├── calculate-transfer-fees.ts
│       ├── calculate-capital-gains.ts
│       ├── create-listing.ts
│       ├── list-listings.ts
│       ├── upload-listing.ts
│       ├── get-zyprus-data.ts
│       ├── create-document.ts
│       ├── update-document.ts
│       └── request-suggestions.ts
│
├── db/
│   ├── schema.ts               # Drizzle schema with indexes
│   ├── queries.ts              # Database operations
│   ├── utils.ts                # Password hashing, etc.
│   └── migrations/             # SQL migration files
│       ├── 0001_initial.sql
│       ├── 0011_indexes.sql
│       └── 0012_cascade.sql
│
├── telegram/
│   ├── client.ts               # Telegram API client
│   ├── message-handler.ts      # Message processing logic
│   ├── user-mapping.ts         # Telegram user → DB user
│   └── types.ts                # Telegram type definitions
│
├── zyprus/
│   ├── client.ts               # Zyprus API client (OAuth)
│   ├── taxonomy-cache.ts       # Redis cache for taxonomy
│   └── types.ts                # Zyprus type definitions
│
├── constants.ts                # Environment flags
├── errors.ts                   # Custom error classes
├── types.ts                    # Shared TypeScript types
├── utils.ts                    # Utility functions
└── usage.ts                    # Token usage types

docs/
├── ARCHITECTURE.md             # This file (comprehensive)
├── PRD.md                      # Product requirements
├── architecture/
│   └── sofia-response-consistency.md
├── guides/
│   └── deployment-ready.md
├── templates/
│   └── overview.md
└── knowledge/
    └── cyprus-real-estate-knowledge-base.md

CLAUDE.md                       # Project instructions (development)
IMPLEMENTATION_PLAN.md          # Optimization tracking (11 tasks)
package.json                    # Dependencies (pnpm)
tsconfig.json                   # TypeScript configuration
next.config.ts                  # Next.js configuration
tailwind.config.ts              # Tailwind CSS configuration
drizzle.config.ts               # Drizzle ORM configuration
.env.example                    # Environment variable template
```

### 10.2 Import Patterns

**Path Aliases:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage:**
```typescript
// Good: Absolute imports
import { auth } from "@/app/(auth)/auth";
import { getChatById } from "@/lib/db/queries";
import { systemPrompt } from "@/lib/ai/prompts";

// Bad: Relative imports (hard to refactor)
import { auth } from "../../../(auth)/auth";
```

**Server-Only Code:**
```typescript
import "server-only"; // Throws error if imported on client

// All code in this file is server-only
export async function getUser(email: string) {
  // Database query...
}
```

### 10.3 Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `message-list.tsx`)
- Routes: `route.ts` (Next.js convention)
- Actions: `actions.ts` (Next.js convention)
- Utils: `kebab-case.ts` (e.g., `taxonomy-cache.ts`)

**Functions:**
- React components: `PascalCase` (e.g., `MessageList`)
- Hooks: `camelCase` with `use` prefix (e.g., `useChat`)
- Server actions: `camelCase` (e.g., `generateTitleFromUserMessage`)
- Database queries: `camelCase` (e.g., `getChatById`)

**Types:**
- Interfaces: `PascalCase` (e.g., `ChatMessage`)
- Types: `PascalCase` (e.g., `UserType`)
- Enums: `PascalCase` (e.g., `VisibilityType`)

**Constants:**
- `SCREAMING_SNAKE_CASE` (e.g., `CACHE_TTL`)

---

## 11. Technology Stack Details

### 11.1 Runtime

**Node.js 20+**
- LTS release (Long-Term Support)
- Required for Next.js 15
- ECMAScript modules (ESM) support
- Top-level await support

### 11.2 Framework

**Next.js 15.3.0 (App Router)**

Key features used:
- App Router (file-based routing)
- React Server Components (RSC)
- Server Actions (form submissions)
- Route Handlers (API endpoints)
- Middleware (access gate, auth)
- Streaming (Suspense, SSE)
- Image Optimization (next/image)
- Font Optimization (next/font)

Configuration: `next.config.ts`
```typescript
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    domains: ["vercel.com"],
  },
};
```

### 11.3 UI Components

**React 19.0 RC**
- Concurrent Rendering
- Suspense for data fetching
- use() hook for async data
- Server Components
- Actions (useFormState, useFormStatus)

**Tailwind CSS 4.0**
- Utility-first styling
- CSS variables for theming
- Dark mode support (next-themes)
- Responsive design (mobile-first)
- Custom plugins: tailwindcss-animate, @tailwindcss/typography

**shadcn/ui**
- Accessible component library (Radix UI)
- Customizable (copy/paste components)
- TypeScript support
- 30+ components used

**Icons:**
- Radix UI Icons (for UI elements)
- Lucide React (for content)

**Code Editor:**
- CodeMirror 6 (for document preview)

**Animations:**
- Framer Motion 11 (for UI animations)

**Forms:**
- React Hook Form 7 (form state management)
- Zod (validation schemas)

### 11.4 Backend

**API Routes:**
- Next.js API routes (serverless functions)
- Route handlers (app/api/)
- Server actions (app/(chat)/actions.ts)

**Streaming:**
- Server-Sent Events (SSE)
- JsonToSseTransformStream (Vercel AI SDK)
- Streaming responses for AI

**Authentication:**
- NextAuth.js 5.0 Beta
- JWT sessions (30-day expiration)
- Credentials provider (email/password)
- Guest auto-login

### 11.5 AI & ML

**Vercel AI SDK 5.0**
- MANDATORY: No fallback options
- Unified access to multiple models
- Streaming support
- Tool execution framework
- Token tracking

**AI Gateway:**
```typescript
import { gateway } from "@ai-sdk/gateway";

const model = gateway("anthropic/claude-haiku-4.5");
```

**Models:**
- Claude 4.5 Haiku (default): $1.00/M input, $5.00/M output
- Claude 4.5 Sonnet (premium): $3.00/M input, $15.00/M output
- GPT-4o Mini (budget): $0.15/M input, $0.60/M output

**Token Tracking:**
- tokenlens library
- ModelCatalog fetched daily (cached)
- Usage enrichment (getUsage helper)
- Cost tracking per model

### 11.6 Data

**PostgreSQL (Vercel Postgres)**
- Managed database service
- Connection pooling
- Automatic backups
- 7 tables, 12 migrations

**Drizzle ORM 0.34**
- Type-safe database queries
- Migration system
- TypeScript-first
- Schema-to-types generation

**Drizzle Kit 0.25**
- Migration generator (pnpm db:generate)
- Migration runner (pnpm db:migrate)
- Studio GUI (pnpm db:studio)

**Redis (Vercel KV / Upstash)**
- Managed Redis service
- Used for caching (taxonomy)
- Used for rate limiting
- Used for sessions

### 11.7 External

**Zyprus Property API**
- OAuth 2.0 authentication
- REST API
- JSON responses
- Rate limits: 100 req/min

**Telegram Bot API**
- Webhook-based
- Secret token validation
- Message limits: 30 msg/sec

**Vercel Blob**
- File storage service
- S3-compatible
- CDN-backed
- 50 MB file limit

### 11.8 Development Tools

**Package Manager:**
- pnpm 9.12 (fast, disk-efficient)

**Linting:**
- Ultracite 5.3 (auto-fixes common issues)

**Testing:**
- Playwright 1.50 (E2E tests)
- Vitest (unit tests)
- Node.js built-in test runner

**Type Checking:**
- TypeScript 5.6 (strict mode)

**Build Tools:**
- Turbopack (Next.js 15 dev server)
- Webpack 5 (production builds)

---

## 12. Key Design Patterns

### 12.1 Server-Sent Events (SSE) for Streaming

**Pattern:**
```typescript
// Server: Stream AI response
const stream = createUIMessageStream({
  execute: ({ writer: dataStream }) => {
    const result = streamText({ /* ... */ });
    result.consumeStream();
    dataStream.merge(result.toUIMessageStream());
  },
});

return new Response(
  stream.pipeThrough(new JsonToSseTransformStream())
);

// Client: Consume SSE stream
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify(requestBody),
});

const reader = response.body.getReader();
for await (const chunk of reader) {
  // Process streamed data
}
```

**Benefits:**
- Progressive disclosure of AI responses
- Better perceived performance
- Lower latency (first byte faster)
- Real-time updates

### 12.2 Optimistic UI Updates

**Pattern:**
```typescript
const { optimisticState, setOptimisticState } = useOptimistic(state);

// Immediately update UI
setOptimisticState(newValue);

// Submit to server
await fetch("/api/update", { body: newValue });

// Server response confirms or reverts
```

**Benefits:**
- Instant feedback
- Better UX
- Lower perceived latency

### 12.3 Stale-While-Revalidate Caching

**Pattern:**
```typescript
// Return stale data immediately
const cached = await kv.get(CACHE_KEY);
if (cached) {
  // Refresh in background
  refreshCacheInBackground();
  return cached;
}

// Cache miss: fetch and store
const fresh = await fetchFromAPI();
await kv.set(CACHE_KEY, fresh, { ex: CACHE_TTL });
return fresh;
```

**Benefits:**
- Zero latency on cache hits
- Always fresh data (eventually)
- Better UX than cache-then-network

### 12.4 Tool-Calling Pattern for AI

**Pattern:**
```typescript
// Define tool with Zod schema
export const calculateVATTool = {
  description: "Calculate Cyprus property VAT",
  parameters: z.object({
    propertyValue: z.number(),
    propertyType: z.enum(["house", "apartment", "land"]),
  }),
  execute: async ({ propertyValue, propertyType }) => {
    // Calculate VAT
    return { vat, breakdown };
  },
};

// Register tool with AI
const result = streamText({
  model: myProvider.languageModel("chat-model"),
  tools: { calculateVAT: calculateVATTool },
  experimental_activeTools: ["calculateVAT"],
});
```

**Benefits:**
- Type-safe tool parameters
- Automatic validation
- AI can invoke tools autonomously
- Streaming results to client

### 12.5 Soft Delete Pattern for Data

**Pattern:**
```sql
-- Schema
CREATE TABLE PropertyListing (
  id UUID PRIMARY KEY,
  ...
  deletedAt TIMESTAMP
);

-- Queries always check deletedAt
SELECT * FROM PropertyListing
WHERE userId = ? AND deletedAt IS NULL;

-- Soft delete
UPDATE PropertyListing SET deletedAt = now() WHERE id = ?;

-- Hard delete (cron job after 90 days)
DELETE FROM PropertyListing WHERE deletedAt < now() - INTERVAL '90 days';
```

**Benefits:**
- 90-day recovery window
- No accidental data loss
- Audit trails
- Compliance (GDPR)

### 12.6 OAuth 2.0 for External APIs

**Pattern:**
```typescript
// Fetch access token (client credentials flow)
const tokenResponse = await fetch(`${API_URL}/oauth/token`, {
  method: "POST",
  body: JSON.stringify({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});

const { access_token, expires_in } = await tokenResponse.json();

// Use access token for API calls
const apiResponse = await fetch(`${API_URL}/api/resource`, {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
});
```

**Benefits:**
- Secure authentication
- Token expiration and refresh
- Standard protocol

---

## 13. Scalability Considerations

### 13.1 Horizontal Scaling on Vercel

**Automatic Scaling:**
- Serverless functions auto-scale to demand
- No configuration required
- Zero cold starts (Vercel Edge Functions)
- Global CDN for static assets

**Limits:**
- 100 concurrent executions (default)
- 10s max function duration (default)
- 60s max for streaming endpoints (configured)

**Scaling Strategy:**
- Vertical: Upgrade Vercel plan for higher limits
- Horizontal: Automatic (Vercel handles)

### 13.2 Database Connection Pooling

**Implementation:**
```typescript
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

// Use Vercel Postgres connection pooler
const db = drizzle(sql);
```

**Benefits:**
- Prevents connection exhaustion
- Handles 200+ concurrent users
- Automatic connection lifecycle
- Managed by Vercel

**Limits:**
- Max connections: 100 (Vercel Postgres Hobby)
- Upgrade to Pro for unlimited connections

### 13.3 Redis Caching Strategy

**Cache Types:**

1. **Taxonomy Cache (Redis):**
   - TTL: 1 hour
   - Stale-while-revalidate
   - 95% hit rate target

2. **System Prompt Cache (Next.js):**
   - TTL: 24 hours
   - Revalidate on demand
   - 99% hit rate target

3. **Anthropic Prompt Cache:**
   - TTL: 5 minutes (Anthropic-managed)
   - 50%+ hit rate target

**Cache Invalidation:**
- Time-based (TTL)
- On-demand (manual invalidation)
- Stale-while-revalidate (background refresh)

### 13.4 AI Gateway Rate Limits

**Limits:**
- Per-model limits (Anthropic, OpenAI)
- Per-project limits (Vercel AI Gateway)
- Automatic retry with backoff

**Handling:**
```typescript
// Vercel AI SDK handles retries automatically
const result = streamText({
  model: myProvider.languageModel("chat-model"),
  maxRetries: 3,
  // ...
});
```

**Monitoring:**
- Vercel AI Gateway dashboard
- Real-time usage tracking
- Cost alerts

### 13.5 Cost Optimization Strategies

**Optimization Impact:**

| Optimization | Cost Savings | Implementation |
|--------------|--------------|----------------|
| Claude Haiku default | 80% vs Sonnet | Default model |
| Prompt caching | 50-70% | Anthropic cache |
| Redis taxonomy cache | 95% API calls | Task #4 |
| Telegram typing indicators | 90% API calls | Task #2 |
| System prompt caching | Lower compute | Task #3 |

**Total Savings:**
- AI costs: 50-70% reduction
- External API costs: 95% reduction
- Database costs: Stable (optimized queries)
- Total infrastructure: <$300/month (50 users)

---

## 14. Future Architecture Enhancements

### 14.1 Paid Membership Tier Integration

**Planned Features:**
- Unlimited messages per day
- Access to Claude Sonnet 4.5 (premium)
- Priority queue for Zyprus uploads
- Advanced analytics dashboard
- Bulk document generation
- API access for integrations

**Technical Requirements:**
- Add `paid` user type to schema
- Database table: `subscription` (userId, tier, status, dates)
- Billing integration: Stripe or Paddle
- Subscription management UI
- Webhook handler for subscription events
- Update rate limiting to check tier

**Timeline:**
- Weeks 4-6 (after core optimizations)
- Requires product decision on pricing

### 14.2 Multi-Language Support

**Languages:**
- Greek (primary for Cyprus market)
- English (current)
- Russian (secondary market)

**Implementation:**
- Next.js i18n routing
- Translation files for UI (react-i18next)
- Template translations (38 templates × 3 languages)
- Language detection from browser
- User preference setting
- AI model language selection

**Challenges:**
- 38 templates × 3 languages = 114 documents
- Maintain consistency across translations
- Cyprus legal compliance in Greek

### 14.3 Analytics Pipeline

**Metrics to Track:**
- Documents generated (by type, by user)
- Average generation time
- AI model usage and costs
- User engagement (messages per session)
- Listing upload success rate
- Error rates by category
- User satisfaction scores

**Visualizations:**
- Time-series charts (daily, weekly, monthly)
- Document type distribution (pie chart)
- User activity heatmap
- Cost breakdown by model
- Performance trends

**Access Control:**
- Admin-only access
- Role-based permissions
- Exportable reports (CSV, PDF)

**Implementation:**
- PostgreSQL aggregations
- Next.js dashboard (React + Recharts)
- Real-time updates (SSE)

### 14.4 Mobile App Architecture

**Platform:**
- React Native (iOS + Android)
- Shared codebase with web (TypeScript)
- Native modules for platform-specific features

**Features:**
- Full chat interface
- Document generation
- Calculator tools
- Property listing management
- Push notifications for upload status
- Offline mode for viewing history

**API:**
- Same Next.js API endpoints
- JWT authentication
- Mobile-specific rate limits

**Rationale:**
- Agents need mobile access during property viewings
- Faster than responsive web on mobile
- Push notifications improve engagement

---

## Appendix A: Migration History

### Database Migrations (0001-0012)

**0001 - Initial Schema:**
- Created User, Chat, Message, Vote tables
- Basic indexes

**0002-0010 - Features:**
- Added PropertyListing table
- Added ListingUploadAttempt table
- Added Stream table
- Added Document, Suggestion tables
- Added soft delete columns

**0011 - Performance Indexes (Task #1):**
```sql
-- Composite indexes for pagination
CREATE INDEX Chat_userId_createdAt_idx
ON Chat (userId, createdAt DESC);

CREATE INDEX PropertyListing_userId_createdAt_idx
ON PropertyListing (userId, createdAt DESC);

CREATE INDEX PropertyListing_userId_status_idx
ON PropertyListing (userId, status);
```

**Performance Impact:**
- User chat list queries: 10-100x faster
- Property listing queries: 10-100x faster

**0012 - CASCADE Deletes (Task #7):**
```sql
-- Add CASCADE to foreign key constraints
ALTER TABLE Message_v2
DROP CONSTRAINT Message_v2_chatId_fkey,
ADD CONSTRAINT Message_v2_chatId_fkey
FOREIGN KEY (chatId) REFERENCES Chat(id) ON DELETE CASCADE;

ALTER TABLE Vote_v2
DROP CONSTRAINT Vote_v2_chatId_fkey,
ADD CONSTRAINT Vote_v2_chatId_fkey
FOREIGN KEY (chatId) REFERENCES Chat(id) ON DELETE CASCADE;

ALTER TABLE Stream
DROP CONSTRAINT Stream_chatId_fkey,
ADD CONSTRAINT Stream_chatId_fkey
FOREIGN KEY (chatId) REFERENCES Chat(id) ON DELETE CASCADE;
```

**Performance Impact:**
- 75% fewer deletion queries (4 → 1)
- Atomic operations (no race conditions)

### Key Schema Changes

**Before Migration 0011:**
- No composite indexes
- Slow pagination queries
- Full table scans

**After Migration 0011:**
- Composite indexes: (userId, createdAt DESC)
- Indexed pagination: 10-100x faster
- Query planner uses indexes

**Before Migration 0012:**
- Manual CASCADE deletes (4+ queries)
- Race condition risk
- Complex application code

**After Migration 0012:**
- Database CASCADE deletes (1 query)
- Atomic operations
- Simplified application code

---

## Appendix B: Environment Variables

### Complete List with Descriptions

**Critical (MANDATORY):**
```bash
# Vercel AI Gateway API key
# REQUIRED: Application will not start without this
# No fallback options exist
AI_GATEWAY_API_KEY=ag_1234567890abcdef

# PostgreSQL connection string
# Auto-generated by Vercel
POSTGRES_URL=postgresql://user:pass@host:5432/db?sslmode=require

# NextAuth JWT signing secret
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_random_32_char_secret
```

**Database (Auto-generated by Vercel):**
```bash
# Primary connection (pooled)
POSTGRES_URL=postgresql://...

# Prisma-compatible URL
POSTGRES_PRISMA_URL=postgresql://...?pgbouncer=true

# Direct connection (non-pooled)
POSTGRES_URL_NON_POOLING=postgresql://...

# Individual components
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_HOST=hostname.vercel-storage.com
POSTGRES_DATABASE=verceldb
```

**Redis (Caching & Rate Limiting):**
```bash
# Redis connection string
# Auto-generated by Vercel KV
REDIS_URL=redis://...

# Upstash REST API URL
UPSTASH_REDIS_REST_URL=https://...

# Upstash REST API token
UPSTASH_REDIS_REST_TOKEN=...
```

**Integrations:**
```bash
# Zyprus OAuth credentials
ZYPRUS_CLIENT_ID=your_client_id
ZYPRUS_CLIENT_SECRET=your_client_secret
ZYPRUS_API_URL=https://dev9.zyprus.com
ZYPRUS_SITE_URL=https://dev9.zyprus.com

# Telegram bot credentials
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_SECRET_TOKEN=your_webhook_secret_token
```

**Storage:**
```bash
# Vercel Blob storage token
# Auto-generated by Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Security:**
```bash
# Access gate password
# Used for qualia-access cookie
ACCESS_CODE=your_access_code_here
```

### Security Classification

**Public (can be committed):**
- None (all environment variables are secrets)

**Secret (must be in environment variables):**
- All variables above
- Never commit to version control
- Use Vercel environment variables (encrypted at rest)

**Auto-generated by Vercel:**
- POSTGRES_* (all database variables)
- REDIS_URL, UPSTASH_* (Redis variables)
- BLOB_READ_WRITE_TOKEN (Blob storage)

### Setup Instructions

**1. Vercel AI Gateway:**
```bash
# Sign up at https://vercel.com/ai-gateway
# Create new AI Gateway project
# Copy API key to AI_GATEWAY_API_KEY
```

**2. PostgreSQL:**
```bash
# Automatically configured by Vercel
# Create database: Vercel dashboard → Storage → PostgreSQL
# Environment variables auto-injected
```

**3. Redis:**
```bash
# Automatically configured by Vercel KV
# Create KV store: Vercel dashboard → Storage → KV
# Environment variables auto-injected
```

**4. Zyprus API:**
```bash
# Contact Zyprus for OAuth credentials
# Register your application
# Set ZYPRUS_CLIENT_ID and ZYPRUS_CLIENT_SECRET
```

**5. Telegram Bot:**
```bash
# Create bot: Message @BotFather on Telegram
# Get bot token: /newbot command
# Set TELEGRAM_BOT_TOKEN
# Generate webhook secret: openssl rand -hex 32
# Set TELEGRAM_SECRET_TOKEN
```

**6. NextAuth:**
```bash
# Generate secret: openssl rand -base64 32
# Set AUTH_SECRET
```

**7. Access Gate:**
```bash
# Choose access code password
# Set ACCESS_CODE
```

---

## Appendix C: Third-Party Dependencies

### Key npm Packages and Versions

**Core:**
- `next@15.3.0` - React framework
- `react@19.0.0-rc` - UI library
- `react-dom@19.0.0-rc` - React renderer
- `typescript@5.6` - Type checking

**AI & ML:**
- `ai@5.0` - Vercel AI SDK
- `@ai-sdk/gateway@1.0` - AI Gateway integration
- `tokenlens@^1.0` - Token tracking

**Database:**
- `drizzle-orm@0.34` - ORM
- `drizzle-kit@0.25` - Migration tool
- `@vercel/postgres@0.10` - PostgreSQL client
- `postgres@3.4` - PostgreSQL driver

**Caching:**
- `@vercel/kv@3.0` - Redis (Vercel KV)
- `@upstash/ratelimit@2.0` - Rate limiting

**Authentication:**
- `next-auth@5.0.0-beta.25` - Authentication
- `bcrypt-ts@5.0` - Password hashing

**UI:**
- `tailwindcss@4.0` - CSS framework
- `@tailwindcss/postcss@4.0` - PostCSS plugin
- `tailwindcss-animate@1.0` - Tailwind animations
- `@tailwindcss/typography@0.5` - Typography plugin
- `framer-motion@11.0` - Animations
- `@radix-ui/react-*@1.1` - Accessible components (30+ packages)
- `lucide-react@0.460` - Icons

**Code Editor:**
- `@uiw/react-codemirror@4.23` - CodeMirror React wrapper
- `codemirror@6.0` - Code editor

**Forms:**
- `react-hook-form@7.54` - Form state management
- `zod@3.24` - Validation schemas

**Utilities:**
- `nanoid@5.0` - ID generation
- `date-fns@4.1` - Date utilities
- `swr@2.2` - Data fetching
- `zustand@5.0` - State management

**Development:**
- `ultracite@5.3` - Linter
- `@playwright/test@1.50` - E2E testing
- `vitest@2.1` - Unit testing

### Licensing Information

**MIT License (Permissive):**
- Most packages (Next.js, React, Tailwind CSS, etc.)
- Free for commercial use
- No attribution required

**Apache 2.0:**
- Some Radix UI packages
- Free for commercial use
- Patent grant

**ISC:**
- Some utility packages
- Similar to MIT

**No Proprietary Dependencies:**
- All dependencies are open source
- No vendor lock-in (except Vercel services)

### Version Pinning Strategy

**Exact Versions:**
- Core packages (Next.js, React, TypeScript)
- Ensures build reproducibility

**Caret Versions (^):**
- Utility packages (date-fns, nanoid)
- Allows patch updates

**Tilde Versions (~):**
- Not used (prefer exact or caret)

**Update Strategy:**
- Monthly dependency updates
- Security patches immediately
- Major versions after testing

---

**End of Architecture Documentation**

---

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Next Review:** December 14, 2025
**Owner:** Qualia Solutions (Software Architect)
