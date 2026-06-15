"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
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

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-5xl font-bold mb-2">
        AuditIQ
      </h1>

      <p className="text-xl mb-8">
        AI-Powered Exception Intelligence Platform
      </p>

      {!hasAnalysis && (
        <div className="border p-4 rounded mb-8">
          <p className="font-semibold">No analysis found yet.</p>
          <p className="mt-1">
            Upload documents to populate the dashboard with the latest analysis.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold">
            Documents Analyzed
          </h2>
          <p className="text-3xl">{documentCount}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold">
            Exceptions Found
          </h2>
          <p className="text-3xl">{analysis.exceptions.length}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold">
            Financial Exposure
          </h2>
          <p className="text-3xl">
            {formatCurrency(analysis.financialExposure.totalExposure)}
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold">
            Risk Score
          </h2>
          <p className="text-3xl">{analysis.risk.score}</p>
          <p className="mt-2">Level: {analysis.risk.level}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/upload"
          className="px-4 py-2 border rounded"
        >
          Upload Documents
        </Link>

        <Link
          href="/results"
          className="px-4 py-2 border rounded"
        >
          View Results
        </Link>
      </div>
    </main>
  );
}
