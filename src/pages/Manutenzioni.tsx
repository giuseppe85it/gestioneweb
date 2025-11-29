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
  fornitoreLabel?: string;
}

interface VoceManutenzione {
  id: string;
  targa: string;
  km?: string | null;
  ore?: string | null;
  sottotipo?: SottoTipo | null;
  descrizione: string;
  eseguito?: string | null;
  data: string;
  tipo: TipoVoce;
  materiali?: MaterialeManutenzione[];
}

const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_INVENTARIO = "@inventario";
const KEY_MOVIMENTI = "@materialiconsegnati";

function parseData(d: string) {
  if (!d) return 0;
  const [gg, mm, yyyy] = d.split(" ");
  return new Date(Number(yyyy), Number(mm) - 1, Number(gg)).getTime();
}

const oggi = () => {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")} ${String(
    n.getMonth() + 1
  ).padStart(2, "0")} ${n.getFullYear()}`;
};

export default function Manutenzioni() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [storico, setStorico] = useState<VoceManutenzione[]>([]);
  const [mezzi, setMezzi] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);

  const [filtroTarga, setFiltroTarga] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"tutti" | TipoVoce>("tutti");

  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(oggi());

  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialeSelezionato, setMaterialeSelezionato] = useState<any>(null);
  const [quantitaTemp, setQuantitaTemp] = useState("");

  const [materialiUsati, setMaterialiUsati] = useState<MaterialeManutenzione[]>(
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const rawMan = await getItemSync(KEY_MANUTENZIONI);
      const rawMezzi = await getItemSync(KEY_MEZZI);
      const rawInv = await getItemSync(KEY_INVENTARIO);

      const arrMan = Array.isArray(rawMan)
        ? rawMan
        : rawMan?.value || [];

      const arrMezzi = Array.isArray(rawMezzi)
        ? rawMezzi
        : rawMezzi?.value || [];

      const arrInv = Array.isArray(rawInv)
        ? rawInv
        : rawInv?.value || [];

      const mappedMezzi = arrMezzi
        .map((m: any) => ({
          id: m.id,
          targa: (m.targa || "").toUpperCase(),
          label: `${(m.targa || "").toUpperCase()} – ${m.marca || ""} ${m.modello || ""
            }`.trim(),
        }))
        .filter((m: any) => m.targa);

      setStorico(
        [...arrMan].sort((a, b) => parseData(b.data) - parseData(a.data))
      );
      setMezzi(mappedMezzi);
      setInventario(arrInv);

      setLoading(false);
    };
    load();
  }, []);

  const persist = async (arr: VoceManutenzione[]) => {
    setStorico(arr);
    await setItemSync(KEY_MANUTENZIONI, arr);
  };

  const materialiSuggeriti = useMemo(() => {
    if (!materialeSearch.trim()) return [];
    return inventario
      .filter((m: any) =>
        String(m.label || m.descrizione || "")
          .toLowerCase()
          .includes(materialeSearch.toLowerCase())
      )
      .slice(0, 6);
  }, [materialeSearch, inventario]);

  const handleAddMateriale = () => {
    if (!materialeSelezionato) {
      alert("Seleziona un materiale.");
      return;
    }
    if (!quantitaTemp || Number(quantitaTemp) <= 0) {
      alert("Inserisci una quantità valida.");
      return;
    }

    const label = materialeSelezionato.label;
    const quantita = Number(quantitaTemp);
    const unita = materialeSelezionato.unita || "pz";
    const refId = materialeSelezionato.id;

    const esiste = materialiUsati.find(
      (m) =>
        m.label.toLowerCase() === label.toLowerCase() &&
        m.fromInventario === true
    );

    if (esiste) {
      setMaterialiUsati((prev) =>
        prev.map((m) =>
          m.label.toLowerCase() === label.toLowerCase()
            ? { ...m, quantita: m.quantita + quantita }
            : m
        )
      );
    } else {
      setMaterialiUsati((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          label,
          quantita,
          unita,
          fromInventario: true,
          refId,
          fornitoreLabel: materialeSelezionato.fornitoreLabel || "",
        },
      ]);
    }

    setMaterialeSearch("");
    setMaterialeSelezionato(null);
    setQuantitaTemp("");
  };

  const handleAddMaterialeLibero = () => {
    if (!materialeSearch.trim()) {
      alert("Inserisci il nome del materiale.");
      return;
    }
    if (!quantitaTemp || Number(quantitaTemp) <= 0) {
      alert("Inserisci una quantità valida.");
      return;
    }

    const label = materialeSearch.trim();
    const unita = "pz";
    const quantita = Number(quantitaTemp);

    const esiste = materialiUsati.find(
      (m) =>
        m.label.toLowerCase() === label.toLowerCase() &&
        m.fromInventario === false
    );

    if (esiste) {
      setMaterialiUsati((prev) =>
        prev.map((m) =>
          m.label.toLowerCase() === label.toLowerCase()
            ? { ...m, quantita: m.quantita + quantita }
            : m
        )
      );
    } else {
      setMaterialiUsati((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          label,
          quantita,
          unita,
          fromInventario: false,
        },
      ]);
    }

    setMaterialeSearch("");
    setQuantitaTemp("");
  };

  const handleRemoveMateriale = (id: string) => {
    setMaterialiUsati((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAdd = async () => {
    if (!targa.trim() || !descrizione.trim()) {
      alert("Compila almeno targa e descrizione.");
      return;
    }

    const nuova: VoceManutenzione = {
      id: Date.now().toString(),
      targa: targa.toUpperCase(),
      tipo,
      km: tipo === "mezzo" ? km || null : null,
      ore: tipo === "compressore" ? ore || null : null,
      sottotipo: tipo === "compressore" ? sottotipo : null,
      descrizione,
      eseguito: eseguito.trim() || null,
      data,
      materiali: materialiUsati,
    };

    const arr = [...storico, nuova].sort(
      (a, b) => parseData(b.data) - parseData(a.data)
    );

    const inv = [...inventario];
    const mov = (await getItemSync(KEY_MOVIMENTI)) || [];

    for (const m of materialiUsati) {
      if (m.fromInventario && m.refId) {
        const idx = inv.findIndex((x) => x.id === m.refId);
        if (idx !== -1) {
          inv[idx].quantita = Math.max(
            0,
            inv[idx].quantita - m.quantita
          );
        }

        mov.push({
          id: `${Date.now()}_${m.id}`,
          mezzoTarga: targa,
          descrizione: m.label,
          quantita: m.quantita,
          unita: m.unita,
          direzione: "OUT",
          data,
          fornitoreLabel: m.fornitoreLabel || "",
          destinatario: {
            type: "mezzo",
            refId: targa,
            label: targa,
          },
        });
      }
    }

    await setItemSync(KEY_INVENTARIO, inv);
    await setItemSync(KEY_MOVIMENTI, mov);

    await persist(arr);

    setMaterialiUsati([]);
    setMaterialeSearch("");
    setMaterialeSelezionato(null);
    setQuantitaTemp("");
    setDescrizione("");
    setEseguito("");
    setKm("");
    setOre("");
  };

  const filtrati = useMemo(() => {
    return storico.filter((s) => {
      const matchT =
        !filtroTarga || s.targa.includes(filtroTarga.toUpperCase());
      const matchTipo =
        filtroTipo === "tutti" || s.tipo === filtroTipo;
      return matchT && matchTipo;
    });
  }, [storico, filtroTarga, filtroTipo]);

  return (
    <div className="man-page">
      <div className="man-layout">
        {/* FORM SINISTRA */}
        <div className="man-card man-card-form">
          <h1 className="man-title">MANUTENZIONI</h1>

          {/* INFO MEZZO */}
          <div className="man-section">
            <div className="man-section-title">Info Mezzo</div>

            <label className="man-label-block">
              <span className="man-label-text">Targa</span>
              <input
                className="man-input"
                value={targa}
                onChange={(e) =>
                  setTarga(e.target.value.toUpperCase())
                }
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
                  />
                </label>
              )}
            </div>
          </div>

          {/* DETTAGLI */}
          <div className="man-section">
            <div className="man-section-title">Dettagli Manutenzione</div>

            <label className="man-label-block">
              <span className="man-label-text">Descrizione</span>
              <textarea
                className="man-input"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
              />
            </label>

            <label className="man-label-block">
              <span className="man-label-text">Eseguito da</span>
              <input
                className="man-input"
                value={eseguito}
                onChange={(e) => setEseguito(e.target.value)}
              />
            </label>
          </div>

          {/* MATERIALI */}
          <div className="man-section">
            <div className="man-section-title">Materiali utilizzati</div>

            <input
              className="man-input"
              placeholder="Cerca materiale"
              value={materialeSearch}
              onChange={(e) => {
                setMaterialeSearch(e.target.value);
                setMaterialeSelezionato(null);
              }}
            />

            {materialeSearch.trim() !== "" && (
              <div className="man-autosuggest">
                {materialiSuggeriti.map((m: any) => (
                  <div
                    key={m.id}
                    className="man-autosuggest-item"
                    onClick={() => {
                      setMaterialeSelezionato(m);
                      setMaterialeSearch(m.label);
                    }}
                  >
                    <strong>{m.label}</strong>
                    <span>{m.quantita + " " + m.unita}</span>
                  </div>
                ))}

                <div
                  className="man-autosuggest-item man-autosuggest-free"
                  onClick={() => {
                    setMaterialeSelezionato(null);
                  }}
                >
                  ➕ Aggiungi come materiale libero
                </div>
              </div>
            )}

            {materialeSearch.trim() !== "" && (
              <div className="man-temp-inline">
                <strong>{materialeSearch}</strong>
                <span>— Q.tà:</span>
                <input
                  className="man-input-small"
                  value={quantitaTemp}
                  onChange={(e) => setQuantitaTemp(e.target.value)}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="man-add-btn"
                  onClick={() => {
                    if (materialeSelezionato) handleAddMateriale();
                    else handleAddMaterialeLibero();
                  }}
                >
                  Aggiungi
                </button>
              </div>
            )}

            {materialiUsati.length > 0 && (
              <div className="man-temp-list">
                {materialiUsati.map((m) => (
                  <div key={m.id} className="man-temp-item">
                    <span>
                      {m.label} — {m.quantita} {m.unita}
                    </span>
                    <button
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

          {/* DATA */}
          <div className="man-section">
            <label className="man-label-block">
              <span className="man-label-text">Data</span>
              <input
                className="man-input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </label>

            <div className="man-actions">
              <button
                className="man-secondary-btn"
                onClick={() => {
                  setDescrizione("");
                  setEseguito("");
                  setKm("");
                  setOre("");
                  setMaterialeSearch("");
                  setMaterialeSelezionato(null);
                  setQuantitaTemp("");
                  setMaterialiUsati([]);
                }}
              >
                Reset
              </button>
              <button className="man-primary-btn" onClick={handleAdd}>
                Aggiungi
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DESTRA */}
        <div className="man-card man-card-list">
          <h2 className="man-title-small">Storico manutenzioni</h2>

          <div className="man-section">
            <label className="man-label-block">
              <span className="man-label-text">Filtra per targa</span>
              <input
                className="man-input"
                value={filtroTarga}
                onChange={(e) => setFiltroTarga(e.target.value)}
              />
            </label>

            <div className="man-filter">
              <button
                className={
                  filtroTipo === "tutti" ? "man-chip-active" : "man-chip"
                }
                onClick={() => setFiltroTipo("tutti")}
              >
                Tutti
              </button>

              <button
                className={
                  filtroTipo === "mezzo" ? "man-chip-active" : "man-chip"
                }
                onClick={() => setFiltroTipo("mezzo")}
              >
                Mezzi
              </button>

              <button
                className={
                  filtroTipo === "compressore"
                    ? "man-chip-active"
                    : "man-chip"
                }
                onClick={() => setFiltroTipo("compressore")}
              >
                Compressori
              </button>
            </div>
          </div>

          <div className="man-list">
            {filtrati.map((item) => (
              <div key={item.id} className="man-row-item">
                <div>
                  <div className="man-row-line1">
                    <span
                      className={
                        item.tipo === "mezzo"
                          ? "man-tag mezzo-tag"
                          : "man-tag comp-tag"
                      }
                    >
                      {item.tipo.toUpperCase()}
                    </span>
                    <span className="man-targa">{item.targa}</span>
                    {item.tipo === "mezzo" && (
                      <span className="man-misura">{item.km} km</span>
                    )}
                    {item.tipo === "compressore" && (
                      <span className="man-misura">{item.ore} ore</span>
                    )}
                    <span className="man-data">{item.data}</span>
                  </div>

                  <div className="man-row-line2">
                    <span>{item.descrizione}</span>
                    {item.eseguito && (
                      <span> — Eseguito da: {item.eseguito}</span>
                    )}

                    {item.materiali && item.materiali.length > 0 && (
                      <div className="man-materiali-usati">
                        Materiali:{" "}
                        {item.materiali
                          .map(
                            (m) =>
                              `${m.label} (${m.quantita} ${m.unita})`
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="man-delete-btn"
                  onClick={() =>
                    persist(storico.filter((x) => x.id !== item.id))
                  }
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
