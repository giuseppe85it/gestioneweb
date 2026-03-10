import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";
const MEZZI_KEY = "@mezzi_aziendali";
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

async function readStorageDataset(key: string): Promise<unknown[]> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const isoLike = Date.parse(raw);
  if (!Number.isNaN(isoLike)) return new Date(isoLike);

  const dmyMatch = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (dmyMatch) {
    const yearRaw = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const month = Number(dmyMatch[2]) - 1;
    const day = Number(dmyMatch[1]);
    const date = new Date(year, month, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
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
