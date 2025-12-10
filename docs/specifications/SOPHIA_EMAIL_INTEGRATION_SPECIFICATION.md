# SOPHIA AI — EMAIL INTEGRATION SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's email integration capabilities. Sophia is an AI assistant for Zyprus Property Group (Cyprus Real Estate) that sends documents and communications to clients via email.

---

## SECTION 1: EMAIL SERVICE OVERVIEW

### 1.1 System Architecture

Sophia's email integration enables automated document delivery and professional communications to clients and agents.

| Component | Description |
|-----------|-------------|
| Email Provider | Resend API |
| Sender Address | `sofia@zyprus.com` |
| Sender Name | SOFIA |
| API Endpoint | `/api/documents/send` |
| Storage | Vercel Blob (document hosting) |

### 1.2 Supported Features

| Feature | Support | Notes |
|---------|---------|-------|
| HTML Emails | Yes | Professional styled templates |
| Plain Text | No | HTML only |
| Attachments | Yes | DOCX, PDF documents |
| Multiple Recipients | No | Single recipient per send |
| CC/BCC | No | Not supported |
| Reply-To | No | Default sender only |

### 1.3 Email Capabilities

- Document attachment delivery (DOCX files)
- Personalized greeting with recipient name
- Custom message support
- Professional HTML formatting
- Automated footer with branding
- Send tracking and logging

---

## SECTION 2: CONFIGURATION

### 2.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for email sending | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL for document generation | Optional |

### 2.2 Service Initialization

```
Condition: RESEND_API_KEY must be set
Fallback: Returns "Email service not configured" error
```

---

## SECTION 3: EMAIL SENDING FLOW

### 3.1 Document Email Flow

```
User requests document via chat
        ↓
Sophia generates DOCX document
        ↓
Document uploaded to Vercel Blob
        ↓
Send form displayed to user
        ↓
User selects "Email" tab
        ↓
User enters recipient details
        ↓
POST /api/documents/send
        ↓
Fetch document from Blob URL
        ↓
Convert to Buffer for attachment
        ↓
Send via Resend API
        ↓
Update tracking record
        ↓
Return success/failure response
```

### 3.2 Send Document API

**Endpoint:** `POST /api/documents/send`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentUrl` | string | Yes | Vercel Blob URL |
| `documentTitle` | string | Yes | Document filename |
| `documentContent` | string | No | Raw text content |
| `recipientName` | string | Yes | Recipient display name |
| `recipientEmail` | string | Yes (for email) | Recipient email address |
| `method` | enum | Yes | "email", "whatsapp", or "download" |
| `message` | string | No | Custom message body |
| `chatId` | string | No | Associated chat session |

**Response:**

```json
{
  "success": true,
  "message": "Document sent to John Smith via email",
  "sendId": "uuid-of-tracking-record"
}
```

---

## SECTION 4: EMAIL TEMPLATE

### 4.1 HTML Email Structure

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Hello [Recipient Name],</h2>

  [Custom Message if provided]

  <p style="color: #555;">
    Please find attached the document: <strong>[Document Title]</strong>
  </p>

  <p style="color: #555;">
    If you have any questions, please don't hesitate to reach out.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

  <p style="color: #888; font-size: 12px;">
    This email was sent by SOFIA, the AI assistant for Zyprus Property Group.
  </p>
</div>
```

### 4.2 Email Components

| Component | Style | Description |
|-----------|-------|-------------|
| Container | max-width: 600px, centered | Email body wrapper |
| Greeting | h2, color: #333 | "Hello [Name]," |
| Custom Message | p, color: #555 | Optional user message |
| Document Reference | p with bold title | Attachment reference |
| Call to Action | p, color: #555 | Contact invitation |
| Divider | hr, 1px solid #eee | Section separator |
| Footer | p, color: #888, 12px | Branding notice |

### 4.3 Subject Line Format

```
Subject: Document: [Document Title]
```

Examples:
- `Document: Seller Registration`
- `Document: Property Viewing Form`
- `Document: Marketing Agreement`

---

## SECTION 5: ATTACHMENT HANDLING

### 5.1 Document Fetch Process

```
1. Receive document URL (Vercel Blob)
2. Fetch document via HTTP GET
3. Validate response status (must be 200 OK)
4. Convert response to ArrayBuffer
5. Create Node.js Buffer from ArrayBuffer
6. Attach to email with filename
```

### 5.2 Filename Formatting

```
RULE: If title ends with .docx → Use as-is
RULE: If title does not end with .docx → Append .docx
```

Examples:

| Input Title | Attachment Filename |
|-------------|---------------------|
| `Seller Registration` | `Seller Registration.docx` |
| `Property Agreement.docx` | `Property Agreement.docx` |
| `Viewing Form` | `Viewing Form.docx` |

### 5.3 Supported MIME Types

| Extension | MIME Type |
|-----------|-----------|
| .docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

---

## SECTION 6: USER INTERFACE

### 6.1 Send Document Form

The email tab in the send form collects:

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Recipient Name | Text Input | Yes | "John Smith" |
| Email Address | Email Input | Yes | "john@example.com" |
| Message | Textarea | No | "Add a personal message..." |

### 6.2 Form Validation

```
RULE: Recipient name must not be empty
RULE: Email must be valid format (contains @)
RULE: Message is optional
```

### 6.3 UI Components

| Component | Icon | Description |
|-----------|------|-------------|
| Email Tab | Mail icon | Switch to email mode |
| WhatsApp Tab | MessageCircle icon | Switch to WhatsApp |
| Download Tab | Download icon | Direct download |
| Send Button | Send icon | Submit form |
| Cancel Button | None | Close form |

---

## SECTION 7: TRACKING AND LOGGING

### 7.1 Database Schema

Email sends are tracked in the `documentSend` table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique send ID |
| `userId` | UUID | Sender user ID |
| `chatId` | UUID | Associated chat (nullable) |
| `documentTitle` | string | Document name |
| `documentUrl` | string | Blob storage URL |
| `documentContent` | string | Raw content (nullable) |
| `recipientName` | string | Recipient name |
| `recipientEmail` | string | Email address |
| `method` | string | "email" |
| `message` | string | Custom message (nullable) |
| `status` | string | "pending", "sent", "failed" |
| `sentAt` | timestamp | Send completion time |
| `errorMessage` | string | Error details (nullable) |

### 7.2 Status Flow

```
pending → sent (on success)
pending → failed (on error)
```

### 7.3 Error Logging

```
Log Level: console.error
Prefix: [Documents]
Information: Error type, context, message
```

---

## SECTION 8: ERROR HANDLING

### 8.1 Service Errors

| Error | Cause | Response |
|-------|-------|----------|
| Email service not configured | Missing RESEND_API_KEY | Return error, status unchanged |
| Failed to fetch document | Invalid Blob URL | Return error, log details |
| Resend API error | API rejection | Log error, update status to failed |
| Network error | Connection issue | Catch and return error message |

### 8.2 Validation Errors

| Error | Cause | HTTP Status |
|-------|-------|-------------|
| Invalid email | Malformed email address | 400 |
| Missing recipient name | Empty name field | 400 |
| Invalid document URL | Non-URL string | 400 |

### 8.3 Error Response Format

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## SECTION 9: INTEGRATION WITH AI TOOLS

### 9.1 sendDocument Tool

The AI uses the `sendDocument` tool to generate documents and trigger the send form:

```
Tool: sendDocument
Parameters:
  - title: Document filename
  - content: Full text content
  - suggestedRecipientName: Pre-fill name (optional)
  - suggestedRecipientEmail: Pre-fill email (optional)
  - suggestedMethod: Default to "email" (optional)
```

### 9.2 Suggested Recipient Flow

```
User mentions email in conversation
        ↓
AI extracts email address
        ↓
Email passed to sendDocument tool
        ↓
Form pre-filled with recipient details
        ↓
User confirms and sends
```

---

## SECTION 10: SENDER CONFIGURATION

### 10.1 From Address

```
From: SOFIA <sofia@zyprus.com>
```

### 10.2 Branding Requirements

| Element | Value |
|---------|-------|
| Sender Name | SOFIA |
| Domain | zyprus.com |
| Footer Text | "This email was sent by SOFIA, the AI assistant for Zyprus Property Group." |

---

## SECTION 11: BEHAVIOR SUMMARY MATRIX

| Task | Sophia's Responsibility | Human Responsibility |
|------|------------------------|---------------------|
| Document generation | Auto-generate DOCX | None |
| Form display | Show send form | None |
| Recipient details | Pre-fill if known | Confirm/edit |
| Custom message | Optional field | Write if needed |
| Email sending | Via Resend API | Click send |
| Error handling | Display error | Retry or contact support |
| Tracking | Auto-log to database | None |

---

## SECTION 12: CRITICAL RULES (ALWAYS ENFORCE)

1. **RESEND_API_KEY required** — Email fails silently without API key

2. **Valid email required** — Must pass email validation before send

3. **Document must exist** — Fetch from Blob URL must succeed

4. **Single recipient only** — No CC, BCC, or multiple recipients

5. **DOCX format only** — Attachments are Word documents

6. **Track all sends** — Every attempt logged to database

7. **Professional formatting** — Use HTML template with branding

8. **Error gracefully** — Return meaningful error messages to user

---

*End of Email Integration Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
