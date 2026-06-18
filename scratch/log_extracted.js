import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractDocumentData } from "../src/lib/extractor.ts";

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
  for (const fileName of files) {
    const filePath = path.join(process.cwd(), "test-data", fileName);
    const text = await readPdfText(filePath);
    const type = classifyDocument(fileName);
    const data = extractDocumentData(type, text);
    console.log(`\n=== ${fileName} (${type}) ===`);
    console.log(`quantity: ${data?.quantity}`);
    console.log(`unitPrice: ${data?.unitPrice}`);
    console.log(`amount: ${data?.amount}`);
    console.log(`totalAmount: ${data?.totalAmount}`);
  }
})();
