import { OrganizationIntelligenceProfile } from "./organizationIntelligence";
import { VendorIntelligenceProfile } from "./vendorIntelligence";
import { DepartmentIntelligenceProfile } from "./departmentIntelligence";
import { PredictiveRiskAssessment } from "./predictiveRiskEngine";

export interface ExecutiveIntelligenceProfile {
  executiveSummary: {
    totalEnterpriseSpend: number;
    totalEnterpriseExposure: number;
    totalProcurementVolume: number;
    globalExceptionRate: number;
  };
  strategicIndicators: {
    highestRiskVendors: { id: string, name: string, riskScore: number }[];
    highestRiskDepartments: { id: string, riskScore: number }[];
    enterpriseTrend: "IMPROVING" | "DETERIORATING" | "STABLE";
    operationalStability: "HIGH" | "MEDIUM" | "LOW";
    complianceIndicators: {
      processCompliance: number;
      globalExceptionRate: number;
    };
  };
  portfolioView: {
    vendorPortfolioSummary: {
      totalActiveVendors: number;
      concentrationRisk: "HIGH" | "MEDIUM" | "LOW";
    };
    departmentPortfolioSummary: {
      totalActiveDepartments: number;
      concentrationRisk: "HIGH" | "MEDIUM" | "LOW";
    };
  };
  metadata: {
    generatedAt: string;
    reportingWindow: string;
    intelligenceVersion: string;
    sourceProfiles: {
      vendorCount: number;
      departmentCount: number;
      assessmentsCount: number;
    };
    dataCompleteness: number;
  };
}

export class ExecutiveIntelligenceService {
  public buildExecutiveProfile(
    orgProfile: OrganizationIntelligenceProfile,
    vendorProfiles: VendorIntelligenceProfile[],
    departmentProfiles: DepartmentIntelligenceProfile[],
    recentAssessments: PredictiveRiskAssessment[],
    reportingWindow: string
  ): ExecutiveIntelligenceProfile {
    return {
      executiveSummary: this.buildSummary(orgProfile, vendorProfiles, departmentProfiles),
      strategicIndicators: this.buildStrategicIndicators(orgProfile, vendorProfiles, departmentProfiles),
      portfolioView: this.buildPortfolioView(orgProfile),
      metadata: this.buildMetadata(vendorProfiles, departmentProfiles, recentAssessments, reportingWindow),
    };
  }

  private buildSummary(
    org: OrganizationIntelligenceProfile,
    vendors: VendorIntelligenceProfile[],
    depts: DepartmentIntelligenceProfile[]
  ) {
    return {
      totalEnterpriseSpend: org.enterpriseMetrics.totalEnterpriseSpend,
      totalEnterpriseExposure: org.enterpriseMetrics.enterpriseFinancialExposure,
      totalProcurementVolume: org.enterpriseMetrics.totalProcurementVolume,
      globalExceptionRate: org.enterpriseMetrics.organizationWideExceptionRate,
    };
  }

  private buildStrategicIndicators(
    org: OrganizationIntelligenceProfile,
    vendors: VendorIntelligenceProfile[],
    depts: DepartmentIntelligenceProfile[]
  ) {
    const highestRiskVendors = vendors
      .filter(v => v.trends.overallTrend === "DETERIORATING" || v.exceptions.exceptionRate > 0.2 || v.vendorRiskScore > 50)
      .sort((a, b) => b.vendorRiskScore - a.vendorRiskScore)
      .slice(0, 5)
      .map(v => ({ id: v.vendorId, name: `Vendor ${v.vendorId}`, riskScore: v.vendorRiskScore }));

    const highestRiskDepartments = depts
      .filter(d => d.trends.overallTrend === "DETERIORATING" || d.exceptions.exceptionRate > 0.2 || d.departmentRiskScore > 50)
      .sort((a, b) => b.departmentRiskScore - a.departmentRiskScore)
      .slice(0, 5)
      .map(d => ({ id: d.departmentId, riskScore: d.departmentRiskScore }));

    let stability: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
    if (org.trendMetrics.crossEnterpriseExceptionTrend === "DETERIORATING" || org.compositionMetrics.vendorConcentration === "HIGH") {
      stability = "LOW";
    } else if (org.trendMetrics.crossEnterpriseExceptionTrend === "STABLE" && org.enterpriseMetrics.organizationWideExceptionRate > 0.1) {
      stability = "MEDIUM";
    }

    return {
      highestRiskVendors,
      highestRiskDepartments,
      enterpriseTrend: org.trendMetrics.crossEnterpriseExceptionTrend,
      operationalStability: stability,
      complianceIndicators: {
        processCompliance: org.enterpriseMetrics.processCompliance,
        globalExceptionRate: org.enterpriseMetrics.organizationWideExceptionRate,
      }
    };
  }

  private buildPortfolioView(org: OrganizationIntelligenceProfile) {
    return {
      vendorPortfolioSummary: {
        totalActiveVendors: org.metadata.vendorProfilesAnalyzed,
        concentrationRisk: org.compositionMetrics.vendorConcentration,
      },
      departmentPortfolioSummary: {
        totalActiveDepartments: org.metadata.departmentProfilesAnalyzed,
        concentrationRisk: org.compositionMetrics.departmentConcentration,
      },
    };
  }

  private buildMetadata(
    vendors: VendorIntelligenceProfile[],
    depts: DepartmentIntelligenceProfile[],
    assessments: PredictiveRiskAssessment[],
    reportingWindow: string
  ) {
    let dataCompleteness = 1.0;
    if (vendors.length === 0 || depts.length === 0) {
      dataCompleteness = 0.5;
    }
    if (vendors.length === 0 && depts.length === 0) {
      dataCompleteness = 0.0;
    }

    return {
      generatedAt: new Date().toISOString(),
      reportingWindow,
      intelligenceVersion: "3.1.0",
      sourceProfiles: {
        vendorCount: vendors.length,
        departmentCount: depts.length,
        assessmentsCount: assessments.length,
      },
      dataCompleteness,
    };
  }
}
