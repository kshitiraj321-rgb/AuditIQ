export type RootCauseDiagnosis = {
  exceptionType: string;
  rootCause: string;
  category: "System Failure" | "Business Mismatch" | "Administrative Error";
  confidence: "Proven" | "Inferred";
  evidence: string[];
};

export type RootCauseResult = RootCauseDiagnosis[];

export function calculateRootCauses(
  exceptions: { type: string; severity: string; message?: string }[],
  matchResult: any,
  extractionProvenance?: any
): RootCauseResult {
  const causes: RootCauseResult = [];

  for (const ex of exceptions) {
    if (ex.type === "Quantity Mismatch") {
      // Check for extraction failures
      const provPO = extractionProvenance?.purchaseOrder?.quantity;
      const provGRN = extractionProvenance?.goodsReceiptNote?.quantity;
      const provINV = extractionProvenance?.vendorInvoice?.quantity;

      if (provPO === "fallback" || provPO === "missing" || provGRN === "fallback" || provGRN === "missing" || provINV === "fallback" || provINV === "missing") {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Extraction Failure",
          category: "System Failure",
          confidence: "Proven",
          evidence: ["One or more documents had fallback or missing extraction provenance for quantity."],
        });
        continue;
      }

      const qPO = matchResult.quantityMatch?.po ?? 0;
      const qGRN = matchResult.quantityMatch?.grn ?? 0;

      if (qPO > qGRN) {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Partial Shipment",
          category: "Business Mismatch",
          confidence: "Inferred",
          evidence: [`Purchase Order quantity (${qPO}) exceeds Goods Receipt Note quantity (${qGRN}).`],
        });
      } else if (qGRN > qPO) {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Over-Shipment",
          category: "Business Mismatch",
          confidence: "Inferred",
          evidence: [`Goods Receipt Note quantity (${qGRN}) exceeds Purchase Order quantity (${qPO}).`],
        });
      }
    }

    if (ex.type === "Price Variance") {
      const provPO = extractionProvenance?.purchaseOrder?.unitPrice;
      const provGRN = extractionProvenance?.goodsReceiptNote?.unitPrice;
      const provINV = extractionProvenance?.vendorInvoice?.unitPrice;

      if (provPO === "fallback" || provPO === "missing" || provGRN === "fallback" || provGRN === "missing" || provINV === "fallback" || provINV === "missing") {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Extraction Failure",
          category: "System Failure",
          confidence: "Proven",
          evidence: ["One or more documents had fallback or missing extraction provenance for unit price."],
        });
        continue;
      }

      const pPO = matchResult.priceMatch?.po ?? 0;
      const pINV = matchResult.priceMatch?.invoice ?? 0;

      if (pINV > pPO) {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Overbilling",
          category: "Business Mismatch",
          confidence: "Inferred",
          evidence: [`Invoice unit price (₹${pINV}) exceeds Purchase Order unit price (₹${pPO}).`],
        });
      } else if (pINV < pPO) {
        causes.push({
          exceptionType: ex.type,
          rootCause: "Discount Applied",
          category: "Business Mismatch",
          confidence: "Inferred",
          evidence: [`Invoice unit price (₹${pINV}) is less than Purchase Order unit price (₹${pPO}).`],
        });
      }
    }

    if (ex.type === "Missing Invoice" || ex.type === "Missing GRN") {
      causes.push({
        exceptionType: ex.type,
        rootCause: "Process Gap",
        category: "Administrative Error",
        confidence: "Proven",
        evidence: [`Document type ${ex.type.replace("Missing ", "")} was not provided in the upload payload.`],
      });
    }

    if (ex.type === "Timeline Deviation") {
      causes.push({
        exceptionType: ex.type,
        rootCause: "Sequence Error",
        category: "Administrative Error",
        confidence: "Proven",
        evidence: ["Document dates are out of logical chronological sequence."],
      });
    }
  }

  return causes;
}
