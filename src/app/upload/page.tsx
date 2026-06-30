"use client";

import {
  classifyDocument,
  verifyClassificationByContent,
  type ContentVerificationResult,
} from "@/lib/classifier";
import { extractDocumentData, extractionProvenance, extractionStatus, type ExtractorMetadata, type AIExtractionFields, type ExtractionStatus } from "@/lib/extractor";
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
import { EmptyState, PageShell, Panel, SectionHeading, Tag } from "@/components/presentation";
import { UploadCloud, FileType, CheckCircle, Boxes, FileDown, Search, ArrowRight, ShieldCheck, Database, FileText } from "lucide-react";

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
  extractionStatus?: {
    purchaseOrder?: ExtractionStatus;
    goodsReceiptNote?: ExtractionStatus;
    vendorInvoice?: ExtractionStatus;
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

const processingSteps = [
  "Uploading Documents",
  "Classifying Documents",
  "AI Extraction",
  "Three-Way Matching",
  "Exception Detection",
  "Risk Assessment",
  "Explainability",
  "Building Investigation Workspace",
] as const;

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
  const [activeProcessingStep, setActiveProcessingStep] = useState<number | null>(null);
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

  const advanceProcessingStep = (stepIndex: number) => {
    setActiveProcessingStep(stepIndex);
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
    advanceProcessingStep(0);
    try {
    const poFile = selectedPO;
    const grnFile = selectedGRN;
    const invoiceFile = selectedInvoice;

    advanceProcessingStep(1);
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
    advanceProcessingStep(2);
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
    const poExtractionStatus = purchaseOrderData && extractionStatus ? extractionStatus.get(purchaseOrderData) : undefined;
    const grnExtractionStatus = goodsReceiptNoteData && extractionStatus ? extractionStatus.get(goodsReceiptNoteData) : undefined;
    const invExtractionStatus = vendorInvoiceData && extractionStatus ? extractionStatus.get(vendorInvoiceData) : undefined;

    advanceProcessingStep(3);
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

    advanceProcessingStep(4);
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
    advanceProcessingStep(5);
    const risk = assessRisk({
      exceptions,
      financialExposure,
    });
    const recommendationInput: RecommendationInput = {
      exceptions,
      risk,
      financialExposure,
    };
    advanceProcessingStep(6);
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
      extractionStatus: {
        purchaseOrder: poExtractionStatus,
        goodsReceiptNote: grnExtractionStatus,
        vendorInvoice: invExtractionStatus,
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

    advanceProcessingStep(7);
    sessionStorage.setItem(analysisStorageKey, JSON.stringify(analysisResult));
    router.push("/results");
    } finally {
      setActiveProcessingStep(null);
      setIsAnalyzing(false);
    }
  }

  const renderSlot = (label: string, slotKey: keyof typeof assignedFiles) => {
    const isError = !assignedFiles[slotKey] || hasDuplicates;
    return (
      <div
        className={`rounded-xl border p-5 transition-shadow ${
          isError ? "border-rose-200 bg-rose-50/60 shadow-[0_4px_12px_rgba(244,63,94,0.05)]" : "border-slate-200 bg-white shadow-sm"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className={`h-4 w-4 ${isError ? "text-rose-500" : "text-slate-400"}`} />
            <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
          </div>
          <Tag tone={isError ? "danger" : "success"}>{isError ? "Needs attention" : "Assigned"}</Tag>
        </div>
        <select
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          value={assignedFiles[slotKey] || ""}
          onChange={(e) => handleAssignmentChange(slotKey, e.target.value)}
        >
          <option value="">Select a file</option>
          {stagedFiles.map((sf) => (
            <option key={sf.id} value={sf.id}>
              {sf.file.name} (Suggested: {sf.suggestedType})
            </option>
          ))}
        </select>
      </div>
    );
  };

  const isStepActive = (stepIndex: number) => activeProcessingStep === stepIndex;
  const isStepComplete = (stepIndex: number) =>
    activeProcessingStep !== null && activeProcessingStep > stepIndex;

  const renderProcessingStepper = () => (
    <Panel
      title="Processing sequence"
      subtitle="Deterministic status only. No progress percentages. No ETA."
      tone="accent"
      className="h-full"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">AI workflow</p>
          <p className="mt-2 text-sm text-slate-500">
            The engine advances through fixed stages so judges can follow the audit state.
          </p>
        </div>
        <Tag tone="accent">Live</Tag>
      </div>

      <ol className="space-y-2">
        {processingSteps.map((step, index) => {
          const active = isStepActive(index);
          const complete = isStepComplete(index);

          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
                active
                  ? "border-slate-400 bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  : complete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-slate-950 text-white"
                    : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {complete ? "✓" : index + 1}
              </span>
              <span className={`text-sm font-medium ${active ? "text-slate-950" : ""}`}>{step}</span>
              {active && (
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  In progress
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );

  return (
    <PageShell
      eyebrow="AuditIQ Blueprint V3.0.1"
      title="Audit upload"
      description="Stage procurement documents, confirm their roles, and launch the deterministic analysis workflow."
      actions={<Tag tone="slate">Deterministic workflow</Tag>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Upload zone"
          subtitle="Choose the three source documents and let AuditIQ classify them before analysis."
        >
          <label className="group block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-10 py-14 text-center transition duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
            <input type="file" multiple className="hidden" onChange={handleFilesDrop} />
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  <FileType className="h-3 w-3" /> PDF Only
                </span>
                <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  <Boxes className="h-3 w-3" /> 3 Documents Max
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Select the PO, GRN, and invoice
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Drop files here or click to browse. The engine requires exactly three artifacts to run a complete procurement audit.
                </p>
              </div>
            </div>
          </label>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Search className="h-5 w-5" />, title: "Classification", body: "File names and content are evaluated together.", status: "Automatic" },
              { icon: <FileDown className="h-5 w-5" />, title: "Extraction", body: "Structured fields are mapped from text.", status: "AI Powered" },
              { icon: <Database className="h-5 w-5" />, title: "Workspace", body: "Results transfer to investigation console.", status: "Live context" },
            ].map(({ icon, title, body, status }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
                    {icon}
                  </div>
                  <Tag tone="slate">{status}</Tag>
                </div>
                <p className="text-sm font-semibold text-slate-950">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </Panel>

        {isAnalyzing ? (
          renderProcessingStepper()
        ) : (
          <Panel title="What happens next" subtitle="A concise preview of the audit flow.">
            <div className="space-y-3">
              {[
                "Documents are classified from file content and naming signals.",
                "Extracted fields are matched across PO, GRN, and invoice.",
                "Exceptions, risk, and explainability are assembled into results.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 transition hover:border-slate-300 hover:bg-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {stagedFiles.length > 0 ? (
        <div className="mt-6 space-y-6">
          <SectionHeading
            eyebrow="Assignment review"
            title="Map each file to its document role."
            description="The deterministic selector stays in place so the audit remains explainable and repeatable."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {renderSlot("Purchase Order (PO)", "purchaseOrder")}
            {renderSlot("Goods Receipt Note (GRN)", "goodsReceiptNote")}
            {renderSlot("Vendor Invoice", "vendorInvoice")}
          </div>

          {hasDuplicates ? (
            <EmptyState
              title="Duplicate assignment detected"
              description="Each slot must point to a unique file before the audit can run."
            />
          ) : null}

          {validationMessage && !hasDuplicates ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {validationMessage}
            </div>
          ) : null}

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 shadow-xl text-white">
            <div>
              <p className="text-lg font-semibold text-white">Ready to run the audit?</p>
              <p className="mt-1 text-sm text-slate-300">
                Launching the audit will preserve the existing API flow and move straight into results.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleAnalyzeClick();
              }}
              disabled={!isValid || isAnalyzing}
              className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition ${
                isValid && !isAnalyzing
                  ? "bg-white text-slate-900 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
                  : "cursor-not-allowed bg-slate-800 text-slate-500"
              }`}
            >
              {isAnalyzing ? "Processing audit..." : "Run Deterministic Audit"}
              {!isAnalyzing && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={<UploadCloud className="h-10 w-10 text-slate-400" />}
            title="Waiting for documents"
            description="Drop or browse to upload the PO, GRN, and Invoice to unlock the assignment review."
          />
        </div>
      )}
    </PageShell>
  );
}
