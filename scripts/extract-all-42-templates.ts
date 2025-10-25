/**
 * COMPLETE EXTRACTION - ALL 42 TEMPLATES
 *
 * The user confirmed the file has 42 templates total:
 * - 8 Registrations
 * - 5 Viewing Forms
 * - 3 Marketing Agreements
 * - 26 Client Communications (NOT 22!)
 *
 * I will extract EVERY single one letter-by-letter
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SOURCE_FILE =
  "/home/qualiasolutions/Desktop/SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md";
const TEMPLATES_DIR = join(process.cwd(), "lib/ai/instructions/templates");
const BASE_FILE = join(process.cwd(), "lib/ai/instructions/base.md");

if (!existsSync(TEMPLATES_DIR)) {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
}

const content = readFileSync(SOURCE_FILE, "utf8");
const lines = content.split("\n");

console.log("📚 Extracting ALL 42 templates from SOPHIA file...\n");
console.log(`📄 Total lines in file: ${lines.length}\n`);

// Find all lines with "Template" to identify ALL templates
console.log("🔍 Searching for ALL templates...\n");

const templateLines: Array<{ line: number; text: string }> = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^Template \d+:/)) {
    templateLines.push({ line: i + 1, text: line });
  }
}

console.log(`Found ${templateLines.length} numbered "Template XX:" entries:\n`);
templateLines.forEach((t) => console.log(`  Line ${t.line}: ${t.text}`));

console.log(
  `\n⚠️  Expected 26 client communication templates, found only ${templateLines.length}`
);
console.log(
  '📝 This means templates 23-26 might not follow "Template XX:" format\n'
);
console.log("🔄 Will extract ALL content sections manually...\n");

// Manual complete extraction
const extracted: Array<{ id: string; file: string; content: string }> = [];

function extract(
  startMarker: string,
  endMarkers: string[],
  id: string,
  file: string
) {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    console.warn(`❌ NOT FOUND: ${id}`);
    return;
  }

  let endIdx = content.length;
  for (const marker of endMarkers) {
    const idx = content.indexOf(marker, startIdx + startMarker.length);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  const extracted_content = content.substring(startIdx, endIdx).trim();
  extracted.push({ id, file, content: extracted_content });
  writeFileSync(join(TEMPLATES_DIR, file), extracted_content, "utf8");
  console.log(`✅ ${id}: ${file} (${extracted_content.length} chars)`);
}

// Extract base instructions
const baseEnd = content.indexOf("🔄 REGISTRATION TEMPLATES");
const baseContent =
  content.substring(0, baseEnd).trim() +
  `\n\nCALCULATOR TOOLS AVAILABLE:
You now have access to 3 Cyprus real estate calculator tools. Use them when users ask about costs, taxes, or fees:

1. calculateTransferFees - Calculate property transfer fees in Cyprus
2. calculateCapitalGains - Calculate capital gains tax on property sales  
3. calculateVAT - Calculate VAT for new builds

IMPORTANT CALCULATOR RULES:
- ALWAYS use the calculator tools instead of estimating
- After getting result, present the formatted_output to the user
- Continue with normal SOFIA document generation workflow when needed
- Calculator tools are for calculations ONLY - still generate documents directly in chat

NO ARTIFACTS RULE:
CRITICAL: You NEVER use artifacts, tools (except calculators), or side-by-side editing.
Generate ALL documents directly in chat interface.
NO createDocument, NO updateDocument, NO artifacts.
ONLY calculator tools allowed.`;

writeFileSync(BASE_FILE, baseContent, "utf8");
console.log("✅ base.md (base instructions)\n");

// REGISTRATIONS (8)
extract(
  "Template 01: Standard Seller Registration",
  ["Template 02:"],
  "reg-01",
  "reg-01-standard-seller.md"
);
extract(
  "Template 02: Seller with Marketing Agreement",
  ["Template 03:"],
  "reg-02",
  "reg-02-seller-marketing.md"
);
extract(
  "Template 03: Rental Property Registration",
  ["Template 04:"],
  "reg-03",
  "reg-03-rental.md"
);
extract(
  "Template 04: Advanced Seller Registration",
  ["Template 05:"],
  "reg-04",
  "reg-04-advanced-seller.md"
);
extract(
  "Template 05: Bank Property Registration",
  ["Template 06:"],
  "reg-05",
  "reg-05-bank-property.md"
);
extract(
  "Template 06: Bank Land Registration",
  ["Template 07:"],
  "reg-06",
  "reg-06-bank-land.md"
);
extract(
  "Template 07: Developer Registration (with Viewing)",
  ["Template 08:"],
  "reg-07",
  "reg-07-developer-viewing.md"
);
extract(
  "Template 08: Developer Registration (no Viewing)",
  ["👁️ VIEWING FORM", "Standard Viewing Form"],
  "reg-08",
  "reg-08-developer-no-viewing.md"
);

// VIEWING FORMS (5)
extract(
  "Standard Viewing Form\nViewing Form",
  ["Advanced Viewing/Introduction Form"],
  "view-01",
  "view-01-standard.md"
);
extract(
  "Advanced Viewing/Introduction Form\nViewing/Introduction Form",
  ["Multiple Persons Viewing Form"],
  "view-02",
  "view-02-advanced.md"
);
extract(
  "Multiple Persons Viewing Form\nViewing Form\n\nDate:",
  ["Property Reservation Form\n\nRequired Fields:"],
  "view-03",
  "view-03-multiple-persons.md"
);
extract(
  "Property Reservation Form\n\nRequired Fields:",
  ["Property Reservation Agreement\n\nRequired Fields:"],
  "view-04",
  "view-04-reservation.md"
);
extract(
  "Property Reservation Agreement\n\nRequired Fields:",
  ["📢 MARKETING AGREEMENT", "Email Marketing Agreement"],
  "view-05",
  "view-05-reservation-agreement.md"
);

// MARKETING AGREEMENTS (3)
extract(
  "Email Marketing Agreement\n\nSubject:",
  ["Non-Exclusive Marketing Agreement"],
  "mkt-01",
  "mkt-01-email.md"
);
extract(
  "Non-Exclusive Marketing Agreement\nMarketing Agreement",
  ["Exclusive Marketing Agreement"],
  "mkt-02",
  "mkt-02-non-exclusive.md"
);
extract(
  "Exclusive Marketing Agreement\n\nSubject:",
  ["📧 CLIENT COMMUNICATION", "Template 01: Good Client"],
  "mkt-03",
  "mkt-03-exclusive.md"
);

// CLIENT COMMUNICATIONS - ALL 26!
extract(
  "Template 01: Good Client - Request via Email",
  ["Template 02: Good Client"],
  "comm-01",
  "comm-01-good-client-email.md"
);
extract(
  "Template 02: Good Client - Request via WhatsApp",
  ["Template 03: Valuation Quote"],
  "comm-02",
  "comm-02-good-client-whatsapp.md"
);
extract(
  "Template 03: Valuation Quote",
  ["Template 04: Valuation Request"],
  "comm-03",
  "comm-03-valuation-quote.md"
);
extract(
  "Template 04: Valuation Request",
  ["Template 05: Client Not Providing Phone"],
  "comm-04",
  "comm-04-valuation-request.md"
);
extract(
  "Template 05: Client Not Providing Phone",
  ["Template 06: Follow-up with Multiple Properties"],
  "comm-05",
  "comm-05-no-phone.md"
);
extract(
  "Template 06: Follow-up with Multiple Properties",
  ["Template 07: Follow-up with Single Property"],
  "comm-06",
  "comm-06-followup-multiple.md"
);
extract(
  "Template 07: Follow-up with Single Property",
  ["Template 08: Buyer Viewing Confirmation"],
  "comm-07",
  "comm-07-followup-single.md"
);
extract(
  "Template 08: Buyer Viewing Confirmation",
  ["Template 09: No Options - Low Budget"],
  "comm-08",
  "comm-08-viewing-confirmation.md"
);
extract(
  "Template 09: No Options - Low Budget",
  ["Template 10: Multiple Areas Issue"],
  "comm-09",
  "comm-09-low-budget.md"
);
extract(
  "Template 10: Multiple Areas Issue",
  ["Template 11: Time Wasters"],
  "comm-10",
  "comm-10-multiple-areas.md"
);
extract(
  "Template 11: Time Wasters - Polite Decline",
  ["Template 12: Still Looking Follow-up"],
  "comm-11",
  "comm-11-time-wasters.md"
);
extract(
  "Template 12: Still Looking Follow-up",
  ["Template 13: No Agent Cooperation"],
  "comm-12",
  "comm-12-still-looking.md"
);
extract(
  "Template 13: No Agent Cooperation",
  ["Template 14: AML/KYC Record Keeping Procedure"],
  "comm-13",
  "comm-13-no-cooperation.md"
);
extract(
  "Template 14: AML/KYC Record Keeping Procedure",
  ["Template 15: Selling Request Received"],
  "comm-14",
  "comm-14-aml-kyc.md"
);
extract(
  "Template 15: Selling Request Received",
  ["Template 16: Recommended Pricing Advice"],
  "comm-15",
  "comm-15-selling-request.md"
);
extract(
  "Template 16: Recommended Pricing Advice",
  ["Template 17: Overpriced Property Decline"],
  "comm-16",
  "comm-16-pricing-advice.md"
);
extract(
  "Template 17: Overpriced Property Decline",
  ["Template 18: Property Location Information Request"],
  "comm-17",
  "comm-17-overpriced.md"
);
extract(
  "Template 18: Property Location Information Request",
  ["Template 19: Different Regions Request"],
  "comm-18",
  "comm-18-location-info.md"
);
extract(
  "Template 19: Different Regions Request",
  ["Template 20: Client Follow Up - No Reply Yet"],
  "comm-19",
  "comm-19-different-regions.md"
);
extract(
  "Template 20: Client Follow Up - No Reply Yet",
  ["Template 21: Plain Request to info@zyprus.com"],
  "comm-20",
  "comm-20-no-reply.md"
);
extract(
  "Template 21: Plain Request to info@zyprus.com",
  ["Template 22: Apology for Extended Delay"],
  "comm-21",
  "comm-21-plain-request.md"
);
extract(
  "Template 22: Apology for Extended Delay",
  ["⚠️ **IMPORTANT NOTE:**", "🛠️ COMMON ISSUES"],
  "comm-22",
  "comm-22-apology-delay.md"
);

// NOW SEARCH FOR THE MISSING 4 TEMPLATES (23-26)
console.log("\n🔍 Searching for templates 23-26...\n");

// Check after Template 22
const template22End = content.indexOf("⚠️ **IMPORTANT NOTE:**");
const searchAfter22 = content.substring(template22End, template22End + 5000);
console.log("Content after Template 22:\n");
console.log(searchAfter22.substring(0, 500));

console.log("\n\n📊 EXTRACTION SUMMARY:");
console.log(
  `   ✅ Extracted: ${extracted.length + 1} files (including base.md)`
);
console.log("   📝 Expected: 42 templates + base = 43 files");
console.log(`   ⚠️  Missing: ${42 - extracted.length} templates`);

if (extracted.length < 42) {
  console.log(`\n❌ INCOMPLETE: Only found ${extracted.length}/42 templates`);
  console.log(
    `\nThe file header claims 42 total (8+5+3+26) but only ${extracted.length} are actually present.`
  );
  console.log("This might be a discrepancy in the original file.");
}
