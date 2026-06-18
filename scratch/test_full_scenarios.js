import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractDocumentData } from "../src/lib/extractor.ts";
import { matchDocuments } from "../src/lib/matcher.ts";
import { detectExceptions } from "../src/lib/exceptionEngine.ts";
import { calculateFinancialExposure } from "../src/lib/financialExposure.ts";
import { assessRisk } from "../src/lib/riskEngine.ts";
import { generateRecommendations } from "../src/lib/recommendationEngine.ts";
import { generateExplainability } from "../src/lib/explainability.ts";

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

(async () => {
  // Scenario 1: Perfect Match
  const pm_po_text = await readPdfText(path.join(process.cwd(), "test-data", "01_perfect_match_po.pdf"));
  const pm_grn_text = await readPdfText(path.join(process.cwd(), "test-data", "02_perfect_match_grn.pdf"));
  const pm_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "03_perfect_match_inv.pdf"));

  // Scenario 2: Quantity Mismatch
  const qm_po_text = await readPdfText(path.join(process.cwd(), "test-data", "04_quantity_mismatch_po.pdf"));
  const qm_grn_text = await readPdfText(path.join(process.cwd(), "test-data", "05_quantity_mismatch_grn.pdf"));
  const qm_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "06_quantity_mismatch_inv.pdf"));

  // Scenario 3: Price Variance
  const pv_po_text = await readPdfText(path.join(process.cwd(), "test-data", "07_price_variance_po.pdf"));
  const pv_grn_text = await readPdfText(path.join(process.cwd(), "test-data", "08_price_variance_grn.pdf"));
  const pv_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "09_price_variance_inv.pdf"));

  // Scenario 4: Missing Invoice
  // (We use PO & GRN from Perfect Match, and null for Invoice)

  // Scenario 5: Missing GRN
  const mg_po_text = await readPdfText(path.join(process.cwd(), "test-data", "10_missing_grn_po.pdf"));
  const mg_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "11_missing_grn_inv.pdf"));

  // Scenario 6: Duplicate Invoice
  const di_po_text = await readPdfText(path.join(process.cwd(), "test-data", "12_duplicate_invoice_po.pdf"));
  const di_grn_text = await readPdfText(path.join(process.cwd(), "test-data", "13_duplicate_invoice_grn.pdf"));
  const di_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "14_duplicate_invoice_inv.pdf"));

  const scenarios = [
    {
      id: 1,
      name: "Perfect Match",
      po: extractDocumentData("Purchase Order", pm_po_text),
      grn: extractDocumentData("Goods Receipt Note", pm_grn_text),
      inv: extractDocumentData("Vendor Invoice", pm_inv_text),
      history: [],
    },
    {
      id: 2,
      name: "Quantity Mismatch",
      po: extractDocumentData("Purchase Order", qm_po_text),
      grn: extractDocumentData("Goods Receipt Note", qm_grn_text),
      inv: extractDocumentData("Vendor Invoice", qm_inv_text),
      history: [],
    },
    {
      id: 3,
      name: "Price Variance",
      po: extractDocumentData("Purchase Order", pv_po_text),
      grn: extractDocumentData("Goods Receipt Note", pv_grn_text),
      inv: extractDocumentData("Vendor Invoice", pv_inv_text),
      history: [],
    },
    {
      id: 4,
      name: "Missing Invoice",
      po: extractDocumentData("Purchase Order", pm_po_text),
      grn: extractDocumentData("Goods Receipt Note", pm_grn_text),
      inv: null,
      history: [],
    },
    {
      id: 5,
      name: "Missing GRN",
      po: extractDocumentData("Purchase Order", mg_po_text),
      grn: null,
      inv: extractDocumentData("Vendor Invoice", mg_inv_text),
      history: [],
    },
    {
      id: 6,
      name: "Duplicate Invoice",
      po: extractDocumentData("Purchase Order", di_po_text),
      grn: extractDocumentData("Goods Receipt Note", di_grn_text),
      inv: extractDocumentData("Vendor Invoice", di_inv_text),
      history: [extractDocumentData("Vendor Invoice", di_inv_text)?.documentNumber],
    },
  ];

  for (const s of scenarios) {
    console.log(`\n==================================================`);
    console.log(`SCENARIO: ${s.name}`);
    console.log(`==================================================`);
    
    const matchResult = matchDocuments({
      purchaseOrder: s.po,
      goodsReceiptNote: s.grn,
      vendorInvoice: s.inv,
    });

    const exceptions = detectExceptions({
      purchaseOrder: s.po,
      goodsReceiptNote: s.grn,
      vendorInvoice: s.inv,
      matchResult,
      existingInvoiceNumbers: s.history,
    });

    const exposure = calculateFinancialExposure({
      purchaseOrder: s.po,
      goodsReceiptNote: s.grn,
      vendorInvoice: s.inv,
      exceptions,
    });

    const risk = assessRisk({
      exceptions,
      financialExposure: exposure,
    });

    const recommendations = generateRecommendations({
      exceptions,
      risk,
      financialExposure: exposure,
    });

    const explainability = generateExplainability({
      matchResult,
      exceptions,
      financialExposure: exposure,
      risk,
      recommendations,
      extractedDocuments: {
        purchaseOrder: s.po,
        goodsReceiptNote: s.grn,
        vendorInvoice: s.inv,
      },
    });

    console.log(`Detected Exceptions:`, exceptions.map(e => `${e.type} (${e.severity})`));
    console.log(`Financial Exposure:`, JSON.stringify(exposure, null, 2));
    console.log(`Risk Assessment:`, JSON.stringify(risk, null, 2));
    console.log(`Recommendations:`, recommendations);
    console.log(`Explainability Output:`, JSON.stringify(explainability, null, 2));
  }
})();
