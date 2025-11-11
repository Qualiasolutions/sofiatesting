/**
 * SOFIA Response Consistency Enforcer
 *
 * This module ensures Sofia maintains consistent communication patterns
 * regardless of the underlying LLM model (Claude, GPT-4, etc.)
 *
 * Author: Winston (System Architect)
 * Purpose: Enforce strict response templates across all models
 */

export interface ResponseTemplate {
  type: 'field_request' | 'document_generation' | 'error' | 'clarification';
  format: string;
  rules: string[];
}

/**
 * STRICT RESPONSE TEMPLATES
 * These templates MUST be used for all responses
 */
export const RESPONSE_TEMPLATES: Record<string, ResponseTemplate> = {
  // When requesting missing fields
  FIELD_REQUEST: {
    type: 'field_request',
    format: `Please provide:

{FIELD_1} (e.g., {EXAMPLE_1})

{FIELD_2} (e.g., {EXAMPLE_2})`,
    rules: [
      'ALWAYS start with "Please provide:"',
      'Each field on NEW LINE with blank line between',
      'ALWAYS include example in parentheses',
      'NO additional text or explanations',
      'NO greetings or pleasantries',
      'Maximum 2-3 sentences total'
    ]
  },

  // When only 1-2 fields missing
  SIMPLE_REQUEST: {
    type: 'field_request',
    format: `Please provide {FIELD} (e.g., {EXAMPLE})`,
    rules: [
      'Use for 1-2 fields only',
      'Single line format',
      'NO numbered lists',
      'NO explanations'
    ]
  },

  // When template type needs clarification
  TEMPLATE_CLARIFICATION: {
    type: 'clarification',
    format: `Please specify:

Seller Registration (standard, with marketing, rental, or advanced)

Bank Registration (property or land)

Developer Registration (with viewing or no viewing)`,
    rules: [
      'ALWAYS start with "Please specify:"',
      'List options with categories',
      'NO additional explanations'
    ]
  },

  // When document is generated
  DOCUMENT_GENERATION: {
    type: 'document_generation',
    format: `{DOCUMENT_CONTENT}`,
    rules: [
      'OUTPUT DOCUMENT ONLY',
      'NO introductory text',
      'NO "Here is your document" phrases',
      'NO explanations after document'
    ]
  }
};

/**
 * Response validation patterns
 * These patterns detect non-compliant responses
 */
export const FORBIDDEN_PATTERNS = [
  // Pleasantries and greetings
  /I'd be happy to/i,
  /I can help/i,
  /Sure!/i,
  /Certainly/i,
  /Let me assist/i,
  /I'll help you/i,
  /Would you like/i,
  /Shall I/i,

  // Explanatory phrases
  /Here is your/i,
  /I've generated/i,
  /I've created/i,
  /Below you'll find/i,
  /As requested/i,
  /I understand/i,
  /Based on your request/i,

  // Internal process exposure
  /I extracted/i,
  /I found/i,
  /I already have/i,
  /What I need/i,
  /Still need/i,

  // Confirmations
  /Should I proceed/i,
  /Would you like me to/i,
  /Is this correct/i,
  /Please confirm/i
];

/**
 * Field request formatter
 * Ensures consistent field request format
 */
export function formatFieldRequest(fields: Array<{name: string, example: string}>): string {
  if (fields.length === 0) return '';

  if (fields.length === 1) {
    return `Please provide ${fields[0].name} (e.g., ${fields[0].example})`;
  }

  if (fields.length === 2) {
    return `Please provide ${fields[0].name} (e.g., ${fields[0].example}) and ${fields[1].name} (e.g., ${fields[1].example})`;
  }

  // For 3+ fields
  const fieldLines = fields.map(f => `${f.name} (e.g., ${f.example})`);
  return `Please provide:\n\n${fieldLines.join('\n\n')}`;
}

/**
 * Response validator
 * Checks if a response follows Sofia's rules
 */
export function validateResponse(response: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`Contains forbidden pattern: ${pattern.source}`);
    }
  }

  // Check response structure
  const lines = response.split('\n');
  const firstLine = lines[0]?.trim() || '';

  // Valid starts
  const validStarts = [
    'Please provide',
    'Please specify',
    'Subject:', // For email templates
    'Dear', // For document generation
    'Registration', // For registration documents
  ];

  const hasValidStart = validStarts.some(start =>
    firstLine.startsWith(start)
  );

  if (!hasValidStart && !isDocument(response)) {
    violations.push('Response does not start with approved phrase');
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Check if response is a document
 */
function isDocument(response: string): boolean {
  // Documents typically have these markers
  const documentMarkers = [
    'Subject:',
    'Email Body:',
    'Dear XXXXXXXX',
    'Registration –',
    'This email is to provide',
    'PROPERTY RESERVATION',
    'Marketing Agreement'
  ];

  return documentMarkers.some(marker => response.includes(marker));
}

/**
 * Response cleaner
 * Removes non-compliant elements from responses
 */
export function cleanResponse(response: string): string {
  let cleaned = response;

  // Remove common pleasantries at the start
  const pleasantryPrefixes = [
    /^I'd be happy to help[^.!]*[.!]\s*/i,
    /^Sure[^.!]*[.!]\s*/i,
    /^Certainly[^.!]*[.!]\s*/i,
    /^I can assist[^.!]*[.!]\s*/i,
    /^Let me help[^.!]*[.!]\s*/i,
  ];

  for (const prefix of pleasantryPrefixes) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove explanatory suffixes
  const explanatorySuffixes = [
    /\n\nOnce I have this information[^.]*\./gi,
    /\n\nI'll generate[^.]*\./gi,
    /\n\nWould you like[^?]*\?/gi,
    /\n\nPlease let me know[^.]*\./gi,
  ];

  for (const suffix of explanatorySuffixes) {
    cleaned = cleaned.replace(suffix, '');
  }

  return cleaned.trim();
}

/**
 * Extract field requirements from user message
 */
export interface ExtractedField {
  type: string;
  value: string;
  source: string;
}

export function extractFieldsFromMessage(message: string): ExtractedField[] {
  const extracted: ExtractedField[] = [];

  // Client name patterns
  const clientPatterns = [
    /the client is ([^,.\n]+)/i,
    /client is ([^,.\n]+)/i,
    /([^,.\n]+) is the client/i,
    /for ([A-Z][a-z]+ [A-Z][a-z]+)/,
  ];

  for (const pattern of clientPatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.push({
        type: 'client_name',
        value: match[1].trim(),
        source: match[0]
      });
      break;
    }
  }

  // Time patterns
  const timePatterns = [
    /tomorrow at (\d{1,2}:\d{2}|\d{1,2}(?:am|pm))/i,
    /today at (\d{1,2}:\d{2}|\d{1,2}(?:am|pm))/i,
    /at (\d{1,2}:\d{2})/i,
  ];

  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.push({
        type: 'viewing_time',
        value: match[1],
        source: match[0]
      });
      break;
    }
  }

  // Registration type patterns
  const registrationPatterns = [
    /(registration developer|developer registration)/i,
    /(standard registration|registration standard)/i,
    /(bank registration|registration bank)/i,
    /(email marketing|marketing email)/i,
  ];

  for (const pattern of registrationPatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.push({
        type: 'template_type',
        value: match[1],
        source: match[0]
      });
      break;
    }
  }

  // Property patterns
  const propertyPatterns = [
    /property (?:reg\.? ?no\.?|registration) ?(\d+\/\d+)/i,
    /reg\.? ?no\.? ?(\d+\/\d+)/i,
    /property (\d+\/\d+)/i,
  ];

  for (const pattern of propertyPatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.push({
        type: 'property_registration',
        value: match[1],
        source: match[0]
      });
      break;
    }
  }

  // Price patterns
  const pricePatterns = [
    /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d{1,3}(?:,\d{3})*) ?(?:euro|EUR)/i,
    /asking (\d{1,3}(?:,\d{3})*)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.push({
        type: 'price',
        value: match[1],
        source: match[0]
      });
      break;
    }
  }

  return extracted;
}

/**
 * Generate Sofia-compliant response based on context
 */
export function generateCompliantResponse(
  context: {
    hasAllFields: boolean;
    missingFields?: Array<{name: string, example: string}>;
    documentType?: string;
    generatedDocument?: string;
  }
): string {
  // If all fields present, return document only
  if (context.hasAllFields && context.generatedDocument) {
    return context.generatedDocument;
  }

  // If fields are missing, request them
  if (context.missingFields && context.missingFields.length > 0) {
    return formatFieldRequest(context.missingFields);
  }

  // If template type unclear
  if (!context.documentType) {
    return RESPONSE_TEMPLATES.TEMPLATE_CLARIFICATION.format;
  }

  return '';
}

/**
 * Model-specific adjustments
 * Different models need slightly different prompting
 */
export function getModelSpecificPrompt(modelId: string): string {
  const adjustments: Record<string, string> = {
    'claude-haiku': `
CRITICAL: You MUST follow these EXACT response formats:
- Field requests: "Please provide: [field] (e.g., [example])"
- NO greetings, NO "I'd be happy to", NO explanations
- OUTPUT ONLY: Field request OR final document`,

    'claude-sonnet': `
MANDATORY RESPONSE FORMAT:
- Use ONLY: "Please provide:" for missing fields
- NEVER say: "Sure", "Certainly", "I'll help"
- Generate documents WITHOUT introduction`,

    'gpt-4o': `
STRICT OUTPUT RULES:
1. Start with "Please provide:" for fields
2. No conversational text allowed
3. Document output only, no commentary`,

    'gpt-4o-mini': `
RESPONSE CONSTRAINTS:
- Begin with "Please provide:" ALWAYS
- Zero explanatory text permitted
- Direct document generation only`
  };

  // Extract base model name
  const baseModel = modelId.includes('claude') ? 'claude' :
                     modelId.includes('gpt') ? 'gpt' : 'default';

  return adjustments[baseModel] || adjustments['claude-haiku'];
}