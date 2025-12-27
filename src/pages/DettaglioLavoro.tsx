import  { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setItemSync, getItemSync } from "../utils/storageSync";
import "./DettaglioLavoro.css";

const DettaglioLavoro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lavoroId = searchParams.get("lavoroId") || "";

  const [lavoriGruppo, setLavoriGruppo] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModifica, setModalModifica] = useState(false);

  const [nomeEsecutore, setNomeEsecutore] = useState("");
  const [descrizioneMod, setDescrizioneMod] = useState("");
  const [dataMod, setDataMod] = useState("");

  const [lavoroSelezionato, setLavoroSelezionato] = useState<any | null>(null);

  const load = async () => {
    const json = await getItemSync("@lavori");
    const data: any[] = json || [];

    const L = data.find((x) => x.id === lavoroId);
    if (!L) return;

    const gruppo = data.filter((x) => x.gruppoId === L.gruppoId);
    gruppo.sort((a, b) => new Date(a.dataInserimento).getTime() - new Date(b.dataInserimento).getTime());

    setLavoriGruppo(gruppo);
  };

  useEffect(() => { load(); }, []);

  // ELIMINA
  const elimina = async (id: string) => {
    if (!window.confirm("Vuoi eliminare questo lavoro?")) return;

    const json = await getItemSync("@lavori");
    const data: any[] = json || [];

    const nuovo = data.filter((l) => l.id !== id);
    await setItemSync("@lavori", nuovo);

    load();
  };

  // ESEGUI
  const esegui = async (lavoro: any, esecutore: string) => {
    const json = await getItemSync("@lavori");
    const data: any[] = json || [];

    const nuovo = data.map((l) =>
      l.id === lavoro.id
        ? {
            ...l,
            eseguito: true,
            chiHaEseguito: esecutore,
            dataEsecuzione: new Date().toISOString(),
          }
        : l
    );

    await setItemSync("@lavori", nuovo);
    load();
    setModalVisible(false);
  };

  // MODIFICA
  const salvaModifica = async () => {
    const json = await getItemSync("@lavori");
    const data: any[] = json || [];

    const nuovo = data.map((l) =>
      l.id === lavoroSelezionato.id
        ? {
            ...l,
            descrizione: descrizioneMod,
            dataInserimento: dataMod,
          }
        : l
    );

    await setItemSync("@lavori", nuovo);
    setModalModifica(false);
    load();
  };

  return (
    <div className="dl-page">
      <div className="dl-container">
        <div className="lavori-header">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Dettaglio lavoro</div>
          </div>
        </div>

      {lavoriGruppo.map((l) => (
        <div
          className={`lavoro-card ${l.eseguito ? "lavoro-card-eseguito" : ""}`}
          key={l.id}
        >
          <div className="lavoro-top-row">
            <div className="lavoro-descrizione">{l.descrizione}</div>
            {l.urgenza && (
              <span className={`lavori-badge lavori-badge-${l.urgenza}`}>
                {String(l.urgenza).toUpperCase()}
              </span>
            )}
          </div>

          {l.targa && (
            <div className="lavoro-dettaglio">Targa: {l.targa}</div>
          )}

          <div className="lavoro-dettaglio lavoro-data">
            Inserito: {l.dataInserimento}
          </div>
          
          <div className="dl-buttons">
            <button
              className="dl-btn lavori-btn is-secondary"
              onClick={() => {
                setModalModifica(true);
                setLavoroSelezionato(l);
                setDescrizioneMod(l.descrizione);
                setDataMod(l.dataInserimento);
              }}
            >
              MODIFICA
            </button>

            <button
              className="dl-btn lavori-btn is-danger"
              onClick={() => elimina(l.id)}
            >
              ELIMINA
            </button>

            <button
              className={`dl-btn lavori-btn ${l.eseguito ? "is-ghost" : "is-primary"}`}
              onClick={() => {
                if (l.eseguito) return;
                setModalVisible(true);
                setLavoroSelezionato(l);
              }}
            >
              {l.eseguito ? "ESEGUITO" : "ESEGUI"}
            </button>
          </div>
        </div>
      ))}

      {/* MODALE ESEGUI */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p className="modal-label">Chi ha eseguito?</p>
            <input
              className="modal-input"
              value={nomeEsecutore}
              onChange={(e) => setNomeEsecutore(e.target.value)}
            />

            <div className="modal-buttons">
              <button className="modal-btn lavori-btn is-ghost" onClick={() => setModalVisible(false)}>
                Annulla
              </button>
              <button className="modal-btn lavori-btn is-primary" onClick={() => esegui(lavoroSelezionato, nomeEsecutore)}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE MODIFICA */}
      {modalModifica && (
        <div className="modal-overlay">
          <div className="modal-box">

            <p className="modal-label">Descrizione</p>
            <input
              className="modal-input"
              value={descrizioneMod}
              onChange={(e) => setDescrizioneMod(e.target.value)}
            />

            <p className="modal-label">Data inserimento</p>
            <input
              className="modal-input"
              type="text"
              value={dataMod}
              onChange={(e) => setDataMod(e.target.value)}
            />

            <div className="modal-buttons">
              <button className="modal-btn lavori-btn is-ghost" onClick={() => setModalModifica(false)}>
                Annulla
              </button>
              <button className="modal-btn lavori-btn is-primary" onClick={salvaModifica}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

        <button className="btn-indietro lavori-btn is-primary" onClick={() => navigate(-1)}>
          TORNA INDIETRO
        </button>
      </div>
    </div>
  );
};

export default DettaglioLavoro;
