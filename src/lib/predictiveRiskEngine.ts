// --- Basic Data Models ---
export interface HistoricalTransaction {
  transactionId: string;
  poNumber: string;
  vendorId: string;
  departmentId: string;
  exceptionCount: number;
  totalExposure: number;
  resolvedDays: number;
  date: string;
}

export interface VendorProfile {
  vendorId: string;
  historicalTransactions: HistoricalTransaction[];
  averageExceptionsPerMonth: number;
  historicalExposure: number;
  reliabilityScore: number;
}

export interface DepartmentProfile {
  departmentId: string;
  historicalTransactions: HistoricalTransaction[];
  averageExceptionsPerMonth: number;
  historicalExposure: number;
  complianceScore: number;
}

export interface CurrentTransactionSnapshot {
  transactionId: string;
  poNumber: string;
  vendorId: string;
  departmentId: string;
  financialValue: number;
}

// --- New Inputs & Configuration ---
export interface PredictiveRiskInput {
  transactionSnapshot: CurrentTransactionSnapshot;
  vendorProfile: VendorProfile;
  departmentProfile: DepartmentProfile;
  historicalTransactions: HistoricalTransaction[];
}

export interface PredictiveRiskConfig {
  vendorWeighting: number;
  departmentWeighting: number;
  historicalWeighting: number;
  lookbackWindowDays: number;
  criticalRiskThreshold: number;
}

// --- Output Contracts ---
export interface PredictionEvidence {
  metric: string;
  historicalValue: number;
  trend: "INCREASING" | "DECREASING" | "STABLE";
  impactScore: number;
}

export interface PredictionReason {
  code: string;
  description: string;
  evidence: PredictionEvidence[];
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PredictiveRiskAssessment {
  transactionId: string;
  futureExceptionProbability: number;
  predictiveFinancialExposure: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  reasons: PredictionReason[];
  evidence: PredictionEvidence[];
  recommendedProactiveAction: string;
  metadata: {
    engineVersion: string;
    executionTimestamp: string;
    predictorsInvoked: string[];
  };
}

// --- Internal Predictor Framework ---

export interface PredictorResult {
  predictorId: string;
  score: number; // 0-100
  confidence: number; // 0-100
  evidence: PredictionEvidence[];
  reasons: PredictionReason[];
  metadata?: Record<string, any>;
}

export interface RiskPredictor {
  predictorId: string;
  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null;
}

export class PredictorRegistry {
  private predictors: Map<string, RiskPredictor> = new Map();

  public register(predictor: RiskPredictor): void {
    if (this.predictors.has(predictor.predictorId)) {
      throw new Error(`Predictor with ID ${predictor.predictorId} is already registered.`);
    }
    this.predictors.set(predictor.predictorId, predictor);
  }

  public getPredictors(): RiskPredictor[] {
    return Array.from(this.predictors.values());
  }
}

export class ConfidenceCalculator {
  /**
   * Combines and normalizes predictor confidence scores into a single final confidence metric.
   */
  public calculateFinalConfidence(results: PredictorResult[]): number {
    const validResults = results.filter(r => 
      typeof r.confidence === 'number' && 
      !Number.isNaN(r.confidence) && 
      Number.isFinite(r.confidence) && 
      r.confidence >= 0 && 
      r.confidence <= 100
    );
    
    if (validResults.length === 0) return 0;
    
    const totalConfidence = validResults.reduce((sum, res) => sum + res.confidence, 0);
    return Math.min(100, Math.max(0, totalConfidence / validResults.length));
  }
}

export class RiskScoreAggregator {
  /**
   * Applies configured weights to multiple predictor scores to generate a final predictive score.
   */
  public aggregateScores(results: PredictorResult[], config: PredictiveRiskConfig): { finalScore: number, finalExposure: number } {
    const validResults = results.filter(r => 
      typeof r.score === 'number' && 
      !Number.isNaN(r.score) && 
      Number.isFinite(r.score) && 
      r.score >= 0 && 
      r.score <= 100
    );

    if (validResults.length === 0) {
      return { finalScore: 0, finalExposure: 0 };
    }

    let weightedScoreSum = 0;
    let totalWeight = 0;

    for (const result of validResults) {
      let weight = 1;
      if (result.predictorId.toLowerCase().includes('vendor')) {
        weight = config.vendorWeighting;
      } else if (result.predictorId.toLowerCase().includes('department')) {
        weight = config.departmentWeighting;
      } else {
        weight = config.historicalWeighting;
      }

      if (typeof weight !== 'number' || Number.isNaN(weight) || !Number.isFinite(weight) || weight < 0) {
        weight = 0;
      }

      weightedScoreSum += result.score * weight;
      totalWeight += weight;
    }

    const finalScore = totalWeight > 0 ? (weightedScoreSum / totalWeight) : 0;
    
    // Abstracted calculation placeholder
    const finalExposure = 0; 

    return { 
      finalScore: Math.min(100, Math.max(0, finalScore)),
      finalExposure 
    };
  }
}

export class PredictiveRiskEngine {
  private registry: PredictorRegistry;
  private confidenceCalculator: ConfidenceCalculator;
  private riskScoreAggregator: RiskScoreAggregator;
  private config: PredictiveRiskConfig;
  private readonly ENGINE_VERSION = "3.1.0";

  constructor(
    config: PredictiveRiskConfig,
    registry?: PredictorRegistry,
    confidenceCalculator?: ConfidenceCalculator,
    riskScoreAggregator?: RiskScoreAggregator
  ) {
    if (!config || typeof config !== 'object') {
      throw new Error("Invalid configuration provided to PredictiveRiskEngine.");
    }
    const safeWeight = (w: any) => (typeof w === 'number' && !Number.isNaN(w) && Number.isFinite(w) && w >= 0 && w <= 1) ? w : 0;
    this.config = {
      vendorWeighting: safeWeight(config.vendorWeighting),
      departmentWeighting: safeWeight(config.departmentWeighting),
      historicalWeighting: safeWeight(config.historicalWeighting),
      lookbackWindowDays: (typeof config.lookbackWindowDays === 'number' && config.lookbackWindowDays > 0) ? config.lookbackWindowDays : 90,
      criticalRiskThreshold: (typeof config.criticalRiskThreshold === 'number' && config.criticalRiskThreshold > 0 && config.criticalRiskThreshold <= 100) ? config.criticalRiskThreshold : 80
    };

    this.registry = registry || new PredictorRegistry();
    this.confidenceCalculator = confidenceCalculator || new ConfidenceCalculator();
    this.riskScoreAggregator = riskScoreAggregator || new RiskScoreAggregator();
  }

  public registerPredictor(predictor: RiskPredictor): void {
    this.registry.register(predictor);
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= this.config.criticalRiskThreshold) return "CRITICAL";
    if (score >= 75) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  private generateRecommendation(level: RiskLevel): string {
    switch(level) {
      case "CRITICAL": return "Halt transaction immediately and escalate to risk compliance officer.";
      case "HIGH": return "Flag for manual AP review prior to any approvals.";
      case "MEDIUM": return "Standard operating procedures with added vigilance.";
      case "LOW": return "Proceed with standard automated processing.";
    }
  }

  /**
   * Executes the predictive intelligence pipeline orchestration.
   */
  public predict(input: PredictiveRiskInput): PredictiveRiskAssessment {
    const predictors = this.registry.getPredictors();
    const results: PredictorResult[] = [];
    const invokedIds: string[] = [];
    const aggregatedReasons: PredictionReason[] = [];
    const aggregatedEvidence: PredictionEvidence[] = [];

    for (const predictor of predictors) {
      try {
        const result = predictor.evaluate(input, this.config);
        if (result) {
          if (!result.predictorId) {
            console.error(`Predictor returned missing predictorId. Result rejected.`);
            continue;
          }
          if (typeof result.score !== 'number' || Number.isNaN(result.score) || !Number.isFinite(result.score) || result.score < 0 || result.score > 100) {
            console.error(`Predictor ${result.predictorId} returned invalid score. Result rejected.`);
            continue;
          }
          if (typeof result.confidence !== 'number' || Number.isNaN(result.confidence) || !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 100) {
            console.error(`Predictor ${result.predictorId} returned invalid confidence. Result rejected.`);
            continue;
          }

          results.push(result);
          invokedIds.push(result.predictorId);
          if (Array.isArray(result.reasons)) {
            aggregatedReasons.push(...result.reasons);
          }
          if (Array.isArray(result.evidence)) {
            aggregatedEvidence.push(...result.evidence);
          }
        }
      } catch (err) {
        console.error(`Predictor ${predictor.predictorId} failed during evaluation:`, err);
      }
    }

    const confidenceScore = this.confidenceCalculator.calculateFinalConfidence(results);
    const { finalScore } = this.riskScoreAggregator.aggregateScores(results, this.config);
    const predictiveFinancialExposure = (finalScore / 100) * input.transactionSnapshot.financialValue;

    const riskLevel = this.determineRiskLevel(finalScore);

    return {
      transactionId: input.transactionSnapshot.transactionId,
      futureExceptionProbability: finalScore,
      predictiveFinancialExposure,
      riskLevel,
      confidenceScore,
      reasons: aggregatedReasons,
      evidence: aggregatedEvidence,
      recommendedProactiveAction: this.generateRecommendation(riskLevel),
      metadata: {
        engineVersion: this.ENGINE_VERSION,
        executionTimestamp: new Date().toISOString(),
        predictorsInvoked: invokedIds
      }
    };
  }
}
