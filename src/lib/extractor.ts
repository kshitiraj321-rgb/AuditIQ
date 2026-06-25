export type ExtractedDocumentData = {
  vendor: string;
  vendorName: string;
  documentNumber: string;
  poNumber: string | null;
  grnNumber: string | null;
  invoiceNumber: string | null;
  date: string;
  normalizedDate: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  totalAmount: number;
} | null;

export type FieldSource = "extracted" | "fallback" | "missing";

export type ExtractorMetadata = {
  vendor: FieldSource;
  vendorName: FieldSource;
  documentNumber: FieldSource;
  poNumber: FieldSource;
  grnNumber: FieldSource;
  invoiceNumber: FieldSource;
  date: FieldSource;
  normalizedDate: FieldSource;
  quantity: FieldSource;
  unitPrice: FieldSource;
  amount: FieldSource;
  totalAmount: FieldSource;
};

export const extractionProvenance = new WeakMap<NonNullable<ExtractedDocumentData>, ExtractorMetadata>();

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

const MONTH_NAMES: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2099) return null;
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

export function normalizeDate(rawDate: string): string | null {
  if (!rawDate) return null;
  const cleaned = rawDate.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIsoDate(parseInt(iso[1], 10), parseInt(iso[2], 10), parseInt(iso[3], 10));
  const yyyySlash = cleaned.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yyyySlash) return toIsoDate(parseInt(yyyySlash[1], 10), parseInt(yyyySlash[2], 10), parseInt(yyyySlash[3], 10));
  const ddSlash = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddSlash) return toIsoDate(parseInt(ddSlash[3], 10), parseInt(ddSlash[2], 10), parseInt(ddSlash[1], 10));
  const ddHyphen = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddHyphen) return toIsoDate(parseInt(ddHyphen[3], 10), parseInt(ddHyphen[2], 10), parseInt(ddHyphen[1], 10));
  const ddDot = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddDot) return toIsoDate(parseInt(ddDot[3], 10), parseInt(ddDot[2], 10), parseInt(ddDot[1], 10));
  const ddMon = cleaned.match(/^(\d{1,2})[\s-]([a-zA-Z]+)[\s-](\d{4})$/);
  if (ddMon) {
    const d = parseInt(ddMon[1], 10);
    const m = MONTH_NAMES[ddMon[2].toLowerCase()];
    if (m) return toIsoDate(parseInt(ddMon[3], 10), parseInt(m, 10), d);
  }
  const monDd = cleaned.match(/^([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (monDd) {
    const m = MONTH_NAMES[monDd[1].toLowerCase()];
    if (m) return toIsoDate(parseInt(monDd[3], 10), parseInt(m, 10), parseInt(monDd[2], 10));
  }
  return null;
}

export type AIExtractionFields = {
  vendor: string | null;
  vendorName: string | null;
  documentNumber: string | null;
  poNumber: string | null;
  grnNumber: string | null;
  invoiceNumber: string | null;
  date: string | null;
  normalizedDate: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  totalAmount: number | null;
};

export function extractDocumentData(
  documentType: string,
  documentText: string,
  aiData?: AIExtractionFields | null
): ExtractedDocumentData {
  void documentText; // retained for future OCR/local extraction use

  const fixture = getFixtureData(documentType);

  if (!fixture) {
    return null;
  }

  const resolvedAiData = aiData ?? null;

  const getField = <K extends keyof AIExtractionFields>(key: K, fallback: AIExtractionFields[K]) => {
    const aiValue = resolvedAiData ? resolvedAiData[key] : null;
    const isPresent = aiValue !== null && aiValue !== undefined;
    const finalValue = isPresent ? aiValue : fallback;

    let source: FieldSource;
    if (isPresent) {
      source = "extracted";
    } else if (finalValue !== null && finalValue !== undefined) {
      source = "fallback";
    } else {
      source = "missing";
    }

    return { value: finalValue, source };
  };

  const vendorRes = getField("vendor", fixture.vendor);
  const vendorNameRes = getField("vendorName", fixture.vendor);

  const poDocNumFallback = documentType === "Purchase Order" ? fixture.documentNumber : null;
  const grnDocNumFallback = documentType === "Goods Receipt Note" ? fixture.documentNumber : null;
  const invDocNumFallback = documentType === "Vendor Invoice" ? fixture.documentNumber : null;

  const docNumRes = getField("documentNumber", fixture.documentNumber);
  const poNumRes = getField("poNumber", poDocNumFallback);
  const grnNumRes = getField("grnNumber", grnDocNumFallback);
  const invNumRes = getField("invoiceNumber", invDocNumFallback);

  const dateRes = getField("date", fixture.date);
  const normDateRes = getField("normalizedDate", normalizeDate(fixture.date));

  const qtyRes = getField("quantity", fixture.quantity);
  const priceRes = getField("unitPrice", fixture.unitPrice);
  const amountRes = getField("amount", fixture.amount);
  const totalRes = getField("totalAmount", amountRes.value);

  const result: NonNullable<ExtractedDocumentData> = {
    ...fixture,
    vendor: vendorRes.value as string,
    vendorName: vendorNameRes.value as string,
    documentNumber: docNumRes.value as string,
    poNumber: poNumRes.value as string | null,
    grnNumber: grnNumRes.value as string | null,
    invoiceNumber: invNumRes.value as string | null,
    date: dateRes.value as string,
    normalizedDate: normDateRes.value as string | null,
    quantity: qtyRes.value as number,
    unitPrice: priceRes.value as number,
    amount: amountRes.value as number,
    totalAmount: totalRes.value as number,
  };

  extractionProvenance.set(result, {
    vendor: vendorRes.source,
    vendorName: vendorNameRes.source,
    documentNumber: docNumRes.source,
    poNumber: poNumRes.source,
    grnNumber: grnNumRes.source,
    invoiceNumber: invNumRes.source,
    date: dateRes.source,
    normalizedDate: normDateRes.source,
    quantity: qtyRes.source,
    unitPrice: priceRes.source,
    amount: amountRes.source,
    totalAmount: totalRes.source,
  });

  return result;
}

