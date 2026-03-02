export type PdfBlobSourceResult = Blob | { blob: Blob; fileName?: string | null };
export type PdfBlobSource =
  | PdfBlobSourceResult
  | Promise<PdfBlobSourceResult>
  | (() => PdfBlobSourceResult | Promise<PdfBlobSourceResult>);

export type PdfPreviewSession = {
  blob: Blob;
  fileName: string;
  url: string;
};

export type SharePdfFileResult = {
  status: "shared" | "unsupported" | "aborted" | "error";
  error?: unknown;
};

const DEFAULT_PDF_FILE_NAME = "documento.pdf";

const isBlob = (value: unknown): value is Blob => {
  return typeof Blob !== "undefined" && value instanceof Blob;
};

const hasBlob = (value: unknown): value is { blob: Blob; fileName?: string | null } => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { blob?: unknown };
  return isBlob(candidate.blob);
};

const resolveBlobSource = async (source: PdfBlobSource): Promise<PdfBlobSourceResult> => {
  if (typeof source === "function") {
    return await source();
  }
  return await source;
};

export const revokePdfPreviewUrl = (url?: string | null) => {
  if (!url || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // noop
  }
};

export const openPreview = async (params: {
  source: PdfBlobSource;
  fileName?: string;
  previousUrl?: string | null;
}): Promise<PdfPreviewSession> => {
  const resolved = await resolveBlobSource(params.source);
  const payload = isBlob(resolved)
    ? { blob: resolved, fileName: params.fileName || DEFAULT_PDF_FILE_NAME }
    : hasBlob(resolved)
    ? { blob: resolved.blob, fileName: resolved.fileName || params.fileName || DEFAULT_PDF_FILE_NAME }
    : null;

  if (!payload || !isBlob(payload.blob)) {
    throw new Error("Contenuto PDF non valido per anteprima.");
  }

  if (params.previousUrl) {
    revokePdfPreviewUrl(params.previousUrl);
  }

  return {
    blob: payload.blob,
    fileName: String(payload.fileName || DEFAULT_PDF_FILE_NAME),
    url: URL.createObjectURL(payload.blob),
  };
};

export const sharePdfFile = async (params: {
  blob: Blob;
  fileName: string;
  title: string;
  text: string;
}): Promise<SharePdfFileResult> => {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share !== "function") {
    return { status: "unsupported" };
  }

  const file = new File([params.blob], params.fileName || DEFAULT_PDF_FILE_NAME, {
    type: "application/pdf",
  });
  if (typeof nav.canShare === "function" && !nav.canShare({ files: [file] })) {
    return { status: "unsupported" };
  }

  try {
    await nav.share({
      title: params.title,
      text: params.text,
      files: [file],
    });
    return { status: "shared" };
  } catch (error) {
    const maybe = error as { name?: string };
    if (maybe?.name === "AbortError") return { status: "aborted" };
    return { status: "error", error };
  }
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  const api = navigator?.clipboard;
  if (!api?.writeText) return false;
  try {
    await api.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const buildWhatsAppShareUrl = (text: string): string => {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const buildPdfShareText = (params: {
  contextLabel: string;
  dateLabel?: string | null;
  fileName: string;
  url?: string | null;
}): string => {
  const label = String(params.contextLabel || "PDF");
  const datePart = String(params.dateLabel || "").trim();
  const suffix = datePart ? ` (${datePart})` : "";
  const fileName = String(params.fileName || DEFAULT_PDF_FILE_NAME);
  const url = String(params.url || "").trim();

  if (url && !url.startsWith("blob:")) {
    return `${label}${suffix}: ${url}`;
  }
  return `${label}${suffix} - file ${fileName}. Apri l'anteprima, scarica il PDF e invialo su WhatsApp.`;
};

