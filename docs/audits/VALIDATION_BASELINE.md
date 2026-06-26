# AuditIQ Blueprint V2 — Task 2.4.5
# Validation Baseline Declaration

**Framework Version:** 2.4.5  
**Governance Authority:** AUDITIQ_GOLDEN_RULE.md  
**Approved Audit:** task_2_4_5_validation_framework_audit.md  
**Date Established:** 2026-06-22  

---

## Baseline Field Accuracy

The established baseline for regression detection is taken from the prior validated
production extractor run:

| Metric | Value | Source |
|---|---|---|
| **Baseline Accuracy** | **100%** | `production_extractor_accuracy_report.json` |
| Baseline Timestamp | 2026-06-16T23:17:43.093Z | `production_extractor_accuracy_report.json` |
| Fields Tested | 60 (4 fields × 15 documents) | `production_extractor_accuracy_report.json` |
| Extractor Source | `extractDocumentData()` — `src/lib/extractor.ts` | `production_extractor_accuracy_report.json` |

> **Note:** The prior baseline covered 4 fields (Document Number, Vendor Name, Date,
> Total Amount). Task 2.4.5 expands coverage to all 12 fields in `ExtractedDocumentData`.
> The first full 12-field run establishes the expanded baseline.

---

## Regression Threshold

```
REGRESSION_THRESHOLD = 2%
```

A validation run is flagged as a **regression** if:

```
currentFieldAccuracy < (baselineFieldAccuracy - 2%)
```

Example: If baseline is 100%, any run below **98%** triggers a regression finding.

---

## Verdict Thresholds

| Verdict | Condition |
|---|---|
| **PASS** | Overall Reliability Score ≥ 90% AND False Negatives = 0 |
| **WARN** | Overall Reliability Score ≥ 75% AND False Negatives = 0 |
| **FAIL** | Overall Reliability Score < 75% OR False Negatives > 0 |

### Critical Rule — False Negative Override

> A **false negative** (a required exception that was NOT detected) **automatically
> produces a FAIL verdict** regardless of the overall reliability score.

This rule is mandatory and non-negotiable. A missed fraud or compliance signal is a
production risk that cannot be masked by otherwise high aggregate metrics.

---

## Ground Truth Dataset

| Property | Value |
|---|---|
| **File** | `test-data/procurement_dataset.json` |
| **Documents** | 14 records (14 testable documents; 15 PDFs including duplicate copy) |
| **Scenarios** | 5 (Perfect Match, Quantity Mismatch, Price Variance, Missing GRN, Duplicate Invoice) |
| **PDFs** | 15 files in `test-data/` |

---

## Test Methodology

The framework uses **Synthetic Ground Truth Mode**:

1. For each of the 15 test PDFs, the ground truth `procurement_dataset.json` record
   is loaded as the authoritative reference.
2. `AIExtractionFields` (aiData) is constructed directly from the ground truth record,
   simulating ideal AI extraction.
3. `extractDocumentData(docType, "", aiData)` is called with this synthetic aiData.
4. The output is compared field-by-field against the ground truth.

**Why this approach:**
- Deterministic: same result every run, no API cost, no randomness.
- Tests the extractor's normalization pipeline, provenance tracking, and fixture
  safety layer — exactly the components under V2 validation scope.
- Regression-safe: any corruption of the normalization or provenance logic will
  produce a measurable accuracy drop.

**Live AI Mode (optional):** For full end-to-end extraction quality measurement
(including OpenAI response quality), call the `/api/extract` route with PDF text
and capture actual AI-extracted values as aiData. This mode requires the Next.js
server to be running and incurs API costs.

---

## String Comparison Rules

The following normalization rules are applied to string field comparisons:

| Rule | Rationale |
|---|---|
| Trim whitespace | Document formatting artifacts |
| Case-insensitive | PDF text extraction may alter case |
| Exact match preferred | Recorded separately in report |
| Substring fuzzy match accepted | Handles known trailing period variance (e.g., "Pvt. Ltd." vs "Pvt. Ltd") |

**Observed pattern:** Vendor names extracted by the system may omit a trailing period
in abbreviations (e.g., "Pvt. Ltd" vs "Pvt. Ltd."). This is an accepted normalization
artifact and is recorded as "fuzzy" (not "exact") in the report.

---

## Numeric Comparison Rules

```
tolerance = max(1, abs(expected) × 0.0001)
match     = abs(extracted - expected) ≤ tolerance
```

This accommodates floating-point rounding differences in currency totals.

---

## Frozen Components Confirmation

The following files are frozen and must not be modified by Task 2.4.5 or any
subsequent validation runs:

| File | Freeze Status |
|---|---|
| `src/lib/extractor.ts` | 🔒 FROZEN — subject of measurement |
| `src/lib/matcher.ts` | 🔒 FROZEN |
| `src/lib/exceptionEngine.ts` | 🔒 FROZEN |
| `src/lib/riskEngine.ts` | 🔒 FROZEN |
| `src/lib/financialExposure.ts` | 🔒 FROZEN |
| `src/lib/recommendationEngine.ts` | 🔒 FROZEN |
| `src/lib/explainability.ts` | 🔒 FROZEN |
| `src/lib/classifier.ts` | 🔒 FROZEN |
| `src/lib/extractionConfidence.ts` | 🔒 FROZEN (V2 Task 2.4.4A) |
| `src/lib/timelineValidator.ts` | 🔒 FROZEN |
| `src/app/api/extract/route.ts` | 🔒 FROZEN |

---

## Overall Reliability Score Formula

```
OverallReliabilityScore =
  (fieldAccuracy          × 0.35)
  + (documentAccuracy     × 0.20)
  + (scenarioAccuracy     × 0.25)
  + (pipelineReliability  × 0.20)
```

**Weight rationale:**
- Field Accuracy (35%): Core measurement — whether individual fields are extracted correctly
- Scenario Accuracy (25%): Business-critical — whether the right exceptions are detected
- Document Accuracy (20%): Document-level health across doc types
- Pipeline Reliability (20%): End-to-end correctness from extraction through risk assessment

---

## How to Run

```bash
node --experimental-vm-modules --import tsx/esm validation/extraction_validation_framework.mjs
```

Or if using the tsx package:

```bash
npx tsx validation/extraction_validation_framework.mjs
```

The framework generates a timestamped report:

```
validation/validation_report_[ISO-timestamp].json
```

---

## Scenario Coverage

| Scenario | PDFs | Expected Exception | Validation Method |
|---|---|---|---|
| Perfect Match | 3 | None | Assert exceptions array is empty |
| Quantity Mismatch | 3 | Quantity Mismatch | Assert `detectExceptions` returns "Quantity Mismatch" |
| Price Variance | 3 | Price Variance | Assert `detectExceptions` returns "Price Variance" |
| Missing GRN | 2 | Missing GRN | goodsReceiptNote=null; assert "Missing GRN" detected |
| Duplicate Invoice | 4 | Duplicate Invoice | Seed existing invoices registry; assert "Duplicate Invoice" detected |

**Coverage: 100% of Blueprint V1 exception types**

---

*AuditIQ Blueprint V2 — Task 2.4.5*  
*Governance: AUDITIQ_GOLDEN_RULE.md*  
*All frozen components confirmed untouched.*
