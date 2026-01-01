// src/pages/LavoriEseguiti.tsx
import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import { generateTablePDF } from "../utils/pdfEngine";     // <── PDF ENGINE
import "./LavoriEseguiti.css";

interface SottoElemento {
  id: string;
  descrizione: string;
  quantita?: number;
  eseguito: boolean;
}

interface Lavoro {
  id: string;
  gruppoId: string;
  tipo: "targa" | "magazzino";
  descrizione: string;
  targa?: string;
  segnalatoDa?: string;
  dataInserimento: string;
  eseguito: boolean;
  urgenza?: "bassa" | "media" | "alta";
  chiHaEseguito?: string;
  dataEsecuzione?: string;
  sottoElementi: SottoElemento[];
}

interface LavoroGroup {
  title: string;
  data: Lavoro[];
}

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatDateGGMMYYYY = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
};

const getWeekRange = (iso?: string) => {
  if (!iso) return "Sconosciuto";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Sconosciuto";

  const day = date.getDay() === 0 ? 7 : date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;

  return `${fmt(monday)} - ${fmt(sunday)}`;
};

const LavoriEseguiti: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<LavoroGroup[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadLavori = async () => {
    const json = await getItemSync("@lavori");
    const data: Lavoro[] = json ? json : [];

    const eseguiti = data
      .filter((l) => l.eseguito)
      .sort(
        (a, b) =>
          new Date(a.dataEsecuzione || "").getTime() -
          new Date(b.dataEsecuzione || "").getTime()
      );

    const grouped: Record<string, Lavoro[]> = {};
    eseguiti.forEach((l) => {
      const key = getWeekRange(l.dataEsecuzione);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    });

    const arr: LavoroGroup[] = Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));

    setSections(arr);
  };

  useEffect(() => {
    loadLavori();
  }, []);

  // 🔥 INTEGRAZIONE PDF ENGINE UFFICIALE
  const handleExportPDF = async (lavori: Lavoro[], titolo: string) => {
    if (lavori.length === 0) return;

    const rows = lavori.map((l) => ({
  Descrizione: l.descrizione,
  Targa: l.targa || "-",
  Inserimento: formatDateGGMMYYYY(l.dataInserimento),
  Esecuzione: formatDateGGMMYYYY(l.dataEsecuzione),
}));


    // colonne opzionali
    const columns = ["Descrizione", "Targa", "Inserimento", "Esecuzione"];

    await generateTablePDF(titolo, rows, columns);
  };

  const getUrgencyClass = (urgenza?: string) => {
    if (urgenza === "alta") return "lavori-badge lavori-badge-alta";
    if (urgenza === "media") return "lavori-badge lavori-badge-media";
    if (urgenza === "bassa") return "lavori-badge lavori-badge-bassa";
    return "lavori-badge lavori-badge-media";
  };

  return (
    <div className="le-page">
      <div className="le-container">
        <div className="lavori-header">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Lavori eseguiti</div>
          </div>
        </div>
        <div className="le-title">LAVORI ESEGUITI</div>
        <div className="le-sections">
      {sections.map((sec) => {
        const isOpen = expanded[sec.title];

        return (
          <div key={sec.title} className="le-section">
            <div
              className="le-week-row"
              onClick={() =>
                setExpanded((p) => ({ ...p, [sec.title]: !isOpen }))
              }
            >
              <span className="le-week-text">Settimana {sec.title}</span>

              <button
                className="le-pdf-btn lavori-btn is-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportPDF(sec.data, sec.title);
                }}
              >
                📄 PDF
              </button>

              <span className="le-arrow">{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div className="le-work-list">
                {sec.data.map((lavoro) => {
                  const targetLabel =
                    lavoro.tipo === "magazzino"
                      ? "MAGAZZINO"
                      : `TARGA ${lavoro.targa || "-"}`;
                  return (
                    <div
                      key={lavoro.id}
                      className="le-work-row"
                      onClick={() =>
                        navigate(`/dettagliolavori?lavoroId=${lavoro.id}`)
                      }
                    >
                      <div className="le-work-main">
                        <div className="le-work-line1">
                          <span className="le-work-desc">{lavoro.descrizione}</span>
                          {lavoro.urgenza ? (
                            <span className={getUrgencyClass(lavoro.urgenza)}>
                              {String(lavoro.urgenza).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                        <div className="le-work-line2">
                          {targetLabel} • Inserito: {formatDate(lavoro.dataInserimento)} • Eseguito:{" "}
                          {formatDate(lavoro.dataEsecuzione)}
                        </div>
                      </div>
                      <span className="le-work-chevron">&gt;</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
        </div>

        <button className="le-back-btn lavori-btn is-primary" onClick={() => navigate(-1)}>
          TORNA INDIETRO
        </button>
      </div>
    </div>
  );
};

export default LavoriEseguiti;

