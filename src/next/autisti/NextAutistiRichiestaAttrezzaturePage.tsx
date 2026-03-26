import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import "../../autisti/RichiestaAttrezzature.css";
import { getAutistaLocal, getMezzoLocal } from "../../autisti/autistiStorage";
import {
  NEXT_AUTISTI_BASE_PATH,
  NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM,
} from "./nextAutistiCloneRuntime";
import {
  createNextAutistiCloneAttachmentFromFile,
  formatNextAutistiCloneAttachmentSize,
  type NextAutistiCloneAttachment,
} from "./nextAutistiCloneAttachments";
import {
  appendNextAutistiCloneRichiestaAttrezzature,
  type NextAutistiCloneRichiestaAttrezzatureRecord,
} from "./nextAutistiCloneRichiesteAttrezzature";

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildHomePathWithNotice(noticeCode: string) {
  const params = new URLSearchParams();
  params.set(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM, noticeCode);

  return {
    pathname: `${NEXT_AUTISTI_BASE_PATH}/home`,
    search: `?${params.toString()}`,
  };
}

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
      setErrore("Errore preparazione foto locale");
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

    const now = Date.now();
    const record: NextAutistiCloneRichiestaAttrezzatureRecord = {
      id: genId(),
      testo: messaggio,
      autistaNome: autista?.nome ? String(autista.nome) : null,
      badgeAutista: autista?.badge ? String(autista.badge) : null,
      targaCamion: mezzo?.targaCamion ? String(mezzo.targaCamion).toUpperCase().trim() : null,
      targaRimorchio: mezzo?.targaRimorchio
        ? String(mezzo.targaRimorchio).toUpperCase().trim()
        : null,
      attachments,
      attachmentCount: attachments.length,
      fotoUrl: attachments[0]?.previewUrl ?? null,
      fotoStoragePath: null,
      timestamp: now,
      stato: "nuova",
      letta: false,
      source: "next-clone",
      syncState: "local-only",
    };

    try {
      appendNextAutistiCloneRichiestaAttrezzature(record);
      setTesto("");
      setAttachments([]);
      navigate(buildHomePathWithNotice("richiesta-attrezzature-locale"), {
        replace: true,
      });
    } catch {
      setLoading(false);
      setErrore("Errore invio richiesta nel clone");
    }
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

        <p className="autisti-subtitle">
          Richiesta e foto restano locali al clone: nessun upload, nessuna delete e nessuna sincronizzazione sulla madre.
        </p>

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

          <div className="richiesta-uploading">
            Foto locale al clone: viene solo preparata un&apos;anteprima e non parte nessun upload.
          </div>

          {attachmentPreparing ? (
            <div className="richiesta-uploading">Preparazione anteprima locale...</div>
          ) : null}

          {attachment ? (
            <div className="richiesta-photo-preview">
              <img src={attachment.previewUrl} alt={attachment.name} />
              <div className="richiesta-uploading">
                {attachment.name} · {formatNextAutistiCloneAttachmentSize(attachment.size)}
              </div>
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
          {loading ? "SALVATAGGIO..." : "SALVA RICHIESTA LOCALE"}
        </button>
      </div>
    </div>
  );
}
