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

function matchesToken(fileName: string, token: string): boolean {
  return buildTokenRegex(token).test(fileName);
}

function matchesAnyToken(fileName: string, tokens: string[]) {
  return tokens.some((token) => matchesToken(fileName, token));
}

function getMatchedTokenConfidence(fileName: string, tokens: string[]): number {
  // Find which token actually matched
  const matchedToken = tokens.find((token) => matchesToken(fileName, token));
  
  if (!matchedToken) {
    return 80; // fallback to medium if no token found (shouldn't happen)
  }

  // Single-word tokens (no hyphens, underscores, or multiple words): 95
  // Compound/long-form tokens: 80
  const hasCompoundCharacters =
    matchedToken.includes("-") ||
    matchedToken.includes("_") ||
    matchedToken.split(" ").length > 1;

  return hasCompoundCharacters ? 80 : 95;
}

export function classifyDocument(
  fileName: string
): { type: string; confidence: number } {
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
    { type: "Purchase Order", tokens: purchaseOrderTokens, matched: matchesAnyToken(name, purchaseOrderTokens) },
    { type: "Goods Receipt Note", tokens: grnTokens, matched: matchesAnyToken(name, grnTokens) },
    { type: "Vendor Invoice", tokens: invoiceTokens, matched: matchesAnyToken(name, invoiceTokens) },
  ];

  const matchedEntries = matches.filter((entry) => entry.matched);

  if (matchedEntries.length !== 1) {
    return { type: "Unknown", confidence: 0 };
  }

  const matchedEntry = matchedEntries[0];
  const confidence = getMatchedTokenConfidence(name, matchedEntry.tokens);

  return { type: matchedEntry.type, confidence };
}