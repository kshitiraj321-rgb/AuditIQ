# Task 13.3.2 — Predictive Risk Engine Public Contract Review

**Date:** 2026-06-29
**Reviewer:** AuditIQ Technical Architect
**Target:** `src/lib/predictiveRiskEngine.ts`

---

## A. Architecture Assessment

The initial contract draft successfully models the core concepts required for predictive intelligence (vendor profiles, department profiles, and historical transaction mapping). The output structure (`PredictionReason`, `PredictionEvidence`) is highly explainable, satisfying Blueprint V1/V2 standards for transparent AI reasoning.

However, the current public API is overly granular and conflates orchestration with execution. Methods like `evaluateVendorTrend` and `analyzeHistoricalRisk` are exposed publicly, implying consumers should orchestrate the prediction pipeline. Furthermore, the contract lacks configuration injection, making predictive weighting rigid, and it fails to define a modular `Predictor` interface, hindering future extensibility (e.g., adding a Machine Learning predictor later).

## B. Missing Contracts

To achieve a production-ready, extensible architecture, the following contracts must be introduced:

1. **`PredictiveRiskInput`**: A unified input payload encapsulating the current transaction snapshot, relevant historical profiles, and configuration.
2. **`PredictiveRiskConfig`**: A configuration contract detailing weighting mechanisms, risk thresholds, and lookback windows.
3. **`PredictionConfidence`**: A dedicated object or score reflecting the reliability of the prediction (e.g., if a vendor only has 1 past transaction, confidence should be low).
4. **`RiskPredictor` Interface**: An abstract contract that specific predictors (Vendor, Department, Trend) must implement. This enables the Engine to operate as a pure orchestrator.
5. **`CurrentTransactionSnapshot`**: The real-time context of the invoice/PO currently being evaluated, needed as the baseline for prediction.

## C. Recommended Public API

The engine should expose a single, immutable, state-driven execution method. Configuration should be injected at initialization.

```typescript
// Unified Input Contract
export interface PredictiveRiskInput {
  transactionSnapshot: CurrentTransactionSnapshot;
  vendorProfile: VendorProfile;
  departmentProfile: DepartmentProfile;
  historicalTransactions: HistoricalTransaction[]; // Contextual time-window payload
}

// Configuration Contract
export interface PredictiveRiskConfig {
  vendorWeighting: number;
  departmentWeighting: number;
  lookbackWindowDays: number;
  criticalRiskThreshold: number;
}

// Output Extensibility
export interface PredictiveRiskAssessment {
  transactionId: string;
  futureExceptionProbability: number;
  predictiveFinancialExposure: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidenceScore: number; // NEW: 0-100% confidence in the prediction
  reasons: PredictionReason[];
  recommendedProactiveAction: string;
  metadata: {
    engineVersion: string;
    executionTimestamp: string;
    predictorsInvoked: string[];
  };
}

// Predictor Interface (Internal Extension Point)
export interface RiskPredictor {
  predictorId: string;
  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictionReason | null;
}

// Refactored Public Engine Contract
export class PredictiveRiskEngine {
  constructor(
    private config: PredictiveRiskConfig,
    private predictors: RiskPredictor[]
  ) {}

  /**
   * Executes the full predictive intelligence orchestration pipeline.
   * Consumes a unified input payload and aggregates results from registered predictors.
   */
  public predict(input: PredictiveRiskInput): PredictiveRiskAssessment;
}
```

## D. Recommended Internal Architecture

To enforce separation of concerns, the Predictive Risk Engine should function solely as a composite orchestrator. The internal layout should follow this component tree:

```text
PredictiveRiskEngine (Orchestrator)
│
├── Predictors (Implement RiskPredictor Interface)
│   ├── VendorBehaviorPredictor
│   ├── DepartmentTrendPredictor
│   ├── HistoricalExceptionPredictor
│   └── (Future) MachineLearningPredictor
│
├── Aggregation Layer
│   ├── ConfidenceCalculator (Evaluates data depth/quality)
│   └── RiskScoreAggregator (Applies config weighting to predictor outputs)
│
└── RecommendationGenerator (Maps final risk to AP actions)
```

## E. Approval Decision

**Outcome: REQUIRES CONTRACT REVISION**

### Required Changes Before Implementation:
1. **Refactor the Public API:** Remove `evaluateVendorTrend`, `evaluateDepartmentTrend`, and `analyzeHistoricalRisk` from the public `PredictiveRiskEngine` class. Expose only `predict(input: PredictiveRiskInput)`.
2. **Implement Extensibility Interfaces:** Define the `RiskPredictor` interface to allow dependency injection of the individual trend evaluators.
3. **Introduce Configuration:** Define `PredictiveRiskConfig` so the engine isn't hardcoded with specific threshold or weight logic.
4. **Enhance Output:** Add `confidenceScore` and `metadata` to `PredictiveRiskAssessment`.

Once the public contract in `src/lib/predictiveRiskEngine.ts` is updated to reflect these boundaries, implementation of the underlying predictors can safely begin.
