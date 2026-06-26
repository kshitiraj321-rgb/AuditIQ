# AI Agent Governance Guidelines

## 1. Purpose
The AuditIQ repository is maintained and extended collaboratively by human engineers and autonomous AI agents. To ensure the deterministic business logic, rigid architecture, and historical stability of the platform are never compromised, all AI agents operating within this repository must strictly adhere to the governance rules defined in this handbook.

## 2. Core Principles
- **Repository First:** The physical codebase, tags, and documentation within the repository supersede any historical memory or external assumptions.
- **Evidence Before Assumption:** Every architectural decision, code change, or documentation update must be backed by explicit repository evidence.
- **Audit Before Implementation:** Before modifying any component, an agent must audit the existing baseline to ensure the change does not violate frozen dependencies.
- **Validation Before Change:** Code changes must be validated against the [Master Project Bible](../knowledge/AuditIQ_Master_Project_Bible.md) to ensure they fulfill an approved business need.
- **Preservation Before Innovation:** Agents must protect the deterministic core of AuditIQ. Refactoring existing, validated code is strictly forbidden unless explicitly requested.
- **Business Logic Before UI:** UI rendering must remain entirely separated from the analytical pipelines.

## 3. Standard Workflow
Every task executed by an AI agent that modifies the repository must adhere to the 12-step [Release Process](Release_Process.md):

**Audit** ↓ **Review** ↓ **Approval** ↓ **Implementation** ↓ **Validation** ↓ **Regression Testing** ↓ **Commit** ↓ **Push** ↓ **Stable Tag** ↓ **Documentation** ↓ **Freeze** ↓ **Next Task**

## 4. Source of Truth
When conflicts arise regarding project intent, architecture, or state, agents must resolve them using the official [Source of Truth Hierarchy](SOURCE_OF_TRUTH.md).

The `AuditIQ_Master_Project_Bible.md` is the ultimate business authority. The `Repository Source Code` and `Stable Release Tags` are the ultimate technical authorities.

## 5. Blueprint Philosophy
AuditIQ is developed in additive layers called Blueprints:
- **V1:** Foundation (Deterministic, client-side, zero-persistence analysis loop)
- **V2:** Intelligence & Strengthening (Exception Prioritization, Advanced Extraction)
- **V3:** Extension (Multi-user, Authentication, Audit Repository)
- **V4:** Scale (Enterprise integration)

Newer Blueprints **extend** previous ones. A newer Blueprint may never replace, rewrite, or invalidate a business capability delivered by a prior Blueprint.

## 6. The Freeze Rule
When a capability satisfies an approved Blueprint requirement and is validated, it becomes **Frozen**. Frozen components serve as immutable dependencies for downstream engines. An AI agent is not permitted to modify a frozen component unless resolving a verified defect or executing an explicitly approved architectural change. See the [Golden Rules](AUDITIQ_GOLDEN_RULE.md).

## 7. The Option C Principle
When presented with multiple paths to implement a feature, agents must choose the solution that preserves existing contracts, preserves frozen systems, and adds capability via extension rather than structural modification.

## 8. Documentation Rules
- **Update Documentation with Code:** Never merge code without simultaneously updating the relevant architecture and governance documentation.
- **Keep Cross-References Valid:** Use relative paths (e.g., `../knowledge/Blueprint_V1.md`) and ensure links remain functional.
- **Avoid Duplication:** Do not copy explanations across multiple files; use reference links instead.
- **Preserve Repository Consistency:** Terminology must remain identical across the codebase and documentation layer.

## 9. Release Rules
A milestone is only considered stable and complete when it has been fully validated, documented, and officially marked with a semantic Git tag (e.g., `stable-v2-phase-2.6`). Draft code cannot be treated as a stable dependency.

## 10. Repository Expectations
AI agents must never:
- Rewrite validated systems.
- Bypass the 12-step governance workflow.
- Ignore explicit repository evidence.
- Introduce speculative functionality or unapproved third-party dependencies.
