import { ExecutiveIntelligenceProfile } from './executiveIntelligence';

export function getMockExecutiveProfile(): ExecutiveIntelligenceProfile {
  return {
    executiveSummary: {
      totalEnterpriseSpend: 2500000,
      totalEnterpriseExposure: 125000,
      totalProcurementVolume: 850,
      globalExceptionRate: 0.15
    },
    strategicIndicators: {
      highestRiskVendors: [
        { id: "V-102", name: "Global Logistics Inc.", riskScore: 88 },
        { id: "V-305", name: "TechCorp Supplies", riskScore: 76 },
        { id: "V-099", name: "Acme Industrial", riskScore: 65 }
      ],
      highestRiskDepartments: [
        { id: "D-001", riskScore: 82 },
        { id: "D-004", riskScore: 71 }
      ],
      enterpriseTrend: "IMPROVING",
      operationalStability: "MEDIUM",
      complianceIndicators: {
        processCompliance: 85.5,
        globalExceptionRate: 0.15
      }
    },
    portfolioView: {
      vendorPortfolioSummary: {
        totalActiveVendors: 45,
        concentrationRisk: "MEDIUM"
      },
      departmentPortfolioSummary: {
        totalActiveDepartments: 8,
        concentrationRisk: "LOW"
      }
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      reportingWindow: "30_DAYS",
      intelligenceVersion: "3.0.0",
      sourceProfiles: {
        vendorCount: 45,
        departmentCount: 8,
        assessmentsCount: 850
      },
      dataCompleteness: 0.85
    }
  };
}
