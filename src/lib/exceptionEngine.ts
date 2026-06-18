import type { MatchDocumentsResult } from "@/lib/matcher";
import { validateTimeline } from "@/lib/timelineValidator";

type ExtractedDocument = {
  documentNumber: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  normalizedDate?: string | null;
  invoiceNumber?: string | null;
  vendorName?: string | null;
  vendor?: string | null;
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
  existingInvoices?: { vendorName: string; invoiceNumber: string }[];
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
  existingInvoices = [],
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

  if (vendorInvoice) {
    const invoiceNum = vendorInvoice.invoiceNumber ?? vendorInvoice.documentNumber;
    const vendorName = vendorInvoice.vendorName ?? vendorInvoice.vendor;

    if (invoiceNum && vendorName) {
      const isDuplicate = existingInvoices.some(
        (inv) =>
          inv.vendorName.trim().toUpperCase() === vendorName.trim().toUpperCase() &&
          inv.invoiceNumber.trim().toUpperCase() === invoiceNum.trim().toUpperCase()
      );
      if (isDuplicate) {
        addException(exceptions, "Duplicate Invoice");
      }
    }
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
