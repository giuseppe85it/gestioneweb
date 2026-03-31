import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import { readNextCapoCloneApprovals } from "../nextCapoCloneState";
import {
  readNextDocumentiCostiFleetSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
  type ReadNextDocumentiCostiSnapshotOptions,
  type NextDocumentiCostiReadOnlyItem,
} from "./nextDocumentiCostiDomain";

const STORAGE_COLLECTION = "storage";
const APPROVALS_DATASET_KEY = "@preventivi_approvazioni";
const GROUP_ORDER = ["Motrici", "Trattori stradali", "Rimorchi / Semirimorchi", "Altro"] as const;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextCapoApprovalStatus = "pending" | "approved" | "rejected";

export type NextCapoMezzoCostSummary = {
  fattureMonthCHF: number;
  fattureMonthEUR: number;
  fattureYearCHF: number;
  fattureYearEUR: number;
  preventiviMonthCHF: number;
  preventiviMonthEUR: number;
  preventiviYearCHF: number;
  preventiviYearEUR: number;
  unknownCount: number;
  incomplete: number;
};

export type NextCapoMezzoItem = {
  mezzo: NextAnagraficheFlottaMezzoItem;
  targa: string;
  description: string;
  groupLabel: (typeof GROUP_ORDER)[number];
  stats: NextCapoMezzoCostSummary;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextCapoMezziSnapshot = {
  items: NextCapoMezzoItem[];
  groups: Array<{
    label: (typeof GROUP_ORDER)[number];
    items: NextCapoMezzoItem[];
  }>;
  counts: {
    totalMezzi: number;
    withCosts: number;
    withPreventivi: number;
    withUnknownCurrency: number;
    withIncompleteData: number;
  };
  limitations: string[];
};

export type NextCapoPreventivoApproval = {
  approvalKey: string;
  targa: string;
  status: NextCapoApprovalStatus;
  updatedAt: string | null;
  updatedAtTimestamp: number | null;
  datasetShape: NextLegacyDatasetShape;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof APPROVALS_DATASET_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextCapoCostiRecord = NextDocumentiCostiReadOnlyItem & {
  approvalKey: string | null;
  approvalStatus: NextCapoApprovalStatus;
  approvalUpdatedAt: string | null;
  approvalUpdatedAtTimestamp: number | null;
};

export type NextCapoCostiMezzoSnapshot = {
  mezzo: NextAnagraficheFlottaMezzoItem | null;
  mezzoTarga: string;
  items: NextCapoCostiRecord[];
  groups: {
    preventivi: NextCapoCostiRecord[];
    fatture: NextCapoCostiRecord[];
    documentiUtili: NextCapoCostiRecord[];
  };
  approvals: {
    datasetShape: NextLegacyDatasetShape;
    items: NextCapoPreventivoApproval[];
    counts: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  limitations: string[];
};

export type ReadNextCapoSnapshotOptions = {
  includeCloneApprovals?: boolean;
  includeCloneDocuments?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTarga(value: unknown): string {
  return normalizeNextMezzoTarga(value).replace(/[^A-Z0-9]/g, "");
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
    const timestampLike = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof timestampLike.toDate === "function") {
      const date = timestampLike.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof timestampLike.seconds === "number") {
      const date = new Date(timestampLike.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestampLike._seconds === "number") {
      const date = new Date(timestampLike._seconds * 1000);
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

function normalizeCategoryGroup(value: unknown): (typeof GROUP_ORDER)[number] {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "Altro";
  if (raw.includes("motrice")) return "Motrici";
  if (raw.includes("trattore")) return "Trattori stradali";
  if (
    raw.includes("semirimorchio") ||
    raw.includes("rimorchio") ||
    raw.includes("biga") ||
    raw.includes("centina") ||
    raw.includes("vasca") ||
    raw.includes("pianale")
  ) {
    return "Rimorchi / Semirimorchi";
  }
  return "Altro";
}

function createEmptySummary(): NextCapoMezzoCostSummary {
  return {
    fattureMonthCHF: 0,
    fattureMonthEUR: 0,
    fattureYearCHF: 0,
    fattureYearEUR: 0,
    preventiviMonthCHF: 0,
    preventiviMonthEUR: 0,
    preventiviYearCHF: 0,
    preventiviYearEUR: 0,
    unknownCount: 0,
    incomplete: 0,
  };
}

function buildCostIndex(
  items: NextDocumentiCostiReadOnlyItem[],
  now: Date
): Map<string, NextCapoMezzoCostSummary> {
  const year = now.getFullYear();
  const month = now.getMonth();
  const map = new Map<string, NextCapoMezzoCostSummary>();

  for (const item of items) {
    if (item.category !== "preventivo" && item.category !== "fattura") continue;

    const targaKey = normalizeTarga(item.mezzoTarga ?? item.targa);
    if (!targaKey) continue;

    const entry = map.get(targaKey) ?? createEmptySummary();
    const hasAmount = typeof item.amount === "number" && Number.isFinite(item.amount);
    const dateValue = item.timestamp ? new Date(item.timestamp) : null;
    const hasDate = Boolean(dateValue) && !Number.isNaN((dateValue as Date).getTime());

    if (!hasAmount || !hasDate) {
      entry.incomplete += 1;
      map.set(targaKey, entry);
      continue;
    }

    if (item.currency === "UNKNOWN") {
      entry.unknownCount += 1;
      map.set(targaKey, entry);
      continue;
    }

    const date = dateValue as Date;
    if (date.getFullYear() !== year) {
      map.set(targaKey, entry);
      continue;
    }

    if (item.category === "fattura") {
      if (item.currency === "CHF") {
        entry.fattureYearCHF += item.amount as number;
        if (date.getMonth() === month) {
          entry.fattureMonthCHF += item.amount as number;
        }
      } else {
        entry.fattureYearEUR += item.amount as number;
        if (date.getMonth() === month) {
          entry.fattureMonthEUR += item.amount as number;
        }
      }
    } else if (item.currency === "CHF") {
      entry.preventiviYearCHF += item.amount as number;
      if (date.getMonth() === month) {
        entry.preventiviMonthCHF += item.amount as number;
      }
    } else {
      entry.preventiviYearEUR += item.amount as number;
      if (date.getMonth() === month) {
        entry.preventiviMonthEUR += item.amount as number;
      }
    }

    map.set(targaKey, entry);
  }

  return map;
}

function buildApprovalKey(targa: string, record: NextDocumentiCostiReadOnlyItem): string {
  const targaKey = normalizeTarga(targa);
  const idBase = record.sourceDocId || record.id || "manual";
  const sourceKey = record.sourceKey || "manual";
  return `${targaKey}__${sourceKey}__${idBase}`;
}

function mapApprovalRecord(args: {
  raw: Record<string, unknown>;
  datasetShape: NextLegacyDatasetShape;
}): NextCapoPreventivoApproval | null {
  const { raw, datasetShape } = args;
  const approvalKey = normalizeText(raw.id);
  if (!approvalKey) return null;

  const targa = normalizeTarga(raw.targa ?? raw.mezzoTarga);
  const rawStatus = normalizeText(raw.status).toLowerCase();
  const status: NextCapoApprovalStatus =
    rawStatus === "approved" || rawStatus === "rejected" ? rawStatus : "pending";
  const updatedAt = normalizeText(raw.updatedAt) || null;
  const updatedAtTimestamp = parseDateFlexible(raw.updatedAt)?.getTime() ?? null;
  const flags: string[] = [];
  if (!targa && !approvalKey.includes("__")) flags.push("targa_assente");
  if (status === "pending" && rawStatus && rawStatus !== "pending") {
    flags.push("status_non_standard_forzato_pending");
  }

  return {
    approvalKey,
    targa,
    status,
    updatedAt,
    updatedAtTimestamp,
    datasetShape,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: APPROVALS_DATASET_KEY,
    quality: targa ? "certo" : "parziale",
    flags,
  };
}

async function readNextCapoApprovalsSnapshot(
  targa: string,
  options: ReadNextCapoSnapshotOptions = {},
): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: NextCapoPreventivoApproval[];
  byKey: Map<string, NextCapoPreventivoApproval>;
  limitations: string[];
}> {
  const targaKey = normalizeTarga(targa);
  const includeCloneApprovals = options.includeCloneApprovals !== false;
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, APPROVALS_DATASET_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items } = unwrapStorageArray(rawDoc);
  const localOverrides = includeCloneApprovals
    ? readNextCapoCloneApprovals().map((entry) => ({
        id: entry.id,
        targa: entry.targa,
        status: entry.status,
        updatedAt: entry.updatedAt,
      }))
    : [];
  const mergedItems = [...items];
  const byId = new Map<string, number>();
  mergedItems.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    const rawId = normalizeText((entry as Record<string, unknown>).id);
    if (!rawId) return;
    byId.set(rawId, index);
  });
  localOverrides.forEach((entry) => {
    const index = byId.get(entry.id);
    if (index === undefined) {
      mergedItems.push(entry);
      return;
    }
    mergedItems[index] = {
      ...(mergedItems[index] as Record<string, unknown>),
      ...entry,
    };
  });

  const approvals = mergedItems
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      return mapApprovalRecord({
        raw: entry as Record<string, unknown>,
        datasetShape,
      });
    })
    .filter((entry): entry is NextCapoPreventivoApproval => Boolean(entry))
    .filter(
      (entry) => entry.targa === targaKey || entry.approvalKey.startsWith(`${targaKey}__`)
    );

  return {
    datasetShape,
    items: approvals,
    byKey: new Map(approvals.map((entry) => [entry.approvalKey, entry])),
    limitations: [
      includeCloneApprovals
        ? "Le approvazioni vengono lette da `@preventivi_approvazioni` e possono essere sovrapposte da uno stato clone-only locale."
        : "Le approvazioni vengono lette dal dataset reale `@preventivi_approvazioni` senza overlay clone-only locali.",
      includeCloneApprovals
        ? "Nel clone non viene riattivata alcuna scrittura business su `@preventivi_approvazioni`: gli stati restano confinati nel layer NEXT locale."
        : "Nel clone le approvazioni restano di sola lettura: il runtime ufficiale non applica stati locali o scritture business su `@preventivi_approvazioni`.",
      datasetShape === "unsupported"
        ? "Il dataset `@preventivi_approvazioni` non e in una shape pienamente leggibile e viene trattato come non conforme."
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

function findMezzoByTarga(
  mezzi: NextAnagraficheFlottaMezzoItem[],
  targa: string
): NextAnagraficheFlottaMezzoItem | null {
  const targaKey = normalizeTarga(targa);
  return mezzi.find((mezzo) => normalizeTarga(mezzo.targa) === targaKey) ?? null;
}

export async function readNextCapoMezziSnapshot(
  options: ReadNextCapoSnapshotOptions = {},
): Promise<NextCapoMezziSnapshot> {
  const [flottaSnapshot, costiSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextDocumentiCostiFleetSnapshot({
      includeCloneDocuments: options.includeCloneDocuments,
    } satisfies ReadNextDocumentiCostiSnapshotOptions),
  ]);
  const costIndex = buildCostIndex(costiSnapshot.items, new Date());

  const items = flottaSnapshot.items
    .filter((mezzo) => Boolean(normalizeTarga(mezzo.targa)))
    .map((mezzo) => {
      const targaKey = normalizeTarga(mezzo.targa);
      const stats = costIndex.get(targaKey) ?? createEmptySummary();
      const flags = [...mezzo.flags];
      if (stats.unknownCount > 0) flags.push("valuta_da_verificare");
      if (stats.incomplete > 0) flags.push("dati_costi_incompleti");

      return {
        mezzo,
        targa: targaKey,
        description:
          [mezzo.marca, mezzo.modello, mezzo.categoria].filter(Boolean).join(" - ") ||
          "Descrizione non disponibile",
        groupLabel: normalizeCategoryGroup(mezzo.categoria),
        stats,
        quality:
          mezzo.quality === "certo" && stats.unknownCount === 0 && stats.incomplete === 0
            ? "certo"
            : mezzo.quality === "da_verificare"
            ? "da_verificare"
            : "parziale",
        flags,
      } satisfies NextCapoMezzoItem;
    })
    .sort((left, right) => {
      const rightTotal = right.stats.fattureYearCHF + right.stats.fattureYearEUR;
      const leftTotal = left.stats.fattureYearCHF + left.stats.fattureYearEUR;
      if (rightTotal !== leftTotal) return rightTotal - leftTotal;
      return left.targa.localeCompare(right.targa, "it", { sensitivity: "base" });
    });

  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: items.filter((item) => item.groupLabel === label),
  })).filter((group) => group.items.length > 0);

  return {
    items,
    groups,
    counts: {
      totalMezzi: items.length,
      withCosts: items.filter((item) => {
        const total =
          item.stats.fattureYearCHF +
          item.stats.fattureYearEUR +
          item.stats.preventiviYearCHF +
          item.stats.preventiviYearEUR;
        return total > 0;
      }).length,
      withPreventivi: items.filter(
        (item) => item.stats.preventiviYearCHF > 0 || item.stats.preventiviYearEUR > 0
      ).length,
      withUnknownCurrency: items.filter((item) => item.stats.unknownCount > 0).length,
      withIncompleteData: items.filter((item) => item.stats.incomplete > 0).length,
    },
    limitations: [
      "La vista `Capo Mezzi` nel clone resta read-only e apre solo il dettaglio costi clone-safe per targa.",
      ...flottaSnapshot.limitations,
      ...costiSnapshot.limitations,
    ],
  };
}

export async function readNextCapoCostiMezzoSnapshot(
  targa: string,
  options: ReadNextCapoSnapshotOptions = {},
): Promise<NextCapoCostiMezzoSnapshot> {
  const mezzoTarga = normalizeTarga(targa);
  const [flottaSnapshot, documentiCostiSnapshot, approvalsSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextMezzoDocumentiCostiSnapshot(mezzoTarga, {
      includeCloneDocuments: options.includeCloneDocuments,
    } satisfies ReadNextDocumentiCostiSnapshotOptions),
    readNextCapoApprovalsSnapshot(mezzoTarga, options),
  ]);
  const mezzo = findMezzoByTarga(flottaSnapshot.items, mezzoTarga);

  const items = documentiCostiSnapshot.items.map((item) => {
    const approvalKey = item.category === "preventivo" ? buildApprovalKey(mezzoTarga, item) : null;
    const approval = approvalKey ? approvalsSnapshot.byKey.get(approvalKey) ?? null : null;
    return {
      ...item,
      approvalKey,
      approvalStatus: approval?.status ?? "pending",
      approvalUpdatedAt: approval?.updatedAt ?? null,
      approvalUpdatedAtTimestamp: approval?.updatedAtTimestamp ?? null,
    } satisfies NextCapoCostiRecord;
  });

  const groups = {
    preventivi: items.filter((item) => item.category === "preventivo"),
    fatture: items.filter((item) => item.category === "fattura"),
    documentiUtili: items.filter((item) => item.category === "documento_utile"),
  };

  return {
    mezzo,
    mezzoTarga,
    items,
    groups,
    approvals: {
      datasetShape: approvalsSnapshot.datasetShape,
      items: approvalsSnapshot.items,
      counts: {
        pending: groups.preventivi.filter((item) => item.approvalStatus === "pending").length,
        approved: groups.preventivi.filter((item) => item.approvalStatus === "approved").length,
        rejected: groups.preventivi.filter((item) => item.approvalStatus === "rejected").length,
      },
    },
    limitations: [
      ...documentiCostiSnapshot.limitations.filter(
        (entry) => !entry.includes("non legge `@preventivi_approvazioni`")
      ),
      ...approvalsSnapshot.limitations,
      "Nel clone lo stato approvazione viene mostrato solo come badge read-only; nessuna azione `APPROVA`, `RIFIUTA` o `DA VALUTARE` viene riattivata.",
      "Nel clone restano bloccati `stamp_pdf`, PDF timbrati e flussi di export che introducono side effect.",
    ],
  };
}
