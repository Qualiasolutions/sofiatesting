import { z } from "zod";

/**
 * Schema for Developer Registration (Templates 07, 08)
 */
export const DeveloperRegistrationSchema = z.object({
  clientName: z.string().describe("The full name of the client"),
  viewingDate: z
    .string()
    .optional()
    .describe(
      "Date and time of viewing if applicable (e.g. 'tomorrow at 15:00')"
    ),
  hasViewing: z
    .boolean()
    .describe(
      "True if this is a registration WITH viewing (Template 07), false if NO viewing (Template 08)"
    ),
  projectName: z.string().optional().describe("Name of the project (Optional)"),
  location: z.string().optional().describe("Location/Area (Optional)"),
});

/**
 * Schema for Marketing Agreements (Templates 14, 15, 16)
 */
export const MarketingAgreementSchema = z.object({
  type: z
    .enum(["exclusive", "non-exclusive", "email-marketing"])
    .describe("Type of marketing agreement"),
  propertyDetails: z
    .string()
    .describe(
      "Registration number and location (e.g. 'Reg No 0/1234 Limassol')"
    ),
  marketingPrice: z
    .string()
    .describe("The agreed marketing price (e.g. '€350,000')"),
  commission: z
    .string()
    .optional()
    .describe(
      "Commission percentage if mentioned (default is usually 5% + VAT)"
    ),
});

/**
 * Schema for Viewing Forms (Templates 09, 10, 11)
 */
export const ViewingFormSchema = z.object({
  clientName: z.string().describe("The full name of the client"),
  propertyLocation: z
    .string()
    .describe("Location or specific property being viewed"),
  dateTime: z.string().describe("Date and time of the viewing"),
  clientPhone: z
    .string()
    .optional()
    .describe("Client's phone number if provided"),
});

/**
 * Schema for General Seller Registration (Templates 01, 02, 03, 04)
 */
export const SellerRegistrationSchema = z.object({
  ownerName: z.string().describe("Name of the property owner"),
  propertyType: z
    .string()
    .describe("Type of property (Apartment, House, Land)"),
  location: z.string().describe("Location/Area of the property"),
  price: z.string().optional().describe("Asking price"),
  registrationNumber: z
    .string()
    .optional()
    .describe("Property registration number if provided"),
});

/**
 * Union schema for the Router to decide which specific schema to use
 */
export const IntentClassificationSchema = z.object({
  intent: z
    .enum([
      "developer_registration",
      "marketing_agreement",
      "viewing_form",
      "seller_registration",
      "general_chat",
      "calculation",
    ])
    .describe("The user's intent based on their message"),
  confidence: z.number().describe("Confidence score between 0 and 1"),
});
