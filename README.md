# AuditIQ

AuditIQ is a Next.js application for three-way document analysis across Purchase Orders, Goods Receipt Notes, and Vendor Invoices.

## 1. Project Overview

Finance and audit teams often review procurement documents manually to catch mismatches, exception patterns, and exposure risk. This process is slow, repetitive, and hard to standardize. 

AuditIQ provides a lightweight, automated web-based workflow that accepts these three documents, runs them through a deterministic analysis pipeline, and presents the resulting exceptions, financial exposure, risk scores, recommendations, and explainability narratives in a structured dashboard.

---

## 2. Source of Truth

When determining the factual state of this project, the following hierarchy of authority applies:

1. **AuditIQ Master Bible**
2. **Repository Source Code**
3. **Git History & Stable Releases**
4. **Project Documentation**
5. **Future Planning Documents**

Repository code and Git history strictly override any assumptions, simulated capabilities, or historical chat memory.

---

## 3. Development Baseline

Blueprint V1 Status: Complete
Blueprint V1.1 Status: Complete
Blueprint V1.1.1 Status: Complete

**Current Development Baseline**

```text
Tag:
stable-v1.1.1

Commit:
dc4e41d
```

This baseline contains the following completed priority milestones:
* Priority 5B
* Priority 5D
* Priority 4C-1
* Priority 4C-2
* Priority 4C-3
* Priority 4C-4
* Priority 4C-5

---

## 4. Current Capabilities

The following capabilities are actively implemented and verifiable in the codebase:

- [x] Document Classification (Filename heuristics)
- [x] Content-Based Classification Verification & Confidence Scoring
- [x] PDF Reading (Client-side text extraction via PDF.js)
- [x] Data Extraction (Header-aware line item parsing with fixture fallback)
- [x] Date Normalization (Multi-format parsing)
- [x] Three-Way Matching (Quantity, Unit Price, Amount)
- [x] PO Number & GRN Number Cross-Document Matching
- [x] Exception Detection
- [x] Timeline Validation (Date sequencing)
- [x] Duplicate Invoice Detection (Backed by local storage)
- [x] Financial Exposure Calculation
- [x] Risk Assessment Scoring
- [x] Deterministic Recommendation Engine
- [x] Explainability Engine
- [x] Analysis Snapshot generation
- [x] Dashboard KPI summaries
- [x] Exception Investigation Workspace (Exception-driven results view with per-exception drill-down, document detail cards with mismatch highlighting, financial impact, recommendations, and timeline visualization)

---

## 5. System Architecture

The analysis runs via a deterministic, linear, synchronous pipeline executing entirely in the browser:

```text
Upload Documents
↓
Classification Suggestions
↓
Assignment Review
↓
Validation Gate
↓
Extraction
↓
Matching
↓
Exception Detection
↓
Financial Exposure
↓
Risk Assessment
↓
Recommendation Engine
↓
Explainability
↓
Results
```

*Architectural Note on Unified Upload (V1.1):*
The classifier acts strictly as an advisory system. User confirmation is required at the Assignment Review stage to pass the Validation Gate. The downstream pipeline (Extraction onwards) remains completely unchanged.

---

## 6. Implemented Exception Types

The system actively detects the following procurement exceptions:

*   **Quantity Mismatch:** Ordered vs. Received vs. Invoiced quantities differ.
*   **Price Variance:** Ordered vs. Received vs. Invoiced unit prices differ.
*   **Missing Invoice:** No vendor invoice uploaded.
*   **Missing GRN:** No goods receipt note uploaded.
*   **Duplicate Invoice:** The invoice number for the specified vendor has already been processed (tracked locally).
*   **Timeline Deviation:** Document dates are out of chronological order (e.g., Invoice predates PO). *(Note: Currently logged as an exception but lacks financial exposure rules).*

---

## 7. Stable Releases

| Tag | Description |
| --- | ----------- |
| `stable-priority-5b` | Baseline application, UI shell, filename classification, and fixture-based extraction. |
| `stable-priority-5d` | Added content-based classification verification and confidence scoring. |
| `stable-priority-4c1` | Added robust date normalization support across multiple localized formats. |
| `stable-priority-4c3` | Implemented cross-document identifier matching (PO/GRN numbers). |
| `stable-priority-4c4` | Added the timeline validation engine for date sequencing logic. |
| `stable-priority-4c5` | Implemented duplicate invoice history tracking and validation using `localStorage`. |
| `stable-v1.1` | Unified Document Upload, Assignment Review UI, and Validation Gate integration. |
| `stable-v1.1.1` | Exception Investigation Workspace: exception rail, document detail cards, per-exception drill-down, timeline visualization. |

---

## 8. Technical Architecture

*   **Frontend Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.
*   **State Management:** React local state (`useState`, `useEffect`). No global state management library is used.
*   **Storage Mechanisms:**
    *   **`sessionStorage`:** Temporarily stores the completed `auditIQAnalysis` snapshot passed from Upload to Results/Dashboard.
    *   **`localStorage`:** Maintains a persistent client-side list of `auditiq_audited_invoices` across sessions to power Duplicate Invoice Detection.
*   **Compute Model:** 100% Client-side. PDF parsing uses a public web worker (`pdf.worker.min.mjs`).

---

## 9. Current Limitations

*   **Rule-based classification:** Strongly relies on filenames containing specific strings (`po`, `grn`, `inv`).
*   **Regex-based extraction:** Extraction relies heavily on regex labeling. If text extraction fails or labels differ, it degrades silently to hardcoded mock fixture data.
*   **Browser Persistence:** `sessionStorage` clears on tab close, meaning audit snapshots are volatile.
*   **Local Invoice History:** Duplicate detection relies on `localStorage`, meaning it is isolated to a single browser profile and cannot serve team-wide validation.
*   **No genuine OCR engine:** Unsearchable PDFs or scanned images will yield no text.
*   **No Database Persistence.**
*   **No Authentication.**

---

## 10. Technical Debt

*   **Classification Brittle:** Mock-grade classification means misnamed files will enter the wrong pipeline slots, corrupting downstream matching.
*   **Fixture Masking:** Extractor fallback mechanisms successfully prevent app crashes but mask parsing failures with pristine data.
*   **Orchestration Coupling:** The entire multi-stage pipeline executes inline within `src/app/upload/page.tsx`.
*   **Exception Coverage Gap:** `Timeline Deviation` generates an exception but does not yet influence financial exposure calculations, recommendations, or explainability text.
*   **Missing Tests:** There are no automated test suites enforcing engine determinism.

---

## 11. Future Roadmap

### Blueprint V1
*   **Complete**

### Blueprint V1.1
*   **Complete:** Unified Document Upload, Classification Suggestions, Assignment Review, and Validation Gate.

### Blueprint V1.1.1
*   **Complete:** Exception Investigation Workspace. Results page restructured from a flat text dump into a two-zone exception-driven investigation interface. Zero engine modifications.

### Blueprint V2 (Next Milestone)
*   **Production Extraction Layer:** Replacing regex and fixtures with deterministic document AI.
*   **OCR Integration:** Enabling support for scanned paper documents.
*   **Database Persistence:** Storing audit snapshots to a resilient backend.

### Blueprint V3
*   **Authentication & Roles:** Multi-user secure access.
*   **Audit Repository:** Historical querying of past audits.

### Blueprint V4
*   **ERP Integrations:** Fetching POs directly from systems like SAP or Oracle.
*   **Enterprise Features:** Custom policy engines and rule configuration.

---

## 12. Repository Structure

```text
.
├── AuditIQ_Source_Inventory.md
├── AuditIQ_Technical_Baseline_V1.md
├── README.md
├── docs
│   ├── architecture.md
│   ├── project-overview.md
│   └── screenshots/
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── pdf.worker.min.mjs
│   └── window.svg
├── src
│   ├── app
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── results/page.tsx
│   │   └── upload/page.tsx
│   └── lib
│       ├── classifier.ts
│       ├── exceptionEngine.ts
│       ├── explainability.ts
│       ├── extractor.ts
│       ├── financialExposure.ts
│       ├── matcher.ts
│       ├── pdfTextReader.ts
│       ├── recommendationEngine.ts
│       ├── riskEngine.ts
│       └── timelineValidator.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 13. Documentation Governance

Future changes involving:
*   New business rules
*   New architecture decisions
*   New stable releases
*   New milestones
*   Major scope decisions

**Must be documented and added to project source documents.** Project knowledge should not live only inside chat conversations.

---

## 14. GitHub Repository Usage

Future project reviews, audits, and development work should **verify conclusions against**:
*   Repository source code
*   Git history
*   Stable tags

Do not rely solely on historical chat discussions to determine the current state of the application.

---

## 15. Final Assessment

**Blueprint V1 Completion:** Confirmed Complete. The application successfully fulfills the MVP requirement of providing a single, deterministic analysis loop from upload to results.

**Blueprint V1.1 Completion:** Confirmed Complete. The application successfully implements the Unified Document Upload workflow with user review and validation gates, preserving downstream business logic.

**Blueprint V1.1.1 Completion:** Confirmed Complete. The results page has been restructured into a full Exception Investigation Workspace: exception rail selector, document detail cards with mismatch field highlighting, per-exception explanation, financial impact, recommendation, timeline visualization, and collapsible processing snapshot. Zero engine modifications.

**Current Stable Baseline:** Version `stable-v1.1.1` / commit `dc4e41d` is the current stable release. All milestones through Blueprint V1.1.1 are closed.

**Current Maturity Level:** Prototype / Demonstration Grade. The architecture is sound and well-segregated, but data acquisition (Classification and Extraction) remains heavily heuristic and fixture-backed.

**Highest ROI Future Improvements (Ranked)**

1. Production Extraction Layer
2. OCR Integration
3. Database Persistence
4. Authentication & Audit Repository
