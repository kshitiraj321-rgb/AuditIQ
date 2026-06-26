# AuditIQ Pipeline Architecture

## 1. Overview
The AuditIQ processing pipeline is a deterministic, synchronous sequence executed entirely on the client side. The pipeline accepts raw procurement documents, extracts their data, and passes that data through a linear series of independent business engines to produce a final Exception Intelligence snapshot.

This document separates the currently implemented pipeline from future planned stages. For internal logic of each engine, refer to the [Engine Architecture](Engine_Architecture.md).

## 2. Current Implemented Pipeline

This pipeline operates strictly in the following sequence and is supported by repository evidence.

### Stage 1: Document Acquisition (Upload) - [Frozen]
- **Purpose:** Accept files from the user and stage them for processing.
- **Contract:** Passes raw files to the Classifier.

### Stage 2: Classification - [Partially Implemented]
- **Purpose:** Identify which file acts as the Purchase Order, Goods Receipt Note, and Vendor Invoice.
- **Status:** Partially implemented via advisory filename heuristics. Content-based verification is present but rudimentary.

### Stage 3: Information Extraction - [Partially Implemented]
- **Purpose:** Pull structured data (vendors, amounts, quantities, dates) out of the assigned documents.
- **Status:** Partially implemented via regex. Falls back to deterministic fixtures if parsing fails.

### Stage 4: Extraction Confidence - [Frozen]
- **Purpose:** Assign a confidence score to the extraction based on parsing success.

### Stage 5: Three-Way Matching - [Frozen]
- **Purpose:** Compare the extracted variables across the three documents to identify mathematical or string discrepancies.
- **Contract:** Does not assign business meaning, only true/false equivalencies.

### Stage 6: Exception Detection - [Frozen]
- **Purpose:** Apply business rules to the match results and document availability to flag formal exceptions (e.g., Quantity Mismatch).

### Stage 7: Financial Exposure - [Frozen]
- **Purpose:** Calculate the monetary risk associated with specific exceptions (like Price Variances).

### Stage 8: Risk Assessment - [Frozen]
- **Purpose:** Combine the number of exceptions and total exposure to assign a formal Risk Score and Risk Level.

### Stage 9: Prioritization - [Frozen]
- **Purpose:** Rank the detected exceptions by urgency based on exposure, severity, compliance impact, vendor criticality, and transaction value (added in Section 12.6).

### Stage 10: Root Cause Analysis - [Frozen]
- **Purpose:** Determine the fundamental trigger for an exception and associate it with the prioritized results.

### Stage 11: Recommendations - [Frozen]
- **Purpose:** Generate human-readable actionable next steps based on the computed pipeline state.

### Stage 12: Explainability - [Frozen]
- **Purpose:** Generate a human-readable narrative explaining the audit findings.

### Stage 13: Decision Support (Dashboard/Results) - [Partially Implemented]
- **Purpose:** Persist the final pipeline snapshot and render it into the Exception Investigation Workspace.
- **Status:** Session-storage only. True dashboard orchestration (Blueprint V2 Section 13) is pending.

## 3. Future Planned Pipeline

The following stages are explicitly planned in the roadmap but are not yet implemented in the frozen repository code:

### True NLP Classification - [Planned]
- **Purpose:** Replace filename heuristics with fully semantic content-based classification before extraction.

### Production Extraction Layer (OCR) - [Planned]
- **Purpose:** Replace text-layer regex and fixtures with deterministic document AI to handle scanned paper documents.

### Backend Persistence - [Planned]
- **Purpose:** Save the completed pipeline snapshot to a resilient database to enable historical auditing and multi-session workflows.
