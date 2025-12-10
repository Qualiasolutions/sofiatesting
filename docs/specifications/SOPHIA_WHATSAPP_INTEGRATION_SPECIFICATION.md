# SOPHIA AI — WHATSAPP INTEGRATION SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's WhatsApp integration. Sophia is an AI assistant for Zyprus Property Group (Cyprus Real Estate) that communicates with agents via WhatsApp for document generation, property calculations, and real estate assistance.

---

## SECTION 1: INTEGRATION OVERVIEW

### 1.1 System Architecture

Sophia's WhatsApp integration enables real estate agents to communicate with the AI assistant directly through WhatsApp messaging.

| Component | Description |
|-----------|-------------|
| API Provider | Third-party WhatsApp Business API |
| Webhook Endpoint | `/api/whatsapp/webhook` |
| Message Handler | `lib/whatsapp/message-handler.ts` |
| Document Generator | `lib/whatsapp/docx-generator.ts` |

### 1.2 Supported Message Types

| Type | Inbound Support | Outbound Support |
|------|-----------------|------------------|
| Text Messages | Yes | Yes |
| Documents (DOCX, PDF) | No | Yes |
| Images | No | Yes |
| Voice Messages | No | No |
| Video | No | No |

### 1.3 Key Capabilities

- Full conversational AI assistant via WhatsApp
- Automatic document generation and delivery
- Property calculator tools (Transfer Fees, Capital Gains, VAT)
- Property listing creation and management
- Long message splitting (4096 character limit handling)

---

## SECTION 2: WEBHOOK CONFIGURATION

### 2.1 Webhook Endpoint

**URL:** `https://your-domain.vercel.app/api/whatsapp/webhook`

**Method:** `POST` for incoming messages, `GET` for verification

### 2.2 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WASENDER_API_KEY` | Session-specific API key | Yes |
| `WASENDER_PERSONAL_ACCESS_TOKEN` | Account-level token | Optional |
| `WASENDER_WEBHOOK_SECRET` | Webhook verification secret | Recommended |

### 2.3 Webhook Events

| Event Type | Description | Handling |
|------------|-------------|----------|
| `message` | Incoming message from user | Process with AI |
| `message.status` | Delivery status update | Log only |
| `session.status` | Connection status change | Log only |
| `contact.upsert` | Contact update | Log only |
| `group.update` | Group change | Log only |
| `call` | Voice call event | Log only |

### 2.4 Security Configuration

```
Authentication: x-webhook-secret header verification
Secret Location: WASENDER_WEBHOOK_SECRET environment variable
Response: Always return 200 OK (prevent retry flooding)
```

---

## SECTION 3: MESSAGE PROCESSING FLOW

### 3.1 Inbound Message Flow

```
WhatsApp User sends message
        ↓
Webhook receives POST /api/whatsapp/webhook
        ↓
Verify webhook secret (if configured)
        ↓
Parse WaSenderWebhookPayload
        ↓
Check message type (only text supported)
        ↓
Skip group messages (personal chats only)
        ↓
Get or create WhatsApp user in database
        ↓
Get or create chat session
        ↓
Log incoming message to agent_execution_log
        ↓
STEP 1: ROUTING (Intent Classification)
Use lightweight model to classify intent
        ↓
STEP 2: STRUCTURED EXTRACTION (if high confidence)
Extract fields for specific intents
        ↓
STEP 3: AI RESPONSE GENERATION
Generate response with full AI model + tools
        ↓
STEP 4: DELIVERY
Document? → Send as .docx
Text? → Send as message (auto-split if long)
```

### 3.2 Intent Classification

The router classifies incoming messages to optimize processing:

| Intent | Confidence Threshold | Action |
|--------|---------------------|--------|
| `developer_registration` | > 0.8 | Extract developer registration fields |
| `marketing_agreement` | > 0.8 | Extract marketing agreement fields |
| `viewing_form` | > 0.8 | Extract viewing form fields |
| `seller_registration` | > 0.8 | Extract seller registration fields |
| Other intents | Any | Process with main AI model |

### 3.3 Available AI Tools

Sophia has access to these tools when responding via WhatsApp:

| Tool | Description |
|------|-------------|
| `calculateTransferFees` | Cyprus property transfer fee calculator |
| `calculateCapitalGains` | Capital gains tax calculator |
| `calculateVAT` | VAT calculator for new properties |
| `getGeneralKnowledge` | Cyprus real estate knowledge base |
| `createListing` | Create property listing in database |
| `listListings` | List user's property listings |
| `uploadListing` | Upload listing to Zyprus website |
| `getZyprusData` | Get Zyprus taxonomy data |
| `createLandListing` | Create land listing |
| `uploadLandListing` | Upload land listing |

---

## SECTION 4: DOCUMENT DETECTION

### 4.1 Detection Logic

Sophia automatically detects whether a response should be sent as a document or text message.

**Send as DOCX Document:**
- Registration templates (Seller, Bank, Developer)
- Viewing Forms
- Reservation Forms/Agreements
- Marketing Agreements

**Send as Text Message:**
- Email templates
- Calculations results
- General information
- Field requests/questions

### 4.2 Form Template Patterns

| Pattern | Document Type |
|---------|---------------|
| `Registration – Seller` | Seller Registration |
| `Bank Property Registration` | Bank Registration |
| `Bank Land Registration` | Bank Registration |
| `Developer Registration` | Developer Registration |
| `Viewing Form` | Viewing Form |
| `Property Viewing` | Viewing Form |
| `Property Reservation` | Reservation |
| `Marketing Agreement` | Marketing Agreement |

### 4.3 Form Field Indicators

Response is sent as document if 2+ of these patterns are found:

- `Registration No.`
- `Property Introduced:`
- `Client Information:`
- `Viewing Arranged for:`
- `Title Deed No:`
- `Date of Viewing:`
- `Property Address:`
- `Owner's Name:`
- `Signature:`
- `Commission Rate:`
- `Agreement Date:`
- `Reservation Amount:`

---

## SECTION 5: MESSAGE SENDING

### 5.1 Text Messages

**Character Limit:** 4096 characters per message

**Auto-Splitting Logic:**
1. If message < 4000 chars → Send as single message
2. If message > 4000 chars → Split by paragraphs
3. If single paragraph > 4000 chars → Split by sentences
4. Apply 500ms delay between split messages

### 5.2 Document Sending

**Supported Formats:**

| Extension | MIME Type |
|-----------|-----------|
| .docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| .pdf | `application/pdf` |
| .doc | `application/msword` |
| .xlsx | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| .txt | `text/plain` |
| .csv | `text/csv` |

**Document Naming Convention:**
```
SOFIA_{DocumentType}_{Timestamp}.docx
```

Examples:
- `SOFIA_SellerRegistration_1702046400000.docx`
- `SOFIA_ViewingForm_1702046400000.docx`
- `SOFIA_MarketingAgreement_1702046400000.docx`

### 5.3 Image Sending

```typescript
// URL-based image
await client.sendImage({
  to: phoneNumber,
  image: "https://example.com/image.jpg",
  caption: "Optional caption"
});

// Buffer-based image (base64 conversion)
await client.sendImage({
  to: phoneNumber,
  image: imageBuffer,
  caption: "Optional caption"
});
```

---

## SECTION 6: PHONE NUMBER FORMATTING

### 6.1 Input Formats Accepted

| Input Format | Valid |
|--------------|-------|
| `+35799123456` | Yes |
| `35799123456` | Yes |
| `+357 99 123 456` | Yes |
| `357-99-123-456` | Yes |
| `99123456` | No (missing country code) |

### 6.2 Formatting Rules

```
RULE: Remove all non-digit characters except leading +
RULE: Remove leading + (API expects just digits)
RESULT: "35799123456"
```

**Examples:**

| Input | Output |
|-------|--------|
| `+357 99 123 456` | `35799123456` |
| `+357-99-123-456` | `35799123456` |
| `(357) 99123456` | `35799123456` |

---

## SECTION 7: USER MANAGEMENT

### 7.1 WhatsApp User Creation

When a new phone number sends a message:

1. Check if user exists in database by phone number
2. If not found → Create new user record
3. Map to existing agent if phone matches registered agent
4. Create chat session for conversation history

### 7.2 User Context Fields

| Field | Description |
|-------|-------------|
| `id` | Database user ID |
| `email` | User email (if registered) |
| `name` | User display name |
| `type` | User type (guest/regular/agent) |
| `agentId` | Linked agent ID (if applicable) |
| `isAgent` | Boolean flag for agent status |

### 7.3 Activity Tracking

- Update `lastActive` timestamp on message receipt
- Log all messages to `agent_execution_log` table
- Track conversation context per chat session

---

## SECTION 8: WHATSAPP FORMATTING

### 8.1 Markdown Conversion

WhatsApp supports limited markdown. Sophia converts:

| Input (Markdown) | Output (WhatsApp) |
|-----------------|-------------------|
| `**bold text**` | `*bold text*` |
| Multiple newlines | Double newline max |

### 8.2 Formatting Rules

```
RULE: Convert **bold** to *bold* (WhatsApp format)
RULE: Clean up excessive newlines (max 2 consecutive)
RULE: Trim whitespace from start/end
```

---

## SECTION 9: ERROR HANDLING

### 9.1 Message Processing Errors

When an error occurs during message processing:

1. Log error with context (phone, message excerpt)
2. Send user-friendly error message
3. Continue accepting new messages

**Error Response:**
```
"I encountered an error processing your message. Please try again or rephrase your question."
```

### 9.2 API Error Handling

| Error Type | Handling |
|------------|----------|
| API key not configured | Return warning, skip processing |
| Rate limit exceeded | Auto-retry (3 attempts) |
| Network timeout | Log error, notify user |
| Invalid phone number | Log error, notify user |

### 9.3 Webhook Error Response

**CRITICAL:** Always return HTTP 200 OK, even on error
- Prevents webhook retry flooding
- Errors logged internally
- Response body indicates success/failure

---

## SECTION 10: GROUP MESSAGE HANDLING

### 10.1 Current Behavior

```
RULE: Skip all group messages
REASON: Personal chats only for document generation
ACTION: Log group name and skip processing
```

### 10.2 Group Detection

```typescript
if (messageData.isGroup) {
  console.log("Skipping group message from:", messageData.groupName);
  return;
}
```

---

## SECTION 11: RATE LIMITING

### 11.1 Outbound Rate Limits

| Action | Recommended Delay |
|--------|------------------|
| Between split messages | 500ms |
| Retry after rate limit | Auto (SDK handles) |
| Maximum retries | 3 |

### 11.2 Rate Limit Response Handling

The SDK automatically handles rate limiting:
- Tracks rate limit headers from API
- Implements exponential backoff
- Logs rate limit information

---

## SECTION 12: MONITORING AND LOGGING

### 12.1 Logged Events

| Event | Information Logged |
|-------|-------------------|
| Message received | From, message text, isGroup, userId, chatId |
| Router classification | Intent, confidence level |
| Message sent | To, text length, rate limit info |
| Document sent | To, filename, size, rate limit info |
| Errors | Error type, context, stack trace |

### 12.2 Database Logging

All WhatsApp interactions logged to `agent_execution_log`:
- `agentType`: "whatsapp"
- `action`: "message_received", "message_sent", etc.
- `modelUsed`: AI model used
- `success`: Boolean
- `metadata`: JSON with details

---

## SECTION 13: BEHAVIOR SUMMARY MATRIX

| Task | Sophia's Responsibility | Human Responsibility |
|------|------------------------|---------------------|
| Message reception | Auto-process via webhook | None |
| Intent classification | Auto-classify with router | None |
| Field extraction | Extract from message | Provide missing fields |
| Document generation | Auto-generate DOCX | None |
| Delivery decision | Auto-detect document vs text | None |
| Message splitting | Auto-split long messages | None |
| Error recovery | Send error message, continue | Retry request |

---

## SECTION 14: CRITICAL RULES (ALWAYS ENFORCE)

1. **Text messages only** — Skip non-text message types

2. **Personal chats only** — Skip all group messages

3. **Always return 200** — Webhook must return 200 OK to prevent retry flooding

4. **Verify webhook secret** — Check x-webhook-secret header if configured

5. **Auto-split long messages** — Handle 4096 character limit automatically

6. **Document detection** — Forms sent as DOCX, emails sent as text

7. **Phone number formatting** — Strip non-digits, remove + prefix

8. **Rate limit compliance** — Include 500ms delays between split messages

---

*End of WhatsApp Integration Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
