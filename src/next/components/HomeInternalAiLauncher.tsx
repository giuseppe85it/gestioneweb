import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import NextInternalAiPage from "../NextInternalAiPage";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1400,
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(12px)",
  padding: "clamp(16px, 3vw, 28px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const sheetStyle: CSSProperties = {
  width: "min(1040px, calc(100vw - 32px))",
  height: "min(94dvh, 920px)",
  maxHeight: "calc(100vh - 32px)",
  borderRadius: 24,
  background: "linear-gradient(180deg, #fffdf9 0%, #f7f3ec 100%)",
  boxShadow: "0 36px 100px rgba(15, 23, 42, 0.4)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(255, 255, 255, 0.3)",
};

const toolbarStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "16px 20px",
  borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(255, 252, 245, 0.96)",
};

const launcherRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 10,
  flexWrap: "wrap",
};

const plusMenuStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 8px)",
  minWidth: 220,
  padding: 10,
  borderRadius: 14,
  background: "#ffffff",
  boxShadow: "0 14px 42px rgba(15, 23, 42, 0.18)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  display: "grid",
  gap: 8,
  zIndex: 5,
};

const modalBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  background: "transparent",
};

export default function HomeInternalAiLauncher() {
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<File[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const modalDraftKey = useMemo(
    () => `${draftPrompt.trim()}|${draftAttachments.map((file) => file.name).join("|")}`,
    [draftAttachments, draftPrompt],
  );

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!menuContainerRef.current) {
        return;
      }

      if (event.target instanceof Node && !menuContainerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const openModal = () => {
    setIsMenuOpen(false);
    setIsModalOpen(true);
  };

  const handleAttachmentSelection = (files: FileList | null) => {
    const picked = Array.from(files ?? []).slice(0, 6);
    if (!picked.length) {
      return;
    }

    setDraftAttachments((current) => [...current, ...picked].slice(0, 6));
  };

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          openModal();
        }}
        style={{ display: "grid", gap: 12 }}
      >
        <div style={launcherRowStyle}>
          <label className="internal-ai-search__field" style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <span>Scrivi una richiesta</span>
            <input
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              placeholder="Scrivi qui la tua richiesta e premi Invio per aprire la IA"
              className="internal-ai-search__input internal-ai-chat__composer-input"
            />
          </label>

          <div ref={menuContainerRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="internal-ai-search__button internal-ai-search__button--secondary"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              +
            </button>
            {isMenuOpen ? (
              <div role="menu" aria-label="Menu allegati" style={plusMenuStyle}>
                <button
                  type="button"
                  className="internal-ai-search__button internal-ai-search__button--secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Allega file
                </button>
                <button
                  type="button"
                  className="internal-ai-search__button internal-ai-search__button--secondary"
                  onClick={openModal}
                >
                  Apri conversazione
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="internal-ai-search__actions" style={{ justifyContent: "flex-end" }}>
          <button type="submit" className="internal-ai-search__button">
            Apri IA
          </button>
        </div>

        {draftAttachments.length ? (
          <div className="internal-ai-chat__attachments">
            {draftAttachments.map((attachment, index) => (
              <article
                key={`${attachment.name}:${attachment.size}:${index}`}
                className="internal-ai-chat__attachment-row"
              >
                <div className="internal-ai-chat__attachment-copy">
                  <strong>{attachment.name}</strong>
                  <p className="internal-ai-card__meta">
                    {attachment.type || "file"} - {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  className="internal-ai-chat__reference"
                  onClick={() =>
                    setDraftAttachments((current) =>
                      current.filter((candidate) => candidate !== attachment),
                    )
                  }
                >
                  Rimuovi
                </button>
              </article>
            ))}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="internal-ai-sr-only"
          accept=".pdf,image/*,text/plain,text/markdown,.txt,.md,.doc,.docx,.odt,.xls,.xlsx,.csv,application/pdf"
          onChange={(event) => {
            handleAttachmentSelection(event.currentTarget.files);
            event.currentTarget.value = "";
            setIsMenuOpen(false);
          }}
        />
      </form>

      {isModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="IA interna"
              style={overlayStyle}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setIsModalOpen(false);
                }
              }}
            >
              <div style={sheetStyle}>
                <div style={toolbarStyle}>
                  <div>
                    <p className="internal-ai-card__eyebrow" style={{ margin: 0 }}>
                      IA interna
                    </p>
                    <strong>Conversazione rapida dalla Home</strong>
                  </div>
                  <button
                    type="button"
                    className="internal-ai-search__button internal-ai-search__button--secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Chiudi
                  </button>
                </div>
                <div style={modalBodyStyle}>
                  <NextInternalAiPage
                    key={modalDraftKey}
                    sectionId="overview"
                    surfaceVariant="home-modal"
                    autoSubmitInitialChat={Boolean(draftPrompt.trim())}
                    initialChatInput={draftPrompt}
                    initialChatAttachments={draftAttachments}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
