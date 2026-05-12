// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowShared.
// Utilities di rendering condivise tra le 4 righe compatte: format
// data/orario, placeholder SVG mezzo, helper targa/autista. Niente
// state, niente fetch, niente integrazioni esterne.

import type { ReactElement } from "react";

const MONTH_LABELS_IT: ReadonlyArray<string> = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];

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
  const day: string = String(date.getDate());
  const monthLabel: string = MONTH_LABELS_IT[date.getMonth()] ?? "";
  const year: string = String(date.getFullYear());
  const hh: string = String(date.getHours()).padStart(2, "0");
  const mm: string = String(date.getMinutes()).padStart(2, "0");
  return {
    d: `${day} ${monthLabel}`,
    y: year,
    t: `${hh}:${mm}`,
  };
}

export function formatTimelineStamp(ts: number | null): string {
  if (ts === null || !Number.isFinite(ts) || ts === 0) return "—";
  const date: Date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  const dd: string = String(date.getDate()).padStart(2, "0");
  const mm: string = String(date.getMonth() + 1).padStart(2, "0");
  const hh: string = String(date.getHours()).padStart(2, "0");
  const mi: string = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm} · ${hh}:${mi}`;
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

// SVG placeholder mezzo. Categoria opzionale (in Step 3 viene
// dedotta dalla string `categoria` quando disponibile; in Step 4
// arrivera' anche la foto reale via JOIN flotta).
type VeicoloKind =
  | "trattore"
  | "motrice"
  | "cisterna"
  | "rimorchio"
  | "compressore"
  | "attrezzature";

function deriveVeicoloKind(categoria: string | null | undefined): VeicoloKind {
  const c: string = String(categoria ?? "").toLowerCase();
  if (c.includes("compressore")) return "compressore";
  if (c.includes("attrezz")) return "attrezzature";
  if (c.includes("cisterna")) return "cisterna";
  if (c.includes("rimorch") || c.includes("semirimorch")) return "rimorchio";
  if (c.includes("motrice")) return "motrice";
  return "trattore";
}

type PlaceholderProps = {
  categoria: string | null | undefined;
};

export function ArchivioVeicoloPhotoPlaceholder({
  categoria,
}: PlaceholderProps): ReactElement {
  const kind: VeicoloKind = deriveVeicoloKind(categoria);
  const title: string = categoria ? String(categoria) : "Mezzo";
  return (
    <div
      className="archivio-row-photo archivio-row-photo--empty"
      title={title}
      aria-label={title}
    >
      {renderVeicoloSvg(kind)}
    </div>
  );
}

function renderVeicoloSvg(kind: VeicoloKind): ReactElement {
  switch (kind) {
    case "trattore":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="9" width="11" height="8" rx="1" />
          <path d="M13 11h4l3 3v3h-7" />
          <circle cx="6.5" cy="18.5" r="2" />
          <circle cx="17.5" cy="18.5" r="2" />
        </svg>
      );
    case "motrice":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="8" width="14" height="9" rx="1" />
          <path d="M16 11h3l2 3v3h-5" />
          <circle cx="6" cy="19" r="1.6" />
          <circle cx="11" cy="19" r="1.6" />
          <circle cx="18" cy="19" r="1.6" />
        </svg>
      );
    case "cisterna":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="9" cy="13" rx="7" ry="4" />
          <path d="M16 13h3l2 2v2h-5" />
          <circle cx="6" cy="19" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
          <circle cx="18" cy="19" r="1.6" />
        </svg>
      );
    case "rimorchio":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="18" height="10" rx="1" />
          <circle cx="7" cy="19" r="1.6" />
          <circle cx="15" cy="19" r="1.6" />
        </svg>
      );
    case "compressore":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="14" height="11" rx="1" />
          <circle cx="10" cy="11.5" r="3" />
          <path d="M17 9h4v6h-4" />
        </svg>
      );
    case "attrezzature":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 4l6 6-4 4-6-6z" />
          <path d="M11 10 4 17l3 3 7-7" />
        </svg>
      );
  }
}

type ChevronProps = {
  onClick: () => void;
};

export function ArchivioExpandChevron({ onClick }: ChevronProps): ReactElement {
  return (
    <button
      type="button"
      className="archivio-row-expand-hint"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Espandi/comprimi dettagli"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

// Icone badge condivise (Materiali / Foto)
export function ArchivioBadgeMaterialiIcon(): ReactElement {
  return (
    <svg className="archivio-badge-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function ArchivioBadgeFotoIcon(): ReactElement {
  return (
    <svg className="archivio-badge-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 6V4h8v2" />
    </svg>
  );
}

// Tipo segnalazione -> classe chip (replica deriveSegnTipo di Sinottica V2).
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
