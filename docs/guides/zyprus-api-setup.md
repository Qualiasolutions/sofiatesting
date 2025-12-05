# Zyprus Property API Setup Guide

## Development Environment

The system is configured to use the Zyprus development environment at `https://dev9.zyprus.com`.

## CRITICAL: User-Agent Header Requirement

**All API requests MUST include the following header to bypass Cloudflare protection:**
```
User-Agent: SophiaAI
```

Without this header, all requests will return a 403 Forbidden error with a Cloudflare challenge page.

## API Endpoints

### Drupal JSON:API Endpoints

- **OAuth Token**: `POST /oauth/token`
- **Get Locations**: `GET /jsonapi/node/location`
- **Get Listings**: `GET /jsonapi/node/property`
- **Create Property**: `POST /jsonapi/node/property`
- **Upload Images**: `POST /jsonapi/node/property/field_gallery_`
- **Get Indoor Features**: `GET /jsonapi/taxonomy_term/indoor_property_views`
- **Get Outdoor Features**: `GET /jsonapi/taxonomy_term/outdoor_property_features`
- **Get Listing Types**: `GET /jsonapi/taxonomy_term/listing_type`
- **Get Property Types**: `GET /jsonapi/taxonomy_term/property_type`
- **Get Price Modifiers**: `GET /jsonapi/taxonomy_term/price_modifier`
- **Get Title Deeds**: `GET /jsonapi/taxonomy_term/title_deed`

## Configuration

### 1. OAuth Credentials

Add your OAuth credentials to `.env.local`:

```env
ZYPRUS_CLIENT_ID="your_client_id_here"
ZYPRUS_CLIENT_SECRET="your_client_secret_here"
ZYPRUS_API_URL="https://dev9.zyprus.com"
ZYPRUS_SITE_URL="https://dev9.zyprus.com"
```

### 2. Get OAuth Credentials

Contact the Zyprus development team or access the admin panel at:
- Development: https://dev9.zyprus.com/admin

### 3. OAuth Flow

The application uses OAuth 2.0 Client Credentials flow:

1. Request token with client credentials
2. Token is cached for reuse (with 5-minute buffer before expiry)
3. Token is automatically refreshed when expired
4. All API calls use Bearer token authentication

## Testing the Integration

### 1. Start the Development Server

```bash
pnpm dev
```

### 2. Access the Property Management UI

Navigate to: `http://localhost:3000/properties`

### 3. Test Property Creation

1. Fill in the property form with test data
2. Click "Create Listing" to save locally
3. The property will appear in your listings with "draft" status

### 4. Test Property Upload

1. Click "Upload" on any draft listing
2. The system will:
   - Request OAuth token
   - Upload any images (if provided)
   - Send property data in JSON:API format
   - Update status to "uploaded" on success

### 5. View on Zyprus

Successfully uploaded properties will have a "View on Zyprus" button that opens the property on the development site.

## Critical Requirements

### MANDATORY Fields for Property Upload

1. **status**: MUST be `false` to prevent unexpected display of non-reviewed properties
2. **field_ai_state**: MUST be `"draft"` to track AI-generated properties in the system

These two fields are CRUCIAL for proper property management in the Zyprus system.

## API Response Format

### Success Response

```json
{
  "data": {
    "type": "node--property",
    "id": "uuid-here",
    "attributes": {
      "title": "Property Title",
      "status": false,
      "field_ai_state": "draft"
    }
  }
}
```

### Error Response

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Unprocessable Entity",
      "detail": "Field validation error",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

## Field Mappings

| Local Field | Drupal Field | Type | Required |
|------------|--------------|------|----------|
| name | title | string | Yes |
| description | body.value | string | Yes |
| status | status | boolean | Yes (must be `false`) |
| - | field_ai_state | string | Yes (must be `"draft"`) |
| price | field_price | number | Yes |
| numberOfRooms | field_no_bedrooms | number | Yes |
| numberOfBathroomsTotal | field_no_bathrooms | number | Yes |
| floorSize | field_covered_area | number | Yes |
| landSize | field_land_size | number | No |
| numberOfKitchens | field_no_kitchens | number | No |
| numberOfLivingRooms | field_no_living_rooms | number | No |
| referenceId | field_own_reference_id | string | No |
| yearBuilt | field_year_built | number | No |
| - | field_new_build | boolean | No |
| address.geo | field_map | geo point | No |
| locationId | field_location | node reference | Recommended |
| propertyTypeId | field_property_type | taxonomy reference | Recommended |
| listingTypeId | field_listing_type | taxonomy reference | Recommended |
| image | field_gallery_ | file references | No |

## Troubleshooting

### OAuth Errors

- **CONFIG_ERROR**: Missing client ID or secret in environment variables
- **OAUTH_ERROR**: Invalid credentials or expired tokens
- **401 Unauthorized**: Check OAuth credentials are correct

### Upload Errors

- **TIMEOUT**: Request exceeded 30 seconds - check network connection
- **VALIDATION_ERROR**: Required fields missing or invalid format
- **NETWORK_ERROR**: Cannot reach the API - check URL configuration

### Common Issues

1. **Empty OAuth Credentials**
   - Ensure `ZYPRUS_CLIENT_ID` and `ZYPRUS_CLIENT_SECRET` are set

2. **Wrong API URL**
   - Verify `ZYPRUS_API_URL` points to `https://dev9.zyprus.com`

3. **Missing Required Fields**
   - Check all required fields are populated before upload
   - Minimum required: name, description, price, locality

4. **Image Upload Failures**
   - Images are uploaded separately before the property
   - Check image URLs are accessible
   - Verify file size limits with Zyprus team

## Support

For API access or technical issues with the Zyprus development environment, contact the development team or check the documentation at https://dev9.zyprus.com/api/documentation.