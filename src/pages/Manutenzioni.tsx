// src/pages/Manutenzioni.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Manutenzioni.css";

type TipoVoce = "mezzo" | "compressore";
type SottoTipo = "motrice" | "trattore";

interface MaterialeManutenzione {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fromInventario: boolean;
  refId?: string;
}

interface VoceManutenzione {
  id: string;
  targa: string;
  km?: string | null;
  ore?: string | null;
  sottotipo?: SottoTipo | null;
  descrizione: string;
  eseguito?: string | null;
  data: string; // "gg mm aaaa"
  tipo: TipoVoce;
  materiali?: MaterialeManutenzione[];
}

interface MezzoBasic {
  id: string;
  targa: string;
  label: string;
}

interface MaterialeInventario {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fornitoreLabel?: string;
}

const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_INVENTARIO = "@inventario";
const KEY_MOVIMENTI = "@materialiconsegnati";

// Data in formato ufficiale: "gg mm aaaa"
const oggi = () => {
  const n = new Date();
  const gg = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const yy = n.getFullYear();
  return `${gg} ${mm} ${yy}`;
};

function parseGGMMYYYY(data: string): number {
  if (!data) return 0;

  let gg = "";
  let mm = "";
  let yyyy = "";

  if (data.includes("/")) {
    const [d, m, y] = data.split("/");
    gg = d;
    mm = m;
    yyyy = y;
  } else if (data.includes(" ")) {
    const [d, m, y] = data.split(" ");
    gg = d;
    mm = m;
    yyyy = y;
  } else {
    return 0;
  }

  const num = Date.parse(`${yyyy}-${mm}-${gg}T00:00:00`);
  return Number.isNaN(num) ? 0 : num;
}

const Manutenzioni: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Dati principali
  const [storico, setStorico] = useState<VoceManutenzione[]>([]);
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [materialiInventario, setMaterialiInventario] = useState<MaterialeInventario[]>([]);

  // Filtri lista
  const [filtroTarga, setFiltroTarga] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<"tutti" | TipoVoce>("tutti");

  // Form manutenzione
  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(oggi());

  // Gestione materiali usati nella manutenzione
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [quantitaTemp, setQuantitaTemp] = useState("");

  // Carica storico + mezzi + inventario
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [storicoRaw, mezziRaw, inventarioRaw] = await Promise.all([
          getItemSync(KEY_MANUTENZIONI),
          getItemSync(KEY_MEZZI),
          getItemSync(KEY_INVENTARIO),
        ]);

        // Manutenzioni
        const storicoArr: VoceManutenzione[] = Array.isArray(storicoRaw)
          ? (storicoRaw as VoceManutenzione[])
          : storicoRaw?.value && Array.isArray(storicoRaw.value)
          ? (storicoRaw.value as VoceManutenzione[])
          : [];

        // Mezzi
        const mezziArr: any[] = Array.isArray(mezziRaw)
          ? (mezziRaw as any[])
          : mezziRaw?.value && Array.isArray(mezziRaw.value)
          ? (mezziRaw.value as any[])
          : [];

        const mappedMezzi: MezzoBasic[] = mezziArr
          .map((m) => {
            const tg = (m.targa || "").toUpperCase().trim();
            if (!tg) return null;
            const labelBase =
              m.marcaModello ||
              `${m.marca || ""} ${m.modello || ""}`.trim() ||
              tg;
            return {
              id: m.id || tg,
              targa: tg,
              label: `${tg} – ${labelBase}`,
            };
          })
          .filter(Boolean) as MezzoBasic[];

        // Inventario
        const inventarioArr: any[] = Array.isArray(inventarioRaw)
          ? (inventarioRaw as any[])
          : inventarioRaw?.value && Array.isArray(inventarioRaw.value)
          ? (inventarioRaw.value as any[])
          : [];

        const mappedInv: MaterialeInventario[] = inventarioArr
          .map((m) => {
            const label =
              m.label ||
              m.descrizione ||
              m.nome ||
              "";
            if (!label) return null;
            return {
              id: m.id || label,
              label,
              quantita: m.quantita || 0,
              unita: m.unita || "pz",
              fornitoreLabel: m.fornitoreLabel || m.fornitore || "",
            };
          })
          .filter(Boolean) as MaterialeInventario[];

        // Ordina storico per data (più recente in alto)
        const ordinato = [...storicoArr].sort(
          (a, b) => parseGGMMYYYY(b.data) - parseGGMMYYYY(a.data)
        );

        setStorico(ordinato);
        setMezzi(mappedMezzi);
        setMaterialiInventario(mappedInv);
      } catch (err) {
        console.error("Errore caricamento manutenzioni/mezzi/inventario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Normalizzazione per Firestore: niente undefined
  const persistStorico = async (items: VoceManutenzione[]) => {
    setStorico(items);

    const sanitized = items.map((v) => ({
      ...v,
      km: v.km ?? null,
      ore: v.ore ?? null,
      sottotipo: v.sottotipo ?? null,
      eseguito: v.eseguito ?? null,
    }));

    try {
      await setItemSync(KEY_MANUTENZIONI, sanitized);
    } catch (err) {
      console.error("Errore salvataggio manutenzioni:", err);
    }
  };

  const resetForm = () => {
    // mantengo la targa selezionata per inserire più voci sullo stesso mezzo
    setTipo("mezzo");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setData(oggi());
    // non tocco targa
  };

  const handleSelectTargaMezzo = (value: string) => {
    setTarga(value);
    if (!filtroTarga) {
      setFiltroTarga(value);
    }
  };

  const handleAddMateriale = (
    label: string,
    quantita: number,
    unita: string,
    fromInventario: boolean,
    refId?: string
  ) => {
    if (!label || !quantita) {
      alert("Inserisci almeno nome materiale e quantità.");
      return;
    }

    const nuovo: MaterialeManutenzione = {
      id: Date.now().toString(),
      label,
      quantita,
      unita,
      fromInventario,
      refId,
    };

    setMaterialiTemp((prev) => [...prev, nuovo]);
    setMaterialeSearch("");
    setQuantitaTemp("");
  };

  const handleRemoveMateriale = (id: string) => {
    setMaterialiTemp((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAdd = async () => {
    const t = targa.trim().toUpperCase();
    const desc = descrizione.trim();
    const d = data.trim();

    if (!t || !desc || !d) {
      alert("Compila almeno TARGA, DESCRIZIONE e DATA.");
      return;
    }

    const nuovaVoce: VoceManutenzione = {
      id: Date.now().toString(),
      targa: t,
      km:
        tipo === "mezzo"
          ? ((km || "").trim() || undefined)
          : undefined,
      ore:
        tipo === "compressore"
          ? ((ore || "").trim() || undefined)
          : undefined,
      sottotipo: tipo === "compressore" ? sottotipo : undefined,
      descrizione: desc,
      eseguito: eseguito.trim() || undefined,
      data: d,
      tipo,
      materiali: materialiTemp.length ? materialiTemp : undefined,
    };

    // Aggiornamento inventario e movimenti OUT
    try {
      const inventarioRaw = await getItemSync(KEY_INVENTARIO);
      const inventarioArr: any[] = Array.isArray(inventarioRaw)
        ? (inventarioRaw as any[])
        : inventarioRaw?.value && Array.isArray(inventarioRaw.value)
        ? (inventarioRaw.value as any[])
        : [];

      const movRaw = await getItemSync(KEY_MOVIMENTI);
      const movArr: any[] = Array.isArray(movRaw)
        ? (movRaw as any[])
        : movRaw?.value && Array.isArray(movRaw.value)
        ? (movRaw.value as any[])
        : [];

      let inventarioAgg = [...inventarioArr];
      let movAgg = [...movArr];

      for (const mat of materialiTemp) {
        if (mat.fromInventario && mat.refId) {
          const idx = inventarioAgg.findIndex((i: any) => i.id === mat.refId);
          if (idx !== -1) {
            const currentQty = Number(inventarioAgg[idx].quantita || 0);
            const usedQty = Number(mat.quantita || 0);
            const nuovaQuantita = currentQty - usedQty;
            inventarioAgg[idx].quantita = nuovaQuantita >= 0 ? nuovaQuantita : 0;
          }

          movAgg.push({
            id: `${Date.now().toString()}_${mat.id}`,
            mezzoTarga: t,
            descrizione: mat.label,
            quantita: mat.quantita,
            unita: mat.unita,
            direzione: "OUT",
            data: d,
            destinatario: { type: "mezzo", refId: t, label: t },
          });
        }
      }

      await setItemSync(KEY_INVENTARIO, inventarioAgg);
      await setItemSync(KEY_MOVIMENTI, movAgg);
    } catch (err) {
      console.error("Errore aggiornamento inventario/movimenti:", err);
    }

    const aggiornato = [...storico, nuovaVoce].sort(
      (a, b) => parseGGMMYYYY(b.data) - parseGGMMYYYY(a.data)
    );
    await persistStorico(aggiornato);

    setMaterialiTemp([]);
    setMaterialeSearch("");
    setQuantitaTemp("");
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Vuoi davvero eliminare questa manutenzione?")) {
      return;
    }
    const filtrato = storico.filter((v) => v.id !== id);
    await persistStorico(filtrato);
  };

  const handleApriDossier = () => {
    const tg = (filtroTarga || targa).trim().toUpperCase();
    if (!tg) {
      alert("Seleziona o inserisci una targa per aprire il dossier.");
      return;
    }
    navigate(`/dossier/${encodeURIComponent(tg)}`);
  };

  const storicoFiltrato = useMemo(() => {
    return storico.filter((v) => {
      const matchTarga = filtroTarga
        ? v.targa.toUpperCase().includes(filtroTarga.toUpperCase().trim())
        : true;

      const matchTipo =
        filtroTipo === "tutti" ? true : v.tipo === filtroTipo;

      return matchTarga && matchTipo;
    });
  }, [storico, filtroTarga, filtroTipo]);

  const handleExportPDF = async () => {
    if (storicoFiltrato.length === 0) {
      alert("Non ci sono manutenzioni da esportare con i filtri attuali.");
      return;
    }

    const rows = storicoFiltrato.map((item) => {
      const misura =
        item.tipo === "mezzo"
          ? `${item.km || "0"} km`
          : `${item.ore || "0"} ore`;

      return [
        item.targa,
        item.tipo === "mezzo" ? "MEZZO" : "COMPRESSORE",
        misura,
        item.sottotipo || "",
        item.descrizione,
        item.eseguito || "",
        item.data,
      ];
    });

    try {
      await generateSmartPDF({
        kind: "table",
        title: "Storico manutenzioni",
        columns: [
          "Targa",
          "Tipo",
          "Km/Ore",
          "Sottotipo",
          "Descrizione",
          "Eseguito da",
          "Data",
        ],
        rows,
      });
    } catch (err) {
      console.error("Errore generazione PDF manutenzioni:", err);
      alert("Errore nella generazione del PDF.");
    }
  };

  const materialiSuggeriti = useMemo(() => {
    const term = materialeSearch.trim().toLowerCase();
    if (!term) return [];
    return materialiInventario
      .filter((m) => m.label.toLowerCase().includes(term))
      .slice(0, 5);
  }, [materialeSearch, materialiInventario]);

  return (
    <div className="man-page">
      <div className="man-layout">
        {/* CARD SINISTRA – INSERIMENTO */}
        <div className="man-card man-card-form">
          <div className="man-card-header">
            <div className="man-logo-title">
              <img src="/logo.png" alt="logo" className="man-logo" />
              <div>
                <h1 className="man-title">Manutenzioni</h1>
                <p className="man-subtitle">
                  Inserimento interventi su mezzi e compressori
                </p>
              </div>
            </div>

            <div className="man-header-actions">
              <button
                type="button"
                className="man-header-btn"
                onClick={handleExportPDF}
                disabled={loading}
              >
                Esporta PDF
              </button>
              <button
                type="button"
                className="man-header-btn man-header-btn-outline"
                onClick={handleApriDossier}
              >
                Apri dossier mezzo
              </button>
            </div>
          </div>

          {/* SEZIONE 1 – INFO MEZZO */}
          <div className="man-section">
            <div className="man-section-title">Info mezzo</div>

            <label className="man-label-block">
              <span className="man-label-text">
                Seleziona mezzo (da elenco mezzi)
              </span>
              <select
                className="man-input"
                value={targa}
                onChange={(e) => handleSelectTargaMezzo(e.target.value)}
              >
                <option value="">— Seleziona —</option>
                {mezzi.map((m) => (
                  <option key={m.id} value={m.targa}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="man-label-block">
              <span className="man-label-text">Targa</span>
              <input
                className="man-input"
                value={targa}
                onChange={(e) => setTarga(e.target.value.toUpperCase())}
                placeholder="Es. TI315407"
              />
            </label>

            <div className="man-row">
              <label className="man-label-inline">
                <span className="man-label-text">Tipo</span>
                <select
                  className="man-input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoVoce)}
                >
                  <option value="mezzo">Mezzo</option>
                  <option value="compressore">Compressore</option>
                </select>
              </label>

              {tipo === "mezzo" && (
                <label className="man-label-inline">
                  <span className="man-label-text">Km</span>
                  <input
                    className="man-input"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder="Es. 250000"
                    inputMode="numeric"
                  />
                </label>
              )}

{tipo === "compressore" && (
  <label className="man-label-inline">
    <span className="man-label-text">Ore</span>
    <input
      className="man-input"
      value={ore}
      onChange={(e) => setOre(e.target.value)}
      placeholder="Es. 1200"
      inputMode="numeric"
    />
  </label>
)}
              
            </div>

            {tipo === "compressore" && (
              <label className="man-label-block">
                <span className="man-label-text">Sottotipo compressore</span>
                <select
                  className="man-input"
                  value={sottotipo}
                  onChange={(e) =>
                    setSottotipo(e.target.value as SottoTipo)
                  }
                >
                  <option value="motrice">Motrice</option>
                  <option value="trattore">Trattore</option>
                </select>
              </label>
            )}
          </div>

          {/* SEZIONE 2 – DETTAGLI MANUTENZIONE */}
          <div className="man-section">
            <div className="man-section-title">Dettagli manutenzione</div>

            <label className="man-label-block">
              <span className="man-label-text">Descrizione intervento</span>
              <textarea
                className="man-input man-textarea"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Es. Sostituzione pastiglie freno anteriori"
              />
            </label>

            <label className="man-label-block">
              <span className="man-label-text">Eseguito da</span>
              <input
                className="man-input"
                value={eseguito}
                onChange={(e) => setEseguito(e.target.value)}
                placeholder="Es. Officina Rossi"
              />
            </label>
          </div>

          {/* SEZIONE 2B – MATERIALI UTILIZZATI */}
          <div className="man-section">
            <div className="man-section-title">Materiali utilizzati</div>

            <label className="man-label-block">
              <span className="man-label-text">Cerca materiale</span>
              <input
                className="man-input"
                value={materialeSearch}
                onChange={(e) => setMaterialeSearch(e.target.value)}
                placeholder="Es. pastiglie, olio, bulloni..."
              />
            </label>

            {materialeSearch.trim() !== "" && (
              <div className="man-autosuggest">
                {materialiSuggeriti.map((m) => (
                  <div
                    key={m.id}
                    className="man-autosuggest-item"
onClick={() => {
  if (!quantitaTemp || Number(quantitaTemp) <= 0) {
    alert("Inserisci prima la quantità.");
    return;
  }

  handleAddMateriale(
    m.label,
    Number(quantitaTemp),
    m.unita || "pz",
    true,
    m.id
  );
}}
                  >
                    <strong>{m.label}</strong>
                    <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                      {m.quantita} {m.unita}
                    </span>
                  </div>
                ))}

                <div
                  className="man-autosuggest-item man-autosuggest-free"
                  onClick={() =>
                    handleAddMateriale(
                      materialeSearch.trim(),
                      Number(quantitaTemp || 1),
                      "pz",
                      false
                    )
                  }
                >
                  ➕ Aggiungi “{materialeSearch.trim()}” come materiale libero
                </div>
              </div>
            )}

            <label className="man-label-block" style={{ marginTop: "10px" }}>
              <span className="man-label-text">Quantità</span>
              <input
                className="man-input"
                value={quantitaTemp}
                onChange={(e) => setQuantitaTemp(e.target.value)}
                placeholder="Es. 2"
                inputMode="numeric"
              />
            </label>

            {materialiTemp.length > 0 && (
              <div className="man-temp-list">
                <h4 style={{ marginTop: "15px" }}>Materiali aggiunti</h4>

                {materialiTemp.map((m) => (
                  <div key={m.id} className="man-temp-item">
                    <span>
                      <strong>{m.label}</strong> — {m.quantita} {m.unita}
                      {m.fromInventario && (
                        <span style={{ opacity: 0.6 }}> (da inventario)</span>
                      )}
                    </span>

                    <button
                      type="button"
                      className="man-delete-btn"
                      onClick={() => handleRemoveMateriale(m.id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEZIONE 3 – DATA + AZIONI */}
          <div className="man-section man-section-last">
            <div className="man-section-title">Data e conferma</div>

            <div className="man-row">
              <label className="man-label-inline">
                <span className="man-label-text">Data (gg mm aaaa)</span>
                <input
                  className="man-input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="Es. 05 12 2025"
                />
              </label>

              <div className="man-actions">
                <button
                  type="button"
                  className="man-secondary-btn"
                  onClick={resetForm}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="man-primary-btn"
                  onClick={handleAdd}
                  disabled={loading}
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD DESTRA – STORICO */}
        <div className="man-card man-card-list">
          <div className="man-card-header man-card-header-list">
            <div>
              <h2 className="man-title-small">Storico manutenzioni</h2>
              <p className="man-subtitle">
                Lista interventi filtrabile per targa e tipo
              </p>
            </div>
          </div>

          {/* FILTRI LISTA */}
          <div className="man-filters-list">
            <label className="man-label-block">
              <span className="man-label-text">Filtra per targa</span>
              <input
                className="man-input"
                value={filtroTarga}
                onChange={(e) => setFiltroTarga(e.target.value)}
                placeholder="Es. TI315407"
              />
            </label>

            <div className="man-filter-tipo">
              <span className="man-label-text">Tipo</span>
              <div className="man-filter-chips">
                <button
                  type="button"
                  className={
                    filtroTipo === "tutti"
                      ? "man-chip man-chip-active"
                      : "man-chip"
                  }
                  onClick={() => setFiltroTipo("tutti")}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  className={
                    filtroTipo === "mezzo"
                      ? "man-chip man-chip-active"
                      : "man-chip"
                  }
                  onClick={() => setFiltroTipo("mezzo")}
                >
                  Mezzi
                </button>
                <button
                  type="button"
                  className={
                    filtroTipo === "compressore"
                      ? "man-chip man-chip-active"
                      : "man-chip"
                  }
                  onClick={() => setFiltroTipo("compressore")}
                >
                  Compressori
                </button>
              </div>
            </div>
          </div>

          {/* LISTA */}
          <div className="man-list-wrapper">
            {loading ? (
              <div className="man-empty">Caricamento in corso…</div>
            ) : storicoFiltrato.length === 0 ? (
              <div className="man-empty">
                Nessuna manutenzione registrata con i filtri attuali.
              </div>
            ) : (
              <div className="man-list">
                {storicoFiltrato.map((item) => {
                  const misura =
                    item.tipo === "mezzo"
                      ? `${item.km || "0"} km`
                      : `${item.ore || "0"} ore`;

                  return (
                    <div key={item.id} className="man-row-item">
                      <div className="man-row-main">
                        <div className="man-row-line1">
                          <span className="man-tag">
                            {item.tipo === "mezzo"
                              ? "MEZZO"
                              : "COMPRESSORE"}
                          </span>
                          <span className="man-targa">
                            {item.targa.toUpperCase()}
                          </span>
                          <span className="man-misura">{misura}</span>
                          {item.sottotipo && (
                            <span className="man-sottotipo">
                              {item.sottotipo}
                            </span>
                          )}
                          <span className="man-data">{item.data}</span>
                        </div>
                        <div className="man-row-line2">
                          <span className="man-descrizione">
                            {item.descrizione}
                          </span>
                          {item.eseguito && (
                            <span className="man-eseguito">
                              Eseguito da: {item.eseguito}
                            </span>
                          )}
                          {item.materiali && item.materiali.length > 0 && (
                            <span className="man-materiali-usati">
                              Materiali:{" "}
                              {item.materiali
                                .map(
                                  (m) =>
                                    `${m.label} (${m.quantita} ${m.unita})`
                                )
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="man-row-actions">
                        <button
                          type="button"
                          className="man-delete-btn"
                          onClick={() => handleDelete(item.id)}
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

export default Manutenzioni;
