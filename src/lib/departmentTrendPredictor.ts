import {
  RiskPredictor,
  PredictiveRiskInput,
  PredictiveRiskConfig,
  PredictorResult,
  PredictionReason,
  PredictionEvidence
} from "./predictiveRiskEngine";

export class DepartmentTrendPredictor implements RiskPredictor {
  public predictorId = "department-trend-predictor-v1";

  public evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    const profile = input.departmentProfile;
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
          code: "DTP_NO_DATA",
          description: "Insufficient historical transaction data for department within the configured lookback window.",
          evidence: []
        }],
        metadata: {
          evaluatedTransactions: 0
        }
      };
    }

    const totalExceptions = recentTransactions.reduce((acc, tx) => acc + tx.exceptionCount, 0);
    const exceptionRate = totalExceptions / txVolume;
    
    const avgExposure = txVolume > 0 ? recentTransactions.reduce((acc, tx) => acc + tx.totalExposure, 0) / txVolume : 0;
    
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
      metric: "departmentExceptionRate",
      historicalValue: exceptionRate,
      trend: exceptionTrend,
      impactScore: exceptionRate > 0.4 ? 35 : (exceptionRate > 0.15 ? 15 : 5)
    });
    
    // Evaluate Financial Exposure per Transaction
    let exposureTrend: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";
    evidenceList.push({
      metric: "departmentAverageExposure",
      historicalValue: avgExposure,
      trend: exposureTrend,
      impactScore: avgExposure > 5000 ? 25 : (avgExposure > 1000 ? 10 : 0)
    });

    if (exceptionTrend === "INCREASING") {
      calculatedScore += 20;
    } else if (exceptionTrend === "DECREASING") {
      calculatedScore -= 10;
    }
    
    // Compliance score impact (0-100 where 100 is highly compliant)
    // Inverting it for risk: if compliance is low, risk goes up.
    if (profile.complianceScore < 60) {
      calculatedScore += 25;
      evidenceList.push({
        metric: "departmentComplianceScore",
        historicalValue: profile.complianceScore,
        trend: "STABLE",
        impactScore: 25
      });
    } else if (profile.complianceScore > 85) {
      calculatedScore -= 20;
    }

    // Floor and Ceiling the score
    calculatedScore = Math.min(100, Math.max(0, calculatedScore));

    // Confidence determination based on volume
    let confidence = 50;
    if (txVolume > 100) confidence = 95;
    else if (txVolume > 20) confidence = 85;
    else if (txVolume > 5) confidence = 70;

    const reasons: PredictionReason[] = [];

    if (exceptionRate > 0.25) {
      reasons.push({
        code: "DTP_HIGH_EXCEPTION_RATE",
        description: `Department has historically high exception rate (${(exceptionRate * 100).toFixed(1)}%).`,
        evidence: evidenceList.filter(e => e.metric === "departmentExceptionRate")
      });
    }

    if (exceptionTrend === "INCREASING") {
      reasons.push({
        code: "DTP_DETERIORATING_TREND",
        description: `Department exceptions have been increasing over the lookback window.`,
        evidence: evidenceList.filter(e => e.metric === "departmentExceptionRate")
      });
    }
    
    if (profile.complianceScore < 60) {
       reasons.push({
        code: "DTP_POOR_COMPLIANCE",
        description: `Department historical compliance score is below threshold (${profile.complianceScore}/100).`,
        evidence: evidenceList.filter(e => e.metric === "departmentComplianceScore")
      });
    }
    
    if (avgExposure > 5000) {
      reasons.push({
        code: "DTP_HIGH_AVG_EXPOSURE",
        description: `Department average financial exposure per exception is high ($${avgExposure.toFixed(2)}).`,
        evidence: evidenceList.filter(e => e.metric === "departmentAverageExposure")
      });
    }
    
    if (reasons.length === 0) {
       reasons.push({
        code: "DTP_NOMINAL_BEHAVIOR",
        description: "Department historical behavior and compliance are within acceptable bounds.",
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
        rawExceptionRate: exceptionRate,
        averageExposure: avgExposure
      }
    };
  }
}
