import { useEffect, useState } from "react";
import "./PdfPreviewModal.css";
import { buildOutlookComposeUrl, downloadPdfFromBlob } from "../utils/pdfPreview";
import {
  composeEmailText,
  EmailComposeIaClientError,
  type EmailComposeTono,
} from "../utils/emailComposeIaClient";

type PdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  fileName: string;
  hint?: string | null;
  shareTitle?: string;
  shareText?: string;
  emptyText?: string;
  /**
   * Mostra "Invia via Email" (compose interno). Default true, ma il bottone
   * compare comunque SOLO se il PDF e' un blob: URL generato da noi (i documenti
   * di terzi passati come URL http di Storage restano senza email).
   */
  enableEmail?: boolean;
  /** Nome usato nella firma della mail (default: Giuseppe Milio). */
  emailDefaultFirma?: string;
  onClose: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  onWhatsApp?: () => void;
};

const DEFAULT_FIRMA = "Giuseppe Milio";

export default function PdfPreviewModal(props: PdfPreviewModalProps) {
  const {
    open,
    title,
    pdfUrl,
    fileName,
    hint,
    shareTitle,
    shareText,
    emptyText = "Anteprima non disponibile.",
    enableEmail = true,
    emailDefaultFirma = DEFAULT_FIRMA,
    onClose,
    onShare,
    onCopyLink,
    onWhatsApp,
  } = props;

  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Vista interna: anteprima PDF oppure componi email (un solo modale).
  const [view, setView] = useState<"preview" | "compose">("preview");
  const [emailBlob, setEmailBlob] = useState<Blob | null>(null);
  const [destinatario, setDestinatario] = useState("");
  const [firma, setFirma] = useState(emailDefaultFirma);
  const [contesto, setContesto] = useState("");
  const [tono, setTono] = useState<EmailComposeTono>("formale");
  const [istruzione, setIstruzione] = useState("");
  const [oggetto, setOggetto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [generato, setGenerato] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isBlobUrl = Boolean(pdfUrl && pdfUrl.startsWith("blob:"));
  const emailAvailable = enableEmail && isBlobUrl;

  const effectiveShareTitle = shareTitle || title || "Documento PDF";
  const effectiveShareText =
    shareText ||
    `Documento PDF ${fileName}. Scarica il PDF e allegalo manualmente se la condivisione diretta non e' disponibile.`;
  const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(effectiveShareText)}`;

  // Reset dello stato quando il modale si chiude.
  useEffect(() => {
    if (!open) {
      setView("preview");
      setShareFallbackOpen(false);
      setShareError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShareFallbackOpen(false);
      setShareError(null);
      // In compose torno all'anteprima; in anteprima chiudo il modale.
      setView((current) => {
        if (current === "compose") return "preview";
        onClose();
        return current;
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleClose = () => {
    setShareFallbackOpen(false);
    setShareError(null);
    setView("preview");
    onClose();
  };

  const handleShare = async () => {
    setShareError(null);
    setShareFallbackOpen(false);

    if (onShare) {
      onShare();
      return;
    }

    if (!pdfUrl) {
      setShareError("PDF non disponibile per la condivisione.");
      setShareFallbackOpen(true);
      return;
    }

    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (typeof nav.share !== "function") {
      setShareFallbackOpen(true);
      return;
    }

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const pdfFile = new File([blob], fileName || "documento.pdf", {
        type: blob.type || "application/pdf",
      });
      if (typeof nav.canShare === "function" && nav.canShare({ files: [pdfFile] })) {
        await nav.share({
          title: effectiveShareTitle,
          text: effectiveShareText,
          files: [pdfFile],
        });
        return;
      }

      await nav.share({
        title: effectiveShareTitle,
        text: effectiveShareText,
      });
    } catch (error) {
      const maybe = error as { name?: string };
      if (maybe?.name === "AbortError") return;
      setShareError("Condivisione diretta non disponibile in questo browser.");
      setShareFallbackOpen(true);
    }
  };

  // Apre la vista "Componi email": azzera i campi e recupera il Blob dal blob URL
  // (fetch locale, senza CORS) per poterlo scaricare al momento dell'invio.
  const openCompose = async () => {
    setEmailError(null);
    setEmailBusy(false);
    setGenerato(false);
    setDestinatario("");
    setFirma(emailDefaultFirma);
    setContesto("");
    setTono("formale");
    setIstruzione("");
    setOggetto("");
    setCorpo("");
    setEmailBlob(null);
    setView("compose");
    if (pdfUrl && pdfUrl.startsWith("blob:")) {
      try {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        setEmailBlob(blob);
      } catch {
        setEmailBlob(null);
      }
    }
  };

  const handleGenerate = async () => {
    const text = contesto.trim();
    if (!text || emailBusy) return;
    setEmailBusy(true);
    setEmailError(null);
    try {
      const result = await composeEmailText({ contesto: text, tono, istruzione, firma });
      setOggetto(result.oggetto);
      setCorpo(result.corpo);
      setGenerato(true);
    } catch (error) {
      setEmailError(
        error instanceof EmailComposeIaClientError
          ? error.message
          : "Scrittura IA non riuscita. Riprova, oppure scrivi il testo a mano.",
      );
    } finally {
      setEmailBusy(false);
    }
  };

  // Scarico il PDF (da allegare a mano); la navigazione del link <a target=_blank>
  // apre Outlook. Un click reale su link viene instradato da Chrome alla PWA.
  const handleOpenEmailClick = () => {
    if (emailBlob) {
      downloadPdfFromBlob(emailBlob, fileName);
      return;
    }
    if (pdfUrl) {
      const anchor = document.createElement("a");
      anchor.href = pdfUrl;
      anchor.download = fileName || "documento.pdf";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  };

  const canOpenEmail = Boolean(oggetto.trim() || corpo.trim());
  const outlookComposeUrl = buildOutlookComposeUrl({
    to: destinatario,
    subject: oggetto,
    body: corpo,
  });

  if (!open) return null;

  const composing = view === "compose";

  return (
    <div
      className="pdf-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={composing ? "Componi email" : title}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={`pdf-preview-modal${composing ? " pdf-preview-modal--compose" : ""}`}>
        <div className="pdf-preview-head">
          <h4>{composing ? "Componi email" : title}</h4>
          <button type="button" className="pdf-preview-btn" onClick={handleClose}>
            Chiudi
          </button>
        </div>

        {composing ? (
          <div className="pdf-preview-form">
            <div className="pdf-preview-field-row">
              <div className="pdf-preview-field">
                <label className="pdf-preview-label">A (destinatario) — opzionale</label>
                <input
                  className="pdf-preview-input"
                  type="email"
                  value={destinatario}
                  placeholder="nome@azienda.ch"
                  disabled={emailBusy}
                  onChange={(e) => setDestinatario(e.target.value)}
                />
              </div>
              <div className="pdf-preview-field">
                <label className="pdf-preview-label">Firma (nome mittente)</label>
                <input
                  className="pdf-preview-input"
                  value={firma}
                  placeholder="Giuseppe Milio"
                  disabled={emailBusy}
                  onChange={(e) => setFirma(e.target.value)}
                />
              </div>
            </div>

            <div className="pdf-preview-field">
              <label className="pdf-preview-label">Contesto del messaggio</label>
              <textarea
                className="pdf-preview-textarea"
                value={contesto}
                rows={5}
                placeholder="Scrivi qui, anche in forma di appunti, cosa vuoi comunicare: l'IA lo trasforma in una mail."
                disabled={emailBusy}
                onChange={(e) => setContesto(e.target.value)}
              />
            </div>

            <div className="pdf-preview-field-row">
              <div className="pdf-preview-field">
                <label className="pdf-preview-label">Tono</label>
                <div className="pdf-preview-segment" role="group" aria-label="Tono">
                  <button
                    type="button"
                    className={`pdf-preview-segment__opt${tono === "formale" ? " is-active" : ""}`}
                    onClick={() => setTono("formale")}
                    disabled={emailBusy}
                  >
                    Formale
                  </button>
                  <button
                    type="button"
                    className={`pdf-preview-segment__opt${tono === "informale" ? " is-active" : ""}`}
                    onClick={() => setTono("informale")}
                    disabled={emailBusy}
                  >
                    Informale
                  </button>
                </div>
              </div>
              <div className="pdf-preview-field">
                <label className="pdf-preview-label">Istruzione libera (opzionale)</label>
                <input
                  className="pdf-preview-input"
                  value={istruzione}
                  placeholder={'Es. "piu breve", "in tedesco"'}
                  disabled={emailBusy}
                  onChange={(e) => setIstruzione(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="pdf-preview-btn pdf-preview-btn--primary pdf-preview-btn--block"
              onClick={() => void handleGenerate()}
              disabled={emailBusy || !contesto.trim()}
            >
              {emailBusy ? "Scrittura..." : generato ? "Riscrivi con IA" : "Scrivi con IA"}
            </button>

            {emailError ? <div className="pdf-preview-error">{emailError}</div> : null}

            <div className="pdf-preview-field">
              <label className="pdf-preview-label">Oggetto</label>
              <input
                className="pdf-preview-input"
                value={oggetto}
                placeholder="Oggetto della mail (scritto dall'IA, modificabile)"
                disabled={emailBusy}
                onChange={(e) => setOggetto(e.target.value)}
              />
            </div>

            <div className="pdf-preview-field">
              <label className="pdf-preview-label">Testo</label>
              <textarea
                className="pdf-preview-textarea"
                value={corpo}
                rows={8}
                placeholder="Testo della mail (scritto dall'IA, modificabile)"
                disabled={emailBusy}
                onChange={(e) => setCorpo(e.target.value)}
              />
            </div>

            <p className="pdf-preview-note">
              Premendo «Apri email» il PDF viene scaricato: trascinalo nella mail e premi Invia.
            </p>
          </div>
        ) : (
          <div className="pdf-preview-body">
            <div className="pdf-preview-viewer-wrap">
              {pdfUrl ? (
                <object data={pdfUrl} type="application/pdf" className="pdf-preview-viewer">
                  <iframe title={title} src={pdfUrl} className="pdf-preview-viewer" />
                </object>
              ) : (
                <div className="pdf-preview-empty">{emptyText}</div>
              )}
            </div>
          </div>
        )}

        {composing ? (
          <div className="pdf-preview-actions pdf-preview-actions--compose">
            <button
              type="button"
              className="pdf-preview-btn"
              onClick={() => setView("preview")}
              disabled={emailBusy}
            >
              Annulla
            </button>
            {canOpenEmail && !emailBusy ? (
              <a
                className="pdf-preview-btn pdf-preview-btn--primary"
                href={outlookComposeUrl}
                target="_blank"
                rel="noopener"
                onClick={handleOpenEmailClick}
              >
                Apri email
              </a>
            ) : (
              <button type="button" className="pdf-preview-btn pdf-preview-btn--primary" disabled>
                Apri email
              </button>
            )}
          </div>
        ) : (
          <div className="pdf-preview-actions">
            {hint && <span className="pdf-preview-hint">{hint}</span>}
            <button type="button" className="pdf-preview-btn" onClick={() => void handleShare()}>
              Condividi
            </button>
            {emailAvailable && (
              <button type="button" className="pdf-preview-btn" onClick={() => void openCompose()}>
                Invia via Email
              </button>
            )}
            {onCopyLink && (
              <button type="button" className="pdf-preview-btn" onClick={onCopyLink}>
                Copia link
              </button>
            )}
            {onWhatsApp && (
              <button type="button" className="pdf-preview-btn" onClick={onWhatsApp}>
                Apri WhatsApp
              </button>
            )}
            {pdfUrl && (
              <a className="pdf-preview-btn pdf-preview-btn--primary" href={pdfUrl} download={fileName}>
                Scarica
              </a>
            )}
          </div>
        )}

        {shareFallbackOpen && !composing && (
          <div className="pdf-preview-actions" aria-live="polite">
            <span className="pdf-preview-hint">
              {shareError || "Condivisione diretta non supportata da questo browser."} Scarica il PDF e allegalo
              manualmente, oppure usa un browser piu' recente.
            </span>
            {pdfUrl && (
              <a className="pdf-preview-btn" href={pdfUrl} download={fileName}>
                Scarica il PDF e allegalo manualmente
              </a>
            )}
            <button
              type="button"
              className="pdf-preview-btn pdf-preview-btn--primary"
              onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
            >
              Apri WhatsApp Web
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
