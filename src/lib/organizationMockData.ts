export const organizationMockData = {
  organizationId: "ORG-GLOBAL",
  enterpriseMetrics: {
    totalProcurementVolume: 8500,
    totalEnterpriseSpend: 25000000,
    enterpriseFinancialExposure: 1250000,
    openExposure: 750000,
    resolvedExposure: 500000,
    preventedLosses: 400000,
    organizationWideExceptionRate: 0.12,
    averageEnterpriseProcessingTimeDays: 4.5,
    averageEnterpriseResolutionTimeDays: 14.2,
    auditProductivity: 88,
    processCompliance: 92
  },
  trendMetrics: {
    deterioratingVendorCount: 15,
    improvingVendorCount: 45,
    deterioratingDepartmentCount: 2,
    improvingDepartmentCount: 6,
    crossEnterpriseExceptionTrend: "IMPROVING",
    enterpriseExposureTrend: "DECREASING"
  },
  compositionMetrics: {
    topVendorSpendPercentage: 45,
    vendorConcentration: "MEDIUM",
    departmentConcentration: "LOW",
  }
};
