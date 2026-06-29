import {
  DepartmentIntelligenceService,
  RawDepartmentTransaction
} from "../src/lib/departmentIntelligence";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

const NOW = new Date();
function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function runDepartmentIntelligenceTests() {
  console.log("=== DEPARTMENT INTELLIGENCE LAYER VALIDATION ===");

  const service = new DepartmentIntelligenceService();

  // 1. New Department
  const newDept = service.buildDepartmentProfile("D-NEW", []);
  assert(newDept.operations.totalTransactions === 0, "New Department: 0 transactions");
  assert(newDept.exceptions.totalExceptions === 0, "New Department: 0 exceptions");
  assert(newDept.financials.totalSpend === 0, "New Department: 0 spend");
  assert(newDept.trends.overallTrend === "STABLE", "New Department: STABLE trend");

  // 2. Efficient Department (High volume, low variance, 0 exceptions)
  const efficientTxs: RawDepartmentTransaction[] = [
    { transactionId: "T1", departmentId: "D-EFF", date: daysAgo(10), spend: 1000, financialExposure: 0, exceptionCategories: [], processingTimeDays: 2, approvalTimeDays: 1, resolutionTimeDays: 0 },
    { transactionId: "T2", departmentId: "D-EFF", date: daysAgo(20), spend: 1000, financialExposure: 0, exceptionCategories: [], processingTimeDays: 2, approvalTimeDays: 1, resolutionTimeDays: 0 },
    { transactionId: "T3", departmentId: "D-EFF", date: daysAgo(40), spend: 1500, financialExposure: 0, exceptionCategories: [], processingTimeDays: 2, approvalTimeDays: 1, resolutionTimeDays: 0 }
  ];
  const effProfile = service.buildDepartmentProfile("D-EFF", efficientTxs);
  assert(effProfile.operations.totalTransactions === 3, "Efficient Department: 3 transactions");
  assert(effProfile.operations.averageProcessingTimeDays === 2, "Efficient Department: avg processing 2 days");
  assert(effProfile.performance.processingTimeVariance === 0, "Efficient Department: variance is 0");
  assert(effProfile.financials.averageSpend === 1166.6666666666667, "Efficient Department: average spend correct");
  assert(effProfile.trends.rolling30DayVolume === 2, "Efficient Department: 2 transactions in last 30 days");

  // 3. Exception-heavy & High-Risk Department
  const excTxs: RawDepartmentTransaction[] = [
    { transactionId: "T1", departmentId: "D-EXC", date: daysAgo(60), spend: 100, financialExposure: 100, exceptionCategories: ["POLICY_VIOLATION"], isHighRisk: true },
    { transactionId: "T2", departmentId: "D-EXC", date: daysAgo(50), spend: 100, financialExposure: 100, exceptionCategories: ["POLICY_VIOLATION"], isHighRisk: true },
    { transactionId: "T3", departmentId: "D-EXC", date: daysAgo(20), spend: 100, financialExposure: 100, exceptionCategories: ["MISSING_APPROVAL"] },
    { transactionId: "T4", departmentId: "D-EXC", date: daysAgo(10), spend: 100, financialExposure: 100, exceptionCategories: ["MISSING_APPROVAL", "BUDGET_OVERRUN"] }
  ];
  const excProfile = service.buildDepartmentProfile("D-EXC", excTxs);
  assert(excProfile.exceptions.totalExceptions === 5, "Exception Department: 5 total exceptions");
  assert(excProfile.exceptions.highRiskTransactionCount === 2, "Exception Department: 2 high risk transactions");
  assert(excProfile.exceptions.uniqueExceptionPatterns.length === 3, "Exception Department: 3 unique exception patterns");
  assert(excProfile.exceptions.uniqueExceptionPatterns.includes("POLICY_VIOLATION"), "Exception Department: Pattern extracted");

  // 4. Overloaded Department (High variance in processing time)
  const overloadTxs: RawDepartmentTransaction[] = [
    { transactionId: "T1", departmentId: "D-OVR", date: daysAgo(10), spend: 100, financialExposure: 0, exceptionCategories: [], processingTimeDays: 1 },
    { transactionId: "T2", departmentId: "D-OVR", date: daysAgo(10), spend: 100, financialExposure: 0, exceptionCategories: [], processingTimeDays: 15 },
    { transactionId: "T3", departmentId: "D-OVR", date: daysAgo(10), spend: 100, financialExposure: 0, exceptionCategories: [], processingTimeDays: 30 }
  ];
  const ovrProfile = service.buildDepartmentProfile("D-OVR", overloadTxs);
  assert(ovrProfile.operations.averageProcessingTimeDays > 10, "Overloaded Department: Avg processing is high");
  assert(ovrProfile.performance.processingTimeVariance > 100, "Overloaded Department: Processing variance is high");

  // 5. Improving Department
  const impTxs: RawDepartmentTransaction[] = [
    { transactionId: "T1", departmentId: "D-IMP", date: daysAgo(60), spend: 100, financialExposure: 100, exceptionCategories: ["VIOLATION", "MISSING"] },
    { transactionId: "T2", departmentId: "D-IMP", date: daysAgo(50), spend: 100, financialExposure: 100, exceptionCategories: ["MISSING"] },
    { transactionId: "T3", departmentId: "D-IMP", date: daysAgo(20), spend: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T4", departmentId: "D-IMP", date: daysAgo(10), spend: 100, financialExposure: 0, exceptionCategories: [] }
  ];
  const impProfile = service.buildDepartmentProfile("D-IMP", impTxs);
  assert(impProfile.trends.overallTrend === "IMPROVING", "Improving Department: Trend correctly marked IMPROVING");
  assert(impProfile.financials.exposureTrend === "DECREASING", "Improving Department: Exposure trend DECREASING");
  
  // 6. Deteriorating Department
  const detTxs: RawDepartmentTransaction[] = [
    { transactionId: "T1", departmentId: "D-DET", date: daysAgo(60), spend: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T2", departmentId: "D-DET", date: daysAgo(50), spend: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T3", departmentId: "D-DET", date: daysAgo(20), spend: 100, financialExposure: 100, exceptionCategories: ["VIOLATION"] },
    { transactionId: "T4", departmentId: "D-DET", date: daysAgo(10), spend: 100, financialExposure: 200, exceptionCategories: ["VIOLATION", "MISSING"] }
  ];
  const detProfile = service.buildDepartmentProfile("D-DET", detTxs);
  assert(detProfile.trends.overallTrend === "DETERIORATING", "Deteriorating Department: Trend correctly marked DETERIORATING");
  assert(detProfile.financials.exposureTrend === "INCREASING", "Deteriorating Department: Exposure trend INCREASING");

  console.log("\nAll Department Intelligence Scenarios Passed successfully.");
}

runDepartmentIntelligenceTests();
