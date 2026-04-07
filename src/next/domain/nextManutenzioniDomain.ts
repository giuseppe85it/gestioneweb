import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { formatDateUI, toNextDateValue } from "../nextDateFormat";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";
const MEZZI_KEY = "@mezzi_aziendali";
const INVENTARIO_KEY = "@inventario";
const MATERIALI_CONSEGNATI_KEY = "@materialiconsegnati";
const DAY_MS = 24 * 60 * 60 * 1000;

type RawRecord = Record<string, unknown>;

export const NEXT_MANUTENZIONI_DOMAIN = {
  code: "D02-MAN",
  name: "Manutenzioni mezzo",
  logicalDatasets: [MANUTENZIONI_KEY, MEZZI_KEY] as const,
  normalizationStrategy:
    "STORICO_INTERVENTI_DA_MANUTENZIONI + MANUTENZIONE_PROGRAMMATA_DA_MEZZI",
} as const;

export type NextManutenzioneQuality =
  | "source_direct"
  | "derived_acceptable"
  | "excluded_from_v1";

export type NextMaintenanceSourceOrigin =
  | "manuale"
  | "autisti_gomme_derivato"
  | "unknown";

export type NextScheduledMaintenanceStatus =
  | "non_attiva"
  | "pianificata"
  | "in_scadenza"
  | "scaduta"
  | "data_mancante";

export type NextScheduledMaintenance = {
  enabled: boolean;
  dataInizio: string | null;
  dataFine: string | null;
  kmMax: string | null;
  contratto: string | null;
  status: NextScheduledMaintenanceStatus;
  daysToDeadline: number | null;
  quality: NextManutenzioneQuality;
  sourceDataset: typeof MEZZI_KEY;
};

export type NextMaintenanceHistoryItem = {
  id: string;
  mezzoTarga: string;
  dataRaw: string | null;
  timestamp: number | null;
  descrizione: string | null;
  tipo: string | null;
  km: number | null;
  ore: number | null;
  eseguitoLabel: string | null;
  fornitoreLabel: string | null;
  materialiCount: number;
  isCambioGommeDerived: boolean;
  sourceDataset: typeof MANUTENZIONI_KEY;
  sourceOrigin: NextMaintenanceSourceOrigin;
  quality: NextManutenzioneQuality;
};

export type NextMezzoManutenzioniSnapshot = {
  domainCode: typeof NEXT_MANUTENZIONI_DOMAIN.code;
  domainName: typeof NEXT_MANUTENZIONI_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  scheduledMaintenance: NextScheduledMaintenance;
  historyItems: NextMaintenanceHistoryItem[];
  counts: {
    totaleStorico: number;
    conKm: number;
    conOre: number;
    conMateriali: number;
    cambioGommeDerivati: number;
  };
  limitations: string[];
};

export type NextManutenzioniLegacyMaterialRecord = {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fromInventario: boolean;
  refId?: string;
};

export type NextManutenzioniLegacyDatasetRecord = {
  id: string;
  targa: string;
  km: number | null;
  ore: number | null;
  sottotipo: SottoTipo | null;
  descrizione: string;
  eseguito: string | null;
  data: string;
  tipo: TipoVoce;
  fornitore?: string;
  materiali?: NextManutenzioniLegacyMaterialRecord[];
};

export type NextManutenzioniMezzoOption = {
  id: string;
  targa: string;
  label: string;
  categoria: string | null;
};

export type NextManutenzioniWorkspaceSnapshot = {
  storico: NextManutenzioniLegacyDatasetRecord[];
  mezzi: NextManutenzioniMezzoOption[];
  limitations: string[];
};

type TipoVoce = "mezzo" | "compressore";
type SottoTipo = "motrice" | "trattore";

export type NextManutenzioneBusinessSavePayload = {
  editingSourceId?: string | null;
  targa: string;
  tipo: TipoVoce;
  fornitore?: string | null;
  km?: number | null;
  ore?: number | null;
  sottotipo?: SottoTipo | null;
  descrizione: string;
  eseguito?: string | null;
  data: string;
  materiali?: NextManutenzioniLegacyMaterialRecord[];
};

type NextLegacyInventarioRecord = Record<string, unknown>;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeLowerText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function unwrapStorageArray(rawDoc: Record<string, unknown> | null): unknown[] {
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray(rawDoc?.value)) return rawDoc.value;
  if (Array.isArray(rawDoc?.items)) return rawDoc.items;
  if (rawDoc?.value && typeof rawDoc.value === "object") {
    const nested = rawDoc.value as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

function unwrapStoredValueArray(rawValue: unknown): unknown[] {
  if (Array.isArray(rawValue)) return rawValue;
  if (rawValue && typeof rawValue === "object") {
    return unwrapStorageArray(rawValue as Record<string, unknown>);
  }
  return [];
}

async function readStorageDataset(key: string): Promise<unknown[]> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function parseDateFlexible(value: unknown): Date | null {
  return toNextDateValue(value);
}

function formatLegacyDateLabel(value: unknown): string {
  const parsed = parseDateFlexible(value);
  return parsed ? formatDateUI(parsed) : "";
}

function giorniDaOggi(target: Date | null, now: number): number | null {
  if (!target) return null;
  const today = new Date(now);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((utcTarget - utcToday) / DAY_MS);
}

function evaluateScheduledStatus(
  enabled: boolean,
  dataFine: Date | null,
  now: number
): { status: NextScheduledMaintenanceStatus; daysToDeadline: number | null } {
  if (!enabled) {
    return { status: "non_attiva", daysToDeadline: null };
  }

  if (!dataFine) {
    return { status: "data_mancante", daysToDeadline: null };
  }

  const daysToDeadline = giorniDaOggi(dataFine, now);
  if (daysToDeadline === null) {
    return { status: "data_mancante", daysToDeadline: null };
  }
  if (daysToDeadline < 0) {
    return { status: "scaduta", daysToDeadline };
  }
  if (daysToDeadline <= 30) {
    return { status: "in_scadenza", daysToDeadline };
  }
  return { status: "pianificata", daysToDeadline };
}

function isCambioGommeDerived(descrizione: string | null): boolean {
  const normalized = (descrizione ?? "").toUpperCase();
  return normalized.includes("CAMBIO GOMME");
}

function buildHistoryId(raw: RawRecord, index: number, mezzoTarga: string): string {
  const id = normalizeText(raw.id);
  if (id) return id;
  return `manutenzione:${mezzoTarga}:${index}`;
}

function normalizeLegacyTipo(raw: RawRecord): TipoVoce {
  const tipo = normalizeLowerText(raw.tipo);
  if (tipo === "compressore") {
    return "compressore";
  }

  if (normalizeNumber(raw.ore) !== null && normalizeNumber(raw.km) === null) {
    return "compressore";
  }

  return "mezzo";
}

function normalizeLegacySottotipo(value: unknown): SottoTipo | null {
  const normalized = normalizeLowerText(value);
  if (normalized === "motrice" || normalized === "trattore") {
    return normalized;
  }
  return null;
}

function sanitizeLegacyMateriali(value: unknown): NextManutenzioniLegacyMaterialRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map<NextManutenzioniLegacyMaterialRecord | null>((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as RawRecord;
      const label =
        normalizeOptionalText(raw.label) ??
        normalizeOptionalText(raw.descrizione) ??
        normalizeOptionalText(raw.nome);
      if (!label) return null;

      const refId = normalizeOptionalText(raw.refId) ?? undefined;

      return {
        id: normalizeOptionalText(raw.id) ?? `materiale:${index}`,
        label,
        quantita: normalizeNumber(raw.quantita) ?? 0,
        unita: normalizeOptionalText(raw.unita) ?? "pz",
        fromInventario: Boolean(raw.fromInventario),
        ...(refId ? { refId } : {}),
      };
    })
    .filter((entry): entry is NextManutenzioniLegacyMaterialRecord => Boolean(entry));
}

function toLegacyDatasetRecord(
  raw: RawRecord,
  index: number,
): NextManutenzioniLegacyDatasetRecord | null {
  const targa = normalizeNextMezzoTarga(raw.targa) || normalizeText(raw.targa).toUpperCase();

  const tipo = normalizeLegacyTipo(raw);
  const materiali = sanitizeLegacyMateriali(raw.materiali);
  const descrizione =
    normalizeOptionalText(raw.descrizione) ??
    normalizeOptionalText(raw.tipo) ??
    "Manutenzione";
  const data =
    normalizeOptionalText(raw.data) ??
    formatLegacyDateLabel(raw.timestamp ?? raw.createdAt ?? raw.updatedAt);

  return {
    id: buildHistoryId(raw, index, targa),
    targa,
    km: normalizeNumber(raw.km),
    ore: normalizeNumber(raw.ore),
    sottotipo: tipo === "compressore" ? normalizeLegacySottotipo(raw.sottotipo) : null,
    descrizione,
    eseguito: normalizeOptionalText(raw.eseguito),
    data,
    tipo,
    fornitore:
      normalizeOptionalText(raw.fornitore) ??
      normalizeOptionalText(raw.fornitoreLabel) ??
      normalizeOptionalText(raw.eseguito) ??
      undefined,
    materiali,
  };
}

function toMezzoOption(raw: RawRecord, index: number): NextManutenzioniMezzoOption | null {
  const targa = normalizeNextMezzoTarga(raw.targa) || normalizeText(raw.targa).toUpperCase();
  if (!targa) return null;

  const marcaModello = normalizeOptionalText(raw.marcaModello);
  const composedLabel = [normalizeText(raw.marca), normalizeText(raw.modello)]
    .filter(Boolean)
    .join(" ")
    .trim();
  const labelBase =
    marcaModello ??
    (composedLabel || null) ??
    targa;
  const categoria =
    normalizeOptionalText(raw.categoria) ??
    normalizeOptionalText(raw.tipologia) ??
    normalizeOptionalText(raw.tipo);

  return {
    id: normalizeOptionalText(raw.id) ?? `mezzo:${targa}:${index}`,
    targa,
    label: labelBase && labelBase !== targa ? `${targa} - ${labelBase}` : targa,
    categoria,
  };
}

function toHistoryItem(
  raw: RawRecord,
  index: number
): NextMaintenanceHistoryItem | null {
  const mezzoTarga = normalizeNextMezzoTarga(raw.targa);
  if (!mezzoTarga) return null;

  const descrizione = normalizeOptionalText(raw.descrizione);
  const isGomme = isCambioGommeDerived(descrizione);
  const materiali = Array.isArray(raw.materiali) ? raw.materiali : [];

  return {
    id: buildHistoryId(raw, index, mezzoTarga),
    mezzoTarga,
    dataRaw: normalizeOptionalText(raw.data),
    timestamp: parseDateFlexible(raw.data)?.getTime() ?? null,
    descrizione,
    tipo: normalizeOptionalText(raw.tipo),
    km: normalizeNumber(raw.km),
    ore: normalizeNumber(raw.ore),
    eseguitoLabel: normalizeOptionalText(raw.eseguito),
    fornitoreLabel:
      normalizeOptionalText(raw.fornitore) ??
      normalizeOptionalText(raw.fornitoreLabel) ??
      normalizeOptionalText(raw.eseguito),
    materialiCount: materiali.length,
    isCambioGommeDerived: isGomme,
    sourceDataset: MANUTENZIONI_KEY,
    sourceOrigin: isGomme ? "autisti_gomme_derivato" : descrizione ? "manuale" : "unknown",
    quality: isGomme ? "derived_acceptable" : "source_direct",
  };
}

function sortHistoryItems(
  items: NextMaintenanceHistoryItem[]
): NextMaintenanceHistoryItem[] {
  return [...items].sort((left, right) => {
    const rightTs = right.timestamp ?? -1;
    const leftTs = left.timestamp ?? -1;
    if (rightTs !== leftTs) return rightTs - leftTs;
    return left.id.localeCompare(right.id);
  });
}

function buildScheduledMaintenance(
  mezzoRecord: RawRecord | null,
  now: number
): NextScheduledMaintenance {
  const enabled = Boolean(mezzoRecord?.manutenzioneProgrammata);
  const dataInizio = normalizeOptionalText(mezzoRecord?.manutenzioneDataInizio);
  const dataFine = normalizeOptionalText(mezzoRecord?.manutenzioneDataFine);
  const kmMax = normalizeOptionalText(mezzoRecord?.manutenzioneKmMax);
  const contratto = normalizeOptionalText(mezzoRecord?.manutenzioneContratto);
  const { status, daysToDeadline } = evaluateScheduledStatus(
    enabled,
    parseDateFlexible(dataFine),
    now
  );

  return {
    enabled,
    dataInizio,
    dataFine,
    kmMax,
    contratto,
    status,
    daysToDeadline,
    quality: "source_direct",
    sourceDataset: MEZZI_KEY,
  };
}

export async function readNextMezzoManutenzioniSnapshot(
  targa: string
): Promise<NextMezzoManutenzioniSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const now = Date.now();

  const [manutenzioniRaw, mezziRaw] = await Promise.all([
    readStorageDataset(MANUTENZIONI_KEY),
    readStorageDataset(MEZZI_KEY),
  ]);

  const mezzoRecord =
    mezziRaw.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      return normalizeNextMezzoTarga((entry as RawRecord).targa) === mezzoTarga;
    }) ?? null;

  const historyItems = sortHistoryItems(
    manutenzioniRaw
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return toHistoryItem(entry as RawRecord, index);
      })
      .filter((entry): entry is NextMaintenanceHistoryItem => Boolean(entry))
      .filter((entry) => entry.mezzoTarga === mezzoTarga)
  );

  return {
    domainCode: NEXT_MANUTENZIONI_DOMAIN.code,
    domainName: NEXT_MANUTENZIONI_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_MANUTENZIONI_DOMAIN.logicalDatasets,
    scheduledMaintenance: buildScheduledMaintenance(
      mezzoRecord && typeof mezzoRecord === "object" ? (mezzoRecord as RawRecord) : null,
      now
    ),
    historyItems,
    counts: {
      totaleStorico: historyItems.length,
      conKm: historyItems.filter((item) => item.km !== null).length,
      conOre: historyItems.filter((item) => item.ore !== null).length,
      conMateriali: historyItems.filter((item) => item.materialiCount > 0).length,
      cambioGommeDerivati: historyItems.filter((item) => item.isCambioGommeDerived).length,
    },
    limitations: [
      "Il blocco legge solo `@manutenzioni` come storico interventi e i campi di manutenzione programmata dal record mezzo in `@mezzi_aziendali`.",
      "Costi manutenzione, inventario e materiali consegnati restano fuori da questa v1: nessun merge con altri dataset.",
      "Le voci `CAMBIO GOMME` sono solo riconosciute in modo prudente dalla descrizione e restano marcate come dato derivato.",
      "La data dello storico viene ordinata solo quando il parsing della stringa legacy e affidabile; in caso contrario il record resta in coda.",
    ],
  };
}

export async function readNextManutenzioniLegacyDataset(): Promise<
  NextManutenzioniLegacyDatasetRecord[]
> {
  const manutenzioniRaw = await readStorageDataset(MANUTENZIONI_KEY);

  return manutenzioniRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toLegacyDatasetRecord(entry as RawRecord, index);
    })
    .filter((entry): entry is NextManutenzioniLegacyDatasetRecord => Boolean(entry))
    .sort((left, right) => {
      const rightTs = parseDateFlexible(right.data)?.getTime() ?? 0;
      const leftTs = parseDateFlexible(left.data)?.getTime() ?? 0;
      if (rightTs !== leftTs) return rightTs - leftTs;
      return right.id.localeCompare(left.id);
    });
}

export async function readNextManutenzioniWorkspaceSnapshot(): Promise<
  NextManutenzioniWorkspaceSnapshot
> {
  const [storico, mezziRaw] = await Promise.all([
    readNextManutenzioniLegacyDataset(),
    readStorageDataset(MEZZI_KEY),
  ]);

  const mezzi = mezziRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toMezzoOption(entry as RawRecord, index);
    })
    .filter((entry): entry is NextManutenzioniMezzoOption => Boolean(entry))
    .sort((left, right) => left.label.localeCompare(right.label, "it", { sensitivity: "base" }));

  return {
    storico,
    mezzi,
    limitations: [
      "Lo storico manutenzioni usa solo `@manutenzioni` reale e le opzioni mezzo leggono `@mezzi_aziendali` reale.",
      "Inventario, movimenti materiali, PDF e salvataggi restano fuori dal domain e vanno mantenuti read-only nel runtime ufficiale.",
    ],
  };
}

function buildGeneratedId(): string {
  return Date.now().toString();
}

function sanitizeMaterialeForWrite(
  item: NextManutenzioniLegacyMaterialRecord,
  index: number,
): NextManutenzioniLegacyMaterialRecord | null {
  const label = normalizeOptionalText(item.label);
  if (!label) return null;

  return {
    id: normalizeOptionalText(item.id) ?? `materiale:${index}`,
    label,
    quantita: normalizeNumber(item.quantita) ?? 0,
    unita: normalizeOptionalText(item.unita) ?? "pz",
    fromInventario: Boolean(item.fromInventario),
    ...(normalizeOptionalText(item.refId) ? { refId: normalizeOptionalText(item.refId) ?? undefined } : {}),
  };
}

function sanitizeMaterialiForWrite(
  items: NextManutenzioniLegacyMaterialRecord[] | undefined,
): NextManutenzioniLegacyMaterialRecord[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => sanitizeMaterialeForWrite(item, index))
    .filter((item): item is NextManutenzioniLegacyMaterialRecord => Boolean(item));
}

function sanitizeBusinessRecord(
  payload: NextManutenzioneBusinessSavePayload,
): NextManutenzioniLegacyDatasetRecord {
  const targa = normalizeNextMezzoTarga(payload.targa) || normalizeText(payload.targa).toUpperCase();
  return {
    id: buildGeneratedId(),
    targa,
    tipo: payload.tipo,
    fornitore: normalizeOptionalText(payload.fornitore) ?? undefined,
    km: payload.tipo === "mezzo" ? normalizeNumber(payload.km) : null,
    ore: payload.tipo === "compressore" ? normalizeNumber(payload.ore) : null,
    sottotipo: payload.tipo === "compressore" ? payload.sottotipo ?? null : null,
    descrizione: normalizeOptionalText(payload.descrizione) ?? "Manutenzione",
    eseguito: normalizeOptionalText(payload.eseguito),
    data: normalizeOptionalText(payload.data) ?? "",
    materiali: sanitizeMaterialiForWrite(payload.materiali),
  };
}

async function readStoredArrayByKey(key: string): Promise<unknown[]> {
  const raw = await getItemSync(key);
  return unwrapStoredValueArray(raw);
}

function matchLegacyRecordById(
  raw: unknown,
  index: number,
  recordId: string,
): boolean {
  if (!raw || typeof raw !== "object") return false;
  return buildHistoryId(raw as RawRecord, index, normalizeText((raw as RawRecord).targa)) === recordId;
}

function findLegacyRecordIndex(
  items: unknown[],
  recordId: string,
): number {
  return items.findIndex((entry, index) => matchLegacyRecordById(entry, index, recordId));
}

function sanitizeInventarioArray(items: unknown[]): NextLegacyInventarioRecord[] {
  return items.filter((item): item is NextLegacyInventarioRecord => Boolean(item) && typeof item === "object");
}

async function persistLegacyMaterialEffects(args: {
  targa: string;
  data: string;
  materiali: NextManutenzioniLegacyMaterialRecord[];
}): Promise<void> {
  const [inventarioRaw, movRaw, consegneRaw] = await Promise.all([
    getItemSync(INVENTARIO_KEY),
    getItemSync(MATERIALI_CONSEGNATI_KEY),
    getItemSync(MATERIALI_CONSEGNATI_KEY),
  ]);

  const inventarioAggiornato = sanitizeInventarioArray(unwrapStoredValueArray(inventarioRaw)).map((item) => ({ ...item }));
  const nuoveMovimentazioni = unwrapStoredValueArray(movRaw).map((item) =>
    item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : item,
  );
  const nuoveConsegne = unwrapStoredValueArray(consegneRaw).map((item) =>
    item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : item,
  );

  for (const materiale of args.materiali) {
    if (!materiale.fromInventario || !materiale.refId) continue;

    const index = inventarioAggiornato.findIndex((item) => String(item.id ?? "").trim() === materiale.refId);
    if (index === -1) continue;

    const corrente = inventarioAggiornato[index];
    const quantitaAttuale = normalizeNumber(corrente.quantitaTotale ?? corrente.quantita) ?? 0;
    const nuovaQuantita = Math.max(0, quantitaAttuale - materiale.quantita);
    inventarioAggiornato[index] = {
      ...corrente,
      quantitaTotale: nuovaQuantita,
      quantita: nuovaQuantita,
    };

    nuoveMovimentazioni.push({
      id: `${Date.now()}_${materiale.id}`,
      tipo: "OUT",
      data: args.data,
      materialeId: materiale.refId,
      materialeLabel: materiale.label,
      quantita: materiale.quantita,
      unita: materiale.unita,
      origine: "MANUTENZIONE",
      targa: args.targa,
    });

    nuoveConsegne.push({
      id: `${Date.now()}_CONS_${materiale.id}`,
      descrizione: materiale.label,
      quantita: materiale.quantita,
      unita: materiale.unita,
      fornitore: normalizeOptionalText(corrente.fornitore) ?? "",
      destinatario: {
        type: "MEZZO",
        refId: args.targa,
        label: args.targa,
      },
      motivo: "UTILIZZO MANUTENZIONE",
      data: args.data,
    });
  }

  await setItemSync(INVENTARIO_KEY, inventarioAggiornato);
  await setItemSync(MATERIALI_CONSEGNATI_KEY, nuoveMovimentazioni);
  await setItemSync(MATERIALI_CONSEGNATI_KEY, nuoveConsegne);
}

export async function saveNextManutenzioneBusinessRecord(
  payload: NextManutenzioneBusinessSavePayload,
): Promise<NextManutenzioniLegacyDatasetRecord> {
  const nextRecord = sanitizeBusinessRecord(payload);
  const storicoRaw = await readStoredArrayByKey(MANUTENZIONI_KEY);
  const editingSourceId = normalizeOptionalText(payload.editingSourceId);
  const nextStorico = storicoRaw.filter((entry, index) => {
    if (!editingSourceId) return true;
    return !matchLegacyRecordById(entry, index, editingSourceId);
  });

  nextStorico.unshift(nextRecord);
  await setItemSync(MANUTENZIONI_KEY, nextStorico);

  if (!editingSourceId) {
    await persistLegacyMaterialEffects({
      targa: nextRecord.targa,
      data: nextRecord.data,
      materiali: nextRecord.materiali ?? [],
    });
  }

  return nextRecord;
}

export async function deleteNextManutenzioneBusinessRecord(recordId: string): Promise<boolean> {
  const normalizedRecordId = normalizeOptionalText(recordId);
  if (!normalizedRecordId) return false;

  const storicoRaw = await readStoredArrayByKey(MANUTENZIONI_KEY);
  const recordIndex = findLegacyRecordIndex(storicoRaw, normalizedRecordId);
  if (recordIndex === -1) return false;

  const recordRaw = storicoRaw[recordIndex];
  if (!recordRaw || typeof recordRaw !== "object") return false;

  const record = toLegacyDatasetRecord(recordRaw as RawRecord, recordIndex);
  if (!record) return false;

  const inventarioRaw = await getItemSync(INVENTARIO_KEY);
  const inventarioAggiornato = sanitizeInventarioArray(unwrapStoredValueArray(inventarioRaw)).map((item) => ({ ...item }));

  for (const materiale of record.materiali ?? []) {
    if (!materiale.fromInventario || !materiale.refId) continue;
    const index = inventarioAggiornato.findIndex((item) => String(item.id ?? "").trim() === materiale.refId);
    if (index === -1) continue;

    const corrente = inventarioAggiornato[index];
    const quantitaAttuale = normalizeNumber(corrente.quantitaTotale ?? corrente.quantita) ?? 0;
    const nuovaQuantita = quantitaAttuale + (normalizeNumber(materiale.quantita) ?? 0);
    inventarioAggiornato[index] = {
      ...corrente,
      quantitaTotale: nuovaQuantita,
      quantita: nuovaQuantita,
    };
  }

  const consegneRaw = await getItemSync(MATERIALI_CONSEGNATI_KEY);
  let consegneAggiornate = unwrapStoredValueArray(consegneRaw);

  for (const materiale of record.materiali ?? []) {
    consegneAggiornate = consegneAggiornate.filter((entry) => {
      if (!entry || typeof entry !== "object") return true;
      const raw = entry as RawRecord;
      const destinatario =
        raw.destinatario && typeof raw.destinatario === "object"
          ? (raw.destinatario as RawRecord)
          : null;

      return !(
        normalizeOptionalText(raw.motivo) === "UTILIZZO MANUTENZIONE" &&
        normalizeOptionalText(destinatario?.refId) === record.targa &&
        normalizeOptionalText(raw.descrizione) === materiale.label &&
        normalizeNumber(raw.quantita) === materiale.quantita &&
        normalizeOptionalText(raw.unita) === materiale.unita
      );
    });
  }

  const nextStorico = storicoRaw.filter((_, index) => index !== recordIndex);
  await setItemSync(INVENTARIO_KEY, inventarioAggiornato);
  await setItemSync(MATERIALI_CONSEGNATI_KEY, consegneAggiornate);
  await setItemSync(MANUTENZIONI_KEY, nextStorico);
  return true;
}
