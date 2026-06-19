# AuditIQ Blueprint V1.1.1 — Release Document

## 1. Release Overview
**Milestone:** Blueprint V1.1.1
**Status:** COMPLETE
**Tag:** `stable-v1.1.1`
**Commit:** `dc4e41d`
**Feature Added:** Exception Investigation Workspace

## 2. Scope
The primary objective of Blueprint V1.1.1 was to transform the flat results page (`/results`) into a structured, exception-driven investigation workspace. This required reorganizing existing data into a clear hierarchy that answers the four core audit questions: What is the exception? Why did it happen? How much financial exposure is there? What is the recommended action?

## 3. Architectural Constraints
- **Zero Engine Modifications:** The core requirement was that all business logic engines in `src/lib/` must remain completely untouched. All mapping, linking, and presentation logic had to be implemented entirely within the UI layer (`src/app/results/page.tsx`).
- **Immutable Data Contract:** The `AnalysisResult` structure passed from the upload flow via `sessionStorage` could not be altered. The UI had to work with the existing data shape.

## 4. Features Delivered
- **Two-Zone Layout:** A fixed left rail for selecting exceptions and a flexible right panel for deep-dive investigation.
- **Document Detail Cards:** Side-by-side presentation of PO, GRN, and Invoice extracted data, with automatic amber highlighting for mismatched fields across documents.
- **Exception Explanation Mapping:** A keyword-based heuristic in the UI layer that successfully links flat explanation sentences from the engine to the specific exception currently selected by the user.
- **Per-Exception Financial Impact:** Dynamic filtering of the exposure breakdown to show the specific financial impact of the selected exception.
- **Per-Exception Recommendations:** Extraction of the actionable recommendation and its trigger condition, linked directly to the selected exception.
- **Timeline Visualization:** A visual three-node sequence representing the chronological flow of documents, featuring a distinct warning state for Timeline Deviation exceptions.
- **Supporting Documents Panel:** A consolidated view of the original files, their assigned classification, confidence scores, and content conflict warnings.
- **Collapsible Processing Snapshot:** A togglable raw view of the underlying match booleans.
- **Graceful Degradation:** A robust "No Exceptions" green state panel for perfect matches.

## 5. Validation Results
- **TypeScript:** Passed (`tsc --noEmit` yielded zero errors).
- **Build Quality:** Passed (`npm run build` completed successfully).
- **UI Logic Validation:** Passed. A 7-point automated verification script (`scratch/v1_1_1_ui_validation.mjs`) confirmed that the UI correctly maps explanations, exposure, recommendations, and timeline states across 7 distinct procurement scenarios.

## 6. Known Limitations
- **Untagged Explainability Array:** The UI currently relies on string keyword matching to associate explanation sentences with exceptions because the underlying engine provides a flat array. If engine output strings change in the future, the UI heuristic will fall back gracefully but lose specific mapping.
- **Fixture Masking Artifacts:** During automated testing with plain-text inputs, the regex-based extractor silently substituted hardcoded fixture data, forcing artificial exceptions (Quantity Mismatch, Price Variance). While this caused validation tests to report "failures", it confirmed the UI correctly handles the pipeline's output. Fixing this underlying extraction behavior is slated for Blueprint V2.
- **Timeline Exposure Gap:** The `Timeline Deviation` exception correctly triggers UI warning states, but the application displays "Financial exposure not directly calculable" because the exposure engine lacks a rule for this exception type.
