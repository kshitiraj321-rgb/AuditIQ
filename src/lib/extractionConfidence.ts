import { extractDocumentData, extractionProvenance } from './extractor';

export type ExtractedDocumentData = ReturnType<typeof extractDocumentData>;

export interface FieldConfidence {
  score: number;
  source: "extracted" | "fallback" | "missing";
}

export interface DocumentConfidence {
  overallScore: number;
  fields: Record<string, FieldConfidence>;
  isHighConfidence: boolean;
}

export function calculateExtractionConfidence(
  extractedData: ExtractedDocumentData
): DocumentConfidence {
  const fields: Record<string, FieldConfidence> = {};
  let totalScore = 0;
  let fieldCount = 0;

  if (extractedData) {
    const provenance = extractionProvenance.get(extractedData);

    if (provenance) {
      for (const [key, source] of Object.entries(provenance)) {
        let score = 0.0;
        if (source === 'extracted') {
          score = 1.0;
        } else if (source === 'fallback') {
          score = 0.5;
        }

        fields[key] = {
          score,
          source: source as "extracted" | "fallback" | "missing"
        };
        totalScore += score;
        fieldCount++;
      }
    } else {
      // Defensive fallback for legacy/mock data without provenance metadata
      for (const [key, value] of Object.entries(extractedData)) {
        const isMissing = value === null || value === undefined || value === '';
        const score = isMissing ? 0.0 : 0.8;
        
        fields[key] = {
          score,
          source: isMissing ? 'missing' : 'extracted'
        };

        totalScore += score;
        fieldCount++;
      }
    }
  }

  const overallScore = fieldCount > 0 ? totalScore / fieldCount : 0;

  return {
    overallScore,
    fields,
    isHighConfidence: overallScore >= 0.7
  };
}
