// ==========  INIZIO FILE COMPLETO PULITO  ==========
// src/pages/Mezzi.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Mezzi.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateMezzoPDF } from "../utils/pdfEngine";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { callAICore } from "../utils/aiCore";

const MEZZI_KEY = "@mezzi_aziendali";
const LAVORI_KEY = "@lavori";
const COLLEGHI_KEY = "@colleghi";

type Urgenza = "bassa" | "media" | "alta";

interface Collega {
  id: string;
  nome: string;
  cognome: string;
}

interface Mezzo {
  id: string;
  fotoUrl?: string;

  tipo?: "motrice" | "cisterna";

  categoria?: string;

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
  dataImmatricolazione: string;
  dataScadenzaRevisione: string;
  manutenzioneProgrammata: boolean;

  manutenzioneDataInizio?: string;
  manutenzioneDataFine?: string;
  manutenzioneKmMax?: string;
  manutenzioneContratto?: string;

  note: string;

  autistaId?: string | null;
  autistaNome?: string | null;

  marcaModello?: string;
  anno?: string;
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
// UTILS DATE
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = value.match(/(\d{1,2}).(\d{1,2}).(\d{4})/);
  if (!match) return "";
  const [_, gg, mm, aaaa] = match;
  const g = gg.padStart(2, "0");
  const m = mm.padStart(2, "0");
  return `${aaaa}-${m}-${g}`;
}

// NUOVA: per visualizzare in elenco in formato gg/mm/aaaa
function formatDateForDisplay(value: string | undefined): string {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    // se non è una data valida, restituisco la stringa originale
    return value;
  }

  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aaaa = d.getFullYear();

  return `${gg}/${mm}/${aaaa}`;
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
// Revisione automatica
// ---------------------------------------------

async function ensureLavoroRevisione(
  targa: string,
  dataScadenzaRevisione: string
) {
  if (!targa || !dataScadenzaRevisione) return;

  const giorni = giorniDaOggi(dataScadenzaRevisione);
  if (Number.isNaN(giorni) || giorni > 30) {
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
// COMPONENTE
// ---------------------------------------------

const Mezzi: React.FC = () => {
  const navigate = useNavigate();

  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [colleghi, setColleghi] = useState<Collega[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // CAMPi NUOVI
  const [categoria, setCategoria] = useState("");
  const [autistaId, setAutistaId] = useState<string | null>(null);
  const [autistaNome, setAutistaNome] = useState<string | null>(null);

  const [manutenzioneDataInizio, setManutenzioneDataInizio] = useState("");
  const [manutenzioneDataFine, setManutenzioneDataFine] = useState("");
  const [manutenzioneKmMax, setManutenzioneKmMax] = useState("");
  const [manutenzioneContratto, setManutenzioneContratto] = useState("");

  // Campi originali
  const [tipoMezzo, setTipoMezzo] = useState<"motrice" | "cisterna">("motrice");
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

  // FOTO
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoDirty, setFotoDirty] = useState(false);

  // LIBRETTO
  const [librettoPreview, setLibrettoPreview] = useState<string | null>(null);
  const [librettoLoading, setLibrettoLoading] = useState(false);
  const [librettoError, setLibrettoError] = useState<string | null>(null);

  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const librettoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const librettoGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------------------------------------
  // LOAD
  // ---------------------------------------------

  useEffect(() => {
    const load = async () => {
      try {
        const rawMezzi = await getItemSync(MEZZI_KEY);
        const arrMezzi: Mezzo[] = Array.isArray(rawMezzi)
          ? rawMezzi
          : rawMezzi?.value ?? [];
        setMezzi(arrMezzi);

        const rawColleghi = await getItemSync(COLLEGHI_KEY);
        const arrColl: Collega[] = Array.isArray(rawColleghi)
          ? rawColleghi
          : rawColleghi?.value ?? [];
        setColleghi(arrColl);
      } catch (err) {
        setError("Impossibile caricare i dati.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------------------------------------------
  // RESET
  // ---------------------------------------------

  const resetForm = () => {
    setEditingId(null);

    setCategoria("");
    setAutistaId(null);
    setAutistaNome(null);

    setManutenzioneDataInizio("");
    setManutenzioneDataFine("");
    setManutenzioneKmMax("");
    setManutenzioneContratto("");

    setTipoMezzo("motrice");
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

  // ---------------------------------------------
  // LOAD FORM (MODIFICA)
  // ---------------------------------------------

  const loadMezzoInForm = (m: Mezzo) => {
    setEditingId(m.id);

    setCategoria(m.categoria || "");
    setAutistaId(m.autistaId ?? null);
    setAutistaNome(m.autistaNome ?? null);

    setManutenzioneDataInizio(m.manutenzioneDataInizio || "");
    setManutenzioneDataFine(m.manutenzioneDataFine || "");
    setManutenzioneKmMax(m.manutenzioneKmMax || "");
    setManutenzioneContratto(m.manutenzioneContratto || "");

    setTipoMezzo(m.tipo ?? "motrice");
    setTarga(m.targa);
    setMarca(m.marca);
    setModello(m.modello);
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
  // FOTO HANDLERS
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
  // IA — LIBRETTO
  // ---------------------------------------------

  const processLibrettoDataUrl = async (dataUrl: string) => {
    try {
      setLibrettoLoading(true);
      setLibrettoError(null);

      const imageBase64 = extractBase64FromDataURL(dataUrl);

      const result = await callAICore("estrazione_libretto", { imageBase64 });

      const data = (result?.data || {}) as EstrattoLibrettoResponse;

      if (!data || Object.keys(data).length === 0) {
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
      if (data.cilindrata && tipoMezzo === "motrice")
        setCilindrata(data.cilindrata);
      if (data.potenza && tipoMezzo === "motrice") setPotenza(data.potenza);
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
        processLibrettoDataUrl(result);
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
  // SALVATAGGIO MEZZO
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

      if (fotoPreview && fotoDirty) {
        const storageRef = ref(storage, `mezzi/${mezzoId}/foto.jpg`);
        await uploadString(storageRef, fotoPreview, "data_url");
        fotoUrlToSave = await getDownloadURL(storageRef);
      }

      // Autista: se null → Nessun autista fisso
      let autId = autistaId;
      let autNome = autistaNome;

      if (autId === "NESSUNO") {
        autId = null;
        autNome = "Nessun autista fisso";
      }

      const nuovoMezzo: Mezzo = {
        id: mezzoId,
        fotoUrl: fotoUrlToSave,

        tipo: tipoMezzo,
        categoria,

        targa: tg,
        marca: marca.trim(),
        modello: modello.trim(),
        telaio: telaio.trim(),
        colore: colore.trim(),
        cilindrata: tipoMezzo === "motrice" ? cilindrata.trim() : "",
        potenza: tipoMezzo === "motrice" ? potenza.trim() : "",
        massaComplessiva: massaComplessiva.trim(),
        proprietario: proprietario.trim(),
        assicurazione: assicurazione.trim(),
        dataImmatricolazione,
        dataScadenzaRevisione,
        manutenzioneProgrammata,

        manutenzioneDataInizio: manutenzioneProgrammata
          ? manutenzioneDataInizio
          : "",
        manutenzioneDataFine: manutenzioneProgrammata
          ? manutenzioneDataFine
          : "",
        manutenzioneKmMax: manutenzioneProgrammata ? manutenzioneKmMax : "",
        manutenzioneContratto: manutenzioneProgrammata
          ? manutenzioneContratto
          : "",

        note: note.trim(),

        autistaId: autId,
        autistaNome: autNome,

        marcaModello: `${marca.trim()} ${modello.trim()}`.trim(),
        anno: extractYear(dataImmatricolazione) || "",
      };

      const existingIndex = arr.findIndex((m) => m.id === mezzoId);
      let updated: Mezzo[];
      if (existingIndex >= 0) {
        updated = [...arr];
        updated[existingIndex] = nuovoMezzo;
      } else {
        updated = [...arr, nuovoMezzo];
      }

      // Firestore / storage: convertiamo undefined → null/stringa vuota
      const sanitized = updated.map((m) => ({
        ...m,
        fotoUrl: m.fotoUrl ?? null,
        autistaId: m.autistaId ?? null,
        autistaNome: m.autistaNome ?? null,
        manutenzioneDataInizio: m.manutenzioneDataInizio ?? "",
        manutenzioneDataFine: m.manutenzioneDataFine ?? "",
        manutenzioneKmMax: m.manutenzioneKmMax ?? "",
        manutenzioneContratto: m.manutenzioneContratto ?? "",
      }));

      await setItemSync(MEZZI_KEY, sanitized);

      setMezzi(updated);

      await ensureLavoroRevisione(tg, dataScadenzaRevisione);

      resetForm();
      alert("Mezzo salvato correttamente.");
    } catch (err) {
      console.error(err);
      setError("Errore durante il salvataggio del mezzo.");
    }
  };

  // ---------------------------------------------
  // DELETE
  // ---------------------------------------------

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
      await generateMezzoPDF("Scheda Mezzo", mezzo);
    } catch (err) {
      alert("Errore durante la generazione del PDF.");
    }
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    <div className="page-container mezzi-page">
      <div className="mezzi-card-wrapper">
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

            {/* LIBRETTO */}
            <div className="section-block libretto-section">
              <div className="section-header">
                <h2>Scansione libretto (IA)</h2>
                <p>Scatta una foto o carica un’immagine del libretto.</p>
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

            {/* FOTO */}
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

            {/* FORM */}
            <div className="section-block form-section">
              <h2>Dati generali</h2>

              {/* CATEGORIA */}
              <div className="form-row">
                <div className="form-field">
                  <label>Categoria mezzo</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Seleziona categoria</option>
                    <option value="motrice 2 assi">Motrice 2 assi</option>
                    <option value="motrice 3 assi">Motrice 3 assi</option>
                    <option value="motrice 4 assi">Motrice 4 assi</option>
                    <option value="trattore stradale">Trattore stradale</option>
                    <option value="semirimorchio asse fisso">
                      Semirimorchio asse fisso
                    </option>
                    <option value="semirimorchio asse sterzante">
                      Semirimorchio asse sterzante
                    </option>
                    <option value="pianale">Pianale</option>
                    <option value="biga">Biga</option>
                    <option value="centina">Centina</option>
                    <option value="vasca">Vasca</option>
                  </select>
                </div>
              </div>

              {/* AUTISTA */}
              <div className="form-row">
                <div className="form-field">
                  <label>Autista abituale</label>
                  <select
                    value={autistaId ?? "NESSUNO"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "NESSUNO") {
                        setAutistaId("NESSUNO");
                        setAutistaNome("Nessun autista fisso");
                      } else {
                        setAutistaId(val);
                        const coll = colleghi.find((c) => c.id === val);
                        setAutistaNome(
                          coll ? `${coll.nome} ${coll.cognome}` : ""
                        );
                      }
                    }}
                  >
                    <option value="NESSUNO">NESSUN AUTISTA FISSO</option>
                    {colleghi.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cognome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TARGA / COLORE */}
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

              {/* MARCA / MODELLO */}
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

              {/* TELAIO / MASSA */}
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

              {/* MOTRICE */}
              {tipoMezzo === "motrice" && (
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
              )}

              {/* PROPRIETARIO / ASSICURAZIONE */}
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

              {/* IMMATRICOLAZIONE / REVISIONE */}
              <div className="form-row">
                <div className="form-field">
                  <label>Data immatricolazione</label>
                  <input
                    type="date"
                    value={dataImmatricolazione}
                    onChange={(e) => setDataImmatricolazione(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Scadenza revisione</label>
                  <input
                    type="date"
                    value={dataScadenzaRevisione}
                    onChange={(e) => setDataScadenzaRevisione(e.target.value)}
                  />
                </div>
              </div>

              {/* MANUTENZIONE PROGRAMMATA */}
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

              {manutenzioneProgrammata && (
                <>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Data inizio contratto</label>
                      <input
                        type="date"
                        value={manutenzioneDataInizio}
                        onChange={(e) =>
                          setManutenzioneDataInizio(e.target.value)
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Data fine contratto</label>
                      <input
                        type="date"
                        value={manutenzioneDataFine}
                        onChange={(e) =>
                          setManutenzioneDataFine(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Km massimi previsti</label>
                      <input
                        type="number"
                        value={manutenzioneKmMax}
                        onChange={(e) =>
                          setManutenzioneKmMax(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field full-width">
                      <label>Contratto manutenzione in atto con</label>
                      <input
                        type="text"
                        value={manutenzioneContratto}
                        onChange={(e) =>
                          setManutenzioneContratto(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* NOTE */}
              <div className="form-row">
                <div className="form-field full-width">
                  <label>Note</label>
                  <textarea
                    rows={3}
                    className="mezzi-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* AZIONI */}
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

        {/* LISTA MEZZI */}
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
                {mezzi.map((m) => {
                  const revDisplay = formatDateForDisplay(
                    m.dataScadenzaRevisione
                  );
                  const progDisplay = m.manutenzioneProgrammata
                    ? formatDateForDisplay(m.manutenzioneDataFine || "")
                    : null;

                  // Calcolo colori scadenze (REV)
                  const giorniRev = giorniDaOggi(m.dataScadenzaRevisione);
                  let classeRev = "";
                  if (giorniRev <= 5) classeRev = "deadline-high";
                  else if (giorniRev <= 15) classeRev = "deadline-medium";
                  else if (giorniRev <= 30) classeRev = "deadline-low";

                  // Calcolo colori scadenze (MANUTENZIONE PROGRAMMATA)
                  let classeProg = "";
                  if (progDisplay) {
                    const giorniProg = giorniDaOggi(
                      m.manutenzioneDataFine || ""
                    );

                    if (giorniProg <= 5) classeProg = "deadline-high";
                    else if (giorniProg <= 15) classeProg = "deadline-medium";
                    else if (giorniProg <= 30) classeProg = "deadline-low";
                  }

                  return (
                    <div key={m.id} className="mezzo-list-item">
                      <div className="mezzo-list-main">
                        {/* RIGA 1 → Marca + Modello */}
                        <div className="mezzo-list-header">
                          <span className="mezzo-marca-modello strong">
                            {m.marca.toUpperCase()}{" "}
                            {m.modello.toUpperCase()}
                          </span>
                        </div>

                        {/* RIGA 2 → Targa + REV + MAN. PROG. */}
                        <div className="mezzo-list-meta">
                          <span className="mezzo-targa strong">
                            {m.targa.toUpperCase()}
                          </span>

                          <span
                            className={`mezzo-scadenze ${classeRev}`}
                          >
                            REV: {revDisplay}
                          </span>

                          {progDisplay && (
                            <span
                              className={`mezzo-scadenze ${classeProg}`}
                            >
                           PROG. MANUTENZIONE: {progDisplay}
                            </span>
                          )}
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
                          onClick={() => navigate(`/dossiermezzi/${m.targa}`)}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mezzi;

// ==========  FINE FILE COMPLETO PULITO  ==========
