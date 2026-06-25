"use client";

import {
  classifyDocument,
  verifyClassificationByContent,
  type ContentVerificationResult,
} from "@/lib/classifier";
import { extractDocumentData, extractionProvenance, type ExtractorMetadata, type AIExtractionFields } from "@/lib/extractor";
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
import { prioritizeExceptions, type PrioritizedException } from "@/lib/prioritizationEngine";
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
  extractionErrors?: {
    purchaseOrder?: string | null;
    goodsReceiptNote?: string | null;
    vendorInvoice?: string | null;
  };
  rootCauses?: RootCauseResult;
  exceptionRisks?: ExceptionRiskScore[];
  prioritizedQueue?: PrioritizedException[];
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const hasAtLeastOne = Boolean(assignedFiles.purchaseOrder || assignedFiles.goodsReceiptNote || assignedFiles.vendorInvoice);
  const assignedIds = [assignedFiles.purchaseOrder, assignedFiles.goodsReceiptNote, assignedFiles.vendorInvoice].filter(Boolean);
  const hasDuplicates = new Set(assignedIds).size !== assignedIds.length;
  const isValid = hasAtLeastOne && !hasDuplicates;

  async function handleAnalyzeClick() {
    if (!isValid) {
      setValidationMessage(
        "Please assign at least one document, with no duplicates across slots."
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const poFile = selectedPO;
    const grnFile = selectedGRN;
    const invoiceFile = selectedInvoice;

    const purchaseOrderClassification = poFile ? { ...classifyDocument(poFile.name), type: "Purchase Order" } : { type: "Purchase Order", confidence: 0 };
    const goodsReceiptNoteClassification = grnFile ? { ...classifyDocument(grnFile.name), type: "Goods Receipt Note" } : { type: "Goods Receipt Note", confidence: 0 };
    const vendorInvoiceClassification = invoiceFile ? { ...classifyDocument(invoiceFile.name), type: "Vendor Invoice" } : { type: "Vendor Invoice", confidence: 0 };

    const [purchaseOrderText, goodsReceiptNoteText, vendorInvoiceText] =
      await Promise.all([
        poFile ? readPdfText(poFile) : Promise.resolve(""),
        grnFile ? readPdfText(grnFile) : Promise.resolve(""),
        invoiceFile ? readPdfText(invoiceFile) : Promise.resolve(""),
      ]);

    // Priority 5D — Content-Based Classification Verification
    const purchaseOrderVerification = poFile ? verifyClassificationByContent(
      purchaseOrderClassification.type,
      purchaseOrderText,
      purchaseOrderClassification.confidence
    ) : { verified: false, contentType: "Purchase Order", adjustedConfidence: 0, conflict: false };
    const goodsReceiptNoteVerification = grnFile ? verifyClassificationByContent(
      goodsReceiptNoteClassification.type,
      goodsReceiptNoteText,
      goodsReceiptNoteClassification.confidence
    ) : { verified: false, contentType: "Goods Receipt Note", adjustedConfidence: 0, conflict: false };
    const vendorInvoiceVerification = invoiceFile ? verifyClassificationByContent(
      vendorInvoiceClassification.type,
      vendorInvoiceText,
      vendorInvoiceClassification.confidence
    ) : { verified: false, contentType: "Vendor Invoice", adjustedConfidence: 0, conflict: false };

    // Fetch AI extractions in parallel — page owns all async/network operations
    const [poAiResult, grnAiResult, invAiResult] = await Promise.all([
      poFile ? fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: purchaseOrderClassification.type, documentText: purchaseOrderText }),
      }).then(r => r.ok ? r.json() : { success: false, error: "API returned non-200 status" }).catch(e => ({ success: false, error: e.message || "Network Error" })) : Promise.resolve({ success: false, error: "No file" }),
      grnFile ? fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: goodsReceiptNoteClassification.type, documentText: goodsReceiptNoteText }),
      }).then(r => r.ok ? r.json() : { success: false, error: "API returned non-200 status" }).catch(e => ({ success: false, error: e.message || "Network Error" })) : Promise.resolve({ success: false, error: "No file" }),
      invoiceFile ? fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: vendorInvoiceClassification.type, documentText: vendorInvoiceText }),
      }).then(r => r.ok ? r.json() : { success: false, error: "API returned non-200 status" }).catch(e => ({ success: false, error: e.message || "Network Error" })) : Promise.resolve({ success: false, error: "No file" }),
    ]);

    const poAiData: AIExtractionFields | null = poAiResult?.success ? poAiResult.data : null;
    const grnAiData: AIExtractionFields | null = grnAiResult?.success ? grnAiResult.data : null;
    const invAiData: AIExtractionFields | null = invAiResult?.success ? invAiResult.data : null;

    // extractDocumentData is now a pure synchronous mapping function
    const purchaseOrderData = poFile ? extractDocumentData(purchaseOrderClassification.type, purchaseOrderText, poAiData) : null;
    const goodsReceiptNoteData = grnFile ? extractDocumentData(goodsReceiptNoteClassification.type, goodsReceiptNoteText, grnAiData) : null;
    const vendorInvoiceData = invoiceFile ? extractDocumentData(vendorInvoiceClassification.type, vendorInvoiceText, invAiData) : null;

    const purchaseOrderConfidencePayload = calculateExtractionConfidence(purchaseOrderData);
    const goodsReceiptNoteConfidencePayload = calculateExtractionConfidence(goodsReceiptNoteData);
    const vendorInvoiceConfidencePayload = calculateExtractionConfidence(vendorInvoiceData);

    const poProvenance = purchaseOrderData && extractionProvenance ? extractionProvenance.get(purchaseOrderData) : undefined;
    const grnProvenance = goodsReceiptNoteData && extractionProvenance ? extractionProvenance.get(goodsReceiptNoteData) : undefined;
    const invProvenance = vendorInvoiceData && extractionProvenance ? extractionProvenance.get(vendorInvoiceData) : undefined;

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
        console.log("Loaded existing invoices from localStorage: " + JSON.stringify(existingInvoices));
      }
    } catch (e) {
      console.error("Failed to load invoice history", e);
    }
    
    console.log("vendorInvoiceData for Duplicate Invoice check: " + JSON.stringify(vendorInvoiceData));

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

    const prioritizedQueue = prioritizeExceptions(exceptions, exceptionRisks, vendorInvoiceData);

    const analysisResult: AnalysisResult = {
      files: {
        purchaseOrder: poFile?.name || "",
        goodsReceiptNote: grnFile?.name || "",
        vendorInvoice: invoiceFile?.name || "",
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
      extractionErrors: {
        purchaseOrder: poAiResult?.success ? null : poAiResult?.error || "Unknown extraction failure",
        goodsReceiptNote: grnAiResult?.success ? null : grnAiResult?.error || "Unknown extraction failure",
        vendorInvoice: invAiResult?.success ? null : invAiResult?.error || "Unknown extraction failure",
      },
      rootCauses,
      exceptionRisks,
      prioritizedQueue,
    };

    // --- TELEMETRY DISPATCH ---
    try {
      const getCounts = (prov: ExtractorMetadata | undefined) => {
        if (!prov) return { extracted: 0, fallback: 0, missing: 0 };
        const vals = Object.values(prov);
        return {
          extracted: vals.filter(v => v === 'extracted').length,
          fallback: vals.filter(v => v === 'fallback').length,
          missing: vals.filter(v => v === 'missing').length,
        };
      };

      const getCriticalFallbacks = (prov: ExtractorMetadata | undefined) => {
        if (!prov) return 0;
        let count = 0;
        if (prov.quantity === 'fallback') count++;
        if (prov.unitPrice === 'fallback') count++;
        if (prov.amount === 'fallback') count++;
        return count;
      };

      const telemetryPayload = {
        timestamp: new Date().toISOString(),
        auditId: crypto.randomUUID(),
        documents: [
          {
            documentType: analysisResult.classifications.purchaseOrder,
            confidenceScore: analysisResult.extractionConfidence?.purchaseOrder?.overallScore || 0,
            fallbackCount: getCounts(analysisResult.extractionProvenance?.purchaseOrder).fallback,
            missingCount: getCounts(analysisResult.extractionProvenance?.purchaseOrder).missing,
            criticalFallbackCount: getCriticalFallbacks(analysisResult.extractionProvenance?.purchaseOrder),
            apiFailure: !!analysisResult.extractionErrors?.purchaseOrder
          },
          {
            documentType: analysisResult.classifications.goodsReceiptNote,
            confidenceScore: analysisResult.extractionConfidence?.goodsReceiptNote?.overallScore || 0,
            fallbackCount: getCounts(analysisResult.extractionProvenance?.goodsReceiptNote).fallback,
            missingCount: getCounts(analysisResult.extractionProvenance?.goodsReceiptNote).missing,
            criticalFallbackCount: getCriticalFallbacks(analysisResult.extractionProvenance?.goodsReceiptNote),
            apiFailure: !!analysisResult.extractionErrors?.goodsReceiptNote
          },
          {
            documentType: analysisResult.classifications.vendorInvoice,
            confidenceScore: analysisResult.extractionConfidence?.vendorInvoice?.overallScore || 0,
            fallbackCount: getCounts(analysisResult.extractionProvenance?.vendorInvoice).fallback,
            missingCount: getCounts(analysisResult.extractionProvenance?.vendorInvoice).missing,
            criticalFallbackCount: getCriticalFallbacks(analysisResult.extractionProvenance?.vendorInvoice),
            apiFailure: !!analysisResult.extractionErrors?.vendorInvoice
          }
        ]
      };

      // Fire-and-forget dispatch. Does not await. Does not throw.
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryPayload)
      }).catch(e => {
        console.warn("Telemetry dispatch failed", e);
      });
    } catch (e) {
      console.warn("Telemetry builder failed", e);
    }
    // --- END TELEMETRY ---

    sessionStorage.setItem(analysisStorageKey, JSON.stringify(analysisResult));
    router.push("/results");
    } finally {
      setIsAnalyzing(false);
    }
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
              disabled={!isValid || isAnalyzing}
              className={`px-6 py-3 border rounded text-lg font-semibold ${
                isValid && !isAnalyzing
                  ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isAnalyzing ? "Analyzing..." : "Run Audit"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
