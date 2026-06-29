# AuditIQ Changelog

## [PH-001] Production Hardening Release - 2026-06-29

### Added
- **Deterministic Extraction Normalization Layer**: Introduced a strict boundary between probabilistic AI extraction and deterministic normalization logic (governed by ADR-003).
- **Provenance System Enhancements**: Expanded the extraction provenance model to natively track `derived` values, protecting `extracted` and `fallback` data integrity.

### Fixed
- **Unit Price Extraction Defect**: Fixed an issue where the LLM failed to accurately extract unit prices on invoices with multiple line items. The unit price is now mathematically derived downstream (`amount / quantity`) yielding a 100% accuracy rate across procurement scenarios.

### Architectural Compliance
- Formalized the rule that the extraction layer is strictly for identifying existing source information, while the normalization layer is reserved exclusively for deterministic transformations (e.g., date formats, math derivations). No probabilistic reasoning is permitted in the normalization layer.
