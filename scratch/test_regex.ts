const text = "Procurement & Accounts Payable | Scenario:   Quantity Mismatch  Vendor Invoice  Document Number:   INV-NS-2026-0002  Vendor Name   Vertex Packaging Solutions Pvt. Ltd.   Vendor Address";
const startLabels = ["Vendor Name", "Vendor", "Supplier Name", "Bill From", "From:"];
const endLabels = ["Vendor Address", "Vendor Address:", "Address", "Location"];

function escapeRegExp(rawValue: string) {
  return rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTextValue(rawValue: string) {
  return rawValue
    .replace(/\s+/g, " ")
    .replace(/^[\s:=-]+/, "")
    .replace(/[\s.,;|]+$/, "")
    .trim();
}

const startPattern = startLabels.map(escapeRegExp).join("|");
const endPattern = endLabels.map(escapeRegExp).join("|");
const pattern = new RegExp(
  `\\b(?:${startPattern})\\b\\s*[:=\\-]?\\s*(.+?)(?=\\s+\\b(?:${endPattern})\\b|$)`,
  "i"
);

const match = text.match(pattern);
console.log("MATCH:", match ? match[1] : null);
console.log("NORMALIZED:", match ? normalizeTextValue(match[1]) : null);
