import { buildSystemPrompt } from "./assistantPrompt";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function askAssistant(
  query: string,
  analysisResult: any,
  selectedIdx: number,
  history: ChatMessage[]
): Promise<string> {
  const prompt = buildSystemPrompt(analysisResult, selectedIdx);
  const qLower = query.toLowerCase();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 1. Check for unsupported questions (Root Cause / Historical / Predictive)
  if (
    qLower.includes("why did the vendor") ||
    qLower.includes("past") ||
    qLower.includes("history") ||
    qLower.includes("historical") ||
    qLower.includes("future") ||
    qLower.includes("predict") ||
    qLower.includes("root cause")
  ) {
    return "I am limited to explaining the current audit snapshot and cannot provide historical trends or root cause diagnoses.";
  }

  // 2. Mock answering based on extracted data / match result
  const selectedException = analysisResult.exceptions[selectedIdx];
  const type = selectedException?.type;

  if (qLower.includes("exposure") || qLower.includes("financial")) {
    const exposure = analysisResult.financialExposure.breakdown.find(
      (b: any) => b.exception === type
    );
    if (exposure) {
      return `The financial exposure for the ${type} exception is ₹${exposure.exposure}. This contributes to the total exposure of ₹${analysisResult.financialExposure.totalExposure}.`;
    }
  }

  if (qLower.includes("quantity") && type === "Quantity Mismatch") {
    const qMatch = analysisResult.matchResult.quantityMatch;
    return `The Quantity Mismatch occurred because the Purchase Order specifies ${qMatch.po ?? "—"}, the Goods Receipt Note shows ${qMatch.grn ?? "—"}, and the Invoice states ${qMatch.invoice ?? "—"}.`;
  }

  if (qLower.includes("price") && type === "Price Variance") {
    const pMatch = analysisResult.matchResult.priceMatch;
    return `The Price Variance occurred because the unit price on the Purchase Order is ₹${pMatch.po ?? "—"}, while the Invoice charges ₹${pMatch.invoice ?? "—"}.`;
  }

  if (qLower.includes("recommend") || qLower.includes("action")) {
    return `Based on the current audit, the system recommends: ${analysisResult.recommendations.join(
      " "
    )}`;
  }

  if (qLower.includes("explain") || qLower.includes("what happened")) {
    const explanations = analysisResult.explainability.explanations.filter((e: string) => e.includes(type) || e.includes(type.split(" ")[0]));
    if (explanations.length > 0) {
      return `Here is what the analysis found regarding ${type}: ${explanations.join(" ")}`;
    }
  }

  // 3. Fallback for unanswerable queries based on context
  if (qLower.includes("who approved") || qLower.includes("who created")) {
    return "I do not have enough data in the current audit to answer that question.";
  }

  // Generic fallback mimicking an LLM reading the explainability array
  return `Based on the provided context for ${type ?? "this audit"}, the system detected exceptions that need review. Please refer to the document detail cards above for specific field mismatches.`;
}
