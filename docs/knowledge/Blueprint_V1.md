# Blueprint V1

## 1. Objectives
The objective of Blueprint V1 is to establish the fundamental business baseline of the AuditIQ platform. It proves that a deterministic, synchronous analysis loop can successfully execute from raw document upload to final exception results without relying on a backend database. It provides the core foundation upon which all future enhancements (V2, V3, V4) must be built.

## 2. Scope
Blueprint V1 focuses strictly on a single analysis loop.
- **In Scope:** Uploading three distinct procurement documents (Purchase Order, Goods Receipt Note, Vendor Invoice), extracting key data points, matching those data points, detecting exceptions, calculating financial exposure, determining a risk score, generating remediation recommendations, and producing explainability narratives.
- **Out of Scope (V1):** User validation gates, assignment review UIs, database persistence, historical audit retention, actual OCR processing (V1 relies on PDF text extraction or fixtures), and multi-document ingestion beyond the core trio.

## 3. Pipeline
The V1 business workflow executes strictly in the following sequence:
1. **Document Acquisition:** Acceptance of PO, GRN, and Invoice files.
2. **Classification:** Filename and content-based token analysis to identify the document type.
3. **Information Extraction:** Regex-based extraction of vendors, dates, identifiers, quantities, and prices (falling back to deterministic fixtures if parsing fails).
4. **Three-Way Matching:** Comparison of extracted values across the documents.
5. **Exception Detection:** Identification of specific discrepancies.
6. **Financial Exposure:** Calculation of monetary risk per exception.
7. **Risk Assessment:** Derivation of a numerical risk score based on exposure and exceptions.
8. **Prioritization & Recommendations:** Generation of specific remediation actions.
9. **Explainability:** Generation of a human-readable narrative explaining the audit findings.
10. **Results:** Display of the computed analysis snapshot.

## 4. Business Rules
- **Matching Rule:** Exact numeric equality is required for quantities, unit prices, and amounts. Identifiers (PO/GRN numbers) are normalized before comparison.
- **Exception Rules:** The engine explicitly flags Quantity Mismatches, Price Variances, Missing Documents, Duplicate Invoices (via local storage), and Timeline Deviations (e.g., invoice predates PO).
- **Exposure Rule:** Financial exposure is strictly tied to Price Variance and Quantity Mismatch exceptions. Timeline deviations do not currently carry a computed financial exposure.

## 5. Frozen Engines
The following engines have successfully passed validation in Blueprint V1 and are considered frozen:
- Classifier Engine
- Extractor Engine
- Matcher Engine
- Exception Engine
- Financial Exposure Engine
- Risk Engine
- Recommendation Engine
- Explainability Engine
- Timeline Validator Engine

## 6. Deliverables
Blueprint V1 delivered the following validated milestones:
- **Priority 5B:** Baseline application, UI shell, filename classification, PDF extraction.
- **Priority 5D:** Content-based classification verification and confidence scoring.
- **Priority 4C-1:** Date normalization.
- **Priority 4C-3:** Cross-document identifier matching (PO/GRN).
- **Priority 4C-4:** Timeline validation engine.
- **Priority 4C-5:** Duplicate invoice history via local storage.

## 7. Validation
Validation of Blueprint V1 ensures that all engines fire deterministically and sequentially. The baseline validation report confirms 100% client-side browser execution, successful compilation, and zero TypeScript/lint errors.

## 8. Stable Release
The finalized state of Blueprint V1 (and its immediate UX refinements in V1.1 and V1.1.1) is permanently recorded at stable tag:
**`stable-v1.1.1`** (Commit `dc4e41d`).

## 9. Completion Status
**Status:** COMPLETE AND FROZEN.
Blueprint V1 successfully fulfills the MVP requirement of providing a single, deterministic analysis loop from upload to results. Future work must preserve this baseline.
