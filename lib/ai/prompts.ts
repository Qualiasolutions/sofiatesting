import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact";

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

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
 */
export const getBaseSystemPrompt = () => {
  const sophiaInstructions = regularPrompt;

  const criticalFieldExtractionReminder = `
🚨🚨🚨 CRITICAL FIELD EXTRACTION - IMMEDIATE ACTION REQUIRED 🚨🚨🚨

STEP 1 - BEFORE ANYTHING ELSE: EXTRACT FIELDS FROM USER MESSAGE

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
- "registration developer" → Template 07 immediately
- "developer registration" → Template 07 immediately
- "tomorrow at [time]" → Convert to actual date/time in 24-hour format immediately
- "3pm" or "4pm" → Convert to 15:00, 16:00 (24-hour format)

CRITICAL RULES:
✅ NEVER ask for fields that were already provided
✅ NEVER ask for developer contact person (use Dear XXXXXXXX always)
✅ ALWAYS use 24-hour time format (15:00 not 3:00 PM)
✅ Extract ALL information from user message BEFORE responding
✅ Generate immediately when all required fields are present`;

  return `${sophiaInstructions}

${criticalFieldExtractionReminder}`;
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
 */
export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const basePrompt = getBaseSystemPrompt();
  const dynamicPrompt = getDynamicSystemPrompt({
    selectedChatModel,
    requestHints,
  });

  return `${basePrompt}

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
