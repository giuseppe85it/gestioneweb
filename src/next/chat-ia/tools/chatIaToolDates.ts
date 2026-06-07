// DEPRECATO: usare src/next/helpers/dateUnica.ts.
// Mantenuto solo per compatibilità chiamanti residui durante transizione.
import { parseAnyDate, toDisplay } from "../../helpers/dateUnica";

const DAY_MS = 86_400_000;

export type ChatIaResolvedPeriod = {
  from: string;
  to: string;
  label: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dateFromNumber(value: number): Date | null {
  if (!Number.isFinite(value)) return null;
  const timestampMs = Math.abs(value) < 10_000_000_000 ? value * 1000 : value;
  const parsed = new Date(timestampMs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateFromParts(year: number, month: number, day: number): Date | null {
  return isValidDateParts(year, month, day) ? new Date(year, month - 1, day) : null;
}

function shouldWarnUnparsedDate(): boolean {
  return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
}

function warnUnparsedDate(value: string): void {
  if (shouldWarnUnparsedDate()) {
    console.warn("[chat-ia-tool-date] Data non parsabile:", value);
  }
}

function isoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

function startOfWeekMonday(value: Date): Date {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function period(from: Date, to: Date, label: string): ChatIaResolvedPeriod {
  return { from: isoDate(from), to: isoDate(to), label };
}

function normalizedRelativeText(value: unknown): string {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
    : "";
}

function numberFromText(value: string, fallback: number): number {
  const numeric = value.match(/\b(\d{1,2})\b/);
  if (numeric) return Number(numeric[1]);
  if (/\bsette\b/.test(value)) return 7;
  if (/\btre\b/.test(value)) return 3;
  if (/\bdue\b/.test(value)) return 2;
  return fallback;
}

function dateFromString(value: string): Date | null {
  const text = value.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]|$)/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return dateFromParts(Number(year), Number(month), Number(day));
  }

  const italianMatch = text.match(/^(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{4})(?:\b|[,\sT])/);
  if (italianMatch) {
    const [, day, month, year] = italianMatch;
    return dateFromParts(Number(year), Number(month), Number(day));
  }

  const numericTimestamp = text.match(/^\d{10,13}$/);
  if (numericTimestamp) {
    return dateFromNumber(Number(text));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    warnUnparsedDate(value);
    return null;
  }

  return parsed;
}

/**
 * Risolve periodi relativi usati nei prompt chat in range ISO deterministici.
 * La funzione non consulta dati esterni: parte solo dalla data corrente runtime.
 */
export function resolveRelativePeriodExpression(value: unknown, now = new Date()): ChatIaResolvedPeriod | null {
  const text = normalizedRelativeText(value);
  if (!text) return null;

  const today = startOfDay(now);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  if (text.includes("mese scorso") || text.includes("scorso mese")) {
    const monthStart = startOfMonth(currentYear, currentMonth - 1);
    return period(monthStart, endOfMonth(monthStart.getFullYear(), monthStart.getMonth()), "mese scorso");
  }

  if (text.includes("mese corrente") || text.includes("questo mese")) {
    return period(startOfMonth(currentYear, currentMonth), today, "mese corrente");
  }

  if (text.includes("settimana scorsa") || text.includes("scorsa settimana")) {
    const thisWeekStart = startOfWeekMonday(today);
    const previousWeekStart = new Date(thisWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(thisWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    return period(previousWeekStart, previousWeekEnd, "settimana scorsa");
  }

  if (text.includes("ultimi 7 giorni") || text.includes("ultimi sette giorni")) {
    const days = 7;
    const from = new Date(today);
    from.setDate(from.getDate() - (days - 1));
    return period(from, today, "ultimi 7 giorni");
  }

  if (text.includes("ultimi") && text.includes("giorni")) {
    const days = Math.max(1, numberFromText(text, 7));
    const from = new Date(today);
    from.setDate(from.getDate() - (days - 1));
    return period(from, today, `ultimi ${days} giorni`);
  }

  if (text.includes("ultime settimane") || text.includes("recente")) {
    const from = new Date(today);
    from.setDate(from.getDate() - 60);
    return period(from, today, "ultime settimane");
  }

  if ((text.includes("ultimi") || text.includes("prossimi")) && text.includes("mesi")) {
    const months = Math.max(1, numberFromText(text, 3));
    if (text.includes("prossimi")) {
      const to = new Date(today);
      to.setMonth(to.getMonth() + months);
      return period(today, to, `prossimi ${months} mesi`);
    }
    const from = new Date(today);
    from.setMonth(from.getMonth() - months);
    return period(from, today, `ultimi ${months} mesi`);
  }

  if (text.includes("ultimo trimestre")) {
    const from = startOfMonth(currentYear, currentMonth - 3);
    const to = endOfMonth(currentYear, currentMonth - 1);
    return period(from, to, "ultimo trimestre");
  }

  if (text.includes("anno scorso") || text.includes("l'anno scorso")) {
    const year = currentYear - 1;
    return period(new Date(year, 0, 1), new Date(year, 11, 31), "anno scorso");
  }

  if (text.includes("quest'anno") || text.includes("quest anno") || text.includes("anno corrente")) {
    return period(new Date(currentYear, 0, 1), today, "anno corrente");
  }

  return null;
}

/**
 * Converte una data del gestionale in Date.
 * Le stringhe ambigue con giorno/mese/anno sono sempre italiane DD/MM/YYYY.
 */
export function parseChatIaToolDate(value: unknown): Date | null {
  const parsedByDateUnica = parseAnyDate(value);
  if (parsedByDateUnica) return parsedByDateUnica;

  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    return dateFromNumber(value);
  }

  if (isRecord(value)) {
    const maybeToDate = value.toDate;
    if (typeof maybeToDate === "function") {
      try {
        const result = maybeToDate.call(value);
        if (result instanceof Date && !Number.isNaN(result.getTime())) {
          return result;
        }
      } catch {
        return null;
      }
    }

    if (typeof value.seconds === "number") {
      return dateFromNumber(value.seconds);
    }

    if (typeof value._seconds === "number") {
      return dateFromNumber(value._seconds);
    }
  }

  if (typeof value === "string") {
    return dateFromString(value);
  }

  return null;
}

/**
 * Formatta una data per output utente in italiano DD/MM/YYYY.
 * Accetta date italiane, ISO, Date, timestamp numerici e timestamp Firestore.
 */
export function formatItalianDate(value: unknown): string {
  return toDisplay(value) || "-";
}

/**
 * Formatta date che arrivano da dataset legacy italiani ma sono gia passate
 * da normalizzatori che in passato potevano interpretare DD/MM come MM/DD.
 */
export function formatItalianDateFromItalianSource(value: unknown): string {
  return formatItalianDate(value);
}

/**
 * Formatta una data come "9 aprile 2027".
 */
export function formatItalianDateLong(value: unknown): string {
  return toDisplay(value) || "-";
}

/**
 * Calcola giorni fra oggi e una data target.
 * Negativo se la data e nel passato, positivo se nel futuro.
 */
export function daysBetween(target: unknown): number | null {
  const targetDate = parseChatIaToolDate(target);
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);

  return Math.round((targetDay.getTime() - today.getTime()) / DAY_MS);
}

/**
 * Restituisce true se una data e in scadenza nei prossimi N giorni.
 */
export function isExpiringWithin(target: unknown, days: number): boolean {
  const diff = daysBetween(target);
  if (diff === null) return false;
  return diff >= 0 && diff <= days;
}

/**
 * Restituisce true se una data e gia scaduta.
 */
export function isExpired(target: unknown): boolean {
  const diff = daysBetween(target);
  if (diff === null) return false;
  return diff < 0;
}
