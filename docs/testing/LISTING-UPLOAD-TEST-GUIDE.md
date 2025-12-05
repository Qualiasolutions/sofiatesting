# SOFIA Listing Upload & WhatsApp Integration - Comprehensive Testing Guide

## Overview

This guide is for testing the recently implemented listing upload functionality and WhatsApp integration. The implementation includes:

1. **Property Listings** - Create and upload properties to zyprus.com
2. **Land Listings** - Create and upload land/plots to zyprus.com
3. **WhatsApp Integration** - Full AI capabilities via WhatsApp including listing tools

**Deployment**: All code is deployed to production (Vercel). Database migration `0016_known_bill_hollister.sql` needs to be applied.

---

## Pre-Testing Setup

### 1. Apply Database Migration

The migration adds the `LandListing` table and new columns to `PropertyListing`. Run:

```bash
pnpm db:migrate
```

If this fails locally due to IPv6 issues, the migration will auto-apply on first Vercel request, OR manually run the SQL in Supabase dashboard:

**File**: `lib/db/migrations/0016_known_bill_hollister.sql`

Key changes:
- New `LandListing` table with 33 columns
- New `PropertyListing` columns: `listingTypeId`, `propertyStatusId`, `viewIds`, `yearBuilt`, `referenceId`, `energyClass`, `videoUrl`, `phoneNumber`, `propertyNotes`, `duplicateDetected`, `coordinates`

### 2. Verify Environment Variables

Ensure these are set in Vercel (production) and `.env.local` (development):

```bash
# Required for Zyprus API
ZYPRUS_API_URL=https://dev9.zyprus.com
ZYPRUS_CLIENT_ID=5Al3Dbs3X9Oqbi8PAjPh5wUfcfrothnub7gI8nOvLig
ZYPRUS_CLIENT_SECRET=M7wH"%zuyf8")KZ

# Required for WhatsApp
WASENDER_API_KEY=<your-wasender-api-key>
WASENDER_WEBHOOK_SECRET=<your-webhook-secret>

# Required for AI
GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-key>
```

### 3. Verify Tool Registration

Check that all tools are dual-registered in `app/(chat)/api/chat/route.ts`:

```typescript
experimental_activeTools: [
  "calculateTransferFees",
  "calculateCapitalGains",
  "calculateVAT",
  "getGeneralKnowledge",
  "createListing",
  "listListings",
  "uploadListing",
  "getZyprusData",
  "createLandListing",    // NEW
  "uploadLandListing",    // NEW
  "requestSuggestions",
],
tools: {
  calculateTransferFees: calculateTransferFeesTool,
  calculateCapitalGains: calculateCapitalGainsTool,
  calculateVAT: calculateVATTool,
  getGeneralKnowledge,
  createListing: createListingTool,
  listListings: listListingsTool,
  uploadListing: uploadListingTool,
  getZyprusData: getZyprusDataTool,
  createLandListing: createLandListingTool,    // NEW
  uploadLandListing: uploadLandListingTool,    // NEW
  requestSuggestions: requestSuggestionsTool,
},
```

---

## Part 1: Zyprus API Verification via Postman

Before testing through SOFIA, verify the Zyprus API is working correctly using Postman.

### 1.1 Authentication Test

**Request**:
```
POST https://dev9.zyprus.com/oauth/token
Content-Type: application/x-www-form-urlencoded
User-Agent: SophiaAI

grant_type=client_credentials
client_id=5Al3Dbs3X9Oqbi8PAjPh5wUfcfrothnub7gI8nOvLig
client_secret=M7wH"%zuyf8")KZ
```

**Expected Response**:
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJ0eXAiOi..."
}
```

**Verify**: Token has `ai_agent` scope (decode JWT at jwt.io)

### 1.2 Taxonomy Endpoints Test

Test each taxonomy endpoint to ensure UUIDs are available:

| Endpoint | Purpose |
|----------|---------|
| `GET /jsonapi/taxonomy_term/listing_type` | For Sale, For Rent, Exchange |
| `GET /jsonapi/taxonomy_term/property_type` | Apartment, Villa, House, etc. |
| `GET /jsonapi/taxonomy_term/property_status` | Resale, New Build, Off Plan |
| `GET /jsonapi/taxonomy_term/price_modifier` | Plus VAT, No VAT, VAT Included |
| `GET /jsonapi/taxonomy_term/title_deed` | Title Deed, Final Approval |
| `GET /jsonapi/taxonomy_term/property_views` | Sea View, Mountain View |
| `GET /jsonapi/taxonomy_term/indoor_property_views` | A/C, Heating, Fireplace |
| `GET /jsonapi/taxonomy_term/outdoor_property_features` | Pool, Garden, Parking |
| `GET /jsonapi/taxonomy_term/land_type` | Plot, Field, Agricultural |
| `GET /jsonapi/taxonomy_term/infrastructure_` | Electricity, Water, Road |
| `GET /jsonapi/taxonomy_term/towns` | Limassol, Paphos, Nicosia |

**Headers for all**:
```
Authorization: Bearer <token>
User-Agent: SophiaAI
Content-Type: application/vnd.api+json
```

**Record these UUIDs** for testing:
- Listing Type "For Sale": `8f187816-a888-4cda-a937-1cee84b9c0ee`
- Price Modifier "No VAT": `ab39af2d-c8f5-4971-9fa5-2df6822ab9a9`
- Title Deed "Title Deed": `5c553db1-e53d-46a2-b609-093d17e75a7a`

### 1.3 Location Lookup Test

```
GET https://dev9.zyprus.com/jsonapi/node/location?filter[title]=Limassol
Authorization: Bearer <token>
User-Agent: SophiaAI
```

**Record**: A valid location UUID for testing

### 1.4 Property Upload Test (Postman)

```
POST https://dev9.zyprus.com/jsonapi/node/property
Content-Type: application/vnd.api+json
User-Agent: SophiaAI
Authorization: Bearer <token>
```

**Minimal Payload**:
```json
{
  "data": {
    "type": "node--property",
    "attributes": {
      "status": false,
      "title": "Test Property from Postman",
      "body": {
        "value": "Test description for API verification",
        "format": "plain_text"
      },
      "field_price": "500000",
      "field_covered_area": 150,
      "field_ai_state": "draft",
      "field_ai_generated": true,
      "field_no_bedrooms": 3,
      "field_no_bathrooms": 2
    },
    "relationships": {
      "field_location": {
        "data": { "type": "node--location", "id": "<LOCATION_UUID>" }
      },
      "field_property_type": {
        "data": { "type": "taxonomy_term--property_type", "id": "<PROPERTY_TYPE_UUID>" }
      },
      "field_listing_type": {
        "data": { "type": "taxonomy_term--listing_type", "id": "8f187816-a888-4cda-a937-1cee84b9c0ee" }
      },
      "field_price_modifier": {
        "data": { "type": "taxonomy_term--price_modifier", "id": "ab39af2d-c8f5-4971-9fa5-2df6822ab9a9" }
      },
      "field_title_deed": {
        "data": { "type": "taxonomy_term--title_deed", "id": "5c553db1-e53d-46a2-b609-093d17e75a7a" }
      }
    }
  }
}
```

**Expected**: 201 Created with listing UUID

### 1.5 Land Upload Test (Postman)

```
POST https://dev9.zyprus.com/jsonapi/node/land
Content-Type: application/vnd.api+json
User-Agent: SophiaAI
Authorization: Bearer <token>
```

**Minimal Payload**:
```json
{
  "data": {
    "type": "node--land",
    "attributes": {
      "status": false,
      "title": "Test Land Plot from Postman",
      "body": {
        "value": "Test land description for API verification",
        "format": "plain_text"
      },
      "field_price": "150000",
      "field_land_size": 2000,
      "field_ai_state": "draft",
      "field_ai_generated": true
    },
    "relationships": {
      "field_location": {
        "data": { "type": "node--location", "id": "<LOCATION_UUID>" }
      },
      "field_land_type": {
        "data": { "type": "taxonomy_term--land_type", "id": "<LAND_TYPE_UUID>" }
      },
      "field_listing_type": {
        "data": { "type": "taxonomy_term--listing_type", "id": "8f187816-a888-4cda-a937-1cee84b9c0ee" }
      },
      "field_land_price_modifier": {
        "data": { "type": "taxonomy_term--price_modifier", "id": "ab39af2d-c8f5-4971-9fa5-2df6822ab9a9" }
      }
    }
  }
}
```

**Note**: Land uses different field names:
- `field_land_type` (not `field_property_type`)
- `field_land_price_modifier` (not `field_price_modifier`)
- `field_land_gallery` (not `field_gallery_`)

### 1.6 Image Upload Test (Postman)

```
POST https://dev9.zyprus.com/jsonapi/node/property/field_gallery_
Content-Type: application/octet-stream
Content-Disposition: file; filename="test.jpg"
User-Agent: SophiaAI
Authorization: Bearer <token>

<binary image data>
```

**Expected**: Returns file UUID to use in `field_gallery_` relationship

---

## Part 2: SOFIA Chat Interface Testing

### 2.1 Test getZyprusData Tool

Start a chat and ask:

> "What property types are available on zyprus.com?"

**Expected behavior**:
1. AI calls `getZyprusData` tool with `resourceType: "property_types"`
2. Returns list of property types with UUIDs
3. AI presents options in readable format

**Variations to test**:
- "Show me available locations in Limassol"
- "What listing types can I use?" (For Sale, For Rent, Exchange)
- "What land types are available?" (should use `resourceType: "all_land"`)

### 2.2 Test Property Listing Creation

> "I want to list a 3 bedroom villa in Limassol Marina for €1,500,000. It has sea views, a pool, and covered parking. The property was built in 2020 and has an A energy rating."

**Expected behavior**:
1. AI calls `getZyprusData` to fetch taxonomy UUIDs
2. AI calls `createListing` with:
   - name, description, price
   - bedrooms: 3, propertyTypeId (Villa)
   - locationId (Limassol Marina)
   - viewIds (Sea View)
   - outdoorFeatureIds (Pool, Parking)
   - yearBuilt: 2020
   - energyClass: "A"
3. Returns success with listing ID and summary
4. Draft saved to database with status "draft"

**Verify in database**:
```sql
SELECT * FROM "PropertyListing" ORDER BY "createdAt" DESC LIMIT 1;
```

### 2.3 Test Property Upload

After creating a listing:

> "Upload my listing to zyprus.com"

**Expected behavior**:
1. AI calls `uploadListing` tool
2. Tool fetches most recent draft
3. Validates required fields (locationId, propertyTypeId, listingTypeId)
4. Uploads images to Zyprus (if any)
5. Creates property via JSON:API
6. Updates database status to "uploaded"
7. Returns Zyprus listing URL

**Error cases to test**:
- "Upload listing" when no draft exists
- Create listing without images (should fail with clear error)
- Create listing without location (should fail with clear error)

### 2.4 Test Land Listing Creation

> "I want to list a 2000 sqm building plot in Paphos for €200,000. It has electricity and water, 60% building density allowed, and mountain views."

**Expected behavior**:
1. AI calls `getZyprusData` with `resourceType: "all_land"`
2. AI calls `createLandListing` with:
   - name, description, price
   - landSize: 2000
   - landTypeId (Plot/Building Land)
   - locationId (Paphos area)
   - infrastructureIds (Electricity, Water)
   - buildingDensity: 60
   - viewIds (Mountain View)
3. Returns success with listing ID

**Verify in database**:
```sql
SELECT * FROM "LandListing" ORDER BY "createdAt" DESC LIMIT 1;
```

### 2.5 Test Land Upload

> "Upload my land listing"

**Expected behavior**:
1. AI calls `uploadLandListing` tool
2. Tool fetches most recent land draft
3. Validates required fields
4. Uploads to `/jsonapi/node/land`
5. Returns Zyprus listing URL

### 2.6 Test listListings Tool

> "Show me my property listings"

**Expected behavior**:
1. AI calls `listListings` tool
2. Returns list of user's listings with status

---

## Part 3: WhatsApp Integration Testing

### 3.1 Setup Verification

1. **WaSender Dashboard**: Verify webhook URL is set to:
   ```
   https://sofia.zyprus.com/api/whatsapp/webhook
   ```

2. **Environment Variables**: Verify in Vercel:
   - `WASENDER_API_KEY` is set
   - `WASENDER_WEBHOOK_SECRET` is set

3. **WhatsApp Connection**: Verify phone is connected in WaSender dashboard

### 3.2 Basic Message Test

Send a WhatsApp message to the connected number:

> "Hello"

**Expected behavior**:
1. Webhook receives message at `/api/whatsapp/webhook`
2. `handleWhatsAppMessage` is called
3. User is created/found via `getOrCreateWhatsAppUser`
4. Chat session created via `getOrCreateWhatsAppChat`
5. AI generates response
6. Response sent back via WaSender API

**Verify in database**:
```sql
-- Check user was created
SELECT * FROM "User" WHERE email LIKE 'whatsapp_%' ORDER BY id DESC LIMIT 5;

-- Check chat was created
SELECT * FROM "Chat" WHERE title LIKE 'WhatsApp%' ORDER BY "createdAt" DESC LIMIT 5;
```

### 3.3 Calculator Tools Test (WhatsApp)

Send:

> "Calculate transfer fees for a €500,000 property"

**Expected**: AI uses `calculateTransferFees` tool and returns calculation

Send:

> "What's the VAT on a €300,000 new build?"

**Expected**: AI uses `calculateVAT` tool

### 3.4 Listing Creation via WhatsApp

Send:

> "I want to list a 2 bedroom apartment in Larnaca for €180,000"

**Expected behavior**:
1. AI calls `getZyprusData` for taxonomy
2. AI calls `createListing`
3. User context is injected via `runWithUserContext`
4. Listing saved with WhatsApp user's ID
5. Response sent (may be split if > 4000 chars)

**Verify**:
```sql
SELECT pl.*, u.email
FROM "PropertyListing" pl
JOIN "User" u ON pl."userId" = u.id
WHERE u.email LIKE 'whatsapp_%'
ORDER BY pl."createdAt" DESC LIMIT 5;
```

### 3.5 Long Message Handling Test

Ask something that generates a long response:

> "Explain all the costs involved in buying a property in Cyprus including transfer fees, VAT, stamp duty, legal fees, and any other expenses"

**Expected**: Response is split into multiple messages if > 4000 chars, with 500ms delay between each

### 3.6 Agent Recognition Test

If testing with a registered Zyprus agent's WhatsApp number:

1. Register agent in admin panel with their WhatsApp number
2. Send message from that number
3. **Expected**: `isAgent: true` in user mapping, agent's name used instead of "WhatsApp User XXXX"

---

## Part 4: Error Handling & Edge Cases

### 4.1 Missing Required Fields

Try creating a listing without images:

> "Create a listing for a villa in Paphos for €500,000"

**Expected**: Error message asking for images (required for Zyprus)

### 4.2 Invalid Taxonomy References

Manually test with invalid UUID:

```typescript
// In tool call, use invalid locationId
locationId: "00000000-0000-0000-0000-000000000000"
```

**Expected**: Zyprus API returns 422 error, tool returns user-friendly message

### 4.3 Authentication Failure

Test with expired/invalid token (modify `lib/zyprus/client.ts` temporarily):

**Expected**: Circuit breaker trips after 3 failures, clear error message

### 4.4 Rate Limiting

Send multiple rapid requests to WhatsApp:

**Expected**: `sendLongMessage` adds 500ms delays, WaSender retry logic handles 429s

### 4.5 Network Timeout

Test with slow network or Zyprus API down:

**Expected**: Timeout after configured limit, status set to "draft" (not "failed") for retry

---

## Part 5: Database Verification Queries

### Check PropertyListing Schema

```sql
-- Verify new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PropertyListing'
AND column_name IN ('listingTypeId', 'propertyStatusId', 'viewIds', 'yearBuilt', 'referenceId', 'energyClass', 'videoUrl', 'phoneNumber', 'propertyNotes', 'duplicateDetected', 'coordinates');
```

### Check LandListing Table

```sql
-- Verify table exists with all columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'LandListing'
ORDER BY ordinal_position;
```

### Check Indexes

```sql
-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('PropertyListing', 'LandListing')
ORDER BY tablename, indexname;
```

---

## Part 6: Code Files Reference

### Key Files Modified

| File | Purpose |
|------|---------|
| `lib/db/schema.ts` | PropertyListing + LandListing schemas |
| `lib/db/queries.ts` | CRUD functions for listings |
| `lib/ai/tools/create-listing.ts` | Property creation tool |
| `lib/ai/tools/upload-listing.ts` | Property upload tool |
| `lib/ai/tools/create-land-listing.ts` | Land creation tool (NEW) |
| `lib/ai/tools/upload-land-listing.ts` | Land upload tool (NEW) |
| `lib/ai/tools/get-zyprus-data.ts` | Taxonomy fetching tool |
| `lib/ai/context.ts` | User context for WhatsApp/Telegram (NEW) |
| `lib/whatsapp/user-mapping.ts` | WhatsApp user persistence (NEW) |
| `lib/whatsapp/message-handler.ts` | WhatsApp AI handler |
| `lib/whatsapp/client.ts` | WaSender client with sendLongMessage |
| `lib/zyprus/client.ts` | Zyprus API client |
| `app/(chat)/api/chat/route.ts` | Main chat API with tool registration |

### Key Functions to Trace

1. **Property Upload Flow**:
   ```
   createListingTool.execute()
   → createPropertyListing() [db]
   → uploadListingTool.execute()
   → uploadToZyprusAPI() [api]
   → updatePropertyListingStatus() [db]
   ```

2. **Land Upload Flow**:
   ```
   createLandListingTool.execute()
   → createLandListing() [db]
   → uploadLandListingTool.execute()
   → uploadLandToZyprusAPI() [api]
   → updateLandListingStatus() [db]
   ```

3. **WhatsApp Message Flow**:
   ```
   POST /api/whatsapp/webhook
   → handleWhatsAppMessage()
   → getOrCreateWhatsAppUser()
   → getOrCreateWhatsAppChat()
   → runWithUserContext()
   → streamText() with tools
   → sendLongMessage()
   ```

---

## Part 7: Known Issues & Workarounds

### Issue 1: Database Migration IPv6 Error

**Symptom**: `pnpm db:migrate` fails with ENETUNREACH

**Workaround**: Run migration SQL directly in Supabase SQL Editor, or it auto-applies on Vercel

### Issue 2: Images Required for Upload

**Symptom**: Upload fails without images

**Solution**: Ensure `imageUrls` array has at least 1 URL in createListing

### Issue 3: WhatsApp User Table Missing Name

**Symptom**: User table doesn't have name column

**Solution**: Names are stored in display only (from agent record or generated from phone)

---

## Success Criteria Checklist

- [ ] Zyprus API authentication works (Postman)
- [ ] All taxonomy endpoints return data (Postman)
- [ ] Property upload works via Postman
- [ ] Land upload works via Postman
- [ ] `getZyprusData` tool returns taxonomies in chat
- [ ] `createListing` creates property draft in database
- [ ] `uploadListing` uploads to Zyprus and returns URL
- [ ] `createLandListing` creates land draft in database
- [ ] `uploadLandListing` uploads to Zyprus and returns URL
- [ ] `listListings` returns user's listings
- [ ] WhatsApp messages trigger webhook
- [ ] WhatsApp users are persisted in database
- [ ] WhatsApp chat sessions are created
- [ ] Calculator tools work via WhatsApp
- [ ] Listing tools work via WhatsApp
- [ ] Long messages are split correctly
- [ ] Error messages are user-friendly

---

## Contact & Resources

- **Zyprus API Docs**: Internal (see `docs/knowledge/zyprus-api-reference.md`)
- **WaSender Docs**: https://wasenderapi.com/docs
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ebgsbtqtkdgaafqejjye
- **Vercel Dashboard**: https://vercel.com/qualiasolutions/sofia
