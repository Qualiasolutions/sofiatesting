/**
 * Template Extraction Script
 * 
 * This script reads the original SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md file
 * and extracts all 43 templates into separate files in lib/ai/instructions/templates/
 * 
 * Run with: npx tsx scripts/extract-templates.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SOURCE_FILE = join(process.cwd(), 'SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md');
const TEMPLATES_DIR = join(process.cwd(), 'lib/ai/instructions/templates');

// Ensure templates directory exists
if (!existsSync(TEMPLATES_DIR)) {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Template definitions with their markers in the original file
const TEMPLATE_DEFINITIONS = [
  // Registrations
  { id: 'reg-01', file: 'reg-01-standard-seller.md', startMarker: 'Template 01: Standard Seller Registration', endMarker: 'Template 02:' },
  { id: 'reg-02', file: 'reg-02-seller-marketing.md', startMarker: 'Template 02: Seller with Marketing Agreement', endMarker: 'Template 03:' },
  { id: 'reg-03', file: 'reg-03-rental.md', startMarker: 'Template 03: Rental Property Registration', endMarker: 'Template 04:' },
  { id: 'reg-04', file: 'reg-04-advanced-seller.md', startMarker: 'Template 04: Advanced Seller Registration', endMarker: 'Template 05:' },
  { id: 'reg-05', file: 'reg-05-bank-property.md', startMarker: 'Template 05: Bank Property Registration', endMarker: 'Template 06:' },
  { id: 'reg-06', file: 'reg-06-bank-land.md', startMarker: 'Template 06: Bank Land Registration', endMarker: 'Template 07:' },
  { id: 'reg-07', file: 'reg-07-developer-viewing.md', startMarker: 'Template 07: Developer Registration (with Viewing)', endMarker: 'Template 08:' },
  { id: 'reg-08', file: 'reg-08-developer-no-viewing.md', startMarker: 'Template 08: Developer Registration (no Viewing)', endMarker: '👁️ VIEWING FORM' },
  
  // Viewing Forms
  { id: 'view-01', file: 'view-01-standard.md', startMarker: 'Standard Viewing Form', endMarker: 'Advanced Viewing/Introduction Form' },
  { id: 'view-02', file: 'view-02-advanced.md', startMarker: 'Advanced Viewing/Introduction Form', endMarker: 'Multiple Persons Viewing Form' },
  { id: 'view-03', file: 'view-03-multiple-persons.md', startMarker: 'Multiple Persons Viewing Form', endMarker: 'Property Reservation Form' },
  { id: 'view-04', file: 'view-04-reservation.md', startMarker: 'Property Reservation Form', endMarker: 'Property Reservation Agreement' },
  { id: 'view-05', file: 'view-05-reservation-agreement.md', startMarker: 'Property Reservation Agreement', endMarker: '📢 MARKETING AGREEMENT' },
  
  // Marketing Agreements
  { id: 'mkt-01', file: 'mkt-01-email.md', startMarker: 'Email Marketing Agreement', endMarker: 'Non-Exclusive Marketing Agreement' },
  { id: 'mkt-02', file: 'mkt-02-non-exclusive.md', startMarker: 'Non-Exclusive Marketing Agreement', endMarker: 'Exclusive Marketing Agreement' },
  { id: 'mkt-03', file: 'mkt-03-exclusive.md', startMarker: 'Exclusive Marketing Agreement', endMarker: '📧 CLIENT COMMUNICATION' },
  
  // Client Communications
  { id: 'comm-01', file: 'comm-01-good-client-email.md', startMarker: 'Template 01: Good Client - Request via Email', endMarker: 'Template 02: Good Client - Request via WhatsApp' },
  { id: 'comm-02', file: 'comm-02-good-client-whatsapp.md', startMarker: 'Template 02: Good Client - Request via WhatsApp', endMarker: 'Template 03: Valuation Quote' },
  { id: 'comm-03', file: 'comm-03-valuation-quote.md', startMarker: 'Template 03: Valuation Quote', endMarker: 'Template 04: Valuation Request' },
  { id: 'comm-04', file: 'comm-04-valuation-request.md', startMarker: 'Template 04: Valuation Request', endMarker: 'Template 05: Client Not Providing Phone' },
  { id: 'comm-05', file: 'comm-05-no-phone.md', startMarker: 'Template 05: Client Not Providing Phone', endMarker: 'Template 06: Follow-up with Multiple Properties' },
  { id: 'comm-06', file: 'comm-06-followup-multiple.md', startMarker: 'Template 06: Follow-up with Multiple Properties', endMarker: 'Template 07: Follow-up with Single Property' },
  { id: 'comm-07', file: 'comm-07-followup-single.md', startMarker: 'Template 07: Follow-up with Single Property', endMarker: 'Template 08: Buyer Viewing Confirmation' },
  { id: 'comm-08', file: 'comm-08-viewing-confirmation.md', startMarker: 'Template 08: Buyer Viewing Confirmation', endMarker: 'Template 09: No Options - Low Budget' },
  { id: 'comm-09', file: 'comm-09-low-budget.md', startMarker: 'Template 09: No Options - Low Budget', endMarker: 'Template 10: Multiple Areas Issue' },
  { id: 'comm-10', file: 'comm-10-multiple-areas.md', startMarker: 'Template 10: Multiple Areas Issue', endMarker: 'Template 11: Time Wasters' },
  { id: 'comm-11', file: 'comm-11-time-wasters.md', startMarker: 'Template 11: Time Wasters - Polite Decline', endMarker: 'Template 12: Still Looking Follow-up' },
  { id: 'comm-12', file: 'comm-12-still-looking.md', startMarker: 'Template 12: Still Looking Follow-up', endMarker: 'Template 13: No Agent Cooperation' },
  { id: 'comm-13', file: 'comm-13-no-cooperation.md', startMarker: 'Template 13: No Agent Cooperation', endMarker: 'Template 14: AML/KYC Record Keeping Procedure' },
  { id: 'comm-14', file: 'comm-14-aml-kyc.md', startMarker: 'Template 14: AML/KYC Record Keeping Procedure', endMarker: 'Template 15: Selling Request Received' },
  { id: 'comm-15', file: 'comm-15-selling-request.md', startMarker: 'Template 15: Selling Request Received', endMarker: 'Template 16: Recommended Pricing Advice' },
  { id: 'comm-16', file: 'comm-16-pricing-advice.md', startMarker: 'Template 16: Recommended Pricing Advice', endMarker: 'Template 17: Overpriced Property Decline' },
  { id: 'comm-17', file: 'comm-17-overpriced.md', startMarker: 'Template 17: Overpriced Property Decline', endMarker: 'Template 18: Property Location Information Request' },
  { id: 'comm-18', file: 'comm-18-location-info.md', startMarker: 'Template 18: Property Location Information Request', endMarker: 'Template 19: Different Regions Request' },
  { id: 'comm-19', file: 'comm-19-different-regions.md', startMarker: 'Template 19: Different Regions Request', endMarker: 'Template 20: Client Follow Up - No Reply Yet' },
  { id: 'comm-20', file: 'comm-20-no-reply.md', startMarker: 'Template 20: Client Follow Up - No Reply Yet', endMarker: 'Template 21: Plain Request to info@zyprus.com' },
  { id: 'comm-21', file: 'comm-21-plain-request.md', startMarker: 'Template 21: Plain Request to info@zyprus.com', endMarker: 'Template 22: Apology for Extended Delay' },
  { id: 'comm-22', file: 'comm-22-apology-delay.md', startMarker: 'Template 22: Apology for Extended Delay', endMarker: /END OF (OPTIMIZED )?INSTRUCTIONS|IMPORTANT NOTES|^---/i },
];

function extractTemplate(content: string, startMarker: string, endMarker: string | RegExp): string | null {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    console.warn(`Start marker not found: ${startMarker}`);
    return null;
  }
  
  let endIndex: number;
  if (typeof endMarker === 'string') {
    endIndex = content.indexOf(endMarker, startIndex + startMarker.length);
    if (endIndex === -1) {
      endIndex = content.length; // Go to end if no end marker
    }
  } else {
    // RegExp
    const match = content.substring(startIndex + startMarker.length).match(endMarker);
    if (match && match.index !== undefined) {
      endIndex = startIndex + startMarker.length + match.index;
    } else {
      endIndex = content.length;
    }
  }
  
  const extracted = content.substring(startIndex, endIndex).trim();
  return extracted;
}

function main() {
  console.log('📚 Extracting SOPHIA templates...\n');
  
  // Read source file
  const sourceContent = readFileSync(SOURCE_FILE, 'utf8');
  
  let extracted = 0;
  let failed = 0;
  
  for (const template of TEMPLATE_DEFINITIONS) {
    const content = extractTemplate(sourceContent, template.startMarker, template.endMarker);
    
    if (content) {
      const outputPath = join(TEMPLATES_DIR, template.file);
      writeFileSync(outputPath, content, 'utf8');
      console.log(`✅ ${template.id}: ${template.file}`);
      extracted++;
    } else {
      console.error(`❌ ${template.id}: Failed to extract`);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Extracted: ${extracted} templates`);
  console.log(`   Failed: ${failed} templates`);
  console.log(`   Total: ${TEMPLATE_DEFINITIONS.length} templates`);
  
  if (extracted === TEMPLATE_DEFINITIONS.length) {
    console.log('\n🎉 All templates extracted successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review extracted templates in lib/ai/instructions/templates/');
    console.log('   2. Update lib/ai/prompts.ts to use new template loader');
    console.log('   3. Test SOPHIA behavior to ensure exact match');
  } else {
    console.log('\n⚠️  Some templates failed to extract. Please review manually.');
  }
}

main();
