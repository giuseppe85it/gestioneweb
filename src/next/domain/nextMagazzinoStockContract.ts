const ALLOWED_UNITS = ["pz", "lt", "kg", "mt"] as const;

export const NEXT_MAGAZZINO_STOCK_ALLOWED_UNITS = ALLOWED_UNITS;

export type NextMagazzinoStockUnit =
  (typeof NEXT_MAGAZZINO_STOCK_ALLOWED_UNITS)[number];

type StockKeyInput = {
  descrizione?: unknown;
  fornitore?: unknown;
  unita?: unknown;
  stockKey?: unknown;
};

type StockEventInput = StockKeyInput & {
  sourceType: string;
  sourceDocId?: unknown;
  rowIndex?: number | null;
  quantita?: unknown;
  data?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeAsciiToken(value: unknown): string {
  const normalized = normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeNextMagazzinoStockUnit(
  value: unknown,
): NextMagazzinoStockUnit | null {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return null;

  if (["pz", "nr", "n", "numero", "numeri", "pezzo", "pezzi"].includes(normalized)) {
    return "pz";
  }
  if (["lt", "l", "litro", "litri"].includes(normalized)) {
    return "lt";
  }
  if (["kg", "kilo", "kili", "kilogrammo", "kilogrammi"].includes(normalized)) {
    return "kg";
  }
  if (["mt", "m", "metro", "metri"].includes(normalized)) {
    return "mt";
  }
  return null;
}

export function normalizeNextMagazzinoStockUnitLoose(value: unknown): string {
  return normalizeNextMagazzinoStockUnit(value) ?? normalizeText(value).toLowerCase();
}

export function isNextMagazzinoStockUnitSupported(value: unknown): boolean {
  return normalizeNextMagazzinoStockUnit(value) !== null;
}

export function buildNextMagazzinoStockKey(input: StockKeyInput): string | null {
  const explicit = normalizeAsciiToken(input.stockKey);
  if (explicit) return explicit;

  const descrizione = normalizeAsciiToken(input.descrizione);
  const unita = normalizeNextMagazzinoStockUnit(input.unita);
  if (!descrizione || !unita) return null;

  const fornitore = normalizeAsciiToken(input.fornitore) || "NOFORNITORE";
  return `${descrizione}::${fornitore}::${unita.toUpperCase()}`;
}

export function buildNextMagazzinoStockLoadKey(input: StockEventInput): string {
  const sourceType = normalizeAsciiToken(input.sourceType) || "UNKNOWN";
  const sourceDocId = normalizeAsciiToken(input.sourceDocId) || "NO_SOURCE";
  const descrizione = normalizeAsciiToken(input.descrizione) || "NO_DESC";
  const fornitore = normalizeAsciiToken(input.fornitore) || "NOFORNITORE";
  const unita = normalizeNextMagazzinoStockUnit(input.unita)?.toUpperCase() ?? "NOUNIT";
  const quantita = normalizeNumber(input.quantita);
  const quantitaToken = quantita === null ? "NOQTY" : quantita.toFixed(3);
  const rowIndex =
    typeof input.rowIndex === "number" && Number.isFinite(input.rowIndex)
      ? String(input.rowIndex)
      : "NOROW";
  const data = normalizeAsciiToken(input.data) || "NODATE";

  return [
    sourceType,
    sourceDocId,
    rowIndex,
    descrizione,
    fornitore,
    unita,
    quantitaToken,
    data,
  ].join("::");
}

export function readNextMagazzinoStockLoadKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => normalizeAsciiToken(entry))
        .filter((entry) => entry.length > 0),
    ),
  );
}

export function mergeNextMagazzinoStockLoadKeys(
  existing: unknown,
  nextKey: string | null,
): string[] {
  const normalizedKey = normalizeAsciiToken(nextKey);
  if (!normalizedKey) return readNextMagazzinoStockLoadKeys(existing);
  return Array.from(
    new Set([...readNextMagazzinoStockLoadKeys(existing), normalizedKey]),
  );
}

export function hasNextMagazzinoStockLoadKey(
  existing: unknown,
  targetKey: string | null,
): boolean {
  const normalizedTarget = normalizeAsciiToken(targetKey);
  if (!normalizedTarget) return false;
  return readNextMagazzinoStockLoadKeys(existing).includes(normalizedTarget);
}

export function normalizeNextMagazzinoMaterialIdentity(value: unknown): string {
  return normalizeAsciiToken(value);
}

export function normalizeNextMagazzinoSupplierIdentity(
  value: unknown,
): string | null {
  const normalized = normalizeAsciiToken(value);
  return normalized || null;
}

export function areNextMagazzinoUnitsCompatible(
  materialUnit: unknown,
  movementUnit: unknown,
): boolean {
  const left = normalizeNextMagazzinoStockUnit(materialUnit);
  const right = normalizeNextMagazzinoStockUnit(movementUnit);
  return Boolean(left && right && left === right);
}

export function looksLikeNextMagazzinoAdBlueMaterial(value: unknown): boolean {
  const normalized = normalizeAsciiToken(value);
  return normalized.includes("ADBLUE");
}

export function normalizeNextMagazzinoStockRefId(value: unknown): string | null {
  return normalizeOptionalText(value);
}
