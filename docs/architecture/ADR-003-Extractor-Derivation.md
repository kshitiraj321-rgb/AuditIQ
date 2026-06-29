# ADR-003: Deterministic Extractor Derivation

## Status
Accepted

## Context
During the validation of Blueprint V2 intelligent extraction, the `unitPrice` field demonstrated poor accuracy (26.67%) when multiple line items were present on procurement documents. The LLM was prompted to calculate the effective average unit price, but because LLMs act as generative text models rather than arithmetic engines, it hallucinated or failed to calculate accurately, defaulting to `null` or falling back to fixture data. 

This created a semantic contradiction where a "calculated business metric" was being requested within an "extraction" layer.

## Decision
We decided to strictly separate extraction responsibilities from deterministic business logic:
1. **LLM Extraction Boundary:** The AI prompt explicitly instructs the model *not* to calculate or derive `unitPrice`. If multiple line items exist, the AI simply extracts `null` as the unit price, serving strictly as an OCR/Extraction node.
2. **TypeScript Derivation Layer:** We introduced deterministic mathematical derivation within `src/lib/extractor.ts`.
3. **Provenance Chain:** We expanded the `FieldSource` type to include `"derived"`.

## Implementation Details
The extraction layer derives missing values strictly under tight guardrails:
- The `unitPrice` is mathematically derived (`amount / quantity`) **only** if the `quantity` and `amount` fields were both genuinely `"extracted"` by the AI.
- It will **not** derive a value if `quantity` or `amount` relied on `"fallback"` data.
- The `source` provenance of the calculated field is permanently tagged as `"derived"`.

## Consequences
**Positive:**
- `unitPrice` accuracy surged to 100%.
- Overall extraction accuracy improved from 92.22% to 98.33%.
- Preserved perfect regression safety across the matching and exception engines.
- True data provenance is maintained, preventing hallucinated business logic.

**Negative:**
- Adds a small processing step to the extraction normalization pipeline.

## Compliance
- **AuditIQ Golden Rule:** Identifies accurate price variance exceptions.
- **Foundation Rule:** Solidifies the V1 bedrock.
- **Upgrade Rule:** Enhances V1 accuracy without changing its semantic meaning.
- **Freeze Rule:** Preserves V1 core mechanics.
