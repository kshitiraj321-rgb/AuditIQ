import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// Utility functions from extractor
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

function extractDocumentIdentifiers(documentText) {
  return {
    documentNumber:
      extractTextBetweenLabels(documentText, ["Document Number"], ["Vendor Name"]) ??
      null,
    vendorName:
      extractTextBetweenLabels(documentText, ["Vendor Name"], ["Vendor Address"]) ??
      null,
    date:
      extractTextBetweenLabels(documentText, ["Document Date"], ["Currency"]) ?? null,
    totalAmount:
      extractNumberAfterLabel(documentText, ["Grand Total"]) ?? null,
  };
}

function classifyDocument(name) {
  const lower = name.toLowerCase();
  if (lower.includes("po")) return "Purchase Order";
  if (lower.includes("grn")) return "Goods Receipt Note";
  if (lower.includes("inv")) return "Vendor Invoice";
  return "Unknown";
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

function normalizeForComparison(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim().toLowerCase();
}

function compareValues(extracted, expected) {
  const extNorm = normalizeForComparison(extracted);
  const expNorm = normalizeForComparison(expected);
  
  if (extNorm === null || expNorm === null) {
    return extNorm === expNorm;
  }
  
  // Exact match
  if (extNorm === expNorm) return true;
  
  // Partial match for vendor names (in case of abbreviations)
  if (extNorm.includes(expNorm) || expNorm.includes(extNorm)) return true;
  
  return false;
}

function compareNumbers(extracted, expected) {
  if (extracted === null || extracted === undefined) {
    return expected === null || expected === undefined;
  }
  if (expected === null || expected === undefined) return false;
  
  // Parse expected if it's a string
  const expectedNum = typeof expected === "string" ? parseFloat(expected) : expected;
  
  // Allow small rounding differences (within 0.01%)
  if (typeof extracted === "number" && !isNaN(expectedNum)) {
    const diff = Math.abs(extracted - expectedNum);
    const tolerance = Math.max(1, expectedNum * 0.0001);
    return diff <= tolerance;
  }
  
  return extracted === expectedNum;
}

// PDF file to dataset index mapping
const fileToDocumentIndex = {
  "01_perfect_match_po.pdf": 0,
  "02_perfect_match_grn.pdf": 1,
  "03_perfect_match_inv.pdf": 2,
  "04_quantity_mismatch_po.pdf": 3,
  "05_quantity_mismatch_grn.pdf": 4,
  "06_quantity_mismatch_inv.pdf": 5,
  "07_price_variance_po.pdf": 6,
  "08_price_variance_grn.pdf": 7,
  "09_price_variance_inv.pdf": 8,
  "10_missing_grn_po.pdf": 9,
  "11_missing_grn_inv.pdf": 10,
  "12_duplicate_invoice_po.pdf": 11,
  "13_duplicate_invoice_grn.pdf": 12,
  "14_duplicate_invoice_inv.pdf": 13,
  "15_duplicate_invoice_invcopy.pdf": 14,
};

(async () => {
  // Load dataset
  const datasetPath = path.join(process.cwd(), "test-data", "procurement_dataset.json");
  const datasetText = await fs.readFile(datasetPath, "utf-8");
  const dataset = JSON.parse(datasetText);

  const results = [];
  let totalFieldsTested = 0;
  let passed = 0;
  let failed = 0;

  const files = Object.keys(fileToDocumentIndex).sort();

  for (const fileName of files) {
    const filePath = path.join(process.cwd(), "test-data", fileName);
    try {
      const documentText = await readPdfText(filePath);
      const docType = classifyDocument(fileName);
      const docIndex = fileToDocumentIndex[fileName];
      const expectedDoc = dataset.documents[docIndex];

      if (!expectedDoc) {
        console.error(`No expected document found for ${fileName}`);
        continue;
      }

      const extracted = extractDocumentIdentifiers(documentText);

      // Test each field
      const fields = [
        {
          name: "Document Number",
          extracted: extracted.documentNumber,
          expected: expectedDoc.document_number,
          comparer: compareValues,
        },
        {
          name: "Vendor Name",
          extracted: extracted.vendorName,
          expected: expectedDoc.vendor,
          comparer: compareValues,
        },
        {
          name: "Date",
          extracted: extracted.date,
          expected: expectedDoc.document_date,
          comparer: compareValues,
        },
        {
          name: "Total Amount",
          extracted: extracted.totalAmount,
          expected: parseFloat(expectedDoc.grand_total),
          comparer: compareNumbers,
        },
      ];

      for (const field of fields) {
        totalFieldsTested++;
        const match = field.comparer(field.extracted, field.expected);

        results.push({
          File: fileName,
          Field: field.name,
          "PDF Value": field.expected,
          "Extracted Value": field.extracted,
          Match: match ? "✓" : "✗",
        });

        if (match) {
          passed++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
    }
  }

  // Generate report
  console.log("\n=== EXTRACTION ACCURACY REPORT ===\n");
  console.log("Detailed Results:\n");
  console.table(results);

  console.log("\n=== SUMMARY ===\n");
  console.log(`Total Fields Tested: ${totalFieldsTested}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const accuracy = totalFieldsTested > 0 ? ((passed / totalFieldsTested) * 100).toFixed(2) : 0;
  console.log(`Accuracy: ${accuracy}%\n`);

  // Save detailed report
  const reportPath = path.join(process.cwd(), "extraction_accuracy_report.json");
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalFieldsTested,
          passed,
          failed,
          accuracy: parseFloat(accuracy),
        },
        results,
      },
      null,
      2
    )
  );

  console.log(`Detailed report saved to: extraction_accuracy_report.json`);
})();
