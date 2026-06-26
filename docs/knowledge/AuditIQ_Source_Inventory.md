# AuditIQ Source Inventory

This document inventories the current implementation as it exists in the codebase.

## Scope Coverage
- `src/app`
- `src/lib`
- `src/components` — not present
- `src/types` — not present

## `src/app/page.tsx`
- **Purpose:** Dashboard landing page for the app root route.
- **Exported Functions / Components:** `Home` default export.
- **Current Implementation Summary:** Renders a static dashboard shell with four KPI cards and links to the Upload and Results pages.
- **Inputs:** None at runtime; all dashboard values are hardcoded.
- **Outputs:** Next.js page JSX for `/`.
- **Dependencies:** `next/link`.
- **Consumed By:** Next.js App Router route `/`.
- **Current Status:** Partial
- **Known Technical Debt:** KPI values are static and not derived from analysis data.
- **Notes:** Server Component by default because it does not use `"use client"`.

## `src/app/layout.tsx`
- **Purpose:** Root application layout and document shell.
- **Exported Functions / Components:** `RootLayout` default export; `metadata`.
- **Current Implementation Summary:** Wraps all pages in the HTML/body shell, applies Geist fonts, and imports global styles.
- **Inputs:** `children` React nodes from the App Router.
- **Outputs:** Root HTML document structure and metadata.
- **Dependencies:** `next/font/google`, `./globals.css`.
- **Consumed By:** All App Router pages.
- **Current Status:** Complete
- **Known Technical Debt:** None identified in the layout itself.
- **Notes:** Server Component by default.

## `src/app/globals.css`
- **Purpose:** Global styling entrypoint and Tailwind CSS v4 source file.
- **Exported Functions / Components:** None.
- **Current Implementation Summary:** Imports Tailwind CSS, declares source scanning, defines light/dark color variables, maps theme tokens, and sets global body styles.
- **Inputs:** Tailwind CSS processor and imported variables from the root layout font setup.
- **Outputs:** Global CSS applied across the app.
- **Dependencies:** Tailwind CSS v4, App Router root layout import.
- **Consumed By:** `src/app/layout.tsx`.
- **Current Status:** Complete
- **Known Technical Debt:** None identified in the stylesheet itself.
- **Notes:** Contains the `@source` directive for Tailwind scanning.

## `src/app/favicon.ico`
- **Purpose:** Browser/app favicon asset.
- **Exported Functions / Components:** None.
- **Current Implementation Summary:** Static icon asset used by the app shell.
- **Inputs:** None.
- **Outputs:** Favicon rendered in the browser tab and app metadata.
- **Dependencies:** Next.js asset handling.
- **Consumed By:** Browser and Next.js app shell.
- **Current Status:** Complete
- **Known Technical Debt:** None identified.
- **Notes:** Binary asset, not source code.

## `src/app/upload/page.tsx`
- **Purpose:** Upload page and pipeline orchestrator.
- **Exported Functions / Components:** `UploadPage` default export.
- **Current Implementation Summary:** Lets the user upload PO, GRN, and Invoice files, validates that all three exist, classifies filenames, extracts mock data, runs matching, exception detection, financial exposure, risk assessment, recommendations, and explainability, then stores the assembled analysis in session storage and navigates to Results.
- **Inputs:** Three file inputs, Analyze button click, client-side React state, `sessionStorage`.
- **Outputs:** Writes `auditIQAnalysis` to sessionStorage and routes to `/results`.
- **Dependencies:** `src/lib/classifier.ts`, `src/lib/extractor.ts`, `src/lib/matcher.ts`, `src/lib/exceptionEngine.ts`, `src/lib/financialExposure.ts`, `src/lib/riskEngine.ts`, `src/lib/recommendationEngine.ts`, `src/lib/explainability.ts`, `next/navigation`, `react`.
- **Consumed By:** Users visiting `/upload`; downstream Results page reads the stored analysis.
- **Current Status:** Partial
- **Known Technical Debt:** Uses mock classification/extraction inputs, sessionStorage transport, and no persistent duplicate-invoice history source.
- **Notes:** Client Component because it uses `"use client"` and `useRouter()`.

## `src/app/results/page.tsx`
- **Purpose:** Results display page for the stored analysis snapshot.
- **Exported Functions / Components:** `ResultsPage` default export.
- **Current Implementation Summary:** Reads the stored analysis from sessionStorage, falls back to a built-in sample analysis if nothing valid exists, and renders snapshot cards for counts, matching, exposure, explainability, exceptions, and recommendations.
- **Inputs:** `sessionStorage` key `auditIQAnalysis`, fallback sample analysis.
- **Outputs:** Results page JSX for `/results`.
- **Dependencies:** `next/link`, `react`, `src/lib/matcher.ts`, `src/lib/financialExposure.ts`, `src/lib/riskEngine.ts`, `src/lib/explainability.ts`.
- **Consumed By:** Users visiting `/results`; receives data written by the Upload page.
- **Current Status:** Partial
- **Known Technical Debt:** Uses fallback sample data and sessionStorage rather than a durable analysis store.
- **Notes:** Client Component because it uses `"use client"` and `useEffect()`.

## `src/lib/classifier.ts`
- **Purpose:** Filename-based document classification helper.
- **Exported Functions / Components:** `classifyDocument(fileName: string)`.
- **Current Implementation Summary:** Classifies uploads by checking whether the filename contains `po`, `grn`, `inv`, or `invoice`.
- **Inputs:** File name string.
- **Outputs:** `"Purchase Order"`, `"Goods Receipt Note"`, `"Vendor Invoice"`, or `"Unknown"`.
- **Dependencies:** None.
- **Consumed By:** `src/app/upload/page.tsx`.
- **Current Status:** Mock
- **Known Technical Debt:** Relies on filename heuristics instead of actual document analysis.
- **Notes:** Deterministic and synchronous.

## `src/lib/extractor.ts`
- **Purpose:** Mock document data extraction helper.
- **Exported Functions / Components:** `extractDocumentData(documentType: string)`.
- **Current Implementation Summary:** Returns fixed structured data for PO, GRN, and Invoice document types.
- **Inputs:** Classified document type string.
- **Outputs:** Structured object with `vendor`, `documentNumber`, `date`, `quantity`, `unitPrice`, and `amount`, or `null` for unknown types.
- **Dependencies:** None.
- **Consumed By:** `src/app/upload/page.tsx`.
- **Current Status:** Mock
- **Known Technical Debt:** Does not read file contents or parse PDFs; all returned values are hardcoded.
- **Notes:** The mock values drive downstream matching, exposure, and explainability.

## `src/lib/matcher.ts`
- **Purpose:** Three-way matching engine.
- **Exported Functions / Components:** `matchDocuments(...)`; `MatchDocumentsResult` type.
- **Current Implementation Summary:** Compares PO, GRN, and Invoice values for quantity, unit price, and amount, and returns per-field match status plus each source value.
- **Inputs:** `{ purchaseOrder, goodsReceiptNote, vendorInvoice }` document objects or `null`.
- **Outputs:** `MatchDocumentsResult` with `quantityMatch`, `priceMatch`, and `amountMatch`.
- **Dependencies:** None.
- **Consumed By:** `src/app/upload/page.tsx`, `src/lib/exceptionEngine.ts`, `src/lib/explainability.ts`, `src/app/results/page.tsx` (type usage).
- **Current Status:** Complete
- **Known Technical Debt:** Matching only covers the three numeric fields currently extracted by the mock extractor.
- **Notes:** Comparison is strict equality across all three documents.

## `src/lib/exceptionEngine.ts`
- **Purpose:** Exception detection engine for Blueprint V1 exception types.
- **Exported Functions / Components:** `detectExceptions(...)`; `DetectedException` type; `DetectExceptionsInput` type.
- **Current Implementation Summary:** Flags quantity mismatch, price variance, missing invoice, missing GRN, and duplicate invoice based on matching results, presence/absence of documents, and caller-supplied historical invoice numbers.
- **Inputs:** PO, GRN, Invoice document objects, match result, optional `existingInvoiceNumbers`.
- **Outputs:** Array of detected exceptions with `type` and `severity`.
- **Dependencies:** `src/lib/matcher.ts` type.
- **Consumed By:** `src/app/upload/page.tsx`, `src/lib/financialExposure.ts`, `src/lib/explainability.ts`.
- **Current Status:** Partial
- **Known Technical Debt:** Duplicate invoice detection depends on an external history list, and the current upload flow passes an empty array.
- **Notes:** Severity is currently fixed to `"High"` for all exception types.

## `src/lib/financialExposure.ts`
- **Purpose:** Financial exposure calculation engine.
- **Exported Functions / Components:** `calculateFinancialExposure(...)`; `FinancialExposureResult` type.
- **Current Implementation Summary:** Computes exposure per exception using transparent rules and returns a total plus per-exception breakdown.
- **Inputs:** PO, GRN, Invoice amount fields and the detected exceptions array.
- **Outputs:** `{ totalExposure, breakdown }`.
- **Dependencies:** `src/lib/exceptionEngine.ts` type.
- **Consumed By:** `src/app/upload/page.tsx`, `src/app/results/page.tsx`, `src/lib/riskEngine.ts`, `src/lib/explainability.ts`.
- **Current Status:** Complete
- **Known Technical Debt:** None identified in the calculation logic.
- **Notes:** Uses absolute differences for mismatch and variance cases.

## `src/lib/riskEngine.ts`
- **Purpose:** Risk scoring engine.
- **Exported Functions / Components:** `assessRisk(...)`; `RiskAssessmentResult` type.
- **Current Implementation Summary:** Calculates a score from exception count and exposure thresholds, then maps the score to a risk level.
- **Inputs:** Detected exceptions and financial exposure result.
- **Outputs:** `{ score, level }`.
- **Dependencies:** `src/lib/exceptionEngine.ts`, `src/lib/financialExposure.ts`.
- **Consumed By:** `src/app/upload/page.tsx`, `src/app/results/page.tsx`, `src/lib/recommendationEngine.ts`, `src/lib/explainability.ts`.
- **Current Status:** Complete
- **Known Technical Debt:** None identified in the current scoring rules.
- **Notes:** Score is capped at 100.

## `src/lib/recommendationEngine.ts`
- **Purpose:** Recommendation generation engine.
- **Exported Functions / Components:** `generateRecommendations(...)`; `RecommendationInput` type.
- **Current Implementation Summary:** Produces deterministic remediation guidance from the detected exceptions, risk level, and exposure amount.
- **Inputs:** Exceptions array, risk result, financial exposure result.
- **Outputs:** Array of recommendation strings.
- **Dependencies:** `src/lib/exceptionEngine.ts`, `src/lib/riskEngine.ts`, `src/lib/financialExposure.ts`.
- **Consumed By:** `src/app/upload/page.tsx`, `src/lib/explainability.ts`, `src/app/results/page.tsx` (display only).
- **Current Status:** Complete
- **Known Technical Debt:** Recommendation logic is rule-based and does not incorporate additional business context.
- **Notes:** Deduplicates repeated recommendations.

## `src/lib/explainability.ts`
- **Purpose:** Rule-based explainability layer.
- **Exported Functions / Components:** `generateExplainability(...)`; `ExplainabilityInput` type; `ExplainabilityResult` type.
- **Current Implementation Summary:** Produces a summary plus human-readable explanations for each detected exception, the financial exposure, the risk assessment, and each recommendation.
- **Inputs:** Match result, exceptions, financial exposure, risk, recommendations, and extracted documents.
- **Outputs:** `{ summary, explanations }`.
- **Dependencies:** `src/lib/exceptionEngine.ts`, `src/lib/financialExposure.ts`, `src/lib/matcher.ts`, `src/lib/riskEngine.ts`.
- **Consumed By:** `src/app/upload/page.tsx`, `src/app/results/page.tsx` (type usage).
- **Current Status:** Complete
- **Known Technical Debt:** Explanations are deterministic templates rather than data-rich narrative analysis.
- **Notes:** No AI or external service calls are used.

## `src/components`
- **Status:** Not present
- **Notes:** No files currently exist under `src/components`.

## `src/types`
- **Status:** Not present
- **Notes:** No files currently exist under `src/types`.

# Application Data Flow

Actual implemented flow from the code:

Upload (`src/app/upload/page.tsx`)
↓
Classification (`src/lib/classifier.ts`, called from `src/app/upload/page.tsx`)
↓
Extraction (`src/lib/extractor.ts`, called from `src/app/upload/page.tsx`)
↓
Matching (`src/lib/matcher.ts`, called from `src/app/upload/page.tsx`)
↓
Exception Detection (`src/lib/exceptionEngine.ts`, called from `src/app/upload/page.tsx`)
↓
Financial Exposure (`src/lib/financialExposure.ts`, called from `src/app/upload/page.tsx`)
↓
Risk Assessment (`src/lib/riskEngine.ts`, called from `src/app/upload/page.tsx`)
↓
Recommendation Engine (`src/lib/recommendationEngine.ts`, called from `src/app/upload/page.tsx`)
↓
Explainability (`src/lib/explainability.ts`, called from `src/app/upload/page.tsx`)
↓
Results (`src/app/results/page.tsx`)

Implementation notes:
- `src/app/upload/page.tsx` orchestrates the full pipeline.
- `src/app/upload/page.tsx` writes the assembled analysis to session storage.
- `src/app/results/page.tsx` reads the stored analysis and renders it.
- `src/app/results/page.tsx` also contains a fallback analysis object used when storage is empty or invalid.

# SessionStorage Inventory

| Key name | Writer file | Reader file | Stored object shape |
|---|---|---|---|
| `auditIQAnalysis` | `src/app/upload/page.tsx` | `src/app/results/page.tsx` | `AnalysisResult` with `files`, `classifications`, `extractedData`, `matchResult`, `exceptions`, `financialExposure`, `risk`, `recommendations`, `explainability` |

Stored object shape details:
- `files`: `{ purchaseOrder, goodsReceiptNote, vendorInvoice }`
- `classifications`: `{ purchaseOrder, goodsReceiptNote, vendorInvoice }`
- `extractedData`: `{ purchaseOrder, goodsReceiptNote, vendorInvoice }`
- `matchResult`: `{ quantityMatch, priceMatch, amountMatch }`
- `exceptions`: array of `{ type, severity }`
- `financialExposure`: `{ totalExposure, breakdown }`
- `risk`: `{ score, level }`
- `recommendations`: `string[]`
- `explainability`: `{ summary, explanations }`

# Dashboard Inventory

## `src/app/page.tsx`
- **Component Type:** Server Component
- **Current KPI Source:** Hardcoded literals in the JSX
- **Hardcoded Values:**
  - Total Documents: `150`
  - Exceptions Found: `12`
  - Financial Exposure: `₹2,50,000`
  - Critical Risks: `3`
- **Dependencies:** `next/link`

