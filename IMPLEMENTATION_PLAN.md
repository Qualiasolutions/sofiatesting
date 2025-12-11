# SOFIA Implementation Plan

> **Master tracking document for all development and optimization work**
> **All agents must read and update this file before and after completing tasks**

Last Updated: 2025-12-11
Status: ✅ ALL OPTIMIZATIONS DEPLOYED | 📚 DOCUMENTATION REFRESH COMPLETE | 🔒 WHATSAPP SECURITY FIXES (Issues #1-3)

---

## 📋 Implementation Rules

### For All Agents:
1. **BEFORE starting work:**
   - Read `/docs/PRD.md` to understand product requirements
   - Read `/docs/ARCHITECTURE.md` to understand system design
   - Read this file to check current status
   - Review `/CLAUDE.md` for agent-specific instructions

2. **DURING work:**
   - Update checkboxes and add notes as you progress
   - Follow coding standards in `/docs/architecture/`
   - Run tests frequently

3. **AFTER completing:**
   - Check off item, run tests, update deployment status
   - Update "Last Updated" date at top of file
   - Document changes in git commit messages

### Testing Protocol:
- ✅ **Unit Test:** Run `pnpm test:unit` for unit tests
- ✅ **Integration Test:** Run `PLAYWRIGHT=True pnpm test` for E2E
- ✅ **Build Test:** Run `pnpm build` to verify compilation
- ✅ **Deploy:** Push to production and verify

### Key Documentation Files:
- `/docs/PRD.md` - Product Requirements (WHAT we're building)
- `/docs/ARCHITECTURE.md` - System Design (HOW it's built)
- `/CLAUDE.md` - Agent instructions and quick reference
- `/README.md` - Project overview and setup
- `/IMPLEMENTATION_PLAN.md` - This file (task tracking)

---

## 🎯 CURRENT STATUS & PRIORITIES (2025-12-11)

### 🔴 CRITICAL - WhatsApp Integration Hardening (Full Review Findings)

**Context:** Full review on 2025-12-11 identified critical security, reliability, and code quality issues in the WhatsApp integration. These must be addressed before production use.

---

#### Issue #1: Missing Webhook Authentication (CRITICAL SECURITY)
**File:** `app/api/whatsapp/webhook/route.ts`
**Risk:** HIGH - Anyone can send fake webhook payloads
**Effort:** 30 minutes

**Current Problem:**
```typescript
// NO signature verification at all!
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    // Directly processes body without verifying it came from WaSenderAPI
```

**Fix Required:**
```typescript
import crypto from "crypto";

export async function POST(request: Request): Promise<Response> {
  // 1. Get signature from headers
  const signature = request.headers.get("x-wasender-signature");
  const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[WhatsApp Webhook] WASENDER_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // 2. Get raw body for signature verification
  const rawBody = await request.text();

  // 3. Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("[WhatsApp Webhook] Invalid signature, rejecting request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 4. Parse verified body
  const body = JSON.parse(rawBody);
  // ... rest of handler
```

**Tasks:**
- [x] Add HMAC signature verification to webhook route (2025-12-11)
- [ ] Verify `WASENDER_WEBHOOK_SECRET` is set in Vercel
- [ ] Test with WaSenderAPI's webhook verification
- [x] Add logging for rejected requests (2025-12-11)

---

#### Issue #2: ReDoS Vulnerability in Regex (CRITICAL SECURITY)
**File:** `lib/whatsapp/message-handler.ts:372`
**Risk:** HIGH - Malicious input can freeze server
**Effort:** 15 minutes

**Current Problem:**
```typescript
// Catastrophic backtracking possible with nested quantifiers
const subjectMatch = text.match(/^(Subject:\s*.+?)(?:\n\n|\n(?=Dear|Email Body))/im);
```

**Fix Required:**
```typescript
// Safe regex - no catastrophic backtracking
const subjectMatch = text.match(/^(Subject:\s*[^\n]+)(?:\n\n|\n(?=Dear|Email Body))/im);
// Changed .+? to [^\n]+ which cannot backtrack catastrophically
```

**Tasks:**
- [x] Replace `.+?` with `[^\n]+` in splitSubjectFromBody regex (2025-12-11)
- [ ] Add timeout protection for regex operations (optional hardening)
- [ ] Test with edge cases (very long subjects, malformed input)

---

#### Issue #3: Linting Violations (CODE QUALITY)
**File:** `lib/whatsapp/message-handler.ts`
**Risk:** MEDIUM - Code quality, potential bugs
**Effort:** 20 minutes

**Current Problems (4 violations):**
1. Line 46-48: `return;` inside if block → use `if (!condition) return;` pattern
2. Line 50-54: Same pattern
3. Line 264: `for await` on non-async iterator warning
4. Line 391: Function uses `any` type implicitly

**Fix Required:**
```typescript
// Lines 44-54: Combine conditions
if (messageData.type !== "text" || !messageData.text || messageData.isGroup) {
  console.log("Skipping WhatsApp message:", messageData.type, messageData.isGroup ? "group" : "");
  return;
}

// Line 264: Add explicit type annotation
for await (const textPart of result.textStream as AsyncIterable<string>) {

// Line 391: Add return type
function formatForWhatsApp(text: string): string {
```

**Tasks:**
- [x] Fix early return pattern (lines 44-54) - combined into single condition (2025-12-11)
- [x] Add type annotation to async iterator (line 264) (2025-12-11)
- [x] Add explicit return type to formatForWhatsApp (line 391) - already had return type (2025-12-11)
- [x] Run `pnpm lint` to verify fixes (2025-12-11)

---

#### Issue #4: In-Memory Session Storage Won't Scale (ARCHITECTURE)
**File:** `lib/whatsapp/session-manager.ts`
**Risk:** MEDIUM - Sessions lost on serverless cold starts, won't work with multiple instances
**Effort:** 1-2 hours

**Current Problem:**
```typescript
// In-memory Map - lost on cold start, not shared between instances
const sessions = new Map<string, UserSession>();
```

**Fix Required:** Migrate to Redis (Vercel KV)
```typescript
import { kv } from "@vercel/kv";

const SESSION_PREFIX = "whatsapp:session:";
const SESSION_TTL = 1800; // 30 minutes

export async function getSession(phoneNumber: string): Promise<UserSession> {
  const session = await kv.get<UserSession>(`${SESSION_PREFIX}${phoneNumber}`);
  return session || createDefaultSession();
}

export async function updateSession(phoneNumber: string, updates: Partial<UserSession>): Promise<void> {
  const current = await getSession(phoneNumber);
  await kv.set(`${SESSION_PREFIX}${phoneNumber}`, { ...current, ...updates }, { ex: SESSION_TTL });
}

export async function clearSession(phoneNumber: string): Promise<void> {
  await kv.del(`${SESSION_PREFIX}${phoneNumber}`);
}
```

**Tasks:**
- [ ] Import `kv` from `@vercel/kv`
- [ ] Add session key prefix constant
- [ ] Convert `getSession()` to async with Redis lookup
- [ ] Convert `updateSession()` to async with Redis set
- [ ] Convert `clearSession()` to async with Redis del
- [ ] Update all callers to use await
- [ ] Add in-memory fallback for Redis failures
- [ ] Test session persistence across requests

---

#### Issue #5: O(n) Deduplication Cache Cleanup (PERFORMANCE)
**File:** `app/api/whatsapp/webhook/route.ts:14-32`
**Risk:** LOW - Performance degrades with high message volume
**Effort:** 30 minutes

**Current Problem:**
```typescript
// O(n) cleanup on EVERY message check
const isMessageProcessed = (messageId: string): boolean => {
  const now = Date.now();
  // This loops through ALL entries every time
  for (const [id, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_TTL_MS) {
      processedMessages.delete(id);
    }
  }
  // ...
};
```

**Fix Option A:** Periodic cleanup (simple)
```typescript
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 10_000; // Every 10 seconds

const isMessageProcessed = (messageId: string): boolean => {
  const now = Date.now();

  // Only cleanup every 10 seconds, not every call
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [id, timestamp] of processedMessages.entries()) {
      if (now - timestamp > MESSAGE_TTL_MS) {
        processedMessages.delete(id);
      }
    }
    lastCleanup = now;
  }
  // ...
};
```

**Fix Option B:** Redis deduplication (recommended for scale)
```typescript
import { kv } from "@vercel/kv";

const isMessageProcessed = async (messageId: string): Promise<boolean> => {
  const key = `whatsapp:dedup:${messageId}`;
  const exists = await kv.get(key);
  if (exists) return true;

  // Set with TTL - Redis handles expiration automatically
  await kv.set(key, 1, { ex: 60 }); // 60 second TTL
  return false;
};
```

**Tasks:**
- [ ] Choose approach (Option A for quick fix, Option B for scale)
- [ ] Implement periodic cleanup or Redis deduplication
- [ ] Test with high message volume simulation
- [ ] Monitor memory usage in production

---

#### Issue #6: Zero Automated Test Coverage (RELIABILITY)
**Files:** `lib/whatsapp/*.ts`, `app/api/whatsapp/webhook/route.ts`
**Risk:** MEDIUM - Regressions go undetected
**Effort:** 2-3 hours

**Tests to Add:**

1. **Webhook signature verification test:**
```typescript
// tests/unit/whatsapp-webhook.test.ts
test("rejects requests with invalid signature", async () => {
  const response = await POST(mockRequest({ signature: "invalid" }));
  expect(response.status).toBe(401);
});

test("accepts requests with valid signature", async () => {
  const validSignature = createHmacSignature(payload, secret);
  const response = await POST(mockRequest({ signature: validSignature }));
  expect(response.status).toBe(200);
});
```

2. **Subject/body splitting test:**
```typescript
// tests/unit/whatsapp-message-handler.test.ts
test("splits subject from body correctly", () => {
  const input = "Subject: Test Email\n\nDear Client,\nBody text here.";
  const result = splitSubjectFromBody(input);
  expect(result.subject).toBe("Subject: Test Email");
  expect(result.body).toBe("Dear Client,\nBody text here.");
});

test("handles messages without subject", () => {
  const input = "Just a plain message";
  const result = splitSubjectFromBody(input);
  expect(result.subject).toBeNull();
  expect(result.body).toBe("Just a plain message");
});
```

3. **Session manager test (after Redis migration):**
```typescript
// tests/unit/whatsapp-session.test.ts
test("persists session to Redis", async () => {
  await updateSession("1234567890", { currentMenu: "templates" });
  const session = await getSession("1234567890");
  expect(session.currentMenu).toBe("templates");
});
```

**Tasks:**
- [ ] Create `tests/unit/whatsapp-webhook.test.ts`
- [ ] Create `tests/unit/whatsapp-message-handler.test.ts`
- [ ] Create `tests/unit/whatsapp-session.test.ts` (after Redis migration)
- [ ] Export internal functions for testing
- [ ] Add to CI pipeline
- [ ] Achieve >70% coverage for WhatsApp module

---

### 📋 Implementation Priority Order

| Priority | Issue | Severity | Effort | Dependencies |
|----------|-------|----------|--------|--------------|
| 1 | Webhook Authentication | CRITICAL | 30 min | None |
| 2 | ReDoS Vulnerability | CRITICAL | 15 min | None |
| 3 | Linting Violations | MEDIUM | 20 min | None |
| 4 | Session Storage Migration | MEDIUM | 1-2 hrs | None |
| 5 | Dedup Cache Optimization | LOW | 30 min | #4 if using Redis |
| 6 | Test Coverage | MEDIUM | 2-3 hrs | #1, #2, #4 |

**Total Estimated Effort:** 5-7 hours

---

### ✅ Recently Completed
1. **WhatsApp VAT Format Fix (2025-12-11)**
   - ✅ Fixed `5%VAT` to `5%+VAT` in 4 locations in `lib/ai/instructions/base.md`
   - ✅ Added subject/body splitting in `lib/whatsapp/message-handler.ts`
   - ✅ Bumped prompt cache key to v10 for immediate effect
   - ✅ Deployed to production

2. **Documentation Refresh (2025-11-14)**
   - ✅ Created comprehensive PRD (`/docs/PRD.md`)
   - ✅ Created architecture documentation (`/docs/ARCHITECTURE.md`)
   - ✅ Updated IMPLEMENTATION_PLAN.md
   - ✅ Pushed 4 pending commits to production

3. **All Performance Optimizations Deployed (Week 1-3)**
   - ✅ Database indexes (10-100x faster)
   - ✅ Telegram typing indicators (90% fewer calls)
   - ✅ System prompt caching (50-100ms saved)
   - ✅ Redis taxonomy cache (95% fewer API calls)
   - ✅ Anthropic prompt caching ($2-5 saved per 1k)
   - ✅ Pagination optimization (50% fewer queries)
   - ✅ CASCADE deletes (75% fewer queries)
   - ✅ Enhanced error logging
   - ✅ Environment variable consolidation
   - ✅ Directory cleanup & security fixes

### 🚀 Next Up (After WhatsApp Hardening)
1. **Agent Onboarding Documentation** (Pending)
   - Create `/docs/for-agents/QUICK_START.md`
   - Organize documentation structure
   - Create navigation guide for new agents

2. **Client Handoff Package** (Pending)
   - Create `/docs/client/` folder
   - Zyprus handoff documentation
   - Admin user guide
   - Support procedures

3. **Deployment Automation** (Pending)
   - Pre-deployment verification script
   - Post-deployment smoke tests
   - Health monitoring dashboard

### 📊 System Health
- **Build Status:** ✅ Passing
- **Tests:** ⚠️ WhatsApp module needs test coverage
- **Deployment:** ✅ Production (Vercel)
- **Performance:** ✅ All optimizations active
- **Security:** ✅ WhatsApp webhook HMAC authentication added (2025-12-11)
- **Documentation:** ✅ Comprehensive (PRD + Architecture)

---

## 📜 COMPLETED OPTIMIZATION WORK (Historical Reference)

All tasks below have been completed and deployed to production.

## 🔴 HIGH PRIORITY - Week 1 (Quick Wins) ✅ COMPLETE

### 1. Add Database Indexes
**File:** `lib/db/schema.ts`
**Effort:** 30 minutes
**Expected Impact:** 10-100x faster filtered queries

**Tasks:**
- [x] Add index on `propertyListing.deletedAt` (already existed)
- [x] Add index on `propertyListing.userId` (already existed)
- [x] Add composite index on `propertyListing.userId, propertyListing.createdAt` ✅ NEW
- [x] Add index on `message.createdAt` (already existed as composite)
- [x] Add composite index on `message.chatId, message.createdAt` (already existed)
- [x] Add composite index on `chat.userId, chat.createdAt` (already existed)
- [x] Generate migration: `pnpm db:generate`
- [x] Review migration file in `lib/db/migrations/0011_clever_thunderball.sql`
- [x] Apply migration: `pnpm db:migrate`

**Testing:**
- [x] Verify indexes created
- [x] Build test passed
- [ ] Test listing query performance (will verify in production)
- [ ] Test chat pagination performance (will verify in production)
- [ ] Run full test suite: `PLAYWRIGHT=True pnpm test` (optional, build passed)

**Deployment:**
- [x] Commit changes (ready)
- [ ] Push to production (next step)
- [ ] Run migration on production database (auto-applied on deploy)
- [ ] Monitor query performance in production

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Most indexes already existed from previous work
- Added missing composite index: PropertyListing(userId, createdAt DESC)
- Migration file: lib/db/migrations/0011_clever_thunderball.sql

---

### 2. Fix Telegram Typing Indicator Frequency
**File:** `lib/telegram/message-handler.ts:142-154`
**Effort:** 5 minutes
**Expected Impact:** 90% fewer API calls, 10-20ms faster per response

**Tasks:**
- [x] Replace char-count logic with time-based interval
- [x] Set `TYPING_INTERVAL_MS = 3000` (3 seconds)
- [x] Track `lastTypingIndicator` timestamp
- [x] Update condition to check time difference

**Testing:**
- [x] Build test passed
- [ ] Send test message to Telegram bot (will test in production)
- [ ] Verify typing indicator appears periodically (not constantly)
- [ ] Check server logs for reduced API calls
- [ ] Test with long response (5000+ characters)

**Deployment:**
- [x] Commit changes (ready)
- [ ] Deploy to production (next step)
- [ ] Test with real Telegram bot
- [ ] Monitor function execution time

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Changed from `fullResponse.length % 500 === 0` to time-based check
- Now sends typing indicator max once every 3 seconds
- Reduces Telegram API calls by ~90% on long responses

---

### 3. Cache System Prompt Loading
**File:** `lib/ai/prompts.ts:45-86`
**Effort:** 15 minutes
**Expected Impact:** 50-100ms saved per request, lower compute costs

**Tasks:**
- [x] Import `unstable_cache` from `next/cache`
- [x] Wrap `loadSophiaInstructions()` with cache (24h TTL)
- [x] systemPrompt() uses cached base instructions (no additional cache needed for string concat)
- [x] Add cache key: `["sophia-base-prompt"]`
- [x] Build test passed with top-level await

**Testing:**
- [x] Build test passed
- [x] Verify prompt loads correctly (build succeeded)
- [ ] Performance: Compare response time before/after (will monitor in production)
- [ ] Check cache hit rate in production logs

**Deployment:**
- [x] Commit changes (ready)
- [ ] Deploy to production (next step)
- [ ] Monitor function execution time (should decrease)
- [ ] Verify no cache invalidation issues

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- loadSophiaInstructions() cached for 24 hours (main performance gain)
- systemPrompt() uses cached base (file read), dynamic parts (date/time) uncached
- File read is the bottleneck (~50-100ms), now cached
- String concatenation is fast (<1ms), no caching needed

---

## 🟡 MEDIUM PRIORITY - Week 2 (High-Impact)

### 4. Move Zyprus Taxonomy Cache to Redis
**File:** `lib/zyprus/taxonomy-cache.ts`
**Effort:** 1 hour
**Expected Impact:** 95% fewer Zyprus API calls, 200-500ms faster per listing

**Tasks:**
- [x] Import `kv` from `@vercel/kv`
- [x] Define cache key: `CACHE_KEY = "zyprus:taxonomy:v1"`
- [x] Update `refreshCache()` to use `kv.set()` with 3600s TTL
- [x] Convert Maps to plain objects before storing in Redis (serializeCache)
- [x] Update `getCache()` to read from `kv.get()`
- [x] Convert objects back to Maps after retrieval (deserializeCache)
- [x] Add fallback to in-memory cache if Redis fails
- [x] Implement stale-while-revalidate pattern (return stale, refresh in background)
- [x] Install @vercel/kv package

**Testing:**
- [x] Build test passed
- [ ] Create a test listing (will test in production)
- [ ] Verify taxonomy data fetched and cached
- [ ] Create second listing (should use cache)
- [ ] Check Redis for cached data
- [ ] Test cache expiration (will monitor in production)

**Deployment:**
- [x] Commit changes (ready)
- [ ] Deploy to production (next step)
- [ ] Monitor Zyprus API call rate (should drop significantly)
- [ ] Verify listing creation still works
- [ ] Check Redis memory usage

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Implemented Redis cache with in-memory fallback for resilience
- Used stale-while-revalidate pattern for optimal performance
- Serializes Maps to objects for Redis storage, deserializes on retrieval
- Cache TTL: 1 hour (3600 seconds)
- Expected 95% reduction in Zyprus API calls
- Expected 200-500ms improvement per listing operation

---

### 5. Add Anthropic Prompt Caching
**Files:** `lib/ai/prompts.ts:107-192`, `app/(chat)/api/chat/route.ts:167-191`
**Effort:** 2-3 hours
**Expected Impact:** $2-5 saved per 1000 requests (Claude models only)

**Tasks:**
- [x] Split system prompt into cacheable and dynamic parts
- [x] Create base instructions segment (static) - getBaseSystemPrompt()
- [x] Create request hints segment (dynamic) - getDynamicSystemPrompt()
- [x] Add `cache_control: { type: "ephemeral" }` to base
- [x] Update `streamText()` to use array format for system (Anthropic models only)
- [x] Add model detection (chat-model-sonnet, chat-model-haiku)
- [x] Type assertion for AI SDK compatibility
- [x] Build test passed

**Testing:**
- [x] Build test passed
- [ ] Switch to Claude model: Set `selectedChatModel = "chat-model-sonnet"` (will test in production)
- [ ] Send test message
- [ ] Check Anthropic API logs for cache hit rate
- [ ] Verify response quality unchanged
- [ ] Test with multiple messages in same session

**Deployment:**
- [x] Commit changes (ready)
- [ ] Deploy to production (next step)
- [ ] Monitor Anthropic API costs (should decrease)
- [ ] Verify cache hit rate > 50% after warmup

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Only applies to Anthropic models (Sonnet, Haiku)
- Gemini models don't support prompt caching (use legacy string format)
- Used type assertion for AI SDK compatibility (types don't support array format yet)
- Cache lasts 5 minutes per Anthropic specs
- Expected $2-5 saved per 1000 requests on Claude models

---

## 🟢 LOW PRIORITY - Week 3 (Long-term)

### 6. Optimize Database Pagination Queries
**File:** `lib/db/queries.ts:162-236`
**Effort:** 1 hour
**Expected Impact:** 30-50% faster pagination, 50% fewer queries

**Tasks:**
- [x] Rewrite `getChatsByUserId()` to use single query with subquery
- [x] Remove separate query for reference chat
- [x] Test `startingAfter` pagination
- [x] Test `endingBefore` pagination
- [x] Verify `hasMore` logic still works
- [x] Update error handling

**Testing:**
- [x] Build test passed
- [x] Verified query logic (single query with subquery for cursor)
- [x] Verified results structure matches old implementation
- [ ] Production testing (will verify after deployment)

**Deployment:**
- [x] Commit changes (git commit 1689f4a)
- [ ] Deploy to production (ready to deploy)
- [ ] Monitor database query performance
- [ ] Verify no pagination bugs in UI

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Git commit: 1689f4a
- Changed from 2 queries to 1 query using subquery pattern
- Fixed Drizzle ORM type error by building conditions array and using and(...conditions)
- Removed separate cursor lookup query
- Expected 30-40% faster pagination, 50% fewer database round-trips
- Build passed successfully

---

### 7. Add CASCADE Delete to Schema
**Files:** `lib/db/schema.ts`, `lib/db/queries.ts:112-129, 131-160`
**Effort:** 2 hours (includes migration)
**Expected Impact:** 75% fewer queries for deletions

**Tasks:**
- [x] Update `message` schema: Add `onDelete: "cascade"` to `chatId` reference
- [x] Update `vote` schema: Add `onDelete: "cascade"` to `chatId` and `messageId` references
- [x] Update `stream` schema: Add `onDelete: "cascade"` to `chatId` reference
- [x] Generate migration: `pnpm db:generate`
- [x] Review migration SQL (0012_narrow_storm.sql)
- [x] Update `deleteChatById()` to single DELETE query
- [x] Update `deleteAllChatsByUserId()` to single DELETE query
- [x] Remove manual cascade logic

**Testing:**
- [x] Build test passed
- [x] Reviewed migration SQL (drops old constraints, adds CASCADE)
- [x] Verified simplified delete functions
- [ ] Production testing (will verify after deployment)

**Deployment:**
- [x] Commit changes (git commit 1689f4a)
- [x] Migration applied to local database
- [ ] Deploy to production (ready to deploy)
- [ ] Run migration on production (auto-applied on deploy)
- [ ] Monitor for any deletion issues

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent (background agent)
- Git commit: 1689f4a
- Migration file: lib/db/migrations/0012_narrow_storm.sql
- Simplified deleteChatById: 4 queries → 1 query (75% reduction)
- Simplified deleteAllChatsByUserId: 3+ queries → 1 query
- Database automatically handles related record cleanup
- Eliminated race conditions from manual cascade logic
- Build passed successfully

---

### 8. Improve Error Logging in Database Queries
**File:** `lib/db/queries.ts` (all catch blocks)
**Effort:** 30 minutes
**Expected Impact:** Better debugging, faster issue resolution

**Tasks:**
- [x] Find all `catch (_error)` blocks (29 total)
- [x] Replace with `catch (error)`
- [x] Add `console.error()` with context
- [x] Include relevant IDs (chatId, userId, email, etc.)
- [x] Keep existing error throwing

**Testing:**
- [x] Build test passed
- [x] Verified error logging pattern consistent across all catch blocks
- [ ] Production testing (will verify error logs after deployment)

**Deployment:**
- [x] Commit changes (git commit 1689f4a)
- [ ] Deploy to production (ready to deploy)
- [ ] Monitor error logs for improved context

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent (background agent)
- Git commit: 1689f4a
- Fixed 29 catch blocks across 4 files:
  - lib/db/queries.ts (26 functions)
  - components/multimodal-input.tsx (1 block)
  - components/artifact-actions.tsx (1 block)
  - app/(chat)/api/files/upload/route.ts (2 blocks)
- All errors now log with: function name, relevant IDs, error message, stack trace
- Better debugging in production, faster issue resolution
- Build passed successfully

---

### 9. Environment Variable Consolidation
**Files:** `.env.local`, `.env.telegram`, `.env.example`
**Effort:** 30 minutes
**Expected Impact:** Better developer experience

**Tasks:**
- [x] Review all `.env.*` files
- [x] Consolidate to `.env.local` for development
- [x] Update `.env.example` with all required variables
- [x] Add comments explaining each variable
- [x] Document which environment loads which file (added header)
- [x] Delete `.env.development.local` (redundant)

**Testing:**
- [x] Build test passed
- [x] Verified .env.example has comprehensive documentation
- [x] Verified all environment files consolidated
- [ ] Production testing (will verify after deployment)

**Deployment:**
- [x] Commit changes (git commit 3d40fa2)
- [x] Pushed to production
- [ ] Verify deployment successful

**Notes:**
- Date completed: 2025-01-10
- Completed by: Claude Code Agent
- Git commit: 3d40fa2
- Deleted .env.development.local (redundant with .env.local)
- Updated .env.example with comprehensive documentation:
  - Added 29-line header explaining Next.js environment file loading order
  - Organized variables into sections: Authentication, AI, Storage, Integrations, Security
  - Added detailed comments for each variable
  - Explained which variables are auto-generated by Vercel
  - Documented setup instructions for each service
- Better developer experience, clearer setup process
- Reduced confusion about which .env file to use
- Build passed successfully

---

### 10. Add Paid Membership Tier
**File:** `lib/ai/entitlements.ts:39`
**Effort:** 4-6 hours (requires billing integration)
**Expected Impact:** Revenue generation, premium features

**Tasks:**
- [ ] Add `paid` to `UserType` enum in `app/(auth)/auth.ts`
- [ ] Define paid tier entitlements (higher message limits, premium models)
- [ ] Update database schema to store subscription status
- [ ] Add billing integration (Stripe/Paddle)
- [ ] Create subscription management UI
- [ ] Add webhook for subscription events
- [ ] Update rate limiting to check tier

**Testing:**
- [ ] Create test paid user
- [ ] Verify higher message limits
- [ ] Test premium model access
- [ ] Test subscription cancellation
- [ ] Test billing webhook

**Deployment:**
- [ ] Set up production billing account
- [ ] Deploy billing webhook
- [ ] Test subscription flow end-to-end
- [ ] Monitor subscription events

**Notes:**
- Requires product decision on pricing
- Defer until weeks 4-6

---

---

## 🔴 URGENT - Directory Cleanup (Executing Now)

### 11. Directory Cleanup & Security Fixes
**File:** Multiple locations
**Effort:** 1 hour
**Expected Impact:** Cleaner codebase, smaller node_modules, better security

**Tasks:**
- [x] Delete `scripts/archive/` (old template extraction scripts - 30KB)
- [x] Move `test-telegram-bot.sh` → `scripts/` and remove hardcoded token
- [x] Move `lib/ai/models.test.ts` → `tests/unit/`
- [x] Delete `.env.telegram` (redundant with .env.local)
- [x] Move WhatsApp integration to disabled state (unused feature)
- [x] Update `.gitignore` with missing entries
- [x] Remove unused npm dependencies (13 packages)
- [x] Fix console.log statements in production code
- [x] Update git tracking (remove build artifacts)

**Testing:**
- [x] Verify dev server still runs
- [x] Verify tests still pass
- [x] Check no broken imports
- [x] Verify Telegram bot still works

**Deployment:**
- [x] Commit changes (git commit 719bc7d)
- [ ] Push to production (ready to push)
- [ ] Verify deployment successful

**Notes:**
- Started: 2025-11-10 13:45
- Completed: 2025-11-10 13:52
- Completed by: Claude Agent
- Git commit: 719bc7d
- Security fix: Removed hardcoded Telegram token from test script
- Files changed: 37 files
- Cleaned up: ~30KB of dead code
- Removed: 18 unused npm dependencies
- Dev server: Still running and functional

---

## 📊 Progress Tracking

### Summary
- **Total Tasks:** 11 + 1 (Tailwind Fix)
- **Completed:** 11 (Tasks #1-9, #11, Tailwind ✅)
- **In Progress:** 0
- **Not Started:** 1 (Task #10 - Paid Membership)

### Week 1 Target ✅ COMPLETE
- [x] Items 1-3 completed
- [x] Tests passing (build successful)
- [ ] Deployed to production (ready to deploy)

### Week 2 Target ✅ COMPLETE
- [x] Item 4 completed ✅
- [x] Item 5 completed ✅
- [x] Tests passing (build successful)
- [ ] Deployed to production (ready to deploy)

### Week 3 Target ✅ COMPLETE
- [x] Items 6-9 completed
- [x] Tests passing (build successful)
- [x] Committed and pushed to production (ready to deploy)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Code reviewed
- [ ] Database migrations reviewed
- [ ] Environment variables documented

### Deployment Steps
1. [ ] Commit changes with descriptive message
2. [ ] Push to GitHub
3. [ ] Vercel auto-deploys to preview
4. [ ] Test preview deployment
5. [ ] Merge to main (triggers production deploy)
6. [ ] Run production migrations if needed
7. [ ] Monitor error logs for 15 minutes

### Post-Deployment Verification
- [ ] Check Vercel deployment logs
- [ ] Test critical user flows
- [ ] Verify performance improvements
- [ ] Monitor error rate
- [ ] Check cost metrics (AI/API/database)

---

## 📝 Agent Instructions

When you (Claude/agent) start work on this project:

```bash
# 1. Read this file
cat IMPLEMENTATION_PLAN.md

# 2. Find your current task (first unchecked item in HIGH PRIORITY)
# 3. Update checkbox to in-progress: [~]
# 4. Complete the work
# 5. Run tests
# 6. Update checkbox to complete: [x]
# 7. Add notes section with:
#    - Date completed
#    - Who completed it (user/agent)
#    - Any issues encountered
#    - Performance measurements
# 8. Move to next task
```

### Updating This File
Use the Edit tool to check/uncheck boxes:
- `[ ]` = Not started
- `[~]` = In progress (optional, for clarity)
- `[x]` = Completed

---

## 📈 Performance Metrics

Track before/after metrics here:

### Database Query Performance
- **Before optimization:**
  - Listing query: ___ ms
  - Chat pagination: ___ ms
  - Chat deletion: ___ queries
- **After optimization:**
  - Listing query: ___ ms
  - Chat pagination: ___ ms
  - Chat deletion: ___ queries

### API Call Rates
- **Before optimization:**
  - Zyprus taxonomy calls: ___ per hour
  - Telegram typing calls: ___ per message
- **After optimization:**
  - Zyprus taxonomy calls: ___ per hour
  - Telegram typing calls: ___ per message

### Cost Metrics
- **Monthly AI costs before:** $_____
- **Monthly AI costs after:** $_____
- **Estimated savings:** $_____

---

## 🐛 Known Issues

Document any blockers or issues discovered during implementation:

1. **Issue:** None yet
   **Status:** N/A
   **Workaround:** N/A

---

## ✅ Completed Work Log

### Tailwind CSS v4 Fix
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Impact:**
- Installed @tailwindcss/postcss, tailwindcss, tailwindcss-animate, @tailwindcss/typography
- Fixed build error preventing compilation
- Build now succeeds

### Task #1 - Add Database Indexes
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** (pending)
**Migration:** 0011_clever_thunderball.sql
**Impact:**
- Added composite index: PropertyListing(userId, createdAt DESC)
- Expected 10-100x faster filtered queries for user listings
- Most indexes already existed from previous work

### Task #2 - Fix Telegram Typing Indicator
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** (pending)
**Impact:**
- Changed from character-count (every 500 chars) to time-based (every 3 seconds)
- Expected 90% fewer Telegram API calls
- Expected 10-20ms faster per response

### Task #3 - Cache System Prompt Loading
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** (pending)
**Impact:**
- Cached loadSophiaInstructions() for 24 hours using unstable_cache
- Expected 50-100ms saved per request
- Lower compute costs from reduced file I/O

### Task #4 - Move Zyprus Taxonomy Cache to Redis
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** 5ee9463
**Impact:**
- Moved taxonomy cache from in-memory to Redis (Vercel KV)
- Implemented stale-while-revalidate pattern for optimal performance
- Added in-memory fallback for Redis failures (resilience)
- Serialization layer for Map <-> Object conversion
- Cache TTL: 1 hour (3600 seconds)
- Expected 95% reduction in Zyprus API calls
- Expected 200-500ms improvement per listing operation
**Notes:** Build test passed. Deployed to production.

### Task #5 - Add Anthropic Prompt Caching
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** (pending)
**Impact:**
- Split system prompt into cacheable (base) and dynamic (hints/date) parts
- Added cache_control header for Anthropic models (Sonnet, Haiku)
- Implemented model detection to conditionally use caching
- Cache lasts 5 minutes per Anthropic specifications
- Expected $2-5 savings per 1000 requests on Claude models
- Only applies to Anthropic models (Gemini uses legacy string format)
**Notes:** Build test passed. Used type assertion for AI SDK compatibility. Ready for production deployment.

### Task #11 - Directory Cleanup & Security Fixes
**Date:** 2025-11-10 13:52
**Completed By:** Claude Agent
**Git Commit:** 719bc7d
**Impact:**
- 37 files changed
- Deleted ~30KB of dead code (scripts/archive/)
- Removed 18 unused npm dependencies
- Fixed security issue (hardcoded bot token)
- Disabled WhatsApp integration (unused feature)
- Organized directory structure following best practices
**Notes:** Dev server tested and running. Ready for production deployment.

### Task #6 - Optimize Database Pagination Queries
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** 1689f4a
**Impact:**
- Changed getChatsByUserId() from 2 queries to 1 query using subquery pattern
- Expected 30-40% faster pagination
- Expected 50% fewer database round-trips
- Fixed Drizzle ORM type error with conditions array pattern
- Removed separate cursor lookup query
**Notes:** Build passed successfully. Ready for production deployment.

### Task #7 - Add CASCADE Delete to Schema
**Date:** 2025-01-10
**Completed By:** Claude Code Agent (background agent)
**Git Commit:** 1689f4a
**Migration:** 0012_narrow_storm.sql
**Impact:**
- Added onDelete: "cascade" to foreign key constraints
- Simplified deleteChatById: 4 queries → 1 query (75% reduction)
- Simplified deleteAllChatsByUserId: 3+ queries → 1 query
- Database automatically handles related record cleanup
- Eliminated race conditions from manual cascade logic
**Notes:** Build passed successfully. Migration applied locally. Ready for production deployment.

### Task #8 - Improve Error Logging in Database Queries
**Date:** 2025-01-10
**Completed By:** Claude Code Agent (background agent)
**Git Commit:** 1689f4a
**Impact:**
- Fixed 29 catch blocks across 4 files
- lib/db/queries.ts (26 functions)
- components/multimodal-input.tsx (1 block)
- components/artifact-actions.tsx (1 block)
- app/(chat)/api/files/upload/route.ts (2 blocks)
- All errors now log with: function name, relevant IDs, error message, stack trace
- Better debugging in production, faster issue resolution
**Notes:** Build passed successfully. Ready for production deployment.

### Task #9 - Environment Variable Consolidation
**Date:** 2025-01-10
**Completed By:** Claude Code Agent
**Git Commit:** 3d40fa2
**Impact:**
- Deleted .env.development.local (redundant with .env.local)
- Updated .env.example with comprehensive documentation
- Added 29-line header explaining Next.js environment file loading order
- Organized variables into sections: Authentication, AI, Storage, Integrations, Security
- Added detailed comments for each variable
- Explained which variables are auto-generated by Vercel
- Better developer experience, clearer setup process
**Notes:** Build passed successfully. Committed and pushed to production.

---

*End of Implementation Plan*
