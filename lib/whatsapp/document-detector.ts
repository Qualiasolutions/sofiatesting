/**
 * Document Detector for WhatsApp Integration
 *
 * Determines whether SOFIA's response should be sent as a .docx document
 * or as plain text based on template type detection.
 *
 * FORMS (Templates 01-16) → Send as .docx file
 * EMAILS/COMMUNICATIONS (Templates 17-43) → Send as plain text
 */

// Top-level regex patterns for document type detection (performance optimization)
const SELLER_REGISTRATION_PATTERN = /Seller\s*Registration/i;
const BANK_REGISTRATION_PATTERN = /Bank\s*(Property|Land)\s*Registration/i;
const DEVELOPER_REGISTRATION_PATTERN = /Developer\s*Registration/i;
const VIEWING_FORM_PATTERN = /Viewing\s*Form/i;
const PROPERTY_VIEWING_PATTERN = /Property\s*Viewing/i;
const RESERVATION_PATTERN = /Reservation/i;
const MARKETING_AGREEMENT_PATTERN = /Marketing\s*Agreement/i;

// Form templates that should be sent as .docx documents
const FORM_TEMPLATE_PATTERNS = [
  // Templates 01-04: Seller Registrations
  /Registration\s*–\s*Seller/i,
  /Standard\s*Seller\s*Registration/i,
  /Seller\s*with\s*Marketing/i,
  /Rental\s*Property\s*Registration/i,
  /Advanced\s*Seller\s*Registration/i,

  // Templates 05-06: Bank Registrations
  /Bank\s*Property\s*Registration/i,
  /Bank\s*Land\s*Registration/i,

  // Templates 07-08: Developer Registrations
  /Developer\s*Registration/i,

  // Templates 09-11: Viewing Forms
  /Viewing\s*Form/i,
  /Property\s*Viewing/i,
  /Multiple\s*Persons\s*Viewing/i,

  // Templates 12-13: Reservations
  /Property\s*Reservation/i,
  /Reservation\s*Agreement/i,
  /Reservation\s*Form/i,

  // Templates 14-16: Marketing Agreements
  /Marketing\s*Agreement/i,
  /Non-Exclusive\s*Marketing/i,
  /Exclusive\s*Marketing/i,
];

// Calculator exclusion patterns - these should NEVER be sent as documents
const CALCULATOR_EXCLUSION_PATTERNS = [
  /VAT.*calculation/i,
  /transfer.*fees/i,
  /capital.*gains/i,
  /stamp.*duty/i,
  /property.*tax/i,
  /municipal.*taxes/i,
  /immovable.*property/i,
  /total.*cost/i,
  /total.*amount/i,
  /due.*amount/i,
  /€[0-9,]+/i,
  /EUR\s*[0-9,]+/i,
  /cyprus.*real.*estate/i,
  /cyprus.*property/i,
  /property.*value/i,
  /market.*value/i,
  /taxable.*value/i,
];

// Form field indicators - strong signals for document detection
const FORM_FIELD_INDICATORS = [
  /Registration\s*No\./i,
  /Property\s*Introduced:/i,
  /Client\s*Information:/i,
  /Viewing\s*Arranged\s*for:/i,
  /Please\s*confirm\s*Registration/i,
  /Title\s*Deed\s*No:/i,
  /Date\s*of\s*Viewing:/i,
  /Property\s*Address:/i,
  /Owner('s)?\s*Name:/i,
  /Agent('s)?\s*Name:/i,
  /Client('s)?\s*Name:/i,
  /Signature:/i,
  /Commission\s*Rate:/i,
  /Agreement\s*Date:/i,
  /Reservation\s*Amount:/i,
];

/**
 * Detect if the response should be sent as a document (.docx)
 * Forms (templates 01-16) should be sent as documents
 * Emails and other communications should be sent as plain text
 */
export function shouldSendAsDocument(response: string): boolean {
  // FIRST: Check if this looks like a calculator response - if so, NEVER send as document
  for (const pattern of CALCULATOR_EXCLUSION_PATTERNS) {
    if (pattern.test(response)) {
      // This contains calculator-like content, send as text
      return false;
    }
  }

  // SECOND: Check for explicit form template name match (very strict)
  let hasFormTemplateName = false;
  for (const pattern of FORM_TEMPLATE_PATTERNS) {
    if (pattern.test(response)) {
      hasFormTemplateName = true;
      break;
    }
  }

  // If no form template name found, don't send as document
  if (!hasFormTemplateName) {
    return false;
  }

  // THIRD: Require multiple field indicators to confirm it's actually a form
  // Increased from 2 to 5 to be more strict
  let fieldIndicatorCount = 0;
  for (const pattern of FORM_FIELD_INDICATORS) {
    if (pattern.test(response)) {
      fieldIndicatorCount++;
    }
  }

  // Need at least 5 field indicators to confirm it's a form (was 2)
  return fieldIndicatorCount >= 5;
}

/**
 * Get the document type based on response content
 * Used for naming the generated .docx file
 */
export function getDocumentType(response: string): string {
  // Check specific patterns in priority order (using top-level patterns)
  if (SELLER_REGISTRATION_PATTERN.test(response)) {
    return "SellerRegistration";
  }
  if (BANK_REGISTRATION_PATTERN.test(response)) {
    return "BankRegistration";
  }
  if (DEVELOPER_REGISTRATION_PATTERN.test(response)) {
    return "DeveloperRegistration";
  }
  if (VIEWING_FORM_PATTERN.test(response)) {
    return "ViewingForm";
  }
  if (PROPERTY_VIEWING_PATTERN.test(response)) {
    return "ViewingForm";
  }
  if (RESERVATION_PATTERN.test(response)) {
    return "Reservation";
  }
  if (MARKETING_AGREEMENT_PATTERN.test(response)) {
    return "MarketingAgreement";
  }

  // Default fallback
  return "Document";
}
