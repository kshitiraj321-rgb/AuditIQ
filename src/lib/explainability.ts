import type { DetectedException } from "@/lib/exceptionEngine";
import type { FinancialExposureResult } from "@/lib/financialExposure";
import type { MatchDocumentsResult } from "@/lib/matcher";
import type { RiskAssessmentResult } from "@/lib/riskEngine";

type ExtractedDocument = {
  vendor: string;
  documentNumber: string;
  date: string;
  quantity: number;
  unitPrice: number;
  amount: number;
} | null;

export type ExplainabilityInput = {
  matchResult: MatchDocumentsResult;
  exceptions: DetectedException[];
  financialExposure: FinancialExposureResult;
  risk: RiskAssessmentResult;
  recommendations: string[];
  extractedDocuments: {
    purchaseOrder: ExtractedDocument;
    goodsReceiptNote: ExtractedDocument;
    vendorInvoice: ExtractedDocument;
  };
};

export type ExplainabilityResult = {
  summary: string;
  explanations: string[];
};

function formatCurrency(amount: number) {
  return `₹${amount}`;
}

function describeQuantityMismatch(
  purchaseOrder: ExtractedDocument,
  goodsReceiptNote: ExtractedDocument,
  vendorInvoice: ExtractedDocument
) {
  if (!purchaseOrder || !goodsReceiptNote || !vendorInvoice) {
    return "Quantity Mismatch was detected, but one or more document quantities were unavailable for comparison.";
  }

  return `Purchase Order quantity is ${purchaseOrder.quantity} while Goods Receipt Note quantity is ${goodsReceiptNote.quantity} and Invoice quantity is ${vendorInvoice.quantity}. This indicates a discrepancy of ${Math.abs(purchaseOrder.quantity - goodsReceiptNote.quantity)} units between ordered and received goods.`;
}

function describePriceVariance(
  purchaseOrder: ExtractedDocument,
  goodsReceiptNote: ExtractedDocument,
  vendorInvoice: ExtractedDocument
) {
  if (!purchaseOrder || !goodsReceiptNote || !vendorInvoice) {
    return "Price Variance was detected, but one or more document prices were unavailable for comparison.";
  }

  return `Invoice unit price is ${vendorInvoice.unitPrice} while Purchase Order unit price is ${purchaseOrder.unitPrice} and Goods Receipt Note unit price is ${goodsReceiptNote.unitPrice}. The variance may require approval before payment.`;
}

function describeMissingInvoice() {
  return "Vendor Invoice was not provided. Without an invoice, payment cannot be validated against the purchase order and receipt.";
}

function describeMissingGRN() {
  return "Goods Receipt Note was not provided. Without proof of receipt, the invoice cannot be confirmed against received goods.";
}

function describeDuplicateInvoice(
  vendorInvoice: ExtractedDocument
) {
  if (!vendorInvoice) {
    return "A duplicate invoice was detected, but the invoice document number was unavailable.";
  }

  return `Invoice number ${vendorInvoice.documentNumber} was detected as a duplicate. This can lead to duplicate payment if not blocked.`;
}

function describeRecommendation(
  recommendation: string,
  exceptions: DetectedException[],
  financialExposure: FinancialExposureResult,
  risk: RiskAssessmentResult
) {
  if (
    recommendation ===
    "Review received quantity and reconcile with purchase order."
  ) {
    return `${recommendation} This was generated because a Quantity Mismatch was detected.`;
  }

  if (
    recommendation === "Review invoice pricing and obtain approval for variance."
  ) {
    return `${recommendation} This was generated because a Price Variance was detected.`;
  }

  if (recommendation === "Request invoice from vendor before payment.") {
    return `${recommendation} This was generated because a Missing Invoice exception was detected.`;
  }

  if (recommendation === "Confirm goods receipt before processing invoice.") {
    return `${recommendation} This was generated because a Missing GRN exception was detected.`;
  }

  if (recommendation === "Block payment and investigate duplicate invoice.") {
    return `${recommendation} This was generated because a Duplicate Invoice exception was detected.`;
  }

  if (recommendation === "Escalate to finance manager for review.") {
    return `${recommendation} This was generated because the risk level is ${risk.level}.`;
  }

  if (recommendation === "Hold payment until discrepancy is resolved.") {
    return `${recommendation} This was generated because total financial exposure is ${formatCurrency(financialExposure.totalExposure)}.`;
  }

  return `${recommendation} This was generated from the current exception and risk analysis.`;
}

export function generateExplainability({
  matchResult,
  exceptions,
  financialExposure,
  risk,
  recommendations,
  extractedDocuments,
}: ExplainabilityInput): ExplainabilityResult {
  const explanations: string[] = [];

  for (const exception of exceptions) {
    if (exception.type === "Quantity Mismatch") {
      explanations.push(
        describeQuantityMismatch(
          extractedDocuments.purchaseOrder,
          extractedDocuments.goodsReceiptNote,
          extractedDocuments.vendorInvoice
        )
      );
      continue;
    }

    if (exception.type === "Price Variance") {
      explanations.push(
        describePriceVariance(
          extractedDocuments.purchaseOrder,
          extractedDocuments.goodsReceiptNote,
          extractedDocuments.vendorInvoice
        )
      );
      continue;
    }

    if (exception.type === "Missing Invoice") {
      explanations.push(describeMissingInvoice());
      continue;
    }

    if (exception.type === "Missing GRN") {
      explanations.push(describeMissingGRN());
      continue;
    }

    if (exception.type === "Duplicate Invoice") {
      explanations.push(
        describeDuplicateInvoice(extractedDocuments.vendorInvoice)
      );
    }
  }

  const exposureParts = financialExposure.breakdown
    .map((item) => `${item.exception} (${formatCurrency(item.exposure)})`)
    .join(", ");
  explanations.push(
    `Total estimated financial exposure is ${formatCurrency(financialExposure.totalExposure)} based on detected discrepancies${exposureParts ? `: ${exposureParts}` : "."}`
  );

  explanations.push(
    `Risk level is ${risk.level} with a score of ${risk.score} because ${exceptions.length} exceptions were detected and financial exposure is ${formatCurrency(financialExposure.totalExposure)}.`
  );

  for (const recommendation of recommendations) {
    explanations.push(
      describeRecommendation(
        recommendation,
        exceptions,
        financialExposure,
        risk
      )
    );
  }

  const quantityMatches = [
    matchResult.quantityMatch.po,
    matchResult.quantityMatch.grn,
    matchResult.quantityMatch.invoice,
  ].filter((value): value is number => value !== null);
  const summary = `${exceptions.length} exceptions detected with ${formatCurrency(
    financialExposure.totalExposure
  )} exposure.`;

  if (quantityMatches.length === 0 && explanations.length === 0) {
    return {
      summary,
      explanations: ["No explainability data available."],
    };
  }

  return {
    summary,
    explanations,
  };
}
