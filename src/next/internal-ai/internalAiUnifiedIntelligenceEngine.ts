import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import { readNextMezzoOperativitaTecnicaSnapshot } from "../nextOperativitaTecnicaDomain";
import {
  buildNextMezzoMaterialiMovimentiSnapshot,
  readNextMagazzinoRealeSnapshot,
  readNextMaterialiMovimentiSnapshot,
} from "../domain/nextMaterialiMovimentiDomain";
import { readNextAttrezzatureCantieriSnapshot } from "../domain/nextAttrezzatureCantieriDomain";
import {
  findNextAutistiAssignmentsByTarga,
  readNextAutistiReadOnlySnapshot,
  type NextAutistiCanonicalSignal,
  type NextAutistiReadOnlySnapshot,
} from "../domain/nextAutistiDomain";
import { readNextCentroControlloSnapshot } from "../domain/nextCentroControlloDomain";
import { readNextCisternaSnapshot } from "../domain/nextCisternaDomain";
import { readNextColleghiSnapshot } from "../domain/nextColleghiDomain";
import {
  readNextDocumentiCostiFleetSnapshot,
  readNextDocumentiCostiProcurementSupportSnapshot,
  readNextMezzoDocumentiCostiPeriodView,
  readNextProcurementReadOnlySnapshot,
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
  | "drivers_readonly"
  | "vehicle_overview"
  | "fuel_report"
  | "fuel_anomalies"
  | "vehicle_materials"
  | "warehouse_attention"
  | "procurement_readonly"
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
  | "autisti"
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
  asksPriorityOrdering: boolean;
  asksActionAdvice: boolean;
  rankingLimit: number | null;
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
  businessPayload?:
    | {
        kind: "documenti_costi";
        periodView: VehicleDocumentiCostiPeriodView;
      }
    | null;
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
  reliabilityBullets: string[];
  classificationBullets: string[];
  missingData: string[];
  classificationCounts: {
    canonico: number;
    ricostruito: number;
    baseline: number;
    escluso: number;
  };
  reliability: FuelReliabilitySummary;
};

type FuelValidationRecord = VehicleFuelSnapshot["items"][number] & {
  effectiveTimestamp: number | null;
  status: "incluso" | "escluso";
  exclusionReason: string | null;
  calculationClassification: FuelRecordClassification;
  classificationReason: string | null;
};

type FuelReliabilityStatus = "affidabile" | "prudente" | "da_verificare";

type FuelRecordClassification = "canonico" | "ricostruito" | "baseline" | "escluso";

type FuelReliabilityLayer = {
  status: FuelReliabilityStatus;
  label: string;
  summary: string;
  bullets: string[];
};

type FuelCalculationLayer = {
  status: FuelAnalyticsSummary["calculationStatus"];
  label: string;
  summary: string;
  bullets: string[];
};

type FuelReliabilitySummary = {
  source: FuelReliabilityLayer;
  filter: FuelReliabilityLayer;
  calculation: FuelCalculationLayer;
  final: FuelReliabilityLayer;
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

type FleetPriorityEngineSummary = {
  attentionCount: number;
  crossDomainCount: number;
  d10OnlyCount: number;
  d02OnlyCount: number;
  signalBullets: string[];
  criteriaBullets: string[];
  reliabilityLabel: "Prudente" | "Parziale" | "Da verificare";
  reliabilityNote: string;
};

type FleetPriorityRow = VehiclePrioritySummary & {
  targa: string;
  rankValues: number[];
  preCollaudoSuggested: boolean;
  recommendedAction: string;
  hasD10Signals: boolean;
  hasD02Signals: boolean;
};

type AutistiReadOnlySnapshot = Awaited<ReturnType<typeof readNextAutistiReadOnlySnapshot>>;

type CentroControlloSnapshot = Awaited<ReturnType<typeof readNextCentroControlloSnapshot>>;

type VehicleTechnicalSnapshot = Awaited<ReturnType<typeof readNextMezzoOperativitaTecnicaSnapshot>>;

type VehicleFuelSnapshot = Awaited<ReturnType<typeof readNextMezzoRifornimentiSnapshot>>;

type VehicleDocumentiCostiPeriodView = Awaited<
  ReturnType<typeof readNextMezzoDocumentiCostiPeriodView>
>;

type ProcurementReadOnlySnapshot = Awaited<ReturnType<typeof readNextProcurementReadOnlySnapshot>>;

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
  "autisti",
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
  {
    scope: "autisti",
    patterns: [
      "autista",
      "autisti",
      "badge",
      "sessione autista",
      "sessioni autisti",
      "flusso autisti",
      "app autisti",
      "inbox autisti",
      "eventi autisti",
      "dominio autisti",
    ],
  },
  { scope: "quadro", patterns: ["quadro completo", "quadro generale mezzo", "panoramica completa", "tutte le fonti"] },
  { scope: "criticita", patterns: ["criticita", "criticita operative", "priorita", "piu critico", "problemi", "segnalazioni", "controlli ko"] },
  { scope: "scadenze", patterns: ["scadenze", "revisione", "collaudo", "precollaudo", "pre-collaudo"] },
  { scope: "lavori", patterns: ["lavori", "lavoro", "backlog"] },
  { scope: "manutenzioni", patterns: ["manutenzioni", "manutenzione"] },
  { scope: "gomme", patterns: ["gomme", "gomma"] },
  { scope: "rifornimenti", patterns: ["rifornimenti", "rifornimento", "consumi", "carburante", "gasolio", "diesel", "km/l", "km per lt", "km per litro", "l/100km", "litri per 100 km"] },
  { scope: "materiali", patterns: ["materiali", "movimenti materiali", "consegne materiale", "attrezzature", "attrezzatura"] },
  { scope: "inventario", patterns: ["inventario", "magazzino", "stock", "scorte"] },
  { scope: "ordini", patterns: ["ordini", "ordine", "arrivi", "acquisti", "procurement"] },
  { scope: "preventivi", patterns: ["preventivi", "preventivo", "approvazioni", "approvazione", "capo costi", "preview"] },
  { scope: "fornitori", patterns: ["fornitori", "fornitore", "listino", "prezzi"] },
  { scope: "documenti", patterns: ["documenti", "documento", "libretto", "allegati", "documentale"] },
  { scope: "costi", patterns: ["costi", "costo", "analisi economica", "fatture", "spese", "storico costi"] },
  { scope: "cisterna", patterns: ["cisterna", "schede test", "caravate"] },
  { scope: "attenzione_oggi", patterns: ["attenzione oggi", "richiede attenzione oggi", "priorita oggi", "priorita operative"] },
];

const SCOPE_SOURCE_MAP: Record<InternalAiUnifiedScopeId, string[]> = {
  autisti: [
    "storage/@autisti_sessione_attive",
    "storage/@storico_eventi_operativi",
    "storage/@segnalazioni_autisti_tmp",
    "storage/@controlli_mezzo_autisti",
    "storage/@richieste_attrezzature_autisti_tmp",
    "collection/autisti_eventi",
    "localStorage/@next_clone_autisti:autista",
    "localStorage/@next_clone_autisti:mezzo",
  ],
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
  materiali: ["storage/@materialiconsegnati", "storage/@attrezzature_cantieri", "storage-path/materials"],
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
  { sourceId: "storage/@autisti_sessione_attive", sourceLabel: "Sessioni attive autisti", domainCode: "D03", kind: "next_reader", readerLabel: "readNextAutistiReadOnlySnapshot" },
  { sourceId: "storage/@storico_eventi_operativi", sourceLabel: "Storico eventi operativi", domainCode: "D03", kind: "next_reader", readerLabel: "readNextAutistiReadOnlySnapshot" },
  { sourceId: "storage/@richieste_attrezzature_autisti_tmp", sourceLabel: "Richieste attrezzature autisti", domainCode: "D03/D10", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@richieste_attrezzature_autisti_tmp" },
  { sourceId: "collection/autisti_eventi", sourceLabel: "Fallback eventi autisti legacy", domainCode: "D03", kind: "raw_collection", readerLabel: "Adapter raw read-only prudente", collectionName: "autisti_eventi" },
  { sourceId: "storage/@rifornimenti", sourceLabel: "Rifornimenti business", domainCode: "D04", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@rifornimenti" },
  { sourceId: "storage/@rifornimenti_autisti_tmp", sourceLabel: "Rifornimenti da campo", domainCode: "D04", kind: "raw_storage_doc", readerLabel: "Adapter raw read-only prudente", storageKey: "@rifornimenti_autisti_tmp" },
  { sourceId: "storage/@materialiconsegnati", sourceLabel: "Movimenti materiali", domainCode: "D05", kind: "next_reader", readerLabel: "readNextMaterialiMovimentiSnapshot" },
  { sourceId: "storage/@inventario", sourceLabel: "Inventario", domainCode: "D05", kind: "next_reader", readerLabel: "readNextInventarioSnapshot" },
  { sourceId: "storage/@attrezzature_cantieri", sourceLabel: "Attrezzature cantieri", domainCode: "D05", kind: "next_reader", readerLabel: "readNextAttrezzatureCantieriSnapshot" },
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
  { sourceId: "localStorage/@next_clone_autisti:autista", sourceLabel: "Autista attivo locale clone", domainCode: "D03", kind: "local_storage", readerLabel: "LocalStorage isolato browser", localStorageKey: "@next_clone_autisti:autista" },
  { sourceId: "localStorage/@next_clone_autisti:mezzo", sourceLabel: "Mezzo attivo locale clone", domainCode: "D03", kind: "local_storage", readerLabel: "LocalStorage isolato browser", localStorageKey: "@next_clone_autisti:mezzo" },
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

function formatCurrencyByCode(value: number, currency: "EUR" | "CHF"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatReliabilityLabel(status: "affidabile" | "prudente" | "da_verificare"): string {
  if (status === "affidabile") return "Affidabile";
  if (status === "prudente") return "Prudente";
  return "Da verificare";
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

function extractLastMonthsCount(normalizedPrompt: string): number | null {
  const match = normalizedPrompt.match(/\bultimi\s+(\d{1,2})\s+mesi\b/i);
  const parsed = match?.[1] ? Number(match[1]) : null;
  if (!parsed || !Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(Math.max(parsed, 1), 24);
}

function hasExplicitPeriodCue(normalizedPrompt: string): boolean {
  if (
    normalizedPrompt.includes("oggi") ||
    normalizedPrompt.includes("questa settimana") ||
    normalizedPrompt.includes("questo mese") ||
    normalizedPrompt.includes("ultimo mese") ||
    normalizedPrompt.includes("ultimi 30 giorni") ||
    normalizedPrompt.includes("ultimi 90 giorni") ||
    normalizedPrompt.includes("prossimi 30 giorni") ||
    extractLastMonthsCount(normalizedPrompt) !== null
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

function extractRankingLimit(normalizedPrompt: string): number | null {
  if (
    normalizedPrompt.includes("un solo mezzo") ||
    normalizedPrompt.includes("un mezzo solo") ||
    normalizedPrompt.includes("un solo veicolo") ||
    normalizedPrompt.includes("quale mezzo e piu critico") ||
    normalizedPrompt.includes("quale sceglieresti")
  ) {
    return 1;
  }

  const patterns = [
    /\btop\s*(\d{1,2})\b/i,
    /\bprimi\s+(\d{1,2})\b/i,
    /\bprime\s+(\d{1,2})\b/i,
    /\bi\s+(\d{1,2})\s+mezz/i,
    /\ble\s+(\d{1,2})\s+targ/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedPrompt.match(pattern);
    const parsed = match?.[1] ? Number(match[1]) : null;
    if (parsed && Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, 1), 10);
    }
  }

  return null;
}

function inferAsksPriorityOrdering(normalizedPrompt: string, rankingLimit: number | null): boolean {
  if (rankingLimit !== null) {
    return true;
  }

  return (
    normalizedPrompt.includes("classifica") ||
    normalizedPrompt.includes("priorita") ||
    normalizedPrompt.includes("ordine di priorita") ||
    normalizedPrompt.includes("ordina per priorita") ||
    normalizedPrompt.includes("ordinati per priorita") ||
    normalizedPrompt.includes("ordina per criticita") ||
    normalizedPrompt.includes("ordinati per criticita") ||
    normalizedPrompt.includes("mezzo piu critico") ||
    normalizedPrompt.includes("mezzi piu critici") ||
    normalizedPrompt.includes("richiedono piu attenzione") ||
    normalizedPrompt.includes("controllare per primo")
  );
}

function inferAsksActionAdvice(normalizedPrompt: string): boolean {
  return (
    normalizedPrompt.includes("cosa conviene fare") ||
    normalizedPrompt.includes("conviene fare") ||
    normalizedPrompt.includes("cosa fare") ||
    normalizedPrompt.includes("azione consigliata") ||
    normalizedPrompt.includes("spiegami cosa") ||
    normalizedPrompt.includes("spiegami in modo semplice") ||
    normalizedPrompt.includes("controllare per primo") ||
    normalizedPrompt.includes("quale sceglieresti")
  );
}

function hasCrossDomainPriorityCue(args: {
  normalizedPrompt: string;
  explicitScopes: InternalAiUnifiedScopeId[];
  asksAttentionToday: boolean;
  asksPriorityOrdering: boolean;
  asksActionAdvice: boolean;
}): boolean {
  const multiOperationalScopeCount = Array.from(
    new Set(
      args.explicitScopes.filter((scope) =>
        ["criticita", "scadenze", "lavori", "manutenzioni", "gomme", "attenzione_oggi"].includes(scope),
      ),
    ),
  ).length;
  const hasOperationalWeight =
    args.explicitScopes.includes("criticita") ||
    args.explicitScopes.includes("lavori") ||
    args.explicitScopes.includes("manutenzioni") ||
    args.explicitScopes.includes("attenzione_oggi");
  const asksCrossDomain =
    args.normalizedPrompt.includes("incrocia") ||
    args.normalizedPrompt.includes("incrociando") ||
    args.normalizedPrompt.includes("trasvers") ||
    args.normalizedPrompt.includes("mettendo insieme") ||
    args.normalizedPrompt.includes("insieme");

  return (
    (asksCrossDomain && multiOperationalScopeCount >= 2) ||
    ((args.asksAttentionToday || args.asksPriorityOrdering || args.asksActionAdvice) &&
      (multiOperationalScopeCount >= 2 || hasOperationalWeight))
  );
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
  const rollingMonths = extractLastMonthsCount(normalizedPrompt);

  if (rollingMonths !== null) {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(today.getMonth() - rollingMonths);
    return createUnifiedCustomPeriodSelection(from, today);
  }

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
  rankingLimit: number | null,
  asksPriorityOrdering: boolean,
): UnifiedResponseFocus {
  if (outputPreference !== "thread") {
    return "report_pdf";
  }

  if (rankingLimit !== null || asksPriorityOrdering) {
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
  asksPriorityOrdering: boolean;
  asksActionAdvice: boolean;
}): UnifiedBusinessIntentId {
  const asksDrivers =
    args.explicitScopes.includes("autisti") ||
    args.normalizedPrompt.includes("autista") ||
    args.normalizedPrompt.includes("autisti") ||
    args.normalizedPrompt.includes("badge") ||
    args.normalizedPrompt.includes("flusso autisti") ||
    args.normalizedPrompt.includes("app autisti") ||
    args.normalizedPrompt.includes("inbox autisti") ||
    args.normalizedPrompt.includes("segnali aperti") ||
    args.normalizedPrompt.includes("eventi che richiedono attenzione") ||
    args.normalizedPrompt.includes("a quale autista") ||
    args.normalizedPrompt.includes("dominio autisti");
  const asksFuel = args.explicitScopes.includes("rifornimenti");
  const asksFuelAnomalies =
    asksFuel &&
    (args.normalizedPrompt.includes("anomali") || args.normalizedPrompt.includes("anomalie"));
  const asksDeadlines = args.explicitScopes.includes("scadenze");
  const asksCriticality = args.explicitScopes.includes("criticita");
  const asksCostsDocuments =
    args.explicitScopes.includes("costi") || args.explicitScopes.includes("documenti");
  const asksProcurement =
    args.explicitScopes.includes("ordini") ||
    args.explicitScopes.includes("preventivi") ||
    args.explicitScopes.includes("fornitori") ||
    args.normalizedPrompt.includes("procurement") ||
    args.normalizedPrompt.includes("acquist") ||
    args.normalizedPrompt.includes("approvaz") ||
    args.normalizedPrompt.includes("capo costi") ||
    args.normalizedPrompt.includes("listino");
  const asksProcurementBoundary =
    args.normalizedPrompt.includes("riepilogo read-only di ordini e preventivi") ||
    args.normalizedPrompt.includes("approvazioni reali o solo preview") ||
    args.normalizedPrompt.includes("cta di procurement") ||
    args.normalizedPrompt.includes("stato reale di capo costi") ||
    (!args.normalizedTarga &&
      args.normalizedPrompt.includes("questa area") &&
      (args.normalizedPrompt.includes("operativ") ||
        args.normalizedPrompt.includes("lettura prudente") ||
        args.normalizedPrompt.includes("sola lettura") ||
        args.normalizedPrompt.includes("read-only")));
  const hasWarehouseCue =
    args.explicitScopes.includes("materiali") ||
    args.explicitScopes.includes("inventario") ||
    args.normalizedPrompt.includes("magazzino") ||
    args.normalizedPrompt.includes("inventario") ||
    args.normalizedPrompt.includes("material") ||
    args.normalizedPrompt.includes("attrezzatur") ||
    args.normalizedPrompt.includes("stock") ||
    args.normalizedPrompt.includes("scorte") ||
    args.normalizedPrompt.includes("consegn");
  const asksWarehouseBoundary =
    !asksProcurement &&
    !asksProcurementBoundary &&
    ((args.normalizedPrompt.includes("questa parte") ||
      args.normalizedPrompt.includes("questa area") ||
      hasWarehouseCue) &&
      (args.normalizedPrompt.includes("operativa o solo") ||
        args.normalizedPrompt.includes("solo in lettura") ||
        args.normalizedPrompt.includes("sola lettura") ||
        args.normalizedPrompt.includes("read-only") ||
        args.normalizedPrompt.includes("read only")));
  const asksWarehouseAttention =
    hasWarehouseCue &&
    (args.normalizedPrompt.includes("criticita") ||
      args.normalizedPrompt.includes("richiedono attenzione") ||
      args.normalizedPrompt.includes("stock bass") ||
      args.normalizedPrompt.includes("scorte bass") ||
      args.normalizedPrompt.includes("bloccare il lavoro") ||
      args.normalizedPrompt.includes("bloccare il lavoro") ||
      args.normalizedPrompt.includes("blocchi operativi") ||
      args.normalizedPrompt.includes("blocco operativ"));
  const hasExplicitDeadlineCue =
    args.normalizedPrompt.includes("scadenz") ||
    args.normalizedPrompt.includes("revisione") ||
    args.normalizedPrompt.includes("collaudo") ||
    args.normalizedPrompt.includes("precollaudo") ||
    args.normalizedPrompt.includes("pre-collaudo");
  const asksExtraOperationalSignals =
    args.explicitScopes.includes("lavori") ||
    args.explicitScopes.includes("manutenzioni") ||
    args.explicitScopes.includes("attenzione_oggi") ||
    args.normalizedPrompt.includes("segnalaz") ||
    args.normalizedPrompt.includes("alert") ||
    args.normalizedPrompt.includes("incrocia") ||
    args.normalizedPrompt.includes("incrociando");
  const asksCrossDomainPriority = hasCrossDomainPriorityCue({
    normalizedPrompt: args.normalizedPrompt,
    explicitScopes: args.explicitScopes,
    asksAttentionToday: args.asksAttentionToday,
    asksPriorityOrdering: args.asksPriorityOrdering,
    asksActionAdvice: args.asksActionAdvice,
  });
  const asksGenericOperationalPriority =
    !args.normalizedTarga &&
    !asksDeadlines &&
    !asksFuel &&
    !args.asksFullOverview &&
    (args.asksPriorityOrdering || args.asksActionAdvice) &&
    (args.normalizedPrompt.includes("mezzo") ||
      args.normalizedPrompt.includes("mezzi") ||
      args.normalizedPrompt.includes("attenzione") ||
      args.normalizedPrompt.includes("critico"));

  if (asksFuelAnomalies) {
    return "fuel_anomalies";
  }

  if (asksFuel) {
    return "fuel_report";
  }

  if (!args.normalizedTarga && (asksProcurement || asksProcurementBoundary)) {
    return "procurement_readonly";
  }

  if (asksDrivers && !args.asksFullOverview) {
    return "drivers_readonly";
  }

  if (args.asksFullOverview) {
    return "vehicle_overview";
  }

  if (asksWarehouseBoundary || asksWarehouseAttention) {
    return "warehouse_attention";
  }

  if (hasWarehouseCue && args.normalizedTarga && !asksCostsDocuments) {
    return "vehicle_materials";
  }

  if (hasWarehouseCue && !asksCostsDocuments) {
    return "warehouse_attention";
  }

  if (
    asksDeadlines &&
    hasExplicitDeadlineCue &&
    !asksExtraOperationalSignals &&
    !args.asksAttentionToday
  ) {
    return args.normalizedTarga ? "vehicle_deadlines" : "fleet_deadlines";
  }

  if (asksCrossDomainPriority || args.asksAttentionToday || asksGenericOperationalPriority) {
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
  primaryIntent: UnifiedBusinessIntentId;
  asksAttentionToday: boolean;
  asksPriorityOrdering: boolean;
  asksActionAdvice: boolean;
}): UnifiedDomainBreadth {
  if (
    args.asksFullOverview ||
    args.primaryIntent === "fleet_attention" ||
    args.explicitScopes.length > 1
  ) {
    return "multi_domain";
  }

  if (
    args.normalizedPrompt.includes("incrocia") ||
    args.normalizedPrompt.includes("trasvers") ||
    ((args.asksAttentionToday || args.asksPriorityOrdering || args.asksActionAdvice) &&
      !args.explicitScopes.includes("rifornimenti") &&
      !args.explicitScopes.includes("documenti") &&
      !args.explicitScopes.includes("costi"))
  ) {
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
  const asksDecisionHistory =
    normalizedTarga !== null &&
    (normalizedPrompt.includes("storico decisionale") ||
      normalizedPrompt.includes("storico utile") ||
      normalizedPrompt.includes("storico del mezzo") ||
      normalizedPrompt.includes("storico sintetico del mezzo") ||
      normalizedPrompt.includes("eventi recenti del mezzo"));
  const asksFullOverview =
    normalizedPrompt.includes("quadro completo") ||
    normalizedPrompt.includes("quadro mezzo") ||
    normalizedPrompt.includes("panoramica completa") ||
    normalizedPrompt.includes("quadro generale mezzo") ||
    normalizedPrompt.includes("tutte le fonti") ||
    asksDecisionHistory ||
    (normalizedTarga !== null &&
      (normalizedPrompt.includes("report completo") ||
        normalizedPrompt.includes("situazione del mezzo")));
  const asksAttentionToday =
    normalizedPrompt.includes("attenzione oggi") ||
    normalizedPrompt.includes("richiede attenzione oggi") ||
    normalizedPrompt.includes("richiedono attenzione oggi") ||
    normalizedPrompt.includes("richiedono piu attenzione") ||
    (normalizedPrompt.includes("oggi") && normalizedPrompt.includes("attenzione")) ||
    normalizedPrompt.includes("priorita oggi") ||
    normalizedPrompt.includes("priorita operative") ||
    normalizedPrompt.includes("quale mezzo e piu critico oggi") ||
    normalizedPrompt.includes("quali mezzi richiedono attenzione oggi");
  const rankingLimit = extractRankingLimit(normalizedPrompt);
  const asksPriorityOrdering = inferAsksPriorityOrdering(normalizedPrompt, rankingLimit);
  const asksActionAdvice = inferAsksActionAdvice(normalizedPrompt);

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
    asksPriorityOrdering,
    asksActionAdvice,
  });

  if (scopes.length === 0) {
    switch (primaryIntent) {
      case "drivers_readonly":
        scopes = ["autisti"];
        break;
      case "fuel_report":
      case "fuel_anomalies":
        scopes = ["rifornimenti"];
        break;
      case "vehicle_materials":
      case "warehouse_attention":
        scopes = ["materiali", "inventario"];
        break;
      case "procurement_readonly":
        scopes = ["ordini", "preventivi", "fornitori"];
        break;
      case "vehicle_deadlines":
      case "fleet_deadlines":
        scopes = ["scadenze"];
        break;
      case "vehicle_criticality":
      case "fleet_criticality":
      case "fleet_attention":
        scopes =
          primaryIntent === "fleet_attention"
            ? ["criticita", "scadenze", "lavori", "manutenzioni", "attenzione_oggi"]
            : ["criticita", "scadenze", "lavori", "manutenzioni"];
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
  const responseFocus = inferResponseFocus(
    normalizedPrompt,
    outputPreference,
    rankingLimit,
    asksPriorityOrdering,
  );

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
    asksPriorityOrdering,
    asksActionAdvice,
    rankingLimit,
    primaryIntent,
    metrics: inferMetrics(normalizedPrompt, scopes, primaryIntent),
    assetBreadth: inferAssetBreadth(normalizedPrompt, normalizedTarga),
    domainBreadth: inferDomainBreadth({
      normalizedPrompt,
      explicitScopes: scopes,
      asksFullOverview,
      primaryIntent,
      asksAttentionToday,
      asksPriorityOrdering,
      asksActionAdvice,
    }),
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
    spec.primaryIntent === "drivers_readonly" ||
    spec.primaryIntent === "procurement_readonly" ||
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
  snapshot: Awaited<ReturnType<typeof readNextAttrezzatureCantieriSnapshot>>,
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
          summary: [item.cantiereLabel, item.materialeCategoria, item.quantita !== null ? `${item.quantita}` : null].filter(Boolean).join(" | "),
          reliability: reliabilityFromQuality(item.quality),
          refIds: [item.id],
          labels: [item.descrizione, item.cantiereLabel, item.materialeCategoria],
          flags: item.flags,
        }),
      ),
    ),
    notes: snapshot.limitations,
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

function buildAutistiSourceSnapshot(args: {
  descriptor: UnifiedSourceDescriptor;
  snapshot: AutistiReadOnlySnapshot;
}): UnifiedSourceSnapshot {
  let records: UnifiedRecord[] = [];

  if (args.descriptor.sourceId === "storage/@autisti_sessione_attive") {
    records = args.snapshot.assignments
      .filter((item) => item.sourceDataset === "@autisti_sessione_attive")
      .map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.autistaNome ?? item.badgeAutista ?? item.id,
          summary: [item.mezzoTarga, item.targaRimorchio, item.sessionStatus]
            .filter(Boolean)
            .join(" | "),
          ts: item.timestamp,
          reliability:
            item.linkReliability === "forte"
              ? "alta"
              : item.linkReliability === "prudente"
                ? "media"
                : "bassa",
          targa: [item.targaMotrice, item.targaRimorchio],
          autistaBadge: [item.badgeAutista],
          autistaNome: [item.autistaNome],
          refIds: [item.id],
          labels: [item.sessionStatus],
          flags: item.flags,
        }),
      );
  } else if (args.descriptor.sourceId === "storage/@storico_eventi_operativi") {
    records = args.snapshot.assignments
      .filter((item) => item.sourceDataset === "@storico_eventi_operativi")
      .map((item) =>
        buildBaseRecord({
          sourceId: args.descriptor.sourceId,
          sourceLabel: args.descriptor.sourceLabel,
          id: item.id,
          entityLabel: item.sessionStatus ?? item.autistaNome ?? item.id,
          summary: [item.autistaNome, item.mezzoTarga, item.targaRimorchio]
            .filter(Boolean)
            .join(" | "),
          ts: item.timestamp,
          reliability:
            item.linkReliability === "forte"
              ? "alta"
              : item.linkReliability === "prudente"
                ? "media"
                : "bassa",
          targa: [item.targaMotrice, item.targaRimorchio],
          autistaBadge: [item.badgeAutista],
          autistaNome: [item.autistaNome],
          refIds: [item.id],
          labels: [item.sessionStatus],
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
      attrezzatureResult,
      procurementResult,
      fornitoriResult,
      documentiCostiResult,
      librettiResult,
      autistiResult,
      centroResult,
    ] = await Promise.allSettled([
      readNextAnagraficheFlottaSnapshot(),
      readNextColleghiSnapshot(),
      readNextLavoriInAttesaSnapshot(),
      readNextLavoriEseguitiSnapshot(),
      readNextOperativitaGlobaleSnapshot(),
      readNextMaterialiMovimentiSnapshot(),
      readNextInventarioSnapshot(),
      readNextAttrezzatureCantieriSnapshot(),
      readNextProcurementSnapshot(),
      readNextFornitoriSnapshot(),
      readNextDocumentiCostiFleetSnapshot(),
      readNextLibrettiExportSnapshot(),
      readNextAutistiReadOnlySnapshot(),
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
            if (attrezzatureResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildAttrezzatureSourceSnapshot(descriptor, attrezzatureResult.value));
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
            if (autistiResult.status === "fulfilled") sourceMap.set(descriptor.sourceId, buildAutistiSourceSnapshot({ descriptor, snapshot: autistiResult.value }));
            break;
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
    case "autisti":
      return "autisti";
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
      case "autisti":
        codes.add("D03");
        break;
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
    case "drivers_readonly":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["autisti"],
        domainLabel: "D03 Autisti, badge, sessioni ed eventi",
        domainCodes: ["D03"],
        relations: [
          "badge -> autista attivo",
          "targa -> sessione o evento autista collegabile",
          "madre -> clone locale separato",
        ],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => scope !== "autisti"),
        includeIdentitySection: false,
        outputLabel,
      };
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
    case "fleet_attention": {
      const priorityScopes: InternalAiUnifiedScopeId[] =
        spec.primaryIntent === "fleet_attention"
          ? ["criticita", "scadenze", "lavori", "manutenzioni", "attenzione_oggi"]
          : ["criticita", "scadenze", "lavori", "manutenzioni"];
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: priorityScopes,
        domainLabel: "D10 Stato operativo + D02 backlog tecnico",
        domainCodes: ["D01", "D10", "D02"],
        relations: ["targa -> alert e focus", "targa -> lavori aperti", "targa -> manutenzioni"],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter((scope) => !priorityScopes.includes(scope)),
        includeIdentitySection: spec.normalizedTarga !== null && spec.outputPreference !== "thread",
        outputLabel,
      };
    }
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
    case "vehicle_materials":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["materiali", "inventario"],
        domainLabel: "D05 Magazzino reale, materiali e inventario",
        domainCodes: ["D01", "D05"],
        relations: [
          "targa -> movimenti materiali collegabili",
          "magazzino globale -> stock critico e blocchi potenziali",
          "attrezzature -> tracking globale prudente",
        ],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter(
          (scope) => !["materiali", "inventario"].includes(scope),
        ),
        includeIdentitySection: spec.outputPreference !== "thread",
        outputLabel,
      };
    case "warehouse_attention":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["materiali", "inventario"],
        domainLabel: "D05 Magazzino reale, inventario, materiali e attrezzature",
        domainCodes: ["D05"],
        relations: [
          "stock -> disponibilita leggibile",
          "movimento materiale -> destinatario o mezzo",
          "attrezzature -> tracking e gap operativi",
        ],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter(
          (scope) => !["materiali", "inventario"].includes(scope),
        ),
        includeIdentitySection: false,
        outputLabel,
      };
    case "procurement_readonly":
      return {
        primaryIntent: spec.primaryIntent,
        selectedScopes: ["ordini", "preventivi", "fornitori"],
        domainLabel: "D06 Procurement, ordini, preventivi e Capo Costi",
        domainCodes: ["D06"],
        relations: [
          "ordini -> workbench read-only",
          "preventivi -> supporto prudente e preview",
          "approvazioni -> stato leggibile ma non operativo",
        ],
        excludedScopes: ALL_OPERATIONAL_SCOPES.filter(
          (scope) => !["ordini", "preventivi", "fornitori"].includes(scope),
        ),
        includeIdentitySection: false,
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

function sanitizeBusinessText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const sanitized = value
    .replace(/\bD0\d(?:-[A-Z]+)?\b/gi, "")
    .replace(/\bclone-safe\b/gi, "")
    .replace(/\bread-only\b/gi, "sola lettura")
    .replace(/\bregistry\b/gi, "fonti collegate")
    .replace(/^\/\s+presenti\b/gi, "Sono presenti")
    .replace(/^\/\s+presente\b/gi, "E presente")
    .replace(/\bnel fonti collegate\b/gi, "nelle fonti collegate")
    .replace(/\s+\|\s+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.:;])/g, "$1")
    .trim();

  if (/^e presente\b/i.test(sanitized)) {
    return sanitized.replace(/^e presente\b/i, "E presente");
  }

  return sanitized;
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

function formatFuelReliabilityLabel(status: FuelReliabilityStatus): string {
  if (status === "affidabile") return "Affidabile";
  if (status === "prudente") return "Prudente";
  return "Da verificare";
}

function formatFuelCalculationLabel(status: FuelAnalyticsSummary["calculationStatus"]): string {
  if (status === "affidabile") return "Affidabile";
  if (status === "prudente") return "Prudente";
  return "Non calcolabile";
}

function rankFuelReliabilityStatus(status: FuelReliabilityStatus): number {
  if (status === "affidabile") return 0;
  if (status === "prudente") return 1;
  return 2;
}

function deriveFuelFinalReliabilityStatus(args: {
  sourceStatus: FuelReliabilityStatus;
  filterStatus: FuelReliabilityStatus;
  calculationStatus: FuelAnalyticsSummary["calculationStatus"];
}): FuelReliabilityStatus {
  if (args.calculationStatus === "non_calcolabile") {
    return "da_verificare";
  }

  const statuses = [args.sourceStatus, args.filterStatus];
  const worst = statuses.reduce((currentWorst, current) =>
    rankFuelReliabilityStatus(current) > rankFuelReliabilityStatus(currentWorst)
      ? current
      : currentWorst,
  );
  return worst;
}

function buildFuelSourceReliability(args: {
  records: FuelValidationRecord[];
  snapshot: VehicleFuelSnapshot;
}): FuelReliabilityLayer {
  const canonicoCount = args.records.filter(
    (record) => record.sourceTrust.classification === "canonico",
  ).length;
  const ricostruitoCount = args.records.length - canonicoCount;
  const heuristicMatches = args.records.filter((record) =>
    [
      "match_euristica_10_minuti",
      "match_euristica_stesso_giorno",
    ].includes(record.matchStrategy),
  ).length;
  const fieldOnlyCount = args.records.filter(
    (record) => record.matchStrategy === "solo_campo",
  ).length;

  const status: FuelReliabilityStatus =
    args.records.length === 0
      ? "da_verificare"
      : ricostruitoCount > 0 ||
          heuristicMatches > 0 ||
          fieldOnlyCount > 0
        ? "prudente"
        : args.snapshot.trustModel.source.verdict === "da_verificare"
          ? "da_verificare"
          : "affidabile";

  const summary =
    status === "affidabile"
      ? `Sorgente affidabile: i ${formatCount(args.records.length)} record del periodo sono canonici nel layer business D04.`
      : status === "prudente"
        ? `Sorgente prudente: nel periodo ci sono ${formatCount(canonicoCount)} record canonici e ${formatCount(ricostruitoCount)} record ricostruiti o integrati dal feed campo.`
        : "Sorgente da verificare: nel periodo non ho una base sufficiente per distinguere con sicurezza record canonici e ricostruiti.";

  const bullets = [
    `Record canonici nel periodo: ${formatCount(canonicoCount)}`,
    `Record ricostruiti nel periodo: ${formatCount(ricostruitoCount)}`,
    fieldOnlyCount > 0
      ? `Record presenti solo nel feed campo: ${formatCount(fieldOnlyCount)}`
      : null,
    heuristicMatches > 0
      ? `Agganci euristici tra fonti: ${formatCount(heuristicMatches)}`
      : null,
    ...args.records
      .filter((record) => record.sourceTrust.classification === "ricostruito")
      .slice(0, 2)
      .map((record) => record.sourceTrust.reason),
  ].filter((entry): entry is string => Boolean(entry));

  return {
    status,
    label: formatFuelReliabilityLabel(status),
    summary,
    bullets,
  };
}

function buildFuelFilterReliability(args: {
  periodContext: InternalAiReportPeriodContext;
  recordsFound: number;
  outsidePeriodRecords: number;
  undatedRecords: number;
  mismatchedTargaRecords: number;
}): FuelReliabilityLayer {
  const status: FuelReliabilityStatus =
    args.recordsFound === 0 && (args.undatedRecords > 0 || args.mismatchedTargaRecords > 0)
      ? "da_verificare"
      : args.undatedRecords > 0 || args.mismatchedTargaRecords > 0
        ? "prudente"
        : "affidabile";

  const summary =
    status === "affidabile"
      ? args.periodContext.appliesFilter
        ? `Filtro affidabile: il periodo ${args.periodContext.label} e stato applicato solo a record con data verificabile e targa coerente.`
        : "Filtro affidabile: nessun filtro periodo attivo, tutti i record della targa restano nel perimetro letto."
      : status === "prudente"
        ? `Filtro prudente: il periodo ${args.periodContext.label} e corretto, ma alcuni record non avevano data verificabile o targa coerente.`
        : `Filtro da verificare: il periodo ${args.periodContext.label} non puo garantire che tutti i record storici della targa siano attribuiti in modo sicuro.`;

  const bullets = [
    `Periodo applicato: ${args.periodContext.label}`,
    args.outsidePeriodRecords > 0
      ? `Record fuori periodo esclusi: ${formatCount(args.outsidePeriodRecords)}`
      : null,
    args.undatedRecords > 0
      ? `Record senza data verificabile: ${formatCount(args.undatedRecords)}`
      : null,
    args.mismatchedTargaRecords > 0
      ? `Record con targa non coerente esclusi: ${formatCount(args.mismatchedTargaRecords)}`
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    status,
    label: formatFuelReliabilityLabel(status),
    summary,
    bullets,
  };
}

function buildFuelCalculationReliability(args: {
  analytics: {
    includedRecords: number;
    excludedRecords: number;
    analyzedTransitions: number;
    kmPerLiter: number | null;
    calculationStatus: FuelAnalyticsSummary["calculationStatus"];
    classificationCounts: FuelAnalyticsSummary["classificationCounts"];
  };
}): FuelCalculationLayer {
  const summary =
    args.analytics.calculationStatus === "affidabile"
      ? `Calcolo affidabile: la sequenza valida del periodo usa ${formatCount(args.analytics.includedRecords)} record inclusi con ${formatCount(args.analytics.analyzedTransitions)} passaggi coerenti.`
      : args.analytics.calculationStatus === "prudente"
        ? `Calcolo prudente: la media usa ${formatCount(args.analytics.includedRecords)} record inclusi, ma il periodo contiene baseline, esclusioni o record ricostruiti.`
        : "Calcolo non calcolabile: il periodo non contiene una sequenza sufficiente e coerente per produrre una media attendibile.";

  const bullets = [
    `Record inclusi nel calcolo: ${formatCount(args.analytics.includedRecords)}`,
    `Record baseline: ${formatCount(args.analytics.classificationCounts.baseline)}`,
    `Record esclusi: ${formatCount(args.analytics.excludedRecords)}`,
    `Record inclusi come ricostruiti: ${formatCount(args.analytics.classificationCounts.ricostruito)}`,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    status: args.analytics.calculationStatus,
    label: formatFuelCalculationLabel(args.analytics.calculationStatus),
    summary,
    bullets,
  };
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

  if (record.calculationClassification === "baseline") {
    return `${base} | baseline: ${record.classificationReason ?? "record base del periodo"}`;
  }

  if (record.calculationClassification === "escluso") {
    return `${base} | escluso${record.exclusionReason ? `: ${record.exclusionReason}` : ""}`;
  }

  return `${base} | ${record.calculationClassification} | incluso${record.classificationReason ? `: ${record.classificationReason}` : ""}`;
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
      calculationClassification: item.sourceTrust.classification,
      classificationReason: item.sourceTrust.reason,
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
        item.calculationClassification = "escluso";
        item.classificationReason = item.exclusionReason;
        duplicateCount += 1;
        continue;
      }
      duplicateSeen.add(duplicateKey);
    }

    if (item.effectiveTimestamp === null) {
      item.exclusionReason = "data non verificabile";
      item.calculationClassification = "escluso";
      item.classificationReason = item.exclusionReason;
      continue;
    }

    if (item.litri === null || item.litri <= 0) {
      item.exclusionReason = "litri mancanti o non validi";
      item.calculationClassification = "escluso";
      item.classificationReason = item.exclusionReason;
      missingLitersCount += 1;
      continue;
    }

    if (item.km === null) {
      item.exclusionReason = "km non disponibile";
      item.calculationClassification = "escluso";
      item.classificationReason = item.exclusionReason;
      missingKmCount += 1;
      continue;
    }

    if (previousComparable === null) {
      item.exclusionReason = "primo record utile del periodo: serve un rifornimento successivo per stimare la resa";
      item.calculationClassification = "baseline";
      item.classificationReason =
        "primo record valido del periodo usato come base di confronto";
      previousComparable = item;
      continue;
    }

    const deltaKm = item.km - previousComparable.km!;
    if (deltaKm <= 0) {
      item.exclusionReason = "km non progressivi rispetto al record precedente";
      item.calculationClassification = "escluso";
      item.classificationReason = item.exclusionReason;
      nonIncreasingKmCount += 1;
      continue;
    }

    item.status = "incluso";
    item.exclusionReason = null;
    item.calculationClassification = item.sourceTrust.classification;
    item.classificationReason =
      item.sourceTrust.classification === "canonico"
        ? "record canonico letto dal business D04"
        : item.sourceTrust.reason;
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
  const classificationCounts = {
    canonico: sorted.filter((item) => item.calculationClassification === "canonico").length,
    ricostruito: sorted.filter((item) => item.calculationClassification === "ricostruito").length,
    baseline: sorted.filter((item) => item.calculationClassification === "baseline").length,
    escluso: sorted.filter((item) => item.calculationClassification === "escluso").length,
  };
  const calculationStatus =
    kmPerLiter === null
      ? "non_calcolabile"
      : excludedRecords.length > 0 || heuristicCount > 0 || reconstructedKmCount > 0
        ? "prudente"
        : "affidabile";

  const sourceReliability = buildFuelSourceReliability({
    records: sorted,
    snapshot,
  });
  const filterReliability = buildFuelFilterReliability({
    periodContext,
    recordsFound: sorted.length,
    outsidePeriodRecords,
    undatedRecords,
    mismatchedTargaRecords,
  });
  const calculationReliability = buildFuelCalculationReliability({
    analytics: {
      includedRecords: includedRecords.length,
      excludedRecords: excludedRecords.length,
      analyzedTransitions,
      kmPerLiter,
      calculationStatus,
      classificationCounts,
    },
  });
  const finalReliabilityStatus = deriveFuelFinalReliabilityStatus({
    sourceStatus: sourceReliability.status,
    filterStatus: filterReliability.status,
    calculationStatus,
  });
  const finalReliability: FuelReliabilityLayer = {
    status: finalReliabilityStatus,
    label: formatFuelReliabilityLabel(finalReliabilityStatus),
    summary:
      finalReliabilityStatus === "affidabile"
        ? "Verdetto finale affidabile: sorgente, filtro e calcolo risultano coerenti nel periodo richiesto."
        : finalReliabilityStatus === "prudente"
          ? "Verdetto finale prudente: il periodo e corretto, ma almeno una parte del dato o del calcolo richiede cautela."
          : "Verdetto finale da verificare: il dato o il calcolo non permettono di presentare la resa come pienamente attendibile.",
    bullets: [
      `Sorgente: ${sourceReliability.label}`,
      `Filtro: ${filterReliability.label}`,
      `Calcolo: ${calculationReliability.label}`,
    ],
  };
  const reliability = {
    source: sourceReliability,
    filter: filterReliability,
    calculation: calculationReliability,
    final: finalReliability,
  } satisfies FuelReliabilitySummary;

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

  const reliabilityBullets = [
    `${sourceReliability.summary}`,
    ...sourceReliability.bullets,
    `${filterReliability.summary}`,
    ...filterReliability.bullets,
    `${calculationReliability.summary}`,
    ...calculationReliability.bullets,
    `${finalReliability.summary}`,
  ].filter((entry): entry is string => Boolean(entry));

  const classificationBullets = [
    `Canonici: ${formatCount(classificationCounts.canonico)}`,
    `Ricostruiti: ${formatCount(classificationCounts.ricostruito)}`,
    `Baseline: ${formatCount(classificationCounts.baseline)}`,
    `Esclusi: ${formatCount(classificationCounts.escluso)}`,
  ];

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
    reliabilityBullets,
    classificationBullets,
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
    classificationCounts,
    reliability,
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

function getFleetUpcomingRevisionCount(entry: Pick<FleetPriorityRow, "upcomingRevisions" | "dueSoonRevisions">): number {
  return Math.max(entry.upcomingRevisions - entry.dueSoonRevisions, 0);
}

function buildFleetPriorityReasons(entry: {
  overdueRevisions: number;
  dueSoonRevisions: number;
  upcomingRevisions: number;
  alertDangerCount: number;
  alertWarningCount: number;
  focusKoCount: number;
  newSignalCount: number;
  openWorks: number;
  highUrgencyWorks: number;
  maintenanceCount: number;
  preCollaudoSuggested: boolean;
}): string[] {
  const upcomingRevisionCount = getFleetUpcomingRevisionCount(entry);

  return [
    entry.overdueRevisions > 0 ? `${entry.overdueRevisions} revisione/collaudo scaduti` : null,
    entry.dueSoonRevisions > 0 ? `${entry.dueSoonRevisions} scadenze entro 7 giorni` : null,
    entry.alertDangerCount > 0 ? `${entry.alertDangerCount} alert critici` : null,
    entry.focusKoCount > 0 ? `${entry.focusKoCount} controlli KO` : null,
    entry.highUrgencyWorks > 0 ? `${entry.highUrgencyWorks} lavori alta urgenza` : null,
    entry.newSignalCount > 0 ? `${entry.newSignalCount} segnalazioni nuove` : null,
    entry.preCollaudoSuggested ? "pre-collaudo da organizzare" : null,
    upcomingRevisionCount > 0 ? `${upcomingRevisionCount} scadenze entro 30 giorni` : null,
    entry.alertWarningCount > 0 ? `${entry.alertWarningCount} alert da seguire` : null,
    entry.openWorks > 0 ? `${entry.openWorks} lavori aperti` : null,
    entry.maintenanceCount > 0 ? `${entry.maintenanceCount} manutenzioni collegate` : null,
  ].filter((entryReason): entryReason is string => Boolean(entryReason));
}

function buildFleetPriorityAction(args: {
  targa: string;
  overdueRevisions: number;
  dueSoonRevisions: number;
  alertDangerCount: number;
  focusKoCount: number;
  highUrgencyWorks: number;
  newSignalCount: number;
  preCollaudoSuggested: boolean;
  openWorks: number;
  maintenanceCount: number;
}): string {
  if (args.overdueRevisions > 0) {
    return `${args.targa}: verificare subito scadenze o collaudi gia scaduti e chiudere il piano di rientro.`;
  }

  if (args.dueSoonRevisions > 0 && args.preCollaudoSuggested) {
    return `${args.targa}: organizzare oggi pre-collaudo e prenotazione del collaudo.`;
  }

  if (args.dueSoonRevisions > 0) {
    return `${args.targa}: chiudere subito prenotazione e preparazione del collaudo.`;
  }

  if (args.alertDangerCount > 0 || args.focusKoCount > 0) {
    return `${args.targa}: verificare prima alert critici e controlli KO ancora aperti.`;
  }

  if (args.highUrgencyWorks > 0) {
    return `${args.targa}: prendere in carico prima i lavori ad alta urgenza.`;
  }

  if (args.newSignalCount > 0) {
    return `${args.targa}: leggere e smistare subito le segnalazioni nuove.`;
  }

  if (args.preCollaudoSuggested) {
    return `${args.targa}: programmare il pre-collaudo prima della scadenza ravvicinata.`;
  }

  if (args.openWorks > 0) {
    return `${args.targa}: riallineare il backlog tecnico aperto.`;
  }

  if (args.maintenanceCount > 0) {
    return `${args.targa}: verificare lo stato delle manutenzioni collegate.`;
  }

  return `${args.targa}: mantenere monitoraggio operativo nel periodo corrente.`;
}

function buildFleetPriorityRankValues(entry: {
  overdueRevisions: number;
  dueSoonRevisions: number;
  alertDangerCount: number;
  focusKoCount: number;
  highUrgencyWorks: number;
  newSignalCount: number;
  preCollaudoSuggested: boolean;
  upcomingRevisions: number;
  alertWarningCount: number;
  openWorks: number;
  maintenanceCount: number;
  hasD10Signals: boolean;
  hasD02Signals: boolean;
}): number[] {
  const urgentOperationalSignals =
    entry.alertDangerCount + entry.focusKoCount + entry.highUrgencyWorks;
  const planningSignals = entry.newSignalCount + (entry.preCollaudoSuggested ? 1 : 0);
  const backlogSignals =
    getFleetUpcomingRevisionCount(entry) + entry.alertWarningCount + entry.openWorks;

  return [
    entry.overdueRevisions,
    entry.dueSoonRevisions,
    urgentOperationalSignals,
    Number(entry.hasD10Signals && entry.hasD02Signals),
    planningSignals,
    backlogSignals,
    entry.maintenanceCount,
  ];
}

function buildFleetPriorityLabel(entry: {
  overdueRevisions: number;
  dueSoonRevisions: number;
  alertDangerCount: number;
  focusKoCount: number;
  highUrgencyWorks: number;
  newSignalCount: number;
  preCollaudoSuggested: boolean;
  upcomingRevisions: number;
  alertWarningCount: number;
  openWorks: number;
  maintenanceCount: number;
}): FleetPriorityRow["priorityLabel"] {
  if (
    entry.overdueRevisions > 0 ||
    entry.dueSoonRevisions > 0 ||
    entry.alertDangerCount > 0 ||
    entry.focusKoCount > 0 ||
    entry.highUrgencyWorks > 0
  ) {
    return "alta";
  }

  if (
    entry.newSignalCount > 0 ||
    entry.preCollaudoSuggested ||
    getFleetUpcomingRevisionCount(entry) > 0 ||
    entry.alertWarningCount > 0 ||
    entry.openWorks > 0
  ) {
    return "media";
  }

  if (entry.maintenanceCount > 0) {
    return "bassa";
  }

  return "bassa";
}

function buildFleetPriorityEngineSummary(rows: FleetPriorityRow[]): FleetPriorityEngineSummary {
  const attentionRows = rows.filter((row) => row.priorityLabel !== "bassa");
  const rankedRows = attentionRows.length > 0 ? attentionRows : rows;
  const hasD10Evidence = rankedRows.some((row) => row.hasD10Signals);
  const hasD02Evidence = rankedRows.some((row) => row.hasD02Signals);
  const crossDomainCount = rankedRows.filter(
    (row) => row.hasD10Signals && row.hasD02Signals,
  ).length;
  const d10OnlyCount = rankedRows.filter((row) => row.hasD10Signals && !row.hasD02Signals).length;
  const d02OnlyCount = rankedRows.filter((row) => !row.hasD10Signals && row.hasD02Signals).length;

  const totals = rankedRows.reduce(
    (accumulator, row) => {
      accumulator.overdueRevisions += row.overdueRevisions;
      accumulator.dueSoonRevisions += row.dueSoonRevisions;
      accumulator.upcomingRevisions += getFleetUpcomingRevisionCount(row);
      accumulator.alertDangerCount += row.alertDangerCount;
      accumulator.alertWarningCount += row.alertWarningCount;
      accumulator.focusKoCount += row.focusKoCount;
      accumulator.newSignalCount += row.newSignalCount;
      accumulator.openWorks += row.openWorks;
      accumulator.highUrgencyWorks += row.highUrgencyWorks;
      accumulator.maintenanceCount += row.maintenanceCount;
      accumulator.preCollaudoSuggested += row.preCollaudoSuggested ? 1 : 0;
      return accumulator;
    },
    {
      overdueRevisions: 0,
      dueSoonRevisions: 0,
      upcomingRevisions: 0,
      alertDangerCount: 0,
      alertWarningCount: 0,
      focusKoCount: 0,
      newSignalCount: 0,
      openWorks: 0,
      highUrgencyWorks: 0,
      maintenanceCount: 0,
      preCollaudoSuggested: 0,
    },
  );

  const signalBullets = [
    totals.overdueRevisions > 0
      ? `${totals.overdueRevisions} scadenze o collaudi gia scaduti`
      : null,
    totals.dueSoonRevisions > 0
      ? `${totals.dueSoonRevisions} scadenze entro 7 giorni`
      : null,
    totals.alertDangerCount > 0 || totals.focusKoCount > 0
      ? `${totals.alertDangerCount + totals.focusKoCount} alert critici o controlli KO`
      : null,
    totals.highUrgencyWorks > 0
      ? `${totals.highUrgencyWorks} lavori ad alta urgenza`
      : null,
    totals.newSignalCount > 0 ? `${totals.newSignalCount} segnalazioni nuove` : null,
    totals.preCollaudoSuggested > 0
      ? `${totals.preCollaudoSuggested} pre-collaudi da organizzare`
      : null,
    totals.openWorks > 0 ? `${totals.openWorks} lavori aperti` : null,
    totals.maintenanceCount > 0 ? `${totals.maintenanceCount} manutenzioni collegate` : null,
    rankedRows.length > 0
      ? `${formatCount(rankedRows.length)} mezzi con segnali rilevanti, ${formatCount(crossDomainCount)} con incrocio D10 + D02`
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const criteriaBullets = [
    "Prima scadenze o collaudi scaduti.",
    "Poi scadenze entro 7 giorni.",
    "A seguire alert critici, controlli KO e lavori ad alta urgenza.",
    "Poi segnalazioni nuove e pre-collaudi da organizzare.",
    "Infine backlog tecnico, scadenze entro 30 giorni e manutenzioni collegate.",
  ];

  const reliabilityLabel =
    rankedRows.length === 0
      ? "Da verificare"
      : hasD10Evidence && hasD02Evidence
        ? "Prudente"
        : "Parziale";
  const reliabilityNote =
    rankedRows.length === 0
      ? "Non emergono segnali sufficienti per una priorita operativa solida nel periodo richiesto."
      : hasD10Evidence && hasD02Evidence
        ? `Il ranking incrocia segnali sia D10 sia D02 su ${formatCount(rankedRows.length)} mezzi, ma resta prudente perche usa solo i reader read-only oggi consolidati.`
        : hasD10Evidence
          ? "Il ranking del periodo nasce soprattutto da scadenze, alert e criticita operative D10; il backlog tecnico pesa meno o non emerge."
          : "Il ranking del periodo nasce soprattutto dal backlog tecnico D02; segnali D10 forti non emergono nel perimetro letto.";

  return {
    attentionCount: rankedRows.length,
    crossDomainCount,
    d10OnlyCount,
    d02OnlyCount,
    signalBullets,
    criteriaBullets,
    reliabilityLabel,
    reliabilityNote,
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
  const registry = new Map<
    string,
    Omit<
      FleetPriorityRow,
      "priorityLabel" | "reasons" | "rankValues" | "recommendedAction" | "hasD10Signals" | "hasD02Signals"
    >
  >();

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
      const hasD10Signals =
        entry.overdueRevisions > 0 ||
        entry.dueSoonRevisions > 0 ||
        entry.upcomingRevisions > 0 ||
        entry.alertDangerCount > 0 ||
        entry.alertWarningCount > 0 ||
        entry.focusKoCount > 0 ||
        entry.newSignalCount > 0 ||
        entry.preCollaudoSuggested;
      const hasD02Signals =
        entry.openWorks > 0 ||
        entry.highUrgencyWorks > 0 ||
        entry.maintenanceCount > 0;
      const reasons = buildFleetPriorityReasons(entry);
      const priorityLabel = buildFleetPriorityLabel(entry);
      const rankValues = buildFleetPriorityRankValues({
        ...entry,
        hasD10Signals,
        hasD02Signals,
      });
      const recommendedAction = buildFleetPriorityAction({
        targa: entry.targa,
        overdueRevisions: entry.overdueRevisions,
        dueSoonRevisions: entry.dueSoonRevisions,
        alertDangerCount: entry.alertDangerCount,
        focusKoCount: entry.focusKoCount,
        highUrgencyWorks: entry.highUrgencyWorks,
        newSignalCount: entry.newSignalCount,
        preCollaudoSuggested: entry.preCollaudoSuggested,
        openWorks: entry.openWorks,
        maintenanceCount: entry.maintenanceCount,
      });

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
        recommendedAction,
        hasD10Signals,
        hasD02Signals,
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
    formatBulletBlock("Classificazione record", args.analytics.classificationBullets),
    formatBulletBlock("Affidabilita del dato", args.analytics.reliabilityBullets.slice(0, 10)),
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
  preview: InternalAiVehicleReportPreview;
}): string {
  const stateCard = args.preview.cards.find((card) => card.label === "Stato generale") ?? null;
  const actionCard = args.preview.cards.find((card) => card.label === "Cosa fare ora") ?? null;
  const deadlinesCard = args.preview.cards.find((card) => card.label === "Scadenze") ?? null;
  const backlogCard = args.preview.cards.find((card) => card.label === "Backlog tecnico") ?? null;
  const deadlinesSection = args.preview.sections.find((section) => section.id === "decision-deadlines") ?? null;
  const backlogSection = args.preview.sections.find((section) => section.id === "decision-backlog") ?? null;
  const signalsSection = args.preview.sections.find((section) => section.id === "decision-signals") ?? null;
  const materialsSection = args.preview.sections.find((section) => section.id === "decision-materials") ?? null;
  const fuelSection = args.preview.sections.find((section) => section.id === "decision-fuel") ?? null;
  const costsSection = args.preview.sections.find((section) => section.id === "decision-costs") ?? null;
  const noteSection = args.preview.sections.find((section) => section.id === "decision-note") ?? null;

  return [
    args.preview.title,
    `Sintesi iniziale: ${args.preview.header.targa} | ${stateCard?.value ?? "Quadro disponibile"}. ${stateCard?.meta ?? "Sto mostrando solo i blocchi utili per decidere cosa fare."}`,
    formatBulletBlock(
      "Cosa fare ora",
      [
        actionCard?.value ?? "Nessuna azione prioritaria forte individuata.",
        actionCard?.meta ?? null,
      ].filter((entry): entry is string => Boolean(entry)),
    ),
    formatBulletBlock(
      "Scadenze e collaudi",
      [
        deadlinesCard ? `${deadlinesCard.value}: ${deadlinesCard.meta}` : null,
        ...(deadlinesSection?.bullets.slice(0, 4) ?? []),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
    formatBulletBlock(
      "Backlog tecnico",
      [
        backlogCard ? `${backlogCard.value}: ${backlogCard.meta}` : null,
        ...(backlogSection?.bullets.slice(0, 4) ?? []),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
    formatBulletBlock(
      "Segnali operativi",
      signalsSection?.bullets.slice(0, 4) ?? [],
    ),
    materialsSection
      ? formatBulletBlock("Materiali, attrezzature e magazzino", materialsSection.bullets.slice(0, 4))
      : null,
    fuelSection
      ? formatBulletBlock("Consumi e rifornimenti", fuelSection.bullets.slice(0, 4))
      : null,
    costsSection
      ? formatBulletBlock("Costi, documenti e storico utile", costsSection.bullets.slice(0, 4))
      : null,
    formatBulletBlock(
      "Nota finale",
      [
        noteSection?.summary ?? null,
        ...(noteSection?.bullets.slice(0, 3) ?? []),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
  ].join("\n\n");
}

function composeVehicleMaterialsAssistantText(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  section: InternalAiVehicleReportSection | null;
  missingData: string[];
}): string {
  const bullets = args.section?.bullets.slice(0, 6) ?? [];
  const notes = dedupeStrings([
    ...(args.missingData.length > 0
      ? args.missingData.slice(0, 4)
      : args.section?.notes.slice(0, 3) ?? []),
  ]).map((entry) => sanitizeBusinessText(entry));
  const hasStrongVehicleSignals = bullets.some(
    (entry) =>
      entry.includes("Movimenti materiali legati al mezzo") || entry.includes("Match forti:"),
  );
  const summary =
    args.section?.summary ??
    `Non risultano movimenti materiali o segnali magazzino forti collegati a ${args.targa} nel periodo ${args.periodContext.label}.`;
  const action =
    (hasStrongVehicleSignals
      ? "Controllare prima i movimenti materiali con aggancio forte al mezzo e verificare poi se lo stock critico globale puo rallentare il lavoro."
      : null) ??
    bullets.find((entry) => /magazzino critico|match prudenz|tracking|verificar/i.test(entry)) ??
    (bullets.some((entry) => entry.includes("Match forti:") || entry.includes("Movimenti materiali legati al mezzo"))
      ? "Controllare prima i movimenti materiali con aggancio forte al mezzo e verificare se lo stock critico globale puo rallentare il lavoro."
      : null) ??
    (bullets.length > 0
      ? "Verificare prima i movimenti materiali piu recenti e confermare se esistono collegamenti forti con il mezzo."
      : "Usare D05 in sola lettura: se serve una conferma piena sul mezzo, controllare i movimenti con aggancio targa forte.");

  return [
    `Materiali e magazzino ${args.targa}`,
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Dati principali", bullets.slice(0, 4)),
    formatBulletBlock("Limiti", notes),
    formatBulletBlock("Azione consigliata", [sanitizeBusinessText(action)]),
  ].join("\n\n");
}

function composeWarehouseAssistantText(args: {
  prompt: string;
  snapshot: Awaited<ReturnType<typeof readNextMagazzinoRealeSnapshot>>;
  periodContext: InternalAiReportPeriodContext;
}): string {
  const normalizedPrompt = normalizeSearchText(args.prompt);
  const materialLinkSignals = args.snapshot.vehicleLinks.slice(0, 4);
  const focusIsVehicleLinks =
    normalizedPrompt.includes("mezzi") &&
    (normalizedPrompt.includes("material") || normalizedPrompt.includes("attrezzatur"));
  const focusIsReadOnly =
    normalizedPrompt.includes("solo in lettura") ||
    normalizedPrompt.includes("sola lettura") ||
    normalizedPrompt.includes("read only") ||
    normalizedPrompt.includes("read-only") ||
    normalizedPrompt.includes("operativa o solo");
  const focusIsBlockers =
    normalizedPrompt.includes("stock bass") ||
    normalizedPrompt.includes("scorte bass") ||
    normalizedPrompt.includes("bloccare il lavoro") ||
    normalizedPrompt.includes("bloccare il lavoro") ||
    normalizedPrompt.includes("criticita") ||
    normalizedPrompt.includes("richiedono attenzione");
  const limitBullets = dedupeStrings(
    args.snapshot.limitations.slice(0, 6).map((entry) => sanitizeBusinessText(entry)),
  ).slice(0, 5);
  const summary = focusIsReadOnly
    ? "L'area magazzino del clone NEXT e operativa solo in lettura: i dati sono leggibili e utili per la IA, ma nessuna scrittura stock o consegna e attiva."
    : focusIsVehicleLinks
      ? `Ho trovato ${formatCount(args.snapshot.vehicleLinks.length)} collegamenti materiali verso mezzi, di cui ${formatCount(args.snapshot.counts.vehicleLinksStrong)} forti e ${formatCount(args.snapshot.counts.vehicleLinksPlausible)} prudenziali, nel perimetro ${args.periodContext.label}.`
      : `${formatCount(args.snapshot.attentionSignals.length)} segnali D05 richiedono attenzione; oggi leggo ${formatCount(args.snapshot.counts.inventoryItems)} articoli inventario, ${formatCount(args.snapshot.counts.materialMovements)} movimenti materiali e ${formatCount(args.snapshot.counts.attrezzatureMovements)} movimenti attrezzature nel perimetro ${args.periodContext.label}.`;
  const mainBullets = focusIsReadOnly
    ? [
        `Stato area: ${args.snapshot.operationalStatus.label}`,
        args.snapshot.operationalStatus.summary,
        `Stock critico leggibile: ${formatCount(args.snapshot.counts.inventoryCritical)}`,
        `Scritture abilitate: no`,
      ]
    : focusIsVehicleLinks
      ? materialLinkSignals.map(
          (entry) =>
            `${entry.label} | ${entry.movementCount} movimenti | affidabilita ${entry.reliability} | ultimo ${entry.latestDate ?? "dato senza data"}`,
        )
      : [
          ...args.snapshot.attentionSignals
            .slice(0, 5)
            .map((signal) => `${signal.title} | ${signal.summary}`),
          args.snapshot.counts.vehicleLinksPlausible > 0
            ? `${formatCount(args.snapshot.counts.vehicleLinksPlausible)} collegamenti materiali verso mezzo restano prudenziali.`
            : null,
        ].filter((entry): entry is string => Boolean(entry));
  const action =
    focusIsReadOnly
      ? "Usa quest'area per consultare stock, movimenti e attrezzature, ma lascia bloccate variazioni stock, consegne, ritiri e fotografie operative."
      : focusIsVehicleLinks && args.snapshot.counts.vehicleLinksStrong > 0
        ? "Partire dai mezzi con aggancio materiale forte e verificare poi se lo stock critico globale impatta i lavori imminenti."
      : args.snapshot.counts.inventoryCritical > 0
        ? "Verificare prima gli articoli a stock zero o negativo e confermare se bloccano lavori o manutenzioni aperte."
      : args.snapshot.counts.vehicleLinksPlausible > 0
        ? "Confermare i collegamenti materiali verso mezzo che oggi restano solo prudenziali."
        : args.snapshot.counts.attrezzatureTrackingGap > 0
          ? "Usare le attrezzature con prudenza e controllare i movimenti che non espongono un tracking completo."
          : "L'area e utile in sola lettura: puoi usarla per controllo e sintesi, ma non per aggiornare stock o consegne.";
  const actionWithFocus =
    focusIsBlockers && args.snapshot.counts.inventoryCritical > 0
      ? "Verificare prima gli articoli a stock zero o negativo e allinearli con i lavori o le manutenzioni che potrebbero fermarsi."
      : action;

  return [
    focusIsVehicleLinks ? "Materiali collegati ai mezzi" : "Magazzino reale",
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Dati principali", mainBullets.slice(0, 6)),
    formatBulletBlock("Limiti", limitBullets),
    formatBulletBlock("Azione consigliata", [sanitizeBusinessText(actionWithFocus)]),
  ].join("\n\n");
}

function formatProcurementSurfaceStateLabel(
  state: ProcurementReadOnlySnapshot["surfaces"]["ordini"]["state"],
): string {
  if (state === "navigabile") return "navigabile in sola lettura";
  if (state === "preview") return "solo preview";
  return "bloccata";
}

function composeProcurementAssistantText(args: {
  prompt: string;
  snapshot: ProcurementReadOnlySnapshot;
}): string {
  const normalizedPrompt = normalizeSearchText(args.prompt);
  const focusApprovals =
    normalizedPrompt.includes("approvaz") || normalizedPrompt.includes("capo costi");
  const focusCtas =
    normalizedPrompt.includes("cta") ||
    normalizedPrompt.includes("blocc") ||
    normalizedPrompt.includes("operativa o solo") ||
    normalizedPrompt.includes("operativ") ||
    normalizedPrompt.includes("preview");
  const summary = focusApprovals
    ? `Nel perimetro NEXT le approvazioni procurement sono solo leggibili: risultano ${formatCount(args.snapshot.counts.approvazioniTotali)} stati, ma nessuna approvazione reale e eseguibile dal clone.`
    : focusCtas
      ? "D06 e un workbench read-only reale solo per ordini, arrivi e dettaglio ordine. Le CTA che scrivono o chiudono il workflow restano bloccate o solo preview."
      : `D06 e oggi utile in sola lettura: ordini, arrivi e dettaglio ordine sono navigabili, mentre preventivi, approvazioni, PDF timbrati e listino restano prudenziali o bloccati.`;

  const mainBullets = [
    `Ordini leggibili: ${formatCount(args.snapshot.counts.ordiniTotali)} | in attesa ${formatCount(args.snapshot.counts.ordiniInAttesa)} | parziali ${formatCount(args.snapshot.counts.ordiniParziali)} | arrivati ${formatCount(args.snapshot.counts.ordiniArrivati)}`,
    `Righe ordine: ${formatCount(args.snapshot.counts.righeOrdineTotali)} | pendenti ${formatCount(args.snapshot.counts.righeOrdinePendenti)} | arrivate ${formatCount(args.snapshot.counts.righeOrdineArrivate)}`,
    `Preventivi letti: ${formatCount(args.snapshot.counts.preventiviTotali)} | con PDF ${formatCount(args.snapshot.counts.preventiviConPdf)} | con targa diretta ${formatCount(args.snapshot.counts.preventiviConTargaDiretta)}`,
    `Approvazioni lette: ${formatCount(args.snapshot.counts.approvazioniTotali)} | pending ${formatCount(args.snapshot.counts.approvazioniPending)} | approved ${formatCount(args.snapshot.counts.approvazioniApproved)} | rejected ${formatCount(args.snapshot.counts.approvazioniRejected)}`,
    `Listino leggibile: ${formatCount(args.snapshot.counts.listinoVoci)} voci | con fornitore ${formatCount(args.snapshot.counts.listinoConFornitore)}`,
  ];

  const relevantBullets = focusCtas
    ? [
        `Ordine materiali | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.ordineMateriali.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.ordineMateriali.reason)}`,
        `Prezzi e preventivi | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.preventivi.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.preventivi.reason)}`,
        `Listino prezzi | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.listino.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.listino.reason)}`,
        `Capo Costi e approvazioni | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.approvazioniCapoCosti.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.approvazioniCapoCosti.reason)}`,
        `PDF timbrato | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.pdfTimbrato.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.pdfTimbrato.reason)}`,
      ]
    : focusApprovals
      ? [
          `Capo Costi | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.approvazioniCapoCosti.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.approvazioniCapoCosti.reason)}`,
          `Approvazioni pending: ${formatCount(args.snapshot.counts.approvazioniPending)}`,
          `Approvazioni gia segnate approved/rejected: ${formatCount(args.snapshot.counts.approvazioniApproved + args.snapshot.counts.approvazioniRejected)} | stato leggibile ma non azionabile`,
          `PDF timbrato | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.pdfTimbrato.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.pdfTimbrato.reason)}`,
        ]
      : [
          `Ordini | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.ordini.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.ordini.reason)}`,
          `Arrivi | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.arrivi.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.arrivi.reason)}`,
          `Dettaglio ordine | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.dettaglioOrdine.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.dettaglioOrdine.reason)}`,
          `Preventivi | ${formatProcurementSurfaceStateLabel(args.snapshot.surfaces.preventivi.state)} | ${sanitizeBusinessText(args.snapshot.surfaces.preventivi.reason)}`,
        ];

  const action = focusCtas
    ? "Nel clone NEXT conviene lasciare attivi solo ordini, arrivi e dettaglio ordine in sola lettura; ordine materiali, salva, conferma, approva, rifiuta, aggiungi materiale e PDF timbrato vanno tenuti bloccati o dichiarati come preview."
    : focusApprovals
      ? "Usa Capo Costi per leggere stato e documenti gia presenti, ma tratta approva, rifiuta e PDF timbrato come funzioni non operative nel clone."
      : args.snapshot.actionHint;

  return [
    "Procurement read-only",
    `Sintesi breve: ${summary}`,
    formatBulletBlock("Dati principali", mainBullets),
    formatBulletBlock("Elementi rilevanti", relevantBullets),
    formatBulletBlock(
      "Limiti",
      args.snapshot.limitations.slice(0, 5).map((entry) => sanitizeBusinessText(entry)),
    ),
    formatBulletBlock("Azione consigliata", [sanitizeBusinessText(action)]),
  ].join("\n\n");
}

function composeFleetCriticalityAssistantText(args: {
  title: string;
  rows: FleetPriorityRow[];
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
  rankingLimit: number | null;
  asksActionAdvice: boolean;
}): string {
  const displayLimit = Math.min(Math.max(args.rankingLimit ?? 5, 1), 6);
  const attentionRows = args.rows.filter((row) => row.priorityLabel !== "bassa");
  const rankedRows = attentionRows.length > 0 ? attentionRows : args.rows;
  const visibleRows = rankedRows.slice(0, displayLimit);
  const engineSummary = buildFleetPriorityEngineSummary(rankedRows);
  const top = visibleRows[0] ?? null;
  const summary = top
    ? `${formatCount(engineSummary.attentionCount)} mezzi richiedono attenzione nel periodo ${args.periodContext.label}; metto in testa ${top.targa} per ${top.reasons.slice(0, 3).join(", ")}.`
    : `Nel periodo ${args.periodContext.label} non emergono mezzi con segnali abbastanza forti per una priorita operativa affidabile.`;
  const actionBullets = visibleRows
    .slice(0, Math.min(displayLimit, 4))
    .map((row) => row.recommendedAction);

  return [
    args.title,
    `Sintesi breve: ${summary}`,
    formatBulletBlock(
      "Segnali usati per la classifica",
      engineSummary.signalBullets.slice(0, 6),
    ),
    formatBulletBlock(
      "Classifica operativa",
      visibleRows.map(
        (row, index) =>
          `${index + 1}. ${row.targa} | priorita ${row.priorityLabel} | ${row.reasons.slice(0, 3).join(", ") || "nessun fattore forte"} | fare ora: ${row.recommendedAction.replace(`${row.targa}: `, "")}`,
      ),
    ),
    formatBulletBlock(
      "Criterio di priorita",
      engineSummary.criteriaBullets,
    ),
    formatBulletBlock(
      "Azione consigliata",
      args.asksActionAdvice ? actionBullets : actionBullets.slice(0, 3),
    ),
    formatBulletBlock(
      "Limiti",
      [engineSummary.reliabilityNote, ...args.limitations.slice(0, 4)],
    ),
  ].join("\n\n");
}

function composeFleetDeadlineAssistantText(args: {
  rows: FleetPriorityRow[];
  limitations: string[];
  periodContext: InternalAiReportPeriodContext;
  rankingLimit: number | null;
  asksActionAdvice: boolean;
}): string {
  const displayLimit = Math.min(Math.max(args.rankingLimit ?? 5, 1), 6);
  const deadlineRows = args.rows.filter(
    (row) => row.overdueRevisions > 0 || row.upcomingRevisions > 0,
  );
  const preCollaudoRows = deadlineRows.filter((row) => row.preCollaudoSuggested);
  const visibleRows = deadlineRows.slice(0, displayLimit);
  const engineSummary = buildFleetPriorityEngineSummary(deadlineRows);
  const summary =
    deadlineRows.length > 0
      ? `${formatCount(deadlineRows.length)} mezzi richiedono attenzione su revisione/collaudo nel periodo ${args.periodContext.label}; ${formatCount(preCollaudoRows.length)} conviene pre-collaudarli.`
      : `Nel periodo ${args.periodContext.label} non emergono mezzi con scadenze rilevanti di revisione o collaudo.`;
  const actionBullets = visibleRows
    .slice(0, Math.min(displayLimit, 4))
    .map((row) => row.recommendedAction);

  return [
    "Scadenze, collaudi e pre-collaudi",
    `Sintesi breve: ${summary}`,
    formatBulletBlock(
      "Segnali usati per la classifica",
      engineSummary.signalBullets.slice(0, 6),
    ),
    formatBulletBlock(
      "Mezzi da seguire",
      visibleRows
        .map(
          (row, index) =>
            `${index + 1}. ${row.targa} | priorita ${row.priorityLabel} | scadute ${row.overdueRevisions} | entro 7 giorni ${row.dueSoonRevisions} | entro 30 giorni ${row.upcomingRevisions} | fare ora: ${row.recommendedAction.replace(`${row.targa}: `, "")}`,
        ),
    ),
    formatBulletBlock(
      "Pre-collaudi consigliati",
      preCollaudoRows
        .slice(0, displayLimit)
        .map((row) => `${row.targa} | revisione vicina e pre-collaudo non rilevato.`),
    ),
    formatBulletBlock(
      "Criterio di priorita",
      [
        "Prima scadenze o collaudi gia scaduti.",
        "Poi mezzi con scadenza entro 7 giorni.",
        "Poi mezzi entro 30 giorni senza pre-collaudo.",
        "A parita di scadenza pesano anche backlog tecnico e criticita gia aperte.",
      ],
    ),
    formatBulletBlock(
      "Azione consigliata",
      args.asksActionAdvice ? actionBullets : actionBullets.slice(0, 3),
    ),
    formatBulletBlock(
      "Limiti",
      [engineSummary.reliabilityNote, ...args.limitations.slice(0, 4)],
    ),
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
    `Verdetto fiducia: ${analytics.reliability.final.label}`,
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
        id: "rifornimenti-affidabilita",
        title: "Affidabilita del dato",
        summary: analytics.reliability.final.summary,
        bullets: [
          ...analytics.classificationBullets,
          ...analytics.reliabilityBullets.slice(0, 10),
        ],
        notes: analytics.missingData.slice(0, 2),
        status:
          analytics.reliability.final.status === "affidabile"
            ? "completa"
            : analytics.reliability.final.status === "prudente"
              ? "parziale"
              : "errore",
        periodContext: args.periodContext,
      }),
      sources,
      keyPoints: [
        `Verdetto fiducia: ${analytics.reliability.final.label}`,
        analytics.reliability.final.summary,
      ],
      missingData: analytics.reliability.final.status === "affidabile" ? [] : analytics.missingData.slice(0, 3),
      evidences: analytics.reliabilityBullets.slice(0, 3),
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
  const [magazzino, documentiFleet] = await Promise.all([
    readNextMagazzinoRealeSnapshot(),
    readNextDocumentiCostiFleetSnapshot(),
  ]);
  const materiali = buildNextMezzoMaterialiMovimentiSnapshot({
    baseSnapshot: magazzino.materials,
    targa: args.targa,
    mezzoId: args.mezzoId,
    materialCostSupportDocuments: documentiFleet.materialCostSupport.documents,
  });
  const materialItems = materiali.items.filter((item) => isTsInPeriod(item.timestamp, args.periodContext));
  const inventarioCritico = magazzino.inventory.items.filter((item) => item.stockStatus === "critico");
  const attrezzatureGap = magazzino.attentionSignals.find(
    (signal) => signal.kind === "tracciamento_attrezzature_parziale",
  );
  const hasUsefulWarehouseSignal =
    materialItems.length > 0 || inventarioCritico.length > 0 || Boolean(attrezzatureGap);
  const bullets = [
    `Movimenti materiali legati al mezzo: ${materialItems.length}`,
    `Match forti: ${materiali.counts.matchedStrong}`,
    materiali.counts.matchedPlausible > 0
      ? `Match prudenziali: ${materiali.counts.matchedPlausible}`
      : null,
    `Magazzino critico globale: ${inventarioCritico.length}`,
    `Attrezzature cantieri: ${magazzino.counts.attrezzatureMovements} movimenti globali | gap tracking ${magazzino.counts.attrezzatureTrackingGap}`,
    attrezzatureGap ? attrezzatureGap.title : null,
    ...materialItems.slice(0, 3).map((item) => `${item.materiale ?? item.descrizione ?? item.id}${item.fornitore ? ` | ${item.fornitore}` : ""}`),
    ...inventarioCritico.slice(0, 2).map((item) => `Magazzino critico: ${item.descrizione}`),
  ].filter((entry): entry is string => Boolean(entry));
  const sources = mergePreviewSources(
    [
      "storage/@materialiconsegnati",
      "storage/@inventario",
      "storage/@attrezzature_cantieri",
      "storage-path/materials",
      "storage-path/inventario",
    ]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "materiali-inventario",
      title: "Materiali e inventario",
      summary:
        hasUsefulWarehouseSignal
          ? "D05 ha riscontri utili sia lato mezzo sia lato magazzino globale."
          : "Nessun movimento materiali legato al mezzo e nessuna criticita inventario rilevata.",
      bullets,
      notes: dedupeStrings([
        ...materiali.limitations.slice(0, 2),
        ...magazzino.limitations.slice(0, 2),
        attrezzatureGap?.summary ?? null,
      ]),
      status: hasUsefulWarehouseSignal ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: bullets.slice(0, 4),
    missingData:
      materialItems.length > 0
        ? []
        : [
            "I movimenti materiali sono presenti nel dominio D05, ma non risultano agganci forti alla targa nel periodo richiesto.",
            "Le attrezzature cantieri restano oggi una vista globale D05: non espongono ancora un legame targa canonico abbastanza forte per attribuirle con certezza al mezzo.",
            materiali.counts.matchedPlausible > 0
              ? "Sono presenti solo collegamenti materiali prudenziali verso il mezzo: vanno letti come indizi, non come allocazioni certe."
              : null,
          ].filter((entry): entry is string => Boolean(entry)),
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

function isDirectDocumentiCostiItem(
  item: VehicleDocumentiCostiPeriodView["items"][number],
): boolean {
  return item.sourceType === "costo_mezzo" || item.sourceType === "documento_mezzo";
}

function formatDocumentiCostiTotalsLabel(args: {
  label: string;
  totals: VehicleDocumentiCostiPeriodView["totals"]["fatture"];
  nonAdditive?: boolean;
}): string | null {
  if (args.totals.withAmount <= 0) {
    return null;
  }

  const amountParts: string[] = [];
  if (args.totals.eur > 0) {
    amountParts.push(formatCurrencyByCode(args.totals.eur, "EUR"));
  }
  if (args.totals.chf > 0) {
    amountParts.push(formatCurrencyByCode(args.totals.chf, "CHF"));
  }
  if (args.totals.unknownCount > 0) {
    amountParts.push(`${formatCount(args.totals.unknownCount)} importi senza valuta certa`);
  }

  return `${args.label}: ${formatCount(args.totals.withAmount)} elementi con importo leggibile${amountParts.length > 0 ? ` per ${amountParts.join(" + ")}` : ""}${args.nonAdditive ? " (non sommati al costo consuntivo)." : "."}`;
}

function formatDocumentiCostiHistoricalEntry(
  item: VehicleDocumentiCostiPeriodView["items"][number],
): string {
  const dateLabel = item.dateLabel ?? "data non disponibile";
  const businessLink = isDirectDocumentiCostiItem(item) ? "legame diretto" : "legame prudente";
  const verificationLabel =
    item.flags.includes("da_verificare") || item.flags.includes("motivo_verifica_presente")
      ? " | da verificare"
      : "";
  const amountLabel =
    item.amount !== null && (item.currency === "EUR" || item.currency === "CHF")
      ? formatCurrencyByCode(item.amount, item.currency)
      : item.amount !== null
        ? `${formatDecimal(item.amount)} valuta non dichiarata`
        : item.category === "documento_utile"
          ? item.fileUrl
            ? "allegato leggibile"
            : "allegato non disponibile"
          : "importo non leggibile";

  return `${dateLabel} | ${sanitizeBusinessText(item.title)} | ${amountLabel} | ${businessLink}${verificationLabel}`;
}

function buildDocumentiCostiSectionSummary(args: {
  targa: string;
  periodView: VehicleDocumentiCostiPeriodView;
}): string {
  const { periodView } = args;
  if (periodView.counts.total === 0) {
    return `Nel periodo ${periodView.period.label} non risultano costi o documenti leggibili collegati in modo abbastanza chiaro alla targa ${args.targa}.`;
  }

  const summaryParts = [
    `Nel periodo ${periodView.period.label} risultano ${formatCount(periodView.counts.total)} elementi utili per ${args.targa}`,
    periodView.totals.fatture.withAmount > 0
      ? `costo consuntivo leggibile su ${formatCount(periodView.totals.fatture.withAmount)} fatture`
      : periodView.counts.fatture > 0
        ? "sono presenti fatture, ma senza una base importi completa"
        : null,
    periodView.counts.documentiUtili > 0
      ? `${formatCount(periodView.counts.documentiUtili)} documenti utili`
      : null,
    periodView.counts.prudential > 0
      ? `${formatCount(periodView.counts.prudential)} collegamenti prudenziali`
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  return `${summaryParts.join(", ")}.`;
}

function composeCostsDocumentsAssistantText(args: {
  targa: string;
  periodView: VehicleDocumentiCostiPeriodView;
}): string {
  const { periodView } = args;
  const primaryDataBullet =
    periodView.counts.total > 0
      ? `Elementi utili nel periodo: ${formatCount(periodView.counts.total)} | diretti ${formatCount(periodView.counts.direct)} | prudenziali ${formatCount(periodView.counts.prudential)}`
      : `Elementi utili nel periodo: ${formatCount(periodView.counts.total)}`;
  const costBullet =
    formatDocumentiCostiTotalsLabel({
      label: "Costo consuntivo leggibile",
      totals: periodView.totals.fatture,
    }) ??
    (periodView.counts.fatture > 0
      ? `Costo consuntivo leggibile: sono presenti ${formatCount(periodView.counts.fatture)} fatture, ma senza importi abbastanza leggibili per un totale affidabile.`
      : "Costo consuntivo leggibile: nessuna fattura con importo leggibile nel periodo.");
  const quotesBullet =
    periodView.counts.preventivi > 0
      ? formatDocumentiCostiTotalsLabel({
          label: "Preventivi letti",
          totals: periodView.totals.preventivi,
          nonAdditive: true,
        }) ??
        `Preventivi letti: ${formatCount(periodView.counts.preventivi)} presenti, ma senza importi leggibili completi.`
      : null;
  const documentsBullet =
    periodView.counts.documentiUtili > 0
      ? `Documenti rilevanti: ${formatCount(periodView.counts.documentiUtili)} | con allegato ${formatCount(periodView.counts.withFile)} | da verificare ${formatCount(periodView.counts.daVerificare)}`
      : "Documenti rilevanti: nessun documento utile forte nel periodo richiesto.";
  const historyBullets = periodView.highlights.storico
    .slice(0, 3)
    .map((item) => formatDocumentiCostiHistoricalEntry(item));
  const limitBullets = dedupeStrings([
    periodView.period.note,
    ...periodView.limitations.slice(0, 3),
  ]).slice(0, 4);

  return [
    `Report costi e documenti ${args.targa}`,
    `Sintesi breve: ${buildDocumentiCostiSectionSummary(args)}`,
    formatBulletBlock(
      "Dati principali",
      [primaryDataBullet, costBullet, quotesBullet, documentsBullet].filter(
        (entry): entry is string => Boolean(entry),
      ),
    ),
    formatBulletBlock("Elementi rilevanti", historyBullets),
    formatBulletBlock("Anomalie o limiti", limitBullets),
    formatBulletBlock("Azione consigliata", [periodView.actionHint]),
  ].join("\n\n");
}

async function buildDocumentiCostiSection(args: {
  targa: string;
  periodContext: InternalAiReportPeriodContext;
  registry: UnifiedRegistrySnapshot;
}): Promise<UnifiedSectionBuild> {
  const periodView = await readNextMezzoDocumentiCostiPeriodView(args.targa, {
    label: args.periodContext.label,
    appliesFilter: args.periodContext.appliesFilter,
    fromTimestamp: args.periodContext.fromTimestamp,
    toTimestamp: args.periodContext.toTimestamp,
  });
  const summary = buildDocumentiCostiSectionSummary({
    targa: args.targa,
    periodView,
  });
  const primaryDataBullet =
    periodView.counts.total > 0
      ? `Dati principali: ${formatCount(periodView.counts.total)} elementi utili nel periodo, ${formatCount(periodView.counts.direct)} diretti e ${formatCount(periodView.counts.prudential)} prudenziali.`
      : "Dati principali: nessun elemento utile leggibile nel periodo richiesto.";
  const costsBullet =
    formatDocumentiCostiTotalsLabel({
      label: "Costi leggibili",
      totals: periodView.totals.fatture,
    }) ??
    (periodView.counts.fatture > 0
      ? `Costi leggibili: ${formatCount(periodView.counts.fatture)} fatture presenti, ma senza importi abbastanza leggibili per un totale certo.`
      : "Costi leggibili: nessuna fattura con importo leggibile nel periodo.");
  const quotesBullet =
    periodView.counts.preventivi > 0
      ? formatDocumentiCostiTotalsLabel({
          label: "Preventivi letti",
          totals: periodView.totals.preventivi,
          nonAdditive: true,
        }) ??
        `Preventivi letti: ${formatCount(periodView.counts.preventivi)} presenti, ma senza importi leggibili completi.`
      : null;
  const documentsBullet =
    periodView.counts.documentiUtili > 0
      ? `Documenti rilevanti: ${formatCount(periodView.counts.documentiUtili)} | allegati leggibili ${formatCount(periodView.counts.withFile)} | da verificare ${formatCount(periodView.counts.daVerificare)}.`
      : "Documenti rilevanti: nessun documento utile forte nel periodo richiesto.";
  const historyBullet =
    periodView.highlights.storico.length > 0
      ? `Storico utile: ${periodView.highlights.storico
          .slice(0, 2)
          .map((item) => formatDocumentiCostiHistoricalEntry(item))
          .join(" || ")}`
      : "Storico utile: nessun evento documentale o costo con data leggibile nel periodo.";
  const limitsBullet = dedupeStrings([
    periodView.period.note,
    periodView.counts.prudential > 0
      ? `${formatCount(periodView.counts.prudential)} collegamenti del periodo restano prudenziali.`
      : null,
    periodView.counts.excludedMissingDate > 0
      ? `${formatCount(periodView.counts.excludedMissingDate)} elementi senza data leggibile restano fuori dal filtro periodo.`
      : null,
    periodView.counts.daVerificare > 0
      ? `${formatCount(periodView.counts.daVerificare)} elementi risultano da verificare.`
      : null,
  ])
    .slice(0, 3)
    .join(" ");
  const bullets = [
    primaryDataBullet,
    costsBullet,
    quotesBullet,
    documentsBullet,
    historyBullet,
    `Azione consigliata: ${periodView.actionHint}`,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 6);
  const sources = mergePreviewSources(
    ["storage/@costiMezzo", "collection/@documenti_mezzi", "collection/@documenti_magazzino", "collection/@documenti_generici", "storage-path/documenti_pdf", "storage-path/mezzi_aziendali"]
      .map((sourceId) => args.registry.sources.find((entry) => entry.sourceId === sourceId))
      .filter((entry): entry is UnifiedSourceSnapshot => Boolean(entry))
      .map((entry) => buildSourcePreviewFromSource(entry, args.periodContext)),
  );

  return {
    section: buildSection({
      id: "documenti-costi",
      title: "Costi, documenti e storico utile",
      summary,
      bullets,
      notes: dedupeStrings([
        limitsBullet,
        ...periodView.limitations,
      ]).slice(0, 4),
      status:
        periodView.counts.total === 0
          ? periodView.counts.totalAvailable > 0
            ? "parziale"
            : "vuota"
          : periodView.reliability.final === "affidabile"
            ? "completa"
            : "parziale",
      periodContext: args.periodContext,
    }),
    sources,
    keyPoints: [summary, costsBullet, documentsBullet, `Azione consigliata: ${periodView.actionHint}`]
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 4),
    missingData:
      periodView.counts.total > 0
        ? periodView.limitations.slice(0, 3)
        : [
            "D07/D08 presenti nel registry ma senza costi o documenti leggibili nel periodo richiesto.",
            ...periodView.limitations.slice(0, 2),
          ],
    evidences: periodView.highlights.storico
      .slice(0, 2)
      .map((item) => formatDocumentiCostiHistoricalEntry(item)),
    businessPayload: {
      kind: "documenti_costi",
      periodView,
    },
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
  primaryIntent: UnifiedBusinessIntentId,
  selectedScopes: InternalAiUnifiedScopeId[],
  targa: string,
): string {
  if (primaryIntent === "vehicle_overview") {
    return `Quadro mezzo ${targa}`;
  }
  if (primaryIntent === "vehicle_materials") {
    return `Report materiali e magazzino ${targa}`;
  }
  if (primaryIntent === "costs_documents") {
    return `Report costi e documenti ${targa}`;
  }
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

function hasVehiclePrecollaudoSuggestion(
  operational: ReturnType<typeof collectVehicleOperationalSignals> | null,
): boolean {
  if (!operational) {
    return false;
  }

  return operational.revisionItems.some(
    (item) => item.giorni !== null && item.giorni <= 30 && !item.preCollaudo?.data,
  );
}

function buildVehiclePrimaryActionLabel(args: {
  targa: string;
  priority: VehiclePrioritySummary | null;
  operational: ReturnType<typeof collectVehicleOperationalSignals> | null;
  fuelAnalytics?: FuelAnalyticsSummary | null;
}): string {
  if (args.priority?.overdueRevisions) {
    return "Verificare subito le scadenze o i collaudi gia scaduti e chiudere la prenotazione.";
  }

  if (args.priority?.dueSoonRevisions) {
    return hasVehiclePrecollaudoSuggestion(args.operational)
      ? "Organizzare prima il pre-collaudo e confermare la prenotazione."
      : "Chiudere prima la preparazione del collaudo entro 7 giorni.";
  }

  if ((args.priority?.alertDangerCount ?? 0) > 0 || (args.priority?.focusKoCount ?? 0) > 0) {
    return "Controllare prima alert critici e controlli KO ancora aperti.";
  }

  if ((args.priority?.highUrgencyWorks ?? 0) > 0) {
    return "Sbloccare prima i lavori ad alta urgenza aperti sul mezzo.";
  }

  if ((args.priority?.newSignalCount ?? 0) > 0) {
    return "Leggere le segnalazioni recenti e confermare subito la presa in carico.";
  }

  if ((args.priority?.openWorks ?? 0) > 0 || (args.priority?.maintenanceCount ?? 0) > 0) {
    return "Allineare backlog tecnico e manutenzioni aperte prima di allargare l'analisi.";
  }

  if (
    args.fuelAnalytics &&
    args.fuelAnalytics.reliability.final.status !== "affidabile" &&
    args.fuelAnalytics.recordsFound > 0
  ) {
    return "Usare i consumi con prudenza e verificare prima i record esclusi o ricostruiti.";
  }

  return "Non emergono urgenze forti: mantenere monitoraggio ordinario e ricontrollare il mezzo nel prossimo ciclo operativo.";
}

function buildVehicleOverviewCards(args: {
  targa: string;
  priority: VehiclePrioritySummary | null;
  operational: ReturnType<typeof collectVehicleOperationalSignals> | null;
  fuelAnalytics?: FuelAnalyticsSummary | null;
}): InternalAiVehicleReportPreview["cards"] {
  const primaryAction = buildVehiclePrimaryActionLabel(args);
  const deadlineValue =
    (args.priority?.overdueRevisions ?? 0) > 0
      ? "Scaduto"
      : (args.priority?.dueSoonRevisions ?? 0) > 0
        ? "Entro 7 giorni"
        : (args.priority?.upcomingRevisions ?? 0) > 0
          ? "Entro 30 giorni"
          : "OK";
  const deadlineMetaParts = [
    (args.priority?.overdueRevisions ?? 0) > 0
      ? `${args.priority?.overdueRevisions ?? 0} scadenze o collaudi gia scaduti`
      : null,
    (args.priority?.dueSoonRevisions ?? 0) > 0
      ? `${args.priority?.dueSoonRevisions ?? 0} scadenze entro 7 giorni`
      : null,
    (args.priority?.upcomingRevisions ?? 0) > 0 && (args.priority?.dueSoonRevisions ?? 0) === 0
      ? `${args.priority?.upcomingRevisions ?? 0} scadenze entro 30 giorni`
      : null,
    hasVehiclePrecollaudoSuggestion(args.operational) ? "Pre-collaudo utile." : null,
    deadlineValue === "OK" ? "Nessuna scadenza ravvicinata nel periodo letto." : null,
  ].filter((entry): entry is string => Boolean(entry));

  return [
    {
      label: "Stato generale",
      value:
        args.priority?.priorityLabel === "alta"
          ? "Attenzione alta"
          : args.priority?.priorityLabel === "media"
            ? "Attenzione media"
            : "Monitoraggio ordinario",
      meta:
        args.priority?.reasons.length
          ? args.priority.reasons.slice(0, 2).map((entry) => sanitizeBusinessText(entry)).join(", ")
          : "Non emergono criticita forti nel periodo letto.",
      tone: args.priority?.priorityLabel === "bassa" ? "success" : "warning",
    },
    {
      label: "Cosa fare ora",
      value: primaryAction,
      meta:
        args.priority?.reasons.length
          ? `Motivo principale: ${sanitizeBusinessText(args.priority.reasons[0])}.`
          : "Nessun segnale forte da mettere in cima alle priorita.",
      tone: args.priority?.priorityLabel === "alta" ? "warning" : "default",
    },
    {
      label: "Scadenze",
      value: deadlineValue,
      meta: deadlineMetaParts.join(" "),
      tone: deadlineValue === "OK" ? "success" : "warning",
    },
    {
      label: "Backlog tecnico",
      value:
        (args.priority?.openWorks ?? 0) > 0 || (args.priority?.maintenanceCount ?? 0) > 0
          ? `${args.priority?.openWorks ?? 0} lavori / ${args.priority?.maintenanceCount ?? 0} manutenzioni`
          : "Nessun backlog rilevante",
      meta:
        (args.priority?.highUrgencyWorks ?? 0) > 0
          ? `${args.priority?.highUrgencyWorks ?? 0} lavori urgenti da seguire.`
          : (args.priority?.openWorks ?? 0) > 0
            ? "Backlog tecnico aperto da pianificare."
            : (args.priority?.maintenanceCount ?? 0) > 0
              ? "Manutenzioni presenti nel periodo letto."
              : "Nessun intervento aperto rilevante.",
      tone:
        (args.priority?.openWorks ?? 0) > 0 || (args.priority?.maintenanceCount ?? 0) > 0
          ? "warning"
          : "success",
    },
  ];
}

function buildVehicleOverviewSections(args: {
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  missingData: string[];
  operational: ReturnType<typeof collectVehicleOperationalSignals> | null;
  technical: ReturnType<typeof collectVehicleTechnicalSignals> | null;
  priority: VehiclePrioritySummary | null;
  fuelAnalytics?: FuelAnalyticsSummary | null;
}): InternalAiVehicleReportSection[] {
  const sectionsById = new Map(args.sections.map((section) => [section.id, section]));
  const tyreSection = sectionsById.get("gomme") ?? null;
  const materialsSection = sectionsById.get("materiali-inventario") ?? null;
  const costsSection = sectionsById.get("documenti-costi") ?? null;
  const operationalSignals = args.operational;
  const technicalSignals = args.technical;
  const shouldIncludeFuel =
    Boolean(args.fuelAnalytics) &&
    (args.fuelAnalytics?.recordsFound ?? 0) > 0 &&
    ((args.fuelAnalytics?.kmPerLiter ?? null) !== null ||
      (args.fuelAnalytics?.anomalyBullets.length ?? 0) > 0);
  const deadlineValue =
    (args.priority?.overdueRevisions ?? 0) > 0
      ? "Scaduto"
      : (args.priority?.dueSoonRevisions ?? 0) > 0
        ? "Entro 7 giorni"
        : (args.priority?.upcomingRevisions ?? 0) > 0
          ? "Entro 30 giorni"
          : "OK";
  const deadlineBullets = [
    (args.priority?.overdueRevisions ?? 0) > 0
      ? `${args.priority?.overdueRevisions ?? 0} scadenze o collaudi gia scaduti`
      : null,
    ...(operationalSignals?.revisionItems.slice(0, 3).map((item) => {
      const dayLabel =
        item.giorni == null
          ? "giorni da verificare"
          : item.giorni < 0
            ? `scaduta da ${Math.abs(item.giorni)} giorni`
            : `tra ${item.giorni} giorni`;
      return `${formatDateLabel(item.scadenzaTs)} | ${dayLabel}`;
    }) ?? []),
    ...(operationalSignals?.revisionItems
      .filter((item) => item.giorni !== null && item.giorni <= 30 && !item.preCollaudo?.data)
      .slice(0, 2)
      .map((item) => `${formatDateLabel(item.scadenzaTs)} | utile organizzare pre-collaudo.`) ?? []),
    deadlineValue === "OK" ? "Nessuna scadenza ravvicinata nel periodo letto." : null,
  ].filter((entry): entry is string => Boolean(entry));

  const backlogBullets = [
    `Lavori aperti: ${technicalSignals?.lavoriAperti.length ?? 0}`,
    `Manutenzioni rilevanti: ${technicalSignals?.manutenzioni.length ?? 0}`,
    ...(technicalSignals?.lavoriAperti.slice(0, 3).map((item) =>
      `${sanitizeBusinessText(item.descrizione)}${item.urgenza ? ` | urgenza ${sanitizeBusinessText(item.urgenza)}` : ""}`) ?? []),
    ...(technicalSignals?.manutenzioni.slice(0, 2).map((item) =>
      `${sanitizeBusinessText(item.descrizione ?? item.tipo ?? "manutenzione")}${item.data ? ` | ${item.data}` : ""}`) ?? []),
    ...(tyreSection?.status === "completa"
      ? tyreSection.bullets
          .filter((bullet) => /gomm|pneumatic/i.test(bullet))
          .slice(0, 2)
          .map((bullet) => sanitizeBusinessText(bullet))
      : []),
  ];

  const signalBullets = [
    ...(operationalSignals?.alertItems.slice(0, 3).map((item) =>
      `${sanitizeBusinessText(item.title)}: ${sanitizeBusinessText(item.detailText)}`) ?? []),
    ...(operationalSignals?.focusItems.slice(0, 2).map((item) =>
      `${sanitizeBusinessText(item.title)}: ${sanitizeBusinessText(item.detailText)}`) ?? []),
    ...(operationalSignals?.sessioni[0]
      ? [
          `Sessione attiva: ${sanitizeBusinessText(
            operationalSignals.sessioni[0].nomeAutista ?? "autista non dichiarato",
          )}`,
        ]
      : []),
  ];

  const result: InternalAiVehicleReportSection[] = [
    buildSection({
      id: "decision-deadlines",
      title: "Scadenze e collaudi",
      summary:
        deadlineValue === "OK"
          ? "Scadenze e collaudi sotto controllo nel periodo letto."
          : `Stato scadenze: ${deadlineValue}.`,
      bullets: deadlineBullets,
      status: deadlineValue === "OK" ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
    buildSection({
      id: "decision-backlog",
      title: "Backlog tecnico",
      summary:
        (args.priority?.openWorks ?? 0) > 0 || (args.priority?.maintenanceCount ?? 0) > 0
          ? `Sono presenti ${args.priority?.openWorks ?? 0} lavori aperti e ${args.priority?.maintenanceCount ?? 0} manutenzioni da seguire.`
          : "Non risultano backlog tecnici forti nel periodo letto.",
      bullets: backlogBullets.slice(0, 6).map((entry) => sanitizeBusinessText(entry)),
      status:
        (args.priority?.openWorks ?? 0) > 0 || (args.priority?.maintenanceCount ?? 0) > 0
          ? "completa"
          : "parziale",
      periodContext: args.periodContext,
    }),
    buildSection({
      id: "decision-signals",
      title: "Segnali operativi",
      summary:
        signalBullets.length > 0
          ? `Rilevati ${operationalSignals?.alertItems.length ?? 0} alert o segnalazioni utili e ${operationalSignals?.focusItems.length ?? 0} focus da seguire.`
          : "Non emergono alert o segnalazioni operative forti nel periodo letto.",
      bullets:
        signalBullets.length > 0
          ? signalBullets.slice(0, 6)
          : ["Nessun alert o segnalazione forte nel periodo letto."],
      status: signalBullets.length > 0 ? "completa" : "parziale",
      periodContext: args.periodContext,
    }),
  ];

  if (shouldIncludeFuel && args.fuelAnalytics) {
    result.push(
      buildSection({
        id: "decision-fuel",
        title: "Consumi e rifornimenti",
        summary:
          args.fuelAnalytics.kmPerLiter !== null
            ? `${formatCount(args.fuelAnalytics.recordsFound)} rifornimenti letti; resa media ${formatDecimal(args.fuelAnalytics.kmPerLiter)} km/l con fiducia ${args.fuelAnalytics.reliability.final.label.toLowerCase()}.`
            : `${formatCount(args.fuelAnalytics.recordsFound)} rifornimenti letti, ma la media non e calcolabile in modo affidabile.`,
        bullets: [
          `Litri inclusi: ${formatDecimal(args.fuelAnalytics.totalLiters, 1)} L`,
          args.fuelAnalytics.analyzedKm > 0
            ? `Km analizzati: ${formatCount(Math.round(args.fuelAnalytics.analyzedKm))}`
            : "Km analizzati: non disponibili in modo affidabile",
          `Verdetto fiducia: ${args.fuelAnalytics.reliability.final.label}`,
          ...(args.fuelAnalytics.anomalyBullets.slice(0, 2).map((entry) => sanitizeBusinessText(entry))),
          ...(args.fuelAnalytics.actionBullets.slice(0, 1).map((entry) => sanitizeBusinessText(entry))),
        ].filter((entry): entry is string => Boolean(entry)),
        status:
          args.fuelAnalytics.reliability.final.status === "affidabile"
            ? "completa"
            : "parziale",
        periodContext: args.periodContext,
      }),
    );
  }

  if (
    materialsSection &&
    (materialsSection.status === "completa" ||
      materialsSection.bullets.length > 0 ||
      materialsSection.notes.length > 0)
  ) {
    result.push(
      buildSection({
        id: "decision-materials",
        title: "Materiali, attrezzature e magazzino",
        summary: sanitizeBusinessText(materialsSection.summary),
        bullets: materialsSection.bullets
          .slice(0, 5)
          .map((entry) => sanitizeBusinessText(entry)),
        notes: materialsSection.notes
          .slice(0, 3)
          .map((entry) => sanitizeBusinessText(entry)),
        status: materialsSection.status,
        periodContext: args.periodContext,
      }),
    );
  }

  if (
    costsSection &&
    (costsSection.status === "completa" || costsSection.bullets.some((entry) => /\|/.test(entry)))
  ) {
    result.push(
      buildSection({
        id: "decision-costs",
        title: "Costi, documenti e storico utile",
        summary: sanitizeBusinessText(costsSection.summary),
        bullets: costsSection.bullets
          .slice(0, 4)
          .map((entry) => sanitizeBusinessText(entry)),
        status: costsSection.status,
        periodContext: args.periodContext,
      }),
    );
  }

  result.push(
    buildSection({
      id: "decision-note",
      title: "Nota finale",
      summary:
        args.missingData.length > 0
          ? "Il quadro usa solo le informazioni oggi leggibili in modo abbastanza stabile."
          : "Il quadro usa solo le informazioni oggi verificabili nel clone in sola lettura.",
      bullets:
        args.missingData.length > 0
          ? args.missingData.slice(0, 4).map((entry) => sanitizeBusinessText(entry))
          : ["Nessun limite forte aggiuntivo oltre alle fonti gia lette nel periodo richiesto."],
      status: args.missingData.length > 0 ? "parziale" : "completa",
      periodContext: args.periodContext,
    }),
  );

  return result;
}

function buildVehiclePreview(args: {
  mezzo: NextAnagraficheFlottaMezzoItem;
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  sources: InternalAiVehicleReportSource[];
  missingData: string[];
  evidences: string[];
  selectedScopes: InternalAiUnifiedScopeId[];
  primaryIntent: UnifiedBusinessIntentId;
  operationalSignals?: ReturnType<typeof collectVehicleOperationalSignals> | null;
  technicalSignals?: ReturnType<typeof collectVehicleTechnicalSignals> | null;
  prioritySummary?: VehiclePrioritySummary | null;
  fuelAnalytics?: FuelAnalyticsSummary | null;
  documentiCostiView?: VehicleDocumentiCostiPeriodView | null;
}): InternalAiVehicleReportPreview {
  const criticalCount = args.sections
    .filter((section) => section.id === "stato-operativo-attuale" || section.id === "lavori-manutenzioni")
    .reduce((total, section) => total + section.bullets.length, 0);
  const isFuelReport =
    args.selectedScopes.length === 1 && args.selectedScopes[0] === "rifornimenti" && args.fuelAnalytics;
  const isVehicleOverview = args.primaryIntent === "vehicle_overview";
  const isCostsDocumentsReport =
    args.primaryIntent === "costs_documents" && Boolean(args.documentiCostiView);
  const previewSections = isVehicleOverview
    ? buildVehicleOverviewSections({
        periodContext: args.periodContext,
        sections: args.sections,
        missingData: args.missingData,
        operational: args.operationalSignals ?? null,
        technical: args.technicalSignals ?? null,
        priority: args.prioritySummary ?? null,
        fuelAnalytics: args.fuelAnalytics,
      })
    : args.sections;
  const cards: InternalAiVehicleReportPreview["cards"] = isVehicleOverview
    ? buildVehicleOverviewCards({
        targa: args.mezzo.targa,
        priority: args.prioritySummary ?? null,
        operational: args.operationalSignals ?? null,
        fuelAnalytics: args.fuelAnalytics,
      })
    : isFuelReport
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
        {
          label: "Verdetto fiducia",
          value: args.fuelAnalytics?.reliability.final.label ?? "Da verificare",
          meta: `Sorgente ${args.fuelAnalytics?.reliability.source.label ?? "n.d."} | Filtro ${args.fuelAnalytics?.reliability.filter.label ?? "n.d."} | Calcolo ${args.fuelAnalytics?.reliability.calculation.label ?? "n.d."}`,
          tone: args.fuelAnalytics?.reliability.final.status === "affidabile" ? "success" : "warning",
        },
      ]
    : isCostsDocumentsReport
    ? [
        {
          label: "Elementi nel periodo",
          value: `${args.documentiCostiView?.counts.total ?? 0}`,
          meta: "costi e documenti leggibili nel periodo richiesto",
        },
        {
          label: "Costo consuntivo",
          value:
            (args.documentiCostiView?.totals.fatture.withAmount ?? 0) > 0
              ? `${args.documentiCostiView?.totals.fatture.withAmount ?? 0} fatture`
              : "n.d.",
          meta:
            (args.documentiCostiView?.totals.fatture.withAmount ?? 0) > 0
              ? [
                  args.documentiCostiView?.totals.fatture.eur
                    ? formatCurrencyByCode(args.documentiCostiView.totals.fatture.eur, "EUR")
                    : null,
                  args.documentiCostiView?.totals.fatture.chf
                    ? formatCurrencyByCode(args.documentiCostiView.totals.fatture.chf, "CHF")
                    : null,
                ]
                  .filter((entry): entry is string => Boolean(entry))
                  .join(" + ")
              : "nessun totale consuntivo leggibile",
        },
        {
          label: "Documenti rilevanti",
          value: `${args.documentiCostiView?.counts.documentiUtili ?? 0}`,
          meta: `${args.documentiCostiView?.counts.withFile ?? 0} allegati leggibili | ${args.documentiCostiView?.counts.daVerificare ?? 0} da verificare`,
        },
        {
          label: "Affidabilita",
          value: formatReliabilityLabel(args.documentiCostiView?.reliability.final ?? "da_verificare"),
          meta: `Sorgente ${formatReliabilityLabel(args.documentiCostiView?.reliability.source ?? "da_verificare")} | Filtro ${formatReliabilityLabel(args.documentiCostiView?.reliability.filter ?? "da_verificare")}`,
          tone:
            (args.documentiCostiView?.reliability.final ?? "da_verificare") === "affidabile"
              ? "success"
              : "warning",
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
    title: buildVehicleReportTitle(args.primaryIntent, args.selectedScopes, args.mezzo.targa),
    subtitle: isVehicleOverview
      ? `Solo le informazioni utili per decidere cosa fare | periodo ${args.periodContext.label}`
      : isFuelReport
      ? `Targa ${args.mezzo.targa} | periodo ${args.periodContext.label}`
      : isCostsDocumentsReport
        ? `Costi, documenti e storico utile | periodo ${args.periodContext.label}`
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
    sections: previewSections,
    missingData: args.missingData,
    evidences: args.evidences,
    sources: args.sources,
    previewState: { ...PREVIEW_STATE, updatedAt: new Date().toISOString() },
    approvalState: { ...APPROVAL_STATE, updatedAt: new Date().toISOString() },
  };
}

function formatAutistiLinkReliabilityLabel(
  reliability: NextAutistiReadOnlySnapshot["assignments"][number]["linkReliability"],
): string {
  switch (reliability) {
    case "forte":
      return "aggancio forte";
    case "prudente":
      return "aggancio prudente";
    case "locale_clone":
      return "solo locale clone";
    default:
      return "non dimostrabile";
  }
}

function formatAutistiOriginLabel(
  origin: NextAutistiReadOnlySnapshot["signals"][number]["sourceOrigin"],
): string {
  switch (origin) {
    case "madre_storage":
      return "madre in sola lettura";
    case "madre_collection_legacy":
      return "fallback legacy prudente";
    default:
      return "clone locale autisti";
  }
}

function isTimestampToday(timestamp: number | null, now: number): boolean {
  if (timestamp === null) return false;
  const current = new Date(now);
  const start = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const end = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
  return timestamp >= start && timestamp <= end;
}

function buildAutistiAttentionItems(args: {
  snapshot: AutistiReadOnlySnapshot;
  spec: UnifiedQuerySpec;
  periodContext: InternalAiReportPeriodContext;
}): NextAutistiCanonicalSignal[] {
  return args.snapshot.signals
    .filter((item) => item.requiresAttention)
    .filter((item) => {
      if (args.spec.periodExplicitRequested && args.periodContext.appliesFilter) {
        return isTsInPeriod(item.timestamp, args.periodContext);
      }
      if (args.spec.normalizedPrompt.includes("oggi")) {
        return isTimestampToday(item.timestamp, Date.now());
      }
      return true;
    })
    .sort((left, right) => {
      const leftScore = left.sourceOrigin === "madre_storage" ? 2 : 1;
      const rightScore = right.sourceOrigin === "madre_storage" ? 2 : 1;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return (right.timestamp ?? 0) - (left.timestamp ?? 0);
    });
}

function composeDriversAssistantText(args: {
  spec: UnifiedQuerySpec;
  snapshot: AutistiReadOnlySnapshot;
  periodContext: InternalAiReportPeriodContext;
}): string {
  const asksBoundary =
    args.spec.normalizedPrompt.includes("madre") ||
    args.spec.normalizedPrompt.includes("next") ||
    args.spec.normalizedPrompt.includes("flusso locale") ||
    args.spec.normalizedPrompt.includes("solo locale") ||
    args.spec.normalizedPrompt.includes("solo in lettura") ||
    args.spec.normalizedPrompt.includes("read-only");
  const asksAnomalies =
    args.spec.normalizedPrompt.includes("anomali") ||
    args.spec.normalizedPrompt.includes("anomalie") ||
    args.spec.normalizedPrompt.includes("incomplet");
  const asksFlowSummary =
    args.spec.normalizedPrompt.includes("riepilogo") ||
    args.spec.normalizedPrompt.includes("flusso autisti") ||
    args.spec.normalizedPrompt.includes("app autisti");
  const asksAssociationExplicit =
    args.spec.normalizedPrompt.includes("a quale autista") ||
    args.spec.normalizedPrompt.includes("associat") ||
    args.spec.normalizedPrompt.includes("collegat");
  const asksAssociation =
    asksAssociationExplicit ||
    (args.spec.normalizedTarga !== null &&
      !asksBoundary &&
      !asksAnomalies &&
      !asksFlowSummary);
  const attentionItems = buildAutistiAttentionItems(args);

  if (asksAnomalies) {
    return [
      "Anomalie dominio autisti",
      `Sintesi breve: ho trovato ${args.snapshot.anomalies.length} punti da verificare nel perimetro D03 letto oggi.`,
      formatBulletBlock("Anomalie e dati incompleti", args.snapshot.anomalies.slice(0, 6)),
      formatBulletBlock(
        "Azione consigliata",
        [
          "Correggi prima gli agganci senza badge o senza targa forte.",
          "Se nel clone esistono segnali locali, non considerarli sincronizzati con la madre.",
        ],
      ),
    ].join("\n\n");
  }

  if (asksFlowSummary || attentionItems.length === 0) {
    return [
      "Flusso autisti read-only",
      `Sintesi breve: oggi vedo ${args.snapshot.counts.activeSessions} sessioni attive, ${args.snapshot.counts.attentionSignalsMother} segnali madre e ${args.snapshot.counts.attentionSignalsLocal} segnali solo locali clone.`,
      formatBulletBlock("Dati principali", [
        `Agganci forti autista-mezzo: ${args.snapshot.counts.assignmentsStrong}`,
        `Agganci prudenziali: ${args.snapshot.counts.assignmentsPrudent}`,
        `Fallback legacy: ${args.snapshot.counts.legacyEvents}`,
      ]),
      formatBulletBlock(
        "Nota semplice",
        dedupeStrings([
          args.snapshot.operationalStatus.note,
          ...args.snapshot.limitations,
        ]).slice(0, 5),
      ),
      formatBulletBlock(
        "Azione consigliata",
        [
          "Per rettifiche o approfondimenti usa il Centro di Controllo e l'area admin autisti nel perimetro clone-safe.",
        ],
      ),
    ].join("\n\n");
  }

  if (asksBoundary) {
    return [
      "Confine reale del dominio autisti",
      "Sintesi breve: D03 legge fonti madre in sola lettura, separa il clone locale autisti e tratta il fallback legacy solo come supporto prudente.",
      formatBulletBlock(
        "Perimetro",
        args.snapshot.boundaries.map(
          (item) => `${item.title}: ${item.count} elementi | ${item.note}`,
        ),
      ),
      formatBulletBlock(
        "Azione consigliata",
        [
          "Usa sessioni ed eventi madre per i collegamenti forti badge-targa.",
          "Tratta controlli, segnalazioni e richieste salvati nel clone come solo locali finche non esiste sincronizzazione reale.",
        ],
      ),
    ].join("\n\n");
  }

  if (asksAssociation && args.spec.normalizedTarga) {
    const matches = findNextAutistiAssignmentsByTarga(
      args.snapshot,
      args.spec.normalizedTarga,
    );
    if (matches.length === 0) {
      return [
        `Collegamento autista per ${args.spec.normalizedTarga}`,
        "Sintesi breve: non ho trovato un aggancio forte autista-targa nelle fonti D03 lette oggi.",
        formatBulletBlock(
          "Limiti",
          dedupeStrings([
            ...args.snapshot.limitations,
            "Controlla se il mezzo e presente solo nel flusso locale clone o se la sessione madre non e ancora aggiornata.",
          ]).slice(0, 5),
        ),
      ].join("\n\n");
    }

    const best = matches[0];
    const relatedSignals = attentionItems
      .filter(
        (item) =>
          item.mezzoTarga === args.spec.normalizedTarga ||
          item.targaMotrice === args.spec.normalizedTarga ||
          item.targaRimorchio === args.spec.normalizedTarga,
      )
      .slice(0, 4);

    return [
      `Collegamento autista ${args.spec.normalizedTarga}`,
      `Sintesi breve: la targa ${args.spec.normalizedTarga} risulta collegata a ${best.autistaNome ?? "autista non nominato"}${best.badgeAutista ? ` (badge ${best.badgeAutista})` : ""}.`,
      formatBulletBlock("Dati principali", [
        `Mezzo principale: ${best.mezzoTarga ?? "-"}`,
        `Origine: ${formatAutistiOriginLabel(best.sourceOrigin)}`,
        `Affidabilita collegamento: ${formatAutistiLinkReliabilityLabel(best.linkReliability)}`,
      ]),
      formatBulletBlock(
        "Segnali collegati",
        relatedSignals.map(
          (item) =>
            `${item.titolo}: ${item.descrizione}${item.timestamp ? ` | ${formatDateLabel(item.timestamp)}` : ""}`,
        ),
      ),
      formatBulletBlock(
        "Azione consigliata",
        relatedSignals.length > 0
          ? ["Verifica prima i segnali aperti collegati a questa targa e poi conferma se l'aggancio autista e ancora attivo."]
          : ["Usa questo collegamento come base read-only e conferma sul Centro di Controllo se la sessione e ancora aperta."],
      ),
    ].join("\n\n");
  }

  return [
    "Autisti con segnali da attenzionare",
    `Sintesi breve: risultano ${attentionItems.length} segnali aperti o prudenziali nel periodo ${args.periodContext.label}.`,
    formatBulletBlock(
      "Autisti da guardare",
      attentionItems.slice(0, 6).map((item) => {
        const who = item.autistaNome ?? item.badgeAutista ?? "Autista non identificato";
        const targaLabel = item.mezzoTarga ?? item.targaMotrice ?? item.targaRimorchio ?? "-";
        return `${who} | targa ${targaLabel} | ${item.titolo}: ${item.descrizione}`;
      }),
    ),
    formatBulletBlock(
      "Azione consigliata",
      [
        "Parti dai segnali madre con targa forte; usa quelli locali clone solo come promemoria non sincronizzato.",
      ],
    ),
  ].join("\n\n");
}

async function runDriversUnifiedQuery(
  spec: UnifiedQuerySpec,
): Promise<InternalAiUnifiedExecutionResult> {
  const plan = buildUnifiedQueryPlan(spec);
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);
  const snapshot = await readNextAutistiReadOnlySnapshot();
  const reliabilityLabel =
    snapshot.counts.assignmentsStrong > 0 || snapshot.counts.attentionSignalsMother > 0
      ? "Parziale"
      : snapshot.counts.attentionSignalsLocal > 0
        ? "Prudente"
        : "Da verificare";

  return {
    intent: "richiesta_generica",
    status:
      snapshot.counts.totalSignals > 0 || snapshot.counts.activeSessions > 0
        ? "completed"
        : "partial",
    assistantText: composeDriversAssistantText({
      spec,
      snapshot,
      periodContext,
    }),
    references: buildUnifiedReferences({
      reliabilityLabel,
      domainLabel: plan.domainLabel,
      outputLabel: plan.outputLabel,
      targa: spec.normalizedTarga,
      extraLabels: [
        `Stato D03: ${snapshot.operationalStatus.label}`,
        "Confine D03: madre in sola lettura + clone locale autisti separato + fallback legacy prudente",
      ],
    }),
    report: null,
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
  const documentiCostiView =
    sections.find((section) => section.businessPayload?.kind === "documenti_costi")
      ?.businessPayload?.periodView ?? null;
  const allSources = mergePreviewSources(sections.flatMap((section) => section.sources));
  const missingData = dedupeStrings(sections.flatMap((section) => section.missingData));
  const evidences = dedupeStrings(sections.flatMap((section) => section.evidences));
  const keyPoints = dedupeStrings(sections.flatMap((section) => section.keyPoints)).slice(0, 8);
  const reliabilityLabel =
    plan.primaryIntent === "vehicle_materials"
      ? keyPoints.length > 0
        ? "Parziale"
        : "Da verificare"
      : fuelAnalytics !== null
      ? fuelAnalytics.reliability.final.label
      : documentiCostiView !== null
        ? formatReliabilityLabel(documentiCostiView.reliability.final)
      : linkedRecords.some((entry) => entry.linkReliability === "alta") && keyPoints.length > 0
        ? "Affidabile"
        : linkedRecords.length > 0
          ? "Parziale"
          : "Da verificare";

  const preview = buildVehiclePreview({
    mezzo,
    periodContext,
    sections: sections.map((entry) => entry.section),
    sources: allSources,
    missingData,
    evidences,
    selectedScopes,
    primaryIntent: plan.primaryIntent,
    operationalSignals,
    technicalSignals,
    prioritySummary,
    fuelAnalytics,
    documentiCostiView,
  });

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
        preview,
      });
      break;
    case "vehicle_materials":
      assistantText = composeVehicleMaterialsAssistantText({
        targa: mezzo.targa,
        periodContext,
        section:
          preview.sections.find((section) => section.id === "decision-materials") ??
          sections.find((section) => section.section.id === "materiali-inventario")?.section ??
          null,
        missingData,
      });
      break;
    case "costs_documents":
      if (documentiCostiView) {
        assistantText = composeCostsDocumentsAssistantText({
          targa: mezzo.targa,
          periodView: documentiCostiView,
        });
      }
      break;
    default:
      break;
  }

  const references = buildUnifiedReferences({
    reliabilityLabel,
    domainLabel: plan.domainLabel,
    outputLabel: plan.outputLabel,
    targa: mezzo.targa,
    extraLabels:
      plan.primaryIntent === "vehicle_materials"
        ? [
            "Stato area D05: Solo lettura",
            "D05 distingue collegamenti mezzo forti, prudenziali e segnali globali di magazzino.",
          ]
        : fuelAnalytics !== null
        ? [
            `Fiducia sorgente: ${fuelAnalytics.reliability.source.label}`,
            `Fiducia filtro: ${fuelAnalytics.reliability.filter.label}`,
            `Fiducia calcolo: ${fuelAnalytics.reliability.calculation.label}`,
          ]
        : undefined,
  });

  if (spec.outputPreference === "thread") {
    return { intent: "mezzo_dossier", status: keyPoints.length > 0 ? "completed" : "partial", assistantText, references, report: null };
  }

  return {
    intent: "report_targa",
    status: "completed",
    assistantText:
      plan.primaryIntent === "vehicle_overview"
        ? `${preview.title} pronto.\n\nContenuto allineato su sintesi iniziale, cosa fare ora, scadenze, backlog, segnali operativi${preview.sections.some((section) => section.id === "decision-fuel") ? ", consumi" : ""}${preview.sections.some((section) => section.id === "decision-costs") ? " e costi/documenti" : ""}.`
        : `Ho preparato ${preview.title.toLowerCase()} nel perimetro NEXT read-only.\n\nSezioni incluse: ${preview.sections.length}. Dati mancanti dichiarati: ${preview.missingData.length}.`,
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
  const relevantRows =
    plan.primaryIntent === "fleet_deadlines"
      ? rows.filter((row) => row.overdueRevisions > 0 || row.upcomingRevisions > 0)
      : (() => {
          const attentionRows = rows.filter((row) => row.priorityLabel !== "bassa");
          return attentionRows.length > 0 ? attentionRows : rows;
        })();
  const engineSummary = buildFleetPriorityEngineSummary(relevantRows);
  const limitations = dedupeStrings([
    ...centro.limitations.slice(0, 2),
    ...lavori.limitations.slice(0, 2),
    ...operativita.limitations.slice(0, 2),
  ]);
  const references = buildUnifiedReferences({
    reliabilityLabel: engineSummary.reliabilityLabel,
    domainLabel: plan.domainLabel,
    outputLabel: plan.outputLabel,
    extraLabels: [
      "Criterio priorita: scaduti > entro 7 giorni > alert critici/KO e lavori urgenti > segnalazioni e pre-collaudi > backlog tecnico",
    ],
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
      rankingLimit: spec.rankingLimit,
      asksActionAdvice: spec.asksActionAdvice,
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
      rankingLimit: spec.rankingLimit,
      asksActionAdvice: spec.asksActionAdvice,
    });
  }

  return {
    intent: "richiesta_generica",
    status: relevantRows.length > 0 ? "completed" : "partial",
    assistantText,
    references,
    report: null,
  };
}

async function runWarehouseUnifiedQuery(
  spec: UnifiedQuerySpec,
): Promise<InternalAiUnifiedExecutionResult> {
  const plan = buildUnifiedQueryPlan(spec);
  const periodContext = resolveInternalAiReportPeriodContext(spec.periodInput);

  if (spec.periodExplicitRequested && (!spec.periodResolved || !periodContext.isValid)) {
    return {
      intent: "richiesta_generica",
      status: "partial",
      assistantText:
        "Ho rilevato una richiesta D05 con periodo esplicito, ma il periodo non e stato interpretato in modo affidabile.\n\n" +
        "Per evitare un riepilogo magazzino sul perimetro sbagliato, fermo qui l'analisi e ti chiedo di riformulare il periodo.",
      references: buildUnifiedReferences({
        reliabilityLabel: "Parziale",
        domainLabel: plan.domainLabel,
        outputLabel: plan.outputLabel,
      }),
      report: null,
    };
  }

  const magazzino = await readNextMagazzinoRealeSnapshot();
  const reliabilityLabel =
    magazzino.attentionSignals.length > 0 ||
    magazzino.counts.vehicleLinksStrong > 0 ||
    magazzino.counts.inventoryCritical > 0
      ? "Parziale"
      : "Da verificare";

  return {
    intent: "richiesta_generica",
    status:
      magazzino.attentionSignals.length > 0 || magazzino.vehicleLinks.length > 0
        ? "completed"
        : "partial",
    assistantText: composeWarehouseAssistantText({
      prompt: spec.visiblePrompt,
      snapshot: magazzino,
      periodContext,
    }),
    references: buildUnifiedReferences({
      reliabilityLabel,
      domainLabel: plan.domainLabel,
      outputLabel: plan.outputLabel,
      extraLabels: [
        `Stato area D05: ${magazzino.operationalStatus.label}`,
        spec.periodExplicitRequested
          ? `Periodo richiesto: ${periodContext.label}. Su D05 globale l'inventario resta fotografia attuale e i movimenti usano il filtro solo quando la data e leggibile.`
          : "D05 globale usa inventario corrente e movimenti/attrezzature read-only con limiti dichiarati.",
      ],
    }),
    report: null,
  };
}

async function runProcurementUnifiedQuery(
  spec: UnifiedQuerySpec,
): Promise<InternalAiUnifiedExecutionResult> {
  const plan = buildUnifiedQueryPlan(spec);
  const snapshot = await readNextProcurementReadOnlySnapshot();
  const hasStrongReadModel = snapshot.counts.ordiniTotali > 0 || snapshot.counts.righeOrdineTotali > 0;
  const hasPreviewSupport =
    snapshot.counts.preventiviTotali > 0 ||
    snapshot.counts.approvazioniTotali > 0 ||
    snapshot.counts.listinoVoci > 0;
  const reliabilityLabel = hasStrongReadModel
    ? hasPreviewSupport
      ? "Parziale"
      : "Affidabile"
    : hasPreviewSupport
      ? "Da verificare"
      : "Parziale";

  return {
    intent: "richiesta_generica",
    status: hasStrongReadModel || hasPreviewSupport ? "completed" : "partial",
    assistantText: composeProcurementAssistantText({
      prompt: spec.visiblePrompt,
      snapshot,
    }),
    references: buildUnifiedReferences({
      reliabilityLabel,
      domainLabel: plan.domainLabel,
      outputLabel: plan.outputLabel,
      extraLabels: [
        `Ordini/arrivi: ${formatProcurementSurfaceStateLabel(snapshot.surfaces.ordini.state)}`,
        `Preventivi: ${formatProcurementSurfaceStateLabel(snapshot.surfaces.preventivi.state)}`,
        `Capo Costi: ${formatProcurementSurfaceStateLabel(snapshot.surfaces.approvazioniCapoCosti.state)}`,
      ],
    }),
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
  if (spec.primaryIntent === "drivers_readonly") {
    return runDriversUnifiedQuery(spec);
  }
  if (spec.primaryIntent === "warehouse_attention") {
    return runWarehouseUnifiedQuery(spec);
  }
  if (spec.primaryIntent === "procurement_readonly") {
    return runProcurementUnifiedQuery(spec);
  }
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
