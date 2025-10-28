import { readFileSync } from "fs";
import { join } from "path";
import type {
  TemplateCategory,
  TemplateData,
  TemplateField,
  TemplateInfo,
} from "@/types/template";

// Ensure this only runs on server side
if (typeof window !== "undefined") {
  throw new Error("template-data-server can only be used on the server side");
}

const TEMPLATES_DIR = join(process.cwd(), "lib/ai/instructions/templates");

/**
 * Extract required fields from template content
 */
function extractRequiredFields(templateContent: string): TemplateField[] {
  const fields: TemplateField[] = [];

  // Look for "Required Fields:" section
  const requiredFieldsMatch = templateContent.match(
    /Required Fields:\s*\n([\s\S]*?)(?=\n\n|\nSubject:|$)/i
  );
  if (!requiredFieldsMatch) return fields;

  const fieldsSection = requiredFieldsMatch[1];

  // Extract field names and examples
  const fieldMatches = fieldsSection.matchAll(
    /([^\n]+?)\s*\([^)]*e\.g\.\s*([^)]+)\)/gi
  );

  for (const match of fieldMatches) {
    const fieldName = match[1].trim();
    const example = match[2].trim();

    // Skip if it's not actually a field (like "Subject:" line)
    if (fieldName.toLowerCase().includes("subject:")) continue;

    fields.push({
      name: fieldName,
      example,
      required: true,
    });
  }

  // Also look for field placeholders in the template itself
  const placeholderMatches = templateContent.matchAll(/\[([^\]]+)\]/g);
  const placeholderNames = new Set<string>();

  for (const match of placeholderMatches) {
    placeholderNames.add(match[1]);
  }

  // Add any placeholders that weren't found in the Required Fields section
  for (const placeholder of placeholderNames) {
    const exists = fields.some(
      (field) =>
        field.name.toLowerCase().includes(placeholder.toLowerCase()) ||
        placeholder.toLowerCase().includes(field.name.toLowerCase())
    );

    if (!exists && !placeholder.toLowerCase().includes("example")) {
      fields.push({
        name: placeholder,
        example: "",
        required: true,
      });
    }
  }

  return fields;
}

/**
 * Get template example with placeholders
 */
function getTemplateExample(templateContent: string): string {
  // Find the actual template content (after metadata)
  const lines = templateContent.split("\n");
  let templateStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line &&
      !line.toLowerCase().includes("required fields") &&
      !line.toLowerCase().includes("template") &&
      !line.toLowerCase().includes("subject:") &&
      !line.match(/^[a-zA-Z\s]*$/)
    ) {
      // Skip category headers
      templateStart = i;
      break;
    }
  }

  if (templateStart === -1) return "";

  const exampleLines = lines.slice(templateStart);

  // Clean up the example
  return exampleLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Load and parse all template data from SOPHIA instructions
 */
export function getTemplateData(): TemplateData {
  // Read the main SOPHIA instructions file
  const instructionsPath = join(process.cwd(), "lib/ai/instructions/base.md");
  const instructionsContent = readFileSync(instructionsPath, "utf8");

  const templates: TemplateInfo[] = [];

  // Define template mappings based on SOPHIA instructions
  const templateDefinitions = [
    // Registration Templates (01-08)
    { id: "01", name: "Standard Seller Registration", category: "registration" as const, requiredFields: ["Buyer Names", "Property Registration Number", "Property Description", "Viewing Date & Time"] },
    { id: "02", name: "Seller with Marketing Agreement", category: "registration" as const, requiredFields: ["Buyer Names", "Property Registration Number", "Property Description", "Viewing Date & Time", "Marketing Price"] },
    { id: "03", name: "Rental Property Registration", category: "registration" as const, requiredFields: ["Tenant Names", "Property Description", "Viewing Date & Time"] },
    { id: "04", name: "Advanced Seller Registration", category: "registration" as const, requiredFields: ["Buyer Names", "Property Registration Numbers", "Property Description", "Agency Fee", "Payment Percentage", "Owner Entities"] },
    { id: "05", name: "Bank Property Registration", category: "registration" as const, requiredFields: ["Client Name", "Client Phone", "Agent Mobile", "Property Link"] },
    { id: "06", name: "Bank Land Registration", category: "registration" as const, requiredFields: ["Client Name", "Client Phone", "Agent Mobile", "Property Link"] },
    { id: "07", name: "Developer Registration (with Viewing)", category: "registration" as const, requiredFields: ["Client Names", "Viewing Date & Time"] },
    { id: "08", name: "Developer Registration (no Viewing)", category: "registration" as const, requiredFields: ["Client Names"] },

    // Viewing Form Templates (09-12)
    { id: "09", name: "Standard Viewing Form", category: "viewing" as const, requiredFields: ["Date", "Name", "ID Number", "Issued By", "Registration Number", "District", "Municipality", "Locality"] },
    { id: "10", name: "Advanced Viewing Form", category: "viewing" as const, requiredFields: ["Date", "Name", "ID Number", "Issued By", "Registration Number", "District", "Municipality", "Locality"] },
    { id: "11", name: "Property Reservation Form", category: "viewing" as const, requiredFields: ["Date Reservation Fee Received", "Prospective Buyers", "Vendors", "Property Details", "Reservation Fee", "Purchase Price", "Special Conditions"] },
    { id: "12", name: "Property Reservation Agreement", category: "viewing" as const, requiredFields: ["Date Reservation Fee Received", "Prospective Buyer", "Vendor", "Property Details", "Reservation Fee", "Purchase Price", "Agent Name", "Company Name", "Banking Details", "Agreement Date"] },

    // Marketing Agreement Templates (13-15)
    { id: "13", name: "Email Marketing Agreement", category: "marketing" as const, requiredFields: ["Seller Name", "Property Registration Number", "Property Location/Description", "Marketing Price"] },
    { id: "14", name: "Non-Exclusive Marketing Agreement", category: "marketing" as const, requiredFields: ["Date", "Seller Name", "Property Registration Number", "Property Location", "Marketing Price", "Agent Name"] },
    { id: "15", name: "Exclusive Marketing Agreement", category: "marketing" as const, requiredFields: ["Date", "Seller Name", "Country", "Passport Number", "Property Description", "Registration Number", "Marketing Price", "Price in Words", "Start Date"] },

    // Client Communication Templates (16-43)
    { id: "16", name: "Good Client - Email", category: "communication" as const, requiredFields: ["Client Name", "Property Link"] },
    { id: "17", name: "Good Client - WhatsApp", category: "communication" as const, requiredFields: ["Client Name", "Property Link"] },
    { id: "18", name: "Valuation Quote", category: "communication" as const, requiredFields: ["Client Name", "Valuation Fee"] },
    { id: "19", name: "Valuation Request Received", category: "communication" as const, requiredFields: ["Client Name"] },
    { id: "20", name: "Client Not Providing Phone", category: "communication" as const, requiredFields: [] },
    { id: "21", name: "Good Client (Missing Phone)", category: "communication" as const, requiredFields: ["Client Name", "Region", "Property Type Context"] },
    { id: "22", name: "Follow-up - Multiple Properties", category: "communication" as const, requiredFields: ["Client Name", "Location", "Property Link 1", "Property Link 2"] },
    { id: "23", name: "Follow-up - Single Property", category: "communication" as const, requiredFields: ["Client Name", "Property Type", "Location", "Property Link"] },
    { id: "24", name: "Buyer Viewing Confirmation", category: "communication" as const, requiredFields: ["Property Link"] },
    { id: "25", name: "No Options - Low Budget", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "26", name: "Multiple Areas Issue", category: "communication" as const, requiredFields: ["Client Name (Optional)", "City/Region"] },
    { id: "27", name: "Time Wasters - Polite Decline", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "28", name: "Still Looking Follow-up", category: "communication" as const, requiredFields: ["Client Name"] },
    { id: "29", name: "No Agent Cooperation", category: "communication" as const, requiredFields: ["Estate Agent Name"] },
    { id: "30", name: "AML/KYC Record Keeping Procedure", category: "communication" as const, requiredFields: [] },
    { id: "31", name: "Selling Request Received", category: "communication" as const, requiredFields: ["Potential Seller Name"] },
    { id: "32", name: "Recommended Pricing Advice", category: "communication" as const, requiredFields: ["Seller Name", "Recommended Asking Price", "Likely Selling Price Range"] },
    { id: "33", name: "Overpriced Property Decline", category: "communication" as const, requiredFields: ["Seller Name", "Transaction Type"] },
    { id: "34", name: "Property Location Information Request", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "35", name: "Different Regions Request", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "36", name: "Client Follow Up - No Reply Yet", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "37", name: "Plain Request to info@zyprus.com", category: "communication" as const, requiredFields: [] },
    { id: "38", name: "Apology for Extended Delay", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
    { id: "39", name: "Client Rushing/Insisting - Patience Request", category: "communication" as const, requiredFields: ["Client Name (Optional)"] },
  ];

  // Create template objects
  for (const templateDef of templateDefinitions) {
    const templateInfo: TemplateInfo = {
      id: templateDef.id,
      name: templateDef.name,
      category: templateDef.category,
      requiredFields: templateDef.requiredFields.map((fieldName, index) => ({
        name: fieldName,
        example: getFieldExample(fieldName, templateDef.id),
        required: true,
      })),
      templateExample: getTemplateExampleFromInstructions(templateDef.id, instructionsContent),
    };

    templates.push(templateInfo);
  }

  // Group templates by category
  const categoriesMap = new Map<string, TemplateInfo[]>();

  for (const template of templates) {
    if (!categoriesMap.has(template.category)) {
      categoriesMap.set(template.category, []);
    }
    categoriesMap.get(template.category)!.push(template);
  }

  // Create categories with proper names
  const categories: TemplateCategory[] = [
    {
      id: "registration",
      name: "Registrations",
      templates: categoriesMap.get("registration") || [],
    },
    {
      id: "viewing",
      name: "Viewing Forms & Reservations",
      templates: categoriesMap.get("viewing") || [],
    },
    {
      id: "marketing",
      name: "Marketing Agreements",
      templates: categoriesMap.get("marketing") || [],
    },
    {
      id: "communication",
      name: "Client Communications",
      templates: categoriesMap.get("communication") || [],
    },
  ];

  return {
    categories,
    allTemplates: templates,
  };
}

/**
 * Get field example based on field name and template ID
 */
function getFieldExample(fieldName: string, templateId: string): string {
  const examples: Record<string, string> = {
    "Buyer Names": "John Smith OR Maria & George Papadopoulos",
    "Property Registration Number": "0/1789",
    "Property Description": "3-bedroom apartment in Paphos",
    "Viewing Date & Time": "October 29, 2025 at 5:00 PM OR tomorrow at 3 PM",
    "Marketing Price": "€350,000",
    "Tenant Names": "John Doe (potential tenant)",
    "Agency Fee": "5.0%",
    "Payment Percentage": "30%",
    "Owner Entities": "John Smith (sole owner)",
    "Client Name": "Andreas Andreou",
    "Client Phone": "+357 99 123456",
    "Agent Mobile": "+357 99 654321",
    "Property Link": "https://www.zyprus.com/Cyprus/property/12345",
    "Client Names": "Fawzi Goussous",
    "Date": "October 29, 2025",
    "Name": "Full name as on ID",
    "ID Number": "K12345678",
    "Issued By": "Cyprus OR United Kingdom",
    "Registration Number": "0/1789",
    "District": "Paphos",
    "Municipality": "Tala",
    "Locality": "Agios Neophytos area",
    "Date Reservation Fee Received": "October 29, 2025",
    "Prospective Buyers": "John Smith",
    "Vendors": "George Papas",
    "Property Details": "Apartment 302, Ianou Str. Nr. 11, Nema Ekali Building, Limassol 3110, Cyprus",
    "Reservation Fee": "€5,000",
    "Purchase Price": "€350,000",
    "Special Conditions": "Subject to mortgage approval",
    "Prospective Buyer": "John Smith",
    "Vendor": "George Papas",
    "Agent Name": "Charalambos Pitros",
    "Company Name": "CSC Zyprus Property Group LTD",
    "Banking Details": "Bank of Cyprus, Account #123456",
    "Agreement Date": "October 29, 2025",
    "Seller Name": "Marios Charalambous",
    "Property Location/Description": "Your property with Registration No 0/1789 Paphos",
    "Country": "Cyprus",
    "Passport Number": "K12345678",
    "Price in Words": "Three hundred fifty thousand Euros",
    "Start Date": "01/08/2026",
    "Valuation Fee": "€250 + VAT",
    "Region": "Paphos",
    "Property Type Context": "home OR property",
    "Location": "Paphos",
    "Property Link 1": "https://www.zyprus.com/Cyprus/property/12345",
    "Property Link 2": "https://www.zyprus.com/Cyprus/property/67890",
    "Property Type": "apartment",
    "City/Region": "Cyprus",
    "Estate Agent Name": "Andreas from ABC Realty",
    "Potential Seller Name": "Marios Charalambous",
    "Recommended Asking Price": "€350,000",
    "Likely Selling Price Range": "€320,000 - €340,000",
    "Transaction Type": "sale OR rent",
    "Client Name (Optional)": "Optional - use if mentioned, otherwise Dear XXXXXXXX",
  };

  return examples[fieldName] || "";
}

/**
 * Get template example content from instructions
 */
function getTemplateExampleFromInstructions(templateId: string, instructionsContent: string): string {
  // Look for the template in the instructions content
  const templateRegex = new RegExp(`Template ${templateId}:([^]*?)(?=Template \\d+:|$)`, 'i');
  const match = instructionsContent.match(templateRegex);

  if (match) {
    // Extract the first few lines of the template as an example
    const templateContent = match[1].trim();
    const lines = templateContent.split('\n').slice(0, 5);
    return lines.join('\n').trim();
  }

  return "Template content available in SOPFIA instructions";
}

// Old implementation below - disabled for now
/*
export function getTemplateDataOld(): TemplateData {
  const registry = [] as any[];
  const templates: TemplateInfo[] = [];

  // Group templates by category
  const categoriesMap = new Map<string, TemplateInfo[]>();

  for (const templateMeta of registry) {
    try {
      const templatePath = join(TEMPLATES_DIR, templateMeta.file);
      const templateContent = readFileSync(templatePath, 'utf8');

      const requiredFields = extractRequiredFields(templateContent);
      const templateExample = getTemplateExample(templateContent);

      const templateInfo: TemplateInfo = {
        id: templateMeta.id,
        name: templateMeta.name,
        category: templateMeta.category,
        requiredFields,
        templateExample
      };

      templates.push(templateInfo);

      if (!categoriesMap.has(templateMeta.category)) {
        categoriesMap.set(templateMeta.category, []);
      }
      categoriesMap.get(templateMeta.category)!.push(templateInfo);

    } catch (error) {
      console.warn(`Failed to load template ${templateMeta.id}:`, error);
    }
  }

  // Create categories with proper names
  const categories: TemplateCategory[] = [
    {
      id: 'registration',
      name: 'Registrations',
      templates: categoriesMap.get('registration') || []
    },
    {
      id: 'viewing',
      name: 'Viewing Forms & Reservations',
      templates: categoriesMap.get('viewing') || []
    },
    {
      id: 'marketing',
      name: 'Marketing Agreements',
      templates: categoriesMap.get('marketing') || []
    },
    {
      id: 'communication',
      name: 'Client Communications',
      templates: categoriesMap.get('communication') || []
    }
  ];

  return {
    categories,
    allTemplates: templates
  };
}
*/
