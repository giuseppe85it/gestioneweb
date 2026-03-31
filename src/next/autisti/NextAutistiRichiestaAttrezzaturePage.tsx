/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import "../../autisti/RichiestaAttrezzature.css";
import { getAutistaLocal, getMezzoLocal } from "./nextAutistiSessionStorage";
import { NEXT_AUTISTI_BASE_PATH } from "./nextAutistiCloneRuntime";
import {
  createNextAutistiCloneAttachmentFromFile,
  type NextAutistiCloneAttachment,
} from "./nextAutistiCloneAttachments";

export default function NextAutistiRichiestaAttrezzaturePage() {
  const navigate = useNavigate();
  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [testo, setTesto] = useState("");
  const [attachments, setAttachments] = useState<NextAutistiCloneAttachment[]>([]);
  const [attachmentPreparing, setAttachmentPreparing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const autistaLocale = getAutistaLocal();
    const mezzoLocale = getMezzoLocal();

    if (!autistaLocale?.badge) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
      return;
    }

    if (!mezzoLocale?.targaCamion) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
      return;
    }

    setAutista(autistaLocale);
    setMezzo(mezzoLocale);
  }, [navigate]);

  async function handleFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setErrore(null);
      setAttachmentPreparing(true);
      const attachment = await createNextAutistiCloneAttachmentFromFile(file);
      setAttachments([attachment]);
    } catch {
      setErrore("Errore preparazione foto");
    } finally {
      setAttachmentPreparing(false);
      event.target.value = "";
    }
  }

  function handleRemoveAttachment(attachmentId: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  async function invia() {
    setErrore(null);

    if (attachmentPreparing) {
      setErrore("Attendi la preparazione della foto");
      return;
    }

    const messaggio = testo.trim();
    if (messaggio.length < 3) {
      setErrore("Scrivi cosa ti serve");
      return;
    }

    setLoading(true);

    void messaggio;
    void attachments;
    setErrore("Clone NEXT in sola lettura: la richiesta attrezzature non viene inviata.");
    setLoading(false);
  }

  if (!autista || !mezzo) {
    return null;
  }

  const attachment = attachments[0] ?? null;

  return (
    <div className="richiesta-page">
      <div className="autisti-container richiesta-container">
        <div className="richiesta-header">
          <button
            className="richiesta-back"
            type="button"
            onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/home`)}
          >
            INDIETRO
          </button>
          <h1 className="richiesta-title">Richiesta attrezzature</h1>
        </div>
        <div className="richiesta-section richiesta-meta">
          <div className="richiesta-meta-row">
            <strong>Motrice:</strong> {mezzo?.targaCamion || "-"}
          </div>
          <div className="richiesta-meta-row">
            <strong>Rimorchio:</strong> {mezzo?.targaRimorchio || "-"}
          </div>
          <div className="richiesta-meta-row">
            <strong>Autista:</strong> {autista?.nome || "-"}
          </div>
        </div>

        <div className="richiesta-section">
          <label className="richiesta-label" htmlFor="next-richiesta-testo">
            Messaggio
          </label>
          <textarea
            id="next-richiesta-testo"
            className="richiesta-textarea"
            value={testo}
            onChange={(event) => setTesto(event.target.value)}
            placeholder="Cosa ti serve?"
          />
        </div>

        <div className="richiesta-section">
          <div className="richiesta-label">Foto (opzionale)</div>
          <label className="richiesta-photo-btn">
            {attachment ? "Sostituisci foto" : "Aggiungi foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoto}
              style={{ display: "none" }}
            />
          </label>

          {attachmentPreparing ? (
            <div className="richiesta-uploading">Preparazione anteprima...</div>
          ) : null}

          {attachment ? (
            <div className="richiesta-photo-preview">
              <img src={attachment.previewUrl} alt={attachment.name} />
              <button
                className="autisti-button secondary"
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                disabled={attachmentPreparing}
              >
                Rimuovi foto
              </button>
            </div>
          ) : null}
        </div>

        {errore ? <div className="richiesta-errore">{errore}</div> : null}

        <button
          className="autisti-button richiesta-submit"
          type="button"
          onClick={() => {
            void invia();
          }}
          disabled={loading || attachmentPreparing}
        >
          {loading ? "INVIO..." : "INVIA RICHIESTA"}
        </button>
      </div>
    </div>
  );
}
