# AuditIQ — Blueprint V4 Developer Handoff

## 1. Repository State
Blueprint V3 is permanently frozen under the tag `stable-v3.0.0`. The repository features a unified, multi-tiered intelligence foundation. All Blueprint V1/V2 core engines remain intact and operational. Test suites are 100% green and type-safety is enforced across all layers.

## 2. Frozen Components
The following core engine and intelligence layer components are certified and **FROZEN**. They must not be modified or bypassed:
* `matcher.ts`
* `exceptionEngine.ts`
* `riskEngine.ts`
* `recommendationEngine.ts`
* `explainability.ts`
* `predictiveRiskEngine.ts`
* `vendorBehaviorPredictor.ts`
* `departmentTrendPredictor.ts`
* `historicalExceptionPredictor.ts`
* `vendorIntelligence.ts`
* `departmentIntelligence.ts`
* `organizationIntelligence.ts`
* `executiveIntelligence.ts`

## 3. Architectural Invariants
1. Intelligence layers only produce facts.
2. Policy layers never calculate facts.
3. Presentation layers never calculate business metrics.
4. Predictive layers never perform presentation.
5. Every public service exposes one orchestration method.
6. Every intelligence layer is deterministic.
7. Certified profiles are the only cross-layer communication mechanism.
8. Raw operational data never bypasses lower layers.

## 4. Extension Rules
* **Compose, Don't Duplicate:** If you need org-wide exception rates, consume the `OrganizationIntelligenceProfile`. Do not query the DB directly to recalculate it.
* **Respect the Flow:** Data flows up. Lower layers must never import higher layers.
* **Preserve Determinism:** Risk engines must remain mathematically deterministic. Randomness, probabilistic LLMs, and non-deterministic logic belong outside the intelligence layers.

## 5. Source-of-Truth Hierarchy
1. **AuditIQ Master Project Bible:** The ultimate authority on business requirements and capabilities.
2. **Permanent Freeze Documents:** `Blueprint_V3_Freeze_Record.md` defines the exact scope and limitations of the V3 baseline.
3. **Repository Source Code:** The physical implementation of the Master Project Bible.
4. **Validation Suites:** The enforceable contracts guaranteeing the source code operates correctly.

## 6. Dependency Graph
```text
Raw Operational Data
       ↓
Blueprint V1 Business Engines
       ↓
Predictive Risk Framework
       ↓
Vendor / Department Intelligence
       ↓
Organizational Intelligence
       ↓
Executive Intelligence
       ↓
Presentation / Policy / Alerting (Blueprint V4 focus)
```

## 7. Approved Design Patterns
* **Single-Method Services:** e.g., `buildExecutiveProfile()` as the sole orchestrator.
* **Typed Profiles:** Standardized interfaces for intelligence outputs.
* **Registry Pattern:** e.g., `PredictorRegistry` for extensibility without modification.

## 8. Anti-Patterns
* **Inline Computations in UI:** Calculating averages or risks inside `.tsx` files is strictly forbidden.
* **God Objects:** Avoid merging intelligence generation and policy execution into a single service.
* **Circular Imports:** Sibling or lower-tier layers importing upward.

## 9. Validation Workflow
* **Local Run:** Execute `run_regression.ps1` for full verification.
* **Build Check:** Ensure `npx tsc --noEmit` and `npm run build` pass before any commit.
* **Coverage:** New features require dedicated, multi-scenario test suites covering edge cases (empty inputs, high volumes, nulls).

## 10. Git Workflow
* Blueprint V3 is finalized on `main` and tagged `stable-v3.0.0`.
* Blueprint V4 development should branch from this point.
* Always commit small, verifiable chunks of work following the `Audit → Implementation → Validation` cycle.

## 11. Blueprint V4 Starting Point
Start with a clean slate. V3 is archived. Your first action should not be writing code.

## 12. First Required Task: Blueprint V4 Architecture Readiness Audit
Before writing any code for Blueprint V4, you **must** perform an Architecture Readiness Audit against the Master Project Bible to determine what V4 introduces and how it maps to the frozen V3 baseline.

## 13. What Future Developers Must Never Change
Do not rewrite the V1/V2 business engines or the V3 predictive/intelligence frameworks. Do not alter the deterministic nature of risk scoring. Do not bypass intelligence profiles to re-aggregate raw data.

## 14. Lessons Learned During Blueprint V3
* **Discipline over speed:** A strict separation of "facts" (intelligence) from "decisions" (policy) prevented tangled dependencies.
* **Independent Auditing:** Independent verification phases successfully caught architectural noise (e.g., `finalExposure` dead field) and boundary violations before freeze.
* **Test Isolation:** Maintaining isolated suites for each layer proved critical for confidence in the orchestration layers.

## 15. Recommended Blueprint V4 Roadmap
1. Address the 4 non-blocking technical debt items recorded in the V3 Freeze Record.
2. Establish database connection layers (if dictated by V4 scope) and replace static UI mocks with live data wiring.
3. Introduce Policy and Workflow execution layers (which consume the V3 Intelligence profiles).
4. Implement proactive notification and automation engines based on predictive alerts.
