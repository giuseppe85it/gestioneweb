import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateInput } from "../utils/dateFormat";
import type { Urgenza } from "../types/lavori";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import "../pages/LavoriDaEseguire.css";

type MezzoBasic = {
  id: string;
  targa: string;
  marcaModello: string | null;
};

const normalizeTarga = (value: string) =>
  value.toUpperCase().replace(/\s+/g, "").trim();

const todayInputValue = () => formatDateInput(new Date());

const labelUrgenza = (urgenza: Urgenza) => urgenza.toUpperCase();

export default function NextLavoriDaEseguirePage() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<"magazzino" | "targa">("magazzino");
  const [targa, setTarga] = useState("");
  const [filtroTarga, setFiltroTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(todayInputValue());
  const [urgenza, setUrgenza] = useState<Urgenza>("bassa");
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [readonlyNotice, setReadonlyNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMezzi = async () => {
      try {
        const snapshot = await readNextAnagraficheFlottaSnapshot({
          includeClonePatches: false,
        });
        if (!mounted) {
          return;
        }

        setMezzi(
          snapshot.items.map((item) => ({
            id: item.id,
            targa: item.targa,
            marcaModello: item.marcaModello ?? null,
          })),
        );
      } catch {
        if (mounted) {
          setMezzi([]);
        }
      }
    };

    void loadMezzi();
    return () => {
      mounted = false;
    };
  }, []);

  const mezziSuggestions = useMemo(() => {
    const query = normalizeTarga(filtroTarga || targa);
    if (!query) {
      return mezzi.slice(0, 5);
    }

    return mezzi
      .filter((entry) => normalizeTarga(entry.targa).includes(query))
      .slice(0, 5);
  }, [filtroTarga, mezzi, targa]);

  const handleAdd = () => {
    if (!descrizione.trim()) {
      window.alert("Inserisci una descrizione");
      return;
    }

    if (tipo === "targa" && !targa.trim()) {
      window.alert("Inserisci la targa");
      return;
    }

    setReadonlyNotice(
      "Aggiunta lavoro bloccata: la NEXT e in sola lettura e non scrive su @lavori.",
    );
  };

  const handleSaveGroup = () => {
    window.alert("Non ci sono lavori da salvare");
  };

  return (
    <div className="lde-page">
      <div className="lde-phone">
        <div className="lavori-header">
          <img
            src="/logo.png"
            alt="logo"
            className="lavori-header-logo"
            onClick={() => navigate("/next")}
          />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <h1 className="lavori-header-title">Lavori da eseguire</h1>
          </div>
        </div>

        <div className="lde-tabs">
          <Link
            to="/next/lavori-in-attesa"
            className="lde-tab lavori-btn is-primary"
          >
            LAVORI IN ATTESA
          </Link>
          <Link
            to="/next/lavori-eseguiti"
            className="lde-tab lavori-btn is-ghost"
          >
            LAVORI ESEGUITI
          </Link>
        </div>

        <section className="lde-section">
          <h2 className="lde-section-title">AGGIUNGI LAVORO</h2>

          <div className="lde-switch">
            <button
              type="button"
              className={
                "lde-switch-btn lde-toggle-btn lavori-btn is-ghost" +
                (tipo === "magazzino" ? " is-selected" : "")
              }
              onClick={() => setTipo("magazzino")}
            >
              MAGAZZINO
            </button>
            <button
              type="button"
              className={
                "lde-switch-btn lde-toggle-btn lavori-btn is-ghost" +
                (tipo === "targa" ? " is-selected" : "")
              }
              onClick={() => setTipo("targa")}
            >
              TARGA
            </button>
          </div>

          <div className="lde-form-grid">
            <input
              type="date"
              className="lde-input lde-input-date"
              value={dataInserimento}
              onChange={(event) => setDataInserimento(event.target.value)}
            />
          </div>

          {tipo === "targa" ? (
            <div className="autosuggest-wrap">
              <input
                type="text"
                className="lde-input"
                placeholder="Targa"
                value={targa}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase();
                  setTarga(value);
                  setFiltroTarga(value);
                }}
              />

              {filtroTarga.length > 0 ? (
                <div className="autosuggest-box">
                  {mezziSuggestions.map((mezzo) => (
                    <div
                      key={mezzo.id}
                      className="autosuggest-item"
                      onClick={() => {
                        setTarga(mezzo.targa);
                        setFiltroTarga("");
                      }}
                    >
                      {mezzo.targa} - {mezzo.marcaModello || ""}
                    </div>
                  ))}

                  {mezziSuggestions.length === 0 ? (
                    <div className="autosuggest-item autosuggest-empty">
                      Nessuna targa trovata
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <input
            type="text"
            className="lde-input lde-input-wide"
            placeholder="Descrizione lavoro"
            value={descrizione}
            onChange={(event) => setDescrizione(event.target.value)}
          />

          <div className="lde-priority-row">
            <button
              type="button"
              className={
                "lde-priority lde-prio-btn prio-bassa lavori-btn is-secondary" +
                (urgenza === "bassa" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("bassa")}
            >
              {labelUrgenza("bassa")}
            </button>
            <button
              type="button"
              className={
                "lde-priority lde-prio-btn prio-media lavori-btn is-secondary" +
                (urgenza === "media" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("media")}
            >
              {labelUrgenza("media")}
            </button>
            <button
              type="button"
              className={
                "lde-priority lde-prio-btn prio-alta lavori-btn is-secondary" +
                (urgenza === "alta" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("alta")}
            >
              {labelUrgenza("alta")}
            </button>
          </div>

          <button
            type="button"
            className="lde-main-btn lavori-btn is-primary"
            onClick={handleAdd}
          >
            AGGIUNGI
          </button>
        </section>

        <section className="lde-section lde-section-bottom">
          <h2 className="lde-section-title">LISTA LAVORI TEMPORANEI</h2>

          <div className="lde-list">
            <div className="lde-empty">Nessun lavoro temporaneo</div>
          </div>

          {readonlyNotice ? (
            <div className="lde-empty" style={{ marginTop: 12 }}>
              {readonlyNotice}
            </div>
          ) : null}

          <button
            type="button"
            className="lde-main-btn lde-save-btn lavori-btn is-primary"
            onClick={handleSaveGroup}
          >
            SALVA GRUPPO LAVORI
          </button>
        </section>
      </div>
    </div>
  );
}
