import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { formatDateUI, toNextDateValue } from "../nextDateFormat";
import {
  readNextAttrezzatureCantieriSnapshot,
  type NextAttrezzatureCantieriSnapshot,
} from "./nextAttrezzatureCantieriDomain";
import {
  readNextInventarioSnapshot,
  type NextInventarioSnapshot,
} from "./nextInventarioDomain";
import {
  readNextMaterialiMovimentiSnapshot,
  type NextMaterialiMovimentiSnapshot,
} from "./nextMaterialiMovimentiDomain";
import {
  readNextProcurementSnapshot,
  type NextProcurementOrderItem,
  type NextProcurementOrderState,
  type NextProcurementSnapshot,
} from "./nextProcurementDomain";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_KEY = "@manutenzioni";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextOperativitaMaintenanceItem = {
  id: string;
  targa: string | null;
  descrizione: string | null;
  data: string | null;
  timestamp: number | null;
  fornitore: string | null;
  materialiCount: number;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MANUTENZIONI_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextOperativitaNavigabilityEntry = {
  enabled: boolean;
  reason: string | null;
};

export type NextOperativitaGlobaleSnapshot = {
  domainCode: "OPERATIVITA-GLOBALE";
  domainName: "Gestione Operativa clone";
  inventario: NextInventarioSnapshot;
  materialiMovimenti: NextMaterialiMovimentiSnapshot;
  attrezzature: NextAttrezzatureCantieriSnapshot;
  manutenzioni: {
    datasetShape: NextLegacyDatasetShape;
    items: NextOperativitaMaintenanceItem[];
    counts: {
      total: number;
      withTarga: number;
      withDate: number;
      withSupplier: number;
      withMateriali: number;
    };
    limitations: string[];
  };
  procurement: NextProcurementSnapshot;
  navigability: {
    inventario: NextOperativitaNavigabilityEntry;
    materiali: NextOperativitaNavigabilityEntry;
    manutenzioni: NextOperativitaNavigabilityEntry;
    ordini: NextOperativitaNavigabilityEntry;
    attrezzature: NextOperativitaNavigabilityEntry;
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

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  if (Array.isArray(rawDoc.items)) {
    return { datasetShape: "items", items: rawDoc.items };
  }

  if (Array.isArray((rawDoc.value as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      items: (rawDoc.value as { items: unknown[] }).items,
    };
  }

  if (Array.isArray(rawDoc.value)) {
    return { datasetShape: "value", items: rawDoc.value };
  }

  return { datasetShape: "unsupported", items: [] };
}

async function readStorageDataset(key: string): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function parseDateFlexible(value: unknown): Date | null {
  return toNextDateValue(value);
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function formatLegacyDateLabel(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  return formatDateUI(new Date(timestamp));
}

function sortByTimestampDesc<T extends { id: string; timestamp: number | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const byTimestamp = (right.timestamp ?? 0) - (left.timestamp ?? 0);
    if (byTimestamp !== 0) return byTimestamp;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

function buildMaintenanceId(raw: RawRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `manutenzione:${index}`;
}

function toMaintenanceItem(raw: RawRecord, index: number): NextOperativitaMaintenanceItem | null {
  const targa = normalizeNextMezzoTarga(raw.targa);
  const descrizione = normalizeOptionalText(raw.descrizione);
  const timestamp =
    [raw.timestamp, raw.data, raw.createdAt, raw.updatedAt]
      .map((entry) => toTimestamp(entry))
      .find((entry): entry is number => entry !== null) ?? null;
  const data = normalizeOptionalText(raw.data) ?? formatLegacyDateLabel(timestamp);
  const materialiCount = Array.isArray(raw.materiali) ? raw.materiali.length : 0;
  const fornitore =
    normalizeOptionalText(raw.fornitore) ??
    normalizeOptionalText(raw.fornitoreLabel) ??
    normalizeOptionalText(raw.eseguito);
  const flags: string[] = [];

  if (!targa) flags.push("targa_assente");
  if (!descrizione) flags.push("descrizione_assente");
  if (!data) flags.push("data_assente");
  if (materialiCount > 0) flags.push("con_materiali");

  return {
    id: buildMaintenanceId(raw, index),
    targa: targa || null,
    descrizione,
    data,
    timestamp,
    fornitore,
    materialiCount,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MANUTENZIONI_KEY,
    quality:
      targa && descrizione && data
        ? "certo"
        : targa || descrizione || data
        ? "parziale"
        : "da_verificare",
    flags,
  };
}

function buildMaintenanceLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextOperativitaMaintenanceItem[];
  skippedRawRecords: number;
}): string[] {
  const { datasetShape, items, skippedRawRecords } = args;
  return [
    datasetShape === "unsupported"
      ? "Il dataset `@manutenzioni` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte dello storico manutenzioni e stata esclusa dal clone perche non esponeva i campi minimi leggibili."
      : null,
    items.some((item) => item.flags.includes("targa_assente"))
      ? "Una parte dello storico manutenzioni non espone una targa leggibile e resta fuori dai collegamenti verso Dossier."
      : null,
    items.some((item) => item.flags.includes("data_assente"))
      ? "Una parte dello storico manutenzioni non ha una data parseabile e viene lasciata con flag espliciti."
      : null,
    "Questa vista globale resta read-only: nessuna registrazione interventi o scarico inventario viene riattivata nel clone.",
  ].filter((entry): entry is string => Boolean(entry));
}

export type NextOperativitaOrdiniFilter = "all" | NextProcurementOrderState;

export function buildNextOperativitaOrdiniView(
  snapshot: NextProcurementSnapshot,
  filter: NextOperativitaOrdiniFilter
): NextProcurementOrderItem[] {
  if (filter === "in_attesa") return snapshot.groups.pending;
  if (filter === "parziale") return snapshot.groups.partial;
  if (filter === "arrivato") return snapshot.groups.arrived;
  return [...snapshot.groups.pending, ...snapshot.groups.partial, ...snapshot.groups.arrived];
}

export async function readNextOperativitaGlobaleSnapshot(): Promise<NextOperativitaGlobaleSnapshot> {
  const [inventario, materialiMovimenti, attrezzature, manutenzioniDataset, procurement] =
    await Promise.all([
      readNextInventarioSnapshot({ includeCloneOverlays: false }),
      readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false }),
      readNextAttrezzatureCantieriSnapshot(),
      readStorageDataset(MANUTENZIONI_KEY),
      readNextProcurementSnapshot({ includeCloneOverlays: false }),
    ]);

  const mappedManutenzioni = manutenzioniDataset.items.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toMaintenanceItem(entry as RawRecord, index);
  });

  const manutenzioniItems = sortByTimestampDesc(
    mappedManutenzioni.filter((entry): entry is NextOperativitaMaintenanceItem => Boolean(entry))
  );
  const manutenzioniSkipped = mappedManutenzioni.length - manutenzioniItems.length;

  const manutenzioni = {
    datasetShape: manutenzioniDataset.datasetShape,
    items: manutenzioniItems,
    counts: {
      total: manutenzioniItems.length,
      withTarga: manutenzioniItems.filter((item) => Boolean(item.targa)).length,
      withDate: manutenzioniItems.filter((item) => Boolean(item.data)).length,
      withSupplier: manutenzioniItems.filter((item) => Boolean(item.fornitore)).length,
      withMateriali: manutenzioniItems.filter((item) => item.materialiCount > 0).length,
    },
    limitations: buildMaintenanceLimitations({
      datasetShape: manutenzioniDataset.datasetShape,
      items: manutenzioniItems,
      skippedRawRecords: manutenzioniSkipped,
    }),
  };

  return {
    domainCode: "OPERATIVITA-GLOBALE",
    domainName: "Gestione Operativa clone",
    inventario,
    materialiMovimenti,
    attrezzature,
    manutenzioni,
    procurement,
    navigability: {
      inventario: {
        enabled: true,
        reason:
          "Inventario e aperto nel clone in sola lettura: nuovo materiale, modifica, delete, variazione quantita, PDF e foto restano bloccati.",
      },
      materiali: {
        enabled: true,
        reason:
          "Materiali consegnati e aperto nel clone in sola lettura: nuova consegna, delete e scarico/ripristino inventario restano bloccati.",
      },
      manutenzioni: {
        enabled: true,
        reason:
          "La vista manutenzioni resta read-only: nessuna registrazione interventi o scarico inventario viene riattivata nel clone.",
      },
      ordini: {
        enabled: true,
        reason:
          "L'area procurement del clone legge solo `@ordini`: ordini, arrivi e dettaglio ordine sono read-only, mentre preventivi, listino e workflow scriventi restano bloccati.",
      },
      attrezzature: {
        enabled: true,
        reason:
          "Attrezzature cantieri e aperto nel clone solo per stato attuale e registro movimenti: nuovo movimento, modifica, delete e foto restano bloccati.",
      },
    },
    limitations: [
      ...inventario.limitations,
      ...materialiMovimenti.limitations,
      ...attrezzature.limitations,
      ...manutenzioni.limitations,
      ...procurement.limitations,
    ],
  };
}
