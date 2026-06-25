import path from "path";
import fs from "fs/promises";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function readPdfText(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const bytes = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str || "");
    pageTexts.push(textItems.join(" ").trim());
  }
  await loadingTask.destroy().catch(() => undefined);
  return pageTexts.join("\n");
}

(async () => {
  const files = [
    "04_quantity_mismatch_po.pdf",
    "06_quantity_mismatch_inv.pdf"
  ];

  for (const file of files) {
    console.log(`\n=== RAW PDF TEXT FOR ${file} ===`);
    const filePath = path.join(process.cwd(), "test-data", file);
    const documentText = await readPdfText(filePath);
    const match = documentText.match(/Vendor Name.*?(?=Document Date|PO Number|GRN Number|Invoice Number)/i);
    console.log(match ? match[0] : "NO MATCH");
  }
})();
