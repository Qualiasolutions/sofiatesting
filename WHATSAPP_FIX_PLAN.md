# WhatsApp Integration Fix Plan for SOFIA

## Executive Summary

The WhatsApp integration via WaSenderAPI is **mostly functional** but has critical issues with document sending. The current implementation attempts to use `documentBase64` directly which is not the correct WaSenderAPI flow. This plan outlines the fixes needed to enable SOFIA to:

1. **Upload listings** through WhatsApp (already works via AI tools)
2. **Generate and send document files** through WhatsApp (needs fix)
3. **Send text messages and templates** through WhatsApp (already works)

## Current State Analysis

### What Works
- Text message sending via `sendText()` SDK method
- Long message splitting (4000 char limit)
- Webhook receiving and parsing (multiple formats supported)
- AI tool integration (calculators, listings, Zyprus data)
- Document detection (determines when to send as DOCX vs text)
- DOCX generation from AI responses

### What's Broken
1. **`sendDocument` method** - Uses unsupported `documentBase64` parameter
2. **Upload flow missing** - WaSenderAPI requires upload→URL→send pattern for base64 files

## Root Cause Analysis

### WaSenderAPI Document Sending Flow (Correct)

According to [WaSenderAPI documentation](https://wasenderapi.com/api-docs/messages/send-document-message):

**Option A: URL-based (for publicly accessible files)**
```typescript
await client.sendDocument({
  to: "+1234567890",
  documentUrl: "https://example.com/file.pdf",
  text: "Caption",
  fileName: "document.pdf"
});
```

**Option B: Base64 (requires two-step process)**
1. Upload to `/api/upload` endpoint → get temporary URL (valid 24h)
2. Send using the temporary URL

```typescript
// Step 1: Upload
const uploadResponse = await fetch("https://wasenderapi.com/api/upload", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    base64: `data:application/pdf;base64,${base64Data}`
  })
});
const { url } = await uploadResponse.json();

// Step 2: Send
await client.sendDocument({ to, documentUrl: url, fileName });
```

### Current Implementation (Broken)

```typescript
// lib/whatsapp/client.ts:129-135
const response = await wasenderClient.send({
  messageType: "document",
  to: formatPhoneNumber(to),
  documentBase64: `data:${mimeType};base64,${base64Document}`, // NOT SUPPORTED
  filename,
  caption,
} as any);
```

The `documentBase64` parameter is cast to `any` because it doesn't exist in SDK types - **because it's not a valid parameter**.

## Implementation Plan

### Phase 1: Fix WhatsApp Client (Priority: Critical)

**File: `lib/whatsapp/client.ts`**

#### 1.1 Add Upload Method
```typescript
/**
 * Upload a file to WaSenderAPI and get a temporary URL
 * Returns a URL valid for 24 hours
 */
async uploadFile({
  buffer,
  mimeType,
  filename,
}: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!API_KEY) {
    return { success: false, error: "WhatsApp API key not configured" };
  }

  try {
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const response = await fetch("https://api.wasenderapi.com/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ base64: dataUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Upload failed: ${response.status}`
      };
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
```

#### 1.2 Fix sendDocument Method
```typescript
async sendDocument({
  to,
  document,
  filename,
  caption,
}: {
  to: string;
  document: Buffer;
  filename: string;
  caption?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!wasenderClient) {
    return { success: false, error: "WhatsApp API key not configured" };
  }

  try {
    // Step 1: Upload the document to get a temporary URL
    const mimeType = getMimeType(filename);
    const uploadResult = await this.uploadFile({
      buffer: document,
      mimeType,
      filename,
    });

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || "Failed to upload document"
      };
    }

    // Step 2: Send document using the temporary URL
    const response = await wasenderClient.sendDocument({
      to: formatPhoneNumber(to),
      documentUrl: uploadResult.url,
      text: caption,
      fileName: filename,
    });

    console.log("[WhatsApp] Document sent successfully", {
      to,
      filename,
      size: document.length,
      rateLimit: response.rateLimit,
    });

    return {
      success: true,
      messageId: (response.response as any)?.id,
    };
  } catch (error) {
    const apiError = error as WasenderAPIError;
    console.error("[WhatsApp] Send document error:", {
      statusCode: apiError.statusCode,
      message: apiError.apiMessage,
      details: apiError.errorDetails,
      to,
      filename,
    });

    return {
      success: false,
      error: apiError.apiMessage || "Failed to send document",
    };
  }
}
```

### Phase 2: Add sendDocument Tool for WhatsApp (Priority: High)

**File: `lib/whatsapp/message-handler.ts`**

The `sendDocument` tool from `lib/ai/tools/send-document.ts` uses `dataStream.write()` which only works for web UI. For WhatsApp, we need to handle document sending directly in the response.

#### 2.1 Create WhatsApp-specific sendDocument tool

```typescript
// lib/whatsapp/tools/send-document-whatsapp.ts
import { tool } from "ai";
import { z } from "zod";
import { generateDocx } from "../docx-generator";
import { getWhatsAppClient } from "../client";

export const createWhatsAppSendDocumentTool = (recipientPhone: string) =>
  tool({
    description: `Generate and send a document directly to the user via WhatsApp. Use this when:
- User wants a document generated and sent to them
- User asks for a form, contract, or registration document
- Response should be in document format`,
    inputSchema: z.object({
      title: z.string().describe("Title/filename for the document"),
      content: z.string().describe("The full text content of the document"),
    }),
    execute: async ({ title, content }) => {
      try {
        const client = getWhatsAppClient();

        // Generate DOCX
        const docBuffer = await generateDocx(content);
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.docx`;

        // Send via WhatsApp
        const result = await client.sendDocument({
          to: recipientPhone,
          document: docBuffer,
          filename,
          caption: `Here is your ${title}`,
        });

        if (result.success) {
          return {
            success: true,
            message: `Document "${title}" has been generated and sent to your WhatsApp.`,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to send document",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Document generation failed",
        };
      }
    },
  });
```

#### 2.2 Update message-handler.ts to use WhatsApp-specific tool

Add to tools object:
```typescript
import { createWhatsAppSendDocumentTool } from "./tools/send-document-whatsapp";

// In handleWhatsAppMessage, add to tools:
tools: {
  // ... existing tools
  sendDocument: createWhatsAppSendDocumentTool(phoneNumber),
}

// Add to experimental_activeTools:
experimental_activeTools: [
  // ... existing tools
  "sendDocument",
]
```

### Phase 3: Enhanced Error Handling & Logging

#### 3.1 Add retry logic for document uploads
```typescript
async uploadFileWithRetry(
  params: { buffer: Buffer; mimeType: string; filename: string },
  maxRetries = 2
): Promise<{ success: boolean; url?: string; error?: string }> {
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await this.uploadFile(params);
    if (result.success) return result;

    lastError = result.error || "Unknown error";

    if (attempt < maxRetries) {
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return { success: false, error: `Upload failed after ${maxRetries + 1} attempts: ${lastError}` };
}
```

#### 3.2 Add comprehensive logging
```typescript
// Log all document operations
console.log("[WhatsApp] Document operation:", {
  action: "upload" | "send",
  phoneNumber: maskPhone(to),
  filename,
  size: document.length,
  mimeType,
  timestamp: new Date().toISOString(),
});
```

### Phase 4: Testing Strategy

#### 4.1 Unit Tests
Create `tests/unit/whatsapp-client.test.ts`:
- Test `uploadFile` method
- Test `sendDocument` method with upload flow
- Test error handling

#### 4.2 Integration Tests
Create `tests/manual/test-whatsapp-document.ts`:
```typescript
import { getWhatsAppClient } from "@/lib/whatsapp/client";
import { generateDocx } from "@/lib/whatsapp/docx-generator";

async function testDocumentSending() {
  const client = getWhatsAppClient();

  if (!client.isConfigured()) {
    console.log("WhatsApp not configured - skipping test");
    return;
  }

  const testContent = `**Test Document**

This is a test document generated by SOFIA.

**Test Section**
- Item 1
- Item 2

Generated at: ${new Date().toISOString()}`;

  const docBuffer = await generateDocx(testContent);

  const result = await client.sendDocument({
    to: process.env.TEST_WHATSAPP_NUMBER!,
    document: docBuffer,
    filename: "SOFIA_Test_Document.docx",
    caption: "Test document from SOFIA integration test",
  });

  console.log("Test result:", result);
}

testDocumentSending().catch(console.error);
```

#### 4.3 End-to-End Test Scenarios
1. Send text message → Verify receipt
2. Ask for VAT calculation → Verify calculation sent as text
3. Request seller registration form → Verify DOCX document sent
4. Create property listing → Verify listing created on Zyprus
5. Upload listing → Verify listing uploaded with proper status

### Phase 5: Deployment

#### 5.1 Environment Variables (Verify in Vercel)
```bash
WASENDER_API_KEY=          # Required: Session-specific API key
WASENDER_WEBHOOK_SECRET=   # Optional: Webhook verification
WASENDER_PERSONAL_ACCESS_TOKEN=  # Optional: Account-level token
```

#### 5.2 Webhook Configuration
1. Go to WaSenderAPI dashboard
2. Set webhook URL: `https://sophia.zyprus.com/api/whatsapp/webhook`
3. Enable events: `messages.upsert`, `messages.received`

#### 5.3 Deployment Steps
1. Run `pnpm build` to verify no errors
2. Deploy to Vercel
3. Verify webhook is receiving events (check logs)
4. Test document sending end-to-end

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `lib/whatsapp/client.ts` | Modify | Add uploadFile method, fix sendDocument |
| `lib/whatsapp/tools/send-document-whatsapp.ts` | Create | WhatsApp-specific sendDocument tool |
| `lib/whatsapp/message-handler.ts` | Modify | Add sendDocument to available tools |
| `tests/manual/test-whatsapp-document.ts` | Create | Manual test script |
| `tests/unit/whatsapp-client.test.ts` | Create | Unit tests |

## Timeline Estimate

- Phase 1 (Client Fix): 30 minutes
- Phase 2 (Tool Integration): 30 minutes
- Phase 3 (Error Handling): 15 minutes
- Phase 4 (Testing): 30 minutes
- Phase 5 (Deployment): 15 minutes

**Total: ~2 hours**

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WaSenderAPI upload endpoint changes | Low | High | Pin SDK version, monitor API changelog |
| Rate limiting on uploads | Medium | Medium | Add retry logic, respect rate limits |
| File size limits | Low | Low | Validate before upload (100MB max) |
| Webhook format changes | Low | Medium | Support multiple formats (already done) |

## Success Criteria

1. Documents can be sent via WhatsApp using base64 upload flow
2. Users can request forms/contracts and receive them as DOCX files
3. Property listings can be created and uploaded through WhatsApp
4. All calculator tools work and return formatted text responses
5. Error handling provides clear feedback to users

## Sources

- [WaSenderAPI Documentation](https://wasenderapi.com/api-docs)
- [Send Document Message](https://www.wasenderapi.com/api-docs/messages/send-document-message)
- [Upload Media File](https://wasenderapi.com/api-docs/messages/upload-media-file)
- [Webhook Message Upsert](https://wasenderapi.com/api-docs/webhooks/webhook-message-upsert)
- [Official SDKs](https://www.wasenderapi.com/api-docs/developer-sdks/official-sdks-nodejs-python-laravel)
- [NPM Package](https://www.npmjs.com/package/wasenderapi)
