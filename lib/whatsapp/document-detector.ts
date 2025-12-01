/**
 * Document Detector for WhatsApp Integration
 *
 * Determines whether SOFIA's response should be sent as a .docx document
 * or as plain text based on template type detection.
 *
 * FORMS (Templates 01-16) → Send as .docx file
 * EMAILS/COMMUNICATIONS (Templates 17-43) → Send as plain text
 */

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
  // Check for form template patterns
  for (const pattern of FORM_TEMPLATE_PATTERNS) {
    if (pattern.test(response)) {
      return true;
    }
  }

  // Check for form field indicators (need at least 2 to be sure)
  let fieldIndicatorCount = 0;
  for (const pattern of FORM_FIELD_INDICATORS) {
    if (pattern.test(response)) {
      fieldIndicatorCount++;
      if (fieldIndicatorCount >= 2) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the document type based on response content
 * Used for naming the generated .docx file
 */
export function getDocumentType(response: string): string {
  // Check specific patterns in priority order
  if (/Seller\s*Registration/i.test(response)) {
    return "SellerRegistration";
  }
  if (/Bank\s*(Property|Land)\s*Registration/i.test(response)) {
    return "BankRegistration";
  }
  if (/Developer\s*Registration/i.test(response)) {
    return "DeveloperRegistration";
  }
  if (/Viewing\s*Form/i.test(response)) {
    return "ViewingForm";
  }
  if (/Property\s*Viewing/i.test(response)) {
    return "ViewingForm";
  }
  if (/Reservation/i.test(response)) {
    return "Reservation";
  }
  if (/Marketing\s*Agreement/i.test(response)) {
    return "MarketingAgreement";
  }

  // Default fallback
  return "Document";
}
