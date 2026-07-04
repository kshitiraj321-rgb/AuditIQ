import { PredictiveAlertService } from "./predictiveAlertService";
import { PredictiveRiskAssessment } from "./predictiveRiskEngine";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function runTests() {
  let passed = 0;
  let total = 0;

  function executeTest(name: string, testFn: () => void) {
    total++;
    try {
      testFn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (e: any) {
      console.error(`[FAIL] ${name}`);
      console.error(e.message);
    }
  }

  console.log("Running predictiveAlertService tests...");

  const baseAssessment: PredictiveRiskAssessment = {
    transactionId: "TX-100",
    futureExceptionProbability: 0,
    predictiveFinancialExposure: 0,
    riskLevel: "LOW",
    confidenceScore: 0,
    reasons: [],
    evidence: [],
    recommendedProactiveAction: "",
    metadata: {
      engineVersion: "v1",
      executionTimestamp: "",
      predictorsInvoked: []
    }
  };

  executeTest("Alert generation for CRITICAL risk", () => {
    const service = new PredictiveAlertService();
    service.dispatchAlerts({
      ...baseAssessment,
      riskLevel: "CRITICAL",
      reasons: [{ code: "R1", description: "Critical Risk Reason", evidence: [] }]
    });
    
    const alerts = service.getActiveAlerts();
    assert(alerts.length === 1, "Should generate exactly 1 alert");
    assert(alerts[0].severity === "CRITICAL", "Alert severity should be CRITICAL");
  });

  executeTest("Alert generation for HIGH risk", () => {
    const service = new PredictiveAlertService();
    service.dispatchAlerts({
      ...baseAssessment,
      riskLevel: "HIGH",
      reasons: [{ code: "R1", description: "High Risk Reason", evidence: [] }]
    });
    
    const alerts = service.getActiveAlerts();
    assert(alerts.length === 1, "Should generate exactly 1 alert");
    assert(alerts[0].severity === "HIGH", "Alert severity should be HIGH");
  });

  executeTest("No alert for LOW risk", () => {
    const service = new PredictiveAlertService();
    service.dispatchAlerts({
      ...baseAssessment,
      riskLevel: "LOW"
    });
    
    assert(service.getActiveAlerts().length === 0, "Should not generate an alert for LOW risk");
  });

  executeTest("No alert for MEDIUM risk", () => {
    const service = new PredictiveAlertService();
    service.dispatchAlerts({
      ...baseAssessment,
      riskLevel: "MEDIUM"
    });
    
    assert(service.getActiveAlerts().length === 0, "Should not generate an alert for MEDIUM risk");
  });

  executeTest("Active alert retrieval and empty input handling", () => {
    const service = new PredictiveAlertService();
    // Dispatch empty reasons for CRITICAL
    service.dispatchAlerts({
      ...baseAssessment,
      riskLevel: "CRITICAL",
      reasons: []
    });
    
    const alerts = service.getActiveAlerts();
    assert(alerts.length === 1, "Should generate an alert even with empty reasons");
    assert(alerts[0].message.endsWith(" risk. "), "Message should format correctly with empty reasons");
  });

  console.log(`\nTest Summary: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
