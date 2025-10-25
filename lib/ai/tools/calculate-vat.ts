import { tool } from "ai";
import { z } from "zod";
import { CalculatorService } from "@/lib/calculator-service";

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
      // Calculate VAT using the service for both main residence and investment properties
      const result = CalculatorService.calculateVAT({
        price,
        buildable_area,
        planning_application_date,
        is_main_residence,
      });

      if (!result.success) {
        return result.error?.fallback_url
          ? `Error calculating VAT: ${result.error.message}\n\nPlease use the online calculator: ${result.error.fallback_url}`
          : `Error calculating VAT: ${result.error?.message || "Unknown error"}`;
      }

      return result.result?.formatted_output || "VAT calculation completed";
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
