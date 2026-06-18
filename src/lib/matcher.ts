type ExtractedDocument = {
  quantity: number;
  unitPrice: number;
  amount: number;
  poNumber?: string | null;
  grnNumber?: string | null;
  invoiceNumber?: string | null;
  documentNumber?: string | null;
};

type MatchFieldResult = {
  matched: boolean;
  po: number | null;
  grn: number | null;
  invoice: number | null;
};

export type MatchStringFieldResult = {
  matched: boolean;
  po: string | null;
  grn: string | null;
  invoice: string | null;
  normalizedPo: string | null;
  normalizedGrn: string | null;
  normalizedInvoice: string | null;
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
  poNumberMatch: MatchStringFieldResult;
  grnNumberMatch: MatchStringFieldResult;
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

function normalizeIdentifier(val: string | null): string | null {
  if (!val) return null;
  const cleaned = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned || null;
}

function comparePOIdentifiers(
  po: string | null,
  grn: string | null,
  invoice: string | null
): MatchStringFieldResult {
  const normPo = normalizeIdentifier(po);
  const normGrn = normalizeIdentifier(grn);
  const normInvoice = normalizeIdentifier(invoice);

  const matched =
    normPo !== null &&
    normGrn !== null &&
    normInvoice !== null &&
    normPo === normGrn &&
    normPo === normInvoice;

  return {
    matched,
    po,
    grn,
    invoice,
    normalizedPo: normPo,
    normalizedGrn: normGrn,
    normalizedInvoice: normInvoice,
  };
}

function compareGRNIdentifiers(
  po: string | null,
  grn: string | null,
  invoice: string | null
): MatchStringFieldResult {
  const normGrn = normalizeIdentifier(grn);
  const normInvoice = normalizeIdentifier(invoice);

  const matched =
    normGrn !== null &&
    normInvoice !== null &&
    normGrn === normInvoice;

  return {
    matched,
    po: null,
    grn,
    invoice,
    normalizedPo: null,
    normalizedGrn: normGrn,
    normalizedInvoice: normInvoice,
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
    poNumberMatch: comparePOIdentifiers(
      purchaseOrder?.poNumber ?? null,
      goodsReceiptNote?.poNumber ?? null,
      vendorInvoice?.poNumber ?? null
    ),
    grnNumberMatch: compareGRNIdentifiers(
      purchaseOrder?.grnNumber ?? null,
      goodsReceiptNote?.grnNumber ?? null,
      vendorInvoice?.grnNumber ?? null
    ),
  };
}

