export const CISTERNA_DOCUMENTI_COLLECTION = "@documenti_cisterna";
export const CISTERNA_SCHEDE_COLLECTION = "@cisterna_schede_ia";
export const CISTERNA_PARAMETRI_COLLECTION = "@cisterna_parametri_mensili";
export const RIFORNIMENTI_AUTISTI_KEY = "@rifornimenti_autisti_tmp";
export const CISTERNA_REFUEL_TAG = "caravate";

export function monthKeyFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date());
}

export function monthLabel(monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("it-CH", { month: "long", year: "numeric" });
}
