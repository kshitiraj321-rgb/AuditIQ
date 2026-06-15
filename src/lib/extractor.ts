type ExtractedDocumentData = {
  vendor: string;
  documentNumber: string;
  date: string;
  quantity: number;
  unitPrice: number;
  amount: number;
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

function parseNumber(rawValue: string) {
  const normalizedValue = rawValue.replace(/,/g, "").trim();
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function extractLabeledNumber(
  documentText: string,
  labels: string[]
) {
  const labelPattern = labels.join("|");
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

function extractStructuredValues(documentText: string) {
  const quantity = extractLabeledNumber(documentText, ["quantity", "qty"]);
  const unitPrice = extractLabeledNumber(documentText, [
    "unit price",
    "price per unit",
    "unit cost",
    "rate",
  ]);
  const amount = extractLabeledNumber(documentText, [
    "amount",
    "total amount",
    "invoice amount",
    "grand total",
    "total",
  ]);

  if (quantity === null || unitPrice === null || amount === null) {
    return null;
  }

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

  const extractedValues = extractStructuredValues(documentText);

  if (!extractedValues) {
    return fixture;
  }

  return {
    ...fixture,
    ...extractedValues,
  };
}
