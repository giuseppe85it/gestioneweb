// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioVeicoloPhoto.
// Componente foto mezzo 64x48: se `fotoUrl` presente carica <img>
// con lazy loading e fallback su error -> placeholder SVG per
// categoria (replica logica `svgForCat` mockup r2117-2133).
// Categoria opzionale: se null usa "trattore" come default.

import { useState, type ReactElement } from "react";

import "./styles/archivioStorico.css";

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

type Props = {
  targa: string | null | undefined;
  categoria: string | null | undefined;
  fotoUrl?: string | null;
};

export function ArchivioVeicoloPhoto({
  targa,
  categoria,
  fotoUrl,
}: Props): ReactElement {
  const [errored, setErrored] = useState<boolean>(false);
  const kind: VeicoloKind = deriveVeicoloKind(categoria);
  const title: string = targa
    ? `${targa}${categoria ? ` · ${categoria}` : ""}`
    : categoria
      ? String(categoria)
      : "Mezzo";

  if (fotoUrl && !errored) {
    return (
      <div
        className="archivio-row-photo"
        title={title}
        aria-label={title}
      >
        <img
          src={fotoUrl}
          loading="lazy"
          alt=""
          onError={() => setErrored(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  }

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
