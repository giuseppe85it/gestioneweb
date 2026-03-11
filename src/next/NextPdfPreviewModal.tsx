import { useEffect } from "react";
import "../components/PdfPreviewModal.css";

type NextPdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  note?: string | null;
  emptyText?: string;
  onClose: () => void;
};

function NextPdfPreviewModal(props: NextPdfPreviewModalProps) {
  const {
    open,
    title,
    pdfUrl,
    note,
    emptyText = "Anteprima non disponibile.",
    onClose,
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
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
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
          {note ? <span className="pdf-preview-hint">{note}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default NextPdfPreviewModal;
