// src/pages/Mezzi.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Mezzi.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateMezzoPDF } from "../utils/pdfEngine";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const MEZZI_KEY = "@mezzi_aziendali";
const LAVORI_KEY = "@lavori";

type Urgenza = "bassa" | "media" | "alta";

interface Mezzo {
  id: string;
  fotoUrl?: string;

  targa: string;
  marca: string;
  modello: string;
  telaio: string;
  colore: string;
  cilindrata: string;
  potenza: string;
  massaComplessiva: string;
  proprietario: string;
  assicurazione: string;
  dataImmatricolazione: string; // ISO (yyyy-mm-dd)
  dataScadenzaRevisione: string; // ISO (yyyy-mm-dd)
  manutenzioneProgrammata: boolean;
  note: string;

  // Campi legacy opzionali per compatibilità col passato
  marcaModello?: string;
  anno?: string;
  autista?: string;
}

interface EstrattoLibrettoResponse {
  targa?: string;
  marca?: string;
  modello?: string;
  telaio?: string;
  colore?: string;
  cilindrata?: string;
  potenza?: string;
  massaComplessiva?: string;
  massa_complessiva?: string;
  dataImmatricolazione?: string;
  data_immatricolazione?: string;
  assicurazione?: string;
  proprietario?: string;
}

// ---------------------------------------------
// Utility data / date
// ---------------------------------------------
function giorniDaOggi(isoDate: string): number {
  if (!isoDate) return Number.NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateForInput(value: string | undefined): string {
  if (!value) return "";
  // Se è già un ISO valido, lo ritorna così com'è
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // Se arriva “gg mm aaaa” o simili, provo un parse best-effort
  const match = value.match(/(\d{1,2}).(\d{1,2}).(\d{4})/);
  if (!match) return "";
  const [_, gg, mm, aaaa] = match;
  const g = gg.padStart(2, "0");
  const m = mm.padStart(2, "0");
  return `${aaaa}-${m}-${g}`;
}

function extractYear(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/(19|20)\d{2}/);
  return match ? match[0] : null;
}

function extractBase64FromDataURL(dataUrl: string): string {
  const idx = dataUrl.indexOf(",");
  if (idx === -1) return dataUrl;
  return dataUrl.slice(idx + 1);
}

// ---------------------------------------------
// Lavoro automatico revisione (@lavori)
// ---------------------------------------------
async function ensureLavoroRevisione(targa: string, dataScadenzaRevisione: string) {
  if (!targa || !dataScadenzaRevisione) return;

  const giorni = giorniDaOggi(dataScadenzaRevisione);
  if (Number.isNaN(giorni) || giorni > 30) {
    // fuori finestra 30 giorni → nessun lavoro
    return;
  }

  let urgenza: Urgenza;
  let fascia: string;

  if (giorni <= 5) {
    urgenza = "alta";
    fascia = "entro 5 giorni";
  } else if (giorni <= 15) {
    urgenza = "media";
    fascia = "entro 15 giorni";
  } else {
    urgenza = "bassa";
    fascia = "entro 30 giorni";
  }

  const raw = await getItemSync(LAVORI_KEY);
  const lavori: any[] = Array.isArray(raw) ? raw : raw?.value ?? [];

  const descrizione = `Revisione in scadenza per ${targa.toUpperCase()} – ${fascia}`;
  const nowIso = new Date().toISOString();

  const existingIndex = lavori.findIndex(
    (l) =>
      !l.eseguito &&
      l.tipo === "targa" &&
      l.targa === targa.toUpperCase() &&
      l.segnalatoDa === "sistema:revisione"
  );

  if (existingIndex >= 0) {
    lavori[existingIndex] = {
      ...lavori[existingIndex],
      descrizione,
      urgenza,
      dataInserimento: nowIso,
    };
  } else {
    lavori.push({
      id: `REV-${Date.now()}`,
      descrizione,
      targa: targa.toUpperCase(),
      tipo: "targa",
      gruppoId: targa.toUpperCase(),
      eseguito: false,
      urgenza,
      dataInserimento: nowIso,
      segnalatoDa: "sistema:revisione",
    });
  }

  await setItemSync(LAVORI_KEY, lavori);

  if (urgenza === "alta") {
    alert(
      `ATTENZIONE: revisione per ${targa.toUpperCase()} in scadenza entro 5 giorni.\nÈ stato creato un lavoro con priorità ALTA.`
    );
  }
}

// ---------------------------------------------
// Component Mezzi
// ---------------------------------------------
const Mezzi: React.FC = () => {
  const navigate = useNavigate();

  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form campi
  const [targa, setTarga] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [telaio, setTelaio] = useState("");
  const [colore, setColore] = useState("");
  const [cilindrata, setCilindrata] = useState("");
  const [potenza, setPotenza] = useState("");
  const [massaComplessiva, setMassaComplessiva] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [assicurazione, setAssicurazione] = useState("");
  const [dataImmatricolazione, setDataImmatricolazione] = useState("");
  const [dataScadenzaRevisione, setDataScadenzaRevisione] = useState("");
  const [manutenzioneProgrammata, setManutenzioneProgrammata] = useState(false);
  const [note, setNote] = useState("");

  // Foto mezzo
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoDirty, setFotoDirty] = useState(false);

  // Libretto (IA)
  const [librettoPreview, setLibrettoPreview] = useState<string | null>(null);
  const [librettoLoading, setLibrettoLoading] = useState(false);
  const [librettoError, setLibrettoError] = useState<string | null>(null);

  // Ref input file
  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const librettoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const librettoGalleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await getItemSync(MEZZI_KEY);
        const arr: Mezzo[] = Array.isArray(raw) ? raw : raw?.value ?? [];
        setMezzi(arr);
      } catch (err) {
        console.error(err);
        setError("Impossibile caricare i mezzi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTarga("");
    setMarca("");
    setModello("");
    setTelaio("");
    setColore("");
    setCilindrata("");
    setPotenza("");
    setMassaComplessiva("");
    setProprietario("");
    setAssicurazione("");
    setDataImmatricolazione("");
    setDataScadenzaRevisione("");
    setManutenzioneProgrammata(false);
    setNote("");

    setFotoPreview(null);
    setFotoDirty(false);

    setLibrettoPreview(null);
    setLibrettoError(null);
    setError(null);
  };

  const loadMezzoInForm = (m: Mezzo) => {
    setEditingId(m.id);
    setTarga(m.targa);
    setMarca(m.marca || m.marcaModello?.split(" ")[0] || "");
    setModello(
      m.modello ||
        (m.marcaModello ? m.marcaModello.split(" ").slice(1).join(" ") : "")
    );
    setTelaio(m.telaio);
    setColore(m.colore);
    setCilindrata(m.cilindrata);
    setPotenza(m.potenza);
    setMassaComplessiva(m.massaComplessiva);
    setProprietario(m.proprietario);
    setAssicurazione(m.assicurazione);
    setDataImmatricolazione(formatDateForInput(m.dataImmatricolazione));
    setDataScadenzaRevisione(formatDateForInput(m.dataScadenzaRevisione));
    setManutenzioneProgrammata(m.manutenzioneProgrammata);
    setNote(m.note);

    setFotoPreview(m.fotoUrl || null);
    setFotoDirty(false);

    setLibrettoPreview(null);
    setLibrettoError(null);
    setError(null);
  };

  // ---------------------------------------------
  // FOTO MEZZO (upload + scatto)
  // ---------------------------------------------
  const handleFotoChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setFotoPreview(result);
        setFotoDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenFotoPicker = () => {
    fotoInputRef.current?.click();
  };

  // ---------------------------------------------
  // IA – Scansiona Libretto (camera + galleria)
  // ---------------------------------------------
  const processLibrettoDataUrl = async (dataUrl: string) => {
    try {
      setLibrettoLoading(true);
      setLibrettoError(null);

      const imageBase64 = extractBase64FromDataURL(dataUrl);

     const res = await fetch(
  "https://gestioneweb-is45.vercel.app/api/estrai-libretto",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  }
);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: EstrattoLibrettoResponse = await res.json();

      if (!data) {
        setLibrettoError(
          "Impossibile estrarre i dati dal libretto. Compila i campi manualmente."
        );
        return;
      }

      if (data.targa) setTarga(data.targa.toUpperCase());
      if (data.marca) setMarca(data.marca);
      if (data.modello) setModello(data.modello);
      if (data.telaio) setTelaio(data.telaio);
      if (data.colore) setColore(data.colore);
      if (data.cilindrata) setCilindrata(data.cilindrata);
      if (data.potenza) setPotenza(data.potenza);
      if (data.massaComplessiva || data.massa_complessiva) {
        setMassaComplessiva(
          data.massaComplessiva || data.massa_complessiva || ""
        );
      }
      if (data.proprietario) setProprietario(data.proprietario);
      if (data.assicurazione) setAssicurazione(data.assicurazione);

      const rawImm =
        data.dataImmatricolazione || data.data_immatricolazione || "";
      if (rawImm) {
        const year = extractYear(rawImm);
        const parsed = formatDateForInput(rawImm);
        if (parsed) {
          setDataImmatricolazione(parsed);
        } else if (year) {
          // fallback: solo anno
          setDataImmatricolazione(`${year}-01-01`);
        }
      }
    } catch (err) {
      console.error("Errore IA libretto:", err);
      setLibrettoError(
        "Errore durante l'analisi del libretto. Riprova o inserisci i dati manualmente."
      );
    } finally {
      setLibrettoLoading(false);
    }
  };

  const handleLibrettoFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setLibrettoPreview(result);
        void processLibrettoDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenLibrettoCamera = () => {
    librettoCameraInputRef.current?.click();
  };

  const handleOpenLibrettoGallery = () => {
    librettoGalleryInputRef.current?.click();
  };

  // ---------------------------------------------
  // Salvataggio Mezzo (Firestore via storageSync + Storage)
  // ---------------------------------------------
  const handleSave = async () => {
    setError(null);

    const tg = targa.trim().toUpperCase();
    if (!tg) {
      setError("La targa è obbligatoria.");
      return;
    }

    if (!marca.trim() || !modello.trim()) {
      setError("Marca e modello sono obbligatori.");
      return;
    }

    try {
      const raw = await getItemSync(MEZZI_KEY);
      const arr: Mezzo[] = Array.isArray(raw) ? raw : raw?.value ?? [];

      let mezzoId = editingId ?? `MEZZO-${Date.now()}`;
      let fotoUrlToSave: string | undefined = arr.find(
        (m) => m.id === mezzoId
      )?.fotoUrl;

      // Upload foto su Firebase Storage (solo se modificata / nuova)
      if (fotoPreview && fotoDirty) {
        const storageRef = ref(storage, `mezzi/${mezzoId}/foto.jpg`);
        await uploadString(storageRef, fotoPreview, "data_url");
        fotoUrlToSave = await getDownloadURL(storageRef);
      }

      const nuovoMezzo: Mezzo = {
        id: mezzoId,
        fotoUrl: fotoUrlToSave,

        targa: tg,
        marca: marca.trim(),
        modello: modello.trim(),
        telaio: telaio.trim(),
        colore: colore.trim(),
        cilindrata: cilindrata.trim(),
        potenza: potenza.trim(),
        massaComplessiva: massaComplessiva.trim(),
        proprietario: proprietario.trim(),
        assicurazione: assicurazione.trim(),
        dataImmatricolazione,
        dataScadenzaRevisione,
        manutenzioneProgrammata,
        note: note.trim(),

        // legacy helper
        marcaModello: `${marca.trim()} ${modello.trim()}`.trim(),
        anno: extractYear(dataImmatricolazione) ?? undefined,
      };

      const existingIndex = arr.findIndex((m) => m.id === mezzoId);
      let updated: Mezzo[];
      if (existingIndex >= 0) {
        updated = [...arr];
        updated[existingIndex] = nuovoMezzo;
      } else {
        updated = [...arr, nuovoMezzo];
      }

      await setItemSync(MEZZI_KEY, updated);
      setMezzi(updated);

      // Logica automatica revisione
      await ensureLavoroRevisione(tg, dataScadenzaRevisione);

      // Reset form e apertura Dossier Mezzo
      resetForm();
      navigate(`/dossier-mezzo/${mezzoId}`);
    } catch (err) {
      console.error(err);
      setError("Errore durante il salvataggio del mezzo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo mezzo?")) return;

    try {
      const raw = await getItemSync(MEZZI_KEY);
      const arr: Mezzo[] = Array.isArray(raw) ? raw : raw?.value ?? [];
      const updated = arr.filter((m) => m.id !== id);
      await setItemSync(MEZZI_KEY, updated);
      setMezzi(updated);

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("Errore durante l'eliminazione del mezzo.");
    }
  };

  const handleExportPdf = async (mezzo: Mezzo) => {
    try {
      await generateMezzoPDF(mezzo);
    } catch (err) {
      console.error(err);
      alert("Errore durante la generazione del PDF.");
    }
  };

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  return (
    <div className="page-container mezzi-page">
      <div className="mezzi-card-wrapper">
        {/* CARD FORM – 430px premium */}
        <div className="premium-card-430 mezzi-card">
          <div className="card-header">
            <div className="logo-wrapper">
              <img src="/logo.png" alt="Logo" className="card-logo" />
            </div>
            <div className="card-title-group">
              <h1 className="card-title">Mezzi aziendali</h1>
              <p className="card-subtitle">
                Gestione mezzi, libretto, revisione e dossier dedicato
              </p>
            </div>
          </div>

          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            {librettoError && (
              <div className="alert alert-warning">{librettoError}</div>
            )}

            {/* Sezione IA Libretto */}
            <div className="section-block libretto-section">
              <div className="section-header">
                <h2>Scansione libretto (IA)</h2>
                <p>
                  Scatta una foto o carica un’immagine del libretto per
                  precompilare i campi.
                </p>
              </div>

              <div className="libretto-buttons-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenLibrettoCamera}
                  disabled={librettoLoading}
                >
                  Scansiona libretto
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleOpenLibrettoGallery}
                  disabled={librettoLoading}
                >
                  Carica foto
                </button>
              </div>

              {librettoLoading && (
                <p className="small-info-text">Analisi in corso…</p>
              )}

              {librettoPreview && (
                <div className="libretto-preview">
                  <img src={librettoPreview} alt="Libretto" />
                </div>
              )}

              {/* input nascosti per camera/galleria */}
              <input
                ref={librettoCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleLibrettoFileChange}
              />
              <input
                ref={librettoGalleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLibrettoFileChange}
              />
            </div>

            {/* Sezione Foto Mezzo */}
            <div className="section-block foto-section">
              <div className="section-header-inline">
                <h2>Foto mezzo</h2>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleOpenFotoPicker}
                >
                  Carica / scatta foto
                </button>
              </div>

              {fotoPreview && (
                <div className="mezzo-foto-preview">
                  <img src={fotoPreview} alt="Foto mezzo" />
                </div>
              )}

              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />
            </div>

            {/* Form dati mezzo */}
            <div className="section-block form-section">
              <h2>Dati generali</h2>

              <div className="form-row">
                <div className="form-field">
                  <label>Targa</label>
                  <input
                    type="text"
                    value={targa}
                    onChange={(e) => setTarga(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>

                <div className="form-field">
                  <label>Colore</label>
                  <input
                    type="text"
                    value={colore}
                    onChange={(e) => setColore(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Modello</label>
                  <input
                    type="text"
                    value={modello}
                    onChange={(e) => setModello(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Telaio</label>
                  <input
                    type="text"
                    value={telaio}
                    onChange={(e) => setTelaio(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Massa complessiva</label>
                  <input
                    type="text"
                    value={massaComplessiva}
                    onChange={(e) => setMassaComplessiva(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Cilindrata</label>
                  <input
                    type="text"
                    value={cilindrata}
                    onChange={(e) => setCilindrata(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Potenza</label>
                  <input
                    type="text"
                    value={potenza}
                    onChange={(e) => setPotenza(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Proprietario</label>
                  <input
                    type="text"
                    value={proprietario}
                    onChange={(e) => setProprietario(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Assicurazione</label>
                  <input
                    type="text"
                    value={assicurazione}
                    onChange={(e) => setAssicurazione(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Data immatricolazione</label>
                  <input
                    type="date"
                    value={dataImmatricolazione}
                    onChange={(e) =>
                      setDataImmatricolazione(e.target.value)
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Scadenza revisione</label>
                  <input
                    type="date"
                    value={dataScadenzaRevisione}
                    onChange={(e) =>
                      setDataScadenzaRevisione(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field checkbox-field">
                  <label>Manutenzione programmata</label>
                  <div className="checkbox-inline">
                    <input
                      id="manut-programmata"
                      type="checkbox"
                      checked={manutenzioneProgrammata}
                      onChange={(e) =>
                        setManutenzioneProgrammata(e.target.checked)
                      }
                    />
                    <label htmlFor="manut-programmata">Attiva</label>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field full-width">
                  <label>Note</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="btn btn-primary-strong"
                  onClick={handleSave}
                >
                  {editingId ? "Salva modifiche" : "Salva mezzo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA MEZZI – card affiancata, scrollabile */}
        <div className="premium-card-430 mezzi-list-card">
          <div className="card-header">
            <h2 className="card-title">Elenco mezzi</h2>
            <p className="card-subtitle">
              Seleziona un mezzo per modificare, esportare PDF o aprire il
              dossier.
            </p>
          </div>

          <div className="card-body">
            {loading && <p>Caricamento mezzi…</p>}

            {!loading && mezzi.length === 0 && (
              <p className="empty-text">
                Nessun mezzo registrato. Inserisci il primo mezzo tramite il
                form a sinistra.
              </p>
            )}

            {!loading && mezzi.length > 0 && (
              <div className="mezzi-list">
                {mezzi.map((m) => (
                  <div key={m.id} className="mezzo-list-item">
                    <div className="mezzo-list-main">
                      <div className="mezzo-list-header">
                        <span className="mezzo-targa">
                          {m.targa.toUpperCase()}
                        </span>
                        <span className="mezzo-marca-modello">
                          {m.marca} {m.modello}
                        </span>
                      </div>
                      <div className="mezzo-list-meta">
                        <span>
                          Proprietario:{" "}
                          <strong>{m.proprietario || "-"}</strong>
                        </span>
                        <span>
                          Revisione:{" "}
                          <strong>
                            {m.dataScadenzaRevisione
                              ? m.dataScadenzaRevisione
                              : "-"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="mezzo-list-actions">
                      <button
                        type="button"
                        className="btn btn-small btn-outline"
                        onClick={() => loadMezzoInForm(m)}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => navigate(`/dossier-mezzo/${m.id}`)}
                      >
                        Dossier
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-info"
                        onClick={() => handleExportPdf(m)}
                      >
                        Esporta PDF Mezzo
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(m.id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mezzi;
