# AuditIQ Engine Architecture

## 1. Overview
The AuditIQ platform delegates all business logic to dedicated engines. Each engine owns a specific responsibility within the [Pipeline Architecture](Pipeline_Architecture.md), avoiding tight coupling. This document details the architectural contract for each engine, including the Blueprint where they were introduced and their true repository-backed frozen status.

## 2. Engine Catalog

### 2.1 Classifier Engine
- **Purpose:** Identifies the type of procurement document uploaded based on filename heuristics and rudimentary content signals.
- **Inputs:** Filename strings, optional extracted text.
- **Outputs:** Document type (PO, GRN, INV) and initial classification confidence.
- **Dependencies:** None.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.2 Extractor Engine
- **Purpose:** Pulls structured data points from raw text, heavily relying on regex and fixtures.
- **Inputs:** Raw document text, Document Type.
- **Outputs:** `ExtractedDocumentData`.
- **Dependencies:** Classifier Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.3 Extraction Confidence Engine
- **Purpose:** Evaluates the reliability of the extracted data.
- **Inputs:** `ExtractedDocumentData`, parsing success flags.
- **Outputs:** Numeric confidence score (0-100).
- **Dependencies:** Extractor Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.4 Matcher Engine
- **Purpose:** Performs deterministic three-way mathematical and string comparisons across data points.
- **Inputs:** Three `ExtractedDocumentData` objects.
- **Outputs:** `MatchResults`.
- **Dependencies:** Extractor Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.5 Exception Engine
- **Purpose:** Evaluates matching results to declare formal business exceptions (e.g., Quantity Mismatch).
- **Inputs:** `MatchResults`, Document Availability.
- **Outputs:** Array of `Exception` objects.
- **Dependencies:** Matcher Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.6 Timeline Validator Engine
- **Purpose:** Checks the chronological sequencing of the document trio.
- **Inputs:** Extracted Document Dates.
- **Outputs:** Timeline Deviation Exceptions.
- **Dependencies:** Extractor Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.7 Financial Exposure Engine
- **Purpose:** Calculates the exact monetary risk associated with the detected exceptions.
- **Inputs:** Array of `Exception` objects.
- **Outputs:** Total exposure amount (numeric).
- **Dependencies:** Exception Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.8 Risk Engine
- **Purpose:** Derives a formal risk severity rating.
- **Inputs:** Total Financial Exposure, Total Exception Count.
- **Outputs:** Risk Score (0-100) and Risk Level (Low/Medium/High).
- **Dependencies:** Exception Engine, Financial Exposure Engine.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).

### 2.9 Prioritization Engine
- **Purpose:** Ranks exceptions to guide auditor attention deterministically. Expanded significantly in Section 12.6.
- **Inputs:** Array of `Exception` objects, Financial Exposure, Risk Severity, Compliance Impact, Vendor Criticality, and Transaction Value.
- **Outputs:** Prioritized Exception Array.
- **Dependencies:** Exception Engine, Risk Engine, Financial Exposure Engine.
- **Originating Blueprint:** V2 (Section 12.6).
- **Frozen Status:** Frozen (V2).

### 2.10 Root Cause Engine
- **Purpose:** Determines the fundamental trigger for a given exception to assist in compliance remediation.
- **Inputs:** Prioritized Exception Array, `MatchResults`.
- **Outputs:** Associated root cause flags attached to Exceptions.
- **Dependencies:** Exception Engine, Prioritization Engine.
- **Originating Blueprint:** V2 (Phase 2.5).
- **Frozen Status:** Frozen (V2).

### 2.11 Recommendation Engine
- **Purpose:** Translates exceptions and root causes into actionable remediation guidance.
- **Inputs:** Prioritized Exception Array, Root Causes.
- **Outputs:** Array of recommendation strings.
- **Dependencies:** Exception Engine, Root Cause Engine.
- **Originating Blueprint:** V1 (Updated in V2).
- **Frozen Status:** Frozen (V2).

### 2.12 Explainability Engine
- **Purpose:** Generates human-readable narratives explaining the audit findings.
- **Inputs:** Complete pipeline state (Matches, Exceptions, Exposure, Risk, Prioritization).
- **Outputs:** Narrative text array.
- **Dependencies:** All upstream engines.
- **Originating Blueprint:** V1.
- **Frozen Status:** Frozen (V1).
