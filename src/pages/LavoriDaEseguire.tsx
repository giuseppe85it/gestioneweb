import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setItemSync, getItemSync } from "../utils/storageSync";
import { Lavoro, TipoLavoro, Urgenza } from "../types/lavori";
import { v4 as uuidv4 } from "uuid";
import "./LavoriDaEseguire.css";

interface MezzoBasic {
  id: string;
  targa?: string;
  marca?: string;
  modello?: string;
  descrizione?: string;
}

const KEY_MEZZI = "@mezzi_aziendali";

const LavoriDaEseguire: React.FC = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoLavoro>("magazzino");
  const [targa, setTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [urgenza, setUrgenza] = useState<Urgenza>("bassa");
  const [listaTemporanei, setListaTemporanei] = useState<Lavoro[]>([]);
  const [gruppoIdCorrente, setGruppoIdCorrente] = useState<string | null>(null);

  // MEZZI (lettura come MaterialiConsegnati)
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

        console.log("MEZZI CARICATI:", lista);
        setMezzi(lista);
      } catch (err) {
        console.error("Errore caricamento mezzi:", err);
      }
    };

    loadMezzi();
  }, []);

  const aggiungiLavoro = () => {
    if (!descrizione.trim()) {
      alert("Inserisci una descrizione");
      return;
    }

    if (tipo === "targa" && !targa.trim()) {
      alert("Inserisci la targa");
      return;
    }

    const gruppoId = gruppoIdCorrente ?? uuidv4();
    if (!gruppoIdCorrente) setGruppoIdCorrente(gruppoId);

    const nuovo: Lavoro = {
      id: uuidv4(),
      gruppoId,
      tipo,
      targa: tipo === "targa" ? targa.toUpperCase() : "",
      descrizione: descrizione.trim(),
      dataInserimento,
      eseguito: false,
      urgenza,
      segnalatoDa: "utente",
      sottoElementi: [],
    };

    setListaTemporanei((prev) => [...prev, nuovo]);
    setDescrizione("");
    setTarga("");
    setFiltroTarga("");
    setUrgenza("bassa");
  };

  const salvaGruppo = async () => {
    if (listaTemporanei.length === 0) {
      alert("Non ci sono lavori da salvare");
      return;
    }

    const esistenti: Lavoro[] = (await getItemSync("@lavori")) || [];
    const nuovi = [...esistenti, ...listaTemporanei];

    await setItemSync("@lavori", nuovi);

    setListaTemporanei([]);
    setGruppoIdCorrente(null);
    alert("Gruppo lavori salvato");
  };

  const labelUrgenza = (u: Urgenza) => u.toUpperCase();

  return (
    <div className="lde-page">
      <div className="lde-phone">
        <div className="lavori-header">
          <img
            src="/logo.png"
            alt="logo"
            className="lavori-header-logo"
            onClick={() => navigate("/")}
          />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <h1 className="lavori-header-title">Lavori da eseguire</h1>
          </div>
        </div>

        {/* TABS */}
        <div className="lde-tabs">
          <Link to="/lavori-in-attesa" className="lde-tab lavori-btn is-primary">
            LAVORI IN ATTESA
          </Link>
          <Link to="/lavori-eseguiti" className="lde-tab lavori-btn is-ghost">
            LAVORI ESEGUITI
          </Link>
        </div>

        {/* AGGIUNGI LAVORO */}
        <section className="lde-section">
          <h2 className="lde-section-title">AGGIUNGI LAVORO</h2>

          {/* switch MAGAZZINO / TARGA */}
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

          {/* DATA */}
          <div className="lde-form-grid">
            <input
              type="date"
              className="lde-input lde-input-date"
              value={dataInserimento}
              onChange={(e) => setDataInserimento(e.target.value)}
            />
          </div>

          {/* AUTOSUGGEST TARGA */}
          {tipo === "targa" && (
            <div className="autosuggest-wrap">
              <input
                type="text"
                className="lde-input"
                placeholder="Targa"
                value={targa}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTarga(val);
                  setFiltroTarga(val);
                }}
              />

              {filtroTarga.length > 0 && (
                <div className="autosuggest-box">
                  {mezzi
                    .filter((m) =>
                      (m.targa || "")
                        .toUpperCase()
                        .includes(filtroTarga.toUpperCase())
                    )
                    .slice(0, 5)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="autosuggest-item"
                        onClick={() => {
                          setTarga(m.targa || "");
                          setFiltroTarga("");
                        }}
                      >
                        {m.targa} – {m.marca} {m.modello}
                      </div>
                    ))}

                  {mezzi.filter((m) =>
                    (m.targa || "")
                      .toUpperCase()
                      .includes(filtroTarga.toUpperCase())
                  ).length === 0 && (
                    <div className="autosuggest-item autosuggest-empty">
                      Nessuna targa trovata
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DESCRIZIONE */}
          <input
            type="text"
            className="lde-input lde-input-wide"
            placeholder="Descrizione lavoro"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />

          {/* URGENZA */}
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

          <button className="lde-main-btn lavori-btn is-primary" onClick={aggiungiLavoro}>
            AGGIUNGI
          </button>
        </section>

        {/* LISTA LAVORI TEMPORANEI */}
        <section className="lde-section lde-section-bottom">
          <h2 className="lde-section-title">LISTA LAVORI TEMPORANEI</h2>

          <div className="lde-list">
            {listaTemporanei.map((lavoro) => (
              <div key={lavoro.id} className="lde-list-item">
                <div className="lde-list-left">
                  <div className="lde-list-line">
                    <span className="lde-list-title">
                      {lavoro.descrizione}
                    </span>
                  </div>
                  <div className="lde-list-subline">
                    <span className="lde-list-icon">
                      <img
                        src="/cisterna.png"
                        alt=""
                        className="lde-list-icon-img"
                      />
                    </span>
                    <span className="lde-list-subtext">
                      {lavoro.targa || "MAGAZZINO"}
                    </span>
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
                  {labelUrgenza(lavoro.urgenza)}
                </div>
              </div>
            ))}

            {listaTemporanei.length === 0 && (
              <div className="lde-empty">Nessun lavoro temporaneo</div>
            )}
          </div>

          <button className="lde-main-btn lde-save-btn lavori-btn is-primary" onClick={salvaGruppo}>
            SALVA GRUPPO LAVORI
          </button>
        </section>
      </div>
    </div>
  );
};

export default LavoriDaEseguire;
