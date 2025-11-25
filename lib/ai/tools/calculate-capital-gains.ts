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
      formatted_output: `For accurate capital gains tax calculations, please visit:

🔗 **https://www.zyprus.com/capital-gains-calculator**`,
    };
  },
});
