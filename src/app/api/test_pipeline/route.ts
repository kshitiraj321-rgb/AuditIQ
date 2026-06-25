import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { extractDocumentData } from "@/lib/extractor";
import { matchDocuments } from "@/lib/matcher";
import { detectExceptions } from "@/lib/exceptionEngine";
import { calculateFinancialExposure } from "@/lib/financialExposure";
import { assessRisk } from "@/lib/riskEngine";
import { generateRecommendations } from "@/lib/recommendationEngine";
import { generateExplainability } from "@/lib/explainability";
import { calculateExceptionRisks } from "@/lib/exceptionRisk";
import { prioritizeExceptions } from "@/lib/prioritizationEngine";

const TEST_CASES = [
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
    name: "Missing Invoice",
    po: "10_missing_grn_po.pdf",
    grn: "10_missing_grn_po.pdf", // Assuming missing invoice uses PO and GRN only
    inv: null,
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

export async function GET() {
  const results = [];
  
  for (const tc of TEST_CASES) {
    const poData = tc.po ? extractDocumentData("Purchase Order", "", null) : null;
    const grnData = tc.grn ? extractDocumentData("Goods Receipt Note", "", null) : null;
    const invData = tc.inv ? extractDocumentData("Vendor Invoice", "", null) : null;

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
      existingInvoices: tc.name === "Duplicate Invoice" ? [{ vendorName: "ABC Industries", invoiceNumber: "INV-1002" }] : [],
    });

    const exposure = calculateFinancialExposure({
      purchaseOrder: poData,
      goodsReceiptNote: grnData,
      vendorInvoice: invData,
      exceptions,
    });

    const exceptionRisks = calculateExceptionRisks(exceptions, exposure);
    
    // Fallback invData for missing invoice scenario to allow priority generation
    const vendorInvoiceData = invData || poData || grnData;

    const prioritizedQueue = vendorInvoiceData ? prioritizeExceptions(exceptions, exceptionRisks, vendorInvoiceData) : [];

    results.push({
      scenario: tc.name,
      files: { po: tc.po, grn: tc.grn, inv: tc.inv },
      exceptions: exceptions.map(e => ({ type: e.type, severity: e.severity })),
      exposure: exposure.totalExposure,
      queue: prioritizedQueue.map(p => ({
        exception: p.exception.type,
        baseRisk: p.baseRiskScore,
        compliance: p.complianceScore,
        vendor: p.vendorScore,
        transaction: p.transactionScore,
        finalScore: p.finalPriorityScore
      }))
    });
  }

  return NextResponse.json(results);
}
