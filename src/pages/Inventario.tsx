// src/pages/Inventario.tsx
import { useEffect, useState } from "react";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Inventario.css";

export interface InventarioItem {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  fornitore?: string | null;
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
}

const INVENTARIO_KEY = "@inventario";
const generateId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const Inventario: React.FC = () => {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [fornitore, setFornitore] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // CARICA INVENTARIO
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getItemSync(INVENTARIO_KEY);
        if (Array.isArray(data)) setInventario(data as InventarioItem[]);
        else if (data?.value && Array.isArray(data.value))
          setInventario(data.value as InventarioItem[]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  // SALVA
  const persist = async (items: InventarioItem[]) => {
    setInventario(items);
    await setItemSync(INVENTARIO_KEY, items);
  };

  // AGGIUNGI MATERIALE MANUALE
  const handleAdd = async () => {
    if (!descrizione.trim() || !quantita.trim()) {
      alert("Inserisci descrizione e quantità.");
      return;
    }

    const q = Number(quantita.replace(",", "."));
    if (Number.isNaN(q) || q <= 0) {
      alert("La quantità deve essere un numero valido.");
      return;
    }

    const nuovo: InventarioItem = {
      id: generateId(),
      descrizione: descrizione.trim(),
      quantita: q,
      unita,
      fornitore: fornitore.trim() || null,
    };

    const nuovi = [...inventario, nuovo];
    await persist(nuovi);

    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFornitore("");
  };

  // CAMBIA QUANTITÀ (+/-)
  const changeQty = async (id: string, delta: number) => {
    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: Math.max(0, i.quantita + delta) } : i
    );
    await persist(nuovi);
  };

  // CAMBIA QUANTITÀ DA INPUT
  const inputQty = async (id: string, value: string) => {
    const num = Number(value.replace(",", "."));
    if (Number.isNaN(num) || num < 0) return;

    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: num } : i
    );
    await persist(nuovi);
  };

  // ELIMINA
  const handleDelete = async (id: string) => {
    if (!confirm("Vuoi veramente eliminare questo materiale?")) return;
    await persist(inventario.filter((i) => i.id !== id));
  };

  // PDF (allineato a OrdiniArrivati / pdfEngine reale)
  const exportPDF = async () => {
    if (inventario.length === 0) {
      alert("Inventario vuoto.");
      return;
    }

    const rows = inventario.map((item) => ({
      descrizione: item.descrizione,
      fornitore: item.fornitore || "",
      quantita: String(item.quantita),
      unita: item.unita,
      foto: item.fotoUrl ? "SI" : "",
    }));

    await generateSmartPDF({
      kind: "table",
      title: "Inventario Magazzino",
      columns: ["descrizione", "fornitore", "quantita", "unita", "foto"],
      rows,
    });
  };

  return (
    <div className="inventario-page">
      <div className="inventario-card">
        {/* HEADER */}
        <div className="inventario-header">
          <div className="inventario-logo-title">
            <img src="/logo.png" alt="logo" className="inventario-logo" />
            <div>
              <h1 className="inventario-title">Inventario</h1>
              <p className="inventario-subtitle">Gestione magazzino centrale</p>
            </div>
          </div>

          <button className="inventario-pdf-button" onClick={exportPDF}>
            Esporta PDF
          </button>
        </div>

        {/* FORM */}
        <div className="inventario-form">
          <label className="inventario-label">
            Descrizione
            <input
              type="text"
              className="inventario-input"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Es. Tubo 40mm"
            />
          </label>

          <label className="inventario-label">
            Fornitore (opzionale)
            <input
              type="text"
              className="inventario-input"
              value={fornitore}
              onChange={(e) => setFornitore(e.target.value)}
              placeholder="Es. EdilCom SA"
            />
          </label>

          <div className="inventario-inline">
            <label className="inventario-label flex1">
              Quantità
              <input
                type="number"
                className="inventario-input"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
              />
            </label>

            <label className="inventario-label flex1">
              Unità
              <select
                className="inventario-input"
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

          <button className="inventario-add-button" onClick={handleAdd}>
            Aggiungi al magazzino
          </button>
        </div>

        {/* LISTA */}
        <div className="inventario-list-wrapper">
          {isLoading ? (
            <div className="inventario-empty">Caricamento...</div>
          ) : inventario.length === 0 ? (
            <div className="inventario-empty">Nessun materiale inserito.</div>
          ) : (
            <div className="inventario-list">
              {inventario.map((item) => (
                <div key={item.id} className="inventario-row">
                  {/* FOTO */}
                  <div className="inventario-row-foto">
                    {item.fotoUrl ? (
                      <img src={item.fotoUrl} className="inventario-thumb" />
                    ) : (
                      <div className="inventario-thumb placeholder">FOTO</div>
                    )}
                  </div>

                  {/* DESCRIZIONE + FORNITORE INLINE */}
                  <div className="inventario-row-details">
                    <span className="inventario-row-descrizione">
                      {item.descrizione}
                      {item.fornitore && (
                        <span className="inventario-row-fornitore-inline">
                          {" — "} {item.fornitore}
                        </span>
                      )}
                    </span>

                    {/* QUANTITÀ */}
                    <div className="inventario-row-quantita-block">
                      <span className="inventario-row-quantita-label">
                        Quantità
                      </span>

                      <div className="inventario-row-quantita-controls">
                        <button
                          className="inventario-qty-btn"
                          onClick={() => changeQty(item.id, -1)}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          className="inventario-qty-input"
                          value={item.quantita}
                          onChange={(e) => inputQty(item.id, e.target.value)}
                        />

                        <button
                          className="inventario-qty-btn"
                          onClick={() => changeQty(item.id, 1)}
                        >
                          +
                        </button>

                        <span className="inventario-row-unita">
                          {item.unita}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ELIMINA */}
                  <div className="inventario-row-actions">
                    <button
                      className="inventario-delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
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
  );
};

export default Inventario;
