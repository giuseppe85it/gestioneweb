import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { UnitaMisura } from "../types/ordini";
import "../pages/MaterialiDaOrdinare.css";
import { readNextFornitoriSnapshot } from "./domain/nextFornitoriDomain";
import {
  NEXT_HOME_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";

type Fornitore = {
  id: string;
  nome: string;
};

type DraftMaterial = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: UnitaMisura;
  arrivato: false;
  fotoUrl: string | null;
  fotoStoragePath: null;
};

type FabbisogniTab = "Fabbisogni" | "Ordini" | "Arrivi" | "Prezzi & Preventivi";

const TABS: FabbisogniTab[] = ["Fabbisogni", "Ordini", "Arrivi", "Prezzi & Preventivi"];

const READ_ONLY_ADD_MESSAGE =
  "Clone read-only: aggiunta materiale non disponibile.";
const READ_ONLY_DELETE_MESSAGE =
  "Clone read-only: eliminazione materiale non disponibile.";
const READ_ONLY_SAVE_MESSAGE =
  "Clone read-only: conferma ordine non disponibile.";
const READ_ONLY_FOTO_MESSAGE =
  "Clone read-only: upload foto non disponibile.";
const READ_ONLY_PREVENTIVO_MESSAGE =
  "Clone read-only: upload preventivo non disponibile.";
const READ_ONLY_PDF_MESSAGE =
  "Clone read-only: esportazione PDF non disponibile.";

const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

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

const motherLikePageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "24px 16px 40px",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at top, #ece4d4 0, #dcd2c0 35%, #c9c0ae 70%, #b3ab9a 100%)",
};

const motherLikeCardStyle: CSSProperties = {
  width: "min(1200px, 100%)",
  margin: "0 auto",
  gap: "16px",
};

const motherLikeHeaderStyle: CSSProperties = {
  background: "rgba(248, 244, 232, 0.98)",
  border: "1px solid rgba(180, 167, 144, 0.42)",
  boxShadow:
    "0 14px 35px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.12) inset",
};

const motherLikeHeaderMetaStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
};

const motherLikeHeaderSubtitleStyle: CSSProperties = {
  margin: 0,
  color: "#5b574c",
  fontSize: "13px",
  lineHeight: 1.35,
};

const motherLikeTabsStyle: CSSProperties = {
  background: "rgba(248, 244, 232, 0.98)",
  border: "1px solid rgba(180, 167, 144, 0.42)",
  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.08)",
};

const motherLikePlaceholderStyle: CSSProperties = {
  padding: "24px",
  background: "rgba(255, 252, 245, 0.92)",
  border: "1px solid rgba(180, 167, 144, 0.35)",
  borderRadius: "16px",
  boxShadow: "0 12px 26px rgba(0, 0, 0, 0.08)",
};

const motherLikeWorkspaceStyle: CSSProperties = {
  gridTemplateColumns: "minmax(360px, 0.92fr) minmax(0, 1.18fr)",
  alignItems: "stretch",
};

const motherLikeSidebarStyle: CSSProperties = {
  minHeight: "100%",
  paddingBottom: "18px",
};

const motherLikeTablePanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "620px",
};

const motherLikeEmptyStateStyle: CSSProperties = {
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "320px",
};

const motherLikeTableWrapStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
};

const motherLikeStickyBarStyle: CSSProperties = {
  position: "static",
  bottom: "auto",
  marginTop: "6px",
  gridTemplateColumns:
    "minmax(180px, 1fr) minmax(180px, 1fr) minmax(360px, 1.4fr)",
};

const motherLikeModalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 30,
};

const motherLikeModalCardStyle: CSSProperties = {
  width: "min(460px, 100%)",
  background: "#ffffff",
  border: "1px solid #d8e0ea",
  borderRadius: "16px",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const motherLikeModalHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
};

const motherLikeModalTitleStyle: CSSProperties = {
  margin: 0,
  fontWeight: 700,
  color: "#0f172a",
};

const motherLikeModalBodyTextStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.4,
};

export default function NextMaterialiDaOrdinarePage() {
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fornitoreId, setFornitoreId] = useState("");
  const [fornitoreNome, setFornitoreNome] = useState("");
  const [isNuovoFornitore, setIsNuovoFornitore] = useState(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] =
    useState("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [materiali] = useState<DraftMaterial[]>([]);
  const [loadingFornitori, setLoadingFornitori] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FabbisogniTab>("Fabbisogni");
  const [searchText, setSearchText] = useState("");
  const [placeholderModal, setPlaceholderModal] = useState<{
    action: "Prezzi" | "Allegati" | "Note";
    materialeId: string;
    descrizione: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingFornitori(true);
        setError(null);
        const snapshot = await readNextFornitoriSnapshot({
          includeCloneOverlays: false,
        });
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    setFornitoreNome(fornitore?.nome || "");
  };

  const handleDescrizioneBlur = () => {
    if (fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      window.alert(READ_ONLY_FOTO_MESSAGE);
    }
    event.target.value = "";
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

    window.alert(READ_ONLY_ADD_MESSAGE);
  };

  const eliminaMateriale = () => {
    window.alert(READ_ONLY_DELETE_MESSAGE);
  };

  const salvaOrdine = () => {
    let nomeFinale = fornitoreNome.trim();

    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim()) {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }

    if (!nomeFinale) {
      window.alert("Seleziona o inserisci un fornitore prima di confermare.");
      return;
    }

    if (!materiali.length) return;
    window.alert(READ_ONLY_SAVE_MESSAGE);
  };

  const materialiFiltrati = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return materiali;

    return materiali.filter((item) => {
      const fornitoreRiga = String((item as { fornitore?: string }).fornitore || "").toLowerCase();
      return (
        item.descrizione.toLowerCase().includes(query) ||
        fornitoreRiga.includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  }, [materiali, searchText]);

  const canSaveOrdine =
    materiali.length > 0 &&
    (Boolean(fornitoreNome) || Boolean(nomeFornitorePersonalizzato.trim()));

  const getOptionalText = (materiale: DraftMaterial, keys: string[]) => {
    for (const key of keys) {
      const value = (materiale as Record<string, unknown>)[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    }
    return "—";
  };

  const showFabbisogni = activeTab === "Fabbisogni";
  const isCompactLayout = viewportWidth <= 1180;
  const isMobileLayout = viewportWidth <= 760;
  const pageStyle: CSSProperties = {
    ...motherLikePageStyle,
    padding: isMobileLayout ? "14px 10px 28px" : motherLikePageStyle.padding,
  };
  const workspaceStyle: CSSProperties = {
    ...motherLikeWorkspaceStyle,
    gridTemplateColumns: isCompactLayout ? "1fr" : motherLikeWorkspaceStyle.gridTemplateColumns,
  };
  const tablePanelStyle: CSSProperties = {
    ...motherLikeTablePanelStyle,
    minHeight: isCompactLayout ? "unset" : motherLikeTablePanelStyle.minHeight,
  };
  const emptyStateStyle: CSSProperties = {
    ...motherLikeEmptyStateStyle,
    minHeight: isCompactLayout ? "220px" : motherLikeEmptyStateStyle.minHeight,
  };
  const stickyBarStyle: CSSProperties = {
    ...motherLikeStickyBarStyle,
    gridTemplateColumns: isCompactLayout ? "1fr" : motherLikeStickyBarStyle.gridTemplateColumns,
    marginTop: isCompactLayout ? "10px" : motherLikeStickyBarStyle.marginTop,
  };

  return (
    <div className="mdo-page mdo-page--embedded" style={pageStyle}>
      <div className="mdo-card mdo-card--embedded" style={motherLikeCardStyle}>
        <header className="mdo-shell-header" style={motherLikeHeaderStyle}>
          <div className="mdo-header-left">
            <img
              src="/logo.png"
              className="mdo-logo"
              alt="logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
            />
            <div style={motherLikeHeaderMetaStyle}>
              <p className="mdo-eyebrow">Acquisti</p>
              <h1 className="mdo-header-title">Materiali da ordinare</h1>
              <p style={motherLikeHeaderSubtitleStyle}>
                Fabbisogni procurement con accesso guidato a ordini e arrivi read-only.
              </p>
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
                onClick={() => window.alert(READ_ONLY_PREVENTIVO_MESSAGE)}
              >
                Carica preventivo
              </button>
              <button
                type="button"
                className="mdo-cta-button"
                onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
              >
                PDF Fornitori
              </button>
              <button
                type="button"
                className="mdo-cta-button mdo-cta-primary"
                onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
              >
                PDF Direzione
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mdo-placeholder-panel" style={motherLikePlaceholderStyle}>
            <p>{error}</p>
          </div>
        ) : null}

        <div
          className="mdo-tabs"
          role="tablist"
          aria-label="Sezioni acquisti"
          style={motherLikeTabsStyle}
        >
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
              {tab !== "Fabbisogni" ? (
                <span className="mdo-tab-badge">In arrivo</span>
              ) : null}
            </button>
          ))}
        </div>

        {!showFabbisogni ? (
          <section
            className="mdo-placeholder-panel"
            aria-live="polite"
            style={motherLikePlaceholderStyle}
          >
            <h2>{activeTab}</h2>
            <p>
              Sezione read-only in arrivo. In questa patch resta attiva solo la tab
              Fabbisogni con i dati esistenti della pagina.
            </p>
          </section>
        ) : (
          <div className="mdo-workspace" style={workspaceStyle}>
            <aside className="mdo-sidebar" style={motherLikeSidebarStyle}>
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
                        onChange={(event) =>
                          setNomeFornitorePersonalizzato(event.target.value)
                        }
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
                      <select
                        value={unita}
                        onChange={(event) => setUnita(event.target.value as UnitaMisura)}
                      >
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
                <p>Accesso alle liste ordini esistenti senza cambiare i flussi.</p>
                <div className="mdo-footer">
                  <button
                    type="button"
                    className="mdo-footer-button"
                    onClick={() => navigate(NEXT_ORDINI_IN_ATTESA_PATH)}
                  >
                    Vai a ordini in attesa
                  </button>

                  <button
                    type="button"
                    className="mdo-footer-button mdo-footer-alt"
                    onClick={() => navigate(NEXT_ORDINI_ARRIVATI_PATH)}
                  >
                    Vai a ordini arrivati
                  </button>
                </div>
              </section>
            </aside>

            <section className="mdo-panel mdo-table-panel" style={tablePanelStyle}>
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
                <div
                  className="mdo-empty mdo-empty-state"
                  style={emptyStateStyle}
                >
                  Nessun materiale inserito. Usa il pannello a sinistra per aggiungere righe.
                </div>
              ) : (
                <div className="mdo-table-wrap" style={motherLikeTableWrapStyle}>
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
                          <td>
                            {getOptionalText(materiale, [
                              "fornitoreScelto",
                              "fornitore",
                              "nomeFornitore",
                            ])}
                          </td>
                          <td>
                            {getOptionalText(materiale, ["residuo", "quantitaResidua"])}
                          </td>
                          <td>
                            {getOptionalText(materiale, [
                              "fontePrezzo",
                              "prezzoFonte",
                              "preventivoFonte",
                            ])}
                          </td>
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
                                      materialeId: materiale.id,
                                      descrizione: materiale.descrizione,
                                    })
                                  }
                                >
                                  {action}
                                </button>
                              ))}
                              <button
                                type="button"
                                className="mdo-delete"
                                onClick={eliminaMateriale}
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

        <div className="mdo-sticky-bar" style={stickyBarStyle}>
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
              onClick={() => navigate(NEXT_ORDINI_IN_ATTESA_PATH)}
            >
              Ordini in attesa
            </button>
            <button
              type="button"
              className="mdo-secondary-button"
              onClick={() => navigate(NEXT_ORDINI_ARRIVATI_PATH)}
            >
              Ordini arrivati
            </button>
            <button
              type="button"
              className="mdo-header-button"
              onClick={salvaOrdine}
              disabled={!canSaveOrdine}
            >
              CONFERMA ORDINE
            </button>
          </div>
        </div>
      </div>

      {placeholderModal ? (
        <div
          className="mdo-modal-backdrop"
          style={motherLikeModalBackdropStyle}
          role="presentation"
          onClick={() => setPlaceholderModal(null)}
        >
          <div
            className="mdo-modal"
            style={motherLikeModalCardStyle}
            role="dialog"
            aria-modal="true"
            aria-label={`${placeholderModal.action} ${placeholderModal.descrizione}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={motherLikeModalHeadingStyle}>{placeholderModal.action}</h3>
            <p className="mdo-modal-title" style={motherLikeModalTitleStyle}>
              {placeholderModal.descrizione}
            </p>
            <p style={motherLikeModalBodyTextStyle}>
              Placeholder UI. Nessuna nuova logica o salvataggio introdotti in questa fase.
            </p>
            <button
              type="button"
              className="mdo-header-button"
              onClick={() => setPlaceholderModal(null)}
            >
              Chiudi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
