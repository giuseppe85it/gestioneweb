import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import type { Lavoro, TipoLavoro, Urgenza } from "../types/lavori";
import { v4 as uuidv4 } from "uuid";
import {
  NEXT_HOME_PATH,
  NEXT_LAVORI_ESEGUITI_PATH,
  NEXT_LAVORI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";
import "../pages/LavoriDaEseguire.css";

interface MezzoBasic {
  id: string;
  targa?: string;
  marca?: string;
  modello?: string;
}

const KEY_MEZZI = "@mezzi_aziendali";

export default function NextLavoriDaEseguirePage() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoLavoro>("magazzino");
  const [targa, setTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [urgenza, setUrgenza] = useState<Urgenza>("bassa");
  const [listaTemporanei, setListaTemporanei] = useState<Lavoro[]>([]);
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [filtroTarga, setFiltroTarga] = useState("");

  useEffect(() => {
    const loadMezzi = async () => {
      try {
        const raw = await getItemSync(KEY_MEZZI);
        const lista = Array.isArray(raw)
          ? raw
          : raw?.value && Array.isArray(raw.value)
            ? raw.value
            : [];
        setMezzi(lista);
      } catch (error) {
        console.error("Errore caricamento mezzi clone lavori da eseguire:", error);
        setMezzi([]);
      }
    };

    void loadMezzi();
  }, []);

  const aggiungiLavoroLocale = () => {
    if (!descrizione.trim()) {
      return;
    }
    if (tipo === "targa" && !targa.trim()) {
      return;
    }

    const nuovo: Lavoro = {
      id: uuidv4(),
      gruppoId: uuidv4(),
      tipo,
      targa: tipo === "targa" ? targa.toUpperCase() : "",
      descrizione: descrizione.trim(),
      dataInserimento,
      eseguito: false,
      urgenza,
      segnalatoDa: "clone-read-only",
      sottoElementi: [],
    };

    setListaTemporanei((prev) => [...prev, nuovo]);
    setDescrizione("");
    setTarga("");
    setFiltroTarga("");
    setUrgenza("bassa");
  };

  const labelUrgenza = (value: Urgenza) => value.toUpperCase();

  return (
    <div className="lde-page">
      <div className="lde-phone">
        <div className="lavori-header">
          <img
            src="/logo.png"
            alt="logo"
            className="lavori-header-logo"
            onClick={() => navigate(NEXT_HOME_PATH)}
          />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <h1 className="lavori-header-title">Lavori da eseguire</h1>
          </div>
        </div>

        <section className="next-clone-placeholder" style={{ marginBottom: 18, padding: 18 }}>
          <p>
            La pagina esiste ora come route clone autonoma, come nella madre. L&apos;utente puo
            ancora comporre localmente un gruppo temporaneo, ma il salvataggio su `@lavori` resta
            esplicitamente bloccato.
          </p>
        </section>

        <div className="lde-tabs">
          <Link to={NEXT_LAVORI_IN_ATTESA_PATH} className="lde-tab lavori-btn is-primary">
            LAVORI IN ATTESA
          </Link>
          <Link to={NEXT_LAVORI_ESEGUITI_PATH} className="lde-tab lavori-btn is-ghost">
            LAVORI ESEGUITI
          </Link>
        </div>

        <section className="lde-section">
          <h2 className="lde-section-title">AGGIUNGI LAVORO</h2>

          <div className="lde-switch">
            <button
              className={
                "lde-switch-btn lde-toggle-btn lavori-btn is-ghost" +
                (tipo === "magazzino" ? " is-selected" : "")
              }
              onClick={() => setTipo("magazzino")}
            >
              MAGAZZINO
            </button>
            <button
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
                  {mezzi
                    .filter((mezzo) =>
                      (mezzo.targa || "").toUpperCase().includes(filtroTarga.toUpperCase()),
                    )
                    .slice(0, 5)
                    .map((mezzo) => (
                      <div
                        key={mezzo.id}
                        className="autosuggest-item"
                        onClick={() => {
                          setTarga(mezzo.targa || "");
                          setFiltroTarga("");
                        }}
                      >
                        {mezzo.targa} - {mezzo.marca} {mezzo.modello}
                      </div>
                    ))}
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
              className={
                "lde-priority lde-prio-btn prio-bassa lavori-btn is-secondary" +
                (urgenza === "bassa" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("bassa")}
            >
              BASSA
            </button>
            <button
              className={
                "lde-priority lde-prio-btn prio-media lavori-btn is-secondary" +
                (urgenza === "media" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("media")}
            >
              MEDIA
            </button>
            <button
              className={
                "lde-priority lde-prio-btn prio-alta lavori-btn is-secondary" +
                (urgenza === "alta" ? " is-selected" : "")
              }
              onClick={() => setUrgenza("alta")}
            >
              ALTA
            </button>
          </div>

          <button className="lde-main-btn lavori-btn is-primary" onClick={aggiungiLavoroLocale}>
            AGGIUNGI
          </button>
        </section>

        <section className="lde-section lde-section-bottom">
          <h2 className="lde-section-title">LISTA LAVORI TEMPORANEI</h2>

          <div className="lde-list">
            {listaTemporanei.map((lavoro) => (
              <div key={lavoro.id} className="lde-list-item">
                <div className="lde-list-left">
                  <div className="lde-list-line">
                    <span className="lde-list-title">{lavoro.descrizione}</span>
                  </div>
                  <div className="lde-list-subline">
                    <span className="lde-list-icon">
                      <img src="/cisterna.png" alt="" className="lde-list-icon-img" />
                    </span>
                    <span className="lde-list-subtext">{lavoro.targa || "MAGAZZINO"}</span>
                  </div>
                </div>

                <div
                  className={
                    "lavori-badge " +
                    (lavoro.urgenza === "bassa"
                      ? "lavori-badge-bassa"
                      : lavoro.urgenza === "media"
                        ? "lavori-badge-media"
                        : "lavori-badge-alta")
                  }
                >
                  {labelUrgenza(lavoro.urgenza ?? "bassa")}
                </div>
              </div>
            ))}

            {listaTemporanei.length === 0 ? (
              <div className="lde-empty">Nessun lavoro temporaneo</div>
            ) : null}
          </div>

          <button
            className="lde-main-btn lde-save-btn lavori-btn is-primary"
            disabled
            title="Clone read-only: salvataggio gruppo bloccato"
          >
            SALVA GRUPPO LAVORI
          </button>
        </section>
      </div>
    </div>
  );
}

