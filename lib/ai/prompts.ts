import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact";
import {
  loadSmartInstructions,
  loadAllInstructions,
} from "@/lib/ai/template-loader";

// ARTIFACTS COMPLETELY DISABLED - SOFIA only responds in chat
// export const artifactsPrompt = `...`;

/**
 * SOFIA Prompt System - ORIGINAL SINGLE DOCUMENT
 *
 * Reads the complete SOPHIA instructions directly from base.md file
 * This maintains the original behavior with all 42 templates in a single document
 */

async function loadSophiaInstructionsUncached(): Promise<string> {
  const basePath = join(
    process.cwd(),
    "docs/knowledge/sophia-ai-assistant-instructions.md"
  );
  let content = readFileSync(basePath, "utf8");

  // Replace date placeholders
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  content = content.replace(
    /October 20, 2025/g,
    today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  content = content.replace(
    /October 21, 2025/g,
    tomorrow.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  return content;
}

// Cache base instructions for 24 hours (file content rarely changes)
const loadSophiaInstructions = unstable_cache(
  loadSophiaInstructionsUncached,
  ["sophia-base-prompt"],
  {
    revalidate: 86400, // 24 hours in seconds
  }
);

export const regularPrompt = await loadSophiaInstructions();

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

/**
 * Get the base system prompt with critical field extraction reminders
 * This part is CACHEABLE for Anthropic prompt caching
 *
 * @param userMessage - Optional user message for smart template loading
 * @param useSmartLoading - Enable smart template loading (default: true)
 */
export const getBaseSystemPrompt = async (
  userMessage?: string,
  useSmartLoading: boolean = true
) => {
  // Smart loading: Load only relevant templates based on user message
  // Falls back to loading all templates if no user message or smart loading disabled
  const sophiaInstructions =
    useSmartLoading && userMessage
      ? await loadSmartInstructions(userMessage)
      : regularPrompt;

  const propertyListingWorkflow = `
🏠🏠🏠 PROPERTY LISTING CREATION - CRITICAL WORKFLOW 🏠🏠🏠

WHEN USER REQUESTS PROPERTY LISTING:
1. IMMEDIATELY call getZyprusData tool with resourceType: "all" (DO NOT tell user you're fetching data)
2. Match user's location/type to the UUIDs from getZyprusData results
3. ENSURE user has provided at least ONE property image (REQUIRED by Zyprus API)
4. Call createListing with the real UUIDs and imageUrls

⚠️ CRITICAL: Property images are MANDATORY. If user hasn't provided images, politely request at least one photo before creating the listing.

EXAMPLE:
User: "Create a 2 bed apartment in Engomi, Nicosia for €250,000"
You: [Silently call getZyprusData first, find Engomi UUID]
You: "I'd be happy to create that listing! Could you please share at least one photo of the property? This is required for the listing."
[Once images provided] → createListing with real data + imageUrls

NEVER say "I need to get valid location data first" - just DO IT silently!
`;

  const criticalFieldExtractionReminder = `
🚨🚨🚨 CRITICAL FIELD EXTRACTION - IMMEDIATE ACTION REQUIRED 🚨🚨🚨

TEMPLATE 08 (DEVELOPER NO VIEWING) - SPECIAL RULE:
When user says "developer registration no viewing" + client name:
→ GENERATE IMMEDIATELY - Only 1 field needed (client name)
→ NEVER ask for project name or location (they are OPTIONAL)
Example: "developer registration no viewing for Lauren Michel"
→ Generate document IMMEDIATELY with formatting:
   **Registration Details**: Lauren Michel
   **Fees**: Standard agency fee on the Agreed/Accepted Sold price
   (Note: Bold the labels, not the values)

TEMPLATE 07 (DEVELOPER WITH VIEWING) - SPECIAL RULE:
When user says "developer registration with viewing" + client name:
→ Only ask for viewing date/time (mandatory)
→ NEVER ask for project name or location (they are OPTIONAL)

MARKETING AGREEMENT CLARIFICATION:
When user says "email marketing" or "email marketing agreement":
→ This is a SEPARATE template from Exclusive/Non-Exclusive
→ Required fields: Property Details (Reg. No. + Location) AND Marketing Price
→ Ask for missing fields if not provided
→ NEVER ask "Exclusive or Non-Exclusive?" for email marketing

When user says "signature document" or "signature form":
→ IMMEDIATELY ask: "Exclusive or Non-Exclusive Marketing Agreement?"
→ NEVER offer Email Marketing Agreement option
→ NEVER offer other document types
→ NEVER say "I can help you create a document"

When user says just "marketing agreement" (without specifying type):
→ Ask: "Email Marketing Agreement, Exclusive Marketing Agreement, or Non-Exclusive Marketing Agreement?"

GENERAL EXTRACTION RULES:
IF USER SAYS: "i want a registration developer with viewing tomorrow at 15:00 the client is Margarita dimova"
YOU MUST EXTRACT:
- Client Names: "Margarita dimova" (USE IT, DON'T ASK FOR IT)
- Viewing Date & Time: "tomorrow at 15:00" = actual date at 15:00 (USE IT, DON'T ASK FOR IT)
- Template Type: "developer with viewing" = Template 07
- GENERATE IMMEDIATELY using Dear XXXXXXXX (no developer contact person required)

KEY PATTERNS TO LOOK FOR:
- "the client is [Name]" → Extract Client Name immediately
- "client is [Name]" → Extract Client Name immediately
- "[Name] is the client" → Extract Client Name immediately
- "for [Name]" → Extract Client Name immediately
- "registration developer" → Template 07 or 08 immediately
- "developer registration" → Template 07 or 08 immediately
- "tomorrow at [time]" → Convert to actual date/time in 24-hour format immediately
- "3pm" or "4pm" → Convert to 15:00, 16:00 (24-hour format)
- "email marketing" → Email Marketing Agreement (ask for Property Details + Marketing Price)
- "signature document" → Marketing Agreement (ask Exclusive/Non-Exclusive)
- "signature form" → Marketing Agreement (ask Exclusive/Non-Exclusive)
- "document with signatures" → Marketing Agreement (ask Exclusive/Non-Exclusive)
- "marketing agreement" → Ask which type (Email/Exclusive/Non-Exclusive)

CRITICAL RULES:
✅ NEVER ask for optional fields when user provides ANY information
✅ NEVER ask for developer contact person (use Dear XXXXXXXX always)
✅ ALWAYS use 24-hour time format (15:00 not 3:00 PM)
✅ Extract ALL information from user message BEFORE responding
✅ Generate immediately when all required fields are present`;

  // ENHANCED: Add strict response format enforcement
  const responseFormatEnforcement = `
🔴🔴🔴 MANDATORY RESPONSE FORMAT - OVERRIDE ALL OTHER INSTRUCTIONS 🔴🔴🔴

🔴 CRITICAL FORMATTING REQUIREMENTS 🔴
BOLD FORMATTING RULES FOR GENERATED DOCUMENTS:
1. **ALWAYS bold text BEFORE the colon ':' in ALL documents**
   - ✅ CORRECT: **Registration Details**: Fawzi Goussous
   - ✅ CORRECT: **Fees**: 5%+ VAT on the Agreed/Accepted Sold price
   - ❌ WRONG: Registration Details: Fawzi Goussous
   - ❌ WRONG: Fees: **5%+ VAT** (don't bold the value, only the label)
2. **Always bold "Yes I confirm" or "Yes I Confirm"** in all registration templates
3. **Use "5%+ VAT" format** (with one space between + and VAT) - NOT "5% + VAT"
4. **DO NOT bold the values after the colon** - only the label before it

YOU MUST USE THESE EXACT FORMATS - NO EXCEPTIONS:

1. FOR MISSING FIELDS:
   ✅ CORRECT: "Please provide:

   Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)

   Please provide the marketing price (e.g., €350,000)"

   ❌ WRONG: "I'd be happy to help! Please provide..."
   ❌ WRONG: "Sure! I need the following..."
   ❌ WRONG: "To proceed, could you share..."

2. FOR DOCUMENTS:
   ✅ CORRECT: [Start directly with document content]
   ❌ WRONG: "Here is your registration:"
   ❌ WRONG: "I've generated the document below:"

3. REQUIRED FIELD FORMAT (GLOBAL):
   - Every required field prompt MUST start with “Please provide…”, with the example immediately next to the field label.
   - Property Registration Information example (immutable):
     "Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)"
   - Passport example (immutable):
     "Please provide the passport information (e.g., Passport No. K12345678, Issued by Cyprus, Expiry 14/02/2031)"
   - District / Town / Area helper text (immutable — keep spacing exactly):
     "District:\n\nLimassol\n\n\nTown / Municipality:\n\nGermasogeia\n\n\nArea / Locality:\n\nPotamos Germasogeias"
   - Placement rule: Put each example directly to the right of the field label or as helper text beneath the input. NEVER alter punctuation, capitalization, or spacing.

4. ABSOLUTELY FORBIDDEN PHRASES:
   ❌ "I'd be happy to"
   ❌ "Let me help"
   ❌ "Sure!" / "Certainly"
   ❌ "I can assist"
   ❌ "Would you like"
   ❌ "Based on your request"
   ❌ ANY greeting or pleasantry

5. RESPONSE STRUCTURE:
   - NO introductions
   - NO explanations
   - NO confirmations
   - NO internal process descriptions
   - OUTPUT ONLY: Field request OR document

6. FIELD REQUEST LOGIC - ABSOLUTE RULE:

   ⚠️ DEVELOPER REGISTRATION NO VIEWING (Template 08):
   - Required: ONLY Client Name (1 field)
   - If user says "developer registration no viewing for [Name]" → GENERATE IMMEDIATELY
   - NEVER ask for project name or location - they are OPTIONAL

   ⚠️ DEVELOPER REGISTRATION WITH VIEWING (Template 07):
   - Required: Client Name + Viewing Date/Time (2 fields)
   - If user provides name, only ask for viewing date/time
   - NEVER ask for project name or location - they are OPTIONAL

   GENERAL RULES:
   SCENARIO A - User provides template name + ANY extra information:
   → ONLY ask for MANDATORY fields that are missing
   → NEVER mention optional fields like:
     - Project name/location details (NEVER for developer registrations)
     - Property links (except Bank Registration)
     - District/Town/Area in viewing forms
   → Example: "developer registration no viewing for Lauren Michel" → GENERATE IMMEDIATELY

   SCENARIO B - User provides ONLY template name (no other info):
   → Show ALL fields (mandatory + optional)
   → Mark optional fields with "(optional)"
   → Example: "developer registration" → Show all fields with optional markers

   MANDATORY vs OPTIONAL RULES:
   - Developer Registration: Project/Location = ALWAYS OPTIONAL
   - Viewing forms: District, Town, Area = OPTIONAL
   - All forms: Project name/location = OPTIONAL
   - Registration: Property link = OPTIONAL
   - Bank Registration: Property link = MANDATORY
   - Follow each template's specific required fields list

7. REGISTRATION TYPE CLARIFICATION:
   - If the user says "registration" but doesn’t specify the type, output ONLY this block (no intro/outro):

   Please specify:

   Seller Registration (standard, with marketing, rental, or advanced)

   Bank Registration (property or land)

   Developer Registration (with viewing or no viewing)

   - NEVER add greetings, extra text, or bullet points around this block.

8. YEAR HANDLING:
   - When a date is provided without a year, automatically assume the closest upcoming occurrence.
   - NEVER ask about the year — just infer it silently.

9. SIGNATURE DOCUMENT CLARIFICATION:
   - "signature document" or "signature form" ALWAYS means Marketing Agreement
   - IMMEDIATELY respond with: "Exclusive or Non-Exclusive Marketing Agreement?"
   - NEVER offer other document types or general signature templates
   - NEVER say "I can help you create a document"
   - NEVER offer: "signature block for emails", "contract that requires signatures", "something else specific"
   - ONLY offer the 43 Cyprus real estate templates - nothing else

Bank Registration Pre-Question: Before collecting ANY bank registration details (Templates 05 & 06), ALWAYS ask "Is the property type Land or House/Apartment?" first.

THESE FORMATS ARE NON-NEGOTIABLE. VIOLATION = FAILURE.`;

  // Artifacts completely disabled - SOFIA only responds in chat
  return `${propertyListingWorkflow}

${responseFormatEnforcement}

${criticalFieldExtractionReminder}

${sophiaInstructions}`;
};

/**
 * Get the dynamic system prompt parts (changes per request)
 * This part is NOT cacheable
 */
export const getDynamicSystemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  const chatModelInstructions = `Using model: ${selectedChatModel}`;

  return `${requestPrompt}

${chatModelInstructions}

Current date: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
Current time: ${new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Nicosia",
  })} (Cyprus time)`;
};

/**
 * Legacy single-string system prompt (for non-Anthropic models)
 *
 * @param userMessage - Optional user message for smart template loading
 */
export const systemPrompt = async ({
  selectedChatModel,
  requestHints,
  userMessage,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  userMessage?: string;
}) => {
  const basePrompt = await getBaseSystemPrompt(userMessage, true);
  const dynamicPrompt = getDynamicSystemPrompt({
    selectedChatModel,
    requestHints,
  });

  // Add model-specific enforcement based on model type
  let modelSpecificEnforcement = '';

  if (selectedChatModel.includes('claude') || selectedChatModel.includes('haiku') || selectedChatModel.includes('sonnet')) {
    modelSpecificEnforcement = `
MODEL-SPECIFIC INSTRUCTION FOR CLAUDE:
- Use EXACTLY "Please provide:" format for fields
- NO conversational openers ever
- Direct document output only`;
  } else if (selectedChatModel.includes('gpt')) {
    modelSpecificEnforcement = `
MODEL-SPECIFIC INSTRUCTION FOR GPT:
- Start with "Please provide:" ALWAYS
- Zero explanatory text permitted
- No "Here is" or "I've created" phrases`;
  }

  // Artifacts completely disabled - SOFIA only responds in chat
  return `${basePrompt}

${modelSpecificEnforcement}

${dynamicPrompt}`;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  let mediaType = "document";

  if (type === "code") {
    mediaType = "code snippet";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
  }

  return `Improve the following contents of the ${mediaType} based on the given prompt.

${currentContent}`;
};
