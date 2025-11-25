/**
 * Calculator Service
 * Implements calculation logic for Cyprus real estate calculators
 * Based on calculation rules from zyprus.com and mof.gov.cy
 */

export type CalculatorExecutionResult = {
  success: boolean;
  calculator_name: string;
  inputs: Record<string, any>;
  result?: {
    summary: string;
    details?: Record<string, any>;
    formatted_output?: string;
  };
  error?: {
    code: string;
    message: string;
    fallback_url?: string;
  };
  execution_time_ms?: number;
};

export type CalculatorExecutionRequest = {
  calculator_name: string;
  inputs: Record<string, any>;
};

/**
 * Transfer Fees Calculator
 * Source: https://www.zyprus.com/help/1260/property-transfer-fees-calculator
 *
 * Calculation Rules:
 * - Up to €85,000: 3%
 * - €85,001 - €170,000: 5%
 * - Over €170,001: 8%
 * - 50% exemption applies for resale properties (non-VAT transactions)
 * - Joint names: Each person calculated separately (property_value / 2)
 */
export function calculateTransferFees(
  inputs: Record<string, any>
): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const propertyValue = Number.parseFloat(inputs.property_value);
    const jointNames =
      inputs.joint_names === true || inputs.joint_names === "true";

    if (Number.isNaN(propertyValue) || propertyValue <= 0) {
      return {
        success: false,
        calculator_name: "transfer_fees",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Property value must be a positive number",
          fallback_url:
            "https://www.zyprus.com/help/1260/property-transfer-fees-calculator",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Calculate for each person if joint names
    const valuePerPerson = jointNames ? propertyValue / 2 : propertyValue;
    const numberOfPersons = jointNames ? 2 : 1;

    // Calculate progressive transfer fees
    let fees = 0;

    if (valuePerPerson <= 85_000) {
      fees = valuePerPerson * 0.03;
    } else if (valuePerPerson <= 170_000) {
      fees = 85_000 * 0.03 + (valuePerPerson - 85_000) * 0.05;
    } else {
      fees = 85_000 * 0.03 + 85_000 * 0.05 + (valuePerPerson - 170_000) * 0.08;
    }

    // Multiply by number of persons
    fees *= numberOfPersons;

    // Apply 50% exemption for resale properties
    const exemptionApplied = fees * 0.5;
    const totalFees = fees - exemptionApplied;

    const formattedOutput = `💰 Transfer Fees Calculation

Property Value: €${propertyValue.toLocaleString()}
Buying in Joint Names: ${jointNames ? "Yes" : "No"}

Calculation Breakdown:
${jointNames ? `- Value per person: €${valuePerPerson.toLocaleString()}\n` : ""}- Base transfer fees: €${fees.toLocaleString()}
- 50% Exemption (resale): -€${exemptionApplied.toLocaleString()}

📊 Total Transfer Fees: €${totalFees.toLocaleString()}

[Source: Cyprus Land Registry Transfer Fee Rates | Verified by SOFIA Calculator]`;

    return {
      success: true,
      calculator_name: "transfer_fees",
      inputs,
      result: {
        summary: `€${totalFees.toLocaleString()}`,
        details: {
          property_value: propertyValue,
          joint_names: jointNames,
          value_per_person: valuePerPerson,
          base_fees: fees,
          exemption: exemptionApplied,
          total_fees: totalFees,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: "transfer_fees",
      inputs,
      error: {
        code: "CALCULATION_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown calculation error",
        fallback_url:
          "https://www.zyprus.com/help/1260/property-transfer-fees-calculator",
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Capital Gains Tax Calculator
 * Source: https://www.zyprus.com/capital-gains-calculator
 *
 * Calculation Rules:
 * - Capital Gains = Sale Price - (Purchase Cost + Improvements + Expenses)
 * - Allowances: Main Residence (€85,430), Farm Land (€25,629), Any Other Sale (€17,086)
 * - Tax Rate: 20% on gains above allowance
 * - Inflation adjustment based on year of purchase/improvements
 */
export function calculateCapitalGainsTax(
  inputs: Record<string, any>
): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const salePrice = Number.parseFloat(inputs.sale_price);
    const purchasePrice = Number.parseFloat(inputs.purchase_price);
    const purchaseYear = Number.parseInt(inputs.purchase_year, 10);
    const saleYear = Number.parseInt(inputs.sale_year, 10);

    // Optional expenses
    const costOfImprovements = Number.parseFloat(
      inputs.cost_of_improvements || "0"
    );
    const transferFees = Number.parseFloat(inputs.transfer_fees || "0");
    const interestOnLoan = Number.parseFloat(inputs.interest_on_loan || "0");
    const legalFees = Number.parseFloat(inputs.legal_fees || "0");
    const agentFees = Number.parseFloat(inputs.estate_agent_fees || "0");
    const otherExpenses = Number.parseFloat(inputs.other_expenses || "0");

    // Allowance type
    const allowanceType = inputs.allowance_type || "any_other_sale";

    if (
      Number.isNaN(salePrice) ||
      Number.isNaN(purchasePrice) ||
      salePrice <= 0 ||
      purchasePrice <= 0
    ) {
      return {
        success: false,
        calculator_name: "capital_gains_tax",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Sale price and purchase price must be positive numbers",
          fallback_url: "https://www.zyprus.com/capital-gains-calculator",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Simplified inflation adjustment (approximation based on typical Cyprus CPI)
    const yearsHeld = saleYear - purchaseYear;
    const inflationRate = 0.02; // 2% annual average
    const inflationMultiplier = (1 + inflationRate) ** yearsHeld;

    const adjustedPurchasePrice = purchasePrice * inflationMultiplier;

    // Calculate total cost basis
    const totalCostBasis =
      adjustedPurchasePrice +
      costOfImprovements +
      transferFees +
      interestOnLoan +
      legalFees +
      agentFees +
      otherExpenses;

    // Calculate capital gain
    const capitalGain = salePrice - totalCostBasis;

    // Determine allowance
    const allowances: Record<string, number> = {
      main_residence: 85_430,
      farm_land: 25_629,
      any_other_sale: 17_086,
      none: 0,
    };

    const allowance = allowances[allowanceType] ?? allowances.any_other_sale;

    // Calculate taxable gain
    const taxableGain = Math.max(0, capitalGain - allowance);

    // Calculate tax (20% rate)
    const capitalGainsTax = taxableGain * 0.2;

    const formattedOutput = `📈 Capital Gains Tax Calculation

Sale Details:
- Sale Price: €${salePrice.toLocaleString()}
- Sale Year: ${saleYear}

Purchase Details:
- Purchase Price: €${purchasePrice.toLocaleString()}
- Purchase Year: ${purchaseYear}
- Inflation-Adjusted: €${adjustedPurchasePrice.toLocaleString()}

Expenses:
- Improvements: €${costOfImprovements.toLocaleString()}
- Transfer Fees: €${transferFees.toLocaleString()}
- Legal Fees: €${legalFees.toLocaleString()}
- Agent Fees: €${agentFees.toLocaleString()}
- Other: €${otherExpenses.toLocaleString()}

Calculation:
- Total Cost Basis: €${totalCostBasis.toLocaleString()}
- Capital Gain: €${capitalGain.toLocaleString()}
- Allowance (${allowanceType.replace("_", " ")}): €${allowance.toLocaleString()}
- Taxable Gain: €${taxableGain.toLocaleString()}

📊 Capital Gains Tax (20%): €${capitalGainsTax.toLocaleString()}

Note: This is an estimate. Consult a tax professional for accurate assessment.

[Source: Cyprus Tax Department CGT Rules | Verified by SOFIA Calculator]`;

    return {
      success: true,
      calculator_name: "capital_gains_tax",
      inputs,
      result: {
        summary: `€${capitalGainsTax.toLocaleString()}`,
        details: {
          sale_price: salePrice,
          purchase_price: purchasePrice,
          adjusted_purchase_price: adjustedPurchasePrice,
          total_cost_basis: totalCostBasis,
          capital_gain: capitalGain,
          allowance,
          taxable_gain: taxableGain,
          tax: capitalGainsTax,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: "capital_gains_tax",
      inputs,
      error: {
        code: "CALCULATION_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown calculation error",
        fallback_url: "https://www.zyprus.com/capital-gains-calculator",
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Deterministic VAT Calculator for Cyprus Primary Residence
 * Source: Cyprus Tax Department VAT 5% calculation tool
 * References:
 * - https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
 * - VAT Circular 11/2023, Post-reform rules (≤190 m², €350k/€475k thresholds)
 *
 * VAT REFORM DATE: May 1, 2023
 * - Before May 1, 2023: 5% VAT on entire amount for eligible properties
 * - After May 1, 2023: 5% VAT only on first 130m² capped at €350k, rest at 19%
 *
 * Post-Reform Rules (After May 1, 2023):
 * 1. Reduced 5% VAT applies only to first 130 m² of qualifying primary residence
 * 2. Property total area must be ≤ 190 m² to be eligible for reduced scheme
 * 3. Reduced rate capped at €350,000 of value
 * 4. Total transaction value must be ≤ €475,000
 * 5. If price > €475,000 → no 5% applies (entire taxable amount at 19%)
 * 6. If price ≤ €475,000 but > €350,000, only eligible portion at 5%, remainder at 19%
 *
 * Pre-Reform Rules (Before May 1, 2023):
 * 1. 5% VAT applies to entire amount for eligible primary residence
 * 2. Property must be ≤ 200 m² (different threshold)
 * 3. Different eligibility criteria (simpler)
 */
export function calculateVAT(
  inputs: Record<string, any>
): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const totalArea = Number.parseFloat(inputs.buildable_area);
    const price = Number.parseFloat(inputs.price);
    const isMainResidence = inputs.is_main_residence !== false; // default true
    const submissionDate = inputs.submission_date;

    // Parse submission date if provided (DD/MM/YYYY format)
    const VAT_REFORM_DATE = new Date("2023-05-01");
    let isPreReform = false;

    if (submissionDate && typeof submissionDate === "string") {
      const dateParts = submissionDate.split("/");
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (!Number.isNaN(parsedDate.getTime())) {
          isPreReform = parsedDate < VAT_REFORM_DATE;
        }
      }
    }

    // Input validation
    if (
      Number.isNaN(totalArea) ||
      totalArea <= 0 ||
      Number.isNaN(price) ||
      price <= 0
    ) {
      return {
        success: false,
        calculator_name: "vat_calculator",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Total area and price must be positive numbers",
          fallback_url:
            "https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Investment properties always pay 19% VAT
    if (!isMainResidence) {
      const vat19 = price * 0.19;
      return {
        success: true,
        calculator_name: "vat_calculator",
        inputs,
        result: {
          summary: `€${vat19.toLocaleString()}`,
          details: {
            eligible: false,
            inputs: { price, total_area: totalArea },
            computed: {
              area_ratio: 0,
              reduced_value_base: 0,
              vat_5: 0,
              vat_19: vat19,
            },
            final_vat: vat19,
            notes: [
              "Investment property - 19% VAT rate applies to entire amount",
            ],
          },
          formatted_output: `💵 Total VAT: €${vat19.toLocaleString()}

This calculation is based on the new Cyprus VAT reform law.

[Source: Cyprus Tax Department VAT Circular 11/2023 | Verified by SOFIA Calculator]`,
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // PRE-REFORM CALCULATION (Before May 1, 2023)
    if (isPreReform) {
      // Pre-reform rules: 5% VAT on entire amount for eligible properties
      // Eligibility: primary residence, ≤ 200m² (different from post-reform)
      const eligible = totalArea <= 200;
      const vat5 = eligible ? price * 0.05 : 0;
      const vat19 = eligible ? 0 : price * 0.19;
      const finalVAT = vat5 + vat19;

      const formattedOutput = `💵 Total VAT: €${finalVAT.toFixed(2)}

This calculation is based on the pre-reform Cyprus VAT rules (before May 1, 2023).

[Source: Cyprus Tax Department VAT Guidelines | Verified by SOFIA Calculator]`;

      return {
        success: true,
        calculator_name: "vat_calculator",
        inputs,
        result: {
          summary: `€${finalVAT.toFixed(2)}`,
          details: {
            eligible,
            vat_regime: "pre-reform",
            submission_date: submissionDate,
            inputs: { price, total_area: totalArea },
            computed: {
              area_ratio: 1,
              reduced_value_base: eligible ? price : 0,
              vat_5: vat5,
              vat_19: vat19,
            },
            final_vat: finalVAT,
            notes: [
              "Pre-reform rules apply (before May 1, 2023)",
              eligible
                ? "5% VAT on entire amount - property meets pre-reform criteria (≤200 m²)"
                : "19% VAT - property exceeds 200 m² limit",
            ],
          },
          formatted_output: formattedOutput,
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // POST-REFORM CALCULATION (After May 1, 2023)
    // Eligibility checks for primary residence
    const eligible = totalArea <= 190 && price <= 475_000;

    let vat5 = 0;
    let vat19 = 0;
    let areaRatio = 0;
    let reducedValueBase = 0;
    const notes: string[] = [];

    if (eligible) {
      // Eligible - apply proportional 5% base formula
      areaRatio = Math.min(130, totalArea) / totalArea;
      reducedValueBase = areaRatio * Math.min(price, 350_000);

      vat5 = reducedValueBase * 0.05;
      vat19 = (price - reducedValueBase) * 0.19;

      notes.push(
        `Area ratio: min(130, ${totalArea}) / ${totalArea} = ${areaRatio.toFixed(6)}`
      );
      notes.push(
        `Reduced value base: ${areaRatio.toFixed(6)} × min(€${price.toLocaleString()}, €350,000) = €${reducedValueBase.toFixed(2)}`
      );
      notes.push(
        `5% VAT on eligible portion: €${reducedValueBase.toFixed(2)} × 0.05 = €${vat5.toFixed(2)}`
      );
      notes.push(
        `19% VAT on remaining: €${(price - reducedValueBase).toFixed(2)} × 0.19 = €${vat19.toFixed(2)}`
      );

      if (price > 350_000) {
        notes.push(
          "Property price exceeds €350,000 - only eligible portion gets 5% rate"
        );
      }
      if (totalArea > 130) {
        notes.push(
          "Property area exceeds 130 m² - reduced rate applies proportionally"
        );
      }
    } else {
      // Ineligible - entire amount at 19%
      vat19 = price * 0.19;

      if (totalArea > 190) {
        notes.push(
          "Property area exceeds 190 m² limit - reduced scheme inapplicable"
        );
      } else if (price > 475_000) {
        notes.push(
          "Property price exceeds €475,000 limit - reduced scheme inapplicable"
        );
      }
    }

    const finalVAT = vat5 + vat19;

    const formattedOutput = `💵 Total VAT: €${finalVAT.toFixed(2)}

This calculation is based on the new Cyprus VAT reform law (VAT Circular 11/2023).

[Source: Cyprus Tax Department VAT Circular 11/2023 | Verified by SOFIA Calculator]`;

    return {
      success: true,
      calculator_name: "vat_calculator",
      inputs,
      result: {
        summary: `€${finalVAT.toFixed(2)}`,
        details: {
          eligible,
          vat_regime: "post-reform",
          submission_date: submissionDate,
          inputs: { price, total_area: totalArea },
          computed: {
            area_ratio: areaRatio,
            reduced_value_base: reducedValueBase,
            vat_5: vat5,
            vat_19: vat19,
          },
          final_vat: finalVAT,
          notes,
        },
        formatted_output: formattedOutput,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      calculator_name: "vat_calculator",
      inputs,
      error: {
        code: "CALCULATION_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown calculation error",
        fallback_url:
          "https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform",
      },
      execution_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Main Calculator Execution Function
 */
export function executeCalculator(
  request: CalculatorExecutionRequest
): CalculatorExecutionResult {
  switch (request.calculator_name) {
    case "transfer_fees":
      return calculateTransferFees(request.inputs);
    case "capital_gains_tax":
      return calculateCapitalGainsTax(request.inputs);
    case "vat_calculator":
      return calculateVAT(request.inputs);
    default:
      return {
        success: false,
        calculator_name: request.calculator_name,
        inputs: request.inputs,
        error: {
          code: "UNKNOWN_CALCULATOR",
          message: `Calculator "${request.calculator_name}" not found`,
        },
      };
  }
}

export const CalculatorService = {
  executeCalculator,
  calculateTransferFees,
  calculateCapitalGainsTax,
  calculateVAT,
};
