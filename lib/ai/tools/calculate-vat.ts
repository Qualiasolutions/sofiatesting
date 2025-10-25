import { tool } from "ai";
import { z } from "zod";

/**
 * VAT Calculator for Houses/Apartments Tool
 * Source: https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
 *
 * Calculation Rules (Cyprus):
 * - Standard VAT Rate: 19%
 * - NEW Policy (from Nov 1, 2023): Reduced 5% rate for properties up to €350,000
 * - OLD Policy (before Nov 1, 2023): Reduced 5% rate for first 200m² of first home
 * - Based on buildable area, property price, and planning application date
 * - Only applies to NEW builds (resale properties are VAT-exempt)
 */
export const calculateVATTool = tool({
  description:
    "Calculate VAT for new houses/apartments in Cyprus. Use when users ask about VAT on new builds. Ask: 'Was the planning permit applied before or after 31/10/2023?' and 'Is this for your main residence?' (Use 01/10/2023 if before, 01/11/2023 if after internally). NEW Policy (from Nov 1, 2023): 5% VAT up to €350k, 19% above. OLD Policy: 5% for first 200m², 19% for rest. Only for new builds - resale properties are VAT-exempt.",
  inputSchema: z.object({
    price: z
      .number()
      .positive()
      .describe("Property price in Euros (e.g., 350,000)"),
    buildable_area: z
      .number()
      .positive()
      .describe(
        "Buildable/covered area in square meters (e.g., 150)"
      ),
    planning_application_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe(
        "Planning permit date. Ask: 'Was the planning permit applied before or after 31/10/2023?' Use 01/10/2023 if before, 01/11/2023 if after."
      ),
    is_main_residence: z
      .boolean()
      .default(true)
      .describe(
        "Is this for main residence? Ask: 'Is this for your main residence?' (Yes/No)"
      ),
  }),
  execute: async ({ price, buildable_area, planning_application_date, is_main_residence = true }) => {
    try {
      // If main residence, redirect to website calculator
      if (is_main_residence) {
        return {
          success: true,
          formatted_output: `💵 VAT Calculation for Main Residence

For main residence (first home) purchases, please use the official VAT calculator:

🔗 https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform

The reduced VAT rates and specific calculations for main residence require the official government calculator.

Note: This applies to houses and apartments only (not land or commercial properties).`,
        };
      }

      // For investment properties (NOT main residence), calculate 19% flat VAT
      const totalVAT = price * 0.19;

      return {
        success: true,
        price,
        is_main_residence: false,
        vat_rate: 0.19,
        total_vat: totalVAT,
        formatted_output: `💵 VAT Calculation (Investment Property)

Property Details:
• Price: €${price.toLocaleString()}
• Main Residence: No (Investment Property)

Calculation:
• Standard VAT Rate: 19%
• Property Value: €${price.toLocaleString()}

📊 Total VAT: €${totalVAT.toLocaleString()}

Note: This calculation is for investment properties (not main residence). For houses and apartments only (not land or commercial properties). Investment properties pay the standard 19% VAT rate on the full property value.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Calculation error",
        fallback_url:
          "https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform",
      };
    }
  },
});
