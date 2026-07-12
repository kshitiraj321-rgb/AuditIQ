"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { PrioritizedException } from "@/lib/prioritizationEngine";
import { startFreshAuditSession } from "@/lib/auditSessionLifecycle";
import { EmptyState, MetricCard, PageShell, Panel, Tag } from "@/components/presentation";
import { FileText, Building, Calendar, AlertTriangle, ShieldCheck, Activity, CheckCircle, FileCheck, CircleDashed, ClipboardCheck, DollarSign } from "lucide-react";

type DashboardAnalysis = {
  files: {
    purchaseOrder: string;
    goodsReceiptNote: string;
    vendorInvoice: string;
  };
  exceptions: {
    type: string;
    severity: string;
  }[];
  financialExposure: {
    totalExposure: number;
  };
  risk: {
    score: number;
    level: string;
  };
  extractedData?: {
    vendorInvoice?: {
      vendor: string;
    };
  };
  prioritizedQueue?: PrioritizedException[];
};

const analysisStorageKey = "auditIQAnalysis";

const emptyAnalysis: DashboardAnalysis = {
  files: {
    purchaseOrder: "",
    goodsReceiptNote: "",
    vendorInvoice: "",
  },
  exceptions: [],
  financialExposure: {
    totalExposure: 0,
  },
  risk: {
    score: 0,
    level: "Low",
  },
  prioritizedQueue: [],
};

function normalizeAnalysis(parsedAnalysis: Partial<DashboardAnalysis> | null): DashboardAnalysis {
  return {
    files: {
      purchaseOrder:
        typeof parsedAnalysis?.files?.purchaseOrder === "string"
          ? parsedAnalysis.files.purchaseOrder
          : "",
      goodsReceiptNote:
        typeof parsedAnalysis?.files?.goodsReceiptNote === "string"
          ? parsedAnalysis.files.goodsReceiptNote
          : "",
      vendorInvoice:
        typeof parsedAnalysis?.files?.vendorInvoice === "string"
          ? parsedAnalysis.files.vendorInvoice
          : "",
    },
    exceptions: Array.isArray(parsedAnalysis?.exceptions)
      ? parsedAnalysis.exceptions.filter((exception) => {
          return (
            typeof exception === "object" &&
            exception !== null &&
            "type" in exception &&
            "severity" in exception
          );
        }) as DashboardAnalysis["exceptions"]
      : [],
    financialExposure: {
      totalExposure:
        typeof parsedAnalysis?.financialExposure?.totalExposure === "number"
          ? parsedAnalysis.financialExposure.totalExposure
          : 0,
    },
    risk: {
      score:
        typeof parsedAnalysis?.risk?.score === "number"
          ? parsedAnalysis.risk.score
          : 0,
      level:
        typeof parsedAnalysis?.risk?.level === "string"
          ? parsedAnalysis.risk.level
          : "Low",
    },
    prioritizedQueue: Array.isArray(parsedAnalysis?.prioritizedQueue)
      ? parsedAnalysis.prioritizedQueue
      : [],
    extractedData: parsedAnalysis?.extractedData,
  };
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function readAnalysisFromStorage() {
  try {
    const storedAnalysis = sessionStorage.getItem(analysisStorageKey);

    if (!storedAnalysis) {
      return emptyAnalysis;
    }

    const parsedAnalysis = JSON.parse(storedAnalysis) as Partial<DashboardAnalysis> | null;
    return normalizeAnalysis(parsedAnalysis);
  } catch {
    return emptyAnalysis;
  }
}

function statTone(value: number, threshold: number) {
  return value >= threshold ? "red" : "blue";
}

export default function Home() {
  const [analysis, setAnalysis] = useState<DashboardAnalysis>(emptyAnalysis);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const pathname = usePathname();

  useEffect(() => {
    setAnalysis(readAnalysisFromStorage());

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setAnalysis(readAnalysisFromStorage());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  if (!isClient) return null;

  const documentCount = Object.values(analysis.files).filter(Boolean).length;
  const hasAnalysis =
    documentCount > 0 ||
    analysis.exceptions.length > 0 ||
    analysis.financialExposure.totalExposure > 0 ||
    analysis.risk.score > 0;

  const topExceptions = analysis.prioritizedQueue || [];
  const leadException = topExceptions[0];
  const complianceRisk = leadException?.complianceScore ?? 0;
  const vendorRisk = leadException?.vendorScore ?? 0;
  const highAttention =
    analysis.financialExposure.totalExposure > 0 ||
    analysis.exceptions.length > 0 ||
    analysis.risk.level === "High" ||
    analysis.risk.level === "Critical";

  const statusLabel = hasAnalysis ? "Live audit snapshot" : "Awaiting document upload";
  const statusTone = hasAnalysis ? "success" : "warning";

  return (
    <PageShell
      eyebrow="AuditIQ Executive Dashboard"
      title="Executive audit intelligence"
      description="Live procurement exception status, financial exposure, and investigation priority from the current audit session."
      actions={
        <>
          <Tag tone={statusTone}>{statusLabel}</Tag>
          <Link
            href="/upload"
            onClick={startFreshAuditSession}
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
          >
            Start New Audit
          </Link>
          <Link
            href="/results"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
          >
            Open Workspace
          </Link>
        </>
      }
    >
      {!hasAnalysis ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10 text-emerald-500" />}
          title="Audit Clean"
          description="No procurement risks detected. Upload another audit to continue monitoring."
          action={
            <div className="flex justify-center gap-3">
              <Link
                href="/upload"
                onClick={startFreshAuditSession}
                className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Upload Documents
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
              >
                View Results Layout
              </Link>
            </div>
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Documents Analyzed"
          value={String(documentCount)}
          detail={<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500"></span> {documentCount} active artifacts</span>}
          footer="Current Audit"
          accent="blue"
          icon={<FileText className="h-4 w-4" />}
          trend="up"
        />
        <MetricCard
          label="Exceptions Found"
          value={String(analysis.exceptions.length)}
          detail={<span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${analysis.exceptions.length > 0 ? "bg-rose-500" : "bg-emerald-500"}`}></span> {analysis.exceptions.length > 0 ? "Attention required" : "No queue items"}</span>}
          footer="Live Snapshot"
          accent={statTone(analysis.exceptions.length, 1)}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={analysis.exceptions.length > 0 ? "up" : "neutral"}
        />
        <MetricCard
          label="Financial Exposure"
          value={formatCurrency(analysis.financialExposure.totalExposure)}
          detail={<span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${analysis.financialExposure.totalExposure > 0 ? "bg-amber-500" : "bg-emerald-500"}`}></span> {analysis.financialExposure.totalExposure > 0 ? "Exposure detected" : "No financial exposure"}</span>}
          footer="Current Audit"
          accent={statTone(analysis.financialExposure.totalExposure, 1) === "red" ? "red" : "amber"}
          icon={<DollarSign className="h-4 w-4" />}
          trend={analysis.financialExposure.totalExposure > 0 ? "down" : "neutral"}
        />
        <MetricCard
          label="Risk Score"
          value={String(analysis.risk.score)}
          detail={<span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${analysis.risk.level === "Critical" || analysis.risk.level === "High" ? "bg-rose-500" : "bg-emerald-500"}`}></span> Level: {analysis.risk.level}</span>}
          footer="Live Snapshot"
          accent={analysis.risk.level === "Critical" || analysis.risk.level === "High" ? "red" : "green"}
          icon={<Activity className="h-4 w-4" />}
          trend={analysis.risk.level === "Critical" || analysis.risk.level === "High" ? "up" : "neutral"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <Panel
            title="Executive brief"
            subtitle="Immediate posture for the current procurement audit."
            tone="accent"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-lg border border-white/10 bg-white/5 p-5 md:grid-cols-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <CheckCircle className="h-3 w-3" /> Audit Status
                </p>
                <p className={`mt-2 text-sm font-semibold flex items-center gap-1.5 ${hasAnalysis ? "text-emerald-400" : "text-white"}`}>
                  {hasAnalysis ? <CheckCircle className="h-4 w-4" /> : null} {hasAnalysis ? "Completed" : "Pending"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Building className="h-3 w-3" /> Current Vendor
                </p>
                <p className="mt-2 text-sm font-semibold text-white truncate" title={analysis.extractedData?.vendorInvoice?.vendor || "Not assigned"}>
                  {analysis.extractedData?.vendorInvoice?.vendor || (hasAnalysis ? "Extracted from Documents" : "Not assigned")}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Calendar className="h-3 w-3" /> Audit Date
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Activity className="h-3 w-3" /> Risk Level
                </p>
                <div className="mt-2">
                  <Tag tone={highAttention ? "danger" : "success"}>{analysis.risk.level}</Tag>
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <ClipboardCheck className="h-3 w-3" /> Recommendation
                </p>
                <p className={`mt-2 text-sm font-semibold ${highAttention ? "text-rose-400" : "text-sky-400"}`}>
                  {highAttention ? "Review Required" : "Approve Match"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <FileCheck className="h-3 w-3" /> Documents
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{documentCount} attached</p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <CircleDashed className="h-3 w-3" /> Processing
                </p>
                <p className={`mt-2 text-sm font-semibold ${hasAnalysis ? "text-emerald-400" : "text-white"}`}>
                  {hasAnalysis ? "Success" : "Awaiting input"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <ShieldCheck className="h-3 w-3" /> Finding
                </p>
                <p className={`mt-2 text-sm font-semibold flex items-center gap-1.5 ${highAttention ? "text-rose-400" : "text-emerald-400"}`}>
                  {!highAttention && hasAnalysis ? <ShieldCheck className="h-4 w-4" /> : null}
                  {highAttention ? "Exceptions present" : "Clear for processing"}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Exposure summary" subtitle="Actual totals from the current audit session.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Exposure", formatCurrency(analysis.financialExposure.totalExposure), "Estimated financial risk"],
                ["Priority load", String(topExceptions.length), "Ranked exceptions"],
                ["Vendor pressure", String(vendorRisk), "Vendor risk signal"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel
            title="Recent Audit"
            subtitle="The most recent session artifacts captured in this browser."
          >
            <div className="space-y-3">
              {Object.entries(analysis.files).map(([key, value]) => {
                const label =
                  key === "purchaseOrder"
                    ? "PO"
                    : key === "goodsReceiptNote"
                      ? "GRN"
                      : "Invoice";
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{value || "Not uploaded"}</p>
                      </div>
                    </div>
                    <Tag tone={value ? "success" : "slate"}>{value ? "Loaded" : "Missing"}</Tag>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Priority Exceptions"
            subtitle={hasAnalysis ? "High-priority items sorted by the exception engine." : "Awaiting the first audit session."}
          >
            {topExceptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-10 px-6 text-center">
                <CheckCircle className="mb-3 h-8 w-8 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900">✓ No priority exceptions</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Current audit is clean. No high-priority items require immediate attention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topExceptions.map((ex, idx) => (
                  <div
                    key={`${ex.exception.type}-${idx}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{ex.exception.type}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Severity: <span className="font-semibold text-rose-600">{ex.exception.severity}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Priority</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-950">{typeof ex.finalPriorityScore === 'number' ? Number(ex.finalPriorityScore.toFixed(1)) : ex.finalPriorityScore}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
