import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractDocumentData } from "../src/lib/extractor.ts";
import { matchDocuments } from "../src/lib/matcher.ts";
import { detectExceptions } from "../src/lib/exceptionEngine.ts";
import { calculateFinancialExposure } from "../src/lib/financialExposure.ts";

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

function classifyDocument(name) {
  const lower = name.toLowerCase();
  if (lower.includes("po")) return "Purchase Order";
  if (lower.includes("grn")) return "Goods Receipt Note";
  if (lower.includes("inv")) return "Vendor Invoice";
  return "Unknown";
}

const scenarios = [
  {
    name: "Perfect Match",
    po: "01_perfect_match_po.pdf",
    grn: "02_perfect_match_grn.pdf",
    inv: "03_perfect_match_inv.pdf",
  },
  {
    name: "Quantity Mismatch",
    po: "04_quantity_mismatch_po.pdf",
    grn: "05_quantity_mismatch_grn.pdf",
    inv: "06_quantity_mismatch_inv.pdf",
  },
  {
    name: "Price Variance",
    po: "07_price_variance_po.pdf",
    grn: "08_price_variance_grn.pdf",
    inv: "09_price_variance_inv.pdf",
  },
  {
    name: "Missing GRN",
    po: "10_missing_grn_po.pdf",
    grn: null,
    inv: "11_missing_grn_inv.pdf",
  },
  {
    name: "Duplicate Invoice",
    po: "12_duplicate_invoice_po.pdf",
    grn: "13_duplicate_invoice_grn.pdf",
    inv: "14_duplicate_invoice_inv.pdf",
    invCopy: "15_duplicate_invoice_invcopy.pdf",
  },
];

(async () => {
  for (const sc of scenarios) {
    console.log(`\n=== SCENARIO: ${sc.name} ===`);
    const poText = sc.po ? await readPdfText(path.join(process.cwd(), "test-data", sc.po)) : null;
    const grnText = sc.grn ? await readPdfText(path.join(process.cwd(), "test-data", sc.grn)) : null;
    const invText = sc.inv ? await readPdfText(path.join(process.cwd(), "test-data", sc.inv)) : null;

    const poData = poText ? extractDocumentData("Purchase Order", poText) : null;
    const grnData = grnText ? extractDocumentData("Goods Receipt Note", grnText) : null;
    const invData = invText ? extractDocumentData("Vendor Invoice", invText) : null;

    console.log("Extracted PO:", poData ? { quantity: poData.quantity, unitPrice: poData.unitPrice, amount: poData.amount, totalAmount: poData.totalAmount } : "null");
    console.log("Extracted GRN:", grnData ? { quantity: grnData.quantity, unitPrice: grnData.unitPrice, amount: grnData.amount, totalAmount: grnData.totalAmount } : "null");
    console.log("Extracted Invoice:", invData ? { quantity: invData.quantity, unitPrice: invData.unitPrice, amount: invData.amount, totalAmount: invData.totalAmount } : "null");

    const matchResult = matchDocuments({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
    });
    console.log("Match Result:", JSON.stringify(matchResult, null, 2));

    const exceptions = detectExceptions({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
      matchResult,
      existingInvoiceNumbers: sc.invCopy ? [invData?.documentNumber].filter(Boolean) : [],
    });
    console.log("Exceptions:", exceptions);

    try {
      const exposure = calculateFinancialExposure({
        purchaseOrder: poData,
        goodsReceiptNote: grnData,
        vendorInvoice: invData,
        exceptions,
      });
      console.log("Exposure Result:", JSON.stringify(exposure, null, 2));
    } catch (e) {
      console.error("Exposure Calculation failed with error:", e.message);
    }
  }
})();
