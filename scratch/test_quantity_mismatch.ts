import path from "path";
import fs from "fs/promises";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { classifyDocument } from "../src/lib/classifier";
import { extractDocumentData, extractionProvenance } from "../src/lib/extractor";
import { calculateExtractionConfidence } from "../src/lib/extractionConfidence";

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
    "05_quantity_mismatch_grn.pdf",
    "06_quantity_mismatch_inv.pdf"
  ];

  for (const file of files) {
    console.log(`\n=== Processing: ${file} ===`);
    const filePath = path.join(process.cwd(), "test-data", file);
    const documentText = await readPdfText(filePath);
    const classification = classifyDocument(file);
    const extracted = extractDocumentData(classification.type, documentText);
    const prov = extracted ? extractionProvenance.get(extracted) : undefined;
    const conf = extracted ? calculateExtractionConfidence(extracted) : undefined;

    console.log("Classified as:", classification.type);
    console.log("--- Extracted Data ---");
    console.log(JSON.stringify(extracted, null, 2));
    console.log("--- Provenance ---");
    console.log(JSON.stringify(prov, null, 2));
    console.log("--- Confidence ---");
    console.log(JSON.stringify(conf, null, 2));
  }
})();
