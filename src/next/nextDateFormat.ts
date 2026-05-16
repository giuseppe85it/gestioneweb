// DEPRECATO: usare src/next/helpers/dateUnica.ts.
// Mantenuto solo per compatibilità chiamanti residui durante transizione.
import {
  parseAnyDate,
  toDisplay,
  toDisplayDateTime,
  toISO,
} from "./helpers/dateUnica";

export type DateLike =
  | Date
  | number
  | string
  | { toDate?: () => Date; seconds?: number; _seconds?: number }
  | null
  | undefined;

export function toNextDateValue(value: unknown): Date | null {
  return parseAnyDate(value);
}

export function formatDateUI(value: DateLike): string {
  return toDisplay(value) || "-";
}

export function formatDateTimeUI(value: DateLike): string {
  return toDisplayDateTime(value) || "-";
}

export function formatDateInput(value: DateLike): string {
  return toISO(value) ?? "";
}

export function formatEditableDateUI(value: DateLike): string {
  return toDisplay(value);
}
