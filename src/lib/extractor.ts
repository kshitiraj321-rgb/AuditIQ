export function extractDocumentData(documentType: string) {
  if (documentType === "Purchase Order") {
    return {
      vendor: "ABC Industries",
      documentNumber: "PO-1001",
      date: "2026-06-12",
      quantity: 100,
      unitPrice: 500,
      amount: 50000,
    };
  }

  if (documentType === "Goods Receipt Note") {
    return {
      vendor: "ABC Industries",
      documentNumber: "GRN-1001",
      date: "2026-06-12",
      quantity: 95,
      unitPrice: 500,
      amount: 47500,
    };
  }

  if (documentType === "Vendor Invoice") {
    return {
      vendor: "ABC Industries",
      documentNumber: "INV-1001",
      date: "2026-06-12",
      quantity: 100,
      unitPrice: 620,
      amount: 62000,
    };
  }

  return null;
}