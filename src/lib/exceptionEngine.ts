import type { MatchDocumentsResult } from "@/lib/matcher";

type ExtractedDocument = {
  documentNumber: string;
  quantity: number;
  unitPrice: number;
  amount: number;
} | null;

export type DetectedException = {
  type:
    | "Quantity Mismatch"
    | "Price Variance"
    | "Missing Invoice"
    | "Missing GRN"
    | "Duplicate Invoice";
  severity: "High";
};

export type DetectExceptionsInput = {
  purchaseOrder: ExtractedDocument;
  goodsReceiptNote: ExtractedDocument;
  vendorInvoice: ExtractedDocument;
  matchResult: MatchDocumentsResult;
  existingInvoiceNumbers?: string[];
};

function addException(
  exceptions: DetectedException[],
  type: DetectedException["type"]
) {
  exceptions.push({
    type,
    severity: "High",
  });
}

export function detectExceptions({
  goodsReceiptNote,
  vendorInvoice,
  matchResult,
  existingInvoiceNumbers = [],
}: DetectExceptionsInput): DetectedException[] {
  const exceptions: DetectedException[] = [];

  if (!vendorInvoice) {
    addException(exceptions, "Missing Invoice");
    return exceptions;
  }

  if (!goodsReceiptNote) {
    addException(exceptions, "Missing GRN");
    return exceptions;
  }

  if (!matchResult.quantityMatch.matched) {
    addException(exceptions, "Quantity Mismatch");
  }

  if (!matchResult.priceMatch.matched) {
    addException(exceptions, "Price Variance");
  }

  if (
    vendorInvoice &&
    existingInvoiceNumbers.includes(vendorInvoice.documentNumber)
  ) {
    addException(exceptions, "Duplicate Invoice");
  }

  return exceptions;
}
