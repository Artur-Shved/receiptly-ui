/**
 * Browser-only helper: renders each page of a PDF File into a JPEG File so
 * the multi-photo upload pipeline can treat a PDF as N independent images.
 *
 * pdfjs-dist is loaded dynamically (its module init touches DOM globals),
 * which also keeps it out of the SSR bundle. The worker is pinned to the
 * matching version on unpkg.
 */

let workerInitialized = false;

export interface PdfConversionResult {
  files: File[];
  /** total number of pages in the source PDF (may exceed files.length when
   *  capped by maxPages). */
  totalPages: number;
  truncated: boolean;
}

export async function extractPdfPagesAsImages(
  file: File,
  options: { maxPages?: number; scale?: number } = {},
): Promise<PdfConversionResult> {
  if (typeof window === 'undefined') {
    throw new Error('extractPdfPagesAsImages must run in the browser');
  }

  const { maxPages = 10, scale = 2 } = options;

  const pdfjs = await import('pdfjs-dist');
  if (!workerInitialized) {
    // Worker copied to public/ at install time (see scripts/copy-pdf-worker).
    // Local same-origin URL avoids CORS / module-worker issues that hit some
    // browsers when loading the worker from a CDN.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    workerInitialized = true;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const totalPages = pdf.numPages;
  const pagesToRender = Math.min(totalPages, maxPages);

  const baseName = file.name.replace(/\.pdf$/i, '') || 'pdf';
  const files: File[] = [];

  for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    );
    if (!blob) continue;

    files.push(
      new File([blob], `${baseName}-стор-${pageNum}.jpg`, { type: 'image/jpeg' }),
    );

    // free page resources
    page.cleanup();
  }

  await pdf.destroy();

  return {
    files,
    totalPages,
    truncated: totalPages > pagesToRender,
  };
}
