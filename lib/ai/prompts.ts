import type { Geo } from "@vercel/functions";
import { readFileSync } from "fs";
import { join } from "path";
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

function loadSophiaInstructions(): string {
  const basePath = join(process.cwd(), "lib/ai/instructions/base.md");
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

export const regularPrompt = loadSophiaInstructions();

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

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  
  const sophiaInstructions = regularPrompt;
  const requestHintsContent = requestPrompt;
  
  const chatModelInstructions = `Using model: ${selectedChatModel}`;

  const systemPromptContent = `${sophiaInstructions}

${requestHintsContent}

IMPORTANT BEHAVIORAL RULES:

**For DOCUMENT GENERATION:**
- Be concise, only ask for missing fields
- Use "Dear XXXXXXXX" for greetings unless specified otherwise
- Generate documents exactly as specified in templates

**For GENERAL KNOWLEDGE QUESTIONS:**
- Provide COMPLETE, DETAILED information immediately from knowledge base
- NEVER ask clarifying questions like "which area?", "what type?", "could you provide more details?"
- NEVER say "I don't have specific information" if it exists in the knowledge base
- Include ALL relevant data, examples, calculations, tables, and exceptions
- When asked about minimum sizes, VAT, taxes, PR, building density, land division, etc. → provide FULL detailed answer with ALL information

**For CALCULATOR REQUESTS:**
- Use the calculator tools to provide accurate calculations

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

  // NEVER include artifactsPrompt - SOFIA generates documents directly in chat
  return systemPromptContent;
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
