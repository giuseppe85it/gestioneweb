import { parseAnyDate, toDisplay, toDisplayDateTime } from "../../../helpers/dateUnica";

export type ArchivioFormattedDate = {
  d: string;
  y: string;
  t: string;
};

const EMPTY_FORMATTED_DATE: ArchivioFormattedDate = {
  d: "—",
  y: "",
  t: "",
};

export function formatDateShort(ts: number | null): ArchivioFormattedDate {
  if (ts === null || !Number.isFinite(ts) || ts === 0) {
    return EMPTY_FORMATTED_DATE;
  }
  const date: Date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_FORMATTED_DATE;
  }
  const hh: string = String(date.getHours()).padStart(2, "0");
  const mm: string = String(date.getMinutes()).padStart(2, "0");
  return {
    d: toDisplay(date) || "—",
    y: "",
    t: `${hh}:${mm}`,
  };
}

export function formatTimelineStamp(ts: number | null): string {
  if (ts === null || !Number.isFinite(ts) || ts === 0) return "—";
  return parseAnyDate(ts) ? toDisplayDateTime(ts) || "—" : "—";
}

export function formatTarga(targa: string | null | undefined): string {
  const raw: string = String(targa ?? "").trim();
  if (!raw) return "—";
  return raw.toUpperCase();
}

export function formatAutistaCompact(nome: string | null | undefined): string {
  const raw: string = String(nome ?? "").trim();
  if (!raw) return "—";
  const parts: string[] = raw.split(/\s+/).filter((p: string) => p.length > 0);
  if (parts.length <= 1) return raw;
  const first: string = parts[0];
  const last: string = parts[parts.length - 1];
  const initial: string = first.charAt(0).toUpperCase();
  return `${initial}. ${last}`;
}

export function formatImporto(
  importo: number | null | undefined,
  valuta: string | null | undefined,
): { value: string; ccy: string; isContratto: boolean } {
  const ccy: string = String(valuta ?? "").trim().toUpperCase() || "CHF";
  if (importo === null || importo === undefined) {
    return { value: "—", ccy, isContratto: false };
  }
  if (importo === 0) {
    return { value: "0,00", ccy, isContratto: true };
  }
  const formatted: string = importo.toLocaleString("it-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { value: formatted, ccy, isContratto: false };
}

export function deriveSegnTipoChip(
  tipo: string | null | undefined,
): "freni" | "gomme" | "elettrico" | "altro" {
  const t: string = String(tipo ?? "").toLowerCase();
  if (t.includes("fren")) return "freni";
  if (t.includes("gomm")) return "gomme";
  if (t.includes("elett")) return "elettrico";
  return "altro";
}

export function segnTipoLabel(
  kind: "freni" | "gomme" | "elettrico" | "altro",
): string {
  switch (kind) {
    case "freni":
      return "Freni";
    case "gomme":
      return "Gomme";
    case "elettrico":
      return "Elettrico";
    case "altro":
      return "Altro";
  }
}
