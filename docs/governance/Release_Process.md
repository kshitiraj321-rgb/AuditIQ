# AuditIQ Release Process

## 1. Overview
This document defines the official Release Process for the AuditIQ platform. To ensure repository stability, absolute traceability, and alignment with the [AuditIQ Master Project Bible](../knowledge/AuditIQ_Master_Project_Bible.md), no feature, enhancement, or Blueprint milestone is considered complete until it has successfully traversed this entire lifecycle.

## 2. The Release Workflow

Every major change to the AuditIQ platform must strictly follow this exact 12-step sequence:

1. **Audit:** A repository review is performed to ensure the requested capability is supported by existing blueprints and does not conflict with frozen features.
2. **Review:** The proposed architectural changes and acceptance criteria are evaluated.
3. **Approval:** Formal approval is granted before any code modification begins.
4. **Implementation:** Code is written to satisfy the approved business requirement.
5. **Validation:** The implementation is evaluated against the Master Bible, ensuring it preserves validated capabilities and adds capability via extension (Option C Principle).
6. **Regression Testing:** Upstream and downstream pipelines are tested to ensure zero breakage of deterministic business rules.
7. **Commit:** Changes are formally committed to the repository with semantic messages.
8. **Push:** The branch/commit is pushed to the remote repository.
9. **Stable Release Tag:** A version-specific git tag (e.g., `stable-v2-phase-2.6`) is applied to explicitly mark the approved commit.
10. **Documentation Update:** The knowledge layer is updated to reflect the new capabilities and frozen features.
11. **Freeze:** The milestone is officially declared complete and frozen, protecting it under the [Golden Rules](AUDITIQ_GOLDEN_RULE.md).
12. **Next Task:** Only after the freeze is complete may work begin on the subsequent phase.

## 3. Governance Rules
- **No Incomplete Milestones:** A Blueprint milestone is **NOT** considered complete until every stage above is successfully finalized. Code merged without corresponding documentation updates or a stable tag is considered a draft.
- **Repository Evidence First:** Stable tags are the ultimate technical source of truth for a milestone.

*Note: All AI agents executing tasks in this repository must strictly follow this workflow as defined in the [AI Agent Governance Guidelines](AI_AGENT_GUIDELINES.md).*
