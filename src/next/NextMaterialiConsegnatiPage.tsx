import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
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
import {
  readNextMaterialiMovimentiSnapshot,
  type NextMaterialeMovimentoReadOnlyItem,
} from "./domain/nextMaterialiMovimentiDomain";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import { NEXT_HOME_PATH } from "./nextStructuralPaths";
import "../pages/MaterialiConsegnati.css";

type DestinatarioRef = {
  type: "MEZZO" | "COLLEGA" | "MAGAZZINO";
  refId: string;
  label: string;
};

type MaterialeConsegnatoView = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  destinatario: DestinatarioRef;
  motivo?: string;
  data: string;
  fornitore?: string | null;
};

type InventarioItem = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string;
  fornitore?: string | null;
};

type MezzoBasic = {
  id: string;
  targa?: string;
  nome?: string;
  descrizione?: string;
};

type CollegaBasic = {
  id: string;
  nome?: string;
  cognome?: string;
};

type SuggestionDest = {
  type: "MEZZO" | "COLLEGA" | "MAGAZZINO";
  refId: string;
  label: string;
  extra?: string;
};

type SuggestionMat = {
  id: string;
  label: string;
  quantita: number | null;
  unita: string;
  fornitore?: string | null;
};

const READ_ONLY_ADD_MESSAGE =
  "Clone read-only: registrazione consegna non disponibile.";
const READ_ONLY_DELETE_MESSAGE =
  "Clone read-only: eliminazione consegna non disponibile.";

const oggi = () => {
  const now = new Date();
  const gg = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${gg} ${mm} ${yyyy}`;
};

function formatInventoryQuantity(value: number | null, unit: string): string {
  if (value === null) return `- ${unit}`;
  return `${value} ${unit}`;
}

function mapInventoryItem(item: NextInventarioReadOnlyItem): InventarioItem {
  return {
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita,
    unita: item.unita ?? "pz",
    fornitore: item.fornitore ?? null,
  };
}

function resolveDestType(
  item: NextMaterialeMovimentoReadOnlyItem,
): DestinatarioRef["type"] {
  if (item.tipoDestinatario === "MEZZO") return "MEZZO";
  if (item.tipoDestinatario === "MAGAZZINO") return "MAGAZZINO";
  return "COLLEGA";
}

function resolveDestLabel(item: NextMaterialeMovimentoReadOnlyItem): string {
  return (
    item.destinatario.label ??
    item.target ??
    item.destinatario.refId ??
    (item.tipoDestinatario === "MAGAZZINO" ? "MAGAZZINO" : "DESTINATARIO")
  );
}

function mapMovimentoItem(
  item: NextMaterialeMovimentoReadOnlyItem,
): MaterialeConsegnatoView {
  const label = resolveDestLabel(item);
  return {
    id: item.id,
    descrizione: item.descrizione ?? item.materiale ?? "-",
    quantita: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    destinatario: {
      type: resolveDestType(item),
      refId: item.destinatario.refId ?? label,
      label,
    },
    motivo: item.motivo ?? "",
    data: item.data ?? "",
    fornitore: item.fornitore ?? null,
  };
}

export default function NextMaterialiConsegnatiPage() {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [consegne, setConsegne] = useState<MaterialeConsegnatoView[]>([]);
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [colleghi, setColleghi] = useState<CollegaBasic[]>([]);
  const [destinatarioInput, setDestinatarioInput] = useState("");
  const [destinatarioObj, setDestinatarioObj] = useState<DestinatarioRef | null>(
    null,
  );
  const [descrizione, setDescrizione] = useState("");
  const [materialeSelezionato, setMaterialeSelezionato] =
    useState<InventarioItem | null>(null);
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(oggi());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState(
    "materiali-consegnati.pdf",
  );
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF");
  const [pdfShareContext, setPdfShareContext] = useState("Materiali consegnati");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [inventorySnapshot, materialsSnapshot, anagrafiche] = await Promise.all([
          readNextInventarioSnapshot({ includeCloneOverlays: false }),
          readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false }),
          readNextAnagraficheFlottaSnapshot(),
        ]);

        setInventario(inventorySnapshot.items.map(mapInventoryItem));
        setConsegne(materialsSnapshot.items.map(mapMovimentoItem));
        setMezzi(
          anagrafiche.items.map((item) => ({
            id: item.id,
            targa: item.targa,
            nome: item.marcaModello,
            descrizione: item.categoria,
          })),
        );
        setColleghi(
          anagrafiche.colleghi.map((item) => ({
            id: item.id,
            nome: item.nome,
            cognome: item.cognome,
          })),
        );
      } catch (error) {
        console.error("Errore caricamento Materiali consegnati NEXT:", error);
        setInventario([]);
        setConsegne([]);
        setMezzi([]);
        setColleghi([]);
        setLoadError("Impossibile leggere i materiali consegnati reali.");
      } finally {
        setLoading(false);
      }
    };

    void loadAll();
  }, []);

  useEffect(
    () => () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    },
    [pdfPreviewUrl],
  );

  const destSuggestions: SuggestionDest[] = useMemo(() => {
    const term = destinatarioInput.trim().toUpperCase();
    if (!term) return [];

    const list: SuggestionDest[] = [];

    mezzi.forEach((mezzo) => {
      const rawLabel = mezzo.targa || mezzo.nome || mezzo.descrizione || "";
      if (!rawLabel) return;
      if (rawLabel.toUpperCase().includes(term)) {
        list.push({
          type: "MEZZO",
          refId: mezzo.id,
          label: rawLabel,
          extra: "Mezzo",
        });
      }
    });

    colleghi.forEach((collega) => {
      const baseName = collega.nome || "";
      const fullName =
        collega.cognome && baseName ? `${baseName} ${collega.cognome}` : baseName;
      const rawLabel = fullName || collega.cognome || "";
      if (!rawLabel) return;
      if (rawLabel.toUpperCase().includes(term)) {
        list.push({
          type: "COLLEGA",
          refId: collega.id,
          label: rawLabel,
          extra: "Collega",
        });
      }
    });

    if ("MAGAZZINO".includes(term)) {
      list.push({
        type: "MAGAZZINO",
        refId: "MAGAZZINO",
        label: "MAGAZZINO",
        extra: "Magazzino",
      });
    }

    return list.slice(0, 10);
  }, [colleghi, destinatarioInput, mezzi]);

  const matSuggestions: SuggestionMat[] = useMemo(() => {
    const term = descrizione.trim().toUpperCase();
    if (!term) return [];

    return inventario
      .filter((item) => item.descrizione.toUpperCase().includes(term))
      .map((item) => ({
        id: item.id,
        label: item.descrizione,
        quantita: item.quantita,
        unita: item.unita,
        fornitore: item.fornitore ?? null,
      }))
      .slice(0, 10);
  }, [descrizione, inventario]);

  const destinatari = useMemo(() => {
    const map = new Map<string, DestinatarioRef>();
    consegne.forEach((consegna) => {
      const dest = consegna.destinatario;
      if (!dest || !dest.refId) return;
      if (!map.has(dest.refId)) {
        map.set(dest.refId, dest);
      }
    });
    return Array.from(map.values());
  }, [consegne]);

  const consegneSelezionate = useMemo(
    () =>
      selectedDest
        ? consegne
            .filter((consegna) => consegna.destinatario.refId === selectedDest)
            .sort((left, right) => left.data.localeCompare(right.data))
        : [],
    [consegne, selectedDest],
  );

  const selectedDestLabel = useMemo(() => {
    if (!selectedDest) return "";
    const dest = destinatari.find((entry) => entry.refId === selectedDest);
    return dest?.label || "";
  }, [destinatari, selectedDest]);

  const handleSelectDestSuggestion = (suggestion: SuggestionDest) => {
    setDestinatarioObj({
      type: suggestion.type,
      refId: suggestion.refId,
      label: suggestion.label,
    });
    setDestinatarioInput(suggestion.label);
  };

  const handleSelectMateriale = (suggestion: SuggestionMat) => {
    const item = inventario.find((entry) => entry.id === suggestion.id);
    if (!item) return;
    setMaterialeSelezionato(item);
    setDescrizione(item.descrizione);
    setUnita(item.unita);
  };

  const handleResetDestinatario = () => {
    setDestinatarioObj(null);
    setDestinatarioInput("");
  };

  const handleResetMateriale = () => {
    setMaterialeSelezionato(null);
    setDescrizione("");
  };

  const handleAdd = () => {
    if (!destinatarioObj) {
      window.alert("Seleziona un destinatario valido dalla lista.");
      return;
    }

    if (!materialeSelezionato) {
      window.alert("Seleziona un materiale valido dall'inventario.");
      return;
    }

    if (!descrizione.trim() || !quantita.trim()) {
      window.alert("Compila descrizione e quantita.");
      return;
    }

    const parsedQuantity = Number(quantita.replace(",", "."));
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      window.alert("La quantita deve essere un numero valido.");
      return;
    }

    window.alert(READ_ONLY_ADD_MESSAGE);
  };

  const handleDeleteConsegna = (id: string) => {
    const record = consegne.find((entry) => entry.id === id);
    if (!record) return;

    if (!window.confirm("Vuoi eliminare questa consegna e ripristinare il magazzino?")) {
      return;
    }

    window.alert(READ_ONLY_DELETE_MESSAGE);
  };

  const getTotalePerDestinatario = (destRefId: string) =>
    consegne
      .filter((entry) => entry.destinatario.refId === destRefId)
      .reduce((sum, entry) => sum + entry.quantita, 0);

  const buildPdfPayloadPerDestinatario = (destRefId: string) => {
    const list = consegne
      .filter((entry) => entry.destinatario.refId === destRefId)
      .sort((left, right) => left.data.localeCompare(right.data));

    const destLabel = list[0]?.destinatario.label || "Destinatario";
    const rows = list.map((entry) => ({
      data: entry.data,
      descrizione: entry.descrizione,
      fornitore: entry.fornitore || "",
      quantita: String(entry.quantita),
      unita: entry.unita,
      motivo: entry.motivo || "",
    }));

    return {
      kind: "table" as const,
      title: `Materiali consegnati a ${destLabel}`,
      columns: ["data", "descrizione", "fornitore", "quantita", "unita", "motivo"],
      rows,
      destLabel,
    };
  };

  const buildPdfPayloadGlobale = () => {
    const rows = consegne
      .slice()
      .sort((left, right) => left.data.localeCompare(right.data))
      .map((entry) => ({
        data: entry.data,
        destinatario: entry.destinatario.label,
        descrizione: entry.descrizione,
        fornitore: entry.fornitore || "",
        quantita: String(entry.quantita),
        unita: entry.unita,
        motivo: entry.motivo || "",
      }));

    return {
      kind: "table" as const,
      title: "Storico materiali consegnati",
      columns: [
        "data",
        "destinatario",
        "descrizione",
        "fornitore",
        "quantita",
        "unita",
        "motivo",
      ],
      rows,
    };
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const ensurePdfPreviewReady = async (params: {
    source: () => Promise<{ blob: Blob; fileName: string }>;
    fileName: string;
    title: string;
    contextLabel: string;
  }) => {
    try {
      const preview = await openPreview({
        source: async () => params.source(),
        fileName: params.fileName,
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(params.title);
      setPdfShareContext(params.contextLabel);
      setPdfPreviewUrl(preview.url);
      return preview;
    } catch (error) {
      console.error("Errore anteprima PDF materiali consegnati NEXT:", error);
      window.alert("Impossibile generare l'anteprima PDF.");
      return null;
    }
  };

  const buildPreviewShareText = () =>
    buildPdfShareMessage({
      contextLabel: pdfShareContext || "Materiali consegnati",
      fileName: pdfPreviewFileName || "materiali-consegnati.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    const blob = pdfPreviewBlob;
    const fileName = pdfPreviewFileName || "materiali-consegnati.pdf";

    if (!blob) {
      setPdfShareHint("Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob,
      fileName,
      title: pdfPreviewTitle || "Anteprima PDF",
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

  const exportPDFPerDestinatario = async (destRefId: string) => {
    const payload = buildPdfPayloadPerDestinatario(destRefId);
    if (!payload.rows.length) {
      window.alert("Nessun materiale consegnato per questo destinatario.");
      return;
    }
    await generateSmartPDF(payload);
  };

  const previewPDFPerDestinatario = async (destRefId: string) => {
    const payload = buildPdfPayloadPerDestinatario(destRefId);
    if (!payload.rows.length) {
      window.alert("Nessun materiale consegnato per questo destinatario.");
      return;
    }
    const preview = await ensurePdfPreviewReady({
      source: async () => generateSmartPDFBlob(payload),
      fileName: `materiali-consegnati-${payload.destLabel || "destinatario"}.pdf`,
      title: `Anteprima PDF - ${payload.destLabel || "Destinatario"}`,
      contextLabel: `Materiali consegnati a ${payload.destLabel || "Destinatario"}`,
    });
    if (!preview) return;
    setPdfShareHint(null);
    setPdfPreviewOpen(true);
  };

  const exportPDFGlobale = async () => {
    const payload = buildPdfPayloadGlobale();
    if (!payload.rows.length) {
      window.alert("Nessun materiale consegnato.");
      return;
    }
    await generateSmartPDF(payload);
  };

  const previewPDFGlobale = async () => {
    const payload = buildPdfPayloadGlobale();
    if (!payload.rows.length) {
      window.alert("Nessun materiale consegnato.");
      return;
    }
    const preview = await ensurePdfPreviewReady({
      source: async () => generateSmartPDFBlob(payload),
      fileName: "storico-materiali-consegnati.pdf",
      title: "Anteprima PDF storico materiali consegnati",
      contextLabel: "Storico materiali consegnati",
    });
    if (!preview) return;
    setPdfShareHint(null);
    setPdfPreviewOpen(true);
  };

  return (
    <div className="mc-page">
      <div className="mc-card">
        <div className="mc-header">
          <div className="mc-logo-title">
            <img
              src="/logo.png"
              alt="logo"
              className="mc-logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
            />
            <div>
              <h1 className="mc-title">Materiali consegnati</h1>
              <p className="mc-subtitle">
                Movimentazioni in uscita da magazzino (colleghi / mezzi)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="mc-pdf-global-btn"
              type="button"
              onClick={() => void previewPDFGlobale()}
              style={{ background: "#2d6a4f", color: "#fdfaf4" }}
            >
              Anteprima PDF
            </button>
            <button
              className="mc-pdf-global-btn"
              type="button"
              onClick={() => void exportPDFGlobale()}
            >
              Scarica PDF
            </button>
          </div>
        </div>

        <div className="mc-form">
          <label className="mc-label">
            Destinatario (mezzo / collega / MAGAZZINO)
            <input
              type="text"
              className="mc-input"
              value={destinatarioInput}
              readOnly={Boolean(destinatarioObj)}
              onChange={(event) => {
                setDestinatarioInput(event.target.value);
                setDestinatarioObj(null);
              }}
              placeholder="Es. MARIO ROSSI / TI 315407 / MAGAZZINO"
            />
          </label>

          {destinatarioObj ? (
            <button
              type="button"
              className="mc-add-btn"
              style={{
                marginTop: "4px",
                marginBottom: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
              }}
              onClick={handleResetDestinatario}
            >
              Cambia destinatario
            </button>
          ) : null}

          {!destinatarioObj &&
          destinatarioInput.trim().length > 0 &&
          destSuggestions.length > 0 ? (
            <div
              style={{
                backgroundColor: "#f8f4e8",
                border: "1px solid #d0c7b8",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                marginBottom: "12px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {destSuggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.refId}`}
                  type="button"
                  onClick={() => handleSelectDestSuggestion(suggestion)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.backgroundColor = "#e9dfcf";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{suggestion.label}</div>
                  {suggestion.extra ? (
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {suggestion.extra}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          <label className="mc-label">
            Descrizione materiale
            <input
              type="text"
              className="mc-input"
              value={descrizione}
              readOnly={Boolean(materialeSelezionato)}
              onChange={(event) => {
                setDescrizione(event.target.value);
                setMaterialeSelezionato(null);
              }}
              placeholder="Es. TUBO 40MM"
            />
          </label>

          {materialeSelezionato ? (
            <button
              type="button"
              className="mc-add-btn"
              style={{
                marginTop: "4px",
                marginBottom: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
              }}
              onClick={handleResetMateriale}
            >
              Cambia materiale
            </button>
          ) : null}

          {!materialeSelezionato &&
          descrizione.trim().length > 0 &&
          matSuggestions.length > 0 ? (
            <div
              style={{
                backgroundColor: "#f8f4e8",
                border: "1px solid #d0c7b8",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                marginBottom: "12px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {matSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSelectMateriale(suggestion)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.backgroundColor = "#e9dfcf";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{suggestion.label}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    {formatInventoryQuantity(suggestion.quantita, suggestion.unita)} disponibili
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mc-row-inline">
            <label className="mc-label flex1">
              Quantita
              <input
                type="number"
                className="mc-input"
                value={quantita}
                onChange={(event) => setQuantita(event.target.value)}
              />
            </label>

            <label className="mc-label flex1">
              Unita
              <select
                className="mc-input"
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

          <label className="mc-label">
            Motivo consegna (opzionale)
            <input
              type="text"
              className="mc-input"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Es. Intervento manutenzione cisterna"
            />
          </label>

          <label className="mc-label">
            Data consegna
            <input
              type="text"
              className="mc-input"
              value={data}
              onChange={(event) => setData(event.target.value)}
              placeholder="gg mm aaaa"
            />
          </label>

          <button className="mc-add-btn" type="button" onClick={handleAdd}>
            Registra consegna
          </button>
        </div>

        <div className="mc-list-wrapper">
          {loading ? (
            <div className="mc-empty">Caricamento...</div>
          ) : loadError ? (
            <div className="mc-empty">{loadError}</div>
          ) : !consegne.length ? (
            <div className="mc-empty">
              Nessuna consegna registrata. Registra una nuova uscita dal magazzino.
            </div>
          ) : (
            <>
              <div className="mc-dest-list">
                {destinatari.map((dest) => (
                  <button
                    key={dest.refId}
                    className={
                      "mc-dest-row" +
                      (selectedDest === dest.refId ? " mc-dest-row-active" : "")
                    }
                    type="button"
                    onClick={() =>
                      setSelectedDest((current) =>
                        current === dest.refId ? null : dest.refId,
                      )
                    }
                  >
                    <div className="mc-dest-main">
                      <span className="mc-dest-name">{dest.label}</span>
                      <span className="mc-dest-badge">
                        Tot: {getTotalePerDestinatario(dest.refId)}
                      </span>
                    </div>
                    <div className="mc-dest-meta">
                      <span className="mc-dest-meta-text">
                        Movimenti:{" "}
                        {
                          consegne.filter(
                            (entry) => entry.destinatario.refId === dest.refId,
                          ).length
                        }
                      </span>
                      <span className="mc-dest-meta-link">Dettaglio ▾</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedDest ? (
                <div className="mc-detail-panel">
                  <div className="mc-detail-header">
                    <div>
                      <h2 className="mc-detail-title">{selectedDestLabel}</h2>
                      <p className="mc-detail-subtitle">
                        Storico materiali consegnati
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        className="mc-pdf-btn"
                        type="button"
                        onClick={() => void previewPDFPerDestinatario(selectedDest)}
                        style={{ background: "#2d6a4f", color: "#fdfaf4" }}
                      >
                        Anteprima
                      </button>
                      <button
                        className="mc-pdf-btn"
                        type="button"
                        onClick={() => void exportPDFPerDestinatario(selectedDest)}
                      >
                        Scarica PDF
                      </button>
                    </div>
                  </div>

                  <div className="mc-detail-list">
                    {consegneSelezionate.map((consegna) => (
                      <div key={consegna.id} className="mc-detail-row">
                        <div className="mc-detail-main">
                          <span className="mc-detail-date">{consegna.data}</span>
                          <span className="mc-detail-desc">
                            {consegna.descrizione} - {consegna.quantita} {consegna.unita}
                          </span>
                          {consegna.fornitore ? (
                            <span className="mc-detail-motivo">
                              Fornitore: {consegna.fornitore}
                            </span>
                          ) : null}
                          {consegna.motivo ? (
                            <span className="mc-detail-motivo">{consegna.motivo}</span>
                          ) : null}
                        </div>
                        <button
                          className="mc-delete-btn"
                          type="button"
                          onClick={() => handleDeleteConsegna(consegna.id)}
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

        <PdfPreviewModal
          open={pdfPreviewOpen}
          title={pdfPreviewTitle}
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
}
