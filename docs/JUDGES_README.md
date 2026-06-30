# AuditIQ — Judges README

> **Estimated read time: 60 seconds.**

---

## What Is AuditIQ?

AuditIQ is an AI-powered procurement audit platform. It automates the three-way document matching process that finance and audit teams currently perform manually — and extends that with intelligent exception investigation, financial exposure quantification, and executive risk intelligence.

---

## Problem

Enterprise procurement requires cross-referencing three documents for every transaction:

- **Purchase Order (PO)** — what was ordered
- **Goods Receipt Note (GRN)** — what was received
- **Vendor Invoice** — what is being charged

When these three documents disagree, the organization has financial exposure. Today, finding and investigating those disagreements is a manual, slow, and unscalable process. When an auditor finds a mismatch, they have no tooling to understand why it happened or what to do next.

---

## Solution

Upload three documents. AuditIQ returns a complete audit in seconds:

- Every mismatch is flagged and classified
- Every exception has a root cause, financial exposure amount, and recommended resolution
- An AI assistant guides the investigator through case analysis
- Executive dashboards aggregate risk across vendors and departments

---

## AI Usage

AuditIQ uses AI at two precisely scoped points:

| Point | What AI Does |
|-------|-------------|
| **Extraction** | OpenAI reads raw PDF text and outputs a structured JSON payload (vendor, quantity, unit price, amount, dates, document numbers). Field-level confidence and provenance are tracked. If AI returns incomplete data, the UI transparently labels affected fields as "Fallback". |
| **Investigation Assistant** | Responds to natural language questions about the selected exception, grounded in the actual extracted data and audit context from the current session. |

All matching, exception detection, risk scoring, and explainability logic runs **deterministically** in the application layer — no LLM calls, fully consistent and auditable.

---

## Demo Flow

| Step | What the Judge Sees |
|------|---------------------|
| **1. Upload PDFs** | Drop three procurement documents into the Upload Workspace. AuditIQ auto-classifies each as PO, GRN, or Vendor Invoice. |
| **2. AI Extraction** | AI reads each PDF and extracts structured data. Extraction confidence and provenance (AI vs. fallback) are displayed per field. |
| **3. Three-Way Match** | All extracted values are matched simultaneously across all three documents. |
| **4. Exception Detection** | The engine flags every mismatch: Quantity Mismatch, Price Variance, Missing PO, Missing GRN, Duplicate Invoice, Timeline Deviation. |
| **5. Investigation Workspace** | The auditor selects an exception from the priority rail. They see the root cause, evidence chain, financial impact, and recommended action — all in one panel. |
| **6. AI Assistant** | The auditor asks a natural language question about the exception. The assistant responds with context drawn from the actual extracted data. |
| **7. Dashboard** | The main dashboard shows live KPIs: total exceptions, financial exposure, risk level, and current vendor. |
| **8. Executive Command Center** | Aggregated vendor reliability scores, department exposure, and organization-wide risk trends. |

---

## Business Value

- **Speed**: Audit workflow that takes hours manually completes in seconds
- **Consistency**: Deterministic matching engine — no auditor subjectivity
- **Depth**: Every exception comes with a root cause, not just a flag
- **Scalability**: Blueprint V3 aggregates risk across the entire organization, not just a single audit

---

## Why AuditIQ Is Different

Most audit tools stop at flagging exceptions. AuditIQ answers three deeper questions:

1. **Why** — root cause diagnosis with supporting evidence
2. **How much** — per-exception financial exposure calculated from extracted values
3. **What next** — actionable recommendations tied directly to the exception, not generic guidance

Blueprint V3 adds a fourth: **predictive** — risk trends across vendors and departments before the next exception occurs.

---

## Repository

See [README.md](../README.md) for installation, architecture, and full feature documentation.
