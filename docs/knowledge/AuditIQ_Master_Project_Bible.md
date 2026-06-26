# AuditIQ Master Project Bible

## 1. Project Identity

AuditIQ is an Exception Intelligence Platform for Procurement Auditing. The platform exists to identify, explain, prioritize, and resolve procurement exceptions across multiple document types. While artificial intelligence and modern data acquisition strengthen the audit workflow, they do not replace deterministic business rules. Business correctness always takes precedence over automation.

## 2. Vision & Mission

**Vision:** To eliminate the manual burden of procurement auditing by providing a deterministic, transparent, and instantly verifiable automated matching system.

**Mission:** AuditIQ exists to provide finance and audit teams with an automated Exception Intelligence Platform for Procurement Auditing. The platform processes Purchase Orders, Goods Receipt Notes, and Vendor Invoices, running them through a strict analysis pipeline to surface exceptions, financial exposure, risk scores, and clear remediation guidance.

## 3. What is AuditIQ?

AuditIQ is an Exception Intelligence Platform designed for three-way document analysis. It accepts procurement documents, extracts structured data, and compares quantity, unit price, and total amounts across the document trio. Instead of acting as a black-box AI, AuditIQ relies on deterministic business rules to flag mismatches, calculate financial exposure, and generate explainable narratives that trace every exception back to its root cause.

## 4. Core Principles & Business Philosophy

1. **Determinism over Magic:** The system must produce exactly the right outputs every time, given the same inputs. It relies on strict business rules (matching, exposure, risk, recommendations) rather than probabilistic models for decision-making.
2. **Traceability:** Every finding must be explainable. The interface must clearly highlight mismatches and associate specific sentences in the explainability narrative with explicit exceptions.
3. **Evidence-Based Reality:** The repository source code and validation history strictly override any assumptions, simulated capabilities, or historical chat memory. If it is not proven in the repository, it does not exist.
4. **Preservation Before Innovation:** Validated business capability is more valuable than theoretical redesign. New work should strengthen existing functionality before replacing it.
5. **Business Logic Before User Interface:** AuditIQ is fundamentally a business intelligence platform. The interface exposes business intelligence. The interface must never define business rules.

## 5. Decision Principles

The architectural and business decision framework for AuditIQ relies on the following rules:

1. **Preserve validated behaviour before introducing new functionality.**
2. **Prefer additive architecture over invasive rewrites.**
3. **Keep business logic independent from presentation.**
4. **Maintain deterministic outputs.**
5. **Minimize regression risk.**
6. **Prefer repository evidence over assumptions.**
7. **Freeze stable capabilities after successful validation.**

## 6. Blueprint Philosophy

AuditIQ is built through cumulative, additive layers called Blueprints.

*   **Blueprint V1** establishes the business foundation.
*   **Blueprint V2** strengthens V1.
*   **Blueprint V3** extends V1.
*   **Blueprint V4** scales V1.

**The Golden Rule:** Blueprints are cumulative, not replacement-based. A newer Blueprint must never invalidate the business capability delivered by an approved earlier Blueprint unless explicitly authorized.

Every Blueprint must satisfy BOTH conditions:
1. Preserve existing validated capabilities.
2. Add new capabilities through extension rather than replacement.

## 7. Governance Philosophy

AuditIQ follows a strict governance process to ensure long-term stability and reproducibility.

Governance ensures:
- Evidence-driven development.
- Repository-backed decision making.
- Validation before approval.
- Audit before implementation.
- Preservation of validated behaviour.
- Controlled architectural evolution.
- Freeze after successful validation.

Major architectural changes must be preceded by an audit. Repository evidence takes precedence over speculation.

## 8. Development Governance Lifecycle

The approved AuditIQ development lifecycle ensures stability and traceability:

Audit
↓
Review
↓
Approval
↓
Implementation
↓
Validation
↓
Regression Testing
↓
Commit
↓
Stable Release Tag
↓
Documentation Update
↓
Freeze
↓
Next Task

**A Blueprint milestone is NOT complete until every stage above has been successfully completed.**

## 9. Source of Truth Hierarchy

When resolving conflicts or determining the authoritative state of the project, the following hierarchy applies:

1. AuditIQ Master Project Bible
2. Approved Blueprint Documents
3. Stable Release Tags
4. Repository Source Code
5. Validation Reports
6. Audit Reports
7. Roadmaps
8. User Instructions

Lower-priority sources may never override higher-priority sources.

## 10. Business Scope

AuditIQ executes the following complete business workflow:

Document Acquisition
↓
Classification
↓
Information Extraction
↓
Extraction Confidence
↓
Three-Way Matching
↓
Exception Detection
↓
Financial Exposure
↓
Risk Assessment
↓
Prioritization
↓
Root Cause Analysis
↓
Recommendations
↓
Explainability
↓
Decision Support

## 11. Non-Goals

### Out of Scope by Design
The following capabilities are permanently excluded from the core platform scope:
- Direct ERP integrations (e.g., SAP, Oracle).
- User management, authentication, and role-based access control.
- Automated workflow actions beyond generating recommendations.
- Enterprise deployment orchestration.

### Current Technical Limitations
The following are recognized gaps in the current implementation that may be addressed in future Blueprints:
- Real OCR and file-content parsing are still evolving (currently relying on text layers or fixtures).
- Production document intelligence and true unstructured understanding are still under development.
- Historical persistence and multi-session audit history are not yet implemented.
