export type DateLike =
  | Date
  | number
  | string
  | { toDate?: () => Date; seconds?: number; _seconds?: number }
  | null
  | undefined;

const pad2 = (value: number) => String(value).padStart(2, "0");

function buildDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date | null {
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toNextDateValue(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;

    const dmyMatch = raw.match(
      /^(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{2,4})(?:[,\sT]+(\d{1,2}):(\d{2}))?$/,
    );
    if (dmyMatch) {
      const yearRaw = Number(dmyMatch[3]);
      const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
      return buildDate(
        year,
        Number(dmyMatch[2]),
        Number(dmyMatch[1]),
        Number(dmyMatch[4] ?? "0"),
        Number(dmyMatch[5] ?? "0"),
      );
    }

    const isoMatch = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    );
    if (isoMatch) {
      return buildDate(
        Number(isoMatch[1]),
        Number(isoMatch[2]),
        Number(isoMatch[3]),
        Number(isoMatch[4] ?? "0"),
        Number(isoMatch[5] ?? "0"),
      );
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object") {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof candidate.toDate === "function") {
      const parsed = candidate.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }

    if (typeof candidate.seconds === "number") {
      const parsed = new Date(candidate.seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof candidate._seconds === "number") {
      const parsed = new Date(candidate._seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
}

export function formatDateUI(value: DateLike): string {
  const parsed = toNextDateValue(value);
  if (!parsed) return "-";
  return `${pad2(parsed.getDate())} ${pad2(parsed.getMonth() + 1)} ${parsed.getFullYear()}`;
}

export function formatDateTimeUI(value: DateLike): string {
  const parsed = toNextDateValue(value);
  if (!parsed) return "-";
  return `${formatDateUI(parsed)} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

export function formatDateInput(value: DateLike): string {
  const parsed = toNextDateValue(value);
  if (!parsed) return "";
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

export function formatEditableDateUI(value: DateLike): string {
  const parsed = toNextDateValue(value);
  return parsed ? formatDateUI(parsed) : "";
}
