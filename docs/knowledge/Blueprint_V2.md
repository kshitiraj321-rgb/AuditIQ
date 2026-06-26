# Blueprint V2

## 1. Objectives
The objective of Blueprint V2 is to strengthen the business foundation established in [Blueprint V1](Blueprint_V1.md) without replacing it. V2 focuses on enhancing the analytic depth of the Exception Intelligence Platform by introducing advanced exception prioritization and compliance remediation within the Investigation Workspace, proving that AuditIQ can scale its intelligence while preserving its deterministic core.

## 2. Guiding Philosophy
**Principle: "Strengthen V1, never replace V1."**
Every feature added in Blueprint V2 must integrate with or wrap around the frozen V1 pipeline. No validated capability from V1 may be discarded or unnecessarily rewritten to satisfy a V2 requirement.

## 3. Phase & Section Breakdown
Blueprint V2 is organized and delivered iteratively through focused Phases and Bible Sections.

**Completed Phases:**
- **Phase 2.1:** Completed and Frozen.
- **Phase 2.2:** Completed and Frozen.
- **Phase 2.5:** Completed and Frozen.

**Completed Sections:**
- **Section 12.6:** Completed and Frozen. This section introduced the Exception Prioritization Engine, enabling deterministic ranking of exceptions.
- **Section 12.7:** Completed and Frozen. Enhanced Dashboard. Introduces Presentation-Layer-only widgets (Priority Exceptions, Transaction Compliance, Current Vendor Risk) that visualize the outputs of Section 12.6 without introducing new business logic.

**In Progress Sections:**
- *(None currently. Repository evidence indicates stable-v2-phase-2.7 is the latest frozen state.)*

**Planned Sections:**
- **Section 13:** Dashboard enhancements and real-time KPI orchestration (dependent on Database Persistence).
- **Section 14:** Production Extraction Layer integration.

## 4. Added Capabilities (V2)
Blueprint V2 introduces the following major capabilities:
- **Investigation Workspace Compliance Remediation:** Enhancements to the results investigation workspace ensuring compliance metrics and root cause associations are deterministically mapped.
- **Exception Prioritization Engine:** A new business engine (Section 12.6) that evaluates detected exceptions and assigns a deterministic priority ranking based on financial exposure, risk severity, compliance impact, vendor criticality, and transaction value.
- **Enhanced Dashboard:** A presentation layer UI upgrade (Section 12.7) that introduces the Priority Exceptions Widget, Transaction Compliance Widget, and Current Vendor Risk Widget directly derived from the Prioritization Engine's frozen outputs without injecting new business logic.

## 5. Preserved Capabilities (from V1)
The following capabilities were preserved and remain untouched:
- Document Acquisition & Advisory Classification
- Regex/Fixture-based Information Extraction
- Three-Way Matching Engine
- Core Exception Detection
- Financial Exposure Calculation
- Base Risk Assessment

## 6. Frozen Status
The current repository tag (`stable-v2-phase-2.6`) represents the frozen state of these V2 milestones. They are now considered part of the core platform foundation and may not be altered without explicit architectural approval, acting as the Source of Truth alongside the [AuditIQ Master Project Bible](AuditIQ_Master_Project_Bible.md).
