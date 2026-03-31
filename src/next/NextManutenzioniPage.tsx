import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NextModalGomme from "./autisti/NextModalGomme";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import {
  readNextManutenzioniWorkspaceSnapshot,
  type NextManutenzioniLegacyDatasetRecord,
  type NextManutenzioniMezzoOption,
} from "./domain/nextManutenzioniDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";
import "../pages/Manutenzioni.css";

type TipoVoce = "mezzo" | "compressore";
type SottoTipo = "motrice" | "trattore";

type MaterialeManutenzione = {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fromInventario?: boolean;
  refId?: string;
};

type MaterialeInventario = {
  id: string;
  label: string;
  quantitaTotale: number;
  unita: string;
  fornitoreLabel?: string | null;
};

const READ_ONLY_SAVE_MESSAGE =
  "Clone read-only: Salva manutenzione resta visibile come nella madre, ma non aggiorna manutenzioni, inventario o movimenti materiali.";
const READ_ONLY_DELETE_MESSAGE =
  "Clone read-only: eliminazione manutenzione non disponibile.";
const READ_ONLY_PDF_MESSAGE =
  "Clone read-only: Esporta PDF resta visibile come nella madre, ma non genera download locali.";
const READ_ONLY_GOMME_MESSAGE =
  "Clone read-only: Gestione gomme resta visibile come nella madre, ma la conferma non aggiorna la manutenzione.";

function todayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

function normalizeText(value: string) {
  return value.trim().toUpperCase();
}

function mapInventoryItem(item: NextInventarioReadOnlyItem): MaterialeInventario {
  return {
    id: item.id,
    label: item.descrizione,
    quantitaTotale: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    fornitoreLabel: item.fornitore ?? null,
  };
}

function buildMisuraLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.tipo === "mezzo") {
    return item.km != null ? `${item.km} KM` : "-";
  }
  return item.ore != null ? `${item.ore} ORE` : "-";
}

function toMaterialiTemp(
  items: NextManutenzioniLegacyDatasetRecord["materiali"],
): MaterialeManutenzione[] {
  if (!items?.length) return [];
  return items.map((item, index) => ({
    id: item.id || `materiale:${index}`,
    label: item.label,
    quantita: item.quantita,
    unita: item.unita,
    fromInventario: item.fromInventario,
    refId: item.refId,
  }));
}

export default function NextManutenzioniPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    "Modulo clone in sola lettura: UI madre-like sopra dati reali, senza salvataggi o export attivi.",
  );
  const [storico, setStorico] = useState<NextManutenzioniLegacyDatasetRecord[]>([]);
  const [mezzi, setMezzi] = useState<NextManutenzioniMezzoOption[]>([]);
  const [materialiInventario, setMaterialiInventario] = useState<MaterialeInventario[]>([]);

  const [filtroTarga, setFiltroTarga] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"tutti" | TipoVoce>("tutti");

  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(todayLabel());
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [quantitaTemp, setQuantitaTemp] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalGommeOpen, setModalGommeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [workspace, inventorySnapshot] = await Promise.all([
          readNextManutenzioniWorkspaceSnapshot(),
          readNextInventarioSnapshot({ includeCloneOverlays: false }),
        ]);
        if (cancelled) return;

        setStorico(workspace.storico);
        setMezzi(workspace.mezzi);
        setMaterialiInventario(inventorySnapshot.items.map(mapInventoryItem));
      } catch (loadError) {
        console.error("Errore caricamento Manutenzioni NEXT:", loadError);
        if (cancelled) return;
        setStorico([]);
        setMezzi([]);
        setMaterialiInventario([]);
        setError("Impossibile leggere il dataset reale di manutenzioni.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mezzoSelezionato = useMemo(() => {
    const normalized = normalizeText(targa);
    return mezzi.find((mezzo) => mezzo.targa === normalized) ?? null;
  }, [mezzi, targa]);

  const materialiSuggeriti = useMemo(() => {
    const query = normalizeText(materialeSearch);
    if (!query) return [];

    return materialiInventario
      .filter(
        (item) =>
          item.label.toUpperCase().includes(query)
          || (item.fornitoreLabel ?? "").toUpperCase().includes(query),
      )
      .slice(0, 5);
  }, [materialeSearch, materialiInventario]);

  const storicoFiltrato = useMemo(
    () =>
      storico.filter((item) => {
        const matchTarga = filtroTarga
          ? item.targa.toUpperCase().includes(normalizeText(filtroTarga))
          : true;
        const matchTipo = filtroTipo === "tutti" ? true : item.tipo === filtroTipo;
        return matchTarga && matchTipo;
      }),
    [filtroTarga, filtroTipo, storico],
  );

  const handleSelectTargaMezzo = (value: string) => {
    setTarga(value);
    if (!filtroTarga) {
      setFiltroTarga(value);
    }
  };

  const resetForm = () => {
    const currentTarga = targa;
    setTipo("mezzo");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setData(todayLabel());
    setMaterialeSearch("");
    setMaterialiTemp([]);
    setQuantitaTemp("");
    setEditingId(null);
    setTarga(currentTarga);
  };

  const handleAddMateriale = (
    label: string,
    quantitaValue: number,
    unitaValue: string,
    fromInventario: boolean,
    refId?: string,
  ) => {
    if (!label.trim() || !quantitaValue) {
      window.alert("Inserisci almeno nome materiale e quantita.");
      return;
    }

    const nuovo: MaterialeManutenzione = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: normalizeText(label),
      quantita: quantitaValue,
      unita: unitaValue || "pz",
      fromInventario,
      ...(refId ? { refId } : {}),
    };

    setMaterialiTemp((current) => [...current, nuovo]);
    setMaterialeSearch("");
    setQuantitaTemp("");
    setNotice(
      "Bozza materiali aggiornata solo localmente: il clone read-only non scarica quantita da inventario e non crea movimenti.",
    );
  };

  const handleRemoveMateriale = (id: string) => {
    setMaterialiTemp((current) => current.filter((item) => item.id !== id));
  };

  const handleEdit = (item: NextManutenzioniLegacyDatasetRecord) => {
    setEditingId(item.id);
    setTarga(item.targa);
    setTipo(item.tipo);
    setKm(item.km != null ? String(item.km) : "");
    setOre(item.ore != null ? String(item.ore) : "");
    setSottotipo(item.sottotipo ?? "motrice");
    setDescrizione(item.descrizione);
    setEseguito(item.eseguito ?? "");
    setData(item.data);
    setMaterialiTemp(toMaterialiTemp(item.materiali));
    setNotice(
      "Modifica caricata in sola lettura: puoi verificare i campi come nella madre, ma il salvataggio resta bloccato.",
    );
  };

  const handleSave = () => {
    const normalizedTarga = normalizeText(targa);
    const normalizedDescrizione = descrizione.trim();
    const normalizedData = data.trim();

    if (!normalizedTarga || !normalizedDescrizione || !normalizedData) {
      window.alert("Compila almeno TARGA, DESCRIZIONE e DATA.");
      return;
    }

    if (tipo === "mezzo" && !km) {
      const confirmed = window.confirm("Non hai inserito i KM. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (tipo === "compressore" && !ore) {
      const confirmed = window.confirm("Non hai inserito le ORE. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    window.alert(READ_ONLY_SAVE_MESSAGE);
    setNotice(READ_ONLY_SAVE_MESSAGE);
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa manutenzione?");
    if (!confirmed) return;
    window.alert(READ_ONLY_DELETE_MESSAGE);
    setNotice(READ_ONLY_DELETE_MESSAGE);
  };

  const handleExportPdf = () => {
    if (!storicoFiltrato.length) {
      window.alert("Non ci sono manutenzioni da esportare.");
      return;
    }
    window.alert(READ_ONLY_PDF_MESSAGE);
    setNotice(READ_ONLY_PDF_MESSAGE);
  };

  const handleGommeConfirm = () => {
    setModalGommeOpen(false);
    window.alert(READ_ONLY_GOMME_MESSAGE);
    setNotice(READ_ONLY_GOMME_MESSAGE);
  };

  return (
    <div className="man-page">
      <div className="man-layout">
        <div className="man-card man-card-form">
          <div className="man-card-header">
            <div className="man-logo-title">
              <img
                src="/logo.png"
                alt="logo"
                className="man-logo"
                onClick={() => navigate("/next")}
              />
              <div>
                <h1 className="man-title">Manutenzioni</h1>
                <p className="man-subtitle">Inserimento interventi su mezzi e compressori</p>
              </div>
            </div>

            <button
              type="button"
              className="man-header-btn"
              disabled={!normalizeText(targa)}
              onClick={() => navigate(buildNextDossierPath(normalizeText(targa)))}
            >
              Apri dossier mezzo
            </button>
          </div>

          <div
            className="man-empty"
            style={{ marginBottom: 10, background: "#eef6ef", borderStyle: "solid" }}
          >
            {notice}
          </div>

          {error ? (
            <div className="man-empty" style={{ marginBottom: 10 }}>
              {error}
            </div>
          ) : null}

          <div className="man-card-body">
            <div className="man-section">
              <div className="man-section-title">Mezzo / Compressore</div>

              <label className="man-label-block">
                <span className="man-label-text">Targa / Codice</span>
                <div className="man-row">
                  <select
                    className="man-input man-select-mezzo"
                    value={targa}
                    onChange={(event) => handleSelectTargaMezzo(event.target.value)}
                  >
                    <option value="">- Seleziona mezzo dall&apos;elenco -</option>
                    {mezzi.map((mezzo) => (
                      <option key={mezzo.id} value={mezzo.targa}>
                        {mezzo.label}
                      </option>
                    ))}
                  </select>
                  <span className="man-or">oppure</span>
                  <input
                    className="man-input man-input-targa"
                    value={targa}
                    onChange={(event) => setTarga(event.target.value.toUpperCase())}
                    placeholder="Es. TI315407"
                  />
                </div>
              </label>

              <div className="man-row">
                <label className="man-label-inline">
                  <span className="man-label-text">Tipo</span>
                  <select
                    className="man-input"
                    value={tipo}
                    onChange={(event) => setTipo(event.target.value as TipoVoce)}
                  >
                    <option value="mezzo">Mezzo</option>
                    <option value="compressore">Compressore</option>
                  </select>
                </label>

                {tipo === "mezzo" ? (
                  <label className="man-label-inline">
                    <span className="man-label-text">Km attuali</span>
                    <input
                      className="man-input"
                      value={km}
                      onChange={(event) => setKm(event.target.value)}
                      placeholder="Es. 325000"
                      inputMode="numeric"
                    />
                  </label>
                ) : null}

                {tipo === "compressore" ? (
                  <label className="man-label-inline">
                    <span className="man-label-text">Ore</span>
                    <input
                      className="man-input"
                      value={ore}
                      onChange={(event) => setOre(event.target.value)}
                      placeholder="Es. 1200"
                      inputMode="numeric"
                    />
                  </label>
                ) : null}
              </div>

              {tipo === "compressore" ? (
                <label className="man-label-block">
                  <span className="man-label-text">Sottotipo compressore</span>
                  <select
                    className="man-input"
                    value={sottotipo}
                    onChange={(event) => setSottotipo(event.target.value as SottoTipo)}
                  >
                    <option value="motrice">Motrice</option>
                    <option value="trattore">Trattore</option>
                  </select>
                </label>
              ) : null}
            </div>

            <div className="man-section">
              <div className="man-section-title">Dettagli manutenzione</div>

              <label className="man-label-block">
                <span className="man-label-text">Descrizione intervento</span>
                <textarea
                  className="man-input man-textarea"
                  value={descrizione}
                  onChange={(event) => setDescrizione(event.target.value)}
                  placeholder="Es. Sostituzione pastiglie freno anteriori"
                />
              </label>

              <button
                type="button"
                className="man-header-btn man-header-btn-outline"
                style={{ marginTop: 8, marginBottom: 12 }}
                onClick={() => setModalGommeOpen(true)}
                disabled={!normalizeText(targa) || !mezzoSelezionato}
              >
                Gestione gomme
              </button>

              <label className="man-label-block">
                <span className="man-label-text">Eseguito da</span>
                <input
                  className="man-input"
                  value={eseguito}
                  onChange={(event) => setEseguito(event.target.value.toUpperCase())}
                  placeholder="Es. OFFICINA INTERNA / AGUSTONI CESARE / ..."
                />
              </label>

              <label className="man-label-inline">
                <span className="man-label-text">Data intervento</span>
                <input
                  className="man-input"
                  value={data}
                  onChange={(event) => setData(event.target.value)}
                  placeholder="gg mm aaaa"
                />
              </label>
            </div>

            <div className="man-section">
              <div className="man-section-title">Materiali utilizzati</div>
              <div
                className="man-empty"
                style={{ marginBottom: 8, background: "#f5f8fc", borderStyle: "solid" }}
              >
                Inventario letto da `@inventario` reale in sola lettura: le selezioni restano solo nella
                bozza locale e non generano scarichi o movimenti.
              </div>

              <div className="man-row man-row-materiale">
                <div className="man-materiale-left" style={{ flex: 1 }}>
                  <label className="man-label-block">
                    <span className="man-label-text">Cerca in inventario / inserisci materiale</span>
                    <input
                      className="man-input"
                      value={materialeSearch}
                      onChange={(event) => setMaterialeSearch(event.target.value)}
                      placeholder="Es. PASTIGLIE FRENO, OLIO MOTORE..."
                    />
                  </label>

                  {materialeSearch && materialiSuggeriti.length > 0 ? (
                    <div className="man-autosuggest">
                      {materialiSuggeriti.map((item) => (
                        <div
                          key={item.id}
                          className="man-autosuggest-item"
                          onClick={() => {
                            if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                              window.alert("Inserisci prima la quantita.");
                              return;
                            }

                            handleAddMateriale(
                              item.label,
                              Number(quantitaTemp),
                              item.unita || "pz",
                              true,
                              item.id,
                            );
                          }}
                        >
                          <div className="man-autosuggest-main">
                            <span className="man-autosuggest-label">{item.label}</span>
                            {item.fornitoreLabel ? (
                              <span className="man-autosuggest-supplier">{item.fornitoreLabel}</span>
                            ) : null}
                          </div>
                          <div className="man-autosuggest-extra">
                            <span>
                              Disponibili: {item.quantitaTotale} {item.unita}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="man-materiale-right" style={{ width: 180 }}>
                  <label className="man-label-inline">
                    <span className="man-label-text">Quantita</span>
                    <input
                      className="man-input man-input-small"
                      value={quantitaTemp}
                      onChange={(event) => setQuantitaTemp(event.target.value)}
                      placeholder="Es. 2"
                      inputMode="numeric"
                    />
                  </label>
                  <button
                    type="button"
                    className="man-header-btn"
                    onClick={() => {
                      if (!materialeSearch.trim()) {
                        window.alert(
                          "Inserisci il nome del materiale o selezionalo dall'inventario.",
                        );
                        return;
                      }
                      if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                        window.alert("Inserisci una quantita valida.");
                        return;
                      }

                      handleAddMateriale(
                        materialeSearch.toUpperCase(),
                        Number(quantitaTemp),
                        "pz",
                        false,
                      );
                    }}
                  >
                    Aggiungi materiale
                  </button>
                </div>
              </div>

              {materialiTemp.length > 0 ? (
                <div className="man-temp-list">
                  {materialiTemp.map((item) => (
                    <div key={item.id} className="man-temp-item">
                      <span>
                        <strong>{item.label}</strong> - {item.quantita} {item.unita}
                        {item.fromInventario ? " (da inventario)" : ""}
                      </span>
                      <button
                        type="button"
                        className="man-delete-btn"
                        onClick={() => handleRemoveMateriale(item.id)}
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="man-actions" style={{ marginTop: 12 }}>
              <button type="button" className="man-primary-btn" onClick={handleSave} disabled={loading}>
                Salva manutenzione
              </button>
              <button type="button" className="man-secondary-btn" onClick={resetForm}>
                Pulisci campi
              </button>
            </div>
          </div>
        </div>

        <div className="man-card man-card-list">
          <div className="man-card-header">
            <div>
              <h2 className="man-title-small">Storico manutenzioni</h2>
              <p className="man-subtitle">Filtra per targa e tipo per una ricerca veloce</p>
            </div>

            <button
              type="button"
              className="man-header-btn man-header-btn-outline"
              onClick={handleExportPdf}
            >
              Esporta PDF
            </button>
          </div>

          <div className="man-card-body">
            <div className="man-filters" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <label className="man-label-inline">
                <span className="man-label-text">Filtra per targa</span>
                <input
                  className="man-input"
                  value={filtroTarga}
                  onChange={(event) => setFiltroTarga(event.target.value)}
                  placeholder="Es. TI315407"
                />
              </label>

              <label className="man-label-inline">
                <span className="man-label-text">Tipo</span>
                <select
                  className="man-input"
                  value={filtroTipo}
                  onChange={(event) => setFiltroTipo(event.target.value as "tutti" | TipoVoce)}
                >
                  <option value="tutti">Tutti</option>
                  <option value="mezzo">Mezzi</option>
                  <option value="compressore">Compressori</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="man-empty">Caricamento in corso...</div>
            ) : storicoFiltrato.length === 0 ? (
              <div className="man-empty">Nessuna manutenzione trovata con i filtri attuali.</div>
            ) : (
              <div className="man-list-wrapper">
                <div className="man-list">
                  {storicoFiltrato.map((item) => (
                    <div key={item.id} className="man-row-item">
                      <div className="man-row-main">
                        <div className="man-row-line1">
                          <span className="man-tag">
                            {item.tipo === "mezzo" ? "MEZZO" : "COMPRESSORE"}
                          </span>
                          <span className="man-targa">{item.targa.toUpperCase()}</span>
                          <span className="man-misura">{buildMisuraLabel(item)}</span>
                          {item.sottotipo ? (
                            <span className="man-sottotipo">{item.sottotipo}</span>
                          ) : null}
                          <span className="man-data">{item.data}</span>
                        </div>
                        <div
                          className="man-row-line2"
                          style={{ display: "flex", gap: 10, justifyContent: "space-between" }}
                        >
                          <div className="man-descrizione">{item.descrizione}</div>
                          <div
                            className="man-row-meta"
                            style={{ display: "flex", gap: 8, alignItems: "center" }}
                          >
                            <span className="man-eseguito">{item.eseguito || "-"}</span>
                            <button
                              type="button"
                              className="man-header-btn man-header-btn-outline"
                              style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                              onClick={() => handleEdit(item)}
                            >
                              Modifica
                            </button>
                            <button
                              type="button"
                              className="man-delete-btn"
                              onClick={handleDelete}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                        {item.materiali?.length ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {item.materiali.map((materiale) => (
                              <span key={materiale.id} className="man-materiali-usati">
                                {materiale.label} - {materiale.quantita} {materiale.unita}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {editingId === item.id ? (
                          <div
                            className="man-empty"
                            style={{ marginTop: 8, background: "#fff7e8", borderStyle: "solid" }}
                          >
                            Voce caricata nel form in sola lettura: nessuna riscrittura su storico,
                            inventario o materiali consegnati.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalGommeOpen && mezzoSelezionato ? (
        <NextModalGomme
          open={modalGommeOpen}
          targa={mezzoSelezionato.targa}
          categoria={mezzoSelezionato.categoria ?? undefined}
          kmIniziale={km}
          enableCalibration={false}
          onClose={() => setModalGommeOpen(false)}
          onConfirm={handleGommeConfirm}
        />
      ) : null}
    </div>
  );
}
