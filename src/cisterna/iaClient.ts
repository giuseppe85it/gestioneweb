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
  data?: CisternaSchedaExtractResult;
  error?: string;
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

export async function callEstrattiSchedaCisterna(
  fileUrl: string
): Promise<CisternaSchedaExtractResult> {
  const response = await fetch(CISTERNA_SCHEDE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
  });

  const text = await response.text();
  let parsed: IASchedeResponse | null = null;

  try {
    parsed = JSON.parse(text) as IASchedeResponse;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(parsed?.error || `Errore IA schede cisterna: HTTP ${response.status}`);
  }

  if (!parsed?.success || !parsed.data) {
    throw new Error(parsed?.error || "Risposta IA schede cisterna non valida.");
  }

  return parsed.data;
}
