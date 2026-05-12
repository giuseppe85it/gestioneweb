// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowShared.
// Utilities di rendering condivise tra le 4 righe compatte: format
// data/orario, placeholder SVG mezzo, helper targa/autista. Niente
// state, niente fetch, niente integrazioni esterne.

import type { ReactElement } from "react";

import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";

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

// Thin wrapper retrocompat: PROMPT 30.1 ha spostato il rendering
// veicolo a `ArchivioVeicoloPhoto`. Questo wrapper resta usabile in
// isolamento (es. test/storybook) quando NON si dispone della mappa
// flotta. Le 4 righe Archivio usano direttamente `ArchivioVeicoloPhoto`.
type PlaceholderProps = {
  categoria: string | null | undefined;
};

export function ArchivioVeicoloPhotoPlaceholder({
  categoria,
}: PlaceholderProps): ReactElement {
  return (
    <ArchivioVeicoloPhoto
      targa={null}
      categoria={categoria ?? null}
      fotoUrl={null}
    />
  );
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
