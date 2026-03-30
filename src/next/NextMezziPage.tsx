import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaCollegaItem,
  type NextAnagraficheFlottaMezzoItem,
} from "./nextAnagraficheFlottaDomain";
import {
  markNextFlottaCloneDeleted,
  upsertNextFlottaClonePatch,
} from "./nextFlottaCloneState";
import { formatEditableDateUI } from "./nextDateFormat";
import { buildNextDossierPath } from "./nextStructuralPaths";
import "../pages/Mezzi.css";

const CATEGORIE = [
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

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Impossibile leggere i mezzi del clone.";
}

function normalizeTarga(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
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

export default function NextMezziPage() {
  const navigate = useNavigate();
  const [mezzi, setMezzi] = useState<NextAnagraficheFlottaMezzoItem[]>([]);
  const [colleghi, setColleghi] = useState<NextAnagraficheFlottaCollegaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingTarga, setEditingTarga] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<"motrice" | "cisterna">("motrice");
  const [targa, setTarga] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [telaio, setTelaio] = useState("");
  const [colore, setColore] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [assicurazione, setAssicurazione] = useState("");
  const [dataImmatricolazione, setDataImmatricolazione] = useState("");
  const [dataScadenzaRevisione, setDataScadenzaRevisione] = useState("");
  const [dataUltimoCollaudo, setDataUltimoCollaudo] = useState("");
  const [autistaId, setAutistaId] = useState("");
  const [note, setNote] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [librettoUrl, setLibrettoUrl] = useState<string | null>(null);
  const [librettoName, setLibrettoName] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await readNextAnagraficheFlottaSnapshot();
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

  const selectedAutista = useMemo(
    () => colleghi.find((item) => item.id === autistaId) ?? null,
    [autistaId, colleghi],
  );

  const resetForm = () => {
    setEditingTarga(null);
    setCategoria("");
    setTipo("motrice");
    setTarga("");
    setMarca("");
    setModello("");
    setTelaio("");
    setColore("");
    setProprietario("");
    setAssicurazione("");
    setDataImmatricolazione("");
    setDataScadenzaRevisione("");
    setDataUltimoCollaudo("");
    setAutistaId("");
    setNote("");
    setFotoUrl(null);
    setLibrettoUrl(null);
    setLibrettoName("");
  };

  const handleEdit = (item: NextAnagraficheFlottaMezzoItem) => {
    setEditingTarga(item.targa);
    setCategoria(item.categoria || "");
    setTipo(item.tipo ?? "motrice");
    setTarga(item.targa);
    setMarca(item.marca);
    setModello(item.modello);
    setTelaio(item.telaio);
    setColore(item.colore);
    setProprietario(item.proprietario);
    setAssicurazione(item.assicurazione);
    setDataImmatricolazione(formatEditableDateUI(item.dataImmatricolazione));
    setDataScadenzaRevisione(formatEditableDateUI(item.dataScadenzaRevisione));
    setDataUltimoCollaudo(formatEditableDateUI(item.dataUltimoCollaudo));
    setAutistaId(item.autistaId ?? "");
    setNote(item.note);
    setFotoUrl(item.fotoUrl ?? null);
    setLibrettoUrl(item.librettoUrl ?? null);
    setLibrettoName(item.librettoUrl ? "Libretto esistente" : "");
    setNotice(null);
  };

  const handleSave = async () => {
    const normalizedTarga = normalizeTarga(targa);
    if (!normalizedTarga || !marca.trim() || !modello.trim()) {
      setNotice("Compila almeno targa, marca e modello prima di salvare.");
      return;
    }

    upsertNextFlottaClonePatch({
      mezzoId: editingTarga ? mezzi.find((item) => item.targa === editingTarga)?.id ?? null : null,
      targa: normalizedTarga,
      categoria: categoria || "Senza categoria",
      tipo,
      marca: marca.trim().toUpperCase(),
      modello: modello.trim().toUpperCase(),
      telaio: telaio.trim().toUpperCase() || null,
      colore: colore.trim() || null,
      proprietario: proprietario.trim() || null,
      assicurazione: assicurazione.trim() || null,
      dataImmatricolazione: dataImmatricolazione || null,
      dataScadenzaRevisione: dataScadenzaRevisione || null,
      dataUltimoCollaudo: dataUltimoCollaudo || null,
      autistaId: autistaId || null,
      autistaNome: selectedAutista?.nomeCompleto ?? null,
      note: note.trim() || null,
      fotoUrl,
      fotoStoragePath: null,
      librettoUrl,
      librettoStoragePath: librettoUrl
        ? `next-clone/libretti/${normalizedTarga}/${librettoName || "libretto"}`
        : null,
      updatedAt: Date.now(),
      source: "mezzi",
    });

    setNotice(editingTarga ? "Mezzo aggiornato nel clone." : "Mezzo aggiunto nel clone.");
    resetForm();
    await load();
  };

  const handleDelete = async (item: NextAnagraficheFlottaMezzoItem) => {
    if (!window.confirm(`Eliminare ${item.targa} dal clone?`)) {
      return;
    }
    markNextFlottaCloneDeleted(item.targa);
    if (editingTarga === item.targa) {
      resetForm();
    }
    setNotice(`Mezzo ${item.targa} eliminato dal clone.`);
    await load();
  };

  return (
    <NextClonePageScaffold
      eyebrow="Flotta / Mezzi"
      title="Gestione Mezzi"
      description="Route NEXT nativa dei mezzi: form, foto, libretto locale e dossier lavorano nel clone senza riaprire la madre."
      backTo="/next"
      backLabel="Home"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? <div className="next-clone-placeholder">Caricamento mezzi...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          <p style={{ margin: 0 }}>
            I salvataggi restano locali al clone NEXT e aggiornano dossier, libretto e foto senza toccare la madre.
          </p>
        </div>
      }
    >
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
              <div className="section-block foto-section">
                <div className="section-header">
                  <h2>Foto mezzo</h2>
                  <p>Scatta o carica una foto del mezzo.</p>
                </div>
                <div className="foto-row">
                  <div className="foto-preview-wrapper">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Foto mezzo" className="foto-preview" />
                    ) : (
                      <div className="foto-placeholder">Nessuna foto selezionata</div>
                    )}
                  </div>
                  <div className="foto-actions">
                    <label className="btn btn-secondary">
                      Carica foto
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
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
                    <button type="button" className="btn btn-ghost" onClick={() => setFotoUrl(null)}>
                      Rimuovi foto
                    </button>
                  </div>
                </div>
              </div>

              <div className="section-block">
                <div className="section-header">
                  <h2>LIBRETTO (IA locale)</h2>
                  <p>Carica un file locale e aggancialo subito al mezzo nel clone.</p>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Immagine o PDF libretto</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setLibrettoName(file.name);
                        try {
                          setLibrettoUrl(await readFileAsDataUrl(file));
                          setNotice(`Analisi locale completata per ${normalizeTarga(targa) || "nuovo mezzo"}: libretto pronto al salvataggio clone.`);
                        } catch (fileError) {
                          setNotice(readErrorMessage(fileError));
                        } finally {
                          event.target.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
                {librettoName ? (
                  <div className="alert" style={{ marginTop: 12 }}>
                    File libretto selezionato: {librettoName}
                  </div>
                ) : null}
              </div>

              <div className="section-block form-section">
                <h2>Dati generali</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria mezzo</label>
                    <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                      <option value="">Seleziona categoria</option>
                      {CATEGORIE.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={tipo} onChange={(event) => setTipo(event.target.value as "motrice" | "cisterna")}>
                      <option value="motrice">Motrice</option>
                      <option value="cisterna">Cisterna</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Autista</label>
                    <select value={autistaId} onChange={(event) => setAutistaId(event.target.value)}>
                      <option value="">Seleziona autista</option>
                      {colleghi.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nomeCompleto}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Targa</label>
                    <input value={targa} onChange={(event) => setTarga(event.target.value.toUpperCase())} />
                  </div>
                  <div className="form-group">
                    <label>Marca</label>
                    <input value={marca} onChange={(event) => setMarca(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Modello</label>
                    <input value={modello} onChange={(event) => setModello(event.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Telaio</label>
                    <input value={telaio} onChange={(event) => setTelaio(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Colore</label>
                    <input value={colore} onChange={(event) => setColore(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Proprietario</label>
                    <input value={proprietario} onChange={(event) => setProprietario(event.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assicurazione</label>
                    <input value={assicurazione} onChange={(event) => setAssicurazione(event.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Data immatricolazione</label>
                    <input type="text" value={dataImmatricolazione} onChange={(event) => setDataImmatricolazione(event.target.value)} placeholder="gg mm aaaa" />
                  </div>
                  <div className="form-group">
                    <label>Revisione</label>
                    <input type="text" value={dataScadenzaRevisione} onChange={(event) => setDataScadenzaRevisione(event.target.value)} placeholder="gg mm aaaa" />
                  </div>
                  <div className="form-group">
                    <label>Ultimo collaudo</label>
                    <input type="text" value={dataUltimoCollaudo} onChange={(event) => setDataUltimoCollaudo(event.target.value)} placeholder="gg mm aaaa" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Note</label>
                    <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={resetForm}>
                    Reset form
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => void handleSave()}>
                    {editingTarga ? "Salva modifiche" : "Salva mezzo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card-430 mezzi-list-card">
          <div className="card-header">
            <h2 className="card-title">Elenco mezzi</h2>
            <p className="card-subtitle">Seleziona un mezzo per modificare o aprire il dossier.</p>
          </div>
          <div className="card-body">
            {mezzi.length === 0 ? (
              <p className="empty-text">Nessun mezzo registrato nel clone.</p>
            ) : (
              <div className="mezzi-list">
                {mezzi.map((item) => (
                  <div key={item.targa} className="mezzo-card">
                    <div className="mezzo-card-row">
                      {item.fotoUrl ? (
                        <div className="mezzo-thumb">
                          <img src={item.fotoUrl} alt={item.targa} />
                        </div>
                      ) : null}
                      <div className="mezzo-info">
                        <div className="mezzo-info-title">
                          {`${item.marca || "-"} ${item.modello || "-"}`.trim()}
                        </div>
                        <div className="mezzo-info-line">Targa: {item.targa}</div>
                        <div className="mezzo-info-line">Categoria: {item.categoria}</div>
                        <div className="mezzo-info-line">Autista: {item.autistaNome || "-"}</div>
                      </div>
                    </div>
                    <div className="mezzo-card-actions">
                      <button type="button" className="btn btn-small btn-outline" onClick={() => handleEdit(item)}>
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => navigate(buildNextDossierPath(item.targa))}
                      >
                        Dossier Mezzo
                      </button>
                      <button type="button" className="btn btn-small btn-danger" onClick={() => void handleDelete(item)}>
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
    </NextClonePageScaffold>
  );
}
