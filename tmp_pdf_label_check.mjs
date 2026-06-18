import fs from 'fs/promises';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const files = [
  '01_perfect_match_po.pdf',
  '02_perfect_match_grn.pdf',
  '03_perfect_match_inv.pdf',
  '04_quantity_mismatch_po.pdf',
  '05_quantity_mismatch_grn.pdf',
  '06_quantity_mismatch_inv.pdf',
  '07_price_variance_po.pdf',
  '08_price_variance_grn.pdf',
  '09_price_variance_inv.pdf',
  '10_missing_grn_po.pdf',
  '11_missing_grn_inv.pdf',
  '12_duplicate_invoice_po.pdf',
  '13_duplicate_invoice_grn.pdf',
  '14_duplicate_invoice_inv.pdf',
  '15_duplicate_invoice_invcopy.pdf',
];

async function readPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const bytes = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const textItems = content.items.map((item) => item.str || '');
    pageTexts.push(textItems.join(' ').trim());
  }
  await loadingTask.destroy().catch(() => undefined);
  return pageTexts.join('\n');
}

function extractValue(text, regex) {
  const m = regex.exec(text);
  return m ? m[1].trim() : null;
}

function normText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

(async () => {
  const report = [];
  for (const fileName of files) {
    const filePath = path.join(process.cwd(), 'test-data', fileName);
    const text = await readPdfText(filePath);
    const documentNumber = extractValue(text, /(?:Document Number|PO Number|GRN Number|Invoice Number)\s*[:=\-]?\s*([A-Z0-9-]+(?:-[A-Z0-9]+)?)\b/i);
    const vendorName = extractValue(text, /Vendor Name\s*[:=\-]?\s*([^\n]{3,}?)\s{2,}/i);
    const date = extractValue(text, /Document Date\s*[:=\-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}-[0-9]{2}-[0-9]{4}|[0-9]{2}\/[^\s]+)/i);
    const totalAmount = extractValue(text, /Grand Total\s*[:=\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
    report.push({ fileName, documentNumber, vendorName, date, totalAmount, snippet: normText(text.slice(0, 1000)) });
  }
  await fs.writeFile('tmp_pdf_label_check_results.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('done');
})();
