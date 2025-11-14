# SOFIA - Product Requirements Document

**Version:** 3.1.0
**Product Name:** SOFIA (Sophia AI Assistant)
**Client:** Zyprus Property Group
**Document Status:** Production - Active Development
**Last Updated:** November 14, 2025

---

## 1. Executive Summary

### Product Overview
SOFIA (Sophia AI Assistant) is a production-grade Next.js 15 application that serves as the AI-powered assistant for Zyprus Property Group, a Cyprus-based real estate company. The platform provides intelligent document generation, property listing management, and automated customer support through both web and Telegram interfaces.

### Key Stakeholders
- **Primary Client:** Zyprus Property Group (Cyprus)
- **End Users:** Real estate agents, property consultants, administrative staff
- **Technical Owner:** Qualia Solutions
- **Infrastructure Provider:** Vercel (hosting, AI Gateway)

### Strategic Value
SOFIA eliminates manual document creation for Cyprus real estate operations, reducing document generation time from 30-45 minutes to under 2 minutes while ensuring compliance with Cyprus real estate regulations. The platform handles 38 distinct document types and provides specialized calculators for Cyprus property transactions.

---

## 2. Problem Statement

### Business Challenge
Cyprus real estate agencies face significant operational inefficiencies:
- **Manual Document Creation:** Agents spend 30-45 minutes manually creating standard documents (registrations, agreements, communications)
- **High Error Rate:** Manual document creation leads to missing fields, incorrect calculations, and compliance issues
- **Limited Scalability:** Document creation bottleneck limits agent capacity to handle more clients
- **Knowledge Gap:** Complex Cyprus tax regulations (VAT, transfer fees, capital gains) require expert knowledge

### Target Users
1. **Real Estate Agents** (Primary)
   - Need: Fast, accurate document generation during client interactions
   - Pain Point: Switching between multiple tools/templates disrupts client conversations
   - Goal: Generate professional documents in under 2 minutes

2. **Administrative Staff** (Secondary)
   - Need: Bulk document generation, property listing management
   - Pain Point: Manual data entry across multiple systems
   - Goal: Streamline property upload workflow to Zyprus platform

3. **Property Consultants** (Secondary)
   - Need: Quick access to Cyprus tax calculations
   - Pain Point: Complex tax calculations prone to manual errors
   - Goal: Instant, accurate tax estimates for client consultations

### Current Pain Points
- **Time Waste:** 30-45 minutes per document × 10-20 documents/day = 5-15 hours/day lost
- **Inconsistency:** Different agents create documents with varying formats and completeness
- **Compliance Risk:** Missing mandatory fields or incorrect Cyprus-specific clauses
- **Client Experience:** Delays in providing documents reduce perceived professionalism
- **Platform Fragmentation:** Separate tools for document creation, listing management, and calculations

---

## 3. Product Vision & Goals

### Product Vision
*"Empower Cyprus real estate professionals with AI-powered automation that transforms document generation from a time-consuming task into an instant, error-free conversation."*

### Business Objectives
1. **Efficiency Gain:** Reduce document generation time by 95% (from 30-45 min to <2 min)
2. **Quality Improvement:** Achieve 99%+ accuracy in document field population
3. **User Adoption:** 100% of Zyprus agents using SOFIA within 3 months
4. **Cost Optimization:** Maintain AI costs under $200/month while serving 50+ daily users
5. **Revenue Enabler:** Support 3x increase in agent capacity through automation

### Success Metrics
- **Performance:** Average document generation time < 90 seconds
- **Accuracy:** <1% error rate in mandatory field completion
- **Adoption:** 80% of documents generated via SOFIA (vs. manual) within 6 months
- **Satisfaction:** Net Promoter Score (NPS) > 50
- **Cost Efficiency:** AI cost per document < $0.10
- **Uptime:** 99.5% availability during business hours (Cyprus time: 08:00-20:00)

---

## 4. User Personas

### Persona 1: Elena - Senior Real Estate Agent
**Demographics:**
- Age: 35
- Experience: 8 years in Cyprus real estate
- Tech Comfort: Medium
- Languages: Greek, English

**Needs:**
- Generate client registration forms during property viewings
- Quick access to transfer fee and VAT calculations
- Professional-looking documents that reinforce brand credibility

**Workflow:**
1. Meet client at property viewing
2. Capture client details verbally
3. Generate registration/agreement via SOFIA (mobile-friendly)
4. Email document to client immediately
5. Follow up with viewing confirmation

**Pain Points:**
- Limited time during client meetings
- Needs mobile access (viewing documents on-site)
- Forgets optional fields, leading to incomplete documents

**Goals:**
- Complete document generation in <2 minutes
- Access calculator tools without leaving conversation
- Send professional documents while client is present

---

### Persona 2: Andreas - Property Listing Manager
**Demographics:**
- Age: 28
- Experience: 3 years in property administration
- Tech Comfort: High
- Primary Task: Upload 20-50 property listings/week to Zyprus platform

**Needs:**
- Bulk property listing creation with AI assistance
- Automated field extraction from property descriptions
- Retry mechanism for failed uploads
- Status tracking for pending uploads

**Workflow:**
1. Receive property details from owner/agent
2. Create listing in SOFIA with AI field extraction
3. Review and edit generated listing
4. Queue for upload to Zyprus API
5. Monitor upload status dashboard

**Pain Points:**
- Manual data entry across 30+ fields per listing
- Upload failures require manual retry
- No visibility into upload queue status
- Zyprus API rate limits cause delays

**Goals:**
- Reduce listing creation time by 70%
- Automatic retry for failed uploads
- Dashboard view of all pending listings
- Bulk upload capability

---

### Persona 3: Maria - Telegram Support Agent
**Demographics:**
- Age: 32
- Experience: 5 years in customer support
- Tech Comfort: Medium
- Primary Channel: Telegram bot for external client support

**Needs:**
- Answer client questions about properties via Telegram
- Generate documents through conversational chat
- Access Cyprus tax calculators without switching apps

**Workflow:**
1. Receive client message via Telegram
2. Respond using SOFIA bot capabilities
3. Generate document if requested
4. Send document link or PDF directly in chat

**Pain Points:**
- Switching between Telegram and web interface
- Long AI responses split across multiple messages
- Typing indicators causing notification spam
- No access to property listing database from Telegram

**Goals:**
- Seamless Telegram bot experience
- Document generation without leaving Telegram
- Access to knowledge base for common questions
- Reliable document delivery via Telegram

---

## 5. Core Features

### 5.1 AI Chat Interface

**Description:**
Conversational AI interface powered by Claude 4.5 Haiku/Sonnet for natural language document generation and property assistance.

**Key Capabilities:**
- **Multi-Turn Conversations:** SOFIA maintains context across multiple messages to collect all required fields
- **Smart Field Extraction:** Automatically extracts client names, dates, locations from natural language
  - Example: "registration developer with viewing tomorrow at 15:00 the client is John Smith"
  - Extracts: Client Name = John Smith, Date = Oct 21 2025, Time = 15:00
- **Intelligent Questioning:** Only asks for missing mandatory fields, skips optional fields when user provides extra info
- **Immediate Generation:** When all required fields present, generates document without asking unnecessary questions
- **Model Selection:** Users can choose between:
  - Claude Haiku 4.5 (default, fast, cost-effective)
  - Claude Sonnet 4.5 (premium quality)
  - GPT-4o Mini (ultra-budget option)

**User Flow:**
1. User describes document need: "I need a seller registration for Maria Papadopoulos"
2. SOFIA extracts client name, identifies template (reg-01)
3. SOFIA asks only for missing mandatory fields (property details, passport, etc.)
4. User provides fields via natural language
5. SOFIA generates complete, formatted document in bold Markdown
6. User reviews, requests edits if needed
7. Document finalized and downloadable

**Technical Implementation:**
- Streaming responses via Server-Sent Events (SSE)
- Token tracking with tokenlens library
- Message persistence in PostgreSQL (Message_v2 table)
- Anthropic prompt caching for 50-100ms faster responses
- System prompt loaded from cached base instructions (24h TTL)

**Access Control:**
- Access code gate: `qualia-access=granted` cookie required
- Guest users: Auto-login, 100 messages/day limit
- Registered users: 10,000 messages/day limit
- Rate limiting via Upstash Redis

**Success Criteria:**
- Average response latency < 2 seconds
- Field extraction accuracy > 95%
- User satisfaction with conversational flow > 80%

---

### 5.2 Document Generation (38 Templates)

**Description:**
Automated generation of Cyprus real estate documents with smart field extraction and validation.

#### 5.2.1 Registrations (8 Templates)

1. **Standard Seller Registration** (reg-01)
   - For property owners listing their property for sale
   - Fields: Client names, ID/passport, property registration, contact details
   - Use case: Most common registration, 40% of all documents

2. **Seller Registration with Marketing Agreement** (reg-02)
   - Combined registration + exclusive/non-exclusive marketing rights
   - Fields: All reg-01 fields + marketing terms, commission, duration
   - Use case: Premium listings requiring marketing commitment

3. **Landlord Registration** (reg-03)
   - For property owners listing rental properties
   - Fields: Client names, property details, rental terms, contact info
   - Use case: Long-term rental listings

4. **Buyer/Tenant Registration** (reg-04)
   - For clients seeking to purchase or rent property
   - Fields: Client names, budget, preferences, contact info
   - Use case: Client intake for property search

5. **Developer Registration** (reg-05)
   - For property developers listing projects
   - Fields: Company details, project information, contact person
   - Use case: New development listings

6. **Bank Registration - Land** (reg-06-land)
   - For bank-owned land parcels (foreclosures, auctions)
   - Fields: Bank details, land registration, location, contact
   - Use case: Distressed asset sales

7. **Developer Registration with Viewing** (reg-07)
   - Developer registration + scheduled property viewing
   - Fields: All reg-05 fields + viewing date/time, location, contact person
   - Use case: Developer open house events
   - **Special Rule:** NEVER ask for contact person field (uses "Dear XXXXXXXX" placeholder)

8. **Bank Registration - House/Apartment** (reg-08-house)
   - For bank-owned residential properties
   - Fields: Bank details, property registration, specifications, contact
   - Use case: Bank repossession sales

**Mandatory Field Logic:**
- System MUST ask: "Is the property type Land or House/Apartment?" FIRST
- Then route to appropriate bank template (reg-06-land vs reg-08-house)

---

#### 5.2.2 Viewing Forms (5 Templates)

1. **Viewing Arrangement Form** (view-01)
   - Schedule property viewing appointments
   - Fields: Client names, property address, viewing date/time, agent contact
   - Use case: Coordinate client property tours

2. **Viewing Confirmation Email** (view-02)
   - Email confirmation sent to client after booking
   - Fields: Client name, property details, date/time, meeting point, agent details
   - Use case: Reduce no-shows with email reminders

3. **Viewing Reservation Notice** (view-03)
   - Internal notice for reserved viewing slots
   - Fields: Property ID, date/time, client name, agent assigned
   - Use case: Prevent double-booking viewing slots

4. **Post-Viewing Follow-up** (view-04)
   - Follow-up email template after viewing
   - Fields: Client name, property viewed, feedback request, next steps
   - Use case: Maintain engagement after viewing

5. **Viewing Cancellation Notice** (view-05)
   - Notify client of cancelled viewing
   - Fields: Client name, property address, original date/time, reason (optional)
   - Use case: Professional communication of schedule changes

---

#### 5.2.3 Marketing Agreements (3 Templates)

1. **Exclusive Marketing Agreement** (mkt-01)
   - Sole agency rights for property marketing
   - Fields: Property owner, property details, duration (months), commission %, marketing terms
   - Use case: Premium listings requiring exclusivity
   - **Legal Requirements:** Cyprus real estate regulations require clear commission terms

2. **Non-Exclusive Marketing Agreement** (mkt-02)
   - Multi-agency listing rights
   - Fields: Property owner, property details, commission %, cooperation clause
   - Use case: Flexible marketing arrangements

3. **Marketing Agreement Extension** (mkt-03)
   - Renewal of existing marketing agreement
   - Fields: Original agreement reference, new end date, updated terms (if any)
   - Use case: Extend successful marketing relationships

**Critical Rule:**
- Template reg-02 (Seller Registration with Marketing Agreement) always means **EXCLUSIVE** marketing
- Field collection must clearly distinguish exclusive vs non-exclusive terms
- Signature document = marketing agreement (mkt-01 or mkt-02)

---

#### 5.2.4 Client Communications (22 Templates)

**Categories:**
- **Property Updates** (comm-01 to comm-05): Price reductions, sold notifications, new listings
- **Administrative** (comm-06 to comm-10): Appointment confirmations, document requests, payment reminders
- **Marketing** (comm-11 to comm-15): Open house invitations, newsletter updates, referral requests
- **Customer Service** (comm-16 to comm-22): Thank you notes, feedback requests, apology letters

**Example Templates:**
- **comm-01:** Price Reduction Announcement
- **comm-08:** Document Collection Request
- **comm-15:** Referral Program Invitation
- **comm-22:** Apology for Delay (most used customer service template)

**Common Fields:**
- Client name (required)
- Property reference (optional, if applicable)
- Specific details (varies by template)
- Agent signature block (auto-populated)

---

### Document Generation Rules

**Bold Formatting (CRITICAL):**
- **ALL text in generated documents MUST be wrapped in Markdown bold tags (`**text**`)**
- **Labels before colons MUST be bold:** `**Client Name:** John Smith`
- **This rule overrides all other formatting**
- **NO exceptions - even examples must be bold**

**Field Collection Logic:**
1. **Immediate Extraction:** Parse user message for all possible fields first
2. **Smart Questioning:** Only ask for truly missing mandatory fields
3. **Skip Optional Fields:** Don't ask unless user explicitly provides extra info
4. **Immediate Generation:** If all required fields present, generate without further questions

**Examples of Smart Extraction:**
```
User: "registration developer with viewing tomorrow at 15:00 the client is John Smith"

SOFIA extracts:
- Client Name: John Smith (SILENT - don't ask again)
- Date: Tomorrow (Oct 21, 2025) (SILENT)
- Time: 15:00 (SILENT)
- Template: reg-07 (Developer with Viewing)

SOFIA generates IMMEDIATELY with Dear XXXXXXXX (no contact person needed)
```

**Validation Requirements:**
- Property registration format: "Reg. No. 0/1789 Germasogeia, Limassol"
- Passport format: "Passport No. K12345678, Issued by Cyprus, Expiry 14/02/2031"
- District/Town/Area: Use exact spacing and capitalization from examples
- Dates: Convert relative dates (tomorrow, today) to absolute dates
- Phone numbers: Cyprus format validation

**Success Criteria:**
- 99% field completion accuracy
- <1% validation errors requiring user correction
- Average 1.5 minutes from request to final document
- User satisfaction with document quality > 90%

---

### 5.3 Property Listing Management

**Description:**
Create, review, and upload property listings to Zyprus API with AI-assisted field extraction and intelligent retry logic.

**Core Capabilities:**

#### 5.3.1 Listing Creation
- **AI Field Extraction:** Parse property descriptions to auto-populate 30+ fields
  - Property type (house, apartment, land, commercial)
  - Bedrooms, bathrooms, square meters
  - Location (district, town, area)
  - Price, features, amenities
- **Zyprus Taxonomy Integration:** Redis-cached taxonomy data (1-hour TTL)
  - Property types, features, locations from Zyprus API
  - 95% reduction in API calls vs. fresh fetch every time
  - Stale-while-revalidate pattern for optimal performance
- **Draft Management:** Save incomplete listings for later completion
- **Bulk Import:** CSV upload for multiple listings (planned)

#### 5.3.2 Upload Workflow
**Status Progression:**
1. `draft` - Listing created, not ready for upload
2. `queued` - Ready for upload, waiting for API processing
3. `uploading` - Active upload to Zyprus API in progress
4. `uploaded` - Successfully synced to Zyprus platform
5. `failed` - Upload error, requires manual review

**Retry Logic:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s delays
- Maximum 5 retry attempts per listing
- Circuit breaker pattern via Opossum library
  - Threshold: 50% error rate
  - Timeout: 30 seconds
  - Reset timeout: 60 seconds
- Upload attempts tracked in `ListingUploadAttempt` table

#### 5.3.3 Error Handling
- **API Rate Limits:** Respect Zyprus API quotas
- **Validation Errors:** Clear feedback on missing/invalid fields
- **Network Failures:** Automatic retry with exponential backoff
- **Detailed Logging:** All errors logged with context (listingId, userId, error message)

**Technical Implementation:**
- **Database Tables:**
  - `PropertyListing` - Core listing data
  - `ListingUploadAttempt` - Retry/error tracking
- **Indexes:** Composite index on (userId, createdAt) for 10-100x faster queries
- **Caching:** Redis cache for taxonomy (Vercel KV)
  - Serializes Maps to plain objects for storage
  - Deserializes on retrieval
  - Fallback to in-memory cache if Redis fails
- **API Client:** `lib/zyprus/client.ts` with OAuth integration

**User Interface:**
- Listing creation form with AI autofill
- Real-time validation feedback
- Upload queue dashboard showing status
- Retry button for failed uploads
- Detailed error messages for troubleshooting

**Success Criteria:**
- 95% upload success rate
- Average listing creation time < 3 minutes
- <5% manual intervention rate for failed uploads
- Zero data loss on upload failures

---

### 5.4 Telegram Bot Integration

**Description:**
Webhook-powered conversational bot for external client support and document generation via Telegram.

**Core Capabilities:**
- **Conversational Interface:** Same AI capabilities as web interface
- **Document Generation:** All 38 templates accessible via Telegram chat
- **Knowledge Base Access:** Cyprus real estate Q&A
- **Calculator Tools:** Transfer fees, VAT, capital gains tax via chat commands
- **Multi-Message Handling:** Automatic message splitting for long responses (4096 char Telegram limit)

**Technical Implementation:**
- **Webhook Endpoint:** `/api/telegram/webhook`
- **Handler:** `lib/telegram/message-handler.ts`
- **Authentication:** Secret token validation
- **Message Persistence:** Same PostgreSQL tables as web chat

**Optimizations:**
- **Typing Indicators:** Time-based (3-second intervals) instead of character-count
  - Reduced from sending every 500 characters to max once every 3 seconds
  - 90% reduction in Telegram API calls
  - 10-20ms faster per response
- **Response Streaming:** Real-time message updates as AI generates
- **Error Recovery:** Graceful degradation on API failures

**Use Cases:**
1. **External Client Support:** Clients message bot for property info
2. **Agent Remote Access:** Agents generate documents on-the-go
3. **After-Hours Support:** Automated responses outside business hours
4. **Notification Channel:** Push updates about listings, viewings, documents

**Limitations:**
- No file uploads (Telegram API limitation)
- Text-only responses (no rich formatting)
- No access to property listing management UI
- No bulk operations

**Success Criteria:**
- <3 second response time for simple queries
- 95% uptime (independent of web interface)
- <1% message delivery failures
- User satisfaction > 80% (Telegram-specific)

---

### 5.5 Cyprus Real Estate Calculators

**Description:**
Specialized calculation tools for Cyprus property transactions, integrated as AI chat tools.

#### 5.5.1 VAT Calculator

**Purpose:** Calculate Value Added Tax for Cyprus property purchases

**Calculation Logic:**
- **Residential Properties (New Construction):**
  - **Old Policy** (planning permit before Oct 31, 2023):
    - First 200 m²: 5% VAT
    - Remaining area: 19% VAT
    - Families with 3+ children: +15 m² per additional child at 5% rate
  - **New Policy** (planning permit from Nov 1, 2023):
    - First 130 m² up to €350,000 value: 5% VAT
    - Total transaction max €475,000
    - Total buildable area max 190 m²
    - Exceeding limits: 19% VAT on excess

- **Land (Residential):**
  - Agricultural land: 0% VAT
  - Commercial land: 19% VAT
  - Private seller (no sales in 10+ years): 0% VAT possible
  - Company seller or recent sales: 19% VAT
  - **Main Residence Land:** Can claim back 14% VAT (19% - 5%) if:
    - Land < 1,500 m²
    - Building own permanent residence
    - Use for 6+ months

- **Commercial Properties:** 19% VAT (standard rate)

**Inputs:**
- Property type (house, apartment, land)
- Property area (m²)
- Purchase price (€)
- Planning permit date
- Buyer status (main residence intent, family size)

**Outputs:**
- VAT amount (€)
- Effective VAT rate (%)
- Breakdown (if split rate applies)
- Applicable policy (Old/New)
- Eligibility for reduced rate

**Tool Name:** `calculateVAT`

---

#### 5.5.2 Transfer Fee Calculator

**Purpose:** Calculate Cyprus property transfer fees (paid to Land Registry)

**Calculation Brackets:**
| Property Value (€) | Fee Rate | Calculation |
|-------------------|----------|-------------|
| 0 - 85,000 | 3% | Value × 3% |
| 85,001 - 170,000 | 5% | (Value - 85,000) × 5% + 2,550 |
| 170,001+ | 8% | (Value - 170,000) × 8% + 6,800 |

**Special Cases:**
- **First-time property transfer:** 50% discount on fees
- **Land + VAT scenario:** If plot subject to VAT but appraised higher:
  - Example: Purchase €120,000 + VAT, appraised €200,000
  - Transfer fees on difference: €200,000 - €120,000 = €80,000
  - No 50% discount applies in this case

**Additional Fees:**
- **Refugee Compensation Fee:** 0.004% of selling price (seller pays)
  - Example: €180,000 sale = €720 fee

**Inputs:**
- Property value (€)
- First-time transfer (yes/no)
- VAT applicable (yes/no)
- Appraised value if different

**Outputs:**
- Total transfer fees (€)
- Breakdown by bracket
- Discount applied (if any)
- Additional fees (refugee compensation)

**Tool Name:** `calculateTransferFees`

**Reference:** https://www.zyprus.com/help/1260/property-transfer-fees-calculator

---

#### 5.5.3 Capital Gains Tax Calculator

**Purpose:** Calculate capital gains tax on Cyprus property sales (seller liability)

**Tax Rate:** Fixed 20% on gains (individuals and companies)

**Calculation:**
```
Gain = Selling Price - (Adjusted Cost + Allowable Expenses)
Tax = Gain × 20%
```

**Adjusted Cost Components:**
- Original purchase price
- Additional expenditure (renovations, improvements)
- Inflation adjustment (based on CPI index)
- **Special Rule:** Properties purchased before 1980 use market value as of Jan 1, 1980

**Allowable Expenses:**
- Interest on property loan
- Real estate agent fees
- Legal fees
- Advertising costs for sale

**Exemptions:**
- No gain = No tax
- Certain family transfers (inheritance to adult children)

**Inputs:**
- Original purchase price (€)
- Original purchase date
- Selling price (€)
- Additional expenses (€)
- Allowable expenses (€)
- Inflation rate (optional, auto-calculated)

**Outputs:**
- Taxable gain (€)
- Capital gains tax owed (€)
- Effective tax rate on sale (%)
- Breakdown showing cost basis adjustment

**Tool Name:** `calculateCapitalGainsTax`

**Reference:** https://www.zyprus.com/capital-gains-calculator

---

#### 5.5.4 Yield & ROI Calculator

**Purpose:** Calculate property investment returns

**Formulas:**
1. **Yield = Annual Income / Capital Value**
2. **Capital Value = Annual Income / Yield**
3. **Annual Income = Capital Value × Yield**

**Example:**
- Property value: €100,000
- Annual rent: €6,000 (€500/month)
- Yield: 6,000 / 100,000 = **6%**

**Use Cases:**
- Compare investment properties by yield
- Estimate market value based on rental income
- Calculate expected rental income for budgeting

**Inputs:**
- Property value (€) OR Annual income (€)
- Annual income (€) OR Target yield (%)
- Property type (for market yield comparison)

**Outputs:**
- Yield (%)
- Expected annual income (€)
- Expected monthly income (€)
- Comparison to market average

**Tool Name:** `calculateYield`

---

### Calculator Integration

**Access Methods:**
1. **Chat Interface:** Natural language requests trigger calculator tools
   - Example: "What's the VAT on a €300,000 apartment?"
   - SOFIA invokes `calculateVAT` tool, returns formatted result
2. **Direct Tool Call:** Programmatic access for integrations
3. **Telegram Bot:** Same calculators available via bot commands

**User Experience:**
- Instant results (< 500ms calculation time)
- Clear breakdown of calculation steps
- Links to official Cyprus government calculators for verification
- Ability to save calculations for later reference

**Validation:**
- All calculations validated against official Cyprus tax authority formulas
- Regular updates when tax rates/thresholds change
- Unit tests ensure calculation accuracy

**Success Criteria:**
- 100% calculation accuracy vs. official calculators
- <1 second response time for all calculator requests
- 90% user satisfaction with result clarity

---

## 6. Technical Requirements

### 6.1 Technology Stack

**Frontend:**
- **Framework:** Next.js 15.3.0 (App Router)
- **UI Components:** React 19.0 RC
- **Styling:** Tailwind CSS 4.0
- **Icons:** Radix UI Icons, Lucide React
- **Code Editor:** CodeMirror 6 (for document preview)
- **Animations:** Framer Motion 11
- **Forms:** React Hook Form 7

**Backend:**
- **Runtime:** Node.js 20+
- **API Routes:** Next.js API routes (serverless functions)
- **Streaming:** Server-Sent Events (SSE) via `JsonToSseTransformStream`
- **Authentication:** NextAuth.js 5.0 Beta

**AI & Machine Learning:**
- **AI Platform:** Vercel AI SDK 5.0 with AI Gateway (MANDATORY - no fallback)
- **Models:**
  - Claude 4.5 Haiku (default): $1.00/M input, $5.00/M output
  - Claude 4.5 Sonnet (premium): $3.00/M input, $15.00/M output
  - GPT-4o Mini (budget): $0.15/M input, $0.60/M output
- **Token Tracking:** tokenlens library
- **Prompt Caching:** Anthropic prompt caching (Claude models only)

**Database:**
- **Primary:** PostgreSQL (Vercel Postgres)
- **ORM:** Drizzle ORM 0.34
- **Migrations:** Drizzle Kit 0.25
- **Schema:** See Section 6.2

**Caching & Rate Limiting:**
- **Cache:** Redis (Vercel KV / Upstash)
- **Rate Limiting:** @upstash/ratelimit
- **Session Store:** Redis-backed sessions

**External Integrations:**
- **Zyprus API:** OAuth 2.0, REST API
- **Telegram Bot API:** Webhook-based
- **Vercel Blob:** File storage for documents

**Development Tools:**
- **Package Manager:** pnpm 9.12
- **Linting:** Ultracite 5.3
- **Testing:**
  - E2E: Playwright 1.50
  - Unit: Node.js built-in test runner
- **Type Checking:** TypeScript 5.6

---

### 6.2 Database Schema

**Core Tables:**

1. **User**
   - `id` (UUID, primary key)
   - `email` (unique)
   - `password` (hashed with bcrypt-ts)
   - `name`
   - `createdAt`, `updatedAt`
   - **Indexes:** `email` (unique)

2. **Chat**
   - `id` (UUID, primary key)
   - `userId` (foreign key → User)
   - `title`
   - `visibility` (public, private)
   - `createdAt`, `updatedAt`, `deletedAt` (soft delete)
   - **Indexes:**
     - `userId, createdAt DESC` (composite, for pagination)
     - `deletedAt` (for filtering)

3. **Message_v2**
   - `id` (UUID, primary key)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `role` (user, assistant, system)
   - `content` (JSONB, message parts)
   - `createdAt`
   - **Indexes:**
     - `chatId, createdAt` (composite, for chat history)
     - `createdAt`

4. **Vote_v2**
   - `id` (UUID, primary key)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `messageId` (foreign key → Message_v2, CASCADE delete)
   - `isUpvoted` (boolean)
   - **Indexes:** `chatId`, `messageId`

5. **PropertyListing**
   - `id` (UUID, primary key)
   - `userId` (foreign key → User)
   - `status` (draft, queued, uploading, uploaded, failed)
   - `title`, `description`, `price`, `location`, etc.
   - `zypsusListingId` (nullable, Zyprus API reference)
   - `createdAt`, `updatedAt`, `deletedAt`
   - **Indexes:**
     - `userId, createdAt DESC` (composite)
     - `deletedAt`
     - `userId`

6. **ListingUploadAttempt**
   - `id` (UUID, primary key)
   - `listingId` (foreign key → PropertyListing)
   - `attemptNumber` (integer)
   - `status` (success, failed)
   - `errorMessage` (nullable)
   - `attemptedAt`
   - **Indexes:** `listingId`

7. **Stream** (chat streaming metadata)
   - `id` (UUID, primary key)
   - `chatId` (foreign key → Chat, CASCADE delete)
   - `streamData` (JSONB)
   - `createdAt`

**Database Optimizations:**
- **Composite Indexes:** Optimized for user-scoped queries with date sorting (10-100x faster)
- **CASCADE Deletes:** Automatic cleanup of related records (75% fewer deletion queries)
- **Soft Deletes:** `deletedAt` column for data recovery
- **Enhanced Logging:** All database errors logged with context (function name, IDs, stack trace)

---

### 6.3 API Architecture

**Chat API** (`/api/chat`)
- **Method:** POST
- **Format:** Server-Sent Events (SSE)
- **Features:**
  - Streaming responses using `streamText()` from Vercel AI SDK
  - Tool execution (calculators, document generation)
  - Token tracking with tokenlens
  - Message persistence to PostgreSQL
  - Anthropic prompt caching (Claude models)
- **Rate Limiting:**
  - Guest: 100 messages/day
  - Regular: 10,000 messages/day
- **Error Handling:** Graceful degradation, retry logic

**Listing API** (`/api/listings`)
- **Methods:** GET, POST, PUT, DELETE
- **Endpoints:**
  - `GET /api/listings` - List user's listings (paginated)
  - `POST /api/listings` - Create new listing
  - `PUT /api/listings/:id` - Update listing
  - `DELETE /api/listings/:id` - Soft delete listing
  - `POST /api/listings/:id/upload` - Queue for Zyprus upload
- **Validation:** Zod schemas for all inputs
- **Error Handling:** Detailed error messages, logging

**Template API** (`/api/templates`)
- **Method:** GET
- **Endpoint:** `/api/templates` - List all 38 templates
- **Response:** JSON metadata (id, name, category, description)
- **Caching:** Static data, 24h cache

**Telegram Webhook** (`/api/telegram/webhook`)
- **Method:** POST
- **Authentication:** Secret token validation
- **Handler:** Processes incoming messages, generates responses
- **Optimizations:** Time-based typing indicators (3s intervals)

---

### 6.4 Environment Variables

**Critical (MANDATORY):**
```bash
AI_GATEWAY_API_KEY=        # Vercel AI Gateway key (REQUIRED - no fallback)
POSTGRES_URL=              # PostgreSQL connection string
AUTH_SECRET=               # NextAuth JWT signing secret
```

**Database (Auto-generated by Vercel):**
```bash
POSTGRES_URL=              # Primary connection
POSTGRES_PRISMA_URL=       # Prisma-compatible URL
POSTGRES_URL_NON_POOLING=  # Direct connection
POSTGRES_USER=             # Database user
POSTGRES_PASSWORD=         # Database password
POSTGRES_HOST=             # Database host
POSTGRES_DATABASE=         # Database name
```

**Redis (Caching & Rate Limiting):**
```bash
REDIS_URL=                 # Redis connection string
UPSTASH_REDIS_REST_URL=    # Upstash REST API URL
UPSTASH_REDIS_REST_TOKEN=  # Upstash REST API token
```

**Integrations:**
```bash
ZYPRUS_CLIENT_ID=          # Zyprus OAuth client ID
ZYPRUS_CLIENT_SECRET=      # Zyprus OAuth client secret
ZYPRUS_API_URL=            # https://dev9.zyprus.com
ZYPRUS_SITE_URL=           # https://dev9.zyprus.com
TELEGRAM_BOT_TOKEN=        # Telegram bot token
TELEGRAM_SECRET_TOKEN=     # Webhook validation token
```

**Storage:**
```bash
BLOB_READ_WRITE_TOKEN=     # Vercel Blob storage token
```

**Security:**
```bash
ACCESS_CODE=               # Access gate password (qualia-access cookie)
```

---

## 7. Performance Requirements

### 7.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Chat message response (simple) | <2s | 5s |
| Chat message response (with tool) | <3s | 8s |
| Document generation | <90s | 180s |
| Property listing creation | <3s | 10s |
| Listing upload to Zyprus | <5s | 30s |
| Calculator tool execution | <500ms | 2s |
| Page load (initial) | <1.5s | 3s |
| Telegram bot response | <3s | 10s |

### 7.2 Throughput Requirements

- **Concurrent Users:** 50 simultaneous users
- **Peak Load:** 200 messages/hour
- **Document Generation:** 100 documents/day
- **Listing Uploads:** 50 listings/day
- **Database Queries:** <100ms for 95th percentile

### 7.3 Optimization Achievements

**Completed (as of Jan 10, 2025):**
- ✅ Database indexes: 10-100x faster filtered queries
- ✅ Telegram typing indicators: 90% fewer API calls
- ✅ System prompt caching: 50-100ms saved per request
- ✅ Zyprus taxonomy Redis cache: 95% fewer API calls, 200-500ms faster
- ✅ Anthropic prompt caching: $2-5 saved per 1,000 requests
- ✅ Optimized pagination: 50% fewer database round-trips
- ✅ CASCADE deletes: 75% fewer deletion queries
- ✅ Enhanced error logging: Faster issue resolution

**Impact:**
- 30-40% faster overall response times
- 50-70% reduction in AI costs (Claude models)
- 95% reduction in external API calls (Zyprus)
- 75% reduction in database query volume (deletes)

### 7.4 Uptime Requirements

- **Production Uptime:** 99.5% during business hours (Cyprus time: 08:00-20:00 EET)
- **Planned Maintenance:** Sundays 02:00-04:00 EET (announced 48h advance)
- **Degraded Service:** Acceptable for <5 minutes during deployments
- **Monitoring:** Vercel Analytics, error tracking, uptime checks

---

## 8. Security & Compliance

### 8.1 Data Protection

**User Data:**
- **Encryption at Rest:** PostgreSQL database encrypted (Vercel managed)
- **Encryption in Transit:** TLS 1.3 for all HTTPS connections
- **Password Security:** bcrypt-ts hashing with salt rounds
- **Session Management:** JWT tokens with 30-day expiration
- **Soft Deletes:** User data retained for 90 days after deletion (recovery window)

**Document Data:**
- **Temporary Storage:** Generated documents stored in-memory during session
- **Blob Storage:** Vercel Blob for permanent document storage (optional)
- **Retention Policy:** Documents auto-deleted after 30 days (configurable)
- **Access Control:** Documents accessible only by creator user

**Chat History:**
- **Retention:** 1 year default, configurable per user
- **Anonymization:** Option to anonymize chat history (remove PII)
- **Export:** Users can export their chat history (GDPR compliance)

### 8.2 Access Control

**Access Gate:**
- All pages require `qualia-access=granted` cookie
- Access code: `ACCESS_CODE` environment variable
- Cookie expiration: 30 days
- Prevents unauthorized access to web interface

**User Authentication:**
- **Guest Users:** Auto-login, limited to 100 messages/day
- **Registered Users:** Email/password authentication, 10,000 messages/day
- **Session Management:** NextAuth.js with JWT tokens
- **Password Requirements:** Minimum 8 characters (enforced by bcrypt-ts)

**Rate Limiting:**
- **Per User Type:** Different quotas (guest vs regular)
- **Redis-backed:** Upstash rate limiting
- **Graceful Degradation:** Clear error messages when limit exceeded
- **Reset:** Daily quota reset at midnight Cyprus time

**API Security:**
- **CORS:** Restricted to allowed origins
- **CSRF Protection:** NextAuth.js built-in protection
- **Input Validation:** Zod schemas for all API inputs
- **SQL Injection Prevention:** Drizzle ORM parameterized queries

### 8.3 Cyprus Real Estate Compliance

**Regulatory Requirements:**
- **Cyprus Real Estate Act:** All documents comply with Cyprus real estate regulations
- **VAT Regulations:** Calculators use current Cyprus VAT law (updated when regulations change)
- **Transfer Fee Tables:** Accurate as of Cyprus Land Registry 2024 rates
- **Marketing Agreement Terms:** Legally compliant exclusive/non-exclusive clauses

**Data Residency:**
- **Primary:** Data hosted in Vercel European region (EU compliance)
- **Backup:** Vercel automatic backups (encrypted)
- **GDPR:** User data exportable, deletable on request

**Audit Trail:**
- **Document Generation:** All generated documents logged with timestamp, user ID
- **Listing Uploads:** Upload attempts tracked in `ListingUploadAttempt` table
- **User Actions:** Chat history persisted for audit purposes
- **Error Logging:** All errors logged with context for troubleshooting

**Legal Disclaimers:**
- All calculator results include disclaimer: "Consult tax professional for final confirmation"
- Marketing agreements include Cyprus real estate regulation references
- Documents generated note: "Auto-generated by SOFIA AI - review before signing"

---

## 9. Integration Requirements

### 9.1 Zyprus API

**Purpose:** Property listing platform integration for Zyprus Property Group

**Authentication:**
- **Protocol:** OAuth 2.0
- **Client Credentials:** `ZYPRUS_CLIENT_ID`, `ZYPRUS_CLIENT_SECRET`
- **Token Endpoint:** `https://dev9.zyprus.com/oauth/token`
- **Token Refresh:** Automatic refresh when expired

**Endpoints Used:**
- `GET /api/taxonomy` - Fetch property types, features, locations (cached in Redis)
- `POST /api/listings` - Create new property listing
- `PUT /api/listings/:id` - Update existing listing
- `GET /api/listings/:id` - Fetch listing details
- `DELETE /api/listings/:id` - Remove listing

**Data Synchronization:**
- **Taxonomy Cache:** Redis (1-hour TTL, stale-while-revalidate)
- **Listing Status:** Real-time updates via webhook (future)
- **Upload Queue:** Background job processing for batch uploads
- **Error Handling:** Exponential backoff retry, circuit breaker pattern

**Rate Limits:**
- **API Calls:** 100 requests/minute
- **Concurrent Uploads:** 5 simultaneous uploads
- **Handling:** Queue excess requests, retry with backoff

**Data Mapping:**
- SOFIA listing fields → Zyprus API schema
- Validation: All required Zyprus fields populated before upload
- Transformation: Location names mapped to Zyprus taxonomy IDs

**Success Criteria:**
- 95% upload success rate
- <5 second average upload time
- Zero data loss on failed uploads
- Automatic retry for transient errors

---

### 9.2 Telegram API

**Purpose:** Conversational bot for external client support

**Authentication:**
- **Bot Token:** `TELEGRAM_BOT_TOKEN` (from BotFather)
- **Webhook Secret:** `TELEGRAM_SECRET_TOKEN` for validation
- **Security:** IP whitelist for webhook endpoint (Telegram servers only)

**Webhook Configuration:**
- **URL:** `https://sofiatesting.vercel.app/api/telegram/webhook`
- **Method:** POST
- **Format:** JSON payload with message data
- **Validation:** `X-Telegram-Bot-Api-Secret-Token` header check

**API Methods Used:**
- `sendMessage` - Send text response to user
- `sendChatAction` - Show typing indicator (every 3 seconds)
- `sendDocument` - Send generated document files
- `getMe` - Verify bot token validity

**Message Handling:**
- **Incoming:** Parse user message, extract intent
- **Processing:** Same AI chat pipeline as web interface
- **Outgoing:** Split long responses into 4096-char chunks
- **Typing Indicator:** Time-based (3s intervals) to reduce API calls

**Optimizations:**
- **Typing Indicators:** Reduced from 500-char intervals to 3-second intervals (90% fewer calls)
- **Response Caching:** Redis cache for common queries
- **Async Processing:** Non-blocking message handling

**Limitations:**
- **File Size:** 50 MB max for document uploads
- **Message Length:** 4096 characters per message (auto-split)
- **Media Support:** Text-only responses (no rich formatting)
- **Rate Limits:** 30 messages/second to same user

**Error Handling:**
- **Network Failures:** Retry with exponential backoff
- **Invalid Messages:** Graceful error response to user
- **API Errors:** Fallback to simple text response
- **Webhook Downtime:** Queue messages for processing when service restored

**Success Criteria:**
- <3 second response time
- 95% uptime independent of web interface
- <1% message delivery failures
- Zero missed messages during downtime

---

### 9.3 Vercel AI Gateway

**Purpose:** Unified access to multiple AI models with consistent billing and observability

**Critical Requirement:**
- **MANDATORY:** AI Gateway is the ONLY way to access AI models
- **No Fallback:** Application will not start without `AI_GATEWAY_API_KEY`
- **Provider:** Vercel AI Gateway (https://vercel.com/docs/ai-gateway)

**Available Models:**
| Model ID | Provider | Model Name | Cost (Input/Output per 1M tokens) |
|----------|----------|------------|-----------------------------------|
| `chat-model` | Anthropic | Claude 4.5 Haiku | $1.00 / $5.00 |
| `chat-model-sonnet` | Anthropic | Claude 4.5 Sonnet | $3.00 / $15.00 |
| `chat-model-gpt4o` | OpenAI | GPT-4o Mini | $0.15 / $0.60 |

**Features Used:**
- **Model Routing:** Automatic routing to correct provider
- **Token Tracking:** Built-in usage tracking
- **Caching:** Anthropic prompt caching support
- **Observability:** Request logs, latency metrics, error rates
- **Billing:** Centralized billing across all models

**Configuration:**
```typescript
// lib/ai/providers.ts
import { gateway } from "@ai-sdk/gateway";

const aiGateway = gateway({
  apiKey: process.env.AI_GATEWAY_API_KEY, // REQUIRED
});

export const chatModel = aiGateway.chatModel("chat-model");
export const chatModelSonnet = aiGateway.chatModel("chat-model-sonnet");
export const chatModelGPT4o = aiGateway.chatModel("chat-model-gpt4o");
```

**Prompt Caching (Claude models only):**
- **Base System Prompt:** Cached for 5 minutes (Anthropic spec)
- **Cache Format:** Array of message parts with `cache_control: { type: "ephemeral" }`
- **Savings:** $2-5 per 1,000 requests (50-70% cost reduction)
- **Detection:** Automatically applied for Claude models, skipped for GPT-4o

**Error Handling:**
- **Missing API Key:** Application fails to start with clear error message
- **Invalid Model:** Fallback to default `chat-model`
- **Rate Limits:** Respect AI Gateway quotas, queue excess requests
- **Network Errors:** Retry with exponential backoff

**Monitoring:**
- **Vercel Dashboard:** Real-time usage, costs, error rates
- **Token Usage:** Tracked per request via tokenlens library
- **Cost Alerts:** Notifications when usage exceeds thresholds

**Success Criteria:**
- 99.9% AI Gateway uptime (Vercel SLA)
- <2 second p95 latency for AI responses
- Monthly AI costs < $200 (production scale: 50 users, 200 msgs/day)
- 50%+ cache hit rate for Claude models

---

## 10. Future Enhancements

### 10.1 Paid Membership Tier

**Status:** Planned (deferred to weeks 4-6)

**Business Model:**
- **Free Tier:** Guest users (100 messages/day)
- **Basic Tier:** Registered users (10,000 messages/day) - FREE
- **Premium Tier:** Paid members (unlimited messages, priority support) - €29/month

**Premium Features:**
- Unlimited messages per day (no quota)
- Access to Claude Sonnet 4.5 (premium quality)
- Priority queue for Zyprus uploads
- Advanced analytics dashboard
- Bulk document generation
- API access for integrations
- Dedicated support channel

**Technical Requirements:**
- Add `paid` user type to `UserType` enum
- Database schema: `subscription` table (userId, tier, status, startDate, endDate)
- Billing integration: Stripe or Paddle
- Subscription management UI
- Webhook handler for subscription events (created, renewed, cancelled)
- Rate limiting update: Check tier before enforcing limits

**Implementation Tasks:**
- Stripe/Paddle account setup
- Payment form UI
- Subscription lifecycle management
- Invoice generation
- Customer portal for plan changes
- Dunning for failed payments

**Success Metrics:**
- 10% conversion rate from free to paid within 6 months
- <5% churn rate monthly
- Average customer lifetime value > €300

---

### 10.2 Additional Document Types

**Planned Templates (15 new):**
- Property sale contracts (5 variants)
- Rental agreements (3 variants)
- Power of attorney forms (2 variants)
- Property inspection reports (2 variants)
- Commission agreements (3 variants)

**Requirements:**
- Cyprus legal compliance review
- Template design and testing
- Field validation rules
- SOFIA training for new templates

---

### 10.3 Analytics Dashboard

**Purpose:** Real-time insights into SOFIA usage and performance

**Metrics Tracked:**
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

---

### 10.4 Multi-Language Support

**Languages:**
- Greek (primary for Cyprus market)
- English (current)
- Russian (secondary market)

**Implementation:**
- Next.js i18n routing
- Translation files for UI
- Template translations (38 templates × 3 languages)
- Language detection from user browser
- User preference setting

---

### 10.5 Mobile App

**Platform:** React Native (iOS + Android)

**Features:**
- Full chat interface
- Document generation
- Calculator tools
- Property listing management
- Push notifications for upload status
- Offline mode for viewing history

**Rationale:**
- Agents need mobile access during property viewings
- Faster than responsive web on mobile
- Push notifications improve engagement

---

### 10.6 Voice Input

**Technology:** Web Speech API / OpenAI Whisper

**Use Cases:**
- Hands-free document generation during property tours
- Accessibility for visually impaired users
- Faster input than typing

**Implementation:**
- Voice recording component
- Speech-to-text API integration
- Streaming transcription
- Voice command support ("Generate registration")

---

### 10.7 PDF Export

**Features:**
- One-click PDF generation from documents
- Custom branding (Zyprus logo, colors)
- Digital signatures support
- Email PDF directly to client
- Batch PDF export

**Technology:**
- React-PDF or Puppeteer for rendering
- Vercel Blob storage for PDFs
- Email integration via SendGrid/Resend

---

### 10.8 Property Search AI

**Purpose:** AI-powered property recommendations

**Capabilities:**
- Natural language property search ("3-bedroom apartment in Limassol under €300k")
- Match clients to listings based on preferences
- Proactive recommendations ("New listing matches your criteria")
- Integration with Zyprus property database

**Implementation:**
- Vector embeddings for property descriptions
- Semantic search via Pinecone/Weaviate
- Real-time matching algorithm
- Notification system for new matches

---

## 11. Success Criteria

### 11.1 User Adoption Metrics

**6-Month Targets:**
- **Active Users:** 100% of Zyprus agents (50 users)
- **Daily Active Users:** 80% (40 users/day)
- **Documents Generated:** 80% of all documents via SOFIA (vs. manual)
- **Retention:** 90% monthly active user retention

**Measurement:**
- Google Analytics 4 events tracking
- User login frequency
- Document generation count per user
- Session duration and engagement

---

### 11.2 Document Generation Accuracy

**Quality Metrics:**
- **Field Completion:** 99% of mandatory fields populated correctly
- **Validation Errors:** <1% of generated documents require manual correction
- **Client Acceptance:** 95% of documents sent to clients without revision
- **Compliance:** 100% of documents pass Cyprus real estate regulation audit

**Testing:**
- Random sampling of 100 documents/month for manual review
- User feedback surveys after document generation
- Legal team quarterly compliance audit
- Automated validation checks before document finalization

---

### 11.3 System Performance

**Infrastructure Metrics:**
- **Uptime:** 99.5% during business hours (Cyprus time)
- **Response Time:** 95th percentile < 3 seconds for chat responses
- **Error Rate:** <0.5% of all requests
- **Database Performance:** <100ms for 95th percentile queries

**Monitoring:**
- Vercel Analytics for response times
- Sentry for error tracking
- PostgreSQL slow query log
- Redis cache hit rate monitoring

---

### 11.4 Cost Efficiency

**Monthly Cost Targets (50 users, 200 docs/day):**
- **AI Costs:** <$200/month
- **Database:** <$50/month (Vercel Postgres)
- **Redis:** <$20/month (Vercel KV)
- **Total Infrastructure:** <$300/month

**Cost Per Unit:**
- **Cost per document:** <$0.10
- **Cost per message:** <$0.01
- **Cost per user:** <$6/month

**Optimization Tracking:**
- Actual costs vs. budget (weekly review)
- Token usage per model (Claude vs GPT-4o)
- Cache hit rates (prompt caching, Redis)
- API call reduction (Zyprus, Telegram)

**Achieved Optimizations (Jan 2025):**
- 50-70% AI cost reduction via prompt caching
- 95% reduction in Zyprus API calls via Redis cache
- 90% reduction in Telegram API calls via time-based typing
- 75% reduction in database queries via CASCADE deletes

---

## Appendix A: Glossary

**Terms:**
- **SOFIA/Sophia:** AI Assistant for Zyprus Property Group
- **Zyprus:** Cyprus property listing platform (https://zyprus.com)
- **Registration:** Document registering client intent to buy/sell/rent property
- **Viewing Form:** Document scheduling property viewing appointment
- **Marketing Agreement:** Legal contract granting property marketing rights
- **Transfer Fees:** Cyprus government fees paid to Land Registry for property transfer
- **VAT:** Value Added Tax on Cyprus property purchases (5% or 19%)
- **Capital Gains Tax:** 20% tax on property sale profits in Cyprus
- **Yield:** Annual rental income as percentage of property value
- **AI Gateway:** Vercel's unified AI model access service
- **Anthropic Prompt Caching:** Feature to cache static parts of AI prompts for cost savings
- **SSE:** Server-Sent Events (streaming HTTP responses)
- **Drizzle ORM:** TypeScript ORM for PostgreSQL
- **CASCADE Delete:** Database feature to automatically delete related records

**Abbreviations:**
- **PRD:** Product Requirements Document
- **SSE:** Server-Sent Events
- **ORM:** Object-Relational Mapping
- **VAT:** Value Added Tax
- **TTL:** Time To Live (cache duration)
- **API:** Application Programming Interface
- **UI:** User Interface
- **NPS:** Net Promoter Score

---

## Appendix B: References

**Documentation:**
- Project README: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/README.md`
- Development Guide: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/CLAUDE.md`
- Implementation Plan: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/IMPLEMENTATION_PLAN.md`
- Deployment Guide: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/docs/guides/deployment-ready.md`
- Template Overview: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/docs/templates/overview.md`
- Cyprus Knowledge Base: `/home/qualiasolutions/Desktop/Projects/aiagents/sofiatesting/docs/knowledge/cyprus-real-estate-knowledge-base.md`

**External Resources:**
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Next.js 15 Documentation: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team/
- Cyprus Transfer Fee Calculator: https://www.zyprus.com/help/1260/property-transfer-fees-calculator
- Cyprus Capital Gains Calculator: https://www.zyprus.com/capital-gains-calculator
- Cyprus VAT Calculator: https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
- Anthropic Prompt Caching: https://docs.anthropic.com/en/docs/prompt-caching

**Technology Stack:**
- Next.js: https://nextjs.org
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- PostgreSQL: https://www.postgresql.org
- Telegram Bot API: https://core.telegram.org/bots/api

---

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Next Review:** December 14, 2025
**Owner:** Qualia Solutions (Product Manager)
