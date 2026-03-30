import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UnitaMisura } from "../types/ordini";
import "../pages/MaterialiDaOrdinare.css";
import { generateSmartPDF } from "../utils/pdfEngine";
import { readNextFornitoriSnapshot } from "./domain/nextFornitoriDomain";
import { appendNextProcurementCloneOrder } from "./nextProcurementCloneState";
import {
  NEXT_ACQUISTI_PATH,
  NEXT_HOME_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";

type Fornitore = {
  id: string;
  nome: string;
};

type FabbisogniTab = "Fabbisogni" | "Ordini" | "Arrivi" | "Prezzi & Preventivi";

type DraftMaterial = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: UnitaMisura;
  arrivato: false;
  fotoUrl: string | null;
  fotoStoragePath: null;
  fornitoreScelto: string;
  residuo: string;
  fontePrezzo: string;
  note: string;
  allegati: {
    id: string;
    name: string;
    previewUrl: string | null;
  }[];
};

const TABS: FabbisogniTab[] = ["Fabbisogni", "Ordini", "Arrivi", "Prezzi & Preventivi"];

const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function generaId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function oggi() {
  const date = new Date();
  return `${String(date.getDate()).padStart(2, "0")} ${String(date.getMonth() + 1).padStart(2, "0")} ${date.getFullYear()}`;
}

function trovaImmagineAutomatica(desc: string): string | null {
  for (const matcher of immaginiAutomatiche) {
    if (matcher.pattern.test(desc)) return matcher.url;
  }
  return null;
}

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Errore durante il caricamento dei fornitori.";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Impossibile leggere il file selezionato."));
    reader.readAsDataURL(file);
  });
}

export default function NextMaterialiDaOrdinarePage() {
  const navigate = useNavigate();
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fornitoreId, setFornitoreId] = useState("");
  const [fornitoreNome, setFornitoreNome] = useState("");
  const [isNuovoFornitore, setIsNuovoFornitore] = useState(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [materiali, setMateriali] = useState<DraftMaterial[]>([]);
  const [loadingFornitori, setLoadingFornitori] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FabbisogniTab>("Fabbisogni");
  const [searchText, setSearchText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [localPreventivi, setLocalPreventivi] = useState<
    { id: string; name: string; previewUrl: string | null }[]
  >([]);
  const [materialEditor, setMaterialEditor] = useState<{
    action: "Prezzi" | "Allegati" | "Note";
    materialeId: string;
    descrizione: string;
  } | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [editorAuxValue, setEditorAuxValue] = useState("");
  const preventivoInputRef = useRef<HTMLInputElement | null>(null);
  const allegatoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingFornitori(true);
        setError(null);
        const snapshot = await readNextFornitoriSnapshot();
        if (cancelled) return;
        setFornitori(snapshot.items.map((item) => ({ id: item.id, nome: item.nome })));
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError));
        setFornitori([]);
      } finally {
        if (!cancelled) {
          setLoadingFornitori(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
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
    const fornitore = fornitori.find((entry) => entry.id === id);
    setFornitoreNome(fornitore?.nome ?? "");
  };

  const handleDescrizioneBlur = () => {
    if (fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) {
      setFotoPreview(auto);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const nextPreview = await readFileAsDataUrl(file);
      setFotoPreview(nextPreview || null);
    } catch (fileError) {
      window.alert(readErrorMessage(fileError));
    } finally {
      event.target.value = "";
    }
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoPreview(null);
  };

  const aggiungiMateriale = () => {
    if (!descrizione.trim() || !quantita.trim()) return;
    const fornitoreAttivo = isNuovoFornitore
      ? nomeFornitorePersonalizzato.trim().toUpperCase()
      : fornitoreNome.trim();
    if (!fornitoreAttivo) {
      window.alert("Seleziona un fornitore prima di aggiungere il materiale.");
      return;
    }

    const nuovo: DraftMaterial = {
      id: generaId(),
      descrizione: descrizione.trim().toUpperCase(),
      quantita: Number(quantita),
      unita,
      arrivato: false,
      fotoUrl: fotoPreview,
      fotoStoragePath: null,
      fornitoreScelto: fornitoreAttivo,
      residuo: "—",
      fontePrezzo: "—",
      note: "",
      allegati: [],
    };

    setMateriali((current) => [...current, nuovo]);
    setSaveMessage(null);
    setNotice(null);
    resetMateriale();
  };

  const eliminaMateriale = (id: string) => {
    setMateriali((current) => current.filter((entry) => entry.id !== id));
  };

  const salvaOrdine = async () => {
    if (materiali.length === 0) return;

    let nomeFinale = fornitoreNome.trim();
    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim()) {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }

    if (!nomeFinale) {
      window.alert("Seleziona o inserisci un fornitore prima di confermare.");
      return;
    }

    setSaving(true);
    try {
      const orderId = `next-clone-ord:${generaId()}`;
      appendNextProcurementCloneOrder({
        id: orderId,
        idFornitore: fornitoreId === "nuovo" ? `next-clone-supplier:${generaId()}` : fornitoreId,
        nomeFornitore: nomeFinale,
        dataOrdine: oggi(),
        materiali: materiali.map((item) => ({
          id: item.id,
          descrizione: item.descrizione,
          quantita: item.quantita,
          unita: item.unita,
          arrivato: false,
          fotoUrl: item.fotoUrl,
          fotoStoragePath: null,
        })),
        arrivato: false,
        __nextCloneOnly: true,
        __nextCloneSavedAt: Date.now(),
      });

      setMateriali([]);
      setFornitoreId("");
      setFornitoreNome("");
      setNomeFornitorePersonalizzato("");
      setIsNuovoFornitore(false);
      resetMateriale();
      setSaveMessage("Ordine clone-only confermato. Lo trovi nella vista NEXT Acquisti senza scrivere sulla madre.");
      setNotice(null);
    } finally {
      setSaving(false);
    }
  };

  const materialiFiltrati = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return materiali;

    return materiali.filter((item) => {
      return (
        item.descrizione.toLowerCase().includes(query) ||
        item.fornitoreScelto.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  }, [materiali, searchText]);

  const canSaveOrdine =
    !saving &&
    materiali.length > 0 &&
    (Boolean(fornitoreNome.trim()) || Boolean(nomeFornitorePersonalizzato.trim()));

  const showFabbisogni = activeTab === "Fabbisogni";

  const openEditor = (action: "Prezzi" | "Allegati" | "Note", materiale: DraftMaterial) => {
    setMaterialEditor({
      action,
      materialeId: materiale.id,
      descrizione: materiale.descrizione,
    });

    if (action === "Prezzi") {
      setEditorValue(materiale.fontePrezzo === "—" ? "" : materiale.fontePrezzo);
      setEditorAuxValue(materiale.residuo === "—" ? "" : materiale.residuo);
      return;
    }

    if (action === "Note") {
      setEditorValue(materiale.note);
      setEditorAuxValue("");
      return;
    }

    setEditorValue("");
    setEditorAuxValue("");
  };

  const applyEditor = () => {
    if (!materialEditor) {
      return;
    }

    setMateriali((current) =>
      current.map((item) => {
        if (item.id !== materialEditor.materialeId) {
          return item;
        }

        if (materialEditor.action === "Prezzi") {
          return {
            ...item,
            fontePrezzo: editorValue.trim() || "—",
            residuo: editorAuxValue.trim() || "—",
          };
        }

        if (materialEditor.action === "Note") {
          return {
            ...item,
            note: editorValue.trim(),
          };
        }

        return item;
      }),
    );

    setNotice(`Scheda ${materialEditor.action.toLowerCase()} aggiornata nel clone.`);
    setMaterialEditor(null);
    setEditorValue("");
    setEditorAuxValue("");
  };

  const handlePreventivoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = file.type.startsWith("image/") ? await readFileAsDataUrl(file) : null;
      setLocalPreventivi((current) => [
        {
          id: generaId(),
          name: file.name,
          previewUrl,
        },
        ...current,
      ]);
      setNotice("Preventivo locale agganciato al clone.");
    } catch (uploadError) {
      window.alert(readErrorMessage(uploadError));
    } finally {
      event.target.value = "";
    }
  };

  const handleAllegatoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !materialEditor || materialEditor.action !== "Allegati") {
      return;
    }

    try {
      const previewUrl = file.type.startsWith("image/") ? await readFileAsDataUrl(file) : null;
      setMateriali((current) =>
        current.map((item) =>
          item.id === materialEditor.materialeId
            ? {
                ...item,
                allegati: [
                  ...item.allegati,
                  { id: generaId(), name: file.name, previewUrl },
                ],
              }
            : item,
        ),
      );
      setNotice("Allegato locale aggiunto al materiale.");
    } catch (uploadError) {
      window.alert(readErrorMessage(uploadError));
    } finally {
      event.target.value = "";
    }
  };

  const exportPdf = async (kind: "fornitori" | "direzione") => {
    if (materiali.length === 0) {
      setNotice("Aggiungi almeno un materiale prima di esportare il PDF.");
      return;
    }

    await generateSmartPDF({
      kind: "table",
      title: kind === "fornitori" ? "PDF Fornitori clone" : "PDF Direzione clone",
      columns: ["descrizione", "quantita", "unita", "fornitoreScelto", "fontePrezzo", "residuo"],
      rows: materiali.map((item) => ({
        descrizione: item.descrizione,
        quantita: item.quantita,
        unita: item.unita,
        fornitoreScelto: item.fornitoreScelto,
        fontePrezzo: item.fontePrezzo,
        residuo: item.residuo,
      })),
    });
    setNotice(
      kind === "fornitori"
        ? "PDF fornitori generato dal clone."
        : "PDF direzione generato dal clone.",
    );
  };

  return (
    <div className="mdo-page">
      <div className="mdo-card">
        <header className="mdo-shell-header">
          <div className="mdo-header-left">
            <img
              src="/logo.png"
              className="mdo-logo"
              alt="logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
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
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>
            <div className="mdo-cta-row">
              <button
                type="button"
                className="mdo-cta-button"
                onClick={() => preventivoInputRef.current?.click()}
              >
                Carica preventivo locale
              </button>
              <button type="button" className="mdo-cta-button" onClick={() => void exportPdf("fornitori")}>
                PDF Fornitori
              </button>
              <button
                type="button"
                className="mdo-cta-button mdo-cta-primary"
                onClick={() => void exportPdf("direzione")}
              >
                PDF Direzione
              </button>
              <input
                ref={preventivoInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handlePreventivoUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </header>

        {error ? <div className="mdo-placeholder-panel"><p>{error}</p></div> : null}
        {saveMessage ? <div className="mdo-placeholder-panel"><p>{saveMessage}</p></div> : null}
        {notice ? <div className="mdo-placeholder-panel"><p>{notice}</p></div> : null}

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
              {tab === "Prezzi & Preventivi" ? (
                <span className="mdo-tab-badge">{localPreventivi.length} locali</span>
              ) : null}
            </button>
          ))}
        </div>

        {!showFabbisogni ? (
          <section className="mdo-placeholder-panel" aria-live="polite" style={{ display: "grid", gap: 16 }}>
            <h2>{activeTab}</h2>
            {activeTab === "Ordini" ? (
              <>
                <p>La tab ordini del clone apre la lista NEXT vera senza riattivare il runtime legacy.</p>
                <div className="mdo-footer">
                  <button type="button" className="mdo-footer-button" onClick={() => navigate(NEXT_ORDINI_IN_ATTESA_PATH)}>
                    Apri ordini in attesa
                  </button>
                  <button type="button" className="mdo-footer-button mdo-footer-alt" onClick={() => navigate(NEXT_ACQUISTI_PATH)}>
                    Apri hub acquisti
                  </button>
                </div>
              </>
            ) : null}
            {activeTab === "Arrivi" ? (
              <>
                <p>La tab arrivi del clone apre la lista NEXT vera degli ordini gia arrivati.</p>
                <div className="mdo-footer">
                  <button type="button" className="mdo-footer-button" onClick={() => navigate(NEXT_ORDINI_ARRIVATI_PATH)}>
                    Apri ordini arrivati
                  </button>
                  <button type="button" className="mdo-footer-button mdo-footer-alt" onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=arrivi`)}>
                    Apri arrivi in acquisti
                  </button>
                </div>
              </>
            ) : null}
            {activeTab === "Prezzi & Preventivi" ? (
              <>
                <p>I preventivi locali restano nel clone e convivono con la vista NEXT read-only dei preventivi reali.</p>
                {localPreventivi.length === 0 ? (
                  <div className="mdo-empty">Nessun preventivo locale caricato.</div>
                ) : (
                  <div className="mdo-table-wrap">
                    <table className="mdo-table">
                      <thead>
                        <tr>
                          <th>Nome file</th>
                          <th>Anteprima</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localPreventivi.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>
                              {item.previewUrl ? (
                                <button
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() => window.open(item.previewUrl ?? undefined, "_blank", "noopener,noreferrer")}
                                >
                                  Apri anteprima
                                </button>
                              ) : (
                                <span>PDF locale</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mdo-footer">
                  <button type="button" className="mdo-footer-button" onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=preventivi`)}>
                    Apri preventivi NEXT
                  </button>
                </div>
              </>
            ) : null}
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
                      onChange={(event) => handleSelectFornitore(event.target.value)}
                      disabled={loadingFornitori}
                    >
                      <option value="">Seleziona</option>
                      {fornitori.map((fornitore) => (
                        <option key={fornitore.id} value={fornitore.id}>
                          {fornitore.nome}
                        </option>
                      ))}
                      <option value="nuovo">+ Nuovo fornitore</option>
                    </select>
                  </div>

                  {isNuovoFornitore ? (
                    <div className="mdo-field">
                      <label>Nome nuovo fornitore</label>
                      <input
                        type="text"
                        value={nomeFornitorePersonalizzato}
                        onChange={(event) => setNomeFornitorePersonalizzato(event.target.value)}
                      />
                    </div>
                  ) : null}

                  <div className="mdo-grid">
                    <div className="mdo-field">
                      <label>Descrizione</label>
                      <input
                        type="text"
                        value={descrizione}
                        onChange={(event) => setDescrizione(event.target.value)}
                        onBlur={handleDescrizioneBlur}
                      />
                    </div>
                    <div className="mdo-field">
                      <label>Q.ta</label>
                      <input
                        type="number"
                        value={quantita}
                        onChange={(event) => setQuantita(event.target.value)}
                      />
                    </div>
                    <div className="mdo-field">
                      <label>Unita</label>
                      <select value={unita} onChange={(event) => setUnita(event.target.value as UnitaMisura)}>
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
                        onClick={() => setFotoPreview(null)}
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
                <p>Accesso alle liste ordini clone-safe senza riaprire il runtime legacy.</p>
                <div className="mdo-footer">
                  <button
                    type="button"
                    className="mdo-footer-button"
                    onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=ordini`)}
                  >
                    Vai a ordini in attesa
                  </button>
                  <button
                    type="button"
                    className="mdo-footer-button mdo-footer-alt"
                    onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=arrivi`)}
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
                      {materialiFiltrati.map((materiale) => (
                        <tr key={materiale.id}>
                          <td>
                            <div className="mdo-desc-cell">
                              <div className="mdo-item-photo">
                                {materiale.fotoUrl ? (
                                  <img src={materiale.fotoUrl} alt={materiale.descrizione} />
                                ) : (
                                  <div className="mdo-photo-placeholder small">Foto</div>
                                )}
                              </div>
                              <div>
                                <div className="mdo-item-desc">{materiale.descrizione}</div>
                                <div className="mdo-item-meta">ID: {materiale.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>{materiale.quantita}</td>
                          <td>{materiale.unita}</td>
                          <td>{materiale.fornitoreScelto}</td>
                          <td>{materiale.residuo}</td>
                          <td>{materiale.fontePrezzo}</td>
                          <td>
                            <div className="mdo-row-actions">
                              {(["Prezzi", "Allegati", "Note"] as const).map((action) => (
                                <button
                                  key={action}
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() => openEditor(action, materiale)}
                                >
                                  {action}
                                </button>
                              ))}
                              <button
                                type="button"
                                className="mdo-delete"
                                onClick={() => eliminaMateriale(materiale.id)}
                                aria-label={`Elimina ${materiale.descrizione}`}
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
              onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=ordini`)}
            >
              Ordini in attesa
            </button>
            <button
              type="button"
              className="mdo-secondary-button"
              onClick={() => navigate(`${NEXT_ACQUISTI_PATH}?tab=arrivi`)}
            >
              Ordini arrivati
            </button>
            <button
              type="button"
              className="mdo-header-button"
              onClick={() => void salvaOrdine()}
              disabled={!canSaveOrdine}
            >
              {saving ? "SALVO..." : "CONFERMA ORDINE"}
            </button>
          </div>
        </div>
      </div>

      {materialEditor ? (
        <div
          className="mdo-modal-backdrop"
          role="presentation"
          onClick={() => setMaterialEditor(null)}
        >
          <div
            className="mdo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${materialEditor.action} ${materialEditor.descrizione}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{materialEditor.action}</h3>
            <p className="mdo-modal-title">{materialEditor.descrizione}</p>
            {materialEditor.action === "Prezzi" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Fonte prezzo locale"
                  value={editorValue}
                  onChange={(event) => setEditorValue(event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Residuo / disponibilita"
                  value={editorAuxValue}
                  onChange={(event) => setEditorAuxValue(event.target.value)}
                />
                <button type="button" className="mdo-header-button" onClick={applyEditor}>
                  Salva nel clone
                </button>
              </div>
            ) : null}
            {materialEditor.action === "Note" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <textarea
                  rows={4}
                  placeholder="Note locali sul materiale"
                  value={editorValue}
                  onChange={(event) => setEditorValue(event.target.value)}
                  style={{ width: "100%" }}
                />
                <button type="button" className="mdo-header-button" onClick={applyEditor}>
                  Salva nel clone
                </button>
              </div>
            ) : null}
            {materialEditor.action === "Allegati" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <p>Nessun upload business: gli allegati restano locali al clone.</p>
                <button
                  type="button"
                  className="mdo-header-button"
                  onClick={() => allegatoInputRef.current?.click()}
                >
                  Aggiungi allegato locale
                </button>
                <input
                  ref={allegatoInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAllegatoUpload}
                  style={{ display: "none" }}
                />
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(materiali.find((item) => item.id === materialEditor.materialeId)?.allegati ?? []).map((entry) => (
                    <li key={entry.id}>
                      {entry.name}
                      {entry.previewUrl ? (
                        <button
                          type="button"
                          className="mdo-chip-button"
                          style={{ marginLeft: 8 }}
                          onClick={() => window.open(entry.previewUrl ?? undefined, "_blank", "noopener,noreferrer")}
                        >
                          Apri
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              className="mdo-header-button"
              onClick={() => setMaterialEditor(null)}
            >
              Chiudi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
