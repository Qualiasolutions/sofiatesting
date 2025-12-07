# Stack Research: Integrations (December 2025)

> Research date: 2025-12-07

## Current Stack Summary

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.0-canary.31 | App framework |
| React | 19.0.0-rc | UI framework |
| WaSenderAPI | 0.1.5 | WhatsApp integration (unofficial) |
| Telegram Bot API | Direct HTTP | Telegram bot integration |
| docx | 9.5.1 | DOCX document generation |
| @vercel/blob | 0.24.1 | File storage |
| Drizzle ORM | 0.34.0 | Database access |
| opossum | 9.0.0 | Circuit breaker |

---

## 1. WhatsApp Integration

### Current Implementation
- **Provider**: WaSenderAPI (unofficial, $6/month per session)
- **Features**: Message sending, document delivery (base64), image sending, message splitting
- **Architecture**: Webhook-based with intent classification and DOCX generation

### Official Recommendations (2025)

**Meta's Official SDK**: The [WhatsApp-Nodejs-SDK](https://github.com/WhatsApp/WhatsApp-Nodejs-SDK) is the official solution with TypeScript support.

**Cloud API Best Practices**:
- Use Cloud API v18.0+ for latest security features
- 24-hour conversation windows for user-initiated conversations
- Template messages for outbound messaging outside windows

### Current Best Practices

1. **Official API Migration**: Unofficial APIs carry ban risk. Consider migrating to WhatsApp Cloud API through a BSP (Business Solution Provider) like Twilio, 360dialog, or WATI
2. **Secret Management**: Store API tokens in Secrets Manager, not in code
3. **Message Templates**: Pre-approve message templates for outbound notifications
4. **Error Handling**: Implement exponential backoff for rate limits

### Common Pitfalls

1. **Ban Risk**: Unofficial APIs (including WaSenderAPI) can result in WhatsApp account bans
2. **Session Expiry**: WaSenderAPI sessions require QR re-authentication periodically
3. **Type Casting**: Current code uses `as any` for base64 document sending due to SDK limitations

### Recommendations for SOFIA

| Status | Recommendation |
|--------|----------------|
| Should Update | Consider migration path to Official WhatsApp Cloud API before October 2025 on-premises API EOL |
| Already Good | Message splitting algorithm (4000 char limit with paragraph/sentence preservation) |
| Already Good | Document detection for form vs. email templates |
| Should Add | Metrics/monitoring for failed document deliveries |
| Should Add | Retry logic for webhook processing failures |

---

## 2. Telegram Bot Integration

### Current Implementation
- **Method**: Webhook-based (preferred for production)
- **Libraries**: Direct Telegram Bot API HTTP calls (no framework)
- **Features**: Typing indicators, message splitting, group lead management, file handling

### Official Recommendations (2025)

**Webhooks vs Polling**: Webhooks are preferred for production - lower latency, better scaling.

**Frameworks**:
- [Telegraf](https://github.com/telegraf/telegraf) - Mature, TypeScript-friendly, middleware-style
- [grammY](https://grammy.dev/) - Modern, lighter, great for serverless/edge

### Current Best Practices

1. **SSL/HTTPS Required**: Telegram only supports HTTPS webhooks
2. **Observability**: Add CloudWatch Logs + metrics (5xx alarms)
3. **Selective Updates**: Handle only needed update types
4. **Inline Keyboards**: Use callback buttons instead of cluttering messages
5. **Environment Detection**: Use webhooks for production, polling for local dev

### Common Pitfalls

1. **Webhook + Polling**: Never use both simultaneously
2. **Missing /help**: Always provide clear /help instructions
3. **No retry on async failures**: Fire-and-forget webhook processing can lose messages

### SOFIA Assessment

| Status | Recommendation |
|--------|----------------|
| Already Good | Async webhook processing (returns 200 immediately) |
| Already Good | Time-based typing indicators (3s intervals) |
| Already Good | Smart message splitting preserving paragraphs/sentences |
| Already Good | Deterministic UUID v5 for persistent chat sessions |
| FIXED | Lead forwarding rotation (implemented 2025-12-07) |
| Should Fix | `/clear` command doesn't actually delete messages |
| Should Add | Metrics for failed message processing |
| Consider | Migrate to Telegraf/grammY framework for better middleware support |

---

## 3. Document Generation (DOCX)

### Current Implementation
- **Library**: docx v9.5.1 (programmatic generation)
- **Features**: Markdown parsing, header detection, SOFIA branding footer
- **Output**: Buffer for streaming to WhatsApp

### Official Recommendations (2025)

**[docx npm package](https://www.npmjs.com/package/docx)** is the recommended choice for programmatic generation with full TypeScript support.

**Alternatives**:
- [docxtemplater](https://docxtemplater.com/) - Template-based, good for business users editing templates
- [@turbodocx/html-to-docx](https://www.npmjs.com/package/@turbodocx/html-to-docx) - Zero-dependency HTML to DOCX

### Current Best Practices

1. **Error Handling**: Always wrap async file operations in try-catch
2. **Type Safety**: Use TypeScript definitions included in docx package
3. **Template vs Programmatic**: Use docxtemplater if templates need business user editing
4. **HTML Conversion**: Consider @turbodocx/html-to-docx for AI-generated HTML content

### SOFIA Assessment

| Status | Recommendation |
|--------|----------------|
| Already Good | Using docx v9.5.1 (latest) for programmatic generation |
| Already Good | Proper Buffer handling for streaming |
| Already Good | Markdown-to-DOCX formatting support |
| Consider | docxtemplater for 38 templates if templates need non-developer editing |
| Consider | Add unit tests for document generation edge cases |

---

## 4. File Uploads (Vercel Blob + Zyprus API)

### Current Implementation

**Vercel Blob**:
- 5MB limit, JPEG/PNG only
- Public URL generation
- Used for chat file attachments

**Zyprus API**:
- Parallel image uploads with `Promise.allSettled()`
- OAuth 2.0 + circuit breaker pattern
- Drupal JSON:API protocol

### Official Recommendations (2025)

**Vercel Blob Best Practices**:
- Server uploads: Fine for files < 4.5MB
- Client uploads: Required for files > 4.5MB (direct browser-to-blob)
- Security: Authenticate users before generating upload tokens
- Large files: Use multipart uploads and streaming

### Current Best Practices

1. **Client Uploads for Large Files**: No data transfer charges
2. **Multipart Uploads**: For substantial data transfers
3. **Overwrite Protection**: Use `allowOverwrite` option explicitly
4. **Local Development**: Use ngrok for `onUploadCompleted` callbacks

### SOFIA Assessment

| Status | Recommendation |
|--------|----------------|
| Already Good | Parallel image uploads with `Promise.allSettled()` |
| Already Good | Circuit breaker pattern for resilience |
| Already Good | Graceful partial failure handling |
| Should Fix | 5MB limit may be too restrictive for property images |
| Should Add | Client-side uploads for files > 4.5MB |
| Should Add | Retry logic for failed individual image fetches |

---

## Summary: Priority Recommendations

### High Priority (Should Fix)

1. **WhatsApp Migration Planning**: Create migration path to Official WhatsApp Cloud API (unofficial APIs have ban risk and October 2025 on-premises EOL)

2. **Telegram Lead Rotation**: Implement the TODO for fair agent distribution in lead forwarding - **FIXED 2025-12-07**

3. **Async Error Handling**: Add retry mechanism for failed webhook background processing

### Medium Priority (Should Update)

4. **Observability**: Add metrics/monitoring for:
   - Failed WhatsApp document deliveries
   - Failed Telegram message processing
   - Image upload success rates

5. **File Upload Limits**: Increase 5MB limit or implement client-side uploads for larger property images

### Low Priority (Consider)

6. **Telegram Framework**: Consider Telegraf/grammY for middleware support

7. **Template System**: Consider docxtemplater if business users need to edit templates

8. **Unit Tests**: Add tests for document generation edge cases

---

## Sources

### WhatsApp
- [WhatsApp-Nodejs-SDK Official](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/)
- [WhatsApp Business API Guide 2025](https://javascript.plainenglish.io/mastering-whatsapp-business-api-integration-a-step-by-step-node-js-guide-2025-edition-1b604c8c83a5)
- [whatsapp-business-sdk Community](https://github.com/MarcosNicolau/whatsapp-business-sdk)
- [WhatsApp Cloud API 2025](https://wasender.com/blog/whatsapp-cloud-api/)

### Telegram
- [Telegram Webhook Guide](https://softwareengineeringstandard.com/2025/08/26/telegram-webhook/)
- [Telegram Bot Development 2025](https://stellaray777.medium.com/a-developers-guide-to-building-telegram-bots-in-2025-dbc34cd22337)
- [Scalable Telegram Bot Architecture](https://medium.com/@pushpesh0/building-a-scalable-telegram-bot-with-node-js-bullmq-and-webhooks-6b0070fcbdfc)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

### Document Generation
- [docx npm package](https://www.npmjs.com/package/docx)
- [docx Complete Guide 2025](https://generalistprogrammer.com/tutorials/docx-npm-package-guide)
- [docxtemplater](https://docxtemplater.com/)
- [@turbodocx/html-to-docx](https://www.npmjs.com/package/@turbodocx/html-to-docx)

### File Uploads
- [Vercel Blob Server Uploads](https://vercel.com/docs/vercel-blob/server-upload)
- [Vercel Blob Client Uploads](https://vercel.com/docs/vercel-blob/client-upload)
- [Large Video Upload Discussion](https://github.com/vercel/next.js/discussions/70078)
