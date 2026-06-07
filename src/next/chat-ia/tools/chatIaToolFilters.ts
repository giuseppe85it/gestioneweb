import { resolveRelativePeriodExpression } from "./chatIaToolDates";

/**
 * Helper per normalizzare parametri filtri opzionali ricevuti da OpenAI.
 * I parametri vuoti o zero devono essere trattati come filtro non applicato.
 */

export type CleanPeriodFilter = { from: string | null; to: string | null };
export type TruncationMeta = {
  total_count: number;
  shown: number;
  is_truncated: boolean;
  truncation_reason: string | null;
};

export function isEmptyTextFilter(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  return value.trim() === "";
}

export function isEmptyNumericFilter(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "number") return false;
  if (Number.isNaN(value)) return true;
  return value <= 0;
}

export function isEmptyPeriodFilter(period: unknown): boolean {
  if (typeof period === "string") return period.trim() === "";
  if (!period || typeof period !== "object") return true;
  const p = period as { from?: unknown; to?: unknown };
  return isEmptyTextFilter(p.from) && isEmptyTextFilter(p.to);
}

export function cleanTextFilter(value: unknown): string | null {
  if (isEmptyTextFilter(value)) return null;
  return typeof value === "string" ? value.trim() : null;
}

export function cleanNumericFilter(value: unknown): number | null {
  if (isEmptyNumericFilter(value)) return null;
  return typeof value === "number" ? value : null;
}

export function cleanPeriodFilter(period: unknown): CleanPeriodFilter | null {
  if (isEmptyPeriodFilter(period)) return null;
  if (typeof period === "string") {
    const resolved = resolveRelativePeriodExpression(period);
    return resolved ? { from: resolved.from, to: resolved.to } : null;
  }
  const p = period as { from?: unknown; to?: unknown };
  const relative = resolveRelativePeriodExpression(`${cleanTextFilter(p.from) ?? ""} ${cleanTextFilter(p.to) ?? ""}`.trim());
  if (relative) return { from: relative.from, to: relative.to };
  return {
    from: cleanTextFilter(p.from),
    to: cleanTextFilter(p.to),
  };
}

export function buildTruncationMeta(totalCount: number, shown: number, label = "risultati"): TruncationMeta {
  const safeTotal = Number.isFinite(totalCount) ? Math.max(0, Math.floor(totalCount)) : 0;
  const safeShown = Number.isFinite(shown) ? Math.max(0, Math.min(Math.floor(shown), safeTotal)) : 0;
  const isTruncated = safeTotal > safeShown;
  return {
    total_count: safeTotal,
    shown: safeShown,
    is_truncated: isTruncated,
    truncation_reason: isTruncated
      ? `Mostrati primi ${safeShown} di ${safeTotal} ${label}. Specifica filtri piu stretti per vederne di piu.`
      : null,
  };
}

export function truncationNotice(meta: TruncationMeta): string[] {
  return meta.truncation_reason ? [meta.truncation_reason] : [];
}
