# Deferred Engineering Register

This register documents known architectural, implementation, and traceability debt that has been explicitly deferred for future resolution by the Architecture Review Board.

## 1. Certification Tooling Traceability
- **Date Deferred:** 2026-07-13
- **Description:** Reporting and validation tooling scripts (e.g., `tooling/reporting/create_readiness_report.mjs`, `tooling/reporting/extract_accuracy_report.mjs`, `tooling/reporting/validate_production_extractor.mjs`) lack formal traceability to Blueprint requirements or ADRs.
- **Root Cause:** Ad-hoc scripts were created to facilitate certification but were never codified into the system architecture baseline.
- **Risk Acceptance:** Low risk. Validation is functional, but traceability governance is incomplete.
- **Future Resolution:** Draft formal Architecture Decision Records (ADRs) for certification tooling and incorporate them into the V5 implementation plan.
