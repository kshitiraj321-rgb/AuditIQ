import {
  RiskPredictor,
  PredictiveRiskInput,
  PredictiveRiskConfig,
  PredictorResult,
  PredictionReason,
  PredictionEvidence
} from "./predictiveRiskEngine";

export class VendorBehaviorPredictor implements RiskPredictor {
  public predictorId = "vendor-behavior-predictor-v1";

  public evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    const profile = input.vendorProfile;
    if (!profile) {
      return null;
    }

    const recentTransactions = profile.historicalTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.lookbackWindowDays);
      return txDate >= cutoffDate;
    });

    const txVolume = recentTransactions.length;
    
    // If no data to evaluate within lookback window, return a neutral, low confidence score.
    if (txVolume === 0) {
      return {
        predictorId: this.predictorId,
        score: 20, // default nominal risk
        confidence: 0, // no data
        evidence: [{
          metric: "transactionVolume",
          historicalValue: 0,
          trend: "STABLE",
          impactScore: 0
        }],
        reasons: [{
          code: "VBP_NO_DATA",
          description: "Insufficient historical transaction data within the configured lookback window.",
          evidence: []
        }],
        metadata: {
          evaluatedTransactions: 0
        }
      };
    }

    const totalExceptions = recentTransactions.reduce((acc, tx) => acc + tx.exceptionCount, 0);
    const exceptionRate = totalExceptions / txVolume;
    
    let exceptionTrend: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";
    
    // Simple deterministic trend calculation: compare first half to second half of the time window
    if (txVolume > 1) {
      const sortedTxs = [...recentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const midpoint = Math.floor(txVolume / 2);
      const firstHalf = sortedTxs.slice(0, midpoint);
      const secondHalf = sortedTxs.slice(midpoint);
      
      const firstHalfRate = firstHalf.reduce((acc, tx) => acc + tx.exceptionCount, 0) / firstHalf.length;
      const secondHalfRate = secondHalf.reduce((acc, tx) => acc + tx.exceptionCount, 0) / secondHalf.length;
      
      if (secondHalfRate > firstHalfRate + 0.1) {
        exceptionTrend = "INCREASING";
      } else if (secondHalfRate < firstHalfRate - 0.1) {
        exceptionTrend = "DECREASING";
      }
    }

    // Determine base risk score from exception rate
    let calculatedScore = Math.min(100, Math.max(10, exceptionRate * 100));

    const evidenceList: PredictionEvidence[] = [];

    // Evaluate Exception Rate
    evidenceList.push({
      metric: "exceptionRate",
      historicalValue: exceptionRate,
      trend: exceptionTrend,
      impactScore: exceptionRate > 0.5 ? 40 : (exceptionRate > 0.2 ? 20 : 5)
    });

    if (exceptionTrend === "INCREASING") {
      calculatedScore += 15;
    } else if (exceptionTrend === "DECREASING") {
      calculatedScore -= 10;
    }
    
    // Reliability score impact (0-100 where 100 is highly reliable)
    // Inverting it for risk: if reliability is low, risk goes up.
    if (profile.reliabilityScore < 50) {
      calculatedScore += 20;
      evidenceList.push({
        metric: "vendorReliabilityScore",
        historicalValue: profile.reliabilityScore,
        trend: "STABLE",
        impactScore: 20
      });
    } else if (profile.reliabilityScore > 80) {
      calculatedScore -= 15;
    }

    // Floor and Ceiling the score
    calculatedScore = Math.min(100, Math.max(0, calculatedScore));

    // Confidence determination based on volume
    let confidence = 50;
    if (txVolume > 50) confidence = 95;
    else if (txVolume > 10) confidence = 80;
    else if (txVolume > 3) confidence = 65;

    const reasons: PredictionReason[] = [];

    if (exceptionRate > 0.3) {
      reasons.push({
        code: "VBP_HIGH_EXCEPTION_RATE",
        description: `Vendor has historically high exception rate (${(exceptionRate * 100).toFixed(1)}%).`,
        evidence: evidenceList.filter(e => e.metric === "exceptionRate")
      });
    }

    if (exceptionTrend === "INCREASING") {
      reasons.push({
        code: "VBP_DETERIORATING_TREND",
        description: `Vendor exceptions have been increasing recently.`,
        evidence: evidenceList.filter(e => e.metric === "exceptionRate")
      });
    }
    
    if (profile.reliabilityScore < 50) {
       reasons.push({
        code: "VBP_POOR_RELIABILITY",
        description: `Vendor overall historical reliability score is below threshold (${profile.reliabilityScore}/100).`,
        evidence: evidenceList.filter(e => e.metric === "vendorReliabilityScore")
      });
    }
    
    if (reasons.length === 0) {
       reasons.push({
        code: "VBP_NOMINAL_BEHAVIOR",
        description: "Vendor historical behavior is within acceptable bounds.",
        evidence: evidenceList
      });
    }

    return {
      predictorId: this.predictorId,
      score: calculatedScore,
      confidence,
      evidence: evidenceList,
      reasons,
      metadata: {
        evaluatedTransactions: txVolume,
        lookbackDays: config.lookbackWindowDays,
        rawExceptionRate: exceptionRate
      }
    };
  }
}
