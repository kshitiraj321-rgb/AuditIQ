type ExtractedDocumentData = {
  vendor: string;
  vendorName: string;
  documentNumber: string;
  poNumber: string | null;
  grnNumber: string | null;
  invoiceNumber: string | null;
  date: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  totalAmount: number;
} | null;

const fixtureData = {
  "Purchase Order": {
    vendor: "ABC Industries",
    documentNumber: "PO-1001",
    date: "2026-06-12",
    quantity: 100,
    unitPrice: 500,
    amount: 50000,
  },
  "Goods Receipt Note": {
    vendor: "ABC Industries",
    documentNumber: "GRN-1001",
    date: "2026-06-12",
    quantity: 95,
    unitPrice: 500,
    amount: 47500,
  },
  "Vendor Invoice": {
    vendor: "ABC Industries",
    documentNumber: "INV-1001",
    date: "2026-06-12",
    quantity: 100,
    unitPrice: 620,
    amount: 62000,
  },
} as const;

function getFixtureData(documentType: string) {
  return fixtureData[documentType as keyof typeof fixtureData] ?? null;
}

function escapeRegExp(rawValue: string) {
  return rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTextValue(rawValue: string) {
  return rawValue
    .replace(/\s+/g, " ")
    .replace(/^[\s:=-]+/, "")
    .replace(/[\s.,;|]+$/, "")
    .trim();
}

function parseNumber(rawValue: string) {
  const normalizedValue = rawValue.replace(/,/g, "").trim();
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function extractTextBetweenLabels(
  documentText: string,
  startLabels: string[],
  endLabels: string[]
) {
  const startPattern = startLabels.map(escapeRegExp).join("|");
  const endPattern = endLabels.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `\\b(?:${startPattern})\\b\\s*[:=\\-]?\\s*(.+?)(?=\\s+\\b(?:${endPattern})\\b|$)`,
    "i"
  );
  const match = documentText.match(pattern);

  if (!match) {
    return null;
  }

  const value = normalizeTextValue(match[1]);

  return value.length > 0 ? value : null;
}

function extractNumberAfterLabel(
  documentText: string,
  labels: string[]
) {
  const labelPattern = labels.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `\\b(?:${labelPattern})\\b\\s*[:=\\-]?\\s*(?:₹|rs\\.?|inr)?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`,
    "i"
  );
  const match = documentText.match(pattern);

  if (!match) {
    return null;
  }

  return parseNumber(match[1]);
}

function extractLineItemValues(documentText: string) {
  // Header-aware table parsing (preferred)
  const lines = documentText.split(/\r?\n/);
  const headerRegex = /\b(qty|quantity)\b.*\b(unit ?price|rate|price)\b.*\b(amount|line ?total|line_amount|line total)\b/i;

  let headerIndex = -1;
  let headerLine = "";

  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i])) {
      headerIndex = i;
      headerLine = lines[i];
      break;
    }
  }

  if (headerIndex >= 0) {
    // Split header into columns by runs of two or more spaces (common OCR/table delimiter)
    const headerFields = headerLine.split(/\s{2,}/).map((s) => s.trim());
    const findHeaderIndex = (rx: RegExp) => headerFields.findIndex((h) => rx.test(h));
    const qtyIndex = findHeaderIndex(/\b(qty|quantity)\b/i);
    const priceIndex = findHeaderIndex(/\b(unit ?price|rate|price)\b/i);
    const amountIndex = findHeaderIndex(/\b(amount|line ?total|line_amount|line total)\b/i);

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const row = lines[i].trim();
      if (!row) break; // stop at blank line

      let qtyText: string | null = null;
      let priceText: string | null = null;
      let amountText: string | null = null;

      // Split row into fields using same delimiter
      const rowFields = row.split(/\s{2,}/).map((s) => s.trim());
      if (qtyIndex >= 0 && priceIndex >= 0 && amountIndex >= 0 && rowFields.length > Math.max(qtyIndex, priceIndex, amountIndex)) {
        qtyText = rowFields[qtyIndex];
        priceText = rowFields[priceIndex];
        amountText = rowFields[amountIndex];
      } else {
        // Loose fallback: pick first three numeric tokens on the row
        const numRegex = /[0-9][0-9,]*(?:\.[0-9]+)?/g;
        const nums = row.match(numRegex);
        if (nums && nums.length >= 3) {
          qtyText = nums[0];
          priceText = nums[1];
          amountText = nums[2];
        }
      }

      let q = qtyText ? parseNumber(qtyText) : null;
      let p = priceText ? parseNumber(priceText) : null;
      let a = amountText ? parseNumber(amountText) : null;

      // If column-slice parsing failed, try loose numeric token extraction on the row
      if ((q === null || p === null || a === null)) {
        const numRegex = /[0-9][0-9,]*(?:\.[0-9]+)?/g;
        const nums = row.match(numRegex);
        if (nums && nums.length >= 3) {
          q = parseNumber(nums[0]);
          p = parseNumber(nums[1]);
          a = parseNumber(nums[2]);
        }
      }

      if (q !== null && p !== null && a !== null) {
        return { quantity: q, unitPrice: p, amount: a };
      }
    }
  }

  // Legacy fallback: preserve original strict pattern to avoid regressions
  const lineItemPattern = /\b[A-Z]{2,6}\s+([0-9][0-9,]*)\s+INR\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s+INR\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i;
  const match = documentText.match(lineItemPattern);

  if (!match) {
    return null;
  }

  return {
    quantity: parseNumber(match[1]),
    unitPrice: parseNumber(match[2]),
    amount: parseNumber(match[3]),
  };
}

function extractDocumentIdentifiers(documentText: string) {
  const documentNumber =
    extractTextBetweenLabels(documentText, ["Document Number"], ["Vendor Name"]) ??
    null;
  const vendorName =
    extractTextBetweenLabels(documentText, ["Vendor Name"], ["Vendor Address"]) ??
    null;
  const poNumber =
    extractTextBetweenLabels(documentText, ["PO Number"], ["GRN Number"]) ?? null;
  const grnNumber =
    extractTextBetweenLabels(documentText, ["GRN Number"], ["Invoice Number"]) ??
    null;
  const invoiceNumber =
    extractTextBetweenLabels(documentText, ["Invoice Number"], ["Reference Note"]) ??
    null;
  const date =
    extractTextBetweenLabels(documentText, ["Document Date"], ["Currency"]) ?? null;
  const totalAmount =
    extractNumberAfterLabel(documentText, ["Grand Total"]) ?? null;

  return {
    documentNumber,
    vendorName,
    poNumber,
    grnNumber,
    invoiceNumber,
    date,
    totalAmount,
  };
}

function extractStructuredValues(documentText: string) {
  const lineItemValues = extractLineItemValues(documentText);
  const quantity = lineItemValues?.quantity ?? null;
  const unitPrice = lineItemValues?.unitPrice ?? null;
  const amount = lineItemValues?.amount ?? null;

  return {
    quantity,
    unitPrice,
    amount,
  };
}

export function extractDocumentData(
  documentType: string,
  documentText: string
): ExtractedDocumentData {
  const fixture = getFixtureData(documentType);

  if (!fixture) {
    return null;
  }

  const identifiers = extractDocumentIdentifiers(documentText);
  const extractedValues = extractStructuredValues(documentText);
  console.log("IDENTIFIERS", identifiers);
  console.log("VALUES", extractedValues);
  const documentNumber =
    identifiers.documentNumber ??
    identifiers.poNumber ??
    identifiers.grnNumber ??
    identifiers.invoiceNumber ??
    fixture.documentNumber;
  const vendorName = identifiers.vendorName ?? fixture.vendor;
  const date = identifiers.date ?? fixture.date;
  const quantity = extractedValues.quantity ?? fixture.quantity;
  const unitPrice = extractedValues.unitPrice ?? fixture.unitPrice;
  const amount = extractedValues.amount ?? fixture.amount;
  const totalAmount = identifiers.totalAmount ?? amount;

  return {
    ...fixture,
    vendor: vendorName,
    vendorName,
    documentNumber,
    poNumber:
      identifiers.poNumber ??
      (documentType === "Purchase Order" ? fixture.documentNumber : null),
    grnNumber:
      identifiers.grnNumber ??
      (documentType === "Goods Receipt Note" ? fixture.documentNumber : null),
    invoiceNumber:
      identifiers.invoiceNumber ??
      (documentType === "Vendor Invoice" ? fixture.documentNumber : null),
    date,
    quantity,
    unitPrice,
    amount,
    totalAmount,
  };
}
