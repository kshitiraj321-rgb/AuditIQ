import {
  VendorIntelligenceService,
  RawVendorTransaction,
  VendorIntelligenceProfile
} from "../src/lib/vendorIntelligence";

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

function runVendorIntelligenceTests() {
  console.log("=== VENDOR INTELLIGENCE LAYER VALIDATION ===");

  const service = new VendorIntelligenceService();

  // 1. Brand New Vendor
  const newVendorProfile = service.buildVendorProfile("V-NEW", []);
  assert(newVendorProfile.performance.totalTransactions === 0, "New Vendor: 0 transactions");
  assert(newVendorProfile.exceptions.totalExceptions === 0, "New Vendor: 0 exceptions");
  assert(newVendorProfile.financials.totalPurchaseValue === 0, "New Vendor: 0 purchase value");
  assert(newVendorProfile.trends.overallTrend === "STABLE", "New Vendor: STABLE trend");

  // 2. Trusted Vendor (High volume, 0 exceptions)
  const trustedTxs: RawVendorTransaction[] = [
    { transactionId: "T1", vendorId: "V-TRUST", date: daysAgo(10), invoiceValue: 1000, financialExposure: 0, exceptionCategories: [], paymentDelayDays: 0, resolutionTimeDays: 0, resolutionSuccess: true },
    { transactionId: "T2", vendorId: "V-TRUST", date: daysAgo(20), invoiceValue: 1000, financialExposure: 0, exceptionCategories: [], paymentDelayDays: 0, resolutionTimeDays: 0, resolutionSuccess: true },
    { transactionId: "T3", vendorId: "V-TRUST", date: daysAgo(40), invoiceValue: 1500, financialExposure: 0, exceptionCategories: [], paymentDelayDays: 2, resolutionTimeDays: 0, resolutionSuccess: true }
  ];
  const trustedProfile = service.buildVendorProfile("V-TRUST", trustedTxs);
  assert(trustedProfile.performance.totalTransactions === 3, "Trusted Vendor: 3 transactions");
  assert(trustedProfile.exceptions.totalExceptions === 0, "Trusted Vendor: 0 exceptions");
  assert(trustedProfile.financials.totalPurchaseValue === 3500, "Trusted Vendor: 3500 purchase value");
  assert(trustedProfile.financials.averageInvoiceValue === 1166.6666666666667, "Trusted Vendor: average invoice value correct");
  assert(trustedProfile.trends.rolling30DayVolume === 2, "Trusted Vendor: 2 transactions in last 30 days");
  assert(trustedProfile.trends.rolling60DayVolume === 1, "Trusted Vendor: 1 transaction 30-60 days ago");
  assert(trustedProfile.operations.averagePaymentDelay === (2/3), "Trusted Vendor: average payment delay calculated");
  assert(trustedProfile.trends.overallTrend === "STABLE", "Trusted Vendor: Stable trend (0 exceptions)");

  // 3. Deteriorating Vendor (increasing exceptions)
  const deterioratingTxs: RawVendorTransaction[] = [
    { transactionId: "T1", vendorId: "V-DET", date: daysAgo(60), invoiceValue: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T2", vendorId: "V-DET", date: daysAgo(50), invoiceValue: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T3", vendorId: "V-DET", date: daysAgo(20), invoiceValue: 100, financialExposure: 100, exceptionCategories: ["PRICE_VARIANCE"] },
    { transactionId: "T4", vendorId: "V-DET", date: daysAgo(10), invoiceValue: 100, financialExposure: 200, exceptionCategories: ["QUANTITY_MISMATCH", "MISSING_GRN"] }
  ];
  const detProfile = service.buildVendorProfile("V-DET", deterioratingTxs);
  assert(detProfile.exceptions.totalExceptions === 3, "Deteriorating Vendor: 3 total exceptions");
  assert(detProfile.exceptions.exceptionRate === 0.75, "Deteriorating Vendor: Exception rate 75%");
  assert(detProfile.exceptions.priceVarianceCount === 1, "Deteriorating Vendor: Price variance count 1");
  assert(detProfile.exceptions.missingGrnCount === 1, "Deteriorating Vendor: Missing GRN count 1");
  assert(detProfile.trends.overallTrend === "DETERIORATING", "Deteriorating Vendor: Trend correctly marked DETERIORATING");
  assert(detProfile.financials.exposureTrend === "INCREASING", "Deteriorating Vendor: Financial exposure trend INCREASING");
  
  // 4. Duplicate-heavy Vendor
  const dupTxs: RawVendorTransaction[] = [
    { transactionId: "T1", vendorId: "V-DUP", date: daysAgo(10), invoiceValue: 500, financialExposure: 500, exceptionCategories: ["DUPLICATE_INVOICE"] },
    { transactionId: "T2", vendorId: "V-DUP", date: daysAgo(10), invoiceValue: 500, financialExposure: 500, exceptionCategories: ["DUPLICATE_INVOICE"] },
    { transactionId: "T3", vendorId: "V-DUP", date: daysAgo(10), invoiceValue: 500, financialExposure: 500, exceptionCategories: ["DUPLICATE_INVOICE"] }
  ];
  const dupProfile = service.buildVendorProfile("V-DUP", dupTxs);
  assert(dupProfile.exceptions.duplicateInvoiceCount === 3, "Duplicate Vendor: 3 duplicate invoices counted correctly");

  // 5. Improving Vendor
  const impTxs: RawVendorTransaction[] = [
    { transactionId: "T1", vendorId: "V-IMP", date: daysAgo(60), invoiceValue: 100, financialExposure: 100, exceptionCategories: ["PRICE_VARIANCE", "MISSING_INVOICE"] },
    { transactionId: "T2", vendorId: "V-IMP", date: daysAgo(50), invoiceValue: 100, financialExposure: 50, exceptionCategories: ["QUANTITY_MISMATCH"] },
    { transactionId: "T3", vendorId: "V-IMP", date: daysAgo(20), invoiceValue: 100, financialExposure: 0, exceptionCategories: [] },
    { transactionId: "T4", vendorId: "V-IMP", date: daysAgo(10), invoiceValue: 100, financialExposure: 0, exceptionCategories: [] }
  ];
  const impProfile = service.buildVendorProfile("V-IMP", impTxs);
  assert(impProfile.trends.overallTrend === "IMPROVING", "Improving Vendor: Trend correctly marked IMPROVING");
  assert(impProfile.financials.exposureTrend === "DECREASING", "Improving Vendor: Exposure trend DECREASING");
  
  console.log("\nAll Vendor Intelligence Scenarios Passed successfully.");
}

runVendorIntelligenceTests();
