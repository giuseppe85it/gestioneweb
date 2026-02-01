// src/pages/LavoriEseguiti.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import { generateTablePDF } from "../utils/pdfEngine"; // <-- PDF ENGINE
import type { Lavoro, Urgenza } from "../types/lavori";
import { formatDateUI } from "../utils/dateFormat";
import { isLavoroEseguito } from "../utils/lavoriSelectors";
import "./LavoriEseguiti.css";

type MezzoLite = {
  targa?: string;
  mezzoTarga?: string;
  categoria?: string;
  modello?: string;
  descrizione?: string;
  fotoURL?: string;
  fotoUrl?: string;
  photoURL?: string;
  immagineUrl?: string;
  imageUrl?: string;
  foto?: string;
};

const normalizeTarga = (value?: string) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const getMezzoPhoto = (mezzo?: MezzoLite) =>
  mezzo?.fotoURL ||
  mezzo?.fotoUrl ||
  mezzo?.photoURL ||
  mezzo?.immagineUrl ||
  mezzo?.imageUrl ||
  mezzo?.foto ||
  "";

const getMezzoMeta = (mezzo?: MezzoLite) => {
  const parts = [mezzo?.categoria, mezzo?.modello, mezzo?.descrizione].filter(
    Boolean
  ) as string[];
  return parts.join(" - ");
};

const formatDate = (iso?: string) => {
  return formatDateUI(iso ?? null);
};

const formatDateGGMMYYYY = (iso?: string) => {
  return formatDateUI(iso ?? null);
};

const LavoriEseguiti: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allLavori, setAllLavori] = useState<Lavoro[]>([]);
  const [mezziByTarga, setMezziByTarga] = useState<Record<string, MezzoLite>>(
    {}
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openMagazzino, setOpenMagazzino] = useState(false);
  const targaFilterParam = (searchParams.get("targa") || "").trim();
  const [searchTarga, setSearchTarga] = useState(targaFilterParam);

  useEffect(() => {
    if (targaFilterParam) {
      setSearchTarga(targaFilterParam);
    }
  }, [targaFilterParam]);

  const loadLavori = async () => {
    const json = await getItemSync("@lavori");
    const data: Lavoro[] = json ? json : [];

    const eseguiti = data.filter((l) => isLavoroEseguito(l));
    setAllLavori(eseguiti);
  };

  const loadMezzi = async () => {
    const json = await getItemSync("@mezzi_aziendali");
    const data: MezzoLite[] = json ? json : [];
    const map: Record<string, MezzoLite> = {};
    data.forEach((m) => {
      const targaValue = m.targa ?? m.mezzoTarga;
      const norm = normalizeTarga(String(targaValue || ""));
      if (norm) {
        map[norm] = m;
      }
    });
    setMezziByTarga(map);
  };

  useEffect(() => {
    loadLavori();
    loadMezzi();
  }, []);

  const searchNorm = normalizeTarga(searchTarga);

  const { targaGroups, magazzinoItems } = useMemo(() => {
    const groups = new Map<string, { label: string; items: Lavoro[] }>();
    const magazzino: Lavoro[] = [];

    allLavori.forEach((l) => {
      const targaRaw =
        l.targa ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (l as any)?.mezzoTarga ??
        "";
      const targaLabel = String(targaRaw || "").trim();
      const targaNorm = normalizeTarga(targaLabel);

      if (l.tipo === "magazzino" || !targaNorm) {
        magazzino.push(l);
        return;
      }

      const entry = groups.get(targaNorm) || { label: targaLabel, items: [] };
      entry.items.push(l);
      if (!groups.has(targaNorm)) groups.set(targaNorm, entry);
    });

    const sortedGroups = Array.from(groups.values()).map((g) => ({
      label: g.label,
      items: g.items,
    }));

    sortedGroups.sort((a, b) => a.label.localeCompare(b.label));

    return { targaGroups: sortedGroups, magazzinoItems: magazzino };
  }, [allLavori]);

  const visibleGroups = searchNorm
    ? targaGroups.filter((g) =>
        normalizeTarga(g.label).includes(searchNorm)
      )
    : targaGroups;

  useEffect(() => {
    if (!searchNorm) return;
    const match = targaGroups.find((g) =>
      normalizeTarga(g.label).includes(searchNorm)
    );
    if (match) {
      setOpenGroups({ [normalizeTarga(match.label)]: true });
    } else {
      setOpenGroups({});
    }
    setOpenMagazzino(false);
  }, [searchNorm, targaGroups]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMagazzino = () => {
    setOpenMagazzino((prev) => !prev);
  };

  const urgencyKey = (urgenza?: Urgenza) => {
    if (urgenza === "alta" || urgenza === "media" || urgenza === "bassa") {
      return urgenza;
    }
    return "media";
  };

  const sortByEsecuzioneDesc = (a: Lavoro, b: Lavoro) =>
    new Date(b.dataEsecuzione || "").getTime() -
    new Date(a.dataEsecuzione || "").getTime();

  const splitByUrgency = (items: Lavoro[]) => {
    const out = {
      alta: [] as Lavoro[],
      media: [] as Lavoro[],
      bassa: [] as Lavoro[],
    };
    items.forEach((l) => {
      const key = urgencyKey(l.urgenza);
      out[key].push(l);
    });
    out.alta.sort(sortByEsecuzioneDesc);
    out.media.sort(sortByEsecuzioneDesc);
    out.bassa.sort(sortByEsecuzioneDesc);
    return out;
  };

  const renderSection = (title: string, items: Lavoro[]) => {
    if (items.length === 0) return null;
    return (
      <div className="lavori-urgency-section">
        <div className="lavori-urgency-title">
          {title} ({items.length})
        </div>
        <div className="lavori-rows">
          {items.map((lavoro, index) => (
            <div
              key={`${title}-${lavoro.id}-${index}`}
              className={`lavori-row lavori-row--${urgencyKey(lavoro.urgenza)}`}
              onClick={() =>
                navigate(`/dettagliolavori?lavoroId=${lavoro.id}`)
              }
            >
              <div className="lavori-row-main">
                <div className="lavori-row-desc">{lavoro.descrizione}</div>
                <div className="lavori-row-meta">
                  Inserito: {formatDate(lavoro.dataInserimento)}
                  {lavoro.dataEsecuzione
                    ? ` - Eseguito: ${formatDate(lavoro.dataEsecuzione)}`
                    : ""}
                  {lavoro.chiHaEseguito
                    ? ` - Esecutore: ${lavoro.chiHaEseguito}`
                    : ""}
                </div>
              </div>
              {lavoro.urgenza ? (
                <span className={getUrgencyClass(lavoro.urgenza)}>
                  {String(lavoro.urgenza).toUpperCase()}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // INTEGRAZIONE PDF ENGINE UFFICIALE
  const handleExportPDF = async (lavori: Lavoro[], titolo: string) => {
    if (lavori.length === 0) return;

    const rows = lavori.map((l) => ({
      Descrizione: l.descrizione,
      Targa: l.targa || "-",
      Esecutore: l.chiHaEseguito || "-",
      Inserimento: formatDateGGMMYYYY(l.dataInserimento),
      Esecuzione: formatDateGGMMYYYY(l.dataEsecuzione),
    }));


    // colonne opzionali
    const columns = ["Descrizione", "Targa", "Esecutore", "Inserimento", "Esecuzione"];

    await generateTablePDF(titolo, rows, columns);
  };

  const getUrgencyClass = (urgenza?: Urgenza) => {
    if (urgenza === "alta") return "lavori-badge lavori-badge-alta";
    if (urgenza === "media") return "lavori-badge lavori-badge-media";
    if (urgenza === "bassa") return "lavori-badge lavori-badge-bassa";
    return "lavori-badge lavori-badge-media";
  };

  return (
    <div className="le-page">
      <div className="le-container">
        <div className="lavori-header lavori-header--centered">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text lavori-header-text--centered">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Lavori eseguiti</div>
          </div>
        </div>
        <div className="lavori-search">
          <input
            className="lavori-search-input"
            type="text"
            placeholder="Cerca per targa"
            value={searchTarga}
            onChange={(e) => setSearchTarga(e.target.value)}
          />
        </div>

        <div className="lavori-accordion">
          {visibleGroups.map((group) => {
            const groupKey = normalizeTarga(group.label);
            const isOpen = !!openGroups[groupKey];
            const mezzo = mezziByTarga[groupKey];
            const photo = getMezzoPhoto(mezzo);
            const meta = getMezzoMeta(mezzo);
            const sections = splitByUrgency(group.items);

            return (
              <div
                key={group.label}
                className={`mezzo-card ${isOpen ? "is-open" : ""}`}
              >
                <div
                  className="mezzo-card-header"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleGroup(groupKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleGroup(groupKey);
                    }
                  }}
                >
                  <div className="mezzo-photo">
                    {photo ? (
                      <img
                        src={photo}
                        alt={`foto ${group.label}`}
                        className="mezzo-photo-img"
                      />
                    ) : (
                      <div className="mezzo-photo-placeholder">MEZZO</div>
                    )}
                  </div>
                  <div className="mezzo-info">
                    <div className="mezzo-targa">{group.label}</div>
                    {meta ? <div className="mezzo-meta">{meta}</div> : null}
                  </div>
                  <div className="mezzo-actions">
                    <button
                      className="lavori-btn is-ghost lavori-mini-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(group.items, group.label);
                      }}
                    >
                      PDF
                    </button>
                    <span
                      className={`mezzo-chevron ${isOpen ? "is-open" : ""}`}
                    >
                      &gt;
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <div className="mezzo-body">
                    {renderSection("ALTA", sections.alta)}
                    {renderSection("MEDIA", sections.media)}
                    {renderSection("BASSA", sections.bassa)}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!searchNorm && magazzinoItems.length > 0 ? (
            <div className={`mezzo-card ${openMagazzino ? "is-open" : ""}`}>
              <div
                className="mezzo-card-header"
                role="button"
                tabIndex={0}
                onClick={toggleMagazzino}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    toggleMagazzino();
                  }
                }}
              >
                <div className="mezzo-photo">
                  <div className="mezzo-photo-placeholder">MAG</div>
                </div>
                <div className="mezzo-info">
                  <div className="mezzo-targa">MAGAZZINO</div>
                </div>
                <div className="mezzo-actions">
                  <button
                    className="lavori-btn is-ghost lavori-mini-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF(magazzinoItems, "MAGAZZINO");
                    }}
                  >
                    PDF
                  </button>
                  <span
                    className={`mezzo-chevron ${openMagazzino ? "is-open" : ""}`}
                  >
                    &gt;
                  </span>
                </div>
              </div>
              {openMagazzino ? (
                <div className="mezzo-body">
                  {(() => {
                    const sections = splitByUrgency(magazzinoItems);
                    return (
                      <>
                        {renderSection("ALTA", sections.alta)}
                        {renderSection("MEDIA", sections.media)}
                        {renderSection("BASSA", sections.bassa)}
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          ) : null}

          {visibleGroups.length === 0 &&
          (!searchNorm || magazzinoItems.length === 0) ? (
            <div className="lavori-empty">Nessun lavoro eseguito.</div>
          ) : null}
        </div>

        <button className="le-back-btn lavori-btn is-primary" onClick={() => navigate(-1)}>
          TORNA INDIETRO
        </button>
      </div>
    </div>
  );
};

export default LavoriEseguiti;

