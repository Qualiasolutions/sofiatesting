import { generateObject } from "ai";
import { myProvider } from "./providers";
import {
  DeveloperRegistrationSchema,
  MarketingAgreementSchema,
  SellerRegistrationSchema,
  ViewingFormSchema,
} from "./schemas";

// Use a fast model for extraction
const EXTRACTION_MODEL = "chat-model-flash-lite"; // Gemini Flash-Lite

/**
 * Extract structured data for Developer Registration
 */
export async function extractDeveloperRegistration(userMessage: string) {
  const model = myProvider.languageModel(EXTRACTION_MODEL);

  const result = await generateObject({
    model,
    schema: DeveloperRegistrationSchema,
    prompt: `Extract developer registration details from this message: "${userMessage}".
    
    Rules:
    - If "no viewing" is mentioned, hasViewing is false.
    - If a time/date is mentioned, hasViewing is true.
    - Project Name and Location are OPTIONAL. Do not hallucinate them.
    - Client Name is MANDATORY.`,
  });

  return result.object;
}

/**
 * Extract structured data for Marketing Agreement
 */
export async function extractMarketingAgreement(userMessage: string) {
  const model = myProvider.languageModel(EXTRACTION_MODEL);

  const result = await generateObject({
    model,
    schema: MarketingAgreementSchema,
    prompt: `Extract marketing agreement details from this message: "${userMessage}".
    
    Rules:
    - Identify if it is Exclusive, Non-Exclusive, or Email Marketing.
    - "Signature document" usually means Marketing Agreement.
    - Property Details (Reg No, Location) are MANDATORY.
    - Marketing Price is MANDATORY.`,
  });

  return result.object;
}

/**
 * Extract structured data for Viewing Form
 */
export async function extractViewingForm(userMessage: string) {
  const model = myProvider.languageModel(EXTRACTION_MODEL);

  const result = await generateObject({
    model,
    schema: ViewingFormSchema,
    prompt: `Extract viewing form details from this message: "${userMessage}".
    
    Rules:
    - Client Name is MANDATORY.
    - Property/Location is MANDATORY.
    - Date/Time is MANDATORY.`,
  });

  return result.object;
}

/**
 * Extract structured data for Seller Registration
 */
export async function extractSellerRegistration(userMessage: string) {
  const model = myProvider.languageModel(EXTRACTION_MODEL);

  const result = await generateObject({
    model,
    schema: SellerRegistrationSchema,
    prompt: `Extract seller registration details from this message: "${userMessage}".
    
    Rules:
    - Owner Name is MANDATORY.
    - Property Type is MANDATORY.
    - Location is MANDATORY.`,
  });

  return result.object;
}
