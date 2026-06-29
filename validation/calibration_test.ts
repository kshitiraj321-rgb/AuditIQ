import {
  PredictiveRiskEngine,
  PredictorRegistry,
  ConfidenceCalculator,
  RiskScoreAggregator,
  PredictiveRiskInput,
  PredictiveRiskConfig,
  RiskPredictor,
  PredictorResult
} from "../src/lib/predictiveRiskEngine";

class MockConfigurablePredictor implements RiskPredictor {
  constructor(
    public predictorId: string,
    public score: number,
    public confidence: number,
    public reasonCode: string = "MOCK_REASON",
    public metric: string = "mockMetric"
  ) {}

  evaluate(): PredictorResult {
    return {
      predictorId: this.predictorId,
      score: this.score,
      confidence: this.confidence,
      evidence: [
        {
          metric: this.metric,
          historicalValue: this.score,
          trend: "STABLE",
          impactScore: this.score
        }
      ],
      reasons: [
        {
          code: this.reasonCode,
          description: "Mock reason description",
          evidence: [
            {
              metric: this.metric,
              historicalValue: this.score,
              trend: "STABLE",
              impactScore: this.score
            }
          ]
        }
      ],
      metadata: {}
    };
  }
}

const mockInput: PredictiveRiskInput = {
  transactionSnapshot: {
    transactionId: "TX-CALIB-001",
    poNumber: "PO-000",
    vendorId: "V-00",
    departmentId: "D-00",
    financialValue: 100
  },
  departmentProfile: { departmentId: "D-00", historicalTransactions: [], averageExceptionsPerMonth: 0, historicalExposure: 0, complianceScore: 100 },
  historicalTransactions: [],
  vendorProfile: { vendorId: "V-00", averageExceptionsPerMonth: 0, historicalExposure: 0, reliabilityScore: 100, historicalTransactions: [] }
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

function runCalibrationSuite() {
  console.log("=== MULTI-PREDICTOR CALIBRATION & EXPLAINABILITY VALIDATION ===");

  // Scenarios matrix
  const scenarios = [
    {
      name: "Vendor Dominant",
      config: { vendorWeighting: 0.8, departmentWeighting: 0.1, historicalWeighting: 0.1, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 100, conf: 90 },
      dept: { score: 0, conf: 90 },
      hist: { score: 0, conf: 90 },
      expectedScore: 80 // (100*0.8 + 0*0.1 + 0*0.1) / 1.0 = 80
    },
    {
      name: "Department Dominant",
      config: { vendorWeighting: 0.1, departmentWeighting: 0.8, historicalWeighting: 0.1, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 0, conf: 90 },
      dept: { score: 100, conf: 90 },
      hist: { score: 0, conf: 90 },
      expectedScore: 80 // (0*0.1 + 100*0.8 + 0*0.1) / 1.0 = 80
    },
    {
      name: "Historical Dominant",
      config: { vendorWeighting: 0.1, departmentWeighting: 0.1, historicalWeighting: 0.8, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 0, conf: 90 },
      dept: { score: 0, conf: 90 },
      hist: { score: 100, conf: 90 },
      expectedScore: 80 // (0*0.1 + 0*0.1 + 100*0.8) / 1.0 = 80
    },
    {
      name: "Balanced Weighting",
      config: { vendorWeighting: 0.33, departmentWeighting: 0.33, historicalWeighting: 0.33, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 50, conf: 90 },
      dept: { score: 50, conf: 90 },
      hist: { score: 50, conf: 90 },
      expectedScore: 50
    },
    {
      name: "Zero-weight Predictor",
      config: { vendorWeighting: 1.0, departmentWeighting: 0.0, historicalWeighting: 0.0, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 50, conf: 90 },
      dept: { score: 100, conf: 90 },
      hist: { score: 100, conf: 90 },
      expectedScore: 50 // only vendor matters
    },
    {
      name: "Low Risk Org",
      config: { vendorWeighting: 0.4, departmentWeighting: 0.4, historicalWeighting: 0.2, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 10, conf: 90 },
      dept: { score: 10, conf: 90 },
      hist: { score: 10, conf: 90 },
      expectedScore: 10
    },
    {
      name: "Medium Risk Org",
      config: { vendorWeighting: 0.4, departmentWeighting: 0.4, historicalWeighting: 0.2, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 50, conf: 90 },
      dept: { score: 50, conf: 90 },
      hist: { score: 50, conf: 90 },
      expectedScore: 50
    },
    {
      name: "High Risk Org",
      config: { vendorWeighting: 0.4, departmentWeighting: 0.4, historicalWeighting: 0.2, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 90, conf: 90 },
      dept: { score: 90, conf: 90 },
      hist: { score: 90, conf: 90 },
      expectedScore: 90
    },
    {
      name: "Mixed Signals",
      config: { vendorWeighting: 0.5, departmentWeighting: 0.5, historicalWeighting: 0.0, lookbackWindowDays: 90, criticalRiskThreshold: 80 },
      vendor: { score: 100, conf: 90 },
      dept: { score: 0, conf: 90 },
      hist: { score: 0, conf: 90 },
      expectedScore: 50
    }
  ];

  for (const sc of scenarios) {
    const registry = new PredictorRegistry();
    registry.register(new MockConfigurablePredictor("vendor-predictor", sc.vendor.score, sc.vendor.conf, "V_REASON", "v_metric"));
    registry.register(new MockConfigurablePredictor("department-predictor", sc.dept.score, sc.dept.conf, "D_REASON", "d_metric"));
    registry.register(new MockConfigurablePredictor("historical-predictor", sc.hist.score, sc.hist.conf, "H_REASON", "h_metric"));
    
    const engine = new PredictiveRiskEngine(sc.config, registry, new ConfidenceCalculator(), new RiskScoreAggregator());
    const assessment = engine.predict(mockInput);
    
    // Using simple rounding to avoid floating point precision issues during equality check
    const diff = Math.abs(assessment.futureExceptionProbability - sc.expectedScore);
    assert(diff < 0.1, `[${sc.name}] Final probability calibrated correctly (Expected: ${sc.expectedScore}, Got: ${assessment.futureExceptionProbability.toFixed(2)})`);

    // Verify Evidence Aggregation
    assert(assessment.evidence.length === 3, `[${sc.name}] All 3 predictors submitted exactly 1 evidence`);
    assert(assessment.reasons.length === 3, `[${sc.name}] All 3 predictors submitted exactly 1 reason`);
    assert(assessment.metadata.predictorsInvoked.length === 3, `[${sc.name}] Metadata correctly lists all 3 predictors invoked`);
    
    // Verify Explainability
    for (const reason of assessment.reasons) {
      assert(reason.evidence.length > 0, `[${sc.name}] Reason ${reason.code} references supporting evidence`);
    }
  }

  // Confidence Calibration Tests
  const confRegistry = new PredictorRegistry();
  confRegistry.register(new MockConfigurablePredictor("vendor-mock", 100, 10)); // High Score, Low Conf
  confRegistry.register(new MockConfigurablePredictor("department-mock", 100, 10)); // High Score, Low Conf
  const confEngine1 = new PredictiveRiskEngine(
    { vendorWeighting: 0.5, departmentWeighting: 0.5, historicalWeighting: 0.0, lookbackWindowDays: 90, criticalRiskThreshold: 80 }, 
    confRegistry
  );
  const confAss1 = confEngine1.predict(mockInput);
  assert(confAss1.futureExceptionProbability === 100, "High Score + Low Conf: Score unaffected");
  assert(confAss1.confidenceScore < 50, "High Score + Low Conf: Confidence aggregates to low");

  console.log("\nAll Multi-Predictor Calibration Tests Passed successfully.");
}

runCalibrationSuite();
