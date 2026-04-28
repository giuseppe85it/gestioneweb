import type { InternalAiReportPeriodInput } from "../../internal-ai/internalAiTypes";

const MONTHS: Record<string, string> = {
  gennaio: "01",
  febbraio: "02",
  marzo: "03",
  aprile: "04",
  maggio: "05",
  giugno: "06",
  luglio: "07",
  agosto: "08",
  settembre: "09",
  ottobre: "10",
  novembre: "11",
  dicembre: "12",
};

export function normalizePromptText(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeEntityValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function extractTarga(prompt: string): string | null {
  const spacedPlateMatch = prompt.toUpperCase().match(/\b[A-Z]{1,3}(?:[\s-]*\d){3,7}\b/);
  if (spacedPlateMatch?.[0]) {
    return spacedPlateMatch[0].replace(/[^A-Z0-9]/g, "");
  }

  const normalized = prompt.toUpperCase().replace(/[^A-Z0-9]+/g, " ");
  const tokens = normalized.match(/\b[A-Z0-9]{5,9}\b/g) ?? [];
  const token = tokens.find((entry) => /[A-Z]/.test(entry) && /\d/.test(entry));
  return token ? token.replace(/\s+/g, "") : null;
}

export function extractBadge(prompt: string): { value: string; badge?: string | null } | null {
  const badgeMatch = prompt.match(/\bbadge\s+([a-z0-9-]{2,20})\b/i);
  if (badgeMatch?.[1]) {
    return { value: badgeMatch[1].trim(), badge: badgeMatch[1].trim() };
  }

  const nameMatch = prompt.match(/\b(?:autista|collega)\s+([a-zàèéìòù' -]{2,60})/i);
  if (!nameMatch?.[1]) {
    return null;
  }

  const value = nameMatch[1]
    .replace(/\b(?:aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gennaio|febbraio|marzo)\b.*$/i, "")
    .trim();
  return value ? { value: normalizeEntityValue(value), badge: null } : null;
}

export function extractNamedEntity(prompt: string, keyword: string): string | null {
  const pattern = new RegExp(`\\b${keyword}\\s+([a-zàèéìòù0-9' -]{2,60})`, "i");
  const match = prompt.match(pattern);
  return match?.[1] ? normalizeEntityValue(match[1]) : null;
}

export function extractPeriodHint(prompt: string): InternalAiReportPeriodInput | null {
  const normalized = normalizePromptText(prompt);
  if (normalized.includes("ultimi 30 giorni")) {
    return { preset: "last_30_days", fromDate: null, toDate: null };
  }
  if (normalized.includes("ultimi 90 giorni")) {
    return { preset: "last_90_days", fromDate: null, toDate: null };
  }
  if (normalized.includes("ultimo mese")) {
    return { preset: "last_full_month", fromDate: null, toDate: null };
  }

  const monthMatch = normalized.match(
    /\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(20\d{2})\b/,
  );
  if (!monthMatch?.[1] || !monthMatch[2]) {
    return null;
  }

  const month = MONTHS[monthMatch[1]];
  const year = monthMatch[2];
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  return {
    preset: "custom",
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
