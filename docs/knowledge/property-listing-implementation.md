# Property Listing Implementation Guide

This guide documents the SOFIA property listing pipeline, covering the data model, API routes, AI tools, and operational workflows that keep Zyprus listings in sync.

## Data Model
- Database tables are defined in `lib/db/schema.ts`; key entities include `propertyListings`, `listingUploadAttempts`, and `listingImages`.
- Query helpers in `lib/db/queries.ts` encapsulate reads/writes. Favor these helpers over direct Drizzle calls to preserve business rules.

## Authentication
- All listing mutations require an authenticated session. Server code retrieves `session.user.id` with `auth()` from `app/(auth)/auth.ts`.
- Guest sessions cannot create or upload listings.

## API Routes
- `app/api/listings/create/route.ts` – creates a draft listing after validating payload fields.
- `app/api/listings/list/route.ts` – paginated fetch scoped to the logged-in user.
- `app/api/listings/upload/route.ts` – pushes a draft to Zyprus and updates status.
- Error responses always return JSON with `error` and HTTP status codes suitable for client handling.

## AI Tools
- Located in `lib/ai/tools/`:
  - `create-listing.ts`
  - `list-listings.ts`
  - `upload-listing.ts`
- Each tool mirrors the REST behavior but runs server-side inside LLM actions. They authenticate with `auth()` and delegate persistence to `lib/db/queries.ts`.

## Zyprus Integration
- `lib/zyprus/client.ts` wraps OAuth token management, taxonomy fetches, and upload requests.
- Permanent vs transient errors are distinguished via `isPermanentError()`. Upload attempts are logged with `logListingUploadAttempt()`.

## Testing Tips
- Use `pnpm exec playwright test tests/e2e/margarita-local.test.ts` for a representative listing flow.
- Mock Zyprus endpoints in tests by stubbing fetch or supplying sandbox credentials.

Maintain this document when schema, tool signatures, or Zyprus endpoints change.
