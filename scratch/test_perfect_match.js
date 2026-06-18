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
  const pm_po_text = await readPdfText(path.join(process.cwd(), "test-data", "01_perfect_match_po.pdf"));
  const pm_grn_text = await readPdfText(path.join(process.cwd(), "test-data", "02_perfect_match_grn.pdf"));
  const pm_inv_text = await readPdfText(path.join(process.cwd(), "test-data", "03_perfect_match_inv.pdf"));

  const po = extractDocumentData("Purchase Order", pm_po_text);
  const grn = extractDocumentData("Goods Receipt Note", pm_grn_text);
  const inv = extractDocumentData("Vendor Invoice", pm_inv_text);

  const matchResult = matchDocuments({ purchaseOrder: po, goodsReceiptNote: grn, vendorInvoice: inv });
  const exceptions = detectExceptions({ purchaseOrder: po, goodsReceiptNote: grn, vendorInvoice: inv, matchResult, existingInvoiceNumbers: [] });
  const exposure = calculateFinancialExposure({ purchaseOrder: po, goodsReceiptNote: grn, vendorInvoice: inv, exceptions });
  const risk = assessRisk({ exceptions, financialExposure: exposure });
  const recommendations = generateRecommendations({ exceptions, risk, financialExposure: exposure });
  const explainability = generateExplainability({ matchResult, exceptions, financialExposure: exposure, risk, recommendations, extractedDocuments: { purchaseOrder: po, goodsReceiptNote: grn, vendorInvoice: inv } });

  console.log("=== PERFECT MATCH RESULTS ===");
  console.log("Exceptions:", exceptions);
  console.log("Exposure:", exposure);
  console.log("Risk:", risk);
  console.log("Recommendations:", recommendations);
  console.log("Explainability Summary:", explainability.summary);
  console.log("Explanations:", explainability.explanations);
})();
