import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { extractDocumentData, extractionStatus } from "@/lib/extractor";

const ExtractionSchema = z.object({
  vendor: z.string().nullable(),
  vendorName: z.string().nullable(),
  documentNumber: z.string().nullable(),
  poNumber: z.string().nullable(),
  grnNumber: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  date: z.string().nullable(),
  normalizedDate: z.string().nullable(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  amount: z.number().nullable(),
  totalAmount: z.number().nullable(),
});

export async function POST(req: Request) {
  try {
    const { documentType, documentText } = await req.json();

    if (!documentType || !documentText) {
      return Response.json(
        { success: false, error: "Missing documentType or documentText" },
        { status: 400 }
      );
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ExtractionSchema,
      prompt: `You are a procurement document extraction system.
Extract values only from supplied text.
If a value cannot be confidently extracted return null.
Never invent values.
Never infer values.
Return structured data only.

Field Definitions:

- vendor and vendorName: both fields should contain the full legal name of the selling vendor or supplier as it appears on the document (labeled "Vendor Name"). Populate both fields with the same value.

- documentNumber: the primary identifier of the current document being processed.
  If the Document Type is "Purchase Order", documentNumber is the PO number.
  If the Document Type is "Goods Receipt Note", documentNumber is the GRN number.
  If the Document Type is "Vendor Invoice", documentNumber is the invoice number.

- poNumber: the Purchase Order number associated with this transaction. Extract it if present on any document type.

- grnNumber: the Goods Receipt Note number associated with this transaction. Extract it if present. If the document explicitly states "N/A" or "Not Applicable", return null.

- invoiceNumber: the Vendor Invoice number associated with this transaction. Extract it if present on any document type.

Important identifier rule:
poNumber, grnNumber, and invoiceNumber must be extracted even if they duplicate the value placed in documentNumber.
Duplication is expected and correct.

- date: the document date exactly as it appears in the text.

- normalizedDate: the document date converted to ISO 8601 format (YYYY-MM-DD).
  If the date already appears in YYYY-MM-DD format, copy it unchanged.
  Always populate this field if date is populated.

- quantity: the total quantity represented by the document.
  For multi-line documents, return the aggregate quantity across all line items.
  All quantities are present in the document text.

- unitPrice: the unit price as it appears in the document text.
  Do not calculate or derive this value.
  If multiple different unit prices exist on the document, return null.

- amount: the pre-tax subtotal of the document.
  Use the value labeled "Subtotal".
  Do not use a line amount.
  Do not use the grand total.

- totalAmount: the grand total of the document including taxes.
  Use the value labeled "Grand Total".

Document Type: ${documentType}

Document Text:
${documentText}`,
    });

    const finalData = extractDocumentData(documentType, documentText, object);
    const extraction = finalData ? extractionStatus.get(finalData) ?? null : null;

    return Response.json({
      success: true,
      data: finalData,
      extraction,
    });
  } catch (error: unknown) {
    console.error("Extraction error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to extract data" },
      { status: 500 }
    );
  }
}
