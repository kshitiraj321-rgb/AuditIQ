import { OrganizationalIntelligenceService } from "../src/lib/organizationIntelligence";
import { VendorIntelligenceProfile } from "../src/lib/vendorIntelligence";
import { DepartmentIntelligenceProfile } from "../src/lib/departmentIntelligence";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

const NOW = new Date().toISOString();

function createMockVendor(id: string, spend: number, trend: "IMPROVING"|"DETERIORATING"|"STABLE"): VendorIntelligenceProfile {
  return {
    vendorId: id,
    lastUpdated: NOW,
    vendorRiskScore: 0,
    performance: { totalTransactions: 10, transactionFrequencyPerMonth: 1, invoiceAccuracy: 1 },
    exceptions: { totalExceptions: 0, exceptionRate: 0, quantityMismatchCount: 0, priceVarianceCount: 0, duplicateInvoiceCount: 0, missingInvoiceCount: 0, missingGrnCount: 0 },
    financials: { totalPurchaseValue: spend, averageInvoiceValue: spend/10, averageTransactionValue: spend/10, totalFinancialExposure: 0, averageFinancialExposure: 0, maxExposure: 0, exposureTrend: "STABLE" },
    trends: { rolling30DayVolume: 0, rolling60DayVolume: 0, rolling90DayVolume: 0, overallTrend: trend },
    operations: { averagePaymentDelay: 0, averageResolutionTime: 0, resolutionSuccessRate: 1 }
  };
}

function createMockDepartment(id: string, vol: number, exc: number, trend: "IMPROVING"|"DETERIORATING"|"STABLE", expTrend: "INCREASING"|"DECREASING"|"STABLE"): DepartmentIntelligenceProfile {
  return {
    departmentId: id,
    lastUpdated: NOW,
    departmentRiskScore: vol > 0 ? exc / vol : 0,
    operations: { totalTransactions: vol, averageProcessingTimeDays: 2, averageApprovalTimeDays: 1, averageResolutionTimeDays: 5 },
    exceptions: { totalExceptions: exc, exceptionRate: vol>0 ? exc/vol : 0, highRiskTransactionCount: 0, uniqueExceptionPatterns: [] },
    financials: { totalSpend: vol * 100, averageSpend: 100, totalFinancialExposure: exc * 50, averageFinancialExposure: 50, exposureTrend: expTrend },
    trends: { rolling30DayVolume: 0, rolling60DayVolume: 0, rolling90DayVolume: 0, overallTrend: trend },
    performance: { transactionThroughputPerMonth: vol, processingTimeVariance: 0, resolutionTimeVariance: 0 }
  };
}

function runOrganizationIntelligenceTests() {
  console.log("=== ORGANIZATIONAL INTELLIGENCE LAYER VALIDATION ===");

  const service = new OrganizationalIntelligenceService();

  // 1. Small/New Organization
  const orgNew = service.buildOrganizationProfile("ORG-NEW", [], []);
  assert(orgNew.enterpriseMetrics.totalProcurementVolume === 0, "New Org: 0 volume");
  assert(orgNew.enterpriseMetrics.organizationWideExceptionRate === 0, "New Org: 0 exception rate");
  assert(orgNew.metadata.dataCompleteness === 1.0, "New Org: Metadata populated");

  // 2. High-volume Organization with Single Dominant Vendor/Department
  const v1 = createMockVendor("V1", 8000, "STABLE");
  const v2 = createMockVendor("V2", 2000, "STABLE");
  
  const d1 = createMockDepartment("D1", 80, 8, "DETERIORATING", "INCREASING");
  const d2 = createMockDepartment("D2", 20, 2, "IMPROVING", "DECREASING");

  const orgHighVol = service.buildOrganizationProfile("ORG-HIGH", [v1, v2], [d1, d2]);
  
  // Enterprise
  assert(orgHighVol.enterpriseMetrics.totalProcurementVolume === 100, "HighVol Org: 100 volume");
  assert(orgHighVol.enterpriseMetrics.totalEnterpriseSpend === 10000, "HighVol Org: 10000 spend");
  assert(orgHighVol.enterpriseMetrics.organizationWideExceptionRate === 0.1, "HighVol Org: 10% exception rate");
  
  // Composition
  assert(orgHighVol.compositionMetrics.topVendorSpendPercentage === 0.8, "Composition: Top vendor 80% spend");
  assert(orgHighVol.compositionMetrics.vendorConcentration === "HIGH", "Composition: Vendor concentration HIGH");
  assert(orgHighVol.compositionMetrics.departmentConcentration === "HIGH", "Composition: Department concentration HIGH");
  
  // Trends
  assert(orgHighVol.trendMetrics.deterioratingDepartmentCount === 1, "Trends: 1 deteriorating department");
  assert(orgHighVol.trendMetrics.crossEnterpriseExceptionTrend === "STABLE", "Trends: Exception trend STABLE (1 imp, 1 det)");
  assert(orgHighVol.trendMetrics.enterpriseExposureTrend === "STABLE", "Trends: Exposure trend STABLE (1 inc, 1 dec)");

  // 3. Organization Deteriorating
  const orgDet = service.buildOrganizationProfile("ORG-DET", [
    createMockVendor("V1", 1000, "DETERIORATING"),
    createMockVendor("V2", 1000, "DETERIORATING")
  ], [
    createMockDepartment("D1", 50, 10, "DETERIORATING", "INCREASING"),
    createMockDepartment("D2", 50, 10, "DETERIORATING", "INCREASING")
  ]);

  assert(orgDet.trendMetrics.deterioratingVendorCount === 2, "DetOrg: 2 deteriorating vendors");
  assert(orgDet.trendMetrics.crossEnterpriseExceptionTrend === "DETERIORATING", "DetOrg: Exception trend DETERIORATING");
  assert(orgDet.trendMetrics.enterpriseExposureTrend === "INCREASING", "DetOrg: Exposure trend INCREASING");
  assert(orgDet.compositionMetrics.vendorConcentration === "MEDIUM", "DetOrg: Vendor concentration MEDIUM (50% top vendor)");

  // 4. Organization Improving
  const orgImp = service.buildOrganizationProfile("ORG-IMP", [
    createMockVendor("V1", 1000, "IMPROVING"),
    createMockVendor("V2", 1000, "IMPROVING")
  ], [
    createMockDepartment("D1", 50, 1, "IMPROVING", "DECREASING"),
    createMockDepartment("D2", 50, 1, "IMPROVING", "DECREASING")
  ]);

  assert(orgImp.trendMetrics.improvingVendorCount === 2, "ImpOrg: 2 improving vendors");
  assert(orgImp.trendMetrics.crossEnterpriseExceptionTrend === "IMPROVING", "ImpOrg: Exception trend IMPROVING");
  assert(orgImp.trendMetrics.enterpriseExposureTrend === "DECREASING", "ImpOrg: Exposure trend DECREASING");

  console.log("\nAll Organizational Intelligence Scenarios Passed successfully.");
}

runOrganizationIntelligenceTests();
