// ============================================================================
// Vendor Intelligence Layer - Blueprint V3, Section 13.4
// ============================================================================
// This layer is responsible for producing objective facts about a vendor's
// historical performance based purely on raw transaction data. It DOES NOT
// compute judgments, risks, or compliance scores.
// ============================================================================

export interface RawVendorTransaction {
  transactionId: string;
  vendorId: string;
  date: string; // ISO 8601 string
  invoiceValue: number;
  financialExposure: number;
  exceptionCategories: string[]; // e.g., 'PRICE_VARIANCE', 'QUANTITY_MISMATCH'
  paymentDelayDays?: number;
  resolutionTimeDays?: number;
  resolutionSuccess?: boolean;
}

export interface VendorPerformanceMetrics {
  totalTransactions: number;
  transactionFrequencyPerMonth: number;
  invoiceAccuracy: number;
}

export interface VendorFinancialMetrics {
  totalPurchaseValue: number;
  averageInvoiceValue: number;
  averageTransactionValue: number;
  totalFinancialExposure: number;
  averageFinancialExposure: number;
  maxExposure: number;
  exposureTrend: "INCREASING" | "DECREASING" | "STABLE";
}

export interface VendorExceptionSummary {
  totalExceptions: number;
  exceptionRate: number;
  quantityMismatchCount: number;
  priceVarianceCount: number;
  duplicateInvoiceCount: number;
  missingInvoiceCount: number;
  missingGrnCount: number;
}

export interface VendorTrendMetrics {
  rolling30DayVolume: number;
  rolling60DayVolume: number;
  rolling90DayVolume: number;
  overallTrend: "IMPROVING" | "DETERIORATING" | "STABLE";
}

export interface VendorOperationalMetrics {
  averagePaymentDelay: number;
  averageResolutionTime: number;
  resolutionSuccessRate: number;
}

export interface VendorIntelligenceProfile {
  vendorId: string;
  lastUpdated: string;
  vendorRiskScore: number;
  performance: VendorPerformanceMetrics;
  exceptions: VendorExceptionSummary;
  financials: VendorFinancialMetrics;
  trends: VendorTrendMetrics;
  operations: VendorOperationalMetrics;
}

export class VendorIntelligenceService {
  /**
   * Orchestrates internal analyzers to build a comprehensive, objective profile.
   * @param vendorId The unique identifier of the vendor.
   * @param transactions The raw historical transactions for the vendor.
   * @returns VendorIntelligenceProfile containing purely objective historical facts.
   */
  public buildVendorProfile(vendorId: string, transactions: RawVendorTransaction[]): VendorIntelligenceProfile {
    // Sort transactions chronologically
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const performance = this.analyzeTransactions(sortedTxs);
    const exceptions = this.analyzeExceptions(sortedTxs);
    const financials = this.analyzeFinancials(sortedTxs);
    const trends = this.analyzeTrends(sortedTxs);
    const operations = this.analyzeOperations(sortedTxs);
    
    // Calculate Vendor Risk Score (1-100) based on multiple factors
    // 0 is perfectly safe, 100 is extremely risky.
    let riskScore = 0;
    riskScore += exceptions.exceptionRate * 40; // up to 40 points from exception rate
    if (operations.averagePaymentDelay > 30) riskScore += 10;
    if (financials.exposureTrend === "INCREASING") riskScore += 15;
    if (operations.resolutionSuccessRate < 0.8) riskScore += 20;
    if (performance.invoiceAccuracy < 0.9) riskScore += 15;
    
    const vendorRiskScore = Math.min(100, Math.round(riskScore));

    return {
      vendorId,
      lastUpdated: new Date().toISOString(),
      vendorRiskScore,
      performance,
      exceptions,
      financials,
      trends,
      operations
    };
  }

  private analyzeTransactions(transactions: RawVendorTransaction[]): VendorPerformanceMetrics {
    const totalTransactions = transactions.length;
    let transactionFrequencyPerMonth = 0;

    if (totalTransactions > 1) {
      const firstDate = new Date(transactions[0].date).getTime();
      const lastDate = new Date(transactions[totalTransactions - 1].date).getTime();
      const daysDiff = (lastDate - firstDate) / (1000 * 3600 * 24);
      if (daysDiff > 0) {
        const months = daysDiff / 30;
        transactionFrequencyPerMonth = totalTransactions / months;
      } else {
        transactionFrequencyPerMonth = totalTransactions;
      }
    } else {
      transactionFrequencyPerMonth = totalTransactions;
    }

    const invoiceAccuracy = totalTransactions > 0 
      ? 1 - (transactions.filter(tx => tx.exceptionCategories && tx.exceptionCategories.length > 0).length / totalTransactions)
      : 1;

    return {
      totalTransactions,
      transactionFrequencyPerMonth,
      invoiceAccuracy
    };
  }

  private analyzeExceptions(transactions: RawVendorTransaction[]): VendorExceptionSummary {
    const totalTransactions = transactions.length;
    let totalExceptions = 0;
    let quantityMismatchCount = 0;
    let priceVarianceCount = 0;
    let duplicateInvoiceCount = 0;
    let missingInvoiceCount = 0;
    let missingGrnCount = 0;

    for (const tx of transactions) {
      if (tx.exceptionCategories && tx.exceptionCategories.length > 0) {
        totalExceptions += tx.exceptionCategories.length;
        
        for (const cat of tx.exceptionCategories) {
          const upperCat = cat.toUpperCase();
          if (upperCat === 'QUANTITY_MISMATCH') quantityMismatchCount++;
          else if (upperCat === 'PRICE_VARIANCE') priceVarianceCount++;
          else if (upperCat === 'DUPLICATE_INVOICE') duplicateInvoiceCount++;
          else if (upperCat === 'MISSING_INVOICE') missingInvoiceCount++;
          else if (upperCat === 'MISSING_GRN') missingGrnCount++;
        }
      }
    }

    const exceptionRate = totalTransactions > 0 ? (totalExceptions / totalTransactions) : 0;

    return {
      totalExceptions,
      exceptionRate,
      quantityMismatchCount,
      priceVarianceCount,
      duplicateInvoiceCount,
      missingInvoiceCount,
      missingGrnCount
    };
  }

  private analyzeFinancials(transactions: RawVendorTransaction[]): VendorFinancialMetrics {
    const totalTransactions = transactions.length;
    let totalPurchaseValue = 0;
    let totalFinancialExposure = 0;
    let maxExposure = 0;

    for (const tx of transactions) {
      totalPurchaseValue += tx.invoiceValue || 0;
      const exposure = tx.financialExposure || 0;
      totalFinancialExposure += exposure;
      if (exposure > maxExposure) {
        maxExposure = exposure;
      }
    }

    const averageInvoiceValue = totalTransactions > 0 ? (totalPurchaseValue / totalTransactions) : 0;
    const averageTransactionValue = averageInvoiceValue; // 1-to-1 mapping in this context
    const averageFinancialExposure = totalTransactions > 0 ? (totalFinancialExposure / totalTransactions) : 0;

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
      totalPurchaseValue,
      averageInvoiceValue,
      averageTransactionValue,
      totalFinancialExposure,
      averageFinancialExposure,
      maxExposure,
      exposureTrend
    };
  }

  private analyzeTrends(transactions: RawVendorTransaction[]): VendorTrendMetrics {
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

    // Determine overall trend based on exception rate over time
    let overallTrend: "IMPROVING" | "DETERIORATING" | "STABLE" = "STABLE";
    
    if (transactions.length > 1) {
      const midpoint = Math.floor(transactions.length / 2);
      const firstHalf = transactions.slice(0, midpoint);
      const secondHalf = transactions.slice(midpoint);
      
      const firstRate = firstHalf.reduce((sum, tx) => sum + (tx.exceptionCategories?.length || 0), 0) / firstHalf.length;
      const secondRate = secondHalf.reduce((sum, tx) => sum + (tx.exceptionCategories?.length || 0), 0) / secondHalf.length;
      
      // If exceptions went down, vendor is IMPROVING
      if (secondRate < firstRate - 0.1) overallTrend = "IMPROVING";
      // If exceptions went up, vendor is DETERIORATING
      else if (secondRate > firstRate + 0.1) overallTrend = "DETERIORATING";
    }

    return {
      rolling30DayVolume: rolling30,
      rolling60DayVolume: rolling60,
      rolling90DayVolume: rolling90,
      overallTrend
    };
  }

  private analyzeOperations(transactions: RawVendorTransaction[]): VendorOperationalMetrics {
    let delayCount = 0;
    let totalDelay = 0;
    let resolutionCount = 0;
    let totalResolutionTime = 0;
    let successCount = 0;

    for (const tx of transactions) {
      if (typeof tx.paymentDelayDays === 'number') {
        delayCount++;
        totalDelay += tx.paymentDelayDays;
      }
      if (typeof tx.resolutionTimeDays === 'number') {
        resolutionCount++;
        totalResolutionTime += tx.resolutionTimeDays;
      }
      if (tx.resolutionSuccess === true) {
        successCount++;
      }
    }

    return {
      averagePaymentDelay: delayCount > 0 ? (totalDelay / delayCount) : 0,
      averageResolutionTime: resolutionCount > 0 ? (totalResolutionTime / resolutionCount) : 0,
      resolutionSuccessRate: resolutionCount > 0 ? (successCount / resolutionCount) : (transactions.length > 0 ? 1 : 0)
    };
  }
}
