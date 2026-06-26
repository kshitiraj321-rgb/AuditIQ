# Section 12.7 Dashboard KPI Implementation Plan

> [!CAUTION]
> **Governance Notice:** Based on the newly created `Blueprint_V2_Section_Register.md`, the Dashboard KPI functionality is formally assigned to **Section 13**. The title of this document reflects the requested filename to fulfill the prompt, but governance rules require aligning all features to their canonical sections. This implementation plan evaluates the dashboard capabilities according to the rules of canonical Section 13.

## Category A — Buildable Now

The following Dashboard KPIs can be implemented immediately using the frozen `stable-v2-phase-2.6` architecture. These rely strictly on the `AnalysisResult` stored in `sessionStorage` and require no backend, authentication, or ERP integration.

### 1. Priority Exceptions Widget
- **Business Purpose:** Display the top prioritized exceptions to guide immediate auditor attention.
- **Repository Evidence:** `src/lib/prioritizationEngine.ts` (Outputs `PrioritizedException[]`).
- **Dependencies:** `AnalysisResult` (must be updated to include prioritization output), `sessionStorage`.
- **UI Components:** A ranked list widget on the dashboard.
- **Data Sources:** Client-side memory/session storage.
- **Files Affected:** `src/app/page.tsx`, `src/app/upload/page.tsx` (to include priority output).
- **Technical Risk:** Low. Extends the existing dashboard UI without modifying extraction or matching engines.
- **Governance Validation:** Compliant. Reuses frozen engines and adds UI capabilities on top.
- **Recommended Implementation Order:** 1

### 2. Transaction Compliance Risk Widget
- **Business Purpose:** Aggregate the compliance impact and transaction value risk for the current audit session.
- **Repository Evidence:** `src/lib/prioritizationEngine.ts` calculates `complianceScore` and `transactionScore`.
- **Dependencies:** `AnalysisResult` from `sessionStorage`.
- **UI Components:** Scorecard or gauge widget.
- **Data Sources:** Client-side memory/session storage.
- **Files Affected:** `src/app/page.tsx`.
- **Technical Risk:** Low.
- **Governance Validation:** Compliant. Additive UI feature.
- **Recommended Implementation Order:** 2

---

## Category B — Architecturally Blocked

The following Dashboard KPIs cannot be implemented in the current architecture.

### 1. Multi-Audit Trend Analysis
- **Why it is blocked:** All audit data is lost on tab close due to `sessionStorage`.
- **Missing Architecture:** Database Persistence layer.
- **Missing Blueprint Milestone:** Future Blueprint V2 (Database Persistence).
- **Required Future Dependency:** Backend API and PostgreSQL/MongoDB integration.

### 2. Global Vendor Health Ranking
- **Why it is blocked:** Vendor scoring requires aggregating data across hundreds of past audits.
- **Missing Architecture:** Audit Repository / Database Persistence.
- **Missing Data:** Historical invoice and exception data.
- **Missing Blueprint Milestone:** Blueprint V3 (Historical querying).
- **Required Future Dependency:** Persistent storage.

### 3. Department / Auditor Productivity KPIs
- **Why it is blocked:** The system currently has no concept of users or departments.
- **Missing Architecture:** Authentication and Role-Based Access Control (RBAC).
- **Missing Blueprint Milestone:** Blueprint V3.
- **Required Future Dependency:** Auth provider (e.g., NextAuth) and user persistence.

### 4. Cross-Audit Analytics
- **Why it is blocked:** Requires querying a unified data store which does not exist.
- **Missing Architecture:** Backend Analytics Engine.
- **Missing Blueprint Milestone:** Blueprint V4 (Enterprise Scale).
- **Required Future Dependency:** Data warehouse or robust relational backend.

---

## Conclusion & Recommendations

1. **Buildable Today:** Single-session Priority Exceptions and Compliance Risk widgets.
2. **Buildable After Persistence:** Multi-audit trend lines, Cross-audit analytics.
3. **Buildable After Authentication:** Department and Auditor productivity KPIs.
4. **Buildable After ERP Integration:** True Global Vendor Health scores based on real historical transactions.
5. **Recommended Scope for Blueprint V2 Section 12.7:** Formally reject the "Section 12.7" designation. Realign all Dashboard KPI work to **Section 13**. Limit the immediate Section 13 scope to Category A (Buildable Today) widgets.
6. **Recommended Implementation Sequence:**
   - Update `AnalysisResult` contract to store `PrioritizedException[]`.
   - Update Dashboard (`src/app/page.tsx`) to display Category A widgets.
   - Halt further dashboard development until Database Persistence is introduced.
