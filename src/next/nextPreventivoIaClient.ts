import type { PreventivoPriceExtractResult } from "./nextPreventivoIaHelpers";

const PREVENTIVO_IA_ENDPOINT =
  "http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract";

export type PreventivoIaClientErrorCode =
  | "validation_error"
  | "provider_not_configured"
  | "upstream_error"
  | "network_error"
  | "unexpected_response";

export class PreventivoIaClientError extends Error {
  readonly code: PreventivoIaClientErrorCode;
  readonly httpStatus: number | null;

  constructor(code: PreventivoIaClientErrorCode, message: string, httpStatus: number | null = null) {
    super(message);
    this.name = "PreventivoIaClientError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

type PreventivoExtractEnvelope = {
  ok?: boolean;
  status?: string;
  message?: string;
  data?: {
    result?: PreventivoPriceExtractResult;
    providerTarget?: unknown;
    traceEntryId?: string;
  };
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Lettura file non riuscita."));
    reader.onload = () => {
      const raw = String(reader.result || "");
      const commaIndex = raw.indexOf(",");
      resolve(commaIndex >= 0 ? raw.slice(commaIndex + 1) : raw);
    };
    reader.readAsDataURL(file);
  });
}

function readErrorMessage(code: PreventivoIaClientErrorCode) {
  if (code === "validation_error") {
    return "File non valido. Verifica che sia un PDF o un'immagine supportata.";
  }
  if (code === "provider_not_configured") {
    return "Servizio IA non configurato. Contatta l'amministratore.";
  }
  if (code === "upstream_error") {
    return "Estrazione IA non riuscita. Verifica file e riprova.";
  }
  if (code === "network_error") {
    return "Servizio IA non raggiungibile. Verifica la connessione.";
  }
  return "Risposta IA non valida. Riprova.";
}

async function parseEnvelope(response: Response): Promise<PreventivoExtractEnvelope> {
  try {
    return (await response.json()) as PreventivoExtractEnvelope;
  } catch {
    return {};
  }
}

async function callPreventivoIa(
  body: Record<string, unknown>,
): Promise<PreventivoPriceExtractResult> {
  let response: Response;
  try {
    response = await fetch(PREVENTIVO_IA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PreventivoIaClientError("network_error", readErrorMessage("network_error"));
  }

  const envelope = await parseEnvelope(response);
  if (!response.ok || envelope.ok === false) {
    const normalizedStatus =
      envelope.status === "validation_error" ||
      envelope.status === "provider_not_configured" ||
      envelope.status === "upstream_error"
        ? envelope.status
        : "unexpected_response";

    throw new PreventivoIaClientError(
      normalizedStatus,
      readErrorMessage(normalizedStatus),
      response.status,
    );
  }

  const result = envelope.data?.result;
  if (!result || result.schemaVersion !== "preventivo_price_extract_v1") {
    throw new PreventivoIaClientError(
      "unexpected_response",
      readErrorMessage("unexpected_response"),
      response.status,
    );
  }

  return result;
}

export async function extractPreventivoIaFromPdf(
  pdfFile: File,
  originalFileName?: string | null,
): Promise<PreventivoPriceExtractResult> {
  const contentBase64 = await readAsBase64(pdfFile);
  return callPreventivoIa({
    fileName: pdfFile.name || "preventivo.pdf",
    mimeType: pdfFile.type || "application/pdf",
    contentBase64,
    originalFileName: originalFileName ?? pdfFile.name ?? null,
  });
}

export async function extractPreventivoIaFromImages(
  images: File[],
  originalFileName?: string | null,
): Promise<PreventivoPriceExtractResult> {
  const pages = await Promise.all(
    images.map(async (image, index) => ({
      fileName: image.name || `preventivo-${index + 1}.jpg`,
      mimeType: image.type || "image/jpeg",
      contentBase64: await readAsBase64(image),
    })),
  );

  return callPreventivoIa({
    pages,
    originalFileName: originalFileName ?? images[0]?.name ?? null,
  });
}

export { PREVENTIVO_IA_ENDPOINT };
