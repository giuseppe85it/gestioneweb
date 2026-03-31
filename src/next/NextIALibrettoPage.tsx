import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/IA/IALibretto.css";
import { readNextIaConfigSnapshot } from "./domain/nextIaConfigDomain";
import {
  readNextIaLibrettoArchiveSnapshot,
  type NextIaLibrettoArchiveItem,
} from "./domain/nextIaLibrettoDomain";

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

type ArchiveGroup = {
  targa: string;
  items: Array<{
    fotoUrl: string;
    pdfUrl: string | null;
    label: string;
  }>;
};

export default function NextIALibrettoPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisBlocked, setAnalysisBlocked] = useState(false);
  const [archiveItems, setArchiveItems] = useState<NextIaLibrettoArchiveItem[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState("");
  const archiveRef = useRef<HTMLDivElement | null>(null);
  const openHandledRef = useRef(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTarga, setViewerTarga] = useState<string | null>(null);
  const [viewerRotate, setViewerRotate] = useState(0);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const openViewer = (url: string, targa?: string | null) => {
    setViewerUrl(url);
    setViewerTarga(targa ? normalizeTarga(targa) : null);
    setViewerRotate(0);
    setViewerZoom(1);
    setViewerError(null);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerError(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadApiKey = async () => {
      try {
        const snapshot = await readNextIaConfigSnapshot();
        if (cancelled) return;
        setApiKeyExists(snapshot.apiKeyConfigured);
      } catch (error) {
        console.error("Errore lettura API Key Gemini clone:", error);
        if (!cancelled) {
          setApiKeyExists(false);
        }
      }
    };

    void loadApiKey();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targaParam = params.get("targa");
    if (targaParam) setArchiveFilter(targaParam);
    if (params.get("archive")) {
      setTimeout(() => {
        archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    let alive = true;

    const loadArchive = async () => {
      try {
        setArchiveLoading(true);
        setArchiveError(null);

        const snapshot = await readNextIaLibrettoArchiveSnapshot();
        if (!alive) return;
        setArchiveItems(snapshot.items);
      } catch (error) {
        if (!alive) return;
        console.error("Errore caricamento archivio libretti clone:", error);
        setArchiveError("Errore caricamento archivio libretti.");
      } finally {
        if (alive) setArchiveLoading(false);
      }
    };

    void loadArchive();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("open") !== "1") {
      openHandledRef.current = false;
      return;
    }
    if (openHandledRef.current) return;

    const urlParam = params.get("url");
    const targaParam = params.get("targa");

    if (urlParam) {
      openViewer(urlParam, targaParam);
      openHandledRef.current = true;
      return;
    }

    if (targaParam && archiveItems.length > 0) {
      const target = normalizeTarga(targaParam);
      const item = archiveItems.find((entry) => entry.targa === target && Boolean(entry.librettoUrl));
      if (item?.librettoUrl) {
        openViewer(item.librettoUrl, target);
        openHandledRef.current = true;
      }
    }
  }, [archiveItems, location.search]);

  const archiveGroups = useMemo<ArchiveGroup[]>(() => {
    const key = normalizeTarga(archiveFilter);
    const groups = new Map<string, ArchiveGroup["items"]>();

    archiveItems.forEach((item) => {
      if (key && !item.targa.includes(key)) return;
      const items = groups.get(item.targa) ?? [];
      items.push({
        fotoUrl: item.librettoUrl,
        pdfUrl: null,
        label: item.label,
      });
      groups.set(item.targa, items);
    });

    return Array.from(groups.entries())
      .map(([targa, items]) => ({ targa, items }))
      .sort((left, right) => left.targa.localeCompare(right.targa, "it", { sensitivity: "base" }));
  }, [archiveFilter, archiveItems]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Carica solo immagini (JPG o PNG).");
      setSelectedFile(null);
      setPreview(null);
      setAnalysisBlocked(false);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setAnalysisBlocked(false);

    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica una foto prima di analizzare.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setAnalysisBlocked(true);
      setErrorMessage(
        "Clone read-only: Analizza con IA resta visibile come nella madre, ma non invia file al servizio IA.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysisBlocked) {
      setErrorMessage("Nessun dato valido da salvare.");
      return;
    }

    setErrorMessage(
      "Clone read-only: Salva nei documenti del mezzo resta visibile come nella madre, ma non aggiorna l'archivio mezzi.",
    );
  };

  if (apiKeyExists === null) {
    return (
      <div className="ialibretto-page">
        <div className="ialibretto-shell">
          <div className="ialibretto-panel ia-state-card">
            <div className="ia-state-title">Caricamento...</div>
          </div>
        </div>
      </div>
    );
  }

  if (apiKeyExists === false) {
    return (
      <div className="ialibretto-page">
        <div className="ialibretto-shell">
          <div className="ialibretto-panel ia-state-card">
            <div className="ia-state-title">API Key IA mancante</div>
            <p className="ia-state-text">
              Prima di usare questa funzione devi inserire la tua chiave Gemini.
            </p>
            <button className="ia-btn primary" onClick={() => navigate("/next/ia/apikey")}>
              Vai a API Key IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ialibretto-page">
      <div className="ialibretto-shell">
        <header className="ia-page-head">
          <div>
            <div className="ia-kicker">Modulo IA</div>
            <h1 className="ialibretto-title">Estrazione Libretto Mezzo</h1>
            <p className="ia-subtitle">
              Carica una foto, analizza con IA e verifica i dati estratti.
            </p>
          </div>
          <div className="ia-steps">
            <span>1 Carica</span>
            <span>2 Analizza</span>
            <span>3 Verifica</span>
            <span>4 Salva</span>
          </div>
        </header>

        <div className="ialibretto-grid">
          <div className="ialibretto-panel">
            <div className="ia-panel-head">
              <h2>Caricamento libretto</h2>
              <span>JPG o PNG, foto nitida</span>
            </div>

            <label className="upload-label">
              Carica foto del libretto
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>

            {errorMessage ? <div className="ialibretto-error">{errorMessage}</div> : null}

            <button
              className="ia-btn primary"
              onClick={() => {
                void handleAnalyze();
              }}
              disabled={!selectedFile || loading}
            >
              {loading ? "Analisi in corso..." : "Analizza con IA"}
            </button>

            <button className="ia-btn outline" onClick={() => navigate("/next/ia")}>
              Torna al menu IA
            </button>
          </div>

          <div className="ialibretto-panel">
            <div className="ia-panel-head">
              <h2>Anteprima e risultati</h2>
              <span>Verifica e correggi prima di salvare</span>
            </div>

            {preview ? (
              <img src={preview} className="ialibretto-preview" alt="preview" />
            ) : (
              <div className="ialibretto-empty">Nessuna anteprima</div>
            )}

            {analysisBlocked ? (
              <div className="ialibretto-results">
                <h2>Dati estratti</h2>
                <div className="ialibretto-empty">
                  Nel clone read-only l&apos;analisi resta visibile come nella madre, ma non invia
                  la foto al backend IA e non genera nuovi campi editabili.
                </div>
                <button className="ia-btn primary" type="button" onClick={handleSave}>
                  Salva nei documenti del mezzo
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div ref={archiveRef} className="ialibretto-panel">
          <div className="ia-panel-head">
            <h2>Archivio libretti IA</h2>
            <span>Libretti salvati in precedenza, raggruppati per targa.</span>
          </div>

          <div className="ialibretto-field">
            <label>Filtra per targa</label>
            <input
              value={archiveFilter}
              onChange={(event) => setArchiveFilter(event.target.value)}
              placeholder="Inserisci targa..."
            />
          </div>

          {archiveLoading ? (
            <div className="ialibretto-empty">Caricamento archivio...</div>
          ) : archiveError ? (
            <div className="ialibretto-error">{archiveError}</div>
          ) : archiveGroups.length === 0 ? (
            <div className="ialibretto-empty">Nessun libretto trovato.</div>
          ) : (
            archiveGroups.map((group) => (
              <div key={group.targa} className="ialibretto-results">
                <h2>{group.targa}</h2>
                {group.items.map((item, index) => (
                  <div
                    key={`${group.targa}_${index}`}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 700 }}>Libretto {index + 1}</div>
                      <div style={{ fontSize: 12, color: "#4a646b" }}>{item.label}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Foto: {item.fotoUrl ? "Si" : "No"}</span>
                      <span>PDF: {item.pdfUrl ? "Si" : "No"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="ia-btn outline"
                        type="button"
                        disabled={!item.fotoUrl}
                        onClick={() => item.fotoUrl && openViewer(item.fotoUrl, group.targa)}
                      >
                        Apri Foto
                      </button>
                      <button
                        className="ia-btn outline"
                        type="button"
                        disabled={!item.pdfUrl}
                        onClick={() => item.pdfUrl && window.open(item.pdfUrl, "_blank", "noopener")}
                      >
                        Apri PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {viewerOpen && viewerUrl ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              zIndex: 9999,
            }}
            onClick={closeViewer}
          >
            <div
              className="ialibretto-panel"
              style={{ maxWidth: 980, width: "100%", maxHeight: "90vh" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="ia-panel-head"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h2>Viewer libretto</h2>
                <button className="ia-btn outline" type="button" onClick={closeViewer}>
                  Chiudi
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button
                  className="ia-btn outline"
                  type="button"
                  onClick={() => setViewerRotate((degrees) => (degrees + 90) % 360)}
                >
                  Ruota 90 gradi
                </button>
                <button
                  className="ia-btn outline"
                  type="button"
                  onClick={() => {
                    setViewerRotate(0);
                    setViewerZoom(1);
                  }}
                >
                  Reset
                </button>
                <button
                  className="ia-btn outline"
                  type="button"
                  onClick={() =>
                    setViewerZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))
                  }
                >
                  Zoom +
                </button>
                <button
                  className="ia-btn outline"
                  type="button"
                  onClick={() =>
                    setViewerZoom((zoom) => Math.max(0.5, Number((zoom - 0.25).toFixed(2))))
                  }
                >
                  Zoom -
                </button>
              </div>

              {viewerError ? (
                <div className="ialibretto-error">
                  <div>Impossibile caricare la foto.</div>
                  {viewerTarga ? (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="ia-btn outline"
                        type="button"
                        onClick={() => {
                          navigate(
                            `/next/ia/libretto?archive=1&targa=${encodeURIComponent(viewerTarga)}`,
                          );
                        }}
                      >
                        Cerca in Archivio IA
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: 14,
                    padding: 12,
                    background: "#fff",
                    maxHeight: "70vh",
                    overflow: "auto",
                  }}
                >
                  <img
                    src={viewerUrl}
                    alt="Libretto"
                    onError={() => setViewerError("Impossibile caricare la foto.")}
                    style={{
                      transform: `rotate(${viewerRotate}deg) scale(${viewerZoom})`,
                      transformOrigin: "center center",
                      display: "block",
                      margin: "0 auto",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
