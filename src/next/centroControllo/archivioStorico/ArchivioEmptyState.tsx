// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioEmptyState.
// Stato vuoto del feed (post-filtri restrittivi). Replica mockup
// righe 1875-1889. Bottone "Azzera filtri" delega al padre via
// callback `onReset`.

import type { ReactElement } from "react";

import "./styles/archivioStorico.css";

type Props = {
  onReset: () => void;
};

export function ArchivioEmptyState({ onReset }: Props): ReactElement {
  return (
    <div className="archivio-empty">
      <svg
        className="archivio-empty-glyph"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="10" y="14" width="44" height="10" rx="1" />
        <path d="M14 24v26a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V24" />
        <path d="M26 34h12" />
        <circle cx="48" cy="48" r="7" strokeDasharray="2 3" />
        <path d="m53.5 53.5 4 4" />
      </svg>
      <h3>Nessun record per i filtri attivi</h3>
      <p>
        Prova ad allargare l&apos;intervallo di date, a rimuovere uno dei
        filtri, oppure azzerali tutti per vedere l&apos;archivio completo.
      </p>
      <button type="button" className="archivio-empty-action" onClick={onReset}>
        Azzera <strong>tutti i filtri</strong>
      </button>
    </div>
  );
}
