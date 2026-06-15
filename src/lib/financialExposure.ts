import type { DetectedException } from "@/lib/exceptionEngine";

type ExtractedDocument = {
  amount: number;
} | null;

type FinancialExposureInput = {
  purchaseOrder: ExtractedDocument;
  goodsReceiptNote: ExtractedDocument;
  vendorInvoice: ExtractedDocument;
  exceptions: DetectedException[];
};

type ExposureBreakdownItem = {
  exception: DetectedException["type"];
  exposure: number;
};

export type FinancialExposureResult = {
  totalExposure: number;
  breakdown: ExposureBreakdownItem[];
};

function addBreakdownItem(
  breakdown: ExposureBreakdownItem[],
  exception: DetectedException["type"],
  exposure: number
) {
  breakdown.push({
    exception,
    exposure,
  });
}

export function calculateFinancialExposure({
  purchaseOrder,
  goodsReceiptNote,
  vendorInvoice,
  exceptions,
}: FinancialExposureInput): FinancialExposureResult {
  const breakdown: ExposureBreakdownItem[] = [];

  for (const exception of exceptions) {
    if (exception.type === "Quantity Mismatch" && purchaseOrder && goodsReceiptNote) {
      addBreakdownItem(
        breakdown,
        exception.type,
        Math.abs(purchaseOrder.amount - goodsReceiptNote.amount)
      );
      continue;
    }

    if (exception.type === "Price Variance" && purchaseOrder && vendorInvoice) {
      addBreakdownItem(
        breakdown,
        exception.type,
        Math.abs(vendorInvoice.amount - purchaseOrder.amount)
      );
      continue;
    }

    if (exception.type === "Missing Invoice" && purchaseOrder) {
      addBreakdownItem(breakdown, exception.type, purchaseOrder.amount);
      continue;
    }

    if (exception.type === "Missing GRN" && vendorInvoice) {
      addBreakdownItem(breakdown, exception.type, vendorInvoice.amount);
      continue;
    }

    if (exception.type === "Duplicate Invoice" && vendorInvoice) {
      addBreakdownItem(breakdown, exception.type, vendorInvoice.amount);
    }
  }

  return {
    totalExposure: breakdown.reduce((sum, item) => sum + item.exposure, 0),
    breakdown,
  };
}
