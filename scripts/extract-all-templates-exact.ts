/**
 * EXACT Template Extraction Script
 * 
 * Extracts ALL templates from Desktop SOPHIA file letter-by-letter
 * Preserves EXACT formatting - not even 1mm difference!
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SOURCE_FILE = '/home/qualiasolutions/Desktop/SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md';
const TEMPLATES_DIR = join(process.cwd(), 'lib/ai/instructions/templates');
const BASE_FILE = join(process.cwd(), 'lib/ai/instructions/base.md');

// Ensure directories exist
if (!existsSync(TEMPLATES_DIR)) {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
}

function extractSection(content: string, startLine: number, endLine: number): string {
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

function extractBetweenMarkers(content: string, startMarker: string, endMarkerOptions: string[]): string | null {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    console.warn(`Start marker not found: ${startMarker}`);
    return null;
  }
  
  // Find the earliest end marker
  let endIdx = content.length;
  for (const endMarker of endMarkerOptions) {
    const idx = content.indexOf(endMarker, startIdx + startMarker.length);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }
  
  return content.substring(startIdx, endIdx).trim();
}

function main() {
  console.log('📚 Extracting ALL templates from Desktop SOPHIA file...\n');
  console.log(`📂 Source: ${SOURCE_FILE}\n`);
  
  const content = readFileSync(SOURCE_FILE, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📄 Total lines: ${lines.length}\n`);
  
  // Extract base instructions (everything before templates)
  const templatesStartIdx = content.indexOf('🔄 REGISTRATION TEMPLATES');
  const baseContent = content.substring(0, templatesStartIdx).trim();
  
  // Add calculator tools section to base
  const baseWithCalculators = baseContent + `\n\nCALCULATOR TOOLS AVAILABLE:
You now have access to 3 Cyprus real estate calculator tools. Use them when users ask about costs, taxes, or fees:

1. calculateTransferFees - Calculate property transfer fees in Cyprus
   - Use when: Users ask about transfer fees, buying costs, registration fees
   - Parameters: property_value (€), joint_names (true/false)

2. calculateCapitalGains - Calculate capital gains tax on property sales
   - Use when: Users ask about selling costs, capital gains tax, property sale taxes
   - Parameters: sale_price (€), purchase_price (€), purchase_year, sale_year, optional expenses

3. calculateVAT - Calculate VAT for new builds (houses/apartments only)
   - Use when: Users ask about VAT on new properties
   - Parameters: price (€), buildable_area (m²), planning_application_date (DD/MM/YYYY)

IMPORTANT CALCULATOR RULES:
- ALWAYS use the calculator tools instead of estimating
- After getting result, present the formatted_output to the user
- Continue with normal SOFIA document generation workflow when needed
- Calculator tools are for calculations ONLY - still generate documents directly in chat

NO ARTIFACTS RULE:
CRITICAL: You NEVER use artifacts, tools (except calculators), or side-by-side editing.
Generate ALL documents directly in chat interface.
NO createDocument, NO updateDocument, NO artifacts.
ONLY calculator tools allowed.
`;
  
  writeFileSync(BASE_FILE, baseWithCalculators, 'utf8');
  console.log(`✅ Base instructions: base.md\n`);
  
  // Template definitions with exact line numbers from grep output
  const templates = [
    // Registrations (8)
    { id: 'reg-01', file: 'reg-01-standard-seller.md', start: 'Template 01: Standard Seller Registration', ends: ['Template 02:'] },
    { id: 'reg-02', file: 'reg-02-seller-marketing.md', start: 'Template 02: Seller with Marketing Agreement', ends: ['Template 03:'] },
    { id: 'reg-03', file: 'reg-03-rental.md', start: 'Template 03: Rental Property Registration', ends: ['Template 04:'] },
    { id: 'reg-04', file: 'reg-04-advanced-seller.md', start: 'Template 04: Advanced Seller Registration', ends: ['Template 05:'] },
    { id: 'reg-05', file: 'reg-05-bank-property.md', start: 'Template 05: Bank Property Registration', ends: ['Template 06:'] },
    { id: 'reg-06', file: 'reg-06-bank-land.md', start: 'Template 06: Bank Land Registration', ends: ['Template 07:'] },
    { id: 'reg-07', file: 'reg-07-developer-viewing.md', start: 'Template 07: Developer Registration (with Viewing)', ends: ['Template 08:'] },
    { id: 'reg-08', file: 'reg-08-developer-no-viewing.md', start: 'Template 08: Developer Registration (no Viewing)', ends: ['👁️ VIEWING FORM', 'Standard Viewing Form'] },
    
    // Viewing Forms (5)
    { id: 'view-01', file: 'view-01-standard.md', start: 'Standard Viewing Form\nViewing Form', ends: ['Advanced Viewing/Introduction Form'] },
    { id: 'view-02', file: 'view-02-advanced.md', start: 'Advanced Viewing/Introduction Form\nViewing/Introduction Form', ends: ['Multiple Persons Viewing Form'] },
    { id: 'view-03', file: 'view-03-multiple-persons.md', start: 'Multiple Persons Viewing Form\nViewing Form', ends: ['Property Reservation Form\n\nRequired Fields:'] },
    { id: 'view-04', file: 'view-04-reservation.md', start: 'Property Reservation Form\n\nRequired Fields:', ends: ['Property Reservation Agreement\n\nRequired Fields:'] },
    { id: 'view-05', file: 'view-05-reservation-agreement.md', start: 'Property Reservation Agreement\n\nRequired Fields:', ends: ['📢 MARKETING AGREEMENT', 'Email Marketing Agreement'] },
    
    // Marketing Agreements (3)
    { id: 'mkt-01', file: 'mkt-01-email.md', start: 'Email Marketing Agreement\n\nSubject:', ends: ['Non-Exclusive Marketing Agreement'] },
    { id: 'mkt-02', file: 'mkt-02-non-exclusive.md', start: 'Non-Exclusive Marketing Agreement\nMarketing Agreement', ends: ['Exclusive Marketing Agreement'] },
    { id: 'mkt-03', file: 'mkt-03-exclusive.md', start: 'Exclusive Marketing Agreement\n\nSubject:', ends: ['📧 CLIENT COMMUNICATION', 'Template 01: Good Client'] },
    
    // Client Communications (22+)
    { id: 'comm-01', file: 'comm-01-good-client-email.md', start: 'Template 01: Good Client - Request via Email', ends: ['Template 02: Good Client - Request via WhatsApp'] },
    { id: 'comm-02', file: 'comm-02-good-client-whatsapp.md', start: 'Template 02: Good Client - Request via WhatsApp', ends: ['Template 03: Valuation Quote'] },
    { id: 'comm-03', file: 'comm-03-valuation-quote.md', start: 'Template 03: Valuation Quote', ends: ['Template 04: Valuation Request'] },
    { id: 'comm-04', file: 'comm-04-valuation-request.md', start: 'Template 04: Valuation Request', ends: ['Template 05: Client Not Providing Phone'] },
    { id: 'comm-05', file: 'comm-05-no-phone.md', start: 'Template 05: Client Not Providing Phone', ends: ['Template 06: Follow-up with Multiple Properties'] },
    { id: 'comm-06', file: 'comm-06-followup-multiple.md', start: 'Template 06: Follow-up with Multiple Properties', ends: ['Template 07: Follow-up with Single Property'] },
    { id: 'comm-07', file: 'comm-07-followup-single.md', start: 'Template 07: Follow-up with Single Property', ends: ['Template 08: Buyer Viewing Confirmation'] },
    { id: 'comm-08', file: 'comm-08-viewing-confirmation.md', start: 'Template 08: Buyer Viewing Confirmation', ends: ['Template 09: No Options - Low Budget'] },
    { id: 'comm-09', file: 'comm-09-low-budget.md', start: 'Template 09: No Options - Low Budget', ends: ['Template 10: Multiple Areas Issue'] },
    { id: 'comm-10', file: 'comm-10-multiple-areas.md', start: 'Template 10: Multiple Areas Issue', ends: ['Template 11: Time Wasters'] },
    { id: 'comm-11', file: 'comm-11-time-wasters.md', start: 'Template 11: Time Wasters - Polite Decline', ends: ['Template 12: Still Looking Follow-up'] },
    { id: 'comm-12', file: 'comm-12-still-looking.md', start: 'Template 12: Still Looking Follow-up', ends: ['Template 13: No Agent Cooperation'] },
    { id: 'comm-13', file: 'comm-13-no-cooperation.md', start: 'Template 13: No Agent Cooperation', ends: ['Template 14: AML/KYC Record Keeping Procedure'] },
    { id: 'comm-14', file: 'comm-14-aml-kyc.md', start: 'Template 14: AML/KYC Record Keeping Procedure', ends: ['Template 15: Selling Request Received'] },
    { id: 'comm-15', file: 'comm-15-selling-request.md', start: 'Template 15: Selling Request Received', ends: ['Template 16: Recommended Pricing Advice'] },
    { id: 'comm-16', file: 'comm-16-pricing-advice.md', start: 'Template 16: Recommended Pricing Advice', ends: ['Template 17: Overpriced Property Decline'] },
    { id: 'comm-17', file: 'comm-17-overpriced.md', start: 'Template 17: Overpriced Property Decline', ends: ['Template 18: Property Location Information Request'] },
    { id: 'comm-18', file: 'comm-18-location-info.md', start: 'Template 18: Property Location Information Request', ends: ['Template 19: Different Regions Request'] },
    { id: 'comm-19', file: 'comm-19-different-regions.md', start: 'Template 19: Different Regions Request', ends: ['Template 20: Client Follow Up - No Reply Yet'] },
    { id: 'comm-20', file: 'comm-20-no-reply.md', start: 'Template 20: Client Follow Up - No Reply Yet', ends: ['Template 21: Plain Request to info@zyprus.com'] },
    { id: 'comm-21', file: 'comm-21-plain-request.md', start: 'Template 21: Plain Request to info@zyprus.com', ends: ['Template 22: Apology for Extended Delay'] },
    { id: 'comm-22', file: 'comm-22-apology-delay.md', start: 'Template 22: Apology for Extended Delay', ends: ['END OF OPTIMIZED INSTRUCTIONS', '🔍 IMPORTANT NOTES', 'COMMON ISSUES', '---'] },
  ];
  
  let extracted = 0;
  let failed = 0;
  
  for (const template of templates) {
    const templateContent = extractBetweenMarkers(content, template.start, template.ends);
    
    if (templateContent && templateContent.length > 50) {
      const outputPath = join(TEMPLATES_DIR, template.file);
      writeFileSync(outputPath, templateContent, 'utf8');
      console.log(`✅ ${template.id}: ${template.file} (${templateContent.length} chars)`);
      extracted++;
    } else {
      console.error(`❌ ${template.id}: Failed to extract (content too short or not found)`);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Extracted: ${extracted} templates`);
  console.log(`   ❌ Failed: ${failed} templates`);
  console.log(`   📝 Total defined: ${templates.length} templates`);
  console.log(`   📄 Base instructions: base.md`);
  
  if (extracted === templates.length) {
    console.log('\n🎉 ALL templates extracted successfully!');
    console.log('\n✅ Each template preserves EXACT formatting - letter by letter!');
    console.log('\n📁 Files created:');
    console.log(`   - lib/ai/instructions/base.md (base instructions)`);
    console.log(`   - lib/ai/instructions/templates/*.md (${extracted} template files)`);
  } else {
    console.log('\n⚠️  Some templates failed. Review the output above.');
  }
}

main();
