export type TimelineDocumentInput = {
  normalizedDate: string | null;
} | null;

export type TimelineValidationResult = {
  isValid: boolean;
  rules: {
    grnAfterPo: boolean | null;
    invoiceAfterGrn: boolean | null;
    invoiceAfterPo: boolean | null;
  };
  errors: string[];
};

export function validateTimeline(
  purchaseOrder: TimelineDocumentInput,
  goodsReceiptNote: TimelineDocumentInput,
  vendorInvoice: TimelineDocumentInput
): TimelineValidationResult {
  const poDate = purchaseOrder?.normalizedDate ?? null;
  const grnDate = goodsReceiptNote?.normalizedDate ?? null;
  const invoiceDate = vendorInvoice?.normalizedDate ?? null;

  let grnAfterPo: boolean | null = null;
  let invoiceAfterGrn: boolean | null = null;
  let invoiceAfterPo: boolean | null = null;
  const errors: string[] = [];

  // Rule A: GRN Date >= PO Date
  if (grnDate !== null && poDate !== null) {
    grnAfterPo = grnDate >= poDate;
    if (!grnAfterPo) {
      errors.push(`GRN Date (${grnDate}) is prior to PO Date (${poDate})`);
    }
  }

  // Rule B: Invoice Date >= GRN Date
  if (invoiceDate !== null && grnDate !== null) {
    invoiceAfterGrn = invoiceDate >= grnDate;
    if (!invoiceAfterGrn) {
      errors.push(`Invoice Date (${invoiceDate}) is prior to GRN Date (${grnDate})`);
    }
  }

  // Rule C: Invoice Date >= PO Date
  if (invoiceDate !== null && poDate !== null) {
    invoiceAfterPo = invoiceDate >= poDate;
    if (!invoiceAfterPo) {
      errors.push(`Invoice Date (${invoiceDate}) is prior to PO Date (${poDate})`);
    }
  }

  // Null rules do not invalidate timeline. A rule only invalidates if it evaluates to false.
  const isValid =
    grnAfterPo !== false &&
    invoiceAfterGrn !== false &&
    invoiceAfterPo !== false;

  return {
    isValid,
    rules: {
      grnAfterPo,
      invoiceAfterGrn,
      invoiceAfterPo,
    },
    errors,
  };
}
