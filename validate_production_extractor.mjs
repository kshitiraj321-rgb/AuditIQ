import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// ─── Infrastructure failure counter ──────────────────────────────────────────
let infrastructureFailures = 0;

// ─── Inventories ─────────────────────────────────────────────────────────────
const falsePositiveInventory = [];
const falseNegativeInventory = [];

// ─── Analytics accumulators ──────────────────────────────────────────────────
const vendorStats = {};
const fieldStats = {};

// ─── PDF reader ──────────────────────────────────────────────────────────────
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

// ─── Document-type classifier ─────────────────────────────────────────────────
function classifyDocument(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("po")) return "Purchase Order";
  if (lower.includes("grn")) return "Goods Receipt Note";
  if (lower.includes("inv")) return "Vendor Invoice";
  return "Unknown";
}

// ─── API extraction function ──────────────────────────────────────────────────
async function callExtractionAPI(documentType, documentText) {
  const response = await fetch("http://localhost:3000/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentType, documentText }),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} from /api/extract`
    );
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("Malformed JSON response from /api/extract");
  }

  if (!json.success) {
    throw new Error(
      `API returned success=false: ${json.error ?? "unknown error"}`
    );
  }

  if (!json.data) {
    throw new Error("API response missing data payload");
  }

  return json.data;
}

// ─── Value comparators ────────────────────────────────────────────────────────
function normalizeForComparison(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim().toLowerCase();
}

function compareValues(extracted, expected) {
  const extNorm = normalizeForComparison(extracted);
  const expNorm = normalizeForComparison(expected);

  if (extNorm === null || expNorm === null) return extNorm === expNorm;
  if (extNorm === expNorm) return true;
  if (extNorm.includes(expNorm) || expNorm.includes(extNorm)) return true;
  return false;
}

function compareNumbers(extracted, expected) {
  if (extracted === null || extracted === undefined) {
    return expected === null || expected === undefined;
  }
  if (expected === null || expected === undefined) return false;

  const expectedNum =
    typeof expected === "string" ? parseFloat(expected) : expected;

  if (typeof extracted === "number" && !isNaN(expectedNum)) {
    const diff = Math.abs(extracted - expectedNum);
    const tolerance = Math.max(1, expectedNum * 0.0001);
    return diff <= tolerance;
  }

  return extracted === expectedNum;
}

// ─── File → dataset index mapping ─────────────────────────────────────────────
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

// ─── Helper: update vendorStats ───────────────────────────────────────────────
function trackVendor(vendorName, passed, isFP, isFN) {
  if (!vendorStats[vendorName]) {
    vendorStats[vendorName] = { passed: 0, failed: 0, falsePositives: 0, falseNegatives: 0 };
  }
  if (passed) {
    vendorStats[vendorName].passed++;
  } else {
    vendorStats[vendorName].failed++;
  }
  if (isFP) vendorStats[vendorName].falsePositives++;
  if (isFN) vendorStats[vendorName].falseNegatives++;
}

// ─── Helper: update fieldStats ────────────────────────────────────────────────
function trackField(fieldName, passed, isFP, isFN) {
  if (!fieldStats[fieldName]) {
    fieldStats[fieldName] = { passed: 0, failed: 0, falsePositives: 0, falseNegatives: 0 };
  }
  if (passed) {
    fieldStats[fieldName].passed++;
  } else {
    fieldStats[fieldName].failed++;
  }
  if (isFP) fieldStats[fieldName].falsePositives++;
  if (isFN) fieldStats[fieldName].falseNegatives++;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // Load ground-truth dataset
  const datasetPath = path.join(
    process.cwd(),
    "test-data",
    "procurement_dataset.json"
  );
  const datasetText = await fs.readFile(datasetPath, "utf-8");
  const dataset = JSON.parse(datasetText);

  let totalFieldsTested = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  const files = Object.keys(fileToDocumentIndex).sort();

  console.log("\n=== DECISION-GRADE VALIDATION FRAMEWORK ===");
  console.log("Target: POST http://localhost:3000/api/extract");
  console.log(`Documents: ${files.length}\n`);

  for (const fileName of files) {
    const filePath = path.join(process.cwd(), "test-data", fileName);
    const docIndex = fileToDocumentIndex[fileName];
    const expectedDoc = dataset.documents[docIndex];

    if (!expectedDoc) {
      console.error(`[SKIP] No ground truth for ${fileName}`);
      continue;
    }

    const vendorLabel = expectedDoc.vendor ?? "Unknown Vendor";

    // ── Read PDF text ────────────────────────────────────────────────────────
    let documentText;
    try {
      documentText = await readPdfTextFromFile(filePath);
    } catch (pdfErr) {
      console.error(`[INFRA] PDF read failed for ${fileName}: ${pdfErr.message}`);
      infrastructureFailures++;
      continue;
    }

    const docType = classifyDocument(fileName);

    // ── Call API ─────────────────────────────────────────────────────────────
    let extracted;
    try {
      extracted = await callExtractionAPI(docType, documentText);
    } catch (apiErr) {
      const msg = apiErr.message ?? "";
      const isInfra =
        msg.includes("fetch") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("Timeout") ||
        msg.includes("Malformed") ||
        msg.includes("429") ||
        msg.includes("500") ||
        msg.includes("HTTP 5") ||
        msg.includes("HTTP 4");

      if (isInfra) {
        console.error(`[INFRA] ${fileName}: ${msg}`);
        infrastructureFailures++;
      } else {
        console.error(`[EXTRACT] ${fileName}: ${msg}`);
      }
      continue;
    }

    // ── Ground-truth field mapping ────────────────────────────────────────────
    const groundTruth = {
      vendor:           expectedDoc.vendor ?? null,
      vendorName:       expectedDoc.vendor ?? null,
      documentNumber:   expectedDoc.document_number ?? null,
      poNumber:         expectedDoc.po_number ?? null,
      grnNumber:        expectedDoc.grn_number ?? null,
      invoiceNumber:    expectedDoc.invoice_number ?? null,
      date:             expectedDoc.document_date ?? null,
      normalizedDate:   expectedDoc.document_date ?? null,
      quantity: (() => {
        const items = expectedDoc.items ?? [];
        if (!items.length) return null;
        return items.reduce(
          (sum, item) => sum + Number(item.qty || 0),
          0
        );
      })(),

      amount:
        expectedDoc.subtotal != null
          ? Number(expectedDoc.subtotal)
          : null,

      unitPrice: (() => {
        const items = expectedDoc.items ?? [];
        if (!items.length) return null;
        const totalQty = items.reduce(
          (sum, item) => sum + Number(item.qty || 0),
          0
        );
        const subtotal =
          expectedDoc.subtotal != null
            ? Number(expectedDoc.subtotal)
            : null;
        if (!subtotal || totalQty <= 0) return null;
        return subtotal / totalQty;
      })(),
      totalAmount:      expectedDoc.grand_total ?? null,
    };

    // Field definitions: name, key, comparator
    const fieldDefs = [
      { name: "vendor",          key: "vendor",          cmp: compareValues  },
      { name: "vendorName",      key: "vendorName",      cmp: compareValues  },
      { name: "documentNumber",  key: "documentNumber",  cmp: compareValues  },
      { name: "poNumber",        key: "poNumber",        cmp: compareValues  },
      { name: "grnNumber",       key: "grnNumber",       cmp: compareValues  },
      { name: "invoiceNumber",   key: "invoiceNumber",   cmp: compareValues  },
      { name: "date",            key: "date",            cmp: compareValues  },
      { name: "normalizedDate",  key: "normalizedDate",  cmp: compareValues  },
      { name: "quantity",        key: "quantity",        cmp: compareNumbers },
      { name: "unitPrice",       key: "unitPrice",       cmp: compareNumbers },
      { name: "amount",          key: "amount",          cmp: compareNumbers },
      { name: "totalAmount",     key: "totalAmount",     cmp: compareNumbers },
    ];

    console.log(`[PROCESSING] ${fileName} (${docType})`);

    for (const fd of fieldDefs) {
      const aiValue       = extracted[fd.key] ?? null;
      const expectedValue = groundTruth[fd.key];

      const match = fd.cmp(aiValue, expectedValue);

      // ── False Positive / False Negative classification ──────────────────
      const isFP =
        expectedValue !== null &&
        aiValue !== null &&
        aiValue !== undefined &&
        !match;

      const isFN =
        expectedValue !== null &&
        (aiValue === null || aiValue === undefined);

      // ── Accumulate totals ───────────────────────────────────────────────
      totalFieldsTested++;
      if (match) totalPassed++;
      else totalFailed++;

      // ── Analytics tracking ──────────────────────────────────────────────
      trackVendor(vendorLabel, match, isFP, isFN);
      trackField(fd.name, match, isFP, isFN);

      // ── Inventories ─────────────────────────────────────────────────────
      if (isFP) {
        falsePositiveInventory.push({
          file:        fileName,
          vendor:      vendorLabel,
          field:       fd.name,
          expected:    expectedValue,
          aiExtracted: aiValue,
        });
      }

      if (isFN) {
        falseNegativeInventory.push({
          file:        fileName,
          vendor:      vendorLabel,
          field:       fd.name,
          expected:    expectedValue,
          aiExtracted: aiValue,
        });
      }

      const icon = match ? "✓" : isFN ? "∅" : "✗";
      console.log(
        `  [${icon}] ${fd.name.padEnd(16)} expected=${String(expectedValue).padEnd(30)} ai=${String(aiValue)}`
      );
    }

    // ── OpenAI rate-limit protection ──────────────────────────────────────
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  // ─── Build vendor breakdown ────────────────────────────────────────────────
  const vendorBreakdown = {};
  for (const [vendor, stats] of Object.entries(vendorStats)) {
    const total = stats.passed + stats.failed;
    vendorBreakdown[vendor] = {
      ...stats,
      accuracy: total > 0 ? `${((stats.passed / total) * 100).toFixed(2)}%` : "N/A",
    };
  }

  // ─── Build field breakdown ─────────────────────────────────────────────────
  const fieldBreakdown = {};
  for (const [field, stats] of Object.entries(fieldStats)) {
    const total = stats.passed + stats.failed;
    fieldBreakdown[field] = {
      ...stats,
      accuracy: total > 0 ? `${((stats.passed / total) * 100).toFixed(2)}%` : "N/A",
    };
  }

  // ─── Overall accuracy ──────────────────────────────────────────────────────
  const overallAccuracy =
    totalFieldsTested > 0
      ? `${((totalPassed / totalFieldsTested) * 100).toFixed(2)}%`
      : "N/A";

  // ─── Console summary ──────────────────────────────────────────────────────
  console.log("\n=== SUMMARY ===\n");
  console.log(`Total Fields Tested:    ${totalFieldsTested}`);
  console.log(`Passed:                 ${totalPassed}`);
  console.log(`Failed:                 ${totalFailed}`);
  console.log(`Overall Accuracy:       ${overallAccuracy}`);
  console.log(`Infrastructure Failures:${infrastructureFailures}`);
  console.log(`False Positives:        ${falsePositiveInventory.length}`);
  console.log(`False Negatives:        ${falseNegativeInventory.length}`);

  console.log("\n=== VENDOR BREAKDOWN ===\n");
  for (const [vendor, stats] of Object.entries(vendorBreakdown)) {
    console.log(
      `  ${vendor}: ${stats.accuracy} (P=${stats.passed} F=${stats.failed} FP=${stats.falsePositives} FN=${stats.falseNegatives})`
    );
  }

  console.log("\n=== FIELD BREAKDOWN ===\n");
  for (const [field, stats] of Object.entries(fieldBreakdown)) {
    console.log(
      `  ${field.padEnd(18)}: ${stats.accuracy.padStart(8)} (P=${stats.passed} F=${stats.failed} FP=${stats.falsePositives} FN=${stats.falseNegatives})`
    );
  }

  // ─── Write decision-grade report ──────────────────────────────────────────
  const report = {
    timestamp:              new Date().toISOString(),
    overallAccuracy,
    infrastructureFailures,
    summary: {
      totalFieldsTested,
      passed: totalPassed,
      failed: totalFailed,
    },
    vendorBreakdown,
    fieldBreakdown,
    falsePositiveInventory,
    falseNegativeInventory,
  };

  const reportPath = path.join(
    process.cwd(),
    "production_extractor_accuracy_report.json"
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(
    `\nReport saved → production_extractor_accuracy_report.json\n`
  );
})();
