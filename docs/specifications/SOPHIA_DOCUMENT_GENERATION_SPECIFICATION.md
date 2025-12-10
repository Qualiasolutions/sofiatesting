# SOPHIA AI — DOCUMENT GENERATION SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's document generation capabilities. Sophia is an AI assistant for Zyprus Property Group (Cyprus Real Estate) that generates professional documents for real estate agents.

---

## SECTION 1: DOCUMENT GENERATION OVERVIEW

### 1.1 System Architecture

Sophia generates DOCX documents dynamically based on user requests and delivers them through multiple channels:

| Component | Description |
|-----------|-------------|
| AI Tool | `sendDocument` tool in chat interface |
| Generator | `docx` package (Node.js DOCX generation) |
| Storage | Vercel Blob Storage (public URLs) |
| Delivery | Email (Resend), WhatsApp, or Direct Download |

### 1.2 Document Categories

| Category | Count | Types |
|----------|-------|-------|
| Registrations | 8 | Seller, Bank, Developer registrations |
| Viewing Forms & Reservations | 4 | Standard, Advanced, Property Reservation, Reservation Agreement |
| Marketing Agreements | 3 | Email, Non-Exclusive, Exclusive |
| Client Communications | 22 | Phone requests, follow-ups, valuations, selling requests, AML/KYC procedures |
| **TOTAL** | 38 | Complete document suite |

---

## SECTION 2: TEMPLATE SYSTEM

### 2.1 Registration Templates

| ID | Template Name | Required Fields | Subject Line Format |
|----|---------------|-----------------|---------------------|
| 01 | Standard Seller Registration | 4 fields | Registration – [BUYER] – [REG] – [PROP] |
| 02 | Seller with Marketing Agreement | 5 fields | Same as Standard |
| 03 | Rental Property Registration | 4 fields | Registration – [TENANT] – [PROP] |
| 04 | Advanced Seller Registration | 8+ fields | Custom format |
| 05 | Bank Property Registration | 4 fields | Registration Confirmation - [CLIENT] |
| 06 | Bank Land Registration | 4 fields | Same + viewing form reminder |
| 07 | Developer Registration (with Viewing) | 3 fields | Registration – [CLIENTS] – [PROJECT] – [LOCATION] |
| 08 | Developer Registration (no Viewing) | 1 field | Registration – [CLIENTS] – [PROJECT] – [LOCATION] |

### 2.2 Viewing Form & Reservation Templates

| Template Name | Required Fields | Special Notes |
|---------------|-----------------|---------------|
| Standard Viewing Form | 6 fields | Supports 1+ people, simple format |
| Advanced Viewing Form | 6 fields | Legal clause included |
| Property Reservation Form | Multiple | Deposit details required |
| Property Reservation Agreement | Multiple | Full legal agreement |

### 2.3 Marketing Agreement Templates

| Template Name | Required Fields | Notes |
|---------------|-----------------|-------|
| Email Marketing Agreement | Seller Name, Reg No., Location, Price | NO link required |
| Non-Exclusive Marketing Agreement | Full contract fields | Standard listing agreement |
| Exclusive Marketing Agreement | Full contract fields | Exclusive rights period |

### 2.4 Client Communication Templates

| ID | Template Name | Purpose |
|----|---------------|---------|
| 01 | Good Client - Email | Phone call request via email |
| 02 | Good Client - WhatsApp | Phone call request via WhatsApp |
| 03 | Valuation Quote | Quote for property valuation |
| 04 | Valuation Request Received | Confirmation of valuation request |
| 05 | Client Not Providing Phone | Response when client won't share phone |
| 05B | Good Client (Missing Phone) | When phone number was forgotten |
| 06 | Follow-up - Multiple Properties | Multiple property options |
| 07 | Follow-up - Single Property | Single property option |
| 08 | Buyer Viewing Confirmation | Confirm viewing appointment |
| 09 | No Options - Low Budget | Budget too low for requirements |
| 10 | Multiple Areas Issue | Too many areas requested |
| 11 | Time Wasters Decline | Politely declining non-serious clients |
| 12 | Still Looking Follow-up | Check-in with searching clients |
| 13 | No Agent Cooperation | When agents decline cooperation |
| 14A | AML/KYC Request to Lawyer | Request documents from lawyer |
| 14B | AML/KYC Internal Compliance | Internal compliance email |
| 15 | Selling Request Received | Confirm seller inquiry received |
| 16 | Recommended Pricing Advice | Pricing recommendations |
| 17 | Overpriced Property Decline | Declining overpriced listings |
| 18 | Property Location Information Request | Request location details |
| 19 | Different Regions Request | Client interested in multiple regions |
| 20 | Client Follow Up - No Reply Yet | Following up unresponsive clients |
| 21 | Plain Request to info@zyprus.com | General information request |
| 22 | Apology for Extended Delay | Apology for delayed response |

---

## SECTION 3: DOCUMENT GENERATION FLOW

### 3.1 Generation Process

```
User Request
    ↓
Sophia extracts template type + fields from message
    ↓
Check if ALL required fields present?
    ↓
YES → Generate DOCX immediately
NO  → Ask ONLY for missing fields
    ↓
DOCX Generated via `docx` package
    ↓
Upload to Vercel Blob Storage
    ↓
Return document URL + send form to user
```

### 3.2 Document Generation API

**Endpoint:** `POST /api/documents/generate`

**Request Body:**
```json
{
  "content": "Full text content of the document",
  "filename": "Document Title",
  "title": "Display title (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/documents/...",
  "filename": "Document Title.docx",
  "size": 12345,
  "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

### 3.3 DOCX Formatting

The document generator supports:

| Feature | Syntax | Output |
|---------|--------|--------|
| Bold Text | `**text**` | **Bold** formatting |
| Headers | Line starting and ending with `**` | Heading 1 style |
| Line Breaks | Newline characters | Paragraph spacing |
| Footer | Auto-generated | "Generated by SOFIA - Zyprus Property Group AI Assistant" |

---

## SECTION 4: FIELD EXTRACTION RULES

### 4.1 Smart Field Extraction

Sophia automatically extracts fields from user messages:

| Pattern | Extracted Field |
|---------|-----------------|
| "the client is [Name]" | Client Name |
| "client is [Name]" | Client Name |
| "[Name] is the client" | Client Name |
| "tomorrow at [time]" | Convert to actual date/time |
| "today at [time]" | Convert to actual date/time |
| "registration developer" | Template 07 |
| "€350,000" or "350000 euros" | Price |

### 4.2 Critical Extraction Rules

```
RULE: Extract ALL fields from user's message FIRST
RULE: NEVER ask for fields already provided
RULE: Convert relative dates automatically ("tomorrow" → actual date)
RULE: Generate IMMEDIATELY when all required fields present
RULE: Ask for ONE missing field at a time
```

### 4.3 Field Request Format

When fields are missing, Sophia asks with specific format:

**For 1-2 missing fields:**
```
Please provide the property's registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol)

Please provide the marketing price (e.g., €350,000)
```

**For 3+ missing fields:**
```
Please share the following so I can complete [TYPE] registration:

1. Client Information: buyer name (e.g., Fawzi Goussous)
2. Property Introduced: (e.g., Reg. No. 0/1789 Germasogeia, Limassol)
```

**Property Link Rules:**
```
MANDATORY: Bank Registrations, Good Client templates
OPTIONAL: Seller Registrations (omit line if not provided)
NOT NEEDED: Email Marketing Agreement, Developer Registration
```

---

## SECTION 5: FORMATTING RULES

### 5.1 Mandatory Bolding Rules

**What to BOLD:**
- Any monetary value (e.g., **€500 + VAT**, **€350,000**)
- Any fee percentage (e.g., **5% + VAT**)
- Any price range (e.g., **€320,000 - €340,000**)
- Field labels before colons (e.g., **Fees:**, **Client Name:**)

**What NEVER to BOLD:**
- Client Names in greetings
- Links or URLs
- Company names
- Template body text

### 5.2 Greeting Protocols

| Context | Greeting Format |
|---------|-----------------|
| Default | Dear XXXXXXXX, |
| Bank Registration | Dear [BANK_NAME] Team, |
| Developer Registration | Dear XXXXXXXX, (generate immediately) |
| Client Communications | Dear [Client's Name], OR Dear XXXXXXXX, |

### 5.3 Phone Masking for Bank Registrations

**Rule:** Hide the 3rd and 4th digits with `**`

| Input | Output |
|-------|--------|
| 99 07 67 32 | 99 ** 67 32 |
| +357 99 07 67 32 | +357 99 ** 67 32 |
| +44 79 83 24 71 | +44 79** 832471 |

**Logic:**
```
Phone: XX YY ZZ WW → XX ** ZZ WW
The "07" becomes "**" (3rd and 4th digits hidden)
```

---

## SECTION 6: DOCUMENT DELIVERY

### 6.1 Delivery Methods

| Method | Requirement | Handler |
|--------|-------------|---------|
| Email | Recipient email address | Resend API |
| WhatsApp | Recipient phone number | WhatsApp API |
| Download | None | Direct blob URL |

### 6.2 Send Document API

**Endpoint:** `POST /api/documents/send`

**Request Body:**
```json
{
  "documentUrl": "https://blob.vercel-storage.com/...",
  "documentTitle": "Property Agreement",
  "recipientName": "John Smith",
  "recipientEmail": "john@example.com",
  "recipientPhone": "+35799123456",
  "method": "email",
  "message": "Optional custom message"
}
```

### 6.3 Email Format

```html
Hello [Recipient Name],

[Optional custom message]

Please find attached the document: [Document Title]

If you have any questions, please don't hesitate to reach out.

---
This email was sent by SOFIA, the AI assistant for Zyprus Property Group.
```

---

## SECTION 7: SPECIAL TEMPLATE RULES

### 7.1 Developer Registration

```
TRIGGER: "developer registration", "registration developer", "dev reg"
FIELDS: Client Names, Viewing Date & Time (optional: Project Name, Location)
GREETING: Dear XXXXXXXX, (no contact person required)
ACTION: Generate IMMEDIATELY when client name + viewing time present
```

### 7.2 Bank Property Registration (Template 05)

**Required Fields:**
- Client Name
- Client Phone (will be masked)
- Property Link from Bank website (MANDATORY)
- Agent Mobile Number

**Email Template:**
```
Dear [BANK_NAME] Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: [AGENT_MOBILE]

Registration Details: [CLIENT_NAME] [CLIENT_PHONE_MASKED]

Property: [PROPERTY_LINK]

Looking forward to your prompt reply.
```

**Example Output:**
```
Dear Remu Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: 99 07 67 32

Registration Details: Natasha Stainthorpe +44 79** 832471

Property: https://www.remuproperties.com/Cyprus/listing-29190

Looking forward to your prompt reply.
```

### 7.3 Bank Land Registration (Template 06)

**Required Fields:**
- Client Name
- Client Phone (will be masked)
- Property Link from Bank website (MANDATORY)

**Email Template:**
```
Dear [BANK_NAME] Team,

This email is to provide you with a registration.

Please find attached the viewing form for the below Land.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

Registration Details: [CLIENT_NAME] [CLIENT_PHONE_MASKED]

Property: [PROPERTY_LINK]

Looking forward to your prompt reply.
```

**CRITICAL REMINDER:** After generating, remind agent:
```
⚠️ Don't forget to attach the viewing form when sending this email!
Banks don't attend viewings, so they require the signed viewing form as proof.
```

### 7.4 Bank Registration Rules

```
PHONE MASKING FORMAT:
  - Hide 3rd and 4th digits with **
  - Example: 99 07 67 32 → 99 ** 67 32
  - Example: +44 79 83 24 71 → +44 79** 832471

BANK NAME DETECTION:
  - Auto-detect from link URL (remuproperties.com → "Remu Team")
  - Known banks: Remu, Gordian, Altia, Altamira
  - If bank not visible in link → ASK agent for bank name

PROPERTY LINK ALTERNATIVES:
  - If link unavailable → Accept Registration No. (e.g., Reg No. 0/1678 Tala, Paphos)
  - Worst case → Accept property description (e.g., Limas Building, Unit No. 103 Tala, Paphos)

LAND vs PROPERTY:
  - Land registration → Include "Please find attached the viewing form" line
  - Land registration → Remind agent to attach viewing form
  - Property registration → Include "My Mobile" line for viewing arrangement
```

### 7.5 Marketing Agreement Detection

| User Says | Template Selected |
|-----------|-------------------|
| "email marketing" | Email Marketing Agreement |
| "non-exclusive marketing" | Non-Exclusive Agreement |
| "exclusive marketing" | Exclusive Agreement |
| "marketing agreement" (no type) | ASK which type |

### 7.6 Email Marketing Agreement

```
TRIGGER: "email marketing", "marketing email"
REQUIRED FIELDS:
  - Seller Name (e.g., Marios Charalambous)
  - Registration Number (e.g., 0/1789)
  - Location (e.g., Tala, Paphos)
  - Marketing Price (e.g., €350,000)
  - Property Description (if no title deed)

NOT REQUIRED: Property Link (do NOT ask for link)
FEES: Fixed at 5% + VAT (bold allowed)
GREETING: Dear XXXXXXXX,
REMINDER: Attach title deed when sending
```

### 7.7 Viewing Form - Multiple People

When "2 people", "for 2", or "couple" mentioned:
- Add SECOND "and I…………… with ID……………." line
- Change "to me" → "to us"
- Add TWO Name/Signature sections at bottom

---

## SECTION 8: BEHAVIOR SUMMARY MATRIX

| Task | Sophia's Responsibility | Human Responsibility |
|------|------------------------|---------------------|
| Template selection | Auto-detect from keywords | Clarify if ambiguous |
| Field extraction | Extract from conversation | Provide missing fields |
| Date conversion | Auto-convert "tomorrow", "today" | Specify time if missing |
| Document generation | Generate DOCX automatically | None |
| Formatting | Apply bold rules, masks | None |
| Delivery | Email/WhatsApp/Download | Choose method + recipient |

---

## SECTION 9: CRITICAL RULES (ALWAYS ENFORCE)

1. **Extract ALL fields FIRST** — Scan entire message before asking questions

2. **NEVER ask for provided fields** — If field was mentioned, use it silently

3. **Generate IMMEDIATELY** — When all required fields present, no confirmations

4. **ONE question at a time** — Never combine multiple field requests

5. **Property Link is MANDATORY for Bank** — Never generate bank registration without link

6. **Always mask bank client phones** — Format: +357 XX** YYYYY

7. **Bold pricing and labels** — All monetary values and field labels before colons

8. **Use Dear XXXXXXXX as default** — Unless template specifies otherwise

---

*End of Document Generation Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
