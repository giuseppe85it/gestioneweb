import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import {
  buildNextMaterialiConsegnatiDestinatariView,
  readNextMaterialiMovimentiSnapshot,
  type NextMaterialeMovimentoReadOnlyItem,
  type NextMaterialiConsegnatiDestinatarioView,
  type NextMaterialiMovimentiSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import {
  buildNextInventarioReadOnlyView,
  readNextInventarioSnapshot,
  type NextInventarioSnapshot,
} from "./domain/nextInventarioDomain";
import {
  appendNextMaterialiMovimentiCloneRecord,
  markNextMaterialiMovimentiCloneDeleted,
} from "./nextMaterialiMovimentiCloneState";
import { upsertNextInventarioCloneRecord } from "./nextInventarioCloneState";
import { formatEditableDateUI } from "./nextDateFormat";
import { buildNextDossierPath } from "./nextStructuralPaths";
import { generateTablePDFBlob } from "../utils/pdfEngine";
import { openPreview, revokePdfPreviewUrl } from "../utils/pdfPreview";
import "../pages/MaterialiConsegnati.css";

type DestinatarioMode = "MEZZO" | "COLLEGA" | "MAGAZZINO";

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function createCloneMovementId() {
  return `next-materiali:${Date.now()}`;
}

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return unit ? `${normalized} ${unit}` : normalized;
}

function todayInputValue() {
  return formatEditableDateUI(new Date());
}

export default function NextMaterialiConsegnatiPage() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<NextMaterialiMovimentiSnapshot | null>(null);
  const [inventorySnapshot, setInventorySnapshot] = useState<NextInventarioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(todayInputValue());
  const [destMode, setDestMode] = useState<DestinatarioMode>("MEZZO");
  const [destRef, setDestRef] = useState("");
  const [motivo, setMotivo] = useState("");
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("materiali-consegnati-clone.pdf");
  const [mezzi, setMezzi] = useState<Array<{ id: string; targa: string }>>([]);
  const [colleghi, setColleghi] = useState<Array<{ id: string; label: string }>>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [nextSnapshot, nextInventory, anagrafiche] = await Promise.all([
        readNextMaterialiMovimentiSnapshot(),
        readNextInventarioSnapshot(),
        readNextAnagraficheFlottaSnapshot(),
      ]);
      setSnapshot(nextSnapshot);
      setInventorySnapshot(nextInventory);
      setMezzi(
        anagrafiche.items.map((item) => ({
          id: item.id,
          targa: item.targa,
        })),
      );
      setColleghi(
        anagrafiche.colleghi.map((item) => ({
          id: item.id,
          label: item.nomeCompleto || item.nome,
        })),
      );
    } catch (loadError) {
      setSnapshot(null);
      setInventorySnapshot(null);
      setError(readErrorMessage(loadError, "Impossibile leggere i movimenti materiali."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  const inventoryItems = useMemo(
    () => (inventorySnapshot ? buildNextInventarioReadOnlyView(inventorySnapshot) : []),
    [inventorySnapshot],
  );
  const destinatari = useMemo(
    () => (snapshot ? buildNextMaterialiConsegnatiDestinatariView(snapshot) : []),
    [snapshot],
  );
  const selectedDest = useMemo<NextMaterialiConsegnatiDestinatarioView | null>(
    () => destinatari.find((entry) => entry.id === selectedDestId) ?? destinatari[0] ?? null,
    [destinatari, selectedDestId],
  );

  const handleSaveMovement = async () => {
    const inventoryItem = inventoryItems.find((item) => item.id === selectedInventoryId);
    const parsedQty = Number(String(deliveryQty).replace(",", "."));
    if (!inventoryItem || !Number.isFinite(parsedQty) || parsedQty <= 0) {
      setNotice("Seleziona un materiale e una quantita valida prima di salvare.");
      return;
    }

    let destinatario:
      | { type: DestinatarioMode; refId: string; label: string }
      | null = null;
    if (destMode === "MEZZO") {
      const mezzo = mezzi.find((item) => item.targa === destRef);
      if (!mezzo) {
        setNotice("Seleziona una targa valida.");
        return;
      }
      destinatario = { type: "MEZZO", refId: mezzo.targa, label: mezzo.targa };
    } else if (destMode === "COLLEGA") {
      const collega = colleghi.find((item) => item.id === destRef);
      if (!collega) {
        setNotice("Seleziona un collega valido.");
        return;
      }
      destinatario = { type: "COLLEGA", refId: collega.id, label: collega.label };
    } else {
      destinatario = { type: "MAGAZZINO", refId: "MAGAZZINO", label: "MAGAZZINO" };
    }

    upsertNextInventarioCloneRecord({
      id: inventoryItem.id,
      descrizione: inventoryItem.descrizione,
      quantita: (inventoryItem.quantita ?? 0) - parsedQty,
      unita: inventoryItem.unita ?? "pz",
      fornitore: inventoryItem.fornitore,
      fotoUrl: inventoryItem.fotoUrl,
      fotoStoragePath: inventoryItem.fotoStoragePath,
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });

    appendNextMaterialiMovimentiCloneRecord({
      id: createCloneMovementId(),
      inventarioRefId: inventoryItem.id,
      targa: destMode === "MEZZO" ? destinatario.refId : null,
      mezzoTarga: destMode === "MEZZO" ? destinatario.refId : null,
      destinatario,
      descrizione: inventoryItem.descrizione,
      materialeLabel: inventoryItem.descrizione,
      quantita: parsedQty,
      unita: inventoryItem.unita ?? "pz",
      data: deliveryDate,
      timestamp: Date.parse(`${deliveryDate}T12:00:00`),
      fornitore: inventoryItem.fornitore,
      motivo: motivo.trim() || null,
      direzione: "OUT",
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });

    setNotice("Consegna registrata nel clone e inventario aggiornato localmente.");
    setDeliveryQty("");
    setMotivo("");
    await load();
  };

  const handleDeleteMovement = async (item: NextMaterialeMovimentoReadOnlyItem) => {
    if (!window.confirm("Eliminare questa consegna dal clone?")) {
      return;
    }

    const inventoryItem =
      inventoryItems.find((entry) => entry.id === item.inventarioRefId) ??
      inventoryItems.find((entry) => entry.descrizione === (item.descrizione ?? item.materiale ?? ""));

    if (inventoryItem) {
      upsertNextInventarioCloneRecord({
        id: inventoryItem.id,
        descrizione: inventoryItem.descrizione,
        quantita: (inventoryItem.quantita ?? 0) + (item.quantita ?? 0),
        unita: inventoryItem.unita ?? "pz",
        fornitore: inventoryItem.fornitore,
        fotoUrl: inventoryItem.fotoUrl,
        fotoStoragePath: inventoryItem.fotoStoragePath,
        __nextCloneOnly: true,
        __nextCloneSavedAt: Date.now(),
      });
    }

    markNextMaterialiMovimentiCloneDeleted(item.id);
    setNotice("Consegna rimossa dal clone e quantita ripristinata localmente.");
    await load();
  };

  const handlePreviewPdf = async () => {
    const rows = (selectedDest?.items ?? snapshot?.items ?? []).map((item) => ({
      data: item.data ?? "-",
      destinatario: item.destinatario.label ?? item.target ?? "-",
      descrizione: item.descrizione ?? item.materiale ?? "-",
      quantita: formatQuantity(item.quantita, item.unita),
      fornitore: item.fornitore ?? "-",
    }));

    if (rows.length === 0) {
      setNotice("Nessun movimento da esportare.");
      return;
    }

    const preview = await openPreview({
      source: async () =>
        generateTablePDFBlob(
          "Materiali consegnati clone",
          rows,
          ["data", "destinatario", "descrizione", "quantita", "fornitore"],
        ),
      previousUrl: pdfUrl,
      fileName: "materiali-consegnati-clone.pdf",
    });
    revokePdfPreviewUrl(pdfUrl);
    setPdfUrl(preview.url);
    setPdfFileName(preview.fileName);
    setPdfOpen(true);
  };

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Materiali"
      title="Materiali consegnati"
      description="Route NEXT nativa per storico consegne, ripristino stock clone e PDF senza riaprire il runtime madre."
      backTo="/next/gestione-operativa"
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? (
            <div className="next-clone-placeholder">Caricamento movimenti materiali...</div>
          ) : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {snapshot ? (
            <p style={{ margin: 0 }}>
              Movimenti letti: {snapshot.counts.total} | Verso mezzo: {snapshot.counts.versoMezzo} |
              Con data: {snapshot.counts.conData}
            </p>
          ) : null}
        </div>
      }
      actions={
        <button type="button" className="next-clone-header-action" onClick={() => void handlePreviewPdf()}>
          Scarica PDF
        </button>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div className="mc-form">
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Materiale
              <select value={selectedInventoryId} onChange={(event) => setSelectedInventoryId(event.target.value)}>
                <option value="">Seleziona materiale</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.descrizione} ({formatQuantity(item.quantita, item.unita)})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantita
              <input value={deliveryQty} onChange={(event) => setDeliveryQty(event.target.value)} type="number" />
            </label>
            <label>
              Data
              <input value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} type="text" placeholder="gg mm aaaa" />
            </label>
            <label>
              Destinatario
              <select value={destMode} onChange={(event) => setDestMode(event.target.value as DestinatarioMode)}>
                <option value="MEZZO">Mezzo</option>
                <option value="COLLEGA">Collega</option>
                <option value="MAGAZZINO">Magazzino</option>
              </select>
            </label>
            {destMode === "MEZZO" ? (
              <label>
                Targa
                <select value={destRef} onChange={(event) => setDestRef(event.target.value)}>
                  <option value="">Seleziona targa</option>
                  {mezzi.map((item) => (
                    <option key={item.id} value={item.targa}>
                      {item.targa}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {destMode === "COLLEGA" ? (
              <label>
                Collega
                <select value={destRef} onChange={(event) => setDestRef(event.target.value)}>
                  <option value="">Seleziona collega</option>
                  {colleghi.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label style={{ gridColumn: "1 / -1" }}>
              Motivo
              <input value={motivo} onChange={(event) => setMotivo(event.target.value)} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className="mc-add-btn" type="button" onClick={() => void handleSaveMovement()}>
              Registra consegna
            </button>
            <button className="mc-pdf-global-btn" type="button" onClick={() => void handlePreviewPdf()}>
              Anteprima PDF
            </button>
          </div>
        </div>

        <div className="mc-list-wrapper">
          {!destinatari.length ? (
            <div className="mc-empty">Nessuna consegna registrata.</div>
          ) : (
            <>
              <div className="mc-dest-list">
                {destinatari.map((dest) => (
                  <button
                    key={dest.id}
                    className={`mc-dest-row${(selectedDest?.id ?? null) === dest.id ? " mc-dest-row-active" : ""}`}
                    type="button"
                    onClick={() => setSelectedDestId(dest.id)}
                  >
                    <div className="mc-dest-main">
                      <span className="mc-dest-name">{dest.label}</span>
                      <span className="mc-dest-badge">Tot: {dest.totalQuantita}</span>
                    </div>
                    <div className="mc-dest-meta">
                      <span className="mc-dest-meta-text">Movimenti: {dest.movementCount}</span>
                      <span className="mc-dest-meta-link">Dettaglio ▾</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedDest ? (
                <div className="mc-detail-panel">
                  <div className="mc-detail-header">
                    <div>
                      <h2 className="mc-detail-title">{selectedDest.label}</h2>
                      <p className="mc-detail-subtitle">Storico materiali consegnati</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="mc-pdf-btn"
                        type="button"
                        onClick={() => void handlePreviewPdf()}
                        style={{ background: "#2d6a4f", color: "#fdfaf4" }}
                      >
                        Anteprima
                      </button>
                    </div>
                  </div>

                  <div className="mc-detail-list">
                    {selectedDest.items.map((item) => (
                      <div key={item.id} className="mc-detail-row">
                        <div className="mc-detail-main">
                          <span className="mc-detail-date">{item.data ?? "-"}</span>
                          <span className="mc-detail-desc">
                            {item.descrizione ?? item.materiale ?? "-"} -{" "}
                            {formatQuantity(item.quantita, item.unita)}
                          </span>
                          {item.fornitore ? (
                            <span className="mc-detail-motivo">Fornitore: {item.fornitore}</span>
                          ) : null}
                          {item.motivo ? (
                            <span className="mc-detail-motivo">{item.motivo}</span>
                          ) : null}
                          {item.targa ? (
                            <div style={{ marginTop: 6 }}>
                              <button
                                type="button"
                                className="go-link-btn"
                                onClick={() => navigate(buildNextDossierPath(item.targa!))}
                              >
                                Apri dossier {item.targa}
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <button
                          className="mc-delete-btn"
                          type="button"
                          onClick={() => void handleDeleteMovement(item)}
                        >
                          Elimina
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <PdfPreviewModal
        open={pdfOpen}
        title="Anteprima PDF materiali consegnati"
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
