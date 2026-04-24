import type { NextFornitoreReadOnlyItem } from "./domain/nextFornitoriDomain";
import type { NextProcurementListinoItem } from "./domain/nextProcurementDomain";
import type { Valuta } from "./nextPreventivoManualeWriter";

export type PreventivoPriceExtractDocument = {
  number: string | null;
  date: string | null;
  currency: string | null;
  confidence: number | null;
};

export type PreventivoPriceExtractSupplier = {
  name: string | null;
  confidence: number | null;
};

export type PreventivoPriceExtractItem = {
  description: string | null;
  articleCode: string | null;
  uom: string | null;
  unitPrice: number | null;
  currency: string | null;
  confidence: number | null;
};

export type PreventivoPriceExtractWarning = {
  code:
    | "MISSING_CURRENCY"
    | "MISSING_UNIT_PRICE"
    | "LIKELY_TOTAL_PRICE"
    | "PARTIAL_TABLE"
    | "LOW_CONFIDENCE";
  severity: "info" | "warning" | "error";
  message: string;
};

export type PreventivoPriceExtractResult = {
  schemaVersion: "preventivo_price_extract_v1";
  document: PreventivoPriceExtractDocument;
  supplier: PreventivoPriceExtractSupplier;
  items: PreventivoPriceExtractItem[];
  warnings: PreventivoPriceExtractWarning[];
};

export type ReviewRow = {
  id: string;
  descrizione: string;
  codiceArticolo: string;
  unita: string;
  prezzoUnitario: string;
  note: string;
};

export type ReviewRowAnalysisStatus =
  | "NUOVO"
  | "GIA_ESISTE_CODICE"
  | "GIA_ESISTE_DESCRIZIONE";

export type ReviewRowAnalysisDeltaKind = "UP" | "DOWN" | "SAME" | "NONE";

export type ReviewRowAnalysis = {
  rowId: string;
  status: ReviewRowAnalysisStatus;
  previousPrice: number | null;
  previousCurrency: Valuta | null;
  delta: number | null;
  deltaKind: ReviewRowAnalysisDeltaKind;
  referenceLabel: string | null;
};

function buildLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeDescrizione(value: string) {
  return String(value || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeUnita(value: string) {
  return String(value || "").toUpperCase().trim();
}

export function normalizeArticoloCanonico(value: string) {
  return normalizeDescrizione(value);
}

export function computeTrend(prezzoNuovo: number, prezzoPrecedente?: number) {
  if (
    prezzoPrecedente === undefined ||
    prezzoPrecedente === null ||
    !Number.isFinite(prezzoPrecedente)
  ) {
    return {
      trend: "new" as const,
      deltaAbs: undefined as number | undefined,
      deltaPct: undefined as number | undefined,
    };
  }

  const deltaAbs = prezzoNuovo - prezzoPrecedente;
  const deltaPct = prezzoPrecedente === 0 ? undefined : (deltaAbs / prezzoPrecedente) * 100;
  if (deltaAbs < 0) return { trend: "down" as const, deltaAbs, deltaPct };
  if (deltaAbs > 0) return { trend: "up" as const, deltaAbs, deltaPct };
  return { trend: "same" as const, deltaAbs, deltaPct: 0 };
}

export function listinoKey(input: {
  fornitoreId: string;
  articoloCanonico: string;
  unita: string;
  valuta: Valuta;
}) {
  return [
    String(input.fornitoreId || "").trim(),
    normalizeArticoloCanonico(input.articoloCanonico),
    normalizeUnita(input.unita),
    input.valuta,
  ].join("|");
}

export function resolveFornitoreFromExtract(
  supplierName: string | null,
  fornitori: NextFornitoreReadOnlyItem[],
): string | null {
  const normalized = normalizeDescrizione(String(supplierName || ""));
  if (!normalized) return null;
  const exact = fornitori.find((item) => normalizeDescrizione(item.nome) === normalized);
  if (exact) return exact.id;
  const partial = fornitori.find((item) => {
    const target = normalizeDescrizione(item.nome);
    return target.includes(normalized) || normalized.includes(target);
  });
  return partial?.id ?? null;
}

export function mapExtractedRowsToReviewItems(
  result: PreventivoPriceExtractResult,
): ReviewRow[] {
  return (Array.isArray(result.items) ? result.items : [])
    .filter((item) => {
      const description = String(item.description || "").trim();
      const unitPrice = Number(item.unitPrice);
      return description.length > 0 && Number.isFinite(unitPrice) && unitPrice > 0;
    })
    .map((item) => {
      const noteParts: string[] = [];
      if (item.articleCode) noteParts.push(`code:${String(item.articleCode).trim().toUpperCase()}`);
      if (item.currency) noteParts.push(`valuta:${String(item.currency).trim().toUpperCase()}`);

      return {
        id: buildLocalId("preventivo-ia-row"),
        descrizione: String(item.description || "").trim().toUpperCase(),
        codiceArticolo: String(item.articleCode || "").trim().toUpperCase(),
        unita: normalizeUnita(String(item.uom || "")),
        prezzoUnitario: Number(item.unitPrice).toFixed(2),
        note: noteParts.join(" | "),
      };
    });
}

export function normalizeExtractCurrency(currency: string | null): Valuta | null {
  const normalized = String(currency || "").toUpperCase().trim();
  if (normalized === "CHF" || normalized === "EUR") return normalized;
  return null;
}

export function extractDateToInputValue(dateString: string | null): string {
  const raw = String(dateString || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  const isValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isValid) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseReviewRowPrice(value: string) {
  const normalized = String(value || "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeRowAnalysis(
  rows: ReviewRow[],
  fornitoreId: string | null,
  listino: NextProcurementListinoItem[],
  valuta: Valuta,
): ReviewRowAnalysis[] {
  const supplierId = String(fornitoreId || "").trim();
  const scopedListino = supplierId
    ? listino.filter((item) => String(item.supplierId || "").trim() === supplierId)
    : [];

  return rows.map((row) => {
    const rowCode = String(row.codiceArticolo || "").trim().toUpperCase();
    const rowDescNorm = normalizeArticoloCanonico(String(row.descrizione || ""));
    const codeMatch = rowCode
      ? scopedListino.find(
          (item) => String(item.codiceArticolo || "").trim().toUpperCase() === rowCode,
        )
      : undefined;
    const descMatch = !codeMatch
      ? scopedListino.find(
          (item) => normalizeArticoloCanonico(String(item.articoloCanonico || "")) === rowDescNorm,
        )
      : undefined;
    const matched = codeMatch || descMatch || null;
    const status: ReviewRowAnalysisStatus = codeMatch
      ? "GIA_ESISTE_CODICE"
      : descMatch
        ? "GIA_ESISTE_DESCRIZIONE"
        : "NUOVO";

    const previousPrice =
      matched && Number.isFinite(Number(matched.prezzoAttuale))
        ? Number(matched.prezzoAttuale)
        : null;
    const previousCurrency = normalizeExtractCurrency(matched?.valuta || null);
    const priceValue = parseReviewRowPrice(row.prezzoUnitario);
    const canCompare =
      matched &&
      priceValue !== null &&
      previousPrice !== null &&
      (!previousCurrency || previousCurrency === valuta);

    let delta: number | null = null;
    let deltaKind: ReviewRowAnalysisDeltaKind = "NONE";
    if (canCompare) {
      delta = priceValue - previousPrice;
      if (delta > 0.00001) {
        deltaKind = "UP";
      } else if (delta < -0.00001) {
        deltaKind = "DOWN";
      } else {
        deltaKind = "SAME";
        delta = 0;
      }
    }

    const referenceParts = [
      matched?.fonteNumeroPreventivo ? `N. ${matched.fonteNumeroPreventivo}` : null,
      matched?.fonteDataPreventivo ? `del ${matched.fonteDataPreventivo}` : null,
    ].filter((entry): entry is string => Boolean(entry));

    return {
      rowId: row.id,
      status,
      previousPrice,
      previousCurrency,
      delta,
      deltaKind,
      referenceLabel: referenceParts.length > 0 ? referenceParts.join(" ") : null,
    };
  });
}
