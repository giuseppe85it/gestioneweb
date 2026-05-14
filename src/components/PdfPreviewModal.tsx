import { useEffect, useState } from "react";
import "./PdfPreviewModal.css";

type PdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  fileName: string;
  hint?: string | null;
  shareTitle?: string;
  shareText?: string;
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
    shareTitle,
    shareText,
    emptyText = "Anteprima non disponibile.",
    onClose,
    onShare,
    onCopyLink,
    onWhatsApp,
  } = props;
  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const effectiveShareTitle = shareTitle || title || "Documento PDF";
  const effectiveShareText =
    shareText ||
    `Documento PDF ${fileName}. Scarica il PDF e allegalo manualmente se la condivisione diretta non e' disponibile.`;
  const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(effectiveShareText)}`;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareFallbackOpen(false);
        setShareError(null);
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleClose = () => {
    setShareFallbackOpen(false);
    setShareError(null);
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

  if (!open) return null;

  return (
    <div
      className="pdf-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="pdf-preview-modal">
        <div className="pdf-preview-head">
          <h4>{title}</h4>
          <button type="button" className="pdf-preview-btn" onClick={handleClose}>
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
          <button type="button" className="pdf-preview-btn" onClick={() => void handleShare()}>
            Condividi
          </button>
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
        {shareFallbackOpen && (
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

