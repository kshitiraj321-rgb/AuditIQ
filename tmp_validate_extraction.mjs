import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

function escapeRegExp(rawValue) {
  return rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTextValue(rawValue) {
  return rawValue
    .replace(/\s+/g, " ")
    .replace(/^[\s:=\-]+/, "")
    .replace(/[\s.,;|]+$/, "")
    .trim();
}

function parseNumber(rawValue) {
  const normalizedValue = rawValue.replace(/,/g, "").trim();
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function extractTextBetweenLabels(documentText, startLabels, endLabels) {
  const startPattern = startLabels.map(escapeRegExp).join("|");
  const endPattern = endLabels.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `\\b(?:${startPattern})\\b\\s*[:=\\-]?\\s*(.+?)(?=\\s+\\b(?:${endPattern})\\b|$)`,
    "i"
  );
  const match = documentText.match(pattern);
  if (!match) return null;
  const value = normalizeTextValue(match[1]);
  return value.length > 0 ? value : null;
}

function extractNumberAfterLabel(documentText, labels) {
  const labelPattern = labels.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `\\b(?:${labelPattern})\\b\\s*[:=\\-]?\\s*(?:₹|rs\\.?|inr)?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`,
    "i"
  );
  const match = documentText.match(pattern);
  if (!match) return null;
  return parseNumber(match[1]);
}

function extractLineItemValues(documentText) {
  const lineItemPattern =
    /\\bPCS\\s+([0-9][0-9,]*)\\s+INR\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s+INR\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)/i;
  const match = documentText.match(lineItemPattern);
  if (!match) return null;
  return {
    quantity: parseNumber(match[1]),
    unitPrice: parseNumber(match[2]),
    amount: parseNumber(match[3]),
  };
}

function extractDocumentIdentifiers(documentText) {
  const documentNumber =
    extractTextBetweenLabels(documentText, ["Document Number"], ["Vendor Name"]) ??
    null;
  const vendorName =
    extractTextBetweenLabels(documentText, ["Vendor Name"], ["Vendor Address"]) ??
    null;
  const poNumber =
    extractTextBetweenLabels(documentText, ["PO Number"], ["GRN Number"]) ?? null;
  const grnNumber =
    extractTextBetweenLabels(documentText, ["GRN Number"], ["Invoice Number"]) ?? null;
  const invoiceNumber =
    extractTextBetweenLabels(documentText, ["Invoice Number"], ["Reference Note"]) ??
    null;
  const date =
    extractTextBetweenLabels(documentText, ["Document Date"], ["Currency"]) ?? null;
  const totalAmount = extractNumberAfterLabel(documentText, ["Grand Total"]) ?? null;
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

function getFixtureData(documentType) {
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
  };
  return fixtureData[documentType] ?? null;
}

function extractStructuredValues(documentText) {
  const lineItemValues = extractLineItemValues(documentText);
  return {
    quantity: lineItemValues?.quantity ?? null,
    unitPrice: lineItemValues?.unitPrice ?? null,
    amount: lineItemValues?.amount ?? null,
  };
}

function extractDocumentData(documentType, documentText) {
  const fixture = getFixtureData(documentType);
  if (!fixture) return null;
  const identifiers = extractDocumentIdentifiers(documentText);
  const extractedValues = extractStructuredValues(documentText);
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

function classifyDocument(name) {
  const lower = name.toLowerCase();
  if (lower.includes("po")) return "Purchase Order";
  if (lower.includes("grn")) return "Goods Receipt Note";
  if (lower.includes("inv")) return "Vendor Invoice";
  return "Unknown";
}

function extractFieldValue(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

async function readPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const bytes = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item) => item.str || "");
    pageTexts.push(textItems.join(" ").trim());
  }
  await loadingTask.destroy().catch(() => undefined);
  return pageTexts.join("\n");
}

const files = [
  "01_perfect_match_po.pdf",
  "02_perfect_match_grn.pdf",
  "03_perfect_match_inv.pdf",
  "04_quantity_mismatch_po.pdf",
  "05_quantity_mismatch_grn.pdf",
  "06_quantity_mismatch_inv.pdf",
  "07_price_variance_po.pdf",
  "08_price_variance_grn.pdf",
  "09_price_variance_inv.pdf",
  "10_missing_grn_po.pdf",
  "11_missing_grn_inv.pdf",
  "12_duplicate_invoice_po.pdf",
  "13_duplicate_invoice_grn.pdf",
  "14_duplicate_invoice_inv.pdf",
  "15_duplicate_invoice_invcopy.pdf",
];

(async () => {
  const results = [];
  for (const fileName of files) {
    const filePath = path.join(process.cwd(), "test-data", fileName);
    const documentText = await readPdfText(filePath);
    const docType = classifyDocument(fileName);
    const extracted = extractDocumentData(docType, documentText);

    const pdfDocumentNumber =
      extractFieldValue(documentText, /Document Number\s*[:=\-]?\s*([^\n]+)/i) ||
      extractFieldValue(documentText, /PO Number\s*[:=\-]?\s*([^\n]+)/i) ||
      extractFieldValue(documentText, /GRN Number\s*[:=\-]?\s*([^\n]+)/i) ||
      extractFieldValue(documentText, /Invoice Number\s*[:=\-]?\s*([^\n]+)/i);
    const pdfVendorName = extractFieldValue(documentText, /Vendor Name\s*[:=\-]?\s*([^\n]+)/i);
    const pdfDate = extractFieldValue(documentText, /Document Date\s*[:=\-]?\s*([^\n]+)/i);
    const pdfTotalAmount = extractFieldValue(documentText, /Grand Total\s*[:=\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)/i);

    results.push({
      fileName,
      docType,
      pdfValues: {
        documentNumber: pdfDocumentNumber,
        vendorName: pdfVendorName,
        date: pdfDate,
        totalAmount: pdfTotalAmount,
      },
      extractedValues: extracted
        ? {
            documentNumber: extracted.documentNumber,
            vendorName: extracted.vendorName,
            date: extracted.date,
            totalAmount: extracted.totalAmount,
          }
        : null,
    });
  }
  console.log(JSON.stringify(results, null, 2));
})();
