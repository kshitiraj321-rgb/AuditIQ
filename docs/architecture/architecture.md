# AuditIQ Architecture

## Current Architecture

AuditIQ is a Next.js App Router application with a small, deterministic client-side analysis pipeline.

The application is intentionally organized around three routes:

- `/` — dashboard summary
- `/upload` — analysis orchestration and snapshot creation
- `/results` — detailed result view

Analysis logic is split into focused modules under `src/lib`. Each module owns one stage of the pipeline and is composed from the upload page.

## Data Flow

1. The user uploads Purchase Order, Goods Receipt Note, and Vendor Invoice files.
2. `src/lib/classifier.ts` classifies each filename into a document type.
3. `src/lib/extractor.ts` returns structured values for the recognized document types.
4. `src/lib/matcher.ts` compares quantity, unit price, and amount across the three documents.
5. `src/lib/exceptionEngine.ts` converts matching results and document presence into exceptions.
6. `src/lib/financialExposure.ts` calculates exposure per exception and totals it.
7. `src/lib/riskEngine.ts` derives the risk score and risk level from exceptions and exposure.
8. `src/lib/recommendationEngine.ts` generates remediation guidance.
9. `src/lib/explainability.ts` builds narrative explanations from the computed analysis.
10. The upload page stores the assembled snapshot in `sessionStorage` under `auditIQAnalysis`.
11. The results page reads that snapshot and renders the analysis.
12. The dashboard reads the latest stored analysis when available and shows summary KPIs.

## Key Engines

### Classification

`src/lib/classifier.ts` is a filename-based classifier used to map uploads to PO, GRN, or Invoice.

### Extraction

`src/lib/extractor.ts` produces structured document values for the known document types.

### Matching

`src/lib/matcher.ts` performs three-way comparison across quantity, unit price, and amount.

### Exception Detection

`src/lib/exceptionEngine.ts` detects quantity mismatch, price variance, missing invoice, missing GRN, and duplicate invoice conditions.

### Financial Exposure

`src/lib/financialExposure.ts` calculates per-exception exposure and total exposure.

### Risk

`src/lib/riskEngine.ts` converts exception count and exposure into a risk score and risk level.

### Recommendations

`src/lib/recommendationEngine.ts` turns detected issues into deterministic remediation guidance.

### Explainability

`src/lib/explainability.ts` formats the computed analysis into human-readable summaries and explanations.

## Storage Approach

AuditIQ currently uses browser `sessionStorage` for snapshot persistence.

- Storage key: `auditIQAnalysis`
- Writer: `src/app/upload/page.tsx`
- Readers: `src/app/results/page.tsx` and `src/app/page.tsx`

Implications of this approach:

- Data is browser-tab scoped and temporary
- Refreshes in the same session can preserve the snapshot
- Closing the session clears the stored analysis
- There is no backend persistence or multi-user history

## Known Technical Debt

- Mock classification is still filename-based
- Mock extraction still returns fixed values
- Duplicate invoice detection is only partially effective because the upload flow does not provide persistent history
- Storage is temporary and not suitable for long-term audit retention
- The app currently depends on deterministic fixtures rather than live document intelligence
- Root metadata still reflects the default Next.js starter text and can be updated later as a polish item

