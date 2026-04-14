import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { uploadBytes } from "../utils/storageWriteOps";
import {
  buildNextDossierPath,
  buildNextMagazzinoPath,
  buildNextAnalisiEconomicaPath,
  buildNextDettaglioOrdinePath,
  NEXT_INTERNAL_AI_PATH,
  type NextMagazzinoTab,
} from "./nextStructuralPaths";
import {
  readNextDocumentiCostiFleetSnapshot,
  readNextIADocumentiArchiveSnapshot,
  type NextDocumentiCostiFleetSnapshot,
  type NextDocumentiCostiReadOnlyItem,
  type NextDocumentiMagazzinoSupportDocument,
  type NextIADocumentiArchiveItem,
  type NextIADocumentiArchiveSnapshot,
} from "./domain/nextDocumentiCostiDomain";
import {
  readNextMagazzinoRealeSnapshot,
  type NextMagazzinoRealeSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import {
  readNextProcurementSnapshot,
  type NextProcurementPreventivoItem,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import {
  NEXT_MAGAZZINO_STOCK_ALLOWED_UNITS,
  areNextMagazzinoUnitsCompatible,
  buildNextMagazzinoStockKey,
  buildNextMagazzinoStockLoadKey,
  hasNextMagazzinoStockLoadKey,
  isNextMagazzinoStockUnitSupported,
  looksLikeNextMagazzinoAdBlueMaterial,
  mergeNextMagazzinoStockLoadKeys,
  normalizeNextMagazzinoMaterialIdentity,
  normalizeNextMagazzinoStockRefId,
  normalizeNextMagazzinoStockUnit,
  normalizeNextMagazzinoStockUnitLoose,
  type NextMagazzinoStockUnit,
} from "./domain/nextMagazzinoStockContract";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import "./internal-ai/internal-ai.css";
import "./next-magazzino.css";

type ModuloAttivo = "inv" | "mc" | "adblue" | "docs";
type InventarioTab = "magazzino" | "aggiungi";
type MaterialiTab = "storico" | "nuova";
type AdBlueTab = "stato" | "storico" | "registra";
type UnitaMagazzino = string;
type StockStatus = "ok" | "basso" | "esaurito";
type DestinatarioType = "MEZZO" | "COLLEGA" | "MAGAZZINO";
type MovimentoDirection = "IN" | "OUT";
type StoredArrayShape = "array" | "items" | "value" | "value.items";
type RawDatasetRecord = Record<string, unknown>;
type MagazzinoDocumentiFilter =
  | "tutti"
  | "fatture"
  | "ddt"
  | "preventivi"
  | "da_verificare";

type MagazzinoDocumentModalRow = {
  id: string;
  descrizione: string;
  quantita: number | null;
  prezzoUnitario: number | null;
  totale: number | null;
  unita: string | null;
  note: string | null;
};

type MagazzinoDocumentUiItem = {
  id: string;
  sourceKey: string;
  sourceDocId: string | null;
  tipoDocumento: string;
  categoria: "fattura" | "preventivo" | "ddt";
  fornitore: string;
  dataDocumento: string | null;
  sortTimestamp: number | null;
  totaleDocumento: string | number | null;
  currency: string | null;
  fileUrl: string | null;
  targa: string | null;
  numeroDocumento: string | null;
  descrizione: string;
  daVerificare: boolean;
  righe: MagazzinoDocumentModalRow[];
};

type MagazzinoDocumentSupplierGroup = {
  supplier: string;
  items: MagazzinoDocumentUiItem[];
  total: number;
};

const MAGAZZINO_DOC_FILTERS: Array<{
  id: MagazzinoDocumentiFilter;
  label: string;
}> = [
  { id: "tutti", label: "Tutti" },
  { id: "fatture", label: "Fatture" },
  { id: "ddt", label: "DDT" },
  { id: "preventivi", label: "Preventivi" },
  { id: "da_verificare", label: "Da verificare" },
];

type InventarioItem = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: UnitaMagazzino;
  stockKey: string | null;
  stockLoadKeys: string[];
  fornitore: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sogliaMinima?: number;
};

type DestinatarioRef = {
  type: DestinatarioType;
  refId: string;
  label: string;
};

type MaterialeConsegnato = {
  id: string;
  descrizione: string;
  materialeLabel: string | null;
  quantita: number;
  unita: UnitaMagazzino;
  destinatario: DestinatarioRef;
  motivo?: string;
  data: string;
  fornitore: string | null;
  inventarioRefId: string | null;
  stockKey: string | null;
  direzione: MovimentoDirection | null;
  tipo: string | null;
  origine: string | null;
  mezzoTarga: string | null;
  targa: string | null;
};

type MezzoBasic = {
  id: string;
  targa?: string;
  nome?: string;
  descrizione?: string;
};

type CollegaBasic = {
  id: string;
  nome?: string;
  cognome?: string;
};

type CambioAdBlue = {
  id: string;
  data: string;
  quantitaLitri: number | null;
  inventarioRefId: string | null;
  stockKey: string | null;
  numeroCisterna?: string;
  note?: string;
};

type DocumentoStockDecision =
  | "riconcilia_senza_carico"
  | "carica_stock_adblue"
  | "da_verificare"
  | "fuori_perimetro";

type DocumentoStockRowCandidate = {
  id: string;
  sourceDocId: string;
  rowIndex: number;
  documentLabel: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nomeFile: string | null;
  fileUrl: string | null;
  daVerificareDocumento: boolean;
  descrizione: string;
  fornitore: string | null;
  quantita: number | null;
  data: string | null;
  unita: string | null;
  unitaSource: "inventario" | "procurement" | "manuale" | "missing";
  stockKey: string | null;
  inventoryMatchId: string | null;
  procurementCoverageOrderId: string | null;
  procurementCoverageReason: string | null;
  procurementCoverageAlreadyLoaded: boolean;
  sourceLoadKey: string;
  duplicateBySource: boolean;
  isInvoiceDocument: boolean;
  isAdBlueCandidate: boolean;
  hasUnitConflict: boolean;
  canReconcileWithoutLoad: boolean;
  decision: DocumentoStockDecision;
  decisionReason: string | null;
  blockedReason: string | null;
  canLoad: boolean;
};

type ProcurementStockRow = {
  id: string;
  orderId: string;
  orderReference: string;
  materialId: string;
  descrizione: string;
  supplierName: string | null;
  quantita: number | null;
  unita: string | null;
  arrivalDateLabel: string | null;
};

type ProcurementStockRowCandidate = {
  id: string;
  orderId: string;
  orderReference: string;
  materialId: string;
  descrizione: string;
  fornitore: string | null;
  quantita: number | null;
  data: string | null;
  unita: string | null;
  unitaSource: "procurement" | "inventario" | "missing";
  stockKey: string | null;
  inventoryMatchId: string | null;
  sourceLoadKey: string;
  duplicateBySource: boolean;
  documentCoverageDocId: string | null;
  documentCoverageReason: string | null;
  blockedReason: string | null;
  canLoad: boolean;
};

type WarningDeleteState = {
  consegna: MaterialeConsegnato;
  messaggio: string;
};

type SuggestionDest = {
  type: DestinatarioType;
  refId: string;
  label: string;
  extra?: string;
};

type SuggestionMat = {
  id: string;
  label: string;
  quantita: number;
  unita: UnitaMagazzino;
  fornitore?: string | null;
};

type NormalizedDatasetBundle<T extends { id: string }> = {
  items: T[];
  rawMap: Record<string, RawDatasetRecord>;
  shape: StoredArrayShape;
};

const INVENTARIO_KEY = "@inventario";
const MATERIALI_KEY = "@materialiconsegnati";
const MEZZI_KEY = "@mezzi_aziendali";
const COLLEGHI_KEY = "@colleghi";
const FORNITORI_KEY = "@fornitori";
const CISTERNE_ADBLUE_KEY = "@cisterne_adblue";
const UNITA_OPTIONS = [...NEXT_MAGAZZINO_STOCK_ALLOWED_UNITS] as const;
const LITRI_PER_CISTERNA = 1000;
const N_CAMBI_MEDIA = 6;
const PROCUREMENT_DEDUP_WINDOW_DAYS = 14;

function mapTabToModulo(tab: string | null): ModuloAttivo {
  switch (tab) {
    case "materiali-consegnati":
      return "mc";
    case "cisterne-adblue":
      return "adblue";
    case "documenti-costi":
      return "docs";
    case "inventario":
    default:
      return "inv";
  }
}

function mapModuloToTab(modulo: ModuloAttivo): NextMagazzinoTab {
  switch (modulo) {
    case "mc":
      return "materiali-consegnati";
    case "adblue":
      return "cisterne-adblue";
    case "docs":
      return "documenti-costi";
    case "inv":
    default:
      return "inventario";
  }
}

function mapHandoffViewToTab(view: string | null): NextMagazzinoTab | null {
  switch ((view ?? "").trim().toLowerCase()) {
    case "materiali":
    case "materiali-consegnati":
      return "materiali-consegnati";
    case "adblue":
    case "cisterne-adblue":
      return "cisterne-adblue";
    case "documenti":
    case "documenti-costi":
      return "documenti-costi";
    case "inventario":
      return "inventario";
    default:
      return null;
  }
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeDirection(value: unknown): MovimentoDirection | null {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "IN" || normalized === "OUT") return normalized;
  return null;
}

function getObjectRecord(value: unknown): RawDatasetRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as RawDatasetRecord;
}

function detectStoredArrayShape(raw: unknown): StoredArrayShape {
  if (Array.isArray(raw)) return "array";
  if (typeof raw === "object" && raw !== null) {
    const record = raw as { items?: unknown; value?: unknown };
    if (Array.isArray(record.items)) return "items";
    if (Array.isArray(record.value)) return "value";
    if (
      typeof record.value === "object" &&
      record.value !== null &&
      Array.isArray((record.value as { items?: unknown[] }).items)
    ) {
      return "value.items";
    }
  }
  return "array";
}

function unwrapStoredArray(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null) {
    const record = raw as { items?: unknown; value?: unknown };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.value)) return record.value;
    if (
      typeof record.value === "object" &&
      record.value !== null &&
      Array.isArray((record.value as { items?: unknown[] }).items)
    ) {
      return (record.value as { items: unknown[] }).items;
    }
  }
  return [];
}

function wrapStoredArray(shape: StoredArrayShape, items: unknown[]): unknown {
  switch (shape) {
    case "items":
      return { items };
    case "value":
      return { value: items };
    case "value.items":
      return { value: { items } };
    case "array":
    default:
      return items;
  }
}

function normalizeDatasetBundle<T extends { id: string }>(
  raw: unknown,
  normalizer: (entry: unknown, index: number) => T | null,
): NormalizedDatasetBundle<T> {
  const rawItems = unwrapStoredArray(raw);
  const items: T[] = [];
  const rawMap: Record<string, RawDatasetRecord> = {};

  rawItems.forEach((entry, index) => {
    const normalized = normalizer(entry, index);
    if (!normalized) return;
    items.push(normalized);
    const record = getObjectRecord(entry);
    if (record) {
      rawMap[normalized.id] = { ...record };
    }
  });

  return {
    items,
    rawMap,
    shape: detectStoredArrayShape(raw),
  };
}

function buildRawMapById<T extends { id: string }>(
  items: T[],
  records: RawDatasetRecord[],
): Record<string, RawDatasetRecord> {
  return items.reduce<Record<string, RawDatasetRecord>>((acc, item, index) => {
    const record = records[index];
    if (record) {
      acc[item.id] = record;
    }
    return acc;
  }, {});
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function storedToday(): string {
  return inputDateToStored(todayInput());
}

function inputDateToStored(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return storedToday();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [yyyy, mm, dd] = normalized.split("-");
    return `${dd} ${mm} ${yyyy}`;
  }
  if (/^\d{2}[/ ]\d{2}[/ ]\d{4}$/.test(normalized)) {
    return normalized.replace(/\//g, " ");
  }
  return normalized;
}

function parseStoredDate(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parts = normalized.replace(/\//g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatStoredDateForUi(value: string | null | undefined): string {
  const parsed = parseStoredDate(value);
  if (!parsed) return normalizeText(value) || "-";
  return parsed.toLocaleDateString("it-IT");
}

function dateDiffDays(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  return ms >= 0 ? Math.round(ms / 86400000) : null;
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits,
  }).format(value);
}

function formatCurrencyAmount(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${formatNumber(value)} ${normalizeText(currency) || "EUR"}`;
}

function formatDocumentAmount(
  value: string | number | null | undefined,
  currency: string | null | undefined,
): string {
  const parsed = normalizeNumber(value);
  if (parsed !== null) {
    return formatCurrencyAmount(parsed, currency);
  }
  return normalizeText(value) || "-";
}

function absDateDiffDays(
  left: string | null | undefined,
  right: string | null | undefined,
): number | null {
  const leftDate = parseStoredDate(left);
  const rightDate = parseStoredDate(right);
  if (!leftDate || !rightDate) return null;
  return Math.abs(
    Math.round((leftDate.getTime() - rightDate.getTime()) / 86400000),
  );
}

function buildConsegnaStockKey(item: {
  descrizione: string;
  fornitore: string | null;
  unita: string;
  stockKey?: string | null;
}): string | null {
  return buildNextMagazzinoStockKey({
    stockKey: item.stockKey,
    descrizione: item.descrizione,
    fornitore: item.fornitore,
    unita: item.unita,
  });
}

function hasSupportedUnit(value: unknown): value is NextMagazzinoStockUnit {
  return isNextMagazzinoStockUnitSupported(value);
}

function ensureSupportedUnit(value: unknown): NextMagazzinoStockUnit | null {
  return normalizeNextMagazzinoStockUnit(value);
}

function getStockStatus(item: InventarioItem): StockStatus {
  if (item.quantita <= 0) return "esaurito";
  if (
    typeof item.sogliaMinima === "number" &&
    Number.isFinite(item.sogliaMinima) &&
    item.quantita <= item.sogliaMinima
  ) {
    return "basso";
  }
  return "ok";
}

function normalizeVehicleKey(value: unknown): string | null {
  const normalized = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized || null;
}

function looksLikeVehicleTarga(value: string | null): boolean {
  return Boolean(value && /^[A-Z0-9]{5,10}$/.test(value) && /\d/.test(value));
}

function inferDestinatarioType(args: {
  explicitType: DestinatarioType | null;
  label: string | null;
  refId: string | null;
  explicitTarga: string | null;
}): DestinatarioType {
  if (args.explicitType) return args.explicitType;

  const label = normalizeText(args.label).toUpperCase();
  const refId = normalizeText(args.refId).toUpperCase();
  if (label === "MAGAZZINO" || refId === "MAGAZZINO") {
    return "MAGAZZINO";
  }

  if (
    args.explicitTarga ||
    looksLikeVehicleTarga(normalizeVehicleKey(args.label)) ||
    looksLikeVehicleTarga(normalizeVehicleKey(args.refId))
  ) {
    return "MEZZO";
  }

  return "COLLEGA";
}

function normalizeInventarioItem(raw: unknown, index: number): InventarioItem | null {
  const record = getObjectRecord(raw);
  if (!record) return null;
  const descrizione =
    normalizeOptionalText(record.descrizione) ??
    normalizeOptionalText(record.label) ??
    normalizeOptionalText(record.nome);
  const quantita =
    normalizeNumber(record.quantitaTotale) ?? normalizeNumber(record.quantita);
  if (!descrizione || quantita === null) return null;

  const fornitore =
    normalizeOptionalText(record.fornitore) ??
    normalizeOptionalText(record.fornitoreLabel) ??
    normalizeOptionalText(record.nomeFornitore);
  const unita = normalizeNextMagazzinoStockUnitLoose(record.unita) || "pz";
  const sogliaMinima = normalizeNumber(record.sogliaMinima);

  return {
    id: normalizeOptionalText(record.id) ?? `inventario_${index}`,
    descrizione,
    quantita,
    unita,
    stockKey:
      buildNextMagazzinoStockKey({
        stockKey: record.stockKey,
        descrizione,
        fornitore,
        unita,
      }) ?? null,
    stockLoadKeys: mergeNextMagazzinoStockLoadKeys(
      record.stockLoadKeys ?? record.stockSourceKeys,
      null,
    ),
    fornitore,
    fotoUrl: normalizeOptionalText(record.fotoUrl),
    fotoStoragePath: normalizeOptionalText(record.fotoStoragePath),
    sogliaMinima: sogliaMinima ?? undefined,
  };
}

function normalizeConsegnaItem(raw: unknown, index: number): MaterialeConsegnato | null {
  const record = getObjectRecord(raw);
  if (!record) return null;
  const descrizione =
    normalizeOptionalText(record.descrizione) ??
    normalizeOptionalText(record.materialeLabel) ??
    normalizeOptionalText(record.materiale) ??
    normalizeOptionalText(record.label);
  const quantita = normalizeNumber(record.quantita);
  if (!descrizione || quantita === null) return null;

  const explicitTarga =
    normalizeVehicleKey(record.mezzoTarga) ?? normalizeVehicleKey(record.targa);
  const destRecord = getObjectRecord(record.destinatario);
  const typeValue = normalizeText(destRecord?.type).toUpperCase();
  const explicitType =
    typeValue === "MEZZO" || typeValue === "COLLEGA" || typeValue === "MAGAZZINO"
      ? (typeValue as DestinatarioType)
      : null;
  const label =
    normalizeOptionalText(destRecord?.label) ??
    normalizeOptionalText(record.target) ??
    (explicitTarga ? explicitTarga : null) ??
    (typeof record.destinatario === "string" ? normalizeOptionalText(record.destinatario) : null) ??
    "Destinatario";
  const refId =
    normalizeOptionalText(destRecord?.refId) ??
    explicitTarga ??
    (label === "MAGAZZINO" ? "MAGAZZINO" : label) ??
    `dest_${index}`;
  const type = inferDestinatarioType({
    explicitType,
    label,
    refId,
    explicitTarga,
  });

  return {
    id: normalizeOptionalText(record.id) ?? `consegna_${index}`,
    descrizione,
    materialeLabel:
      normalizeOptionalText(record.materialeLabel) ??
      normalizeOptionalText(record.materiale) ??
      descrizione,
    quantita,
    unita: normalizeNextMagazzinoStockUnitLoose(record.unita) || "pz",
    destinatario: {
      type,
      refId: type === "MAGAZZINO" ? "MAGAZZINO" : refId,
      label: type === "MAGAZZINO" ? "MAGAZZINO" : label,
    },
    motivo: normalizeOptionalText(record.motivo) ?? undefined,
    data: normalizeOptionalText(record.data) ?? storedToday(),
    fornitore:
      normalizeOptionalText(record.fornitore) ??
      normalizeOptionalText(record.fornitoreLabel),
    inventarioRefId:
      normalizeNextMagazzinoStockRefId(record.inventarioRefId) ??
      normalizeNextMagazzinoStockRefId(record.materialeId),
    stockKey:
      buildNextMagazzinoStockKey({
        stockKey: record.stockKey,
        descrizione,
        fornitore:
          normalizeOptionalText(record.fornitore) ??
          normalizeOptionalText(record.fornitoreLabel),
        unita: normalizeNextMagazzinoStockUnitLoose(record.unita) || "pz",
      }) ?? null,
    direzione: normalizeDirection(record.direzione),
    tipo: normalizeOptionalText(record.tipo),
    origine: normalizeOptionalText(record.origine),
    mezzoTarga: explicitTarga,
    targa: explicitTarga,
  };
}

function normalizeMezzoItem(raw: unknown, index: number): MezzoBasic | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = normalizeOptionalText(record.id) ?? `mezzo_${index}`;
  const targa = normalizeOptionalText(record.targa);
  const nome =
    normalizeOptionalText(record.nome) ??
    normalizeOptionalText(record.marcaModello) ??
    normalizeOptionalText(record.modello);
  const descrizione =
    normalizeOptionalText(record.descrizione) ?? normalizeOptionalText(record.categoria);
  if (!targa && !nome && !descrizione) return null;
  return { id, targa: targa ?? undefined, nome: nome ?? undefined, descrizione: descrizione ?? undefined };
}

function normalizeCollegaItem(raw: unknown, index: number): CollegaBasic | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = normalizeOptionalText(record.id) ?? `collega_${index}`;
  const nome = normalizeOptionalText(record.nome);
  const cognome = normalizeOptionalText(record.cognome);
  if (!nome && !cognome) return null;
  return { id, nome: nome ?? undefined, cognome: cognome ?? undefined };
}

function normalizeCambioAdBlue(raw: unknown, index: number): CambioAdBlue | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const data = normalizeOptionalText(record.data);
  const quantitaLitri =
    normalizeNumber(record.quantitaLitri) ??
    normalizeNumber(record.quantita) ??
    normalizeNumber(record.litri);
  if (!data) return null;
  return {
    id: normalizeOptionalText(record.id) ?? `adblue_${index}`,
    data,
    quantitaLitri,
    inventarioRefId:
      normalizeNextMagazzinoStockRefId(record.inventarioRefId) ??
      normalizeNextMagazzinoStockRefId(record.materialeId),
    stockKey:
      buildNextMagazzinoStockKey({
        stockKey: record.stockKey,
        descrizione: record.materialeLabel ?? record.descrizione ?? "AdBlue",
        fornitore: record.fornitore,
        unita: "lt",
      }) ?? null,
    numeroCisterna: normalizeOptionalText(record.numeroCisterna) ?? undefined,
    note: normalizeOptionalText(record.note) ?? undefined,
  };
}

function normalizeFornitoriList(raw: unknown): string[] {
  return unwrapStoredArray(raw)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      return (
        normalizeOptionalText(record.nome) ??
        normalizeOptionalText(record.ragioneSociale) ??
        normalizeOptionalText(record.label) ??
        normalizeOptionalText(record.fornitore)
      );
    })
    .filter((entry): entry is string => Boolean(entry))
    .sort((left, right) => left.localeCompare(right, "it", { sensitivity: "base" }));
}

async function persistArrayDataset(
  key: string,
  nextValue: RawDatasetRecord[],
  shape: StoredArrayShape,
): Promise<void> {
  await setItemSync(key, wrapStoredArray(shape, nextValue));
  const savedValue = unwrapStoredArray(await getItemSync(key));
  if (JSON.stringify(savedValue) !== JSON.stringify(nextValue)) {
    throw new Error(`Persistenza non confermata per ${key}`);
  }
}

async function uploadInventarioPhoto(file: File, itemId: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `inventario/${itemId}/foto.${extension}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const photoUrl = await getDownloadURL(storageRef);
  return {
    fotoUrl: photoUrl,
    fotoStoragePath: storagePath,
  };
}

function buildDestinatarioLabel(type: DestinatarioType): string {
  if (type === "MEZZO") return "Mezzo";
  if (type === "MAGAZZINO") return "Magazzino";
  return "Collega";
}

function buildDestBadgeClass(type: DestinatarioType): string {
  if (type === "MEZZO") return "mag-badge mag-badge--mezzo";
  if (type === "MAGAZZINO") return "mag-badge mag-badge--magazzino";
  return "mag-badge mag-badge--collega";
}

function formatQuantita(value: number, unita: string): string {
  return `${formatNumber(value)} ${unita}`;
}

function buildGroupedTotalLabel(items: MaterialeConsegnato[]): string {
  const byUnit = new Map<string, number>();
  items.forEach((item) => {
    byUnit.set(item.unita, (byUnit.get(item.unita) ?? 0) + item.quantita);
  });
  const parts = Array.from(byUnit.entries()).map(
    ([unit, total]) => `${formatNumber(total)} ${unit}`,
  );
  return parts.join(" · ");
}

function sameMaterialIdentity(
  left: {
    descrizione?: string | null | undefined;
    fornitore?: string | null | undefined;
    supplierName?: string | null | undefined;
  },
  right: {
    descrizione?: string | null | undefined;
    fornitore?: string | null | undefined;
    supplierName?: string | null | undefined;
  },
) {
  return (
    normalizeNextMagazzinoMaterialIdentity(left.descrizione) ===
      normalizeNextMagazzinoMaterialIdentity(right.descrizione) &&
    (normalizeNextMagazzinoMaterialIdentity(left.fornitore ?? left.supplierName) ||
      "NOFORNITORE") ===
      (normalizeNextMagazzinoMaterialIdentity(right.fornitore ?? right.supplierName) ||
        "NOFORNITORE")
  );
}

function looksLikeDocumentoMagazzinoFattura(value: unknown): boolean {
  return normalizeNextMagazzinoMaterialIdentity(value).includes("FATTURA");
}

function buildDocumentoStockLabel(args: {
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nomeFile: string | null;
  sourceDocId: string;
}): string {
  return (
    [args.tipoDocumento, args.numeroDocumento, args.nomeFile]
      .map((entry) => normalizeText(entry))
      .filter(Boolean)
      .join(" · ") || args.sourceDocId
  );
}

function matchesDocumentoHint(value: unknown, hint: unknown): boolean {
  const left = normalizeNextMagazzinoMaterialIdentity(value);
  const right = normalizeNextMagazzinoMaterialIdentity(hint);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

function sortInventarioItems(items: InventarioItem[]): InventarioItem[] {
  return [...items].sort((left, right) =>
    left.descrizione.localeCompare(right.descrizione, "it", {
      sensitivity: "base",
    }),
  );
}

function resolveUniqueSupportedUnit(
  values: Array<string | null | undefined>,
): NextMagazzinoStockUnit | null {
  const unique = Array.from(
    new Set(
      values
        .map((value) => normalizeNextMagazzinoStockUnit(value))
        .filter((value): value is NextMagazzinoStockUnit => Boolean(value)),
    ),
  );
  return unique.length === 1 ? unique[0] : null;
}

function resolveConsegnaVehicleTarga(
  consegna: MaterialeConsegnato,
  mezzi: MezzoBasic[],
): string | null {
  const explicit =
    normalizeVehicleKey(consegna.mezzoTarga) ?? normalizeVehicleKey(consegna.targa);
  if (looksLikeVehicleTarga(explicit)) {
    return explicit;
  }

  const labelKey = normalizeVehicleKey(consegna.destinatario.label);
  if (looksLikeVehicleTarga(labelKey)) {
    return labelKey;
  }

  const refKey = normalizeVehicleKey(consegna.destinatario.refId);
  if (looksLikeVehicleTarga(refKey)) {
    return refKey;
  }

  const mezzo = mezzi.find((item) => item.id === consegna.destinatario.refId);
  const mezzoTarga = normalizeVehicleKey(mezzo?.targa);
  return looksLikeVehicleTarga(mezzoTarga) ? mezzoTarga : null;
}

function resolveConsegnaInventarioIndex(
  inventario: InventarioItem[],
  consegna: MaterialeConsegnato,
): number {
  if (consegna.inventarioRefId) {
    const byId = inventario.findIndex((item) => item.id === consegna.inventarioRefId);
    if (byId >= 0) {
      return byId;
    }
  }

  if (consegna.stockKey) {
    const byStockKey = inventario.findIndex((item) => item.stockKey === consegna.stockKey);
    if (byStockKey >= 0) {
      return byStockKey;
    }
  }

  return inventario.findIndex(
    (item) =>
      areNextMagazzinoUnitsCompatible(item.unita, consegna.unita) &&
      sameMaterialIdentity(item, consegna),
  );
}

function buildInventarioRecord(
  baseRecord: RawDatasetRecord | undefined,
  item: InventarioItem,
): RawDatasetRecord {
  const nextRecord: RawDatasetRecord = {
    ...(baseRecord ?? {}),
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita,
    quantitaTotale: item.quantita,
    unita: normalizeNextMagazzinoStockUnit(item.unita) ?? item.unita,
    stockKey: item.stockKey ?? null,
    stockLoadKeys: item.stockLoadKeys,
    fotoUrl: item.fotoUrl ?? null,
    fotoStoragePath: item.fotoStoragePath ?? null,
    fornitore: item.fornitore ?? null,
    fornitoreLabel: item.fornitore ?? null,
    nomeFornitore: item.fornitore ?? null,
  };

  if (typeof item.sogliaMinima === "number" && Number.isFinite(item.sogliaMinima)) {
    nextRecord.sogliaMinima = item.sogliaMinima;
  } else {
    delete nextRecord.sogliaMinima;
  }

  return nextRecord;
}

function buildConsegnaRecord(
  baseRecord: RawDatasetRecord | undefined,
  item: MaterialeConsegnato,
): RawDatasetRecord {
  const nextRecord: RawDatasetRecord = {
    ...(baseRecord ?? {}),
    id: item.id,
    descrizione: item.descrizione,
    materiale: item.materialeLabel ?? item.descrizione,
    materialeLabel: item.materialeLabel ?? item.descrizione,
    quantita: item.quantita,
    unita: normalizeNextMagazzinoStockUnit(item.unita) ?? item.unita,
    destinatario: {
      type: item.destinatario.type,
      refId: item.destinatario.refId,
      label: item.destinatario.label,
    },
    target: item.destinatario.label,
    motivo: item.motivo ?? null,
    data: item.data,
    fornitore: item.fornitore ?? null,
    fornitoreLabel: item.fornitore ?? null,
    inventarioRefId: item.inventarioRefId ?? null,
    stockKey: item.stockKey ?? null,
    direzione: item.direzione ?? "OUT",
    tipo: item.tipo ?? "OUT",
    origine: item.origine ?? "MAGAZZINO_NEXT",
  };

  if (item.mezzoTarga) {
    nextRecord.mezzoTarga = item.mezzoTarga;
    nextRecord.targa = item.mezzoTarga;
  } else {
    delete nextRecord.mezzoTarga;
    delete nextRecord.targa;
  }

  return nextRecord;
}

function buildCambioAdBlueRecord(
  baseRecord: RawDatasetRecord | undefined,
  item: CambioAdBlue,
): RawDatasetRecord {
  return {
    ...(baseRecord ?? {}),
    id: item.id,
    data: item.data,
    quantitaLitri: item.quantitaLitri ?? null,
    quantita: item.quantitaLitri ?? null,
    litri: item.quantitaLitri ?? null,
    inventarioRefId: item.inventarioRefId ?? null,
    stockKey: item.stockKey ?? null,
    materialeLabel: "AdBlue",
    descrizione: "AdBlue",
    unita: "lt",
    numeroCisterna: item.numeroCisterna ?? null,
    note: item.note ?? null,
  };
}

function findInventarioIndexByDescriptor(
  inventario: InventarioItem[],
  descriptor: {
    inventarioRefId?: string | null;
    stockKey?: string | null;
    descrizione?: string | null;
    fornitore?: string | null;
    unita?: string | null;
  },
): number {
  if (descriptor.inventarioRefId) {
    const byId = inventario.findIndex((item) => item.id === descriptor.inventarioRefId);
    if (byId >= 0) return byId;
  }

  if (descriptor.stockKey) {
    const byStockKey = inventario.findIndex((item) => item.stockKey === descriptor.stockKey);
    if (byStockKey >= 0) return byStockKey;
  }

  return inventario.findIndex(
    (item) =>
      Boolean(descriptor.unita) &&
      areNextMagazzinoUnitsCompatible(item.unita, descriptor.unita) &&
      sameMaterialIdentity(item, descriptor),
  );
}

function buildProcurementStateLabel(state: string): string {
  switch (normalizeText(state)) {
    case "arrivato":
      return "Arrivato";
    case "parziale":
      return "Parziale";
    case "in_attesa":
    default:
      return "In attesa";
  }
}

function truncateMagazzinoDocumentText(value: string, maxLength: number): string {
  const normalized = normalizeText(value).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function parseMagazzinoDocumentAmount(value: string | number | null | undefined): number | null {
  return normalizeNumber(value);
}

function formatMagazzinoDocumentCompactAmount(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildMagazzinoDocumentDescription(
  item: NextIADocumentiArchiveItem,
  supportDocument: NextDocumentiMagazzinoSupportDocument | null,
): string {
  const fromRows = supportDocument?.voci
    .map((row) => normalizeText(row.descrizione))
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  if (fromRows) {
    return truncateMagazzinoDocumentText(fromRows, 72);
  }

  const fromCategory = normalizeText(item.categoriaArchivio);
  if (fromCategory) {
    return truncateMagazzinoDocumentText(fromCategory, 72);
  }

  const fromText = normalizeText(item.testo);
  if (fromText) {
    return truncateMagazzinoDocumentText(fromText, 72);
  }

  return "Documento magazzino";
}

function buildMagazzinoPreventivoDescription(item: NextProcurementPreventivoItem): string {
  const preview = item.materialsPreview.join(", ");
  if (preview) {
    return truncateMagazzinoDocumentText(preview, 72);
  }
  return "Preventivo procurement materiali";
}

function sortMagazzinoDocumentItems(items: MagazzinoDocumentUiItem[]): MagazzinoDocumentUiItem[] {
  return [...items].sort((left, right) => {
    const timestampDelta = (right.sortTimestamp ?? -1) - (left.sortTimestamp ?? -1);
    if (timestampDelta !== 0) {
      return timestampDelta;
    }

    const dateDelta = normalizeText(right.dataDocumento).localeCompare(
      normalizeText(left.dataDocumento),
      "it",
      { sensitivity: "base" },
    );
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return normalizeText(left.numeroDocumento).localeCompare(
      normalizeText(right.numeroDocumento),
      "it",
      { sensitivity: "base" },
    );
  });
}

function isMagazzinoPreventivo(item: MagazzinoDocumentUiItem): boolean {
  return item.categoria === "preventivo";
}

function isMagazzinoDdt(item: MagazzinoDocumentUiItem): boolean {
  if (item.categoria === "ddt") {
    return true;
  }

  const tipoDocumento = normalizeText(item.tipoDocumento).toUpperCase();
  const numeroDocumento = normalizeText(item.numeroDocumento).toUpperCase();
  const descrizione = normalizeText(item.descrizione).toUpperCase();

  return (
    tipoDocumento === "DDT" ||
    tipoDocumento.includes("BOLLA") ||
    numeroDocumento.includes("DDT") ||
    descrizione.includes("DDT")
  );
}

function isMagazzinoFattura(item: MagazzinoDocumentUiItem): boolean {
  return item.categoria === "fattura" && !isMagazzinoDdt(item);
}

function getMagazzinoBadgeClass(item: MagazzinoDocumentUiItem): string {
  if (isMagazzinoPreventivo(item)) return "is-preventivo";
  if (isMagazzinoDdt(item)) return "is-ddt";
  return "is-fattura";
}

function getMagazzinoKindLabel(item: MagazzinoDocumentUiItem): string {
  if (isMagazzinoPreventivo(item)) return "PREVENTIVO";
  if (isMagazzinoDdt(item)) return "DDT";
  if (isMagazzinoFattura(item)) return "FATTURA";
  return normalizeText(item.tipoDocumento).toUpperCase() || "DOCUMENTO";
}

function buildMagazzinoAskAiPrompt(item: MagazzinoDocumentUiItem): string {
  const parts = [
    `Fammi un riepilogo del documento ${getMagazzinoKindLabel(item)}`,
    normalizeText(item.dataDocumento)
      ? `del ${normalizeText(item.dataDocumento)}`
      : "con data non disponibile",
    normalizeText(item.fornitore)
      ? `di ${normalizeText(item.fornitore)}`
      : "di fornitore non specificato",
    normalizeText(item.numeroDocumento)
      ? `numero ${normalizeText(item.numeroDocumento)}`
      : "senza numero documento disponibile",
  ];

  if (normalizeText(item.targa)) {
    parts.push(`per il mezzo ${normalizeText(item.targa)}`);
  }

  const parsedAmount = parseMagazzinoDocumentAmount(item.totaleDocumento);
  if (parsedAmount !== null) {
    parts.push(`per un importo di ${formatCurrencyAmount(parsedAmount, item.currency)}`);
  }

  return `${parts.join(" ")}.`;
}

function matchesMagazzinoDocumentSearch(item: MagazzinoDocumentUiItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return (
    normalizeText(item.fornitore).toLowerCase().includes(normalizedQuery) ||
    normalizeText(item.targa).toLowerCase().includes(normalizedQuery) ||
    normalizeText(item.totaleDocumento).toLowerCase().includes(normalizedQuery)
  );
}

function durataGiorni(dataInizio: string, dataFine: string): number {
  const diff = dateDiffDays(parseStoredDate(dataInizio), parseStoredDate(dataFine));
  return diff ?? 0;
}

function mediaDurataGiorni(cambi: CambioAdBlue[]): number {
  if (cambi.length < 2) return 0;
  const sorted = [...cambi].sort(
    (left, right) =>
      (parseStoredDate(left.data)?.getTime() ?? 0) -
      (parseStoredDate(right.data)?.getTime() ?? 0),
  );
  const recent = sorted.slice(-Math.min(sorted.length, N_CAMBI_MEDIA + 1));
  const durations: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    const days = durataGiorni(recent[index - 1].data, recent[index].data);
    if (days > 0) durations.push(days);
  }
  if (!durations.length) return 0;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function litriConsumatiStima(ultimoCambio: CambioAdBlue | null, mediaGiorni: number): number {
  if (!ultimoCambio || mediaGiorni <= 0) return 0;
  const giorniPassati = durataGiorni(ultimoCambio.data, storedToday());
  const capacita = ultimoCambio.quantitaLitri ?? LITRI_PER_CISTERNA;
  const consumoGiornaliero = capacita / mediaGiorni;
  return Math.min(Math.round(consumoGiornaliero * giorniPassati), capacita);
}

function percentualeConsumata(litriConsumati: number, capacita: number): number {
  if (capacita <= 0) return 0;
  return Math.round((litriConsumati / capacita) * 100);
}

function coloreProgress(perc: number): "verde" | "giallo" | "rosso" {
  if (perc < 60) return "verde";
  if (perc < 85) return "giallo";
  return "rosso";
}

function stimaDataFine(ultimoCambio: CambioAdBlue | null, mediaGiorni: number): string {
  const baseDate = parseStoredDate(ultimoCambio?.data);
  if (!baseDate || mediaGiorni <= 0) return "-";
  const target = new Date(baseDate.getTime());
  target.setDate(target.getDate() + mediaGiorni);
  return target.toLocaleDateString("it-IT");
}

export default function NextMagazzinoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const iaHandoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.magazzino",
  });
  const iaHandoffLifecycleRef = useRef<string | null>(null);
  const requestedTab = useMemo(
    () => new URLSearchParams(location.search).get("tab"),
    [location.search],
  );
  const modulo = useMemo(() => mapTabToModulo(requestedTab), [requestedTab]);
  const [inventarioTab, setInventarioTab] = useState<InventarioTab>("magazzino");
  const [materialiTab, setMaterialiTab] = useState<MaterialiTab>("storico");
  const [adBlueTab, setAdBlueTab] = useState<AdBlueTab>("stato");

  const [items, setItems] = useState<InventarioItem[]>([]);
  const [inventarioRawMap, setInventarioRawMap] = useState<Record<string, RawDatasetRecord>>({});
  const [inventarioShape, setInventarioShape] = useState<StoredArrayShape>("array");
  const [fornitori, setFornitori] = useState<string[]>([]);
  const [searchInv, setSearchInv] = useState("");
  const [filterFornitore, setFilterFornitore] = useState("");
  const [filterStock, setFilterStock] = useState<"" | StockStatus>("");
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [newDescrizione, setNewDescrizione] = useState("");
  const [newFornitore, setNewFornitore] = useState("");
  const [newQuantita, setNewQuantita] = useState("");
  const [newUnita, setNewUnita] = useState<UnitaMagazzino>("pz");
  const [newSogliaMinima, setNewSogliaMinima] = useState("");
  const [newFotoFile, setNewFotoFile] = useState<File | null>(null);
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);

  const [consegne, setConsegne] = useState<MaterialeConsegnato[]>([]);
  const [consegneRawMap, setConsegneRawMap] = useState<Record<string, RawDatasetRecord>>({});
  const [consegneShape, setConsegneShape] = useState<StoredArrayShape>("array");
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [colleghi, setColleghi] = useState<CollegaBasic[]>([]);
  const [destinatarioInput, setDestinatarioInput] = useState("");
  const [destinatarioObj, setDestinatarioObj] = useState<DestinatarioRef | null>(null);
  const [materialeInput, setMaterialeInput] = useState("");
  const [materialeSelezionato, setMaterialeSelezionato] = useState<InventarioItem | null>(null);
  const [quantita, setQuantita] = useState("");
  const [motivo, setMotivo] = useState("");
  const [dataConsegna, setDataConsegna] = useState(todayInput());
  const [warningDelete, setWarningDelete] = useState<WarningDeleteState | null>(null);
  const [searchMc, setSearchMc] = useState("");
  const [filterTipo, setFilterTipo] = useState<"" | DestinatarioType>("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const [cambi, setCambi] = useState<CambioAdBlue[]>([]);
  const [cambiRawMap, setCambiRawMap] = useState<Record<string, RawDatasetRecord>>({});
  const [cambiShape, setCambiShape] = useState<StoredArrayShape>("array");
  const [dataCambio, setDataCambio] = useState(todayInput());
  const [quantitaCambioLitri, setQuantitaCambioLitri] = useState("");
  const [adBlueInventarioRefId, setAdBlueInventarioRefId] = useState("");
  const [numeroCisterna, setNumeroCisterna] = useState("");
  const [noteAdblue, setNoteAdblue] = useState("");
  const [documentoManualUnits, setDocumentoManualUnits] = useState<
    Record<string, NextMagazzinoStockUnit | "">
  >({});
  const [documentoImportingId, setDocumentoImportingId] = useState<string | null>(null);
  const [procurementImportingId, setProcurementImportingId] = useState<string | null>(null);

  const [documentiCostiSnapshot, setDocumentiCostiSnapshot] =
    useState<NextDocumentiCostiFleetSnapshot | null>(null);
  const [iaDocumentiSnapshot, setIaDocumentiSnapshot] =
    useState<NextIADocumentiArchiveSnapshot | null>(null);
  const [procurementSnapshot, setProcurementSnapshot] =
    useState<NextProcurementSnapshot | null>(null);
  const [magazzinoRealeSnapshot, setMagazzinoRealeSnapshot] =
    useState<NextMagazzinoRealeSnapshot | null>(null);
  const [docFiltroAttivo, setDocFiltroAttivo] =
    useState<MagazzinoDocumentiFilter>("tutti");
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [docSezioniAperte, setDocSezioniAperte] = useState<Set<string>>(new Set());
  const [docModalItem, setDocModalItem] = useState<MagazzinoDocumentUiItem | null>(null);
  const [docLocalDaVerificareIds, setDocLocalDaVerificareIds] = useState<Set<string>>(new Set());

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPageData() {
    setLoading(true);
    setError(null);
    try {
      const [inventarioRaw, consegneRaw, mezziRaw, colleghiRaw, adblueRaw, fornitoriRaw] =
        await Promise.all([
          getItemSync(INVENTARIO_KEY),
          getItemSync(MATERIALI_KEY),
          getItemSync(MEZZI_KEY),
          getItemSync(COLLEGHI_KEY),
          getItemSync(CISTERNE_ADBLUE_KEY),
          getItemSync(FORNITORI_KEY),
        ]);

      const inventarioBundle = normalizeDatasetBundle(inventarioRaw, normalizeInventarioItem);
      const consegneBundle = normalizeDatasetBundle(consegneRaw, normalizeConsegnaItem);
      const cambiBundle = normalizeDatasetBundle(adblueRaw, normalizeCambioAdBlue);

      setItems(inventarioBundle.items);
      setInventarioRawMap(inventarioBundle.rawMap);
      setInventarioShape(inventarioBundle.shape);

      setConsegne(consegneBundle.items);
      setConsegneRawMap(consegneBundle.rawMap);
      setConsegneShape(consegneBundle.shape);

      setMezzi(
        unwrapStoredArray(mezziRaw)
          .map(normalizeMezzoItem)
          .filter((entry): entry is MezzoBasic => Boolean(entry)),
      );
      setColleghi(
        unwrapStoredArray(colleghiRaw)
          .map(normalizeCollegaItem)
          .filter((entry): entry is CollegaBasic => Boolean(entry)),
      );
      setCambi(
        cambiBundle.items
          .sort(
            (left, right) =>
              (parseStoredDate(left.data)?.getTime() ?? 0) -
              (parseStoredDate(right.data)?.getTime() ?? 0),
          ),
      );
      setCambiRawMap(cambiBundle.rawMap);
      setCambiShape(cambiBundle.shape);
      setFornitori(normalizeFornitoriList(fornitoriRaw));

      const [documentiResult, iaResult, procurementResult, magazzinoRealeResult] =
        await Promise.allSettled([
          readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false }),
          readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false }),
          readNextProcurementSnapshot({ includeCloneOverlays: false }),
          readNextMagazzinoRealeSnapshot(),
        ]);

      if (documentiResult.status === "fulfilled") {
        setDocumentiCostiSnapshot(documentiResult.value);
      } else {
        console.error("Errore snapshot documenti/costi Magazzino NEXT:", documentiResult.reason);
        setDocumentiCostiSnapshot(null);
      }

      if (iaResult.status === "fulfilled") {
        setIaDocumentiSnapshot(iaResult.value);
      } else {
        console.error("Errore archivio IA documenti Magazzino NEXT:", iaResult.reason);
        setIaDocumentiSnapshot(null);
      }

      if (procurementResult.status === "fulfilled") {
        setProcurementSnapshot(procurementResult.value);
      } else {
        console.error("Errore procurement read-only Magazzino NEXT:", procurementResult.reason);
        setProcurementSnapshot(null);
      }

      if (magazzinoRealeResult.status === "fulfilled") {
        setMagazzinoRealeSnapshot(magazzinoRealeResult.value);
      } else {
        console.error("Errore snapshot dominio allargato Magazzino NEXT:", magazzinoRealeResult.reason);
        setMagazzinoRealeSnapshot(null);
      }
    } catch (loadError) {
      console.error("Errore caricamento Magazzino NEXT:", loadError);
      setError("Impossibile caricare i dati reali del magazzino.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    const expectedTab = mapModuloToTab(modulo);
    if (requestedTab === expectedTab) return;
    navigate(buildNextMagazzinoPath(expectedTab), { replace: true });
  }, [modulo, navigate, requestedTab]);

  useEffect(() => {
    if (!docModalItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDocModalItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docModalItem]);

  useEffect(() => {
    if (iaHandoff.state.status !== "ready") {
      return;
    }

    const handoffId = iaHandoff.state.payload.handoffId;
    const targetTab = mapHandoffViewToTab(iaHandoff.state.prefill.vistaTarget);
    const materialQuery =
      iaHandoff.state.prefill.queryMateriale ?? iaHandoff.state.prefill.materiale;
    const targetPath =
      targetTab && requestedTab !== targetTab
        ? `${buildNextMagazzinoPath(targetTab)}&iaHandoff=${encodeURIComponent(handoffId)}`
        : null;

    if (targetPath) {
      navigate(targetPath, { replace: true });
      return;
    }

    if (iaHandoffLifecycleRef.current === handoffId) {
      return;
    }

    if (materialQuery) {
      setSearchInv(materialQuery);
      setSearchMc(materialQuery);
    } else if (iaHandoff.state.prefill.targa) {
      setSearchMc(iaHandoff.state.prefill.targa);
    }

    setNotice(
      iaHandoff.state.prefill.documentoNome
        ? `Prefill IA interno applicato: ${iaHandoff.state.prefill.documentoNome}.`
        : "Prefill IA interno applicato sul dominio Magazzino.",
    );
    iaHandoff.acknowledge(
      "prefill_applicato",
      "Magazzino NEXT ha letto il payload standard IA e ha applicato il prefill del dominio stock.",
    );
    iaHandoff.acknowledge(
      iaHandoff.state.requiresVerification ? "da_verificare" : "completato",
      iaHandoff.state.requiresVerification
        ? "Magazzino NEXT aperto con prefill IA ma con campi ancora da verificare."
        : "Magazzino NEXT aperto nel dominio corretto con prefill IA gia applicato.",
    );
    iaHandoffLifecycleRef.current = handoffId;
  }, [iaHandoff, navigate, requestedTab]);

  useEffect(() => {
    if (!materialeSelezionato) return;
    const refreshed = items.find((item) => item.id === materialeSelezionato.id) ?? null;
    setMaterialeSelezionato(refreshed);
    if (!refreshed) {
      setMaterialeInput("");
    }
  }, [items, materialeSelezionato]);

  useEffect(() => {
    const adBlueItems = items.filter((item) =>
      looksLikeNextMagazzinoAdBlueMaterial(item.descrizione),
    );
    if (adBlueItems.length === 1) {
      setAdBlueInventarioRefId(adBlueItems[0].id);
      return;
    }
    if (
      adBlueInventarioRefId &&
      !adBlueItems.some((item) => item.id === adBlueInventarioRefId)
    ) {
      setAdBlueInventarioRefId("");
    }
  }, [adBlueInventarioRefId, items]);

  function resetFeedback() {
    setNotice(null);
    setError(null);
  }

  function resetInventarioForm() {
    setNewDescrizione("");
    setNewFornitore("");
    setNewQuantita("");
    setNewUnita("pz");
    setNewSogliaMinima("");
    setNewFotoFile(null);
  }

  function resetMaterialeSelection() {
    setMaterialeSelezionato(null);
    setMaterialeInput("");
  }

  function resetDestinatarioSelection() {
    setDestinatarioObj(null);
    setDestinatarioInput("");
  }

  function resetConsegnaForm(keepSelections = true) {
    setQuantita("");
    setMotivo("");
    setDataConsegna(todayInput());
    setWarningDelete(null);
    if (!keepSelections) {
      resetDestinatarioSelection();
      resetMaterialeSelection();
    }
  }

  function resetAdBlueForm() {
    setDataCambio(todayInput());
    setQuantitaCambioLitri("");
    setAdBlueInventarioRefId("");
    setNumeroCisterna("");
    setNoteAdblue("");
  }

  async function persistInventario(
    nextItems: InventarioItem[],
    nextRawMap: Record<string, RawDatasetRecord> = inventarioRawMap,
  ) {
    const records = nextItems.map((item) => buildInventarioRecord(nextRawMap[item.id], item));
    await persistArrayDataset(INVENTARIO_KEY, records, inventarioShape);
    setInventarioRawMap(buildRawMapById(nextItems, records));
  }

  async function persistConsegne(
    nextItems: MaterialeConsegnato[],
    nextRawMap: Record<string, RawDatasetRecord> = consegneRawMap,
  ) {
    const records = nextItems.map((item) => buildConsegnaRecord(nextRawMap[item.id], item));
    await persistArrayDataset(MATERIALI_KEY, records, consegneShape);
    setConsegneRawMap(buildRawMapById(nextItems, records));
  }

  async function persistCambi(
    nextItems: CambioAdBlue[],
    nextRawMap: Record<string, RawDatasetRecord> = cambiRawMap,
  ) {
    const records = nextItems.map((item) => buildCambioAdBlueRecord(nextRawMap[item.id], item));
    await persistArrayDataset(CISTERNE_ADBLUE_KEY, records, cambiShape);
    setCambiRawMap(buildRawMapById(nextItems, records));
  }

  function handleSelectFoto(event: ChangeEvent<HTMLInputElement>, mode: "new" | "edit") {
    const file = event.target.files?.[0] ?? null;
    if (mode === "new") {
      setNewFotoFile(file);
      return;
    }
    setEditFotoFile(file);
  }

  async function handleAddInventario() {
    resetFeedback();
    const descrizione = normalizeText(newDescrizione);
    const quantitaValue = normalizeNumber(newQuantita);
    const sogliaValue = normalizeNumber(newSogliaMinima);
    const unita = ensureSupportedUnit(newUnita);
    if (!descrizione || quantitaValue === null || quantitaValue < 0) {
      setError("Compila descrizione e quantita valide.");
      return;
    }
    if (!unita) {
      setError("Usa una unita supportata: pz, lt, kg o mt.");
      return;
    }

    setSaving(true);
    try {
      const fornitore = normalizeOptionalText(newFornitore);
      const stockKey =
        buildNextMagazzinoStockKey({
          descrizione,
          fornitore,
          unita,
        }) ?? null;
      const existingIndex =
        stockKey !== null
          ? items.findIndex((item) => item.stockKey === stockKey)
          : -1;
      const targetId = existingIndex >= 0 ? items[existingIndex].id : generateId();
      let fotoUrl: string | null = null;
      let fotoStoragePath: string | null = null;
      if (newFotoFile) {
        const uploaded = await uploadInventarioPhoto(newFotoFile, targetId);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      }

      const nextItems =
        existingIndex >= 0
          ? items.map((item, index) => {
              if (index !== existingIndex) return item;
              return {
                ...item,
                descrizione,
                quantita: item.quantita + quantitaValue,
                unita,
                stockKey,
                fornitore: fornitore ?? item.fornitore,
                fotoUrl: fotoUrl ?? item.fotoUrl,
                fotoStoragePath: fotoStoragePath ?? item.fotoStoragePath,
                sogliaMinima:
                  newSogliaMinima.trim().length > 0
                    ? sogliaValue ?? undefined
                    : item.sogliaMinima,
              } satisfies InventarioItem;
            })
          : [
              ...items,
              {
                id: targetId,
                descrizione,
                quantita: quantitaValue,
                unita,
                stockKey,
                stockLoadKeys: [],
                fornitore,
                fotoUrl,
                fotoStoragePath,
                sogliaMinima: sogliaValue ?? undefined,
              } satisfies InventarioItem,
            ];

      const sortedItems = nextItems.sort((left, right) =>
        left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" }),
      );

      await persistInventario(sortedItems);
      setItems(sortedItems);
      setNotice(
        existingIndex >= 0
          ? "Carico aggiunto alla voce inventario esistente."
          : "Articolo aggiunto al magazzino.",
      );
      resetInventarioForm();
      setInventarioTab("magazzino");
    } catch (saveError) {
      console.error("Errore aggiunta inventario NEXT:", saveError);
      setError("Errore durante l'aggiunta dell'articolo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInventarioEdit() {
    if (!editingItem) return;
    resetFeedback();
    const descrizione = normalizeText(editingItem.descrizione);
    const unita = ensureSupportedUnit(editingItem.unita);
    if (!descrizione || editingItem.quantita < 0) {
      setError("Compila dati validi per l'articolo.");
      return;
    }
    if (!unita) {
      setError("Usa una unita supportata: pz, lt, kg o mt.");
      return;
    }

    setSaving(true);
    try {
      let fotoUrl = editingItem.fotoUrl;
      let fotoStoragePath = editingItem.fotoStoragePath;
      if (editFotoFile) {
        const uploaded = await uploadInventarioPhoto(editFotoFile, editingItem.id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      }

      const fornitore = normalizeOptionalText(editingItem.fornitore);
      const stockKey =
        buildNextMagazzinoStockKey({
          descrizione,
          fornitore,
          unita,
        }) ?? null;
      const collision = items.find(
        (item) => item.id !== editingItem.id && item.stockKey && item.stockKey === stockKey,
      );
      if (collision) {
        setError(
          `Esiste gia una voce inventario con la stessa chiave stock: "${collision.descrizione}".`,
        );
        return;
      }

      const nextItems = items
        .map((item) =>
          item.id === editingItem.id
            ? {
                ...editingItem,
                descrizione,
                unita,
                stockKey,
                fornitore,
                fotoUrl,
                fotoStoragePath,
              }
            : item,
        )
        .sort((left, right) =>
          left.descrizione.localeCompare(right.descrizione, "it", {
            sensitivity: "base",
          }),
        );

      await persistInventario(nextItems);
      setItems(nextItems);
      setNotice("Articolo aggiornato.");
      setEditingItem(null);
      setEditFotoFile(null);
    } catch (saveError) {
      console.error("Errore modifica inventario NEXT:", saveError);
      setError("Errore durante il salvataggio dell'articolo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeltaQuantita(itemId: string, delta: number) {
    resetFeedback();
    const target = items.find((item) => item.id === itemId);
    if (!target) return;
    if (!hasSupportedUnit(target.unita)) {
      setError(
        `L'articolo "${target.descrizione}" ha unita non supportata. Correggi la voce prima di aggiornare la giacenza.`,
      );
      return;
    }
    const nextQuantity = Math.max(0, target.quantita + delta);
    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, quantita: nextQuantity } : item,
    );

    setSaving(true);
    try {
      await persistInventario(nextItems);
      setItems(nextItems);
      setNotice("Quantita aggiornata.");
    } catch (saveError) {
      console.error("Errore delta quantita magazzino:", saveError);
      setError("Errore durante l'aggiornamento della quantita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDirectQuantita(itemId: string, rawValue: string) {
    resetFeedback();
    const parsed = normalizeNumber(rawValue);
    if (parsed === null || parsed < 0) {
      setError("Inserisci una quantita valida.");
      return;
    }
    const target = items.find((item) => item.id === itemId);
    if (target && !hasSupportedUnit(target.unita)) {
      setError(
        `L'articolo "${target.descrizione}" ha unita non supportata. Correggi la voce prima di aggiornare la giacenza.`,
      );
      return;
    }
    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, quantita: parsed } : item,
    );

    setSaving(true);
    try {
      await persistInventario(nextItems);
      setItems(nextItems);
      setNotice("Quantita aggiornata.");
    } catch (saveError) {
      console.error("Errore input quantita magazzino:", saveError);
      setError("Errore durante l'aggiornamento della quantita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInventario(itemId: string) {
    resetFeedback();
    const nextItems = items.filter((item) => item.id !== itemId);
    setSaving(true);
    try {
      await persistInventario(nextItems);
      setItems(nextItems);
      setPendingDeleteItemId(null);
      setNotice("Articolo eliminato dal magazzino.");
    } catch (saveError) {
      console.error("Errore eliminazione inventario NEXT:", saveError);
      setError("Errore durante l'eliminazione dell'articolo.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectDestinatario(suggestion: SuggestionDest) {
    resetFeedback();
    setDestinatarioObj({
      type: suggestion.type,
      refId: suggestion.refId,
      label: suggestion.label,
    });
    setDestinatarioInput(suggestion.label);
  }

  function handleSelectMateriale(suggestion: SuggestionMat) {
    resetFeedback();
    const selected = items.find((item) => item.id === suggestion.id);
    if (!selected) return;
    setMaterialeSelezionato(selected);
    setMaterialeInput(selected.descrizione);
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((current) =>
      current.includes(groupId)
        ? current.filter((entry) => entry !== groupId)
        : [...current, groupId],
    );
  }

  async function eseguiDeleteConsegna(consegna: MaterialeConsegnato) {
    resetFeedback();
    setSaving(true);
    try {
      const nuoveConsegne = consegne.filter((item) => item.id !== consegna.id);
      const inventarioAggiornato = [...items];
      const idx = resolveConsegnaInventarioIndex(inventarioAggiornato, consegna);
      const unitaConsegna = ensureSupportedUnit(consegna.unita);
      if (!unitaConsegna) {
        setError(
          `Ripristino bloccato: la consegna "${consegna.descrizione}" usa unita non supportata.`,
        );
        return;
      }

      if (idx >= 0) {
        if (!areNextMagazzinoUnitsCompatible(inventarioAggiornato[idx].unita, consegna.unita)) {
          setError(
            `Ripristino bloccato: unita non coerente tra consegna (${consegna.unita}) e inventario (${inventarioAggiornato[idx].unita}).`,
          );
          return;
        }
        inventarioAggiornato[idx] = {
          ...inventarioAggiornato[idx],
          quantita: inventarioAggiornato[idx].quantita + consegna.quantita,
        };
      } else {
        inventarioAggiornato.push({
          id: consegna.inventarioRefId ?? generateId(),
          descrizione: consegna.descrizione,
          quantita: consegna.quantita,
          unita: unitaConsegna,
          stockKey:
            buildConsegnaStockKey({
              descrizione: consegna.descrizione,
              fornitore: consegna.fornitore,
              unita: unitaConsegna,
              stockKey: consegna.stockKey,
            }) ?? null,
          stockLoadKeys: [],
          fornitore: consegna.fornitore ?? null,
          fotoUrl: null,
          fotoStoragePath: null,
        });
      }

      await persistConsegne(nuoveConsegne);
      try {
        await persistInventario(inventarioAggiornato);
      } catch (inventoryError) {
        await persistConsegne(consegne);
        throw inventoryError;
      }

      setConsegne(nuoveConsegne);
      setItems(
        inventarioAggiornato.sort((left, right) =>
          left.descrizione.localeCompare(right.descrizione, "it", {
            sensitivity: "base",
          }),
        ),
      );
      setWarningDelete(null);
      setNotice("Consegna eliminata e magazzino ripristinato.");
    } catch (deleteError) {
      console.error("Errore eliminazione consegna NEXT:", deleteError);
      setError("Errore durante l'eliminazione della consegna.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConsegna(consegna: MaterialeConsegnato) {
    const itemExists = resolveConsegnaInventarioIndex(items, consegna) >= 0;

    if (!itemExists) {
      setWarningDelete({
        consegna,
        messaggio: `L'articolo "${consegna.descrizione}" non e piu in magazzino. Il ripristino creera una voce senza foto e fornitore. Continuare?`,
      });
      return;
    }

    if (!window.confirm("Eliminare la consegna e ripristinare il magazzino?")) return;
    await eseguiDeleteConsegna(consegna);
  }

  async function handleAddConsegna() {
    resetFeedback();
    if (!destinatarioObj) {
      setError("Seleziona un destinatario valido dalla lista.");
      return;
    }

    if (!materialeSelezionato) {
      setError("Seleziona un materiale valido dall'inventario.");
      return;
    }

    const quantitaValue = normalizeNumber(quantita);
    if (quantitaValue === null || quantitaValue <= 0) {
      setError("La quantita deve essere maggiore di zero.");
      return;
    }

    const itemMagazzino = items.find((item) => item.id === materialeSelezionato.id);
    if (!itemMagazzino || itemMagazzino.quantita < quantitaValue) {
      setError(
        `Quantita disponibile insufficiente (disponibili: ${formatQuantita(
          itemMagazzino?.quantita ?? 0,
          itemMagazzino?.unita ?? materialeSelezionato.unita,
        )})`,
      );
      return;
    }
    if (!hasSupportedUnit(itemMagazzino.unita)) {
      setError(
        `Scarico bloccato: l'articolo "${itemMagazzino.descrizione}" usa unita non supportata.`,
      );
      return;
    }

    setSaving(true);
    try {
      const mezzoTarga =
        destinatarioObj.type === "MEZZO"
          ? (() => {
              const mezzo = mezzi.find((item) => item.id === destinatarioObj.refId);
              const normalized =
                normalizeVehicleKey(mezzo?.targa) ??
                normalizeVehicleKey(destinatarioObj.label) ??
                normalizeVehicleKey(destinatarioObj.refId);
              return looksLikeVehicleTarga(normalized) ? normalized : null;
            })()
          : null;
      const nuovaConsegna: MaterialeConsegnato = {
        id: generateId(),
        descrizione: materialeSelezionato.descrizione,
        materialeLabel: materialeSelezionato.descrizione,
        quantita: quantitaValue,
        unita: materialeSelezionato.unita,
        destinatario: destinatarioObj,
        motivo: normalizeOptionalText(motivo) ?? undefined,
        data: inputDateToStored(dataConsegna),
        fornitore: materialeSelezionato.fornitore ?? null,
        inventarioRefId: materialeSelezionato.id,
        stockKey: materialeSelezionato.stockKey,
        direzione: "OUT",
        tipo: "OUT",
        origine: "MAGAZZINO_NEXT",
        mezzoTarga,
        targa: mezzoTarga,
      };

      const nuovaListaConsegne = [...consegne, nuovaConsegna];
      const nuovaListaInventario = items
        .map((item) =>
          item.id === materialeSelezionato.id
            ? { ...item, quantita: item.quantita - quantitaValue }
            : item,
        );

      await persistConsegne(nuovaListaConsegne);
      try {
        await persistInventario(nuovaListaInventario);
      } catch (inventoryError) {
        await persistConsegne(consegne);
        throw inventoryError;
      }

      setConsegne(nuovaListaConsegne);
      setItems(nuovaListaInventario);
      setNotice("Consegna registrata.");
      resetConsegnaForm(true);
      setMaterialiTab("storico");
    } catch (saveError) {
      console.error("Errore registrazione consegna NEXT:", saveError);
      setError("Errore durante la registrazione della consegna.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegistraCambio() {
    resetFeedback();
    if (!normalizeText(dataCambio)) {
      setError("Seleziona la data del cambio cisterna.");
      return;
    }
    const quantitaLitri = normalizeNumber(quantitaCambioLitri);
    if (quantitaLitri === null || quantitaLitri <= 0) {
      setError("Inserisci i litri reali scaricati dalla cisterna.");
      return;
    }

    const adBlueCandidates = items.filter((item) =>
      looksLikeNextMagazzinoAdBlueMaterial(item.descrizione),
    );
    const resolvedInventarioRefId =
      normalizeNextMagazzinoStockRefId(adBlueInventarioRefId) ??
      (adBlueCandidates.length === 1 ? adBlueCandidates[0].id : null);
    if (!resolvedInventarioRefId) {
      setError("Seleziona l'articolo AdBlue di inventario da scaricare.");
      return;
    }

    const inventarioIndex = findInventarioIndexByDescriptor(items, {
      inventarioRefId: resolvedInventarioRefId,
      descrizione: "AdBlue",
      unita: "lt",
    });
    const inventarioItem = inventarioIndex >= 0 ? items[inventarioIndex] : null;
    if (!inventarioItem) {
      setError("Articolo AdBlue non trovato in inventario.");
      return;
    }
    if (!areNextMagazzinoUnitsCompatible(inventarioItem.unita, "lt")) {
      setError(
        `Scarico AdBlue bloccato: l'articolo di inventario usa unita ${inventarioItem.unita}.`,
      );
      return;
    }
    if (inventarioItem.quantita < quantitaLitri) {
      setError(
        `Giacenza AdBlue insufficiente (${formatQuantita(inventarioItem.quantita, inventarioItem.unita)} disponibili).`,
      );
      return;
    }

    setSaving(true);
    try {
      const nuovoCambio: CambioAdBlue = {
        id: generateId(),
        data: inputDateToStored(dataCambio),
        quantitaLitri,
        inventarioRefId: inventarioItem.id,
        stockKey:
          inventarioItem.stockKey ??
          buildNextMagazzinoStockKey({
            descrizione: inventarioItem.descrizione,
            fornitore: inventarioItem.fornitore,
            unita: "lt",
          }),
        numeroCisterna: normalizeOptionalText(numeroCisterna) ?? undefined,
        note: normalizeOptionalText(noteAdblue) ?? undefined,
      };
      const nuovaLista = [...cambi, nuovoCambio].sort(
        (left, right) =>
          (parseStoredDate(left.data)?.getTime() ?? 0) -
          (parseStoredDate(right.data)?.getTime() ?? 0),
      );
      const inventarioAggiornato = items.map((item) =>
        item.id === inventarioItem.id
          ? { ...item, quantita: Math.max(0, item.quantita - quantitaLitri) }
          : item,
      );
      await persistCambi(nuovaLista);
      try {
        await persistInventario(inventarioAggiornato);
      } catch (inventoryError) {
        await persistCambi(cambi);
        throw inventoryError;
      }
      setCambi(nuovaLista);
      setItems(inventarioAggiornato);
      setNotice("Cambio cisterna registrato e inventario AdBlue aggiornato.");
      resetAdBlueForm();
      setAdBlueTab("stato");
    } catch (saveError) {
      console.error("Errore registrazione cambio AdBlue:", saveError);
      setError("Errore durante il salvataggio del cambio cisterna.");
    } finally {
      setSaving(false);
    }
  }

  function handleDocumentoUnitChange(
    candidateId: string,
    value: string,
  ) {
    const normalized = normalizeNextMagazzinoStockUnit(value);
    setDocumentoManualUnits((current) => ({
      ...current,
      [candidateId]: normalized ?? "",
    }));
  }

  async function handleRiconciliaDocumentoSenzaCarico(candidateId: string) {
    resetFeedback();
    const candidate = documentoStockCandidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      setError("Riga documento non piu disponibile.");
      return;
    }
    if (!candidate.canReconcileWithoutLoad || !candidate.unita) {
      setError(candidate.blockedReason ?? "Riconciliazione documento non disponibile.");
      return;
    }

    setSaving(true);
    setDocumentoImportingId(candidateId);
    try {
      const targetIndex = findInventarioIndexByDescriptor(items, {
        inventarioRefId: candidate.inventoryMatchId,
        stockKey: candidate.stockKey,
        descrizione: candidate.descrizione,
        fornitore: candidate.fornitore,
        unita: candidate.unita,
      });
      if (targetIndex < 0) {
        throw new Error("Inventario target non trovato per la riconciliazione.");
      }

      const nextItems = items.map((item, index) => {
        if (index !== targetIndex) return item;
        return {
          ...item,
          unita: candidate.unita ?? item.unita,
          stockKey: candidate.stockKey ?? item.stockKey,
          fornitore: candidate.fornitore ?? item.fornitore,
          stockLoadKeys: mergeNextMagazzinoStockLoadKeys(
            item.stockLoadKeys,
            candidate.sourceLoadKey,
          ),
        } satisfies InventarioItem;
      });
      const sortedItems = sortInventarioItems(nextItems);
      await persistInventario(sortedItems);
      setItems(sortedItems);
      setNotice(
        "Fattura riconciliata sulla voce inventario gia caricata: nessun aumento stock eseguito.",
      );
    } catch (reconcileError) {
      console.error("Errore riconciliazione documento senza carico:", reconcileError);
      setError("Errore durante la riconciliazione della fattura senza carico stock.");
    } finally {
      setSaving(false);
      setDocumentoImportingId(null);
    }
  }

  async function handleCaricaDocumentoInInventario(candidateId: string) {
    resetFeedback();
    const candidate = documentoStockCandidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      setError("Riga documento non piu disponibile.");
      return;
    }
    if (!candidate.canLoad || !candidate.unita || candidate.quantita === null) {
      setError(candidate.blockedReason ?? "Carico documento non disponibile.");
      return;
    }

    setSaving(true);
    setDocumentoImportingId(candidateId);
    try {
      const targetIndex = findInventarioIndexByDescriptor(items, {
        inventarioRefId: candidate.inventoryMatchId,
        stockKey: candidate.stockKey,
        descrizione: candidate.descrizione,
        fornitore: candidate.fornitore,
        unita: candidate.unita,
      });
      const nextItems =
        targetIndex >= 0
          ? items.map((item, index) => {
              if (index !== targetIndex) return item;
              return {
                ...item,
                quantita: item.quantita + candidate.quantita!,
                unita: candidate.unita!,
                stockKey: candidate.stockKey ?? item.stockKey,
                fornitore: candidate.fornitore ?? item.fornitore,
                stockLoadKeys: mergeNextMagazzinoStockLoadKeys(
                  item.stockLoadKeys,
                  candidate.sourceLoadKey,
                ),
              } satisfies InventarioItem;
            })
          : [
              ...items,
              {
                id: generateId(),
                descrizione: candidate.descrizione,
                quantita: candidate.quantita,
                unita: candidate.unita,
                stockKey: candidate.stockKey,
                stockLoadKeys: mergeNextMagazzinoStockLoadKeys([], candidate.sourceLoadKey),
                fornitore: candidate.fornitore ?? null,
                fotoUrl: null,
                fotoStoragePath: null,
              } satisfies InventarioItem,
            ];
      const sortedItems = sortInventarioItems(nextItems);
      await persistInventario(sortedItems);
      setItems(sortedItems);
      setNotice(
        targetIndex >= 0
          ? "Fattura AdBlue consolidata sulla voce inventario esistente."
          : "Fattura AdBlue caricata in inventario.",
      );
    } catch (loadError) {
      console.error("Errore carico documento in inventario:", loadError);
      setError("Errore durante il carico stock della fattura AdBlue.");
    } finally {
      setSaving(false);
      setDocumentoImportingId(null);
    }
  }

  async function handleCaricaArrivoInInventario(candidateId: string) {
    resetFeedback();
    const candidate = procurementStockCandidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      setError("Arrivo procurement non piu disponibile.");
      return;
    }
    if (!candidate.canLoad || !candidate.unita || candidate.quantita === null) {
      setError(candidate.blockedReason ?? "Carico arrivo non disponibile.");
      return;
    }

    setSaving(true);
    setProcurementImportingId(candidateId);
    try {
      const targetIndex = findInventarioIndexByDescriptor(items, {
        inventarioRefId: candidate.inventoryMatchId,
        stockKey: candidate.stockKey,
        descrizione: candidate.descrizione,
        fornitore: candidate.fornitore,
        unita: candidate.unita,
      });
      const nextItems =
        targetIndex >= 0
          ? items.map((item, index) => {
              if (index !== targetIndex) return item;
              return {
                ...item,
                quantita: item.quantita + candidate.quantita!,
                unita: candidate.unita!,
                stockKey: candidate.stockKey ?? item.stockKey,
                fornitore: candidate.fornitore ?? item.fornitore,
                stockLoadKeys: mergeNextMagazzinoStockLoadKeys(
                  item.stockLoadKeys,
                  candidate.sourceLoadKey,
                ),
              } satisfies InventarioItem;
            })
          : [
              ...items,
              {
                id: generateId(),
                descrizione: candidate.descrizione,
                quantita: candidate.quantita,
                unita: candidate.unita,
                stockKey: candidate.stockKey,
                stockLoadKeys: mergeNextMagazzinoStockLoadKeys([], candidate.sourceLoadKey),
                fornitore: candidate.fornitore ?? null,
                fotoUrl: null,
                fotoStoragePath: null,
              } satisfies InventarioItem,
            ];
      const sortedItems = sortInventarioItems(nextItems);
      await persistInventario(sortedItems);
      setItems(sortedItems);
      setNotice(
        targetIndex >= 0
          ? `Arrivo ${candidate.orderReference} consolidato sulla voce inventario esistente.`
          : `Arrivo ${candidate.orderReference} caricato in inventario.`,
      );
    } catch (loadError) {
      console.error("Errore carico arrivo procurement in inventario:", loadError);
      setError("Errore durante il carico dell'arrivo procurement in inventario.");
    } finally {
      setSaving(false);
      setProcurementImportingId(null);
    }
  }

  const unitaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...UNITA_OPTIONS, editingItem?.unita].filter(
            (entry): entry is string => Boolean(normalizeText(entry)),
          ),
        ),
      ),
    [editingItem?.unita],
  );

  const adBlueInventoryItems = useMemo(
    () => items.filter((item) => looksLikeNextMagazzinoAdBlueMaterial(item.descrizione)),
    [items],
  );

  const procurementArrivedRows = useMemo<ProcurementStockRow[]>(
    () =>
      (procurementSnapshot?.orders ?? []).flatMap((order) =>
        order.materials
          .filter((material) => material.arrived)
          .map((material) => ({
            id: `${order.id}:${material.id}`,
            orderId: order.id,
            orderReference: order.orderReference,
            materialId: material.id,
            supplierName: normalizeOptionalText(order.supplierName),
            descrizione: material.descrizione,
            quantita: material.quantita,
            unita: normalizeOptionalText(normalizeNextMagazzinoStockUnitLoose(material.unita)),
            arrivalDateLabel: material.arrivalDateLabel,
          })),
      ),
    [procurementSnapshot],
  );

  const documentoStockCandidates = useMemo(() => {
    const supportDocs = documentiCostiSnapshot?.materialCostSupport.documents ?? [];
    return supportDocs.flatMap((documento) =>
      documento.voci
        .map((row, rowIndex) => {
          const descrizione = normalizeText(row.descrizione);
          if (!descrizione) return null;

          const candidateId = `${documento.sourceDocId}:${rowIndex}`;
          const manualUnit = documentoManualUnits[candidateId] || "";
          const manualResolvedUnit = manualUnit
            ? normalizeNextMagazzinoStockUnit(manualUnit)
            : null;
          const inventoryMatches = items.filter((item) =>
            sameMaterialIdentity(item, {
              descrizione,
              fornitore: documento.fornitore,
            }),
          );
          const procurementMatches = procurementArrivedRows.filter((entry) =>
            sameMaterialIdentity(entry, {
              descrizione,
              fornitore: documento.fornitore,
            }),
          );

          const inventorySupportedUnits = Array.from(
            new Set(
              inventoryMatches
                .map((item) => normalizeNextMagazzinoStockUnit(item.unita))
                .filter((unit): unit is NextMagazzinoStockUnit => Boolean(unit)),
            ),
          );
          const procurementSupportedUnits = Array.from(
            new Set(
              procurementMatches
                .map((entry) => normalizeNextMagazzinoStockUnit(entry.unita))
                .filter((unit): unit is NextMagazzinoStockUnit => Boolean(unit)),
            ),
          );
          const inventoryUnit =
            inventorySupportedUnits.length === 1 ? inventorySupportedUnits[0] : null;
          const procurementUnit =
            procurementSupportedUnits.length === 1 ? procurementSupportedUnits[0] : null;
          const resolvedUnit =
            inventoryUnit ??
            procurementUnit ??
            manualResolvedUnit;
          const unitaSource: DocumentoStockRowCandidate["unitaSource"] = inventoryUnit
            ? "inventario"
            : procurementUnit
              ? "procurement"
              : manualResolvedUnit
                ? "manuale"
                : "missing";
          const hasUnitConflict =
            Boolean(resolvedUnit) &&
            (inventorySupportedUnits.some((unit) => unit !== resolvedUnit) ||
              procurementSupportedUnits.some((unit) => unit !== resolvedUnit));
          const stockKey =
            resolvedUnit
              ? buildNextMagazzinoStockKey({
                  descrizione,
                  fornitore: documento.fornitore,
                  unita: resolvedUnit,
                })
              : null;
          const inventoryIndex =
            stockKey || resolvedUnit
              ? findInventarioIndexByDescriptor(items, {
                  stockKey,
                  descrizione,
                  fornitore: documento.fornitore,
                  unita: resolvedUnit,
                })
              : -1;
          const inventoryMatchId = inventoryIndex >= 0 ? items[inventoryIndex].id : null;
          const sourceLoadKey = buildNextMagazzinoStockLoadKey({
            sourceType: "DOCUMENTO_MAGAZZINO",
            sourceDocId: documento.sourceDocId,
            rowIndex,
            descrizione,
            fornitore: documento.fornitore,
            unita: resolvedUnit ?? manualUnit,
            quantita: row.quantita,
            data: documento.data,
          });
          const duplicateBySource = items.some((item) =>
            hasNextMagazzinoStockLoadKey(item.stockLoadKeys, sourceLoadKey),
          );
          const documentLabel = buildDocumentoStockLabel({
            tipoDocumento: documento.tipoDocumento,
            numeroDocumento: documento.numeroDocumento,
            nomeFile: documento.nomeFile,
            sourceDocId: documento.sourceDocId,
          });
          const isInvoiceDocument = looksLikeDocumentoMagazzinoFattura(
            documento.tipoDocumento ?? documentLabel,
          );
          const isAdBlueCandidate =
            looksLikeNextMagazzinoAdBlueMaterial(descrizione) ||
            looksLikeNextMagazzinoAdBlueMaterial(documento.fornitore) ||
            looksLikeNextMagazzinoAdBlueMaterial(documentLabel) ||
            inventoryMatches.some((item) =>
              looksLikeNextMagazzinoAdBlueMaterial(item.descrizione),
            );
          const procurementCoverage = procurementMatches.find((entry) => {
            if (!resolvedUnit || !areNextMagazzinoUnitsCompatible(entry.unita, resolvedUnit)) {
              return false;
            }
            if (
              typeof row.quantita !== "number" ||
              !Number.isFinite(row.quantita) ||
              typeof entry.quantita !== "number" ||
              !Number.isFinite(entry.quantita)
            ) {
              return false;
            }
            if (Math.abs(entry.quantita - row.quantita) > 0.001) {
              return false;
            }
            const dateDiff = absDateDiffDays(documento.data, entry.arrivalDateLabel);
            return dateDiff !== null && dateDiff <= PROCUREMENT_DEDUP_WINDOW_DAYS;
          });
          const procurementCoverageLoadKey = procurementCoverage
            ? buildNextMagazzinoStockLoadKey({
                sourceType: "PROCUREMENT_ARRIVO",
                sourceDocId: procurementCoverage.id,
                descrizione: procurementCoverage.descrizione,
                fornitore: procurementCoverage.supplierName,
                unita: resolvedUnit ?? procurementCoverage.unita,
                quantita: procurementCoverage.quantita,
                data: procurementCoverage.arrivalDateLabel,
              })
            : null;
          const procurementCoverageAlreadyLoaded =
            procurementCoverageLoadKey !== null &&
            items.some((item) =>
              hasNextMagazzinoStockLoadKey(item.stockLoadKeys, procurementCoverageLoadKey),
            );

          let blockedReason: string | null = null;
          let canLoad = false;
          let canReconcileWithoutLoad = false;
          let decision: DocumentoStockRowCandidate["decision"] = "da_verificare";
          let decisionReason: string | null = null;

          if (documento.daVerificare) {
            blockedReason =
              "Documento marcato `DA VERIFICARE`: nessuna azione automatica consentita.";
            decisionReason = blockedReason;
          } else if (row.quantita === null || row.quantita <= 0) {
            blockedReason = "Quantita documento non leggibile.";
            decisionReason = blockedReason;
          } else if (!isInvoiceDocument) {
            blockedReason =
              "La deroga scrivente e limitata alle fatture di magazzino.";
            decision = "fuori_perimetro";
            decisionReason = blockedReason;
          } else if (!resolvedUnit) {
            blockedReason = "Seleziona una unita coerente per il carico.";
            decisionReason = blockedReason;
          } else if (hasUnitConflict) {
            blockedReason =
              "Unita incoerente con materiale o arrivo gia presenti: blocco automatico.";
            decisionReason = blockedReason;
          } else if (duplicateBySource) {
            blockedReason =
              "Questa riga documento risulta gia consolidata su inventario: niente doppio carico.";
            decisionReason = blockedReason;
          } else if (procurementCoverage && inventoryMatchId && procurementCoverageAlreadyLoaded) {
            canReconcileWithoutLoad = true;
            decision = "riconcilia_senza_carico";
            decisionReason =
              "Arrivo procurement compatibile e materiale gia presente: collega la fattura senza aumentare lo stock.";
          } else if (procurementCoverage && inventoryMatchId) {
            blockedReason =
              "Arrivo procurement compatibile e materiale inventario trovati, ma la sorgente procurement non risulta ancora consolidata a stock: non usare la sola riconciliazione documento.";
            decisionReason = blockedReason;
          } else if (procurementCoverage) {
            blockedReason =
              "Arrivo procurement compatibile rilevato ma manca una voce inventario coerente da riconciliare: `DA VERIFICARE`.";
            decisionReason = blockedReason;
          } else if (!isAdBlueCandidate) {
            blockedReason =
              "Scrittura da fattura aperta solo per AdBlue non ancora caricato o per riconciliazioni senza carico.";
            decision = "fuori_perimetro";
            decisionReason = blockedReason;
          } else if (resolvedUnit !== "lt") {
            blockedReason =
              "AdBlue rilevato con unita non coerente: atteso `lt`, aggiornamento bloccato.";
            decisionReason = blockedReason;
          } else {
            canLoad = true;
            decision = "carica_stock_adblue";
            decisionReason = inventoryMatchId
              ? "Fattura AdBlue pronta: aumenta la giacenza della voce inventario esistente."
              : "Fattura AdBlue pronta: crea o aggiorna il materiale AdBlue in inventario e aumenta la giacenza.";
          }

          return {
            id: candidateId,
            sourceDocId: documento.sourceDocId,
            rowIndex,
            documentLabel,
            tipoDocumento: documento.tipoDocumento,
            numeroDocumento: documento.numeroDocumento,
            nomeFile: documento.nomeFile,
            fileUrl: documento.fileUrl,
            daVerificareDocumento: documento.daVerificare,
            descrizione,
            fornitore: documento.fornitore,
            quantita: row.quantita,
            data: documento.data,
            unita: resolvedUnit,
            unitaSource,
            stockKey: stockKey ?? null,
            inventoryMatchId,
            procurementCoverageOrderId: procurementCoverage?.orderId ?? null,
            procurementCoverageReason: procurementCoverage
              ? `Ordine ${procurementCoverage.orderId} · arrivo ${procurementCoverage.arrivalDateLabel || "-"}`
              : null,
            procurementCoverageAlreadyLoaded,
            sourceLoadKey,
            duplicateBySource,
            isInvoiceDocument,
            isAdBlueCandidate,
            hasUnitConflict,
            canReconcileWithoutLoad,
            decision,
            decisionReason,
            blockedReason,
            canLoad,
          } satisfies DocumentoStockRowCandidate;
        })
        .filter((entry) => Boolean(entry)) as DocumentoStockRowCandidate[],
    );
  }, [
    documentiCostiSnapshot?.materialCostSupport.documents,
    documentoManualUnits,
    items,
    procurementArrivedRows,
  ]);

  const iaWarehouseDocumentAction = useMemo(() => {
    if (modulo !== "docs" || iaHandoff.state.status !== "ready") {
      return null;
    }

    const payload = iaHandoff.state.payload;
    const isWarehouseInvoiceFlow =
      normalizeText(payload.prefillCanonico.warehouseInvoiceHint) === "1" ||
      normalizeText(payload.prefillCanonico.flusso) === "fatture_magazzino";
    if (!isWarehouseInvoiceFlow) {
      return null;
    }

    const documentHint =
      normalizeText(payload.prefillCanonico.documentoNome) ||
      normalizeText(payload.datiEstrattiNormalizzati.fileName);
    const supplierHint = normalizeText(payload.prefillCanonico.fornitore);
    const materialHint =
      normalizeText(payload.prefillCanonico.materiale) ||
      normalizeText(payload.prefillCanonico.queryMateriale);
    const modeHint = normalizeText(payload.prefillCanonico.warehouseInvoiceMode);

    const scoredCandidates = documentoStockCandidates
      .map((candidate) => {
        let score = 0;
        if (
          documentHint &&
          [
            candidate.nomeFile,
            candidate.numeroDocumento,
            candidate.sourceDocId,
            candidate.documentLabel,
          ].some((value) => matchesDocumentoHint(value, documentHint))
        ) {
          score += 6;
        }
        if (supplierHint && matchesDocumentoHint(candidate.fornitore, supplierHint)) {
          score += 3;
        }
        if (
          materialHint &&
          [
            candidate.descrizione,
            candidate.documentLabel,
            candidate.nomeFile,
          ].some((value) => matchesDocumentoHint(value, materialHint))
        ) {
          score += 3;
        }
        if (modeHint === "carica_stock_adblue" && candidate.decision === "carica_stock_adblue") {
          score += 2;
        }
        if (
          modeHint === "riconcilia_o_verifica" &&
          candidate.decision === "riconcilia_senza_carico"
        ) {
          score += 1;
        }
        return { candidate, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    if (scoredCandidates.length === 0) {
      return {
        status: "da_verificare" as const,
        candidate: null,
        message:
          "Nessuna riga fattura di magazzino ha un match abbastanza forte con il prefill IA.",
      };
    }

    const bestScore = scoredCandidates[0]?.score ?? 0;
    const bestCandidates = scoredCandidates.filter((entry) => entry.score === bestScore);
    if (bestCandidates.length !== 1) {
      return {
        status: "da_verificare" as const,
        candidate: null,
        message:
          "Il prefill IA aggancia piu righe fattura compatibili: serve verifica manuale prima di scrivere.",
      };
    }

    const selected = bestCandidates[0].candidate;
    if (selected.canReconcileWithoutLoad || selected.canLoad) {
      return {
        status: "pronto" as const,
        candidate: selected,
        message:
          selected.decisionReason ??
          "La fattura selezionata puo essere gestita nel perimetro controllato Magazzino.",
      };
    }

    return {
      status: "da_verificare" as const,
      candidate: selected,
      message:
        selected.blockedReason ??
        selected.decisionReason ??
        "Il match della fattura non e abbastanza forte per una scrittura automatica.",
    };
  }, [documentoStockCandidates, iaHandoff.state, modulo]);

  const procurementStockCandidates = useMemo<ProcurementStockRowCandidate[]>(() => {
    return procurementArrivedRows
      .map((entry) => {
        const inventoryMatches = items.filter((item) =>
          sameMaterialIdentity(item, {
            descrizione: entry.descrizione,
            fornitore: entry.supplierName,
          }),
        );
        const inventoryUnit = resolveUniqueSupportedUnit(
          inventoryMatches.map((item) => item.unita),
        );
        const procurementUnit = normalizeNextMagazzinoStockUnit(entry.unita);
        const resolvedUnit = procurementUnit ?? inventoryUnit;
        const unitaSource: ProcurementStockRowCandidate["unitaSource"] = procurementUnit
          ? "procurement"
          : inventoryUnit
            ? "inventario"
            : "missing";
        const stockKey = resolvedUnit
          ? buildNextMagazzinoStockKey({
              descrizione: entry.descrizione,
              fornitore: entry.supplierName,
              unita: resolvedUnit,
            })
          : null;
        const inventoryIndex =
          stockKey || resolvedUnit
            ? findInventarioIndexByDescriptor(items, {
                stockKey,
                descrizione: entry.descrizione,
                fornitore: entry.supplierName,
                unita: resolvedUnit,
              })
            : -1;
        const inventoryMatchId = inventoryIndex >= 0 ? items[inventoryIndex].id : null;
        const sourceLoadKey = buildNextMagazzinoStockLoadKey({
          sourceType: "PROCUREMENT_ARRIVO",
          sourceDocId: entry.id,
          descrizione: entry.descrizione,
          fornitore: entry.supplierName,
          unita: resolvedUnit ?? entry.unita,
          quantita: entry.quantita,
          data: entry.arrivalDateLabel,
        });
        const duplicateBySource = items.some((item) =>
          hasNextMagazzinoStockLoadKey(item.stockLoadKeys, sourceLoadKey),
        );
        const documentCoverage = documentoStockCandidates.find((candidate) => {
          const blocksProcurementLoad =
            candidate.canReconcileWithoutLoad || candidate.duplicateBySource;
          if (!blocksProcurementLoad || !candidate.unita || !resolvedUnit) {
            return false;
          }
          if (
            !areNextMagazzinoUnitsCompatible(candidate.unita, resolvedUnit) ||
            !sameMaterialIdentity(candidate, {
              descrizione: entry.descrizione,
              fornitore: entry.supplierName,
            })
          ) {
            return false;
          }
          if (candidate.quantita === null || entry.quantita === null) {
            return false;
          }
          if (Math.abs(candidate.quantita - entry.quantita) > 0.001) {
            return false;
          }
          const dateDiff = absDateDiffDays(candidate.data, entry.arrivalDateLabel);
          return dateDiff !== null && dateDiff <= PROCUREMENT_DEDUP_WINDOW_DAYS;
        });

        let blockedReason: string | null = null;
        if (entry.quantita === null || entry.quantita <= 0) {
          blockedReason = "Quantita arrivo non leggibile.";
        } else if (!resolvedUnit) {
          blockedReason = "Unita arrivo non supportata o non riconciliabile con inventario.";
        } else if (documentCoverage) {
          blockedReason =
            documentCoverage.canReconcileWithoutLoad
              ? "Arrivo gia coperto da una fattura pronta in sola riconciliazione: collega documento e costo senza nuovo carico stock."
              : "Arrivo gia coperto da un documento materiali consolidato: niente doppio carico automatico.";
        } else if (duplicateBySource) {
          blockedReason = "Questo arrivo procurement risulta gia consolidato in inventario.";
        }

        return {
          id: entry.id,
          orderId: entry.orderId,
          orderReference: entry.orderReference,
          materialId: entry.materialId,
          descrizione: entry.descrizione,
          fornitore: entry.supplierName,
          quantita: entry.quantita,
          data: entry.arrivalDateLabel,
          unita: resolvedUnit,
          unitaSource,
          stockKey: stockKey ?? null,
          inventoryMatchId,
          sourceLoadKey,
          duplicateBySource,
          documentCoverageDocId: documentCoverage?.sourceDocId ?? null,
          documentCoverageReason: documentCoverage
            ? `Documento ${documentCoverage.sourceDocId} · ${formatStoredDateForUi(documentCoverage.data)}`
            : null,
          blockedReason,
          canLoad: blockedReason === null,
        } satisfies ProcurementStockRowCandidate;
      })
      .sort((left, right) => {
        const rightTime = parseStoredDate(right.data)?.getTime() ?? 0;
        const leftTime = parseStoredDate(left.data)?.getTime() ?? 0;
        return rightTime - leftTime;
      });
  }, [documentoStockCandidates, items, procurementArrivedRows]);

  const inventarioFiltrato = items
    .filter((item) => {
      const search = searchInv.trim().toLowerCase();
      const supplier = filterFornitore.trim().toLowerCase();
      if (search && !`${item.descrizione} ${item.fornitore ?? ""}`.toLowerCase().includes(search)) {
        return false;
      }
      if (supplier && (item.fornitore ?? "").toLowerCase() !== supplier) {
        return false;
      }
      if (filterStock && getStockStatus(item) !== filterStock) {
        return false;
      }
      return true;
    })
    .sort((left, right) =>
      left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" }),
    );

  const destinatarioSuggestions = (() => {
    const term = destinatarioInput.trim().toUpperCase();
    if (!term || destinatarioObj) return [] as SuggestionDest[];
    const list: SuggestionDest[] = [];
    mezzi.forEach((mezzo) => {
      const rawLabel = mezzo.targa || mezzo.nome || mezzo.descrizione || "";
      if (rawLabel.toUpperCase().includes(term)) {
        list.push({
          type: "MEZZO",
          refId: mezzo.id,
          label: rawLabel,
          extra: "Mezzo",
        });
      }
    });
    colleghi.forEach((collega) => {
      const label = `${collega.nome ?? ""} ${collega.cognome ?? ""}`.trim();
      if (label.toUpperCase().includes(term)) {
        list.push({
          type: "COLLEGA",
          refId: collega.id,
          label,
          extra: "Collega",
        });
      }
    });
    if ("MAGAZZINO".includes(term)) {
      list.push({
        type: "MAGAZZINO",
        refId: "MAGAZZINO",
        label: "MAGAZZINO",
        extra: "Magazzino",
      });
    }
    return list.slice(0, 10);
  })();

  const materialeSuggestions = (() => {
    const term = materialeInput.trim().toUpperCase();
    if (!term || materialeSelezionato) return [] as SuggestionMat[];
    return items
      .filter((item) => item.descrizione.toUpperCase().includes(term))
      .sort((left, right) =>
        left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" }),
      )
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        label: item.descrizione,
        quantita: item.quantita,
        unita: item.unita,
        fornitore: item.fornitore ?? null,
      }));
  })();

  const consegneFiltrate = consegne.filter((item) => {
    const search = searchMc.trim().toLowerCase();
    if (filterTipo && item.destinatario.type !== filterTipo) return false;
    if (!search) return true;
    return `${item.destinatario.label} ${item.descrizione}`.toLowerCase().includes(search);
  });

  const groupedConsegne = Array.from(
    consegneFiltrate.reduce((map, item) => {
      const dossierTarga =
        item.destinatario.type === "MEZZO" ? resolveConsegnaVehicleTarga(item, mezzi) : null;
      const groupId =
        dossierTarga
          ? `mezzo:${dossierTarga}`
          : item.destinatario.type === "MAGAZZINO"
            ? "magazzino"
            : `${item.destinatario.type}:${item.destinatario.refId}`;
      const groupDestinatario =
        dossierTarga && item.destinatario.type === "MEZZO"
          ? {
              ...item.destinatario,
              label: dossierTarga,
              refId: dossierTarga,
            }
          : item.destinatario;
      const current =
        map.get(groupId) ??
        ({
          destinatario: groupDestinatario,
          dossierTarga,
          items: [] as MaterialeConsegnato[],
        } as {
          destinatario: DestinatarioRef;
          dossierTarga: string | null;
          items: MaterialeConsegnato[];
        });
      current.items.push(item);
      if (!current.dossierTarga && dossierTarga) {
        current.dossierTarga = dossierTarga;
      }
      map.set(groupId, current);
      return map;
    }, new Map<string, { destinatario: DestinatarioRef; dossierTarga: string | null; items: MaterialeConsegnato[] }>()),
  )
    .map(([groupId, value]) => ({
      groupId,
      destinatario: value.destinatario,
      dossierTarga: value.dossierTarga,
      items: value.items.sort(
        (left, right) =>
          (parseStoredDate(right.data)?.getTime() ?? 0) -
          (parseStoredDate(left.data)?.getTime() ?? 0),
      ),
    }))
    .sort((left, right) =>
      left.destinatario.label.localeCompare(right.destinatario.label, "it", {
        sensitivity: "base",
      }),
    );

  const documentiMagazzinoItems = (iaDocumentiSnapshot?.items ?? []).filter(
    (item) => item.sourceKey === "@documenti_magazzino",
  );
  const documentoReadyCount = documentoStockCandidates.filter(
    (item) => item.canLoad || item.canReconcileWithoutLoad,
  ).length;
  const procurementPreventivi = useMemo(
    () => procurementSnapshot?.preventivi ?? [],
    [procurementSnapshot],
  );
  const materialSupportDocumentIndex = useMemo(() => {
    const next = new Map<string, NextDocumentiMagazzinoSupportDocument>();
    for (const entry of documentiCostiSnapshot?.materialCostSupport.documents ?? []) {
      next.set(entry.sourceDocId, entry);
    }
    return next;
  }, [documentiCostiSnapshot]);
  const documentiMagazzinoUiItems = useMemo<MagazzinoDocumentUiItem[]>(() => {
    const archiveItems = documentiMagazzinoItems.map((item) => {
      const supportDocument = materialSupportDocumentIndex.get(item.sourceDocId) ?? null;
      return {
        id: item.id,
        sourceKey: item.sourceKey,
        sourceDocId: item.sourceDocId,
        tipoDocumento: item.tipoDocumento,
        categoria: normalizeText(item.tipoDocumento).toUpperCase() === "PREVENTIVO" ? "preventivo" : "fattura",
        fornitore: normalizeText(item.fornitore) || "Fornitore non specificato",
        dataDocumento: item.dataDocumento,
        sortTimestamp: item.sortTimestamp,
        totaleDocumento: item.totaleDocumento,
        currency: item.currency,
        fileUrl: item.fileUrl,
        targa: item.targa,
        numeroDocumento: item.numeroDocumento,
        descrizione: buildMagazzinoDocumentDescription(item, supportDocument),
        daVerificare: item.daVerificare,
        righe:
          supportDocument?.voci.map((row, index) => ({
            id: `${supportDocument.id}:row:${index}`,
            descrizione: normalizeText(row.descrizione) || "Riga documento non valorizzata",
            quantita: row.quantita,
            prezzoUnitario: row.prezzoUnitario,
            totale: row.importo,
            unita: null,
            note: null,
          })) ?? [],
      } satisfies MagazzinoDocumentUiItem;
    });

    const preventiviItems = procurementPreventivi.map((item) => ({
      id: `preventivo:${item.id}`,
      sourceKey: item.sourceKey,
      sourceDocId: item.id,
      tipoDocumento: "PREVENTIVO",
      categoria: "preventivo" as const,
      fornitore: normalizeText(item.supplierName) || "Fornitore non specificato",
      dataDocumento: item.dataPreventivoLabel,
      sortTimestamp: item.dataPreventivoTimestamp,
      totaleDocumento: item.totalAmount,
      currency: item.currency,
      fileUrl: item.pdfUrl,
      targa: null,
      numeroDocumento: item.numeroPreventivo,
      descrizione: buildMagazzinoPreventivoDescription(item),
      daVerificare: false,
      righe: [],
    }));

    return sortMagazzinoDocumentItems([...archiveItems, ...preventiviItems]);
  }, [documentiMagazzinoItems, materialSupportDocumentIndex, procurementPreventivi]);
  const docItemsFiltrati = useMemo(() => {
    return documentiMagazzinoUiItems
      .filter((item) => {
        const isLocallyMarked = docLocalDaVerificareIds.has(item.id);
        const isReviewItem = item.daVerificare || isLocallyMarked;

        if (docFiltroAttivo === "fatture") return isMagazzinoFattura(item);
        if (docFiltroAttivo === "ddt") return isMagazzinoDdt(item);
        if (docFiltroAttivo === "preventivi") return isMagazzinoPreventivo(item);
        if (docFiltroAttivo === "da_verificare") return isReviewItem;
        return true;
      })
      .filter((item) => matchesMagazzinoDocumentSearch(item, docSearchQuery));
  }, [documentiMagazzinoUiItems, docFiltroAttivo, docLocalDaVerificareIds, docSearchQuery]);
  const docPerFornitore = useMemo<MagazzinoDocumentSupplierGroup[]>(() => {
    const grouped = new Map<string, MagazzinoDocumentUiItem[]>();

    for (const item of docItemsFiltrati) {
      const supplier = normalizeText(item.fornitore) || "Fornitore non specificato";
      const current = grouped.get(supplier) ?? [];
      current.push(item);
      grouped.set(supplier, current);
    }

    return Array.from(grouped.entries())
      .map(([supplier, supplierItems]) => ({
        supplier,
        items: sortMagazzinoDocumentItems(supplierItems),
        total: supplierItems.reduce(
          (sum, item) => sum + (parseMagazzinoDocumentAmount(item.totaleDocumento) ?? 0),
          0,
        ),
      }))
      .sort((left, right) => {
        if (right.total !== left.total) {
          return right.total - left.total;
        }

        return left.supplier.localeCompare(right.supplier, "it", {
          sensitivity: "base",
        });
      });
  }, [docItemsFiltrati]);
  const docTotaleGenerale = useMemo(
    () =>
      docItemsFiltrati.reduce(
        (sum, item) => sum + (parseMagazzinoDocumentAmount(item.totaleDocumento) ?? 0),
        0,
      ),
    [docItemsFiltrati],
  );
  const docDaVerificareCount = useMemo(
    () =>
      documentiMagazzinoUiItems.filter(
        (item) => item.daVerificare || docLocalDaVerificareIds.has(item.id),
      ).length,
    [documentiMagazzinoUiItems, docLocalDaVerificareIds],
  );
  const showLegacyDocumentSupport = false;
  const materialiCostItems = (documentiCostiSnapshot?.items ?? [])
    .filter(
      (item) =>
        item.sourceKey === "@documenti_magazzino" &&
        item.sourceType === "documento_magazzino",
    )
    .slice(0, 6);
  const procurementOrders = (procurementSnapshot?.orders ?? []).slice(0, 6);
  const procurementListino = (procurementSnapshot?.listino ?? []).slice(0, 6);
  const magazzinoVehicleLinks = (magazzinoRealeSnapshot?.vehicleLinks ?? []).slice(0, 6);
  const magazzinoSignals = (magazzinoRealeSnapshot?.attentionSignals ?? []).slice(0, 4);
  const dominioLimitazioni = [
    ...(documentiCostiSnapshot?.limitations ?? []),
    ...(procurementSnapshot?.limitations ?? []),
    ...(magazzinoRealeSnapshot?.limitations ?? []),
  ].slice(0, 6);

  const docFornitoriKeys = useMemo(
    () => docPerFornitore.map((g) => g.supplier).join(","),
    [docPerFornitore],
  );

  useEffect(() => {
    if (docPerFornitore.length === 0) {
      return;
    }

    setDocSezioniAperte((prev) => {
      const next = new Set(prev);
      for (const group of docPerFornitore) {
        next.add(group.supplier);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docFornitoriKeys]);

  const mediaGiorni = mediaDurataGiorni(cambi);
  const ultimoCambio = cambi.length ? cambi[cambi.length - 1] : null;
  const capienzaUltimaCisterna = ultimoCambio?.quantitaLitri ?? LITRI_PER_CISTERNA;
  const litriConsumati = litriConsumatiStima(ultimoCambio, mediaGiorni);
  const litriResidui = Math.max(capienzaUltimaCisterna - litriConsumati, 0);
  const percentuale = percentualeConsumata(litriConsumati, capienzaUltimaCisterna);
  const progressColor = coloreProgress(percentuale);
  const giorniPassatiUltimoCambio = ultimoCambio
    ? durataGiorni(ultimoCambio.data, storedToday())
    : 0;
  const consumoMedio = mediaGiorni > 0 ? Math.round(capienzaUltimaCisterna / mediaGiorni) : 0;
  const inventarioTotale = items.length;
  const inventarioSottoSoglia = items.filter(
    (item) => getStockStatus(item) === "basso",
  ).length;
  const inventarioEsauriti = items.filter(
    (item) => getStockStatus(item) === "esaurito",
  ).length;
  const consegneOggi = consegne.filter((item) => item.data === storedToday()).length;
  const destinatariUnici = groupedConsegne.length;
  const storicoAdBlue = [...cambi].sort(
    (left, right) =>
      (parseStoredDate(right.data)?.getTime() ?? 0) -
      (parseStoredDate(left.data)?.getTime() ?? 0),
  );

  function handleModuloChange(nextModulo: ModuloAttivo) {
    navigate(buildNextMagazzinoPath(mapModuloToTab(nextModulo)), { replace: true });
  }

  return (
    <div className="mag-page">
      <div className="mag-shell">
        <div className="mag-module-switcher">
          <button
            type="button"
            className={`mag-mod-btn ${modulo === "inv" ? "active" : ""}`}
            onClick={() => handleModuloChange("inv")}
          >
            Inventario
          </button>
          <button
            type="button"
            className={`mag-mod-btn ${modulo === "mc" ? "active" : ""}`}
            onClick={() => handleModuloChange("mc")}
          >
            Materiali consegnati
          </button>
          <button
            type="button"
            className={`mag-mod-btn ${modulo === "adblue" ? "active" : ""}`}
            onClick={() => handleModuloChange("adblue")}
          >
            Cisterne AdBlue
          </button>
          <button
            type="button"
            className={`mag-mod-btn ${modulo === "docs" ? "active" : ""}`}
            onClick={() => handleModuloChange("docs")}
          >
            Documenti e costi
          </button>
        </div>

        <header className="mag-head">
          <div>
            <span className="mag-eyebrow">Magazzino</span>
            <h1 className="mag-title">
              {modulo === "inv"
                ? "Inventario"
                : modulo === "mc"
                ? "Materiali consegnati"
                : modulo === "adblue"
                  ? "Cisterne AdBlue"
                  : "Documenti e costi"}
            </h1>
          </div>
          <div className="mag-head-actions">
            <button type="button" className="mag-btn" onClick={() => navigate("/next")}>
              Home NEXT
            </button>
            <button
              type="button"
              className="mag-btn mag-btn--primary"
              onClick={() => void loadPageData()}
              disabled={loading || saving}
            >
              {loading ? "Aggiorno..." : "Aggiorna dati"}
            </button>
          </div>
        </header>

        {notice ? <div className="mag-notice">{notice}</div> : null}
        {error ? <div className="mag-error">{error}</div> : null}
        <datalist id="mag-fornitori-list">
          {fornitori.map((fornitore) => (
            <option key={fornitore} value={fornitore} />
          ))}
        </datalist>

        {loading ? <div className="mag-empty">Caricamento dati magazzino in corso...</div> : null}

        {!loading && modulo === "inv" ? (
          <>
            <section className="mag-kpis">
              <article className="mag-kpi">
                <div className="mag-kpi__label">Articoli totali</div>
                <div className="mag-kpi__value">{inventarioTotale}</div>
                <div className="mag-kpi__sub">in magazzino</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Sotto soglia</div>
                <div className="mag-kpi__value">{inventarioSottoSoglia}</div>
                <div className="mag-kpi__sub">da riordinare</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Esauriti</div>
                <div className="mag-kpi__value">{inventarioEsauriti}</div>
                <div className="mag-kpi__sub">stock zero</div>
              </article>
            </section>

            <nav className="mag-tabs">
              <button
                type="button"
                className={`mag-tab ${inventarioTab === "magazzino" ? "active" : ""}`}
                onClick={() => setInventarioTab("magazzino")}
              >
                Magazzino
              </button>
              <button
                type="button"
                className={`mag-tab ${inventarioTab === "aggiungi" ? "active" : ""}`}
                onClick={() => setInventarioTab("aggiungi")}
              >
                Aggiungi articolo
              </button>
            </nav>

            {inventarioTab === "magazzino" ? (
              <>
                <div className="mag-toolbar">
                  <input
                    className="mag-toolbar__input"
                    value={searchInv}
                    onChange={(event) => setSearchInv(event.target.value)}
                    placeholder="Cerca descrizione o fornitore"
                  />
                  <select
                    className="mag-toolbar__input"
                    value={filterFornitore}
                    onChange={(event) => setFilterFornitore(event.target.value)}
                  >
                    <option value="">Tutti i fornitori</option>
                    {fornitori.map((fornitore) => (
                      <option key={fornitore} value={fornitore}>
                        {fornitore}
                      </option>
                    ))}
                  </select>
                  <select
                    className="mag-toolbar__input"
                    value={filterStock}
                    onChange={(event) => setFilterStock(event.target.value as "" | StockStatus)}
                  >
                    <option value="">Tutto lo stock</option>
                    <option value="ok">Disponibile</option>
                    <option value="basso">Sotto soglia</option>
                    <option value="esaurito">Esaurito</option>
                  </select>
                </div>

                {inventarioFiltrato.length === 0 ? (
                  <div className="mag-empty">Nessun articolo trovato.</div>
                ) : (
                  <div className="mag-list">
                    {inventarioFiltrato.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <article
                          key={item.id}
                          className={`mag-item ${stockStatus === "esaurito" ? "esaurito" : ""}`}
                        >
                          <div className="mag-item__row1">
                            <div className="mag-item__photo">
                              {item.fotoUrl ? (
                                <img
                                  src={item.fotoUrl}
                                  alt={item.descrizione}
                                  className="mag-item__photo-img"
                                />
                              ) : (
                                <span className="mag-item__photo-placeholder">IMG</span>
                              )}
                            </div>
                            <div className="mag-item__title">{item.descrizione}</div>
                            <span className={`mag-badge mag-badge--${stockStatus}`}>
                              {stockStatus === "ok"
                                ? "Disponibile"
                                : stockStatus === "basso"
                                ? "Sotto soglia"
                                : "Esaurito"}
                            </span>
                          </div>
                          <div className="mag-item__row2">
                            <div className="mag-item__meta">
                              {item.fornitore || "Fornitore non indicato"} · {item.unita}
                              {!hasSupportedUnit(item.unita) ? " · unita da verificare" : ""}
                              {typeof item.sogliaMinima === "number"
                                ? ` · soglia ${formatNumber(item.sogliaMinima)}`
                                : ""}
                            </div>
                            <div className="mag-qty">
                              <button
                                type="button"
                                className="mag-qty__btn"
                                onClick={() => void handleDeltaQuantita(item.id, -1)}
                                disabled={saving || !hasSupportedUnit(item.unita)}
                              >
                                −
                              </button>
                              <input
                                className="mag-qty__input"
                                value={String(item.quantita)}
                                onChange={(event) =>
                                  void handleDirectQuantita(item.id, event.target.value)
                                }
                                disabled={!hasSupportedUnit(item.unita)}
                              />
                              <button
                                type="button"
                                className="mag-qty__btn"
                                onClick={() => void handleDeltaQuantita(item.id, 1)}
                                disabled={saving || !hasSupportedUnit(item.unita)}
                              >
                                +
                              </button>
                            </div>
                            <div className="mag-row-actions">
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm"
                                onClick={() => {
                                  setEditFotoFile(null);
                                  setEditingItem({ ...item });
                                }}
                              >
                                Modifica
                              </button>
                              {pendingDeleteItemId === item.id ? (
                                <div className="mag-inline-confirm">
                                  <button
                                    type="button"
                                    className="mag-btn mag-btn--sm mag-btn--danger"
                                    onClick={() => void handleDeleteInventario(item.id)}
                                  >
                                    Conferma
                                  </button>
                                  <button
                                    type="button"
                                    className="mag-btn mag-btn--sm"
                                    onClick={() => setPendingDeleteItemId(null)}
                                  >
                                    Annulla
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="mag-btn mag-btn--sm mag-btn--danger"
                                  onClick={() => setPendingDeleteItemId(item.id)}
                                >
                                  Elimina
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="mag-form-panel">
                <div className="mag-form-title">Aggiungi articolo</div>
                <div className="mag-field">
                  <label className="mag-field__label">Descrizione</label>
                  <input
                    className="mag-field__input"
                    value={newDescrizione}
                    onChange={(event) => setNewDescrizione(event.target.value)}
                  />
                </div>
                <div className="mag-field">
                  <label className="mag-field__label">Fornitore</label>
                  <input
                    className="mag-field__input"
                    list="mag-fornitori-list"
                    value={newFornitore}
                    onChange={(event) => setNewFornitore(event.target.value)}
                  />
                </div>
                <div className="mag-field-row">
                  <div className="mag-field">
                    <label className="mag-field__label">Quantita</label>
                    <input
                      className="mag-field__input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newQuantita}
                      onChange={(event) => setNewQuantita(event.target.value)}
                    />
                  </div>
                  <div className="mag-field">
                    <label className="mag-field__label">Unita</label>
                    <select
                      className="mag-field__input"
                      value={newUnita}
                      onChange={(event) => setNewUnita(event.target.value as UnitaMagazzino)}
                    >
                      {unitaOptions.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                    <div className="mag-field__hint">Unita ammesse: pz, lt, kg, mt.</div>
                  </div>
                </div>
                <div className="mag-field">
                  <label className="mag-field__label">Soglia minima riordino</label>
                  <input
                    className="mag-field__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSogliaMinima}
                    onChange={(event) => setNewSogliaMinima(event.target.value)}
                  />
                  <div className="mag-field__hint">
                    Sotto questa quantita l'articolo appare in giallo.
                  </div>
                </div>
                <div className="mag-field">
                  <label className="mag-field__label">Foto</label>
                  <input
                    className="mag-field__input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleSelectFoto(event, "new")}
                  />
                </div>
                <button
                  type="button"
                  className="mag-btn mag-btn--primary mag-btn--full"
                  onClick={() => void handleAddInventario()}
                  disabled={saving}
                >
                  {saving ? "Salvo..." : "Aggiungi al magazzino"}
                </button>
              </div>
            )}
          </>
        ) : null}

        {!loading && modulo === "mc" ? (
          <>
            <section className="mag-kpis">
              <article className="mag-kpi">
                <div className="mag-kpi__label">Consegne totali</div>
                <div className="mag-kpi__value">{consegne.length}</div>
                <div className="mag-kpi__sub">registrate</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Consegne oggi</div>
                <div className="mag-kpi__value">{consegneOggi}</div>
                <div className="mag-kpi__sub">data odierna</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Destinatari unici</div>
                <div className="mag-kpi__value">{destinatariUnici}</div>
                <div className="mag-kpi__sub">attivi</div>
              </article>
            </section>

            <nav className="mag-tabs">
              <button
                type="button"
                className={`mag-tab ${materialiTab === "storico" ? "active" : ""}`}
                onClick={() => setMaterialiTab("storico")}
              >
                Storico consegne
              </button>
              <button
                type="button"
                className={`mag-tab ${materialiTab === "nuova" ? "active" : ""}`}
                onClick={() => setMaterialiTab("nuova")}
              >
                Nuova consegna
              </button>
            </nav>

            {materialiTab === "storico" ? (
              <>
                <div className="mag-toolbar">
                  <input
                    className="mag-toolbar__input"
                    value={searchMc}
                    onChange={(event) => setSearchMc(event.target.value)}
                    placeholder="Cerca destinatario o materiale"
                  />
                  <select
                    className="mag-toolbar__input"
                    value={filterTipo}
                    onChange={(event) => setFilterTipo(event.target.value as "" | DestinatarioType)}
                  >
                    <option value="">Tutti i tipi</option>
                    <option value="MEZZO">Mezzo</option>
                    <option value="COLLEGA">Collega</option>
                    <option value="MAGAZZINO">Magazzino</option>
                  </select>
                </div>

                {groupedConsegne.length === 0 ? (
                  <div className="mag-empty">Nessuna consegna trovata.</div>
                ) : (
                  groupedConsegne.map((group) => (
                    <div key={group.groupId} className="mag-movement">
                      <div className="mag-movement__head">
                        <span className={buildDestBadgeClass(group.destinatario.type)}>
                          {buildDestinatarioLabel(group.destinatario.type)}
                        </span>
                        <span className="mag-movement__dest">{group.destinatario.label}</span>
                        <span className="mag-movement__tot">
                          Tot: {buildGroupedTotalLabel(group.items)}
                        </span>
                        {group.dossierTarga ? (
                          <button
                            type="button"
                            className="mag-btn mag-btn--sm"
                            onClick={() => navigate(buildNextDossierPath(group.dossierTarga!))}
                          >
                            Apri dossier
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="mag-movement__toggle"
                          onClick={() => toggleGroup(group.groupId)}
                        >
                          {openGroups.includes(group.groupId) ? "Chiudi ▲" : "Dettaglio ▼"}
                        </button>
                      </div>
                      {openGroups.includes(group.groupId) ? (
                        <div className="mag-movement__body">
                          {group.items.map((consegna) => (
                            <div key={consegna.id} className="mag-movement__row">
                              <span className="mag-movement__row-date">
                                {formatStoredDateForUi(consegna.data)}
                              </span>
                              <span className="mag-movement__row-desc">
                                {consegna.descrizione}
                              </span>
                              <span className="mag-movement__row-qty">
                                {formatQuantita(consegna.quantita, consegna.unita)}
                              </span>
                              <span className="mag-movement__row-motivo">
                                {consegna.motivo || "—"}
                              </span>
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm mag-btn--danger"
                                onClick={() => void handleDeleteConsegna(consegna)}
                              >
                                Elimina
                              </button>
                              {warningDelete?.consegna.id === consegna.id ? (
                                <div className="mag-inline-warning">
                                  <div className="mag-warning">{warningDelete.messaggio}</div>
                                  <div className="mag-inline-confirm">
                                    <button
                                      type="button"
                                      className="mag-btn mag-btn--sm mag-btn--danger"
                                      onClick={() => void eseguiDeleteConsegna(consegna)}
                                    >
                                      Continua
                                    </button>
                                    <button
                                      type="button"
                                      className="mag-btn mag-btn--sm"
                                      onClick={() => setWarningDelete(null)}
                                    >
                                      Annulla
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="mag-form-panel">
                <div className="mag-form-title">Nuova consegna</div>
                <div className="mag-field">
                  <label className="mag-field__label">Destinatario</label>
                  {destinatarioObj ? (
                    <div className="mag-field__selected">
                      <span className={buildDestBadgeClass(destinatarioObj.type)}>
                        {buildDestinatarioLabel(destinatarioObj.type)}
                      </span>
                      <span>{destinatarioObj.label}</span>
                      <button
                        type="button"
                        className="mag-btn mag-btn--sm"
                        onClick={resetDestinatarioSelection}
                      >
                        Cambia
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        className="mag-field__input"
                        value={destinatarioInput}
                        onChange={(event) => setDestinatarioInput(event.target.value)}
                        placeholder="Cerca mezzo, collega o MAGAZZINO"
                      />
                      {destinatarioSuggestions.length ? (
                        <div className="mag-suggestions">
                          {destinatarioSuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.type}-${suggestion.refId}`}
                              type="button"
                              className="mag-suggestion"
                              onClick={() => handleSelectDestinatario(suggestion)}
                            >
                              <span>{suggestion.label}</span>
                              <span>{suggestion.extra}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="mag-field">
                  <label className="mag-field__label">Materiale</label>
                  {materialeSelezionato ? (
                    <>
                      <div className="mag-field__selected">
                        <span>{materialeSelezionato.descrizione}</span>
                        <button
                          type="button"
                          className="mag-btn mag-btn--sm"
                          onClick={resetMaterialeSelection}
                        >
                          Cambia
                        </button>
                      </div>
                      <div className="mag-warning">
                        Disponibili:{" "}
                        {formatQuantita(materialeSelezionato.quantita, materialeSelezionato.unita)}
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        className="mag-field__input"
                        value={materialeInput}
                        onChange={(event) => setMaterialeInput(event.target.value)}
                        placeholder="Cerca materiale in magazzino"
                      />
                      {materialeSuggestions.length ? (
                        <div className="mag-suggestions">
                          {materialeSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              className="mag-suggestion"
                              onClick={() => handleSelectMateriale(suggestion)}
                            >
                              <span>{suggestion.label}</span>
                              <span>{formatQuantita(suggestion.quantita, suggestion.unita)}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="mag-field-row">
                  <div className="mag-field">
                    <label className="mag-field__label">Quantita</label>
                    <input
                      className="mag-field__input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantita}
                      onChange={(event) => setQuantita(event.target.value)}
                    />
                    {materialeSelezionato &&
                    normalizeNumber(quantita) !== null &&
                    normalizeNumber(quantita)! > materialeSelezionato.quantita ? (
                      <div className="mag-error">Quantita superiore alla disponibilita.</div>
                    ) : null}
                  </div>
                  <div className="mag-field">
                    <label className="mag-field__label">Unita</label>
                    <input
                      className="mag-field__input"
                      value={materialeSelezionato?.unita ?? ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="mag-field">
                  <label className="mag-field__label">Motivo</label>
                  <input
                    className="mag-field__input"
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                  />
                </div>

                <div className="mag-field">
                  <label className="mag-field__label">Data consegna</label>
                  <input
                    className="mag-field__input"
                    type="date"
                    value={dataConsegna}
                    onChange={(event) => setDataConsegna(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="mag-btn mag-btn--primary mag-btn--full"
                  onClick={() => void handleAddConsegna()}
                  disabled={saving}
                >
                  {saving ? "Salvo..." : "Registra consegna"}
                </button>
              </div>
            )}
          </>
        ) : null}
        {!loading && modulo === "adblue" ? (
          <>
            <section className="mag-kpis">
              <article className="mag-kpi">
                <div className="mag-kpi__label">Media durata cisterna</div>
                <div className="mag-kpi__value">{mediaGiorni || "—"}</div>
                <div className="mag-kpi__sub">ultimi {N_CAMBI_MEDIA} cambi</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Consumo medio</div>
                <div className="mag-kpi__value">{consumoMedio || "—"}</div>
                <div className="mag-kpi__sub">lt/gg</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Cambi registrati</div>
                <div className="mag-kpi__value">{cambi.length}</div>
                <div className="mag-kpi__sub">dal primo inserimento</div>
              </article>
            </section>

            <nav className="mag-tabs">
              <button
                type="button"
                className={`mag-tab ${adBlueTab === "stato" ? "active" : ""}`}
                onClick={() => setAdBlueTab("stato")}
              >
                Stato attuale
              </button>
              <button
                type="button"
                className={`mag-tab ${adBlueTab === "storico" ? "active" : ""}`}
                onClick={() => setAdBlueTab("storico")}
              >
                Storico cambi
              </button>
              <button
                type="button"
                className={`mag-tab ${adBlueTab === "registra" ? "active" : ""}`}
                onClick={() => setAdBlueTab("registra")}
              >
                Registra cambio
              </button>
            </nav>

            {adBlueTab === "stato" ? (
              <div className="mag-cis-grid">
                <div className="mag-cis-card">
                  <div className="mag-cis-card__title">Cisterna attiva</div>
                  {ultimoCambio ? (
                    <>
                      <div className="mag-cis-card__header">
                        <div className="mag-cis-card__name">
                          {ultimoCambio.numeroCisterna
                            ? `Cisterna ${ultimoCambio.numeroCisterna}`
                            : "Cisterna attiva"}
                        </div>
                        <span
                          className={`mag-badge ${
                            percentuale < 60
                              ? "mag-badge--ok"
                              : percentuale < 85
                              ? "mag-badge--basso"
                              : "mag-badge--esaurito"
                          }`}
                        >
                          {percentuale < 60
                            ? "Regolare"
                            : percentuale < 85
                            ? "In consumo"
                            : "Quasi esaurita"}
                        </span>
                      </div>
                      <div className="mag-cis-card__sub">
                        Avviata il {formatStoredDateForUi(ultimoCambio.data)} ·{" "}
                        {giorniPassatiUltimoCambio} giorni fa
                      </div>
                      <div className="mag-progress">
                        <div
                          className={`mag-progress__fill mag-progress__fill--${progressColor}`}
                          style={{ width: `${Math.min(percentuale, 100)}%` }}
                        />
                      </div>
                      <div className="mag-progress__labels">
                        <span>~{litriConsumati} lt consumati</span>
                        <span>~{litriResidui} lt rimasti</span>
                      </div>
                      <div className="mag-cis-card__footer">
                        Carico registrato: {ultimoCambio.quantitaLitri ?? LITRI_PER_CISTERNA} lt
                      </div>
                      <div className="mag-cis-card__footer">
                        Stima fine: {stimaDataFine(ultimoCambio, mediaGiorni)}{" "}
                        {mediaGiorni > 0
                          ? `(tra ${Math.max(mediaGiorni - giorniPassatiUltimoCambio, 0)} giorni)`
                          : ""}
                      </div>
                    </>
                  ) : (
                    <div className="mag-empty">Nessun cambio cisterna registrato.</div>
                  )}
                </div>

                <div className="mag-cis-card">
                  <div className="mag-cis-card__title">Come funziona il calcolo</div>
                  <div className="mag-calc-copy">
                    La stima usa una media mobile sugli ultimi {N_CAMBI_MEDIA} intervalli
                    disponibili. La cisterna attiva usa i litri registrati nel cambio e il
                    consumo giornaliero viene ricavato dividendo quella quantita per la
                    durata media.
                  </div>
                  <div className="mag-calc-stats">
                    <div>Ultimo cambio: {formatStoredDateForUi(ultimoCambio?.data)}</div>
                    <div>Litri ultimo cambio: {ultimoCambio?.quantitaLitri ?? "â€”"}</div>
                    <div>Durata media prevista: {mediaGiorni || "—"} giorni</div>
                    <div>Giorni trascorsi: {ultimoCambio ? giorniPassatiUltimoCambio : "—"}</div>
                    <div>Consumo medio: {consumoMedio || "—"} lt/gg</div>
                  </div>
                </div>
              </div>
            ) : null}

            {adBlueTab === "storico" ? (
              <div className="mag-log-panel">
                <div className="mag-log-row mag-log-row--head">
                  <span className="mag-log-row__date">Data cambio</span>
                  <span className="mag-log-row__cisterna">Cisterna</span>
                  <span className="mag-log-row__durata">Durata</span>
                  <span className="mag-log-row__ltgg">Consumo/gg</span>
                </div>
                {storicoAdBlue.length === 0 ? (
                  <div className="mag-empty">Nessun cambio cisterna registrato.</div>
                ) : (
                  storicoAdBlue.map((cambio, index) => {
                    const sortedAsc = [...cambi].sort(
                      (left, right) =>
                        (parseStoredDate(left.data)?.getTime() ?? 0) -
                        (parseStoredDate(right.data)?.getTime() ?? 0),
                    );
                    const ascIndex = sortedAsc.findIndex((entry) => entry.id === cambio.id);
                    const nextEntry = ascIndex >= 0 ? sortedAsc[ascIndex + 1] : null;
                    const durata = nextEntry ? durataGiorni(cambio.data, nextEntry.data) : null;
                    const consumo =
                      durata && durata > 0
                        ? Math.round((cambio.quantitaLitri ?? LITRI_PER_CISTERNA) / durata)
                        : null;

                    return (
                      <div key={cambio.id} className="mag-log-row">
                        <span className="mag-log-row__date">
                          {formatStoredDateForUi(cambio.data)}
                        </span>
                        <span className="mag-log-row__cisterna">
                          {cambio.numeroCisterna || "Cisterna"} ·{" "}
                          {cambio.quantitaLitri ?? LITRI_PER_CISTERNA} lt
                          {cambio.note ? (
                            <span className="mag-log-row__note">{cambio.note}</span>
                          ) : null}
                        </span>
                        <span className="mag-log-row__durata">
                          {index === 0 ? "—" : durata ? `${durata} gg` : "—"}
                        </span>
                        <span className="mag-log-row__ltgg">
                          {index === 0 ? "—" : consumo ? `${consumo} lt/gg` : "—"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}

            {adBlueTab === "registra" ? (
              <div className="mag-form-panel">
                <div className="mag-form-title">Registra cambio cisterna</div>
                <div className="mag-field-row">
                  <div className="mag-field">
                    <label className="mag-field__label">Data cambio</label>
                    <input
                      className="mag-field__input"
                      type="date"
                      value={dataCambio}
                      onChange={(event) => setDataCambio(event.target.value)}
                    />
                  </div>
                  <div className="mag-field">
                    <label className="mag-field__label">Numero cisterna</label>
                    <input
                      className="mag-field__input"
                      value={numeroCisterna}
                      onChange={(event) => setNumeroCisterna(event.target.value)}
                    />
                    <div className="mag-field__hint">Solo per tracciabilita.</div>
                  </div>
                </div>
                <div className="mag-field-row">
                  <div className="mag-field">
                    <label className="mag-field__label">Litri scaricati</label>
                    <input
                      className="mag-field__input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantitaCambioLitri}
                      onChange={(event) => setQuantitaCambioLitri(event.target.value)}
                    />
                    <div className="mag-field__hint">
                      Il cambio cisterna scarica questi litri da `@inventario`.
                    </div>
                  </div>
                  <div className="mag-field">
                    <label className="mag-field__label">Articolo AdBlue inventario</label>
                    <select
                      className="mag-field__input"
                      value={adBlueInventarioRefId}
                      onChange={(event) => setAdBlueInventarioRefId(event.target.value)}
                    >
                      <option value="">Seleziona articolo</option>
                      {adBlueInventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.descrizione} · {formatQuantita(item.quantita, item.unita)}
                        </option>
                      ))}
                    </select>
                    <div className="mag-field__hint">
                      Se l'articolo AdBlue non esiste ancora, caricalo prima in inventario con unita `lt`.
                    </div>
                  </div>
                </div>
                <div className="mag-field">
                  <label className="mag-field__label">Note</label>
                  <input
                    className="mag-field__input"
                    value={noteAdblue}
                    onChange={(event) => setNoteAdblue(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="mag-btn mag-btn--primary mag-btn--full"
                  onClick={() => void handleRegistraCambio()}
                  disabled={saving}
                >
                  {saving ? "Salvo..." : "Registra cambio cisterna"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {!loading && modulo === "docs" ? (
          <>
            <section className="doc-costi-page">
              <header className="doc-costi-header">
                <h2 className="doc-costi-title">Documenti e costi</h2>
                <span className="doc-costi-stat">
                  <b>{docItemsFiltrati.length}</b> doc
                </span>
                <span className="doc-costi-stat">
                  <b>{docPerFornitore.length}</b> fornitori
                </span>
                <span className="doc-costi-stat">
                  <b>{formatMagazzinoDocumentCompactAmount(docTotaleGenerale)}</b>
                </span>
                <span className="doc-costi-stat">
                  <b>{docDaVerificareCount}</b> da verificare
                </span>
                <span className="doc-costi-stat">
                  <b>{magazzinoRealeSnapshot?.counts.vehicleLinksStrong ?? 0}</b> link forti
                </span>
              </header>

              <div className="doc-costi-filters">
                {MAGAZZINO_DOC_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`doc-costi-filter ${docFiltroAttivo === filter.id ? "is-active" : ""}`}
                    onClick={() => setDocFiltroAttivo(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
                <input
                  type="search"
                  className="doc-costi-search"
                  placeholder="Cerca fornitore, targa, importo"
                  value={docSearchQuery}
                  onChange={(event) => setDocSearchQuery(event.target.value)}
                />
              </div>

              {docPerFornitore.length === 0 ? (
                <div className="doc-costi-empty">
                  {docFiltroAttivo === "tutti" && !docSearchQuery
                    ? "Nessun documento Magazzino leggibile nel perimetro reale."
                    : "Nessun documento corrisponde ai filtri attivi."}
                </div>
              ) : (
                docPerFornitore.map((group) => {
                  const isOpen = docSezioniAperte.has(group.supplier);
                  return (
                    <section key={group.supplier} className="doc-costi-fornitore">
                      <button
                        type="button"
                        className="doc-costi-fornitore-header"
                        onClick={() =>
                          setDocSezioniAperte((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.supplier)) {
                              next.delete(group.supplier);
                            } else {
                              next.add(group.supplier);
                            }
                            return next;
                          })
                        }
                      >
                        <span
                          className={`doc-costi-fornitore-chevron ${isOpen ? "is-open" : ""}`}
                          aria-hidden="true"
                        >
                          &gt;
                        </span>
                        <span className="doc-costi-fornitore-name">{group.supplier}</span>
                        <span className="doc-costi-stat">
                          <b>{group.items.length}</b> doc
                        </span>
                        <span className="doc-costi-fornitore-total">
                          Totale {formatMagazzinoDocumentCompactAmount(group.total)}
                        </span>
                      </button>

                      {isOpen ? (
                        <>
                          <table className="doc-costi-table">
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Data</th>
                                <th>Numero</th>
                                <th>Targa</th>
                                <th>Descr.</th>
                                <th className="is-right">EUR</th>
                                <th>Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item) => {
                                const isReviewItem =
                                  item.daVerificare || docLocalDaVerificareIds.has(item.id);
                                return (
                                  <tr key={item.id} onClick={() => setDocModalItem(item)}>
                                    <td>
                                      <span
                                        className={`doc-costi-badge ${getMagazzinoBadgeClass(item)}`}
                                      >
                                        {getMagazzinoKindLabel(item)}
                                      </span>
                                    </td>
                                    <td>{formatStoredDateForUi(item.dataDocumento)}</td>
                                    <td>{normalizeText(item.numeroDocumento) || "-"}</td>
                                    <td>
                                      {normalizeText(item.targa) ? (
                                        <span className="doc-costi-targa">
                                          {normalizeText(item.targa)}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                    <td>{item.descrizione}</td>
                                    <td className="doc-costi-importo">
                                      {formatDocumentAmount(item.totaleDocumento, item.currency)}
                                      {normalizeText(item.currency) ? (
                                        <span className="doc-costi-valuta">
                                          {normalizeText(item.currency)}
                                        </span>
                                      ) : null}
                                    </td>
                                    <td>
                                      <div className="doc-costi-actions">
                                        <button
                                          type="button"
                                          className="doc-costi-btn"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            if (!item.fileUrl) return;
                                            window.open(item.fileUrl, "_blank", "noopener,noreferrer");
                                          }}
                                          disabled={!item.fileUrl}
                                        >
                                          PDF
                                        </button>
                                        <button
                                          type="button"
                                          className="doc-costi-btn-ia"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(NEXT_INTERNAL_AI_PATH, {
                                              state: { initialPrompt: buildMagazzinoAskAiPrompt(item) },
                                            });
                                          }}
                                        >
                                          Chiedi alla IA
                                        </button>
                                      </div>
                                      {isReviewItem ? (
                                        <span className="doc-costi-row-flag">Da verificare</span>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="doc-costi-section-total">
                            <span className="doc-costi-stat">Totale {group.supplier}</span>
                            <span className="doc-costi-fornitore-total">
                              {formatMagazzinoDocumentCompactAmount(group.total)}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </section>
                  );
                })
              )}

              <footer className="doc-costi-footer">
                <span className="doc-costi-stat">Totale generale tutti i fornitori</span>
                <span className="doc-costi-fornitore-total">
                  {formatMagazzinoDocumentCompactAmount(docTotaleGenerale)}
                </span>
              </footer>
            </section>

            {showLegacyDocumentSupport ? (
              <div className="mag-domain-grid">
              <section className="mag-form-panel">
                <div className="mag-form-title">Supporto operativo Magazzino</div>
                <div className="mag-domain-copy">
                  La vista principale sopra segue il linguaggio `Documenti e costi` solo sul
                  perimetro Magazzino. Qui sotto restano i supporti operativi gia presenti
                  collegati ai documenti materiali e agli arrivi procurement.
                </div>
                <div className="mag-domain-sublist">
                  <div className="mag-domain-subtitle">Carichi stock da arrivi procurement</div>
                  <div className="mag-domain-note">
                    Ordini e arrivi restano superfici di supporto/read-only nel procurement
                    NEXT. Il writer stock canonico degli arrivi e qui: ogni riga arrivata puo
                    essere consolidata in inventario solo dentro `Magazzino`, con deduplica
                    prudente contro documenti gia caricati e contro le sorgenti gia consolidate.
                  </div>
                  <div className="mag-domain-metrics">
                    <span className="mag-domain-chip">
                      Righe arrivate: {procurementStockCandidates.length}
                    </span>
                    <span className="mag-domain-chip">
                      Pronte: {procurementStockCandidates.filter((item) => item.canLoad).length}
                    </span>
                    <span className="mag-domain-chip">
                      Bloccate:{" "}
                      {procurementStockCandidates.filter((item) => !item.canLoad).length}
                    </span>
                  </div>
                  {procurementStockCandidates.length === 0 ? (
                    <div className="mag-empty mag-empty--compact">
                      Nessun arrivo procurement pronto per il contratto stock.
                    </div>
                  ) : (
                    <div className="mag-domain-list">
                      {procurementStockCandidates.slice(0, 8).map((candidate) => (
                        <div key={candidate.id} className="mag-domain-row">
                          <div className="mag-domain-row__main">
                            <div className="mag-domain-row__title">
                              {candidate.descrizione}
                              {" · "}
                              {candidate.orderReference}
                            </div>
                            <div className="mag-domain-row__meta">
                              {candidate.fornitore || "Fornitore non indicato"} ·{" "}
                              {candidate.quantita !== null
                                ? formatNumber(candidate.quantita)
                                : "-"}{" "}
                              {candidate.unita || "unita da definire"} ·{" "}
                              {formatStoredDateForUi(candidate.data)}
                            </div>
                            <div className="mag-domain-note">
                              {candidate.documentCoverageReason
                                ? candidate.documentCoverageReason
                                : candidate.inventoryMatchId
                                  ? "Consolida sulla voce inventario esistente."
                                  : "Crea una nuova voce inventario."}
                              {" · "}
                              {candidate.canLoad
                                ? `Unita ${candidate.unita} (${candidate.unitaSource}).`
                                : candidate.blockedReason || "Da verificare."}
                            </div>
                          </div>
                          <div className="mag-domain-linkbar">
                            <span className="mag-domain-chip">
                              Unita {candidate.unita || "-"} · {candidate.unitaSource}
                            </span>
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() => void handleCaricaArrivoInInventario(candidate.id)}
                              disabled={
                                saving ||
                                procurementImportingId === candidate.id ||
                                !candidate.canLoad
                              }
                            >
                              {procurementImportingId === candidate.id
                                ? "Carico..."
                                : candidate.inventoryMatchId
                                  ? "Consolida stock"
                                  : "Carica in inventario"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mag-domain-sublist">
                  <div className="mag-domain-subtitle">
                    Azione controllata IA su fattura magazzino
                  </div>
                  <div className="mag-domain-note">
                    La IA interna puo proporre solo due azioni scriventi nel dominio
                    documentale: riconciliare una fattura gia coperta da arrivo/materiale
                    esistente, oppure caricare stock AdBlue non ancora consolidato.
                    Tutto il resto resta bloccato o `DA VERIFICARE`.
                  </div>
                  {iaWarehouseDocumentAction === null ? (
                    <div className="mag-empty mag-empty--compact">
                      Nessun handoff IA fattura attivo su questa vista.
                    </div>
                  ) : iaWarehouseDocumentAction.candidate ? (
                    <div className="mag-domain-list">
                      <div className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {iaWarehouseDocumentAction.candidate.descrizione}
                          </div>
                          <div className="mag-domain-row__meta">
                            {iaWarehouseDocumentAction.candidate.documentLabel} ·{" "}
                            {iaWarehouseDocumentAction.candidate.fornitore ||
                              "Fornitore non indicato"}{" "}
                            ·{" "}
                            {iaWarehouseDocumentAction.candidate.quantita !== null
                              ? formatNumber(iaWarehouseDocumentAction.candidate.quantita)
                              : "-"}{" "}
                            {iaWarehouseDocumentAction.candidate.unita || "unita da definire"}
                          </div>
                          <div className="mag-domain-note">
                            {iaWarehouseDocumentAction.message}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          <span className="mag-domain-chip">
                            Decisione IA:{" "}
                            {iaWarehouseDocumentAction.candidate.decision ===
                            "riconcilia_senza_carico"
                              ? "riconcilia senza carico"
                              : iaWarehouseDocumentAction.candidate.decision ===
                                  "carica_stock_adblue"
                                ? "carica stock AdBlue"
                                : "da verificare"}
                          </span>
                          {iaWarehouseDocumentAction.candidate.canReconcileWithoutLoad ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() =>
                                void handleRiconciliaDocumentoSenzaCarico(
                                  iaWarehouseDocumentAction.candidate.id,
                                )
                              }
                              disabled={
                                saving ||
                                documentoImportingId ===
                                  iaWarehouseDocumentAction.candidate.id
                              }
                            >
                              {documentoImportingId ===
                              iaWarehouseDocumentAction.candidate.id
                                ? "Riconcilio..."
                                : "Riconcilia senza carico"}
                            </button>
                          ) : iaWarehouseDocumentAction.candidate.canLoad ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() =>
                                void handleCaricaDocumentoInInventario(
                                  iaWarehouseDocumentAction.candidate.id,
                                )
                              }
                              disabled={
                                saving ||
                                documentoImportingId ===
                                  iaWarehouseDocumentAction.candidate.id
                              }
                            >
                              {documentoImportingId ===
                              iaWarehouseDocumentAction.candidate.id
                                ? "Carico..."
                                : "Carica stock AdBlue"}
                            </button>
                          ) : (
                            <span className="mag-domain-chip">DA VERIFICARE</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mag-empty mag-empty--compact">
                      {iaWarehouseDocumentAction.message}
                    </div>
                  )}
                </div>
                <div className="mag-domain-sublist">
                  <div className="mag-domain-subtitle">Carichi stock da documenti</div>
                  <div className="mag-domain-note">
                    Le righe `@documenti_magazzino.voci` non aprono piu un writer generico.
                    Nel perimetro controllato possono solo:
                    riconciliare senza carico una fattura gia coperta da arrivo/materiale
                    esistente, oppure caricare stock AdBlue con UDM `lt`, match forte e
                    anti-doppio-carico.
                  </div>
                  <div className="mag-domain-metrics">
                    <span className="mag-domain-chip">
                      Righe supporto: {documentoStockCandidates.length}
                    </span>
                    <span className="mag-domain-chip">
                      Pronte: {documentoReadyCount}
                    </span>
                    <span className="mag-domain-chip">
                      Bloccate: {documentoStockCandidates.length - documentoReadyCount}
                    </span>
                  </div>
                  {documentoStockCandidates.length === 0 ? (
                    <div className="mag-empty mag-empty--compact">
                      Nessuna riga documento pronta per il contratto stock.
                    </div>
                  ) : (
                    <div className="mag-domain-list">
                      {documentoStockCandidates.slice(0, 8).map((candidate) => (
                        <div key={candidate.id} className="mag-domain-row">
                          <div className="mag-domain-row__main">
                            <div className="mag-domain-row__title">{candidate.descrizione}</div>
                            <div className="mag-domain-row__meta">
                              {candidate.fornitore || "Fornitore non indicato"} ·{" "}
                              {candidate.quantita !== null ? formatNumber(candidate.quantita) : "-"}{" "}
                              {candidate.unita || "unità da definire"} ·{" "}
                              {formatStoredDateForUi(candidate.data)}
                            </div>
                            <div className="mag-domain-note">
                              {candidate.procurementCoverageReason
                                ? candidate.procurementCoverageReason
                                : candidate.inventoryMatchId
                                  ? "Voce inventario esistente rilevata."
                                  : "Nessuna voce inventario compatibile gia presente."}
                              {" · "}
                              {candidate.canReconcileWithoutLoad
                                ? "Caso MARIBA: riconcilia senza aumentare lo stock."
                                : candidate.canLoad
                                  ? "Caso AdBlue: aumenta la giacenza inventario."
                                  : candidate.blockedReason || "Da verificare."}
                            </div>
                          </div>
                          <div className="mag-domain-linkbar">
                            {candidate.unitaSource === "missing" ? (
                              <select
                                className="mag-field__input mag-field__input--inline"
                                value={documentoManualUnits[candidate.id] ?? ""}
                                onChange={(event) =>
                                  handleDocumentoUnitChange(candidate.id, event.target.value)
                                }
                                disabled={saving}
                              >
                                <option value="">Unità</option>
                                {NEXT_MAGAZZINO_STOCK_ALLOWED_UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="mag-domain-chip">
                                Unita {candidate.unita || "-"} · {candidate.unitaSource}
                              </span>
                            )}
                            {candidate.canReconcileWithoutLoad ? (
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm"
                                onClick={() =>
                                  void handleRiconciliaDocumentoSenzaCarico(candidate.id)
                                }
                                disabled={
                                  saving || documentoImportingId === candidate.id
                                }
                              >
                                {documentoImportingId === candidate.id
                                  ? "Riconcilio..."
                                  : "Riconcilia senza carico"}
                              </button>
                            ) : candidate.canLoad ? (
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm"
                                onClick={() => void handleCaricaDocumentoInInventario(candidate.id)}
                                disabled={
                                  saving || documentoImportingId === candidate.id
                                }
                              >
                                {documentoImportingId === candidate.id
                                  ? "Carico..."
                                  : "Carica stock AdBlue"}
                              </button>
                            ) : (
                              <span className="mag-domain-chip">DA VERIFICARE</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {documentiMagazzinoItems.length === 0 ? (
                  <div className="mag-empty mag-empty--compact">
                    Nessun documento magazzino leggibile nel perimetro reale.
                  </div>
                ) : (
                  <div className="mag-domain-list">
                    {documentiMagazzinoItems.map((item) => (
                      <div key={item.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {item.tipoDocumento}
                            {item.fornitore ? ` · ${item.fornitore}` : ""}
                          </div>
                          <div className="mag-domain-row__meta">
                            {formatStoredDateForUi(item.dataDocumento)} · Totale{" "}
                            {formatDocumentAmount(item.totaleDocumento, item.currency)}
                            {item.targa ? ` · ${item.targa}` : ""}
                            {item.daVerificare ? " · da verificare" : ""}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          {item.fileUrl ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() => window.open(item.fileUrl!, "_blank", "noopener,noreferrer")}
                            >
                              Apri PDF
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mag-form-panel">
                <div className="mag-form-title">Costi materiali e prezzi</div>
                <div className="mag-domain-copy">
                  I costi materiali qui sotto restano nel perimetro `Magazzino`: arrivano dai
                  documenti `@documenti_magazzino` e dal listino/procurement materiali, non da
                  un ledger transazionale canonico.
                </div>
                <div className="mag-domain-metrics">
                  <span className="mag-domain-chip">
                    Doc magazzino: {documentiCostiSnapshot?.sourceCounts.documentiMagazzino ?? 0}
                  </span>
                  <span className="mag-domain-chip">
                    Preventivi: {procurementSnapshot?.counts.preventiviTotali ?? 0}
                  </span>
                  <span className="mag-domain-chip">
                    Listino: {procurementSnapshot?.counts.listinoVoci ?? 0}
                  </span>
                </div>
                {materialiCostItems.length === 0 ? (
                  <div className="mag-empty mag-empty--compact">
                    Nessun costo materiali leggibile in forma affidabile.
                  </div>
                ) : (
                  <div className="mag-domain-list">
                    {materialiCostItems.map((item: NextDocumentiCostiReadOnlyItem) => (
                      <div key={item.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {item.title || item.documentTypeLabel}
                          </div>
                          <div className="mag-domain-row__meta">
                            {item.supplier || "Fornitore non indicato"} ·{" "}
                            {item.dateLabel || "-"} · {formatCurrencyAmount(item.amount, item.currency)}
                            {item.mezzoTarga ? ` · ${item.mezzoTarga}` : ""}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          {item.mezzoTarga ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() => navigate(buildNextDossierPath(item.mezzoTarga))}
                            >
                              Dossier
                            </button>
                          ) : null}
                          {item.fileUrl ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() => window.open(item.fileUrl!, "_blank", "noopener,noreferrer")}
                            >
                              File
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {procurementListino.length > 0 ? (
                  <div className="mag-domain-sublist">
                    <div className="mag-domain-subtitle">Prezzi listino recenti</div>
                    {procurementListino.map((item) => (
                      <div key={item.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">{item.articoloCanonico}</div>
                          <div className="mag-domain-row__meta">
                            {item.supplierName || "Fornitore non indicato"} ·{" "}
                            {formatCurrencyAmount(item.prezzoAttuale, item.valuta)} ·{" "}
                            {item.updatedAtLabel || "data non disponibile"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="mag-form-panel">
                <div className="mag-form-title">Ordini e arrivi collegati</div>
                <div className="mag-domain-copy">
                  Sezione di supporto sul procurement reale: ordini, arrivi, preventivi e
                  dettaglio ordine restano leggibili in sola lettura, mentre il carico stock
                  degli arrivi si consolida qui dal centro operativo `Magazzino`.
                </div>
                <div className="mag-domain-metrics">
                  <span className="mag-domain-chip">
                    Ordini: {procurementSnapshot?.counts.totalOrders ?? 0}
                  </span>
                  <span className="mag-domain-chip">
                    Arrivi: {procurementSnapshot?.counts.arrivedRows ?? 0}
                  </span>
                  <span className="mag-domain-chip">
                    Righe pendenti: {procurementSnapshot?.counts.pendingRows ?? 0}
                  </span>
                </div>
                {procurementOrders.length === 0 ? (
                  <div className="mag-empty mag-empty--compact">
                    Nessun ordine leggibile nel dataset reale `@ordini`.
                  </div>
                ) : (
                  <div className="mag-domain-list">
                    {procurementOrders.map((ordine) => (
                      <div key={ordine.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {ordine.orderReference} · {ordine.supplierName}
                          </div>
                          <div className="mag-domain-row__meta">
                            {buildProcurementStateLabel(ordine.state)} ·{" "}
                            {ordine.orderDateLabel || "-"} · righe {ordine.arrivedRows}/
                            {ordine.totalRows}
                            {ordine.latestArrivalLabel
                              ? ` · ultimo arrivo ${ordine.latestArrivalLabel}`
                              : ""}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          <button
                            type="button"
                            className="mag-btn mag-btn--sm"
                            onClick={() => navigate(buildNextDettaglioOrdinePath(ordine.id))}
                          >
                            Dettaglio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {procurementPreventivi.length > 0 ? (
                  <div className="mag-domain-sublist">
                    <div className="mag-domain-subtitle">Preventivi recenti</div>
                    {procurementPreventivi.map((preventivo) => (
                      <div key={preventivo.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {preventivo.numeroPreventivo} · {preventivo.supplierName}
                          </div>
                          <div className="mag-domain-row__meta">
                            {preventivo.dataPreventivoLabel || "-"} ·{" "}
                            {formatCurrencyAmount(preventivo.totalAmount, preventivo.currency)} ·{" "}
                            {preventivo.approvalStatus}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          {preventivo.pdfUrl ? (
                            <button
                              type="button"
                              className="mag-btn mag-btn--sm"
                              onClick={() => window.open(preventivo.pdfUrl!, "_blank", "noopener,noreferrer")}
                            >
                              PDF
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="mag-form-panel">
                <div className="mag-form-title">Dossier e segnali dominio</div>
                <div className="mag-domain-copy">
                  Collegamenti mezzo/materiali, link dossier e segnali prudenziali letti dal
                  layer NEXT senza reintrodurre runtime legacy separati.
                </div>
                {magazzinoVehicleLinks.length === 0 ? (
                  <div className="mag-empty mag-empty--compact">
                    Nessun collegamento mezzo leggibile nel perimetro D05.
                  </div>
                ) : (
                  <div className="mag-domain-list">
                    {magazzinoVehicleLinks.map((link) => (
                      <div key={link.key} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">
                            {link.label} · {link.movementCount} movimenti
                          </div>
                          <div className="mag-domain-row__meta">
                            {link.reliability === "forte" ? "link forte" : "link prudente"} ·{" "}
                            {link.latestDate ? formatStoredDateForUi(link.latestDate) : "-"} ·{" "}
                            {link.materiali.slice(0, 3).join(", ")}
                          </div>
                        </div>
                        <div className="mag-domain-linkbar">
                          {link.targa ? (
                            <>
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm"
                                onClick={() => navigate(buildNextDossierPath(link.targa!))}
                              >
                                Dossier
                              </button>
                              <button
                                type="button"
                                className="mag-btn mag-btn--sm"
                                onClick={() => navigate(buildNextAnalisiEconomicaPath(link.targa!))}
                              >
                                Analisi
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {magazzinoSignals.length > 0 ? (
                  <div className="mag-domain-sublist">
                    <div className="mag-domain-subtitle">Segnali da verificare</div>
                    {magazzinoSignals.map((signal) => (
                      <div key={signal.id} className="mag-domain-row">
                        <div className="mag-domain-row__main">
                          <div className="mag-domain-row__title">{signal.title}</div>
                          <div className="mag-domain-row__meta">{signal.summary}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {dominioLimitazioni.length > 0 ? (
                  <div className="mag-domain-sublist">
                    <div className="mag-domain-subtitle">Limitazioni lette dal repo</div>
                    {dominioLimitazioni.map((item, index) => (
                      <div key={`${index}-${item.slice(0, 24)}`} className="mag-domain-note">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
              </div>
            ) : null}

            <div
              className={`doc-costi-modal-overlay ${docModalItem ? "is-open" : ""}`}
              onClick={() => setDocModalItem(null)}
              role="dialog"
              aria-modal={docModalItem ? "true" : undefined}
            >
              {docModalItem ? (
                <div className="doc-costi-modal" onClick={(event) => event.stopPropagation()}>
                  <div className="doc-costi-modal-header">
                    <div className="doc-costi-modal-title">
                      [{getMagazzinoKindLabel(docModalItem)}] {docModalItem.fornitore} -{" "}
                      {normalizeText(docModalItem.numeroDocumento) || "Numero non disponibile"}
                    </div>
                    <button
                      type="button"
                      className="doc-costi-modal-close"
                      onClick={() => setDocModalItem(null)}
                    >
                      Chiudi
                    </button>
                  </div>
                  <div className="doc-costi-modal-body">
                    <div className="doc-costi-modal-fields">
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Fornitore</span>
                        <span className="doc-costi-modal-field-val">{docModalItem.fornitore}</span>
                      </div>
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Data</span>
                        <span className="doc-costi-modal-field-val">
                          {formatStoredDateForUi(docModalItem.dataDocumento)}
                        </span>
                      </div>
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Numero</span>
                        <span className="doc-costi-modal-field-val">
                          {normalizeText(docModalItem.numeroDocumento) || "-"}
                        </span>
                      </div>
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Targa</span>
                        <span className="doc-costi-modal-field-val">
                          {normalizeText(docModalItem.targa) || "-"}
                        </span>
                      </div>
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Importo</span>
                        <span className="doc-costi-modal-field-val">
                          {formatDocumentAmount(docModalItem.totaleDocumento, docModalItem.currency)}
                        </span>
                      </div>
                      <div className="doc-costi-modal-field">
                        <span className="doc-costi-modal-field-label">Valuta</span>
                        <span className="doc-costi-modal-field-val">
                          {normalizeText(docModalItem.currency) || "-"}
                        </span>
                      </div>
                    </div>

                    {docModalItem.righe.length > 0 ? (
                      <>
                        <div className="doc-costi-modal-righe-title">Righe documento</div>
                        <table className="doc-costi-table">
                          <thead>
                            <tr>
                              <th>Descrizione</th>
                              <th>Qta</th>
                              <th>Pr.unit.</th>
                              <th className="is-right">Totale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {docModalItem.righe.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  {row.descrizione}
                                  {normalizeText(row.unita) || normalizeText(row.note) ? (
                                    <span className="doc-costi-modal-note">
                                      {[normalizeText(row.unita), normalizeText(row.note)]
                                        .filter(Boolean)
                                        .join(" - ")}
                                    </span>
                                  ) : null}
                                </td>
                                <td>{row.quantita !== null ? formatNumber(row.quantita) : "-"}</td>
                                <td>
                                  {row.prezzoUnitario !== null
                                    ? formatCurrencyAmount(row.prezzoUnitario, docModalItem.currency)
                                    : "-"}
                                </td>
                                <td className="doc-costi-importo">
                                  {row.totale !== null
                                    ? formatCurrencyAmount(row.totale, docModalItem.currency)
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <>
                        <div className="doc-costi-modal-righe-title">Righe documento</div>
                        <p className="doc-costi-modal-empty">
                          Nessuna riga documento disponibile nei dati reali di questo tab.
                        </p>
                      </>
                    )}

                    <div className="doc-costi-modal-actions">
                      <button
                        type="button"
                        className="doc-costi-modal-btn-primary"
                        onClick={() => {
                          if (!docModalItem.fileUrl) return;
                          window.open(docModalItem.fileUrl, "_blank", "noopener,noreferrer");
                        }}
                        disabled={!docModalItem.fileUrl}
                      >
                        Apri PDF originale
                      </button>
                      <button
                        type="button"
                        className="doc-costi-modal-btn-secondary"
                        onClick={() =>
                          setDocLocalDaVerificareIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(docModalItem.id)) {
                              next.delete(docModalItem.id);
                            } else {
                              next.add(docModalItem.id);
                            }
                            return next;
                          })
                        }
                      >
                        {docModalItem.daVerificare || docLocalDaVerificareIds.has(docModalItem.id)
                          ? "Rimuovi da verificare"
                          : "Da verificare"}
                      </button>
                      <button
                        type="button"
                        className="doc-costi-modal-btn-ia"
                        onClick={() =>
                          navigate(NEXT_INTERNAL_AI_PATH, {
                            state: { initialPrompt: buildMagazzinoAskAiPrompt(docModalItem) },
                          })
                        }
                      >
                        Chiedi alla IA →
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {editingItem ? (
          <div className="mag-modal-backdrop" role="dialog" aria-modal="true">
            <div className="mag-modal">
              <div className="mag-form-title">Modifica articolo</div>
              <div className="mag-field">
                <label className="mag-field__label">Descrizione</label>
                <input
                  className="mag-field__input"
                  value={editingItem.descrizione}
                  onChange={(event) =>
                    setEditingItem({ ...editingItem, descrizione: event.target.value })
                  }
                />
              </div>
              <div className="mag-field">
                <label className="mag-field__label">Fornitore</label>
                <input
                  className="mag-field__input"
                  list="mag-fornitori-list"
                  value={editingItem.fornitore ?? ""}
                  onChange={(event) =>
                    setEditingItem({ ...editingItem, fornitore: event.target.value })
                  }
                />
              </div>
              <div className="mag-field-row">
                <div className="mag-field">
                  <label className="mag-field__label">Quantita</label>
                  <input
                    className="mag-field__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(editingItem.quantita)}
                    onChange={(event) => {
                      const parsed = normalizeNumber(event.target.value);
                      setEditingItem({ ...editingItem, quantita: parsed ?? 0 });
                    }}
                  />
                </div>
                <div className="mag-field">
                  <label className="mag-field__label">Unita</label>
                  <select
                    className="mag-field__input"
                    value={editingItem.unita}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        unita: event.target.value as UnitaMagazzino,
                      })
                    }
                  >
                    {unitaOptions.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mag-field">
                <label className="mag-field__label">Soglia minima</label>
                <input
                  className="mag-field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingItem.sogliaMinima ?? ""}
                  onChange={(event) => {
                    const parsed = normalizeNumber(event.target.value);
                    setEditingItem({ ...editingItem, sogliaMinima: parsed ?? undefined });
                  }}
                />
              </div>
              <div className="mag-field">
                <label className="mag-field__label">Nuova foto</label>
                <input
                  className="mag-field__input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleSelectFoto(event, "edit")}
                />
              </div>
              <div className="mag-modal__actions">
                <button
                  type="button"
                  className="mag-btn"
                  onClick={() => {
                    setEditingItem(null);
                    setEditFotoFile(null);
                  }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="mag-btn mag-btn--primary"
                  onClick={() => void handleSaveInventarioEdit()}
                  disabled={saving}
                >
                  {saving ? "Salvo..." : "Salva"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
