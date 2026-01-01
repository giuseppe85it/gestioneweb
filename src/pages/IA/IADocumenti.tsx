// src/pages/IA/IADocumenti.tsx

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./IADocumenti.css";

// ⇨ integrazione con inventario (@inventario)
import { getItemSync, setItemSync } from "../../utils/storageSync";

// =======================================================
// TIPI DI BASE DOCUMENTI IA
// =======================================================

type TipoDocumento = "PREVENTIVO" | "FATTURA" | "MAGAZZINO" | "GENERICO";
type CategoriaArchivio = "MEZZO" | "MAGAZZINO" | "GENERICO";

interface VoceDocumento {
  codice?: string;
  descrizione?: string;
  categoria?: string; // es. "MANODOPERA", "RICAMBIO", "TASSA"
  quantita?: string;
  prezzoUnitario?: string;
  scontoPercentuale?: string;
  importo?: string;
}

interface DocumentoAnalizzato {
  tipoDocumento: TipoDocumento;
  categoriaArchivio: CategoriaArchivio;

  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;

  // Dati mezzo
  targa?: string;
  marca?: string;
  modello?: string;
  telaio?: string;
  km?: string;

  // Collegamento a preventivo
  riferimentoPreventivoNumero?: string;
  riferimentoPreventivoData?: string;

  // Totali documento
  imponibile?: string;
  ivaPercentuale?: string;
  ivaImporto?: string;
  totaleDocumento?: string;

  // Voci di dettaglio
  voci?: VoceDocumento[];

  // Pagamento
  iban?: string;
  beneficiario?: string;
  riferimentoPagamento?: string;
  banca?: string;
  importoPagamento?: string;

  // Testo generico
  testo?: string;
}

interface MezzoDoc {
  targa?: string;
}

// =======================================================
// TIPI E COSTANTI PER INVENTARIO (allineati a Inventario.tsx)
// =======================================================

interface InventarioItem {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  fornitore?: string | null;
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
}

const INVENTARIO_KEY = "@inventario";

// stessa logica di generateId usata in Inventario.tsx
const generateInventarioId = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

// =======================================================
// COMPONENTE PRINCIPALE IADocumenti
// =======================================================

const IADocumenti: React.FC = () => {
  const navigate = useNavigate();

  // ---------------------------------------------------
  // STATE DI BASE
  // ---------------------------------------------------
  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoArchivio, setTipoArchivio] =
    useState<CategoriaArchivio>("GENERICO");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DocumentoAnalizzato | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mezzi, setMezzi] = useState<MezzoDoc[]>([]);
  const [targaEstrattaIA, setTargaEstrattaIA] = useState<string>("");
  const [targaSelezionata, setTargaSelezionata] = useState<string>("");
  const [sectionsOpen, setSectionsOpen] = useState({
    documento: true,
    mezzo: false,
    voci: false,
    pagamento: false,
  });

  // flag per sapere se il documento è stato salvato su Firestore
  const [documentSaved, setDocumentSaved] = useState(false);

  // flag specifico per l’importazione materiali in inventario
  const [importingInventario, setImportingInventario] = useState(false);

  // ===================================================
  // CONTROLLO API KEY IA (stessa logica IAApiKey / IALibretto)
  // ===================================================
  useEffect(() => {
    const load = async () => {
      try {
        const refDoc = doc(db, "@impostazioni_app", "gemini");
        const snap = await getDoc(refDoc);
        if (!snap.exists() || !snap.data().apiKey) {
          setApiKeyExists(false);
        } else {
          setApiKeyExists(true);
        }
      } catch {
        setApiKeyExists(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadMezzi = async () => {
      try {
        const mezziRef = doc(db, "storage", "@mezzi_aziendali");
        const snap = await getDoc(mezziRef);
        const data = snap.data() || {};
        const arr = Array.isArray(data.value)
          ? data.value
          : Array.isArray(data)
          ? data
          : [];
        setMezzi(arr as MezzoDoc[]);
      } catch {
        setMezzi([]);
      }
    };
    void loadMezzi();
  }, []);

  const fmtTarga = (s?: unknown) =>
    typeof s === "string" ? s.toUpperCase().replace(/\s+/g, " ").trim() : "";

  const exactMatch = (estratta?: unknown, listaMezzi: MezzoDoc[] = []) => {
    const t = fmtTarga(estratta);
    if (!t) return null;
    return listaMezzi.find((m) => fmtTarga(m?.targa) === t) || null;
  };

  // ===================================================
  // UPLOAD FILE (PDF o IMMAGINE) + PREVIEW
  // ===================================================
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setSelectedFile(f);
    setErrorMessage(null);
    setResults(null);
    setDocumentSaved(false); // nuovo documento → azzero flag salvataggio
    setTargaEstrattaIA("");
    setTargaSelezionata("");

    // Preview solo immagini, non PDF
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  // ===================================================
  // CONVERSIONE FILE → BASE64 (senza prefisso "data:...")
  // ===================================================
  const fileToBase64 = (
    file: File
  ): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Errore lettura file"));
      reader.onload = () => {
        const res = reader.result as string;
        // res è "data:xxx/yyy;base64,AAAA..."
        const parts = res.split(",");
        if (parts.length !== 2) {
          reject(new Error("Formato base64 non valido"));
          return;
        }
        resolve({
          base64: parts[1],
          mimeType: file.type || "application/octet-stream",
        });
      };

      reader.readAsDataURL(file);
    });
  };

  // ===================================================
  // CHIAMATA CLOUD FUNCTION estrazioneDocumenti (Gemini)
  // ===================================================
  const analyzeDocumentoConIA = async (
    base64: string,
    mimeType: string
  ): Promise<any> => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64,
            mimeType: mimeType,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore HTTP:", errorText);
        throw new Error("Errore IA");
      }

      const data = await response.json();
      // Nota: manteniamo setResults(data) solo per debug/retrocompatibilità,
      // la vera struttura viene settata in handleAnalyze unendo analyzed.data
      setResults(data);
      return data;
    } catch (error) {
      console.error("Errore analisi IA documenti:", error);
      alert("Errore nell'analisi del documento.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // PULSANTE "ANALIZZA CON IA"
  // ===================================================
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica un file prima.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setResults(null);
      setDocumentSaved(false); // Nuova analisi → il documento non è ancora salvato
      setTargaEstrattaIA("");
      setTargaSelezionata("");

      const { base64, mimeType } = await fileToBase64(selectedFile);
      const analyzed = await analyzeDocumentoConIA(base64, mimeType);

      if (analyzed) {
        console.log("### DEBUG RISULTATO IA ###", analyzed);
        // uniamo i dati della IA con la categoria archivio scelta a interfaccia
        // (analyzed.data deve essere il JSON strutturato ritornato dalla Function)
        setResults({
          ...analyzed.data,
          categoriaArchivio: tipoArchivio,
        } as DocumentoAnalizzato);
        setTargaEstrattaIA(String(analyzed?.data?.targa ?? ""));
        setTargaSelezionata("");
      }
    } catch (err: any) {
      console.error("Errore analisi IA documenti:", err);
      setErrorMessage(
        err?.message || "Errore durante l'analisi del documento con IA."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // SALVATAGGIO DOCUMENTO SU FIRESTORE
  // ===================================================
  const handleSave = async () => {
    if (!results || !selectedFile) {
      setErrorMessage("Nessun risultato o file mancante.");
      return;
    }

    const matched = exactMatch(targaEstrattaIA, mezzi);
    const needsManual =
      fmtTarga(targaEstrattaIA) !== "" && !matched;

    if (needsManual && !targaSelezionata) {
      setErrorMessage("Seleziona una targa valida per salvare.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Carica il file originale (PDF/immagine) su Firebase Storage
      const storage = getStorage();
      const fileRef = ref(
        storage,
        `documenti_pdf/${Date.now()}_${selectedFile.name}`
      );
      await uploadBytes(fileRef, selectedFile);
      const fileUrl = await getDownloadURL(fileRef);

      // 2. Prepara il payload per Firestore (lasciamo inalterata la struttura esistente)
      const payload = {
        ...results,
        targa: needsManual ? targaSelezionata : results.targa,
        fileUrl,
        nomeFile: selectedFile.name,
        createdAt: serverTimestamp(),
        fonte: "IA",
        ...(needsManual
          ? {
              daVerificare: true,
              motivoVerifica: "targa_non_match",
              targaEstrattaIA: targaEstrattaIA || null,
            }
          : {}),
      };

      // 3. Seleziona la collection di destinazione in base alla categoria archivio
      //    (logica già esistente, NON modificata)
      const targetCollection =
        results.categoriaArchivio === "MEZZO"
          ? "@documenti_mezzi"
          : results.categoriaArchivio === "MAGAZZINO"
          ? "@documenti_magazzino"
          : "@documenti_generici";

      // 4. Salva il documento IA nella collection corretta
      await addDoc(collection(db, targetCollection), payload);

      // 5. Imposta flag documento salvato (serve per abilitare il bottone Importa Inventario)
      setDocumentSaved(true);

      alert("Documento salvato correttamente.");
    } catch (err: any) {
      console.error("Errore salvataggio documento:", err);
      setErrorMessage(
        err?.message || "Errore durante il salvataggio del documento."
      );
      setDocumentSaved(false);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // FUNZIONE: IMPORTA MATERIALI IN INVENTARIO DA results.voci
  // Modalità Y: se descrizione esiste → somma quantità, altrimenti crea nuovo item
  // ===================================================
  const importaInInventario = async () => {
    if (!results) {
      alert("Nessun risultato IA disponibile.");
      return;
    }

    if (results.categoriaArchivio !== "MAGAZZINO") {
      alert(
        "L'importazione in inventario è disponibile solo per documenti di MAGAZZINO."
      );
      return;
    }

    if (!results.voci || results.voci.length === 0) {
      alert("Nessuna voce di materiale trovata nel documento.");
      return;
    }

    try {
      setImportingInventario(true);

      // 1. Carica inventario corrente (stessa logica del modulo Inventario)
      const rawInventario = await getItemSync(INVENTARIO_KEY);

      let inventario: InventarioItem[] = [];

      if (Array.isArray(rawInventario)) {
        inventario = rawInventario as InventarioItem[];
      } else if (rawInventario?.value && Array.isArray(rawInventario.value)) {
        inventario = rawInventario.value as InventarioItem[];
      }

      const fornitoreDoc =
        (results.fornitore || "").toString().trim().toUpperCase() || null;

      let materialiImportati = 0;

      // 2. Per ogni voce del documento IA, prova a tradurla in materiale di magazzino
      for (const voce of results.voci) {
      // descrizione materiale
const descrRaw = (voce.descrizione || "").trim();
if (!descrRaw) continue;

// 🔥 filtro materiali NON importabili
const excludedKeywords = [
  "TRASPORTO",
  "IMBALL",
  "SPEDIZ",
  "MANODOP",
  "SERVIZ",
  "TASS",
  "IVA"
];

const descrUpperFilter = descrRaw.toUpperCase();

// se contiene una parola chiave vietata → NON importarlo
if (excludedKeywords.some(k => descrUpperFilter.includes(k))) {
  continue;
}



        // quantità blindata (string sempre valida)
const quantitaRaw = String(voce.quantita ?? "")
  .replace(",", ".")
  .trim();

const quantitaNum = Number(quantitaRaw);

// salta righe non valide
if (!quantitaRaw || Number.isNaN(quantitaNum) || quantitaNum <= 0) {
  continue;
}


        // se quantità non valida o <= 0 → salta
        if (!quantitaRaw || Number.isNaN(quantitaNum) || quantitaNum <= 0) {
          continue;
        }

        const descrUpper = descrRaw.toUpperCase();

        // 2.1 cerca se esiste già un materiale con stessa descrizione (case-insensitive)
        const existingIndex = inventario.findIndex(
          (item) =>
            item.descrizione.trim().toUpperCase() === descrUpper
        );

        if (existingIndex >= 0) {
          // aggiornamento quantità: somma al materiale esistente
          const existingItem = inventario[existingIndex];
          const nuovaQuantita = existingItem.quantita + quantitaNum;

          inventario[existingIndex] = {
            ...existingItem,
            quantita: nuovaQuantita,
            // se il materiale non aveva fornitore e questo documento lo fornisce, lo aggiorniamo
            fornitore: existingItem.fornitore || fornitoreDoc,
          };
        } else {
          // creazione nuovo materiale di inventario
          const nuovo: InventarioItem = {
            id: generateInventarioId(),
            descrizione: descrRaw,
            quantita: quantitaNum,
            // unità di default: "pz" (l'utente potrà modificarla in Inventario se necessario)
            unita: "pz",
            fornitore: fornitoreDoc,
            fotoUrl: null,
            fotoStoragePath: null,
          };

          inventario.push(nuovo);
        }

        materialiImportati += 1;
      }

      if (materialiImportati === 0) {
        alert(
          "Nessuna voce valida è stata importata in inventario (quantità nulle o descrizioni vuote)."
        );
        return;
      }

      // 3. Salva inventario aggiornato con storageSync (stessa logica di Inventario.tsx)
      await setItemSync(INVENTARIO_KEY, inventario);

      alert(
        `Materiali importati in Inventario: ${materialiImportati}. Puoi verificarli nella schermata Inventario.`
      );
    } catch (err: any) {
      console.error("Errore importazione in inventario:", err);
      alert(
        err?.message ||
          "Errore durante l'importazione dei materiali in inventario."
      );
    } finally {
      setImportingInventario(false);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ===================================================
  // RENDER: CASI SPECIALI (NESSUNA API KEY / CARICAMENTO INIT)
  // ===================================================
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
              onClick={() => navigate("/ia/apikey")}
            >
              Vai alla pagina API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (apiKeyExists === null) {
    return <div className="iadoc-loading">Caricamento…</div>;
  }

  // ===================================================
  // RENDER PRINCIPALE
  // ===================================================
  return (
    <div className="iadoc-page">
      <div className="iadoc-shell">
        <div className="ia-page-head">
          <div>
            <span className="ia-kicker">Intelligenza artificiale</span>
            <h1 className="iadoc-title">Documenti IA</h1>
            <p className="ia-subtitle">
              Carica un documento, analizzalo con IA e verifica i campi prima
              di salvare.
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
                onChange={(e) =>
                  setTipoArchivio(e.target.value as CategoriaArchivio)
                }
              >
                <option value="GENERICO">Generico</option>
                <option value="MEZZO">Mezzo</option>
                <option value="MAGAZZINO">Magazzino</option>
              </select>
            </div>

            <label className="upload-label">
              Carica PDF o Immagine
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFile}
              />
            </label>

            {errorMessage && (
              <div className="iadoc-error">{errorMessage}</div>
            )}

            <button
              type="button"
              className="ia-btn primary"
              disabled={!selectedFile || loading}
              onClick={handleAnalyze}
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
              <div className="iadoc-empty">
                Nessuna anteprima disponibile.
              </div>
            )}

            {/* RISULTATI IA */}
            {results && (
              <div className="iadoc-results">
                <h2>Risultati analisi</h2>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("documento")}
                  >
                    <span>Dati documento</span>
                    <span
                      className={`iadoc-toggle-icon ${
                        sectionsOpen.documento ? "open" : ""
                      }`}
                    >
                      {sectionsOpen.documento ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.documento && (
                    <div className="iadoc-section-body">

            {/* Dati documento */}
            <label>Tipo documento</label>
            <input
              value={results.tipoDocumento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  tipoDocumento: e.target.value as TipoDocumento,
                })
              }
            />

            <label>Fornitore</label>
            <input
              value={results.fornitore || ""}
              onChange={(e) =>
                setResults({ ...results, fornitore: e.target.value })
              }
            />

            <label>Numero documento</label>
            <input
              value={results.numeroDocumento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  numeroDocumento: e.target.value,
                })
              }
            />

            <label>Data documento</label>
            <input
              value={results.dataDocumento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  dataDocumento: e.target.value,
                })
              }
            />

                    </div>
                  )}
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("mezzo")}
                  >
                    <span>Dati mezzo</span>
                    <span
                      className={`iadoc-toggle-icon ${
                        sectionsOpen.mezzo ? "open" : ""
                      }`}
                    >
                      {sectionsOpen.mezzo ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.mezzo && (
                    <div className="iadoc-section-body">

            {/* Dati mezzo */}
            <label>Targa</label>
            <input
              value={results.targa || ""}
              onChange={(e) =>
                setResults({ ...results, targa: e.target.value })
              }
            />
            {(() => {
              const match = exactMatch(targaEstrattaIA, mezzi);
              const needsManual =
                fmtTarga(targaEstrattaIA) !== "" && !match;

              if (match) {
                return (
                  <div className="iadoc-targa-ok">
                    Targa riconosciuta: {match.targa || targaEstrattaIA}
                  </div>
                );
              }

              if (!needsManual) return null;

              return (
                <div className="iadoc-targa-verify">
                  <span className="iadoc-badge-warn">DA VERIFICARE</span>
                  <label>Seleziona targa mezzo</label>
                  <select
                    className="iadoc-select"
                    value={targaSelezionata}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTargaSelezionata(value);
                      setResults({ ...results, targa: value });
                    }}
                  >
                    <option value="">Seleziona targa...</option>
                    {mezzi.map((m, idx) => (
                      <option key={`${m.targa || "mezzo"}_${idx}`} value={m.targa || ""}>
                        {m.targa || "—"}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            <label>Marca</label>
            <input
              value={results.marca || ""}
              onChange={(e) =>
                setResults({ ...results, marca: e.target.value })
              }
            />

            <label>Modello</label>
            <input
              value={results.modello || ""}
              onChange={(e) =>
                setResults({ ...results, modello: e.target.value })
              }
            />

            <label>Telaio</label>
            <input
              value={results.telaio || ""}
              onChange={(e) =>
                setResults({ ...results, telaio: e.target.value })
              }
            />

            <label>KM</label>
            <input
              value={results.km || ""}
              onChange={(e) =>
                setResults({ ...results, km: e.target.value })
              }
            />

                    </div>
                  )}
                </div>

                <div className="iadoc-section">
                  <button
                    type="button"
                    className="iadoc-section-toggle"
                    onClick={() => toggleSection("pagamento")}
                  >
                    <span>Pagamento</span>
                    <span
                      className={`iadoc-toggle-icon ${
                        sectionsOpen.pagamento ? "open" : ""
                      }`}
                    >
                      {sectionsOpen.pagamento ? "-" : "+"}
                    </span>
                  </button>
                  {sectionsOpen.pagamento && (
                    <div className="iadoc-section-body">

            {/* Collegamento preventivo */}
            <label>Numero preventivo</label>
            <input
              value={results.riferimentoPreventivoNumero || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  riferimentoPreventivoNumero: e.target.value,
                })
              }
            />

            <label>Data preventivo</label>
            <input
              value={results.riferimentoPreventivoData || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  riferimentoPreventivoData: e.target.value,
                })
              }
            />

            {/* Totali */}
            <label>Imponibile</label>
            <input
              value={results.imponibile || ""}
              onChange={(e) =>
                setResults({ ...results, imponibile: e.target.value })
              }
            />

            <label>IVA %</label>
            <input
              value={results.ivaPercentuale || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  ivaPercentuale: e.target.value,
                })
              }
            />

            <label>IVA importo</label>
            <input
              value={results.ivaImporto || ""}
              onChange={(e) =>
                setResults({ ...results, ivaImporto: e.target.value })
              }
            />

            <label>Totale documento</label>
            <input
              value={results.totaleDocumento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  totaleDocumento: e.target.value,
                })
              }
            />

            {/* Pagamento */}
            <label>IBAN</label>
            <input
              value={results.iban || ""}
              onChange={(e) =>
                setResults({ ...results, iban: e.target.value })
              }
            />

            <label>Beneficiario</label>
            <input
              value={results.beneficiario || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  beneficiario: e.target.value,
                })
              }
            />

            <label>Riferimento pagamento</label>
            <input
              value={results.riferimentoPagamento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  riferimentoPagamento: e.target.value,
                })
              }
            />

            <label>Banca</label>
            <input
              value={results.banca || ""}
              onChange={(e) =>
                setResults({ ...results, banca: e.target.value })
              }
            />

            <label>Importo pagamento</label>
            <input
              value={results.importoPagamento || ""}
              onChange={(e) =>
                setResults({
                  ...results,
                  importoPagamento: e.target.value,
                })
              }
            />

            {/* Testo / Note */}
            <label>Testo / Note</label>
            <textarea
              className="iadoc-textarea"
              value={results.testo || ""}
              onChange={(e) =>
                setResults({ ...results, testo: e.target.value })
              }
            />

            {/* Categoria archivio (solo lettura) */}
            <label>Categoria archivio</label>
            <input value={results.categoriaArchivio} disabled />

                    </div>
                  )}
                </div>

            <div className="iadoc-section">
              <button
                type="button"
                className="iadoc-section-toggle"
                onClick={() => toggleSection("voci")}
              >
                <span>Voci</span>
                <span
                  className={`iadoc-toggle-icon ${
                    sectionsOpen.voci ? "open" : ""
                  }`}
                >
                  {sectionsOpen.voci ? "-" : "+"}
                </span>
              </button>
              {sectionsOpen.voci && (
                <div className="iadoc-section-body">

            {/* Voci documento (dettaglio righe) */}
            {results.voci && results.voci.length > 0 && (
              <>
                <h3>Voci documento</h3>
                {results.voci.map((voce, index) => (
                  <div key={index} className="iadoc-voce-row">
                    <input
                      placeholder="Descrizione"
                      value={voce.descrizione || ""}
                      onChange={(e) => {
                        const newVoci = [...(results.voci || [])];
                        newVoci[index] = {
                          ...newVoci[index],
                          descrizione: e.target.value,
                        };
                        setResults({ ...results, voci: newVoci });
                      }}
                    />
                    <input
                      placeholder="Quantità"
                      value={voce.quantita || ""}
                      onChange={(e) => {
                        const newVoci = [...(results.voci || [])];
                        newVoci[index] = {
                          ...newVoci[index],
                          quantita: e.target.value,
                        };
                        setResults({ ...results, voci: newVoci });
                      }}
                    />
                    <input
                      placeholder="Prezzo unitario"
                      value={voce.prezzoUnitario || ""}
                      onChange={(e) => {
                        const newVoci = [...(results.voci || [])];
                        newVoci[index] = {
                          ...newVoci[index],
                          prezzoUnitario: e.target.value,
                        };
                        setResults({ ...results, voci: newVoci });
                      }}
                    />
                    <input
                      placeholder="Importo"
                      value={voce.importo || ""}
                      onChange={(e) => {
                        const newVoci = [...(results.voci || [])];
                        newVoci[index] = {
                          ...newVoci[index],
                          importo: e.target.value,
                        };
                        setResults({ ...results, voci: newVoci });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

                </div>
              )}
            </div>

            <div className="iadoc-actions">
            {/* Pulsante SALVA DOCUMENTO (logica originale) */}
            <button
              type="button"
              className="ia-btn primary"
              onClick={handleSave}
              disabled={
                loading ||
                (fmtTarga(targaEstrattaIA) !== "" &&
                  !exactMatch(targaEstrattaIA, mezzi) &&
                  !targaSelezionata)
              }
            >
              Salva Documento
            </button>

            {/* Pulsante IMPORTA IN INVENTARIO
                - visibile solo se:
                  • documento salvato
                  • categoriaArchivio = MAGAZZINO
                  • esistono voci
            */}
            {documentSaved &&
              results.categoriaArchivio === "MAGAZZINO" &&
              results.voci &&
              results.voci.length > 0 && (
                <button
                  type="button"
                  className="ia-btn outline iadoc-import-inventario"
                  onClick={importaInInventario}
                  disabled={importingInventario || loading}
                >
                  {importingInventario
                    ? "Importazione in Inventario..."
                    : "Importa materiali in Inventario"}
                </button>
              )}
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IADocumenti;
