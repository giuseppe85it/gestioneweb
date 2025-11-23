// src/pages/Mezzi.tsx
import React, { useEffect, useRef, useState } from "react";
import "./Mezzi.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";

const MEZZI_KEY = "@mezzi_aziendali";
const LAVORI_KEY = "@lavori";

type TipoMezzo = "trattore" | "cisterna" | "motrice" | "altro";

interface Mezzo {
  id: string;
  targa: string;
  proprietario: string;
  marcaModello: string;
  tipo: TipoMezzo;
  numeroTelaio: string;
  anno: string;
  autista: string;
  fotoUrl?: string; // lasciata per futura integrazione con Storage
  manutenzioneProgrammata: {
    attiva: boolean;
    officina: string;
    scadenza: string;
    note: string;
  };
  collaudo: {
    ultima: string;
    prossima: string;
    luogo: string;
  };
  noteGenerali: string;
}

// --------------------------------------------------------
// UTIL COLLAUDI → LAVORI IN ATTESA
// --------------------------------------------------------
function giorniDaOggi(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

async function ensureLavoroCollaudo(targa: string, dataProssima: string) {
  if (!targa || !dataProssima) return;

  const giorni = giorniDaOggi(dataProssima);
  if (Number.isNaN(giorni) || giorni > 30) {
    // fuori finestra 30 gg → nessun lavoro automatico
    return;
  }

  let urgenza: "bassa" | "media" | "alta";
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

  const descrizione = `Collaudo in scadenza per ${targa.toUpperCase()} – ${fascia}`;
  const nowIso = new Date().toISOString();

  const idx = lavori.findIndex(
    (l) =>
      !l.eseguito &&
      l.tipo === "targa" &&
      l.targa === targa.toUpperCase() &&
      l.segnalatoDa === "sistema:collaudo"
  );

  if (idx >= 0) {
    // aggiorno descrizione + urgenza
    lavori[idx] = {
      ...lavori[idx],
      descrizione,
      urgenza,
      dataInserimento: nowIso,
    };
  } else {
    // creo nuovo lavoro
    lavori.push({
      id: `COLL-${Date.now()}`,
      descrizione,
      targa: targa.toUpperCase(),
      tipo: "targa",
      gruppoId: targa.toUpperCase(),
      eseguito: false,
      urgenza,
      dataInserimento: nowIso,
      segnalatoDa: "sistema:collaudo",
    });
  }

  await setItemSync(LAVORI_KEY, lavori);

  if (urgenza === "alta") {
    alert(
      `ATTENZIONE: collaudo per ${targa.toUpperCase()} in scadenza entro 5 giorni. Lavoro impostato con priorità ALTA.`
    );
  }
}

const Mezzi: React.FC = () => {
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [targa, setTarga] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [marcaModello, setMarcaModello] = useState("");
  const [tipo, setTipo] = useState<TipoMezzo>("trattore");
  const [numeroTelaio, setNumeroTelaio] = useState("");
  const [anno, setAnno] = useState("");
  const [autista, setAutista] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [manutAttiva, setManutAttiva] = useState(false);
  const [officina, setOfficina] = useState("");
  const [scadenzaManut, setScadenzaManut] = useState("");
  const [noteManut, setNoteManut] = useState("");
  const [collaudoUltimo, setCollaudoUltimo] = useState("");
  const [collaudoProssimo, setCollaudoProssimo] = useState("");
  const [collaudoLuogo, setCollaudoLuogo] = useState("");
  const [noteGenerali, setNoteGenerali] = useState("");

  // foto mezzo: preview locale
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isFotoDirty, setIsFotoDirty] = useState(false);

  // libretto: solo per IA esterna, non salvato
  const [librettoPreview, setLibrettoPreview] = useState<string | null>(null);

  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const librettoInputRef = useRef<HTMLInputElement | null>(null);

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
    setProprietario("");
    setMarcaModello("");
    setTipo("trattore");
    setNumeroTelaio("");
    setAnno("");
    setAutista("");
    setFotoUrl(undefined);
    setManutAttiva(false);
    setOfficina("");
    setScadenzaManut("");
    setNoteManut("");
    setCollaudoUltimo("");
    setCollaudoProssimo("");
    setCollaudoLuogo("");
    setNoteGenerali("");
    setFotoPreview(null);
    setIsFotoDirty(false);
    setLibrettoPreview(null);
    setError(null);
  };

  const loadMezzoInForm = (m: Mezzo) => {
    setEditingId(m.id);
    setTarga(m.targa);
    setProprietario(m.proprietario);
    setMarcaModello(m.marcaModello);
    setTipo(m.tipo);
    setNumeroTelaio(m.numeroTelaio);
    setAnno(m.anno);
    setAutista(m.autista);
    setFotoUrl(m.fotoUrl);
    setManutAttiva(m.manutenzioneProgrammata.attiva);
    setOfficina(m.manutenzioneProgrammata.officina);
    setScadenzaManut(m.manutenzioneProgrammata.scadenza);
    setNoteManut(m.manutenzioneProgrammata.note);
    setCollaudoUltimo(m.collaudo.ultima);
    setCollaudoProssimo(m.collaudo.prossima);
    setCollaudoLuogo(m.collaudo.luogo);
    setNoteGenerali(m.noteGenerali);

    setFotoPreview(m.fotoUrl || null);
    setIsFotoDirty(false);
    setLibrettoPreview(null);
  };

  // --------------------------------------------------------
  // FOTO MEZZO (camera + galleria, lato browser)
  // --------------------------------------------------------
  const handleFotoChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setFotoPreview(result);
        setFotoUrl(result); // per ora salviamo il dataURL in Firestore via storageSync
        setIsFotoDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // --------------------------------------------------------
  // LIBRETTO (solo per IA esterna, non salvato nel mezzo)
  // --------------------------------------------------------
  const handleLibrettoChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setLibrettoPreview(result);
        // Da qui in avanti usi questa immagine manualmente con ChatGPT
        // (Opzione B: flusso manuale, nessuna chiamata API automatica).
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError(null);

    const tg = targa.trim().toUpperCase();
    if (!tg) {
      setError("La targa è obbligatoria.");
      return;
    }

    if (!marcaModello.trim()) {
      setError("Inserisci marca e modello.");
      return;
    }

    const nuovo: Mezzo = {
      id: editingId || `MEZZO-${Date.now()}`,
      targa: tg,
      proprietario: proprietario.trim(),
      marcaModello: marcaModello.trim(),
      tipo,
      numeroTelaio: numeroTelaio.trim(),
      anno: anno.trim(),
      autista: autista.trim(),
      fotoUrl: fotoUrl || undefined,
      manutenzioneProgrammata: {
        attiva: manutAttiva,
        officina: officina.trim(),
        scadenza: scadenzaManut || "",
        note: noteManut.trim(),
      },
      collaudo: {
        ultima: collaudoUltimo || "",
        prossima: collaudoProssimo || "",
        luogo: collaudoLuogo.trim(),
      },
      noteGenerali: noteGenerali.trim(),
    };

    let updated: Mezzo[];
    if (editingId) {
      updated = mezzi.map((m) => (m.id === editingId ? nuovo : m));
    } else {
      updated = [...mezzi, nuovo];
    }

    try {
      await setItemSync(MEZZI_KEY, updated);
      setMezzi(updated);

      if (nuovo.collaudo.prossima) {
        await ensureLavoroCollaudo(nuovo.targa, nuovo.collaudo.prossima);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError("Errore nel salvataggio del mezzo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Vuoi eliminare questo mezzo?")) return;

    const updated = mezzi.filter((m) => m.id !== id);
    try {
      await setItemSync(MEZZI_KEY, updated);
      setMezzi(updated);
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      setError("Errore nell'eliminazione del mezzo.");
    }
  };

  const exportMezzoPdf = async (mezzo: Mezzo) => {
    try {
      await generateSmartPDF({
        kind: "mezzo",
        title: `Scheda Mezzo ${mezzo.targa}`,
        mezzo: {
          targa: mezzo.targa,
          marcaModello: mezzo.marcaModello,
          tipo: mezzo.tipo,
          numeroTelaio: mezzo.numeroTelaio,
          anno: mezzo.anno,
          autista: mezzo.autista,
          proprietario: mezzo.proprietario,
          ultimoCollaudo: mezzo.collaudo.ultima,
          ultimoControllo: mezzo.manutenzioneProgrammata.scadenza,
          noteGenerali: mezzo.noteGenerali,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Impossibile generare il PDF del mezzo.");
    }
  };

  return (
    <div className="mezzi-page">
      <div className="mezzi-card">
        <header className="mezzi-header">
          <img src="/logo.png" alt="Logo" className="mezzi-logo" />
          <h1>Mezzi Aziendali</h1>
        </header>

        {error && <div className="mezzi-error">{error}</div>}

        {/* FORM PRINCIPALE */}
        <div className="mezzi-form">
          {/* BLOCCO FOTO MEZZO */}
          <div className="mezzi-photo-block">
            <div className="mezzi-photo-preview">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Mezzo" className="mezzi-photo-img" />
              ) : (
                <div className="mezzi-photo-placeholder">FOTO MEZZO</div>
              )}
            </div>

            <div className="mezzi-photo-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => fotoInputRef.current?.click()}
              >
                Foto mezzo (camera / galleria)
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />
              {isFotoDirty && (
                <span className="mezzi-photo-note">
                  La foto verrà salvata alla conferma del mezzo.
                </span>
              )}
            </div>
          </div>

          {/* BLOCCO SCANSIONE LIBRETTO */}
          <div className="mezzi-libretto-block">
            <div className="mezzi-libretto-header">
              <span className="mezzi-section-title">Scansiona libretto</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => librettoInputRef.current?.click()}
              >
                Scansiona / Carica libretto
              </button>
              <input
                ref={librettoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleLibrettoChange}
              />
            </div>
            {librettoPreview && (
              <div className="mezzi-libretto-preview">
                <img
                  src={librettoPreview}
                  alt="Libretto"
                  className="mezzi-libretto-img"
                />
                <p className="mezzi-libretto-help">
                  Usa questa foto con l&apos;IA per estrarre i dati del mezzo
                  (targa, telaio, ecc.), poi incollali nei campi qui sotto.
                </p>
              </div>
            )}
          </div>

          {/* DATI PRINCIPALI */}
          <div className="mezzi-form-row">
            <div className="mezzi-field">
              <label>Targa</label>
              <input
                className="mezzi-input"
                value={targa}
                onChange={(e) => setTarga(e.target.value.toUpperCase())}
                placeholder="TI 123456"
              />
            </div>

            <div className="mezzi-field">
              <label>Proprietario</label>
              <input
                className="mezzi-input"
                value={proprietario}
                onChange={(e) => setProprietario(e.target.value)}
                placeholder="GHIELMICEMENTI SA"
              />
            </div>
          </div>

          <div className="mezzi-field">
            <label>Marca e modello</label>
            <input
              className="mezzi-input"
              value={marcaModello}
              onChange={(e) => setMarcaModello(e.target.value)}
              placeholder="RENAULT C430 6×2"
            />
          </div>

          <div className="mezzi-form-row">
            <div className="mezzi-field">
              <label>Tipo mezzo</label>
              <select
                className="mezzi-input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMezzo)}
              >
                <option value="trattore">Trattore</option>
                <option value="cisterna">Cisterna</option>
                <option value="motrice">Motrice</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div className="mezzi-field">
              <label>Anno immatricolazione</label>
              <input
                className="mezzi-input"
                value={anno}
                onChange={(e) => setAnno(e.target.value)}
                placeholder="2022"
              />
            </div>
          </div>

          <div className="mezzi-form-row">
            <div className="mezzi-field">
              <label>Numero telaio</label>
              <input
                className="mezzi-input"
                value={numeroTelaio}
                onChange={(e) => setNumeroTelaio(e.target.value)}
                placeholder="VF6…"
              />
            </div>

            <div className="mezzi-field">
              <label>Autista abituale</label>
              <input
                className="mezzi-input"
                value={autista}
                onChange={(e) => setAutista(e.target.value)}
                placeholder="Nome collega"
              />
            </div>
          </div>

          {/* MANUTENZIONE PROGRAMMATA */}
          <div className="mezzi-section-title">Manutenzione programmata</div>
          <div className="mezzi-form-row">
            <div className="mezzi-field mezzi-field-switch">
              <label>Attiva</label>
              <input
                type="checkbox"
                checked={manutAttiva}
                onChange={(e) => setManutAttiva(e.target.checked)}
              />
            </div>

            <div className="mezzi-field">
              <label>Scadenza</label>
              <input
                type="date"
                className="mezzi-input"
                value={scadenzaManut}
                onChange={(e) => setScadenzaManut(e.target.value)}
              />
            </div>
          </div>

          <div className="mezzi-form-row">
            <div className="mezzi-field">
              <label>Officina</label>
              <input
                className="mezzi-input"
                value={officina}
                onChange={(e) => setOfficina(e.target.value)}
                placeholder="Officina convenzionata"
              />
            </div>

            <div className="mezzi-field">
              <label>Note manutenzione</label>
              <input
                className="mezzi-input"
                value={noteManut}
                onChange={(e) => setNoteManut(e.target.value)}
                placeholder="Note brevi"
              />
            </div>
          </div>

          {/* COLLAUDO */}
          <div className="mezzi-section-title">Collaudo</div>
          <div className="mezzi-form-row">
            <div className="mezzi-field">
              <label>Ultimo collaudo</label>
              <input
                type="date"
                className="mezzi-input"
                value={collaudoUltimo}
                onChange={(e) => setCollaudoUltimo(e.target.value)}
              />
            </div>

            <div className="mezzi-field">
              <label>Prossimo collaudo</label>
              <input
                type="date"
                className="mezzi-input"
                value={collaudoProssimo}
                onChange={(e) => setCollaudoProssimo(e.target.value)}
              />
            </div>
          </div>

          <div className="mezzi-field">
            <label>Luogo collaudo</label>
            <input
              className="mezzi-input"
              value={collaudoLuogo}
              onChange={(e) => setCollaudoLuogo(e.target.value)}
              placeholder="Camorino, ecc."
            />
          </div>

          {/* NOTE GENERALI */}
          <div className="mezzi-field">
            <label>Note generali</label>
            <textarea
              className="mezzi-textarea"
              value={noteGenerali}
              onChange={(e) => setNoteGenerali(e.target.value)}
              rows={3}
            />
          </div>

          <div className="mezzi-actions">
            <button className="btn-primary" onClick={handleSave}>
              {editingId ? "Salva modifiche" : "Salva mezzo"}
            </button>
            <button className="btn-secondary" onClick={resetForm}>
              Reset
            </button>
          </div>
        </div>

        {/* LISTA MEZZI (la teniamo finché il Dossier non è pronto) */}
        <div className="mezzi-list-wrapper">
          <h2 className="mezzi-list-title">Elenco mezzi</h2>
          {loading ? (
            <div className="mezzi-empty">Caricamento mezzi…</div>
          ) : mezzi.length === 0 ? (
            <div className="mezzi-empty">Nessun mezzo inserito.</div>
          ) : (
            <div className="mezzi-list">
              {mezzi.map((m) => (
                <div key={m.id} className="mezzi-row">
                  <div className="mezzi-row-main">
                    <div className="mezzi-row-targa">{m.targa}</div>
                    <div className="mezzi-row-desc">
                      {m.marcaModello}
                      {m.proprietario && (
                        <span className="mezzi-row-proprietario">
                          {" — "}
                          {m.proprietario}
                        </span>
                      )}
                    </div>
                    <div className="mezzi-row-sub">
                      <span>{m.tipo}</span>
                      {m.collaudo.prossima && (
                        <span className="mezzi-row-collaudo">
                          Collaudo: {m.collaudo.prossima}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mezzi-row-actions">
                    <button
                      className="btn-small"
                      onClick={() => loadMezzoInForm(m)}
                    >
                      Modifica
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => exportMezzoPdf(m)}
                    >
                      PDF
                    </button>
                    <button
                      className="btn-danger-small"
                      onClick={() => handleDelete(m.id)}
                    >
                      Elimina
                    </button>
                    {/* collegamento dossier da completare quando avremo la pagina */}
                    {/* <button
                      className="btn-small"
                      onClick={() => navigate(`/dossier-mezzo/${m.id}`)}
                    >
                      Dossier
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mezzi;
