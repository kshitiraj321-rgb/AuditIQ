type ExtractedDocument = {
  quantity: number;
  unitPrice: number;
  amount: number;
};

type MatchFieldResult = {
  matched: boolean;
  po: number | null;
  grn: number | null;
  invoice: number | null;
};

type MatchDocumentsInput = {
  purchaseOrder: ExtractedDocument | null;
  goodsReceiptNote: ExtractedDocument | null;
  vendorInvoice: ExtractedDocument | null;
};

export type MatchDocumentsResult = {
  quantityMatch: MatchFieldResult;
  priceMatch: MatchFieldResult;
  amountMatch: MatchFieldResult;
};

function compareField(
  purchaseOrderValue: number | null,
  goodsReceiptNoteValue: number | null,
  vendorInvoiceValue: number | null
): MatchFieldResult {
  const matched =
    purchaseOrderValue !== null &&
    goodsReceiptNoteValue !== null &&
    vendorInvoiceValue !== null &&
    purchaseOrderValue === goodsReceiptNoteValue &&
    purchaseOrderValue === vendorInvoiceValue;

  return {
    matched,
    po: purchaseOrderValue,
    grn: goodsReceiptNoteValue,
    invoice: vendorInvoiceValue,
  };
}

export function matchDocuments({
  purchaseOrder,
  goodsReceiptNote,
  vendorInvoice,
}: MatchDocumentsInput): MatchDocumentsResult {
  return {
    quantityMatch: compareField(
      purchaseOrder?.quantity ?? null,
      goodsReceiptNote?.quantity ?? null,
      vendorInvoice?.quantity ?? null
    ),
    priceMatch: compareField(
      purchaseOrder?.unitPrice ?? null,
      goodsReceiptNote?.unitPrice ?? null,
      vendorInvoice?.unitPrice ?? null
    ),
    amountMatch: compareField(
      purchaseOrder?.amount ?? null,
      goodsReceiptNote?.amount ?? null,
      vendorInvoice?.amount ?? null
    ),
  };
}
