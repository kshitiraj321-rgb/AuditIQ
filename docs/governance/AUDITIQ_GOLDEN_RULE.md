# AuditIQ Golden Rule

## Core Principle

Blueprints are cumulative, not replacement-based.

AuditIQ is built through layers.

Each Blueprint exists to strengthen, extend, or scale the previous Blueprint.

A newer Blueprint must never invalidate the business capability delivered by an approved earlier Blueprint unless the Bible explicitly authorizes a redesign.

---

## Blueprint Hierarchy

Blueprint V1 defines the core product.

Blueprint V2 strengthens V1.

Blueprint V3 extends V1.

Blueprint V4 scales V1.

Therefore:

V2 does not replace V1.

V3 does not replace V2.

V4 does not replace V3.

All Blueprint versions are additive.

---

## The Foundation Rule

When evaluating any change, always identify:

"What capability is already working today?"

Approved and validated capabilities are considered part of the foundation.

The foundation must be preserved.

New work must be built around the foundation, not through unnecessary modification of the foundation.

---

## The Preservation Rule

Whenever a new requirement appears, the preferred implementation order is:

1. Add around the existing system.
2. Integrate with the existing system.
3. Extend the existing system.
4. Modify the existing system only if absolutely necessary.
5. Replace the existing system only if explicitly approved.

Replacement is always the last option.

---

## The Freeze Rule

A component becomes frozen when:

1. It satisfies an approved Blueprint requirement.
2. It passes validation.
3. It becomes a dependency for future Blueprint work.

Frozen does not mean perfect.

Frozen means:

"Future work should assume this component exists and works."

A frozen component may only be modified when:

- A verified defect exists.
- A Bible requirement cannot be satisfied otherwise.
- An approved architecture decision explicitly authorizes modification.

---

## The Contract Rule

Interfaces are more important than implementations.

If a component currently provides:

```typescript
ExtractedDocumentData
```

then future Blueprint work should preserve that contract whenever possible.

Improving implementation while preserving contracts is preferred.

Breaking contracts requires strong justification and explicit approval.

---

## The Architecture Boundary Rule

Every layer should have one responsibility.

Examples:

UI Layer
- user interaction
- orchestration
- loading states

API Layer
- networking
- external services
- model calls

Extraction Layer
- mapping
- normalization
- transformation

Matching Layer
- comparison logic

Risk Layer
- risk assessment

Recommendation Layer
- recommendations

A layer should not absorb responsibilities belonging to another layer.

---

## The Upgrade Rule

When introducing new capabilities:

Prefer:

Existing System
↓
New Capability Added

Avoid:

Existing System
↓
Fundamental Redesign
↓
New Capability

Unless redesign is explicitly approved.

---

## The Audit Rule

Audits must evaluate compliance against:

Bible
↓
Approved Blueprint
↓
Repository Evidence

Never:

Expectation
↓
Opinion
↓
Best Practice
↓
Compliance Finding

A finding is valid only when it can be traced to an approved requirement.

---

## The Remediation Rule

When a defect is discovered:

Do not immediately redesign.

First ask:

Can this be fixed while preserving:

- existing contracts
- frozen components
- approved architecture

If yes:

Choose the smallest valid fix.

If no:

Escalate for architectural review.

---

## The Option C Principle

Whenever multiple solutions exist:

Prefer the solution that:

- preserves existing contracts
- preserves frozen systems
- minimizes repository impact
- minimizes technical debt
- maintains architectural boundaries

The safest solution is usually the one that adds capability with the least disruption.

---

## The AuditIQ Decision Test

Before approving any change, ask:

1. Does this strengthen V1?
2. Does this preserve approved contracts?
3. Does this respect architectural boundaries?
4. Does this avoid unnecessary redesign?
5. Is there a smaller solution available?
6. Is the change required by an approved requirement?

If any answer is "No", the change requires further review.

---

## Final Rule

AuditIQ evolves through preservation first, extension second, replacement last.

If there is uncertainty between:

A. Preserve and extend

or

B. Replace and redesign

The default decision is:

Preserve and extend.