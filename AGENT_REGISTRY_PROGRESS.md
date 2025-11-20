# Agent Registry System - Implementation Progress

**Project:** SOFIA AI Assistant - Zyprus Agent Registry
**Date:** 2025-01-19
**Status:** Phase 1 COMPLETE ✅

## Overview

Building a comprehensive agent registry system for 29 Zyprus real estate employees to interact with SOFIA across web, Telegram, and WhatsApp platforms.

---

## ✅ PHASE 1 COMPLETE: Database & Backend Core

### 1.1 Database Schema Design ✅

**Created Tables:**

#### `ZyprusAgent` Table
- Complete employee registry for 29 Zyprus agents
- Fields: id, userId, fullName, email, phoneNumber, region, role, isActive
- Multi-platform linking: telegramUserId, whatsappPhoneNumber
- Invite system: inviteToken, inviteSentAt, registeredAt
- 10 optimized indexes for fast queries
- Location: `lib/db/schema.ts:529-570`

#### `AgentChatSession` Table
- Multi-platform session tracking (web, Telegram, WhatsApp)
- Activity metrics: messageCount, documentCount, calculatorCount, listingCount
- Cost tracking: totalTokensUsed, totalCostUsd
- 6 composite indexes for analytics queries
- CASCADE deletes for automatic cleanup
- Location: `lib/db/schema.ts:575-615`

**Migration:** `lib/db/migrations/0014_curved_bedlam.sql` ✅

### 1.2 Data Import Tools ✅

**Seed Script:** `scripts/seed-agents.ts`
- Reads Excel spreadsheet with 29 agent records
- Normalizes phone numbers (+357 prefix)
- Normalizes emails (lowercase)
- Generates unique invite tokens
- Regional and role breakdown statistics
- Usage: `pnpm tsx scripts/seed-agents.ts`

**Excel Data Structure:**
```
29 Agents Total:
- Limassol: 12 agents (2 managers)
- Paphos: 5 agents (1 manager)
- Larnaca: 3 agents (1 manager)
- Famagusta: 3 agents (1 manager)
- Nicosia: 4 agents (1 manager)
- Company-wide: 2 (CEO + Listing Admin)

Roles:
- CEO: 1
- Listing Admin: 1
- Normal Agent: 21
- Managers: 6 (one per region)
```

### 1.3 API Routes ✅

**Main CRUD:** `app/api/admin/agents/route.ts`
- GET: List agents with filters (region, role, isActive, search) + pagination
- POST: Create new agent with duplicate email check

**Individual Agent:** `app/api/admin/agents/[id]/route.ts`
- GET: Agent details + activity statistics + recent sessions
- PUT: Update agent (with email conflict check)
- DELETE: Soft delete (deactivate agent)

**Bulk Import:** `app/api/admin/agents/import/route.ts`
- POST: Upload Excel/CSV file
- Validates data, checks for duplicates
- Batch inserts with regional/role breakdown
- Returns import statistics

**Analytics:** `app/api/admin/agents/stats/route.ts`
- GET: Aggregate statistics for all agents
- Regional breakdown, role breakdown, platform breakdown
- Top 10 agents by activity
- Daily activity trend (30 days)
- Query params: `days`, `region`

**Telegram Linking:** `app/api/admin/agents/[id]/link-telegram/route.ts`
- POST: Link Telegram user ID to agent (with conflict check)
- DELETE: Unlink Telegram account

**WhatsApp Linking:** `app/api/admin/agents/[id]/link-whatsapp/route.ts`
- POST: Link WhatsApp phone number to agent (with conflict check)
- DELETE: Unlink WhatsApp account

### 1.4 Agent Identification Utilities ✅

**File:** `lib/agents/identifier.ts`

**Functions:**
- `identifyAgentByTelegram(telegramUserId)` - Find agent by Telegram ID
- `identifyAgentByWhatsApp(phoneNumber)` - Find agent by WhatsApp number
- `identifyAgentByEmail(email)` - Find agent by email (web auth)
- `identifyAgentByUserId(userId)` - Find agent by user ID (registered agents)
- `trackAgentSession(params)` - Create/update chat session
- `updateAgentSessionStats(sessionId, updates)` - Update session metrics
- `endAgentSession(sessionId)` - Mark session as ended
- `isZyprusAgent(userId)` - Check if user is an agent
- `getAgentEntitlements(userId)` - Get agent-specific permissions

**Agent Entitlements:**
```typescript
{
  isAgent: true,
  maxMessagesPerDay: 100_000,  // Unlimited for agents
  availableModels: ["chat-model", "chat-model-sonnet", "chat-model-gpt4o"],
  hasPriorityQueue: true,
  hasInternalTools: true
}
```

---

## 🔧 PHASE 2: Admin UI (PENDING)

### 2.1 Restore Deleted Admin Components
- **Source:** Git commit 833b8c3 has complete admin UI
- **Required Files:**
  - `app/(admin)/admin/layout.tsx` - Admin layout with sidebar
  - `components/admin/sidebar.tsx` - Navigation with role-based permissions
  - `components/admin/header.tsx` - Admin header
  - `app/api/admin/setup/route.ts` - First superadmin creation

### 2.2 Agent Registry Page
- **Route:** `/admin/agents-registry`
- **Features:**
  - Data table with all 29 agents
  - Filters: region, role, isActive status
  - Search: by name or email
  - Pagination
  - Actions: Edit, View, Deactivate, Send Invite
- **Components Needed:**
  - `app/(admin)/admin/agents-registry/page.tsx`
  - `components/admin/agent-registry-table.tsx`
  - `components/admin/agent-filters.tsx`

### 2.3 Agent Profile Page
- **Route:** `/admin/agents-registry/[id]`
- **Features:**
  - Agent details (name, email, phone, region, role)
  - Activity statistics (sessions, messages, documents, cost)
  - Platform breakdown (web, Telegram, WhatsApp)
  - Recent chat sessions (last 10)
  - Account linking status (Telegram, WhatsApp, Web)
  - Actions: Edit, Link Accounts, Send Invite, Deactivate
- **Components Needed:**
  - `app/(admin)/admin/agents-registry/[id]/page.tsx`
  - `components/admin/agent-profile-card.tsx`
  - `components/admin/agent-activity-stats.tsx`
  - `components/admin/agent-link-accounts.tsx`

### 2.4 Bulk Import Interface
- **Route:** `/admin/agents-registry/import`
- **Features:**
  - Excel/CSV file upload
  - Preview agent data before import
  - Validation errors display
  - Import progress indicator
  - Success/failure summary
- **Components Needed:**
  - `app/(admin)/admin/agents-registry/import/page.tsx`
  - `components/admin/bulk-import-uploader.tsx`
  - `components/admin/import-preview-table.tsx`

---

## ⚡ PHASE 3: Multi-Platform Integration (PENDING)

### 3.1 Telegram Integration Extension
- **File:** `lib/telegram/message-handler.ts`
- **Changes:**
  ```typescript
  import { identifyAgentByTelegram, trackAgentSession } from "@/lib/agents/identifier";

  // At start of message handling:
  const agent = await identifyAgentByTelegram(message.from.id);
  if (agent) {
    // Create/link chat session
    // Apply agent-specific entitlements
    // Track agent activity
  }
  ```

### 3.2 WhatsApp Integration (ENABLE)
- **Current Status:** Code exists but disabled (`lib/integrations/whatsapp-DISABLED/`)
- **Steps:**
  1. Rename `whatsapp-DISABLED` to `whatsapp`
  2. Create webhook: `app/api/whatsapp/webhook/route.ts`
  3. Add agent identification similar to Telegram
  4. Create WhatsApp client initialization
  5. Add environment variables: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

### 3.3 Agent-Specific Entitlements
- **File:** `lib/ai/entitlements.ts`
- **Changes:**
  ```typescript
  import { getAgentEntitlements } from "@/lib/agents/identifier";

  export async function getUserEntitlements(userId: string) {
    const agentEntitlements = await getAgentEntitlements(userId);
    if (agentEntitlements.isAgent) {
      return agentEntitlements;
    }
    // Return regular user entitlements
  }
  ```

### 3.4 Agent Registration Invite Flow
- **Email Route:** `app/api/agents/invite/route.ts`
  - POST: Send invite email with unique token
  - Uses agent's inviteToken from database
  - Email template with registration link

- **Registration Route:** `app/api/agents/register/route.ts`
  - GET: Validate invite token
  - POST: Complete registration (create User, link to ZyprusAgent)
  - Updates: registeredAt, userId fields

---

## 📊 PHASE 4: Analytics Dashboard (PENDING)

### 4.1 Agent Activity Dashboard
- **Route:** `/admin/agents-registry/analytics`
- **Features:**
  - Regional performance comparison
  - Role-based activity breakdown
  - Platform usage trends (web vs Telegram vs WhatsApp)
  - Top performers by messages, documents, listings
  - Cost tracking per agent/region
  - Daily/weekly/monthly activity charts
- **API:** Already exists at `/api/admin/agents/stats`

---

## 🧪 TESTING & DEPLOYMENT (PENDING)

### 5.1 Apply Migrations
```bash
pnpm db:migrate
pnpm build
```

### 5.2 Seed Database
```bash
pnpm tsx scripts/seed-agents.ts
```

### 5.3 Create First Superadmin
```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zyprus.com", "password": "secure_password"}'
```

### 5.4 Test Agent Registration Flow
1. Admin sends invite to agent
2. Agent clicks registration link
3. Agent creates account
4. Agent links Telegram/WhatsApp
5. Agent starts using SOFIA
6. Verify session tracking works
7. Check analytics dashboard shows activity

---

## 📁 File Structure Summary

```
lib/
├── db/
│   ├── schema.ts                           ✅ Updated with ZyprusAgent + AgentChatSession
│   └── migrations/
│       └── 0014_curved_bedlam.sql          ✅ Migration for new tables
├── agents/
│   └── identifier.ts                        ✅ Agent identification utilities

scripts/
└── seed-agents.ts                           ✅ Import 29 agents from Excel

app/
├── api/
│   └── admin/
│       └── agents/
│           ├── route.ts                     ✅ List/Create agents
│           ├── [id]/
│           │   ├── route.ts                 ✅ Get/Update/Delete agent
│           │   ├── link-telegram/
│           │   │   └── route.ts            ✅ Link/Unlink Telegram
│           │   └── link-whatsapp/
│           │       └── route.ts            ✅ Link/Unlink WhatsApp
│           ├── import/
│           │   └── route.ts                ✅ Bulk import from Excel
│           └── stats/
│               └── route.ts                ✅ Analytics statistics
└── (admin)/admin/
    └── agents-registry/                     ⏳ PENDING (Phase 2)
        ├── page.tsx                         ⏳ Agent list page
        ├── [id]/page.tsx                    ⏳ Agent profile page
        ├── import/page.tsx                  ⏳ Bulk import page
        └── analytics/page.tsx               ⏳ Analytics dashboard

components/
└── admin/                                   ⏳ PENDING (Phase 2)
    ├── agent-registry-table.tsx
    ├── agent-profile-card.tsx
    ├── agent-activity-stats.tsx
    ├── agent-link-accounts.tsx
    └── bulk-import-uploader.tsx
```

---

## 🎯 Next Steps

### Immediate Actions (Phase 2):

1. **Restore Admin UI** (from git commit 833b8c3)
   - Extract admin layout, sidebar, header components
   - Create admin API setup route
   - Test admin access

2. **Build Agent Registry Page**
   - Use existing `components/ui/table.tsx`
   - Implement filters and search
   - Connect to `/api/admin/agents` endpoint

3. **Create Agent Profile Page**
   - Display agent details and stats
   - Show account linking status
   - Add action buttons (Edit, Link, Invite)

4. **Add Bulk Import UI**
   - File upload component
   - Preview table before import
   - Connect to `/api/admin/agents/import`

### After Phase 2:

5. **Integrate with Telegram** (Phase 3.1)
6. **Enable WhatsApp** (Phase 3.2)
7. **Add Agent Entitlements** (Phase 3.3)
8. **Build Invite Flow** (Phase 3.4)
9. **Create Analytics Dashboard** (Phase 4)

---

## 🔑 Key Implementation Details

### Agent Data from Spreadsheet

**29 Agents Total:**
- **Regions:** Limassol (12), Paphos (5), Larnaca (3), Famagusta (3), Nicosia (4), All (2)
- **Roles:** CEO (1), Listing Admin (1), Normal Agent (21), Managers (6)

### Multi-Platform Identification

**Web:**
- User logs in with email/password (NextAuth)
- System checks `ZyprusAgent.userId` to identify agent
- Entitlements applied automatically

**Telegram:**
- Message received with `message.from.id` (Telegram user ID)
- Lookup `ZyprusAgent.telegramUserId`
- If match found, apply agent entitlements and track session

**WhatsApp:**
- Message received with sender phone number
- Lookup `ZyprusAgent.whatsappPhoneNumber`
- If match found, apply agent entitlements and track session

### Session Tracking

Every agent interaction creates/updates an `AgentChatSession` record:
- Tracks platform (web, Telegram, WhatsApp)
- Counts messages, documents, calculations, listings
- Tracks token usage and cost
- Enables analytics and performance monitoring

---

## 📊 Expected Outcomes

After full implementation:

1. **29 Zyprus agents** registered and active
2. **Multi-platform access** (web + Telegram + WhatsApp)
3. **Comprehensive analytics** showing agent performance
4. **Admin panel** for managing agents and viewing stats
5. **Automated session tracking** across all platforms
6. **Agent-specific entitlements** (unlimited messages, premium models)

---

## 🚀 Deployment Checklist

- [ ] Apply database migrations
- [ ] Run seed script to import 29 agents
- [ ] Create first superadmin account
- [ ] Send invite emails to all agents
- [ ] Monitor agent registration progress
- [ ] Verify Telegram integration works
- [ ] Test WhatsApp integration (when enabled)
- [ ] Check analytics dashboard displays correctly
- [ ] Verify cost tracking is accurate
- [ ] Document agent onboarding process

---

**Phase 1 Status:** ✅ COMPLETE
**Next Phase:** Phase 2 - Admin UI Development
**Estimated Time:** 4-5 days for Phase 2
**Overall Progress:** 31% complete (5/16 tasks done)
