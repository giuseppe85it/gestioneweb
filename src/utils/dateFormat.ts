type DateLike = Date | number | string | { toDate?: () => Date } | null | undefined;

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateValue = (value: DateLike): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    const match = raw.match(
      /^(\d{2})[\/.\s-](\d{2})[\/.\s-](\d{4})(?:[,\sT]+(\d{1,2}):(\d{2}))?/
    );
    if (match) {
      const [, dd, mm, yyyy, hh, min] = match;
      const d = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh || 0),
        Number(min || 0),
        0
      );
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const anyValue: any = value;
    if (typeof anyValue.toDate === "function") {
      const d = anyValue.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof anyValue.seconds === "number") {
      const d = new Date(anyValue.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
};

export const formatDateUI = (value: DateLike): string => {
  const d = toDateValue(value);
  if (!d) return "—";
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateTimeUI = (value: DateLike): string => {
  const d = toDateValue(value);
  if (!d) return "—";
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

export const formatDateInput = (value: DateLike): string => {
  const d = toDateValue(value);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};
