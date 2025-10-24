/**
 * AI Tools Index
 * 
 * Exports all available tools for SOFIA AI Assistant
 * 
 * CALCULATOR TOOLS (Cyprus Real Estate):
 * - Transfer Fees Calculator: Calculate property transfer fees
 * - Capital Gains Tax Calculator: Calculate capital gains tax on sales
 * - VAT Calculator: Calculate VAT for new builds
 */

export { calculateTransferFeesTool } from "./calculate-transfer-fees";
export { calculateCapitalGainsTool } from "./calculate-capital-gains";
export { calculateVATTool } from "./calculate-vat";

// Export existing tools (if any)
export { createDocument } from "./create-document";
export { updateDocument } from "./update-document";
export { getWeather } from "./get-weather";
export { requestSuggestions } from "./request-suggestions";
