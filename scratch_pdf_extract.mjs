import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText() {
  const filePath = 'test-data/AuditIQ_Master_Project_Bible_v1.0 (1).pdf';
  const data = new Uint8Array(fs.readFileSync(filePath));
  
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
  }
  
  const sectionStart = fullText.indexOf('12.8');
  if (sectionStart !== -1) {
    console.log(fullText.substring(sectionStart - 100, sectionStart + 2500));
  } else {
    console.log('Section 12.8 not found.');
    // fallback, print some TOC to see where it is
    console.log(fullText.substring(0, 3000));
  }
}

extractText().catch(console.error);
