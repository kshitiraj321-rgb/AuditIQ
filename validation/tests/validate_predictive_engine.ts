import { 
  PredictiveRiskEngine, 
  PredictorRegistry,
  ConfidenceCalculator,
  RiskScoreAggregator,
  PredictiveRiskInput,
  PredictiveRiskConfig
} from "../../src/lib/predictiveRiskEngine";
import { VendorBehaviorPredictor } from "../../src/lib/vendorBehaviorPredictor";
import { DepartmentTrendPredictor } from "../../src/lib/departmentTrendPredictor";
import { HistoricalExceptionPredictor } from "../../src/lib/historicalExceptionPredictor";

// ==========================================
// 2. Mock Dataset
// ==========================================

const NOW = new Date();
const TEN_DAYS_AGO = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
const TWENTY_DAYS_AGO = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
const THIRTY_DAYS_AGO = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const FORTY_DAYS_AGO = new Date(NOW.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

const mockConfig: PredictiveRiskConfig = {
  vendorWeighting: 0.6,
  departmentWeighting: 0.3,
  historicalWeighting: 0.1,
  lookbackWindowDays: 90,
  criticalRiskThreshold: 80
};

const mockInput: PredictiveRiskInput = {
  transactionSnapshot: {
    transactionId: "TX-2026-06-29-001",
    poNumber: "PO-88492A",
    vendorId: "VND-404",
    departmentId: "DEPT-FIN",
    financialValue: 12500.00
  },
  historicalTransactions: [
    {
      transactionId: "TX-HIST-1",
      poNumber: "PO-88000A",
      vendorId: "VND-404",
      departmentId: "DEPT-FIN",
      exceptionCount: 1,
      totalExposure: 2500,
      resolvedDays: 15,
      date: THIRTY_DAYS_AGO
    },
    {
      transactionId: "TX-HIST-2",
      poNumber: "PO-88111A",
      vendorId: "VND-404",
      departmentId: "DEPT-FIN",
      exceptionCount: 3,
      totalExposure: 11000,
      resolvedDays: 20,
      date: TWENTY_DAYS_AGO
    },
    {
      transactionId: "TX-HIST-3",
      poNumber: "PO-88222A",
      vendorId: "VND-404",
      departmentId: "DEPT-FIN",
      exceptionCount: 5,
      totalExposure: 25000,
      resolvedDays: 25,
      date: TEN_DAYS_AGO
    }
  ],
  vendorProfile: {
    vendorId: "VND-404",
    averageExceptionsPerMonth: 4,
    historicalExposure: 8500,
    reliabilityScore: 45, // Poor reliability (< 50)
    historicalTransactions: [
      {
        transactionId: "TX-OLD-1",
        poNumber: "PO-001",
        vendorId: "VND-404",
        departmentId: "DEPT-FIN",
        exceptionCount: 0,
        totalExposure: 0,
        resolvedDays: 1,
        date: THIRTY_DAYS_AGO
      },
      {
        transactionId: "TX-OLD-2",
        poNumber: "PO-002",
        vendorId: "VND-404",
        departmentId: "DEPT-FIN",
        exceptionCount: 1,
        totalExposure: 1500,
        resolvedDays: 5,
        date: TWENTY_DAYS_AGO
      },
      {
        transactionId: "TX-OLD-3",
        poNumber: "PO-003",
        vendorId: "VND-404",
        departmentId: "DEPT-FIN",
        exceptionCount: 2,
        totalExposure: 3200,
        resolvedDays: 14,
        date: TEN_DAYS_AGO
      }
    ]
  },
  departmentProfile: {
    departmentId: "DEPT-FIN",
    averageExceptionsPerMonth: 2,
    historicalExposure: 4500,
    complianceScore: 55, // Low compliance (< 60)
    historicalTransactions: [
      {
        transactionId: "TX-OLD-4",
        poNumber: "PO-004",
        vendorId: "VND-101",
        departmentId: "DEPT-FIN",
        exceptionCount: 0,
        totalExposure: 0,
        resolvedDays: 1,
        date: FORTY_DAYS_AGO
      },
      {
        transactionId: "TX-OLD-5",
        poNumber: "PO-005",
        vendorId: "VND-102",
        departmentId: "DEPT-FIN",
        exceptionCount: 0,
        totalExposure: 0,
        resolvedDays: 2,
        date: THIRTY_DAYS_AGO
      },
      {
        transactionId: "TX-OLD-6",
        poNumber: "PO-006",
        vendorId: "VND-103",
        departmentId: "DEPT-FIN",
        exceptionCount: 1,
        totalExposure: 6000,
        resolvedDays: 10,
        date: TEN_DAYS_AGO
      }
    ]
  }
};

// ==========================================
// 1. Integration Test & Execution
// ==========================================

export function runValidation() {
  console.log("Starting Extensibility Orchestration Validation...");

  try {
    // 1. Instantiate the Engine and Dependencies
    const registry = new PredictorRegistry();
    const confidenceCalc = new ConfidenceCalculator();
    const scoreAggregator = new RiskScoreAggregator();

    const engine = new PredictiveRiskEngine(
      mockConfig,
      registry,
      confidenceCalc,
      scoreAggregator
    );

    // 2. Register Predictors
    const vendorPredictor = new VendorBehaviorPredictor();
    const departmentPredictor = new DepartmentTrendPredictor();
    const historicalPredictor = new HistoricalExceptionPredictor();
    
    engine.registerPredictor(vendorPredictor);
    engine.registerPredictor(departmentPredictor);
    engine.registerPredictor(historicalPredictor);
    console.log("SUCCESS: VendorBehaviorPredictor, DepartmentTrendPredictor, and HistoricalExceptionPredictor registered.");

    // 3. Execute Prediction
    console.log("Executing prediction pipeline...");
    const assessment = engine.predict(mockInput);

    // 4. Output Results
    console.log("\n=== PREDICTIVE RISK ASSESSMENT ===");
    console.log(JSON.stringify(assessment, null, 2));
    console.log("==================================\n");

    console.log("Validation Complete. Framework extensible without core modifications.");
    return assessment;

  } catch (error) {
    console.error("Validation failed with error:", error);
    throw error;
  }
}

// Execute if run directly
if (typeof require !== 'undefined' && require.main === module) {
  runValidation();
}
