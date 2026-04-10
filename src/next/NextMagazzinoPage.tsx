import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { uploadBytes } from "../utils/storageWriteOps";
import {
  NEXT_ACQUISTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  buildNextAnalisiEconomicaPath,
  buildNextDettaglioOrdinePath,
  buildNextDossierPath,
  buildNextMagazzinoPath,
  type NextMagazzinoTab,
} from "./nextStructuralPaths";
import {
  readNextDocumentiCostiFleetSnapshot,
  readNextIADocumentiArchiveSnapshot,
  type NextDocumentiCostiFleetSnapshot,
  type NextDocumentiCostiReadOnlyItem,
  type NextIADocumentiArchiveSnapshot,
} from "./domain/nextDocumentiCostiDomain";
import {
  readNextMagazzinoRealeSnapshot,
  type NextMagazzinoRealeSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import {
  readNextProcurementSnapshot,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
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

type InventarioItem = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: UnitaMagazzino;
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
  numeroCisterna?: string;
  note?: string;
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
const UNITA_OPTIONS = ["pz", "lt", "kg", "mt", "m"] as const;
const LITRI_PER_CISTERNA = 1000;
const N_CAMBI_MEDIA = 6;

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

  const unita = normalizeOptionalText(record.unita) ?? "pz";
  const sogliaMinima = normalizeNumber(record.sogliaMinima);

  return {
    id: normalizeOptionalText(record.id) ?? `inventario_${index}`,
    descrizione,
    quantita,
    unita,
    fornitore:
      normalizeOptionalText(record.fornitore) ??
      normalizeOptionalText(record.fornitoreLabel) ??
      normalizeOptionalText(record.nomeFornitore),
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
    unita: normalizeOptionalText(record.unita) ?? "pz",
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
      normalizeOptionalText(record.inventarioRefId) ??
      normalizeOptionalText(record.materialeId),
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
  if (!data) return null;
  return {
    id: normalizeOptionalText(record.id) ?? `adblue_${index}`,
    data,
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

function sameNormalizedText(left: string | null | undefined, right: string | null | undefined) {
  return normalizeText(left).toUpperCase() === normalizeText(right).toUpperCase();
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

  return inventario.findIndex(
    (item) =>
      item.unita === consegna.unita &&
      sameNormalizedText(item.descrizione, consegna.descrizione) &&
      (!consegna.fornitore || sameNormalizedText(item.fornitore, consegna.fornitore)),
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
    unita: item.unita,
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
    unita: item.unita,
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
    numeroCisterna: item.numeroCisterna ?? null,
    note: item.note ?? null,
  };
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
  const consumoGiornaliero = LITRI_PER_CISTERNA / mediaGiorni;
  return Math.min(Math.round(consumoGiornaliero * giorniPassati), LITRI_PER_CISTERNA);
}

function percentualeConsumata(litriConsumati: number): number {
  return Math.round((litriConsumati / LITRI_PER_CISTERNA) * 100);
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
  const [numeroCisterna, setNumeroCisterna] = useState("");
  const [noteAdblue, setNoteAdblue] = useState("");

  const [documentiCostiSnapshot, setDocumentiCostiSnapshot] =
    useState<NextDocumentiCostiFleetSnapshot | null>(null);
  const [iaDocumentiSnapshot, setIaDocumentiSnapshot] =
    useState<NextIADocumentiArchiveSnapshot | null>(null);
  const [procurementSnapshot, setProcurementSnapshot] =
    useState<NextProcurementSnapshot | null>(null);
  const [magazzinoRealeSnapshot, setMagazzinoRealeSnapshot] =
    useState<NextMagazzinoRealeSnapshot | null>(null);

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
    if (!materialeSelezionato) return;
    const refreshed = items.find((item) => item.id === materialeSelezionato.id) ?? null;
    setMaterialeSelezionato(refreshed);
    if (!refreshed) {
      setMaterialeInput("");
    }
  }, [items, materialeSelezionato]);

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
    if (!descrizione || quantitaValue === null || quantitaValue < 0) {
      setError("Compila descrizione e quantita valide.");
      return;
    }

    setSaving(true);
    try {
      const id = generateId();
      let fotoUrl: string | null = null;
      let fotoStoragePath: string | null = null;
      if (newFotoFile) {
        const uploaded = await uploadInventarioPhoto(newFotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      }

      const nextItem: InventarioItem = {
        id,
        descrizione,
        quantita: quantitaValue,
        unita: newUnita,
        fornitore: normalizeOptionalText(newFornitore),
        fotoUrl,
        fotoStoragePath,
        sogliaMinima: sogliaValue ?? undefined,
      };

      const nextItems = [...items, nextItem].sort((left, right) =>
        left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" }),
      );

      await persistInventario(nextItems);
      setItems(nextItems);
      setNotice("Articolo aggiunto al magazzino.");
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
    if (!descrizione || editingItem.quantita < 0) {
      setError("Compila dati validi per l'articolo.");
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

      const nextItems = items
        .map((item) =>
          item.id === editingItem.id
            ? {
                ...editingItem,
                descrizione,
                fornitore: normalizeOptionalText(editingItem.fornitore),
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

      if (idx >= 0) {
        inventarioAggiornato[idx] = {
          ...inventarioAggiornato[idx],
          quantita: inventarioAggiornato[idx].quantita + consegna.quantita,
        };
      } else {
        inventarioAggiornato.push({
          id: consegna.inventarioRefId ?? generateId(),
          descrizione: consegna.descrizione,
          quantita: consegna.quantita,
          unita: consegna.unita,
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
        )
        .filter((item) => item.quantita > 0);

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

    setSaving(true);
    try {
      const nuovoCambio: CambioAdBlue = {
        id: generateId(),
        data: inputDateToStored(dataCambio),
        numeroCisterna: normalizeOptionalText(numeroCisterna) ?? undefined,
        note: normalizeOptionalText(noteAdblue) ?? undefined,
      };
      const nuovaLista = [...cambi, nuovoCambio].sort(
        (left, right) =>
          (parseStoredDate(left.data)?.getTime() ?? 0) -
          (parseStoredDate(right.data)?.getTime() ?? 0),
      );
      await persistCambi(nuovaLista);
      setCambi(nuovaLista);
      setNotice("Cambio cisterna registrato.");
      resetAdBlueForm();
      setAdBlueTab("stato");
    } catch (saveError) {
      console.error("Errore registrazione cambio AdBlue:", saveError);
      setError("Errore durante il salvataggio del cambio cisterna.");
    } finally {
      setSaving(false);
    }
  }

  const unitaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...UNITA_OPTIONS, ...items.map((item) => item.unita), editingItem?.unita].filter(
            (entry): entry is string => Boolean(normalizeText(entry)),
          ),
        ),
      ),
    [editingItem?.unita, items],
  );

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

  const documentiMagazzinoItems = (iaDocumentiSnapshot?.items ?? [])
    .filter((item) => item.sourceKey === "@documenti_magazzino")
    .slice(0, 6);
  const materialiCostItems = (documentiCostiSnapshot?.items ?? [])
    .filter(
      (item) =>
        item.sourceType === "documento_magazzino" || item.sourceType === "costo_mezzo",
    )
    .slice(0, 6);
  const procurementOrders = (procurementSnapshot?.orders ?? []).slice(0, 6);
  const procurementPreventivi = (procurementSnapshot?.preventivi ?? []).slice(0, 4);
  const procurementListino = (procurementSnapshot?.listino ?? []).slice(0, 6);
  const magazzinoVehicleLinks = (magazzinoRealeSnapshot?.vehicleLinks ?? []).slice(0, 6);
  const magazzinoSignals = (magazzinoRealeSnapshot?.attentionSignals ?? []).slice(0, 4);
  const dominioLimitazioni = [
    ...(documentiCostiSnapshot?.limitations ?? []),
    ...(procurementSnapshot?.limitations ?? []),
    ...(magazzinoRealeSnapshot?.limitations ?? []),
  ].slice(0, 6);

  const mediaGiorni = mediaDurataGiorni(cambi);
  const ultimoCambio = cambi.length ? cambi[cambi.length - 1] : null;
  const litriConsumati = litriConsumatiStima(ultimoCambio, mediaGiorni);
  const litriResidui = Math.max(LITRI_PER_CISTERNA - litriConsumati, 0);
  const percentuale = percentualeConsumata(litriConsumati);
  const progressColor = coloreProgress(percentuale);
  const giorniPassatiUltimoCambio = ultimoCambio
    ? durataGiorni(ultimoCambio.data, storedToday())
    : 0;
  const consumoMedio = mediaGiorni > 0 ? Math.round(LITRI_PER_CISTERNA / mediaGiorni) : 0;
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
                              {typeof item.sogliaMinima === "number"
                                ? ` · soglia ${formatNumber(item.sogliaMinima)}`
                                : ""}
                            </div>
                            <div className="mag-qty">
                              <button
                                type="button"
                                className="mag-qty__btn"
                                onClick={() => void handleDeltaQuantita(item.id, -1)}
                                disabled={saving}
                              >
                                −
                              </button>
                              <input
                                className="mag-qty__input"
                                value={String(item.quantita)}
                                onChange={(event) =>
                                  void handleDirectQuantita(item.id, event.target.value)
                                }
                              />
                              <button
                                type="button"
                                className="mag-qty__btn"
                                onClick={() => void handleDeltaQuantita(item.id, 1)}
                                disabled={saving}
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
                    disponibili. Ogni cisterna e considerata da 1000 litri e il consumo
                    giornaliero viene ricavato dividendo 1000 per la durata media.
                  </div>
                  <div className="mag-calc-stats">
                    <div>Ultimo cambio: {formatStoredDateForUi(ultimoCambio?.data)}</div>
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
                      durata && durata > 0 ? Math.round(LITRI_PER_CISTERNA / durata) : null;

                    return (
                      <div key={cambio.id} className="mag-log-row">
                        <span className="mag-log-row__date">
                          {formatStoredDateForUi(cambio.data)}
                        </span>
                        <span className="mag-log-row__cisterna">
                          {cambio.numeroCisterna || "Cisterna"}
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
            <section className="mag-kpis">
              <article className="mag-kpi">
                <div className="mag-kpi__label">Documenti magazzino</div>
                <div className="mag-kpi__value">
                  {iaDocumentiSnapshot?.counts.documentiMagazzino ?? 0}
                </div>
                <div className="mag-kpi__sub">archivio IA reale</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Righe costo materiali</div>
                <div className="mag-kpi__value">
                  {documentiCostiSnapshot?.materialCostSupport.rowCount ?? 0}
                </div>
                <div className="mag-kpi__sub">supporto prudente</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Ordini aperti</div>
                <div className="mag-kpi__value">
                  {(procurementSnapshot?.counts.pendingOrders ?? 0) +
                    (procurementSnapshot?.counts.partialOrders ?? 0)}
                </div>
                <div className="mag-kpi__sub">pending + parziali</div>
              </article>
              <article className="mag-kpi">
                <div className="mag-kpi__label">Link dossier forti</div>
                <div className="mag-kpi__value">
                  {magazzinoRealeSnapshot?.counts.vehicleLinksStrong ?? 0}
                </div>
                <div className="mag-kpi__sub">movimenti verso mezzi</div>
              </article>
            </section>

            <div className="mag-domain-grid">
              <section className="mag-form-panel">
                <div className="mag-form-title">Documenti materiali importati</div>
                <div className="mag-domain-copy">
                  Vista read-only dei documenti `@documenti_magazzino`: fatture, bolle e
                  allegati restano consultabili qui senza aprire writer nuovi nel dominio.
                </div>
                <div className="mag-domain-actions">
                  <button
                    type="button"
                    className="mag-btn mag-btn--sm"
                    onClick={() => navigate(NEXT_IA_DOCUMENTI_PATH)}
                  >
                    Apri IA documenti
                  </button>
                  <button
                    type="button"
                    className="mag-btn mag-btn--sm"
                    onClick={() => navigate(NEXT_ACQUISTI_PATH)}
                  >
                    Apri acquisti
                  </button>
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
                  I costi materiali qui sotto sono supporto documentale prudente: arrivano da
                  `@documenti_magazzino.voci`, `@costiMezzo` e listino procurement, non da un
                  ledger transazionale canonico.
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
                  Sezione read-only sul procurement reale: ordini, arrivi, preventivi e
                  dettaglio ordine restano writer esterni, ma qui diventano leggibili dal
                  centro operativo Magazzino.
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
