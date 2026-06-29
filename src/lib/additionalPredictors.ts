import { 
  RiskPredictor, 
  PredictiveRiskInput, 
  PredictiveRiskConfig, 
  PredictorResult 
} from './predictiveRiskEngine';

export class PurchasePatternPredictor implements RiskPredictor {
  predictorId = "PurchasePatternPredictor";

  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    // Simple heuristic: if the current transaction's financial value is vastly different from historical average, flag risk
    const vendorHist = input.historicalTransactions.filter(t => t.vendorId === input.vendorProfile.vendorId);
    let score = 0;
    const reasons: any[] = [];
    const evidence: any[] = [];

    if (vendorHist.length > 0) {
      const avgValue = vendorHist.reduce((acc, t) => acc + t.totalExposure, 0) / vendorHist.length;
      if (avgValue > 0 && input.transactionSnapshot.financialValue > avgValue * 2) {
        score = 65;
        reasons.push({
          code: "UNUSUAL_PURCHASE_PATTERN",
          description: "Transaction value is significantly higher than historical averages for this vendor.",
          evidence: []
        });
        evidence.push({
          metric: "Purchase Pattern Ratio",
          historicalValue: avgValue,
          trend: "DETERIORATING",
          impactScore: score
        });
      }
    }

    return {
      predictorId: this.predictorId,
      score,
      confidence: 80,
      evidence,
      reasons
    };
  }
}

export class InvoiceTrendPredictor implements RiskPredictor {
  predictorId = "InvoiceTrendPredictor";

  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    // Check if the vendor's exception frequency is increasing
    let score = 0;
    const reasons: any[] = [];
    const evidence: any[] = [];

    if (input.vendorProfile.averageExceptionsPerMonth > 5) {
      score = 70;
      reasons.push({
        code: "NEGATIVE_INVOICE_TREND",
        description: "Vendor exhibits a high frequency of invoice exceptions.",
        evidence: []
      });
      evidence.push({
        metric: "Average Exceptions Per Month",
        historicalValue: input.vendorProfile.averageExceptionsPerMonth,
        trend: "DETERIORATING",
        impactScore: score
      });
    }

    return {
      predictorId: this.predictorId,
      score,
      confidence: 75,
      evidence,
      reasons
    };
  }
}

export class DuplicateInvoicePredictor implements RiskPredictor {
  predictorId = "DuplicateInvoicePredictor";

  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    // Predict duplicate likelihood if the vendor has a history of duplicates or high exposure
    let score = 0;
    const reasons: any[] = [];
    const evidence: any[] = [];

    if (input.vendorProfile.reliabilityScore < 50) {
      score = 85;
      reasons.push({
        code: "DUPLICATE_INVOICE_RISK",
        description: "Vendor's low reliability score indicates a high probability of duplicate invoice submission.",
        evidence: []
      });
      evidence.push({
        metric: "Vendor Reliability Score",
        historicalValue: input.vendorProfile.reliabilityScore,
        trend: "STABLE",
        impactScore: score
      });
    }

    return {
      predictorId: this.predictorId,
      score,
      confidence: 90,
      evidence,
      reasons
    };
  }
}

export class ComplianceExposurePredictor implements RiskPredictor {
  predictorId = "ComplianceExposurePredictor";

  evaluate(input: PredictiveRiskInput, config: PredictiveRiskConfig): PredictorResult | null {
    let score = 0;
    const reasons: any[] = [];
    const evidence: any[] = [];

    if (input.departmentProfile.complianceScore < 70) {
      score = 90;
      reasons.push({
        code: "COMPLIANCE_EXPOSURE_RISK",
        description: "Department historical compliance score is below acceptable thresholds.",
        evidence: []
      });
      evidence.push({
        metric: "Department Compliance Score",
        historicalValue: input.departmentProfile.complianceScore,
        trend: "STABLE",
        impactScore: score
      });
    }

    return {
      predictorId: this.predictorId,
      score,
      confidence: 85,
      evidence,
      reasons
    };
  }
}
