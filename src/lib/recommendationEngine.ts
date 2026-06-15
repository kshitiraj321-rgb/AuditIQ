import type { DetectedException } from "@/lib/exceptionEngine";
import type { RiskAssessmentResult } from "@/lib/riskEngine";
import type { FinancialExposureResult } from "@/lib/financialExposure";

type RecommendationInput = {
  exceptions: DetectedException[];
  risk: RiskAssessmentResult;
  financialExposure: FinancialExposureResult;
};

export type { RecommendationInput };

function addRecommendation(
  recommendations: string[],
  recommendation: string
) {
  if (!recommendations.includes(recommendation)) {
    recommendations.push(recommendation);
  }
}

export function generateRecommendations({
  exceptions,
  risk,
  financialExposure,
}: RecommendationInput) {
  const recommendations: string[] = [];

  for (const exception of exceptions) {
    if (exception.type === "Quantity Mismatch") {
      addRecommendation(
        recommendations,
        "Review received quantity and reconcile with purchase order."
      );
    }

    if (exception.type === "Price Variance") {
      addRecommendation(
        recommendations,
        "Review invoice pricing and obtain approval for variance."
      );
    }

    if (exception.type === "Missing Invoice") {
      addRecommendation(
        recommendations,
        "Request invoice from vendor before payment."
      );
    }

    if (exception.type === "Missing GRN") {
      addRecommendation(
        recommendations,
        "Confirm goods receipt before processing invoice."
      );
    }

    if (exception.type === "Duplicate Invoice") {
      addRecommendation(
        recommendations,
        "Block payment and investigate duplicate invoice."
      );
    }
  }

  if (risk.level === "High" || risk.level === "Critical") {
    addRecommendation(
      recommendations,
      "Escalate to finance manager for review."
    );
  }

  if (financialExposure.totalExposure > 10000) {
    addRecommendation(
      recommendations,
      "Hold payment until discrepancy is resolved."
    );
  }

  return recommendations;
}
