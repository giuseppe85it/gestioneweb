import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/IA/IADocumenti.css";
import { readNextIaConfigSnapshot } from "./domain/nextIaConfigDomain";
import {
  readNextIADocumentiArchiveSnapshot,
  type NextIADocumentiArchiveItem,
} from "./domain/nextDocumentiCostiDomain";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
} from "./nextAnagraficheFlottaDomain";

type TipoDocumento = "PREVENTIVO" | "FATTURA" | "MAGAZZINO" | "GENERICO" | "";
type CategoriaArchivio = "MEZZO" | "MAGAZZINO" | "GENERICO";
type Currency = "EUR" | "CHF" | "UNKNOWN";

type VoceDocumento = {
  descrizione?: string;
  quantita?: string;
  prezzoUnitario?: string;
  importo?: string;
};

type DocumentoAnalizzato = {
  tipoDocumento: TipoDocumento;
  categoriaArchivio: CategoriaArchivio;
  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;
  targa: string;
  marca: string;
  modello: string;
  telaio: string;
  km: string;
  riferimentoPreventivoNumero: string;
  riferimentoPreventivoData: string;
  imponibile: string;
  ivaPercentuale: string;
  ivaImporto: string;
  totaleDocumento: string;
  iban: string;
  beneficiario: string;
  riferimentoPagamento: string;
  banca: string;
  importoPagamento: string;
  testo: string;
  voci: VoceDocumento[];
};

function buildEmptyResults(categoriaArchivio: CategoriaArchivio): DocumentoAnalizzato {
  return {
    tipoDocumento: "",
    categoriaArchivio,
    fornitore: "",
    numeroDocumento: "",
    dataDocumento: "",
    targa: "",
    marca: "",
    modello: "",
    telaio: "",
    km: "",
    riferimentoPreventivoNumero: "",
    riferimentoPreventivoData: "",
    imponibile: "",
    ivaPercentuale: "",
    ivaImporto: "",
    totaleDocumento: "",
    iban: "",
    beneficiario: "",
    riferimentoPagamento: "",
    banca: "",
    importoPagamento: "",
    testo: "",
    voci: [],
  };
}

function fmtTarga(value?: unknown) {
  return typeof value === "string" ? value.toUpperCase().replace(/\s+/g, " ").trim() : "";
}

function exactMatch(estratta?: unknown, listaMezzi: NextMezzoListItem[] = []) {
  const targa = fmtTarga(estratta);
  if (!targa) return null;
  return listaMezzi.find((mezzo) => fmtTarga(mezzo.targa) === targa) ?? null;
}

function formatImporto(value?: string | number | null) {
  if (value == null || value === "") return "-";
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  const raw = String(value).trim();
  return raw || "-";
}

function updateResultsField(
  current: DocumentoAnalizzato | null,
  patch: Partial<DocumentoAnalizzato>,
): DocumentoAnalizzato | null {
  if (!current) return current;
  return { ...current, ...patch };
}

export default function NextIADocumentiPage() {
  const navigate = useNavigate();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoArchivio, setTipoArchivio] = useState<CategoriaArchivio>("GENERICO");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DocumentoAnalizzato | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mezzi, setMezzi] = useState<NextMezzoListItem[]>([]);
  const [targaEstrattaIA, setTargaEstrattaIA] = useState("");
  const [targaSelezionata, setTargaSelezionata] = useState("");
  const [sectionsOpen, setSectionsOpen] = useState({
    documento: true,
    mezzo: false,
    voci: false,
    pagamento: false,
  });
  const [documentiLista, setDocumentiLista] = useState<NextIADocumentiArchiveItem[]>([]);
  const [documentiLoading, setDocumentiLoading] = useState(false);
  const [documentiError, setDocumentiError] = useState<string | null>(null);
  const [valutaModalDoc, setValutaModalDoc] = useState<NextIADocumentiArchiveItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadApiKey = async () => {
      try {
        const snapshot = await readNextIaConfigSnapshot();
        if (!cancelled) {
          setApiKeyExists(snapshot.apiKeyConfigured);
        }
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
    let cancelled = false;

    const loadArchive = async () => {
      try {
        setDocumentiLoading(true);
        setDocumentiError(null);

        const [mezziSnapshot, archiveSnapshot] = await Promise.all([
          readNextAnagraficheFlottaSnapshot({ includeClonePatches: false }),
          readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false }),
        ]);

        if (cancelled) return;

        setMezzi(mezziSnapshot.items);
        setDocumentiLista(archiveSnapshot.items);
      } catch (error) {
        console.error("Errore caricamento archivio documenti IA clone:", error);
        if (!cancelled) {
          setDocumentiError("Errore caricamento documenti.");
          setMezzi([]);
          setDocumentiLista([]);
        }
      } finally {
        if (!cancelled) {
          setDocumentiLoading(false);
        }
      }
    };

    void loadArchive();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTargaCandidate = useMemo(() => {
    return fmtTarga(targaSelezionata || results?.targa || targaEstrattaIA);
  }, [results?.targa, targaEstrattaIA, targaSelezionata]);

  const matchedMezzo = useMemo(() => {
    return exactMatch(currentTargaCandidate, mezzi);
  }, [currentTargaCandidate, mezzi]);

  const needsManualTarga = Boolean(currentTargaCandidate) && !matchedMezzo;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setResults(null);
    setTargaEstrattaIA("");
    setTargaSelezionata("");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
      return;
    }

    setPreview(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica un file prima.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setResults(buildEmptyResults(tipoArchivio));
      setTargaEstrattaIA("");
      setTargaSelezionata("");
      setErrorMessage(
        "Clone read-only: Analizza con IA resta visibile come nella madre, ma non invia il file al servizio IA.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || !selectedFile) {
      setErrorMessage("Nessun risultato o file mancante.");
      return;
    }

    if (currentTargaCandidate && !matchedMezzo && !targaSelezionata) {
      setErrorMessage("Targa non valida o non trovata nei mezzi. Seleziona manualmente il mezzo corretto.");
      return;
    }

    setErrorMessage(
      "Clone read-only: Salva Documento resta visibile come nella madre, ma non carica file su Storage e non salva su Firestore.",
    );
  };

  const handleOpenPdf = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSetValuta = (currency: Currency) => {
    setValutaModalDoc(null);
    setErrorMessage(
      `Clone read-only: Imposta valuta (${currency}) resta visibile come nella madre, ma non aggiorna il documento reale.`,
    );
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (apiKeyExists === false) {
    return (
      <div className="iadoc-page">
        <div className="iadoc-shell">
          <div className="iadoc-panel ia-state-card">
            <span className="ia-state-title">API Key IA mancante</span>
            <p className="ia-state-text">
              Inserisci la tua chiave Gemini per usare i documenti IA.
            </p>
            <button
              type="button"
              className="ia-btn primary"
              onClick={() => navigate("/next/ia/apikey")}
            >
              Vai alla pagina API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (apiKeyExists === null) {
    return <div className="iadoc-loading">Caricamento...</div>;
  }

  return (
    <div className="iadoc-page">
      <div className="iadoc-shell">
        <div className="ia-page-head">
          <div>
            <span className="ia-kicker">Intelligenza artificiale</span>
            <h1 className="iadoc-title">Documenti IA</h1>
            <p className="ia-subtitle">
              Carica un documento, analizzalo con IA e verifica i campi prima di salvare.
            </p>
          </div>
          <div className="ia-steps">
            <span>1 Carica</span>
            <span>2 Analizza</span>
            <span>3 Verifica</span>
            <span>4 Salva</span>
          </div>
        </div>

        <div className="iadoc-grid">
          <div className="iadoc-panel">
            <div className="ia-panel-head">
              <h2>Caricamento</h2>
              <span>Seleziona categoria e carica il file da analizzare.</span>
            </div>

            <div className="iadoc-field">
              <label>Categoria archivio</label>
              <select
                className="iadoc-select"
                value={tipoArchivio}
                onChange={(event) => setTipoArchivio(event.target.value as CategoriaArchivio)}
              >
                <option value="GENERICO">Generico</option>
                <option value="MEZZO">Mezzo</option>
                <option value="MAGAZZINO">Magazzino</option>
              </select>
            </div>

            <label className="upload-label">
              Carica PDF o Immagine
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} />
            </label>

            {errorMessage ? <div className="iadoc-error">{errorMessage}</div> : null}

            <button
              type="button"
              className="ia-btn primary"
              disabled={!selectedFile || loading}
              onClick={() => {
                void handleAnalyze();
              }}
            >
              {loading ? "Analisi..." : "Analizza con IA"}
            </button>
          </div>

          <div className="iadoc-panel">
            <div className="ia-panel-head">
              <h2>Anteprima e risultati</h2>
              <span>Controlla le informazioni estratte prima di salvare.</span>
            </div>

            {preview ? (
              <img src={preview} alt="preview" className="iadoc-preview" />
            ) : (
              <div className="iadoc-empty">Nessuna anteprima disponibile.</div>
            )}

            {results ? (
              <div className="iadoc-results">
                <h2>Risultati analisi</h2>
                <div className="iadoc-empty">
                  Nel clone read-only l&apos;analisi resta visibile come nella madre, ma non invia
                  il file al backend IA e non genera estrazioni automatiche persistenti.
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("documento")}
                  >
                    <span>Dati documento</span>
                    <span
                      className={`iadoc-toggle-icon ${sectionsOpen.documento ? "open" : ""}`}
                    >
                      {sectionsOpen.documento ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.documento ? (
                    <div className="iadoc-section-body">
                      <label>Tipo documento</label>
                      <input
                        value={results.tipoDocumento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, {
                              tipoDocumento: event.target.value as TipoDocumento,
                            }),
                          )
                        }
                      />

                      <label>Fornitore</label>
                      <input
                        value={results.fornitore}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { fornitore: event.target.value }),
                          )
                        }
                      />

                      <label>Numero documento</label>
                      <input
                        value={results.numeroDocumento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { numeroDocumento: event.target.value }),
                          )
                        }
                      />

                      <label>Data documento</label>
                      <input
                        value={results.dataDocumento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { dataDocumento: event.target.value }),
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("mezzo")}
                  >
                    <span>Dati mezzo</span>
                    <span className={`iadoc-toggle-icon ${sectionsOpen.mezzo ? "open" : ""}`}>
                      {sectionsOpen.mezzo ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.mezzo ? (
                    <div className="iadoc-section-body">
                      <label>Targa</label>
                      <input
                        value={results.targa}
                        onChange={(event) => {
                          const value = event.target.value;
                          setResults((current) => updateResultsField(current, { targa: value }));
                          setTargaEstrattaIA(value);
                        }}
                      />

                      {matchedMezzo ? (
                        <div className="iadoc-targa-ok">
                          Targa riconosciuta: {matchedMezzo.targa || currentTargaCandidate}
                        </div>
                      ) : null}

                      {needsManualTarga ? (
                        <div className="iadoc-targa-verify">
                          <span className="iadoc-badge-warn">DA VERIFICARE</span>
                          <label>Seleziona targa mezzo</label>
                          <select
                            className="iadoc-select"
                            value={targaSelezionata}
                            onChange={(event) => {
                              const value = event.target.value;
                              setTargaSelezionata(value);
                              setResults((current) => updateResultsField(current, { targa: value }));
                            }}
                          >
                            <option value="">Seleziona targa...</option>
                            {mezzi.map((mezzo, index) => (
                              <option key={`${mezzo.targa}_${index}`} value={mezzo.targa}>
                                {mezzo.targa || "-"}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      <label>Marca</label>
                      <input
                        value={results.marca}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { marca: event.target.value }),
                          )
                        }
                      />

                      <label>Modello</label>
                      <input
                        value={results.modello}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { modello: event.target.value }),
                          )
                        }
                      />

                      <label>Telaio</label>
                      <input
                        value={results.telaio}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { telaio: event.target.value }),
                          )
                        }
                      />

                      <label>KM</label>
                      <input
                        value={results.km}
                        onChange={(event) =>
                          setResults((current) => updateResultsField(current, { km: event.target.value }))
                        }
                      />
                    </div>
                  ) : null}
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("pagamento")}
                  >
                    <span>Pagamento</span>
                    <span
                      className={`iadoc-toggle-icon ${sectionsOpen.pagamento ? "open" : ""}`}
                    >
                      {sectionsOpen.pagamento ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.pagamento ? (
                    <div className="iadoc-section-body">
                      <label>Numero preventivo</label>
                      <input
                        value={results.riferimentoPreventivoNumero}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, {
                              riferimentoPreventivoNumero: event.target.value,
                            }),
                          )
                        }
                      />

                      <label>Data preventivo</label>
                      <input
                        value={results.riferimentoPreventivoData}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, {
                              riferimentoPreventivoData: event.target.value,
                            }),
                          )
                        }
                      />

                      <label>Imponibile</label>
                      <input
                        value={results.imponibile}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { imponibile: event.target.value }),
                          )
                        }
                      />

                      <label>IVA %</label>
                      <input
                        value={results.ivaPercentuale}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { ivaPercentuale: event.target.value }),
                          )
                        }
                      />

                      <label>IVA importo</label>
                      <input
                        value={results.ivaImporto}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { ivaImporto: event.target.value }),
                          )
                        }
                      />

                      <label>Totale documento</label>
                      <input
                        value={results.totaleDocumento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { totaleDocumento: event.target.value }),
                          )
                        }
                      />

                      <label>IBAN</label>
                      <input
                        value={results.iban}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { iban: event.target.value }),
                          )
                        }
                      />

                      <label>Beneficiario</label>
                      <input
                        value={results.beneficiario}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { beneficiario: event.target.value }),
                          )
                        }
                      />

                      <label>Riferimento pagamento</label>
                      <input
                        value={results.riferimentoPagamento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, {
                              riferimentoPagamento: event.target.value,
                            }),
                          )
                        }
                      />

                      <label>Banca</label>
                      <input
                        value={results.banca}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { banca: event.target.value }),
                          )
                        }
                      />

                      <label>Importo pagamento</label>
                      <input
                        value={results.importoPagamento}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { importoPagamento: event.target.value }),
                          )
                        }
                      />

                      <label>Testo / Note</label>
                      <textarea
                        className="iadoc-textarea"
                        value={results.testo}
                        onChange={(event) =>
                          setResults((current) =>
                            updateResultsField(current, { testo: event.target.value }),
                          )
                        }
                      />

                      <label>Categoria archivio</label>
                      <input value={results.categoriaArchivio} disabled />
                    </div>
                  ) : null}
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("voci")}
                  >
                    <span>Voci</span>
                    <span className={`iadoc-toggle-icon ${sectionsOpen.voci ? "open" : ""}`}>
                      {sectionsOpen.voci ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.voci ? (
                    <div className="iadoc-section-body">
                      {results.voci.length > 0 ? (
                        <>
                          <h3>Voci documento</h3>
                          {results.voci.map((voce, index) => (
                            <div key={index} className="iadoc-voce-row">
                              <input placeholder="Descrizione" value={voce.descrizione || ""} readOnly />
                              <input placeholder="Quantità" value={voce.quantita || ""} readOnly />
                              <input placeholder="Prezzo unitario" value={voce.prezzoUnitario || ""} readOnly />
                              <input placeholder="Importo" value={voce.importo || ""} readOnly />
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="iadoc-empty">Nessuna voce disponibile.</div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="iadoc-actions">
                  <button
                    type="button"
                    className="ia-btn primary"
                    onClick={() => {
                      void handleSave();
                    }}
                    disabled={loading || (needsManualTarga && !targaSelezionata)}
                  >
                    Salva Documento
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="iadoc-panel iadoc-docs-panel">
          <div className="ia-panel-head">
            <h2>Documenti IA salvati</h2>
            <span>Gestisci la valuta e apri i PDF originali.</span>
          </div>

          {documentiLoading ? <div className="iadoc-empty">Caricamento documenti...</div> : null}
          {documentiError && !documentiLoading ? (
            <div className="iadoc-error">{documentiError}</div>
          ) : null}

          {!documentiLoading && !documentiError && documentiLista.length === 0 ? (
            <div className="iadoc-empty">Nessun documento salvato.</div>
          ) : null}

          {!documentiLoading && !documentiError && documentiLista.length > 0 ? (
            <div className="iadoc-docs-list">
              {documentiLista.map((docItem) => {
                const needsVerify = docItem.valuta === "UNKNOWN";
                return (
                  <div key={docItem.id} className="iadoc-docs-item">
                    <div className="iadoc-docs-main">
                      <div className="iadoc-docs-title">
                        {docItem.tipoDocumento || "Documento"}
                      </div>
                      <div className="iadoc-docs-meta">
                        <span>Targa: {docItem.targa || "-"}</span>
                        <span>Data: {docItem.dataDocumento || "-"}</span>
                        <span>Totale: {formatImporto(docItem.totaleDocumento)}</span>
                      </div>
                      <div className="iadoc-docs-meta">
                        <span>Fornitore: {docItem.fornitore || "-"}</span>
                        <span>Valuta: {docItem.valuta}</span>
                        {needsVerify ? (
                          <button
                            type="button"
                            className="iadoc-badge-verify"
                            onClick={() => setValutaModalDoc(docItem)}
                          >
                            VALUTA DA VERIFICARE
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="iadoc-docs-actions">
                      {docItem.fileUrl ? (
                        <button
                          type="button"
                          className="ia-btn outline"
                          onClick={() => handleOpenPdf(docItem.fileUrl)}
                        >
                          APRI PDF
                        </button>
                      ) : (
                        <span className="iadoc-empty">Nessun PDF</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {valutaModalDoc ? (
        <div className="iadoc-modal-overlay" onClick={() => setValutaModalDoc(null)}>
          <div className="iadoc-modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Imposta valuta</h3>
            <div className="iadoc-modal-meta">
              <span>Targa: {valutaModalDoc.targa || "-"}</span>
              <span>Data: {valutaModalDoc.dataDocumento || "-"}</span>
              <span>Totale: {formatImporto(valutaModalDoc.totaleDocumento)}</span>
            </div>
            <div className="iadoc-modal-actions">
              <button type="button" className="ia-btn" onClick={() => handleSetValuta("EUR")}>
                EUR
              </button>
              <button type="button" className="ia-btn" onClick={() => handleSetValuta("CHF")}>
                CHF
              </button>
              <button
                type="button"
                className="ia-btn outline"
                onClick={() => setValutaModalDoc(null)}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
