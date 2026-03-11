import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const STORAGE_COLLECTION = "storage";
const ATTREZZATURE_KEY = "@attrezzature_cantieri";

const NEXT_ATTREZZATURE_TIPI_MOVIMENTO = [
  "CONSEGNATO",
  "SPOSTATO",
  "RITIRATO",
] as const;

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_ATTREZZATURE_CANTIERI_DOMAIN = {
  code: "D05-ATTREZZATURE",
  name: "Attrezzature cantieri clone-safe",
  logicalDatasets: [ATTREZZATURE_KEY] as const,
  activeReadOnlyDataset: ATTREZZATURE_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY ATTREZZATURE SU @attrezzature_cantieri",
  movimentoTypes: NEXT_ATTREZZATURE_TIPI_MOVIMENTO,
} as const;

export type NextAttrezzaturaMovimentoTipo =
  (typeof NEXT_ATTREZZATURE_CANTIERI_DOMAIN.movimentoTypes)[number];

export type NextAttrezzaturaMovimentoReadOnlyItem = {
  id: string;
  tipo: NextAttrezzaturaMovimentoTipo;
  data: string | null;
  timestamp: number | null;
  materialeCategoria: string | null;
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereId: string | null;
  cantiereLabel: string;
  note: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sourceCantiereId: string | null;
  sourceCantiereLabel: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof ATTREZZATURE_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextAttrezzaturaStatoMateriale = {
  descrizione: string;
  unita: string;
  quantita: number;
};

export type NextAttrezzaturaStatoCantiere = {
  id: string;
  label: string;
  materiali: NextAttrezzaturaStatoMateriale[];
};

export type NextAttrezzatureCantieriSnapshot = {
  domainCode: typeof NEXT_ATTREZZATURE_CANTIERI_DOMAIN.code;
  domainName: typeof NEXT_ATTREZZATURE_CANTIERI_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_ATTREZZATURE_CANTIERI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_ATTREZZATURE_CANTIERI_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  movementTypes: readonly NextAttrezzaturaMovimentoTipo[];
  categories: string[];
  items: NextAttrezzaturaMovimentoReadOnlyItem[];
  statoAttuale: NextAttrezzaturaStatoCantiere[];
  counts: {
    totalMovements: number;
    consegnati: number;
    spostati: number;
    ritirati: number;
    cantieri: number;
    withPhoto: number;
    withNote: number;
    withSourceCantiere: number;
  };
  limitations: string[];
};

export type NextAttrezzatureCantieriFilter = {
  query?: string | null;
  tipo?: "tutti" | NextAttrezzaturaMovimentoTipo;
  categoria?: string | null;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const date = maybe.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof maybe.seconds === "number") {
      const date = new Date(maybe.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybe._seconds === "number") {
      const date = new Date(maybe._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const month = Number(dmyMatch[2]) - 1;
  const day = Number(dmyMatch[1]);
  const hours = Number(dmyMatch[4] ?? "12");
  const minutes = Number(dmyMatch[5] ?? "00");
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function normalizeMovementType(value: unknown): NextAttrezzaturaMovimentoTipo | null {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "CONSEGNATO" || normalized === "SPOSTATO" || normalized === "RITIRATO") {
    return normalized;
  }
  return null;
}

function buildMovementId(raw: RawRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `attrezzatura:${index}`;
}

function toMovementItem(
  raw: RawRecord,
  index: number
): NextAttrezzaturaMovimentoReadOnlyItem | null {
  const tipo = normalizeMovementType(raw.tipo);
  const descrizione = normalizeOptionalText(raw.descrizione);
  const quantita = normalizeNumber(raw.quantita);
  const unita = normalizeOptionalText(raw.unita);
  const cantiereId = normalizeOptionalText(raw.cantiereId);
  const cantiereLabel =
    normalizeOptionalText(raw.cantiereLabel) ?? cantiereId ?? "Senza cantiere";

  if (!tipo || !descrizione || quantita === null || !unita || !cantiereLabel) {
    return null;
  }

  const data =
    normalizeOptionalText(raw.data) ??
    normalizeOptionalText(raw.createdAt) ??
    normalizeOptionalText(raw.updatedAt);
  const timestamp =
    [raw.timestamp, raw.data, raw.createdAt, raw.updatedAt]
      .map((entry) => toTimestamp(entry))
      .find((entry): entry is number => entry !== null) ?? null;
  const materialeCategoria = normalizeOptionalText(raw.materialeCategoria);
  const note = normalizeOptionalText(raw.note);
  const fotoUrl = normalizeOptionalText(raw.fotoUrl);
  const fotoStoragePath = normalizeOptionalText(raw.fotoStoragePath);
  const sourceCantiereId = normalizeOptionalText(raw.sourceCantiereId);
  const sourceCantiereLabel = normalizeOptionalText(raw.sourceCantiereLabel) ?? sourceCantiereId;
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!materialeCategoria) flags.push("categoria_assente");
  if (!data && timestamp === null) flags.push("data_assente");
  if (tipo === "SPOSTATO" && !sourceCantiereLabel) flags.push("sorgente_spostamento_assente");
  if (!fotoUrl) flags.push("foto_assente");

  return {
    id: buildMovementId(raw, index),
    tipo,
    data: data ?? null,
    timestamp,
    materialeCategoria,
    descrizione,
    quantita,
    unita,
    cantiereId,
    cantiereLabel,
    note,
    fotoUrl,
    fotoStoragePath,
    sourceCantiereId,
    sourceCantiereLabel,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: ATTREZZATURE_KEY,
    quality:
      data && materialeCategoria && (tipo !== "SPOSTATO" || sourceCantiereLabel)
        ? "certo"
        : data || materialeCategoria || sourceCantiereLabel
        ? "parziale"
        : "da_verificare",
    flags,
  };
}

function sortMovementsDesc(
  items: NextAttrezzaturaMovimentoReadOnlyItem[]
): NextAttrezzaturaMovimentoReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const byTimestamp = (right.timestamp ?? 0) - (left.timestamp ?? 0);
    if (byTimestamp !== 0) return byTimestamp;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

function buildCurrentState(
  items: NextAttrezzaturaMovimentoReadOnlyItem[]
): NextAttrezzaturaStatoCantiere[] {
  const cantieri = new Map<
    string,
    {
      id: string;
      label: string;
      materiali: Map<string, { descrizione: string; unita: string; quantita: number }>;
    }
  >();

  const resolveCantiere = (idRaw: string | null, labelRaw: string | null) => {
    const id = normalizeText(idRaw) || normalizeText(labelRaw) || "SENZA_CANTIERE";
    const label = normalizeText(labelRaw) || normalizeText(idRaw) || "Senza cantiere";
    const key = `${id}__${label}`.toUpperCase();
    if (!cantieri.has(key)) {
      cantieri.set(key, { id, label, materiali: new Map() });
    }
    return cantieri.get(key)!;
  };

  const addQty = (
    cantiereId: string | null,
    cantiereLabel: string | null,
    descrizione: string,
    unita: string,
    delta: number
  ) => {
    if (!descrizione || !unita || !Number.isFinite(delta) || delta === 0) return;
    const cantiere = resolveCantiere(cantiereId, cantiereLabel);
    const matKey = `${descrizione}__${unita}`.toLowerCase();
    const existing = cantiere.materiali.get(matKey);
    const nextQty = (existing?.quantita || 0) + delta;
    cantiere.materiali.set(matKey, {
      descrizione,
      unita,
      quantita: nextQty,
    });
  };

  items.forEach((item) => {
    if (!item.quantita) return;

    if (item.tipo === "CONSEGNATO") {
      addQty(item.cantiereId, item.cantiereLabel, item.descrizione, item.unita, item.quantita);
      return;
    }

    if (item.tipo === "SPOSTATO") {
      if (item.sourceCantiereId || item.sourceCantiereLabel) {
        addQty(
          item.sourceCantiereId,
          item.sourceCantiereLabel,
          item.descrizione,
          item.unita,
          -item.quantita
        );
      }
      addQty(item.cantiereId, item.cantiereLabel, item.descrizione, item.unita, item.quantita);
      return;
    }

    if (item.tipo === "RITIRATO") {
      addQty(item.cantiereId, item.cantiereLabel, item.descrizione, item.unita, -item.quantita);
      addQty("MAGAZZINO", "MAGAZZINO", item.descrizione, item.unita, item.quantita);
    }
  });

  return Array.from(cantieri.values())
    .map((cantiere) => ({
      id: cantiere.id,
      label: cantiere.label,
      materiali: Array.from(cantiere.materiali.values())
        .filter((materiale) => materiale.quantita !== 0)
        .sort((left, right) =>
          left.descrizione.localeCompare(right.descrizione, "it", {
            sensitivity: "base",
          })
        ),
    }))
    .filter((cantiere) => cantiere.materiali.length > 0)
    .sort((left, right) => left.label.localeCompare(right.label, "it", { sensitivity: "base" }));
}

function buildCategories(items: NextAttrezzaturaMovimentoReadOnlyItem[]): string[] {
  return Array.from(
    new Set(items.map((item) => item.materialeCategoria).filter((entry): entry is string => Boolean(entry)))
  ).sort((left, right) => left.localeCompare(right, "it", { sensitivity: "base" }));
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextAttrezzaturaMovimentoReadOnlyItem[];
  skippedRawRecords: number;
}): string[] {
  const { datasetShape, items, skippedRawRecords } = args;
  return [
    datasetShape === "unsupported"
      ? "Il dataset `@attrezzature_cantieri` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte dei movimenti attrezzature e stata esclusa dal clone perche non esponeva i campi minimi leggibili."
      : null,
    items.some((item) => item.flags.includes("categoria_assente"))
      ? "Una parte dei movimenti non espone una categoria materiale valorizzata."
      : null,
    items.some((item) => item.flags.includes("sorgente_spostamento_assente"))
      ? "Una parte degli spostamenti non espone il cantiere sorgente completo."
      : null,
    "Il reader clone e solo read-only: nuovo movimento, modifica, delete, upload foto e rimozione foto restano bloccati.",
  ].filter((entry): entry is string => Boolean(entry));
}

export function buildNextAttrezzatureRegistroView(
  snapshot: NextAttrezzatureCantieriSnapshot,
  filter?: NextAttrezzatureCantieriFilter
): NextAttrezzaturaMovimentoReadOnlyItem[] {
  const query = normalizeText(filter?.query).toLowerCase();
  const tipo = filter?.tipo ?? "tutti";
  const categoria = normalizeText(filter?.categoria);

  return snapshot.items.filter((item) => {
    if (tipo !== "tutti" && item.tipo !== tipo) return false;
    if (categoria && item.materialeCategoria !== categoria) return false;
    if (!query) return true;
    const haystack = [
      item.cantiereId,
      item.cantiereLabel,
      item.descrizione,
      item.materialeCategoria,
      item.sourceCantiereLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function buildNextAttrezzatureStatoView(
  snapshot: NextAttrezzatureCantieriSnapshot,
  filter?: Pick<NextAttrezzatureCantieriFilter, "query" | "categoria">
): NextAttrezzaturaStatoCantiere[] {
  const query = normalizeText(filter?.query).toLowerCase();
  const categoria = normalizeText(filter?.categoria);
  const allowedDescriptions = new Set(
    buildNextAttrezzatureRegistroView(snapshot, {
      query,
      categoria,
      tipo: "tutti",
    }).map((item) => `${item.descrizione}__${item.unita}`.toLowerCase())
  );

  return snapshot.statoAttuale
    .map((cantiere) => ({
      ...cantiere,
      materiali: cantiere.materiali.filter((materiale) => {
        const matchesAllowed =
          allowedDescriptions.size === 0 ||
          allowedDescriptions.has(`${materiale.descrizione}__${materiale.unita}`.toLowerCase());
        if (!matchesAllowed) return false;
        if (!query) return true;
        const haystack = `${cantiere.id} ${cantiere.label} ${materiale.descrizione}`.toLowerCase();
        return haystack.includes(query);
      }),
    }))
    .filter((cantiere) => cantiere.materiali.length > 0);
}

export function formatNextAttrezzatureQuantita(value: number): string {
  if (Number.isNaN(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "");
}

export async function readNextAttrezzatureCantieriSnapshot(): Promise<NextAttrezzatureCantieriSnapshot> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, ATTREZZATURE_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);

  const mappedItems = rawItems.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toMovementItem(entry as RawRecord, index);
  });

  const items = sortMovementsDesc(
    mappedItems.filter((entry): entry is NextAttrezzaturaMovimentoReadOnlyItem => Boolean(entry))
  );
  const skippedRawRecords = mappedItems.length - items.length;

  return {
    domainCode: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.code,
    domainName: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.name,
    logicalDatasets: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.normalizationStrategy,
    datasetShape,
    movementTypes: NEXT_ATTREZZATURE_CANTIERI_DOMAIN.movimentoTypes,
    categories: buildCategories(items),
    items,
    statoAttuale: buildCurrentState(items),
    counts: {
      totalMovements: items.length,
      consegnati: items.filter((item) => item.tipo === "CONSEGNATO").length,
      spostati: items.filter((item) => item.tipo === "SPOSTATO").length,
      ritirati: items.filter((item) => item.tipo === "RITIRATO").length,
      cantieri: new Set(items.map((item) => `${item.cantiereId ?? ""}:${item.cantiereLabel}`)).size,
      withPhoto: items.filter((item) => Boolean(item.fotoUrl)).length,
      withNote: items.filter((item) => Boolean(item.note)).length,
      withSourceCantiere: items.filter((item) => Boolean(item.sourceCantiereLabel)).length,
    },
    limitations: buildLimitations({ datasetShape, items, skippedRawRecords }),
  };
}
