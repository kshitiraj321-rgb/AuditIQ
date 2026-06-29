# AuditIQ Blueprint V3 — Architectural Baseline

**Version Tag:** `stable-v3.0.0`
**Status:** FROZEN & CERTIFIED

## 1. Blueprint V3 Overview

Blueprint V3 establishes the **Predictive Risk Framework** and the **Intelligence Foundation** for the AuditIQ platform. 

It seamlessly extends Blueprint V1 (Core Business Engines) and Blueprint V2 (Prioritization & Explainability) without replacing or modifying them. Where earlier blueprints focused on processing single documents and prioritizing immediate exceptions, Blueprint V3 introduces deterministic historical analysis, cross-enterprise operational behavior tracking, and multi-tier organizational intelligence composition. It serves as a unified, factual foundation for all future proactive risk evaluation and executive reporting.

## 2. Non-Goals

Blueprint V3 intentionally does not provide:

- Business policy
- Approval workflows
- Escalation logic
- AI reasoning
- Dashboard rendering
- Notification systems
- Workflow automation
- ML models
- User interfaces

These omissions are intentional, not missing features. They preserve the strict focus on factual intelligence and predictive risk.

## 3. Architectural Layers

The AuditIQ platform now follows a strict, multi-tiered architecture. Data flows unidirectionally upward through these layers:

```text
Raw Operational Data
         ↓
Blueprint V1 Business Engines
         ↓
Predictive Risk Framework
         ↓
Vendor Intelligence
         ↓
Department Intelligence
         ↓
Organizational Intelligence
         ↓
Executive Intelligence
```

### Layer Responsibilities

* **Raw Operational Data**: The unprocessed ingestion of transactions, invoices, and supplier files.
* **Blueprint V1 Business Engines**: Core deterministic processing (Extract, Match, Exception Generation, Financial Exposure).
* **Predictive Risk Framework (13.3)**: Evaluates historical behavior and trends to calculate the probability of future exceptions using bounded, deterministic predictors and a calibrated confidence model.
* **Vendor Intelligence (13.4)**: Computes factual, objective operational profiles for individual vendors (spend, exception rates, historical trends). Contains zero business policy.
* **Department Intelligence (13.5)**: Computes factual, objective operational profiles for internal departments. Contains zero business policy.
* **Organizational Intelligence (13.6)**: A pure composition layer that orchestrates internal intelligence providers to build a comprehensive, organization-wide factual profile.
* **Executive Intelligence (13.7)**: Executive Intelligence summarizes certified intelligence into executive-oriented portfolio views and strategic indicators.

## 4. Architectural Invariants

The following invariants are immutable architectural laws:

1. Intelligence layers only produce facts.
2. Policy layers never calculate facts.
3. Presentation layers never calculate business metrics.
4. Predictive layers never perform presentation.
5. Every public service exposes one orchestration method.
6. Every intelligence layer is deterministic.
7. Certified profiles are the only cross-layer communication mechanism.
8. Raw operational data never bypasses lower layers.

## 5. Dependency Rules

The following dependency rules are permanent and mandatory for all future development:

> [!CAUTION]
> **Strict Upward Flow**
> - Higher layers consume lower layers.
> - Lower layers **never** depend on higher layers.
> - Intelligence Providers (Vendor, Department, Organizational) **never** consume Executive Intelligence.
> - Executive Intelligence **never** processes or aggregates Raw Operational Data directly; it must use lower intelligence profiles.
> - The Predictive Risk Framework **never** performs presentation logic, UI mapping, or business policy alerting.

## 6. Frozen Components

The following components are now certified as the official production baseline. They must not be modified or bypassed.

### Blueprint V1 (Core Engines)
- `matcher.ts`
- `exceptionEngine.ts`
- `riskEngine.ts`
- `recommendationEngine.ts`
- `explainability.ts`

### Blueprint V3 (Intelligence & Prediction)
- `predictiveRiskEngine.ts`
- `PredictorRegistry`
- `vendorBehaviorPredictor.ts`
- `departmentTrendPredictor.ts`
- `historicalExceptionPredictor.ts`
- `vendorIntelligence.ts`
- `departmentIntelligence.ts`
- `organizationIntelligence.ts`
- `executiveIntelligence.ts`

## 7. Extension Rules

Any future Blueprint must abide by these extension constraints:

1. **Build on Existing Layers**: New capabilities must compose existing certified profiles rather than re-computing raw data.
2. **Never Duplicate Intelligence**: Do not manually aggregate vendor spend or department exceptions. Call the respective Intelligence Service.
3. **Never Bypass Certified Profiles**: Features requiring organization-wide metrics must use `ExecutiveIntelligenceProfile` or `OrganizationIntelligenceProfile`.
4. **Never Introduce Circular Dependencies**: Imports must strictly follow the architectural tier diagram.
5. **Never Mix Policy with Intelligence**: Intelligence layers output facts.

## 8. Future Extension Map

Future developers must consult this mapping to determine where new capabilities belong:

| Future Capability | Correct Layer |
| :--- | :--- |
| Executive Alerts | Policy Layer |
| Vendor Suspension | Policy Layer |
| AI Advisory | AI Layer |
| Dashboard Widgets | Presentation Layer |
| Natural Language Reports | Presentation Layer |
| Machine Learning | Prediction Layer |
| Workflow Automation | Policy Layer |

## 9. Validation Summary

The V3 Baseline is backed by a 100% passing test suite across all layers.

* **Build Validation**: Full `next build` optimization passes with no TypeScript errors.
* **Regression Suite**: The unified PowerShell execution suite (`run_regression.ps1`) executes successfully.
* **Predictor Calibration**: `multi_predictor_calibration.test.ts` validates that the risk scoring ensemble correctly balances dominant, zero-weight, high-risk, and low-risk signals without skewing.
* **Framework Hardening**: `framework_hardening.test.ts` guarantees resilience against NaN, Infinity, missing IDs, out-of-bounds scores, and mock exceptions.
* **Intelligence Validation**: 
  - `vendor_intelligence.test.ts` (PASS)
  - `department_intelligence.test.ts` (PASS)
  - `organization_intelligence.test.ts` (PASS)
  - `executive_intelligence.test.ts` (PASS)

## 10. Architecture Decision Summary

Key structural decisions codified in Blueprint V3:

* **Intelligence providers produce facts**: "What happened?" is separated from "Is this good or bad?".
* **Scoring belongs to policy layers**: Predictors handle risk probability, but broader business thresholds belong strictly in future policy or alert layers.
* **Executive Intelligence is a consumer**: It summarizes certified intelligence; it does not generate new data.
* **Composition over duplication**: Organization Intelligence explicitly aggregates Vendor and Department data rather than re-querying the database.
* **Deterministic calculations only**: Probabilistic models, LLMs, and non-deterministic AI are strictly excluded from the certified risk and intelligence frameworks.

## 11. Baseline Certification

> [!IMPORTANT]
> **Blueprint V3 is hereby certified as the new architectural baseline (`stable-v3.0.0`).**
> 
> Future Blueprint work must **extend** this baseline. Components listed in Section 6 are locked and considered highly reliable. Re-architecting or replacing these components is not permitted without a superseding architectural mandate.
