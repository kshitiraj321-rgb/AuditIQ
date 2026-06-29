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

const mockConfig: PredictiveRiskConfig = {
  vendorWeighting: 0.6,
  departmentWeighting: 0.3,
  historicalWeighting: 0.1,
  lookbackWindowDays: 90,
  criticalRiskThreshold: 80
};

const badConfig: any = {
  vendorWeighting: -0.5, // Should be clamped or fallback
  departmentWeighting: NaN,
  historicalWeighting: Infinity,
  lookbackWindowDays: -10,
  criticalRiskThreshold: 200
};

const mockInput: PredictiveRiskInput = {
  transactionSnapshot: {
    transactionId: "TX-HARDENING-001",
    poNumber: "PO-000",
    vendorId: "V-00",
    departmentId: "D-00",
    financialValue: 100
  },
  departmentProfile: {
    departmentId: "D-00",
    historicalTransactions: [],
    averageExceptionsPerMonth: 0,
    historicalExposure: 0,
    complianceScore: 100
  },
  historicalTransactions: [],
  vendorProfile: {
    vendorId: "V-00",
    averageExceptionsPerMonth: 0,
    historicalExposure: 0,
    reliabilityScore: 100,
    historicalTransactions: []
  }
};

class MockPredictor implements RiskPredictor {
  constructor(
    public predictorId: string,
    public result: any,
    public throwsError: boolean = false
  ) {}
  evaluate(): PredictorResult | null {
    if (this.throwsError) throw new Error("Mock Predictor Failure");
    return this.result;
  }
}

function runTests() {
  console.log("=== PREDICTIVE RISK FRAMEWORK HARDENING TEST SUITE (REMEDIATED) ===");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorMsg: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${errorMsg}`);
      failed++;
    }
  }

  // 1. Predictor Registry Validation
  const registry = new PredictorRegistry();
  assert(registry.getPredictors().length === 0, "Empty registry", "Registry not empty on init");
  
  const p1 = new MockPredictor("p1", null);
  registry.register(p1);
  assert(registry.getPredictors().length === 1, "Single predictor registration", "Predictor not added");
  
  try {
    registry.register(p1);
    assert(false, "Duplicate predictor ID rejection", "Allowed duplicate");
  } catch (e) {
    assert(true, "Duplicate predictor ID rejection", "");
  }

  // 2. Configuration Validation
  try {
    new PredictiveRiskEngine(null as any);
    assert(false, "Null configuration rejected", "Allowed null config");
  } catch (e) {
    assert(true, "Null configuration rejected", "");
  }

  const engineBadConfig = new PredictiveRiskEngine(badConfig, new PredictorRegistry());
  const resBadConfig = engineBadConfig.predict(mockInput);
  assert(resBadConfig.futureExceptionProbability === 0, "Malformed Config Handled Safely", "Score not bound");

  // 3. Engine Isolation and Sanitization
  const engine = new PredictiveRiskEngine(mockConfig, new PredictorRegistry(), new ConfidenceCalculator(), new RiskScoreAggregator());
  
  // Empty Registry
  const resEmpty = engine.predict(mockInput);
  assert(resEmpty.futureExceptionProbability === 0, "Zero Predictors - Score is 0", "Score is not 0");
  assert(resEmpty.confidenceScore === 0, "Zero Predictors - Confidence is 0", "Confidence is not 0");
  
  // Predictor Throws Exception
  const pFail = new MockPredictor("pFail", null, true);
  const registry2 = new PredictorRegistry();
  registry2.register(pFail);
  const engine2 = new PredictiveRiskEngine(mockConfig, registry2);
  const resFail = engine2.predict(mockInput);
  assert(resFail.futureExceptionProbability === 0 && resFail.confidenceScore === 0, "Predictor Exception Handled", "Engine crashed or gave bad values");

  // Predictor returns NaN/Infinity
  const pNaN = new MockPredictor("pNaN", { predictorId: "pNaN", score: NaN, confidence: Infinity, evidence: [], reasons: [] });
  const registryNaN = new PredictorRegistry();
  registryNaN.register(pNaN);
  const engineNaN = new PredictiveRiskEngine(mockConfig, registryNaN);
  const resNaN = engineNaN.predict(mockInput);
  assert(resNaN.futureExceptionProbability === 0, "RiskScoreAggregator avoids NaN/Infinity", "Score is invalid");
  assert(resNaN.confidenceScore === 0, "ConfidenceCalculator avoids NaN/Infinity", "Confidence is invalid");

  // Predictor missing ID
  const pNoId = new MockPredictor("pNoId", { predictorId: undefined, score: 50, confidence: 50, evidence: [], reasons: [] });
  const registryNoId = new PredictorRegistry();
  registryNoId.register(pNoId);
  const engineNoId = new PredictiveRiskEngine(mockConfig, registryNoId);
  const resNoId = engineNoId.predict(mockInput);
  assert(resNoId.futureExceptionProbability === 0, "Predictor without ID rejected", "Score is non-zero");

  // Out of Bounds Values
  const pOOB = new MockPredictor("pOOB", { predictorId: "pOOB", score: -50, confidence: 200, evidence: [], reasons: [] });
  const registryOOB = new PredictorRegistry();
  registryOOB.register(pOOB);
  const engineOOB = new PredictiveRiskEngine(mockConfig, registryOOB);
  const resOOB = engineOOB.predict(mockInput);
  assert(resOOB.futureExceptionProbability === 0, "Out of bounds Score rejected", "Score is non-zero");
  assert(resOOB.confidenceScore === 0, "Out of bounds Confidence rejected", "Confidence is non-zero");

  // Assessment Contract Verification
  const validP = new MockPredictor("valid", { predictorId: "valid", score: 80, confidence: 90, evidence: [{ metric: "test", historicalValue: 1, trend: "STABLE", impactScore: 10 }], reasons: [] });
  const registryValid = new PredictorRegistry();
  registryValid.register(validP);
  const engineValid = new PredictiveRiskEngine(mockConfig, registryValid);
  const resValid = engineValid.predict(mockInput);
  
  assert(Array.isArray(resValid.evidence), "Assessment Contract contains root evidence", "Evidence missing");
  assert(resValid.evidence.length === 1, "Root evidence populated correctly", "Evidence count wrong");
  assert(resValid.futureExceptionProbability > 0, "Valid predictor outputs final score", "Score is zero");
  assert(resValid.confidenceScore === 90, "Valid predictor outputs confidence", "Confidence is wrong");

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runTests();
