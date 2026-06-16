import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { toNextDateValue } from "../nextDateFormat";
import { toDisplay } from "../helpers/dateUnica";
import {
  areNextMagazzinoUnitsCompatible,
  buildNextMagazzinoStockKey,
  normalizeNextMagazzinoStockRefId,
  normalizeNextMagazzinoStockUnit,
  normalizeNextMagazzinoStockUnitLoose,
} from "./nextMagazzinoStockContract";
import {
  readLegamiOrigine,
  writeLegamiOrigine,
  type LegameOrigineRef,
} from "../helpers/cicloLegame";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";
const MEZZI_KEY = "@mezzi_aziendali";
const SEGNALAZIONI_AUTISTI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_MEZZO_AUTISTI_KEY = "@controlli_mezzo_autisti";
const INVENTARIO_KEY = "@inventario";
const MATERIALI_CONSEGNATI_KEY = "@materialiconsegnati";
const DOCUMENTI_MEZZI_COLLECTION = "@documenti_mezzi";
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

export type NextManutenzioneStato = "daFare" | "programmata" | "eseguita" | "chiusa_da_evento";
export type NextManutenzioneOrigineTipo = "manuale" | "controllo" | "segnalazione";
export type NextManutenzioneUrgenza = "alta" | "media" | "bassa";
export type NextManutenzioneOrigineRef = LegameOrigineRef;
export type NextChiusuraEventoFields = {
  chiusuraDi?: string | null;
  chiusuraRefId?: string | null;
  chiusuraData?: number | null;
};

export type NextManutenzioneOrigineRecord = {
  origineRefKey: typeof SEGNALAZIONI_AUTISTI_KEY | typeof CONTROLLI_MEZZO_AUTISTI_KEY;
  origineRefId: string;
  origineTipo: Exclude<NextManutenzioneOrigineTipo, "manuale">;
  data: Record<string, unknown>;
};

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
  assiCoinvolti: string[];
  gommePerAsse: NextManutenzioneGommePerAsseRecord[];
  gommeInterventoTipo: NextManutenzioneGommeInterventoTipo | null;
  gommeStraordinario: NextManutenzioneGommeStraordinarioRecord | null;
  isCambioGommeDerived: boolean;
  stato: NextManutenzioneStato;
  dataProgrammata: string | null;
  origineTipo?: NextManutenzioneOrigineTipo | null;
  origineRefId?: string | null;
  origineRefKey?: string | null;
  origineRefs?: NextManutenzioneOrigineRef[];
  segnalatoDa?: string | null;
  urgenza: NextManutenzioneUrgenza | null;
  chiusuraDi?: string | null;
  chiusuraRefId?: string | null;
  chiusuraData?: number | null;
  gruppoManutenzioneId?: string | null;
  sourceDataset: typeof MANUTENZIONI_KEY;
  sourceOrigin: NextMaintenanceSourceOrigin;
  quality: NextManutenzioneQuality;
  sourceDocumentId: string | null;
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
  noteEsecuzione?: string | null;
  data: string;
  dataEsecuzione?: string | null;
  tipo: TipoVoce;
  stato?: NextManutenzioneStato | null;
  dataProgrammata?: string | null;
  origineTipo?: NextManutenzioneOrigineTipo | null;
  origineRefId?: string | null;
  origineRefKey?: string | null;
  origineRefs?: NextManutenzioneOrigineRef[];
  segnalatoDa?: string | null;
  eseguitoDa?: string | null;
  urgenza?: NextManutenzioneUrgenza | null;
  chiusuraDi?: string | null;
  chiusuraRefId?: string | null;
  chiusuraData?: number | null;
  gruppoManutenzioneId?: string | null;
  fornitore?: string;
  materiali?: NextManutenzioniLegacyMaterialRecord[];
  assiCoinvolti?: string[];
  gommePerAsse?: NextManutenzioneGommePerAsseRecord[];
  gommeInterventoTipo?: NextManutenzioneGommeInterventoTipo;
  gommeStraordinario?: NextManutenzioneGommeStraordinarioRecord;
  sourceDocumentId?: string | null;
  importo?: number | null;
  sourceDocumentFileUrl?: string | null;
  sourceDocumentCurrency?: "EUR" | "CHF" | "UNKNOWN" | null;
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

type TipoVoce = "mezzo" | "compressore" | "attrezzature";
type SottoTipo = "motrice" | "trattore";
type AsseCoinvoltoId = "anteriore" | "posteriore" | "asse1" | "asse2" | "asse3";

export type NextManutenzioneGommePerAsseRecord = {
  asseId: AsseCoinvoltoId;
  dataCambio: string | null;
  kmCambio: number | null;
};

export type NextManutenzioneGommeInterventoTipo = "ordinario" | "straordinario";

export type NextManutenzioneGommeStraordinarioRecord = {
  asseId: AsseCoinvoltoId | null;
  quantita: number | null;
  motivo: string | null;
};

const VALID_ASSI_COINVOLTI = new Set<AsseCoinvoltoId>([
  "anteriore",
  "posteriore",
  "asse1",
  "asse2",
  "asse3",
]);

export type NextManutenzioneEditingFingerprint = {
  targa?: string | null;
  data?: string | null;
  descrizione?: string | null;
  stato?: string | null;
};

export type NextManutenzioneBusinessSavePayload = {
  editingSourceId?: string | null;
  /**
   * Snapshot dei campi identificativi del record in modifica. Fallback per
   * ritrovare un record privo di `id` reale senza dipendere dall'indice
   * dell'array (vedi DIAGNOSI_MODIFICA_MANUTENZIONE_2026-05-14).
   */
  editingSourceFingerprint?: NextManutenzioneEditingFingerprint | null;
  targa: string;
  tipo: TipoVoce;
  fornitore?: string | null;
  km?: number | null;
  ore?: number | null;
  sottotipo?: SottoTipo | null;
  descrizione: string;
  eseguito?: string | null;
  noteEsecuzione?: string | null;
  data: string;
  dataEsecuzione?: string | null;
  stato?: NextManutenzioneStato | null;
  dataProgrammata?: string | null;
  origineTipo?: NextManutenzioneOrigineTipo | null;
  origineRefId?: string | null;
  origineRefKey?: string | null;
  origineRefs?: NextManutenzioneOrigineRef[] | null;
  segnalatoDa?: string | null;
  eseguitoDa?: string | null;
  urgenza?: NextManutenzioneUrgenza | null;
  chiusuraDi?: string | null;
  chiusuraRefId?: string | null;
  chiusuraData?: number | null;
  materiali?: NextManutenzioniLegacyMaterialRecord[];
  assiCoinvolti?: string[];
  gommePerAsse?: NextManutenzioneGommePerAsseRecord[];
  gommeInterventoTipo?: NextManutenzioneGommeInterventoTipo | null;
  gommeStraordinario?: NextManutenzioneGommeStraordinarioRecord | null;
  sourceDocumentId?: string | null;
  importo?: number | null;
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

function sanitizeAssiCoinvolti(value: unknown): AsseCoinvoltoId[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((entry) => normalizeText(entry).toLowerCase())
        .filter((entry): entry is AsseCoinvoltoId =>
          VALID_ASSI_COINVOLTI.has(entry as AsseCoinvoltoId),
        ),
    ),
  );
}

function sanitizeGommePerAsse(
  value: unknown,
  fallbackDataCambio: string | null,
  fallbackKmCambio: number | null,
): NextManutenzioneGommePerAsseRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map<NextManutenzioneGommePerAsseRecord | null>((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as RawRecord;
      const asseId = sanitizeAssiCoinvolti([raw.asseId])[0] ?? null;
      if (!asseId) return null;

      return {
        asseId,
        dataCambio: normalizeOptionalText(raw.dataCambio) ?? fallbackDataCambio,
        kmCambio: normalizeNumber(raw.kmCambio) ?? fallbackKmCambio,
      };
    })
    .filter((entry): entry is NextManutenzioneGommePerAsseRecord => Boolean(entry));
}

function sanitizeGommeInterventoTipo(
  value: unknown,
): NextManutenzioneGommeInterventoTipo | null {
  const normalized = normalizeLowerText(value);
  if (normalized === "ordinario") return "ordinario";
  if (normalized === "straordinario") return "straordinario";
  return null;
}

function sanitizeGommeStraordinario(
  value: unknown,
): NextManutenzioneGommeStraordinarioRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as RawRecord;
  const asseId = sanitizeAssiCoinvolti([raw.asseId])[0] ?? null;
  const quantita = normalizeNumber(raw.quantita);
  const motivo = normalizeOptionalText(raw.motivo);

  if (!asseId && quantita === null && !motivo) {
    return null;
  }

  return {
    asseId,
    quantita,
    motivo,
  };
}

function resolveGommeInterventoTipo(args: {
  explicitTipo: unknown;
  descrizione: string | null;
  assiCoinvolti: AsseCoinvoltoId[];
  gommePerAsse: NextManutenzioneGommePerAsseRecord[];
  gommeStraordinario: NextManutenzioneGommeStraordinarioRecord | null;
}): NextManutenzioneGommeInterventoTipo | null {
  const explicitTipo = sanitizeGommeInterventoTipo(args.explicitTipo);
  if (explicitTipo) return explicitTipo;
  if (args.gommeStraordinario) return "straordinario";
  if (args.gommePerAsse.length > 0 || args.assiCoinvolti.length > 0) return "ordinario";
  if (isCambioGommeDerived(args.descrizione)) return "straordinario";
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

function formatRecordDateLabel(value: unknown): string {
  const parsed = parseDateFlexible(value);
  return parsed ? toDisplay(parsed) : "";
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
  return normalized.includes("CAMBIO GOMME") || normalized.includes("GOMME") || normalized.includes("PNEUM");
}

function buildHistoryId(raw: RawRecord, index: number, mezzoTarga: string): string {
  const id = normalizeText(raw.id);
  if (id) return id;
  return `manutenzione:${mezzoTarga}:${index}`;
}

/**
 * Uniforma la targa usata negli id sintetici legacy per evitare mismatch read/update.
 */
function buildHistoryTargaKey(rawTarga: string): string {
  return normalizeNextMezzoTarga(rawTarga) || normalizeText(rawTarga).toUpperCase();
}

function normalizeLegacyTipo(raw: RawRecord): TipoVoce {
  const tipo = normalizeLowerText(raw.tipo);
  if (tipo === "compressore") {
    return "compressore";
  }
  if (tipo === "attrezzature") {
    return "attrezzature";
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
        unita: normalizeNextMagazzinoStockUnitLoose(raw.unita) || "pz",
        fromInventario: Boolean(raw.fromInventario),
        ...(refId ? { refId } : {}),
      };
    })
    .filter((entry): entry is NextManutenzioniLegacyMaterialRecord => Boolean(entry));
}

function normalizeSourceDocumentCurrency(value: unknown): "EUR" | "CHF" | "UNKNOWN" | null {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return null;
  if (normalized === "EUR") return "EUR";
  if (normalized === "CHF") return "CHF";
  if (normalized === "UNKNOWN") return "UNKNOWN";
  return null;
}

function hasOwnField(record: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function sanitizeManutenzioneStato(value: unknown): NextManutenzioneStato | null {
  const normalized = normalizeText(value);
  if (
    normalized === "daFare" ||
    normalized === "programmata" ||
    normalized === "eseguita" ||
    normalized === "chiusa_da_evento"
  ) {
    return normalized;
  }
  return null;
}

function sanitizeManutenzioneOrigineTipo(value: unknown): NextManutenzioneOrigineTipo | null {
  const normalized = normalizeLowerText(value);
  if (normalized === "manuale" || normalized === "controllo" || normalized === "segnalazione") {
    return normalized;
  }
  return null;
}

function sanitizeManutenzioneUrgenza(value: unknown): NextManutenzioneUrgenza | null {
  const normalized = normalizeLowerText(value);
  if (normalized === "alta" || normalized === "media" || normalized === "bassa") {
    return normalized;
  }
  return null;
}

function hasLegacyExecutionFields(raw: RawRecord): boolean {
  if (normalizeOptionalText(raw.dataEsecuzione)) return true;
  if (normalizeNumber(raw.km) !== null || normalizeNumber(raw.ore) !== null) return true;
  return normalizeNumber(raw.importo) !== null;
}

function resolveLegacyManutenzioneStato(raw: RawRecord): NextManutenzioneStato {
  const explicitStato = sanitizeManutenzioneStato(raw.stato);
  if (explicitStato) return explicitStato;

  // Regola fallback legacy: data e fornitore/officina non determinano lo stato.
  // Senza stato esplicito, servono segnali operativi di esecuzione.
  return hasLegacyExecutionFields(raw) ? "eseguita" : "daFare";
}

function optionalTextField(raw: RawRecord, field: string): string | null | undefined {
  if (!hasOwnField(raw, field)) return undefined;
  return normalizeOptionalText(raw[field]);
}

function optionalNumberField(raw: RawRecord, field: string): number | null | undefined {
  if (!hasOwnField(raw, field)) return undefined;
  return normalizeNumber(raw[field]);
}

function optionalOrigineTipoField(raw: RawRecord): NextManutenzioneOrigineTipo | null | undefined {
  if (!hasOwnField(raw, "origineTipo")) return undefined;
  return sanitizeManutenzioneOrigineTipo(raw.origineTipo);
}

function optionalUrgenzaField(raw: RawRecord): NextManutenzioneUrgenza | null | undefined {
  if (!hasOwnField(raw, "urgenza")) return undefined;
  return sanitizeManutenzioneUrgenza(raw.urgenza);
}

async function readSourceDocumentMetadataByIds(sourceDocumentIds: string[]): Promise<
  Map<string, { fileUrl: string | null; currency: "EUR" | "CHF" | "UNKNOWN" | null }>
> {
  const uniqueIds = Array.from(new Set(sourceDocumentIds.map((entry) => normalizeText(entry)).filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const entries = await Promise.all(
    uniqueIds.map(async (sourceDocumentId) => {
      const snapshot = await getDoc(doc(db, DOCUMENTI_MEZZI_COLLECTION, sourceDocumentId));
      if (!snapshot.exists()) {
        return [sourceDocumentId, { fileUrl: null, currency: null }] as const;
      }

      const raw = ((snapshot.data() as RawRecord | undefined) ?? {}) as RawRecord;
      return [
        sourceDocumentId,
        {
          fileUrl: normalizeOptionalText(raw.fileUrl),
          currency:
            normalizeSourceDocumentCurrency(raw.valuta) ??
            normalizeSourceDocumentCurrency(raw.currency),
        },
      ] as const;
    }),
  );

  return new Map(entries);
}

function toLegacyDatasetRecord(
  raw: RawRecord,
  index: number,
): NextManutenzioniLegacyDatasetRecord | null {
  const targa = buildHistoryTargaKey(normalizeText(raw.targa));
  const assiCoinvolti = sanitizeAssiCoinvolti(raw.assiCoinvolti);
  const tipo = normalizeLegacyTipo(raw);
  const materiali = sanitizeLegacyMateriali(raw.materiali);
  const descrizione =
    normalizeOptionalText(raw.descrizione) ??
    normalizeOptionalText(raw.tipo) ??
    "Manutenzione";
  const data =
    normalizeOptionalText(raw.data) ??
    formatRecordDateLabel(raw.timestamp ?? raw.createdAt ?? raw.updatedAt);
  const kmCambio = normalizeNumber(raw.km);
  const gommePerAsseSanitized = sanitizeGommePerAsse(raw.gommePerAsse, data, kmCambio);
  const gommeStraordinario = sanitizeGommeStraordinario(raw.gommeStraordinario);
  const gommeInterventoTipo = resolveGommeInterventoTipo({
    explicitTipo: raw.gommeInterventoTipo,
    descrizione,
    assiCoinvolti,
    gommePerAsse: gommePerAsseSanitized,
    gommeStraordinario,
  });
  const gommePerAsse =
    gommeInterventoTipo === "ordinario" && gommePerAsseSanitized.length > 0
      ? gommePerAsseSanitized
      : gommeInterventoTipo === "ordinario" && assiCoinvolti.length > 0
        ? assiCoinvolti.map((asseId) => ({
            asseId,
            dataCambio: data,
            kmCambio,
          }))
        : [];
  const stato = resolveLegacyManutenzioneStato(raw);
  const dataEsecuzione = optionalTextField(raw, "dataEsecuzione");
  const dataProgrammata = optionalTextField(raw, "dataProgrammata");
  const origineTipo = optionalOrigineTipoField(raw);
  const origineRefId = optionalTextField(raw, "origineRefId");
  const origineRefKey = optionalTextField(raw, "origineRefKey");
  const origineRefs = readLegamiOrigine(raw);
  const segnalatoDa = optionalTextField(raw, "segnalatoDa");
  const eseguitoDa = optionalTextField(raw, "eseguitoDa");
  const noteEsecuzione = optionalTextField(raw, "noteEsecuzione");
  const urgenza = optionalUrgenzaField(raw);
  const chiusuraDi = optionalTextField(raw, "chiusuraDi");
  const chiusuraRefId = optionalTextField(raw, "chiusuraRefId");
  const chiusuraData = optionalNumberField(raw, "chiusuraData");
  const gruppoManutenzioneId = optionalTextField(raw, "gruppoManutenzioneId");

  return {
    id: buildHistoryId(raw, index, targa),
    targa,
    km: kmCambio,
    ore: normalizeNumber(raw.ore),
    sottotipo: tipo === "compressore" ? normalizeLegacySottotipo(raw.sottotipo) : null,
    descrizione,
    eseguito: normalizeOptionalText(raw.eseguito),
    ...(noteEsecuzione !== undefined ? { noteEsecuzione } : {}),
    data,
    ...(dataEsecuzione !== undefined ? { dataEsecuzione } : {}),
    tipo,
    stato,
    ...(dataProgrammata !== undefined ? { dataProgrammata } : {}),
    ...(origineTipo !== undefined ? { origineTipo } : {}),
    ...(origineRefId !== undefined ? { origineRefId } : {}),
    ...(origineRefKey !== undefined ? { origineRefKey } : {}),
    ...(origineRefs.length > 0 ? { origineRefs } : {}),
    ...(segnalatoDa !== undefined ? { segnalatoDa } : {}),
    ...(eseguitoDa !== undefined ? { eseguitoDa } : {}),
    ...(urgenza !== undefined ? { urgenza } : {}),
    ...(chiusuraDi !== undefined ? { chiusuraDi } : {}),
    ...(chiusuraRefId !== undefined ? { chiusuraRefId } : {}),
    ...(chiusuraData !== undefined ? { chiusuraData } : {}),
    ...(gruppoManutenzioneId !== undefined ? { gruppoManutenzioneId } : {}),
    fornitore:
      normalizeOptionalText(raw.fornitore) ??
      normalizeOptionalText(raw.fornitoreLabel) ??
      normalizeOptionalText(raw.eseguito) ??
      undefined,
    materiali,
    importo: normalizeNumber(raw.importo),
    ...(gommeInterventoTipo ? { gommeInterventoTipo } : {}),
    ...(gommeStraordinario ? { gommeStraordinario } : {}),
    ...(gommeInterventoTipo === "ordinario" && assiCoinvolti.length > 0 ? { assiCoinvolti } : {}),
    ...(gommePerAsse.length > 0 ? { gommePerAsse } : {}),
    ...(normalizeOptionalText(raw.sourceDocumentId) != null
      ? { sourceDocumentId: normalizeOptionalText(raw.sourceDocumentId) }
      : {}),
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
  const mezzoTarga = buildHistoryTargaKey(normalizeText(raw.targa));
  if (!mezzoTarga) return null;

  const descrizione = normalizeOptionalText(raw.descrizione);
  const isGomme = isCambioGommeDerived(descrizione);
  const materiali = Array.isArray(raw.materiali) ? raw.materiali : [];
  const dataRaw = normalizeOptionalText(raw.data);
  const km = normalizeNumber(raw.km);
  const stato = resolveLegacyManutenzioneStato(raw);
  const assiCoinvolti = sanitizeAssiCoinvolti(raw.assiCoinvolti);
  const gommePerAsseSanitized = sanitizeGommePerAsse(raw.gommePerAsse, dataRaw, km);
  const gommeStraordinario = sanitizeGommeStraordinario(raw.gommeStraordinario);
  const gommeInterventoTipo = resolveGommeInterventoTipo({
    explicitTipo: raw.gommeInterventoTipo,
    descrizione,
    assiCoinvolti,
    gommePerAsse: gommePerAsseSanitized,
    gommeStraordinario,
  });
  const gommePerAsse =
    gommeInterventoTipo === "ordinario" && gommePerAsseSanitized.length > 0
      ? gommePerAsseSanitized
      : gommeInterventoTipo === "ordinario" && assiCoinvolti.length > 0
        ? assiCoinvolti.map((asseId) => ({
            asseId,
            dataCambio: dataRaw,
            kmCambio: km,
          }))
        : [];
  const origineRefs = readLegamiOrigine(raw);

  return {
    id: buildHistoryId(raw, index, mezzoTarga),
    mezzoTarga,
    dataRaw,
    timestamp: parseDateFlexible(raw.data)?.getTime() ?? null,
    descrizione,
    tipo: normalizeOptionalText(raw.tipo),
    km,
    ore: normalizeNumber(raw.ore),
    eseguitoLabel: normalizeOptionalText(raw.eseguito),
    fornitoreLabel:
      normalizeOptionalText(raw.fornitore) ??
      normalizeOptionalText(raw.fornitoreLabel) ??
      normalizeOptionalText(raw.eseguito),
    materialiCount: materiali.length,
    assiCoinvolti: gommeInterventoTipo === "ordinario" ? assiCoinvolti : [],
    gommePerAsse,
    gommeInterventoTipo,
    gommeStraordinario,
    isCambioGommeDerived: isGomme,
    stato,
    dataProgrammata: normalizeOptionalText(raw.dataProgrammata),
    origineTipo: sanitizeManutenzioneOrigineTipo(raw.origineTipo),
    origineRefId: normalizeOptionalText(raw.origineRefId),
    origineRefKey: normalizeOptionalText(raw.origineRefKey),
    origineRefs,
    segnalatoDa: normalizeOptionalText(raw.segnalatoDa),
    urgenza: sanitizeManutenzioneUrgenza(raw.urgenza),
    chiusuraDi: normalizeOptionalText(raw.chiusuraDi),
    chiusuraRefId: normalizeOptionalText(raw.chiusuraRefId),
    chiusuraData: normalizeNumber(raw.chiusuraData),
    gruppoManutenzioneId: normalizeOptionalText(raw.gruppoManutenzioneId),
    sourceDataset: MANUTENZIONI_KEY,
    sourceOrigin: isGomme ? "autisti_gomme_derivato" : descrizione ? "manuale" : "unknown",
    quality: isGomme ? "derived_acceptable" : "source_direct",
    sourceDocumentId: normalizeOptionalText(raw.sourceDocumentId),
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
  const baseRecords = manutenzioniRaw
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

  const sourceDocumentMetadata = await readSourceDocumentMetadataByIds(
    baseRecords
      .map((entry) => normalizeOptionalText(entry.sourceDocumentId))
      .filter((entry): entry is string => Boolean(entry)),
  );

  return baseRecords.map((entry) => {
    const sourceDocumentId = normalizeOptionalText(entry.sourceDocumentId);
    if (!sourceDocumentId) return entry;
    const metadata = sourceDocumentMetadata.get(sourceDocumentId);
    if (!metadata) return entry;
    return {
      ...entry,
      sourceDocumentFileUrl: metadata.fileUrl,
      sourceDocumentCurrency: metadata.currency,
    };
  });
}

export async function readNextManutenzioniDaFareSnapshot(): Promise<
  NextManutenzioniLegacyDatasetRecord[]
> {
  const records = await readNextManutenzioniLegacyDataset();
  return records.filter((record) => record.stato === "daFare");
}

export async function readNextManutenzioniDaFareAndProgrammataGlobalSnapshot(): Promise<
  NextManutenzioniLegacyDatasetRecord[]
> {
  const records = await readNextManutenzioniLegacyDataset();
  return records.filter((record) => record.stato === "daFare" || record.stato === "programmata");
}

export async function getNextManutenzioneOrigineRecord(
  origineRefKey: string | null | undefined,
  origineRefId: string | null | undefined,
): Promise<NextManutenzioneOrigineRecord | null> {
  const key = normalizeOptionalText(origineRefKey);
  const id = normalizeOptionalText(origineRefId);
  if (!key || !id) return null;
  if (key !== SEGNALAZIONI_AUTISTI_KEY && key !== CONTROLLI_MEZZO_AUTISTI_KEY) {
    return null;
  }

  const rows = await readStorageDataset(key);
  const match = rows.find((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return normalizeOptionalText((entry as RawRecord).id) === id;
  });
  if (!match || typeof match !== "object") return null;

  return {
    origineRefKey: key,
    origineRefId: id,
    origineTipo: key === SEGNALAZIONI_AUTISTI_KEY ? "segnalazione" : "controllo",
    data: match as Record<string, unknown>,
  };
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
    unita: normalizeNextMagazzinoStockUnitLoose(item.unita) || "pz",
    fromInventario: Boolean(item.fromInventario),
    ...(normalizeNextMagazzinoStockRefId(item.refId)
      ? { refId: normalizeNextMagazzinoStockRefId(item.refId) ?? undefined }
      : {}),
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
  forcedRecordId?: string | null,
): NextManutenzioniLegacyDatasetRecord {
  const targa = normalizeNextMezzoTarga(payload.targa) || normalizeText(payload.targa).toUpperCase();
  const assiCoinvolti = sanitizeAssiCoinvolti(payload.assiCoinvolti);
  const km = payload.tipo === "mezzo" ? normalizeNumber(payload.km) : null;
  const data = normalizeOptionalText(payload.data) ?? "";
  const gommePerAsseSanitized = sanitizeGommePerAsse(payload.gommePerAsse, data, km);
  const gommeStraordinario = sanitizeGommeStraordinario(payload.gommeStraordinario);
  const gommeInterventoTipo = resolveGommeInterventoTipo({
    explicitTipo: payload.gommeInterventoTipo,
    descrizione: normalizeOptionalText(payload.descrizione),
    assiCoinvolti,
    gommePerAsse: gommePerAsseSanitized,
    gommeStraordinario,
  });
  const gommePerAsse =
    gommeInterventoTipo === "ordinario" && gommePerAsseSanitized.length > 0
      ? gommePerAsseSanitized
      : gommeInterventoTipo === "ordinario" && assiCoinvolti.length > 0
        ? assiCoinvolti.map((asseId) => ({
            asseId,
            dataCambio: data,
            kmCambio: km,
          }))
        : [];
  const payloadRaw = payload as unknown as RawRecord;
  const dataEsecuzione = hasOwnField(payloadRaw, "dataEsecuzione")
    ? normalizeOptionalText(payload.dataEsecuzione)
    : undefined;
  const stato = hasOwnField(payloadRaw, "stato") ? sanitizeManutenzioneStato(payload.stato) : undefined;
  const dataProgrammata = hasOwnField(payloadRaw, "dataProgrammata")
    ? normalizeOptionalText(payload.dataProgrammata)
    : undefined;
  const origineTipo = hasOwnField(payloadRaw, "origineTipo")
    ? sanitizeManutenzioneOrigineTipo(payload.origineTipo)
    : undefined;
  const origineRefId = hasOwnField(payloadRaw, "origineRefId")
    ? normalizeOptionalText(payload.origineRefId)
    : undefined;
  const origineRefKey = hasOwnField(payloadRaw, "origineRefKey")
    ? normalizeOptionalText(payload.origineRefKey)
    : undefined;
  const origineRefsPatch = hasOwnField(payloadRaw, "origineRefs")
    ? (writeLegamiOrigine(
        Array.isArray(payload.origineRefs) ? payload.origineRefs : [],
      ) as Partial<NextManutenzioniLegacyDatasetRecord>)
    : null;
  const segnalatoDa = hasOwnField(payloadRaw, "segnalatoDa")
    ? normalizeOptionalText(payload.segnalatoDa)
    : undefined;
  const eseguitoDa = hasOwnField(payloadRaw, "eseguitoDa")
    ? normalizeOptionalText(payload.eseguitoDa)
    : undefined;
  const urgenza = hasOwnField(payloadRaw, "urgenza")
    ? sanitizeManutenzioneUrgenza(payload.urgenza)
    : undefined;
  const noteEsecuzione = hasOwnField(payloadRaw, "noteEsecuzione")
    ? normalizeOptionalText(payload.noteEsecuzione)
    : undefined;
  return {
    id: normalizeOptionalText(forcedRecordId) ?? buildGeneratedId(),
    targa,
    tipo: payload.tipo,
    fornitore: normalizeOptionalText(payload.fornitore) ?? undefined,
    km,
    ore: payload.tipo === "compressore" || payload.tipo === "attrezzature" ? normalizeNumber(payload.ore) : null,
    sottotipo: payload.tipo === "compressore" ? payload.sottotipo ?? null : null,
    descrizione: normalizeOptionalText(payload.descrizione) ?? "Manutenzione",
    eseguito: normalizeOptionalText(payload.eseguito),
    ...(noteEsecuzione !== undefined ? { noteEsecuzione } : {}),
    data,
    ...(dataEsecuzione !== undefined ? { dataEsecuzione } : {}),
    ...(stato !== undefined ? { stato } : {}),
    ...(dataProgrammata !== undefined ? { dataProgrammata } : {}),
    ...(origineRefsPatch ?? {}),
    ...(!origineRefsPatch && origineTipo !== undefined ? { origineTipo } : {}),
    ...(!origineRefsPatch && origineRefId !== undefined ? { origineRefId } : {}),
    ...(!origineRefsPatch && origineRefKey !== undefined ? { origineRefKey } : {}),
    ...(segnalatoDa !== undefined ? { segnalatoDa } : {}),
    ...(eseguitoDa !== undefined ? { eseguitoDa } : {}),
    ...(urgenza !== undefined ? { urgenza } : {}),
    materiali: sanitizeMaterialiForWrite(payload.materiali),
    importo: typeof payload.importo === "number" ? payload.importo : null,
    ...(gommeInterventoTipo ? { gommeInterventoTipo } : {}),
    ...(gommeStraordinario && gommeInterventoTipo === "straordinario" ? { gommeStraordinario } : {}),
    ...(gommeInterventoTipo === "ordinario" && assiCoinvolti.length > 0 ? { assiCoinvolti } : {}),
    ...(gommePerAsse.length > 0 ? { gommePerAsse } : {}),
    ...(payload.sourceDocumentId != null ? { sourceDocumentId: payload.sourceDocumentId } : {}),
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
  return buildHistoryId(raw as RawRecord, index, buildHistoryTargaKey(normalizeText((raw as RawRecord).targa))) === recordId;
}

function findLegacyRecordIndex(
  items: unknown[],
  recordId: string,
): number {
  return items.findIndex((entry, index) => matchLegacyRecordById(entry, index, recordId));
}

/**
 * Fallback per ritrovare un record privo di `id` reale: l'id sintetico
 * `manutenzione:<targa>:<index>` dipende dalla posizione nell'array e non e'
 * affidabile fra letture diverse. Il fingerprint dei campi identificativi del
 * record originale lo ritrova senza dipendere dall'indice. Usato solo come
 * fallback transitorio: dopo il primo salvataggio il record riceve un `id` reale.
 */
export function findLegacyRecordIndexByFingerprint(
  items: unknown[],
  fingerprint: NextManutenzioneEditingFingerprint | null | undefined,
): number {
  if (!fingerprint) return -1;
  const targa = buildHistoryTargaKey(normalizeText(fingerprint.targa));
  const data = normalizeText(fingerprint.data);
  const descrizione = normalizeText(fingerprint.descrizione);
  const stato = normalizeText(fingerprint.stato);
  if (!targa || !data || !descrizione) return -1;
  return items.findIndex((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const raw = entry as RawRecord;
    if (buildHistoryTargaKey(normalizeText(raw.targa)) !== targa) return false;
    if (normalizeText(raw.data) !== data) return false;
    if (normalizeText(raw.descrizione) !== descrizione) return false;
    const rawStato = normalizeText(raw.stato);
    // `stato` confrontato solo se presente su entrambi i lati (il reader puo'
    // derivare lo stato, quindi e' un identificatore debole).
    if (stato && rawStato && stato !== rawStato) return false;
    return true;
  });
}

function sanitizeInventarioArray(items: unknown[]): NextLegacyInventarioRecord[] {
  return items.filter((item): item is NextLegacyInventarioRecord => Boolean(item) && typeof item === "object");
}

function resolveLegacyInventarioIndex(
  inventario: NextLegacyInventarioRecord[],
  materiale: NextManutenzioniLegacyMaterialRecord,
): number {
  const refId = normalizeNextMagazzinoStockRefId(materiale.refId);
  if (!refId) return -1;
  return inventario.findIndex((item) => String(item.id ?? "").trim() === refId);
}

async function persistLegacyMaterialEffects(args: {
  targa: string;
  data: string;
  materiali: NextManutenzioniLegacyMaterialRecord[];
}): Promise<void> {
  const [inventarioRaw, materialiConsegnatiRaw] = await Promise.all([
    getItemSync(INVENTARIO_KEY),
    getItemSync(MATERIALI_CONSEGNATI_KEY),
  ]);

  const inventarioAggiornato = sanitizeInventarioArray(unwrapStoredValueArray(inventarioRaw)).map((item) => ({ ...item }));
  const materialiConsegnatiAggiornati = unwrapStoredValueArray(materialiConsegnatiRaw).map((item) =>
    item && typeof item === "object" ? { ...(item as Record<string, unknown>) } : item,
  );

  for (const materiale of args.materiali) {
    if (!materiale.fromInventario || !materiale.refId) continue;

    const index = resolveLegacyInventarioIndex(inventarioAggiornato, materiale);
    if (index === -1) {
      throw new Error(`Inventario non risolto per materiale manutenzione: ${materiale.label}`);
    }

    const corrente = inventarioAggiornato[index];
    if (!areNextMagazzinoUnitsCompatible(corrente.unita, materiale.unita)) {
      throw new Error(
        `Unita incoerente su materiale manutenzione: ${materiale.label} (${String(
          corrente.unita ?? "",
        )} vs ${materiale.unita})`,
      );
    }
    const quantitaAttuale = normalizeNumber(corrente.quantitaTotale ?? corrente.quantita) ?? 0;
    if (quantitaAttuale < materiale.quantita) {
      throw new Error(`Stock insufficiente per materiale manutenzione: ${materiale.label}`);
    }
    const nuovaQuantita = quantitaAttuale - materiale.quantita;
    inventarioAggiornato[index] = {
      ...corrente,
      quantitaTotale: nuovaQuantita,
      quantita: nuovaQuantita,
      unita: normalizeNextMagazzinoStockUnit(corrente.unita) ?? corrente.unita,
      stockKey:
        buildNextMagazzinoStockKey({
          stockKey: corrente.stockKey,
          descrizione: corrente.descrizione ?? corrente.label ?? corrente.nome,
          fornitore:
            corrente.fornitore ?? corrente.fornitoreLabel ?? corrente.nomeFornitore,
          unita: corrente.unita,
        }) ?? corrente.stockKey ?? null,
    };

    const entryTimestamp = Date.now();
    materialiConsegnatiAggiornati.push({
      id: `${entryTimestamp}_${materiale.id}`,
      tipo: "OUT",
      direzione: "OUT",
      data: args.data,
      materialeId: materiale.refId,
      inventarioRefId: materiale.refId,
      materialeLabel: materiale.label,
      materiale: materiale.label,
      descrizione: materiale.label,
      quantita: materiale.quantita,
      unita: normalizeNextMagazzinoStockUnit(materiale.unita) ?? materiale.unita,
      origine: "MANUTENZIONE",
      targa: args.targa,
      mezzoTarga: args.targa,
      fornitore: normalizeOptionalText(corrente.fornitore) ?? "",
      fornitoreLabel: normalizeOptionalText(corrente.fornitore) ?? "",
      stockKey:
        buildNextMagazzinoStockKey({
          stockKey: corrente.stockKey,
          descrizione:
            corrente.descrizione ?? corrente.label ?? corrente.nome ?? materiale.label,
          fornitore:
            corrente.fornitore ?? corrente.fornitoreLabel ?? corrente.nomeFornitore,
          unita: corrente.unita ?? materiale.unita,
        }) ?? null,
      destinatario: {
        type: "MEZZO",
        refId: args.targa,
        label: args.targa,
      },
      motivo: "UTILIZZO MANUTENZIONE",
    });
  }

  await setItemSync(INVENTARIO_KEY, inventarioAggiornato);
  await setItemSync(MATERIALI_CONSEGNATI_KEY, materialiConsegnatiAggiornati);
}

export async function saveNextManutenzioneBusinessRecord(
  payload: NextManutenzioneBusinessSavePayload,
): Promise<NextManutenzioniLegacyDatasetRecord> {
  const storicoRaw = await readStoredArrayByKey(MANUTENZIONI_KEY);
  const editingSourceId = normalizeOptionalText(payload.editingSourceId);

  // Localizzazione del record da aggiornare: prima per id, poi (fallback
  // transitorio per i record privi di id reale) per fingerprint dei campi
  // identificativi. Vedi DIAGNOSI_MODIFICA_MANUTENZIONE_2026-05-14.
  let existingIndex = editingSourceId ? findLegacyRecordIndex(storicoRaw, editingSourceId) : -1;
  if (existingIndex === -1 && editingSourceId) {
    existingIndex = findLegacyRecordIndexByFingerprint(storicoRaw, payload.editingSourceFingerprint);
  }
  const existingRaw =
    existingIndex >= 0 && storicoRaw[existingIndex] && typeof storicoRaw[existingIndex] === "object"
      ? (storicoRaw[existingIndex] as RawRecord)
      : null;

  // Id stabile alla radice: se il record esistente ha gia' un id reale lo si
  // preserva; se l'id e' assente o sintetico (`manutenzione:*`, basato
  // sull'indice) gliene si assegna uno reale e persistito, cosi' i salvataggi
  // futuri lo ritrovano sempre per `raw.id`, mai piu' per posizione.
  const existingRealId = existingRaw ? normalizeOptionalText(existingRaw.id) : null;
  const existingHasStableId = Boolean(existingRealId && !existingRealId.startsWith("manutenzione:"));
  const editingSourceIsStable = Boolean(editingSourceId && !editingSourceId.startsWith("manutenzione:"));
  const forcedRecordId =
    existingRaw !== null
      ? existingHasStableId
        ? existingRealId
        : buildGeneratedId()
      : editingSourceIsStable
        ? editingSourceId
        : undefined;

  const nextRecord = sanitizeBusinessRecord(payload, forcedRecordId);
  const baseStoredRecord =
    existingRaw !== null
      ? ({ ...existingRaw, ...nextRecord } as NextManutenzioniLegacyDatasetRecord)
      : nextRecord;
  // La modifica tocca in automatico solo `updatedAt`; `data` resta quello del
  // payload (gia' preservato dal form). Nessun'altra modifica di shape.
  const nextStoredRecord = {
    ...baseStoredRecord,
    updatedAt: Date.now(),
  } as NextManutenzioniLegacyDatasetRecord;

  // Rimozione del vecchio record per indice trovato: robusta, niente ricalcolo
  // di id sensibile alla posizione nell'array.
  const nextStorico =
    existingIndex >= 0
      ? storicoRaw.filter((_, index) => index !== existingIndex)
      : storicoRaw.slice();

  nextStorico.unshift(nextStoredRecord);
  await setItemSync(MANUTENZIONI_KEY, nextStorico);

  if (!editingSourceId) {
    try {
      await persistLegacyMaterialEffects({
        targa: nextRecord.targa,
        data: nextRecord.data,
        materiali: nextRecord.materiali ?? [],
      });
    } catch (error) {
      await setItemSync(MANUTENZIONI_KEY, storicoRaw);
      throw error;
    }
  }

  // PROMPT 44 — D1: se il save porta la manutenzione a "eseguita" e c'e' una
  // sorgente collegata (segnalazione/controllo via origineRefId), propaga la
  // chiusura tramite l'orchestrator. No-op se non c'e' legame, idempotente.
  if (normalizeText((nextStoredRecord as RawRecord).stato) === "eseguita") {
    try {
      const { propagateChiusuraToLegame } = await import("../helpers/closureOrchestrator");
      await propagateChiusuraToLegame(nextStoredRecord);
    } catch (error) {
      console.warn("[PROMPT44 D1] propagazione chiusura sorgente fallita:", error);
    }
  }

  return nextStoredRecord;
}

export async function deleteNextManutenzioneBusinessRecord(
  recordId: string,
  fingerprint?: NextManutenzioneEditingFingerprint | null,
): Promise<boolean> {
  const normalizedRecordId = normalizeOptionalText(recordId);
  if (!normalizedRecordId) return false;

  const storicoRaw = await readStoredArrayByKey(MANUTENZIONI_KEY);
  // Match per id; fallback per fingerprint quando il record non ha un id reale
  // (id sintetico index-based instabile, vedi PROMPT 41).
  let recordIndex = findLegacyRecordIndex(storicoRaw, normalizedRecordId);
  if (recordIndex === -1) {
    recordIndex = findLegacyRecordIndexByFingerprint(storicoRaw, fingerprint);
  }
  if (recordIndex === -1) return false;

  const recordRaw = storicoRaw[recordIndex];
  if (!recordRaw || typeof recordRaw !== "object") return false;

  const record = toLegacyDatasetRecord(recordRaw as RawRecord, recordIndex);
  if (!record) return false;

  const targetIds = new Set(
    [normalizedRecordId, normalizeOptionalText((recordRaw as RawRecord).id), normalizeOptionalText(record.id)]
      .filter((value): value is string => Boolean(value)),
  );
  const sourceSpecs = [
    {
      key: SEGNALAZIONI_AUTISTI_KEY,
      tipo: "segnalazione" as const,
      records: (await readStoredArrayByKey(SEGNALAZIONI_AUTISTI_KEY)).filter(
        (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      ),
    },
    {
      key: CONTROLLI_MEZZO_AUTISTI_KEY,
      tipo: "controllo" as const,
      records: (await readStoredArrayByKey(CONTROLLI_MEZZO_AUTISTI_KEY)).filter(
        (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      ),
    },
  ];
  const readLinkedLavoroIds = (source: RawRecord): string[] => {
    const result = new Set<string>();
    const single = normalizeOptionalText(source.linkedLavoroId);
    if (single) result.add(single);
    if (Array.isArray(source.linkedLavoroIds)) {
      for (const value of source.linkedLavoroIds) {
        const id = normalizeOptionalText(value);
        if (id) result.add(id);
      }
    }
    return [...result];
  };
  const resolveSourceKey = (
    tipo: "segnalazione" | "controllo",
    refKey: string | null | undefined,
  ): typeof SEGNALAZIONI_AUTISTI_KEY | typeof CONTROLLI_MEZZO_AUTISTI_KEY => {
    if (refKey === SEGNALAZIONI_AUTISTI_KEY || refKey === CONTROLLI_MEZZO_AUTISTI_KEY) return refKey;
    return tipo === "segnalazione" ? SEGNALAZIONI_AUTISTI_KEY : CONTROLLI_MEZZO_AUTISTI_KEY;
  };
  const sourcesToDetach = new Map<
    string,
    { sorgenteId: string; sorgenteTipo: "segnalazione" | "controllo"; sourceKey: string }
  >();
  const addSourceToDetach = (
    sorgenteTipo: "segnalazione" | "controllo",
    sorgenteId: string | null | undefined,
    sourceKey: string,
  ) => {
    const id = normalizeOptionalText(sorgenteId);
    if (!id) return;
    sourcesToDetach.set(`${sorgenteTipo}:${id}`, { sorgenteId: id, sorgenteTipo, sourceKey });
  };

  for (const origine of readLegamiOrigine(recordRaw as RawRecord)) {
    const sourceKey = resolveSourceKey(origine.tipo, origine.refKey);
    const sourceList = sourceSpecs.find((spec) => spec.key === sourceKey)?.records ?? [];
    if (sourceList.some((source) => normalizeOptionalText(source.id) === origine.refId)) {
      addSourceToDetach(origine.tipo, origine.refId, sourceKey);
    }
  }

  for (const spec of sourceSpecs) {
    for (const source of spec.records) {
      if (readLinkedLavoroIds(source).some((id) => targetIds.has(id))) {
        addSourceToDetach(spec.tipo, normalizeOptionalText(source.id), spec.key);
      }
    }
  }

  if (sourcesToDetach.size > 0) {
    const { sganciaLegameManutenzione } = await import("../writers/sganciaLegameOrfanoWriter");
    for (const source of sourcesToDetach.values()) {
      const result = await sganciaLegameManutenzione({
        sorgenteId: source.sorgenteId,
        sorgenteTipo: source.sorgenteTipo,
        manutenzioneId: normalizedRecordId,
      });
      if (!result.ok) {
        throw new Error(result.error ?? "Sgancio sorgente collegata non riuscito.");
      }
      const verifiedRaw = await getItemSync(source.sourceKey);
      const verifiedList = unwrapStoredValueArray(verifiedRaw).filter(
        (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      );
      const verifiedSource = verifiedList.find(
        (entry) => normalizeOptionalText(entry.id) === source.sorgenteId,
      );
      if (!verifiedSource || readLinkedLavoroIds(verifiedSource).some((id) => targetIds.has(id))) {
        throw new Error("Verifica sgancio sorgente collegata fallita.");
      }
    }
  }

  const inventarioRaw = await getItemSync(INVENTARIO_KEY);
  const inventarioAggiornato = sanitizeInventarioArray(unwrapStoredValueArray(inventarioRaw)).map((item) => ({ ...item }));

  for (const materiale of record.materiali ?? []) {
    if (!materiale.fromInventario || !materiale.refId) continue;
    const index = resolveLegacyInventarioIndex(inventarioAggiornato, materiale);
    if (index === -1) {
      throw new Error(`Ripristino inventario impossibile per materiale manutenzione: ${materiale.label}`);
    }

    const corrente = inventarioAggiornato[index];
    if (!areNextMagazzinoUnitsCompatible(corrente.unita, materiale.unita)) {
      throw new Error(
        `Ripristino bloccato per unita incoerente: ${materiale.label} (${String(
          corrente.unita ?? "",
        )} vs ${materiale.unita})`,
      );
    }
    const quantitaAttuale = normalizeNumber(corrente.quantitaTotale ?? corrente.quantita) ?? 0;
    const nuovaQuantita = quantitaAttuale + (normalizeNumber(materiale.quantita) ?? 0);
    inventarioAggiornato[index] = {
      ...corrente,
      quantitaTotale: nuovaQuantita,
      quantita: nuovaQuantita,
      unita: normalizeNextMagazzinoStockUnit(corrente.unita) ?? corrente.unita,
      stockKey:
        buildNextMagazzinoStockKey({
          stockKey: corrente.stockKey,
          descrizione: corrente.descrizione ?? corrente.label ?? corrente.nome,
          fornitore:
            corrente.fornitore ?? corrente.fornitoreLabel ?? corrente.nomeFornitore,
          unita: corrente.unita,
        }) ?? corrente.stockKey ?? null,
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
  try {
    await setItemSync(INVENTARIO_KEY, inventarioAggiornato);
    await setItemSync(MATERIALI_CONSEGNATI_KEY, consegneAggiornate);
    await setItemSync(MANUTENZIONI_KEY, nextStorico);
  } catch (error) {
    await setItemSync(INVENTARIO_KEY, inventarioRaw);
    await setItemSync(MATERIALI_CONSEGNATI_KEY, consegneRaw);
    await setItemSync(MANUTENZIONI_KEY, storicoRaw);
    throw error;
  }
  return true;
}
