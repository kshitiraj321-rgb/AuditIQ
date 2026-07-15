# AuditIQ Blueprint V1.1 — Release Document

## 1. Release Overview
**Milestone:** Blueprint V1.1
**Status:** COMPLETE
**Tag:** `stable-v1.1`
**Feature Added:** Unified Document Upload

## 2. Architectural Decisions
The primary architectural mandate for V1.1 was to decouple ingestion from execution.
- **Staging Layer Introduced:** The application now parses multiple files into a temporary `stagedFiles` array in memory.
- **Advisory Classification:** `classifier.ts` is strictly advisory. It generates suggestions to pre-populate UI dropdowns but executes no automatic assignment logic.
- **Validation Gate:** A strict boolean gate prevents downstream execution until three unique documents are manually confirmed by the user in the Assignment Review slots.
- **Downstream Immutability:** The verified file selections are injected back into the exact `{poFile, grnFile, invoiceFile}` variables utilized by V1, guaranteeing that `matcher.ts`, `exceptionEngine.ts`, `financialExposure.ts`, `riskEngine.ts`, `recommendationEngine.ts`, and `explainability.ts` remained completely untouched.

## 3. Validation Results
- **UI & Interaction:** Passed. The dropzone, review screen, dropdowns, and conflict warnings behave as specified.
- **Pipeline Determinism:** Passed. Regression testing confirms that all downstream calculation outputs are identical to V1.
- **Build Quality:** Passed. Next.js static and dynamic optimizations compile without error or linting flags in the modified scope.

## 4. Accepted Limitations
- **Memory Footprint:** The Unified Dropzone stores an arbitrary number of large PDFs in browser memory via React state, pending Blueprint V2 backend optimizations.
- **Fixture Masking:** As inherited from V1, if a user intentionally overrides a dropdown to submit the wrong document type (e.g., GRN instead of Invoice), the deterministic `extractor.ts` fallback will gracefully mask the failure by injecting mock data, avoiding application crashes at the cost of data fidelity. This remains a known technical debt item assigned to Blueprint V2 (Production Extraction Layer).
