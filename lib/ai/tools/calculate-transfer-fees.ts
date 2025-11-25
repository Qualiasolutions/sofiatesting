import { tool } from "ai";
import { z } from "zod";

/**
 * Transfer Fees Calculator Tool
 * Source: https://www.zyprus.com/help/1260/property-transfer-fees-calculator
 *
 * Calculation Rules (Cyprus):
 * - Up to €85,000: 3%
 * - €85,001 - €170,000: 5%
 * - Over €170,001: 8%
 * - 50% exemption applies for resale properties (non-VAT transactions)
 * - Joint names: Each person calculated separately (property_value / 2)
 */
export const calculateTransferFeesTool = tool({
  description:
    "Calculate property transfer fees in Cyprus. Use this when users ask about transfer fees, buying costs, or property transaction fees. Applies progressive rates: 3% up to €85k, 5% for €85k-€170k, 8% above €170k. Includes 50% exemption for resale properties.",
  inputSchema: z.object({
    property_value: z
      .number()
      .positive()
      .describe("The property value in Euros (e.g., 250,000)"),
    joint_names: z
      .boolean()
      .default(false)
      .describe(
        "Whether the property is being purchased in joint names (splits calculation per person)"
      ),
  }),
  execute: ({ property_value, joint_names }) => {
    try {
      // Calculate for each person if joint names
      const valuePerPerson = joint_names ? property_value / 2 : property_value;
      const numberOfPersons = joint_names ? 2 : 1;

      // Calculate progressive transfer fees
      let fees = 0;

      if (valuePerPerson <= 85_000) {
        fees = valuePerPerson * 0.03;
      } else if (valuePerPerson <= 170_000) {
        fees = 85_000 * 0.03 + (valuePerPerson - 85_000) * 0.05;
      } else {
        fees =
          85_000 * 0.03 + 85_000 * 0.05 + (valuePerPerson - 170_000) * 0.08;
      }

      // Multiply by number of persons
      fees *= numberOfPersons;

      // Apply 50% exemption for resale properties
      const exemptionApplied = fees * 0.5;
      const totalFees = fees - exemptionApplied;

      return {
        success: true,
        property_value,
        joint_names,
        value_per_person: valuePerPerson,
        base_fees: fees,
        exemption_amount: exemptionApplied,
        total_fees: totalFees,
        formatted_output: `💰 Transfer Fees Calculation

Property Value: €${property_value.toLocaleString()}
Buying in Joint Names: ${joint_names ? "Yes" : "No"}

Calculation Breakdown:
${joint_names ? `• Value per person: €${valuePerPerson.toLocaleString()}\n` : ""}• Base transfer fees: €${fees.toLocaleString()}
• 50% Exemption (resale): -€${exemptionApplied.toLocaleString()}

📊 Total Transfer Fees: €${totalFees.toLocaleString()}

[Source: Cyprus Land Registry Transfer Fee Rates | Verified by SOFIA Calculator]`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Calculation error",
        fallback_url:
          "https://www.zyprus.com/help/1260/property-transfer-fees-calculator",
      };
    }
  },
});
