import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../backend/internal-ai/src/internalAiServerPersistenceContracts";

const CISTERNA_DOCUMENTO_ANALYZE_PATH = "/internal-ai-backend/documents/documento-cisterna-analyze";
const CISTERNA_SCHEDE_ANALYZE_PATH = "/internal-ai-backend/documents/scheda-cisterna-analyze";

export type CisternaDocumentoExtractResult = {
  tipoDocumento: "fattura" | "bollettino" | null;
  fornitore: string | null;
  destinatario: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  yearMonth: string | null;
  litriTotali: number | null;
  totaleDocumento: number | null;
  valuta: "EUR" | "CHF" | null;
  prodotto: string | null;
  testo: string | null;
  daVerificare: boolean;
  motivoVerifica: string | null;
};

type CisternaDocumentoExtractEnvelope = {
  ok?: boolean;
  status?: string;
  message?: string;
  data?: {
    result?: Partial<CisternaDocumentoExtractResult> | null;
    providerTarget?: unknown;
    traceEntryId?: string;
  };
};

export type CisternaSchedeExtractRow = {
  rowIndex: number;
  data_raw: string;
  targa_raw: string;
  litri_raw: string;
  data_status: "OK" | "INCERTO" | "VUOTO";
  targa_status: "OK" | "INCERTO" | "VUOTO";
  litri_status: "OK" | "INCERTO" | "VUOTO";
};

export type CisternaSchedeExtractResult = {
  ok: true;
  needsReview: boolean;
  rows: CisternaSchedeExtractRow[];
  stats: {
    total: number;
    okRows: number;
    reviewRows: number;
  };
  rawText: string;
};

type CisternaSchedeExtractEnvelope = {
  ok?: boolean;
  status?: string;
  message?: string;
  data?: {
    result?: Partial<CisternaSchedeExtractResult> | null;
    providerTarget?: unknown;
    traceEntryId?: string;
  };
};

function getConfiguredBaseUrl(): string {
  const configured = import.meta.env.VITE_INTERNAL_AI_BACKEND_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://127.0.0.1:${INTERNAL_AI_SERVER_ADAPTER_PORT}`;
    }
  }

  throw new Error("Backend OpenAI non raggiungibile. Configura VITE_INTERNAL_AI_BACKEND_URL.");
}

function readAsBase64(file: Blob): Promise<string> {
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

async function parseEnvelope(response: Response): Promise<CisternaDocumentoExtractEnvelope> {
  try {
    return (await response.json()) as CisternaDocumentoExtractEnvelope;
  } catch {
    return {};
  }
}

function normalizeResult(result: Partial<CisternaDocumentoExtractResult>): CisternaDocumentoExtractResult {
  return {
    tipoDocumento:
      result.tipoDocumento === "fattura" || result.tipoDocumento === "bollettino"
        ? result.tipoDocumento
        : null,
    fornitore: typeof result.fornitore === "string" ? result.fornitore : null,
    destinatario: typeof result.destinatario === "string" ? result.destinatario : null,
    numeroDocumento: typeof result.numeroDocumento === "string" ? result.numeroDocumento : null,
    dataDocumento: typeof result.dataDocumento === "string" ? result.dataDocumento : null,
    yearMonth: typeof result.yearMonth === "string" ? result.yearMonth : null,
    litriTotali: typeof result.litriTotali === "number" && Number.isFinite(result.litriTotali) ? result.litriTotali : null,
    totaleDocumento:
      typeof result.totaleDocumento === "number" && Number.isFinite(result.totaleDocumento)
        ? result.totaleDocumento
        : null,
    valuta: result.valuta === "EUR" || result.valuta === "CHF" ? result.valuta : null,
    prodotto: typeof result.prodotto === "string" ? result.prodotto : null,
    testo: typeof result.testo === "string" ? result.testo : null,
    daVerificare: Boolean(result.daVerificare),
    motivoVerifica: typeof result.motivoVerifica === "string" ? result.motivoVerifica : null,
  };
}

function normalizeSchedaStatus(value: unknown): "OK" | "INCERTO" | "VUOTO" {
  return value === "OK" || value === "INCERTO" || value === "VUOTO" ? value : "VUOTO";
}

function normalizeSchedeResult(result: Partial<CisternaSchedeExtractResult>): CisternaSchedeExtractResult {
  const rows = Array.isArray(result.rows)
    ? result.rows.map((row, index) => ({
        rowIndex:
          typeof row?.rowIndex === "number" && Number.isFinite(row.rowIndex)
            ? row.rowIndex
            : index,
        data_raw: typeof row?.data_raw === "string" ? row.data_raw : "",
        targa_raw: typeof row?.targa_raw === "string" ? row.targa_raw : "",
        litri_raw: typeof row?.litri_raw === "string" ? row.litri_raw : "",
        data_status: normalizeSchedaStatus(row?.data_status),
        targa_status: normalizeSchedaStatus(row?.targa_status),
        litri_status: normalizeSchedaStatus(row?.litri_status),
      }))
    : [];
  const reviewRows =
    typeof result.stats?.reviewRows === "number" && Number.isFinite(result.stats.reviewRows)
      ? result.stats.reviewRows
      : rows.filter(
          (row) =>
            row.data_status !== "OK" ||
            row.targa_status !== "OK" ||
            row.litri_status !== "OK",
        ).length;

  return {
    ok: true,
    needsReview: Boolean(result.needsReview) || reviewRows > 0,
    rows,
    stats: {
      total:
        typeof result.stats?.total === "number" && Number.isFinite(result.stats.total)
          ? result.stats.total
          : rows.length,
      okRows:
        typeof result.stats?.okRows === "number" && Number.isFinite(result.stats.okRows)
          ? result.stats.okRows
          : rows.length - reviewRows,
      reviewRows,
    },
    rawText: typeof result.rawText === "string" ? result.rawText : "",
  };
}

function readBackendErrorMessage(status: string | undefined, fallback: string): string {
  if (status === "provider_not_configured") {
    return "Servizio IA non configurato. Contatta l'amministratore.";
  }
  if (status === "validation_error") {
    return "File non valido. Verifica che sia un PDF o un'immagine supportata.";
  }
  if (status === "upstream_error") {
    return "Estrazione IA non riuscita. Verifica file e riprova.";
  }
  return fallback;
}

async function callCisternaDocumentoAnalyze(args: {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}): Promise<CisternaDocumentoExtractResult> {
  let response: Response;
  try {
    response = await fetch(`${getConfiguredBaseUrl()}${CISTERNA_DOCUMENTO_ANALYZE_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        profile: "documento_cisterna",
        fileName: args.fileName,
        mimeType: args.mimeType,
        contentBase64: args.contentBase64,
        providerRequired: true,
      }),
    });
  } catch {
    throw new Error("Servizio IA non raggiungibile. Verifica la connessione.");
  }

  const envelope = await parseEnvelope(response);
  if (!response.ok || envelope.ok === false) {
    throw new Error(readBackendErrorMessage(envelope.status, envelope.message || "Errore durante l'analisi."));
  }

  if (!envelope.data?.result) {
    throw new Error("Risposta IA non valida. Riprova.");
  }

  return normalizeResult(envelope.data.result);
}

export async function extractCisternaSchedeCells(
  cells: Array<{
    rowIndex: number;
    dataImage: File | Blob;
    targaImage: File | Blob;
    litriImage: File | Blob;
  }>,
): Promise<CisternaSchedeExtractResult> {
  const payloadCells = await Promise.all(
    cells.map(async (cell, index) => ({
      rowIndex: Number.isFinite(cell.rowIndex) ? cell.rowIndex : index,
      dataBase64: await readAsBase64(cell.dataImage),
      targaBase64: await readAsBase64(cell.targaImage),
      litriBase64: await readAsBase64(cell.litriImage),
    })),
  );

  let response: Response;
  try {
    response = await fetch(`${getConfiguredBaseUrl()}${CISTERNA_SCHEDE_ANALYZE_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        profile: "scheda_cisterna",
        cells: payloadCells,
        providerRequired: true,
      }),
    });
  } catch {
    throw new Error("Servizio IA non raggiungibile. Verifica la connessione.");
  }

  const envelope = (await parseEnvelope(response)) as CisternaSchedeExtractEnvelope;
  if (!response.ok || envelope.ok === false) {
    throw new Error(readBackendErrorMessage(envelope.status, envelope.message || "Errore durante l'analisi."));
  }

  if (!envelope.data?.result) {
    throw new Error("Risposta IA non valida. Riprova.");
  }

  return normalizeSchedeResult(envelope.data.result);
}

export async function extractCisternaDocumentoFromPdf(
  pdfFile: File,
  originalFileName?: string,
): Promise<CisternaDocumentoExtractResult> {
  const contentBase64 = await readAsBase64(pdfFile);
  return callCisternaDocumentoAnalyze({
    fileName: originalFileName || pdfFile.name || "documento-cisterna.pdf",
    mimeType: pdfFile.type || "application/pdf",
    contentBase64,
  });
}

export async function extractCisternaDocumentoFromImage(
  imageFile: File,
  originalFileName?: string,
): Promise<CisternaDocumentoExtractResult> {
  const contentBase64 = await readAsBase64(imageFile);
  return callCisternaDocumentoAnalyze({
    fileName: originalFileName || imageFile.name || "documento-cisterna.jpg",
    mimeType: imageFile.type || "image/jpeg",
    contentBase64,
  });
}

export { CISTERNA_DOCUMENTO_ANALYZE_PATH, CISTERNA_SCHEDE_ANALYZE_PATH };
