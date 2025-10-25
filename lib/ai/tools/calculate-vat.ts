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
    "Calculate VAT for new houses/apartments in Cyprus. Use when users ask about VAT on new builds. NEW Policy (from Nov 1, 2023): 5% VAT up to €350k, 19% above. OLD Policy: 5% for first 200m², 19% for rest. Only for new builds - resale properties are VAT-exempt.",
  inputSchema: z.object({
    price: z
      .number()
      .positive()
      .describe("The property price in Euros (e.g., 350000)"),
    buildable_area: z
      .number()
      .positive()
      .describe(
        "The buildable/covered area in square meters (e.g., 150). Used for OLD policy calculations."
      ),
    planning_application_date: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .describe(
        "Planning application date in DD/MM/YYYY format (e.g., 15/10/2023). Determines if NEW or OLD policy applies (cutoff: 01/11/2023)."
      ),
  }),
  execute: async ({ price, buildable_area, planning_application_date }) => {
    try {
      // Parse DD/MM/YYYY to Date object
      const dateParts = planning_application_date.split("/");
      if (dateParts.length !== 3) {
        return {
          success: false,
          error: "Date must be in DD/MM/YYYY format",
        };
      }

      const day = Number.parseInt(dateParts[0]);
      const month = Number.parseInt(dateParts[1]);
      const year = Number.parseInt(dateParts[2]);
      const planningDate = new Date(year, month - 1, day);

      if (isNaN(planningDate.getTime())) {
        return {
          success: false,
          error: "Invalid date provided",
        };
      }

      // Policy cutoff date: November 1, 2023
      const policyCutoffDate = new Date(2023, 10, 1); // Month is 0-indexed
      const isNewPolicy = planningDate >= policyCutoffDate;

      let totalVAT: number;
      const breakdown: string[] = [];

      if (isNewPolicy) {
        // NEW POLICY (from Nov 1, 2023)
        if (price <= 350_000) {
          totalVAT = price * 0.05;
          breakdown.push(
            `Property value (€${price.toLocaleString()}) is under €350,000 limit`
          );
          breakdown.push("VAT Rate: 5% (reduced rate under new policy)");
          breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
        } else {
          totalVAT = price * 0.19;
          breakdown.push(
            `Property value (€${price.toLocaleString()}) exceeds €350,000 limit`
          );
          breakdown.push("VAT Rate: 19% (standard rate under new policy)");
          breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
        }
      } else {
        // OLD POLICY (before Nov 1, 2023)
        const reducedRateArea = Math.min(buildable_area, 200);
        const standardRateArea = Math.max(0, buildable_area - 200);

        if (buildable_area <= 200) {
          totalVAT = price * 0.05;
          breakdown.push(
            `Buildable area (${buildable_area}m²) is within 200m² limit`
          );
          breakdown.push("VAT Rate: 5% (reduced rate under old policy)");
          breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
        } else {
          // Mixed rate calculation
          const pricePerSqm = price / buildable_area;
          const reducedRateValue = reducedRateArea * pricePerSqm;
          const standardRateValue = standardRateArea * pricePerSqm;

          const reducedVAT = reducedRateValue * 0.05;
          const standardVAT = standardRateValue * 0.19;
          totalVAT = reducedVAT + standardVAT;

          breakdown.push(
            `First 200m² at 5%: ${reducedRateArea}m² × €${pricePerSqm.toFixed(2)}/m² = €${reducedVAT.toLocaleString()}`
          );
          breakdown.push(
            `Remaining area at 19%: ${standardRateArea}m² × €${pricePerSqm.toFixed(2)}/m² = €${standardVAT.toLocaleString()}`
          );
          breakdown.push(`Total VAT: €${totalVAT.toLocaleString()}`);
        }
      }

      const policyType = isNewPolicy
        ? "New Policy (from Nov 1, 2023)"
        : "Old Policy (before Nov 1, 2023)";

      return {
        success: true,
        price,
        buildable_area,
        planning_application_date,
        is_new_policy: isNewPolicy,
        total_vat: totalVAT,
        breakdown,
        formatted_output: `💵 VAT Calculation

Property Details:
• Buildable Area: ${buildable_area}m²
• Price: €${price.toLocaleString()}
• Planning Application Date: ${planning_application_date}
• Applied Policy: ${policyType}

Calculation Breakdown:
${breakdown.map((line) => `• ${line}`).join("\n")}

📊 Total VAT: €${totalVAT.toLocaleString()}

Note: This calculation is for new builds only. Resale properties are exempt from VAT but pay transfer fees. Policy effective from planning application date.`,
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
