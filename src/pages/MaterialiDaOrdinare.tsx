// src/pages/MaterialiDaOrdinare.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MaterialeOrdine, Ordine, UnitaMisura } from "../types/ordini";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";

import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

import "./MaterialiDaOrdinare.css";

interface Fornitore {
  id: string;
  nome: string;
}

interface MaterialiDaOrdinareProps {
  embedded?: boolean;
}

type FabbisogniTab = "Fabbisogni" | "Ordini" | "Arrivi" | "Prezzi & Preventivi";

const ORDINI_DOC_ID = "@ordini";
const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const oggi = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
};

// immagini automatiche in base alla descrizione
const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function trovaImmagineAutomatica(desc: string): string | null {
  for (const m of immaginiAutomatiche) {
    if (m.pattern.test(desc)) return m.url;
  }
  return null;
}

const TABS: FabbisogniTab[] = ["Fabbisogni", "Ordini", "Arrivi", "Prezzi & Preventivi"];

const MaterialiDaOrdinare: React.FC<MaterialiDaOrdinareProps> = ({ embedded = false }) => {
  const navigate = useNavigate();

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fornitoreId, setFornitoreId] = useState<string>("");
  const [fornitoreNome, setFornitoreNome] = useState<string>("");

  const [isNuovoFornitore, setIsNuovoFornitore] = useState<boolean>(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] =
    useState<string>("");

  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [materiali, setMateriali] = useState<MaterialeOrdine[]>([]);
  const [loading, setLoading] = useState(false);

  // Stato solo UI (nessun impatto su salvataggi/schema)
  const [activeTab, setActiveTab] = useState<FabbisogniTab>("Fabbisogni");
  const [searchText, setSearchText] = useState("");
  const [placeholderModal, setPlaceholderModal] = useState<{
    action: "Prezzi" | "Allegati" | "Note";
    materialeId: string;
    descrizione: string;
  } | null>(null);

  // Carica fornitori
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "storage", "@fornitori"));
        if (snap.exists()) {
          const arr = (snap.data()?.value || []) as any[];
          const conv: Fornitore[] = arr.map((f) => ({
            id: f.id || generaId(),
            nome: f.nome || f.ragioneSociale || "",
          }));
          setFornitori(conv);
        }
      } catch (err) {
        console.error("Errore caricamento fornitori:", err);
      }
    };
    load();
  }, []);

  const handleSelectFornitore = (id: string) => {
    if (id === "nuovo") {
      setIsNuovoFornitore(true);
      setFornitoreId("nuovo");
      setFornitoreNome("");
      return;
    }

    setIsNuovoFornitore(false);
    setFornitoreId(id);

    const f = fornitori.find((x) => x.id === id);
    setFornitoreNome(f?.nome || "");
  };

  const handleDescrizioneBlur = () => {
    if (fotoFile || fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
  };

  const aggiungiMateriale = async () => {
    if (!descrizione.trim() || !quantita.trim()) return;

    const id = generaId();
    let fotoUrl: string | null = fotoPreview || null;
    let fotoStoragePath: string | null = null;

    if (fotoFile) {
      try {
        const uploaded = await uploadMaterialImage(fotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      } catch (err) {
        console.error("Errore upload immagine:", err);
      }
    }

    const nuovo: MaterialeOrdine = {
      id,
      descrizione: descrizione.trim().toUpperCase(),
      quantita: parseFloat(quantita),
      unita,
      arrivato: false,
      fotoUrl,
      fotoStoragePath,
    };

    setMateriali((p) => [...p, nuovo]);
    resetMateriale();
  };

  const eliminaMateriale = async (id: string) => {
    const mat = materiali.find((m) => m.id === id);
    if (mat?.fotoStoragePath) await deleteMaterialImage(mat.fotoStoragePath);
    setMateriali((p) => p.filter((m) => m.id !== id));
  };

  const salvaOrdine = async () => {
    if (!materiali.length) return;

    let nomeFinale = fornitoreNome;

    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim() !== "") {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }

    if (!nomeFinale) return;

    setLoading(true);
    try {
      const ref = doc(collection(db, "storage"), ORDINI_DOC_ID);
      const snap = await getDoc(ref);
      const existing: Ordine[] = snap.exists()
        ? ((snap.data()?.value as Ordine[]) || [])
        : [];

      const nuovoOrdine: Ordine = {
        id: generaId(),
        idFornitore: fornitoreId === "nuovo" ? generaId() : fornitoreId,
        nomeFornitore: nomeFinale,
        dataOrdine: oggi(),
        materiali,
        arrivato: false, // OBBLIGATORIO
      };

      const updated = [...existing, nuovoOrdine];
      await setDoc(ref, { value: updated }, { merge: true });

      setMateriali([]);
      setFornitoreId("");
      setFornitoreNome("");
      setNomeFornitorePersonalizzato("");
      setIsNuovoFornitore(false);
    } catch (err) {
      console.error("Errore salvataggio ordine:", err);
    } finally {
      setLoading(false);
    }
  };

  const materialiFiltrati = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return materiali;

    return materiali.filter((m) => {
      const fornitoreRiga = String((m as any)?.fornitore ?? "").toLowerCase();
      return (
        m.descrizione.toLowerCase().includes(q) ||
        fornitoreRiga.includes(q) ||
        String(m.id).toLowerCase().includes(q)
      );
    });
  }, [materiali, searchText]);

  const canSaveOrdine =
    !loading &&
    materiali.length > 0 &&
    (!!fornitoreNome || !!nomeFornitorePersonalizzato.trim());

  const getOptionalText = (m: MaterialeOrdine, keys: string[]) => {
    for (const key of keys) {
      const value = (m as any)?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    }
    return "—";
  };

  if (embedded) {
    return (
      <div className="mdo-page mdo-page--embedded mdo-page--single">
        <div className="mdo-card mdo-card--embedded mdo-card--single">
          <section className="mdo-single-card">
            <div className="mdo-single-toolbar">
              <div className="mdo-single-toolbar-main">
                <div className="mdo-field">
                  <label>Fornitore</label>
                  <select
                    value={fornitoreId}
                    onChange={(e) => handleSelectFornitore(e.target.value)}
                  >
                    <option value="">Seleziona</option>
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                    <option value="nuovo">+ Nuovo fornitore</option>
                  </select>
                </div>

                {isNuovoFornitore && (
                  <div className="mdo-field">
                    <label>Nome nuovo fornitore</label>
                    <input
                      type="text"
                      value={nomeFornitorePersonalizzato}
                      onChange={(e) => setNomeFornitorePersonalizzato(e.target.value)}
                    />
                  </div>
                )}

                <label className="mdo-search mdo-search--embedded">
                  <span>Cerca</span>
                  <input
                    type="search"
                    placeholder="Descrizione o fornitore"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </label>
              </div>

              <div className="mdo-single-toolbar-side">
                <div className="mdo-kpi-strip">
                  <div className="mdo-kpi">
                    <span>Righe</span>
                    <strong>{materiali.length}</strong>
                  </div>
                  <div className="mdo-kpi">
                    <span>Filtrate</span>
                    <strong>{materialiFiltrati.length}</strong>
                  </div>
                </div>
                <div className="mdo-cta-row mdo-cta-row--embedded">
                  <button type="button" className="mdo-cta-button">Carica preventivo</button>
                  <button type="button" className="mdo-cta-button">PDF Fornitori</button>
                  <button type="button" className="mdo-cta-button mdo-cta-primary">PDF Direzione</button>
                </div>
              </div>
            </div>

            <div className="mdo-table-wrap mdo-table-wrap--single">
              <table className="mdo-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Q.tà</th>
                    <th>Unità</th>
                    <th>Fornitore</th>
                    <th>Residuo</th>
                    <th>Fonte prezzo</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mdo-insert-row">
                    <td>
                      <div className="mdo-insert-desc">
                        <div className="mdo-item-photo mdo-item-photo--insert">
                          {fotoPreview ? (
                            <img src={fotoPreview} alt="Anteprima materiale" />
                          ) : (
                            <div className="mdo-photo-placeholder small">Foto</div>
                          )}
                        </div>
                        <input
                          className="mdo-table-input"
                          type="text"
                          placeholder="Descrizione materiale"
                          value={descrizione}
                          onChange={(e) => setDescrizione(e.target.value)}
                          onBlur={handleDescrizioneBlur}
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        className="mdo-table-input mdo-table-input--qty"
                        type="number"
                        placeholder="0"
                        value={quantita}
                        onChange={(e) => setQuantita(e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="mdo-table-input"
                        value={unita}
                        onChange={(e) => setUnita(e.target.value as UnitaMisura)}
                      >
                        <option value="pz">pz</option>
                        <option value="m">m</option>
                        <option value="kg">kg</option>
                        <option value="lt">lt</option>
                      </select>
                    </td>
                    <td>
                      <div className="mdo-table-muted">
                        {isNuovoFornitore
                          ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore"
                          : fornitoreNome || "Seleziona sopra"}
                      </div>
                    </td>
                    <td><span className="mdo-table-muted">—</span></td>
                    <td><span className="mdo-table-muted">—</span></td>
                    <td>
                      <div className="mdo-row-actions mdo-row-actions--insert">
                        <label className="mdo-chip-button mdo-chip-upload">
                          Foto
                          <input type="file" accept="image/*" onChange={handleFileChange} />
                        </label>
                        <button
                          type="button"
                          className="mdo-chip-button"
                          onClick={() => {
                            setFotoFile(null);
                            setFotoPreview(null);
                          }}
                        >
                          Pulisci
                        </button>
                        <button
                          type="button"
                          className="mdo-add-button"
                          onClick={aggiungiMateriale}
                          disabled={!descrizione.trim() || !quantita.trim()}
                        >
                          Aggiungi
                        </button>
                      </div>
                    </td>
                  </tr>

                  {materialiFiltrati.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="mdo-empty mdo-empty-state mdo-empty-state--table">
                          Nessun materiale inserito.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    materialiFiltrati.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="mdo-desc-cell">
                            <div className="mdo-item-photo">
                              {m.fotoUrl ? (
                                <img src={m.fotoUrl} alt={m.descrizione} />
                              ) : (
                                <div className="mdo-photo-placeholder small">Foto</div>
                              )}
                            </div>
                            <div>
                              <div className="mdo-item-desc">{m.descrizione}</div>
                              <div className="mdo-item-meta">ID: {m.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{m.quantita}</td>
                        <td>{m.unita}</td>
                        <td>{getOptionalText(m, ["fornitoreScelto", "fornitore", "nomeFornitore"])}</td>
                        <td>{getOptionalText(m, ["residuo", "quantitaResidua"])}</td>
                        <td>{getOptionalText(m, ["fontePrezzo", "prezzoFonte", "preventivoFonte"])}</td>
                        <td>
                          <div className="mdo-row-actions">
                            {(["Prezzi", "Allegati", "Note"] as const).map((action) => (
                              <button
                                key={action}
                                type="button"
                                className="mdo-chip-button"
                                onClick={() =>
                                  setPlaceholderModal({
                                    action,
                                    materialeId: m.id,
                                    descrizione: m.descrizione,
                                  })
                                }
                              >
                                {action}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="mdo-delete"
                              onClick={() => eliminaMateriale(m.id)}
                              aria-label={`Elimina ${m.descrizione}`}
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mdo-card-footer-bar">
              <div className="mdo-sticky-info">
                <span>Fornitore</span>
                <strong>
                  {isNuovoFornitore
                    ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore"
                    : fornitoreNome || "Non selezionato"}
                </strong>
              </div>
              <div className="mdo-sticky-info">
                <span>Materiali temporanei</span>
                <strong>{materiali.length}</strong>
              </div>
              <div className="mdo-sticky-actions">
                <button
                  type="button"
                  className="mdo-secondary-button"
                  onClick={() => navigate("/ordini-in-attesa")}
                >
                  Ordini in attesa
                </button>
                <button
                  type="button"
                  className="mdo-secondary-button"
                  onClick={() => navigate("/ordini-arrivati")}
                >
                  Ordini arrivati
                </button>
                <button
                  type="button"
                  className="mdo-header-button"
                  onClick={salvaOrdine}
                  disabled={!canSaveOrdine}
                >
                  {loading ? "SALVO..." : "CONFERMA ORDINE"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {placeholderModal && (
          <div
            className="mdo-modal-backdrop"
            role="presentation"
            onClick={() => setPlaceholderModal(null)}
          >
            <div
              className="mdo-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${placeholderModal.action} ${placeholderModal.descrizione}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{placeholderModal.action}</h3>
              <p className="mdo-modal-title">{placeholderModal.descrizione}</p>
              <p>Placeholder UI. Nessuna nuova logica o salvataggio introdotti in questa fase.</p>
              <button
                type="button"
                className="mdo-header-button"
                onClick={() => setPlaceholderModal(null)}
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const showFabbisogni = embedded || activeTab === "Fabbisogni";

  return (
    <div className={`mdo-page${embedded ? " mdo-page--embedded" : ""}`}>
      <div className={`mdo-card${embedded ? " mdo-card--embedded" : ""}`}>
        {!embedded && (
        <header className="mdo-shell-header">
          <div className="mdo-header-left">
            <img
              src="/logo.png"
              className="mdo-logo"
              alt="logo"
              onClick={() => navigate("/")}
            />
            <div>
              <p className="mdo-eyebrow">Acquisti</p>
              <h1 className="mdo-header-title">Materiali da ordinare</h1>
            </div>
          </div>

          <div className="mdo-header-right">
            <label className="mdo-search">
              <span>Cerca</span>
              <input
                type="search"
                placeholder="Descrizione o fornitore"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>
            <div className="mdo-cta-row">
              <button type="button" className="mdo-cta-button">Carica preventivo</button>
              <button type="button" className="mdo-cta-button">PDF Fornitori</button>
              <button type="button" className="mdo-cta-button mdo-cta-primary">PDF Direzione</button>
            </div>
          </div>
        </header>
        )}

        {!embedded && (
        <div className="mdo-tabs" role="tablist" aria-label="Sezioni acquisti">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`mdo-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab}</span>
              {tab !== "Fabbisogni" && <span className="mdo-tab-badge">In arrivo</span>}
            </button>
          ))}
        </div>
        )}

        {!showFabbisogni ? (
          <section className="mdo-placeholder-panel" aria-live="polite">
            <h2>{activeTab}</h2>
            <p>
              Sezione read-only in arrivo. In questa patch resta attiva solo la tab Fabbisogni
              con i dati esistenti della pagina.
            </p>
          </section>
        ) : (
          <div className="mdo-workspace">
            <aside className="mdo-sidebar">
              <section className="mdo-panel mdo-form-panel">
                <div className="mdo-panel-header">
                  <div>
                    <h2>Nuovo fabbisogno</h2>
                    <p>Compila i campi e aggiungi una riga ai materiali temporanei.</p>
                  </div>
                  <span className="mdo-panel-chip">{materiali.length} righe</span>
                </div>

                <div className="mdo-form">
                  <div className="mdo-field">
                    <label>Fornitore</label>
                    <select
                      value={fornitoreId}
                      onChange={(e) => handleSelectFornitore(e.target.value)}
                    >
                      <option value="">Seleziona</option>
                      {fornitori.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                      <option value="nuovo">+ Nuovo fornitore</option>
                    </select>
                  </div>

                  {isNuovoFornitore && (
                    <div className="mdo-field">
                      <label>Nome nuovo fornitore</label>
                      <input
                        type="text"
                        value={nomeFornitorePersonalizzato}
                        onChange={(e) => setNomeFornitorePersonalizzato(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="mdo-grid">
                    <div className="mdo-field">
                      <label>Descrizione</label>
                      <input
                        type="text"
                        value={descrizione}
                        onChange={(e) => setDescrizione(e.target.value)}
                        onBlur={handleDescrizioneBlur}
                      />
                    </div>
                    <div className="mdo-field">
                      <label>Q.ta</label>
                      <input
                        type="number"
                        value={quantita}
                        onChange={(e) => setQuantita(e.target.value)}
                      />
                    </div>
                    <div className="mdo-field">
                      <label>Unita</label>
                      <select value={unita} onChange={(e) => setUnita(e.target.value as UnitaMisura)}>
                        <option value="pz">pz</option>
                        <option value="m">m</option>
                        <option value="kg">kg</option>
                        <option value="lt">lt</option>
                      </select>
                    </div>
                  </div>

                  <div className="mdo-photo-row">
                    <div className="mdo-photo-preview">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Anteprima materiale" />
                      ) : (
                        <div className="mdo-photo-placeholder">Nessuna foto</div>
                      )}
                    </div>

                    <div className="mdo-photo-actions">
                      <label className="mdo-upload-button">
                        Carica foto
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                      </label>

                      <button
                        type="button"
                        className="mdo-secondary-button"
                        onClick={() => {
                          setFotoFile(null);
                          setFotoPreview(null);
                        }}
                      >
                        Rimuovi foto
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mdo-add-button"
                    onClick={aggiungiMateriale}
                    disabled={!descrizione.trim() || !quantita.trim()}
                  >
                    Aggiungi materiale
                  </button>
                </div>
              </section>

              <section className="mdo-panel mdo-side-nav-panel">
                <h3>Collegamenti rapidi</h3>
                <p>Accesso alle liste ordini esistenti senza cambiare i flussi.</p>
                <div className="mdo-footer">
                  <button
                    type="button"
                    className="mdo-footer-button"
                    onClick={() => navigate("/ordini-in-attesa")}
                  >
                    Vai a ordini in attesa
                  </button>

                  <button
                    type="button"
                    className="mdo-footer-button mdo-footer-alt"
                    onClick={() => navigate("/ordini-arrivati")}
                  >
                    Vai a ordini arrivati
                  </button>
                </div>
              </section>
            </aside>

            <section className="mdo-panel mdo-table-panel">
              <div className="mdo-panel-header">
                <div>
                  <h2>Fabbisogni correnti</h2>
                  <p>Tabella gestionale dei materiali temporanei in preparazione ordine.</p>
                </div>
                <div className="mdo-kpi-strip">
                  <div className="mdo-kpi">
                    <span>Righe</span>
                    <strong>{materiali.length}</strong>
                  </div>
                  <div className="mdo-kpi">
                    <span>Filtrate</span>
                    <strong>{materialiFiltrati.length}</strong>
                  </div>
                </div>
              </div>

              {materiali.length === 0 ? (
                <div className="mdo-empty mdo-empty-state">
                  Nessun materiale inserito. Usa il pannello a sinistra per aggiungere righe.
                </div>
              ) : (
                <div className="mdo-table-wrap">
                  <table className="mdo-table">
                    <thead>
                      <tr>
                        <th>Descrizione</th>
                        <th>Q.ta</th>
                        <th>Unita</th>
                        <th>Fornitore scelto</th>
                        <th>Residuo</th>
                        <th>Fonte prezzo</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialiFiltrati.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="mdo-desc-cell">
                              <div className="mdo-item-photo">
                                {m.fotoUrl ? (
                                  <img src={m.fotoUrl} alt={m.descrizione} />
                                ) : (
                                  <div className="mdo-photo-placeholder small">Foto</div>
                                )}
                              </div>
                              <div>
                                <div className="mdo-item-desc">{m.descrizione}</div>
                                <div className="mdo-item-meta">ID: {m.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>{m.quantita}</td>
                          <td>{m.unita}</td>
                          <td>{getOptionalText(m, ["fornitoreScelto", "fornitore", "nomeFornitore"])}</td>
                          <td>{getOptionalText(m, ["residuo", "quantitaResidua"])}</td>
                          <td>{getOptionalText(m, ["fontePrezzo", "prezzoFonte", "preventivoFonte"])}</td>
                          <td>
                            <div className="mdo-row-actions">
                              {(["Prezzi", "Allegati", "Note"] as const).map((action) => (
                                <button
                                  key={action}
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() =>
                                    setPlaceholderModal({
                                      action,
                                      materialeId: m.id,
                                      descrizione: m.descrizione,
                                    })
                                  }
                                >
                                  {action}
                                </button>
                              ))}
                              <button
                                type="button"
                                className="mdo-delete"
                                onClick={() => eliminaMateriale(m.id)}
                                aria-label={`Elimina ${m.descrizione}`}
                              >
                                Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mdo-sticky-bar">
          <div className="mdo-sticky-info">
            <span>Fornitore</span>
            <strong>
              {isNuovoFornitore
                ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore"
                : fornitoreNome || "Non selezionato"}
            </strong>
          </div>
          <div className="mdo-sticky-info">
            <span>Materiali temporanei</span>
            <strong>{materiali.length}</strong>
          </div>
          <div className="mdo-sticky-actions">
            <button
              type="button"
              className="mdo-secondary-button"
              onClick={() => navigate("/ordini-in-attesa")}
            >
              Ordini in attesa
            </button>
            <button
              type="button"
              className="mdo-secondary-button"
              onClick={() => navigate("/ordini-arrivati")}
            >
              Ordini arrivati
            </button>
            <button
              type="button"
              className="mdo-header-button"
              onClick={salvaOrdine}
              disabled={!canSaveOrdine}
            >
              {loading ? "SALVO..." : "CONFERMA ORDINE"}
            </button>
          </div>
        </div>
      </div>

      {placeholderModal && (
        <div
          className="mdo-modal-backdrop"
          role="presentation"
          onClick={() => setPlaceholderModal(null)}
        >
          <div
            className="mdo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${placeholderModal.action} ${placeholderModal.descrizione}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{placeholderModal.action}</h3>
            <p className="mdo-modal-title">{placeholderModal.descrizione}</p>
            <p>Placeholder UI. Nessuna nuova logica o salvataggio introdotti in questa fase.</p>
            <button
              type="button"
              className="mdo-header-button"
              onClick={() => setPlaceholderModal(null)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialiDaOrdinare;
