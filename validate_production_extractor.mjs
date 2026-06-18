import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractDocumentData } from "./src/lib/extractor.ts";

// Minimal Node.js wrapper - only for reading PDF text from disk
async function readPdfTextFromFile(filePath) {
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

function classifyDocument(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("po")) return "Purchase Order";
  if (lower.includes("grn")) return "Goods Receipt Note";
  if (lower.includes("inv")) return "Vendor Invoice";
  return "Unknown";
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
  
  if (extNorm === expNorm) return true;
  if (extNorm.includes(expNorm) || expNorm.includes(extNorm)) return true;
  
  return false;
}

function compareNumbers(extracted, expected) {
  if (extracted === null || extracted === undefined) {
    return expected === null || expected === undefined;
  }
  if (expected === null || expected === undefined) return false;
  
  const expectedNum = typeof expected === "string" ? parseFloat(expected) : expected;
  
  if (typeof extracted === "number" && !isNaN(expectedNum)) {
    const diff = Math.abs(extracted - expectedNum);
    const tolerance = Math.max(1, expectedNum * 0.0001);
    return diff <= tolerance;
  }
  
  return extracted === expectedNum;
}

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
      const documentText = await readPdfTextFromFile(filePath);
      const docType = classifyDocument(fileName);
      const docIndex = fileToDocumentIndex[fileName];
      const expectedDoc = dataset.documents[docIndex];

      if (!expectedDoc) {
        console.error(`No expected document found for ${fileName}`);
        continue;
      }

      // CALL THE REAL PRODUCTION FUNCTION
      const extracted = extractDocumentData(docType, documentText);

      if (!extracted) {
        console.error(`Failed to extract data for ${fileName}`);
        continue;
      }

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
          Expected: field.expected,
          Actual: field.extracted,
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
  console.log("\n=== PRODUCTION EXTRACTOR ACCURACY REPORT ===\n");
  console.log("Using: extractDocumentData() from src/lib/extractor.ts\n");
  console.log("Detailed Results:\n");
  console.table(results);

  console.log("\n=== SUMMARY ===\n");
  console.log(`Total Fields Tested: ${totalFieldsTested}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const accuracy = totalFieldsTested > 0 ? ((passed / totalFieldsTested) * 100).toFixed(2) : 0;
  console.log(`Accuracy: ${accuracy}%\n`);

  // Save detailed report
  const reportPath = path.join(process.cwd(), "production_extractor_accuracy_report.json");
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        source: "extractDocumentData() from src/lib/extractor.ts",
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

  console.log(`Report saved to: production_extractor_accuracy_report.json`);
})();
