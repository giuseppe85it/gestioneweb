type TimestampLike = {
  toDate?: unknown;
  toMillis?: unknown;
  seconds?: unknown;
  nanoseconds?: unknown;
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}[Tt\s]\d{2}:\d{2}/;
const LEGACY_DATE_RE =
  /^(\d{1,2})[ ./](\d{1,2})[ ./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;
const USER_DATE_RE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function pad4(value: number): string {
  return String(value).padStart(4, "0");
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime()) && !Number.isNaN(value.getTime());
}

function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    return null;
  }

  return isValidDate(parsed) ? parsed : null;
}

function parseLegacyDate(raw: string, matcher: RegExp): Date | null {
  const match = raw.match(matcher);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hours = match[4] ? Number(match[4]) : 0;
  const minutes = match[5] ? Number(match[5]) : 0;

  return buildLocalDate(year, month, day, hours, minutes);
}

function parseTimestampLike(value: TimestampLike): Date | null {
  if (typeof value.toDate === "function") {
    const parsedDate = value.toDate();
    if (parsedDate instanceof Date && isValidDate(parsedDate)) {
      return new Date(parsedDate.getTime());
    }
  }

  if (typeof value.toMillis === "function") {
    const parsed = Number(value.toMillis());
    if (Number.isFinite(parsed) && !Number.isNaN(parsed)) {
      const date = new Date(parsed);
      return isValidDate(date) ? date : null;
    }
  }

  const seconds = Number(value.seconds);
  if (Number.isFinite(seconds)) {
    const nanoseconds = Number(value.nanoseconds);
    const millisFromNanos = Number.isFinite(nanoseconds)
      ? Math.floor(nanoseconds / 1_000_000)
      : 0;
    const date = new Date(seconds * 1000 + millisFromNanos);
    return isValidDate(date) ? date : null;
  }

  return null;
}

/**
 * Converte qualsiasi formato data noto del NEXT in Date.
 *
 * Formati accettati:
 * - Date JavaScript: new Date(2026, 4, 10)
 * - Firestore Timestamp: oggetti con .toDate(), .toMillis() oppure seconds/nanoseconds
 * - timestamp millisecondi: 1778544000000
 * - ISO breve: "2026-05-10"
 * - ISO esteso: "2026-05-10T14:30:00" / "2026-05-10T12:30:00Z"
 * - legacy italiano con spazi: giorno, mese e anno separati da spazio
 * - legacy italiano con slash: "10/05/2026"
 * - legacy italiano con punti: "10.05.2026"
 * - null, undefined e stringa vuota: null
 */
export function parseAnyDate(input: unknown): Date | null {
  if (input === null || input === undefined || input === "") return null;

  if (input instanceof Date) {
    return isValidDate(input) ? new Date(input.getTime()) : null;
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input) || Number.isNaN(input)) return null;
    const parsed = new Date(input);
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof input === "object") {
    return parseTimestampLike(input as TimestampLike);
  }

  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  const isoDate = raw.match(ISO_DATE_RE);
  if (isoDate) {
    return buildLocalDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }

  if (ISO_DATE_TIME_RE.test(raw)) {
    const parsed = new Date(raw);
    return isValidDate(parsed) ? parsed : null;
  }

  return parseLegacyDate(raw, LEGACY_DATE_RE);
}

export function toISO(input: unknown): string | null {
  const parsed = parseAnyDate(input);
  if (!parsed) return null;

  return [
    pad4(parsed.getFullYear()),
    pad2(parsed.getMonth() + 1),
    pad2(parsed.getDate()),
  ].join("-");
}

export function toDisplay(input: unknown): string {
  const parsed = parseAnyDate(input);
  if (!parsed) return "";

  return [pad2(parsed.getDate()), pad2(parsed.getMonth() + 1), pad4(parsed.getFullYear())].join("/");
}

export function toDisplayDateTime(input: unknown): string {
  const parsed = parseAnyDate(input);
  if (!parsed) return "";

  return `${toDisplay(parsed)} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

export function fromUserInput(text: string): string | null {
  const parsed = parseLegacyDate(String(text ?? "").trim(), USER_DATE_RE);
  return parsed ? toISO(parsed) : null;
}

export function compareISO(a: string | null, b: string | null): number {
  const left = toISO(a);
  const right = toISO(b);

  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  return left.localeCompare(right);
}
