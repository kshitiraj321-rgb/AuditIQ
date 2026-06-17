"use client";

import Link from "next/link";
import type { MatchDocumentsResult } from "@/lib/matcher";
import { useEffect, useState } from "react";
import type { FinancialExposureResult } from "@/lib/financialExposure";
import type { RiskAssessmentResult } from "@/lib/riskEngine";
import type { ExplainabilityResult } from "@/lib/explainability";
import type { ContentVerificationResult } from "@/lib/classifier";

type AnalysisResult = {
  files: {
    purchaseOrder: string;
    goodsReceiptNote: string;
    vendorInvoice: string;
  };
  classifications: {
    purchaseOrder: string;
    purchaseOrderConfidence: number;
    purchaseOrderVerification: ContentVerificationResult;
    goodsReceiptNote: string;
    goodsReceiptNoteConfidence: number;
    goodsReceiptNoteVerification: ContentVerificationResult;
    vendorInvoice: string;
    vendorInvoiceConfidence: number;
    vendorInvoiceVerification: ContentVerificationResult;
  };
  extractedData: {
    purchaseOrder: {
      vendor: string;
      documentNumber: string;
      date: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    } | null;
    goodsReceiptNote: {
      vendor: string;
      documentNumber: string;
      date: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    } | null;
    vendorInvoice: {
      vendor: string;
      documentNumber: string;
      date: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    } | null;
  };
  matchResult: MatchDocumentsResult;
  exceptions: {
    type: string;
    severity: string;
  }[];
  financialExposure: FinancialExposureResult;
  risk: RiskAssessmentResult;
  recommendations: string[];
  explainability: ExplainabilityResult;
};

const analysisStorageKey = "auditIQAnalysis";

function readAnalysisFromStorage() {
  const storedAnalysis = sessionStorage.getItem(analysisStorageKey);

  if (!storedAnalysis) {
    return fallbackAnalysis;
  }

  try {
    const parsedAnalysis = JSON.parse(storedAnalysis) as Partial<AnalysisResult>;

    if (!parsedAnalysis.explainability) {
      return fallbackAnalysis;
    }

    return parsedAnalysis as AnalysisResult;
  } catch {
    return fallbackAnalysis;
  }
}

const fallbackAnalysis: AnalysisResult = {
  files: {
    purchaseOrder: "PO-001.pdf",
    goodsReceiptNote: "GRN-001.pdf",
    vendorInvoice: "INV-001.pdf",
  },
  classifications: {
    purchaseOrder: "Purchase Order",
    purchaseOrderConfidence: 95,
    purchaseOrderVerification: {
      verified: true,
      contentType: "Purchase Order",
      adjustedConfidence: 95,
      conflict: false,
    },
    goodsReceiptNote: "Goods Receipt Note",
    goodsReceiptNoteConfidence: 95,
    goodsReceiptNoteVerification: {
      verified: true,
      contentType: "Goods Receipt Note",
      adjustedConfidence: 95,
      conflict: false,
    },
    vendorInvoice: "Vendor Invoice",
    vendorInvoiceConfidence: 95,
    vendorInvoiceVerification: {
      verified: true,
      contentType: "Vendor Invoice",
      adjustedConfidence: 95,
      conflict: false,
    },
  },
  extractedData: {
    purchaseOrder: {
      vendor: "ABC Industries",
      documentNumber: "PO-1001",
      date: "2026-06-12",
      quantity: 100,
      unitPrice: 500,
      amount: 50000,
    },
    goodsReceiptNote: {
      vendor: "ABC Industries",
      documentNumber: "GRN-1001",
      date: "2026-06-12",
      quantity: 95,
      unitPrice: 500,
      amount: 47500,
    },
    vendorInvoice: {
      vendor: "ABC Industries",
      documentNumber: "INV-1001",
      date: "2026-06-12",
      quantity: 100,
      unitPrice: 620,
      amount: 62000,
    },
  },
  matchResult: {
    quantityMatch: {
      matched: false,
      po: 100,
      grn: 95,
      invoice: 100,
    },
    priceMatch: {
      matched: false,
      po: 500,
      grn: 500,
      invoice: 620,
    },
    amountMatch: {
      matched: false,
      po: 50000,
      grn: 47500,
      invoice: 62000,
    },
  },
  exceptions: [
    {
      type: "Quantity Mismatch",
      severity: "High",
    },
    {
      type: "Price Variance",
      severity: "High",
    },
  ],
  financialExposure: {
    totalExposure: 14500,
    breakdown: [
      {
        exception: "Quantity Mismatch",
        exposure: 2500,
      },
      {
        exception: "Price Variance",
        exposure: 12000,
      },
    ],
  },
  risk: {
    level: "Medium",
    score: 40,
  },
  recommendations: [
    "Review received quantity and reconcile with purchase order.",
    "Review invoice pricing and obtain approval for variance.",
    "Hold payment until discrepancy is resolved.",
  ],
  explainability: {
    summary: "2 exceptions detected with ₹14500 exposure.",
    explanations: [
      "Purchase Order quantity is 100 while Goods Receipt Note quantity is 95 and Invoice quantity is 100. This indicates a discrepancy of 5 units between ordered and received goods.",
      "Invoice unit price is 620 while Purchase Order unit price is 500 and Goods Receipt Note unit price is 500. The variance may require approval before payment.",
      "Total estimated financial exposure is ₹14500 based on detected discrepancies: Quantity Mismatch (₹2500), Price Variance (₹12000).",
      "Risk level is Medium with a score of 40 because 2 exceptions were detected and financial exposure is ₹14500.",
      "Review received quantity and reconcile with purchase order. This was generated because a Quantity Mismatch was detected.",
      "Review invoice pricing and obtain approval for variance. This was generated because a Price Variance was detected.",
      "Hold payment until discrepancy is resolved. This was generated because total financial exposure is ₹14500.",
    ],
  },
};

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(fallbackAnalysis);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAnalysis(readAnalysisFromStorage());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const documentCount = Object.keys(analysis.files).length;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-6">
        Audit Results
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded p-4">
          <h2 className="font-semibold">
            Documents Analyzed
          </h2>
          <p className="text-3xl">{documentCount}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold">
            Exceptions Found
          </h2>
          <p className="text-3xl">{analysis.exceptions.length}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold">
            Risk Level
          </h2>
          <p className="text-3xl">{analysis.risk.level}</p>
          <p className="mt-2">Score: {analysis.risk.score}</p>
        </div>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Processing Snapshot
        </h2>

        <p>PO: {analysis.files.purchaseOrder}</p>
        <p>GRN: {analysis.files.goodsReceiptNote}</p>
        <p>Invoice: {analysis.files.vendorInvoice}</p>
        <p>PO Classification: {analysis.classifications.purchaseOrder} (Confidence: {analysis.classifications.purchaseOrderVerification.adjustedConfidence}%)</p>
        {analysis.classifications.purchaseOrderVerification.conflict && (
          <p>⚠ PO Classification Conflict: filename suggests {analysis.classifications.purchaseOrder}, content suggests {analysis.classifications.purchaseOrderVerification.contentType}</p>
        )}
        <p>GRN Classification: {analysis.classifications.goodsReceiptNote} (Confidence: {analysis.classifications.goodsReceiptNoteVerification.adjustedConfidence}%)</p>
        {analysis.classifications.goodsReceiptNoteVerification.conflict && (
          <p>⚠ GRN Classification Conflict: filename suggests {analysis.classifications.goodsReceiptNote}, content suggests {analysis.classifications.goodsReceiptNoteVerification.contentType}</p>
        )}
        <p>Invoice Classification: {analysis.classifications.vendorInvoice} (Confidence: {analysis.classifications.vendorInvoiceVerification.adjustedConfidence}%)</p>
        {analysis.classifications.vendorInvoiceVerification.conflict && (
          <p>⚠ Invoice Classification Conflict: filename suggests {analysis.classifications.vendorInvoice}, content suggests {analysis.classifications.vendorInvoiceVerification.contentType}</p>
        )}
        <p>Quantity Match: {analysis.matchResult.quantityMatch.matched ? "Yes" : "No"}</p>
        <p>Price Match: {analysis.matchResult.priceMatch.matched ? "Yes" : "No"}</p>
        <p>Amount Match: {analysis.matchResult.amountMatch.matched ? "Yes" : "No"}</p>
        <p>Risk Score: {analysis.risk.score}</p>
        <p>Risk Level: {analysis.risk.level}</p>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Financial Exposure
        </h2>

        <p>Total Exposure: ₹{analysis.financialExposure.totalExposure}</p>

        <ul className="list-disc ml-6 space-y-2 mt-4">
          {analysis.financialExposure.breakdown.map((item) => (
            <li key={`${item.exception}-${item.exposure}`}>
              {item.exception}: ₹{item.exposure}
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Explainability
        </h2>

        <p className="mb-4">{analysis.explainability.summary}</p>

        <ul className="list-disc ml-6 space-y-2">
          {analysis.explainability.explanations.map((explanation) => (
            <li key={explanation}>{explanation}</li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Matching Details
        </h2>

        <div className="space-y-2">
          <p>
            Quantity: PO {analysis.matchResult.quantityMatch.po}, GRN {analysis.matchResult.quantityMatch.grn}, Invoice {analysis.matchResult.quantityMatch.invoice}
          </p>
          <p>
            Unit Price: PO {analysis.matchResult.priceMatch.po}, GRN {analysis.matchResult.priceMatch.grn}, Invoice {analysis.matchResult.priceMatch.invoice}
          </p>
          <p>
            Amount: PO {analysis.matchResult.amountMatch.po}, GRN {analysis.matchResult.amountMatch.grn}, Invoice {analysis.matchResult.amountMatch.invoice}
          </p>
        </div>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Exceptions
        </h2>

        <ul className="list-disc ml-6 space-y-2">
          {analysis.exceptions.map((exception) => (
            <li key={`${exception.type}-${exception.severity}`}>
              {exception.type} ({exception.severity})
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Recommendations
        </h2>

        <ul className="list-disc ml-6 space-y-2">
          {analysis.recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        className="px-4 py-2 border rounded"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}
