import { ExecutiveIntelligenceService } from "../src/lib/executiveIntelligence";
import { OrganizationIntelligenceProfile } from "../src/lib/organizationIntelligence";
import { VendorIntelligenceProfile } from "../src/lib/vendorIntelligence";
import { DepartmentIntelligenceProfile } from "../src/lib/departmentIntelligence";
import { PredictiveRiskAssessment } from "../src/lib/predictiveRiskEngine";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

const NOW = new Date().toISOString();

function createMockOrg(
  spend: number, 
  volume: number, 
  excRate: number, 
  vendorConc: "HIGH"|"MEDIUM"|"LOW",
  deptConc: "HIGH"|"MEDIUM"|"LOW",
  excTrend: "IMPROVING"|"DETERIORATING"|"STABLE"
): OrganizationIntelligenceProfile {
  return {
    organizationId: "ORG-1",
    lastUpdated: NOW,
    enterpriseMetrics: { totalProcurementVolume: volume, totalEnterpriseSpend: spend, enterpriseFinancialExposure: 0, openExposure: 0, resolvedExposure: 0, preventedLosses: 0, organizationWideExceptionRate: excRate, averageEnterpriseProcessingTimeDays: 0, averageEnterpriseResolutionTimeDays: 0, auditProductivity: 0, processCompliance: 1 },
    compositionMetrics: { topVendorSpendPercentage: 0, vendorConcentration: vendorConc, departmentConcentration: deptConc, vendorSpendDistribution: [], departmentVolumeDistribution: [] },
    trendMetrics: { crossEnterpriseExceptionTrend: excTrend, enterpriseExposureTrend: "STABLE", deterioratingVendorCount: 0, improvingVendorCount: 0, deterioratingDepartmentCount: 0, improvingDepartmentCount: 0 },
    metadata: { generatedAt: NOW, reportingWindowDays: 30, vendorProfilesAnalyzed: 10, departmentProfilesAnalyzed: 5, profileVersion: "1.0", dataCompleteness: 1 }
  } as OrganizationIntelligenceProfile;
}

function createMockVendor(id: string, spend: number, trend: "IMPROVING"|"DETERIORATING"|"STABLE", excRate: number): VendorIntelligenceProfile {
  return {
    vendorId: id,
    lastUpdated: NOW,
    vendorRiskScore: 0,
    performance: { totalTransactions: 10, transactionFrequencyPerMonth: 1, invoiceAccuracy: 1 },
    exceptions: { totalExceptions: 0, exceptionRate: excRate, quantityMismatchCount: 0, priceVarianceCount: 0, duplicateInvoiceCount: 0, missingInvoiceCount: 0, missingGrnCount: 0 },
    financials: { totalPurchaseValue: spend, averageInvoiceValue: spend/10, averageTransactionValue: spend/10, totalFinancialExposure: 0, averageFinancialExposure: 0, maxExposure: 0, exposureTrend: "STABLE" },
    trends: { rolling30DayVolume: 0, rolling60DayVolume: 0, rolling90DayVolume: 0, overallTrend: trend },
    operations: { averagePaymentDelay: 0, averageResolutionTime: 0, resolutionSuccessRate: 1 }
  };
}

function createMockDepartment(id: string, trend: "IMPROVING"|"DETERIORATING"|"STABLE", excRate: number): DepartmentIntelligenceProfile {
  return {
    departmentId: id,
    lastUpdated: NOW,
    departmentRiskScore: 0,
    operations: { totalTransactions: 10, averageProcessingTimeDays: 2, averageApprovalTimeDays: 1, averageResolutionTimeDays: 5 },
    exceptions: { totalExceptions: 0, exceptionRate: excRate, highRiskTransactionCount: 0, uniqueExceptionPatterns: [] },
    financials: { totalSpend: 1000, averageSpend: 100, totalFinancialExposure: 0, averageFinancialExposure: 0, exposureTrend: "STABLE" },
    trends: { rolling30DayVolume: 0, rolling60DayVolume: 0, rolling90DayVolume: 0, overallTrend: trend },
    performance: { transactionThroughputPerMonth: 10, processingTimeVariance: 0, resolutionTimeVariance: 0 }
  };
}

function runExecutiveIntelligenceTests() {
  console.log("=== EXECUTIVE INTELLIGENCE LAYER VALIDATION ===");
  const svc = new ExecutiveIntelligenceService();

  // Scenario 1: Small/Zero-Volume Organization
  const org1 = createMockOrg(0, 0, 0, "LOW", "LOW", "STABLE");
  const p1 = svc.buildExecutiveProfile(org1, [], [], [], "30D");
  assert(p1.executiveSummary.totalEnterpriseSpend === 0, "Zero volume org has 0 spend");
  assert(p1.portfolioView.vendorPortfolioSummary.totalActiveVendors === 10, "Vendor portfolio summary extracted");
  assert(p1.metadata.dataCompleteness === 0.0, "Empty vendors/depts leads to 0 completeness");

  // Scenario 2: Large Stable Organization
  const org2 = createMockOrg(5000000, 1000, 0.05, "LOW", "LOW", "STABLE");
  const v1 = createMockVendor("V-1", 1000000, "STABLE", 0.01);
  const v2 = createMockVendor("V-2", 2000000, "STABLE", 0.05);
  const d1 = createMockDepartment("D-1", "STABLE", 0.04);
  const p2 = svc.buildExecutiveProfile(org2, [v1, v2], [d1], [], "30D");
  assert(p2.executiveSummary.totalEnterpriseSpend === 5000000, "Total spend correctly pulled from org profile");
  assert(p2.executiveSummary.globalExceptionRate === 0.05, "Global exception rate mapped correctly");
  assert(p2.strategicIndicators.enterpriseTrend === "STABLE", "Enterprise trend mapped");
  assert(p2.strategicIndicators.operationalStability === "HIGH", "Low exception rate + stable trend = HIGH stability");
  assert(p2.metadata.dataCompleteness === 1.0, "Data is complete");

  // Scenario 3: High-Risk Organization
  const org3 = createMockOrg(10000000, 5000, 0.25, "HIGH", "MEDIUM", "DETERIORATING");
  const v3 = createMockVendor("V-3", 8000000, "DETERIORATING", 0.3); // High risk vendor
  const v4 = createMockVendor("V-4", 1000000, "IMPROVING", 0.05); // Low risk vendor
  const d2 = createMockDepartment("D-2", "DETERIORATING", 0.25); // High risk dept
  const p3 = svc.buildExecutiveProfile(org3, [v3, v4], [d2], [], "30D");
  
  assert(p3.strategicIndicators.operationalStability === "LOW", "Deteriorating trend = LOW stability");
  assert(p3.strategicIndicators.highestRiskVendors.length === 1, "Only 1 high risk vendor selected");
  assert(p3.strategicIndicators.highestRiskVendors[0].id === "V-3", "Highest risk vendor correctly identified");
  assert(p3.strategicIndicators.highestRiskDepartments.length === 1, "Only 1 high risk dept selected");
  assert(p3.strategicIndicators.highestRiskDepartments[0].id === "D-2", "Highest risk dept correctly identified");
  
  assert(p3.portfolioView.vendorPortfolioSummary.concentrationRisk === "HIGH", "Vendor concentration correctly mapped");

  console.log("\nAll Executive Intelligence Scenarios Passed successfully.\n");
}

runExecutiveIntelligenceTests();
