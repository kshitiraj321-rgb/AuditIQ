import type { DetectedException } from "@/lib/exceptionEngine";
import type { FinancialExposureResult } from "@/lib/financialExposure";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type RiskAssessmentInput = {
  exceptions: DetectedException[];
  financialExposure: FinancialExposureResult;
};

export type RiskAssessmentResult = {
  score: number;
  level: RiskLevel;
};

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) {
    return "Low";
  }

  if (score <= 50) {
    return "Medium";
  }

  if (score <= 75) {
    return "High";
  }

  return "Critical";
}

function getExposureAdjustment(totalExposure: number) {
  if (totalExposure > 25000) {
    return 30;
  }

  if (totalExposure > 10000) {
    return 20;
  }

  if (totalExposure > 5000) {
    return 10;
  }

  return 0;
}

export function assessRisk({
  exceptions,
  financialExposure,
}: RiskAssessmentInput): RiskAssessmentResult {
  const baseScore = exceptions.length * 10;
  const exposureAdjustment = getExposureAdjustment(
    financialExposure.totalExposure
  );
  const score = Math.min(baseScore + exposureAdjustment, 100);

  return {
    score,
    level: getRiskLevel(score),
  };
}
