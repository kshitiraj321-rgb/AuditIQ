import {
  RiskPredictor,
  PredictiveRiskInput,
  PredictiveRiskConfig,
  PredictorResult,
  PredictionReason,
  PredictionEvidence
} from "./predictiveRiskEngine";

export class HistoricalExceptionPredictor implements RiskPredictor {
  public predictorId = "historical-exception-predictor-v1";

  public evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    const transactions = input.historicalTransactions;
    if (!transactions || !Array.isArray(transactions)) {
      return null;
    }

    const recentTransactions = transactions.filter((tx) => {
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
        score: 10, // default nominal risk
        confidence: 0, // no data
        evidence: [{
          metric: "historicalTransactionVolume",
          historicalValue: 0,
          trend: "STABLE",
          impactScore: 0
        }],
        reasons: [{
          code: "HEP_NO_DATA",
          description: "No historical transactions found within the configured lookback window.",
          evidence: []
        }],
        metadata: {
          evaluatedTransactions: 0
        }
      };
    }

    const totalExceptions = recentTransactions.reduce((acc, tx) => acc + tx.exceptionCount, 0);
    const exceptionRate = totalExceptions / txVolume; // exceptions per transaction
    const totalExposure = recentTransactions.reduce((acc, tx) => acc + tx.totalExposure, 0);
    const avgExposure = txVolume > 0 ? totalExposure / txVolume : 0;
    const avgResolutionTime = txVolume > 0 ? recentTransactions.reduce((acc, tx) => acc + tx.resolvedDays, 0) / txVolume : 0;
    
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
      metric: "historicalExceptionRate",
      historicalValue: exceptionRate,
      trend: exceptionTrend,
      impactScore: exceptionRate > 0.5 ? 40 : (exceptionRate > 0.2 ? 20 : 5)
    });
    
    // Evaluate Financial Exposure per Transaction
    let exposureTrend: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";
    evidenceList.push({
      metric: "historicalAverageExposure",
      historicalValue: avgExposure,
      trend: exposureTrend,
      impactScore: avgExposure > 10000 ? 30 : (avgExposure > 2000 ? 15 : 0)
    });

    // Evaluate Average Resolution Time
    evidenceList.push({
      metric: "historicalAverageResolutionDays",
      historicalValue: avgResolutionTime,
      trend: "STABLE",
      impactScore: avgResolutionTime > 14 ? 20 : (avgResolutionTime > 5 ? 10 : 0)
    });

    if (exceptionTrend === "INCREASING") {
      calculatedScore += 25;
    } else if (exceptionTrend === "DECREASING") {
      calculatedScore -= 15;
    }
    
    if (avgExposure > 10000) {
      calculatedScore += 20;
    }
    
    if (avgResolutionTime > 14) {
      calculatedScore += 15;
    }

    // Floor and Ceiling the score
    calculatedScore = Math.min(100, Math.max(0, calculatedScore));

    // Confidence determination based on volume
    let confidence = 50;
    if (txVolume > 100) confidence = 95;
    else if (txVolume > 20) confidence = 85;
    else if (txVolume > 5) confidence = 75;

    const reasons: PredictionReason[] = [];

    if (exceptionRate > 0.3) {
      reasons.push({
        code: "HEP_HIGH_EXCEPTION_RATE",
        description: `Historical transactions exhibit high exception recurrence rate (${(exceptionRate * 100).toFixed(1)}%).`,
        evidence: evidenceList.filter(e => e.metric === "historicalExceptionRate")
      });
    }

    if (exceptionTrend === "INCREASING") {
      reasons.push({
        code: "HEP_DETERIORATING_TREND",
        description: `Exception frequency is accelerating in recent history.`,
        evidence: evidenceList.filter(e => e.metric === "historicalExceptionRate")
      });
    }
    
    if (avgResolutionTime > 14) {
       reasons.push({
        code: "HEP_SLOW_RESOLUTION",
        description: `Historical exceptions take a long time to resolve on average (${avgResolutionTime.toFixed(1)} days).`,
        evidence: evidenceList.filter(e => e.metric === "historicalAverageResolutionDays")
      });
    }
    
    if (reasons.length === 0) {
       reasons.push({
        code: "HEP_NOMINAL_HISTORY",
        description: "Historical transaction patterns show nominal risk.",
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
        averageExposure: avgExposure,
        averageResolutionDays: avgResolutionTime
      }
    };
  }
}
