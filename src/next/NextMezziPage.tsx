import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  normalizeNextMezzoCategoria,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaCollegaItem,
  type NextAnagraficheFlottaMezzoItem,
} from "./nextAnagraficheFlottaDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";
import { formatDateUI } from "./nextDateFormat";
import { formatDateInput } from "../utils/dateFormat";
import "../pages/Mezzi.css";

const CATEGORIE_ORDINATE = [
  "motrice 2 assi",
  "motrice 3 assi",
  "motrice 4 assi",
  "trattore stradale",
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
  "porta silo container",
  "pianale",
  "biga",
  "centina",
  "vasca",
  "Senza categoria",
] as const;

const CATEGORIA_ALTRI = "ALTRI";

type Mezzo = NextAnagraficheFlottaMezzoItem;
type Collega = NextAnagraficheFlottaCollegaItem;

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Impossibile caricare i dati.";
}

function buildDate(yyyyRaw: string, mmRaw: string, ddRaw: string): Date | null {
  const yyyy = Number(yyyyRaw);
  const mm = Number(mmRaw);
  const dd = Number(ddRaw);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }
  return date;
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const dmyMatch = /(\d{2})[./\s](\d{2})[./\s](\d{4})/.exec(text);
  const candidates: Array<{ index: number; date: Date }> = [];

  if (isoMatch) {
    const date = buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (date) candidates.push({ index: isoMatch.index, date });
  }
  if (dmyMatch) {
    const date = buildDate(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (date) candidates.push({ index: dmyMatch.index, date });
  }

  if (!candidates.length) return null;
  candidates.sort((left, right) => left.index - right.index);
  return candidates[0].date;
}

function formatDateForDisplay(date: Date | null): string {
  return formatDateUI(date);
}

function formatDateForInput(date: Date | null): string {
  return formatDateInput(date);
}

function normalizeTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
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

function calculaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null,
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) {
      return firstRevision;
    }

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(
      nextFromImmatricolazione.getFullYear() + 2,
    );
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

function giorniDaOggi(target: Date | null): number | null {
  if (!target) return null;
  const today = new Date();
  const utcToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const utcTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.round((utcTarget - utcToday) / 86400000);
}

function buildReadOnlyMessage(actionLabel: string) {
  return `Clone NEXT in sola lettura: ${actionLabel} bloccato.`;
}

export default function NextMezziPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [colleghi, setColleghi] = useState<Collega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("");
  const [autistaId, setAutistaId] = useState<string | null>(null);
  const [autistaNome, setAutistaNome] = useState<string | null>(null);
  const [manutenzioneDataInizio, setManutenzioneDataInizio] = useState("");
  const [manutenzioneDataFine, setManutenzioneDataFine] = useState("");
  const [manutenzioneKmMax, setManutenzioneKmMax] = useState("");
  const [manutenzioneContratto, setManutenzioneContratto] = useState("");
  const [tipoMezzo, setTipoMezzo] = useState<"motrice" | "cisterna">(
    "motrice",
  );
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
  const [dataUltimoCollaudo, setDataUltimoCollaudo] = useState("");
  const [lastAutoProssimoCollaudo, setLastAutoProssimoCollaudo] =
    useState("");
  const [manutenzioneProgrammata, setManutenzioneProgrammata] =
    useState(false);
  const [note, setNote] = useState("");
  const [iaLibrettoFile, setIaLibrettoFile] = useState<File | null>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaOverwrite, setIaOverwrite] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [categoriaEspansa, setCategoriaEspansa] = useState<string | null>(null);

  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const targaInputRef = useRef<HTMLInputElement | null>(null);
  const categoriaSelectRef = useRef<HTMLSelectElement | null>(null);
  const autistaSelectRef = useRef<HTMLSelectElement | null>(null);
  const preselectRef = useRef(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await readNextAnagraficheFlottaSnapshot({
        includeClonePatches: false,
      });
      setMezzi(snapshot.items);
      setColleghi(snapshot.colleghi);
    } catch (loadError) {
      setMezzi([]);
      setColleghi([]);
      setError(readErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCategoria("");
    setAutistaId(null);
    setAutistaNome(null);
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
    setDataUltimoCollaudo("");
    setLastAutoProssimoCollaudo("");
    setManutenzioneProgrammata(false);
    setManutenzioneDataInizio("");
    setManutenzioneDataFine("");
    setManutenzioneKmMax("");
    setManutenzioneContratto("");
    setNote("");
    setIaLibrettoFile(null);
    setIaLoading(false);
    setIaError(null);
    setIaOverwrite(false);
    setFotoPreview(null);
    setError(null);
  };

  const loadMezzoInForm = (item: Mezzo) => {
    setEditingId(item.id);
    setCategoria(item.categoria || "");
    setAutistaId(item.autistaId || null);
    setAutistaNome(item.autistaNome || null);
    setTipoMezzo(item.tipo || "motrice");
    setTarga(item.targa || "");
    setMarca(item.marca || "");
    setModello(item.modello || "");
    setTelaio(item.telaio || "");
    setColore(item.colore || "");
    setCilindrata(item.cilindrata || "");
    setPotenza(item.potenza || "");
    setMassaComplessiva(item.massaComplessiva || "");
    setProprietario(item.proprietario || "");
    setAssicurazione(item.assicurazione || "");
    setDataImmatricolazione(item.dataImmatricolazione || "");
    setDataScadenzaRevisione(item.dataScadenzaRevisione || "");
    setDataUltimoCollaudo(item.dataUltimoCollaudo || "");
    setLastAutoProssimoCollaudo("");
    setManutenzioneProgrammata(Boolean(item.manutenzioneProgrammata));
    setManutenzioneDataInizio(item.manutenzioneDataInizio || "");
    setManutenzioneDataFine(item.manutenzioneDataFine || "");
    setManutenzioneKmMax(item.manutenzioneKmMax || "");
    setManutenzioneContratto(item.manutenzioneContratto || "");
    setNote(item.note || "");
    setIaLibrettoFile(null);
    setIaLoading(false);
    setIaError(null);
    setIaOverwrite(false);
    setFotoPreview(item.fotoUrl || null);
    setError(null);
  };

  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(location.search);
    const targetId = params.get("mezzoId");
    const targetTarga = params.get("targa");
    if (!targetId && !targetTarga) return;
    if (preselectRef.current) return;

    const match = targetId
      ? mezzi.find((item) => String(item.id) === targetId)
      : mezzi.find(
          (item) => normalizeTarga(item.targa) === normalizeTarga(targetTarga),
        );

    if (match) {
      loadMezzoInForm(match);
    }
    preselectRef.current = true;
  }, [loading, location.search, mezzi]);

  const handleChangeAutista = (value: string) => {
    setError(null);
    const collega = colleghi.find((item) => item.id === value);
    if (!collega) {
      setAutistaId(null);
      setAutistaNome(null);
      return;
    }
    setAutistaId(collega.id);
    setAutistaNome(collega.nomeCompleto || collega.nome);
  };

  const handleTipoMezzoChange = (value: "motrice" | "cisterna") => {
    setError(null);
    setTipoMezzo(value);
    if (value === "cisterna") {
      setCilindrata("");
      setPotenza("");
    }
  };

  const handleFotoChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void readFileAsDataUrl(file)
      .then((result) => {
        setError(null);
        setFotoPreview(result);
      })
      .catch((fileError) => {
        setError(readErrorMessage(fileError));
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  const handleOpenFotoPicker = () => {
    setError(null);
    fotoInputRef.current?.click();
  };

  const handleIaLibrettoFileChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setIaLibrettoFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setIaLibrettoFile(null);
      setIaError("Carica solo immagini (JPG o PNG).");
      event.target.value = "";
      return;
    }

    setIaError(null);
    setIaLibrettoFile(file);
  };

  const handleAnalyzeLibrettoWithIA = () => {
    if (!iaLibrettoFile) {
      setIaError("Carica una foto del libretto prima di analizzare.");
      return;
    }

    setIaLoading(false);
    setIaError(buildReadOnlyMessage("analisi libretto"));
  };

  const handleSave = () => {
    setError(null);

    if (!targa.trim()) {
      setError("La targa \u00E8 obbligatoria.");
      return;
    }
    if (!marca.trim()) {
      setError("La marca \u00E8 obbligatoria.");
      return;
    }
    if (!modello.trim()) {
      setError("Il modello \u00E8 obbligatorio.");
      return;
    }
    if (!dataImmatricolazione) {
      setError("La data di immatricolazione \u00E8 obbligatoria.");
      return;
    }

    setError(
      buildReadOnlyMessage(
        editingId ? "salvataggio modifiche mezzo" : "salvataggio mezzo",
      ),
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo mezzo?")) {
      return;
    }

    if (editingId === id) {
      const selected = mezzi.find((item) => item.id === id);
      if (selected) {
        loadMezzoInForm(selected);
      }
    }
    setError(buildReadOnlyMessage("eliminazione mezzo"));
  };

  const highlightMissing =
    new URLSearchParams(location.search).get("highlightMissing") === "1";
  const highlightMissingActive = highlightMissing && Boolean(editingId);
  const missingTarga = highlightMissingActive && !targa.trim();
  const missingCategoria = highlightMissingActive && !categoria.trim();
  const missingAutista =
    highlightMissingActive && !String(autistaNome || "").trim();

  useEffect(() => {
    if (!highlightMissingActive) return;

    const target = missingTarga
      ? targaInputRef.current
      : missingCategoria
        ? categoriaSelectRef.current
        : missingAutista
          ? autistaSelectRef.current
          : null;
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus();
    });
  }, [highlightMissingActive, missingTarga, missingCategoria, missingAutista]);

  const mezziPerCategoria: Record<string, Mezzo[]> = {};
  const mezziAltri: Mezzo[] = [];

  mezzi.forEach((mezzo) => {
    const key = normalizeNextMezzoCategoria(mezzo.categoria);
    if (CATEGORIE_ORDINATE.includes(key as (typeof CATEGORIE_ORDINATE)[number])) {
      if (!mezziPerCategoria[key]) {
        mezziPerCategoria[key] = [];
      }
      mezziPerCategoria[key].push(mezzo);
      return;
    }
    mezziAltri.push(mezzo);
  });

  const categorieNotePresenti = CATEGORIE_ORDINATE.filter(
    (categoriaItem) =>
      mezziPerCategoria[categoriaItem] &&
      mezziPerCategoria[categoriaItem].length > 0,
  );
  const categoriePresenti = mezziAltri.length
    ? [...categorieNotePresenti, CATEGORIA_ALTRI]
    : categorieNotePresenti;

  return (
    <div className="mezzi-page">
      <div className="page-container mezzi-page">
        <div className="mezzi-grid">
          <div className="left-column">
            <div className="premium-card-430">
              <div className="card-header">
                <img
                  src="/logo.png"
                  alt="Logo Ghielmi Cementi"
                  className="logo-mezzi"
                  onClick={() => navigate("/next")}
                />
                <div className="card-header-text">
                  <h1 className="card-title">Gestione Mezzi</h1>
                  <p className="card-subtitle">
                    Gestione mezzi, libretto, revisione e dossier dedicato
                  </p>
                </div>
              </div>

              <div className="card-body">
                {error ? <div className="alert alert-error">{error}</div> : null}

                <div className="section-block foto-section">
                  <div className="section-header">
                    <h2>Foto mezzo</h2>
                    <p>Scatta o carica una foto del mezzo.</p>
                  </div>
                  <div className="foto-row">
                    <div className="foto-preview-wrapper">
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Foto mezzo"
                          className="foto-preview"
                        />
                      ) : (
                        <div className="foto-placeholder">
                          Nessuna foto selezionata
                        </div>
                      )}
                    </div>
                    <div className="foto-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleOpenFotoPicker}
                      >
                        Carica foto
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setFotoPreview(null);
                        }}
                      >
                        Rimuovi foto
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handleFotoChange}
                  />
                </div>

                <div className="section-block">
                  <div className="section-header">
                    <h2>LIBRETTO (IA)</h2>
                    <p>
                      Carica una foto del libretto e compila il form
                      automaticamente.
                    </p>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Immagine libretto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIaLibrettoFileChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={iaOverwrite}
                          onChange={(event) =>
                            setIaOverwrite(event.target.checked)
                          }
                        />
                        {"Sovrascrivi campi gi\u00E0 compilati"}
                      </label>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAnalyzeLibrettoWithIA}
                      disabled={!iaLibrettoFile || iaLoading}
                    >
                      {iaLoading
                        ? "Analisi in corso..."
                        : "Analizza Libretto con IA"}
                    </button>
                  </div>
                  {iaError ? (
                    <div className="alert alert-error">{iaError}</div>
                  ) : null}
                </div>

                <div className="section-block form-section">
                  <h2>Dati generali</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Categoria mezzo</label>
                      <select
                        ref={categoriaSelectRef}
                        className={missingCategoria ? "field-missing" : ""}
                        value={categoria}
                        onChange={(event) => setCategoria(event.target.value)}
                      >
                        <option value="">Seleziona categoria</option>
                        <option value="motrice 2 assi">Motrice 2 assi</option>
                        <option value="motrice 3 assi">Motrice 3 assi</option>
                        <option value="motrice 4 assi">Motrice 4 assi</option>
                        <option value="trattore stradale">
                          Trattore stradale
                        </option>
                        <option value="semirimorchio asse fisso">
                          Semirimorchio asse fisso
                        </option>
                        <option value="semirimorchio asse sterzante">
                          Semirimorchio asse sterzante
                        </option>
                        <option value="porta silo container">
                          Porta silo container
                        </option>
                        <option value="pianale">Pianale</option>
                        <option value="biga">Biga</option>
                        <option value="centina">Centina</option>
                        <option value="vasca">Vasca</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipo</label>
                      <select
                        value={tipoMezzo}
                        onChange={(event) =>
                          handleTipoMezzoChange(
                            event.target.value as "motrice" | "cisterna",
                          )
                        }
                      >
                        <option value="motrice">Motrice</option>
                        <option value="cisterna">Cisterna / Rimorchio</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Autista</label>
                      <select
                        ref={autistaSelectRef}
                        className={missingAutista ? "field-missing" : ""}
                        value={autistaId || ""}
                        onChange={(event) =>
                          handleChangeAutista(event.target.value)
                        }
                      >
                        <option value="">Nessun autista</option>
                        {colleghi.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome}
                            {item.cognome ? ` ${item.cognome}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Targa</label>
                      <input
                        type="text"
                        ref={targaInputRef}
                        className={missingTarga ? "field-missing" : ""}
                        value={targa}
                        onChange={(event) =>
                          setTarga(event.target.value.toUpperCase())
                        }
                        placeholder="Es. TI 315407"
                      />
                    </div>
                    <div className="form-group">
                      <label>Marca</label>
                      <input
                        type="text"
                        value={marca}
                        onChange={(event) => setMarca(event.target.value)}
                        placeholder="Es. RENAULT"
                      />
                    </div>
                    <div className="form-group">
                      <label>Modello</label>
                      <input
                        type="text"
                        value={modello}
                        onChange={(event) => setModello(event.target.value)}
                        placeholder="Es. C 430"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Telaio / VIN</label>
                      <input
                        type="text"
                        value={telaio}
                        onChange={(event) => setTelaio(event.target.value)}
                        placeholder="Es. VF6..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Colore</label>
                      <input
                        type="text"
                        value={colore}
                        onChange={(event) => setColore(event.target.value)}
                        placeholder="Es. Bianco"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    {tipoMezzo === "motrice" ? (
                      <>
                        <div className="form-group">
                          <label>{"Cilindrata (cm\u00B3)"}</label>
                          <input
                            type="text"
                            value={cilindrata}
                            onChange={(event) =>
                              setCilindrata(event.target.value)
                            }
                            placeholder="Es. 10837"
                          />
                        </div>
                        <div className="form-group">
                          <label>Potenza (kW)</label>
                          <input
                            type="text"
                            value={potenza}
                            onChange={(event) =>
                              setPotenza(event.target.value)
                            }
                            placeholder="Es. 323.0"
                          />
                        </div>
                      </>
                    ) : null}

                    <div className="form-group">
                      <label>Massa complessiva (kg)</label>
                      <input
                        type="text"
                        value={massaComplessiva}
                        onChange={(event) =>
                          setMassaComplessiva(event.target.value)
                        }
                        placeholder="Es. 40000"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Proprietario</label>
                      <input
                        type="text"
                        value={proprietario}
                        onChange={(event) =>
                          setProprietario(event.target.value)
                        }
                        placeholder="Es. GhielmiCementi SA"
                      />
                    </div>
                    <div className="form-group">
                      <label>Assicurazione</label>
                      <input
                        type="text"
                        value={assicurazione}
                        onChange={(event) =>
                          setAssicurazione(event.target.value)
                        }
                        placeholder="Es. Zurigo Assicurazioni SA"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data immatricolazione</label>
                      <input
                        type="date"
                        value={dataImmatricolazione}
                        onChange={(event) =>
                          setDataImmatricolazione(event.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Data ultimo collaudo</label>
                      <input
                        type="date"
                        value={dataUltimoCollaudo}
                        onChange={(event) => {
                          const newValue = event.target.value;
                          setDataUltimoCollaudo(newValue);
                          if (!newValue) return;

                          const parsed = parseDateFlexible(newValue);
                          if (!parsed) return;

                          const nextDate = new Date(parsed);
                          nextDate.setHours(12, 0, 0, 0);
                          nextDate.setFullYear(nextDate.getFullYear() + 1);
                          const nextAuto = formatDateForInput(nextDate);
                          const currentScadenza = String(
                            dataScadenzaRevisione || "",
                          ).trim();
                          const lastAuto = String(
                            lastAutoProssimoCollaudo || "",
                          ).trim();

                          if (!currentScadenza || currentScadenza === lastAuto) {
                            setDataScadenzaRevisione(nextAuto);
                            setLastAutoProssimoCollaudo(nextAuto);
                          }
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Prossimo collaudo</label>
                      <input
                        type="date"
                        value={dataScadenzaRevisione}
                        onChange={(event) =>
                          setDataScadenzaRevisione(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="section-block maint-section">
                    <div className="maint-header">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={manutenzioneProgrammata}
                          onChange={(event) =>
                            setManutenzioneProgrammata(event.target.checked)
                          }
                        />
                        Manutenzione programmata
                      </label>
                      <p className="small-info-text">
                        Se attivo, consente di impostare un intervallo di
                        manutenzione programmata per il mezzo.
                      </p>
                    </div>

                    {manutenzioneProgrammata ? (
                      <div className="maint-grid">
                        <div className="form-group">
                          <label>Data inizio contratto</label>
                          <input
                            type="date"
                            value={manutenzioneDataInizio}
                            onChange={(event) =>
                              setManutenzioneDataInizio(event.target.value)
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Data prossima scadenza</label>
                          <input
                            type="date"
                            value={manutenzioneDataFine}
                            onChange={(event) =>
                              setManutenzioneDataFine(event.target.value)
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Km massimi</label>
                          <input
                            type="text"
                            value={manutenzioneKmMax}
                            onChange={(event) =>
                              setManutenzioneKmMax(event.target.value)
                            }
                            placeholder="Es. 120000"
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Contratto / Note manutenzione</label>
                          <textarea
                            value={manutenzioneContratto}
                            onChange={(event) =>
                              setManutenzioneContratto(event.target.value)
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Note generali</label>
                      <textarea
                        rows={3}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Note aggiuntive, vincoli particolari, ecc."
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={resetForm}
                    >
                      Reset form
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSave}
                    >
                      {editingId ? "Salva modifiche" : "Salva mezzo"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card-430 mezzi-list-card">
            <div className="card-header">
              <h2 className="card-title">Elenco mezzi</h2>
              <p className="card-subtitle">
                Seleziona un mezzo per modificare o aprire il dossier.
              </p>
            </div>
            <div className="card-body">
              {loading ? <p>Caricamento mezzi...</p> : null}

              {!loading && mezzi.length === 0 ? (
                <p className="empty-text">
                  Nessun mezzo registrato. Inserisci il primo mezzo tramite il
                  form a sinistra.
                </p>
              ) : null}

              {!loading && mezzi.length > 0 ? (
                <div className="mezzi-categorie-wrapper">
                  {categoriePresenti.map((cat) => {
                    const lista =
                      cat === CATEGORIA_ALTRI
                        ? mezziAltri
                        : mezziPerCategoria[cat] || [];
                    const aperta = categoriaEspansa === cat;

                    return (
                      <div key={cat} className="categoria-mezzo-block">
                        <div
                          className="mezzo-list-item categoria-header"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setCategoriaEspansa((prev) =>
                              prev === cat ? null : cat,
                            )
                          }
                        >
                          <div className="mezzo-list-main">
                            <div className="mezzo-list-header">
                              <span className="mezzo-marca-modello strong">
                                {aperta ? "▾ " : "▸ "}
                                {cat.toUpperCase()}
                              </span>
                            </div>
                            <div className="mezzo-list-meta">
                              <span className="mezzo-targa">
                                {lista.length} mezzi
                              </span>
                            </div>
                          </div>
                        </div>

                        {aperta ? (
                          <div style={{ marginTop: 14, marginBottom: 16 }}>
                            <div className="mezzi-list">
                              {lista.map((item) => {
                                const scadenzaPrimaria = parseDateFlexible(
                                  item.dataScadenzaRevisione || "",
                                );
                                const immDate = parseDateFlexible(
                                  item.dataImmatricolazione || "",
                                );
                                const collaudoDate = parseDateFlexible(
                                  item.dataUltimoCollaudo || "",
                                );
                                const computed = calculaProssimaRevisione(
                                  immDate,
                                  collaudoDate,
                                );
                                const scadenzaDate =
                                  scadenzaPrimaria || computed;
                                const revDisplay =
                                  formatDateForDisplay(scadenzaDate);
                                const progDate = item.manutenzioneProgrammata
                                  ? parseDateFlexible(
                                      item.manutenzioneDataFine || "",
                                    )
                                  : null;
                                const progDisplay = item.manutenzioneProgrammata
                                  ? formatDateForDisplay(progDate)
                                  : null;

                                const giorniRev = giorniDaOggi(scadenzaDate);
                                const classeRev =
                                  giorniRev !== null && giorniRev <= 30
                                    ? "deadline-danger"
                                    : "";

                                let classeProg = "";
                                if (progDate) {
                                  const giorniProg = giorniDaOggi(progDate);
                                  if (giorniProg !== null && giorniProg <= 5) {
                                    classeProg = "deadline-high";
                                  } else if (
                                    giorniProg !== null &&
                                    giorniProg <= 15
                                  ) {
                                    classeProg = "deadline-medium";
                                  } else if (
                                    giorniProg !== null &&
                                    giorniProg <= 30
                                  ) {
                                    classeProg = "deadline-low";
                                  }
                                }

                                return (
                                  <div key={item.id} className="mezzo-card">
                                    <div className="mezzo-card-row">
                                      {item.fotoUrl ? (
                                        <div className="mezzo-thumb">
                                          <img
                                            src={item.fotoUrl}
                                            alt={item.targa}
                                          />
                                        </div>
                                      ) : null}
                                      <div className="mezzo-info">
                                        <div className="mezzo-info-title">
                                          {[
                                            String(item.marca || "")
                                              .trim()
                                              .toUpperCase(),
                                            String(item.modello || "")
                                              .trim()
                                              .toUpperCase(),
                                          ]
                                            .filter(Boolean)
                                            .join(" ") || "-"}
                                        </div>
                                        <div className="mezzo-info-line">
                                          Targa:{" "}
                                          {String(item.targa || "")
                                            .trim()
                                            .toUpperCase()}
                                        </div>
                                        <div className="mezzo-info-line">
                                          Categoria:{" "}
                                          {normalizeNextMezzoCategoria(
                                            item.categoria,
                                          )}
                                        </div>
                                        <div
                                          className={`mezzo-info-line ${classeRev}`}
                                        >
                                          Revisione: {revDisplay}
                                        </div>
                                        {progDisplay ? (
                                          <div
                                            className={`mezzo-info-line ${classeProg}`}
                                          >
                                            Manutenzione: {progDisplay}
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="mezzo-card-actions">
                                      <button
                                        type="button"
                                        className="btn btn-small btn-outline"
                                        onClick={() => loadMezzoInForm(item)}
                                      >
                                        Modifica
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-small btn-primary"
                                        onClick={() =>
                                          navigate(
                                            buildNextDossierPath(item.targa),
                                          )
                                        }
                                      >
                                        Dossier Mezzo
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-small btn-danger"
                                        onClick={() => handleDelete(item.id)}
                                      >
                                        Elimina
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
