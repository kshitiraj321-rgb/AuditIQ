# AuditIQ Roadmap

This document outlines the development trajectory of the AuditIQ Exception Intelligence Platform across its fundamental Blueprints. 

The roadmap strictly adheres to the principle that future Blueprints build upon and strengthen earlier [Blueprints](../knowledge/Blueprint_V1.md), rather than replacing them.

## 1. Completed
These milestones are fully validated, tagged, frozen, and supported by repository evidence.

**Blueprint V1: Foundation**
- Baseline UI Shell
- Advisory Classification (Filename heuristics)
- PDF Text Extraction & Fixture fallback
- Date Normalization Engine
- Three-Way Matching Engine
- Core Exception Engine
- Financial Exposure & Risk Engines
- Deterministic Recommendation & Explainability Engines
- Timeline Validation
- LocalStorage-based Duplicate Invoice Detection

**Blueprint V2: Intelligence & Strengthening (Early Phases)**
- Phase 2.1: Foundation enhancements.
- Phase 2.2: Engine scaling.
- Phase 2.5: Investigation Workspace Compliance Remediation.
- Phase 2.6: Exception Prioritization Engine (Section 12.6).
- Phase 2.7: Enhanced Dashboard (Section 12.7).

## 2. In Progress
These milestones are currently under active development or awaiting final freeze validation.

- *(Currently, no active phases are designated as In Progress. All recent work has been successfully frozen.)*

## 3. Future Approved
These deliverables are explicitly approved for future development by the [AuditIQ Master Project Bible](../knowledge/AuditIQ_Master_Project_Bible.md) and repository evidence, but development has not yet begun.

**Blueprint V2 (Remaining Scope)**
- **Production Extraction Layer:** Replacing regex and fixtures with deterministic document AI parsing (Section 14).
- **OCR Integration:** Enabling support for scanned paper documents.
- **Database Persistence:** Storing audit snapshots to a resilient backend to enable multi-session state.
- **Dashboard Orchestration:** Real-time KPI orchestration and reporting (Section 13).

**Blueprint V3: Extension**
- Officially approved to extend the V1/V2 baseline into multi-user and historical querying capabilities (Authentication, Roles, Audit Repository).

**Blueprint V4: Scale**
- Officially approved to scale the platform into enterprise environments (ERP Integrations, Enterprise Policy configurations).
