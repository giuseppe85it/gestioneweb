import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { db } from "../firebase";
import { generateSmartPDF, generateSmartPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText as buildPdfShareMessage,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import { NEXT_HOME_PATH } from "./nextStructuralPaths";
import "../pages/Inventario.css";

type InventarioItem = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string;
  fornitore?: string | null;
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
};

type LegacyArrayDocument = Record<string, unknown> | unknown[] | null;

const READ_ONLY_ADD_MESSAGE = "Clone read-only: aggiunta materiale non disponibile.";
const READ_ONLY_EDIT_MESSAGE = "Clone read-only: salvataggio modifiche non disponibile.";
const READ_ONLY_DELETE_MESSAGE = "Clone read-only: eliminazione materiale non disponibile.";
const READ_ONLY_QTY_MESSAGE = "Clone read-only: variazione quantita non disponibile.";
const READ_ONLY_FOTO_MESSAGE = "Clone read-only: upload foto non disponibile.";

function unwrapLegacyArray(rawDoc: LegacyArrayDocument): unknown[] {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray(rawDoc.items)) return rawDoc.items;
  if (Array.isArray((rawDoc.value as { items?: unknown[] } | undefined)?.items)) {
    return (rawDoc.value as { items: unknown[] }).items;
  }
  if (Array.isArray(rawDoc.value)) return rawDoc.value;
  return [];
}

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapSnapshotItemToLegacyView(item: NextInventarioReadOnlyItem): InventarioItem {
  return {
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita,
    unita: item.unita ?? "pz",
    fornitore: item.fornitore ?? null,
    fotoUrl: item.fotoUrl ?? null,
    fotoStoragePath: item.fotoStoragePath ?? null,
  };
}

async function readFornitoriList(): Promise<string[]> {
  try {
    const snapshot = await getDoc(doc(db, "storage", "@fornitori"));
    if (!snapshot.exists()) return [];

    const rawItems = unwrapLegacyArray(
      (snapshot.data() as Record<string, unknown> | undefined) ?? null,
    );

    const names = rawItems
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const raw = entry as Record<string, unknown>;
        const value =
          normalizeOptionalText(raw.nome) ??
          normalizeOptionalText(raw.ragioneSociale) ??
          normalizeOptionalText(raw.fornitore) ??
          normalizeOptionalText(raw.label);
        return value ? value.toUpperCase() : null;
      })
      .filter((entry): entry is string => Boolean(entry));

    return [...new Set(names)].sort((left, right) =>
      left.localeCompare(right, "it", { sensitivity: "base" }),
    );
  } catch (error) {
    console.error("Errore lettura fornitori per Inventario NEXT:", error);
    return [];
  }
}

const InventarioPage = () => {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [fornitore, setFornitore] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fornitoriList, setFornitoriList] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [editItem, setEditItem] = useState<InventarioItem | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("inventario-magazzino.pdf");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [inventorySnapshot, suppliers] = await Promise.all([
          readNextInventarioSnapshot({ includeCloneOverlays: false }),
          readFornitoriList(),
        ]);

        setInventario(inventorySnapshot.items.map(mapSnapshotItemToLegacyView));
        setFornitoriList(suppliers);
      } catch (error) {
        console.error("Errore caricamento Inventario NEXT:", error);
        setInventario([]);
        setFornitoriList([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleAdd = () => {
    if (!descrizione.trim() || !quantita.trim()) {
      window.alert("Inserisci descrizione e quantita.");
      return;
    }

    const parsedQuantity = Number(quantita.replace(",", "."));
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      window.alert("Quantita non valida.");
      return;
    }

    window.alert(READ_ONLY_ADD_MESSAGE);
  };

  const handleQtyButton = () => {
    window.alert(READ_ONLY_QTY_MESSAGE);
  };

  const handleQtyInput = () => {
    window.alert(READ_ONLY_QTY_MESSAGE);
  };

  const handleDelete = () => {
    if (!window.confirm("Eliminare materiale?")) return;
    window.alert(READ_ONLY_DELETE_MESSAGE);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;

    const parsedQuantity =
      typeof editItem.quantita === "number" ? editItem.quantita : Number.NaN;
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      window.alert("Quantita non valida.");
      return;
    }

    window.alert(READ_ONLY_EDIT_MESSAGE);
  };

  const buildInventarioPdfPayload = () => {
    const rows = inventario.map((item) => ({
      descrizione: item.descrizione,
      fornitore: item.fornitore || "",
      quantita: item.quantita != null ? String(item.quantita) : "",
      unita: item.unita,
      foto: item.fotoUrl ? "SI" : "",
    }));

    return {
      kind: "table" as const,
      title: "Inventario Magazzino",
      columns: ["descrizione", "fornitore", "quantita", "unita", "foto"],
      rows,
    };
  };

  const exportPDF = async () => {
    if (inventario.length === 0) {
      window.alert("Inventario vuoto.");
      return;
    }

    await generateSmartPDF(buildInventarioPdfPayload());
  };

  const ensurePdfPreviewReady = async () => {
    if (inventario.length === 0) {
      window.alert("Inventario vuoto.");
      return null;
    }

    try {
      const preview = await openPreview({
        source: async () => generateSmartPDFBlob(buildInventarioPdfPayload()),
        fileName: "inventario-magazzino.pdf",
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewUrl(preview.url);
      return preview;
    } catch (error) {
      console.error("Errore anteprima PDF inventario NEXT:", error);
      window.alert("Impossibile generare l'anteprima PDF.");
      return null;
    }
  };

  const handleAnteprimaPDF = async () => {
    const preview = await ensurePdfPreviewReady();
    if (!preview) return;
    setPdfShareHint(null);
    setPdfPreviewOpen(true);
  };

  const buildPreviewShareText = () =>
    buildPdfShareMessage({
      contextLabel: "Inventario Magazzino",
      fileName: pdfPreviewFileName || "inventario-magazzino.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    let blob = pdfPreviewBlob;
    let fileName = pdfPreviewFileName || "inventario-magazzino.pdf";

    if (!blob) {
      const preview = await ensurePdfPreviewReady();
      if (!preview) return;
      blob = preview.blob;
      fileName = preview.fileName;
      setPdfPreviewOpen(true);
    }

    const result = await sharePdfFile({
      blob,
      fileName,
      title: "Inventario Magazzino",
      text: `Condivisione ${fileName}`,
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;
    if (result.status === "unsupported") {
      setPdfShareHint(
        "Condivisione file non disponibile su questo dispositivo. Usa Copia link o Apri WhatsApp.",
      );
      return;
    }
    setPdfShareHint("Condivisione non riuscita. Usa Copia link o Apri WhatsApp.");
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPreviewShareText());
    setPdfShareHint(
      copied
        ? "Testo copiato negli appunti."
        : "Impossibile copiare automaticamente. Copia il testo manualmente.",
    );
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppShareUrl(buildPreviewShareText());
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  return (
    <div className="inventario-page">
      <div className="inventario-card">
        <div className="inventario-header">
          <div className="inventario-logo-title">
            <img
              src="/logo.png"
              className="inventario-logo"
              alt="Logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
            />
            <div>
              <h1 className="inventario-title">Inventario</h1>
              <p className="inventario-subtitle">Gestione magazzino centrale</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="inventario-pdf-button"
              type="button"
              onClick={() => void handleAnteprimaPDF()}
              style={{ background: "#2d6a4f", color: "#fdfaf4" }}
            >
              Anteprima PDF
            </button>
            <button className="inventario-pdf-button" type="button" onClick={() => void exportPDF()}>
              Scarica PDF
            </button>
          </div>
        </div>

        <div className="inventario-form">
          <label className="inventario-label">
            Descrizione
            <input
              type="text"
              className="inventario-input"
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
            />
          </label>

          <label className="inventario-label">
            Fornitore
            <input
              type="text"
              className="inventario-input"
              value={fornitore}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                setFornitore(value);

                if (!value) {
                  setSuggestions([]);
                  return;
                }

                const filtered = fornitoriList.filter((entry) =>
                  entry.toLowerCase().includes(value.toLowerCase()),
                );
                setSuggestions(filtered.slice(0, 5));
              }}
            />

            {suggestions.length > 0 ? (
              <div className="inventario-suggestions">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="inventario-suggestion-item"
                    onClick={() => {
                      setFornitore(suggestion);
                      setSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            ) : null}
          </label>

          <label className="inventario-label">
            Foto
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setFotoFile(nextFile);
              }}
              onClick={() => {
                if (!fotoFile) return;
                window.alert(READ_ONLY_FOTO_MESSAGE);
              }}
            />
          </label>

          {fotoFile ? (
            <div className="inventario-preview">
              <img src={URL.createObjectURL(fotoFile)} className="inventario-thumb" alt="Anteprima" />
            </div>
          ) : null}

          <div className="inventario-inline">
            <label className="inventario-label flex1">
              Quantita
              <input
                type="number"
                className="inventario-input"
                value={quantita}
                onChange={(event) => setQuantita(event.target.value)}
              />
            </label>

            <label className="inventario-label flex1">
              Unita
              <select
                className="inventario-input"
                value={unita}
                onChange={(event) => setUnita(event.target.value)}
              >
                <option value="pz">pz</option>
                <option value="mt">mt</option>
                <option value="kg">kg</option>
                <option value="lt">lt</option>
              </select>
            </label>
          </div>

          <button className="inventario-add-button" type="button" onClick={handleAdd}>
            Aggiungi al magazzino
          </button>
        </div>

        <div className="inventario-list-wrapper">
          {isLoading ? (
            <div className="inventario-empty">Caricamento...</div>
          ) : inventario.length === 0 ? (
            <div className="inventario-empty">Nessun materiale inserito.</div>
          ) : (
            <div className="inventario-list">
              {inventario.map((item) => (
                <div key={item.id} className="inventario-row">
                  <div className="inventario-row-foto">
                    {item.fotoUrl ? (
                      <img src={item.fotoUrl} className="inventario-thumb" alt={item.descrizione} />
                    ) : (
                      <div className="inventario-thumb placeholder">FOTO</div>
                    )}
                  </div>

                  <div className="inventario-row-details">
                    <span className="inventario-row-descrizione">
                      {item.descrizione}
                      {item.fornitore ? (
                        <span className="inventario-row-fornitore-inline"> - {item.fornitore}</span>
                      ) : null}
                    </span>

                    <div className="inventario-row-quantita-block">
                      <span className="inventario-row-quantita-label">Quantita</span>

                      <div className="inventario-row-quantita-controls">
                        <button
                          className="inventario-qty-btn"
                          type="button"
                          onClick={handleQtyButton}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          className="inventario-qty-input"
                          value={item.quantita ?? ""}
                          onChange={handleQtyInput}
                        />

                        <button
                          className="inventario-qty-btn"
                          type="button"
                          onClick={handleQtyButton}
                        >
                          +
                        </button>

                        <span className="inventario-row-unita">{item.unita}</span>
                      </div>
                    </div>
                  </div>

                  <div className="inventario-row-actions">
                    <button
                      className="inventario-delete-button"
                      type="button"
                      onClick={handleDelete}
                    >
                      Elimina
                    </button>

                    <button
                      className="inventario-edit-button"
                      type="button"
                      onClick={() => {
                        setEditItem({ ...item });
                      }}
                    >
                      Modifica
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editItem ? (
          <div className="inventario-edit-modal">
            <div className="inventario-edit-box">
              <h3>Modifica materiale</h3>

              <label className="inventario-label">
                Descrizione
                <input
                  className="inventario-input"
                  value={editItem.descrizione}
                  onChange={(event) =>
                    setEditItem({ ...editItem, descrizione: event.target.value })
                  }
                />
              </label>

              <label className="inventario-label">
                Fornitore
                <input
                  className="inventario-input"
                  value={editItem.fornitore || ""}
                  onChange={(event) =>
                    setEditItem({ ...editItem, fornitore: event.target.value })
                  }
                />
              </label>

              <label className="inventario-label">
                Quantita
                <input
                  className="inventario-input"
                  type="number"
                  value={editItem.quantita ?? ""}
                  onChange={(event) =>
                    setEditItem({
                      ...editItem,
                      quantita:
                        event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </label>

              <label className="inventario-label">
                Unita
                <select
                  className="inventario-input"
                  value={editItem.unita}
                  onChange={(event) =>
                    setEditItem({ ...editItem, unita: event.target.value })
                  }
                >
                  <option value="pz">pz</option>
                  <option value="mt">mt</option>
                  <option value="kg">kg</option>
                  <option value="lt">lt</option>
                </select>
              </label>

              <label className="inventario-label">
                Nuova foto (opzionale)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    if (event.target.files?.[0]) {
                      window.alert(READ_ONLY_FOTO_MESSAGE);
                    }
                  }}
                />
              </label>

              <div className="inventario-edit-actions">
                <button
                  className="inventario-edit-cancel"
                  type="button"
                  onClick={() => {
                    setEditItem(null);
                  }}
                >
                  Annulla
                </button>

                <button
                  className="inventario-edit-save"
                  type="button"
                  onClick={handleSaveEdit}
                >
                  Salva modifiche
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <PdfPreviewModal
          open={pdfPreviewOpen}
          title="Anteprima PDF inventario"
          pdfUrl={pdfPreviewUrl}
          fileName={pdfPreviewFileName}
          hint={pdfShareHint}
          onClose={closePdfPreview}
          onShare={() => void handleSharePDF()}
          onCopyLink={() => void handleCopyPDFText()}
          onWhatsApp={handleOpenWhatsApp}
        />
      </div>
    </div>
  );
};

export default InventarioPage;
