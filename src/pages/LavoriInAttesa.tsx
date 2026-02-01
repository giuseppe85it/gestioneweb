// src/pages/LavoriInAttesa.tsx

import  { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getItemSync } from "../utils/storageSync";
import { generateLavoriPDF } from "../utils/pdfEngine"; // <--- PDF ENGINE UNIVERSALE
import type { Lavoro, TipoLavoro, Urgenza } from "../types/lavori";
import { formatDateUI } from "../utils/dateFormat";
import { isLavoroInAttesaGlobal } from "../utils/lavoriSelectors";

import "./LavoriInAttesa.css";

const LavoriInAttesa: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sections, setSections] = useState<
    { title: string; lavori: Lavoro[]; tipo: TipoLavoro }[]
  >([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const targaFilterParam = (searchParams.get("targa") || "").trim();
  const targaFilterNorm = targaFilterParam
    ? targaFilterParam.toUpperCase().replace(/\s+/g, "").trim()
    : "";

  // Ordina per priorità: ALTA → MEDIA → BASSA → nessuna
  const sortByUrgency = (items: Lavoro[]) => {
    const priorityValue = (u?: Urgenza) =>
      u === "alta" ? 1 : u === "media" ? 2 : u === "bassa" ? 3 : 4;

    return items.sort(
      (a, b) => priorityValue(a.urgenza) - priorityValue(b.urgenza)
    );
  };

  const loadLavori = async () => {
    try {
      const json = await getItemSync("@lavori");
      const data: Lavoro[] = json ? json : [];
      const risultati = data
        .filter((l) => isLavoroInAttesaGlobal(l))
        .filter((l) => {
          if (!targaFilterNorm) return true;
          const targaRaw =
            l.targa ??
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (l as any)?.mezzoTarga ??
            "";
          const targaNorm = String(targaRaw).toUpperCase().replace(/\s+/g, "").trim();
          return targaNorm === targaFilterNorm;
        });

      const grouped: Record<
        string,
        { tipo: "magazzino" | "targa"; lavori: Lavoro[] }
      > = {};

      risultati.forEach((l) => {
        const titolo =
          l.tipo === "magazzino"
            ? "MAGAZZINO"
            : l.targa?.trim() || "SENZA TARGA";

        if (!grouped[titolo]) {
          grouped[titolo] = {
            tipo: l.tipo,
            lavori: [],
          };
        }

        grouped[titolo].lavori.push(l);
      });

      const sectionsArr = Object.keys(grouped).map((t) => ({
        title: t,
        tipo: grouped[t].tipo,
        lavori: sortByUrgency(grouped[t].lavori),
      }));

      setSections(sectionsArr);

      const expand: Record<string, boolean> = {};
      sectionsArr.forEach((s) => (expand[s.title] = true));
      setExpandedGroups(expand);

      // di default mostra tutti i gruppi
      setSelectedGroup("ALL");
    } catch (err) {
      console.error("Errore:", err);
    }
  };

  useEffect(() => {
    loadLavori();
  }, [targaFilterNorm]);

  const toggleExpand = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openDettaglio = (id: string) => {
    navigate(`/dettagliolavori?lavoroId=${id}`);
  };

  const getUrgencyLabel = (urgenza?: Urgenza) => {
    if (urgenza === "alta") return "ALTA";
    if (urgenza === "media") return "MEDIA";
    if (urgenza === "bassa") return "BASSA";
    return "";
  };

  const formatDateShort = (value?: string) => {
    return formatDateUI(value ?? null);
  };

  // -----------------------------------------
  // 📄 ESPORTA PDF con PDF ENGINE UNIVERSALE
  // -----------------------------------------
  const exportPdf = async (titolo: string, lavori: Lavoro[]) => {
    await generateLavoriPDF(`Lavori in Attesa – ${titolo}`, lavori, titolo);
  };

  const getUrgencyClass = (urgenza?: Urgenza) => {
    if (urgenza === "alta") return "lavori-badge lavori-badge-alta";
    if (urgenza === "media") return "lavori-badge lavori-badge-media";
    if (urgenza === "bassa") return "lavori-badge lavori-badge-bassa";
    return "lavori-badge lavori-badge-media";
  };

  // Selezione gruppi da mostrare (ALL oppure singolo gruppo)
  const visibleSections =
    selectedGroup === "ALL"
      ? sections
      : sections.filter((s) => s.title === selectedGroup);

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);

    if (value === "ALL") {
      // riapre tutti i gruppi
      setExpandedGroups((prev) => {
        const updated: Record<string, boolean> = { ...prev };
        sections.forEach((s) => {
          updated[s.title] = true;
        });
        return updated;
      });
    } else {
      // assicura che il gruppo selezionato sia aperto
      setExpandedGroups((prev) => ({
        ...prev,
        [value]: true,
      }));
    }
  };

  return (
    <div className="lia-page">
      <div className="lia-card">
        <div className="lavori-header">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Lavori in attesa</div>
          </div>
        </div>

        {targaFilterNorm ? (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "#f7f7f7",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13 }}>
              Filtro: <strong>{targaFilterParam}</strong>
            </div>
            <button
              className="lavori-btn is-ghost"
              type="button"
              onClick={() => setSearchParams({})}
            >
              Rimuovi filtro
            </button>
          </div>
        ) : null}

        {/* FILTRO A TENDINA (MAGAZZINO / TARGA / TUTTI) */}
        <div className="lia-filter-bar">
          <div className="lia-filter-label">SELEZIONA GRUPPO</div>
          <div className="lia-select-wrapper">
            <select
              className="lia-select"
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
            >
              <option value="ALL">TUTTI I GRUPPI</option>
              {sections.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
            <span className="lia-select-arrow">▾</span>
          </div>
        </div>

        {/* CONTENUTO SCORREVOLE */}
        <div className="lia-content">
          {visibleSections.map((section) => {
            const isExpanded = !!expandedGroups[section.title];

            return (
              <div
                key={section.title}
                className={`lia-section ${
                  isExpanded ? "lia-section--open" : "lia-section--closed"
                }`}
              >
                {/* HEADER GRUPPO + PDF + CHEVRON */}
                <div
                  className="lia-section-header"
                  onClick={() => toggleExpand(section.title)}
                >
                  <span className="lia-section-title">{section.title}</span>

                  <div className="lia-section-actions">
                    <button
                      className="lia-pdf-inline lavori-btn is-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportPdf(section.title, section.lavori);
                      }}
                    >
                      📄
                    </button>
                    <span
                      className={`lia-section-chevron ${
                        isExpanded ? "lia-section-chevron--open" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </div>
                </div>

                {/* CORPO GRUPPO CON ANIMAZIONE COLLASSO */}
                <div
                  className={`lia-section-body ${
                    isExpanded
                      ? "lia-section-body--open"
                      : "lia-section-body--closed"
                  }`}
                >
                  {section.lavori.map((l, index) => {
                    const targetLabel =
                      l.tipo === "magazzino"
                        ? "MAGAZZINO"
                        : `TARGA ${l.targa?.trim() || "SENZA TARGA"}`;
                    return (
                      <div
                        key={`${section.title}-${l.id}-${index}`}
                        className="lia-job-row"
                        onClick={() => openDettaglio(l.id)}
                      >
                      <div className="lia-job-main">
                        <div className="lia-job-line1">
                          <span className="lia-job-desc">{l.descrizione}</span>
                          <span className={getUrgencyClass(l.urgenza)}>
                            {getUrgencyLabel(l.urgenza)}
                          </span>
                        </div>
                        <div className="lia-job-line2">
                          {targetLabel} • Inserito: {formatDateShort(l.dataInserimento)}
                        </div>
                      </div>
                      <span className="lia-job-chevron">&gt;</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="lia-footer">
          <button className="lia-back-button lavori-btn is-primary" onClick={() => navigate(-1)}>
            TORNA INDIETRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default LavoriInAttesa;
