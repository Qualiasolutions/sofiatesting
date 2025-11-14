# SOFIA - AI Agent Quick Start Guide

> **New to the SOFIA project? Start here!**
> **Last Updated:** 2025-11-14

---

## 🎯 Welcome, Agent!

Welcome to SOFIA - an AI-powered assistant for Cyprus real estate document generation. This guide will get you up to speed in **5 minutes**.

---

## 📚 Step 1: Read These Files First (In Order)

### **1. Project Overview (2 min)**
```bash
# Read: /README.md
```
**What you'll learn:**
- What SOFIA does (AI assistant for Zyprus Property Group)
- Tech stack (Next.js 15, PostgreSQL, AI Gateway)
- How to run the project locally

### **2. Product Requirements (5 min)**
```bash
# Read: /docs/PRD.md
```
**What you'll learn:**
- **WHAT** we're building (38 document templates, property listings, calculators)
- User personas (agents, admin staff, consultants)
- Business goals and success metrics
- All features and their requirements

### **3. System Architecture (10 min)**
```bash
# Read: /docs/ARCHITECTURE.md
```
**What you'll learn:**
- **HOW** the system works (4-layer architecture)
- Database schema (7 tables with indexes)
- API endpoints and data flows
- Performance optimizations (11 completed tasks)
- Security and deployment architecture

### **4. Agent Instructions (3 min)**
```bash
# Read: /CLAUDE.md
```
**What you'll learn:**
- Critical implementation patterns
- AI Gateway configuration (MANDATORY)
- Database operations and testing strategy
- Common issues and solutions

---

## 🚀 Step 2: Get the Project Running (10 min)

### **Prerequisites**
```bash
# Required:
- Node.js 20+
- pnpm (package manager)
- PostgreSQL database
- Redis (for caching)

# Environment variables (see .env.example):
- AI_GATEWAY_API_KEY (CRITICAL - no fallback!)
- POSTGRES_URL
- REDIS_URL
- AUTH_SECRET
```

### **Installation**
```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run database migrations
pnpm db:migrate

# 4. Start development server
pnpm dev

# 5. Open browser
# http://localhost:3000
```

### **Verify Setup**
```bash
# ✅ Build should succeed
pnpm build

# ✅ Tests should pass
pnpm test:unit

# ✅ AI models should connect
pnpm test:ai-models
```

---

## 🗂️ Step 3: Understand the Codebase Structure

### **Key Directories**
```
sofia testing/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Main chat interface
│   │   └── api/chat/      # 🔥 MAIN AI ENDPOINT (streaming)
│   ├── api/
│   │   ├── listings/      # Property CRUD operations
│   │   └── telegram/      # Telegram bot webhook
│   └── properties/        # Property management UI
│
├── lib/                    # Business logic
│   ├── ai/                # 🔥 AI INTEGRATION
│   │   ├── providers.ts   # AI Gateway config (MANDATORY)
│   │   ├── prompts.ts     # System prompts (cached)
│   │   └── tools/         # Cyprus calculators + tools
│   ├── db/
│   │   ├── schema.ts      # 🔥 DATABASE SCHEMA
│   │   └── queries.ts     # Database operations
│   ├── telegram/          # Bot message handler
│   └── zyprus/            # Property API client
│
├── docs/                   # 📚 DOCUMENTATION
│   ├── PRD.md             # Product requirements
│   ├── ARCHITECTURE.md    # System design
│   ├── for-agents/        # You are here!
│   ├── guides/            # Setup guides
│   └── knowledge/         # Domain knowledge
│
├── CLAUDE.md              # Agent instructions
├── README.md              # Project overview
└── IMPLEMENTATION_PLAN.md # Task tracking
```

### **Most Important Files**
| File | Purpose | Read When |
|------|---------|-----------|
| `app/(chat)/api/chat/route.ts` | Main AI streaming endpoint | Working on chat/AI |
| `lib/ai/providers.ts` | AI Gateway configuration | Changing AI models |
| `lib/ai/prompts.ts` | System prompts (cached) | Updating SOFIA behavior |
| `lib/db/schema.ts` | Database schema | Database changes |
| `lib/db/queries.ts` | Database operations | Query optimization |
| `lib/ai/tools/` | Cyprus calculators | Adding new tools |

---

## 🧠 Step 4: Understand Key Concepts

### **1. AI Gateway is MANDATORY**
```typescript
// lib/ai/providers.ts
// ⚠️ NO FALLBACK - Application fails without AI_GATEWAY_API_KEY
```
**Available Models:**
- `chat-model` → Claude Haiku 4.5 (default, $1/M input)
- `chat-model-sonnet` → Claude Sonnet 4.5 ($3/M input)
- `chat-model-gpt4o` → GPT-4o Mini ($0.15/M input)

### **2. Streaming Architecture (SSE)**
```typescript
// All chat responses use Server-Sent Events
streamText({
  model,
  system,
  messages,
  tools,
  // ... streams to client via JsonToSseTransformStream
})
```

### **3. Database Patterns**
```typescript
// Soft deletes (90-day recovery)
deletedAt: timestamp('deletedAt')

// Composite indexes for performance
index('propertyListing_userId_createdAt_idx')
  .on(propertyListing.userId, propertyListing.createdAt.desc())

// CASCADE deletes (automatic cleanup)
chatId: uuid('chatId').references(() => chat.id, { onDelete: 'cascade' })
```

### **4. Caching Strategy**
```typescript
// 1. Next.js cache (24h TTL for system prompts)
unstable_cache(loadSophiaInstructions, ['sophia-base-prompt'], {
  revalidate: 86400
})

// 2. Redis cache (1h TTL for Zyprus taxonomy)
await kv.set(CACHE_KEY, serializedCache, { ex: 3600 })

// 3. Anthropic prompt cache (5 min TTL, saves $2-5 per 1k requests)
{ role: "system", content: basePrompt, cache_control: { type: "ephemeral" } }
```

---

## 🔧 Step 5: Common Tasks

### **Adding a New AI Tool**
```typescript
// 1. Create tool in lib/ai/tools/my-tool.ts
export const myTool = tool({
  description: "...",
  parameters: z.object({ ... }),
  execute: async ({ ... }) => { ... }
})

// 2. Register in app/(chat)/api/chat/route.ts
const tools = {
  myTool: myTool,
  // ...
}
experimental_activeTools: ["myTool", ...]
```

### **Running Database Migrations**
```bash
# 1. Make schema changes in lib/db/schema.ts
# 2. Generate migration
pnpm db:generate

# 3. Review migration file in lib/db/migrations/
# 4. Apply migration
pnpm db:migrate

# 5. Verify build
pnpm build
```

### **Testing Changes**
```bash
# Unit tests
pnpm test:unit

# E2E tests (requires PLAYWRIGHT=True in .env)
PLAYWRIGHT=True pnpm test

# AI model connectivity
pnpm test:ai-models

# Build verification
pnpm build
```

### **Deploying to Production**
```bash
# 1. Commit changes
git add .
git commit -m "feat: your feature description"

# 2. Push to GitHub (auto-deploys via Vercel)
git push origin main

# 3. Monitor deployment
vercel logs sofiatesting.vercel.app

# 4. Verify in production
# Check: https://sofiatesting.vercel.app
```

---

## ⚠️ Critical Things to Know

### **1. Never Remove AI Gateway**
```typescript
// ❌ DON'T: Add fallback models
// ❌ DON'T: Use direct API keys
// ✅ DO: Always use AI Gateway (lib/ai/providers.ts)
```

### **2. Always Use Soft Deletes**
```typescript
// ✅ CORRECT:
await db.update(chat).set({ deletedAt: new Date() })

// ❌ WRONG:
await db.delete(chat) // Only for hard deletes!
```

### **3. Check IMPLEMENTATION_PLAN.md Before Starting**
```bash
# Always read current status
cat IMPLEMENTATION_PLAN.md

# Check for active tasks
# Update when you complete work
```

### **4. Respect Rate Limits**
```typescript
// lib/ai/entitlements.ts
- Guest users: 100 messages/day
- Regular users: 10,000 messages/day
```

### **5. Cache Zyprus API Calls**
```typescript
// lib/zyprus/taxonomy-cache.ts
// Always use getCache() - don't call API directly
const taxonomy = await getCache()
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 503 errors | Check `AI_GATEWAY_API_KEY` is set |
| Database errors | Run `pnpm db:migrate` |
| Build failures | Check TypeScript errors, run `pnpm build` |
| Slow queries | Verify indexes exist (migration 0012) |
| Tool not working | Check registration in chat route + experimental_activeTools |
| Telegram bot fails | Verify `TELEGRAM_BOT_TOKEN` and webhook URL |

---

## 📖 Step 6: Deep Dive Documentation

### **When Working On...**

**Chat/AI Features:**
- Read: `/docs/ARCHITECTURE.md` (Section 3.3 - AI Integration)
- Read: `/docs/architecture/sofia-response-consistency.md`
- Read: `/lib/ai/prompts.ts` source code

**Database Changes:**
- Read: `/docs/ARCHITECTURE.md` (Section 5 - Database Schema)
- Read: `/CLAUDE.md` (Database Architecture section)
- Review: `/lib/db/migrations/` (historical changes)

**Property Listings:**
- Read: `/docs/knowledge/property-listing-implementation.md`
- Read: `/docs/knowledge/property-listing-status.md`
- Review: `/lib/zyprus/` implementation

**Telegram Bot:**
- Read: `/docs/guides/telegram-bot-setup.md`
- Review: `/lib/telegram/message-handler.ts`

**Deployment:**
- Read: `/docs/guides/deployment-ready.md`
- Read: `/docs/guides/production-verification-report.md`
- Review: `/.env.example` for required variables

---

## 🎓 Learning Path

### **Day 1: Orientation**
- ✅ Read this guide
- ✅ Read README.md, CLAUDE.md
- ✅ Get project running locally
- ✅ Test all features in UI

### **Day 2: Understanding**
- ✅ Read PRD.md (product requirements)
- ✅ Read ARCHITECTURE.md (system design)
- ✅ Explore codebase structure
- ✅ Run all tests

### **Day 3: First Contribution**
- ✅ Pick small task from IMPLEMENTATION_PLAN.md
- ✅ Make changes following patterns
- ✅ Test thoroughly
- ✅ Create pull request

---

## 🔗 Quick Reference Links

### **Documentation**
- [PRD (Product Requirements)](/docs/PRD.md)
- [Architecture Documentation](/docs/ARCHITECTURE.md)
- [Agent Instructions](/CLAUDE.md)
- [Implementation Plan](/IMPLEMENTATION_PLAN.md)

### **Setup Guides**
- [AI Gateway Setup](/docs/guides/ai-gateway-setup.md)
- [Telegram Bot Setup](/docs/guides/telegram-bot-setup.md)
- [Zyprus API Setup](/docs/guides/zyprus-api-setup.md)
- [Deployment Guide](/docs/guides/deployment-ready.md)

### **Knowledge Base**
- [Cyprus Real Estate Knowledge](/docs/knowledge/cyprus-real-estate-knowledge-base.md)
- [SOFIA Instructions](/docs/knowledge/sophia-ai-assistant-instructions.md)
- [Property Listing Implementation](/docs/knowledge/property-listing-implementation.md)

### **Code References**
- [Main Chat Endpoint](/app/(chat)/api/chat/route.ts)
- [AI Providers](/lib/ai/providers.ts)
- [System Prompts](/lib/ai/prompts.ts)
- [Database Schema](/lib/db/schema.ts)

---

## ✅ You're Ready!

**Checklist:**
- [ ] Read this guide completely
- [ ] Project running locally
- [ ] Read PRD.md and ARCHITECTURE.md
- [ ] Tests passing (`pnpm build`)
- [ ] Understand AI Gateway requirement
- [ ] Know where to find documentation
- [ ] Ready to make first contribution!

**Questions?**
1. Check `/docs/ARCHITECTURE.md` for technical questions
2. Check `/docs/PRD.md` for product questions
3. Check `/CLAUDE.md` for implementation patterns
4. Review code in `/lib/` and `/app/` for examples

---

**Welcome to the team! 🚀**

*This project is production-ready and serving real users at Zyprus Property Group. All changes should be thoroughly tested before deployment.*

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Status:** ✅ Production-Ready
