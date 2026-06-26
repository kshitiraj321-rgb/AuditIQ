"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PrioritizedException } from "@/lib/prioritizationEngine";

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

function normalizeAnalysis(
  parsedAnalysis: Partial<DashboardAnalysis> | null
): DashboardAnalysis {
  return {
    files: {
      purchaseOrder: parsedAnalysis?.files?.purchaseOrder ?? "",
      goodsReceiptNote: parsedAnalysis?.files?.goodsReceiptNote ?? "",
      vendorInvoice: parsedAnalysis?.files?.vendorInvoice ?? "",
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

    const parsedAnalysis = JSON.parse(storedAnalysis) as
      | Partial<DashboardAnalysis>
      | null;

    return normalizeAnalysis(parsedAnalysis);
  } catch {
    return emptyAnalysis;
  }
}

export default function Home() {
  const [analysis, setAnalysis] = useState<DashboardAnalysis>(emptyAnalysis);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timeoutId = window.setTimeout(() => {
      setAnalysis(readAnalysisFromStorage());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const documentCount = Object.values(analysis.files).filter(Boolean).length;
  const hasAnalysis =
    documentCount > 0 ||
    analysis.exceptions.length > 0 ||
    analysis.financialExposure.totalExposure > 0 ||
    analysis.risk.score > 0;

  const topExceptions = analysis.prioritizedQueue || [];
  const complianceRisk = topExceptions.length > 0 ? topExceptions[0].complianceScore : 0;
  const vendorRisk = topExceptions.length > 0 ? topExceptions[0].vendorScore : 0;
  
  if (!isClient) return null;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">AuditIQ</h1>
          <p className="text-lg md:text-xl text-gray-600">AI-Powered Exception Intelligence Platform</p>
        </div>
        <div className="flex gap-4">
          <Link href="/upload" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">
            Upload Documents
          </Link>
          <Link href="/results" className="px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-50">
            View Results
          </Link>
        </div>
      </div>

      {!hasAnalysis && (
        <div className="border border-blue-200 bg-blue-50 p-6 rounded-lg mb-8 text-center">
          <p className="font-semibold text-xl text-blue-800">No analysis found yet.</p>
          <p className="mt-2 text-blue-600">
            Upload documents to populate the dashboard with the latest analysis.
          </p>
        </div>
      )}

      {/* KPI Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border p-4 rounded shadow-sm bg-white">
          <h2 className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Documents Analyzed</h2>
          <p className="text-3xl font-bold mt-2">{documentCount}</p>
        </div>

        <div className="border p-4 rounded shadow-sm bg-white">
          <h2 className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Exceptions Found</h2>
          <p className="text-3xl font-bold mt-2">{analysis.exceptions.length}</p>
        </div>

        <div className="border p-4 rounded shadow-sm bg-white">
          <h2 className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Financial Exposure</h2>
          <p className="text-3xl font-bold mt-2 text-red-600">
            {formatCurrency(analysis.financialExposure.totalExposure)}
          </p>
        </div>

        <div className="border p-4 rounded shadow-sm bg-white">
          <h2 className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Risk Score</h2>
          <div className="flex items-end gap-2 mt-2">
            <p className="text-3xl font-bold">{analysis.risk.score}</p>
            <p className="text-sm font-semibold text-gray-600 mb-1 px-2 py-1 bg-gray-100 rounded">Level: {analysis.risk.level}</p>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Priority Exceptions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Priority Exceptions</h2>
          
          {hasAnalysis && topExceptions.length === 0 ? (
            <div className="border p-6 rounded-lg text-center bg-gray-50 text-gray-500">
              No priority exceptions found. The current audit is clean.
            </div>
          ) : !hasAnalysis ? (
             <div className="border p-6 rounded-lg text-center bg-gray-50 text-gray-400">
              N/A - Run an audit to see exceptions.
            </div>
          ) : (
            <div className="space-y-3">
              {topExceptions.map((ex, idx) => (
                <div key={idx} className="border p-4 rounded-lg shadow-sm bg-white flex justify-between items-center hover:border-blue-400 transition-colors">
                  <div>
                    <h3 className="font-semibold text-lg">{ex.exception.type}</h3>
                    <p className="text-sm text-gray-600 mt-1">Severity: <span className="font-medium text-red-600">{ex.exception.severity}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Priority Score</p>
                    <p className="text-2xl font-bold text-blue-700">{ex.finalPriorityScore}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Column */}
        <div className="space-y-6">
          <div className="border p-5 rounded-lg shadow-sm bg-white">
            <h2 className="text-xl font-bold mb-4">Transaction Compliance Risk</h2>
            {!hasAnalysis || topExceptions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">N/A - No exceptions detected.</p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${Math.min(100, complianceRisk)}%` }}></div>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{complianceRisk}</p>
                <p className="text-sm text-gray-500">Impact Score</p>
              </div>
            )}
          </div>

          <div className="border p-5 rounded-lg shadow-sm bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
              Current Audit Only
            </div>
            <h2 className="text-xl font-bold mb-4">Current Vendor Risk</h2>
            {!hasAnalysis || topExceptions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Vendor Unknown</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vendor Score</p>
                  <p className="text-3xl font-bold text-gray-800">{vendorRisk}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
