// ============================================================================
// Department Intelligence Layer - Blueprint V3, Section 13.5
// ============================================================================
// This layer is responsible for producing objective facts about a department's
// historical operations based purely on raw transaction data. It DOES NOT
// compute judgments, risks, compliance scores, or rankings.
// ============================================================================

export interface RawDepartmentTransaction {
  transactionId: string;
  departmentId: string;
  date: string; // ISO 8601 string
  spend: number;
  financialExposure: number;
  exceptionCategories: string[]; // e.g., 'POLICY_VIOLATION', 'MISSING_APPROVAL'
  isHighRisk?: boolean; // Flag if transaction was flagged as high risk historically
  processingTimeDays?: number;
  approvalTimeDays?: number;
  resolutionTimeDays?: number; // Time to resolve exceptions, if applicable
}

export interface DepartmentOperationalMetrics {
  totalTransactions: number;
  averageProcessingTimeDays: number;
  averageApprovalTimeDays: number;
  averageResolutionTimeDays: number;
}

export interface DepartmentPerformanceMetrics {
  transactionThroughputPerMonth: number;
  processingTimeVariance: number;
  resolutionTimeVariance: number;
}

export interface DepartmentExceptionSummary {
  totalExceptions: number;
  exceptionRate: number;
  highRiskTransactionCount: number;
  uniqueExceptionPatterns: string[];
}

export interface DepartmentFinancialMetrics {
  totalSpend: number;
  averageSpend: number;
  totalFinancialExposure: number;
  averageFinancialExposure: number;
  exposureTrend: "INCREASING" | "DECREASING" | "STABLE";
}

export interface DepartmentTrendMetrics {
  rolling30DayVolume: number;
  rolling60DayVolume: number;
  rolling90DayVolume: number;
  overallTrend: "IMPROVING" | "DETERIORATING" | "STABLE";
}

export interface DepartmentIntelligenceProfile {
  departmentId: string;
  lastUpdated: string;
  departmentRiskScore: number;
  operations: DepartmentOperationalMetrics;
  exceptions: DepartmentExceptionSummary;
  financials: DepartmentFinancialMetrics;
  trends: DepartmentTrendMetrics;
  performance: DepartmentPerformanceMetrics;
}

export class DepartmentIntelligenceService {
  /**
   * Orchestrates internal analyzers to build a comprehensive, objective departmental profile.
   * @param departmentId The unique identifier of the department.
   * @param transactions The raw historical transactions for the department.
   * @returns DepartmentIntelligenceProfile containing purely objective historical facts.
   */
  public buildDepartmentProfile(departmentId: string, transactions: RawDepartmentTransaction[]): DepartmentIntelligenceProfile {
    // Sort transactions chronologically
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const operations = this.analyzeOperations(sortedTxs);
    const exceptions = this.analyzeExceptions(sortedTxs);
    const financials = this.analyzeFinancials(sortedTxs);
    const trends = this.analyzeTrends(sortedTxs);
    const performance = this.analyzeThroughput(sortedTxs);

    // Calculate Department Risk Score (1-100) based on bottlenecks and exceptions
    let riskScore = 0;
    riskScore += exceptions.exceptionRate * 40;
    if (operations.averageProcessingTimeDays > 14) riskScore += 15;
    if (operations.averageResolutionTimeDays > 30) riskScore += 20;
    if (trends.overallTrend === "DETERIORATING") riskScore += 15;
    if (exceptions.highRiskTransactionCount > 5) riskScore += 10;

    const departmentRiskScore = Math.min(100, Math.round(riskScore));

    return {
      departmentId,
      lastUpdated: new Date().toISOString(),
      departmentRiskScore,
      operations,
      exceptions,
      financials,
      trends,
      performance
    };
  }

  private analyzeOperations(transactions: RawDepartmentTransaction[]): DepartmentOperationalMetrics {
    const totalTransactions = transactions.length;
    let procCount = 0, totalProcTime = 0;
    let appCount = 0, totalAppTime = 0;
    let resCount = 0, totalResTime = 0;

    for (const tx of transactions) {
      if (typeof tx.processingTimeDays === 'number') {
        procCount++;
        totalProcTime += tx.processingTimeDays;
      }
      if (typeof tx.approvalTimeDays === 'number') {
        appCount++;
        totalAppTime += tx.approvalTimeDays;
      }
      if (typeof tx.resolutionTimeDays === 'number') {
        resCount++;
        totalResTime += tx.resolutionTimeDays;
      }
    }

    return {
      totalTransactions,
      averageProcessingTimeDays: procCount > 0 ? (totalProcTime / procCount) : 0,
      averageApprovalTimeDays: appCount > 0 ? (totalAppTime / appCount) : 0,
      averageResolutionTimeDays: resCount > 0 ? (totalResTime / resCount) : 0
    };
  }

  private analyzeExceptions(transactions: RawDepartmentTransaction[]): DepartmentExceptionSummary {
    const totalTransactions = transactions.length;
    let totalExceptions = 0;
    let highRiskCount = 0;
    const exceptionSet = new Set<string>();

    for (const tx of transactions) {
      if (tx.exceptionCategories && tx.exceptionCategories.length > 0) {
        totalExceptions += tx.exceptionCategories.length;
        tx.exceptionCategories.forEach(cat => exceptionSet.add(cat));
      }
      if (tx.isHighRisk === true) {
        highRiskCount++;
      }
    }

    return {
      totalExceptions,
      exceptionRate: totalTransactions > 0 ? (totalExceptions / totalTransactions) : 0,
      highRiskTransactionCount: highRiskCount,
      uniqueExceptionPatterns: Array.from(exceptionSet).sort()
    };
  }

  private analyzeFinancials(transactions: RawDepartmentTransaction[]): DepartmentFinancialMetrics {
    const totalTransactions = transactions.length;
    let totalSpend = 0;
    let totalExposure = 0;

    for (const tx of transactions) {
      totalSpend += tx.spend || 0;
      totalExposure += tx.financialExposure || 0;
    }

    let exposureTrend: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";

    if (totalTransactions > 1) {
      const midpoint = Math.floor(totalTransactions / 2);
      const firstHalf = transactions.slice(0, midpoint);
      const secondHalf = transactions.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, tx) => sum + (tx.financialExposure || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, tx) => sum + (tx.financialExposure || 0), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg) exposureTrend = "INCREASING";
      else if (secondAvg < firstAvg) exposureTrend = "DECREASING";
    }

    return {
      totalSpend,
      averageSpend: totalTransactions > 0 ? (totalSpend / totalTransactions) : 0,
      totalFinancialExposure: totalExposure,
      averageFinancialExposure: totalTransactions > 0 ? (totalExposure / totalTransactions) : 0,
      exposureTrend
    };
  }

  private analyzeTrends(transactions: RawDepartmentTransaction[]): DepartmentTrendMetrics {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let rolling30 = 0;
    let rolling60 = 0;
    let rolling90 = 0;

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate >= thirtyDaysAgo) rolling30++;
      if (txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo) rolling60++;
      if (txDate >= ninetyDaysAgo && txDate < sixtyDaysAgo) rolling90++;
    }

    let overallTrend: "IMPROVING" | "DETERIORATING" | "STABLE" = "STABLE";
    
    if (transactions.length > 1) {
      const midpoint = Math.floor(transactions.length / 2);
      const firstHalf = transactions.slice(0, midpoint);
      const secondHalf = transactions.slice(midpoint);
      
      const firstRate = firstHalf.reduce((sum, tx) => sum + (tx.exceptionCategories?.length || 0), 0) / firstHalf.length;
      const secondRate = secondHalf.reduce((sum, tx) => sum + (tx.exceptionCategories?.length || 0), 0) / secondHalf.length;
      
      if (secondRate < firstRate) overallTrend = "IMPROVING";
      else if (secondRate > firstRate) overallTrend = "DETERIORATING";
    }

    return {
      rolling30DayVolume: rolling30,
      rolling60DayVolume: rolling60,
      rolling90DayVolume: rolling90,
      overallTrend
    };
  }

  private analyzeThroughput(transactions: RawDepartmentTransaction[]): DepartmentPerformanceMetrics {
    const totalTransactions = transactions.length;
    let throughput = 0;

    if (totalTransactions > 1) {
      const firstDate = new Date(transactions[0].date).getTime();
      const lastDate = new Date(transactions[totalTransactions - 1].date).getTime();
      const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
      if (daysDiff > 0) {
        const months = daysDiff / 30;
        throughput = totalTransactions / months;
      } else {
        throughput = totalTransactions;
      }
    } else {
      throughput = totalTransactions;
    }

    // Calculate Variance for Processing and Resolution Times
    let procCount = 0, totalProcTime = 0;
    let resCount = 0, totalResTime = 0;

    for (const tx of transactions) {
      if (typeof tx.processingTimeDays === 'number') {
        procCount++;
        totalProcTime += tx.processingTimeDays;
      }
      if (typeof tx.resolutionTimeDays === 'number') {
        resCount++;
        totalResTime += tx.resolutionTimeDays;
      }
    }

    const avgProc = procCount > 0 ? (totalProcTime / procCount) : 0;
    const avgRes = resCount > 0 ? (totalResTime / resCount) : 0;

    let procSumSquares = 0;
    let resSumSquares = 0;

    for (const tx of transactions) {
      if (typeof tx.processingTimeDays === 'number') {
        procSumSquares += Math.pow(tx.processingTimeDays - avgProc, 2);
      }
      if (typeof tx.resolutionTimeDays === 'number') {
        resSumSquares += Math.pow(tx.resolutionTimeDays - avgRes, 2);
      }
    }

    return {
      transactionThroughputPerMonth: throughput,
      processingTimeVariance: procCount > 1 ? (procSumSquares / (procCount - 1)) : 0, // Sample variance
      resolutionTimeVariance: resCount > 1 ? (resSumSquares / (resCount - 1)) : 0
    };
  }
}
