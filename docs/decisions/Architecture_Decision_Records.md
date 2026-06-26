# Architecture Decision Records (ADRs)

This document serves as the formal log of foundational architectural decisions made during the lifecycle of the AuditIQ platform. These decisions are considered **frozen** and bind all future development.

---

## ADR-001: Blueprint Layering Strategy
**Context:** AuditIQ requires a safe way to introduce complex intelligence capabilities without breaking fundamental document-matching logic.
**Decision:** The application will be developed using additive "Blueprints" (V1, V2, V3, V4). 
**Rationale:** A newer Blueprint must never invalidate the business capability delivered by an approved earlier Blueprint. This protects the business foundation from being rewritten during technology upgrades.
**Evidence:** See [AuditIQ Master Project Bible](../knowledge/AuditIQ_Master_Project_Bible.md) and [Golden Rules](../governance/AUDITIQ_GOLDEN_RULE.md).

## ADR-002: The Freeze Rule
**Context:** Feature scope creep threatens the stability of the platform's deterministic engines.
**Decision:** A component becomes "frozen" once it passes validation and becomes a dependency for future work.
**Rationale:** "Frozen" ensures downstream engines can safely assume the upstream data contract will never arbitrarily change.
**Evidence:** See [Golden Rules](../governance/AUDITIQ_GOLDEN_RULE.md).

## ADR-003: The Option C Principle
**Context:** When resolving defects or adding capabilities, engineers must choose between refactoring or extending.
**Decision:** Whenever multiple solutions exist, the platform mandates "Option C": Prefer the solution that preserves existing contracts, preserves frozen systems, and minimizes repository impact. 
**Rationale:** Preserving validated behaviour is always preferred over theoretical redesigns.
**Evidence:** See [Golden Rules](../governance/AUDITIQ_GOLDEN_RULE.md) (Section: Option C Principle).

## ADR-004: Source of Truth Hierarchy
**Context:** Conflicts frequently arise between what was discussed in planning, what an agent assumes, and what is actually implemented in code.
**Decision:** A strict 8-tier hierarchy of authority is established. The AuditIQ Master Project Bible is the ultimate business authority. Stable Release Tags and Repository Source Code are the ultimate technical authorities.
**Rationale:** This eliminates hallucination or reliance on chat memory.
**Evidence:** See [Source of Truth](../governance/SOURCE_OF_TRUTH.md).

## ADR-005: Client-Side Determinism (V1/V2)
**Context:** AuditIQ needs to prove its business logic before investing in heavy infrastructure.
**Decision:** All V1 and early V2 analysis pipelines execute entirely within the browser client using synchronous, deterministic engines without backend persistence.
**Rationale:** Enforces immediate validation of the business rules without the latency and cost of database management.
**Evidence:** See [Pipeline Architecture](../architecture/Pipeline_Architecture.md) and [Technical Baseline](../architecture/AuditIQ_Technical_Baseline_V1.md).

## ADR-006: Repository-First Development
**Context:** Rapid iterative development by AI agents can lead to unverified assumptions, speculative capabilities, and architectural drift if unconstrained.
**Decision:** All development and governance decisions must adhere to Repository-First Development.
**Rationale:** 
- **Repository Evidence First:** The physical codebase, commits, and tags are the only proof of capability.
- **Audit Before Implementation:** Major architectural changes must be preceded by an evidence-based audit.
- **Repository Overrides Assumptions:** Speculation, historical context, or "assumed intent" is discarded in favor of what is written in code.
- **Validation Before Change:** No architectural component can be modified without proving the change preserves existing validated behaviour.
**Evidence:** See [AuditIQ Master Project Bible](../knowledge/AuditIQ_Master_Project_Bible.md) and [Release Process](../governance/Release_Process.md).
