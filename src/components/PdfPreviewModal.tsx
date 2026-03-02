import { useEffect } from "react";
import "./PdfPreviewModal.css";

type PdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  fileName: string;
  hint?: string | null;
  emptyText?: string;
  onClose: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  onWhatsApp?: () => void;
};

export default function PdfPreviewModal(props: PdfPreviewModalProps) {
  const {
    open,
    title,
    pdfUrl,
    fileName,
    hint,
    emptyText = "Anteprima non disponibile.",
    onClose,
    onShare,
    onCopyLink,
    onWhatsApp,
  } = props;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pdf-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pdf-preview-modal">
        <div className="pdf-preview-head">
          <h4>{title}</h4>
          <button type="button" className="pdf-preview-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>

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

        <div className="pdf-preview-actions">
          {hint && <span className="pdf-preview-hint">{hint}</span>}
          {onShare && (
            <button type="button" className="pdf-preview-btn" onClick={onShare}>
              Condividi
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
      </div>
    </div>
  );
}

