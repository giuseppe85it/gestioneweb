import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  readNextDettaglioLavoroSnapshot,
  type NextLavoriDetailItem,
  type NextLavoriDetailSnapshot,
} from "./domain/nextLavoriDomain";
import "../pages/DettaglioLavoro.css";

export default function NextDettaglioLavoroPage() {
  const navigate = useNavigate();
  const { lavoroId } = useParams<{ lavoroId: string }>();
  const [searchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState<NextLavoriDetailSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalModifica, setModalModifica] = useState(false);
  const [nomeEsecutore, setNomeEsecutore] = useState("");
  const [descrizioneMod, setDescrizioneMod] = useState("");
  const [dataMod, setDataMod] = useState("");
  const [lavoroSelezionato, setLavoroSelezionato] =
    useState<NextLavoriDetailItem | null>(null);

  const backTo = useMemo(() => {
    return searchParams.get("from") === "lavori-eseguiti"
      ? "/next/lavori-eseguiti"
      : "/next/lavori-in-attesa";
  }, [searchParams]);

  const reload = useCallback(async () => {
    if (!lavoroId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await readNextDettaglioLavoroSnapshot(lavoroId, {
        includeCloneOverlays: false,
      });
      setSnapshot(nextSnapshot);
      setDescrizioneMod(nextSnapshot?.target.descrizione ?? "");
      setDataMod(nextSnapshot?.target.dataInserimento ?? "");
    } catch (loadError) {
      setSnapshot(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile leggere il dettaglio lavoro.",
      );
    } finally {
      setLoading(false);
    }
  }, [lavoroId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openExecuteModal = (itemId: string) => {
    const target = snapshot?.items.find((item) => item.id === itemId) ?? null;
    if (!target || target.eseguito) {
      return;
    }

    setNotice(null);
    setLavoroSelezionato(target);
    setNomeEsecutore("");
    setModalVisible(true);
  };

  const openEditModal = (itemId: string) => {
    const target = snapshot?.items.find((item) => item.id === itemId) ?? null;
    if (!target) {
      return;
    }

    setNotice(null);
    setLavoroSelezionato(target);
    setDescrizioneMod(target.descrizione);
    setDataMod(target.dataInserimento ?? "");
    setModalModifica(true);
  };

  const handleDelete = (itemId: string) => {
    const target = snapshot?.items.find((item) => item.id === itemId) ?? null;
    if (!target) {
      return;
    }

    if (!window.confirm("Vuoi eliminare questo lavoro?")) {
      return;
    }

    setNotice(
      `Eliminazione bloccata: il clone NEXT e in sola lettura e non rimuove il lavoro "${target.descrizione}".`,
    );
  };

  const handleSaveExecute = () => {
    if (!lavoroSelezionato) {
      return;
    }
    if (!nomeEsecutore.trim()) {
      window.alert("Inserisci chi ha eseguito");
      return;
    }

    setModalVisible(false);
    setNotice(
      `Segnatura eseguito bloccata: il clone NEXT e in sola lettura e non aggiorna il lavoro "${lavoroSelezionato.descrizione}".`,
    );
  };

  const handleSaveEdit = () => {
    if (!lavoroSelezionato) {
      return;
    }
    if (!descrizioneMod.trim()) {
      window.alert("Inserisci una descrizione");
      return;
    }
    if (!dataMod.trim()) {
      window.alert("Inserisci la data");
      return;
    }

    setModalModifica(false);
    setNotice(
      `Modifica bloccata: il clone NEXT e in sola lettura e non aggiorna il lavoro "${lavoroSelezionato.descrizione}".`,
    );
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

        {loading ? (
          <div className="lavori-empty">Caricamento dettaglio lavoro...</div>
        ) : null}
        {error ? <div className="lavori-empty">{error}</div> : null}
        {notice ? <div className="lavori-empty">{notice}</div> : null}

        {snapshot?.items.map((item) => (
          <div
            className={`lavoro-card ${item.eseguito ? "lavoro-card-eseguito" : ""}`}
            key={item.id}
          >
            <div className="lavoro-top-row">
              <div className="lavoro-descrizione">{item.descrizione}</div>
              {item.urgenza ? (
                <span className={`lavori-badge lavori-badge-${item.urgenza}`}>
                  {String(item.urgenza).toUpperCase()}
                </span>
              ) : null}
            </div>

            {item.targa ? (
              <div className="lavoro-dettaglio">Targa: {item.targa}</div>
            ) : null}

            <div className="lavoro-dettaglio lavoro-data">
              Inserito: {item.dataInserimento || "-"}
            </div>

            <div className="dl-buttons">
              <button
                type="button"
                className="dl-btn lavori-btn is-secondary"
                onClick={() => openEditModal(item.id)}
              >
                MODIFICA
              </button>

              <button
                type="button"
                className="dl-btn lavori-btn is-danger"
                onClick={() => handleDelete(item.id)}
              >
                ELIMINA
              </button>

              <button
                type="button"
                className={`dl-btn lavori-btn ${item.eseguito ? "is-ghost" : "is-primary"}`}
                onClick={() => openExecuteModal(item.id)}
              >
                {item.eseguito ? "ESEGUITO" : "ESEGUI"}
              </button>
            </div>
          </div>
        ))}

        {modalVisible ? (
          <div className="modal-overlay">
            <div className="modal-box">
              <p className="modal-label">Chi ha eseguito?</p>
              <input
                className="modal-input"
                value={nomeEsecutore}
                onChange={(event) => setNomeEsecutore(event.target.value)}
              />

              <div className="modal-buttons">
                <button
                  type="button"
                  className="modal-btn lavori-btn is-ghost"
                  onClick={() => setModalVisible(false)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="modal-btn lavori-btn is-primary"
                  onClick={handleSaveExecute}
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {modalModifica ? (
          <div className="modal-overlay">
            <div className="modal-box">
              <p className="modal-label">Descrizione</p>
              <input
                className="modal-input"
                value={descrizioneMod}
                onChange={(event) => setDescrizioneMod(event.target.value)}
              />

              <p className="modal-label">Data inserimento</p>
              <input
                className="modal-input"
                type="text"
                value={dataMod}
                onChange={(event) => setDataMod(event.target.value)}
              />

              <div className="modal-buttons">
                <button
                  type="button"
                  className="modal-btn lavori-btn is-ghost"
                  onClick={() => setModalModifica(false)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="modal-btn lavori-btn is-primary"
                  onClick={handleSaveEdit}
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn-indietro lavori-btn is-primary"
          onClick={() => navigate(backTo)}
        >
          TORNA INDIETRO
        </button>
      </div>
    </div>
  );
}
