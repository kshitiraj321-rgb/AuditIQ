"use client";

import {
  classifyDocument,
  verifyClassificationByContent,
  type ContentVerificationResult,
} from "@/lib/classifier";
import { extractDocumentData, extractionProvenance, type ExtractorMetadata } from "@/lib/extractor";
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
import { calculateExtractionConfidence, type DocumentConfidence } from "@/lib/extractionConfidence";
import { calculateRootCauses, type RootCauseResult } from "@/lib/rootCauseEngine";
import { calculateExceptionRisks, type ExceptionRiskScore } from "@/lib/exceptionRisk";
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
  extractionConfidence?: {
    purchaseOrder?: DocumentConfidence;
    goodsReceiptNote?: DocumentConfidence;
    vendorInvoice?: DocumentConfidence;
  };
  extractionProvenance?: {
    purchaseOrder?: ExtractorMetadata;
    goodsReceiptNote?: ExtractorMetadata;
    vendorInvoice?: ExtractorMetadata;
  };
  rootCauses?: RootCauseResult;
  exceptionRisks?: ExceptionRiskScore[];
};

const analysisStorageKey = "auditIQAnalysis";

export default function UploadPage() {
  const router = useRouter();

  type StagedFile = {
    id: string;
    file: File;
    suggestedType: string;
    confidence: number;
  };

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [assignedFiles, setAssignedFiles] = useState<{
    purchaseOrder: string | null;
    goodsReceiptNote: string | null;
    vendorInvoice: string | null;
  }>({
    purchaseOrder: null,
    goodsReceiptNote: null,
    vendorInvoice: null,
  });

  const [validationMessage, setValidationMessage] = useState("");

  const handleFilesDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newStagedFiles = files.map((file, idx) => {
      const classification = classifyDocument(file.name);
      return {
        id: `${file.name}-${idx}-${Date.now()}`,
        file,
        suggestedType: classification.type,
        confidence: classification.confidence,
      };
    });

    setStagedFiles(newStagedFiles);

    const findBestMatch = (type: string) => {
      const candidates = newStagedFiles.filter(f => f.suggestedType === type && f.confidence >= 80);
      if (candidates.length === 1) return candidates[0].id;
      return null;
    };

    setAssignedFiles({
      purchaseOrder: findBestMatch("Purchase Order"),
      goodsReceiptNote: findBestMatch("Goods Receipt Note"),
      vendorInvoice: findBestMatch("Vendor Invoice"),
    });
  };

  const handleAssignmentChange = (slot: keyof typeof assignedFiles, fileId: string | null) => {
    setAssignedFiles(prev => ({
      ...prev,
      [slot]: fileId === "" ? null : fileId
    }));
  };

  const selectedPO = stagedFiles.find(f => f.id === assignedFiles.purchaseOrder)?.file || null;
  const selectedGRN = stagedFiles.find(f => f.id === assignedFiles.goodsReceiptNote)?.file || null;
  const selectedInvoice = stagedFiles.find(f => f.id === assignedFiles.vendorInvoice)?.file || null;

  const allAssigned = Boolean(assignedFiles.purchaseOrder && assignedFiles.goodsReceiptNote && assignedFiles.vendorInvoice);
  const assignedIds = [assignedFiles.purchaseOrder, assignedFiles.goodsReceiptNote, assignedFiles.vendorInvoice].filter(Boolean);
  const hasDuplicates = new Set(assignedIds).size !== assignedIds.length;
  const isValid = allAssigned && !hasDuplicates;

  async function handleAnalyzeClick() {
    if (!isValid) {
      setValidationMessage(
        "Please assign exactly one unique document to each slot."
      );
      return;
    }

    const poFile = selectedPO!;
    const grnFile = selectedGRN!;
    const invoiceFile = selectedInvoice!;

    const purchaseOrderClassification = classifyDocument(poFile.name);
    const goodsReceiptNoteClassification = classifyDocument(grnFile.name);
    const vendorInvoiceClassification = classifyDocument(invoiceFile.name);

    const [purchaseOrderText, goodsReceiptNoteText, vendorInvoiceText] =
      await Promise.all([
        readPdfText(poFile),
        readPdfText(grnFile),
        readPdfText(invoiceFile),
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

    const purchaseOrderConfidencePayload = calculateExtractionConfidence(purchaseOrderData);
    const goodsReceiptNoteConfidencePayload = calculateExtractionConfidence(goodsReceiptNoteData);
    const vendorInvoiceConfidencePayload = calculateExtractionConfidence(vendorInvoiceData);

    const poProvenance = purchaseOrderData ? extractionProvenance.get(purchaseOrderData) : undefined;
    const grnProvenance = goodsReceiptNoteData ? extractionProvenance.get(goodsReceiptNoteData) : undefined;
    const invProvenance = vendorInvoiceData ? extractionProvenance.get(vendorInvoiceData) : undefined;

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

    const rootCauses = calculateRootCauses(exceptions, matchResult, {
      purchaseOrder: poProvenance,
      goodsReceiptNote: grnProvenance,
      vendorInvoice: invProvenance,
    });

    const exceptionRisks = calculateExceptionRisks(exceptions, financialExposure);

    const analysisResult: AnalysisResult = {
      files: {
        purchaseOrder: poFile.name,
        goodsReceiptNote: grnFile.name,
        vendorInvoice: invoiceFile.name,
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
      extractionConfidence: {
        purchaseOrder: purchaseOrderConfidencePayload,
        goodsReceiptNote: goodsReceiptNoteConfidencePayload,
        vendorInvoice: vendorInvoiceConfidencePayload,
      },
      extractionProvenance: {
        purchaseOrder: poProvenance,
        goodsReceiptNote: grnProvenance,
        vendorInvoice: invProvenance,
      },
      rootCauses,
      exceptionRisks,
    };

    sessionStorage.setItem(analysisStorageKey, JSON.stringify(analysisResult));
    router.push("/results");
  }

  const renderSlot = (label: string, slotKey: keyof typeof assignedFiles) => {
    const isError = !assignedFiles[slotKey] || hasDuplicates;
    return (
      <div className={`border p-4 rounded ${isError ? 'border-red-400' : 'border-gray-200'}`}>
        <h3 className="font-bold mb-2">{label}</h3>
        <select
          className="w-full border p-2 rounded"
          value={assignedFiles[slotKey] || ""}
          onChange={(e) => handleAssignmentChange(slotKey, e.target.value)}
        >
          <option value="">-- Select File --</option>
          {stagedFiles.map((sf) => (
            <option key={sf.id} value={sf.id}>
              {sf.file.name} (Suggested: {sf.suggestedType})
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-6">
        Upload Documents
      </h1>

      <div className="mb-8 border-2 border-dashed border-gray-300 p-8 text-center rounded">
        <label className="cursor-pointer">
          <span className="text-blue-600 font-semibold text-lg">Select Files to Audit</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesDrop}
          />
        </label>
        <p className="mt-2 text-gray-500">Upload your Purchase Order, Goods Receipt Note, and Vendor Invoice together.</p>
      </div>

      {stagedFiles.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Assignment Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderSlot("Purchase Order (PO)", "purchaseOrder")}
            {renderSlot("Goods Receipt Note (GRN)", "goodsReceiptNote")}
            {renderSlot("Vendor Invoice", "vendorInvoice")}
          </div>

          {hasDuplicates && (
            <div className="mt-4 border border-red-400 bg-red-50 p-4 rounded text-red-700">
              Conflict: You have assigned the same file to multiple slots. Each slot must have a unique file.
            </div>
          )}

          {validationMessage && !hasDuplicates && (
            <div className="mt-4 border border-yellow-400 bg-yellow-50 p-4 rounded text-yellow-700">
              {validationMessage}
            </div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={() => {
                void handleAnalyzeClick();
              }}
              disabled={!isValid}
              className={`px-6 py-3 border rounded text-lg font-semibold ${
                isValid
                  ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Run Audit
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
