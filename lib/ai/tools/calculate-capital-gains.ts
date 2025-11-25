import { tool } from "ai";
import { z } from "zod";

/**
 * Capital Gains Tax Calculator Tool - REDIRECT ONLY
 *
 * This tool redirects users to the official Zyprus Capital Gains Calculator
 * instead of performing calculations directly.
 *
 * Source: https://www.zyprus.com/capital-gains-calculator
 */
export const calculateCapitalGainsTool = tool({
  description:
    "Redirect users to the Zyprus Capital Gains Calculator. Use when users ask about capital gains tax, selling costs, or property sale taxes. DO NOT calculate - always redirect to the official calculator.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("The user's capital gains question (optional)"),
  }),
  execute: () => {
    return {
      success: true,
      redirect: true,
      calculator_url: "https://www.zyprus.com/capital-gains-calculator",
      formatted_output: `📈 Capital Gains Tax Calculator

For accurate capital gains tax calculations, please use the official Zyprus Capital Gains Calculator:

🔗 **https://www.zyprus.com/capital-gains-calculator**

The calculator will help you determine:
• Your capital gains tax liability
• Applicable allowances (main residence: €85,430, other: €17,086)
• Inflation adjustments based on years held
• Deductible expenses and improvements

Simply enter your property details on the calculator to get an accurate estimate.

[Official Calculator - Zyprus Property Group]`,
    };
  },
});
