// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowShared.
// Utilities di rendering condivise tra le 4 righe compatte: format
// data/orario, placeholder SVG mezzo, helper targa/autista. Niente
// state, niente fetch, niente integrazioni esterne.

import type { ReactElement } from "react";

import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";

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
