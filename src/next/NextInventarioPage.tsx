import { useEffect, useMemo, useState } from "react";
import NextClonePageScaffold from "./NextClonePageScaffold";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildNextInventarioReadOnlyView,
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
  type NextInventarioSnapshot,
} from "./domain/nextInventarioDomain";
import {
  markNextInventarioCloneDeleted,
  upsertNextInventarioCloneRecord,
} from "./nextInventarioCloneState";
import { generateTablePDFBlob } from "../utils/pdfEngine";
import { openPreview, revokePdfPreviewUrl } from "../utils/pdfPreview";
import "../pages/Inventario.css";

function createCloneId() {
  return `next-inventario:${Date.now()}`;
}

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Impossibile leggere l'inventario clone.";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () =>
      reject(new Error("Impossibile leggere il file selezionato."));
    reader.readAsDataURL(file);
  });
}

function formatQuantity(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

export default function NextInventarioPage() {
  const [snapshot, setSnapshot] = useState<NextInventarioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [fornitore, setFornitore] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("inventario-clone.pdf");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSnapshot = await readNextInventarioSnapshot();
      setSnapshot(nextSnapshot);
    } catch (loadError) {
      setSnapshot(null);
      setError(readErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  const items = useMemo(
    () =>
      snapshot
        ? buildNextInventarioReadOnlyView(snapshot, {
            query,
            criticalOnly,
          })
        : [],
    [criticalOnly, query, snapshot],
  );

  const resetForm = () => {
    setEditId(null);
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFornitore("");
    setFotoUrl(null);
  };

  const handleEdit = (item: NextInventarioReadOnlyItem) => {
    setEditId(item.id);
    setDescrizione(item.descrizione);
    setQuantita(item.quantita != null ? String(item.quantita) : "");
    setUnita(item.unita ?? "pz");
    setFornitore(item.fornitore ?? "");
    setFotoUrl(item.fotoUrl ?? null);
    setNotice(null);
  };

  const handleSave = async () => {
    const normalizedDescription = descrizione.trim().toUpperCase();
    const parsedQuantity = Number(String(quantita).replace(",", "."));
    if (!normalizedDescription || !Number.isFinite(parsedQuantity)) {
      setNotice("Compila descrizione e quantita valide prima di salvare.");
      return;
    }

    upsertNextInventarioCloneRecord({
      id: editId ?? createCloneId(),
      descrizione: normalizedDescription,
      quantita: parsedQuantity,
      unita: unita.trim() || "pz",
      fornitore: fornitore.trim() || null,
      fotoUrl,
      fotoStoragePath: null,
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });

    setNotice(editId ? "Articolo aggiornato nel clone." : "Articolo aggiunto nel clone.");
    resetForm();
    await load();
  };

  const handleDelete = async (item: NextInventarioReadOnlyItem) => {
    if (!window.confirm(`Eliminare ${item.descrizione} dal clone?`)) {
      return;
    }
    markNextInventarioCloneDeleted(item.id);
    if (editId === item.id) {
      resetForm();
    }
    setNotice("Articolo eliminato dal clone.");
    await load();
  };

  const handleAdjustQuantity = async (
    item: NextInventarioReadOnlyItem,
    delta: number,
  ) => {
    const currentQuantity = item.quantita ?? 0;
    upsertNextInventarioCloneRecord({
      id: item.id,
      descrizione: item.descrizione,
      quantita: currentQuantity + delta,
      unita: item.unita ?? "pz",
      fornitore: item.fornitore,
      fotoUrl: item.fotoUrl,
      fotoStoragePath: item.fotoStoragePath,
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });
    setNotice(`Quantita aggiornata nel clone per ${item.descrizione}.`);
    await load();
  };

  const handleRemovePhoto = async (item: NextInventarioReadOnlyItem) => {
    upsertNextInventarioCloneRecord({
      id: item.id,
      descrizione: item.descrizione,
      quantita: item.quantita ?? 0,
      unita: item.unita ?? "pz",
      fornitore: item.fornitore,
      fotoUrl: null,
      fotoStoragePath: null,
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });
    if (editId === item.id) {
      setFotoUrl(null);
    }
    setNotice(`Foto rimossa nel clone per ${item.descrizione}.`);
    await load();
  };

  const handlePreviewPdf = async () => {
    if (items.length === 0) {
      setNotice("Nessun articolo da esportare.");
      return;
    }

    const preview = await openPreview({
      source: async () =>
        generateTablePDFBlob(
          "Inventario clone",
          items.map((item) => ({
            descrizione: item.descrizione,
            quantita: formatQuantity(item.quantita),
            unita: item.unita ?? "pz",
            fornitore: item.fornitore ?? "-",
            stato: item.stockStatus,
          })),
          ["descrizione", "quantita", "unita", "fornitore", "stato"],
        ),
      previousUrl: pdfUrl,
      fileName: "inventario-clone.pdf",
    });
    revokePdfPreviewUrl(pdfUrl);
    setPdfUrl(preview.url);
    setPdfFileName(preview.fileName);
    setPdfOpen(true);
  };

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Magazzino"
      title="Inventario"
      description="Route NEXT nativa del magazzino: articoli, quantita, foto e PDF restano nel clone senza riaprire il runtime madre."
      backTo="/next/gestione-operativa"
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? (
            <div className="next-clone-placeholder">Caricamento inventario clone...</div>
          ) : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {snapshot ? (
            <p style={{ margin: 0 }}>
              Articoli letti: {snapshot.counts.total} | Critici: {snapshot.counts.critical} |
              Con foto: {snapshot.counts.withPhoto}
            </p>
          ) : null}
        </div>
      }
      actions={
        <button type="button" className="next-clone-header-action" onClick={() => void handlePreviewPdf()}>
          Anteprima PDF
        </button>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
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
              <input
                type="text"
                className="inventario-input"
                value={unita}
                onChange={(event) => setUnita(event.target.value)}
              />
            </label>
            <label className="inventario-label flex1">
              Fornitore
              <input
                type="text"
                className="inventario-input"
                value={fornitore}
                onChange={(event) => setFornitore(event.target.value)}
              />
            </label>
          </div>
          <div className="inventario-inline" style={{ alignItems: "center" }}>
            <label className="inventario-label flex1">
              Foto articolo
              <input
                type="file"
                className="inventario-input"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  try {
                    setFotoUrl(await readFileAsDataUrl(file));
                  } catch (fileError) {
                    setNotice(readErrorMessage(fileError));
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button className="inventario-add-button" type="button" onClick={() => void handleSave()}>
                {editId ? "Salva modifiche" : "Aggiungi al magazzino"}
              </button>
              <button className="inventario-pdf-button" type="button" onClick={resetForm}>
                Reset form
              </button>
            </div>
          </div>
          {fotoUrl ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img src={fotoUrl} alt="Anteprima articolo" className="inventario-thumb" />
              <button
                type="button"
                className="inventario-edit-button"
                onClick={() => setFotoUrl(null)}
              >
                Rimuovi foto
              </button>
            </div>
          ) : null}
        </div>

        <div className="inventario-form" style={{ opacity: 0.95 }}>
          <label className="inventario-label">
            Ricerca materiale o fornitore
            <input
              type="text"
              className="inventario-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Es. tubo / fornitore"
            />
          </label>

          <label className="inventario-label flex1">
            Vista
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 42 }}>
              <input
                type="checkbox"
                checked={criticalOnly}
                onChange={(event) => setCriticalOnly(event.target.checked)}
              />
              <span>Mostra solo materiali critici</span>
            </div>
          </label>
        </div>

        <div className="inventario-list-wrapper">
          {items.length === 0 ? (
            <div className="inventario-empty">Nessun articolo inventario disponibile.</div>
          ) : (
            <div className="inventario-list">
              {items.map((item) => (
                <div key={item.id} className="inventario-row">
                  <div className="inventario-row-foto">
                    {item.fotoUrl ? (
                      <img
                        src={item.fotoUrl}
                        className="inventario-thumb"
                        alt={item.descrizione}
                      />
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
                          onClick={() => void handleAdjustQuantity(item, -1)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          className="inventario-qty-input"
                          value={formatQuantity(item.quantita)}
                          readOnly
                        />
                        <button
                          className="inventario-qty-btn"
                          type="button"
                          onClick={() => void handleAdjustQuantity(item, 1)}
                        >
                          +
                        </button>
                        <span className="inventario-row-unita">{item.unita ?? "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="inventario-row-actions">
                    <button
                      className="inventario-edit-button"
                      type="button"
                      onClick={() => handleEdit(item)}
                    >
                      Modifica
                    </button>
                    <button
                      className="inventario-delete-button"
                      type="button"
                      onClick={() => void handleDelete(item)}
                    >
                      Elimina
                    </button>
                    {item.fotoUrl ? (
                      <button
                        className="inventario-edit-button"
                        type="button"
                        onClick={() => void handleRemovePhoto(item)}
                      >
                        Rimuovi foto
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PdfPreviewModal
        open={pdfOpen}
        title="Anteprima PDF inventario"
        pdfUrl={pdfUrl}
        fileName={pdfFileName}
        onClose={() => {
          revokePdfPreviewUrl(pdfUrl);
          setPdfOpen(false);
          setPdfUrl(null);
        }}
      />
    </NextClonePageScaffold>
  );
}
