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
  createInternalAiCustomPeriodInput,
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

type UnifiedBusinessIntentId =
  | "vehicle_overview"
  | "fuel_report"
  | "fuel_anomalies"
  | "vehicle_deadlines"
  | "fleet_deadlines"
  | "vehicle_criticality"
  | "fleet_criticality"
  | "fleet_attention"
  | "costs_documents"
  | "generic";

type UnifiedMetricId =
  | "total_liters"
  | "total_cost"
  | "analyzed_km"
  | "km_per_liter"
  | "liters_per_100_km"
  | "fuel_anomalies"
  | "deadlines"
  | "precollaudo"
  | "priority"
  | "backlog"
  | "alerts"
  | "segnalazioni";

type UnifiedAssetBreadth = "single_vehicle" | "multi_vehicle";

type UnifiedDomainBreadth = "single_domain" | "multi_domain";

type UnifiedResponseFocus =
  | "risposta_breve"
  | "analisi_strutturata"
  | "report_pdf"
  | "classifica";

type UnifiedEntityHints = {
  targa: string | null;
  mezzoLabel: string | null;
  autistaNome: string | null;
  fornitore: string | null;
  materiale: string | null;
};

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
  entityHints: UnifiedEntityHints;
  periodInput: InternalAiReportPeriodInput;
  periodExplicitRequested: boolean;
  periodResolved: boolean;
  outputPreference: UnifiedOutputPreference;
  scopes: InternalAiUnifiedScopeId[];
  explicitScopes: InternalAiUnifiedScopeId[];
  asksFullOverview: boolean;
  asksAttentionToday: boolean;
  primaryIntent: UnifiedBusinessIntentId;
  metrics: UnifiedMetricId[];
  assetBreadth: UnifiedAssetBreadth;
  domainBreadth: UnifiedDomainBreadth;
  responseFocus: UnifiedResponseFocus;
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

type UnifiedQueryPlan = {
  primaryIntent: UnifiedBusinessIntentId;
  selectedScopes: InternalAiUnifiedScopeId[];
  domainLabel: string;
  domainCodes: string[];
  relations: string[];
  excludedScopes: InternalAiUnifiedScopeId[];
  includeIdentitySection: boolean;
  outputLabel: string;
};

type FuelAnalyticsSummary = {
  recordsFound: number;
  includedRecords: number;
  excludedRecords: number;
  outsidePeriodRecords: number;
  undatedRecords: number;
  periodGuardedRecords: number;
  totalRecords: number;
  totalLiters: number;
  totalCost: number;
  analyzedKm: number;
  analyzedLiters: number;
  analyzedTransitions: number;
  kmPerLiter: number | null;
  litersPer100Km: number | null;
  calculationStatus: "affidabile" | "prudente" | "non_calcolabile";
  anomalyBullets: string[];
  recordBullets: string[];
  actionBullets: string[];
  missingData: string[];
};

type FuelValidationRecord = VehicleFuelSnapshot["items"][number] & {
  effectiveTimestamp: number | null;
  status: "incluso" | "escluso";
  exclusionReason: string | null;
};

type UnifiedPeriodSelection = {
  input: InternalAiReportPeriodInput;
  explicitRequested: boolean;
  resolved: boolean;
};

type VehiclePrioritySummary = {
  priorityLabel: "alta" | "media" | "bassa";
  reasons: string[];
  alertDangerCount: number;
  alertWarningCount: number;
  focusKoCount: number;
  newSignalCount: number;
  overdueRevisions: number;
  dueSoonRevisions: number;
  upcomingRevisions: number;
  openWorks: number;
  highUrgencyWorks: number;
  maintenanceCount: number;
};

type FleetPriorityRow = VehiclePrioritySummary & {
  targa: string;
  rankValues: number[];
  preCollaudoSuggested: boolean;
};

type CentroControlloSnapshot = Awaited<ReturnType<typeof readNextCentroControlloSnapshot>>;

type VehicleTechnicalSnapshot = Awaited<ReturnType<typeof readNextMezzoOperativitaTecnicaSnapshot>>;

type VehicleFuelSnapshot = Awaited<ReturnType<typeof readNextMezzoRifornimentiSnapshot>>;

type OperativitaGlobaleSnapshot = Awaited<ReturnType<typeof readNextOperativitaGlobaleSnapshot>>;

type LavoriInAttesaSnapshot = Awaited<ReturnType<typeof readNextLavoriInAttesaSnapshot>>;

const CANONICAL_DATA_DOC_LABEL = "Fonte canonica dati: docs/data/MAPPA_COMPLETA_DATI.md";
const REGISTRY_CACHE_TTL_MS = 90 * 1000;
const UNIFIED_ENGINE_REFERENCE = "Motore: Unified Intelligence Engine";
const DOMAIN_REFERENCE_PREFIX = "Dominio rilevato: ";
const RELIABILITY_REFERENCE_PREFIX = "Affidabilita: ";
const OUTPUT_REFERENCE_PREFIX = "Output suggerito: ";
const CLONE_SAFE_REFERENCE = "Perimetro: dati reali letti in sola lettura dal clone NEXT";
const MONTH_NAME_TO_INDEX: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

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
  { scope: "quadro", patterns: ["quadro completo", "quadro generale mezzo", "panoramica completa", "tutte le fonti"] },
  { scope: "criticita", patterns: ["criticita", "criticita operative", "priorita", "piu critico", "problemi", "segnalazioni", "controlli ko"] },
  { scope: "scadenze", patterns: ["scadenze", "revisione", "collaudo", "precollaudo", "pre-collaudo"] },
  { scope: "lavori", patterns: ["lavori", "lavoro", "backlog"] },
  { scope: "manutenzioni", patterns: ["manutenzioni", "manutenzione"] },
  { scope: "gomme", patterns: ["gomme", "gomma"] },
  { scope: "rifornimenti", patterns: ["rifornimenti", "rifornimento", "consumi", "carburante", "gasolio", "diesel", "km/l", "km per lt", "km per litro", "l/100km", "litri per 100 km"] },
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

function formatDecimal(value: number, digits = 2): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

function formatIsoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(value: Date): Date {
  const clone = new Date(value);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function endOfLocalDay(value: Date): Date {
  const clone = new Date(value);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

function createUnifiedCustomPeriodSelection(from: Date, to: Date): UnifiedPeriodSelection {
  return {
    input: createInternalAiCustomPeriodInput(formatIsoDate(startOfLocalDay(from)), formatIsoDate(endOfLocalDay(to))),
    explicitRequested: true,
    resolved: true,
  };
}

function hasExplicitPeriodCue(normalizedPrompt: string): boolean {
  if (
    normalizedPrompt.includes("oggi") ||
    normalizedPrompt.includes("questa settimana") ||
    normalizedPrompt.includes("questo mese") ||
    normalizedPrompt.includes("ultimo mese") ||
    normalizedPrompt.includes("ultimi 30 giorni") ||
    normalizedPrompt.includes("ultimi 90 giorni") ||
    normalizedPrompt.includes("prossimi 30 giorni")
  ) {
    return true;
  }

  if (/(?:dal|da)\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\s+(?:al|a)\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/i.test(normalizedPrompt)) {
    return true;
  }

  return new RegExp(`\\b(${Object.keys(MONTH_NAME_TO_INDEX).join("|")})\\s+(?:20|19)\\d{2}\\b`, "i").test(
    normalizedPrompt,
  );
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

function normalizeConsoleFieldValue(rawValue: string | null): string | null {
  const value = normalizeOptionalText(rawValue);
  if (!value) return null;
  const normalized = normalizeSearchText(value);
  if (normalized === "-" || normalized === "nessuno" || normalized === "n/a") {
    return null;
  }
  return value;
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
    normalizedPrompt.includes("creami un report") ||
    normalizedPrompt.includes("genera un report") ||
    normalizedPrompt.includes("preparami un report") ||
    normalizedPrompt.includes("fammi un report") ||
    normalizedPrompt.includes("report sintetico") ||
    normalizedPrompt.includes("report targa") ||
    normalizedPrompt.includes("report mezzo") ||
    normalizedPrompt.includes(" report ")
  ) {
    return "report";
  }
  return "thread";
}

function extractNamedEntity(prompt: string, labels: string[]): string | null {
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = prompt.match(
      new RegExp(`${escapedLabel}\\s+([A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ'./\\-\\s]{1,40})`, "i"),
    );
    const value = match?.[1]?.replace(/[.,;:!?]+$/, "").trim() ?? "";
    if (value) {
      return value;
    }
  }
  return null;
}

function resolveUnifiedPeriodSelection(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): UnifiedPeriodSelection {
  const normalizedPrompt = normalizeSearchText(prompt);

  if (normalizedPrompt.includes("ultimi 30 giorni")) {
    return {
      input: { preset: "last_30_days", fromDate: null, toDate: null },
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalizedPrompt.includes("ultimi 90 giorni")) {
    return {
      input: { preset: "last_90_days", fromDate: null, toDate: null },
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalizedPrompt.includes("ultimo mese")) {
    return {
      input: { preset: "last_full_month", fromDate: null, toDate: null },
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalizedPrompt.includes("questo mese")) {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return createUnifiedCustomPeriodSelection(from, to);
  }

  if (normalizedPrompt.includes("oggi")) {
    const today = new Date();
    return createUnifiedCustomPeriodSelection(today, today);
  }

  if (normalizedPrompt.includes("questa settimana")) {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const from = new Date(today);
    from.setDate(today.getDate() + mondayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return createUnifiedCustomPeriodSelection(from, to);
  }

  if (normalizedPrompt.includes("prossimi 30 giorni")) {
    const today = new Date();
    const to = new Date(today);
    to.setDate(today.getDate() + 29);
    return createUnifiedCustomPeriodSelection(today, to);
  }

  const customMatch = prompt.match(
    /(?:dal|da)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})\s+(?:al|a)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i,
  );
  if (customMatch?.[1] && customMatch?.[2]) {
    return {
      input: createInternalAiCustomPeriodInput(customMatch[1], customMatch[2]),
      explicitRequested: true,
      resolved: true,
    };
  }

  const monthYearMatch = normalizedPrompt.match(
    new RegExp(`\\b(${Object.keys(MONTH_NAME_TO_INDEX).join("|")})\\s+((?:19|20)\\d{2})\\b`, "i"),
  );
  if (monthYearMatch?.[1] && monthYearMatch?.[2]) {
    const monthIndex = MONTH_NAME_TO_INDEX[monthYearMatch[1].toLowerCase()];
    const year = Number(monthYearMatch[2]);
    if (monthIndex != null && Number.isFinite(year)) {
      const from = new Date(year, monthIndex, 1);
      const to = new Date(year, monthIndex + 1, 0);
      return createUnifiedCustomPeriodSelection(from, to);
    }
  }

  const explicitRequested = hasExplicitPeriodCue(normalizedPrompt);
  if (explicitRequested) {
    return {
      input: fallbackPeriodInput ?? createDefaultInternalAiReportPeriodInput(),
      explicitRequested: true,
      resolved: false,
    };
  }

  return {
    input: fallbackPeriodInput ?? createDefaultInternalAiReportPeriodInput(),
    explicitRequested: false,
    resolved: true,
  };
}

function inferResponseFocus(
  normalizedPrompt: string,
  outputPreference: UnifiedOutputPreference,
): UnifiedResponseFocus {
  if (outputPreference !== "thread") {
    return "report_pdf";
  }

  if (normalizedPrompt.includes("classifica") || normalizedPrompt.includes("priorita")) {
    return "classifica";
  }

  if (normalizedPrompt.includes("breve") || normalizedPrompt.includes("sintesi")) {
    return "risposta_breve";
  }

  return "analisi_strutturata";
}

function inferMetrics(
  normalizedPrompt: string,
  scopes: InternalAiUnifiedScopeId[],
  primaryIntent: UnifiedBusinessIntentId,
): UnifiedMetricId[] {
  const metrics = new Set<UnifiedMetricId>();

  if (scopes.includes("rifornimenti") || primaryIntent === "fuel_report" || primaryIntent === "fuel_anomalies") {
    metrics.add("total_liters");
    metrics.add("total_cost");
    metrics.add("analyzed_km");
    if (
      normalizedPrompt.includes("km/l") ||
      normalizedPrompt.includes("km per lt") ||
      normalizedPrompt.includes("km per litro") ||
      normalizedPrompt.includes("media")
    ) {
      metrics.add("km_per_liter");
    }
    if (
      normalizedPrompt.includes("l/100km") ||
      normalizedPrompt.includes("l/100 km") ||
      normalizedPrompt.includes("litri per 100 km")
    ) {
      metrics.add("liters_per_100_km");
    }
    if (normalizedPrompt.includes("anomali")) {
      metrics.add("fuel_anomalies");
    }
  }

  if (scopes.includes("scadenze") || primaryIntent === "vehicle_deadlines" || primaryIntent === "fleet_deadlines") {
    metrics.add("deadlines");
    metrics.add("precollaudo");
  }

  if (
    scopes.includes("criticita") ||
    primaryIntent === "vehicle_criticality" ||
    primaryIntent === "fleet_criticality" ||
    primaryIntent === "fleet_attention"
  ) {
    metrics.add("priority");
    metrics.add("backlog");
    metrics.add("alerts");
    metrics.add("segnalazioni");
  }

  return Array.from(metrics);
}

function inferPrimaryIntent(args: {
  normalizedPrompt: string;
  normalizedTarga: string | null;
  explicitScopes: InternalAiUnifiedScopeId[];
  asksFullOverview: boolean;
  asksAttentionToday: boolean;
}): UnifiedBusinessIntentId {
  const asksFuel = args.explicitScopes.includes("rifornimenti");
  const asksFuelAnomalies =
    asksFuel &&
    (args.normalizedPrompt.includes("anomali") || args.normalizedPrompt.includes("anomalie"));
  const asksDeadlines = args.explicitScopes.includes("scadenze");
  const asksCriticality = args.explicitScopes.includes("criticita");
  const asksCostsDocuments =
    args.explicitScopes.includes("costi") || args.explicitScopes.includes("documenti");

  if (asksFuelAnomalies) {
    return "fuel_anomalies";
  }

  if (asksFuel) {
    return "fuel_report";
  }

  if (args.asksAttentionToday) {
    return "fleet_attention";
  }

  if (asksDeadlines) {
    return args.normalizedTarga ? "vehicle_deadlines" : "fleet_deadlines";
  }

  if (asksCriticality) {
    return args.normalizedTarga ? "vehicle_criticality" : "fleet_criticality";
  }

  if (asksCostsDocuments) {
    return "costs_documents";
  }

  if (args.asksFullOverview) {
    return "vehicle_overview";
  }

  return args.normalizedTarga ? "vehicle_criticality" : "generic";
}

function inferAssetBreadth(
  normalizedPrompt: string,
  normalizedTarga: string | null,
): UnifiedAssetBreadth {
  if (normalizedTarga) {
    return "single_vehicle";
  }

  if (
    normalizedPrompt.includes("quali mezzi") ||
    normalizedPrompt.includes("tutti i mezzi") ||
    normalizedPrompt.includes("piu critico") ||
    normalizedPrompt.includes("classifica")
  ) {
    return "multi_vehicle";
  }

  return "multi_vehicle";
}

function inferDomainBreadth(args: {
  normalizedPrompt: string;
  explicitScopes: InternalAiUnifiedScopeId[];
  asksFullOverview: boolean;
}): UnifiedDomainBreadth {
  if (args.asksFullOverview || args.explicitScopes.length > 1) {
    return "multi_domain";
  }

  if (args.normalizedPrompt.includes("incrocia") || args.normalizedPrompt.includes("trasvers")) {
    return "multi_domain";
  }

  return "single_domain";
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
  const targaFromConsole = normalizeNextMezzoTarga(
    normalizeConsoleFieldValue(extractConsoleValue(prompt, "Targa")),
  );
  const normalizedTarga = targaFromConsole || extractPromptTarga(prompt);
  const normalizedPrompt = normalizeSearchText(visiblePrompt);
  const outputPreferenceFromConsole = parseOutputPreference(
    normalizeConsoleFieldValue(extractConsoleValue(prompt, "Output")),
  );
  const outputPreference =
    outputPreferenceFromConsole !== "thread"
      ? outputPreferenceFromConsole
      : inferOutputPreferenceFromPrompt(normalizedPrompt);
  const scopesFromConsole = parseConsoleScopes(
    normalizeConsoleFieldValue(extractConsoleValue(prompt, "Ambiti")),
  );
  const scopesFromPrompt = SCOPE_PATTERNS.filter((entry) =>
    entry.patterns.some((pattern) => normalizedPrompt.includes(normalizeSearchText(pattern))),
  ).map((entry) => entry.scope);
  const asksFullOverview =
    normalizedPrompt.includes("quadro completo") ||
    normalizedPrompt.includes("panoramica completa") ||
    normalizedPrompt.includes("quadro generale mezzo") ||
    normalizedPrompt.includes("tutte le fonti");
  const asksAttentionToday =
    normalizedPrompt.includes("attenzione oggi") ||
    normalizedPrompt.includes("richiede attenzione oggi") ||
    normalizedPrompt.includes("priorita oggi") ||
    normalizedPrompt.includes("priorita operative") ||
    normalizedPrompt.includes("quale mezzo e piu critico oggi");

  const explicitScopes = Array.from(new Set([...scopesFromConsole, ...scopesFromPrompt]));
  let scopes = [...explicitScopes];
  if (asksAttentionToday && !scopes.includes("attenzione_oggi")) {
    scopes.push("attenzione_oggi");
  }

  if (asksFullOverview) {
    scopes = Array.from(new Set(["quadro", ...ALL_OPERATIONAL_SCOPES, ...scopes]));
  }

  const primaryIntent = inferPrimaryIntent({
    normalizedPrompt,
    normalizedTarga,
    explicitScopes,
    asksFullOverview,
    asksAttentionToday,
  });

  if (scopes.length === 0) {
    switch (primaryIntent) {
      case "fuel_report":
      case "fuel_anomalies":
        scopes = ["rifornimenti"];
        break;
      case "vehicle_deadlines":
      case "fleet_deadlines":
        scopes = ["scadenze"];
        break;
      case "vehicle_criticality":
      case "fleet_criticality":
      case "fleet_attention":
        scopes = ["criticita", "scadenze", "lavori", "manutenzioni"];
        break;
      case "costs_documents":
        scopes = ["documenti", "costi"];
        break;
      case "vehicle_overview":
        scopes = ["quadro", ...ALL_OPERATIONAL_SCOPES];
        break;
      default:
        if (normalizedTarga) {
          scopes = ["criticita", "scadenze"];
        }
        break;
    }
  }

  const entityHints: UnifiedEntityHints = {
    targa: normalizedTarga || null,
    mezzoLabel: normalizedTarga || extractNamedEntity(visiblePrompt, ["mezzo", "targa"]),
    autistaNome: extractNamedEntity(visiblePrompt, ["autista", "collega"]),
    fornitore: extractNamedEntity(visiblePrompt, ["fornitore"]),
    materiale: extractNamedEntity(visiblePrompt, ["materiale"]),
  };
  const periodSelection = resolveUnifiedPeriodSelection(visiblePrompt, fallbackPeriodInput);
  const responseFocus = inferResponseFocus(normalizedPrompt, outputPreference);

  return {
    visiblePrompt,
    normalizedPrompt,
    normalizedTarga: normalizedTarga || null,
    entityHints,
    periodInput: periodSelection.input,
    periodExplicitRequested: periodSelection.explicitRequested,
    periodResolved: periodSelection.resolved,
    outputPreference,
    scopes,
    explicitScopes,
    asksFullOverview,
    asksAttentionToday,
    primaryIntent,
    metrics: inferMetrics(normalizedPrompt, scopes, primaryIntent),
    assetBreadth: inferAssetBreadth(normalizedPrompt, normalizedTarga),
    domainBreadth: inferDomainBreadth({ normalizedPrompt, explicitScopes: scopes, asksFullOverview }),
    responseFocus,
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
    description: `Fonte ${source.domainCode} letta in sola lettura`,
    datasetLabels: [`${source.domainCode} ${source.sourceLabel}`],
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

function buildUnifiedReferences(args: {
  reliabilityLabel: string;
  domainLabel: string;
  outputLabel: string;
  targa?: string | null;
  extraLabels?: string[];
}): InternalAiChatMessageReference[] {
  return [
    { type: "architecture_doc", label: UNIFIED_ENGINE_REFERENCE, targa: args.targa ?? null },
    { type: "architecture_doc", label: `${DOMAIN_REFERENCE_PREFIX}${args.domainLabel}`, targa: args.targa ?? null },
    { type: "safe_mode_notice", label: `${RELIABILITY_REFERENCE_PREFIX}${args.reliabilityLabel}`, targa: args.targa ?? null },
    { type: "capabilities", label: `${OUTPUT_REFERENCE_PREFIX}${args.outputLabel}`, targa: args.targa ?? null },
    { type: "safe_mode_notice", label: CLONE_SAFE_REFERENCE, targa: args.targa ?? null },
    ...(args.extraLabels ?? []).map((label) => ({
      type: "architecture_doc" as const,
      label,
      targa: args.targa ?? null,
    })),
  ];
}

function getRelevantSourceIds(scopes: InternalAiUnifiedScopeId[]): string[] {
  if (scopes.length === 0 || scopes.includes("quadro")) {
    return UNIFIED_SOURCE_DESCRIPTORS.map((descriptor) => descriptor.sourceId);
  }

  return Array.from(new Set(scopes.flatMap((scope) => SCOPE_SOURCE_MAP[scope] ?? [])));
}

function mapScopesToDomainCodes(scopes: InternalAiUnifiedScopeId[]): string[] {
  const codes = new Set<string>();
  for (const scope of scopes) {
    switch (scope) {
      case "criticita":
      case "scadenze":
      case "attenzione_oggi":
        codes.add("D10");
        break;
      case "lavori":
      case "manutenzioni":
      case "gomme":
        codes.add("D02");
        break;
      case "rifornimenti":
        codes.add("D04");
        break;
      case "materiali":
      case "inventario":
        codes.add("D05");
        break;
      case "ordini":
      case "preventivi":
      case "fornitori":
        codes.add("D06");
        break;
      case "documenti":
      case "costi":
        codes.add("D07/D08");
        break;
      case "cisterna":
        codes.add("D09");
        break;
      default:
        break;
    }
  }

  if (codes.size > 0) {
    codes.add("D01");
  }

  return Array.from(codes);
}

function formatOutputLabel(spec: UnifiedQuerySpec): string {
  if (spec.outputPreference === "pdf") return "report PDF";
  if (spec.outputPreference === "report") return "report strutturato";
  if (spec.outputPreference === "modale") return "report modale";
  if (spec.responseFocus === "classifica") return "classifica priorita";
  if (spec.responseFocus === "risposta_breve") return "risposta breve";
  return "analisi strutturata";
}

function buildUnifiedQueryPlan(spec: UnifiedQuerySpec): UnifiedQueryPlan {
  const outputLabel = formatOutputLabel(spec);

  switch (spec.primaryIntent) {
    case "fuel_report":
    case "fuel_anomalies":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["rifornimenti"],
        domainLabel: "D04 Rifornimenti e consumi",
        domainCodes: ["D01", "D04"],
        relations: ["targa -> rifornimenti canonici", "periodo -> record con data dimostrabile"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => scope !== "rifornimenti"),
        includeIdentitySection: spec.outputPreference !== "thread",
        outputLabel,
      };
    case "vehicle_deadlines":
    case "fleet_deadlines":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["scadenze"],
        domainLabel: "D10 Scadenze, collaudi e pre-collaudi",
        domainCodes: ["D01", "D10"],
        relations: ["targa -> revisione e collaudo", "scadenza -> priorita temporale"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => !["scadenze"].includes(scope)),
        includeIdentitySection: spec.normalizedTarga !== null && spec.outputPreference !== "thread",
        outputLabel,
      };
    case "vehicle_criticality":
    case "fleet_criticality":
    case "fleet_attention":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["criticita", "scadenze", "lavori", "manutenzioni"],
        domainLabel: "D10 Stato operativo + D02 backlog tecnico",
        domainCodes: ["D01", "D10", "D02"],
        relations: ["targa -> alert e focus", "targa -> lavori aperti", "targa -> manutenzioni"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => !["criticita", "scadenze", "lavori", "manutenzioni"].includes(scope)),
        includeIdentitySection: spec.normalizedTarga !== null && spec.outputPreference !== "thread",
        outputLabel,
      };
    case "costs_documents":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["documenti", "costi"],
        domainLabel: "D07/D08 Documenti e costi",
        domainCodes: ["D01", "D07/D08"],
        relations: ["targa -> documenti", "targa -> costi mezzo"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => !["documenti", "costi"].includes(scope)),
        includeIdentitySection: spec.outputPreference !== "thread",
        outputLabel,
      };
    case "vehicle_overview":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["quadro", ...ALL_OPERATIONAL_SCOPES],
        domainLabel: "Quadro completo mezzo multi-dominio",
        domainCodes: mapScopesToDomainCodes(["quadro", ...ALL_OPERATIONAL_SCOPES]),
        relations: ["targa -> identita mezzo", "targa -> domini operativi collegati", "periodo -> filtro prudente dove dimostrabile"],
        excludedScopes: [],
        includeIdentitySection: true,
        outputLabel,
      };
    default:
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: spec.scopes,
        domainLabel:
          spec.domainBreadth === "multi_domain"
            ? "Console gestionale multi-dominio"
            : "Console gestionale mirata",
        domainCodes: mapScopesToDomainCodes(spec.scopes),
        relations: ["query -> ambiti richiesti", "periodo -> filtro prudente dove disponibile"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => !spec.scopes.includes(scope)),
        includeIdentitySection: spec.outputPreference !== "thread" && spec.normalizedTarga !== null,
        outputLabel,
      };
  }
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

function formatBulletBlock(title: string, bullets: string[]): string {
  return `${title}:\n${(bullets.length > 0 ? bullets : ["Nessun elemento rilevante."]).map((entry) => `- ${entry}`).join("\n")}`;
}

function collectVehicleOperationalSignals(
  snapshot: CentroControlloSnapshot,
  targa: string,
  periodContext: InternalAiReportPeriodContext,
) {
  const alertItems = snapshot.alerts.filter(
    (item) =>
      item.mezzoTarga === targa &&
      isTsInPeriod(item.dueTs ?? item.eventTs, periodContext),
  );
  const focusItems = snapshot.focusItems.filter(
    (item) => item.mezzoTarga === targa && isTsInPeriod(item.eventTs, periodContext),
  );
  const revisionItems = snapshot.revisioni
    .filter((item) => item.targa === targa && isTsInPeriod(item.scadenzaTs, periodContext))
    .sort((left, right) => (left.scadenzaTs ?? Number.MAX_SAFE_INTEGER) - (right.scadenzaTs ?? Number.MAX_SAFE_INTEGER));
  const sessioni = snapshot.sessioni.filter(
    (item) =>
      (item.targaMotrice === targa || item.targaRimorchio === targa) &&
      isTsInPeriod(item.timestamp, periodContext),
  );

  return {
    alertItems,
    focusItems,
    revisionItems,
    sessioni,
  };
}

function collectVehicleTechnicalSignals(
  snapshot: VehicleTechnicalSnapshot,
  periodContext: InternalAiReportPeriodContext,
) {
  return {
    lavoriAperti: snapshot.lavoriAperti.filter((item) =>
      isTsInPeriod(item.timestampInserimento ?? item.timestampEsecuzione ?? null, periodContext),
    ),
    manutenzioni: snapshot.manutenzioni.filter((item) =>
      isTsInPeriod(toTimestamp(item.data), periodContext),
    ),
  };
}

function getFuelEffectiveTimestamp(item: VehicleFuelSnapshot["items"][number]): number | null {
  return item.timestampRicostruito ?? item.timestamp ?? null;
}

function buildFuelDuplicateKey(item: VehicleFuelSnapshot["items"][number], effectiveTimestamp: number | null): string | null {
  if (effectiveTimestamp === null || item.litri === null || item.km === null) {
    return null;
  }

  return [
    String(effectiveTimestamp),
    formatDecimal(item.litri, 2),
    formatDecimal(item.km, 0),
    normalizeSearchText(item.distributore ?? "-"),
  ].join("|");
}

function buildFuelRecordBullet(record: FuelValidationRecord): string {
  const base = [
    formatDateLabel(record.effectiveTimestamp ?? record.dataLabel ?? record.dataDisplay),
    record.litri !== null ? `${formatDecimal(record.litri, 1)} L` : "litri n.d.",
    record.km !== null ? `km ${formatCount(Math.round(record.km))}` : "km n.d.",
    record.distributore ? `distributore ${record.distributore}` : "distributore n.d.",
  ].join(" | ");

  return record.status === "incluso"
    ? `${base} | incluso`
    : `${base} | escluso${record.exclusionReason ? `: ${record.exclusionReason}` : ""}`;
}

function buildFuelAnalyticsSummary(
  snapshot: VehicleFuelSnapshot,
  periodContext: InternalAiReportPeriodContext,
): FuelAnalyticsSummary {
  const targetTarga = normalizeNextMezzoTarga(snapshot.mezzoTarga);
  const scopedItems: FuelValidationRecord[] = [];
  let outsidePeriodRecords = 0;
  let undatedRecords = 0;
  let mismatchedTargaRecords = 0;

  for (const item of snapshot.items) {
    const itemTarga = normalizeNextMezzoTarga(item.targa ?? item.mezzoTarga);
    if (itemTarga !== targetTarga) {
      mismatchedTargaRecords += 1;
      continue;
    }

    const effectiveTimestamp = getFuelEffectiveTimestamp(item);
    if (periodContext.appliesFilter) {
      if (effectiveTimestamp === null) {
        undatedRecords += 1;
        continue;
      }
      if (!isTsInPeriod(effectiveTimestamp, periodContext)) {
        outsidePeriodRecords += 1;
        continue;
      }
    }

    scopedItems.push({
      ...item,
      effectiveTimestamp,
      status: "escluso",
      exclusionReason: null,
    });
  }

  const sorted = [...scopedItems].sort(
    (left, right) =>
      (left.effectiveTimestamp ?? Number.MAX_SAFE_INTEGER) -
      (right.effectiveTimestamp ?? Number.MAX_SAFE_INTEGER),
  );

  let analyzedKm = 0;
  let analyzedLiters = 0;
  let analyzedTransitions = 0;
  let totalCost = 0;
  let duplicateCount = 0;
  let missingKmCount = 0;
  let missingLitersCount = 0;
  let missingDistributorCount = 0;
  let nonIncreasingKmCount = 0;
  let fieldOnlyCount = 0;
  let heuristicCount = 0;
  let reconstructedKmCount = 0;
  const duplicateSeen = new Set<string>();
  let previousComparable: FuelValidationRecord | null = null;

  for (const item of sorted) {
    if (!item.distributore) {
      missingDistributorCount += 1;
    }

    const duplicateKey = buildFuelDuplicateKey(item, item.effectiveTimestamp);
    if (duplicateKey) {
      if (duplicateSeen.has(duplicateKey)) {
        item.exclusionReason = "possibile duplicato del record precedente";
        duplicateCount += 1;
        continue;
      }
      duplicateSeen.add(duplicateKey);
    }

    if (item.effectiveTimestamp === null) {
      item.exclusionReason = "data non verificabile";
      continue;
    }

    if (item.litri === null || item.litri <= 0) {
      item.exclusionReason = "litri mancanti o non validi";
      missingLitersCount += 1;
      continue;
    }

    if (item.km === null) {
      item.exclusionReason = "km non disponibile";
      missingKmCount += 1;
      continue;
    }

    if (previousComparable === null) {
      item.exclusionReason = "primo record utile del periodo: serve un rifornimento successivo per stimare la resa";
      previousComparable = item;
      continue;
    }

    const deltaKm = item.km - previousComparable.km!;
    if (deltaKm <= 0) {
      item.exclusionReason = "km non progressivi rispetto al record precedente";
      nonIncreasingKmCount += 1;
      continue;
    }

    item.status = "incluso";
    item.exclusionReason = null;
    analyzedKm += deltaKm;
    analyzedLiters += item.litri;
    analyzedTransitions += 1;
    totalCost += item.costo ?? 0;
    if (item.matchStrategy === "solo_campo") {
      fieldOnlyCount += 1;
    }
    if (
      item.matchStrategy === "match_euristica_10_minuti" ||
      item.matchStrategy === "match_euristica_stesso_giorno"
    ) {
      heuristicCount += 1;
    }
    if (item.fieldQuality.km === "ricostruito" || item.quality.km === "ricostruito") {
      reconstructedKmCount += 1;
    }
    previousComparable = item;
  }

  const includedRecords = sorted.filter((item) => item.status === "incluso");
  const excludedRecords = sorted.filter((item) => item.status === "escluso");
  const totalLiters = includedRecords.reduce((total, item) => total + (item.litri ?? 0), 0);
  const kmPerLiter = analyzedKm > 0 && analyzedLiters > 0 ? analyzedKm / analyzedLiters : null;
  const litersPer100Km =
    analyzedKm > 0 && analyzedLiters > 0 ? (analyzedLiters / analyzedKm) * 100 : null;
  const calculationStatus =
    kmPerLiter === null
      ? "non_calcolabile"
      : excludedRecords.length > 0 || heuristicCount > 0 || reconstructedKmCount > 0
        ? "prudente"
        : "affidabile";

  const anomalyBullets = [
    missingKmCount > 0 ? `${missingKmCount} record del periodo senza km.` : null,
    missingLitersCount > 0 ? `${missingLitersCount} record del periodo senza litri validi.` : null,
    nonIncreasingKmCount > 0 ? `${nonIncreasingKmCount} record esclusi per km non progressivi.` : null,
    duplicateCount > 0 ? `${duplicateCount} possibili duplicati esclusi.` : null,
    missingDistributorCount > 0 ? `${missingDistributorCount} record del periodo senza distributore dichiarato.` : null,
    fieldOnlyCount > 0 ? `${fieldOnlyCount} record inclusi leggono solo il feed campo.` : null,
    heuristicCount > 0 ? `${heuristicCount} record inclusi usano un aggancio prudenziale tra fonti.` : null,
    reconstructedKmCount > 0 ? `${reconstructedKmCount} record inclusi usano km ricostruito.` : null,
    ...excludedRecords.slice(0, 4).map((item) =>
      `${formatDateLabel(item.effectiveTimestamp ?? item.dataLabel ?? item.dataDisplay)}: ${item.exclusionReason ?? "record escluso dal calcolo"}.`,
    ),
  ].filter((entry): entry is string => Boolean(entry));

  const actionBullets = [
    kmPerLiter === null
      ? "Media km/l non calcolabile in modo affidabile: servono almeno due rifornimenti consecutivi con km progressivi e litri validi nel periodo richiesto."
      : calculationStatus === "prudente"
        ? "Usa la media come indicazione prudente e verifica i record esclusi prima di prendere decisioni economiche."
        : "La sequenza letta nel periodo e coerente: la media puo essere usata come riferimento operativo del periodo.",
    excludedRecords.length > 0
      ? "Conviene verificare i record esclusi prima di consolidare confronti mensili o confronti costo/km."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    recordsFound: sorted.length,
    includedRecords: includedRecords.length,
    excludedRecords: excludedRecords.length,
    outsidePeriodRecords,
    undatedRecords,
    periodGuardedRecords: mismatchedTargaRecords,
    totalRecords: sorted.length,
    totalLiters,
    totalCost,
    analyzedKm,
    analyzedLiters,
    analyzedTransitions,
    kmPerLiter,
    litersPer100Km,
    calculationStatus,
    anomalyBullets,
    recordBullets: sorted.map((item) => buildFuelRecordBullet(item)),
    actionBullets,
    missingData: [
      ...(snapshot.limitations ?? []).slice(0, 2),
      periodContext.appliesFilter && outsidePeriodRecords > 0
        ? `${outsidePeriodRecords} rifornimenti storici della targa sono fuori periodo e non entrano nel report.`
        : null,
      periodContext.appliesFilter && undatedRecords > 0
        ? `${undatedRecords} rifornimenti della targa non hanno una data verificabile e non possono essere attribuiti al periodo richiesto.`
        : null,
      mismatchedTargaRecords > 0
        ? `${mismatchedTargaRecords} record con targa non coerente sono stati esclusi dal perimetro.`
        : null,
      kmPerLiter === null && sorted.length > 0
        ? "La media consumi viene mostrata solo quando esiste una sequenza ordinata con km progressivi e litri validi."
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

function buildVehiclePrioritySummary(args: {
  operational: ReturnType<typeof collectVehicleOperationalSignals>;
  technical: ReturnType<typeof collectVehicleTechnicalSignals>;
}): VehiclePrioritySummary {
  const alertDangerCount = args.operational.alertItems.filter(
    (item) => item.severity === "danger",
  ).length;
  const alertWarningCount = args.operational.alertItems.filter(
    (item) => item.severity === "warning",
  ).length;
  const focusKoCount = args.operational.focusItems.filter(
    (item) => item.kind === "controllo_ko",
  ).length;
  const newSignalCount = args.operational.alertItems.filter(
    (item) => item.kind === "segnalazione_nuova",
  ).length;
  const overdueRevisions = args.operational.revisionItems.filter(
    (item) => item.giorni !== null && item.giorni < 0,
  ).length;
  const dueSoonRevisions = args.operational.revisionItems.filter(
    (item) => item.giorni !== null && item.giorni >= 0 && item.giorni <= 7,
  ).length;
  const upcomingRevisions = args.operational.revisionItems.filter(
    (item) => item.giorni !== null && item.giorni >= 0 && item.giorni <= 30,
  ).length;
  const openWorks = args.technical.lavoriAperti.length;
  const highUrgencyWorks = args.technical.lavoriAperti.filter(
    (item) => item.urgenza === "alta",
  ).length;
  const maintenanceCount = args.technical.manutenzioni.length;

  const reasons = [
    overdueRevisions > 0 ? `${overdueRevisions} revisione/collaudo scaduti` : null,
    dueSoonRevisions > 0 ? `${dueSoonRevisions} scadenze entro 7 giorni` : null,
    alertDangerCount > 0 ? `${alertDangerCount} alert critici` : null,
    focusKoCount > 0 ? `${focusKoCount} controlli KO` : null,
    highUrgencyWorks > 0 ? `${highUrgencyWorks} lavori alta urgenza` : null,
    newSignalCount > 0 ? `${newSignalCount} segnalazioni nuove` : null,
    openWorks > 0 ? `${openWorks} lavori aperti` : null,
    maintenanceCount > 0 ? `${maintenanceCount} manutenzioni collegate` : null,
  ].filter((entry): entry is string => Boolean(entry));

  const priorityLabel =
    overdueRevisions > 0 ||
    dueSoonRevisions > 0 ||
    alertDangerCount > 0 ||
    focusKoCount > 0 ||
    highUrgencyWorks > 0
      ? "alta"
      : upcomingRevisions > 0 ||
          alertWarningCount > 0 ||
          openWorks > 0 ||
          maintenanceCount > 0 ||
          newSignalCount > 0
        ? "media"
        : "bassa";

  return {
    priorityLabel,
    reasons,
    alertDangerCount,
    alertWarningCount,
    focusKoCount,
    newSignalCount,
    overdueRevisions,
    dueSoonRevisions,
    upcomingRevisions,
    openWorks,
    highUrgencyWorks,
    maintenanceCount,
  };
}

function compareRankValues(left: number[], right: number[]): number {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (right[index] ?? 0) - (left[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function buildFleetPriorityRows(args: {
  centro: CentroControlloSnapshot;
  lavori: LavoriInAttesaSnapshot;
  operativita: OperativitaGlobaleSnapshot;
  periodContext: InternalAiReportPeriodContext;
}): FleetPriorityRow[] {
  const registry = new Map<string, Omit<FleetPriorityRow, "priorityLabel" | "reasons" | "rankValues">>();

  const ensureRow = (targaInput: string | null | undefined) => {
    const normalizedTarga = normalizeNextMezzoTarga(targaInput);
    if (!normalizedTarga) {
      return null;
    }

    if (!registry.has(normalizedTarga)) {
      registry.set(normalizedTarga, {
        targa: normalizedTarga,
        alertDangerCount: 0,
        alertWarningCount: 0,
        focusKoCount: 0,
        newSignalCount: 0,
        overdueRevisions: 0,
        dueSoonRevisions: 0,
        upcomingRevisions: 0,
        openWorks: 0,
        highUrgencyWorks: 0,
        maintenanceCount: 0,
        preCollaudoSuggested: false,
      });
    }

    return registry.get(normalizedTarga)!;
  };

  for (const revision of args.centro.revisioni) {
    if (!isTsInPeriod(revision.scadenzaTs, args.periodContext)) continue;
    const row = ensureRow(revision.targa);
    if (!row) continue;
    if (revision.giorni !== null && revision.giorni < 0) row.overdueRevisions += 1;
    if (revision.giorni !== null && revision.giorni >= 0 && revision.giorni <= 7) {
      row.dueSoonRevisions += 1;
    }
    if (revision.giorni !== null && revision.giorni <= 30) row.upcomingRevisions += 1;
    if (revision.giorni !== null && revision.giorni <= 30 && !revision.preCollaudo?.data) {
      row.preCollaudoSuggested = true;
    }
  }

  for (const alert of args.centro.alerts) {
    if (!isTsInPeriod(alert.dueTs ?? alert.eventTs, args.periodContext)) continue;
    const row = ensureRow(alert.mezzoTarga);
    if (!row) continue;
    if (alert.severity === "danger") row.alertDangerCount += 1;
    if (alert.severity === "warning") row.alertWarningCount += 1;
    if (alert.kind === "segnalazione_nuova") row.newSignalCount += 1;
  }

  for (const focus of args.centro.focusItems) {
    if (!isTsInPeriod(focus.eventTs, args.periodContext)) continue;
    const row = ensureRow(focus.mezzoTarga);
    if (!row) continue;
    if (focus.kind === "controllo_ko") row.focusKoCount += 1;
  }

  for (const group of args.lavori.groups) {
    if (group.kind !== "mezzo" || !group.mezzo?.targa) continue;
    const row = ensureRow(group.mezzo.targa);
    if (!row) continue;
    const relevantItems = group.items.filter((item) =>
      isTsInPeriod(item.timestampInserimento ?? item.timestampEsecuzione, args.periodContext),
    );
    row.openWorks += relevantItems.length;
    row.highUrgencyWorks += relevantItems.filter((item) => item.urgenza === "alta").length;
  }

  for (const maintenance of args.operativita.manutenzioni.items) {
    if (!isTsInPeriod(maintenance.timestamp, args.periodContext)) continue;
    const row = ensureRow(maintenance.targa);
    if (!row) continue;
    row.maintenanceCount += 1;
  }

  return Array.from(registry.values())
    .map((entry) => {
      const reasons = [
        entry.overdueRevisions > 0 ? `${entry.overdueRevisions} revisione/collaudo scaduti` : null,
        entry.dueSoonRevisions > 0 ? `${entry.dueSoonRevisions} scadenze entro 7 giorni` : null,
        entry.alertDangerCount > 0 ? `${entry.alertDangerCount} alert critici` : null,
        entry.focusKoCount > 0 ? `${entry.focusKoCount} controlli KO` : null,
        entry.highUrgencyWorks > 0 ? `${entry.highUrgencyWorks} lavori alta urgenza` : null,
        entry.newSignalCount > 0 ? `${entry.newSignalCount} segnalazioni nuove` : null,
        entry.openWorks > 0 ? `${entry.openWorks} lavori aperti` : null,
        entry.maintenanceCount > 0 ? `${entry.maintenanceCount} manutenzioni collegate` : null,
      ].filter((reason): reason is string => Boolean(reason));
      const priorityLabel =
        entry.overdueRevisions > 0 ||
        entry.dueSoonRevisions > 0 ||
        entry.alertDangerCount > 0 ||
        entry.focusKoCount > 0 ||
        entry.highUrgencyWorks > 0
          ? "alta"
          : entry.upcomingRevisions > 0 ||
              entry.alertWarningCount > 0 ||
              entry.openWorks > 0 ||
              entry.maintenanceCount > 0 ||
              entry.newSignalCount > 0
            ? "media"
            : "bassa";
      const rankValues = [
        entry.overdueRevisions,
        entry.dueSoonRevisions,
        entry.alertDangerCount,
        entry.focusKoCount,
        entry.highUrgencyWorks,
        entry.newSignalCount,
        entry.alertWarningCount,
        entry.openWorks,
        entry.maintenanceCount,
      ];

      return {
        targa: entry.targa,
        priorityLabel: priorityLabel as FleetPriorityRow["priorityLabel"],
        reasons,
        alertDangerCount: entry.alertDangerCount,
        alertWarningCount: entry.alertWarningCount,
        focusKoCount: entry.focusKoCount,
        newSignalCount: entry.newSignalCount,
        overdueRevisions: entry.overdueRevisions,
        dueSoonRevisions: entry.dueSoonRevisions,
        upcomingRevisions: entry.upcomingRevisions,
        openWorks: entry.openWorks,
        highUrgencyWorks: entry.highUrgencyWorks,
        maintenanceCount: entry.maintenanceCount,
        preCollaudoSuggested: entry.preCollaudoSuggested,
        rankValues,
      };
    })
    .sort((left, right) => compareRankValues(left.rankValues, right.rankValues) || left.targa.localeCompare(right.targa));
}

function composeFuelAssistantText(args: {
  targa: string;
  analytics: FuelAnalyticsSummary;
  spec: UnifiedQuerySpec;
  periodContext: InternalAiReportPeriodContext;
}): string {
  const summary =
    args.analytics.recordsFound === 0
      ? `Nel periodo ${args.periodContext.label} non risultano rifornimenti collegati in modo dimostrabile alla targa ${args.targa}.`
      : args.analytics.kmPerLiter !== null
        ? `Nel periodo ${args.periodContext.label} ho trovato ${formatCount(args.analytics.recordsFound)} rifornimenti per ${args.targa}; ${formatCount(args.analytics.includedRecords)} sono entrati nel calcolo e ${formatCount(args.analytics.excludedRecords)} sono stati esclusi. La media stimata e ${formatDecimal(args.analytics.kmPerLiter)} km/l su ${formatCount(Math.round(args.analytics.analyzedKm))} km analizzati.`
        : `Nel periodo ${args.periodContext.label} ho trovato ${formatCount(args.analytics.recordsFound)} rifornimenti per ${args.targa}, ma la media km/l non e calcolabile in modo affidabile con i record disponibili.`;

  const foundBullets = [
    `Targa: ${args.targa}`,
    `Rifornimenti trovati nel periodo: ${formatCount(args.analytics.recordsFound)}`,
    `Rifornimenti inclusi nel calcolo: ${formatCount(args.analytics.includedRecords)}`,
    `Rifornimenti esclusi dal calcolo: ${formatCount(args.analytics.excludedRecords)}`,
    args.analytics.outsidePeriodRecords > 0
      ? `Rifornimenti storici fuori periodo: ${formatCount(args.analytics.outsidePeriodRecords)}`
      : null,
    args.analytics.undatedRecords > 0
      ? `Rifornimenti senza data verificabile: ${formatCount(args.analytics.undatedRecords)}`
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const metricBullets = [
    `Litri inclusi nel calcolo: ${formatDecimal(args.analytics.totalLiters, 1)} L`,
    args.analytics.totalCost > 0 ? `Costo incluso nel calcolo: ${formatCurrency(args.analytics.totalCost)}` : null,
    args.analytics.analyzedKm > 0 ? `Km analizzati: ${formatCount(Math.round(args.analytics.analyzedKm))}` : null,
    args.spec.metrics.includes("km_per_liter") && args.analytics.kmPerLiter !== null
      ? `Media km/l: ${formatDecimal(args.analytics.kmPerLiter)}`
      : null,
    args.spec.metrics.includes("liters_per_100_km") && args.analytics.litersPer100Km !== null
      ? `Litri per 100 km: ${formatDecimal(args.analytics.litersPer100Km)}`
      : null,
    args.analytics.kmPerLiter === null ? "Media km/l: non calcolabile in modo affidabile" : null,
    args.analytics.kmPerLiter === null ? "L/100km: non calcolabile in modo affidabile" : null,
    `Stato del calcolo: ${args.analytics.calculationStatus === "affidabile" ? "affidabile" : args.analytics.calculationStatus === "prudente" ? "prudente" : "non calcolabile"}`,
  ].filter((entry): entry is string => Boolean(entry));

  return [
    `Report rifornimenti ${args.targa}`,
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Dati trovati", foundBullets),
    formatBulletBlock("Dati usati per il calcolo", metricBullets),
    formatBulletBlock("Record del periodo", args.analytics.recordBullets.slice(0, 8)),
    formatBulletBlock("Anomalie", args.analytics.anomalyBullets.slice(0, 6)),
    formatBulletBlock("Azione consigliata", args.analytics.actionBullets),
    formatBulletBlock("Limiti", args.analytics.missingData.slice(0, 4)),
  ].join("\n\n");
}

function composeVehicleDeadlineAssistantText(args: {
  targa: string;
  operational: ReturnType<typeof collectVehicleOperationalSignals>;
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
}): string {
  const revisionBullets = args.operational.revisionItems.slice(0, 5).map((item) => {
    const dayLabel =
      item.giorni == null
        ? "giorni da verificare"
        : item.giorni < 0
          ? `scaduta da ${Math.abs(item.giorni)} giorni`
          : `tra ${item.giorni} giorni`;
    return `${formatDateLabel(item.scadenzaTs)} | ${dayLabel}`;
  });
  const collaudoBullets = args.operational.revisionItems
    .filter((item) => item.giorni !== null && item.giorni <= 30)
    .slice(0, 5)
    .map((item) =>
      `${formatDateLabel(item.scadenzaTs)} | prenotazione ${item.prenotazioneCollaudo?.completata ? "gia chiusa" : item.prenotazioneCollaudo?.data ? `prevista ${item.prenotazioneCollaudo.data}` : "non presente"}`,
    );
  const preCollaudoBullets = args.operational.revisionItems
    .filter((item) => item.giorni !== null && item.giorni <= 30 && !item.preCollaudo?.data)
    .slice(0, 5)
    .map((item) => `${formatDateLabel(item.scadenzaTs)} | utile organizzare pre-collaudo.`);
  const alertBullets = args.operational.alertItems
    .slice(0, 4)
    .map((item) => `${item.title}: ${item.detailText}`);

  const summary =
    revisionBullets.length > 0
      ? `${args.targa} ha ${formatCount(revisionBullets.length)} scadenze rilevanti nel periodo ${args.periodContext.label}.`
      : `${args.targa} non mostra scadenze o collaudi rilevanti nel periodo ${args.periodContext.label}.`;

  return [
    `Scadenze ${args.targa}`,
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Scadenze rilevanti", revisionBullets),
    formatBulletBlock("Collaudi da seguire", collaudoBullets),
    formatBulletBlock("Pre-collaudi consigliati", preCollaudoBullets),
    formatBulletBlock("Alert collegati", alertBullets),
    formatBulletBlock("Limiti", args.limitations.slice(0, 4)),
  ].join("\n\n");
}

function composeVehicleCriticalityAssistantText(args: {
  targa: string;
  operational: ReturnType<typeof collectVehicleOperationalSignals>;
  technical: ReturnType<typeof collectVehicleTechnicalSignals>;
  priority: VehiclePrioritySummary;
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
}): string {
  const summary =
    args.priority.reasons.length > 0
      ? `${args.targa} oggi ha priorita ${args.priority.priorityLabel}. Pesano soprattutto ${args.priority.reasons.slice(0, 3).join(", ")}.`
      : `${args.targa} non mostra segnali forti di criticita nel periodo ${args.periodContext.label}.`;

  return [
    `Criticita ${args.targa}`,
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Fattori prioritari", args.priority.reasons.slice(0, 6)),
    formatBulletBlock(
      "Scadenze e alert",
      [
        ...args.operational.revisionItems.slice(0, 3).map((item) => `${formatDateLabel(item.scadenzaTs)} | ${item.giorni == null ? "giorni da verificare" : item.giorni < 0 ? `scaduta da ${Math.abs(item.giorni)} giorni` : `tra ${item.giorni} giorni`}`),
        ...args.operational.alertItems.slice(0, 3).map((item) => `${item.title}: ${item.detailText}`),
        ...args.operational.focusItems.slice(0, 2).map((item) => `${item.title}: ${item.detailText}`),
      ],
    ),
    formatBulletBlock(
      "Backlog tecnico",
      [
        ...args.technical.lavoriAperti.slice(0, 4).map((item) => `${item.descrizione}${item.urgenza ? ` | urgenza ${item.urgenza}` : ""}`),
        ...args.technical.manutenzioni.slice(0, 3).map((item) => `${item.descrizione ?? item.tipo ?? "manutenzione"}${item.data ? ` | ${item.data}` : ""}`),
      ],
    ),
    formatBulletBlock("Limiti", args.limitations.slice(0, 4)),
  ].join("\n\n");
}

function composeVehicleOverviewAssistantText(args: {
  targa: string;
  keyPoints: string[];
  sections: UnifiedSectionBuild[];
  missingData: string[];
}): string {
  return [
    `Quadro completo ${args.targa}`,
    `Sintesi breve: ho composto un quadro gestionale multi-dominio della targa ${args.targa} senza allargare oltre le fonti richieste.`,
    formatBulletBlock("Punti chiave", args.keyPoints.slice(0, 6)),
    formatBulletBlock(
      "Sezioni lette",
      args.sections.map((entry) => `${entry.section.title}: ${entry.section.summary}`).slice(0, 6),
    ),
    formatBulletBlock("Limiti", args.missingData.slice(0, 6)),
  ].join("\n\n");
}

function composeFleetCriticalityAssistantText(args: {
  title: string;
  rows: FleetPriorityRow[];
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
}): string {
  const top = args.rows[0] ?? null;
  const summary = top
    ? `${top.targa} e il mezzo piu critico nel periodo ${args.periodContext.label}: ${top.reasons.slice(0, 3).join(", ")}.`
    : `Non emergono mezzi con criticita forti nel periodo ${args.periodContext.label}.`;

  return [
    args.title,
    `Sintesi breve: ${summary}`,
    formatBulletBlock(
      "Priorita mezzi",
      args.rows.slice(0, 6).map((row, index) => `${index + 1}. ${row.targa} | priorita ${row.priorityLabel} | ${row.reasons.slice(0, 3).join(", ") || "nessun fattore forte"}`),
    ),
    formatBulletBlock(
      "Cosa pesa di piu",
      args.rows
        .slice(0, 4)
        .flatMap((row) =>
          row.reasons.slice(0, 2).map((reason) => `${row.targa}: ${reason}`),
        ),
    ),
    formatBulletBlock("Limiti", args.limitations.slice(0, 5)),
  ].join("\n\n");
}

function composeFleetDeadlineAssistantText(args: {
  rows: FleetPriorityRow[];
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
}): string {
  const deadlineRows = args.rows.filter(
    (row) => row.overdueRevisions > 0 || row.upcomingRevisions > 0,
  );
  const preCollaudoRows = deadlineRows.filter((row) => row.preCollaudoSuggested);
  const summary =
    deadlineRows.length > 0
      ? `${formatCount(deadlineRows.length)} mezzi richiedono attenzione su revisione/collaudo nel periodo ${args.periodContext.label}; ${formatCount(preCollaudoRows.length)} conviene pre-collaudarli.`
      : `Nel periodo ${args.periodContext.label} non emergono mezzi con scadenze rilevanti di revisione o collaudo.`;

  return [
    "Scadenze, collaudi e pre-collaudi",
    `Sintesi breve: ${summary}`,
    formatBulletBlock(
      "Mezzi da seguire",
      deadlineRows
        .slice(0, 6)
        .map((row) => `${row.targa} | scadute ${row.overdueRevisions} | entro 7 giorni ${row.dueSoonRevisions} | entro 30 giorni ${row.upcomingRevisions}`),
    ),
    formatBulletBlock(
      "Pre-collaudi consigliati",
      preCollaudoRows.slice(0, 6).map((row) => `${row.targa} | revisione vicina e pre-collaudo non rilevato.`),
    ),
    formatBulletBlock("Limiti", args.limitations.slice(0, 5)),
  ].join("\n\n");
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
  const { alertItems, focusItems, revisionItems, sessioni } = collectVehicleOperationalSignals(
    snapshot,
    args.targa,
    args.periodContext,
  );
  const revisionItem = revisionItems[0] ?? null;

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
      summary:
        alertItems.length || focusItems.length || revisionItem
          ? `Trovati ${alertItems.length} alert, ${focusItems.length} focus e ${revisionItem ? "una scadenza collegata" : "nessuna scadenza collegata"}`
          : "Nessun alert o focus collegato in modo forte alla targa nel periodo richiesto.",
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
  const { lavoriAperti, manutenzioni } = collectVehicleTechnicalSignals(
    snapshot,
    args.periodContext,
  );
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
      summary: `Nel backlog tecnico del mezzo risultano ${snapshot.counts.lavoriAperti} lavori aperti e ${snapshot.counts.manutenzioni} manutenzioni.`,
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

function buildRifornimentiSections(args: {
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
  analytics: FuelAnalyticsSummary;
}): UnifiedSectionBuild[] {
  const analytics = args.analytics;
  const bullets = [
    `Rifornimenti trovati nel periodo: ${formatCount(analytics.recordsFound)}`,
    `Rifornimenti inclusi nel calcolo: ${formatCount(analytics.includedRecords)}`,
    `Rifornimenti esclusi dal calcolo: ${formatCount(analytics.excludedRecords)}`,
    `Litri inclusi: ${formatDecimal(analytics.totalLiters, 1)} L`,
    analytics.analyzedKm > 0 ? `Km analizzati: ${formatCount(Math.round(analytics.analyzedKm))}` : null,
    analytics.kmPerLiter !== null ? `Media km/l: ${formatDecimal(analytics.kmPerLiter)}` : "Media km/l: non calcolabile in modo affidabile",
    analytics.litersPer100Km !== null
      ? `Litri per 100 km: ${formatDecimal(analytics.litersPer100Km)}`
      : "Litri per 100 km: non calcolabili in modo affidabile",
  ].filter((entry): entry is string => Boolean(entry));
  const sources = mergePreviewSources(
    ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return [
    {
      section: buildSection({
        id: "rifornimenti",
        title: "Rifornimenti e consumi",
        summary:
          analytics.recordsFound > 0
            ? analytics.kmPerLiter !== null
              ? `Trovati ${formatCount(analytics.recordsFound)} rifornimenti nel periodo; ${formatCount(analytics.includedRecords)} sono entrati nel calcolo e la resa media stimata e ${formatDecimal(analytics.kmPerLiter)} km/l.`
              : `Trovati ${formatCount(analytics.recordsFound)} rifornimenti nel periodo, ma la resa non e calcolabile in modo affidabile con i record disponibili.`
            : "Nessun rifornimento collegato in modo dimostrabile nel periodo richiesto.",
        bullets,
        notes: analytics.missingData.slice(0, 3),
        status: analytics.recordsFound > 0 ? "completa" : "parziale",
        periodContext: args.periodContext,
      }),
      sources,
      keyPoints: bullets.slice(0, 4),
      missingData:
        analytics.recordsFound > 0
          ? analytics.missingData.slice(0, 4)
          : ["D04 resta presente nel registry ma non ha rifornimenti agganciati in modo forte alla targa nel periodo richiesto."],
      evidences: bullets.slice(0, 3),
    },
    {
      section: buildSection({
        id: "rifornimenti-records",
        title: "Record del periodo",
        summary:
          analytics.recordsFound > 0
            ? "Elenco dei rifornimenti del periodo con stato incluso/escluso e motivo di esclusione."
            : "Nessun record nel periodo richiesto.",
        bullets: analytics.recordBullets.slice(0, 14),
        notes:
          analytics.recordBullets.length > 14
            ? [`Mostro i primi 14 record del periodo su ${analytics.recordBullets.length}.`]
            : [],
        status: analytics.recordsFound > 0 ? "completa" : "vuota",
        periodContext: args.periodContext,
      }),
      sources,
      keyPoints: analytics.recordBullets.slice(0, 2),
      missingData: [],
      evidences: analytics.recordBullets.slice(0, 3),
    },
    {
      section: buildSection({
        id: "rifornimenti-anomalie",
        title: "Anomalie rilevate",
        summary:
          analytics.anomalyBullets.length > 0
            ? "Le esclusioni e le incoerenze rilevate sono elencate qui sotto."
            : "Non emergono anomalie forti oltre ai limiti gia dichiarati.",
        bullets: analytics.anomalyBullets.slice(0, 10),
        notes: [],
        status: analytics.anomalyBullets.length > 0 ? "parziale" : "completa",
        periodContext: args.periodContext,
      }),
      sources,
      keyPoints: analytics.anomalyBullets.slice(0, 3),
      missingData: analytics.anomalyBullets.length > 0 ? analytics.missingData.slice(0, 2) : [],
      evidences: analytics.anomalyBullets.slice(0, 2),
    },
    {
      section: buildSection({
        id: "rifornimenti-azioni",
        title: "Azione consigliata",
        summary: analytics.actionBullets[0] ?? "Nessuna azione consigliata aggiuntiva.",
        bullets: analytics.actionBullets,
        notes: [],
        status: "completa",
        periodContext: args.periodContext,
      }),
      sources,
      keyPoints: analytics.actionBullets.slice(0, 1),
      missingData: [],
      evidences: analytics.actionBullets.slice(0, 1),
    },
  ];
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

function buildVehicleReportTitle(
  selectedScopes: InternalAiUnifiedScopeId[],
  targa: string,
): string {
  if (selectedScopes.length === 1 && selectedScopes[0] === "rifornimenti") {
    return `Report rifornimenti ${targa}`;
  }
  if (selectedScopes.length === 1 && selectedScopes[0] === "scadenze") {
    return `Report scadenze ${targa}`;
  }
  if (
    selectedScopes.every((scope) =>
      ["criticita", "scadenze", "lavori", "manutenzioni"].includes(scope),
    )
  ) {
    return `Report criticita ${targa}`;
  }
  return `Report gestionale ${targa}`;
}

function buildVehiclePreview(args: {
  mezzo: NextAnagraficheFlottaMezzoItem;
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  sources: InternalAiVehicleReportSource[];
  missingData: string[];
  evidences: string[];
  selectedScopes: InternalAiUnifiedScopeId[];
  fuelAnalytics?: FuelAnalyticsSummary | null;
}): InternalAiVehicleReportPreview {
  const criticalCount = args.sections
    .filter((section) => section.id === "stato-operativo-attuale" || section.id === "lavori-manutenzioni")
    .reduce((total, section) => total + section.bullets.length, 0);
  const isFuelReport =
    args.selectedScopes.length === 1 && args.selectedScopes[0] === "rifornimenti" && args.fuelAnalytics;
  const cards = isFuelReport
    ? [
        {
          label: "Trovati nel periodo",
          value: `${args.fuelAnalytics?.recordsFound ?? 0}`,
          meta: "rifornimenti letti nel periodo richiesto",
        },
        {
          label: "Inclusi nel calcolo",
          value: `${args.fuelAnalytics?.includedRecords ?? 0}`,
          meta: "record usati per la media consumi",
        },
        {
          label: "Esclusi",
          value: `${args.fuelAnalytics?.excludedRecords ?? 0}`,
          meta: "record esclusi con motivo dichiarato",
        },
        {
          label: "Media km/l",
          value:
            args.fuelAnalytics?.kmPerLiter !== null && args.fuelAnalytics?.kmPerLiter !== undefined
              ? formatDecimal(args.fuelAnalytics.kmPerLiter)
              : "n.d.",
          meta:
            args.fuelAnalytics?.calculationStatus === "affidabile"
              ? "calcolo affidabile"
              : args.fuelAnalytics?.calculationStatus === "prudente"
                ? "calcolo prudente"
                : "calcolo non disponibile",
        },
      ]
    : [
        { label: "Sezioni utili", value: `${args.sections.length}`, meta: "sezioni combinate nel report" },
        { label: "Fonti coinvolte", value: `${args.sources.length}`, meta: "fonti dichiarate nel report" },
        { label: "Segnali prioritari", value: `${criticalCount}`, meta: "alert, focus, lavori e note principali" },
        { label: "Dati mancanti", value: `${args.missingData.length}`, meta: "limiti dichiarati nel report" },
      ];

  return {
    reportType: "targa",
    targetId: args.mezzo.id,
    targetLabel: args.mezzo.targa,
    mezzoTarga: args.mezzo.targa,
    title: buildVehicleReportTitle(args.selectedScopes, args.mezzo.targa),
    subtitle: isFuelReport
      ? `Targa ${args.mezzo.targa} | periodo ${args.periodContext.label}`
      : `Ambiti: ${args.selectedScopes.map((scope) => formatScopeLabel(scope)).join(", ") || "quadro operativo"} | periodo ${args.periodContext.label}`,
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
    cards,
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
  const plan = buildUnifiedQueryPlan(spec);
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);

  if (spec.periodExplicitRequested && (!spec.periodResolved || !periodContext.isValid)) {
    return {
      intent: spec.outputPreference === "thread" ? "richiesta_generica" : "report_targa",
      status: "partial",
      assistantText:
        "Ho rilevato una richiesta con periodo esplicito, ma il periodo non e stato interpretato in modo affidabile.\n\n" +
        "Per evitare di allargare il report allo storico completo, fermo qui il calcolo e ti chiedo di indicare il periodo in modo piu chiaro, ad esempio:\n" +
        '- "questo mese"\n' +
        '- "marzo 2026"\n' +
        '- "dal 01/03/2026 al 31/03/2026"',
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
        targa: spec.normalizedTarga,
      }),
      report: spec.outputPreference === "thread"
        ? null
        : {
            status: "invalid_query",
            normalizedTarga: spec.normalizedTarga,
            message: "Periodo esplicito non interpretato in modo affidabile: report non generato per evitare storico completo.",
            preview: null,
          },
    };
  }

  if (!spec.normalizedTarga) {
    return {
      intent: spec.outputPreference === "thread" ? "richiesta_generica" : "report_targa",
      status: "partial",
      assistantText:
        "Per questa richiesta mi serve una targa valida, altrimenti rischio di allargare il perimetro oltre il necessario.\n\n" +
        'Esempi utili: "dimmi i consumi del mezzo TI233827" oppure "fammi il quadro completo della targa AB123CD".',
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
      }),
      report: spec.outputPreference === "thread" ? null : { status: "invalid_query", normalizedTarga: null, message: "Serve una targa valida per report, modale o PDF del motore unificato.", preview: null },
    };
  }

  const mezzo = await readNextMezzoByTarga(spec.normalizedTarga);
  if (!mezzo) {
    return {
      intent: spec.outputPreference === "thread" ? "mezzo_dossier" : "report_targa",
      status: "partial",
      assistantText: `Non trovo la targa ${spec.normalizedTarga} nelle anagrafiche lette in sola lettura dal clone NEXT.`,
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: "D01 Anagrafica mezzo",
        outputLabel: plan.outputLabel,
        targa: spec.normalizedTarga,
      }),
      report: spec.outputPreference === "thread" ? null : { status: "not_found", normalizedTarga: spec.normalizedTarga, message: "La targa non e presente nelle anagrafiche clone-safe.", preview: null },
    };
  }

  const selectedScopes = plan.selectedScopes;
  const linkedRecords = collectLinkedRecords(registry, {
    ...spec,
    normalizedTarga: mezzo.targa,
    scopes: selectedScopes,
  });
  const sections: UnifiedSectionBuild[] = [];
  if (plan.includeIdentitySection) {
    sections.push(buildIdentitySection(mezzo, periodContext));
  }

  const needsOperational =
    selectedScopes.includes("criticita") ||
    selectedScopes.includes("scadenze") ||
    selectedScopes.includes("quadro");
  const needsTechnical =
    selectedScopes.includes("criticita") ||
    selectedScopes.includes("lavori") ||
    selectedScopes.includes("manutenzioni") ||
    selectedScopes.includes("quadro");

  if (needsOperational) {
    sections.push(await buildOperationalSection({ targa: mezzo.targa, periodContext, registry }));
  }
  if (needsTechnical) {
    sections.push(await buildTecnicaSection({ targa: mezzo.targa, periodContext, registry }));
  }
  if (selectedScopes.includes("gomme") || selectedScopes.includes("quadro")) sections.push(await buildGommeSection({ targa: mezzo.targa, periodContext, registry }));
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

  const [operationalSnapshot, technicalSnapshot, fuelSnapshot] = await Promise.all([
    needsOperational ? readNextCentroControlloSnapshot() : Promise.resolve(null),
    needsTechnical ? readNextMezzoOperativitaTecnicaSnapshot(mezzo.targa) : Promise.resolve(null),
    selectedScopes.includes("rifornimenti") || selectedScopes.includes("quadro")
      ? readNextMezzoRifornimentiSnapshot(mezzo.targa)
      : Promise.resolve(null),
  ]);

  const operationalSignals =
    operationalSnapshot !== null
      ? collectVehicleOperationalSignals(operationalSnapshot, mezzo.targa, periodContext)
      : null;
  const technicalSignals =
    technicalSnapshot !== null
      ? collectVehicleTechnicalSignals(technicalSnapshot, periodContext)
      : null;
  const prioritySummary =
    operationalSignals && technicalSignals
      ? buildVehiclePrioritySummary({
          operational: operationalSignals,
          technical: technicalSignals,
        })
      : null;
  const fuelAnalytics =
    fuelSnapshot !== null ? buildFuelAnalyticsSummary(fuelSnapshot, periodContext) : null;
  if (fuelAnalytics) {
    sections.push(
      ...buildRifornimentiSections({
        periodContext,
        registry,
        analytics: fuelAnalytics,
      }),
    );
  }
  const allSources = mergePreviewSources(sections.flatMap((section) => section.sources));
  const missingData = dedupeStrings(sections.flatMap((section) => section.missingData));
  const evidences = dedupeStrings(sections.flatMap((section) => section.evidences));
  const keyPoints = dedupeStrings(sections.flatMap((section) => section.keyPoints)).slice(0, 8);
  const reliabilityLabel =
    linkedRecords.some((entry) => entry.linkReliability === "alta") && keyPoints.length > 0
      ? "Affidabile"
      : linkedRecords.length > 0
        ? "Parziale"
        : "Da verificare";

  let assistantText = [
    `Analisi ${mezzo.targa}`,
    `Sintesi breve: ho letto gli ambiti richiesti per ${mezzo.targa} nel periodo ${periodContext.label}.`,
    formatBulletBlock("Punti chiave", keyPoints),
    formatBulletBlock(
      "Sezioni lette",
      sections.map((entry) => `${entry.section.title}: ${entry.section.summary}`).slice(0, 6),
    ),
    formatBulletBlock("Limiti", missingData.slice(0, 6)),
  ].join("\n\n");

  switch (plan.primaryIntent) {
    case "fuel_report":
    case "fuel_anomalies":
      if (fuelAnalytics) {
        assistantText = composeFuelAssistantText({
          targa: mezzo.targa,
          analytics: fuelAnalytics,
          spec,
          periodContext,
        });
      }
      break;
    case "vehicle_deadlines":
      if (operationalSignals && operationalSnapshot) {
        assistantText = composeVehicleDeadlineAssistantText({
          targa: mezzo.targa,
          operational: operationalSignals,
          limitations: operationalSnapshot.limitations,
          periodContext,
        });
      }
      break;
    case "vehicle_criticality":
      if (operationalSignals && technicalSignals && prioritySummary) {
        assistantText = composeVehicleCriticalityAssistantText({
          targa: mezzo.targa,
          operational: operationalSignals,
          technical: technicalSignals,
          priority: prioritySummary,
          limitations: dedupeStrings([
            ...(operationalSnapshot?.limitations ?? []).slice(0, 2),
            ...(missingData ?? []).slice(0, 2),
          ]),
          periodContext,
        });
      }
      break;
    case "vehicle_overview":
      assistantText = composeVehicleOverviewAssistantText({
        targa: mezzo.targa,
        keyPoints,
        sections,
        missingData,
      });
      break;
    default:
      break;
  }

  const references = buildUnifiedReferences({
    reliabilityLabel,
    domainLabel: plan.domainLabel,
    outputLabel: plan.outputLabel,
    targa: mezzo.targa,
  });

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
    fuelAnalytics,
  });

  return {
    intent: "report_targa",
    status: "completed",
    assistantText: `Ho preparato ${preview.title.toLowerCase()} nel perimetro NEXT read-only.\n\nSezioni incluse: ${preview.sections.length}. Dati mancanti dichiarati: ${preview.missingData.length}.`,
    references,
    report: { status: "ready", normalizedTarga: mezzo.targa, message: `${preview.title} pronto nel perimetro NEXT read-only.`, preview },
  };
}

async function runFleetUnifiedQuery(spec: UnifiedQuerySpec): Promise<InternalAiUnifiedExecutionResult> {
  const plan = buildUnifiedQueryPlan(spec);
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);

  if (spec.periodExplicitRequested && (!spec.periodResolved || !periodContext.isValid)) {
    return {
      intent: "richiesta_generica",
      status: "partial",
      assistantText:
        "Ho rilevato una richiesta con periodo esplicito, ma il periodo non e stato interpretato in modo affidabile.\n\n" +
        "Per evitare una classifica o un elenco costruiti sul perimetro sbagliato, fermo qui l'analisi e ti chiedo di riformulare il periodo.",
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
      }),
      report: null,
    };
  }

  if (
    plan.primaryIntent === "fuel_report" ||
    plan.primaryIntent === "fuel_anomalies" ||
    plan.primaryIntent === "vehicle_overview"
  ) {
    return {
      intent: "richiesta_generica",
      status: "partial",
      assistantText:
        "Per questa analisi mi serve una targa specifica. Senza targa rischierei di mescolare mezzi diversi e allargare il risultato oltre la richiesta.",
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
      }),
      report: null,
    };
  }

  const [centro, lavori, operativita] = await Promise.all([
    readNextCentroControlloSnapshot(),
    readNextLavoriInAttesaSnapshot(),
    readNextOperativitaGlobaleSnapshot(),
  ]);
  const rows = buildFleetPriorityRows({
    centro,
    lavori,
    operativita,
    periodContext,
  }).filter((row) => row.reasons.length > 0);
  const limitations = dedupeStrings([
    ...centro.limitations.slice(0, 2),
    ...lavori.limitations.slice(0, 2),
    ...operativita.limitations.slice(0, 2),
  ]);
  const references = buildUnifiedReferences({
    reliabilityLabel: rows.length > 0 ? "Parziale" : "Da verificare",
    domainLabel: plan.domainLabel,
    outputLabel: plan.outputLabel,
  });
  let assistantText = [
    "Analisi flotte",
    `Sintesi breve: nel periodo ${periodContext.label} non ho ancora elementi sufficienti per una classifica gestionale affidabile.`,
    formatBulletBlock("Limiti", limitations.slice(0, 5)),
  ].join("\n\n");

  if (plan.primaryIntent === "fleet_deadlines") {
    assistantText = composeFleetDeadlineAssistantText({
      rows,
      limitations,
      periodContext,
    });
  } else {
    assistantText = composeFleetCriticalityAssistantText({
      title:
        plan.primaryIntent === "fleet_attention"
          ? "Mezzi che richiedono attenzione"
          : spec.responseFocus === "classifica"
            ? "Classifica criticita mezzi"
            : "Criticita mezzi",
      rows,
      limitations,
      periodContext,
    });
  }

  return {
    intent: "richiesta_generica",
    status: rows.length > 0 ? "completed" : "partial",
    assistantText,
    references,
    report: null,
  };
}

async function runGenericRegistryQuery(spec: UnifiedQuerySpec): Promise<InternalAiUnifiedExecutionResult> {
  const registry = await buildUnifiedRegistrySnapshot();
  const plan = buildUnifiedQueryPlan(spec);
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
      references: buildUnifiedReferences({
        reliabilityLabel: "Da verificare",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
      }),
      report: null,
    };
  }

  return {
    intent: "richiesta_generica",
    status: "completed",
    assistantText:
      "Riscontri trovati:\n" +
      grouped.slice(0, 6).map(([label, entries]) => `- ${label}: ${entries.slice(0, 2).map((entry) => entry.record.summary || entry.record.entityLabel).join(" | ")}`).join("\n") +
      (requestedScopes.length > 0
        ? `\n\nAmbiti richiesti:\n- ${requestedScopes.join("\n- ")}`
        : "") +
      "\n\nLimiti:\n- Senza una targa gli incroci usano solo collegamenti testuali o identificativi realmente presenti.\n- Per report, modale o PDF dedicati serve una targa valida.",
    references: buildUnifiedReferences({
      reliabilityLabel: linkedRecords.some((entry) => entry.linkReliability === "alta") ? "Parziale" : "Da verificare",
      domainLabel: plan.domainLabel,
      outputLabel: plan.outputLabel,
    }),
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
  if (
    !spec.normalizedTarga &&
    [
      "fleet_attention",
      "fleet_criticality",
      "fleet_deadlines",
      "fuel_report",
      "fuel_anomalies",
      "vehicle_overview",
    ].includes(spec.primaryIntent)
  ) {
    return runFleetUnifiedQuery(spec);
  }
  if (spec.normalizedTarga) return runVehicleUnifiedQuery(spec);
  return runGenericRegistryQuery(spec);
}
