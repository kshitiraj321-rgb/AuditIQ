import type { DetectedException } from "@/lib/exceptionEngine";
import type { FinancialExposureResult } from "@/lib/financialExposure";

export type ExceptionRiskScore = {
  type: string;
  score: number;
};

export function calculateExceptionRisks(
  exceptions: DetectedException[],
  financialExposure: FinancialExposureResult
): ExceptionRiskScore[] {
  return exceptions.map((ex) => {
    let baseScore = 50;
    if (ex.severity === "High") {
      baseScore = 75;
    }

    const breakdown = financialExposure.breakdown.find(
      (b) => b.exception === ex.type
    );
    const exposure = breakdown ? breakdown.exposure : 0;

    let score = baseScore;
    if (exposure > 25000) {
      score += 20;
    } else if (exposure > 10000) {
      score += 15;
    } else if (exposure > 5000) {
      score += 10;
    }

    return {
      type: ex.type,
      score: Math.min(score, 100),
    };
  });
}
