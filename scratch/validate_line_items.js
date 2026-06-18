const fs = require('fs');
const path = require('path');

function parseNumber(rawValue) {
  const normalizedValue = rawValue.replace(/,/g, '').trim();
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function headerAwareExtract(documentText) {
  const lines = documentText.split(/\r?\n/);
    const headerRegex = /\b(qty|quantity)\b.*\b(unit ?price|rate|price)\b.*\b(amount|line ?total|line_amount|line total)\b/i;
  let headerIndex = -1;
  let headerLine = '';
  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i])) { headerIndex = i; headerLine = lines[i]; break; }
  }
  // debug: show header details on first invocation
  headerAwareExtract._calls = (headerAwareExtract._calls || 0) + 1;
  if (headerAwareExtract._calls === 1) {
    console.log('headerAwareExtract detected headerLine:', JSON.stringify(headerLine));
  }
  if (headerIndex < 0) return null;
  const qtyPos = headerLine.search(/\b(qty|quantity)\b/i);
  const pricePos = headerLine.search(/\b(unit ?price|rate|price)\b/i);
  const amountPos = headerLine.search(/\b(amount|line ?total|line_amount|line total)\b/i);
  if (headerAwareExtract._calls === 1) console.log('positions:', { qtyPos, pricePos, amountPos });

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) break;
    let qtyText = null, priceText = null, amountText = null;
      // Split header into fields by runs of two or more spaces
      const headerFields = headerLine.split(/\s{2,}/).map((s) => s.trim());
      const findHeaderIndex = (rx) => headerFields.findIndex((h) => rx.test(h));
      const qtyIndex = findHeaderIndex(/\b(qty|quantity)\b/i);
      const priceIndex = findHeaderIndex(/\b(unit ?price|rate|price)\b/i);
      const amountIndex = findHeaderIndex(/\b(amount|line ?total|line_amount|line total)\b/i);

      const rowFields = row.split(/\s{2,}/).map((s) => s.trim());
      if (qtyIndex >= 0 && priceIndex >= 0 && amountIndex >= 0 && rowFields.length > Math.max(qtyIndex, priceIndex, amountIndex)) {
        qtyText = rowFields[qtyIndex];
        priceText = rowFields[priceIndex];
        amountText = rowFields[amountIndex];
      } else {
      const numRegex = /[0-9][0-9,]*(?:\.[0-9]+)?/g;
      const nums = row.match(numRegex);
      if (nums && nums.length >= 3) { qtyText = nums[0]; priceText = nums[1]; amountText = nums[2]; }
    }
    const q = qtyText ? parseNumber(qtyText) : null;
    const p = priceText ? parseNumber(priceText) : null;
    const a = amountText ? parseNumber(amountText) : null;
    if (q !== null && p !== null && a !== null) return { quantity: q, unitPrice: p, amount: a };
  }
  return null;
}

const datasetPath = path.join(__dirname, '..', 'test-data', 'procurement_dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const results = [];
let total = 0, matched = 0, partial = 0, missed = 0;

for (const doc of dataset.documents) {
  if (!doc.items || doc.items.length === 0) continue;
  total++;
  // Build a simple textual invoice with header and rows
  const header = 'Item    Qty    Unit Price    Amount';
  const rows = doc.items.map(it => `${it.item}    ${it.qty}    ${it.unit_price}    ${it.line_amount}`);
  const text = [doc.document_number || '', 'Vendor: ' + (doc.vendor||''), header, ...rows].join('\n');
  if (total === 1) {
    console.log('--- Debug sample text for first document ---');
    console.log(text);
    console.log('-------------------------------------------');
  }
  // Quick header regex check
  const testHeaderRegex = /\b(qty|quantity)\b.*\b(unit ?price|rate|price)\b.*\b(amount|line ?total|line_amount|line total)\b/i;
  if (total === 1) console.log('headerRegex test on synthetic header:', testHeaderRegex.test(header));
  const extracted = headerAwareExtract(text);
  const expected = { quantity: parseNumber(doc.items[0].qty), unitPrice: parseNumber(doc.items[0].unit_price), amount: parseNumber(doc.items[0].line_amount) };
  let status = 'missed';
  if (!extracted) { missed++; status = 'missed'; }
  else if (extracted.quantity === expected.quantity && extracted.unitPrice === expected.unitPrice && extracted.amount === expected.amount) { matched++; status = 'matched'; }
  else { partial++; status = 'partial'; }
  results.push({ doc: doc.document_number, status, expected, extracted });
}

console.log('Validation summary: total documents with items =', total);
console.log('matched:', matched, 'partial:', partial, 'missed:', missed);
console.log('Sample failures (up to 10):');
console.log(results.filter(r=>r.status!=='matched').slice(0,10));

// Save results
fs.writeFileSync(path.join(__dirname, 'validate_results.json'), JSON.stringify({ total, matched, partial, missed, results: results.slice(0,50) }, null, 2));
console.log('Saved results to scratch/validate_results.json');
