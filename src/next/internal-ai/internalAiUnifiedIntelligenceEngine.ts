import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import { readNextMezzoOperativitaTecnicaSnapshot } from "../nextOperativitaTecnicaDomain";
import {
  buildNextMezzoMaterialiMovimentiSnapshot,
  readNextMaterialiMovimentiSnapshot,
} from "../domain/nextMaterialiMovimentiDomain";
import { readNextCentroControlloSnapshot } from "../domain/nextCentroControlloDomain";
import { readNextCisternaSnapshot } from "../domain/nextCisternaDomain";
import { readNextColleghiSnapshot } from "../domain/nextColleghiDomain";
import {
  readNextDocumentiCostiFleetSnapshot,
  readNextDocumentiCostiProcurementSupportSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
} from "../domain/nextDocumentiCostiDomain";
import { readNextFornitoriSnapshot } from "../domain/nextFornitoriDomain";
import { readNextInventarioSnapshot } from "../domain/nextInventarioDomain";
import { readNextLibrettiExportSnapshot } from "../domain/nextLibrettiExportDomain";
import {
  readNextLavoriEseguitiSnapshot,
  readNextLavoriInAttesaSnapshot,
} from "../domain/nextLavoriDomain";
import { readNextMezzoManutenzioniGommeSnapshot } from "../domain/nextManutenzioniGommeDomain";
import { readNextOperativitaGlobaleSnapshot } from "../domain/nextOperativitaGlobaleDomain";
import { readNextProcurementSnapshot } from "../domain/nextProcurementDomain";
import { readNextMezzoRifornimentiSnapshot } from "../domain/nextRifornimentiDomain";
import {
  readNextUnifiedCollection,
  readNextUnifiedLocalStorageKey,
  readNextUnifiedStorageDocument,
  readNextUnifiedStoragePrefix,
  type NextUnifiedCollectionReadResult,
  type NextUnifiedLocalStorageReadResult,
  type NextUnifiedStorageDocumentReadResult,
  type NextUnifiedStoragePrefixReadResult,
} from "../domain/nextUnifiedReadRegistryDomain";
import {
  createDefaultInternalAiReportPeriodInput,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import type {
  InternalAiApprovalState,
  InternalAiChatExecutionStatus,
  InternalAiChatIntent,
  InternalAiChatMessageReference,
  InternalAiPreviewState,
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
  InternalAiVehicleReportPreview,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSectionStatus,
  InternalAiVehicleReportSource,
} from "./internalAiTypes";

type UnifiedSourceKind =
  | "next_reader"
  | "raw_storage_doc"
  | "raw_collection"
  | "storage_prefix"
  | "local_storage"
  | "guarded";

type UnifiedSourceStatus = "ready" | "partial" | "guarded" | "missing" | "error";

type UnifiedRecord = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  entityLabel: string;
  summary: string;
  ts: number | null;
  reliability: "alta" | "media" | "bassa";
  matchKeys: {
    targa: string[];
    mezzoId: string[];
    autistaBadge: string[];
    autistaNome: string[];
    refIds: string[];
    documentIds: string[];
    labels: string[];
    storagePaths: string[];
  };
  flags: string[];
};

type UnifiedSourceSnapshot = {
  sourceId: string;
  sourceLabel: string;
  domainCode: string;
  kind: UnifiedSourceKind;
  status: UnifiedSourceStatus;
  records: UnifiedRecord[];
  notes: string[];
  readerLabel: string;
};

type UnifiedRegistrySnapshot = {
  canonicalDocLabel: string;
  generatedAt: string;
  sources: UnifiedSourceSnapshot[];
  counts: {
    totalSources: number;
    readySources: number;
    partialSources: number;
    guardedSources: number;
    missingSources: number;
    errorSources: number;
    totalRecords: number;
  };
};

export type InternalAiUnifiedRegistrySummary = {
  canonicalDocLabel: string;
  generatedAt: string;
  counts: UnifiedRegistrySnapshot["counts"];
  highlightedSources: Array<{
    sourceId: string;
    sourceLabel: string;
    domainCode: string;
    status: UnifiedSourceStatus;
    readerLabel: string;
  }>;
};

type UnifiedOutputPreference = "thread" | "modale" | "pdf" | "report";

type InternalAiUnifiedScopeId =
  | "quadro"
  | "criticita"
  | "scadenze"
  | "lavori"
  | "manutenzioni"
  | "gomme"
  | "rifornimenti"
  | "materiali"
  | "inventario"
  | "ordini"
  | "preventivi"
  | "fornitori"
  | "documenti"
  | "costi"
  | "cisterna"
  | "attenzione_oggi";

type UnifiedQuerySpec = {
  visiblePrompt: string;
  normalizedPrompt: string;
  normalizedTarga: string | null;
  periodInput: InternalAiReportPeriodInput;
  outputPreference: UnifiedOutputPreference;
  scopes: InternalAiUnifiedScopeId[];
  asksFullOverview: boolean;
  asksAttentionToday: boolean;
};

type InternalAiUnifiedExecutionResult = {
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  assistantText: string;
  references: InternalAiChatMessageReference[];
  report:
    | {
        status: "ready";
        normalizedTarga: string;
        message: string;
        preview: InternalAiVehicleReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        message: string;
        preview: null;
      }
    | null;
};

type UnifiedSourceDescriptor = {
  sourceId: string;
  sourceLabel: string;
  domainCode: string;
  kind: UnifiedSourceKind;
  readerLabel: string;
  storageKey?: string;
  preferredArrayKeys?: string[];
  collectionName?: string;
  storagePrefix?: string;
  localStorageKey?: string;
};

type UnifiedSectionBuild = {
  section: InternalAiVehicleReportSection;
  sources: InternalAiVehicleReportSource[];
  keyPoints: string[];
  missingData: string[];
  evidences: string[];
};

type LinkedUnifiedRecord = {
  source: UnifiedSourceSnapshot;
  record: UnifiedRecord;
  score: number;
  linkReliability: "alta" | "media" | "bassa";
};

const CANONICAL_DATA_DOC_LABEL = "Fonte canonica dati: docs/data/MAPPA_COMPLETA_DATI.md";
const REGISTRY_CACHE_TTL_MS = 90 * 1000;
const UNIFIED_ENGINE_REFERENCE = "Motore: Unified Intelligence Engine";
const DOMAIN_REFERENCE_PREFIX = "Dominio rilevato: ";
const RELIABILITY_REFERENCE_PREFIX = "Affidabilita: ";

const PREVIEW_STATE: InternalAiPreviewState = {
  status: "preview_ready",
  updatedAt: new Date().toISOString(),
  note: "Preview generata in sola lettura dal motore unificato NEXT.",
};

const APPROVAL_STATE: InternalAiApprovalState = {
  status: "not_requested",
  requestedBy: "system",
  updatedAt: new Date().toISOString(),
  note: "Nessuna approvazione o scrittura business automatica.",
};

const ALL_OPERATIONAL_SCOPES: InternalAiUnifiedScopeId[] = [
  "criticita",
  "scadenze",
  "lavori",
  "manutenzioni",
  "gomme",
  "rifornimenti",
  "materiali",
  "inventario",
  "ordini",
  "preventivi",
  "fornitori",
  "documenti",
  "costi",
  "cisterna",
];

const SCOPE_PATTERNS: ReadonlyArray<{ scope: InternalAiUnifiedScopeId; patterns: string[] }> = [
  { scope: "quadro", patterns: ["quadro completo", "quadro", "completo", "tutte le fonti"] },
  { scope: "criticita", patterns: ["criticita", "criticita operative", "alert", "problemi", "segnalazioni", "controlli ko"] },
  { scope: "scadenze", patterns: ["scadenze", "revisione", "collaudo", "precollaudo"] },
  { scope: "lavori", patterns: ["lavori", "lavoro", "backlog"] },
  { scope: "manutenzioni", patterns: ["manutenzioni", "manutenzione"] },
  { scope: "gomme", patterns: ["gomme", "gomma"] },
  { scope: "rifornimenti", patterns: ["rifornimenti", "rifornimento", "consumi", "carburante", "gasolio", "diesel"] },
  { scope: "materiali", patterns: ["materiali", "movimenti materiali", "consegne materiale"] },
  { scope: "inventario", patterns: ["inventario", "magazzino"] },
  { scope: "ordini", patterns: ["ordini", "ordine", "arrivi"] },
  { scope: "preventivi", patterns: ["preventivi", "preventivo"] },
  { scope: "fornitori", patterns: ["fornitori", "fornitore", "listino"] },
  { scope: "documenti", patterns: ["documenti", "documento", "libretto", "allegati"] },
  { scope: "costi", patterns: ["costi", "costo", "analisi economica", "fatture"] },
  { scope: "cisterna", patterns: ["cisterna", "schede test", "caravate"] },
  { scope: "attenzione_oggi", patterns: ["attenzione oggi", "richiede attenzione oggi", "priorita oggi", "priorita operative"] },
];

const SCOPE_SOURCE_MAP: Record<InternalAiUnifiedScopeId, string[]> = {
  quadro: [],
  criticita: [
    "storage/@alerts_state",
    "storage/@segnalazioni_autisti_tmp",
    "storage/@controlli_mezzo_autisti",
    "storage/@storico_eventi_operativi",
    "storage/@lavori",
    "storage/@manutenzioni",
    "storage/@cambi_gomme_autisti_tmp",
    "storage/@gomme_eventi",
  ],
  scadenze: ["storage/@mezzi_aziendali", "storage/@alerts_state", "collection/@documenti_mezzi", "storage-path/mezzi_aziendali"],
  lavori: ["storage/@lavori"],
  manutenzioni: ["storage/@manutenzioni"],
  gomme: ["storage/@cambi_gomme_autisti_tmp", "storage/@gomme_eventi", "storage/@manutenzioni"],
  rifornimenti: ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"],
  materiali: ["storage/@materialiconsegnati", "storage-path/materials"],
  inventario: ["storage/@inventario", "storage-path/inventario"],
  ordini: ["storage/@ordini"],
  preventivi: ["storage/@preventivi", "storage/@preventivi_approvazioni", "storage-path/preventivi/ia"],
  fornitori: ["storage/@fornitori", "storage/@listino_prezzi"],
  documenti: ["collection/@documenti_mezzi", "collection/@documenti_magazzino", "collection/@documenti_generici", "storage-path/documenti_pdf", "storage-path/mezzi_aziendali"],
  costi: ["storage/@costiMezzo", "collection/@analisi_economica_mezzi"],
  cisterna: ["collection/@documenti_cisterna", "collection/@cisterna_schede_ia", "collection/@cisterna_parametri_mensili", "storage-path/documenti_pdf/cisterna", "storage-path/documenti_pdf/cisterna_schede"],
  attenzione_oggi: ["storage/@alerts_state", "storage/@segnalazioni_autisti_tmp", "storage/@controlli_mezzo_autisti", "storage/@ordini", "storage/@inventario", "storage/@storico_eventi_operativi"],
};

const UNIFIED_SOURCE_DESCRIPTORS: readonly UnifiedSourceDescriptor[] = [
  { sourceId: "storage/@mezzi_aziendali", sourceLabel: "Mezzi aziendali", domainCode: "D01", kind: "next_reader", readerLabel: "readNextAnagraficheFlottaSnapshot" },
  { sourceId: "storage/@colleghi", sourceLabel: "Colleghi", domainCode: "D01", kind: "next_reader", readerLabel: "readNextColleghiSnapshot" },
  { sourceId: "storage/@lavori", sourceLabel: "Lavori", domainCode: "D02", kind: "next_reader", readerLabel: "readNextLavoriInAttesaSnapshot + readNextLavoriEseguitiSnapshot" },
  { sourceId: "storage/@manutenzioni", sourceLabel: "Manutenzioni", domainCode: "D02", kind: "next_reader", readerLabel: "readNextOperativitaGlobaleSnapshot" },
  { sourceId: "storage/@cambi_gomme_autisti_tmp", sourceLabel: "Eventi gomme temporanei", domainCode: "D02", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@cambi_gomme_autisti_tmp" },
  { sourceId: "storage/@gomme_eventi", sourceLabel: "Eventi gomme ufficiali", domainCode: "D02", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@gomme_eventi" },
  { sourceId: "storage/@autisti_sessione_attive", sourceLabel: "Sessioni attive autisti", domainCode: "D03/D10", kind: "next_reader", readerLabel: "readNextCentroControlloSnapshot" },
  { sourceId: "storage/@storico_eventi_operativi", sourceLabel: "Storico eventi operativi", domainCode: "D03/D10", kind: "next_reader", readerLabel: "readNextCentroControlloSnapshot" },
  { sourceId: "storage/@richieste_attrezzature_autisti_tmp", sourceLabel: "Richieste attrezzature autisti", domainCode: "D03/D10", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@richieste_attrezzature_autisti_tmp" },
  { sourceId: "collection/autisti_eventi", sourceLabel: "Fallback eventi autisti legacy", domainCode: "D03", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "autisti_eventi" },
  { sourceId: "storage/@rifornimenti", sourceLabel: "Rifornimenti business", domainCode: "D04", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@rifornimenti" },
  { sourceId: "storage/@rifornimenti_autisti_tmp", sourceLabel: "Rifornimenti da campo", domainCode: "D04", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@rifornimenti_autisti_tmp" },
  { sourceId: "storage/@materialiconsegnati", sourceLabel: "Movimenti materiali", domainCode: "D05", kind: "next_reader", readerLabel: "readNextMaterialiMovimentiSnapshot" },
  { sourceId: "storage/@inventario", sourceLabel: "Inventario", domainCode: "D05", kind: "next_reader", readerLabel: "readNextInventarioSnapshot" },
  { sourceId: "storage/@attrezzature_cantieri", sourceLabel: "Attrezzature cantieri", domainCode: "D05", kind: "next_reader", readerLabel: "readNextOperativitaGlobaleSnapshot" },
  { sourceId: "storage/@ordini", sourceLabel: "Ordini", domainCode: "D06", kind: "next_reader", readerLabel: "readNextProcurementSnapshot" },
  { sourceId: "storage/@preventivi", sourceLabel: "Preventivi", domainCode: "D06", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@preventivi", preferredArrayKeys: ["preventivi", "items", "value"] },
  { sourceId: "storage/@listino_prezzi", sourceLabel: "Listino prezzi", domainCode: "D06", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@listino_prezzi", preferredArrayKeys: ["voci", "items", "value"] },
  { sourceId: "storage/@fornitori", sourceLabel: "Fornitori", domainCode: "D06", kind: "next_reader", readerLabel: "readNextFornitoriSnapshot" },
  { sourceId: "storage/@preventivi_approvazioni", sourceLabel: "Approvazioni preventivi", domainCode: "D06", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@preventivi_approvazioni" },
  { sourceId: "storage/@costiMezzo", sourceLabel: "Costi mezzo", domainCode: "D07/D08", kind: "next_reader", readerLabel: "readNextDocumentiCostiFleetSnapshot" },
  { sourceId: "collection/@documenti_mezzi", sourceLabel: "Documenti mezzi", domainCode: "D07/D08", kind: "next_reader", readerLabel: "readNextDocumentiCostiFleetSnapshot" },
  { sourceId: "collection/@documenti_magazzino", sourceLabel: "Documenti magazzino", domainCode: "D07/D08", kind: "next_reader", readerLabel: "readNextDocumentiCostiFleetSnapshot" },
  { sourceId: "collection/@documenti_generici", sourceLabel: "Documenti generici", domainCode: "D07/D08", kind: "next_reader", readerLabel: "readNextDocumentiCostiFleetSnapshot" },
  { sourceId: "collection/@analisi_economica_mezzi", sourceLabel: "Snapshot analisi economica", domainCode: "D08", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "@analisi_economica_mezzi" },
  { sourceId: "document/@impostazioni_app/gemini", sourceLabel: "Configurazione IA Gemini", domainCode: "D07", kind: "guarded", readerLabel: "Guard-rail: nessuna lettura client di segreti" },
  { sourceId: "collection/@documenti_cisterna", sourceLabel: "Documenti cisterna", domainCode: "D09", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "@documenti_cisterna" },
  { sourceId: "collection/@cisterna_schede_ia", sourceLabel: "Schede IA cisterna", domainCode: "D09", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "@cisterna_schede_ia" },
  { sourceId: "collection/@cisterna_parametri_mensili", sourceLabel: "Parametri mensili cisterna", domainCode: "D09", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "@cisterna_parametri_mensili" },
  { sourceId: "storage/@alerts_state", sourceLabel: "Stato alert", domainCode: "D10", kind: "next_reader", readerLabel: "readNextCentroControlloSnapshot" },
  { sourceId: "storage/@segnalazioni_autisti_tmp", sourceLabel: "Segnalazioni autisti", domainCode: "D10", kind: "next_reader", readerLabel: "readNextCentroControlloSnapshot" },
  { sourceId: "storage/@controlli_mezzo_autisti", sourceLabel: "Controlli mezzo autisti", domainCode: "D10", kind: "next_reader", readerLabel: "readNextCentroControlloSnapshot" },
  { sourceId: "storage-path/materials", sourceLabel: "Storage materiali", domainCode: "D05/D06", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "materials" },
  { sourceId: "storage-path/inventario", sourceLabel: "Foto inventario", domainCode: "D05", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "inventario" },
  { sourceId: "storage-path/autisti/segnalazioni", sourceLabel: "Allegati segnalazioni autisti", domainCode: "D03/D10", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "autisti/segnalazioni" },
  { sourceId: "storage-path/autisti/richieste-attrezzature", sourceLabel: "Allegati richieste attrezzature", domainCode: "D03/D10", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "autisti/richieste-attrezzature" },
  { sourceId: "storage-path/mezzi_aziendali", sourceLabel: "Libretti mezzi", domainCode: "D07", kind: "next_reader", readerLabel: "readNextLibrettiExportSnapshot" },
  { sourceId: "storage-path/documenti_pdf", sourceLabel: "Storage documenti PDF", domainCode: "D07", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "documenti_pdf" },
  { sourceId: "storage-path/documenti_pdf/cisterna", sourceLabel: "Storage documenti PDF cisterna", domainCode: "D09", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "documenti_pdf/cisterna" },
  { sourceId: "storage-path/documenti_pdf/cisterna_schede", sourceLabel: "Storage crop schede cisterna", domainCode: "D09", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "documenti_pdf/cisterna_schede" },
  { sourceId: "storage-path/preventivi/ia", sourceLabel: "Storage preventivi IA", domainCode: "D06", kind: "storage_prefix", readerLabel: "Listing Storage read-only prudente", storagePrefix: "preventivi/ia" },
  { sourceId: "localStorage/@autista_attivo_local", sourceLabel: "Autista attivo locale", domainCode: "D03", kind: "local_storage", readerLabel: "LocalStorage isolato browser", localStorageKey: "@autista_attivo_local" },
  { sourceId: "localStorage/@mezzo_attivo_autista_local", sourceLabel: "Mezzo attivo locale autista", domainCode: "D03", kind: "local_storage", readerLabel: "LocalStorage isolato browser", localStorageKey: "@mezzo_attivo_autista_local" },
];

let registryCache:
  | {
      expiresAt: number;
      value: UnifiedRegistrySnapshot;
    }
  | null = null;

let registryPromise: Promise<UnifiedRegistrySnapshot> | null = null;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function normalizeTargaList(values: Array<string | null | undefined>): string[] {
  return dedupeStrings(values.map((value) => normalizeNextMezzoTarga(value)));
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof candidate.toDate === "function") {
      const parsed = candidate.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : null;
    }
    if (typeof candidate.seconds === "number") {
      return candidate.seconds * 1000;
    }
    if (typeof candidate._seconds === "number") {
      return candidate._seconds * 1000;
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getTime();
  }

  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!dmy) {
    return null;
  }

  const year = dmy[3].length === 2 ? Number(`20${dmy[3]}`) : Number(dmy[3]);
  const month = Number(dmy[2]) - 1;
  const day = Number(dmy[1]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function limitRecords<T>(items: T[], limit = 140): T[] {
  return items.slice(0, limit);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("it-IT").format(value);
}

function formatDateLabel(value: number | string | null | undefined): string {
  if (value == null) {
    return "DA VERIFICARE";
  }

  const ts = typeof value === "number" ? value : toTimestamp(value);
  if (ts === null) {
    return typeof value === "string" ? value : "DA VERIFICARE";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
}

function buildPromptWithoutConsoleBlock(prompt: string): string {
  return prompt
    .replace(/\[CONSOLE IA UNIFICATA\][\s\S]*?\[\/CONSOLE IA UNIFICATA\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractConsoleValue(prompt: string, label: string): string | null {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = prompt.match(
    new RegExp(`\\[CONSOLE IA UNIFICATA\\][\\s\\S]*?${escapedLabel}:\\s*(.+?)(?:\\r?\\n|\\[\\/CONSOLE IA UNIFICATA\\])`, "i"),
  );
  return match?.[1]?.trim() || null;
}

function parseConsoleScopes(rawValue: string | null): InternalAiUnifiedScopeId[] {
  if (!rawValue) {
    return [];
  }

  const normalized = normalizeSearchText(rawValue);
  return Array.from(
    new Set(
      SCOPE_PATTERNS.filter((entry) =>
        entry.patterns.some((pattern) => normalized.includes(normalizeSearchText(pattern))),
      ).map((entry) => entry.scope),
    ),
  );
}

function parseOutputPreference(rawValue: string | null): UnifiedOutputPreference {
  const normalized = normalizeSearchText(rawValue ?? "");
  if (normalized.includes("pdf")) {
    return "pdf";
  }
  if (normalized.includes("modale")) {
    return "modale";
  }
  if (normalized.includes("report")) {
    return "report";
  }
  return "thread";
}

function inferOutputPreferenceFromPrompt(normalizedPrompt: string): UnifiedOutputPreference {
  if (normalizedPrompt.includes("pdf")) {
    return "pdf";
  }
  if (normalizedPrompt.includes("modale")) {
    return "modale";
  }
  if (
    normalizedPrompt.includes("crea report") ||
    normalizedPrompt.includes("fammi un report") ||
    normalizedPrompt.includes("report targa") ||
    normalizedPrompt.includes("report mezzo")
  ) {
    return "report";
  }
  return "thread";
}

function extractPromptTarga(prompt: string): string | null {
  const candidates = [
    ...prompt.matchAll(/\b([A-Z]{2}\s?\d{6})\b/gi),
    ...prompt.matchAll(/\b([A-Z]{2}\s?\d{3}[A-Z]{2})\b/gi),
    ...prompt.matchAll(/\b([A-Z]{1,2}\s?\d{5,7})\b/gi),
  ]
    .map((match) => normalizeNextMezzoTarga(match[1]))
    .filter(Boolean);

  return candidates[0] ?? null;
}

function parseUnifiedQuery(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): UnifiedQuerySpec {
  const visiblePrompt = buildPromptWithoutConsoleBlock(prompt);
  const targaFromConsole = normalizeNextMezzoTarga(extractConsoleValue(prompt, "Targa"));
  const normalizedTarga = targaFromConsole || extractPromptTarga(prompt);
  const normalizedPrompt = normalizeSearchText(visiblePrompt);
  const outputPreferenceFromConsole = parseOutputPreference(extractConsoleValue(prompt, "Output"));
  const outputPreference =
    outputPreferenceFromConsole !== "thread"
      ? outputPreferenceFromConsole
      : inferOutputPreferenceFromPrompt(normalizedPrompt);
  const scopesFromConsole = parseConsoleScopes(extractConsoleValue(prompt, "Ambiti"));
  const scopesFromPrompt = SCOPE_PATTERNS.filter((entry) =>
    entry.patterns.some((pattern) => normalizedPrompt.includes(normalizeSearchText(pattern))),
  ).map((entry) => entry.scope);
  const asksFullOverview =
    normalizedPrompt.includes("quadro completo") ||
    normalizedPrompt.includes("quadro totale") ||
    normalizedPrompt.includes("tutte le fonti") ||
    normalizedPrompt.includes("100%") ||
    normalizedPrompt.includes("completo");
  const asksAttentionToday =
    normalizedPrompt.includes("attenzione oggi") ||
    normalizedPrompt.includes("richiede attenzione oggi") ||
    normalizedPrompt.includes("priorita oggi") ||
    normalizedPrompt.includes("priorita operative");

  let scopes = Array.from(new Set([...scopesFromConsole, ...scopesFromPrompt]));
  if (asksAttentionToday && !scopes.includes("attenzione_oggi")) {
    scopes.push("attenzione_oggi");
  }

  if (asksFullOverview) {
    scopes = Array.from(new Set(["quadro", ...ALL_OPERATIONAL_SCOPES, ...scopes]));
  }

  if (scopes.length === 0 && normalizedTarga) {
    scopes =
      outputPreference === "report" || outputPreference === "pdf" || outputPreference === "modale"
        ? ["quadro", ...ALL_OPERATIONAL_SCOPES]
        : ["criticita", "scadenze", "lavori", "manutenzioni"];
  }

  if (scopes.length === 0 && asksAttentionToday) {
    scopes = ["attenzione_oggi", "criticita", "scadenze"];
  }

  return {
    visiblePrompt,
    normalizedPrompt,
    normalizedTarga: normalizedTarga || null,
    periodInput: fallbackPeriodInput ?? createDefaultInternalAiReportPeriodInput(),
    outputPreference,
    scopes,
    asksFullOverview,
    asksAttentionToday,
  };
}

export function isInternalAiUnifiedIntelligenceCandidate(prompt: string): boolean {
  const spec = parseUnifiedQuery(prompt);
  if (spec.normalizedTarga) {
    return true;
  }

  if (spec.scopes.length > 0) {
    return true;
  }

  return (
    spec.normalizedPrompt.includes("pdf") ||
    spec.normalizedPrompt.includes("modale") ||
    spec.normalizedPrompt.includes("report") ||
    spec.normalizedPrompt.includes("quadro completo") ||
    spec.normalizedPrompt.includes("richiede attenzione oggi")
  );
}

function buildBaseRecord(args: {
  sourceId: string;
  sourceLabel: string;
  id: string;
  entityLabel: string;
  summary: string;
  ts?: number | null;
  reliability: UnifiedRecord["reliability"];
  targa?: Array<string | null | undefined>;
  mezzoId?: Array<string | null | undefined>;
  autistaBadge?: Array<string | null | undefined>;
  autistaNome?: Array<string | null | undefined>;
  refIds?: Array<string | null | undefined>;
  documentIds?: Array<string | null | undefined>;
  labels?: Array<string | null | undefined>;
  storagePaths?: Array<string | null | undefined>;
  flags?: Array<string | null | undefined>;
}): UnifiedRecord {
  return {
    id: args.id,
    sourceId: args.sourceId,
    sourceLabel: args.sourceLabel,
    entityLabel: args.entityLabel,
    summary: args.summary,
    ts: args.ts ?? null,
    reliability: args.reliability,
    matchKeys: {
      targa: normalizeTargaList(args.targa ?? []),
      mezzoId: dedupeStrings(args.mezzoId ?? []),
      autistaBadge: dedupeStrings(args.autistaBadge ?? []),
      autistaNome: dedupeStrings(args.autistaNome ?? []),
      refIds: dedupeStrings(args.refIds ?? []),
      documentIds: dedupeStrings(args.documentIds ?? []),
      labels: dedupeStrings(args.labels ?? []),
      storagePaths: dedupeStrings(args.storagePaths ?? []),
    },
    flags: dedupeStrings(args.flags ?? []),
  };
}

function pickFirstString(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = normalizeOptionalText(raw[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function pickFirstNumber(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toTimestamp(raw[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function reliabilityFromQuality(rawQuality: unknown): UnifiedRecord["reliability"] {
  const normalized = normalizeSearchText(String(rawQuality ?? ""));
  if (normalized.includes("certo") || normalized.includes("high") || normalized.includes("forte")) {
    return "alta";
  }
  if (normalized.includes("parziale") || normalized.includes("medium") || normalized.includes("plausibile")) {
    return "media";
  }
  return "bassa";
}

function buildGenericRecordFromRaw(args: {
  sourceId: string;
  sourceLabel: string;
  raw: Record<string, unknown>;
  index: number;
}): UnifiedRecord {
  const title =
    pickFirstString(args.raw, [
      "title",
      "label",
      "descrizione",
      "descrizioneBreve",
      "nome",
      "nomeCompleto",
      "fornitore",
      "tipoDocumento",
      "tipo",
      "id",
    ]) ?? `Record ${args.index + 1}`;
  const targa = pickFirstString(args.raw, [
    "mezzoTarga",
    "targa",
    "targaMotrice",
    "targaRimorchio",
    "targetTarga",
  ]);
  const autistaNome = pickFirstString(args.raw, ["autistaNome", "nomeAutista", "autista", "driverName"]);
  const badge = pickFirstString(args.raw, ["badgeAutista", "badge"]);
  const docId = pickFirstString(args.raw, ["sourceDocId", "__docId", "docId", "documentId"]);
  const refId = pickFirstString(args.raw, ["refId", "orderReference", "ordineId", "id"]);

  return buildBaseRecord({
    sourceId: args.sourceId,
    sourceLabel: args.sourceLabel,
    id: pickFirstString(args.raw, ["id", "__docId", "docId"]) ?? `${args.sourceId}:${args.index}`,
    entityLabel: title,
    summary: [
      pickFirstString(args.raw, ["descrizione", "note", "summary", "preview"]),
      targa ? `targa ${targa}` : null,
      autistaNome ? `autista ${autistaNome}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    ts: pickFirstNumber(args.raw, ["timestamp", "createdAt", "updatedAt", "date", "data"]),
    reliability: reliabilityFromQuality(args.raw.quality),
    targa: [targa],
    autistaBadge: [badge],
    autistaNome: [autistaNome],
    refIds: [refId],
    documentIds: [docId],
    labels: [
      title,
      pickFirstString(args.raw, ["tipo", "tipoDocumento", "categoria", "sourceKey", "sourceCollection"]),
    ],
    storagePaths: [
      normalizeOptionalText(args.raw.storagePath),
      normalizeOptionalText(args.raw.fotoStoragePath),
      normalizeOptionalText(args.raw.pdfStoragePath),
    ],
    flags: Array.isArray(args.raw.flags)
      ? args.raw.flags.map((entry) => normalizeOptionalText(entry)).filter(Boolean)
      : [],
  });
}

function buildStoragePrefixRecords(args: {
  sourceId: string;
  sourceLabel: string;
  items: Array<{ fullPath: string; name: string }>;
}): UnifiedRecord[] {
  return limitRecords(
    args.items.map((item, index) =>
      buildBaseRecord({
        sourceId: args.sourceId,
        sourceLabel: args.sourceLabel,
        id: item.fullPath || `${args.sourceId}:${index}`,
        entityLabel: item.name,
        summary: item.fullPath,
        reliability: "media",
        labels: [item.name, item.fullPath],
        storagePaths: [item.fullPath],
      }),
    ),
  );
}

function sourceStatusFromRawResult(
  result:
    | NextUnifiedStorageDocumentReadResult
    | NextUnifiedCollectionReadResult
    | NextUnifiedStoragePrefixReadResult,
): UnifiedSourceStatus {
  if (result.status === "error") {
    return "error";
  }
  if (result.status === "missing") {
    return "missing";
  }
  return result.notes.length > 0 ? "partial" : "ready";
}

function sourceStatusFromLocalStorageResult(result: NextUnifiedLocalStorageReadResult): UnifiedSourceStatus {
  if (result.status === "ready") {
    return result.notes.length > 0 ? "partial" : "ready";
  }
  if (result.status === "missing") {
    return "missing";
  }
  return "partial";
}

function buildErrorSnapshot(descriptor: UnifiedSourceDescriptor, message: string): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: "error",
    records: [],
    notes: [message],
    readerLabel: descriptor.readerLabel,
  };
}

function buildGuardedSnapshot(descriptor: UnifiedSourceDescriptor): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: "guarded",
    records: [],
    notes: [
      "La fonte e registrata nel perimetro canonico, ma non viene letta lato client per evitare esposizione di segreti o configurazioni sensibili.",
    ],
    readerLabel: descriptor.readerLabel,
  };
}

function snapshotFromRawStorage(args: {
  descriptor: UnifiedSourceDescriptor;
  result: NextUnifiedStorageDocumentReadResult;
}): UnifiedSourceSnapshot {
  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: sourceStatusFromRawResult(args.result),
    records: limitRecords(
      args.result.records.map((raw, index) =>
        buildGenericRecordFromRaw({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          raw,
          index,
        }),
      ),
    ),
    notes: args.result.notes,
    readerLabel: args.descriptor.readerLabel,
  };
}

function snapshotFromRawCollection(args: {
  descriptor: UnifiedSourceDescriptor;
  result: NextUnifiedCollectionReadResult;
}): UnifiedSourceSnapshot {
  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: sourceStatusFromRawResult(args.result),
    records: limitRecords(
      args.result.records.map((raw, index) =>
        buildGenericRecordFromRaw({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          raw,
          index,
        }),
      ),
    ),
    notes: args.result.notes,
    readerLabel: args.descriptor.readerLabel,
  };
}

function snapshotFromPrefix(args: {
  descriptor: UnifiedSourceDescriptor;
  result: NextUnifiedStoragePrefixReadResult;
}): UnifiedSourceSnapshot {
  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: sourceStatusFromRawResult(args.result),
    records: buildStoragePrefixRecords({
      sourceId: args.descriptor.sourceId,
      sourceLabel: args.descriptor.sourceLabel,
      items: args.result.items,
    }),
    notes: args.result.notes,
    readerLabel: args.descriptor.readerLabel,
  };
}

function snapshotFromLocalStorage(args: {
  descriptor: UnifiedSourceDescriptor;
  result: NextUnifiedLocalStorageReadResult;
}): UnifiedSourceSnapshot {
  const records =
    args.result.value === null
      ? []
      : [
          buildBaseRecord({
            sourceId: args.descriptor.sourceId,
            sourceLabel: args.descriptor.sourceLabel,
            id: args.descriptor.sourceId,
            entityLabel: args.result.value,
            summary: args.result.value,
            reliability: args.result.status === "ready" ? "media" : "bassa",
            labels: [args.result.value],
          }),
        ];

  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: sourceStatusFromLocalStorageResult(args.result),
    records,
    notes: args.result.notes,
    readerLabel: args.descriptor.readerLabel,
  };
}

function mapQualityToStatus(limitations: string[]): UnifiedSourceStatus {
  return limitations.length > 0 ? "partial" : "ready";
}

function buildFlottaSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextAnagraficheFlottaSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.targa,
          summary: [item.categoria, item.marcaModello, item.autistaNome].filter(Boolean).join(" | "),
          ts: item.dataScadenzaRevisioneTimestamp ?? item.dataUltimoCollaudoTimestamp,
          reliability: reliabilityFromQuality(item.quality),
          targa: [item.targa],
          mezzoId: [item.id],
          autistaNome: [item.autistaNome],
          labels: [item.categoria, item.marcaModello, item.note],
          storagePaths: [item.fotoStoragePath, item.librettoUrl],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildColleghiSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextColleghiSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.nome,
          summary: [item.badge, item.codice, item.descrizione].filter(Boolean).join(" | "),
          reliability: reliabilityFromQuality(item.quality),
          mezzoId: [item.id],
          autistaBadge: [item.badge],
          autistaNome: [item.nome],
          refIds: [item.codice],
          labels: [item.nome, item.descrizione],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildLavoriSourceSnapshot(args: {
  descriptor: UnifiedSourceDescriptor;
  aperti: Awaited<ReturnType<typeof readNextLavoriInAttesaSnapshot>>;
  chiusi: Awaited<ReturnType<typeof readNextLavoriEseguitiSnapshot>>;
}): UnifiedSourceSnapshot {
  const rows = [...args.aperti.groups.flatMap((group) => group.items), ...args.chiusi.groups.flatMap((group) => group.items)];
  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: mapQualityToStatus([...args.aperti.limitations, ...args.chiusi.limitations]),
    records: limitRecords(
      rows.map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.descrizione,
          summary: [item.mezzoTarga ?? item.targa, item.urgenza, item.dataInserimento, item.dataEsecuzione].filter(Boolean).join(" | "),
          ts: item.timestampEsecuzione ?? item.timestampInserimento,
          reliability: reliabilityFromQuality(item.quality),
          targa: [item.mezzoTarga, item.targa],
          refIds: [item.id, item.gruppoId],
          labels: [item.descrizione, item.dettagli, item.segnalatoDa, item.chiHaEseguito, item.urgenza],
          flags: item.flags,
        }),
      ),
    ),
    notes: [...args.aperti.limitations, ...args.chiusi.limitations],
    readerLabel: args.descriptor.readerLabel,
  };
}

function buildManutenzioniSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextOperativitaGlobaleSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus([...snapshot.manutenzioni.limitations, ...snapshot.limitations]),
    records: limitRecords(
      snapshot.manutenzioni.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.descrizione ?? item.targa ?? item.id,
          summary: [item.targa, item.fornitore, item.data].filter(Boolean).join(" | "),
          ts: item.timestamp,
          reliability: reliabilityFromQuality(item.quality),
          targa: [item.targa],
          refIds: [item.id],
          labels: [item.descrizione, item.fornitore],
          flags: item.flags,
        }),
      ),
    ),
    notes: [...snapshot.manutenzioni.limitations, ...snapshot.limitations],
    readerLabel: descriptor.readerLabel,
  };
}

function buildMaterialiSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextMaterialiMovimentiSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.materiale ?? item.descrizione ?? item.id,
          summary: [item.mezzoTarga, item.destinatario.label, item.fornitore, item.data].filter(Boolean).join(" | "),
          ts: item.timestamp,
          reliability: reliabilityFromQuality(item.quality),
          targa: [item.mezzoTarga, item.targa],
          mezzoId: [item.destinatario.refId],
          refIds: [item.id, item.destinatario.refId],
          labels: [item.materiale, item.descrizione, item.fornitore, item.destinatario.label],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildInventarioSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextInventarioSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.descrizione,
          summary: [item.fornitore, item.quantita !== null ? `${item.quantita}${item.unita ?? ""}` : null].filter(Boolean).join(" | "),
          reliability: reliabilityFromQuality(item.quality),
          refIds: [item.id],
          labels: [item.descrizione, item.fornitore],
          storagePaths: [item.fotoStoragePath, item.fotoUrl],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildAttrezzatureSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextOperativitaGlobaleSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus([...snapshot.attrezzature.limitations, ...snapshot.limitations]),
    records: limitRecords(
      snapshot.attrezzature.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.descrizione,
          summary: [item.cantiereLabel, item.materialeCategoria, item.quantita !== null ? `${item.quantita}` : null].filter(Boolean).join(" | "),
          reliability: reliabilityFromQuality(item.quality),
          refIds: [item.id],
          labels: [item.descrizione, item.cantiereLabel, item.materialeCategoria],
          flags: item.flags,
        }),
      ),
    ),
    notes: [...snapshot.attrezzature.limitations, ...snapshot.limitations],
    readerLabel: descriptor.readerLabel,
  };
}

function buildProcurementSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextProcurementSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.orders.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.orderReference || item.id,
          summary: [item.supplierName, item.state, item.orderDateLabel, item.latestArrivalLabel].filter(Boolean).join(" | "),
          ts: item.orderTimestamp,
          reliability: reliabilityFromQuality(item.quality),
          refIds: [item.id, item.orderReference, item.supplierId],
          labels: [item.supplierName, item.orderNote, ...item.materialPreview],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildFornitoriSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextFornitoriSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.nome,
          summary: [item.codice, item.telefono, item.descrizione].filter(Boolean).join(" | "),
          reliability: reliabilityFromQuality(item.quality),
          autistaBadge: [item.badge],
          refIds: [item.id, item.codice, item.badge],
          labels: [item.nome, item.descrizione],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildDocumentiCostiSourceSnapshot(args: {
  descriptor: UnifiedSourceDescriptor;
  snapshot: Awaited<ReturnType<typeof readNextDocumentiCostiFleetSnapshot>>;
}): UnifiedSourceSnapshot {
  const items = args.snapshot.items.filter((item) => {
    if (args.descriptor.sourceId === "storage/@costiMezzo") return item.sourceKey === "@costiMezzo";
    if (args.descriptor.sourceId === "collection/@documenti_mezzi") return item.sourceCollection === "@documenti_mezzi";
    if (args.descriptor.sourceId === "collection/@documenti_magazzino") return item.sourceCollection === "@documenti_magazzino";
    if (args.descriptor.sourceId === "collection/@documenti_generici") return item.sourceCollection === "@documenti_generici";
    return false;
  });

  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: mapQualityToStatus(args.snapshot.limitations),
    records: limitRecords(
      items.map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.title,
          summary: [item.mezzoTarga, item.documentTypeLabel, item.supplier, item.dateLabel].filter(Boolean).join(" | "),
          ts: item.sortTimestamp,
          reliability: reliabilityFromQuality(item.quality),
          targa: [item.mezzoTarga],
          refIds: [item.id, item.sourceRecordId],
          documentIds: [item.sourceDocId, item.id],
          labels: [item.title, item.descrizione, item.documentTypeLabel, item.supplier, item.sourceLabel],
          storagePaths: [item.fileUrl],
          flags: item.flags,
        }),
      ),
    ),
    notes: args.snapshot.limitations,
    readerLabel: args.descriptor.readerLabel,
  };
}

function buildLibrettiSourceSnapshot(
  descriptor: UnifiedSourceDescriptor,
  snapshot: Awaited<ReturnType<typeof readNextLibrettiExportSnapshot>>,
): UnifiedSourceSnapshot {
  return {
    sourceId: descriptor.sourceId,
    sourceLabel: descriptor.sourceLabel,
    domainCode: descriptor.domainCode,
    kind: descriptor.kind,
    status: mapQualityToStatus(snapshot.limitations),
    records: limitRecords(
      snapshot.items.map((item) =>
        buildBaseRecord({
          sourceId: descriptor.sourceId,
          sourceLabel: descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.targa,
          summary: [item.categoria, item.label].filter(Boolean).join(" | "),
          reliability: "alta",
          targa: [item.targa],
          mezzoId: [item.id],
          labels: [item.categoria, item.label],
          storagePaths: [item.librettoStoragePath, item.librettoUrl],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
    readerLabel: descriptor.readerLabel,
  };
}

function buildCentroSourceSnapshot(args: {
  descriptor: UnifiedSourceDescriptor;
  snapshot: Awaited<ReturnType<typeof readNextCentroControlloSnapshot>>;
}): UnifiedSourceSnapshot {
  let records: UnifiedRecord[] = [];

  if (args.descriptor.sourceId === "storage/@autisti_sessione_attive") {
    records = args.snapshot.sessioni.map((item) =>
      buildBaseRecord({
        sourceId: args.descriptor.sourceId,
        sourceLabel: args.descriptor.sourceLabel,
        id: item.id,
        entityLabel: item.nomeAutista ?? item.badgeAutista ?? item.id,
        summary: [item.targaMotrice, item.targaRimorchio, item.statoSessione].filter(Boolean).join(" | "),
        ts: item.timestamp,
        reliability: reliabilityFromQuality(item.quality),
        targa: [item.targaMotrice, item.targaRimorchio],
        autistaBadge: [item.badgeAutista],
        autistaNome: [item.nomeAutista],
        refIds: [item.id],
        labels: [item.statoSessione],
        flags: item.flags,
      }),
    );
  } else if (args.descriptor.sourceId === "storage/@storico_eventi_operativi") {
    records = args.snapshot.eventiStorici.map((item) =>
      buildBaseRecord({
        sourceId: args.descriptor.sourceId,
        sourceLabel: args.descriptor.sourceLabel,
        id: item.id,
        entityLabel: item.tipo ?? item.id,
        summary: [item.nomeAutista, item.luogo, item.statoCarico].filter(Boolean).join(" | "),
        ts: item.timestamp,
        reliability: reliabilityFromQuality(item.quality),
        targa: item.targasCoinvolte,
        autistaBadge: [item.badgeAutista],
        autistaNome: [item.nomeAutista],
        refIds: [item.id, item.sourceRecordId],
        labels: [item.tipo, item.luogo, item.statoCarico],
        flags: item.flags,
      }),
    );
  } else if (args.descriptor.sourceId === "storage/@alerts_state") {
    records = args.snapshot.alerts.map((item) =>
      buildBaseRecord({
        sourceId: args.descriptor.sourceId,
        sourceLabel: args.descriptor.sourceLabel,
        id: item.id,
        entityLabel: item.title,
        summary: [item.detailText, item.dateLabel, item.severity].filter(Boolean).join(" | "),
        ts: item.dueTs ?? item.eventTs,
        reliability: item.quality === "source_direct" ? "alta" : "media",
        targa: [item.mezzoTarga],
        autistaBadge: [item.badgeAutista],
        autistaNome: [item.autistaNome],
        refIds: [item.id, item.sourceRecordId],
        labels: [item.title, item.detailText, item.kind],
        flags: item.flags,
      }),
    );
  } else if (args.descriptor.sourceId === "storage/@segnalazioni_autisti_tmp") {
    records = args.snapshot.alerts
      .filter((item) => item.sourceDataset === "@segnalazioni_autisti_tmp")
      .map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.title,
          summary: [item.detailText, item.dateLabel, item.severity].filter(Boolean).join(" | "),
          ts: item.eventTs,
          reliability: "media",
          targa: [item.mezzoTarga],
          autistaBadge: [item.badgeAutista],
          autistaNome: [item.autistaNome],
          refIds: [item.id, item.sourceRecordId],
          labels: [item.title, item.detailText, item.kind],
          flags: item.flags,
        }),
      );
  } else if (args.descriptor.sourceId === "storage/@controlli_mezzo_autisti") {
    records = args.snapshot.focusItems
      .filter((item) => item.sourceDataset === "@controlli_mezzo_autisti")
      .map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.title,
          summary: [item.detailText, item.dateLabel, item.severity].filter(Boolean).join(" | "),
          ts: item.eventTs,
          reliability: "media",
          targa: [item.mezzoTarga],
          autistaBadge: [item.badgeAutista],
          autistaNome: [item.autistaNome],
          refIds: [item.id, item.sourceRecordId],
          labels: [item.title, item.detailText, item.kind],
          flags: item.flags,
        }),
      );
  }

  return {
    sourceId: args.descriptor.sourceId,
    sourceLabel: args.descriptor.sourceLabel,
    domainCode: args.descriptor.domainCode,
    kind: args.descriptor.kind,
    status: mapQualityToStatus(args.snapshot.limitations),
    records: limitRecords(records),
    notes: args.snapshot.limitations,
    readerLabel: args.descriptor.readerLabel,
  };
}

async function buildUnifiedRegistrySnapshot(): Promise<UnifiedRegistrySnapshot> {
  if (registryCache && registryCache.expiresAt > Date.now()) {
    return registryCache.value;
  }

  if (registryPromise) {
    return registryPromise;
  }

  registryPromise = (async () => {
    const sourceMap = new Map<string, UnifiedSourceSnapshot>();

    const [
      flottaResult,
      colleghiResult,
      lavoriApertiResult,
      lavoriChiusiResult,
      operativitaGlobaleResult,
      materialiResult,
      inventarioResult,
      procurementResult,
      fornitoriResult,
      documentiCostiResult,
      librettiResult,
      centroResult,
    ] = await Promise.allSettled([
      readNextAnagraficheFlottaSnapshot(),
      readNextColleghiSnapshot(),
      readNextLavoriInAttesaSnapshot(),
      readNextLavoriEseguitiSnapshot(),
      readNextOperativitaGlobaleSnapshot(),
      readNextMaterialiMovimentiSnapshot(),
      readNextInventarioSnapshot(),
      readNextProcurementSnapshot(),
      readNextFornitoriSnapshot(),
      readNextDocumentiCostiFleetSnapshot(),
      readNextLibrettiExportSnapshot(),
      readNextCentroControlloSnapshot(),
    ]);

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "next_reader")) {
      try {
        switch (descriptor.sourceId) {
          case "storage/@mezzi_aziendali":
            if (flottaResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildFlottaSourceSnapshot(descriptor, flottaResult.value));
            break;
          case "storage/@colleghi":
            if (colleghiResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildColleghiSourceSnapshot(descriptor, colleghiResult.value));
            break;
          case "storage/@lavori":
            if (lavoriApertiResult.status === "fulfilled" && lavoriChiusiResult.status === "fulfilled") {
              sourceMap.set(descriptor.sourceId, buildLavoriSourceSnapshot({ descriptor, aperti: lavoriApertiResult.value, chiusi: lavoriChiusiResult.value }));
            }
            break;
          case "storage/@manutenzioni":
            if (operativitaGlobaleResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildManutenzioniSourceSnapshot(descriptor, operativitaGlobaleResult.value));
            break;
          case "storage/@materialiconsegnati":
            if (materialiResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildMaterialiSourceSnapshot(descriptor, materialiResult.value));
            break;
          case "storage/@inventario":
            if (inventarioResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildInventarioSourceSnapshot(descriptor, inventarioResult.value));
            break;
          case "storage/@attrezzature_cantieri":
            if (operativitaGlobaleResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildAttrezzatureSourceSnapshot(descriptor, operativitaGlobaleResult.value));
            break;
          case "storage/@ordini":
            if (procurementResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildProcurementSourceSnapshot(descriptor, procurementResult.value));
            break;
          case "storage/@fornitori":
            if (fornitoriResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildFornitoriSourceSnapshot(descriptor, fornitoriResult.value));
            break;
          case "storage/@costiMezzo":
          case "collection/@documenti_mezzi":
          case "collection/@documenti_magazzino":
          case "collection/@documenti_generici":
            if (documentiCostiResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildDocumentiCostiSourceSnapshot({ descriptor, snapshot: documentiCostiResult.value }));
            break;
          case "storage-path/mezzi_aziendali":
            if (librettiResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildLibrettiSourceSnapshot(descriptor, librettiResult.value));
            break;
          case "storage/@autisti_sessione_attive":
          case "storage/@storico_eventi_operativi":
          case "storage/@alerts_state":
          case "storage/@segnalazioni_autisti_tmp":
          case "storage/@controlli_mezzo_autisti":
            if (centroResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildCentroSourceSnapshot({ descriptor, snapshot: centroResult.value }));
            break;
          default:
            break;
        }
      } catch (error) {
        sourceMap.set(descriptor.sourceId, buildErrorSnapshot(descriptor, error instanceof Error ? `Reader NEXT fallito: ${error.message}` : "Reader NEXT fallito per errore non previsto."));
      }
    }

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "raw_storage_doc")) {
      try {
        const result = await readNextUnifiedStorageDocument({
          key: descriptor.storageKey!,
          preferredArrayKeys: descriptor.preferredArrayKeys,
        });
        sourceMap.set(descriptor.sourceId, snapshotFromRawStorage({ descriptor, result }));
      } catch (error) {
        sourceMap.set(descriptor.sourceId, buildErrorSnapshot(descriptor, error instanceof Error ? error.message : "Adapter storage fallito."));
      }
    }

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "raw_collection")) {
      try {
        const result = await readNextUnifiedCollection({
          collectionName: descriptor.collectionName!,
        });
        sourceMap.set(descriptor.sourceId, snapshotFromRawCollection({ descriptor, result }));
      } catch (error) {
        sourceMap.set(descriptor.sourceId, buildErrorSnapshot(descriptor, error instanceof Error ? error.message : "Adapter collection fallito."));
      }
    }

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "storage_prefix")) {
      try {
        const result = await readNextUnifiedStoragePrefix({
          prefix: descriptor.storagePrefix!,
        });
        sourceMap.set(descriptor.sourceId, snapshotFromPrefix({ descriptor, result }));
      } catch (error) {
        sourceMap.set(descriptor.sourceId, buildErrorSnapshot(descriptor, error instanceof Error ? error.message : "Adapter storage prefix fallito."));
      }
    }

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "local_storage")) {
      try {
        const result = readNextUnifiedLocalStorageKey(descriptor.localStorageKey!);
        sourceMap.set(descriptor.sourceId, snapshotFromLocalStorage({ descriptor, result }));
      } catch (error) {
        sourceMap.set(descriptor.sourceId, buildErrorSnapshot(descriptor, error instanceof Error ? error.message : "Adapter localStorage fallito."));
      }
    }

    for (const descriptor of UNIFIED_SOURCE_DESCRIPTORS.filter((entry) => entry.kind === "guarded")) {
      sourceMap.set(descriptor.sourceId, buildGuardedSnapshot(descriptor));
    }

    const sources = UNIFIED_SOURCE_DESCRIPTORS.map((descriptor) => {
      const existing = sourceMap.get(descriptor.sourceId);
      return existing ?? buildErrorSnapshot(descriptor, "Fonte dichiarata nel registry ma non materializzata nel build snapshot.");
    });

    const counts = {
      totalSources: sources.length,
      readySources: sources.filter((source) => source.status === "ready").length,
      partialSources: sources.filter((source) => source.status === "partial").length,
      guardedSources: sources.filter((source) => source.status === "guarded").length,
      missingSources: sources.filter((source) => source.status === "missing").length,
      errorSources: sources.filter((source) => source.status === "error").length,
      totalRecords: sources.reduce((total, source) => total + source.records.length, 0),
    };

    const snapshot: UnifiedRegistrySnapshot = {
      canonicalDocLabel: CANONICAL_DATA_DOC_LABEL,
      generatedAt: new Date().toISOString(),
      sources,
      counts,
    };

    registryCache = {
      expiresAt: Date.now() + REGISTRY_CACHE_TTL_MS,
      value: snapshot,
    };
    registryPromise = null;

    return snapshot;
  })();

  return registryPromise;
}

function formatScopeLabel(scope: InternalAiUnifiedScopeId): string {
  switch (scope) {
    case "quadro":
      return "quadro completo";
    case "criticita":
      return "criticita";
    case "scadenze":
      return "scadenze";
    case "lavori":
      return "lavori";
    case "manutenzioni":
      return "manutenzioni";
    case "gomme":
      return "gomme";
    case "rifornimenti":
      return "rifornimenti";
    case "materiali":
      return "materiali";
    case "inventario":
      return "inventario";
    case "ordini":
      return "ordini";
    case "preventivi":
      return "preventivi";
    case "fornitori":
      return "fornitori";
    case "documenti":
      return "documenti";
    case "costi":
      return "costi";
    case "cisterna":
      return "cisterna";
    case "attenzione_oggi":
      return "attenzione oggi";
    default:
      return scope;
  }
}

function sourceStatusToPreviewStatus(status: UnifiedSourceStatus): InternalAiVehicleReportSource["status"] {
  if (status === "error" || status === "missing") return "errore";
  if (status === "partial" || status === "guarded") return "parziale";
  return "disponibile";
}

function isTsInPeriod(timestamp: number | null, periodContext: InternalAiReportPeriodContext): boolean {
  if (!periodContext.appliesFilter) return true;
  if (timestamp === null) return false;
  if (periodContext.fromTimestamp !== null && timestamp < periodContext.fromTimestamp) return false;
  if (periodContext.toTimestamp !== null && timestamp > periodContext.toTimestamp) return false;
  return true;
}

function buildSourcePreviewFromSource(
  source: UnifiedSourceSnapshot,
  periodContext: InternalAiReportPeriodContext,
): InternalAiVehicleReportSource {
  return {
    id: source.sourceId,
    title: source.sourceLabel,
    status: sourceStatusToPreviewStatus(source.status),
    description: `Reader: ${source.readerLabel}`,
    datasetLabels: [source.sourceId],
    countLabel: `${formatCount(source.records.length)} record`,
    notes: source.notes,
    periodStatus: periodContext.appliesFilter ? "non_disponibile" : "nessun_filtro",
    periodNote: periodContext.appliesFilter ? "Il registry conserva fonti eterogenee: il filtro periodo si applica solo ai record con data dimostrabile." : null,
  };
}

function mergePreviewSources(sources: InternalAiVehicleReportSource[]): InternalAiVehicleReportSource[] {
  const map = new Map<string, InternalAiVehicleReportSource>();
  for (const source of sources) {
    if (!map.has(source.id)) {
      map.set(source.id, source);
      continue;
    }

    const current = map.get(source.id)!;
    map.set(source.id, {
      ...current,
      notes: dedupeStrings([...current.notes, ...source.notes]),
      datasetLabels: dedupeStrings([...current.datasetLabels, ...source.datasetLabels]),
      countLabel: source.countLabel ?? current.countLabel,
    });
  }

  return Array.from(map.values());
}

function buildSection(args: {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  notes?: string[];
  status: InternalAiVehicleReportSectionStatus;
  periodContext: InternalAiReportPeriodContext;
}): InternalAiVehicleReportSection {
  return {
    id: args.id,
    title: args.title,
    status: args.status,
    summary: args.summary,
    bullets: args.bullets,
    notes: args.notes ?? [],
    periodStatus: args.periodContext.appliesFilter ? "applicato" : "nessun_filtro",
    periodNote: args.periodContext.appliesFilter
      ? `Filtro applicato sul periodo ${args.periodContext.label} quando la data e dimostrabile.`
      : null,
  };
}

function buildCoverageReferences(
  registry: UnifiedRegistrySnapshot,
  reliabilityLabel: string,
): InternalAiChatMessageReference[] {
  return [
    { type: "architecture_doc", label: UNIFIED_ENGINE_REFERENCE, targa: null },
    { type: "architecture_doc", label: CANONICAL_DATA_DOC_LABEL, targa: null },
    {
      type: "architecture_doc",
      label: `Copertura fonti: ${registry.counts.totalSources} mappate, ${registry.counts.readySources} pronte, ${registry.counts.partialSources} parziali, ${registry.counts.guardedSources} protette`,
      targa: null,
    },
    { type: "safe_mode_notice", label: `${RELIABILITY_REFERENCE_PREFIX}${reliabilityLabel}`, targa: null },
  ];
}

function getRelevantSourceIds(scopes: InternalAiUnifiedScopeId[]): string[] {
  if (scopes.length === 0 || scopes.includes("quadro")) {
    return UNIFIED_SOURCE_DESCRIPTORS.map((descriptor) => descriptor.sourceId);
  }

  return Array.from(new Set(scopes.flatMap((scope) => SCOPE_SOURCE_MAP[scope] ?? [])));
}

function buildRecordSearchText(record: UnifiedRecord): string {
  return normalizeSearchText(
    [
      record.entityLabel,
      record.summary,
      ...record.matchKeys.targa,
      ...record.matchKeys.autistaNome,
      ...record.matchKeys.autistaBadge,
      ...record.matchKeys.refIds,
      ...record.matchKeys.documentIds,
      ...record.matchKeys.labels,
      ...record.matchKeys.storagePaths,
      ...record.flags,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getPromptTokens(spec: UnifiedQuerySpec): string[] {
  return Array.from(
    new Set(
      spec.normalizedPrompt
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
        .filter(
          (token) =>
            ![
              "fammi",
              "mostrami",
              "dimmi",
              "questa",
              "questo",
              "della",
              "dello",
              "delle",
              "degli",
              "mezzo",
              "targa",
              "oggi",
              "apri",
              "crea",
              "genera",
              "solo",
              "con",
              "per",
              "che",
            ].includes(token),
        ),
    ),
  );
}

function matchRecordToQuery(record: UnifiedRecord, spec: UnifiedQuerySpec): { score: number; linkReliability: LinkedUnifiedRecord["linkReliability"] } | null {
  const tokens = getPromptTokens(spec);
  const haystack = buildRecordSearchText(record);
  let score = 0;
  let linkReliability: LinkedUnifiedRecord["linkReliability"] = "bassa";

  if (spec.normalizedTarga) {
    if (record.matchKeys.targa.includes(spec.normalizedTarga)) {
      score += 120;
      linkReliability = "alta";
    } else if (haystack.includes(spec.normalizedTarga.toLowerCase())) {
      score += 70;
      linkReliability = "media";
    }
  }

  const strongTokenHit = tokens.some(
    (token) =>
      record.matchKeys.autistaBadge.some((value) => normalizeSearchText(value).includes(token)) ||
      record.matchKeys.refIds.some((value) => normalizeSearchText(value).includes(token)) ||
      record.matchKeys.documentIds.some((value) => normalizeSearchText(value).includes(token)),
  );
  if (strongTokenHit) {
    score += 60;
    if (linkReliability === "bassa") linkReliability = "media";
  }

  const textHits = tokens.filter((token) => haystack.includes(token)).length;
  if (textHits > 0) score += textHits * 12;

  if (!spec.normalizedTarga && textHits === 0 && !strongTokenHit) return null;
  if (spec.normalizedTarga && score === 0) return null;

  return { score, linkReliability };
}

function collectLinkedRecords(registry: UnifiedRegistrySnapshot, spec: UnifiedQuerySpec): LinkedUnifiedRecord[] {
  const allowedSourceIds = new Set(getRelevantSourceIds(spec.scopes));
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);
  const linked: LinkedUnifiedRecord[] = [];

  for (const source of registry.sources) {
    if (allowedSourceIds.size > 0 && !allowedSourceIds.has(source.sourceId)) continue;

    for (const record of source.records) {
      if (!isTsInPeriod(record.ts, periodContext)) continue;
      const match = matchRecordToQuery(record, spec);
      if (!match) continue;
      linked.push({ source, record, score: match.score, linkReliability: match.linkReliability });
    }
  }

  return linked.sort((left, right) => right.score - left.score).slice(0, 120);
}

function buildIdentitySection(
  mezzo: NextAnagraficheFlottaMezzoItem,
  periodContext: InternalAiReportPeriodContext,
): UnifiedSectionBuild {
  const bullets = [
    `Targa: ${mezzo.targa}`,
    `Categoria: ${mezzo.categoria || "DA VERIFICARE"}`,
    `Marca/modello: ${mezzo.marcaModello || "DA VERIFICARE"}`,
    `Autista dichiarato: ${mezzo.autistaNome || "DA VERIFICARE"}`,
    `Revisione anagrafica: ${mezzo.dataScadenzaRevisione || "DA VERIFICARE"}`,
  ];

  return {
    section: buildSection({
      id: "identita-mezzo",
      title: "Identita mezzo",
      summary: "Anagrafica base e pivot targa letti da D01.",
      bullets,
      status: "completa",
      periodContext,
    }),
    sources: [],
    keyPoints: [`mezzo ${mezzo.targa} identificato in D01`],
    missingData: [],
    evidences: [`D01 anagrafica flotta ha riconosciuto la targa ${mezzo.targa}.`],
  };
}

function buildRegistryBackedSection(args: {
  id: string;
  title: string;
  summaryPrefix: string;
  linkedRecords: LinkedUnifiedRecord[];
  periodContext: InternalAiReportPeriodContext;
}): UnifiedSectionBuild {
  const grouped = Array.from(
    args.linkedRecords.reduce<Map<string, LinkedUnifiedRecord[]>>((accumulator, entry) => {
      const current = accumulator.get(entry.source.sourceLabel) ?? [];
      current.push(entry);
      accumulator.set(entry.source.sourceLabel, current);
      return accumulator;
    }, new Map()),
  );

  const bullets = grouped.slice(0, 4).flatMap(([label, entries]) => {
    const top = entries.slice(0, 2).map((entry) => entry.record.summary || entry.record.entityLabel).join(" | ");
    return `${label}: ${top}`;
  });

  return {
    section: buildSection({
      id: args.id,
      title: args.title,
      summary: args.linkedRecords.length > 0 ? `${args.summaryPrefix} ${args.linkedRecords.length} riscontri agganciati dal registry.` : `${args.summaryPrefix} nessun riscontro agganciato dal registry.`,
      bullets: bullets.length > 0 ? bullets : ["Nessun record agganciato dal registry per questa sezione."],
      status: bullets.length > 0 ? "parziale" : "vuota",
      periodContext: args.periodContext,
    }),
    sources: mergePreviewSources(args.linkedRecords.map((entry) => buildSourcePreviewFromSource(entry.source, args.periodContext))),
    keyPoints: bullets.slice(0, 2),
    missingData: bullets.length > 0 ? [] : ["Il registry non ha trovato record agganciabili per questa sezione."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildOperationalSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextCentroControlloSnapshot();
  const alertItems = snapshot.alerts.filter((item) => item.mezzoTarga === args.targa && isTsInPeriod(item.dueTs ?? item.eventTs, args.periodContext));
  const focusItems = snapshot.focusItems.filter((item) => item.mezzoTarga === args.targa && isTsInPeriod(item.eventTs, args.periodContext));
  const revisionItem = snapshot.revisioni.find((item) => item.targa === args.targa && isTsInPeriod(item.scadenzaTs, args.periodContext)) ?? null;
  const sessioni = snapshot.sessioni.filter((item) => (item.targaMotrice === args.targa || item.targaRimorchio === args.targa) && isTsInPeriod(item.timestamp, args.periodContext));

  const bullets = [
    ...alertItems.slice(0, 3).map((item) => `${item.title}: ${item.detailText}`),
    ...focusItems.slice(0, 3).map((item) => `${item.title}: ${item.detailText}`),
    revisionItem ? `Revisione / collaudo: ${formatDateLabel(revisionItem.scadenzaTs)}` : null,
    sessioni[0] ? `Sessione attiva: ${sessioni[0].nomeAutista ?? "autista non dichiarato"}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  const notes = [
    ...snapshot.limitations.slice(0, 2),
    bullets.length === 0 ? "DA VERIFICARE: nessun segnale D10 collegato in modo forte alla targa nel periodo richiesto." : null,
  ].filter((entry): entry is string => Boolean(entry));

  const sources = mergePreviewSources(
    ["storage/@alerts_state", "storage/@segnalazioni_autisti_tmp", "storage/@controlli_mezzo_autisti", "storage/@autisti_sessione_attive", "storage/@storico_eventi_operativi"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "stato-operativo-attuale",
      title: "Stato operativo attuale",
      summary: alertItems.length || focusItems.length || revisionItem ? `Trovati ${alertItems.length} alert, ${focusItems.length} focus e ${revisionItem ? "una revisione collegata" : "nessuna revisione collegata"}` : "Nessun alert o focus D10 collegato in modo forte alla targa nel periodo richiesto.",
      bullets: bullets.length > 0 ? bullets : ["Nessun alert o focus D10 collegato in modo forte alla targa nel periodo richiesto."],
      notes,
      status: bullets.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 3),
    missingData: bullets.length === 0 ? ["D10 non collega segnali forti alla targa nel periodo richiesto."] : [],
    evidences: bullets.slice(0, 2),
  };
}

async function buildTecnicaSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextMezzoOperativitaTecnicaSnapshot(args.targa);
  const lavoriAperti = snapshot.lavoriAperti.filter((item) => isTsInPeriod(item.timestampInserimento ?? item.timestampEsecuzione ?? null, args.periodContext));
  const manutenzioni = snapshot.manutenzioni.filter((item) => isTsInPeriod(toTimestamp(item.data), args.periodContext));
  const bullets = [
    `Lavori aperti: ${snapshot.counts.lavoriAperti}`,
    `Manutenzioni lette: ${snapshot.counts.manutenzioni}`,
    ...lavoriAperti.slice(0, 3).map((item) => `${item.descrizione}${item.urgenza ? ` | urgenza ${item.urgenza}` : ""}`),
    ...manutenzioni.slice(0, 3).map((item) => `${item.descrizione ?? item.tipo ?? "manutenzione"}${item.data ? ` | ${item.data}` : ""}`),
  ];
  const sources = mergePreviewSources(
    ["storage/@lavori", "storage/@manutenzioni"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "lavori-manutenzioni",
      title: "Lavori e manutenzioni",
      summary: `D02 ha restituito ${snapshot.counts.lavoriAperti} lavori aperti e ${snapshot.counts.manutenzioni} manutenzioni.`,
      bullets,
      status: snapshot.counts.lavoriAperti || snapshot.counts.manutenzioni ? "completa" : "vuota",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 3),
    missingData: snapshot.counts.lavoriAperti || snapshot.counts.manutenzioni ? [] : ["D02 non mostra lavori o manutenzioni legate alla targa nel periodo richiesto."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildGommeSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextMezzoManutenzioniGommeSnapshot(args.targa);
  const gommeItems = snapshot.gommeItems.filter((item) => isTsInPeriod(item.timestamp, args.periodContext));
  const bullets = [
    `Eventi gomme: ${gommeItems.length}`,
    `Match forti: ${snapshot.counts.gommeMatchForti}`,
    `Match prudenziali: ${snapshot.counts.gommeMatchPlausibili}`,
    ...gommeItems.slice(0, 3).map((item) => `${item.evento}${item.posizione ? ` | ${item.posizione}` : ""}${item.dataLabel ? ` | ${item.dataLabel}` : ""}`),
  ];
  const sources = mergePreviewSources(
    ["storage/@cambi_gomme_autisti_tmp", "storage/@gomme_eventi", "storage/@manutenzioni"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "gomme",
      title: "Gomme e cambi correlati",
      summary: gommeItems.length > 0 ? `Trovati ${gommeItems.length} eventi gomme nel perimetro D02.` : "Nessun evento gomme collegato nel periodo richiesto.",
      bullets,
      notes: snapshot.limitations.slice(0, 2),
      status: gommeItems.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 2),
    missingData: gommeItems.length === 0 ? ["Nessun evento gomme collegato in modo dimostrabile alla targa."] : [],
    evidences: bullets.slice(0, 2),
  };
}

async function buildRifornimentiSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextMezzoRifornimentiSnapshot(args.targa);
  const items = snapshot.items.filter((item) => isTsInPeriod(item.timestampRicostruito ?? item.timestamp, args.periodContext));
  const litri = items.reduce((total, item) => total + (item.litri ?? 0), 0);
  const costo = items.reduce((total, item) => total + (item.costo ?? 0), 0);
  const bullets = [
    `Rifornimenti trovati: ${items.length}`,
    `Litri totali: ${litri.toFixed(1)}`,
    `Costo totale stimato: ${costo.toFixed(2)}`,
    ...items.slice(0, 3).map((item) => `${item.dataLabel ?? item.dataDisplay ?? "data non disponibile"} | ${item.litri ?? "?"} L | ${item.distributore ?? "distributore non noto"}`),
  ];
  const sources = mergePreviewSources(
    ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "rifornimenti",
      title: "Rifornimenti e consumi",
      summary: items.length > 0 ? `D04 ha restituito ${items.length} rifornimenti ricostruiti per la targa.` : "Nessun rifornimento collegato in modo dimostrabile nel periodo richiesto.",
      bullets,
      notes: snapshot.limitations.slice(0, 3),
      status: items.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 2),
    missingData: items.length > 0 ? [] : ["D04 resta presente nel registry ma non ha rifornimenti agganciati in modo forte alla targa."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildMaterialiInventarioSection(args: {
  targa: string;
  mezzoId: string | null;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const [materialiBase, inventario, documentiFleet] = await Promise.all([
    readNextMaterialiMovimentiSnapshot(),
    readNextInventarioSnapshot(),
    readNextDocumentiCostiFleetSnapshot(),
  ]);
  const materiali = buildNextMezzoMaterialiMovimentiSnapshot({
    baseSnapshot: materialiBase,
    targa: args.targa,
    mezzoId: args.mezzoId,
    materialCostSupportDocuments: documentiFleet.materialCostSupport.documents,
  });
  const materialItems = materiali.items.filter((item) => isTsInPeriod(item.timestamp, args.periodContext));
  const inventarioCritico = inventario.items.filter((item) => item.quantita !== null && item.quantita <= 0);
  const bullets = [
    `Movimenti materiali legati al mezzo: ${materialItems.length}`,
    `Match forti: ${materiali.counts.matchedStrong}`,
    `Magazzino critico globale: ${inventarioCritico.length}`,
    ...materialItems.slice(0, 3).map((item) => `${item.materiale ?? item.descrizione ?? item.id}${item.fornitore ? ` | ${item.fornitore}` : ""}`),
    ...inventarioCritico.slice(0, 2).map((item) => `Magazzino critico: ${item.descrizione}`),
  ];
  const sources = mergePreviewSources(
    ["storage/@materialiconsegnati", "storage/@inventario", "storage-path/materials", "storage-path/inventario"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "materiali-inventario",
      title: "Materiali e inventario",
      summary: materialItems.length > 0 || inventarioCritico.length > 0 ? "D05 ha riscontri utili sia lato mezzo sia lato magazzino globale." : "Nessun movimento materiali legato al mezzo e nessuna criticita inventario rilevata.",
      bullets,
      notes: dedupeStrings([...materiali.limitations.slice(0, 2), ...inventario.limitations.slice(0, 2)]),
      status: materialItems.length > 0 || inventarioCritico.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 3),
    missingData: materialItems.length > 0 ? [] : ["I movimenti materiali sono presenti nel registry, ma non risultano agganci forti alla targa nel periodo richiesto."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildProcurementSection(args: {
  targa: string;
  linkedRecords: LinkedUnifiedRecord[];
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const [procurement, procurementSupport] = await Promise.all([
    readNextProcurementSnapshot(),
    readNextDocumentiCostiProcurementSupportSnapshot(args.targa),
  ]);
  const relevantLinked = args.linkedRecords.filter((entry) =>
    ["storage/@ordini", "storage/@preventivi", "storage/@fornitori", "storage/@preventivi_approvazioni", "storage/@listino_prezzi", "storage-path/preventivi/ia"].includes(entry.source.sourceId),
  );
  const bullets = [
    `Ordini pendenti globali: ${procurement.counts.pendingOrders}`,
    `Supporto preventivi con targa forte: ${procurementSupport.counts.preventiviMatchForte}`,
    `Approvazioni collegate al mezzo: ${procurementSupport.counts.approvazioniMezzo}`,
    ...relevantLinked.slice(0, 4).map((entry) => `${entry.source.sourceLabel}: ${entry.record.summary || entry.record.entityLabel}`),
  ];
  const notes = [
    ...procurement.limitations.slice(0, 2),
    ...procurementSupport.limitations.slice(0, 2),
    relevantLinked.length === 0 ? "DA VERIFICARE: procurement e preventivi restano spesso indiretti rispetto alla targa." : null,
  ].filter((entry): entry is string => Boolean(entry));
  const sources = mergePreviewSources(
    ["storage/@ordini", "storage/@preventivi", "storage/@fornitori", "storage/@preventivi_approvazioni", "storage/@listino_prezzi", "storage-path/preventivi/ia"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "procurement-fornitori",
      title: "Procurement, preventivi e fornitori",
      summary: relevantLinked.length > 0 || procurementSupport.counts.preventiviMatchForte > 0 ? "Il motore ha trovato supporti procurement o preventivi collegabili al mezzo." : "Procurement presente nel registry, ma con collegamenti alla targa ancora indiretti o assenti.",
      bullets,
      notes,
      status: relevantLinked.length > 0 || procurementSupport.counts.preventiviMatchForte > 0 ? "parziale" : "vuota",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 3),
    missingData: relevantLinked.length > 0 ? [] : ["Nessun ordine o preventivo con collegamento forte alla targa nel clone read-only."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildDocumentiCostiSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextMezzoDocumentiCostiSnapshot(args.targa);
  const items = snapshot.items.filter((item) => isTsInPeriod(item.sortTimestamp, args.periodContext));
  const bullets = [
    `Documenti/costi trovati: ${items.length}`,
    `Preventivi: ${snapshot.counts.preventivi}`,
    `Fatture: ${snapshot.counts.fatture}`,
    `Documenti utili: ${snapshot.counts.documentiUtili}`,
    ...items.slice(0, 4).map((item) => `${item.title} | ${item.documentTypeLabel}${item.dateLabel ? ` | ${item.dateLabel}` : ""}`),
  ];
  const sources = mergePreviewSources(
    ["storage/@costiMezzo", "collection/@documenti_mezzi", "collection/@documenti_magazzino", "collection/@documenti_generici", "storage-path/documenti_pdf", "storage-path/mezzi_aziendali"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "documenti-costi",
      title: "Documenti e costi",
      summary: items.length > 0 ? `Trovati ${items.length} documenti o costi con legame diretto alla targa.` : "Nessun documento o costo direttamente collegato alla targa nel periodo richiesto.",
      bullets,
      notes: snapshot.limitations.slice(0, 3),
      status: items.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 3),
    missingData: items.length > 0 ? [] : ["D07/D08 presenti nel registry ma senza riscontri diretti sulla targa nel periodo richiesto."],
    evidences: bullets.slice(0, 2),
  };
}

async function buildCisternaSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const snapshot = await readNextCisternaSnapshot();
  const perTarga = snapshot.report.perTarga.find((entry) => normalizeNextMezzoTarga(entry.targa) === args.targa) ?? null;
  const detailRows = snapshot.report.detailRows.filter((entry) => normalizeNextMezzoTarga(entry.targa) === args.targa);
  const bullets = [
    perTarga ? `Litri assegnati: ${perTarga.litri} | azienda ${perTarga.aziendaLabel}` : "Nessuna riga cisterna assegnata direttamente alla targa nel mese corrente.",
    ...detailRows.slice(0, 3).map((entry) => `${entry.data} | ${entry.litri} L | ${entry.aziendaLabel}`),
  ];
  const sources = mergePreviewSources(
    ["collection/@documenti_cisterna", "collection/@cisterna_schede_ia", "collection/@cisterna_parametri_mensili", "storage-path/documenti_pdf/cisterna", "storage-path/documenti_pdf/cisterna_schede"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "cisterna",
      title: "Cisterna specialistica",
      summary: perTarga || detailRows.length > 0 ? "La targa compare nel perimetro cisterna specialistica del mese corrente." : "Nessun riscontro cisterna direttamente assegnato alla targa nel mese corrente.",
      bullets,
      notes: [...snapshot.limitations.slice(0, 2), ...snapshot.report.notes.slice(0, 2)],
      status: perTarga || detailRows.length > 0 ? "parziale" : "vuota",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 2),
    missingData: perTarga || detailRows.length > 0 ? [] : ["D09 e presente nel registry, ma non ha match diretti sulla targa nel mese corrente."],
    evidences: bullets.slice(0, 1),
  };
}

function buildVehiclePreview(args: {
  mezzo: NextAnagraficheFlottaMezzoItem;
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  sources: InternalAiVehicleReportSource[];
  missingData: string[];
  evidences: string[];
  selectedScopes: InternalAiUnifiedScopeId[];
}): InternalAiVehicleReportPreview {
  const criticalCount = args.sections
    .filter((section) => section.id === "stato-operativo-attuale" || section.id === "lavori-manutenzioni")
    .reduce((total, section) => total + section.bullets.length, 0);

  return {
    reportType: "targa",
    targetId: args.mezzo.id,
    targetLabel: args.mezzo.targa,
    mezzoTarga: args.mezzo.targa,
    title: `Report operativo unificato ${args.mezzo.targa}`,
    subtitle: `Sezioni: ${args.selectedScopes.map((scope) => formatScopeLabel(scope)).join(", ") || "quadro operativo"} | periodo ${args.periodContext.label}`,
    generatedAt: new Date().toISOString(),
    header: {
      targa: args.mezzo.targa,
      categoria: args.mezzo.categoria || null,
      marcaModello: args.mezzo.marcaModello || null,
      autistaNome: args.mezzo.autistaNome || null,
      revisione: args.mezzo.dataScadenzaRevisione || null,
      librettoPresente: Boolean(args.mezzo.librettoUrl),
      manutenzioneProgrammata: args.mezzo.manutenzioneProgrammata,
    },
    cards: [
      { label: "Sezioni utili", value: `${args.sections.length}`, meta: "sezioni combinate nel report" },
      { label: "Fonti coinvolte", value: `${args.sources.length}`, meta: "fonti dichiarate nel report" },
      { label: "Segnali prioritari", value: `${criticalCount}`, meta: "alert, focus, lavori e note principali" },
      { label: "Dati mancanti", value: `${args.missingData.length}`, meta: "limiti dichiarati nel report" },
    ],
    periodContext: args.periodContext,
    sections: args.sections,
    missingData: args.missingData,
    evidences: args.evidences,
    sources: args.sources,
    previewState: { ...PREVIEW_STATE, updatedAt: new Date().toISOString() },
    approvalState: { ...APPROVAL_STATE, updatedAt: new Date().toISOString() },
  };
}

async function runVehicleUnifiedQuery(spec: UnifiedQuerySpec): Promise<InternalAiUnifiedExecutionResult> {
  const registry = await buildUnifiedRegistrySnapshot();
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);

  if (!spec.normalizedTarga) {
    return {
      intent: spec.outputPreference === "thread" ? "richiesta_generica" : "report_targa",
      status: "partial",
      assistantText:
        "Il motore unificato puo combinare fonti diverse, ma per un quadro mezzo o per un report/PDF serve una targa valida.\n\n" +
        'Esempi: "fammi il quadro completo del TI 315407" oppure "crea un PDF con controlli KO e scadenze della targa AB123CD".',
      references: buildCoverageReferences(registry, "Parziale"),
      report: spec.outputPreference === "thread" ? null : { status: "invalid_query", normalizedTarga: null, message: "Serve una targa valida per report, modale o PDF del motore unificato.", preview: null },
    };
  }

  const mezzo = await readNextMezzoByTarga(spec.normalizedTarga);
  if (!mezzo) {
    return {
      intent: spec.outputPreference === "thread" ? "mezzo_dossier" : "report_targa",
      status: "partial",
      assistantText: `Non trovo la targa ${spec.normalizedTarga} nelle anagrafiche clone-safe lette da D01.`,
      references: buildCoverageReferences(registry, "Parziale"),
      report: spec.outputPreference === "thread" ? null : { status: "not_found", normalizedTarga: spec.normalizedTarga, message: "La targa non e presente nelle anagrafiche clone-safe.", preview: null },
    };
  }

  const selectedScopes: InternalAiUnifiedScopeId[] =
    spec.scopes.length > 0
      ? spec.scopes
      : spec.outputPreference === "thread"
        ? ["criticita", "scadenze", "lavori", "manutenzioni"]
        : ["quadro", ...ALL_OPERATIONAL_SCOPES];
  const linkedRecords = collectLinkedRecords(registry, { ...spec, normalizedTarga: mezzo.targa });
  const sections: UnifiedSectionBuild[] = [
    buildIdentitySection(mezzo, periodContext),
    await buildOperationalSection({ targa: mezzo.targa, periodContext, registry }),
    await buildTecnicaSection({ targa: mezzo.targa, periodContext, registry }),
  ];

  if (selectedScopes.includes("gomme") || selectedScopes.includes("quadro")) sections.push(await buildGommeSection({ targa: mezzo.targa, periodContext, registry }));
  if (selectedScopes.includes("rifornimenti") || selectedScopes.includes("quadro")) sections.push(await buildRifornimentiSection({ targa: mezzo.targa, periodContext, registry }));
  if (selectedScopes.includes("materiali") || selectedScopes.includes("inventario") || selectedScopes.includes("quadro")) sections.push(await buildMaterialiInventarioSection({ targa: mezzo.targa, mezzoId: mezzo.id, periodContext, registry }));
  if (selectedScopes.includes("ordini") || selectedScopes.includes("preventivi") || selectedScopes.includes("fornitori") || selectedScopes.includes("quadro")) sections.push(await buildProcurementSection({ targa: mezzo.targa, linkedRecords, periodContext, registry }));
  if (selectedScopes.includes("documenti") || selectedScopes.includes("costi") || selectedScopes.includes("quadro")) sections.push(await buildDocumentiCostiSection({ targa: mezzo.targa, periodContext, registry }));
  if (selectedScopes.includes("cisterna") || selectedScopes.includes("quadro")) sections.push(await buildCisternaSection({ targa: mezzo.targa, periodContext, registry }));

  const registryBackedScopeIds: InternalAiUnifiedScopeId[] = [
    "ordini",
    "preventivi",
    "fornitori",
    "documenti",
    "costi",
    "cisterna",
  ];
  const registryOnlyScopes = selectedScopes.filter((scope) =>
    registryBackedScopeIds.includes(scope),
  );
  if (registryOnlyScopes.length > 0) {
    const relevantSourceIds = new Set(registryOnlyScopes.flatMap((scope) => SCOPE_SOURCE_MAP[scope] ?? []));
    const relevantRecords = linkedRecords.filter((entry) => relevantSourceIds.has(entry.source.sourceId));
    if (relevantRecords.length > 0) {
      sections.push(buildRegistryBackedSection({ id: "riscontri-registry", title: "Riscontri cross-fonte del registry", summaryPrefix: "Il linker unificato ha trovato", linkedRecords: relevantRecords, periodContext }));
    }
  }

  const allSources = mergePreviewSources(sections.flatMap((section) => section.sources));
  const missingData = dedupeStrings(sections.flatMap((section) => section.missingData));
  const evidences = dedupeStrings(sections.flatMap((section) => section.evidences));
  const keyPoints = dedupeStrings(sections.flatMap((section) => section.keyPoints)).slice(0, 8);
  const reliabilityLabel = linkedRecords.some((entry) => entry.linkReliability === "alta") && keyPoints.length > 0 ? "Affidabile" : linkedRecords.length > 0 ? "Parziale" : "Da verificare";

  const assistantText =
    "Punti chiave:\n" +
    (keyPoints.length > 0 ? keyPoints.map((entry) => `- ${entry}`).join("\n") : "- Nessun punto chiave forte emerso; le fonti restano lette ma con agganci deboli o assenti.") +
    "\n\nSezioni richieste:\n" +
    sections.map((entry) => `- ${entry.section.title}: ${entry.section.summary}`).join("\n") +
    "\n\nFonti lette:\n" +
    allSources.slice(0, 10).map((source) => `- ${source.title}: ${source.countLabel ?? "copertura disponibile"}`).join("\n") +
    "\n\nLimiti / DA VERIFICARE:\n" +
    (missingData.length > 0 ? missingData.map((entry) => `- ${entry}`).join("\n") : "- Nessun limite bloccante oltre ai vincoli read-only e alle fonti senza data dimostrabile.");

  const references = [
    ...buildCoverageReferences(registry, reliabilityLabel),
    { type: "architecture_doc" as const, label: `${DOMAIN_REFERENCE_PREFIX}Console unificata mezzo + fonti collegate`, targa: mezzo.targa },
  ];

  if (spec.outputPreference === "thread") {
    return { intent: "mezzo_dossier", status: keyPoints.length > 0 ? "completed" : "partial", assistantText, references, report: null };
  }

  const preview = buildVehiclePreview({
    mezzo,
    periodContext,
    sections: sections.map((entry) => entry.section),
    sources: allSources,
    missingData,
    evidences,
    selectedScopes,
  });

  return {
    intent: "report_targa",
    status: "completed",
    assistantText: `Ho preparato il report operativo unificato per ${mezzo.targa}.\n\nSezioni incluse: ${preview.sections.length}. Fonti dichiarate: ${preview.sources.length}. Dati mancanti: ${preview.missingData.length}.`,
    references,
    report: { status: "ready", normalizedTarga: mezzo.targa, message: "Report operativo unificato pronto nel perimetro NEXT read-only.", preview },
  };
}

async function runAttentionTodayQuery(spec: UnifiedQuerySpec): Promise<InternalAiUnifiedExecutionResult> {
  const registry = await buildUnifiedRegistrySnapshot();
  const [centro, operativita, procurement, inventario] = await Promise.all([readNextCentroControlloSnapshot(), readNextOperativitaGlobaleSnapshot(), readNextProcurementSnapshot(), readNextInventarioSnapshot()]);
  const keyPoints = [`alert visibili ${centro.counters.alertsVisible}`, `revisioni urgenti ${centro.revisioniUrgenti.length}`, `controlli KO ${centro.counters.controlliKo}`, `segnalazioni nuove ${centro.counters.segnalazioniNuove}`, `ordini pendenti ${procurement.counts.pendingOrders}`, `inventario critico ${inventario.counts.critical}`, `manutenzioni globali ${operativita.manutenzioni.counts.total}`];
  const requestedScopes =
    spec.scopes.length > 0 ? spec.scopes.map((scope) => formatScopeLabel(scope)) : ["Attenzione oggi"];

  return {
    intent: "richiesta_generica",
    status: "completed",
    assistantText:
      "Priorita operative di oggi:\n" +
      keyPoints.map((entry) => `- ${entry}`).join("\n") +
      "\n\nAmbiti letti:\n" +
      requestedScopes.map((entry) => `- ${entry}`).join("\n") +
      "\n\nFonti lette:\n- D10 centro controllo read-only.\n- D05 inventario e materiali.\n- D06 ordini.\n\nLimiti / DA VERIFICARE:\n- Il motore e read-only e non avvia promemoria o scritture business.\n- Le fonti senza timestamp affidabile restano lette ma non guidano la priorita temporale.",
    references: [...buildCoverageReferences(registry, "Parziale"), { type: "architecture_doc", label: `${DOMAIN_REFERENCE_PREFIX}Console unificata attenzione oggi`, targa: null }],
    report: null,
  };
}

async function runGenericRegistryQuery(spec: UnifiedQuerySpec): Promise<InternalAiUnifiedExecutionResult> {
  const registry = await buildUnifiedRegistrySnapshot();
  const linkedRecords = collectLinkedRecords(registry, spec);
  const requestedScopes =
    spec.scopes.length > 0 ? spec.scopes.map((scope) => formatScopeLabel(scope)) : [];
  const grouped = Array.from(
    linkedRecords.reduce<Map<string, LinkedUnifiedRecord[]>>((accumulator, entry) => {
      const current = accumulator.get(entry.source.sourceLabel) ?? [];
      current.push(entry);
      accumulator.set(entry.source.sourceLabel, current);
      return accumulator;
    }, new Map()),
  );

  if (grouped.length === 0) {
    return {
      intent: "richiesta_generica",
      status: "partial",
      assistantText:
        "Il registry unificato non ha trovato riscontri sufficienti per questa richiesta senza una targa o parole chiave piu specifiche.\n\n" +
        (requestedScopes.length > 0
          ? `Ambiti richiesti: ${requestedScopes.join(", ")}.\n`
          : "") +
        'Prova con una targa, un periodo o una sezione: per esempio "criticita + segnalazioni + manutenzioni ultimi 30 giorni per AB123CD".',
      references: buildCoverageReferences(registry, "Da verificare"),
      report: null,
    };
  }

  return {
    intent: "richiesta_generica",
    status: "completed",
    assistantText:
      "Risultato operativo del motore unificato:\n" +
      grouped.slice(0, 6).map(([label, entries]) => `- ${label}: ${entries.slice(0, 2).map((entry) => entry.record.summary || entry.record.entityLabel).join(" | ")}`).join("\n") +
      (requestedScopes.length > 0
        ? `\n\nAmbiti richiesti:\n- ${requestedScopes.join("\n- ")}`
        : "") +
      "\n\nLimiti / DA VERIFICARE:\n- Senza una targa il linker usa agganci per testo, refId e badge quando disponibili.\n- Per report, modale o PDF dedicati serve una targa valida.",
    references: [...buildCoverageReferences(registry, linkedRecords.some((entry) => entry.linkReliability === "alta") ? "Parziale" : "Da verificare"), { type: "architecture_doc", label: `${DOMAIN_REFERENCE_PREFIX}Console unificata multi-fonte`, targa: null }],
    report: null,
  };
}

export async function readInternalAiUnifiedRegistry(): Promise<UnifiedRegistrySnapshot> {
  return buildUnifiedRegistrySnapshot();
}

export async function readInternalAiUnifiedRegistrySummary(): Promise<InternalAiUnifiedRegistrySummary> {
  const registry = await buildUnifiedRegistrySnapshot();
  return {
    canonicalDocLabel: registry.canonicalDocLabel,
    generatedAt: registry.generatedAt,
    counts: registry.counts,
    highlightedSources: registry.sources.slice(0, 12).map((source) => ({
      sourceId: source.sourceId,
      sourceLabel: source.sourceLabel,
      domainCode: source.domainCode,
      status: source.status,
      readerLabel: source.readerLabel,
    })),
  };
}

export async function runInternalAiUnifiedIntelligenceQuery(prompt: string, fallbackPeriodInput?: InternalAiReportPeriodInput): Promise<InternalAiUnifiedExecutionResult | null> {
  if (!isInternalAiUnifiedIntelligenceCandidate(prompt)) return null;
  const spec = parseUnifiedQuery(prompt, fallbackPeriodInput);
  if (spec.asksAttentionToday && !spec.normalizedTarga) return runAttentionTodayQuery(spec);
  if (spec.normalizedTarga) return runVehicleUnifiedQuery(spec);
  return runGenericRegistryQuery(spec);
}
