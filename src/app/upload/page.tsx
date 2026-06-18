"use client";

import {
  classifyDocument,
  verifyClassificationByContent,
  type ContentVerificationResult,
} from "@/lib/classifier";
import { extractDocumentData } from "@/lib/extractor";
import {
  calculateFinancialExposure,
  type FinancialExposureResult,
} from "@/lib/financialExposure";
import { matchDocuments } from "@/lib/matcher";
import { detectExceptions } from "@/lib/exceptionEngine";
import {
  generateExplainability,
  type ExplainabilityResult,
} from "@/lib/explainability";
import {
  assessRisk,
  type RiskAssessmentResult,
} from "@/lib/riskEngine";
import {
  generateRecommendations,
  type RecommendationInput,
} from "@/lib/recommendationEngine";
import { readPdfText } from "@/lib/pdfTextReader";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    purchaseOrder: ReturnType<typeof extractDocumentData>;
    goodsReceiptNote: ReturnType<typeof extractDocumentData>;
    vendorInvoice: ReturnType<typeof extractDocumentData>;
  };
  matchResult: ReturnType<typeof matchDocuments>;
  exceptions: ReturnType<typeof detectExceptions>;
  financialExposure: FinancialExposureResult;
  risk: RiskAssessmentResult;
  recommendations: string[];
  explainability: ExplainabilityResult;
};

const analysisStorageKey = "auditIQAnalysis";

export default function UploadPage() {
  const router = useRouter();
  const [poFile, setPoFile] = useState<File | null>(null);
  const [grnFile, setGrnFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [validationMessage, setValidationMessage] = useState("");

  const allDocumentsUploaded = Boolean(poFile && grnFile && invoiceFile);

  async function handleAnalyzeClick() {
    if (!allDocumentsUploaded) {
      setValidationMessage(
        "Please upload Purchase Order, Goods Receipt Note, and Vendor Invoice before analyzing."
      );
      return;
    }

    const purchaseOrderClassification = classifyDocument(poFile!.name);
    const goodsReceiptNoteClassification = classifyDocument(grnFile!.name);
    const vendorInvoiceClassification = classifyDocument(invoiceFile!.name);

    const [purchaseOrderText, goodsReceiptNoteText, vendorInvoiceText] =
      await Promise.all([
        readPdfText(poFile!),
        readPdfText(grnFile!),
        readPdfText(invoiceFile!),
      ]);

    // Priority 5D — Content-Based Classification Verification
    const purchaseOrderVerification = verifyClassificationByContent(
      purchaseOrderClassification.type,
      purchaseOrderText,
      purchaseOrderClassification.confidence
    );
    const goodsReceiptNoteVerification = verifyClassificationByContent(
      goodsReceiptNoteClassification.type,
      goodsReceiptNoteText,
      goodsReceiptNoteClassification.confidence
    );
    const vendorInvoiceVerification = verifyClassificationByContent(
      vendorInvoiceClassification.type,
      vendorInvoiceText,
      vendorInvoiceClassification.confidence
    );

    const purchaseOrderData = extractDocumentData(
      purchaseOrderClassification.type,
      purchaseOrderText
    );
    const goodsReceiptNoteData = extractDocumentData(
      goodsReceiptNoteClassification.type,
      goodsReceiptNoteText
    );
    const vendorInvoiceData = extractDocumentData(
      vendorInvoiceClassification.type,
      vendorInvoiceText
    );
    const matchResult = matchDocuments({
      purchaseOrder: purchaseOrderData,
      goodsReceiptNote: goodsReceiptNoteData,
      vendorInvoice: vendorInvoiceData,
    });
    // Load existing audited invoices history
    let existingInvoices: { vendorName: string; invoiceNumber: string }[] = [];
    try {
      const stored = localStorage.getItem("auditiq_audited_invoices");
      if (stored) {
        existingInvoices = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load invoice history", e);
    }

    const exceptions = detectExceptions({
      purchaseOrder: purchaseOrderData,
      goodsReceiptNote: goodsReceiptNoteData,
      vendorInvoice: vendorInvoiceData,
      matchResult,
      existingInvoices,
    });

    // Save invoice to history if it has valid identifiers and was not detected as a duplicate
    const hasDuplicateException = exceptions.some((e) => e.type === "Duplicate Invoice");
    const currentVendor = vendorInvoiceData?.vendorName || vendorInvoiceData?.vendor || null;
    const currentInvoiceNum = vendorInvoiceData?.invoiceNumber || vendorInvoiceData?.documentNumber || null;

    if (currentVendor && currentInvoiceNum && !hasDuplicateException) {
      const isAlreadySaved = existingInvoices.some(
        (inv) =>
          inv.vendorName.trim().toUpperCase() === currentVendor.trim().toUpperCase() &&
          inv.invoiceNumber.trim().toUpperCase() === currentInvoiceNum.trim().toUpperCase()
      );
      if (!isAlreadySaved) {
        const updatedInvoices = [...existingInvoices, { vendorName: currentVendor, invoiceNumber: currentInvoiceNum }];
        try {
          localStorage.setItem("auditiq_audited_invoices", JSON.stringify(updatedInvoices));
        } catch (e) {
          console.error("Failed to save invoice history", e);
        }
      }
    }

    const financialExposure = calculateFinancialExposure({
      purchaseOrder: purchaseOrderData,
      goodsReceiptNote: goodsReceiptNoteData,
      vendorInvoice: vendorInvoiceData,
      exceptions,
    });
    const risk = assessRisk({
      exceptions,
      financialExposure,
    });
    const recommendationInput: RecommendationInput = {
      exceptions,
      risk,
      financialExposure,
    };
    const recommendations = generateRecommendations(recommendationInput);
    const explainability = generateExplainability({
      matchResult,
      exceptions,
      financialExposure,
      risk,
      recommendations,
      extractedDocuments: {
        purchaseOrder: purchaseOrderData,
        goodsReceiptNote: goodsReceiptNoteData,
        vendorInvoice: vendorInvoiceData,
      },
    });

    const analysisResult: AnalysisResult = {
      files: {
        purchaseOrder: poFile!.name,
        goodsReceiptNote: grnFile!.name,
        vendorInvoice: invoiceFile!.name,
      },
      classifications: {
        purchaseOrder: purchaseOrderClassification.type,
        purchaseOrderConfidence: purchaseOrderClassification.confidence,
        purchaseOrderVerification,
        goodsReceiptNote: goodsReceiptNoteClassification.type,
        goodsReceiptNoteConfidence: goodsReceiptNoteClassification.confidence,
        goodsReceiptNoteVerification,
        vendorInvoice: vendorInvoiceClassification.type,
        vendorInvoiceConfidence: vendorInvoiceClassification.confidence,
        vendorInvoiceVerification,
      },
      extractedData: {
        purchaseOrder: purchaseOrderData,
        goodsReceiptNote: goodsReceiptNoteData,
        vendorInvoice: vendorInvoiceData,
      },
      matchResult,
      exceptions,
      financialExposure,
      risk,
      recommendations,
      explainability,
    };

    sessionStorage.setItem(analysisStorageKey, JSON.stringify(analysisResult));
    router.push("/results");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-6">
        Upload Documents
      </h1>

      <div className="space-y-4 mb-8">
        <div className="border p-4 rounded">
          Purchase Order (PO)
        </div>

        <div className="border p-4 rounded">
          Goods Receipt Note (GRN)
        </div>

        <div className="border p-4 rounded">
          Invoice
        </div>
      </div>

      <div className="space-y-4">

  <div>
    <label className="block mb-2">
      Upload Purchase Order
    </label>
   <input
  type="file"
  onChange={(e) =>
    setPoFile(e.target.files?.[0] || null)
  }
/>
  </div>

  <div>
    <label className="block mb-2">
      Upload Goods Receipt Note
    </label>
    <input
  type="file"
  onChange={(e) =>
    setGrnFile(e.target.files?.[0] || null)
  }
/>
  </div>

  <div>
    <label className="block mb-2">
      Upload Vendor Invoice
    </label>
    <input
  type="file"
  onChange={(e) =>
    setInvoiceFile(e.target.files?.[0] || null)
  }
/>
  </div>
      <div className="mt-4 border p-4 rounded">
  <p>PO: {poFile?.name || "Not Uploaded"}</p>
  <p>GRN: {grnFile?.name || "Not Uploaded"}</p>
  <p>Invoice: {invoiceFile?.name || "Not Uploaded"}</p>
</div>
</div>

      {validationMessage && (
        <div className="mt-4 border p-4 rounded">
          {validationMessage}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => {
            void handleAnalyzeClick();
          }}
          className="px-4 py-2 border rounded"
        >
          Analyze Documents
        </button>
      </div>
    </main>
  );
}
