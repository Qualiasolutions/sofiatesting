/**
 * AI Tools Index
 *
 * Exports all available tools for SOFIA AI Assistant
 *
 * CALCULATOR TOOLS (Cyprus Real Estate):
 * - Transfer Fees Calculator: Calculate property transfer fees
 * - Capital Gains Tax Calculator: Calculate capital gains tax on sales
 * - VAT Calculator: Calculate VAT for new builds
 *
 * PROPERTY LISTING TOOLS:
 * - Create Listing: Create property listing draft for zyprus.com
 * - Upload Listing: Upload listing to zyprus.com
 * - List Listings: Show user's property listings
 */

// Calculator Tools
export { calculateCapitalGainsTool } from "./calculate-capital-gains";
export { calculateTransferFeesTool } from "./calculate-transfer-fees";
export { calculateVATTool } from "./calculate-vat";

// Property Listing Tools (use API routes for authentication)
export { createListingTool } from "./create-listing";
export { listListingsTool } from "./list-listings";
export { uploadListingTool } from "./upload-listing";

// Document Tools
export { createDocument } from "./create-document";
export { getWeather } from "./get-weather";
export { requestSuggestions } from "./request-suggestions";
export { updateDocument } from "./update-document";
