import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { mergeDocumentsToPdf } from "./mergeDocumentsToPdf";
import "./UnisciDocumentiTool.css";

export type UnisciDocumentiToolProps = {
  onPdfReady: (file: File) => void;
  onClose: () => void;
};

type ToolItem = {
  id: string;
  file: File;
  previewUrl: string | null;
};

const MAX_FILES = 20;
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);
const ACCEPT_ATTRIBUTE = "image/png,image/jpeg,image/webp,application/pdf";
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function createItemId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `merge-item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPreviewableImage(file: File) {
  return file.type.startsWith("image/");
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function buildOutputTimestamp() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export default function UnisciDocumentiTool({
  onPdfReady,
  onClose,
}: UnisciDocumentiToolProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [items, setItems] = useState<ToolItem[]>([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const remainingSlots = MAX_FILES - items.length;
  const canAddMore = remainingSlots > 0 && !merging;
  const totalPagesHint = useMemo(() => {
    if (items.length === 0) {
      return "Nessun file selezionato";
    }

    return `${items.length} file pronti per l'unione`;
  }, [items.length]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!merging) {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [merging, onClose]);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [items]);

  const openPicker = () => {
    if (!canAddMore) {
      return;
    }

    inputRef.current?.click();
  };

  const appendWarnings = (messages: string[]) => {
    if (messages.length === 0) {
      return;
    }

    setWarnings((current) => [...current, ...messages]);
  };

  const addFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) {
      return;
    }

    setError(null);

    const nextWarnings: string[] = [];
    const acceptedFiles: File[] = [];

    incomingFiles.forEach((file) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        nextWarnings.push(`Formato non supportato ignorato: ${file.name}`);
        return;
      }
      acceptedFiles.push(file);
    });

    if (acceptedFiles.length > remainingSlots) {
      nextWarnings.push(
        `Puoi tenere al massimo ${MAX_FILES} file. Gli ultimi ${acceptedFiles.length - remainingSlots} non sono stati aggiunti.`,
      );
    }

    const filesToAdd = acceptedFiles.slice(0, Math.max(remainingSlots, 0));

    if (filesToAdd.length > 0) {
      setItems((current) => [
        ...current,
        ...filesToAdd.map((file) => ({
          id: createItemId(),
          file,
          previewUrl: isPreviewableImage(file) ? URL.createObjectURL(file) : null,
        })),
      ]);
    }

    if (remainingSlots <= 0) {
      nextWarnings.push(`Massimo ${MAX_FILES} file raggiunto.`);
    }

    appendWarnings(nextWarnings);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (!canAddMore) {
      appendWarnings([`Massimo ${MAX_FILES} file raggiunto.`]);
      return;
    }

    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!canAddMore) {
      return;
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDropzoneKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === itemId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== itemId);
    });
  };

  const handleMoveUp = (index: number) => {
    setItems((current) => moveItem(current, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    setItems((current) => moveItem(current, index, index + 1));
  };

  const handleMerge = async () => {
    if (items.length === 0 || merging) {
      return;
    }

    try {
      setMerging(true);
      setError(null);
      const mergedBytes = await mergeDocumentsToPdf(items.map((item) => item.file));
      const timestamp = buildOutputTimestamp();
      const mergedBuffer = new ArrayBuffer(mergedBytes.byteLength);
      new Uint8Array(mergedBuffer).set(mergedBytes);
      const mergedFile = new File([mergedBuffer], `documento-unito-${timestamp}.pdf`, {
        type: "application/pdf",
      });

      onPdfReady(mergedFile);
      onClose();
    } catch (mergeError) {
      setError(
        mergeError instanceof Error
          ? mergeError.message
          : "Errore durante l'unione dei documenti.",
      );
      setMerging(false);
      return;
    }

    setMerging(false);
  };

  const dialog = (
    <div className="str-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="str-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="str-header">
          <div className="str-header-copy">
            <p className="str-eyebrow">Strumento documenti</p>
            <h2 id={titleId} className="str-title">
              Unisci documenti
            </h2>
            <p id={descriptionId} className="str-subtitle">
              Seleziona foto e PDF, riordinali e genera un unico PDF multipagina pronto
              per il passaggio al parent.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="str-close"
            onClick={onClose}
            disabled={merging}
            aria-label="Chiudi strumento"
          >
            &times;
          </button>
        </header>

        <div className="str-body">
          <div className="str-toolbar">
            <div className="str-toolbar-meta">
              <span className="str-pill">{totalPagesHint}</span>
              <span className={`str-pill${canAddMore ? "" : " is-warning"}`}>
                Massimo {MAX_FILES} file
              </span>
            </div>

            <div className="str-toolbar-actions">
              <button
                type="button"
                className="str-button is-secondary"
                onClick={openPicker}
                disabled={!canAddMore}
              >
                Aggiungi file
              </button>
            </div>
          </div>

          <div
            className={`str-dropzone${isDragOver ? " is-drag-over" : ""}${canAddMore ? "" : " is-disabled"}`}
            onClick={openPicker}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleDropzoneKeyDown}
            role="button"
            tabIndex={canAddMore ? 0 : -1}
            aria-label="Aggiungi file da unire"
            aria-disabled={!canAddMore}
          >
            <div className="str-dropzone-icon" aria-hidden="true">
              +
            </div>
            <p className="str-dropzone-title">Trascina qui file o clicca per sceglierli</p>
            <p className="str-dropzone-copy">
              Formati accettati: PNG, JPG, WEBP e PDF. L&apos;ordine finale del PDF
              segue l&apos;ordine visibile qui sotto.
            </p>
          </div>

          <input
            ref={inputRef}
            className="str-hidden-input"
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            onChange={handleInputChange}
          />

          <section className="str-list" aria-label="File selezionati">
            {items.length === 0 ? (
              <div className="str-empty">Nessun file selezionato.</div>
            ) : (
              items.map((item, index) => (
                <article key={item.id} className="str-item">
                  {item.previewUrl ? (
                    <img
                      className="str-thumb"
                      src={item.previewUrl}
                      alt={`Anteprima ${item.file.name}`}
                    />
                  ) : (
                    <div className="str-pdf-thumb" aria-hidden="true">
                      PDF
                    </div>
                  )}

                  <div className="str-item-copy">
                    <p className="str-item-name" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="str-item-meta">
                      {item.file.type === "application/pdf" ? "Documento PDF" : "Immagine"} -{" "}
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>

                  <div className="str-item-actions">
                    <button
                      type="button"
                      className="str-button is-icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={merging || index === 0}
                      aria-label={`Sposta in alto ${item.file.name}`}
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      className="str-button is-icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={merging || index === items.length - 1}
                      aria-label={`Sposta in basso ${item.file.name}`}
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      className="str-button is-icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={merging}
                      aria-label={`Rimuovi ${item.file.name}`}
                    >
                      &times;
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          <div className="str-messages" aria-live="polite">
            {error ? <p className="str-message is-error">{error}</p> : null}
            {warnings.length > 0 ? (
              <ul className="str-warning-list">
                {warnings.map((warning, index) => (
                  <li key={`warning:${index}`}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <footer className="str-footer">
            <span className="str-footer-copy">
              Il PDF finale avra nome automatico con timestamp locale.
            </span>

            <div className="str-toolbar-actions">
              <button
                type="button"
                className="str-button is-secondary"
                onClick={onClose}
                disabled={merging}
              >
                Annulla
              </button>
              <button
                type="button"
                className="str-button is-primary"
                onClick={() => void handleMerge()}
                disabled={items.length === 0 || merging}
              >
                <span className="str-button-content">
                  {merging ? <span className="str-spinner" aria-hidden="true" /> : null}
                  <span>{merging ? "Unione in corso..." : "Unisci e usa"}</span>
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
