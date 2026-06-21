"use client";

import Link from "next/link";
import type {
  MatchDocumentsResult,
} from "@/lib/matcher";
import { useEffect, useState } from "react";
import type { FinancialExposureResult } from "@/lib/financialExposure";
import type { RiskAssessmentResult } from "@/lib/riskEngine";
import type { ExplainabilityResult } from "@/lib/explainability";
import type { ContentVerificationResult } from "@/lib/classifier";
import type { DocumentConfidence } from "@/lib/extractionConfidence";
import type { ExtractorMetadata } from "@/lib/extractor";
import { InvestigationAssistant } from "@/components/InvestigationAssistant";

// ─────────────────────────────────────────────
// Types (mirrors upload/page.tsx — AnalysisResult structure preserved)
// ─────────────────────────────────────────────

type ExtractedDoc = {
  vendor: string;
  documentNumber: string;
  poNumber: string | null;
  grnNumber: string | null;
  invoiceNumber: string | null;
  date: string;
  normalizedDate: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
} | null;

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
    purchaseOrder: ExtractedDoc;
    goodsReceiptNote: ExtractedDoc;
    vendorInvoice: ExtractedDoc;
  };
  matchResult: MatchDocumentsResult;
  exceptions: {
    type: string;
    severity: string;
    message?: string;
  }[];
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
  rootCauses?: {
    exceptionType: string;
    rootCause: string;
    category: "System Failure" | "Business Mismatch" | "Administrative Error";
    confidence: "Proven" | "Inferred";
    evidence: string[];
  }[];
  exceptionRisks?: { type: string; score: number }[];
};

// ─────────────────────────────────────────────
// Fallback
// ─────────────────────────────────────────────

const fallbackAnalysis: AnalysisResult = {
  files: { purchaseOrder: "PO-001.pdf", goodsReceiptNote: "GRN-001.pdf", vendorInvoice: "INV-001.pdf" },
  classifications: {
    purchaseOrder: "Purchase Order", purchaseOrderConfidence: 95,
    purchaseOrderVerification: { verified: true, contentType: "Purchase Order", adjustedConfidence: 95, conflict: false },
    goodsReceiptNote: "Goods Receipt Note", goodsReceiptNoteConfidence: 95,
    goodsReceiptNoteVerification: { verified: true, contentType: "Goods Receipt Note", adjustedConfidence: 95, conflict: false },
    vendorInvoice: "Vendor Invoice", vendorInvoiceConfidence: 95,
    vendorInvoiceVerification: { verified: true, contentType: "Vendor Invoice", adjustedConfidence: 95, conflict: false },
  },
  extractedData: {
    purchaseOrder: { vendor: "ABC Industries", documentNumber: "PO-1001", poNumber: "PO-1001", grnNumber: null, invoiceNumber: null, date: "2026-06-12", normalizedDate: "2026-06-12", quantity: 100, unitPrice: 500, amount: 50000 },
    goodsReceiptNote: { vendor: "ABC Industries", documentNumber: "GRN-1001", poNumber: "PO-1001", grnNumber: "GRN-1001", invoiceNumber: null, date: "2026-06-14", normalizedDate: "2026-06-14", quantity: 95, unitPrice: 500, amount: 47500 },
    vendorInvoice: { vendor: "ABC Industries", documentNumber: "INV-1001", poNumber: "PO-1001", grnNumber: "GRN-1001", invoiceNumber: "INV-1001", date: "2026-06-16", normalizedDate: "2026-06-16", quantity: 100, unitPrice: 620, amount: 62000 },
  },
  matchResult: {
    quantityMatch: { matched: false, po: 100, grn: 95, invoice: 100 },
    priceMatch: { matched: false, po: 500, grn: 500, invoice: 620 },
    amountMatch: { matched: false, po: 50000, grn: 47500, invoice: 62000 },
    poNumberMatch: { matched: true, po: "PO-1001", grn: "PO-1001", invoice: "PO-1001", normalizedPo: "PO1001", normalizedGrn: "PO1001", normalizedInvoice: "PO1001" },
    grnNumberMatch: { matched: true, po: null, grn: "GRN-1001", invoice: "GRN-1001", normalizedPo: null, normalizedGrn: "GRN1001", normalizedInvoice: "GRN1001" },
  },
  exceptions: [
    { type: "Quantity Mismatch", severity: "High" },
    { type: "Price Variance", severity: "High" },
  ],
  financialExposure: {
    totalExposure: 14500,
    breakdown: [
      { exception: "Quantity Mismatch", exposure: 2500 },
      { exception: "Price Variance", exposure: 12000 },
    ],
  },
  risk: { level: "Medium", score: 40 },
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

const analysisStorageKey = "auditIQAnalysis";

function readAnalysisFromStorage(): AnalysisResult {
  const stored = sessionStorage.getItem(analysisStorageKey);
  if (!stored) return fallbackAnalysis;
  try {
    const parsed = JSON.parse(stored) as Partial<AnalysisResult>;
    if (!parsed.explainability) return fallbackAnalysis;
    return parsed as AnalysisResult;
  } catch {
    return fallbackAnalysis;
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const EXCEPTION_KEYWORDS: Record<string, string[]> = {
  "Quantity Mismatch": ["Quantity Mismatch", "units between", "discrepancy of"],
  "Price Variance": ["Price Variance", "unit price", "Invoice unit price"],
  "Missing Invoice": ["Missing Invoice", "without an invoice"],
  "Missing GRN": ["Missing GRN", "without proof of receipt"],
  "Duplicate Invoice": ["Duplicate Invoice", "duplicate"],
  "Timeline Deviation": ["Timeline Deviation", "date", "sequence"],
};

function findExplanationForException(
  exceptionType: string,
  explanations: string[]
): string | null {
  const keywords = EXCEPTION_KEYWORDS[exceptionType] ?? [];
  return (
    explanations.find((exp) =>
      keywords.some((kw) => exp.toLowerCase().includes(kw.toLowerCase()))
    ) ?? null
  );
}

function findRecommendationForException(
  exceptionType: string,
  recommendations: string[],
  explanations: string[]
): { action: string; trigger: string } | null {
  const triggerKeywordMap: Record<string, string> = {
    "Quantity Mismatch": "Quantity Mismatch",
    "Price Variance": "Price Variance",
    "Missing Invoice": "Missing Invoice",
    "Missing GRN": "Missing GRN",
    "Duplicate Invoice": "Duplicate Invoice",
  };
  const triggerKw = triggerKeywordMap[exceptionType];

  const triggerExplanation = triggerKw
    ? explanations.find(
        (exp) =>
          exp.includes(triggerKw) &&
          (exp.includes("generated because") || exp.includes("generated from"))
      )
    : null;

  if (!triggerExplanation) return null;

  const matchedRec = recommendations.find((rec) =>
    triggerExplanation.startsWith(rec)
  );

  if (!matchedRec) return null;

  const trigger = triggerExplanation
    .replace(matchedRec, "")
    .replace(/^\s*/, "")
    .trim();

  return { action: matchedRec, trigger };
}

function riskColor(level: string) {
  if (level === "Critical") return "text-red-600";
  if (level === "High") return "text-orange-500";
  if (level === "Medium") return "text-amber-500";
  return "text-green-600";
}

function riskBg(level: string) {
  if (level === "Critical") return "bg-red-50 border-red-300";
  if (level === "High") return "bg-orange-50 border-orange-300";
  if (level === "Medium") return "bg-amber-50 border-amber-300";
  return "bg-green-50 border-green-300";
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function DocumentCard({
  label,
  filename,
  doc,
  highlightQty,
  highlightPrice,
  highlightAmount,
  confidence,
  provenance,
}: {
  label: string;
  filename: string;
  doc: ExtractedDoc;
  highlightQty: boolean;
  highlightPrice: boolean;
  highlightAmount: boolean;
  confidence?: DocumentConfidence;
  provenance?: ExtractorMetadata;
}) {
  if (!doc) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 flex-1">
        <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
          {label}
        </p>
        <p className="text-sm text-gray-400 italic">Not provided</p>
      </div>
    );
  }

  const field = (name: string, val: string | number | null, mismatch: boolean, fieldKey?: keyof ExtractorMetadata) => {
    const prov = fieldKey && provenance ? provenance[fieldKey] : undefined;
    const isWarning = prov === "fallback" || prov === "missing";
    return (
      <div
        className={`flex justify-between text-sm py-1 border-b border-gray-100 last:border-0 ${
          mismatch ? "text-orange-600 font-semibold bg-orange-50 px-1 rounded" : isWarning ? "text-orange-600 font-semibold bg-orange-50 px-1 rounded" : "text-gray-700"
        }`}
      >
        <span className="text-gray-500 text-xs flex items-center gap-1">
          {name}
          {isWarning && <span title={`Source: ${prov}`}>⚠</span>}
        </span>
        <span>{val ?? "—"}</span>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 flex items-center">
        {label}
        {confidence && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 normal-case tracking-normal">
            Confidence: {Math.round(confidence.overallScore * 100)}%
          </span>
        )}
      </p>
      <p className="text-sm font-medium text-gray-700 mb-3 truncate" title={filename}>
        {filename}
      </p>
      <div className="space-y-0.5">
        {field("Vendor", doc.vendor, false, "vendor")}
        {field("Doc #", doc.documentNumber, false, "documentNumber")}
        {field("Date", doc.normalizedDate ?? doc.date, false, "normalizedDate")}
        {field("Quantity", doc.quantity, highlightQty, "quantity")}
        {field("Unit Price", `₹${doc.unitPrice}`, highlightPrice, "unitPrice")}
        {field("Amount", fmt(doc.amount), highlightAmount, "amount")}
      </div>
    </div>
  );
}

function TimelineNode({
  label,
  date,
  warn,
}: {
  label: string;
  date: string | null;
  warn: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
          warn
            ? "bg-orange-100 border-orange-400 text-orange-700"
            : date
            ? "bg-green-100 border-green-400 text-green-700"
            : "bg-gray-100 border-gray-300 text-gray-400"
        }`}
      >
        {warn ? "!" : "✓"}
      </div>
      <p className="text-xs font-semibold mt-1 text-gray-700">{label}</p>
      <p className={`text-xs mt-0.5 ${warn ? "text-orange-600" : "text-gray-500"}`}>
        {date ?? "Unavailable"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(fallbackAnalysis);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAnalysis(readAnalysisFromStorage());
      setSelectedIdx(0);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const { exceptions, financialExposure, risk, recommendations, explainability, extractedData, matchResult, files, classifications, extractionConfidence, extractionProvenance, rootCauses, exceptionRisks } = analysis;
  const selected = exceptions[selectedIdx] ?? null;
  const docCount = Object.values(files).filter(Boolean).length;

  const selectedRootCause =
    selected && rootCauses
      ? rootCauses.find((rc) => rc.exceptionType === selected.type)
      : null;

  // Financial exposure for selected exception
  const selectedExposure =
    selected
      ? financialExposure.breakdown.find(
          (b) => b.exception === selected.type
        ) ?? null
      : null;

  // Explanation for selected exception
  const selectedExplanation = selected
    ? selected.message ??
      findExplanationForException(
        selected.type,
        explainability.explanations
      )
    : null;

  // Recommendation for selected exception
  const selectedRec = selected
    ? findRecommendationForException(
        selected.type,
        recommendations,
        explainability.explanations
      )
    : null;

  // Timeline deviation check
  const isTimelineException = selected?.type === "Timeline Deviation";

  const hasProvenanceWarnings = Object.values(extractionProvenance || {}).some(
    (prov) => prov && Object.values(prov).some((val) => val === "fallback" || val === "missing")
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* ── Audit Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Exception Investigation
        </h1>
        <p className="text-sm text-gray-500">{explainability.summary}</p>
        {hasProvenanceWarnings && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-sm flex items-start gap-2">
            <span>ℹ️</span>
            <span>Some values were populated using fallback logic or could not be extracted. Review <strong>Extraction Transparency</strong> for details.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Financial Exposure"
          value={fmt(financialExposure.totalExposure)}
          accent={financialExposure.totalExposure > 0 ? "text-orange-600" : "text-green-600"}
        />
        <KpiCard
          label="Exceptions Found"
          value={String(exceptions.length)}
          accent={exceptions.length > 0 ? "text-red-600" : "text-green-600"}
        />
        <KpiCard
          label="Risk Level"
          value={risk.level}
          sub={`Score: ${risk.score}`}
          accent={riskColor(risk.level)}
        />
        <KpiCard
          label="Documents Analyzed"
          value={String(docCount)}
        />
      </div>

      {/* ── Investigation Workspace ── */}
      {exceptions.length === 0 ? (
        <div className="border rounded-lg bg-green-50 border-green-200 p-8 text-center">
          <p className="text-green-700 font-semibold text-lg">
            ✓ No exceptions detected
          </p>
          <p className="text-green-600 text-sm mt-1">
            All three documents are in agreement. No further action required.
          </p>
        </div>
      ) : (
        <div className="flex gap-6 items-start">

          {/* ── Exception Rail (Left) ── */}
          <div className="w-64 shrink-0 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Exceptions
            </h2>
            {exceptions.map((ex, idx) => {
              const expAmt = financialExposure.breakdown.find(
                (b) => b.exception === ex.type
              );
              const isActive = idx === selectedIdx;
              return (
                <button
                  key={`${ex.type}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    isActive
                      ? "border-orange-400 bg-orange-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isActive ? "text-orange-700" : "text-gray-800"}`}>
                    {ex.type}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                      {ex.severity}
                    </span>
                    <span className={`text-xs font-mono ${expAmt ? "text-orange-600 font-semibold" : "text-gray-400"}`}>
                      {expAmt ? fmt(expAmt.exposure) : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Investigation Panel (Right) ── */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Selected exception title */}
            {selected && (
              <div className={`rounded-lg border px-5 py-3 ${riskBg(selected.severity)}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Investigating
                </p>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-xl font-bold text-gray-900">
                    {selected.type}
                  </p>
                  {exceptionRisks && (
                    <span className="text-sm font-bold px-2 py-1 bg-white bg-opacity-50 rounded text-gray-900 border border-gray-300">
                      Risk Score: {exceptionRisks.find(r => r.type === selected.type)?.score ?? "N/A"}/100
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 1. Document Details */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Document Details
              </h2>
              <div className="flex gap-3">
                <DocumentCard
                  label="Purchase Order"
                  filename={files.purchaseOrder}
                  doc={extractedData.purchaseOrder}
                  highlightQty={!matchResult.quantityMatch.matched}
                  highlightPrice={!matchResult.priceMatch.matched}
                  highlightAmount={!matchResult.amountMatch.matched}
                  confidence={extractionConfidence?.purchaseOrder}
                  provenance={extractionProvenance?.purchaseOrder}
                />
                <DocumentCard
                  label="Goods Receipt Note"
                  filename={files.goodsReceiptNote}
                  doc={extractedData.goodsReceiptNote}
                  highlightQty={!matchResult.quantityMatch.matched}
                  highlightPrice={!matchResult.priceMatch.matched}
                  highlightAmount={!matchResult.amountMatch.matched}
                  confidence={extractionConfidence?.goodsReceiptNote}
                  provenance={extractionProvenance?.goodsReceiptNote}
                />
                <DocumentCard
                  label="Vendor Invoice"
                  filename={files.vendorInvoice}
                  doc={extractedData.vendorInvoice}
                  highlightQty={!matchResult.quantityMatch.matched}
                  highlightPrice={!matchResult.priceMatch.matched}
                  highlightAmount={!matchResult.amountMatch.matched}
                  confidence={extractionConfidence?.vendorInvoice}
                  provenance={extractionProvenance?.vendorInvoice}
                />
              </div>
            </section>

            {/* Root Cause Diagnosis */}
            {selectedRootCause && (
              <section className="bg-white border rounded-lg p-5 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Root Cause Diagnosis
                  </h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                    selectedRootCause.confidence === "Proven" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {selectedRootCause.confidence}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedRootCause.rootCause}
                  </p>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">
                    Category: {selectedRootCause.category}
                  </p>
                  <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-100">
                    <p className="font-semibold text-xs text-gray-400 mb-1">EVIDENCE</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {selectedRootCause.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Mismatch Explanation */}
            <section className="bg-white border rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Mismatch Explanation
              </h2>
              {selectedExplanation ? (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedExplanation}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No detailed explanation available for this exception type.
                </p>
              )}
            </section>

            {/* 3. Financial Impact */}
            <section className="bg-white border rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Financial Impact
              </h2>
              {selectedExposure ? (
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {fmt(selectedExposure.exposure)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    of {fmt(financialExposure.totalExposure)} total exposure
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Financial exposure is not directly calculable for this exception type.
                </p>
              )}
            </section>

            {/* 4. Recommendation */}
            <section className="bg-white border rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Recommendation
              </h2>
              {selectedRec ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedRec.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ↳ {selectedRec.trigger}
                  </p>
                </div>
              ) : recommendations.length > 0 ? (
                <ul className="space-y-1">
                  {recommendations.map((rec) => (
                    <li key={rec} className="text-sm text-gray-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No recommendations available.
                </p>
              )}
            </section>

            {/* 5. Timeline */}
            <section className="bg-white border rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Document Timeline
              </h2>
              <div className="flex items-center gap-2">
                <TimelineNode
                  label="Purchase Order"
                  date={extractedData.purchaseOrder?.normalizedDate ?? null}
                  warn={isTimelineException}
                />
                <div className="flex-1 h-0.5 bg-gray-200 mt-2" />
                <TimelineNode
                  label="Goods Receipt Note"
                  date={extractedData.goodsReceiptNote?.normalizedDate ?? null}
                  warn={isTimelineException}
                />
                <div className="flex-1 h-0.5 bg-gray-200 mt-2" />
                <TimelineNode
                  label="Vendor Invoice"
                  date={extractedData.vendorInvoice?.normalizedDate ?? null}
                  warn={isTimelineException}
                />
              </div>
              {isTimelineException && selected?.message && (
                <p className="text-xs text-orange-600 mt-3 bg-orange-50 border border-orange-200 rounded p-2">
                  ⚠ {selected.message}
                </p>
              )}
            </section>

            {/* 6. Supporting Documents */}
            <section className="bg-white border rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Supporting Documents
              </h2>
              <div className="space-y-2">
                {[
                  {
                    label: "Purchase Order",
                    filename: files.purchaseOrder,
                    classType: classifications.purchaseOrder,
                    confidence: classifications.purchaseOrderVerification.adjustedConfidence,
                    conflict: classifications.purchaseOrderVerification.conflict,
                    contentType: classifications.purchaseOrderVerification.contentType,
                    extConf: extractionConfidence?.purchaseOrder,
                  },
                  {
                    label: "Goods Receipt Note",
                    filename: files.goodsReceiptNote,
                    classType: classifications.goodsReceiptNote,
                    confidence: classifications.goodsReceiptNoteVerification.adjustedConfidence,
                    conflict: classifications.goodsReceiptNoteVerification.conflict,
                    contentType: classifications.goodsReceiptNoteVerification.contentType,
                    extConf: extractionConfidence?.goodsReceiptNote,
                  },
                  {
                    label: "Vendor Invoice",
                    filename: files.vendorInvoice,
                    classType: classifications.vendorInvoice,
                    confidence: classifications.vendorInvoiceVerification.adjustedConfidence,
                    conflict: classifications.vendorInvoiceVerification.conflict,
                    contentType: classifications.vendorInvoiceVerification.contentType,
                    extConf: extractionConfidence?.vendorInvoice,
                  },
                ].map((doc) => (
                  <div
                    key={doc.label}
                    className={`flex items-start justify-between text-sm rounded p-2 ${
                      doc.conflict
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-700">
                        {doc.filename}
                      </span>
                      <span className="text-gray-400 ml-2">— {doc.classType}</span>
                      {doc.conflict && (
                        <p className="text-xs text-yellow-700 mt-0.5">
                          ⚠ Filename suggests {doc.classType}, content suggests{" "}
                          {doc.contentType}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        Class: {doc.confidence}%
                      </p>
                      {doc.extConf && (
                        <p className="text-xs text-gray-400 whitespace-nowrap ml-4 mt-0.5">
                          Extr: {Math.round(doc.extConf.overallScore * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. Processing Snapshot (collapsible) */}
            <section className="bg-white border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSnapshotOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Processing Snapshot
                </h2>
                <span className="text-gray-400 text-sm">
                  {snapshotOpen ? "▲ collapse" : "▼ expand"}
                </span>
              </button>

              {snapshotOpen && (
                <div className="px-5 pb-5 space-y-1 border-t border-gray-100">
                  {[
                    ["Quantity", matchResult.quantityMatch.matched, `PO: ${matchResult.quantityMatch.po ?? "—"} / GRN: ${matchResult.quantityMatch.grn ?? "—"} / Invoice: ${matchResult.quantityMatch.invoice ?? "—"}`],
                    ["Unit Price", matchResult.priceMatch.matched, `PO: ${matchResult.priceMatch.po ?? "—"} / GRN: ${matchResult.priceMatch.grn ?? "—"} / Invoice: ${matchResult.priceMatch.invoice ?? "—"}`],
                    ["Amount", matchResult.amountMatch.matched, `PO: ${matchResult.amountMatch.po ?? "—"} / GRN: ${matchResult.amountMatch.grn ?? "—"} / Invoice: ${matchResult.amountMatch.invoice ?? "—"}`],
                    ["PO Number", matchResult.poNumberMatch.matched, `${matchResult.poNumberMatch.normalizedPo ?? "—"} / ${matchResult.poNumberMatch.normalizedGrn ?? "—"} / ${matchResult.poNumberMatch.normalizedInvoice ?? "—"}`],
                    ["GRN Number", matchResult.grnNumberMatch.matched, `${matchResult.grnNumberMatch.normalizedPo ?? "—"} / ${matchResult.grnNumberMatch.normalizedGrn ?? "—"} / ${matchResult.grnNumberMatch.normalizedInvoice ?? "—"}`],
                  ].map(([fieldName, matched, detail]) => (
                    <div
                      key={String(fieldName)}
                      className="flex items-start justify-between text-xs py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-500 w-24 shrink-0">{String(fieldName)}</span>
                      <span className={`font-medium mx-4 ${matched ? "text-green-600" : "text-red-500"}`}>
                        {matched ? "Match" : "Mismatch"}
                      </span>
                      <span className="text-gray-400 text-right">{String(detail)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 8. Extraction Transparency (collapsible) */}
            <section className="bg-white border rounded-lg overflow-hidden mt-4">
              <button
                type="button"
                onClick={() => setTransparencyOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  8. Extraction Transparency
                </h2>
                <span className="text-gray-400 text-sm">
                  {transparencyOpen ? "▲ collapse" : "▼ expand"}
                </span>
              </button>

              {transparencyOpen && (
                <div className="overflow-x-auto border-t border-gray-100 text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-medium border-b border-gray-200">Field</th>
                        <th className="px-5 py-3 font-medium border-b border-gray-200 border-l">Purchase Order</th>
                        <th className="px-5 py-3 font-medium border-b border-gray-200 border-l">GRN</th>
                        <th className="px-5 py-3 font-medium border-b border-gray-200 border-l">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {[
                        "vendor",
                        "vendorName",
                        "documentNumber",
                        "poNumber",
                        "grnNumber",
                        "invoiceNumber",
                        "date",
                        "normalizedDate",
                        "quantity",
                        "unitPrice",
                        "amount",
                        "totalAmount",
                      ].map((f) => {
                        const po = extractionProvenance?.purchaseOrder?.[f as keyof ExtractorMetadata] || "—";
                        const grn = extractionProvenance?.goodsReceiptNote?.[f as keyof ExtractorMetadata] || "—";
                        const inv = extractionProvenance?.vendorInvoice?.[f as keyof ExtractorMetadata] || "—";
                        return (
                          <tr key={f} className="hover:bg-gray-50">
                            <td className="px-5 py-2 font-mono text-xs font-medium text-gray-500">{f}</td>
                            <td className={`px-5 py-2 border-l border-gray-100 ${po === "fallback" || po === "missing" ? "text-orange-600 bg-orange-50/50" : ""}`}>{po}</td>
                            <td className={`px-5 py-2 border-l border-gray-100 ${grn === "fallback" || grn === "missing" ? "text-orange-600 bg-orange-50/50" : ""}`}>{grn}</td>
                            <td className={`px-5 py-2 border-l border-gray-100 ${inv === "fallback" || inv === "missing" ? "text-orange-600 bg-orange-50/50" : ""}`}>{inv}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 9. Investigation Assistant */}
            <InvestigationAssistant analysisResult={analysis} selectedIdx={selectedIdx} />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <Link
          href="/upload"
          className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100 transition-colors"
        >
          New Audit
        </Link>
      </div>
    </main>
  );
}
