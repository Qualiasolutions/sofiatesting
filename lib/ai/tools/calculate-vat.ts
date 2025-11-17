import { tool } from "ai";
import { z } from "zod";
import { CalculatorService } from "@/lib/calculator-service";

/**
 * VAT Calculator for Cyprus Primary Residence Tool
 * Source: Cyprus Tax Department VAT 5% calculation tool
 * References:
 * - https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
 * - VAT Circular 11/2023: Post-reform rules (≤190 m², €350k/€475k thresholds)
 *
 * Calculation Rules (Must Enforce):
 * - Reduced 5% VAT applies only to first 130 m² of qualifying primary residence
 * - Property total area must be ≤ 190 m² to be eligible for reduced scheme
 * - Reduced rate capped at €350,000 of value
 * - Total transaction value must be ≤ €475,000
 * - If price > €475,000 → no 5% applies (entire taxable amount at 19%)
 * - Investment properties always pay 19% VAT
 * - Only applies to NEW builds (resale properties are VAT-exempt)
 */
export const calculateVATTool = tool({
  description:
    "Calculate VAT for new houses/apartments in Cyprus using official Tax Department rules. ALWAYS USE THIS TOOL for VAT calculations - do NOT calculate manually. Ask for: property price, total area, and whether it's a main residence. Default assumes current date (post-reform rules). Before May 2023: 5% on entire amount. After May 2023: 5% on first 130m² capped at €350k, rest at 19%.",
  inputSchema: z.object({
    price: z
      .number()
      .positive()
      .describe("Property price in Euros (e.g., 350,000)"),
    buildable_area: z
      .number()
      .positive()
      .describe("Total internal area in square meters (e.g., 150)"),
      is_main_residence: z
      .boolean()
      .default(true)
      .describe(
        "Is this for main residence? Ask: 'Is this for your main residence?' (Yes/No)"
      ),
  }),
  execute: ({
    price,
    buildable_area,
    submission_date,
    is_main_residence = true,
  }) => {
    try {
      // Calculate VAT using the updated service with deterministic rules
      const result = CalculatorService.calculateVAT({
        price,
        buildable_area,
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
