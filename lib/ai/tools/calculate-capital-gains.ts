import { tool } from "ai";
import { z } from "zod";

/**
 * Capital Gains Tax Calculator Tool
 * Source: https://www.zyprus.com/capital-gains-calculator
 *
 * Calculation Rules (Cyprus):
 * - Capital Gains = Sale Price - (Purchase Cost + Improvements + Expenses)
 * - Allowances: Main Residence (€85,430), Farm Land (€25,629), Any Other Sale (€17,086)
 * - Tax Rate: 20% on gains above allowance
 * - Inflation adjustment based on years held
 */
export const calculateCapitalGainsTool = tool({
  description:
    "Calculate capital gains tax for Cyprus property sales. Use when users ask about selling costs, capital gains, or property sale taxes. Includes inflation adjustment, allowances (main residence: €85,430, other: €17,086), and 20% tax rate.",
  inputSchema: z.object({
    sale_price: z
      .number()
      .positive()
      .describe("The property sale price in Euros"),
    purchase_price: z
      .number()
      .positive()
      .describe("The original purchase price in Euros"),
    purchase_year: z
      .number()
      .int()
      .min(1970)
      .max(new Date().getFullYear())
      .describe("Year the property was purchased (e.g., 2015)"),
    sale_year: z
      .number()
      .int()
      .min(1970)
      .max(new Date().getFullYear() + 1)
      .describe("Year of the sale (e.g., 2025)"),
    cost_of_improvements: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Cost of property improvements in Euros (optional)"),
    transfer_fees: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Transfer fees paid when purchasing in Euros (optional)"),
    interest_on_loan: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Total interest paid on mortgage in Euros (optional)"),
    legal_fees: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Legal fees for purchase/sale in Euros (optional)"),
    estate_agent_fees: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Estate agent fees in Euros (optional)"),
    other_expenses: z
      .number()
      .nonnegative()
      .default(0)
      .describe("Other related expenses in Euros (optional)"),
    allowance_type: z
      .enum(["main_residence", "farm_land", "any_other_sale", "none"])
      .default("any_other_sale")
      .describe(
        "Type of allowance: main_residence (€85,430), farm_land (€25,629), any_other_sale (€17,086), or none"
      ),
  }),
  execute: async ({
    sale_price,
    purchase_price,
    purchase_year,
    sale_year,
    cost_of_improvements = 0,
    transfer_fees = 0,
    interest_on_loan = 0,
    legal_fees = 0,
    estate_agent_fees = 0,
    other_expenses = 0,
    allowance_type = "any_other_sale",
  }: {
    sale_price: number;
    purchase_price: number;
    purchase_year: number;
    sale_year: number;
    cost_of_improvements?: number;
    transfer_fees?: number;
    interest_on_loan?: number;
    legal_fees?: number;
    estate_agent_fees?: number;
    other_expenses?: number;
    allowance_type?: "main_residence" | "farm_land" | "any_other_sale" | "none";
  }) => {
    try {
      // Simplified inflation adjustment (approximation based on typical Cyprus CPI)
      const yearsHeld = sale_year - purchase_year;
      const inflationRate = 0.02; // 2% annual average
      const inflationMultiplier = Math.pow(1 + inflationRate, yearsHeld);

      const adjustedPurchasePrice = purchase_price * inflationMultiplier;

      // Calculate total cost basis
      const totalCostBasis =
        adjustedPurchasePrice +
        cost_of_improvements +
        transfer_fees +
        interest_on_loan +
        legal_fees +
        estate_agent_fees +
        other_expenses;

      // Calculate capital gain
      const capitalGain = sale_price - totalCostBasis;

      // Determine allowance
      const allowances: Record<string, number> = {
        main_residence: 85430,
        farm_land: 25629,
        any_other_sale: 17086,
        none: 0,
      };

      const allowance = allowances[allowance_type];

      // Calculate taxable gain
      const taxableGain = Math.max(0, capitalGain - allowance);

      // Calculate tax (20% rate)
      const capitalGainsTax = taxableGain * 0.2;

      return {
        success: true,
        sale_price,
        purchase_price,
        adjusted_purchase_price: adjustedPurchasePrice,
        total_cost_basis: totalCostBasis,
        capital_gain: capitalGain,
        allowance,
        allowance_type,
        taxable_gain: taxableGain,
        tax: capitalGainsTax,
        formatted_output: `📈 Capital Gains Tax Calculation

Sale Details:
• Sale Price: €${sale_price.toLocaleString()}
• Sale Year: ${sale_year}

Purchase Details:
• Purchase Price: €${purchase_price.toLocaleString()}
• Purchase Year: ${purchase_year}
• Inflation-Adjusted: €${adjustedPurchasePrice.toLocaleString()}

Expenses:
• Improvements: €${cost_of_improvements.toLocaleString()}
• Transfer Fees: €${transfer_fees.toLocaleString()}
• Interest on Loan: €${interest_on_loan.toLocaleString()}
• Legal Fees: €${legal_fees.toLocaleString()}
• Agent Fees: €${estate_agent_fees.toLocaleString()}
• Other: €${other_expenses.toLocaleString()}

Calculation:
• Total Cost Basis: €${totalCostBasis.toLocaleString()}
• Capital Gain: €${capitalGain.toLocaleString()}
• Allowance (${allowance_type.replace("_", " ")}): €${allowance.toLocaleString()}
• Taxable Gain: €${taxableGain.toLocaleString()}

📊 Capital Gains Tax (20%): €${capitalGainsTax.toLocaleString()}

Note: This is an estimate. Consult a tax professional for accurate assessment.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Calculation error",
        fallback_url: "https://www.zyprus.com/capital-gains-calculator",
      };
    }
  },
});
