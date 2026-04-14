import { PDFDocument } from "pdf-lib";

export type MergeWarning = {
  fileName: string;
  reason: string;
};

function isPdf(file: File) {
  return file.type === "application/pdf";
}

function isPng(file: File) {
  return file.type === "image/png";
}

function isJpeg(file: File) {
  return file.type === "image/jpeg" || file.type === "image/jpg";
}

function isWebp(file: File) {
  return file.type === "image/webp";
}

async function readFileAsBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossibile leggere l'immagine."));
    image.src = url;
  });
}

async function convertWebpToPngBytes(file: File): Promise<Uint8Array> {
  if (typeof document === "undefined") {
    throw new Error("Conversione WebP non disponibile fuori dal browser.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D non disponibile per la conversione WebP.");
    }

    context.drawImage(image, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/png");
    });

    if (!blob) {
      throw new Error("Il browser non supporta la conversione WebP in PNG.");
    }

    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function buildWarningsMessage(warnings: MergeWarning[]) {
  return warnings.map((warning) => `${warning.fileName}: ${warning.reason}`).join(" | ");
}

export async function mergeDocumentsToPdf(files: File[]): Promise<Uint8Array> {
  const destinationPdf = await PDFDocument.create();
  const warnings: MergeWarning[] = [];
  let mergedPages = 0;

  for (const file of files) {
    try {
      if (isPdf(file)) {
        const sourcePdf = await PDFDocument.load(await readFileAsBytes(file));
        const pageIndexes = sourcePdf.getPageIndices();
        const copiedPages = await destinationPdf.copyPages(sourcePdf, pageIndexes);

        copiedPages.forEach((page) => {
          destinationPdf.addPage(page);
          mergedPages += 1;
        });
        continue;
      }

      if (isPng(file)) {
        const bytes = await readFileAsBytes(file);
        const image = await destinationPdf.embedPng(bytes);
        const page = destinationPdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
        mergedPages += 1;
        continue;
      }

      if (isJpeg(file)) {
        const bytes = await readFileAsBytes(file);
        const image = await destinationPdf.embedJpg(bytes);
        const page = destinationPdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
        mergedPages += 1;
        continue;
      }

      if (isWebp(file)) {
        const pngBytes = await convertWebpToPngBytes(file);
        const image = await destinationPdf.embedPng(pngBytes);
        const page = destinationPdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
        mergedPages += 1;
        continue;
      }

      warnings.push({
        fileName: file.name,
        reason: "Formato non supportato per l'unione.",
      });
    } catch (error) {
      warnings.push({
        fileName: file.name,
        reason:
          error instanceof Error
            ? error.message
            : "Errore non previsto durante l'elaborazione del file.",
      });
    }
  }

  if (warnings.length > 0) {
    console.warn("[mergeDocumentsToPdf] warning:", buildWarningsMessage(warnings));
  }

  if (mergedPages === 0) {
    throw new Error(
      warnings.length > 0
        ? `Nessun file unibile. ${buildWarningsMessage(warnings)}`
        : "Nessun file valido da unire.",
    );
  }

  return await destinationPdf.save();
}
