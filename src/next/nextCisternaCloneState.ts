const NEXT_CISTERNA_PARAMS_KEY = "@next_clone:cisterna:parametri";
const NEXT_CISTERNA_DOCUMENTS_KEY = "@next_clone:cisterna:documenti";
const NEXT_CISTERNA_SCHEDE_KEY = "@next_clone:cisterna:schede";

export type NextCisternaCloneParametro = {
  monthKey: string;
  cambioEurChf: number;
  updatedAt: number;
};

export type NextCisternaCloneDocumento = {
  id: string;
  tipoDocumento: string;
  fornitore: string;
  destinatario: string;
  numeroDocumento: string;
  dataDocumento: string;
  litriTotali: number | null;
  totaleDocumento: number | null;
  valuta: "" | "EUR" | "CHF";
  prodotto: string;
  testo: string;
  needsReview: boolean;
  motivoVerifica: string;
  nomeFile: string | null;
  fileUrl: string | null;
  createdAt: number;
  updatedAt: number;
  source: "next-clone-ia";
  monthKey: string;
};

export type NextCisternaCloneSchedaRow = {
  data: string;
  targa: string;
  nome: string;
  litri: number | null;
  azienda: string;
  statoRevisione: string;
};

export type NextCisternaCloneScheda = {
  id: string;
  createdAt: number;
  updatedAt: number;
  source: "manual" | "ia";
  rowCount: number;
  rows: NextCisternaCloneSchedaRow[];
  needsReview: boolean;
  mese: string;
  yearMonth: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readNextCisternaCloneParametri(): NextCisternaCloneParametro[] {
  const parsed = readJson<unknown[]>(NEXT_CISTERNA_PARAMS_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is NextCisternaCloneParametro =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as { monthKey?: unknown }).monthKey === "string" &&
      typeof (entry as { cambioEurChf?: unknown }).cambioEurChf === "number",
  );
}

export function upsertNextCisternaCloneParametro(record: NextCisternaCloneParametro) {
  const current = readNextCisternaCloneParametri().filter((entry) => entry.monthKey !== record.monthKey);
  writeJson(NEXT_CISTERNA_PARAMS_KEY, [record, ...current]);
}

export function readNextCisternaCloneDocumenti(): NextCisternaCloneDocumento[] {
  const parsed = readJson<unknown[]>(NEXT_CISTERNA_DOCUMENTS_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is NextCisternaCloneDocumento =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as { id?: unknown }).id === "string" &&
      typeof (entry as { source?: unknown }).source === "string",
  );
}

export function upsertNextCisternaCloneDocumento(record: NextCisternaCloneDocumento) {
  const current = readNextCisternaCloneDocumenti().filter((entry) => entry.id !== record.id);
  writeJson(NEXT_CISTERNA_DOCUMENTS_KEY, [record, ...current]);
}

export function readNextCisternaCloneSchede(): NextCisternaCloneScheda[] {
  const parsed = readJson<unknown[]>(NEXT_CISTERNA_SCHEDE_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is NextCisternaCloneScheda =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as { id?: unknown }).id === "string" &&
      Array.isArray((entry as { rows?: unknown }).rows),
  );
}

export function upsertNextCisternaCloneScheda(record: NextCisternaCloneScheda) {
  const current = readNextCisternaCloneSchede().filter((entry) => entry.id !== record.id);
  writeJson(NEXT_CISTERNA_SCHEDE_KEY, [record, ...current]);
}
