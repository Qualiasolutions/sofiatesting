/**
 * Calculator Service
 * Implements calculation logic for Cyprus real estate calculators
 * Based on calculation rules from zyprus.com and mof.gov.cy
 */

export interface CalculatorExecutionResult {
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
}

export interface CalculatorExecutionRequest {
  calculator_name: string;
  inputs: Record<string, any>;
}

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

    if (isNaN(propertyValue) || propertyValue <= 0) {
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
    fees = fees * numberOfPersons;

    // Apply 50% exemption for resale properties
    const exemptionApplied = fees * 0.5;
    const totalFees = fees - exemptionApplied;

    const formattedOutput = `💰 Transfer Fees Calculation

Property Value: €${propertyValue.toLocaleString()}
Buying in Joint Names: ${jointNames ? "Yes" : "No"}

Calculation Breakdown:
${jointNames ? `- Value per person: €${valuePerPerson.toLocaleString()}\n` : ""}- Base transfer fees: €${fees.toLocaleString()}
- 50% Exemption (resale): -€${exemptionApplied.toLocaleString()}

📊 Total Transfer Fees: €${totalFees.toLocaleString()}`;

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
    const purchaseYear = Number.parseInt(inputs.purchase_year);
    const saleYear = Number.parseInt(inputs.sale_year);

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
      isNaN(salePrice) ||
      isNaN(purchasePrice) ||
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

Note: This is an estimate. Consult a tax professional for accurate assessment.`;

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
 * VAT Calculator for Houses/Apartments
 * Source: https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform
 *
 * Calculation Rules:
 * - Standard VAT Rate: 19%
 * - Reduced VAT Rate (5%): First 200m² for first home (before Nov 1, 2023)
 * - NEW Policy (from Nov 1, 2023): Reduced rate applies to properties up to €350,000
 */
export function calculateVAT(
  inputs: Record<string, any>
): CalculatorExecutionResult {
  const startTime = Date.now();

  try {
    const buildableArea = Number.parseFloat(inputs.buildable_area);
    const propertyValue = Number.parseFloat(inputs.price);

    // Parse planning application date (DD/MM/YYYY format)
    const planningApplicationDateStr = inputs.planning_application_date;
    if (!planningApplicationDateStr) {
      return {
        success: false,
        calculator_name: "vat_calculator",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Planning application date is required (DD/MM/YYYY format)",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Parse DD/MM/YYYY to Date object
    const dateParts = planningApplicationDateStr.split("/");
    if (dateParts.length !== 3) {
      return {
        success: false,
        calculator_name: "vat_calculator",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Date must be in DD/MM/YYYY format",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    const day = Number.parseInt(dateParts[0]);
    const month = Number.parseInt(dateParts[1]);
    const year = Number.parseInt(dateParts[2]);
    const planningApplicationDate = new Date(year, month - 1, day);

    if (
      isNaN(buildableArea) ||
      buildableArea <= 0 ||
      isNaN(propertyValue) ||
      propertyValue <= 0
    ) {
      return {
        success: false,
        calculator_name: "vat_calculator",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Buildable area and price must be positive numbers",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Check if invalid date
    if (isNaN(planningApplicationDate.getTime())) {
      return {
        success: false,
        calculator_name: "vat_calculator",
        inputs,
        error: {
          code: "INVALID_INPUT",
          message: "Invalid date provided",
        },
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Policy cutoff date: November 1, 2023
    const policyCutoffDate = new Date(2023, 10, 1); // Month is 0-indexed
    const isNewPolicy = planningApplicationDate >= policyCutoffDate;

    let totalVAT: number;
    const breakdown: string[] = [];

    if (isNewPolicy) {
      // NEW POLICY (from Nov 1, 2023)
      if (propertyValue <= 350_000) {
        totalVAT = propertyValue * 0.05;
        breakdown.push(
          `Property value (€${propertyValue.toLocaleString()}) is under €350,000 limit`
        );
        breakdown.push("VAT Rate: 5% (reduced rate under new policy)");
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      } else {
        totalVAT = propertyValue * 0.19;
        breakdown.push(
          `Property value (€${propertyValue.toLocaleString()}) exceeds €350,000 limit`
        );
        breakdown.push("VAT Rate: 19% (standard rate under new policy)");
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      }
    } else {
      // OLD POLICY (before Nov 1, 2023)
      const reducedRateArea = Math.min(buildableArea, 200);
      const standardRateArea = Math.max(0, buildableArea - 200);

      if (buildableArea <= 200) {
        totalVAT = propertyValue * 0.05;
        breakdown.push(
          `Buildable area (${buildableArea}m²) is within 200m² limit`
        );
        breakdown.push("VAT Rate: 5% (reduced rate under old policy)");
        breakdown.push(`VAT Amount: €${totalVAT.toLocaleString()}`);
      } else {
        const pricePerSqm = propertyValue / buildableArea;
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
    const formattedOutput = `💵 VAT Calculation

Property Details:
- Buildable Area: ${buildableArea}m²
- Price: €${propertyValue.toLocaleString()}
- Planning Application Date: ${planningApplicationDateStr}
- Applied Policy: ${policyType}

Calculation Breakdown:
${breakdown.map((line) => `• ${line}`).join("\n")}

📊 Total VAT: €${totalVAT.toLocaleString()}

Note: This calculation is for new builds only. Resale properties are exempt from VAT but pay transfer fees.`;

    return {
      success: true,
      calculator_name: "vat_calculator",
      inputs,
      result: {
        summary: `€${totalVAT.toLocaleString()}`,
        details: {
          buildable_area: buildableArea,
          price: propertyValue,
          planning_application_date: planningApplicationDateStr,
          is_new_policy: isNewPolicy,
          total_vat: totalVAT,
          breakdown,
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
