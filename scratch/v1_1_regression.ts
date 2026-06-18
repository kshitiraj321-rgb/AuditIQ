import fs from "fs";
import path from "path";
import { extractDocumentData } from "../src/lib/extractor";
import { matchDocuments } from "../src/lib/matcher";
import { detectExceptions } from "../src/lib/exceptionEngine";
import { calculateFinancialExposure } from "../src/lib/financialExposure";
import { assessRisk } from "../src/lib/riskEngine";
import { generateRecommendations } from "../src/lib/recommendationEngine";
import { generateExplainability } from "../src/lib/explainability";

const TEST_CASES = [
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
  }
];

// Mock readPdfText to just read raw text from fixture or return mock
async function getFixtureText(fileName: string | null) {
  if (!fileName) return "";
  const filePath = path.join(__dirname, "../test-data", fileName);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8"); // Mocking since actual PDF parsing is async in browser
}

async function runRegression() {
  const results: any[] = [];
  for (const tc of TEST_CASES) {
    const poText = await getFixtureText(tc.po);
    const grnText = await getFixtureText(tc.grn);
    const invText = await getFixtureText(tc.inv);

    const poData = tc.po ? extractDocumentData("Purchase Order", poText) : null;
    const grnData = tc.grn ? extractDocumentData("Goods Receipt Note", grnText) : null;
    const invData = tc.inv ? extractDocumentData("Vendor Invoice", invText) : null;

    const matchResult = matchDocuments({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
    });

    const exceptions = detectExceptions({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
      matchResult,
      existingInvoices: tc.name === "Duplicate Invoice" ? [{ vendorName: invData?.vendorName || "", invoiceNumber: invData?.invoiceNumber || "" }] : [],
    });

    const exposure = calculateFinancialExposure({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
      exceptions,
    });

    const risk = assessRisk({ exceptions, financialExposure: exposure });
    
    const recommendations = generateRecommendations({ exceptions, risk, financialExposure: exposure });
    
    const explainability = generateExplainability({
      matchResult, exceptions, financialExposure: exposure, risk, recommendations, extractedDocuments: { purchaseOrder: poData, goodsReceiptNote: grnData, vendorInvoice: invData }
    });

    results.push({
      test: tc.name,
      exceptions: exceptions.map(e => e.type),
      exposure: exposure.totalExposure,
      riskScore: risk.score,
      riskLevel: risk.level,
      recsCount: recommendations.length,
      expCount: explainability.explanations.length,
    });
  }
  
  console.log(JSON.stringify(results, null, 2));
}

runRegression().catch(console.error);
