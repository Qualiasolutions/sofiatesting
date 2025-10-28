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
    { id: "07", name: "Developer Registration (with Viewing)", category: "registration" as const, requiredFields: ["Developer Contact Person's Name", "Client Names", "Viewing Date & Time"] },
    { id: "08", name: "Developer Registration (no Viewing)", category: "registration" as const, requiredFields: ["Client Names"] },

    // Viewing Form Templates (09-12)
    { id: "09", name: "Standard Viewing Form", category: "viewing" as const, requiredFields: ["Date", "Name", "ID Number", "Issued By", "Registration Number", "District", "Municipality", "Locality"] },
    { id: "10", name: "Advanced Viewing Form", category: "viewing" as const, requiredFields: ["Date", "Name", "ID Number", "Issued By", "Registration Number", "District", "Municipality", "Locality"] },
    { id: "11", name: "Property Reservation Form", category: "viewing" as const, requiredFields: ["Date Reservation Fee Received", "Prospective Buyers", "Vendors", "Property Details", "Reservation Fee", "Purchase Price", "Special Conditions"] },
    { id: "12", name: "Property Reservation Agreement", category: "viewing" as const, requiredFields: ["Date Reservation Fee Received", "Prospective Buyer", "Vendor", "Property Details", "Reservation Fee", "Purchase Price", "Agent Name", "Company Name", "Banking Details", "Agreement Date"] },

    // Marketing Agreement Templates (13-15)
    { id: "13", name: "Email Marketing Agreement", category: "marketing" as const, requiredFields: ["Property Details", "Marketing Price"] },
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
    "Developer Contact Person's Name": "Fotis OR Aris",
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
    "Property Details": "3-bedroom apartment in Paphos with Registration No 0/1789",
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
 * Get template example content from instructions - actual SOFIA output
 */
function getTemplateExampleFromInstructions(templateId: string, instructionsContent: string): string {
  // Return actual SOFIA output examples for each template
  const examples: Record<string, string> = {
    "01": `Subject: Registration – John Smith – Reg No. 0/1789 – 3-bedroom apartment in Paphos

Email Body:

Dear XXXXXXXX, (Seller)

This email is to provide you with a registration.

Client Information: John Smith

Property Introduced: Your Property in Paphos with Registration No. 0/1789

Property Link: https://www.zyprus.com/Cyprus/property/12345

Viewing Arranged for: October 29, 2025 at 5:00 PM

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.`,

    "02": `Subject: Registration – John Smith – Reg No. 0/1789 – 3-bedroom apartment in Paphos

Email Body:

Dear XXXXXXXX, (Seller)

Following our communication,

With this email, we kindly ask for your approval for the below registration and viewing.

Client Information: John Smith

Property Introduced: Your property with Registration No.0/1789 Paphos

Property Link: https://www.zyprus.com/Cyprus/property/12345

Viewing arranged for: October 29, 2025 at 5:00 PM.

Fees: Standard agency fee based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD.

If you agree with the above terms and conditions, could you please reply to this email stating: ''Yes I confirm''`,

    "03": `Subject: Registration – John Doe – 3-bedroom apartment in Paphos

Email Body:

Dear XXXXXXXX, (landlord)

This email is to provide you with a registration.

Client Information: John Doe (potential tenant name)

Property Introduced: Your Property in 3-bedroom apartment in Paphos

Property Link: https://www.zyprus.com/Cyprus/property/12345

Viewing Arranged for: October 29, 2025 at 5:00 PM

Fees: The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD.

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.`,

    "04": `Subject: Registration – John Smith – Reg. Nos. 0/1789, 0/1790 – 3-bedroom apartment in Paphos

Email Body:

Dear XXXXXXXX,

This email is to provide you with the full registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Client Information: John Smith and any directly related company in which he/she/they is/are a sole shareholder or co-shareholder.

Property Introduced: Your property in Paphos, with the following Registration Numbers: 0/1789, 0/1790 (3-bedroom apartment in Paphos)

Our Agency Fees: **5.0% + VAT** based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD.

Our fee becomes payable in full upon your receipt of the initial **30%** payment of the agreed purchase price.

Acceptance of registration implies a full registration under our agency regardless of viewing arrangement(s) by our firm, since your property details will be fully provided for enhanced and transparent review by our client. Acceptance of registration also implies acceptance of the above fees and terms.

By confirming this email you also confirm that you legally represent the following owner entities: John Smith (sole owner)

Please confirm registration.

For the confirmation, please reply ''Yes I confirm''

Looking forward to your prompt reply.`,

    "05": `Subject: Registration Confirmation - Andreas Andreou

Email Body:

Dear Bank of Cyprus Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: +357 99 654321 (please call me to arrange a viewing)

Registration Details: Andreas Andreou +357 99 123456

Property: https://www.remuproperties.com/Cyprus/listing-29190

Looking forward to your prompt reply.`,

    "06": `Subject: Registration Confirmation - Andreas Andreou

Email Body:

Dear Bank of Cyprus Team,

This email is to provide you with a registration.

Please find attached the viewing form for the below Land.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: +357 99 654321 (please call me for any further information)

Registration Details: Andreas Andreou +357 99 123456

Property: https://www.remuproperties.com/Cyprus/listing-29190

Looking forward to your prompt reply.

⚠️ REMINDER: Don't forget to attach viewing form when sending this registration email to bank!`,

    "07": `Subject: Registration – Fawzi Goussous – [PROJECT_NAME] – [LOCATION]

Email Body:

Dear [DEVELOPER_CONTACT_NAME],

This email is to provide you with the registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: Fawzi Goussous

Viewing Arranged for: October 29, 2025 at 5:00 PM

Fees: **8%+VAT** on the Agreed/Accepted Sold price

Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies the acceptance of the fees, terms and content of this email.`,

    "08": `Subject: Registration Confirmation - Fawzi Goussous

Email Body:

Dear XXXXXXXX,

This email is to provide you with the registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: Fawzi Goussous

Fees: **8%+VAT** on the Agreed/Accepted Sold price

Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies a full registration under our agency regardless of viewing arrangement(s) by our firm, since your Company's full details and/or the location of a property will be fully provided for enhanced and transparent review by our client. Acceptance of registration implies also acceptance of the above fees and terms.

Looking forward to your prompt reply.`,

    "09": `Viewing Form

Date: October 29, 2025

Herein, I…………………………………………………………… with ID……………………. Issued By: confirm that CSC Zyprus Property Group LTD (Reg. No. 742, Lic. No. 378/E), has introduced to me with a viewing the property with the following Registry details

Registration No.: 0/1789

District: Paphos

Municipality: Tala

Locality: Agios Neophytos area

Signature: _________________________`,

    "10": `Viewing/Introduction Form

Date: October 29, 2025

Herein, I…………………………………………………………… with ID……………………., Issued By: ……………………………… .confirm that CSC Zyprus Property Group LTD (Reg. No. 742, Lic. No. 378/E), has introduced to me with a viewing and/or digitally the property with the following Registry details:

Registration No.: 0/1789

District: Paphos

Municipality: Tala

Locality: Agios Neophytos area

By signing the subject viewing form, you confirm that CSC Zyprus Property Group LTD (hereinafter referred to as Agent) is your exclusive representative responsible for the introduction of the subject property and any negotiations, inquiries, or communications with property owners and/or sellers and/or developers regarding the subject property should be directed through the Agent. Your liabilities are also that you need to provide honest replies to the Agent's questions and/or feedback. Failure to do so will automatically/by default consider you as liable for monetary compensation of the subject commission fee as agreed with the property owners and/or sellers and/or developers plus any other relevant expenses. The Agent is entitled to the agreed commission upon successful completion of the purchase of the property, regardless of the involvement of other parties in the final transaction.

Signature: _________________________`,

    "11": `PROPERTY RESERVATION

Date Reservation Fee Received: October 29, 2025

Prospective Buyer(s): John Smith

Vendor(s): George Papas

Property Details: Apartment 302, Ianou Str. Nr. 11, Nema Ekali Building, Limassol 3110, Cyprus

Reservation Fee: €5,000 (In words Five thousand Euros)

Purchase Price: €350,000 (In words Three hundred fifty thousand Euros)

Special Conditions: Subject to mortgage approval

The prospective buyer agrees that the reservation fee to the amount €5,000 will be held by the Estate Agent in order to guarantee that the above property is taken off the market, and reserved exclusively for the Prospective buyer until the Sales Agreement is signed and the Reservation fee becomes part of the Deposit.

If for any reason, the Prospective buyer does not conclude the purchase of the above-mentioned property, through his own fault, then the 50% of the Reservation fee will be forfeited by the Estate Agent to cover his administration expenses and the remaining 50% will be provided to the vendor.

The Prospective Buyer: The Vendor:

John Smith George Papas`,

    "13": `Subject: Consent for Marketing – Marios Charalambous – 3-bedroom apartment in Paphos - Terms and Conditions

Email Body:

Dear XXXXXXXX,

We hope this email finds you well.

With this email we kindly request your approval for the marketing of your property with CSC Zyprus Property Group LTD under the following terms and conditions.

Property: 3-bedroom apartment in Paphos with Registration No 0/1789

Marketing Price: €350,000EUR

Fees: **5% + VAT** based on the final agreed sold price. If sold to a purchaser introduced to you by CSC Zyprus Property Group LTD.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD.

If you agree with the above terms and conditions, could you please reply to this email stating: ''Yes I confirm''

⚠️ REMINDER: Don't forget to attach the title deed when sending this marketing agreement email to the seller!`,

    "16": `Subject: Request - Andreas Andreou – House – Limassol

Dear Andreas Andreou,

We hope this email finds you well. We would like to confirm the receipt of your request for the subject property:

https://www.zyprus.com/Cyprus/property/12345

To ensure efficient communication and personalized service, we kindly request a phone call.

Please let us know your preferred date and time for a phone call. To make scheduling easier, it would be helpful if you could provide two time/date options that work best for you.

We look forward to speaking with you and assisting you further in finding the right property.

Phone-Only Addon (if client refuses):

Please note that as a standard practice, we exclusively handle requests through phone communication. Regrettably, if it is not feasible for you to proceed with a phone call, we won't be able to facilitate your request at this time.`,

    "18": `Subject: Valuation Quote – Elena Petrou

Dear Elena Petrou,

We hope this email finds you well. We are pleased to provide you with a quote for the valuation of your property.

Our valuation reports are accredited by the professional bodies of the Royal Institution of Chartered Surveyors (RICS) and the Cyprus Scientific and Technical Chamber (ETEK), reflecting our commitment to maintaining the highest standards of quality and professionalism.

To ensure accurate and reliable results, our valuation reports are delivered by two experienced valuers who conduct a thorough review, providing an added layer of quality control.

As requested, our valuation fee for your property is **€250 + VAT**. We believe our services provide excellent value for the level of expertise and professionalism we offer.

For your reference, you can view an example of our valuation report by clicking on the following link:

https://www.zyprus.com/sites/all/themes/zyprus/files/Property_Valuation_Sample_Cyprus_RICS_ETEK.pdf

Please note that our valuation report will be detailed and will provide you with valuable insights into the current market value of your property. Our team is always available to discuss any questions or concerns you may have regarding the valuation process or the valuation report.

If you have any further questions or would like to proceed with our services, please do not hesitate to contact us. We would be delighted to assist you with your valuation needs.

Thank you for considering our services.`,

    "25": `Subject: Adjustments required – John Smith

Dear John Smith,

We hope this email finds you well. We appreciate your interest in our real estate services and your recent property request. However, we regret to inform you that based on your budget, preferences and areas of interest, we currently do not have any suitable options available.

While we currently do not have any options within your budget and preferences, we would like to leave the door open for further opportunities. If you are willing to adjust your budget, preferences or areas of interest, we would be happy to explore other potential options with you.

Thank you for your understanding, and we are looking forward to your reply.`,

    "32": `Subject: Selling Request – Marios Charalambous

Dear Marios Charalambous,

I hope this email finds you well.

After conducting a thorough analysis of the market and comparable properties, we believe that the recommended asking price for your property is **€350,000**.

In addition, based on our experience and market trends, we estimate that the likely selling price for your property will be in the range of **€320,000 - €340,000**.

We understand that selling a property can be a complex process, and we are here to guide you every step of the way. Please do not hesitate to reach out if you have any questions or concerns.

Thank you for considering our agency for your real estate needs.`,

    "33": `Subject: Selling Request – Marios Charalambous

Dear Marios Charalambous,

Thank you for considering us to market your property.

However, after carefully evaluating your property with the expertise of our team, in our opinion, we regret to inform you that the asking price you provided is significantly above the current market value. As a result, we are unable to effectively market and introduce your property at this price.

We understand that setting a realistic asking price is essential for a successful sale, and we would be delighted to assist you in determining a price that reflects current market conditions.

Should you wish to discuss further, please do not hesitate to contact us — we would be glad to explore with you the available options for marketing, adjusting the asking price, and ultimately achieving the sale of your property.

Thank you for your understanding, and we remain at your disposal.`
  };

  return examples[templateId] || `Example output for Template ${templateId} will be shown here. This is what SOFIA generates when all required fields are provided.`;
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
