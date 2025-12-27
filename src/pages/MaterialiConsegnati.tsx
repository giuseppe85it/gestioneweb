// src/pages/MaterialiConsegnati.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import type { InventarioItem } from "./Inventario";
import "./MaterialiConsegnati.css";

export interface DestinatarioRef {
  type: "MEZZO" | "COLLEGA" | "MAGAZZINO";
  refId: string;
  label: string;
}

export interface MaterialeConsegnato {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  destinatario: DestinatarioRef;
  motivo?: string;
  data: string; // gg mm aaaa
  fornitore?: string | null;
}

interface MezzoBasic {
  id: string;
  targa?: string;
  nome?: string;
  descrizione?: string;
}

interface CollegaBasic {
  id: string;
  nome?: string;
  cognome?: string;
}

const KEY_INVENTARIO = "@inventario";
const KEY_CONSEGNATI = "@materialiconsegnati";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_COLLEGHI = "@colleghi";

const generateId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const oggi = () => {
  const n = new Date();
  const gg = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const yy = n.getFullYear();
  return `${gg} ${mm} ${yy}`;
};

interface SuggestionDest {
  type: "MEZZO" | "COLLEGA" | "MAGAZZINO";
  refId: string;
  label: string;
  extra?: string;
}

interface SuggestionMat {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fornitore?: string | null;
}

const MaterialiConsegnati: React.FC = () => {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [consegne, setConsegne] = useState<MaterialeConsegnato[]>([]);

  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [colleghi, setColleghi] = useState<CollegaBasic[]>([]);

  // Destinatario
  const [destinatarioInput, setDestinatarioInput] = useState("");
  const [destinatarioObj, setDestinatarioObj] = useState<DestinatarioRef | null>(
    null
  );

  // Materiale
  const [descrizione, setDescrizione] = useState("");
  const [materialeSelezionato, setMaterialeSelezionato] =
    useState<InventarioItem | null>(null);

  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(oggi());

  const [loading, setLoading] = useState(true);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  // Carica inventario + consegne + mezzi + colleghi
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [invRaw, consRaw, mezziRaw, colleghiRaw] = await Promise.all([
          getItemSync(KEY_INVENTARIO),
          getItemSync(KEY_CONSEGNATI),
          getItemSync(KEY_MEZZI),
          getItemSync(KEY_COLLEGHI),
        ]);

        const invArr = Array.isArray(invRaw)
          ? (invRaw as InventarioItem[])
          : invRaw?.value && Array.isArray(invRaw.value)
          ? (invRaw.value as InventarioItem[])
          : [];

        const consArrRaw = Array.isArray(consRaw)
          ? (consRaw as any[])
          : consRaw?.value && Array.isArray(consRaw.value)
          ? (consRaw.value as any[])
          : [];

        // Normalizza eventuali vecchie consegne con destinatario stringa
        const consArr: MaterialeConsegnato[] = consArrRaw.map((c: any) => {
          let dest: DestinatarioRef;
          if (typeof c.destinatario === "string") {
            const label = c.destinatario as string;
            dest = {
              type: "COLLEGA",
              refId: label,
              label,
            };
          } else if (c.destinatario && typeof c.destinatario === "object") {
            dest = c.destinatario as DestinatarioRef;
          } else {
            const label = "DESTINATARIO";
            dest = {
              type: "COLLEGA",
              refId: label,
              label,
            };
          }

          return {
            ...c,
            destinatario: dest,
          } as MaterialeConsegnato;
        });

        const mezziArr = Array.isArray(mezziRaw)
          ? (mezziRaw as MezzoBasic[])
          : mezziRaw?.value && Array.isArray(mezziRaw.value)
          ? (mezziRaw.value as MezzoBasic[])
          : [];

        const colleghiArr = Array.isArray(colleghiRaw)
          ? (colleghiRaw as CollegaBasic[])
          : colleghiRaw?.value && Array.isArray(colleghiRaw.value)
          ? (colleghiRaw.value as CollegaBasic[])
          : [];

        setInventario(invArr);
        setConsegne(consArr);
        setMezzi(mezziArr);
        setColleghi(colleghiArr);
      } finally {
        setLoading(false);
      }
    };

    void loadAll();
  }, []);

  const persistInventario = async (items: InventarioItem[]) => {
    setInventario(items);
    await setItemSync(KEY_INVENTARIO, items);
  };

  const persistConsegne = async (items: MaterialeConsegnato[]) => {
    setConsegne(items);
    await setItemSync(KEY_CONSEGNATI, items);
  };

  // Scala inventario (case-insensitive su descrizione)
  const scalaInventarioPerConsegna = async (c: MaterialeConsegnato) => {
    let inv = [...inventario];
    let rest = c.quantita;

    for (let i = 0; i < inv.length && rest > 0; i++) {
      const item = inv[i];
      if (
        item.unita === c.unita &&
        item.descrizione.toUpperCase() === c.descrizione.toUpperCase()
      ) {
        const consumabile = Math.min(item.quantita, rest);
        item.quantita -= consumabile;
        rest -= consumabile;
        if (item.quantita <= 0) {
          inv.splice(i, 1);
          i--;
        }
      }
    }

    await persistInventario(inv);
  };

  // Ripristina inventario se cancelli una consegna (case-insensitive)
  const ripristinaInventarioPerCancellazione = async (
    c: MaterialeConsegnato
  ) => {
    let inv = [...inventario];

    const idx = inv.findIndex(
      (x) =>
        x.unita === c.unita &&
        x.descrizione.toUpperCase() === c.descrizione.toUpperCase()
    );

    if (idx >= 0) {
      inv[idx] = {
        ...inv[idx],
        quantita: inv[idx].quantita + c.quantita,
      };
    } else {
      inv.push({
        id: generateId(),
        descrizione: c.descrizione,
        quantita: c.quantita,
        unita: c.unita,
        fornitore: c.fornitore ?? null,
        fotoUrl: null,
        fotoStoragePath: null,
      });
    }

    await persistInventario(inv);
  };

  // Suggerimenti destinatario
  const destSuggestions: SuggestionDest[] = useMemo(() => {
    const term = destinatarioInput.trim().toUpperCase();
    if (!term) return [];

    const list: SuggestionDest[] = [];

    // Mezzi
    mezzi.forEach((m) => {
      const rawLabel = m.targa || m.nome || m.descrizione || "";
      if (!rawLabel) return;
      if (rawLabel.toUpperCase().includes(term)) {
        list.push({
          type: "MEZZO",
          refId: m.id,
          label: rawLabel,
          extra: "Mezzo",
        });
      }
    });

    // Colleghi
    colleghi.forEach((c) => {
      const baseName = c.nome || "";
      const fullName =
        c.cognome && baseName ? `${baseName} ${c.cognome}` : baseName;
      const rawLabel = fullName || c.cognome || "";
      if (!rawLabel) return;
      if (rawLabel.toUpperCase().includes(term)) {
        list.push({
          type: "COLLEGA",
          refId: c.id,
          label: rawLabel,
          extra: "Collega",
        });
      }
    });

    // MAGAZZINO
    const magLabel = "MAGAZZINO";
    if (magLabel.includes(term)) {
      list.push({
        type: "MAGAZZINO",
        refId: "MAGAZZINO",
        label: "MAGAZZINO",
        extra: "Magazzino",
      });
    }

    return list.slice(0, 10);
  }, [destinatarioInput, mezzi, colleghi]);

  const handleSelectDestSuggestion = (s: SuggestionDest) => {
    const dest: DestinatarioRef = {
      type: s.type,
      refId: s.refId,
      label: s.label,
    };
    setDestinatarioObj(dest);
    setDestinatarioInput(s.label);
  };

  const handleResetDestinatario = () => {
    setDestinatarioObj(null);
    setDestinatarioInput("");
  };

  // Suggerimenti materiale (da inventario)
  const matSuggestions: SuggestionMat[] = useMemo(() => {
    const term = descrizione.trim().toUpperCase();
    if (!term) return [];

    const list: SuggestionMat[] = [];
    inventario.forEach((item) => {
      const label = item.descrizione || "";
      if (!label) return;
      if (label.toUpperCase().includes(term)) {
        list.push({
          id: item.id,
          label,
          quantita: item.quantita,
          unita: item.unita,
          fornitore: item.fornitore ?? null,
        });
      }
    });

    return list.slice(0, 10);
  }, [descrizione, inventario]);

  const handleSelectMateriale = (s: SuggestionMat) => {
    const item = inventario.find((i) => i.id === s.id);
    if (!item) return;
    setMaterialeSelezionato(item);
    setDescrizione(item.descrizione);
    setUnita(item.unita);
  };

  const handleResetMateriale = () => {
    setMaterialeSelezionato(null);
    setDescrizione("");
    // non resetto l'unità per comodità, la puoi cambiare tu se serve
  };

  // Aggiungi consegna
  const handleAdd = async () => {
    if (!destinatarioObj) {
      alert("Seleziona un destinatario valido dalla lista.");
      return;
    }

    if (!materialeSelezionato) {
      alert("Seleziona un materiale valido dall'inventario.");
      return;
    }

    if (!descrizione.trim() || !quantita.trim()) {
      alert("Compila descrizione e quantità.");
      return;
    }

    const q = Number(quantita.replace(",", "."));
    if (Number.isNaN(q) || q <= 0) {
      alert("La quantità deve essere un numero valido.");
      return;
    }

    const nuovo: MaterialeConsegnato = {
      id: generateId(),
      descrizione: descrizione.trim().toUpperCase(),
      quantita: q,
      unita,
      destinatario: destinatarioObj,
      motivo: motivo.trim() || "",
      data: data.trim() || oggi(),
      fornitore: materialeSelezionato.fornitore ?? null,
    };

    const nuoveConsegne = [...consegne, nuovo];
    await persistConsegne(nuoveConsegne);
    await scalaInventarioPerConsegna(nuovo);

    setQuantita("");
    setMotivo("");
    setData(oggi());
    // mantengo destinatario e materiale selezionati per inserimenti multipli
  };

  // Elimina singola consegna
  const handleDeleteConsegna = async (id: string) => {
    const record = consegne.find((c) => c.id === id);
    if (!record) return;

    if (!confirm("Vuoi eliminare questa consegna e ripristinare il magazzino?")) {
      return;
    }

    const nuove = consegne.filter((c) => c.id !== id);
    await persistConsegne(nuove);
    await ripristinaInventarioPerCancellazione(record);
  };

  // Destinatari unici (lista sinistra)
  const destinatari = useMemo(() => {
    const map = new Map<string, DestinatarioRef>();
    consegne.forEach((c) => {
      const d = c.destinatario;
      if (!d || !d.refId) return;
      if (!map.has(d.refId)) {
        map.set(d.refId, d);
      }
    });
    return Array.from(map.values());
  }, [consegne]);

  // Consegne del destinatario selezionato
  const consegneSelezionate = useMemo(
    () =>
      selectedDest
        ? consegne
            .filter((c) => c.destinatario.refId === selectedDest)
            .sort((a, b) => a.data.localeCompare(b.data))
        : [],
    [selectedDest, consegne]
  );

  const selectedDestLabel = useMemo(() => {
    if (!selectedDest) return "";
    const d = destinatari.find((x) => x.refId === selectedDest);
    return d?.label || "";
  }, [destinatari, selectedDest]);

  // Totale per destinatario (badge)
  const getTotalePerDestinatario = (destRefId: string) => {
    const list = consegne.filter((c) => c.destinatario.refId === destRefId);
    return list.reduce((sum, c) => sum + c.quantita, 0);
  };

  // PDF per destinatario (con fornitore)
  const exportPDFPerDestinatario = async (destRefId: string) => {
    const list = consegne
      .filter((c) => c.destinatario.refId === destRefId)
      .sort((a, b) => a.data.localeCompare(b.data));

    if (!list.length) {
      alert("Nessun materiale consegnato per questo destinatario.");
      return;
    }

    const destLabel = list[0]?.destinatario.label || "Destinatario";

    const rows = list.map((c) => ({
      data: c.data,
      descrizione: c.descrizione,
      fornitore: c.fornitore || "",
      quantita: String(c.quantita),
      unita: c.unita,
      motivo: c.motivo || "",
    }));

    await generateSmartPDF({
      kind: "table",
      title: `Materiali consegnati a ${destLabel}`,
      columns: ["data", "descrizione", "fornitore", "quantita", "unita", "motivo"],
      rows,
    });
  };

  // PDF globale (con fornitore)
  const exportPDFGlobale = async () => {
    if (!consegne.length) {
      alert("Nessun materiale consegnato.");
      return;
    }

    const rows = consegne
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((c) => ({
        data: c.data,
        destinatario: c.destinatario.label,
        descrizione: c.descrizione,
        fornitore: c.fornitore || "",
        quantita: String(c.quantita),
        unita: c.unita,
        motivo: c.motivo || "",
      }));

    await generateSmartPDF({
      kind: "table",
      title: "Storico materiali consegnati",
      columns: [
        "data",
        "destinatario",
        "descrizione",
        "fornitore",
        "quantita",
        "unita",
        "motivo",
      ],
      rows,
    });
  };

  return (
    <div className="mc-page">
      <div className="mc-card">
        {/* HEADER */}
        <div className="mc-header">
          <div className="mc-logo-title">
            <img
              src="/logo.png"
              alt="logo"
              className="mc-logo"
              onClick={() => navigate("/")}
            />
            <div>
              <h1 className="mc-title">Materiali consegnati</h1>
              <p className="mc-subtitle">
                Movimentazioni in uscita da magazzino (colleghi / mezzi)
              </p>
            </div>
          </div>

          <button className="mc-pdf-global-btn" onClick={exportPDFGlobale}>
            PDF Storico
          </button>
        </div>

        {/* FORM NUOVA CONSEGNA */}
        <div className="mc-form">
          {/* DESTINATARIO + SUGGERIMENTI */}
          <label className="mc-label">
            Destinatario (mezzo / collega / MAGAZZINO)
            <input
              type="text"
              className="mc-input"
              value={destinatarioInput}
              readOnly={!!destinatarioObj}
              onChange={(e) => {
                setDestinatarioInput(e.target.value);
                setDestinatarioObj(null);
              }}
              placeholder="Es. MARIO ROSSI / TI 315407 / MAGAZZINO"
            />
          </label>

          {destinatarioObj && (
            <button
              type="button"
              className="mc-add-btn"
              style={{
                marginTop: "4px",
                marginBottom: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
              }}
              onClick={handleResetDestinatario}
            >
              Cambia destinatario
            </button>
          )}

          {!destinatarioObj &&
            destinatarioInput.trim().length > 0 &&
            destSuggestions.length > 0 && (
              <div
                style={{
                  backgroundColor: "#f8f4e8",
                  border: "1px solid #d0c7b8",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  marginBottom: "12px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {destSuggestions.map((s) => (
                  <button
                    key={`${s.type}-${s.refId}`}
                    type="button"
                    onClick={() => handleSelectDestSuggestion(s)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "#e9dfcf";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{s.label}</div>
                    {s.extra && (
                      <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        {s.extra}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

          {/* MATERIALE + SUGGERIMENTI DA INVENTARIO */}
          <label className="mc-label">
            Descrizione materiale
            <input
              type="text"
              className="mc-input"
              value={descrizione}
              readOnly={!!materialeSelezionato}
              onChange={(e) => {
                setDescrizione(e.target.value);
                setMaterialeSelezionato(null);
              }}
              placeholder="Es. TUBO 40MM"
            />
          </label>

          {materialeSelezionato && (
            <button
              type="button"
              className="mc-add-btn"
              style={{
                marginTop: "4px",
                marginBottom: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
              }}
              onClick={handleResetMateriale}
            >
              Cambia materiale
            </button>
          )}

          {!materialeSelezionato &&
            descrizione.trim().length > 0 &&
            matSuggestions.length > 0 && (
              <div
                style={{
                  backgroundColor: "#f8f4e8",
                  border: "1px solid #d0c7b8",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  marginBottom: "12px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {matSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectMateriale(s)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "#e9dfcf";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {s.quantita} {s.unita} disponibili
                    </div>
                  </button>
                ))}
              </div>
            )}

          <div className="mc-row-inline">
            <label className="mc-label flex1">
              Quantità
              <input
                type="number"
                className="mc-input"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
              />
            </label>

            <label className="mc-label flex1">
              Unità
              <select
                className="mc-input"
                value={unita}
                onChange={(e) => setUnita(e.target.value)}
              >
                <option value="pz">pz</option>
                <option value="mt">mt</option>
                <option value="kg">kg</option>
                <option value="lt">lt</option>
              </select>
            </label>
          </div>

          <label className="mc-label">
            Motivo consegna (opzionale)
            <input
              type="text"
              className="mc-input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Es. Intervento manutenzione cisterna"
            />
          </label>

          <label className="mc-label">
            Data consegna
            <input
              type="text"
              className="mc-input"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="gg mm aaaa"
            />
          </label>

          <button className="mc-add-btn" onClick={handleAdd}>
            Registra consegna
          </button>
        </div>

        {/* LISTA DESTINATARI */}
        <div className="mc-list-wrapper">
          {loading ? (
            <div className="mc-empty">Caricamento...</div>
          ) : !consegne.length ? (
            <div className="mc-empty">
              Nessuna consegna registrata. Registra una nuova uscita dal magazzino.
            </div>
          ) : (
            <>
              <div className="mc-dest-list">
                {destinatari.map((dest) => (
                  <button
                    key={dest.refId}
                    className={
                      "mc-dest-row" +
                      (selectedDest === dest.refId ? " mc-dest-row-active" : "")
                    }
                    onClick={() =>
                      setSelectedDest((prev) =>
                        prev === dest.refId ? null : dest.refId
                      )
                    }
                  >
                    <div className="mc-dest-main">
                      <span className="mc-dest-name">{dest.label}</span>
                      <span className="mc-dest-badge">
                        Tot: {getTotalePerDestinatario(dest.refId)}
                      </span>
                    </div>
                    <div className="mc-dest-meta">
                      <span className="mc-dest-meta-text">
                        Movimenti:{" "}
                        {consegne.filter(
                          (c) => c.destinatario.refId === dest.refId
                        ).length}
                      </span>
                      <span className="mc-dest-meta-link">Dettaglio ▾</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* DETTAGLIO DESTINATARIO */}
              {selectedDest && (
                <div className="mc-detail-panel">
                  <div className="mc-detail-header">
                    <div>
                      <h2 className="mc-detail-title">{selectedDestLabel}</h2>
                      <p className="mc-detail-subtitle">
                        Storico materiali consegnati
                      </p>
                    </div>
                    <button
                      className="mc-pdf-btn"
                      onClick={() => exportPDFPerDestinatario(selectedDest)}
                    >
                      PDF
                    </button>
                  </div>

                  <div className="mc-detail-list">
                    {consegneSelezionate.map((c) => (
                      <div key={c.id} className="mc-detail-row">
                        <div className="mc-detail-main">
                          <span className="mc-detail-date">{c.data}</span>
                          <span className="mc-detail-desc">
                            {c.descrizione} — {c.quantita} {c.unita}
                          </span>
                          {c.fornitore && (
                            <span className="mc-detail-motivo">
                              Fornitore: {c.fornitore}
                            </span>
                          )}
                          {c.motivo && (
                            <span className="mc-detail-motivo">{c.motivo}</span>
                          )}
                        </div>
                        <button
                          className="mc-delete-btn"
                          onClick={() => handleDeleteConsegna(c.id)}
                        >
                          Elimina
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialiConsegnati;
