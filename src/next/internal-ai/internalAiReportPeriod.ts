import type {
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
} from "./internalAiTypes";

const DAY_MS = 24 * 60 * 60 * 1000;

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

function startOfDay(value: Date): Date {
  const date = cloneDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date): Date {
  const date = cloneDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: Date): string {
  return value.toLocaleDateString("it-IT");
}

function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const parsed = new Date(year, Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createDefaultInternalAiReportPeriodInput(): InternalAiReportPeriodInput {
  return {
    preset: "all",
    fromDate: null,
    toDate: null,
  };
}

export function createInternalAiCustomPeriodInput(
  fromDate: string | null,
  toDate: string | null,
): InternalAiReportPeriodInput {
  return {
    preset: "custom",
    fromDate,
    toDate,
  };
}

export function resolveInternalAiReportPeriodContext(
  input: InternalAiReportPeriodInput | null | undefined,
  nowInput?: Date,
): InternalAiReportPeriodContext {
  const now = nowInput ? cloneDate(nowInput) : new Date();
  const normalizedInput = input ?? createDefaultInternalAiReportPeriodInput();

  if (normalizedInput.preset === "all") {
    return {
      preset: "all",
      label: "Tutto lo storico disponibile",
      fromDate: null,
      toDate: null,
      fromTimestamp: null,
      toTimestamp: null,
      appliesFilter: false,
      isValid: true,
      notes: ["Nessun filtro periodo attivo: le sezioni leggono tutto lo storico disponibile nel clone."],
    };
  }

  if (normalizedInput.preset === "last_30_days") {
    const to = endOfDay(now);
    const from = startOfDay(new Date(to.getTime() - 29 * DAY_MS));
    return {
      preset: "last_30_days",
      label: "Ultimi 30 giorni",
      fromDate: formatDateInput(from),
      toDate: formatDateInput(to),
      fromTimestamp: from.getTime(),
      toTimestamp: to.getTime(),
      appliesFilter: true,
      isValid: true,
      notes: [`Periodo calcolato dal ${formatDateLabel(from)} al ${formatDateLabel(to)}.`],
    };
  }

  if (normalizedInput.preset === "last_90_days") {
    const to = endOfDay(now);
    const from = startOfDay(new Date(to.getTime() - 89 * DAY_MS));
    return {
      preset: "last_90_days",
      label: "Ultimi 90 giorni",
      fromDate: formatDateInput(from),
      toDate: formatDateInput(to),
      fromTimestamp: from.getTime(),
      toTimestamp: to.getTime(),
      appliesFilter: true,
      isValid: true,
      notes: [`Periodo calcolato dal ${formatDateLabel(from)} al ${formatDateLabel(to)}.`],
    };
  }

  if (normalizedInput.preset === "last_full_month") {
    const previousMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    const previousMonthStart = startOfDay(
      new Date(previousMonthEnd.getFullYear(), previousMonthEnd.getMonth(), 1),
    );
    return {
      preset: "last_full_month",
      label: "Ultimo mese chiuso",
      fromDate: formatDateInput(previousMonthStart),
      toDate: formatDateInput(previousMonthEnd),
      fromTimestamp: previousMonthStart.getTime(),
      toTimestamp: previousMonthEnd.getTime(),
      appliesFilter: true,
      isValid: true,
      notes: [
        `Periodo calcolato sull'ultimo mese completo: dal ${formatDateLabel(previousMonthStart)} al ${formatDateLabel(previousMonthEnd)}.`,
      ],
    };
  }

  const from = parseDateInput(normalizedInput.fromDate);
  const to = parseDateInput(normalizedInput.toDate);
  if (!from || !to || from.getTime() > to.getTime()) {
    return {
      preset: "custom",
      label: "Intervallo personalizzato non valido",
      fromDate: normalizedInput.fromDate,
      toDate: normalizedInput.toDate,
      fromTimestamp: null,
      toTimestamp: null,
      appliesFilter: false,
      isValid: false,
      notes: ["L'intervallo personalizzato richiede sia la data iniziale sia la data finale, con ordine cronologico corretto."],
    };
  }

  const fromDay = startOfDay(from);
  const toDay = endOfDay(to);
  return {
    preset: "custom",
    label: `Intervallo personalizzato ${formatDateLabel(fromDay)} - ${formatDateLabel(toDay)}`,
    fromDate: formatDateInput(fromDay),
    toDate: formatDateInput(toDay),
    fromTimestamp: fromDay.getTime(),
    toTimestamp: toDay.getTime(),
    appliesFilter: true,
    isValid: true,
    notes: [`Intervallo personalizzato applicato dal ${formatDateLabel(fromDay)} al ${formatDateLabel(toDay)}.`],
  };
}

export function isTimestampInInternalAiReportPeriod(
  timestamp: number | null | undefined,
  context: InternalAiReportPeriodContext,
): boolean {
  if (!context.appliesFilter) {
    return true;
  }

  if (timestamp == null) {
    return false;
  }

  if (context.fromTimestamp != null && timestamp < context.fromTimestamp) {
    return false;
  }

  if (context.toTimestamp != null && timestamp > context.toTimestamp) {
    return false;
  }

  return true;
}

export function filterItemsByInternalAiReportPeriod<T>(
  items: T[],
  getTimestamp: (item: T) => number | null | undefined,
  context: InternalAiReportPeriodContext,
): {
  filteredItems: T[];
  totalCount: number;
  matchingCount: number;
  outsideRangeCount: number;
  missingTimestampCount: number;
} {
  if (!context.appliesFilter) {
    return {
      filteredItems: [...items],
      totalCount: items.length,
      matchingCount: items.length,
      outsideRangeCount: 0,
      missingTimestampCount: 0,
    };
  }

  const filteredItems: T[] = [];
  let outsideRangeCount = 0;
  let missingTimestampCount = 0;

  items.forEach((item) => {
    const timestamp = getTimestamp(item);
    if (timestamp == null) {
      missingTimestampCount += 1;
      return;
    }

    if (isTimestampInInternalAiReportPeriod(timestamp, context)) {
      filteredItems.push(item);
    } else {
      outsideRangeCount += 1;
    }
  });

  return {
    filteredItems,
    totalCount: items.length,
    matchingCount: filteredItems.length,
    outsideRangeCount,
    missingTimestampCount,
  };
}

export function describeInternalAiPeriodApplication(args: {
  noun: string;
  totalCount: number;
  matchingCount: number;
  outsideRangeCount: number;
  missingTimestampCount: number;
  context: InternalAiReportPeriodContext;
}): string {
  if (!args.context.appliesFilter) {
    return `Nessun filtro periodo attivo su ${args.noun}.`;
  }

  if (args.totalCount === 0) {
    return `Filtro periodo attivo su ${args.noun}, ma non ci sono record leggibili da valutare.`;
  }

  const parts = [`Filtro periodo applicato a ${args.matchingCount} ${args.noun}`];
  if (args.outsideRangeCount > 0) {
    parts.push(`${args.outsideRangeCount} fuori intervallo`);
  }
  if (args.missingTimestampCount > 0) {
    parts.push(`${args.missingTimestampCount} senza data affidabile`);
  }
  return `${parts.join(", ")}.`;
}
