const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'extraction_validation_results.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const r of data) {
  const pdf = r.pdfValues;
  const ex = r.extractedValues;
  const docNumberMatch = String(pdf.documentNumber).trim() === String(ex.documentNumber).trim();
  const vendorMatch = String(pdf.vendorName).trim() === String(ex.vendorName).trim();
  const dateMatch = String(pdf.date).trim() === String(ex.date).trim();
  const totalMatch = String(pdf.totalAmount).trim() === String(ex.totalAmount).trim();
  console.log('FILE:', r.fileName);
  console.log(' DOC TYPE:', r.docType);
  console.log(' PDF Document Number:', JSON.stringify(pdf.documentNumber));
  console.log(' EXTRACTED Document Number:', JSON.stringify(ex.documentNumber));
  console.log(' Document Number Match:', docNumberMatch);
  console.log(' PDF Vendor Name:', JSON.stringify(pdf.vendorName));
  console.log(' EXTRACTED Vendor Name:', JSON.stringify(ex.vendorName));
  console.log(' Vendor Name Match:', vendorMatch);
  console.log(' PDF Date:', JSON.stringify(pdf.date));
  console.log(' EXTRACTED Date:', JSON.stringify(ex.date));
  console.log(' Date Match:', dateMatch);
  console.log(' PDF Total Amount:', JSON.stringify(pdf.totalAmount));
  console.log(' EXTRACTED Total Amount:', JSON.stringify(ex.totalAmount));
  console.log(' Total Amount Match:', totalMatch);
  console.log('---');
}
