import type { DetectedException } from "@/lib/exceptionEngine";
import type { ExceptionRiskScore } from "@/lib/exceptionRisk";
import type { ExtractedDocumentData } from "@/lib/extractor";

export interface PrioritizedException {
  exception: DetectedException;
  baseRiskScore: number;
  complianceScore: number;
  vendorScore: number;
  transactionScore: number;
  finalPriorityScore: number;
}

const COMPLIANCE_WEIGHTS: Record<string, number> = {
  "Duplicate Invoice": 100,
  "Missing Invoice": 80,
  "Missing GRN": 60,
  "Price Variance": 40,
  "Quantity Mismatch": 40,
  "Timeline Deviation": 20,
};

const VENDOR_MOCK_REGISTRY: Record<string, number> = {
  "TechCorp": 5,
  "Global Supplies": 4,
  "ABC Industries": 3, // In fixture data, vendor is ABC Industries
  "ABC Manufacturing": 3,
};

export function prioritizeExceptions(
  exceptions: DetectedException[],
  exceptionRisks: ExceptionRiskScore[],
  vendorInvoiceData: ExtractedDocumentData
): PrioritizedException[] {
  const vendorName = vendorInvoiceData?.vendorName || "";
  const totalAmount = vendorInvoiceData?.totalAmount || 0;

  const vendorMultiplier = VENDOR_MOCK_REGISTRY[vendorName] || 1;

  let transactionScore = 0;
  if (totalAmount > 100000) transactionScore = 30;
  else if (totalAmount > 50000) transactionScore = 20;
  else if (totalAmount > 10000) transactionScore = 10;

  const prioritizedQueue = exceptions.map((ex) => {
    const riskData = exceptionRisks.find((r) => r.type === ex.type);
    const baseRiskScore = riskData ? riskData.score : 0;

    const complianceScore = COMPLIANCE_WEIGHTS[ex.type] || 0;
    const vendorScore = vendorMultiplier * 10;

    const finalPriorityScore = baseRiskScore + complianceScore + vendorScore + transactionScore;

    return {
      exception: ex,
      baseRiskScore,
      complianceScore,
      vendorScore,
      transactionScore,
      finalPriorityScore,
    };
  });

  prioritizedQueue.sort((a, b) => b.finalPriorityScore - a.finalPriorityScore);

  return prioritizedQueue;
}
