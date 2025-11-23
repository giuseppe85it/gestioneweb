import  { useState } from "react";
import { Link } from "react-router-dom";
import { setItemSync, getItemSync } from "../utils/storageSync";
import { v4 as uuidv4 } from "uuid";
import "./LavoriDaEseguire.css";

type Urgenza = "bassa" | "media" | "alta";

interface Lavoro {
  id: string;
  gruppoId: string;
  tipo: "magazzino" | "targa";
  targa: string;
  descrizione: string;
  dataInserimento: string;
  eseguito: boolean;
  urgenza: Urgenza;
  segnalatoDa: string;
  sottoElementi: any[];
}

const LavoriDaEseguire: React.FC = () => {
  const [tipo, setTipo] = useState<"magazzino" | "targa">("magazzino");
  const [targa, setTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [urgenza, setUrgenza] = useState<Urgenza>("bassa");
  const [listaTemporanei, setListaTemporanei] = useState<Lavoro[]>([]);
  const [gruppoIdCorrente, setGruppoIdCorrente] = useState<string | null>(
    null
  );

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
        {/* HEADER */}
        <div className="lde-header">
          <div className="lde-truck-wrap">
            {/* usa la tua immagine camion/cisterna */}
            <img src="/cisterna.png" alt="mezzo" className="lde-truck-img" />
          </div>
          <div className="lde-header-right">LAVORI</div>
        </div>

        <h1 className="lde-title">LAVORI DA ESEGUIRE</h1>

        {/* TABS */}
        <div className="lde-tabs">
          <Link to="/lavori-in-attesa" className="lde-tab lde-tab-active">
            LAVORI IN ATTESA
          </Link>
          <Link to="/lavori-eseguiti" className="lde-tab">
            LAVORI ESEGUITI
          </Link>
        </div>

        {/* BOX AGGIUNGI LAVORO */}
        <section className="lde-section">
          <h2 className="lde-section-title">AGGIUNGI LAVORO</h2>

          {/* switch MAGAZZINO / TARGA */}
          <div className="lde-switch">
            <button
              className={
                "lde-switch-btn" +
                (tipo === "magazzino" ? " lde-switch-active" : "")
              }
              onClick={() => setTipo("magazzino")}
            >
              MAGAZZINO
            </button>
            <button
              className={
                "lde-switch-btn" +
                (tipo === "targa" ? " lde-switch-active" : "")
              }
              onClick={() => setTipo("targa")}
            >
              TARGA
            </button>
          </div>

          {/* data */}
          <input
            type="date"
            className="lde-input lde-input-date"
            value={dataInserimento}
            onChange={(e) => setDataInserimento(e.target.value)}
          />

          {/* targa solo se selezionata */}
          {tipo === "targa" && (
            <input
              type="text"
              className="lde-input"
              placeholder="Targa"
              value={targa}
              onChange={(e) => setTarga(e.target.value.toUpperCase())}
            />
          )}

          {/* descrizione */}
          <input
            type="text"
            className="lde-input"
            placeholder="Descrizione lavoro"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />

          {/* URGENZA */}
          <div className="lde-priority-row">
            <button
              className={
                "lde-priority lde-priority-low" +
                (urgenza === "bassa" ? " active" : "")
              }
              onClick={() => setUrgenza("bassa")}
            >
              BASSA
            </button>
            <button
              className={
                "lde-priority lde-priority-medium" +
                (urgenza === "media" ? " active" : "")
              }
              onClick={() => setUrgenza("media")}
            >
              MEDIA
            </button>
            <button
              className={
                "lde-priority lde-priority-high" +
                (urgenza === "alta" ? " active" : "")
              }
              onClick={() => setUrgenza("alta")}
            >
              RIMUOVI
            </button>
          </div>

          <button className="lde-main-btn" onClick={aggiungiLavoro}>
            AGGIUNGI
          </button>
        </section>

        {/* BOX LISTA LAVORI TEMPORANEI */}
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
                    "lde-badge " +
                    (lavoro.urgenza === "bassa"
                      ? "low"
                      : lavoro.urgenza === "media"
                      ? "medium"
                      : "high")
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

          <button className="lde-main-btn lde-save-btn" onClick={salvaGruppo}>
            SALVA GRUPPO LAVORI
          </button>
        </section>
      </div>
    </div>
  );
};

export default LavoriDaEseguire;
