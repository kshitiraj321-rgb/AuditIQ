let workerConfigured = false;
let pdfjsModulePromise:
  | Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")>
  | null = null;

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }

  return pdfjsModulePromise;
}

function ensurePdfWorkerConfigured() {
  if (workerConfigured || typeof window === "undefined") {
    return;
  }
}

export async function readPdfText(file: File) {
  try {
    const pdfjs = await loadPdfJs();
    ensurePdfWorkerConfigured();
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const textItems = textContent.items as Array<{ str?: string }>;
        const pageText = textItems
          .map((item) => item.str ?? "")
          .join(" ")
          .trim();

        if (pageText) {
          pageTexts.push(pageText);
        }
      }
    } finally {
      await loadingTask.destroy().catch(() => undefined);
    }

    return pageTexts.join("\n");
  } catch {
    return "";
  }
}
