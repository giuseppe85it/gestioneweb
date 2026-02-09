import type { CisternaDocumento, CisternaSchedaExtractResult } from "./types";

const CISTERNA_EXTRACT_ENDPOINT =
  "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/ia_cisterna_extract";
const CISTERNA_SCHEDE_ENDPOINT =
  "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneSchedaCisterna";

type IAResponse = {
  success?: boolean;
  data?: CisternaDocumento;
  error?: string;
};

type IASchedeResponse = {
  success?: boolean;
  data?: CisternaSchedaExtractResult | Record<string, unknown>;
  error?: string;
  details?: string;
  [key: string]: unknown;
};

export async function extractCisternaFromFileUrl(input: {
  fileUrl: string;
  mimeType?: string;
  nomeFile?: string;
}): Promise<CisternaDocumento> {
  const response = await fetch(CISTERNA_EXTRACT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  let parsed: IAResponse | null = null;

  try {
    parsed = JSON.parse(text) as IAResponse;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(parsed?.error || `Errore IA cisterna: HTTP ${response.status}`);
  }

  if (!parsed?.success || !parsed.data) {
    throw new Error(parsed?.error || "Risposta IA cisterna non valida.");
  }

  return parsed.data;
}

export async function callEstrattiSchedaCisterna(input: {
  fileUrl?: string;
  rows?: Array<Record<string, unknown>>;
  mode?: string;
}): Promise<Response> {
  return fetch(CISTERNA_SCHEDE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function parseEstrattiSchedaCisternaResponse(
  response: Response
): Promise<any> {
  const text = await response.text();
  let parsed: IASchedeResponse | null = null;

  try {
    parsed = JSON.parse(text) as IASchedeResponse;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    console.error(`estrazioneSchedaCisterna HTTP ${response.status}: ${text}`);
    return {
      ok: false,
      success: false,
      needsReview: true,
      reason: `HTTP_${response.status}`,
      rawText: text,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      success: false,
      needsReview: true,
      reason: "RESPONSE_PARSE_ERROR",
      rawText: text,
    };
  }

  const normalized: Record<string, unknown> = { ...parsed };
  if (normalized.ok === undefined && normalized.success !== undefined) {
    normalized.ok = normalized.success;
  }
  if (normalized.success === undefined && normalized.ok !== undefined) {
    normalized.success = normalized.ok;
  }
  if (normalized.needsReview === undefined) {
    normalized.needsReview = true;
  }
  if (!Array.isArray(normalized.rows)) {
    normalized.rows = [];
  }
  if (Array.isArray(normalized.rows)) {
    normalized.rows = normalized.rows.map((row: any) => {
      if (!row || typeof row !== "object") return {};
      const macchinaRaw =
        row.macchina_raw ??
        row.targa_raw ??
        row.macchina ??
        row.targa ??
        row.macchinaTarga ??
        "";
      const dataRaw = row.data_raw ?? row.data ?? "";
      const litriRaw =
        row.litri_erogati_raw ?? row.litri_raw ?? row.litriErogati ?? row.litri ?? "";
      const macchina = row.macchina ?? row.targa ?? row.macchinaTarga ?? "";
      const litriPompa =
        row.litriPompa ?? row.contatoreInizio ?? row.cont_inizio ?? row.cont_ini ?? "";
      const consumoEffettivo =
        row.consumoEffettivo ?? row.contatoreFine ?? row.cont_fine ?? row.cont_fin ?? "";
      const litriErogati = row.litriErogati ?? row.litri ?? "";
      return {
        ...row,
        data_raw: dataRaw,
        macchina_raw: macchinaRaw,
        litri_erogati_raw: litriRaw,
        data: row.data ?? null,
        ora: row.ora ?? null,
        macchina,
        litriPompa,
        litriErogati,
        consumoEffettivo,
        autista: row.autista ?? row.autistaNome ?? "",
        note: row.note ?? "",
      };
    });
  }
  if (normalized.rawLines === undefined && Array.isArray(normalized.tsv_lines)) {
    normalized.rawLines = normalized.tsv_lines;
  }

  if (normalized.data && typeof normalized.data === "object") {
    return { ...normalized.data, ...normalized };
  }

  return normalized;
}

export async function callEstrattiSchedaCisternaCells(input: {
  cells: Array<{
    rowIndex: number;
    data_b64: string;
    targa_b64: string;
    litri_b64: string;
  }>;
  meta?: Record<string, unknown>;
}): Promise<any> {
  const response = await fetch(CISTERNA_SCHEDE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "cells", ...input }),
  });

  const text = await response.text();
  let parsed: IASchedeResponse | null = null;

  try {
    parsed = JSON.parse(text) as IASchedeResponse;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    console.error(`estrazioneSchedaCisterna HTTP ${response.status}: ${text}`);
    return {
      ok: false,
      success: false,
      needsReview: true,
      reason: `HTTP_${response.status}`,
      rawText: text,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      success: false,
      needsReview: true,
      reason: "RESPONSE_PARSE_ERROR",
      rawText: text,
    };
  }

  if (parsed.ok === undefined && parsed.success !== undefined) {
    parsed.ok = parsed.success;
  }
  if (parsed.success === undefined && parsed.ok !== undefined) {
    parsed.success = parsed.ok;
  }
  if (parsed.needsReview === undefined) {
    parsed.needsReview = true;
  }
  if (!Array.isArray(parsed.rows)) {
    parsed.rows = [];
  }

  return parsed;
}
