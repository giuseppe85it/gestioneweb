import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { formatDateUI } from "../nextDateFormat";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const BUSINESS_DATASET_KEY = "@rifornimenti";
const FIELD_DATASET_KEY = "@rifornimenti_autisti_tmp";
const MINUTE_MS = 60 * 1000;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

type NextLegacySourceKind = "business" | "field";

type NextRifornimentoRaw = Record<string, unknown>;

type NextNormalizedLegacyRifornimento = {
  id: string;
  originId: string | null;
  mezzoTarga: string;
  dataDisplay: string | null;
  dataDisplayQuality: NextRifornimentoFieldQuality;
  timestampRicostruito: number | null;
  timestampQuality: NextRifornimentoFieldQuality;
  litri: number | null;
  km: number | null;
  costo: number | null;
  valuta: NextRifornimentoCurrency;
  valutaQuality: NextRifornimentoFieldQuality;
  tipo: string | null;
  tipoQuality: NextRifornimentoFieldQuality;
  distributore: string | null;
  distributoreQuality: NextRifornimentoFieldQuality;
  note: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  sourceKind: NextLegacySourceKind;
  sourceKey: string;
};

type NextMatchCandidate =
  | { index: number; strategy: NextRifornimentoMatchStrategy }
  | null;

type NextMergeResult = {
  items: NextRifornimentoReadOnlyItem[];
  reconstructionStats: NextMezzoRifornimentiSnapshot["reconstructionStats"];
};

// D04 NEXT non espone piu il "canonico ridotto" direttamente in UI.
// Tutta la complessita legacy resta confinata qui:
// - dataset business `@rifornimenti`
// - feed operativo `@rifornimenti_autisti_tmp`
// - shape multiple legacy
// - merge euristico controllato
//
// Il Dossier NEXT legge solo il contratto pulito prodotto da questo layer.
export const NEXT_RIFORNIMENTI_CONSUMI_DOMAIN = {
  code: "D04",
  name: "Rifornimenti e consumi",
  logicalDatasets: [BUSINESS_DATASET_KEY, FIELD_DATASET_KEY] as const,
  activeReadOnlyDataset: BUSINESS_DATASET_KEY,
  supportingReadOnlyDatasets: [FIELD_DATASET_KEY] as const,
  normalizationStrategy: "RICOSTRUZIONE CONTROLLATA NEXT",
  outputContract: {
    certain: ["id", "mezzoTarga", "provenienza", "fieldQuality", "flags", "sourceTrust"] as const,
    derived: ["dataDisplay", "timestampRicostruito"] as const,
    optional: [
      "litri",
      "km",
      "costo",
      "valuta",
      "tipo",
      "distributore",
      "note",
      "autistaNome",
      "badgeAutista",
    ] as const,
    notGuaranteed: [
      "timestampRicostruito",
      "km",
      "costo",
      "valuta",
      "tipo",
      "autistaNome",
      "badgeAutista",
    ] as const,
  },
} as const;

export type NextRifornimentoFieldQuality =
  | "certo"
  | "ricostruito"
  | "non_disponibile";

export type NextRifornimentoCurrency = "EUR" | "CHF" | null;

export type NextRifornimentoProvenienza = "business" | "campo" | "ricostruito";

export type NextRifornimentoSourceClassification = "canonico" | "ricostruito";

export type NextRifornimentoReliabilityStatus =
  | "affidabile"
  | "prudente"
  | "da_verificare";

export type NextRifornimentoMatchStrategy =
  | "solo_business"
  | "solo_campo"
  | "match_origin_id"
  | "match_euristica_10_minuti"
  | "match_euristica_stesso_giorno";

export type NextRifornimentoReadOnlyItem = {
  id: string;
  mezzoTarga: string;
  targa: string;
  dataDisplay: string | null;
  dataLabel: string | null;
  timestampRicostruito: number | null;
  timestamp: number | null;
  litri: number | null;
  km: number | null;
  costo: number | null;
  valuta: NextRifornimentoCurrency;
  tipo: string | null;
  distributore: string | null;
  note: string | null;
  autistaNome: string | null;
  autista: string | null;
  badgeAutista: string | null;
  provenienza: NextRifornimentoProvenienza;
  matchStrategy: NextRifornimentoMatchStrategy;
  fieldQuality: {
    dataDisplay: NextRifornimentoFieldQuality;
    timestampRicostruito: NextRifornimentoFieldQuality;
    litri: NextRifornimentoFieldQuality;
    km: NextRifornimentoFieldQuality;
    costo: NextRifornimentoFieldQuality;
    valuta: NextRifornimentoFieldQuality;
    tipo: NextRifornimentoFieldQuality;
    distributore: NextRifornimentoFieldQuality;
    note: NextRifornimentoFieldQuality;
    autistaNome: NextRifornimentoFieldQuality;
    badgeAutista: NextRifornimentoFieldQuality;
  };
  quality: {
    dataLabel: NextRifornimentoFieldQuality;
    timestamp: NextRifornimentoFieldQuality;
    litri: NextRifornimentoFieldQuality;
    km: NextRifornimentoFieldQuality;
    costo: NextRifornimentoFieldQuality;
    valuta: NextRifornimentoFieldQuality;
    tipo: NextRifornimentoFieldQuality;
    distributore: NextRifornimentoFieldQuality;
    note: NextRifornimentoFieldQuality;
    autista: NextRifornimentoFieldQuality;
    badgeAutista: NextRifornimentoFieldQuality;
  };
  flags: string[];
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKeys: string[];
  sourceRecordIds: {
    business: string | null;
    field: string | null;
  };
  source: {
    origin: NextRifornimentoProvenienza;
    matchStrategy: NextRifornimentoMatchStrategy;
    datasetKeys: string[];
    recordIds: {
      business: string | null;
      field: string | null;
    };
  };
  sourceTrust: {
    classification: NextRifornimentoSourceClassification;
    reliability: Exclude<NextRifornimentoReliabilityStatus, "da_verificare">;
    reason: string;
  };
};

export type NextMezzoRifornimentiSnapshot = {
  domainCode: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.code;
  domainName: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset;
  supportingReadOnlyDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.outputContract;
  datasetShapes: {
    business: NextLegacyDatasetShape;
    field: NextLegacyDatasetShape;
  };
  items: NextRifornimentoReadOnlyItem[];
  counts: {
    total: number;
    businessOnly: number;
    fieldOnly: number;
    reconstructed: number;
    withTimestamp: number;
    withAutista: number;
    withBadge: number;
    withKm: number;
    withCosto: number;
    withTipo: number;
    withValuta: number;
  };
  totals: {
    litri: number;
    costo: number;
  };
  reconstructionStats: {
    matchedByOriginId: number;
    matchedByHeuristic10Minutes: number;
    matchedByHeuristicSameDay: number;
    appendedFieldOnly: number;
    businessOnly: number;
  };
  trustModel: {
    source: {
      verdict: NextRifornimentoReliabilityStatus;
      summary: string;
      counts: {
        canonico: number;
        ricostruito: number;
      };
      notes: string[];
    };
  };
  limitations: string[];
};

export type NextRifornimentiReadOnlySnapshot = Omit<
  NextMezzoRifornimentiSnapshot,
  "mezzoTarga"
>;

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
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function detectCurrencyFromText(value: unknown): NextRifornimentoCurrency {
  if (!value) return null;
  const text = String(value).trim().toUpperCase();
  if (!text) return null;
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  if (text.includes("EUR") || text.includes("€")) return "EUR";
  return null;
}

function resolveCurrencyFromLegacyRecord(record: NextRifornimentoRaw): {
  value: NextRifornimentoCurrency;
  quality: NextRifornimentoFieldQuality;
} {
  const direct = detectCurrencyFromText(record.valuta ?? record.currency);
  if (direct) {
    return { value: direct, quality: "certo" };
  }

  const paese = normalizeText(record.paese).toUpperCase();
  if (paese === "CH") {
    return { value: "CHF", quality: "ricostruito" };
  }
  if (paese === "IT") {
    return { value: "EUR", quality: "ricostruito" };
  }

  return { value: null, quality: "non_disponibile" };
}

function resolveTipoFromLegacyRecord(record: NextRifornimentoRaw): {
  value: string | null;
  quality: NextRifornimentoFieldQuality;
} {
  const tipo = normalizeOptionalText(record.tipo);
  return {
    value: tipo,
    quality: tipo ? "certo" : "non_disponibile",
  };
}

function extractAutistaNome(record: NextRifornimentoRaw): string | null {
  const direct = normalizeOptionalText(record.autistaNome ?? record.nomeAutista);
  if (direct) return direct;

  if (typeof record.autista === "string") {
    return normalizeOptionalText(record.autista);
  }

  if (record.autista && typeof record.autista === "object") {
    const maybeName = normalizeOptionalText((record.autista as { nome?: unknown }).nome);
    if (maybeName) return maybeName;
  }

  return null;
}

function extractBadgeAutista(record: NextRifornimentoRaw): string | null {
  const direct = normalizeOptionalText(record.badgeAutista ?? record.badge);
  if (direct) return direct;

  if (record.autista && typeof record.autista === "object") {
    const maybeBadge = normalizeOptionalText((record.autista as { badge?: unknown }).badge);
    if (maybeBadge) return maybeBadge;
  }

  return null;
}

function buildLegacyDistributore(record: NextRifornimentoRaw): string | null {
  const parts = [
    normalizeText(record.tipo),
    normalizeText(record.paese),
    normalizeText(record.metodoPagamento),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const d = maybe.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    if (typeof maybe.seconds === "number") {
      const d = new Date(maybe.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof maybe._seconds === "number") {
      const d = new Date(maybe._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const dmyWithTime = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (dmyWithTime) {
    const day = Number(dmyWithTime[1]);
    const month = Number(dmyWithTime[2]) - 1;
    const yearRaw = Number(dmyWithTime[3]);
    const year = dmyWithTime[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const hh = Number(dmyWithTime[4] ?? "12");
    const mm = Number(dmyWithTime[5] ?? "00");
    const d = new Date(year, month, day, hh, mm, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const direct = new Date(raw);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function isDirectTimestampValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return true;
  if (typeof value === "object") return true;
  if (typeof value !== "string") return false;

  const raw = value.trim();
  if (!raw) return false;
  return raw.includes("T") || raw.includes("-") || raw.includes(":") || /^\d+$/.test(raw);
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function unwrapLegacyDataset(
  rawDoc: Record<string, unknown> | null | undefined
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
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

function buildLegacyRecordId(
  raw: NextRifornimentoRaw,
  index: number,
  sourceKind: NextLegacySourceKind
): string {
  const id = normalizeText(raw.id);
  if (id) return id;

  const mezzoTarga = normalizeNextMezzoTarga(
    raw.mezzoTarga ?? raw.targaCamion ?? raw.targaMotrice ?? raw.targa ?? ""
  );
  if (mezzoTarga) {
    return `${sourceKind}:${mezzoTarga}:${index}`;
  }

  return `${sourceKind}:${index}`;
}

function normalizeLegacyRifornimento(
  raw: NextRifornimentoRaw,
  index: number,
  sourceKind: NextLegacySourceKind
): NextNormalizedLegacyRifornimento | null {
  const mezzoTarga = normalizeNextMezzoTarga(
    raw.mezzoTarga ?? raw.targaCamion ?? raw.targaMotrice ?? raw.targa ?? ""
  );
  if (!mezzoTarga) return null;

  const directTimestamp =
    toTimestamp(raw.timestamp) ??
    (isDirectTimestampValue(raw.dataOra) ? toTimestamp(raw.dataOra) : null) ??
    (isDirectTimestampValue(raw.data) ? toTimestamp(raw.data) : null);

  const reconstructedTimestamp =
    directTimestamp ?? toTimestamp(raw.data) ?? toTimestamp(raw.dataOra);

  const rawDataText = typeof raw.data === "string" ? normalizeOptionalText(raw.data) : null;
  const dataDisplay = rawDataText ?? (reconstructedTimestamp ? formatDateUI(reconstructedTimestamp) : null);
  const dataDisplayQuality: NextRifornimentoFieldQuality = rawDataText
    ? "certo"
    : reconstructedTimestamp
    ? "ricostruito"
    : "non_disponibile";

  const timestampQuality: NextRifornimentoFieldQuality = directTimestamp
    ? "certo"
    : reconstructedTimestamp
    ? "ricostruito"
    : "non_disponibile";

  const directDistributore = normalizeOptionalText(raw.distributore);
  const derivedDistributore = directDistributore ? null : buildLegacyDistributore(raw);
  const distributore = directDistributore ?? derivedDistributore;
  const distributoreQuality: NextRifornimentoFieldQuality = directDistributore
    ? "certo"
    : derivedDistributore
    ? "ricostruito"
    : "non_disponibile";
  const valuta = resolveCurrencyFromLegacyRecord(raw);
  const tipo = resolveTipoFromLegacyRecord(raw);

  return {
    id: buildLegacyRecordId(raw, index, sourceKind),
    originId: normalizeOptionalText(raw.id),
    mezzoTarga,
    dataDisplay,
    dataDisplayQuality,
    timestampRicostruito: reconstructedTimestamp,
    timestampQuality,
    litri: normalizeNumber(raw.litri),
    km: normalizeNumber(raw.km),
    costo: normalizeNumber(raw.costo ?? raw.importo),
    valuta: valuta.value,
    valutaQuality: valuta.quality,
    tipo: tipo.value,
    tipoQuality: tipo.quality,
    distributore,
    distributoreQuality,
    note: normalizeOptionalText(raw.note),
    autistaNome: extractAutistaNome(raw),
    badgeAutista: extractBadgeAutista(raw),
    sourceKind,
    sourceKey: sourceKind === "business" ? BUSINESS_DATASET_KEY : FIELD_DATASET_KEY,
  };
}

function areLitriComparable(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return true;
  return Math.abs(a - b) < 0.001;
}

function absMinutesDiff(a: number | null, b: number | null): number {
  if (a === null || b === null) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / MINUTE_MS;
}

function isSameDay(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return false;
  const left = new Date(a);
  const right = new Date(b);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function likelyDuplicateRefuel(
  a: NextNormalizedLegacyRifornimento,
  b: NextNormalizedLegacyRifornimento
): boolean {
  if (a.originId && b.originId && a.originId === b.originId) return true;
  if (a.mezzoTarga !== b.mezzoTarga) return false;
  if (!areLitriComparable(a.litri, b.litri)) return false;
  if (!isSameDay(a.timestampRicostruito, b.timestampRicostruito)) return false;
  return absMinutesDiff(a.timestampRicostruito, b.timestampRicostruito) <= 10;
}

function pickHeuristicFieldMatch(
  base: NextNormalizedLegacyRifornimento,
  fieldRows: NextNormalizedLegacyRifornimento[],
  usedFieldIndices: Set<number>
): NextMatchCandidate {
  let bestIndex: number | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  fieldRows.forEach((candidate, idx) => {
    if (usedFieldIndices.has(idx)) return;
    if (candidate.mezzoTarga !== base.mezzoTarga) return;
    if (!areLitriComparable(base.litri, candidate.litri)) return;
    const diff = absMinutesDiff(base.timestampRicostruito, candidate.timestampRicostruito);
    if (diff <= 10 && diff < bestDiff) {
      bestIndex = idx;
      bestDiff = diff;
    }
  });

  if (bestIndex !== null) {
    return { index: bestIndex, strategy: "match_euristica_10_minuti" };
  }

  fieldRows.forEach((candidate, idx) => {
    if (usedFieldIndices.has(idx)) return;
    if (candidate.mezzoTarga !== base.mezzoTarga) return;
    if (!areLitriComparable(base.litri, candidate.litri)) return;
    if (!isSameDay(base.timestampRicostruito, candidate.timestampRicostruito)) return;
    const diff = absMinutesDiff(base.timestampRicostruito, candidate.timestampRicostruito);
    if (diff < bestDiff) {
      bestIndex = idx;
      bestDiff = diff;
    }
  });

  if (bestIndex !== null) {
    return { index: bestIndex, strategy: "match_euristica_stesso_giorno" };
  }

  return null;
}

function buildQualityAlias(fieldQuality: NextRifornimentoReadOnlyItem["fieldQuality"]) {
  return {
    dataLabel: fieldQuality.dataDisplay,
    timestamp: fieldQuality.timestampRicostruito,
    litri: fieldQuality.litri,
    km: fieldQuality.km,
    costo: fieldQuality.costo,
    valuta: fieldQuality.valuta,
    tipo: fieldQuality.tipo,
    distributore: fieldQuality.distributore,
    note: fieldQuality.note,
    autista: fieldQuality.autistaNome,
    badgeAutista: fieldQuality.badgeAutista,
  };
}

function buildSourceAlias(
  origin: NextRifornimentoProvenienza,
  matchStrategy: NextRifornimentoMatchStrategy,
  datasetKeys: string[],
  recordIds: { business: string | null; field: string | null }
) {
  return {
    origin,
    matchStrategy,
    datasetKeys,
    recordIds,
  };
}

function hasCriticalFuelReconstruction(
  fieldQuality: Pick<
    NextRifornimentoReadOnlyItem["fieldQuality"],
    "timestampRicostruito" | "litri" | "km"
  >,
): boolean {
  return (
    fieldQuality.timestampRicostruito === "ricostruito" ||
    fieldQuality.litri === "ricostruito" ||
    fieldQuality.km === "ricostruito"
  );
}

function buildSourceTrustProfile(args: {
  provenienza: NextRifornimentoProvenienza;
  matchStrategy: NextRifornimentoMatchStrategy;
  fieldQuality: NextRifornimentoReadOnlyItem["fieldQuality"];
}): NextRifornimentoReadOnlyItem["sourceTrust"] {
  const criticalReconstruction = hasCriticalFuelReconstruction(args.fieldQuality);

  if (
    args.provenienza === "business" &&
    args.matchStrategy === "solo_business" &&
    !criticalReconstruction
  ) {
    return {
      classification: "canonico",
      reliability: "affidabile",
      reason:
        "record letto dal dataset business D04 senza ricostruzione su data, litri o km",
    };
  }

  if (args.provenienza === "campo" || args.matchStrategy === "solo_campo") {
    return {
      classification: "ricostruito",
      reliability: "prudente",
      reason:
        "record presente solo nel feed campo e quindi trattato come ricostruito",
    };
  }

  if (args.matchStrategy === "match_origin_id") {
    return {
      classification: "ricostruito",
      reliability: "prudente",
      reason:
        "record business completato con il feed campo tramite collegamento per originId",
    };
  }

  if (
    args.matchStrategy === "match_euristica_10_minuti" ||
    args.matchStrategy === "match_euristica_stesso_giorno"
  ) {
    return {
      classification: "ricostruito",
      reliability: "prudente",
      reason:
        "record business completato con il feed campo tramite aggancio euristico controllato",
    };
  }

  if (criticalReconstruction) {
    return {
      classification: "ricostruito",
      reliability: "prudente",
      reason:
        "record con almeno un campo critico ricostruito tra data, litri o km",
    };
  }

  return {
    classification: "ricostruito",
    reliability: "prudente",
    reason: "record D04 completato in modo prudenziale rispetto alla sorgente business",
  };
}

function buildSourceTrustModel(args: {
  items: NextRifornimentoReadOnlyItem[];
  datasetShapes: NextMezzoRifornimentiSnapshot["datasetShapes"];
  reconstructionStats: NextMezzoRifornimentiSnapshot["reconstructionStats"];
}): NextMezzoRifornimentiSnapshot["trustModel"]["source"] {
  const canonico = args.items.filter(
    (item) => item.sourceTrust.classification === "canonico",
  ).length;
  const ricostruito = args.items.length - canonico;
  const heuristicMatches =
    args.reconstructionStats.matchedByHeuristic10Minutes +
    args.reconstructionStats.matchedByHeuristicSameDay;

  const verdict: NextRifornimentoReliabilityStatus =
    args.items.length === 0 ||
    args.datasetShapes.business === "unsupported" ||
    args.datasetShapes.field === "unsupported"
      ? "da_verificare"
      : ricostruito > 0
        ? "prudente"
        : "affidabile";

  const summary =
    verdict === "affidabile"
      ? `D04 espone ${canonico} record canonici senza ricostruzioni sui campi chiave.`
      : verdict === "prudente"
        ? `D04 espone ${canonico} record canonici e ${ricostruito} record ricostruiti o integrati in modo prudenziale.`
        : "D04 non espone ancora una base completamente verificabile per distinguere sorgente esatta e sorgente ricostruita.";

  const notes = [
    canonico > 0 ? `${canonico} record con sorgente canonica business.` : null,
    ricostruito > 0
      ? `${ricostruito} record ricostruiti o integrati dal feed campo.`
      : null,
    args.reconstructionStats.appendedFieldOnly > 0
      ? `${args.reconstructionStats.appendedFieldOnly} record sono presenti solo nel feed campo.`
      : null,
    heuristicMatches > 0
      ? `${heuristicMatches} record usano un aggancio euristico controllato tra le fonti.`
      : null,
    args.datasetShapes.business === "unsupported"
      ? "Il dataset business D04 non e in una shape pienamente leggibile dal layer."
      : null,
    args.datasetShapes.field === "unsupported"
      ? "Il feed campo D04 non e in una shape pienamente leggibile dal layer."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    verdict,
    summary,
    counts: {
      canonico,
      ricostruito,
    },
    notes,
  };
}

function buildBusinessOnlyOutput(
  row: NextNormalizedLegacyRifornimento
): NextRifornimentoReadOnlyItem {
  const fieldQuality: NextRifornimentoReadOnlyItem["fieldQuality"] = {
    dataDisplay: row.dataDisplayQuality,
    timestampRicostruito: row.timestampQuality,
    litri: row.litri !== null ? "certo" : "non_disponibile",
    km: row.km !== null ? "certo" : "non_disponibile",
    costo: row.costo !== null ? "certo" : "non_disponibile",
    valuta: row.valutaQuality,
    tipo: row.tipoQuality,
    distributore: row.distributoreQuality,
    note: row.note ? "certo" : "non_disponibile",
    autistaNome: row.autistaNome ? "certo" : "non_disponibile",
    badgeAutista: row.badgeAutista ? "certo" : "non_disponibile",
  };
  const sourceRecordIds = {
    business: row.originId ?? row.id,
    field: null,
  };
  const sourceKeys = [row.sourceKey];
  const sourceTrust = buildSourceTrustProfile({
    provenienza: "business",
    matchStrategy: "solo_business",
    fieldQuality,
  });

  return {
    id: row.id,
    mezzoTarga: row.mezzoTarga,
    targa: row.mezzoTarga,
    dataDisplay: row.dataDisplay,
    dataLabel: row.dataDisplay,
    timestampRicostruito: row.timestampRicostruito,
    timestamp: row.timestampRicostruito,
    litri: row.litri,
    km: row.km,
    costo: row.costo,
    valuta: row.valuta,
    tipo: row.tipo,
    distributore: row.distributore,
    note: row.note,
    autistaNome: row.autistaNome,
    autista: row.autistaNome,
    badgeAutista: row.badgeAutista,
    provenienza: "business",
    matchStrategy: "solo_business",
    fieldQuality,
    quality: buildQualityAlias(fieldQuality),
    flags: ["solo_business"],
    sourceCollection: STORAGE_COLLECTION,
    sourceKeys,
    sourceRecordIds,
    source: buildSourceAlias("business", "solo_business", sourceKeys, sourceRecordIds),
    sourceTrust,
  };
}

function buildFieldOnlyOutput(
  row: NextNormalizedLegacyRifornimento
): NextRifornimentoReadOnlyItem {
  const fieldQuality: NextRifornimentoReadOnlyItem["fieldQuality"] = {
    dataDisplay: row.dataDisplayQuality,
    timestampRicostruito: row.timestampQuality,
    litri: row.litri !== null ? "certo" : "non_disponibile",
    km: row.km !== null ? "certo" : "non_disponibile",
    costo: row.costo !== null ? "certo" : "non_disponibile",
    valuta: row.valutaQuality,
    tipo: row.tipoQuality,
    distributore: row.distributoreQuality,
    note: row.note ? "certo" : "non_disponibile",
    autistaNome: row.autistaNome ? "certo" : "non_disponibile",
    badgeAutista: row.badgeAutista ? "certo" : "non_disponibile",
  };
  const sourceRecordIds = {
    business: null,
    field: row.originId ?? row.id,
  };
  const sourceKeys = [row.sourceKey];
  const sourceTrust = buildSourceTrustProfile({
    provenienza: "campo",
    matchStrategy: "solo_campo",
    fieldQuality,
  });

  return {
    id: row.id,
    mezzoTarga: row.mezzoTarga,
    targa: row.mezzoTarga,
    dataDisplay: row.dataDisplay,
    dataLabel: row.dataDisplay,
    timestampRicostruito: row.timestampRicostruito,
    timestamp: row.timestampRicostruito,
    litri: row.litri,
    km: row.km,
    costo: row.costo,
    valuta: row.valuta,
    tipo: row.tipo,
    distributore: row.distributore,
    note: row.note,
    autistaNome: row.autistaNome,
    autista: row.autistaNome,
    badgeAutista: row.badgeAutista,
    provenienza: "campo",
    matchStrategy: "solo_campo",
    fieldQuality,
    quality: buildQualityAlias(fieldQuality),
    flags: ["solo_campo"],
    sourceCollection: STORAGE_COLLECTION,
    sourceKeys,
    sourceRecordIds,
    source: buildSourceAlias("campo", "solo_campo", sourceKeys, sourceRecordIds),
    sourceTrust,
  };
}

function buildMergedOutput(
  businessRow: NextNormalizedLegacyRifornimento,
  fieldRow: NextNormalizedLegacyRifornimento,
  matchStrategy: NextRifornimentoMatchStrategy
): NextRifornimentoReadOnlyItem {
  const timestampFromField =
    businessRow.timestampQuality !== "certo" && fieldRow.timestampRicostruito !== null;
  const timestampRicostruito = timestampFromField
    ? fieldRow.timestampRicostruito
    : businessRow.timestampRicostruito ?? fieldRow.timestampRicostruito;
  const timestampQuality: NextRifornimentoFieldQuality = timestampFromField
    ? "ricostruito"
    : businessRow.timestampRicostruito !== null
    ? businessRow.timestampQuality
    : fieldRow.timestampRicostruito !== null
    ? "ricostruito"
    : "non_disponibile";

  const dataDisplay =
    businessRow.dataDisplay ??
    fieldRow.dataDisplay ??
    (timestampRicostruito ? formatDateUI(timestampRicostruito) : null);
  const dataDisplayQuality: NextRifornimentoFieldQuality = businessRow.dataDisplay
    ? businessRow.dataDisplayQuality
    : fieldRow.dataDisplay
    ? "ricostruito"
    : timestampRicostruito
    ? "ricostruito"
    : "non_disponibile";

  const litri = businessRow.litri ?? fieldRow.litri;
  const litriQuality: NextRifornimentoFieldQuality = businessRow.litri !== null
    ? "certo"
    : fieldRow.litri !== null
    ? "ricostruito"
    : "non_disponibile";

  const km = businessRow.km ?? fieldRow.km;
  const kmQuality: NextRifornimentoFieldQuality = businessRow.km !== null
    ? "certo"
    : fieldRow.km !== null
    ? "ricostruito"
    : "non_disponibile";

  const costo = businessRow.costo ?? fieldRow.costo;
  const costoQuality: NextRifornimentoFieldQuality = businessRow.costo !== null
    ? "certo"
    : fieldRow.costo !== null
    ? "ricostruito"
    : "non_disponibile";

  const valuta = businessRow.valuta ?? fieldRow.valuta;
  const valutaQuality: NextRifornimentoFieldQuality = businessRow.valuta !== null
    ? businessRow.valutaQuality
    : fieldRow.valuta !== null
    ? "ricostruito"
    : "non_disponibile";

  const tipo = businessRow.tipo || fieldRow.tipo;
  const tipoQuality: NextRifornimentoFieldQuality = businessRow.tipo
    ? businessRow.tipoQuality
    : fieldRow.tipo
    ? "ricostruito"
    : "non_disponibile";

  const distributore = businessRow.distributore || fieldRow.distributore;
  const distributoreQuality: NextRifornimentoFieldQuality = businessRow.distributore
    ? businessRow.distributoreQuality
    : fieldRow.distributore
    ? "ricostruito"
    : "non_disponibile";

  const note = businessRow.note || fieldRow.note;
  const noteQuality: NextRifornimentoFieldQuality = businessRow.note
    ? "certo"
    : fieldRow.note
    ? "ricostruito"
    : "non_disponibile";

  const autistaNome = businessRow.autistaNome || fieldRow.autistaNome;
  const autistaQuality: NextRifornimentoFieldQuality = businessRow.autistaNome
    ? "certo"
    : fieldRow.autistaNome
    ? "ricostruito"
    : "non_disponibile";

  const badgeAutista = businessRow.badgeAutista || fieldRow.badgeAutista;
  const badgeQuality: NextRifornimentoFieldQuality = businessRow.badgeAutista
    ? "certo"
    : fieldRow.badgeAutista
    ? "ricostruito"
    : "non_disponibile";

  const flags = ["ricostruzione_controllata", matchStrategy];
  if (autistaQuality === "ricostruito") flags.push("autista_da_feed_campo");
  if (badgeQuality === "ricostruito") flags.push("badge_da_feed_campo");
  if (kmQuality === "ricostruito") flags.push("km_da_feed_campo");
  if (costoQuality === "ricostruito") flags.push("costo_da_feed_campo");
  if (valutaQuality === "ricostruito") flags.push("valuta_ricostruita");
  if (tipoQuality === "ricostruito") flags.push("tipo_da_feed_campo");
  if (timestampQuality === "ricostruito") flags.push("timestamp_ricostruito");

  const fieldQuality: NextRifornimentoReadOnlyItem["fieldQuality"] = {
    dataDisplay: dataDisplayQuality,
    timestampRicostruito: timestampQuality,
    litri: litriQuality,
    km: kmQuality,
    costo: costoQuality,
    valuta: valutaQuality,
    tipo: tipoQuality,
    distributore: distributoreQuality,
    note: noteQuality,
    autistaNome: autistaQuality,
    badgeAutista: badgeQuality,
  };
  const sourceRecordIds = {
    business: businessRow.originId ?? businessRow.id,
    field: fieldRow.originId ?? fieldRow.id,
  };
  const sourceKeys = [businessRow.sourceKey, fieldRow.sourceKey];
  const sourceTrust = buildSourceTrustProfile({
    provenienza: "ricostruito",
    matchStrategy,
    fieldQuality,
  });

  return {
    id: businessRow.id,
    mezzoTarga: businessRow.mezzoTarga,
    targa: businessRow.mezzoTarga,
    dataDisplay,
    dataLabel: dataDisplay,
    timestampRicostruito,
    timestamp: timestampRicostruito,
    litri,
    km,
    costo,
    valuta,
    tipo,
    distributore,
    note,
    autistaNome,
    autista: autistaNome,
    badgeAutista,
    provenienza: "ricostruito",
    matchStrategy,
    fieldQuality,
    quality: buildQualityAlias(fieldQuality),
    flags,
    sourceCollection: STORAGE_COLLECTION,
    sourceKeys,
    sourceRecordIds,
    source: buildSourceAlias("ricostruito", matchStrategy, sourceKeys, sourceRecordIds),
    sourceTrust,
  };
}

function sortRifornimenti(
  items: NextRifornimentoReadOnlyItem[]
): NextRifornimentoReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const dateOrder =
      (right.timestampRicostruito ?? 0) - (left.timestampRicostruito ?? 0);
    if (dateOrder !== 0) return dateOrder;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

function mergeLegacyDatasets(
  businessRows: NextNormalizedLegacyRifornimento[],
  fieldRows: NextNormalizedLegacyRifornimento[]
): NextMergeResult {
  const usedFieldIndices = new Set<number>();
  const fieldByOriginId = new Map<string, number[]>();
  const reconstructionStats: NextMezzoRifornimentiSnapshot["reconstructionStats"] = {
    matchedByOriginId: 0,
    matchedByHeuristic10Minutes: 0,
    matchedByHeuristicSameDay: 0,
    appendedFieldOnly: 0,
    businessOnly: 0,
  };

  fieldRows.forEach((row, index) => {
    if (!row.originId) return;
    const list = fieldByOriginId.get(row.originId) ?? [];
    list.push(index);
    fieldByOriginId.set(row.originId, list);
  });

  const mergedBase = businessRows.map((baseRow) => {
    let candidate: NextMatchCandidate = null;

    if (baseRow.originId && fieldByOriginId.has(baseRow.originId)) {
      const list = fieldByOriginId.get(baseRow.originId) ?? [];
      const matchedIndex =
        list.find(
          (index) =>
            !usedFieldIndices.has(index) &&
            fieldRows[index].mezzoTarga === baseRow.mezzoTarga
        ) ?? null;

      if (matchedIndex !== null) {
        candidate = { index: matchedIndex, strategy: "match_origin_id" };
      }
    }

    const needsControlledReconstruction =
      candidate === null &&
      (baseRow.timestampQuality !== "certo" ||
        baseRow.autistaNome === null ||
        baseRow.badgeAutista === null ||
        baseRow.km === null ||
        baseRow.costo === null ||
        baseRow.tipo === null ||
        baseRow.valuta === null);

    if (needsControlledReconstruction) {
      candidate = pickHeuristicFieldMatch(baseRow, fieldRows, usedFieldIndices);
    }

    if (candidate === null) {
      reconstructionStats.businessOnly += 1;
      return buildBusinessOnlyOutput(baseRow);
    }

    usedFieldIndices.add(candidate.index);
    if (candidate.strategy === "match_origin_id") {
      reconstructionStats.matchedByOriginId += 1;
    } else if (candidate.strategy === "match_euristica_10_minuti") {
      reconstructionStats.matchedByHeuristic10Minutes += 1;
    } else if (candidate.strategy === "match_euristica_stesso_giorno") {
      reconstructionStats.matchedByHeuristicSameDay += 1;
    }

    return buildMergedOutput(baseRow, fieldRows[candidate.index], candidate.strategy);
  });

  fieldRows.forEach((fieldRow, index) => {
    if (usedFieldIndices.has(index)) return;
    const duplicated = businessRows.some((businessRow) =>
      likelyDuplicateRefuel(businessRow, fieldRow)
    );
    if (duplicated) return;
    reconstructionStats.appendedFieldOnly += 1;
    mergedBase.push(buildFieldOnlyOutput(fieldRow));
  });

  return {
    items: sortRifornimenti(mergedBase),
    reconstructionStats,
  };
}

function buildLimitations(
  snapshot: Pick<
    NextMezzoRifornimentiSnapshot,
    "counts" | "reconstructionStats" | "datasetShapes"
  >
): string[] {
  const limitations = [
    "D04 usa una ricostruzione controllata NEXT: dataset business come base e feed campo solo dentro il layer.",
    snapshot.counts.withAutista < snapshot.counts.total
      ? "Autista e badge non sono garantiti su tutte le righe legacy."
      : null,
    snapshot.counts.withKm < snapshot.counts.total
      ? "Il campo km puo restare non disponibile su parte dei rifornimenti."
      : null,
    snapshot.counts.withCosto < snapshot.counts.total
      ? "Il campo costo puo restare non disponibile su parte dei rifornimenti."
      : null,
    snapshot.counts.withTipo < snapshot.counts.total
      ? "Il tipo rifornimento non e affidabile su tutte le righe legacy."
      : null,
    snapshot.counts.withValuta < snapshot.counts.total
      ? "La valuta non e disponibile o non e deducibile in modo certo su tutte le righe."
      : null,
    snapshot.counts.withTimestamp < snapshot.counts.total
      ? "Alcune righe non permettono una ricostruzione temporale completa."
      : null,
    snapshot.reconstructionStats.appendedFieldOnly > 0
      ? "Una parte dei record arriva solo dal feed campo per mantenere il risultato utile del madre."
      : null,
    snapshot.datasetShapes.business === "unsupported"
      ? "Il dataset business non e in una shape leggibile dal layer e viene trattato come non conforme."
      : null,
    snapshot.datasetShapes.field === "unsupported"
      ? "Il feed campo non e in una shape leggibile dal layer e viene trattato come non conforme."
      : null,
  ];

  return limitations.filter((entry): entry is string => Boolean(entry));
}

async function readLegacyDataset(
  key: string
): Promise<{ datasetShape: NextLegacyDatasetShape; items: unknown[] }> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  if (!snapshot.exists()) {
    return {
      datasetShape: "missing",
      items: [],
    };
  }

  return unwrapLegacyDataset(snapshot.data() as Record<string, unknown>);
}

function buildSnapshotBase(args: {
  items: NextRifornimentoReadOnlyItem[];
  businessDatasetShape: NextLegacyDatasetShape;
  fieldDatasetShape: NextLegacyDatasetShape;
  reconstructionStats: NextMezzoRifornimentiSnapshot["reconstructionStats"];
}) {
  return {
    counts: {
      total: args.items.length,
      businessOnly: args.items.filter((entry) => entry.provenienza === "business").length,
      fieldOnly: args.items.filter((entry) => entry.provenienza === "campo").length,
      reconstructed: args.items.filter((entry) => entry.provenienza === "ricostruito").length,
      withTimestamp: args.items.filter((entry) => entry.timestampRicostruito !== null).length,
      withAutista: args.items.filter((entry) => Boolean(entry.autistaNome)).length,
      withBadge: args.items.filter((entry) => Boolean(entry.badgeAutista)).length,
      withKm: args.items.filter((entry) => entry.km !== null).length,
      withCosto: args.items.filter((entry) => entry.costo !== null).length,
      withTipo: args.items.filter((entry) => Boolean(entry.tipo)).length,
      withValuta: args.items.filter((entry) => entry.valuta !== null).length,
    },
    reconstructionStats: args.reconstructionStats,
    datasetShapes: {
      business: args.businessDatasetShape,
      field: args.fieldDatasetShape,
    },
  };
}

function buildReadOnlySnapshot(args: {
  items: NextRifornimentoReadOnlyItem[];
  businessDatasetShape: NextLegacyDatasetShape;
  fieldDatasetShape: NextLegacyDatasetShape;
  reconstructionStats: NextMezzoRifornimentiSnapshot["reconstructionStats"];
}): NextRifornimentiReadOnlySnapshot {
  const snapshotBase = buildSnapshotBase(args);

  return {
    domainCode: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.code,
    domainName: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.name,
    logicalDatasets: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset,
    supportingReadOnlyDatasets:
      NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.supportingReadOnlyDatasets,
    normalizationStrategy: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.outputContract,
    datasetShapes: snapshotBase.datasetShapes,
    items: args.items,
    counts: snapshotBase.counts,
    totals: {
      litri: args.items.reduce((sum, entry) => sum + (entry.litri ?? 0), 0),
      costo: args.items.reduce((sum, entry) => sum + (entry.costo ?? 0), 0),
    },
    reconstructionStats: snapshotBase.reconstructionStats,
    trustModel: {
      source: buildSourceTrustModel({
        items: args.items,
        datasetShapes: snapshotBase.datasetShapes,
        reconstructionStats: args.reconstructionStats,
      }),
    },
    limitations: buildLimitations(snapshotBase),
  };
}

async function readNormalizedLegacyRows() {
  const [businessDataset, fieldDataset] = await Promise.all([
    readLegacyDataset(BUSINESS_DATASET_KEY),
    readLegacyDataset(FIELD_DATASET_KEY),
  ]);

  const businessRows = businessDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return normalizeLegacyRifornimento(
        entry as NextRifornimentoRaw,
        index,
        "business"
      );
    })
    .filter((entry): entry is NextNormalizedLegacyRifornimento => Boolean(entry));

  const fieldRows = fieldDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return normalizeLegacyRifornimento(entry as NextRifornimentoRaw, index, "field");
    })
    .filter((entry): entry is NextNormalizedLegacyRifornimento => Boolean(entry));

  return {
    businessDataset,
    fieldDataset,
    businessRows,
    fieldRows,
  };
}

export async function readNextRifornimentiReadOnlySnapshot(): Promise<NextRifornimentiReadOnlySnapshot> {
  const { businessDataset, fieldDataset, businessRows, fieldRows } =
    await readNormalizedLegacyRows();
  const { items, reconstructionStats } = mergeLegacyDatasets(businessRows, fieldRows);

  return buildReadOnlySnapshot({
    items,
    businessDatasetShape: businessDataset.datasetShape,
    fieldDatasetShape: fieldDataset.datasetShape,
    reconstructionStats,
  });
}

export async function readNextMezzoRifornimentiSnapshot(
  targa: string
): Promise<NextMezzoRifornimentiSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const { businessDataset, fieldDataset, businessRows, fieldRows } =
    await readNormalizedLegacyRows();
  const { items, reconstructionStats } = mergeLegacyDatasets(
    businessRows.filter((entry) => entry.mezzoTarga === mezzoTarga),
    fieldRows.filter((entry) => entry.mezzoTarga === mezzoTarga),
  );
  const base = buildReadOnlySnapshot({
    items,
    businessDatasetShape: businessDataset.datasetShape,
    fieldDatasetShape: fieldDataset.datasetShape,
    reconstructionStats,
  });

  return {
    ...base,
    mezzoTarga,
  };
}
