# Master Implementation Plan Authority

The approved **Blueprint V4 Master Implementation Plan** is the implementation contract for the current Blueprint section.

Once approved, implementation SHALL:
- implement exactly what the Master Implementation Plan specifies
- preserve the approved architecture
- preserve approved repository boundaries
- preserve approved public contracts

Implementation SHALL NOT:
- redesign the architecture
- introduce alternative implementations
- expand scope
- reduce scope
- reorder implementation units
- introduce new engineering objectives
- replace approved patterns
- add optional features outside the approved plan

If implementation discovers a genuine conflict, defect, or repository inconsistency, implementation must STOP.
Do not silently modify the approved implementation strategy.

Instead:
1. Report the conflict.
2. Explain why the Master Implementation Plan cannot be executed.
3. Provide repository evidence.
4. Request an Implementation Plan Amendment.

No architectural deviation is permitted without explicit approval.

---

# Engineering Objective

Execute the approved Blueprint V4 Master Implementation Plan.

Your responsibility is execution—not redesign.

Before implementing:
- verify repository state
- verify dependencies
- verify implementation prerequisites

If repository reality matches the approved Master Implementation Plan:
→ implement exactly as approved.

If repository reality does NOT match the approved Master Implementation Plan:
→ stop implementation and produce an Engineering Deviation Report.

Do not create an alternative architecture.
Do not improvise a new implementation strategy.
Wait for approval before proceeding.

---

# Implementation Authority

Treat the approved Blueprint V4 Master Implementation Plan as the equivalent of a signed engineering specification.

Your role is to verify its executability and implement it faithfully.

You are not authorized to improve, optimize, reinterpret, or replace the approved implementation unless an objective engineering conflict is demonstrated through repository evidence.

Repository evidence may justify stopping the implementation.
Repository evidence does NOT automatically justify changing the implementation.
Changes require explicit approval through an Implementation Plan Amendment.

---

# Interface Contract Principle

A public interface may be extended after implementation **only** when all of the following are true:

1. The extension exposes an already-existing capability.
2. No business semantics change.
3. Deterministic behavior remains unchanged.
4. Root Cause Verification classifies the change as an Interface Contract Defect.
5. The implementation contract is amended before certification.
