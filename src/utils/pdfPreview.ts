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

// Deep link di composizione di Outlook sul web: apre una nuova mail gia
// pre-compilata (destinatario, oggetto, corpo). L'allegato NON puo essere
// incluso via URL (limite dei browser): il PDF va scaricato e allegato a mano.
export const buildOutlookComposeUrl = (params: {
  to?: string | null;
  subject?: string | null;
  body?: string | null;
}): string => {
  // Nota: NON usare URLSearchParams, che codifica gli spazi come "+" (Outlook li
  // mostrerebbe letteralmente). encodeURIComponent codifica lo spazio come %20 e
  // gli a-capo come %0A, che Outlook decodifica correttamente.
  const parts: string[] = [];
  const to = String(params.to ?? "").trim();
  const subject = String(params.subject ?? "").trim();
  const body = String(params.body ?? "").trim();
  if (to) parts.push(`to=${encodeURIComponent(to)}`);
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  const query = parts.join("&");
  return `https://outlook.office.com/mail/deeplink/compose${query ? `?${query}` : ""}`;
};

// Scarica un PDF (da un URL blob: o http) forzando il nome file, tramite un
// anchor temporaneo. Sincrono: va invocato dentro il gesto/click dell'utente.
export const downloadPdfFromUrl = (url: string, fileName: string): void => {
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || DEFAULT_PDF_FILE_NAME;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

// Scarica un PDF partendo dal Blob (non dall'URL): crea un object URL fresco al
// momento del click, avvia il download e revoca l'URL poco dopo. Cosi il download
// non dipende da un blob: URL condiviso che potrebbe essere gia stato revocato
// altrove (es. dall'anteprima PDF). Sincrono fino al click: non blocca i popup.
export const downloadPdfFromBlob = (blob: Blob, fileName: string): void => {
  if (!isBlob(blob)) return;
  const url = URL.createObjectURL(blob);
  downloadPdfFromUrl(url, fileName);
  window.setTimeout(() => revokePdfPreviewUrl(url), 10000);
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

