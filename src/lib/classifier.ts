const separatorPattern = "[\\s._-]+";

function escapeRegExp(rawValue: string) {
  return rawValue.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function buildTokenRegex(token: string) {
  const tokenPattern = escapeRegExp(token)
    .replace(/\\ /g, separatorPattern)
    .replace(/\\-/g, separatorPattern)
    .replace(/\\_/g, separatorPattern);

  return new RegExp(`(?:^|[^a-zA-Z0-9])(?:${tokenPattern})(?:$|[^a-zA-Z0-9])`, "i");
}

function matchesAnyToken(fileName: string, tokens: string[]) {
  return tokens.some((token) => buildTokenRegex(token).test(fileName));
}

export function classifyDocument(fileName: string) {
  const name = fileName.toLowerCase();

  const purchaseOrderTokens = [
    "po",
    "purchase-order",
    "purchase_order",
    "purchase order",
    "p.o.",
  ];
  const grnTokens = [
    "grn",
    "goods-receipt",
    "goods_receipt",
    "goods receipt",
    "goods received note",
  ];
  const invoiceTokens = [
    "invoice",
    "inv",
    "vendor-invoice",
    "vendor_invoice",
    "tax-invoice",
    "tax_invoice",
  ];

  const matches = [
    { type: "Purchase Order", matched: matchesAnyToken(name, purchaseOrderTokens) },
    { type: "Goods Receipt Note", matched: matchesAnyToken(name, grnTokens) },
    { type: "Vendor Invoice", matched: matchesAnyToken(name, invoiceTokens) },
  ];

  const matchedTypes = matches.filter((entry) => entry.matched).map((entry) => entry.type);

  if (matchedTypes.length !== 1) {
    return "Unknown";
  }

  return matchedTypes[0];
}