# SOFIA Documentation Index

> **Complete documentation for the SOFIA AI Assistant**
> **Last Updated:** 2025-11-14

---

## 🚀 Quick Start (New Agents/Developers)

**👉 START HERE:** [Agent Quick Start Guide](for-agents/QUICK_START.md) (5-minute onboarding)

---

## 📚 Core Documentation

### **1. Product Requirements Document (PRD)**
📄 [PRD.md](PRD.md) - **WHAT we're building**

**Read this to understand:**
- Product vision and business goals
- User personas (agents, admin staff, consultants)
- All 38 document templates and features
- Success metrics and KPIs
- Technical requirements overview

**Audience:** Product managers, stakeholders, new team members

---

### **2. System Architecture**
🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - **HOW the system works**

**Read this to understand:**
- 4-layer architecture (Frontend, API, AI, Data)
- Database schema (7 tables with indexes)
- AI Gateway integration (MANDATORY)
- Data flow diagrams
- Performance optimizations (11 completed)
- Security architecture
- Deployment pipeline

**Audience:** Developers, architects, DevOps engineers

---

### **3. Implementation Plan**
📋 [/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - **Task tracking**

**Read this to understand:**
- Current project status
- Completed optimization work
- Next priorities
- Historical changes

**Audience:** All team members, project managers

---

### **4. Agent Instructions**
🤖 [/CLAUDE.md](../CLAUDE.md) - **AI agent quick reference**

**Read this to understand:**
- Critical implementation patterns
- Common tasks and solutions
- Database architecture
- Testing strategy
- Known issues

**Audience:** AI agents, developers making quick changes

---

## 📂 Documentation Structure

### **for-agents/** - AI Agent Onboarding
- [QUICK_START.md](for-agents/QUICK_START.md) - 5-minute onboarding guide for new agents

**Purpose:** Get new AI agents productive in < 10 minutes

---

### **guides/** - Setup and Deployment
- [ai-gateway-setup.md](guides/ai-gateway-setup.md) - AI Gateway configuration (MANDATORY)
- [telegram-bot-setup.md](guides/telegram-bot-setup.md) - Telegram bot integration
- [zyprus-api-setup.md](guides/zyprus-api-setup.md) - Zyprus Property API setup
- [deployment-ready.md](guides/deployment-ready.md) - Deployment verification
- [production-verification-report.md](guides/production-verification-report.md) - Production checklist
- [direct-api-keys-setup.md](guides/direct-api-keys-setup.md) - Legacy setup (deprecated)

**Purpose:** Step-by-step instructions for reproducible setups

---

### **architecture/** - Technical Design Docs
- [sofia-response-consistency.md](architecture/sofia-response-consistency.md) - Response formatting architecture

**Purpose:** Deep-dive technical design decisions

---

### **knowledge/** - Domain Knowledge
- [cyprus-real-estate-knowledge-base.md](knowledge/cyprus-real-estate-knowledge-base.md) - Cyprus real estate context
- [sophia-ai-assistant-instructions.md](knowledge/sophia-ai-assistant-instructions.md) - SOFIA system prompt (26k+ words)
- [property-listing-implementation.md](knowledge/property-listing-implementation.md) - Property listing system
- [property-listing-status.md](knowledge/property-listing-status.md) - Status tracking flow

**Purpose:** Domain context that informs AI behavior and business logic

---

### **templates/** - Document Templates
- [overview.md](templates/overview.md) - Template system architecture
- [source/](templates/source/) - Historical template exports

**Purpose:** SOFIA's 38 document templates and template system documentation

---

### **updates/** - Change History
- [ai-gateway-strict-configuration.md](updates/ai-gateway-strict-configuration.md) - AI Gateway enforcement
- [chat-api-fix.md](updates/chat-api-fix.md) - Chat API debugging notes
- [claude-model-config.md](updates/claude-model-config.md) - Claude model configuration
- [gemini-model-switch.md](updates/gemini-model-switch.md) - Model switching notes

**Purpose:** Engineering change logs and debugging investigations

---

## 🎯 Documentation by Role

### **For AI Agents**
1. Start: [for-agents/QUICK_START.md](for-agents/QUICK_START.md)
2. Then: [/CLAUDE.md](../CLAUDE.md)
3. Reference: [ARCHITECTURE.md](ARCHITECTURE.md)

### **For Developers**
1. Setup: [/README.md](../README.md)
2. Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
3. Deployment: [guides/deployment-ready.md](guides/deployment-ready.md)

### **For Product Managers**
1. Requirements: [PRD.md](PRD.md)
2. Status: [/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
3. Features: [PRD.md#core-features](PRD.md)

### **For Stakeholders (Zyprus)**
1. Overview: [PRD.md](PRD.md)
2. Features: [PRD.md#core-features](PRD.md)
3. Deployment: [guides/production-verification-report.md](guides/production-verification-report.md)

---

## 📖 Documentation Standards

### **When Adding New Documentation:**

1. **Choose the Right Folder:**
   - `for-agents/` - AI agent onboarding and quick references
   - `guides/` - Step-by-step setup procedures
   - `architecture/` - Technical design decisions
   - `knowledge/` - Domain knowledge and context
   - `templates/` - Template system documentation
   - `updates/` - Change logs and debugging notes

2. **File Naming:**
   - Use lowercase with hyphens: `my-new-guide.md`
   - Be descriptive: `telegram-bot-setup.md` not `bot.md`

3. **File Structure:**
   ```markdown
   # Title

   > Brief description
   > Last Updated: YYYY-MM-DD

   ## Overview
   [What this document covers]

   ## Content Sections
   [Organized, numbered sections]

   ## References
   [Links to related docs]
   ```

4. **Markdown Standards:**
   - Use relative links: `[Link](../other-doc.md)`
   - Include code examples with language tags
   - Add ASCII diagrams for flows
   - Keep lines under 120 characters

5. **Keep Updated:**
   - Update "Last Updated" date when editing
   - Link new docs from this index
   - Update related documents when making changes

---

## 🔗 External Resources

- **Vercel Deployment:** [sofiatesting.vercel.app](https://sofiatesting.vercel.app)
- **GitHub Repository:** [Qualiasolutions/sofiatesting](https://github.com/Qualiasolutions/sofiatesting)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel AI SDK:** [sdk.vercel.ai/docs](https://sdk.vercel.ai/docs)
- **Drizzle ORM:** [orm.drizzle.team/docs](https://orm.drizzle.team/docs)

---

## 📊 Documentation Health

**Status:** ✅ Comprehensive and Up-to-Date

- **Core Docs:** ✅ PRD, Architecture, Implementation Plan
- **Setup Guides:** ✅ 6 guides covering all integrations
- **Knowledge Base:** ✅ Cyprus real estate context + SOFIA instructions
- **Agent Onboarding:** ✅ Quick start guide
- **Change History:** ✅ 4 update documents

**Last Documentation Refresh:** 2025-11-14

---

**Questions?**
- Technical: See [ARCHITECTURE.md](ARCHITECTURE.md)
- Product: See [PRD.md](PRD.md)
- Quick Help: See [for-agents/QUICK_START.md](for-agents/QUICK_START.md)
- Implementation: See [/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
