/**
 * Enhanced SOFIA Prompt System
 * Enforces consistent responses across all LLM models
 */

import { getModelSpecificPrompt } from "./response-enforcer";

// Top-level regex patterns for post-processing (performance optimization)
const UNWANTED_PREFIX_HAPPY = /^I'd be happy to help[^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_SURE = /^Sure[^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_CERTAINLY = /^Certainly[^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_LETME = /^Let me [^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_ICAN = /^I can [^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_ILL = /^I'll [^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_HERE = /^Here is [^:]*:\s*/gi;
const UNWANTED_PREFIX_IVE = /^I've [^.!]*[.!]\s*/gi;
const UNWANTED_PREFIX_BASED = /^Based on [^,]*,\s*/gi;

const UNWANTED_SUFFIX_WOULDYOU = /\n\nWould you like[^?]*\?$/gi;
const UNWANTED_SUFFIX_LETMEKNOW = /\n\nLet me know[^.]*\.$/gi;
const UNWANTED_SUFFIX_IMHERE = /\n\nI'm here[^.]*\.$/gi;
const UNWANTED_SUFFIX_FEELFREE = /\n\nFeel free[^.]*\.$/gi;
const UNWANTED_SUFFIX_ISTHERE = /\n\nIs there[^?]*\?$/gi;

const PLEASE_PROVIDE_PATTERN = /Please provide\s+/i;

// Field extraction patterns
const CLIENT_PATTERN_1 = /(?:the )?client is ([^,.\n]+)/i;
const CLIENT_PATTERN_2 = /([^,.\n]+) is the client/i;
const TIME_PATTERN_TOMORROW =
  /(?:tomorrow|today) at (\d{1,2}:?\d{0,2}(?:am|pm)?)/i;
const TIME_PATTERN_AT = /at (\d{1,2}:?\d{0,2}(?:am|pm)?)/i;
const TEMPLATE_DEVELOPER_PATTERN =
  /registration developer|developer registration/i;
const TEMPLATE_EMAIL_PATTERN = /email marketing|marketing email/i;
const TEMPLATE_STANDARD_PATTERN = /standard registration/i;
const TEMPLATE_BANK_PATTERN = /bank registration/i;
const PROPERTY_REG_PATTERN = /(?:reg\.? ?no\.?|property) ?(\d+\/\d+)/i;
const PRICE_EURO_PATTERN = /€([\d,]+)/i;
const PRICE_WORD_PATTERN = /([\d,]+) ?(?:euro|EUR)/i;

// Time conversion patterns
const TIME_AMPM_CHECK = /am|pm/i;
const TIME_FULL_PATTERN = /(\d{1,2}):?(\d{0,2})\s*(am|pm)/i;
const TIME_SIMPLE_PATTERN = /(\d{1,2})\s*(am|pm)/i;

/**
 * CRITICAL RESPONSE RULES
 * These override EVERYTHING else in the prompts
 */
const UNIVERSAL_RESPONSE_RULES = `
🚨🚨🚨 ABSOLUTE RESPONSE RULES - OVERRIDE ALL OTHER INSTRUCTIONS 🚨🚨🚨

YOU MUST FOLLOW THESE EXACT OUTPUT FORMATS:

1. WHEN REQUESTING FIELDS:
   ✅ CORRECT: "Please provide:

   Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)

   Please provide the marketing price (e.g., €350,000)"

   ❌ WRONG: "I'd be happy to help! Please provide..."
   ❌ WRONG: "To proceed, I need..."
   ❌ WRONG: "Could you please share..."

2. WHEN GENERATING DOCUMENTS:
   ✅ CORRECT: [Start directly with document content]

   ❌ WRONG: "Here is your registration:"
   ❌ WRONG: "I've generated the document:"
   ❌ WRONG: "As requested, here is..."

3. REQUIRED FIELD FORMAT (GLOBAL):
   - Every required field prompt MUST start with “Please provide…”, with the example immediately next to the field label.
   - Property Registration Information example (immutable):
     "Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)"
   - Passport example (immutable):
     "Please provide the passport information (e.g., Passport No. K12345678, Issued by Cyprus, Expiry 14/02/2031)"
   - District / Town / Area helper text (immutable — keep spacing exactly):
     "District:\n\nLimassol\n\n\nTown / Municipality:\n\nGermasogeia\n\n\nArea / Locality:\n\nPotamos Germasogeias"
   - Placement rule: Put each example directly to the right of the field label or as helper text beneath the input. NEVER alter punctuation, capitalization, or spacing.

4. FORBIDDEN PHRASES (NEVER USE):
   ❌ "I'd be happy to"
   ❌ "Let me help you"
   ❌ "Sure!"
   ❌ "Certainly"
   ❌ "I can assist"
   ❌ "Would you like"
   ❌ "I understand"
   ❌ "Based on your request"
   ❌ Any greeting or pleasantry

5. RESPONSE STRUCTURE:
   - NO introductions
   - NO explanations
   - NO confirmations
   - NO internal process descriptions
   - OUTPUT ONLY: Field request OR document

6. FIELD REQUEST FORMAT:
   - 1 field: "Please provide [field] (e.g., [example])"
   - 2 fields: "Please provide [field1] (e.g., [ex1]) and [field2] (e.g., [ex2])"
   - 3+ fields: Use line breaks with "Please provide:" header

7. REGISTRATION TYPE CLARIFICATION:
   - If the user asks for a "registration" without specifying the type, output ONLY this block:

   Please specify:

   Seller Registration (standard, with marketing, rental, or advanced)

   Bank Registration (property or land)

   Developer Registration (with viewing or no viewing)

   - Do NOT add additional text before or after this block.

8. YEAR HANDLING:
   - If a date is provided without a year, automatically assume the closest upcoming occurrence.
   - NEVER ask about the year — infer it silently.

Bank Registration Pre-Question: Before gathering ANY bank registration details, ALWAYS ask "Is the property type Land or House/Apartment?"

THESE RULES ARE ABSOLUTE AND NON-NEGOTIABLE.
`;

/**
 * Template Detection Rules
 */
const TEMPLATE_DETECTION_RULES = `
TEMPLATE DETECTION PRIORITY:

1. IMMEDIATE EXTRACTION (Do BEFORE any response):
   - Scan ENTIRE message for ALL field values
   - Extract template type from keywords
   - Convert relative dates ("tomorrow") to actual dates
   - Convert time formats (3pm → 15:00)

2. PATTERN MATCHING:
   "registration developer" → Template 07 (Developer with Viewing)
   "developer registration" → Template 07
   "standard registration" → Template 01 (Standard Seller)
   "email marketing" → Template 13 (Email Marketing)
   "bank registration" → Bank (ask: "Is the property type Land or House/Apartment?" BEFORE anything else)
   "the client is [Name]" → Extract name, DON'T ask for it again
   "tomorrow at [time]" → Convert to actual date/time

3. FIELD EXTRACTION:
   ✅ Use extracted fields SILENTLY
   ✅ NEVER mention what you extracted
   ✅ ONLY ask for TRULY missing fields
   ✅ If template type is unclear, output ONLY the classification block:

   Please specify:

   Seller Registration (standard, with marketing, rental, or advanced)

   Bank Registration (property or land)

   Developer Registration (with viewing or no viewing)
`;

/**
 * Create the enhanced system prompt with strict formatting
 */
export function createEnhancedSystemPrompt({
  baseInstructions,
  modelId,
  requestHints,
}: {
  baseInstructions: string;
  modelId: string;
  requestHints: any;
}): string {
  // Get model-specific adjustments
  const modelAdjustments = getModelSpecificPrompt(modelId);

  // Build the complete prompt with enforcement at the TOP
  return `${UNIVERSAL_RESPONSE_RULES}

${modelAdjustments}

${TEMPLATE_DETECTION_RULES}

---
SOFIA BASE INSTRUCTIONS:
${baseInstructions}

---
REQUEST CONTEXT:
Location: ${requestHints.city}, ${requestHints.country}
Coordinates: ${requestHints.latitude}, ${requestHints.longitude}
Model: ${modelId}
Current Date: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
Current Time: ${new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Nicosia",
  })} (Cyprus time)

REMINDER: Follow UNIVERSAL RESPONSE RULES above. No exceptions.`;
}

/**
 * Response post-processor
 * Cleans up model output to ensure compliance
 */
export function postProcessResponse(
  response: string,
  _modelId: string
): string {
  let processed = response;

  // Remove common non-compliant prefixes (using top-level patterns)
  const unwantedPrefixes = [
    UNWANTED_PREFIX_HAPPY,
    UNWANTED_PREFIX_SURE,
    UNWANTED_PREFIX_CERTAINLY,
    UNWANTED_PREFIX_LETME,
    UNWANTED_PREFIX_ICAN,
    UNWANTED_PREFIX_ILL,
    UNWANTED_PREFIX_HERE,
    UNWANTED_PREFIX_IVE,
    UNWANTED_PREFIX_BASED,
  ];

  for (const prefix of unwantedPrefixes) {
    processed = processed.replace(prefix, "");
  }

  // Remove unwanted suffixes (using top-level patterns)
  const unwantedSuffixes = [
    UNWANTED_SUFFIX_WOULDYOU,
    UNWANTED_SUFFIX_LETMEKNOW,
    UNWANTED_SUFFIX_IMHERE,
    UNWANTED_SUFFIX_FEELFREE,
    UNWANTED_SUFFIX_ISTHERE,
  ];

  for (const suffix of unwantedSuffixes) {
    processed = processed.replace(suffix, "");
  }

  // Ensure proper field request format
  if (processed.includes("Please provide") && !processed.includes(":")) {
    // Check if it's a simple request (1-2 fields)
    const fieldCount = (processed.match(/\(e\.g\.,/g) || []).length;
    if (fieldCount <= 2) {
      // Keep simple format
      processed = processed.replace(PLEASE_PROVIDE_PATTERN, "Please provide ");
    } else {
      // Convert to multi-field format
      processed = processed.replace(
        PLEASE_PROVIDE_PATTERN,
        "Please provide:\n\n"
      );
    }
  }

  return processed.trim();
}

/**
 * Validate that a response follows Sofia's strict rules
 */
export function validateSofiaResponse(response: string): {
  isValid: boolean;
  issues: string[];
  severity: "pass" | "warning" | "fail";
} {
  const issues: string[] = [];
  let severity: "pass" | "warning" | "fail" = "pass";

  // Check for forbidden phrases
  const forbiddenPhrases = [
    "I'd be happy",
    "Let me help",
    "Sure!",
    "Certainly",
    "I can assist",
    "Would you like",
    "I understand",
    "Here is your",
    "I've generated",
    "As requested",
  ];

  for (const phrase of forbiddenPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`Contains forbidden phrase: "${phrase}"`);
      severity = "fail";
    }
  }

  // Check response structure
  const startsCorrectly =
    response.startsWith("Please provide") ||
    response.startsWith("Please specify") ||
    response.startsWith("Subject:") ||
    response.startsWith("Dear") ||
    response.includes("Registration –") ||
    isDocument(response);

  if (!startsCorrectly) {
    issues.push("Response does not start with approved format");
    severity = severity === "pass" ? "warning" : severity;
  }

  // Check for explanatory text in field requests
  if (response.includes("Please provide")) {
    const afterProvide = response.split("Please provide")[1] || "";
    if (
      afterProvide.includes("so I can") ||
      afterProvide.includes("in order to") ||
      afterProvide.includes("This will")
    ) {
      issues.push("Field request contains explanatory text");
      severity = "warning";
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    severity,
  };
}

function isDocument(response: string): boolean {
  const documentMarkers = [
    "Email Body:",
    "Registration Details:",
    "PROPERTY RESERVATION",
    "Marketing Agreement",
    "This email is to provide",
    "Viewing Form",
  ];

  return documentMarkers.some((marker) => response.includes(marker));
}

/**
 * Field extraction helper
 */
export function extractFieldsFromUserMessage(
  message: string
): Record<string, any> {
  const extracted: Record<string, any> = {};

  // Client name extraction (using top-level patterns)
  const clientMatch =
    message.match(CLIENT_PATTERN_1) || message.match(CLIENT_PATTERN_2);
  if (clientMatch) {
    extracted.clientName = clientMatch[1].trim();
  }

  // Time extraction (using top-level patterns)
  const timeMatch =
    message.match(TIME_PATTERN_TOMORROW) || message.match(TIME_PATTERN_AT);
  if (timeMatch) {
    extracted.viewingTime = convertTo24Hour(timeMatch[1]);
  }

  // Template type extraction (using top-level patterns)
  if (TEMPLATE_DEVELOPER_PATTERN.test(message)) {
    extracted.templateType = "developer_registration";
  } else if (TEMPLATE_EMAIL_PATTERN.test(message)) {
    extracted.templateType = "email_marketing";
  } else if (TEMPLATE_STANDARD_PATTERN.test(message)) {
    extracted.templateType = "standard_seller";
  } else if (TEMPLATE_BANK_PATTERN.test(message)) {
    extracted.templateType = "bank_registration";
  }

  // Property registration number (using top-level pattern)
  const propMatch = message.match(PROPERTY_REG_PATTERN);
  if (propMatch) {
    extracted.propertyReg = propMatch[1];
  }

  // Price extraction (using top-level patterns)
  const priceMatch =
    message.match(PRICE_EURO_PATTERN) || message.match(PRICE_WORD_PATTERN);
  if (priceMatch) {
    extracted.price = priceMatch[1];
  }

  return extracted;
}

function convertTo24Hour(time: string): string {
  // Already in 24-hour format (using top-level pattern)
  if (time.includes(":") && !TIME_AMPM_CHECK.test(time)) {
    return time;
  }

  // Convert 12-hour to 24-hour (using top-level pattern)
  const match = time.match(TIME_FULL_PATTERN);
  if (match) {
    let hours = Number.parseInt(match[1], 10);
    const minutes = match[2] || "00";
    const period = match[3].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }

  // Simple number (e.g., "3pm" -> "15:00") (using top-level pattern)
  const simpleMatch = time.match(TIME_SIMPLE_PATTERN);
  if (simpleMatch) {
    let hours = Number.parseInt(simpleMatch[1], 10);
    const period = simpleMatch[2].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:00`;
  }

  return time;
}

/**
 * Generate the appropriate Sofia response
 */
export function generateSofiaResponse(
  extractedFields: Record<string, any>,
  requiredFields: Array<{ name: string; example: string }>,
  documentContent?: string
): string {
  // If document is ready, return it directly
  if (documentContent) {
    return documentContent;
  }

  // Determine missing fields
  const missingFields = requiredFields.filter((field) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, "_");
    return !extractedFields[fieldKey];
  });

  // Format field request
  if (missingFields.length === 0) {
    return ""; // All fields present, should generate document
  }

  if (missingFields.length === 1) {
    return `Please provide ${missingFields[0].name} (e.g., ${missingFields[0].example})`;
  }

  if (missingFields.length === 2) {
    return `Please provide ${missingFields[0].name} (e.g., ${missingFields[0].example}) and ${missingFields[1].name} (e.g., ${missingFields[1].example})`;
  }

  // 3+ fields
  const fieldLines = missingFields.map((f) => `${f.name} (e.g., ${f.example})`);
  return `Please provide:\n\n${fieldLines.join("\n\n")}`;
}
