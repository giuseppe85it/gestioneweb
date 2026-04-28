import { readNextUnifiedCollection } from "./nextUnifiedReadRegistryDomain";

/*
 * Riferimento correlato: readNextMezzoDocumentiCostiSnapshot
 * (src/next/domain/nextDocumentiCostiDomain.ts:2313). Questo reader resta
 * separato perche' espone un contratto documentale puro, senza costi.
 */

type RawRecord = Record<string, unknown>;

const DOCUMENTI_MEZZI_KEY = "@documenti_mezzi" as const;
const DOCUMENTI_MAGAZZINO_KEY = "@documenti_magazzino" as const;
const DOCUMENTI_GENERICI_KEY = "@documenti_generici" as const;
const DOCUMENT_SOURCE_KEYS = [DOCUMENTI_MEZZI_KEY, DOCUMENTI_MAGAZZINO_KEY, DOCUMENTI_GENERICI_KEY] as const;

export const NEXT_DOCUMENTI_MEZZO_DOMAIN = {
  code: "D12-MEZ-DOCUMENTI",
  name: "Documenti completi per mezzo",
  logicalDatasets: DOCUMENT_SOURCE_KEYS,
  activeReadOnlyDatasets: DOCUMENT_SOURCE_KEYS,
} as const;

export type NextDocumentoMezzoSourceKey =
  | "@documenti_mezzi"
  | "@documenti_magazzino"
  | "@documenti_generici";

export type NextDocumentoMezzoMatchKind = "exact" | "fuzzy" | "none";

export type NextDocumentoMezzoItem = {
  id: string;
  sourceKey: NextDocumentoMezzoSourceKey;
  sourceDocId: string;
  targaRichiesta: string;
  targa: string | null;
  targaMatch: string | null;
  matchKind: NextDocumentoMezzoMatchKind;
  tipoDocumento: string | null;
  categoria: "libretto" | "fattura" | "preventivo" | "certificato" | "allegato" | "altro";
  titolo: string;
  descrizione: string | null;
  fornitore: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  timestamp: number | null;
  importo: number | null;
  valuta: "EUR" | "CHF" | "UNKNOWN";
  fileUrl: string | null;
  nomeFile: string | null;
  mimeType: string | null;
  daVerificare: boolean;
  raw: Record<string, unknown>;
};

export type NextMezzoDocumentiCounts = {
  total: number; documentiMezzo: number; documentiMagazzino: number; documentiGenerici: number;
  libretti: number; fatture: number; preventivi: number; certificati: number; allegati: number; altri: number;
  withFile: number; withoutFile: number; fuzzyMatches: number; unreadableRecords: number;
};

export type NextMezzoDocumentiSnapshot = {
  domainCode: "D12-MEZ-DOCUMENTI";
  domainName: "Documenti completi per mezzo";
  generatedAt: string;
  targa: string;
  targaNormalized: string;
  logicalDatasets: readonly ["@documenti_mezzi", "@documenti_magazzino", "@documenti_generici"];
  activeReadOnlyDatasets: readonly ["@documenti_mezzi", "@documenti_magazzino", "@documenti_generici"];
  items: NextDocumentoMezzoItem[];
  bySource: Record<NextDocumentoMezzoSourceKey, NextDocumentoMezzoItem[]>;
  counts: NextMezzoDocumentiCounts;
  limitations: string[];
};

function normalizeText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  return normalized || null;
}

export function normalizeNextDocumentiMezzoTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isFuzzySameTarga(candidate: string, target: string): boolean {
  if (!candidate || !target || candidate === target) return false;
  if (Math.abs(candidate.length - target.length) > 1) return false;
  const minLength = Math.min(candidate.length, target.length);
  let diff = 0;
  for (let index = 0; index < minLength; index += 1) {
    if (candidate[index] !== target[index]) diff += 1;
    if (diff > 1) return false;
  }
  return true;
}

export function isNextDocumentiMezzoSameTarga(candidate: unknown, target: unknown): boolean {
  const normalizedCandidate = normalizeNextDocumentiMezzoTarga(candidate);
  const normalizedTarget = normalizeNextDocumentiMezzoTarga(target);
  return normalizedCandidate === normalizedTarget || isFuzzySameTarga(normalizedCandidate, normalizedTarget);
}

function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === "function") return Number(toMillis.call(value));
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: unknown }).seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const raw = normalizeOptionalText(value);
  if (!raw) return null;
  const numeric = Number(raw.replace(",", "."));
  if (Number.isFinite(numeric)) return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = normalizeOptionalText(value);
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function firstUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return normalizeOptionalText(value.find((entry) => typeof entry === "string"));
  return null;
}

function resolveTargaCandidates(record: RawRecord): string[] {
  const metadatiMezzo = asRecord(record.metadatiMezzo);
  const mezzo = asRecord(record.mezzo);
  const destinatario = asRecord(record.destinatario);
  return [
    record.targa,
    record.mezzoTarga,
    metadatiMezzo?.targa,
    record.targaCamion,
    record.targaRimorchio,
    record.targaMotrice,
    record.targaMezzo,
    mezzo?.targa,
    destinatario?.targa,
  ].map(normalizeNextDocumentiMezzoTarga).filter(Boolean);
}

function resolveTargaMatch(candidates: string[], target: string): { value: string | null; kind: NextDocumentoMezzoMatchKind } {
  const exact = candidates.find((entry) => entry === target);
  if (exact) return { value: exact, kind: "exact" };
  const fuzzy = candidates.find((entry) => isFuzzySameTarga(entry, target));
  return fuzzy ? { value: fuzzy, kind: "fuzzy" } : { value: null, kind: "none" };
}

function resolveCategoria(tipoDocumento: string | null, record: RawRecord): NextDocumentoMezzoItem["categoria"] {
  const text = normalizeText([tipoDocumento, record.categoria, record.archiveCategory, record.nomeFile].join(" ")).toLowerCase();
  if (/libretto/.test(text)) return "libretto";
  if (/fattura|invoice/.test(text)) return "fattura";
  if (/preventivo|offerta/.test(text)) return "preventivo";
  if (/certificat/.test(text)) return "certificato";
  if (/allegat|documento/.test(text)) return "allegato";
  return "altro";
}

function resolveValuta(value: unknown): NextDocumentoMezzoItem["valuta"] {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "EUR" || normalized === "CHF") return normalized;
  return "UNKNOWN";
}

function resolveBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const normalized = normalizeText(value).toLowerCase();
  return ["true", "si", "sì", "1", "yes"].includes(normalized);
}

function sortByTimestampDesc(items: NextDocumentoMezzoItem[]): NextDocumentoMezzoItem[] {
  return [...items].sort((left, right) => (right.timestamp ?? -1) - (left.timestamp ?? -1));
}

function mapDocumentRecord(
  sourceKey: NextDocumentoMezzoSourceKey,
  record: RawRecord & { __docId: string },
  target: string,
): NextDocumentoMezzoItem | null {
  const match = resolveTargaMatch(resolveTargaCandidates(record), target);
  if (match.kind === "none") return null;
  const tipoDocumento = normalizeOptionalText(record.tipoDocumento ?? record.tipo ?? record.documentType);
  const dataRaw = record.dataDocumento ?? record.dataPreventivo ?? record.data ?? record.createdAt ?? record.timestamp;
  const fornitore = normalizeOptionalText(record.fornitore ?? record.fornitoreNome ?? record.supplier);
  const numeroDocumento = normalizeOptionalText(record.numeroDocumento ?? record.numeroPreventivo ?? record.numero);
  const categoria = resolveCategoria(tipoDocumento, record);
  const fileUrl = firstUrl(record.fileUrl ?? record.pdfUrl ?? record.url ?? record.downloadUrl ?? record.imageUrls);
  const titleParts = [tipoDocumento ?? categoria, numeroDocumento, fornitore].filter(Boolean);
  return {
    id: `${sourceKey}:${record.__docId}`,
    sourceKey,
    sourceDocId: record.__docId,
    targaRichiesta: target,
    targa: match.value,
    targaMatch: match.value,
    matchKind: match.kind,
    tipoDocumento,
    categoria,
    titolo: titleParts.join(" - ") || "Documento",
    descrizione: normalizeOptionalText(record.descrizione ?? record.oggetto ?? record.note),
    fornitore,
    numeroDocumento,
    dataDocumento: normalizeOptionalText(dataRaw),
    timestamp: toTimestamp(dataRaw),
    importo: toNumber(record.importo ?? record.totaleDocumento ?? record.totale ?? record.total),
    valuta: resolveValuta(record.valuta ?? record.currency),
    fileUrl,
    nomeFile: normalizeOptionalText(record.nomeFile ?? record.fileName ?? record.filename),
    mimeType: normalizeOptionalText(record.mimeType ?? record.contentType),
    daVerificare: resolveBoolean(record.daVerificare),
    raw: record,
  };
}

function buildCounts(items: NextDocumentoMezzoItem[]): NextMezzoDocumentiCounts {
  return {
    total: items.length,
    documentiMezzo: items.filter((item) => item.sourceKey === DOCUMENTI_MEZZI_KEY).length,
    documentiMagazzino: items.filter((item) => item.sourceKey === DOCUMENTI_MAGAZZINO_KEY).length,
    documentiGenerici: items.filter((item) => item.sourceKey === DOCUMENTI_GENERICI_KEY).length,
    libretti: items.filter((item) => item.categoria === "libretto").length,
    fatture: items.filter((item) => item.categoria === "fattura").length,
    preventivi: items.filter((item) => item.categoria === "preventivo").length,
    certificati: items.filter((item) => item.categoria === "certificato").length,
    allegati: items.filter((item) => item.categoria === "allegato").length,
    altri: items.filter((item) => item.categoria === "altro").length,
    withFile: items.filter((item) => Boolean(item.fileUrl)).length,
    withoutFile: items.filter((item) => !item.fileUrl).length,
    fuzzyMatches: items.filter((item) => item.matchKind === "fuzzy").length,
    unreadableRecords: 0,
  };
}

export async function readNextMezzoDocumentiSnapshot(targa: string): Promise<NextMezzoDocumentiSnapshot> {
  const targaNormalized = normalizeNextDocumentiMezzoTarga(targa);
  const limitations: string[] = [];
  if (!targaNormalized) limitations.push("Targa non valida o assente.");

  const collectionResults = await Promise.all(
    DOCUMENT_SOURCE_KEYS.map((collectionName) => readNextUnifiedCollection({ collectionName })),
  );

  const seen = new Set<string>();
  const items = sortByTimestampDesc(collectionResults.flatMap((result, index) => {
    const sourceKey = DOCUMENT_SOURCE_KEYS[index];
    if (result.status !== "ready") {
      limitations.push(`${result.sourceId}: ${result.notes.join(" ") || "collection non leggibile"}.`);
    }
    if (!targaNormalized) return [];
    return result.records.flatMap((record) => {
      const dedupKey = `${sourceKey}:${record.__docId}`;
      if (seen.has(dedupKey)) return [];
      seen.add(dedupKey);
      return mapDocumentRecord(sourceKey, record, targaNormalized) ?? [];
    });
  }));

  if (targaNormalized && items.length === 0) {
    limitations.push("Nessun documento collegato alla targa indicata.");
  }

  const bySource: Record<NextDocumentoMezzoSourceKey, NextDocumentoMezzoItem[]> = {
    [DOCUMENTI_MEZZI_KEY]: items.filter((item) => item.sourceKey === DOCUMENTI_MEZZI_KEY),
    [DOCUMENTI_MAGAZZINO_KEY]: items.filter((item) => item.sourceKey === DOCUMENTI_MAGAZZINO_KEY),
    [DOCUMENTI_GENERICI_KEY]: items.filter((item) => item.sourceKey === DOCUMENTI_GENERICI_KEY),
  };

  return {
    domainCode: NEXT_DOCUMENTI_MEZZO_DOMAIN.code,
    domainName: NEXT_DOCUMENTI_MEZZO_DOMAIN.name,
    generatedAt: new Date().toISOString(),
    targa,
    targaNormalized,
    logicalDatasets: NEXT_DOCUMENTI_MEZZO_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_DOCUMENTI_MEZZO_DOMAIN.activeReadOnlyDatasets,
    items,
    bySource,
    counts: buildCounts(items),
    limitations,
  };
}
