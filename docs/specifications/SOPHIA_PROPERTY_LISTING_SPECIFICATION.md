# SOPHIA AI — PROPERTY LISTING SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's property and land listing capabilities. Sophia is an AI assistant for Zyprus Property Group (Cyprus Real Estate) that creates and uploads property listings to zyprus.com.

---

## SECTION 1: LISTING SYSTEM OVERVIEW

### 1.1 System Architecture

Sophia manages property and land listings through an integrated system that connects to the Zyprus API (Drupal JSON:API backend).

| Component | Description |
|-----------|-------------|
| AI Tools | `createListing`, `createLandListing`, `uploadListing`, `uploadLandListing`, `listListings` |
| API Client | `lib/zyprus/client.ts` with OAuth 2.0 authentication |
| Taxonomy Cache | `lib/zyprus/taxonomy-cache.ts` (1-hour TTL) |
| Database | Local PostgreSQL for draft storage and tracking |
| Target Platform | zyprus.com (Drupal JSON:API) |

### 1.2 Listing Types

| Type | Endpoint | Image Field | Tools |
|------|----------|-------------|-------|
| Property | `/jsonapi/node/property` | `field_gallery_` | `createListing`, `uploadListing` |
| Land | `/jsonapi/node/land` | `field_land_gallery` | `createLandListing`, `uploadLandListing` |

### 1.3 Listing Status Flow

```
draft → uploading → uploaded → published
                ↘
                 failed (permanent errors only)
```

| Status | Description |
|--------|-------------|
| `draft` | Saved locally, not yet uploaded |
| `uploading` | Currently being uploaded to Zyprus |
| `uploaded` | Successfully uploaded as unpublished draft |
| `published` | Live on zyprus.com (admin action) |
| `failed` | Permanent error, requires manual fix |

---

## SECTION 2: PROPERTY LISTING FIELDS

### 2.1 Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Property title (10-200 chars) | "Luxury Villa in Limassol" |
| `description` | string | Detailed description (20-2000 chars) | Full property description |
| `locationId` | UUID | Location from Zyprus taxonomy | UUID |
| `price` | number | Price in Euros | 500000 |
| `bedrooms` | integer | Number of bedrooms (1-20) | 3 |
| `bathrooms` | number | Number of bathrooms (0.5-10) | 2.5 |
| `squareFootage` | number | Size in m² (10-10000) | 150 |
| `ownerName` | string | Owner/agent name | "John Smith" |
| `ownerPhone` | string | Contact phone | "+357 99 123 456" |
| `swimmingPool` | enum | Pool status | "private", "communal", "none" |
| `hasParking` | boolean | Has parking | true/false |
| `hasAirConditioning` | boolean | Has AC | true/false |
| `imageUrls` | array | Property images (min 1) | ["https://..."] |

### 2.2 Optional Taxonomy Fields

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `propertyTypeId` | UUID | `taxonomy_term--property_type` | Apartment, Villa, House, etc. |
| `listingTypeId` | UUID | `taxonomy_term--listing_type` | For Sale, For Rent, Exchange |
| `propertyStatusId` | UUID | `taxonomy_term--property_status` | Resale, New Build, Off Plan |
| `indoorFeatureIds` | UUID[] | `taxonomy_term--indoor_property_views` | Air Conditioning, Fireplace, etc. |
| `outdoorFeatureIds` | UUID[] | `taxonomy_term--outdoor_property_features` | Garden, Terrace, etc. |
| `viewIds` | UUID[] | `taxonomy_term--property_views` | Sea View, Mountain View, etc. |
| `priceModifierId` | UUID | `taxonomy_term--price_modifier` | Guide Price, POA, etc. |
| `titleDeedId` | UUID | `taxonomy_term--title_deed` | Title deed type |

### 2.3 Optional Detail Fields

| Field | Type | Description |
|-------|------|-------------|
| `yearBuilt` | integer | Construction year (1900-2030) |
| `energyClass` | string | Energy rating (A+, A, B, C, D, E, F, G) |
| `videoUrl` | URL | YouTube/Vimeo link |
| `referenceId` | string | Internal reference number |
| `coordinates` | object | GPS { latitude, longitude } |
| `titleDeedNumber` | string | Official title deed number |
| `backofficeNotes` | string | Notes for review team |
| `googleMapsUrl` | URL | Google Maps pin link |
| `verandaArea` | number | Veranda size in m² |
| `plotArea` | number | Total plot size in m² |

---

## SECTION 3: LAND LISTING FIELDS

### 3.1 Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Land title (10-200 chars) | "Building Plot in Paphos" |
| `description` | string | Detailed description | Full land description |
| `price` | number | Price in Euros | 150000 |
| `landSize` | number | Land area in m² | 2000 |
| `landTypeId` | UUID | Land type taxonomy | Plot, Field, Agricultural |
| `locationId` | UUID | Location taxonomy | UUID |
| `listingTypeId` | UUID | For Sale, For Rent, etc. | UUID |
| `imageUrls` | array | Land images (min 1) | ["https://..."] |

### 3.2 Building Permission Fields

| Field | Type | Description |
|-------|------|-------------|
| `buildingDensity` | number | Building density % (0-100) |
| `siteCoverage` | number | Site coverage % (0-100) |
| `maxFloors` | integer | Maximum floors allowed |
| `maxHeight` | number | Maximum height in meters |

### 3.3 Land-Specific Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `infrastructureIds` | UUID[] | Electricity, Water, Road Access, etc. |
| `viewIds` | UUID[] | Sea View, Mountain View, etc. |
| `priceModifierId` | UUID | Guide Price, POA, etc. |
| `titleDeedId` | UUID | Title deed type |

---

## SECTION 4: ZYPRUS API INTEGRATION

### 4.1 Authentication

```
Method: OAuth 2.0 Client Credentials
Endpoint: /oauth/token
Required Headers:
  - User-Agent: SophiaAI (REQUIRED - Cloudflare whitelist)
  - Content-Type: application/vnd.api+json
  - Accept: application/vnd.api+json
  - Authorization: Bearer {token}
```

### 4.2 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ZYPRUS_API_URL` | API base URL | Yes |
| `ZYPRUS_CLIENT_ID` | OAuth client ID | Yes |
| `ZYPRUS_CLIENT_SECRET` | OAuth client secret | Yes |
| `ZYPRUS_SITE_URL` | Website URL for links | Optional |

### 4.3 API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Get locations | GET | `/jsonapi/node/location` |
| Get taxonomy | GET | `/jsonapi/taxonomy_term/{vocabulary}` |
| Create property | POST | `/jsonapi/node/property` |
| Create land | POST | `/jsonapi/node/land` |
| Upload property images | POST | `/jsonapi/node/property/field_gallery_` |
| Upload land images | POST | `/jsonapi/node/land/field_land_gallery` |

### 4.4 Critical API Rules

```
RULE: All AI listings created with status: false (unpublished draft)
RULE: Set field_ai_state: "draft" for AI tracking
RULE: Set field_ai_generated: true to identify AI-created listings
RULE: Include User-Agent: SophiaAI header on ALL requests
RULE: Use POINT format with LON first: "POINT (33.0413 34.6841)"
```

---

## SECTION 5: IMAGE UPLOAD PROCESS

### 5.1 Parallel Upload Architecture

```
Image URLs provided by user
        ↓
Create upload promises for each image (parallel)
        ↓
Promise.allSettled() - execute all in parallel
        ↓
Collect successful file UUIDs
        ↓
Attach to listing via relationships.field_gallery_
```

### 5.2 Upload Request Format

```
Method: POST
Endpoint: /jsonapi/node/{type}/field_{gallery_field}
Headers:
  - Authorization: Bearer {token}
  - User-Agent: SophiaAI
  - Content-Type: application/octet-stream
  - Content-Disposition: file; filename="{filename}"
Body: Raw binary image data
```

### 5.3 Supported Image Formats

| Extension | MIME Type |
|-----------|-----------|
| .jpg, .jpeg | `image/jpeg` |
| .png | `image/png` |
| .gif | `image/gif` |
| .webp | `image/webp` |

### 5.4 Additional File Types

| Field | File Types | Node Type |
|-------|------------|-----------|
| `field_floor_plan` | Images | Property |
| `field_pdf_floor_plan` | PDF | Property |
| `field_epc` | PDF | Property |
| `field_land_gallery` | Images | Land |

---

## SECTION 6: REFERENCE ID GENERATION

### 6.1 Auto-Generation Logic

```
Format: [last 4 phone digits]-[email prefix 4 chars]-[title deed number]

Examples:
  Input: phone="+35799123456", email="john@email.com", deed="AB123"
  Output: "3456-JOHN-AB123"

  Input: phone="+35797654321" only
  Output: "4321"

Fallback: AI-[8 char UUID] if no owner info provided
  Example: "AI-A1B2C3D4"
```

### 6.2 Reference ID Purpose

- Unique identifier for duplicate detection
- Links back to owner/agent information
- Used in search and filtering
- Helps prevent duplicate listings

---

## SECTION 7: DUPLICATE DETECTION

### 7.1 Detection Process

```
Listing created locally
        ↓
Call checkForDuplicates() with criteria
        ↓
Search Zyprus API by:
  1. Reference ID (exact match)
  2. Location + Price range (±10%)
  3. Title similarity
        ↓
Flag if matches found
        ↓
Set field_ai_probably_exists: true
        ↓
Add duplicate info to propertyNotes
```

### 7.2 Duplicate Check Response

```json
{
  "exists": true,
  "matches": [
    {
      "id": "uuid",
      "title": "Similar Property",
      "url": "https://zyprus.com/property/uuid",
      "price": "500000",
      "referenceId": "1234-JOHN"
    }
  ]
}
```

### 7.3 Duplicate Handling

- Listing flagged for manual review
- Warning shown to user with matches
- Listings team verifies before publishing
- Does NOT prevent creation

---

## SECTION 8: CIRCUIT BREAKER PROTECTION

### 8.1 Circuit Breakers

| Breaker | Timeout | Threshold | Reset |
|---------|---------|-----------|-------|
| ZyprusOAuth | 10s | 60% | 60s |
| ZyprusUpload | 45s | 50% | 30s |
| ZyprusLandUpload | 45s | 50% | 30s |

### 8.2 Circuit States

| State | Behavior |
|-------|----------|
| CLOSED | Normal operation, requests pass through |
| OPEN | All requests fail fast, no API calls |
| HALF-OPEN | Test requests allowed, monitoring for recovery |

### 8.3 Error Classification

**Permanent Errors (do not retry):**
- AUTH_FAILED
- INVALID_DATA
- FORBIDDEN
- NOT_FOUND
- CONFIG_ERROR
- OAUTH_ERROR

**Temporary Errors (may retry):**
- TIMEOUT
- NETWORK_ERROR
- API_ERROR (5xx)

---

## SECTION 9: LISTING TOOLS

### 9.1 createListing Tool

```
Description: Create property listing draft
Requires: getZyprusData first for taxonomy UUIDs
Output: Listing ID, status message, Zyprus URL (if successful)
```

### 9.2 createLandListing Tool

```
Description: Create land/plot listing draft
Requires: getZyprusData with resourceType='all_land'
Output: Listing ID, status message
```

### 9.3 uploadListing Tool

```
Description: Upload property listing to zyprus.com
Input: Optional listingId (uses most recent if not specified)
Validates: locationId required, checks permissions
```

### 9.4 uploadLandListing Tool

```
Description: Upload land listing to zyprus.com
Input: Optional listingId
Validates: locationId, landTypeId, listingTypeId required
```

### 9.5 listListings Tool

```
Description: Show user's property listings with status
Input: limit (1-50, default 10)
Output: Formatted list with status, price, location
```

---

## SECTION 10: JSON:API PAYLOAD STRUCTURE

### 10.1 Property Payload

```json
{
  "data": {
    "type": "node--property",
    "attributes": {
      "status": false,
      "title": "Property Title",
      "body": { "value": "Description", "format": "plain_text" },
      "field_ai_state": "draft",
      "field_ai_generated": true,
      "field_price": "500000",
      "field_covered_area": 150,
      "field_no_bedrooms": 3,
      "field_no_bathrooms": 2,
      "field_own_reference_id": "AI-A1B2C3D4",
      "field_map": {
        "value": "POINT (33.0413 34.6841)",
        "geo_type": "Point",
        "lat": 34.6841,
        "lon": 33.0413,
        "latlon": "34.6841,33.0413"
      }
    },
    "relationships": {
      "field_location": {
        "data": { "type": "node--location", "id": "uuid" }
      },
      "field_property_type": {
        "data": { "type": "taxonomy_term--property_type", "id": "uuid" }
      },
      "field_gallery_": {
        "data": [{ "type": "file--file", "id": "image-uuid" }]
      }
    }
  }
}
```

### 10.2 Land Payload

```json
{
  "data": {
    "type": "node--land",
    "attributes": {
      "status": false,
      "title": "Land Title",
      "body": { "value": "Description", "format": "plain_text" },
      "field_ai_state": "draft",
      "field_ai_generated": true,
      "field_price": "150000",
      "field_land_size": 2000,
      "field_building_density": 60,
      "field_site_coverage": 50,
      "field_floors": 3,
      "field_height": 12
    },
    "relationships": {
      "field_location": {
        "data": { "type": "node--location", "id": "uuid" }
      },
      "field_land_type": {
        "data": { "type": "taxonomy_term--land_type", "id": "uuid" }
      },
      "field_listing_type": {
        "data": { "type": "taxonomy_term--listing_type", "id": "uuid" }
      },
      "field_land_gallery": {
        "data": [{ "type": "file--file", "id": "image-uuid" }]
      }
    }
  }
}
```

---

## SECTION 11: ERROR HANDLING

### 11.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Missing User-Agent | Add `User-Agent: SophiaAI` header |
| 404 on taxonomy | Wrong vocabulary name | Use correct vocabulary from API |
| 422 Unprocessable | Invalid UUID | Verify taxonomy IDs from cache |
| OAuth error | Invalid credentials | Check ZYPRUS_CLIENT_ID/SECRET |
| Timeout | Slow API response | Retry (circuit breaker handles) |

### 11.2 Upload Attempt Logging

Every upload attempt is logged:

| Field | Description |
|-------|-------------|
| `listingId` | Local listing UUID |
| `attemptNumber` | Retry count |
| `status` | "success" or "failed" |
| `errorMessage` | Error details |
| `errorCode` | Error classification |
| `durationMs` | Request duration |

---

## SECTION 12: BEHAVIOR SUMMARY MATRIX

| Task | Sophia's Responsibility | Human Responsibility |
|------|------------------------|---------------------|
| Field extraction | Parse from conversation | Provide property details |
| Taxonomy lookup | Use getZyprusData tool | None |
| Image upload | Parallel upload to API | Provide image URLs |
| Reference ID | Auto-generate from owner info | Provide owner details |
| Duplicate check | Auto-check before upload | Review flagged listings |
| API upload | Execute with retry logic | None |
| Error handling | Log and report errors | Retry or fix data |
| Status tracking | Update local database | None |

---

## SECTION 13: CRITICAL RULES (ALWAYS ENFORCE)

1. **Use getZyprusData FIRST** — Never guess taxonomy UUIDs

2. **At least 1 image required** — Listings fail without images

3. **Status false for AI listings** — Never publish directly

4. **Set AI tracking fields** — field_ai_state, field_ai_generated

5. **Include User-Agent header** — Required for Cloudflare whitelist

6. **LON before LAT in POINT** — Format: POINT (longitude latitude)

7. **Indoor features vocabulary** — Use `indoor_property_views` NOT `indoor_property_features`

8. **Log all upload attempts** — Track success/failure for debugging

9. **Circuit breaker protection** — Prevents API overload on failures

10. **Draft expires in 7 days** — Local drafts have expiration

---

*End of Property Listing Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
