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

// ---------------------------------------------------------------------------
// Priority 5D — Content-Based Classification Verification
// ---------------------------------------------------------------------------

export type ContentVerificationResult = {
  /** true when content signals agree with the filename-derived type */
  verified: boolean;
  /** document type suggested by content, or null when content is ambiguous */
  contentType: string | null;
  /** original confidence, reduced by max(original - 40, 20) on conflict */
  adjustedConfidence: number;
  /** true when filename type and content type disagree */
  conflict: boolean;
};

const contentSignals: Record<string, string[]> = {
  "Purchase Order": [
    "purchase order",
    "po number",
    "p.o. number",
    "buyer",
    "order date",
    "delivery address",
  ],
  "Goods Receipt Note": [
    "goods receipt",
    "grn number",
    "received by",
    "receipt date",
    "delivery note",
    "goods received",
  ],
  "Vendor Invoice": [
    "invoice number",
    "tax invoice",
    "invoice date",
    "bill to",
    "amount due",
    "vendor invoice",
  ],
};

const MINIMUM_SIGNAL_COUNT = 2;

function detectContentType(rawText: string): string | null {
  const lowerText = rawText.toLowerCase();

  const scores: { type: string; count: number }[] = Object.entries(
    contentSignals
  ).map(([type, signals]) => ({
    type,
    count: signals.filter((signal) => lowerText.includes(signal)).length,
  }));

  // Only consider types that meet the minimum signal threshold
  const qualified = scores.filter((s) => s.count >= MINIMUM_SIGNAL_COUNT);

  if (qualified.length === 0) {
    // No type has enough signals — content is ambiguous
    return null;
  }

  if (qualified.length > 1) {
    // Multiple types meet the threshold — treat as ambiguous
    return null;
  }

  return qualified[0].type;
}

export function verifyClassificationByContent(
  filenameType: string,
  rawText: string,
  originalConfidence: number
): ContentVerificationResult {
  const contentType = detectContentType(rawText);

  if (contentType === null) {
    // Ambiguous or blank content — no conflict, no penalty
    return {
      verified: false,
      contentType: null,
      adjustedConfidence: originalConfidence,
      conflict: false,
    };
  }

  if (contentType === filenameType) {
    // Content agrees with filename classification
    return {
      verified: true,
      contentType,
      adjustedConfidence: originalConfidence,
      conflict: false,
    };
  }

  // Content disagrees — apply confidence penalty
  const adjustedConfidence = Math.max(originalConfidence - 40, 20);

  return {
    verified: false,
    contentType,
    adjustedConfidence,
    conflict: true,
  };
}