import type { MatchDocumentsResult } from "@/lib/matcher";
import { validateTimeline } from "@/lib/timelineValidator";

type ExtractedDocument = {
  documentNumber: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  normalizedDate?: string | null;
} | null;

export type DetectedException = {
  type:
    | "Quantity Mismatch"
    | "Price Variance"
    | "Missing Invoice"
    | "Missing GRN"
    | "Duplicate Invoice"
    | "Timeline Deviation";
  severity: "High";
  message?: string;
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
  type: DetectedException["type"],
  message?: string
) {
  exceptions.push({
    type,
    severity: "High",
    ...(message ? { message } : {}),
  });
}

export function detectExceptions({
  purchaseOrder,
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

  const timelineResult = validateTimeline(
    purchaseOrder ? { normalizedDate: purchaseOrder.normalizedDate ?? null } : null,
    goodsReceiptNote ? { normalizedDate: goodsReceiptNote.normalizedDate ?? null } : null,
    vendorInvoice ? { normalizedDate: vendorInvoice.normalizedDate ?? null } : null
  );

  if (!timelineResult.isValid) {
    addException(
      exceptions,
      "Timeline Deviation",
      timelineResult.errors.join("; ")
    );
  }

  return exceptions;
}
