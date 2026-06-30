"use client";

import Link from "next/link";
import type {
  MatchDocumentsResult,
} from "@/lib/matcher";
import { useState, useSyncExternalStore } from "react";
import type { FinancialExposureResult } from "@/lib/financialExposure";
import type { RiskAssessmentResult } from "@/lib/riskEngine";
import type { ExplainabilityResult } from "@/lib/explainability";
import type { ContentVerificationResult } from "@/lib/classifier";
import type { DocumentConfidence } from "@/lib/extractionConfidence";
import type { ExtractorMetadata, ExtractionStatus } from "@/lib/extractor";
import { startFreshAuditSession } from "@/lib/auditSessionLifecycle";
import { InvestigationAssistant } from "@/components/InvestigationAssistant";
import { EmptyState, MetricCard, PageShell, Panel, Tag } from "@/components/presentation";
import { FileText, FileCheck, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Activity, FileDown, Search, ArrowRight, ClipboardCheck, Clock, FileWarning, BarChart4 } from "lucide-react";

// ─────────────────────────────────────────────
// Types (mirrors upload/page.tsx — AnalysisResult structure preserved)
import type { PrioritizedException } from "@/lib/prioritizationEngine";
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
  rootCauses?: {
    exceptionType: string;
    rootCause: string;
    category: "System Failure" | "Business Mismatch" | "Administrative Error";
    confidence: "Proven" | "Inferred";
    evidence: string[];
  }[];
  exceptionRisks?: { type: string; score: number }[];
  prioritizedQueue?: PrioritizedException[];
};

const analysisStorageKey = "auditIQAnalysis";

let cachedRawAnalysis: string | null = null;
let cachedParsedAnalysis: AnalysisResult | null = null;

function readAnalysisFromStorage(): AnalysisResult | null {
  const stored = sessionStorage.getItem(analysisStorageKey);

  if (stored === cachedRawAnalysis) {
    return cachedParsedAnalysis;
  }

  cachedRawAnalysis = stored;

  if (!stored) {
    cachedParsedAnalysis = null;
    return cachedParsedAnalysis;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AnalysisResult>;
    cachedParsedAnalysis = parsed.explainability ? (parsed as AnalysisResult) : null;
  } catch {
    cachedParsedAnalysis = null;
  }

  return cachedParsedAnalysis;
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

function ResultsSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-gray-200" />
        <div className="h-20 w-full max-w-3xl animate-pulse rounded-lg bg-amber-100/80 border border-amber-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200 mb-3" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200 mb-2" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-white shadow-sm p-8">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
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

function DocumentIcon({ label, isWarning = false }: { label: string; isWarning?: boolean }) {
  return (
    <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm ${isWarning ? "border-amber-200 bg-amber-50 text-amber-600" : "border-slate-200 bg-white text-slate-600"}`}>
      <FileText className="h-5 w-5" />
      {isWarning && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white">
          <AlertTriangle className="h-2.5 w-2.5 text-white" />
        </span>
      )}
    </span>
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
  status,
}: {
  label: string;
  filename: string;
  doc: ExtractedDoc;
  highlightQty: boolean;
  highlightPrice: boolean;
  highlightAmount: boolean;
  confidence?: DocumentConfidence;
  provenance?: ExtractorMetadata;
  status?: ExtractionStatus;
}) {
  if (!doc) {
    return (
      <div className="flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <DocumentIcon label={label} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">Not provided</p>
          </div>
        </div>
        {status ? (
          <div className="mt-3">
            <Tag tone={status.mode === "fallback" ? "warning" : "success"}>
              {status.mode === "fallback" ? "Fallback" : "AI extracted"}
            </Tag>
          </div>
        ) : null}
      </div>
    );
  }

  const field = (name: string, val: string | number | null, mismatch: boolean, fieldKey?: keyof ExtractorMetadata) => {
    const prov = fieldKey && provenance ? provenance[fieldKey] : undefined;
    const fieldConf = fieldKey && confidence?.fields ? confidence.fields[fieldKey] : undefined;
    const isWarning = prov === "fallback" || prov === "missing";
    return (
      <div
        className={`rounded-md border px-3 py-2 ${
          mismatch
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : isWarning
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {name}
          </span>
          <span className="text-sm font-semibold">{val ?? "—"}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            {isWarning ? `Source: ${prov}` : mismatch ? "Mismatch" : "Matched field"}
          </span>
          {fieldConf ? (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              fieldConf.score >= 0.7 ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
            }`}>
              {Math.round(fieldConf.score * 100)}%
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DocumentIcon label={label} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{label}</p>
            <p className="truncate text-xs text-slate-500" title={filename}>{filename}</p>
          </div>
        </div>
        {confidence ? (
          <Tag tone={confidence.overallScore >= 0.7 ? "success" : "warning"}>
            {Math.round(confidence.overallScore * 100)}%
          </Tag>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {status ? (
          <Tag tone={status.mode === "fallback" ? "warning" : "success"}>
            {status.mode === "fallback" ? "Fallback" : "AI extracted"}
          </Tag>
        ) : null}
        <Tag tone="default">{doc.vendor || "Vendor unknown"}</Tag>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Doc #</p>
          <p className="mt-1 truncate font-semibold text-slate-800">{doc.documentNumber || "—"}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
          <p className="mt-1 truncate font-semibold text-slate-800">{doc.normalizedDate ?? doc.date}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {field("Quantity", doc.quantity, highlightQty, "quantity")}
        {field("Unit", `₹${doc.unitPrice}`, highlightPrice, "unitPrice")}
        {field("Amount", fmt(doc.amount), highlightAmount, "amount")}
      </div>
      {status?.mode === "fallback" && status.reason && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
          {status.reason}
        </p>
      )}
    </div>
  );
}

function TimelineNode({
  label,
  date,
  warn,
  isLast = false,
}: {
  label: string;
  date: string | null;
  warn: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`relative flex flex-col items-center text-center ${!isLast ? "flex-1" : "w-32"}`}>
      <div className="z-10 flex flex-col items-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border-4 text-lg font-bold shadow-sm ${
            warn
              ? "border-amber-200 bg-amber-50 text-amber-600 ring-4 ring-white"
              : date
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 ring-4 ring-white"
              : "border-slate-200 bg-slate-50 text-slate-400 ring-4 ring-white"
          }`}
        >
          {warn ? <FileWarning className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        <div className="mt-3">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className={`mt-0.5 text-xs font-medium ${warn ? "text-amber-600" : "text-slate-500"}`}>
            {date ?? "Unavailable"}
          </p>
        </div>
      </div>
      {!isLast && (
        <div
          className={`absolute left-1/2 top-6 h-0.5 w-[calc(100%-3rem)] -z-0 ${
            warn ? "bg-amber-200" : date ? "bg-emerald-200" : "bg-slate-200"
          }`}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function ResultsPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  const analysis = useSyncExternalStore(
    () => () => {},
    readAnalysisFromStorage,
    () => undefined
  );

  if (analysis === undefined) {
    return <ResultsSkeleton />;
  }

  if (analysis === null) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Exception Investigation
          </h1>
          <p className="text-sm text-gray-500">
            No analysis is available yet. Upload documents to generate a results snapshot.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Waiting for analysis data from session storage.
        </div>
      </main>
    );
  }

  const { exceptions, financialExposure, risk, recommendations, explainability, extractedData, matchResult, files, classifications, extractionConfidence, extractionProvenance, extractionStatus, rootCauses, exceptionRisks, extractionErrors, prioritizedQueue } = analysis;
  
  const displayExceptions = prioritizedQueue && prioritizedQueue.length > 0 ? prioritizedQueue.map(p => p.exception) : exceptions;
  const selected = displayExceptions[selectedIdx] ?? null;
  const docCount = Object.values(files).filter(Boolean).length;

  const hasFallbackExtraction = extractionStatus && Object.values(extractionStatus).some((status) => status?.mode === "fallback");
  const fallbackExtractionReasons = Object.entries(extractionStatus || {})
    .filter(([, status]) => status?.mode === "fallback")
    .map(([key, status]) => `${key}: ${status?.reason ?? "Fallback data used."}`);

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

  return (
    <PageShell
      eyebrow="Investigation Workspace"
      title="Exception Investigation Console"
      description={explainability.summary}
      actions={
        <>
          <Tag tone={risk.level === "Critical" || risk.level === "High" ? "danger" : risk.level === "Medium" ? "warning" : "success"}>
            Risk: {risk.level}
          </Tag>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/upload"
            onClick={startFreshAuditSession}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New Audit
          </Link>
        </>
      }
    >
      {hasFallbackExtraction ? (
        <Panel
          tone="warning"
          title="Fallback extraction detected"
          subtitle="Some values were inferred from fallback logic, so the console highlights the reduced-confidence fields."
        >
          <div className="space-y-2 text-sm text-amber-900">
            <p>AI extraction unavailable for at least one document in this session.</p>
            {fallbackExtractionReasons.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-900/90">
                {fallbackExtractionReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Financial Exposure"
          value={fmt(financialExposure.totalExposure)}
          detail="Current exposure snapshot"
          accent={financialExposure.totalExposure > 0 ? "amber" : "green"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Exceptions Found"
          value={String(exceptions.length)}
          detail="Detected by the exception engine"
          accent={exceptions.length > 0 ? "red" : "green"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <MetricCard
          label="Risk Level"
          value={risk.level}
          detail={`Score: ${risk.score}`}
          accent={risk.level === "Critical" || risk.level === "High" ? "red" : risk.level === "Medium" ? "amber" : "green"}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Documents Analyzed"
          value={String(docCount)}
          detail="Files in the current workspace"
          accent="blue"
          icon={<FileCheck className="h-4 w-4" />}
        />
      </div>

      {exceptions.length === 0 ? (
        <Panel tone="success" title="No exceptions detected" subtitle="All three documents are in agreement. No further action required.">
          <EmptyState
            title="Clean audit snapshot"
            description="The workspace is aligned and ready for a new upload cycle if you want to run another investigation."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Panel
            title="Priority rail"
            subtitle="Ranked exceptions with exposure context."
            className="h-fit xl:sticky xl:top-6"
          >
            <div className="space-y-2">
              {displayExceptions.map((ex, idx) => {
                const expAmt = financialExposure.breakdown.find((b) => b.exception === ex.type);
                const isActive = idx === selectedIdx;
                return (
                  <button
                    key={`${ex.type}-${idx}`}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      isActive
                        ? "border-sky-300 bg-sky-50 shadow-[0_10px_24px_rgba(14,165,233,0.12)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-sky-950" : "text-slate-900"}`}>
                          {ex.type}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Exposure {expAmt ? fmt(expAmt.exposure) : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Tag tone={ex.severity === "Critical" || ex.severity === "High" ? "danger" : ex.severity === "Medium" ? "warning" : "success"}>
                          {ex.severity}
                        </Tag>
                        {prioritizedQueue && prioritizedQueue[idx] ? (
                          <span className="text-xs font-semibold text-slate-500">
                            Score {prioritizedQueue[idx].finalPriorityScore}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-6 min-w-0">
            {selected ? (
              <Panel
                tone={
                  selected.severity === "Critical" || selected.severity === "High"
                    ? "danger"
                    : selected.severity === "Medium"
                      ? "warning"
                      : "accent"
                }
                title={`Investigating ${selected.type}`}
                subtitle="Selected exception context and supporting evidence."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Tag tone={selected.severity === "Critical" || selected.severity === "High" ? "danger" : selected.severity === "Medium" ? "warning" : "success"}>
                    {selected.severity}
                  </Tag>
                  {prioritizedQueue && prioritizedQueue[selectedIdx] ? (
                    <Tag tone="slate">Priority {prioritizedQueue[selectedIdx].finalPriorityScore}</Tag>
                  ) : null}
                  {exceptionRisks ? (
                    <Tag tone="default">
                      Risk Base: {exceptionRisks.find((r) => r.type === selected.type)?.score ?? "N/A"}/100
                    </Tag>
                  ) : null}
                </div>
              </Panel>
            ) : null}

            <Panel title="Document details" subtitle="Three-way match inputs grouped for quick inspection.">
              <div className="grid gap-4 xl:grid-cols-3">
                <DocumentCard
                  label="Purchase Order"
                  filename={files.purchaseOrder}
                  doc={extractedData.purchaseOrder}
                  highlightQty={!matchResult.quantityMatch.matched}
                  highlightPrice={!matchResult.priceMatch.matched}
                  highlightAmount={!matchResult.amountMatch.matched}
                  confidence={extractionConfidence?.purchaseOrder}
                  provenance={extractionProvenance?.purchaseOrder}
                  status={extractionStatus?.purchaseOrder}
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
                  status={extractionStatus?.goodsReceiptNote}
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
                  status={extractionStatus?.vendorInvoice}
                />
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
              {selectedRootCause ? (
                <Panel
                  title="Root cause diagnosis"
                  subtitle="Why the exception exists and what evidence supports it."
                  tone={selectedRootCause.confidence === "Proven" ? "success" : "accent"}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{selectedRootCause.rootCause}</p>
                      <p className="mt-1 text-sm text-slate-500">Category: {selectedRootCause.category}</p>
                    </div>
                    <Tag tone={selectedRootCause.confidence === "Proven" ? "success" : "accent"}>
                      {selectedRootCause.confidence}
                    </Tag>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Evidence</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {selectedRootCause.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                </Panel>
              ) : null}

              <Panel title="Mismatch explanation" subtitle="Readable explanation tailored to the selected exception.">
                {selectedExplanation ? (
                  <p className="text-sm leading-7 text-slate-600">{selectedExplanation}</p>
                ) : (
                  <p className="text-sm italic text-slate-400">No detailed explanation available for this exception type.</p>
                )}
              </Panel>

              <Panel title="Financial impact" subtitle="How much of the exposure is tied to the selected issue.">
                {selectedExposure ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Tag tone={selected.severity === "Critical" || selected.severity === "High" ? "danger" : selected.severity === "Medium" ? "warning" : "success"}>
                        {selected.severity} Impact
                      </Tag>
                    </div>
                    <p className={`text-4xl font-semibold tracking-tight ${selected.severity === "Critical" || selected.severity === "High" ? "text-rose-600" : selected.severity === "Medium" ? "text-amber-600" : "text-emerald-600"}`}>
                      {fmt(selectedExposure.exposure)}
                    </p>
                    <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${selected.severity === "Critical" || selected.severity === "High" ? "bg-rose-500" : selected.severity === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.round((selectedExposure.exposure / (financialExposure.totalExposure || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <BarChart4 className="h-4 w-4" />
                      Represents {Math.round((selectedExposure.exposure / (financialExposure.totalExposure || 1)) * 100)}% of total {fmt(financialExposure.totalExposure)} exposure
                    </p>
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">
                    Financial exposure is not directly calculable for this exception type.
                  </p>
                )}
              </Panel>

              <Panel title={selected ? "Recommended Action" : "Audit Outcome"} subtitle={selected ? "Next-best action for the current exception." : "The result of a clean audit."}>
                {selectedRec ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                    <p className="text-sm font-semibold text-sky-950">{selectedRec.action}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
                      <AlertTriangle className="h-3 w-3 text-sky-500" /> Trigger: {selectedRec.trigger}
                    </p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {recommendations.map((rec) => (
                      <li key={rec} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : !selected ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">Approved</p>
                      <p className="text-sm text-emerald-800">Documents align perfectly. Proceed with processing.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">No recommendations available.</p>
                )}
              </Panel>
            </div>

            <Panel title="Document timeline" subtitle="Chronological sequence across the three uploaded documents.">
              <div className="mt-4 flex w-full flex-col gap-8 md:flex-row md:items-start md:gap-0 px-4 md:px-8">
                <TimelineNode
                  label="Purchase Order"
                  date={extractedData.purchaseOrder?.normalizedDate ?? null}
                  warn={isTimelineException}
                />
                <TimelineNode
                  label="Goods Receipt Note"
                  date={extractedData.goodsReceiptNote?.normalizedDate ?? null}
                  warn={isTimelineException}
                />
                <TimelineNode
                  label="Vendor Invoice"
                  date={extractedData.vendorInvoice?.normalizedDate ?? null}
                  warn={isTimelineException}
                  isLast
                />
              </div>
              {isTimelineException && selected?.message ? (
                <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mb-0.5 inline-block h-4 w-4 mr-1.5" />
                  {selected.message}
                </p>
              ) : null}
            </Panel>

            <Panel title="Supporting documents" subtitle="Classification and extraction confidence at a glance.">
              <div className="space-y-3">
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
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
                      doc.conflict ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${doc.conflict ? "border-amber-200 bg-amber-100/50 text-amber-600" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{doc.filename || "Not uploaded"}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          {doc.classType}
                          {doc.conflict ? <span className="text-amber-600 ml-1">· Content suggests {doc.contentType}</span> : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Tag tone={doc.conflict ? "warning" : "default"}>Class: {doc.confidence}%</Tag>
                      {doc.extConf ? (
                        <Tag tone={doc.extConf.overallScore >= 0.7 ? "success" : "warning"}>
                          Extr: {Math.round(doc.extConf.overallScore * 100)}%
                        </Tag>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setSnapshotOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Processing snapshot
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Deterministic match diagnostics.</p>
                </div>
                <span className="text-sm text-slate-500">{snapshotOpen ? "Collapse" : "Expand"}</span>
              </button>

              {snapshotOpen ? (
                <div className="border-t border-slate-200 px-5 pb-5 pt-4 space-y-2">
                  {[
                    ["Quantity", matchResult.quantityMatch.matched, `PO: ${matchResult.quantityMatch.po ?? "—"} / GRN: ${matchResult.quantityMatch.grn ?? "—"} / Invoice: ${matchResult.quantityMatch.invoice ?? "—"}`],
                    ["Unit Price", matchResult.priceMatch.matched, `PO: ${matchResult.priceMatch.po ?? "—"} / GRN: ${matchResult.priceMatch.grn ?? "—"} / Invoice: ${matchResult.priceMatch.invoice ?? "—"}`],
                    ["Amount", matchResult.amountMatch.matched, `PO: ${matchResult.amountMatch.po ?? "—"} / GRN: ${matchResult.amountMatch.grn ?? "—"} / Invoice: ${matchResult.amountMatch.invoice ?? "—"}`],
                    ["PO Number", matchResult.poNumberMatch.matched, `${matchResult.poNumberMatch.normalizedPo ?? "—"} / ${matchResult.poNumberMatch.normalizedGrn ?? "—"} / ${matchResult.poNumberMatch.normalizedInvoice ?? "—"}`],
                    ["GRN Number", matchResult.grnNumberMatch.matched, `${matchResult.grnNumberMatch.normalizedPo ?? "—"} / ${matchResult.grnNumberMatch.normalizedGrn ?? "—"} / ${matchResult.grnNumberMatch.normalizedInvoice ?? "—"}`],
                  ].map(([fieldName, matched, detail]) => (
                    <div key={String(fieldName)} className="grid grid-cols-[140px_90px_1fr] gap-4 rounded-xl border border-slate-200 px-4 py-2 text-xs">
                      <span className="font-medium text-slate-500">{String(fieldName)}</span>
                      <span className={`font-semibold ${matched ? "text-emerald-600" : "text-rose-500"}`}>
                        {matched ? "Match" : "Mismatch"}
                      </span>
                      <span className="text-slate-500">{String(detail)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setTransparencyOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Extraction transparency
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Field provenance, confidence, and fallback state.</p>
                </div>
                <span className="text-sm text-slate-500">{transparencyOpen ? "Collapse" : "Expand"}</span>
              </button>

              {transparencyOpen ? (
                <div className="border-t border-slate-200 p-5 text-sm space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { key: "purchaseOrder", label: "Purchase Order", error: extractionErrors?.purchaseOrder, conf: extractionConfidence?.purchaseOrder, prov: extractionProvenance?.purchaseOrder, status: extractionStatus?.purchaseOrder },
                      { key: "goodsReceiptNote", label: "Goods Receipt Note", error: extractionErrors?.goodsReceiptNote, conf: extractionConfidence?.goodsReceiptNote, prov: extractionProvenance?.goodsReceiptNote, status: extractionStatus?.goodsReceiptNote },
                      { key: "vendorInvoice", label: "Vendor Invoice", error: extractionErrors?.vendorInvoice, conf: extractionConfidence?.vendorInvoice, prov: extractionProvenance?.vendorInvoice, status: extractionStatus?.vendorInvoice },
                    ].map((doc) => {
                      const extractedCount = doc.prov ? Object.values(doc.prov).filter((v) => v === "extracted").length : 0;
                      const fallbackCount = doc.prov ? Object.values(doc.prov).filter((v) => v === "fallback").length : 0;
                      const missingCount = doc.prov ? Object.values(doc.prov).filter((v) => v === "missing").length : 0;
                      return (
                        <div key={doc.key} className={`rounded-2xl border p-4 ${doc.error ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-slate-50"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-950">{doc.label}</h3>
                              <p className={`mt-1 text-xs font-semibold ${doc.status?.mode === "fallback" ? "text-amber-700" : "text-emerald-700"}`}>
                                {doc.status?.mode === "fallback" ? "Fallback Extraction" : "AI Extracted"}
                              </p>
                            </div>
                            <Tag tone={doc.conf && doc.conf.overallScore >= 0.7 ? "success" : "warning"}>
                              {doc.conf ? `${Math.round(doc.conf.overallScore * 100)}%` : "N/A"}
                            </Tag>
                          </div>
                          {doc.status?.mode === "fallback" && doc.status.reason ? (
                            <p className="mt-2 text-xs text-amber-700">{doc.status.reason}</p>
                          ) : null}
                          {doc.error ? <p className="mt-2 text-xs font-medium text-rose-600">Error: {doc.error}</p> : null}
                          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs">
                            <div><p className="font-semibold text-slate-900">{extractedCount}</p><p className="text-slate-500">Extracted</p></div>
                            <div><p className={`font-semibold ${fallbackCount > 0 ? "text-amber-600" : "text-slate-900"}`}>{fallbackCount}</p><p className="text-slate-500">Fallback</p></div>
                            <div><p className={`font-semibold ${missingCount > 0 ? "text-rose-600" : "text-slate-900"}`}>{missingCount}</p><p className="text-slate-500">Missing</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-4 font-semibold text-slate-900">Field</th>
                            <th className="border-l border-slate-200 px-5 py-4 font-semibold text-slate-900">Purchase Order</th>
                            <th className="border-l border-slate-200 px-5 py-4 font-semibold text-slate-900">GRN</th>
                            <th className="border-l border-slate-200 px-5 py-4 font-semibold text-slate-900">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                          {[
                            "vendor",
                            "documentNumber",
                            "poNumber",
                            "grnNumber",
                            "invoiceNumber",
                            "date",
                            "quantity",
                            "unitPrice",
                            "amount",
                          ].map((f) => {
                            const po = extractionProvenance?.purchaseOrder?.[f as keyof ExtractorMetadata] || "—";
                            const grn = extractionProvenance?.goodsReceiptNote?.[f as keyof ExtractorMetadata] || "—";
                            const inv = extractionProvenance?.vendorInvoice?.[f as keyof ExtractorMetadata] || "—";
                            
                            const renderCell = (val: string) => {
                              const isWarning = val === "fallback" || val === "missing";
                              return (
                                <td className={`border-l border-slate-100 px-5 py-3 ${isWarning ? "bg-amber-50/40" : ""}`}>
                                  {isWarning ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                      <AlertTriangle className="h-3 w-3" /> {val}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                      <CheckCircle className="h-3 w-3 text-emerald-500" /> {val}
                                    </span>
                                  )}
                                </td>
                              );
                            };

                            return (
                              <tr key={f} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3 font-mono text-xs font-medium text-slate-500">{f}</td>
                                {renderCell(po)}
                                {renderCell(grn)}
                                {renderCell(inv)}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <InvestigationAssistant analysisResult={analysis} selectedException={selected} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
