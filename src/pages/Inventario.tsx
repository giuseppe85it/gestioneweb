// src/pages/Inventario.tsx
import { useEffect, useState } from "react";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Inventario.css";
import { storage } from "../firebase";

import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import {  ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

  const [fornitoriList, setFornitoriList] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [fotoFile, setFotoFile] = useState<File | null>(null);

  // ---------------------------------------------------
  // CARICA inventario + fornitori
  // ---------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // INVENTARIO
        const data = await getItemSync(INVENTARIO_KEY);
        if (Array.isArray(data)) setInventario(data as InventarioItem[]);
        else if (data?.value && Array.isArray(data.value))
          setInventario(data.value as InventarioItem[]);

        // FORNITORI
        try {
          const refF = doc(collection(db, "storage"), "@fornitori");
          const snap = await getDoc(refF);

          if (snap.exists()) {
            const raw = snap.data().value || [];
            const nomi = raw.map((f: any) =>
              (f.nome || f.ragioneSociale || "").toString().toUpperCase()
            );
            setFornitoriList(nomi);
          } else {
            setFornitoriList([]);
          }
        } catch (err) {
          console.error("Errore caricamento fornitori:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  // ---------------------------------------------------
  // SALVA
  // ---------------------------------------------------
  const persist = async (items: InventarioItem[]) => {
    setInventario(items);
    await setItemSync(INVENTARIO_KEY, items);
  };

  // ---------------------------------------------------
  // UPLOAD foto su Firebase Storage
  // ---------------------------------------------------
  const uploadFoto = async (materialeId: string) => {
    if (!fotoFile) return { url: null, path: null };

        const path = `inventario/${materialeId}/foto.jpg`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, fotoFile);
    const url = await getDownloadURL(snapshot.ref);

    return { url, path };
  };

  // ---------------------------------------------------
  // AGGIUNGI nuovo materiale
  // ---------------------------------------------------
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

    const nuovoId = generateId();

    let fotoUrl = null;
    let fotoStoragePath = null;

    if (fotoFile) {
      const foto = await uploadFoto(nuovoId);
      fotoUrl = foto.url;
      fotoStoragePath = foto.path;
    }

    const nuovo: InventarioItem = {
      id: nuovoId,
      descrizione: descrizione.trim(),
      quantita: q,
      unita,
      fornitore: fornitore.trim() || null,
      fotoUrl,
      fotoStoragePath,
    };

    const nuovi = [...inventario, nuovo];
    await persist(nuovi);

    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFornitore("");
    setFotoFile(null);
    setSuggestions([]);
  };

  // ---------------------------------------------------
  // CAMBIO QUANTITÀ (+/-)
  // ---------------------------------------------------
  const changeQty = async (id: string, delta: number) => {
    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: Math.max(0, i.quantita + delta) } : i
    );
    await persist(nuovi);
  };

  // ---------------------------------------------------
  // CAMBIO QUANTITÀ manuale
  // ---------------------------------------------------
  const inputQty = async (id: string, value: string) => {
    const num = Number(value.replace(",", "."));
    if (Number.isNaN(num) || num < 0) return;

    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: num } : i
    );
    await persist(nuovi);
  };

  // ---------------------------------------------------
  // ELIMINA
  // ---------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Vuoi veramente eliminare questo materiale?")) return;
    await persist(inventario.filter((i) => i.id !== id));
  };

  // ---------------------------------------------------
  // PDF
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
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

          {/* FORNITORE */}
          <label className="inventario-label">
            Fornitore (suggerimenti automatici)
            <input
              type="text"
              className="inventario-input"
              value={fornitore}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setFornitore(val);

                if (val.length === 0) {
                  setSuggestions([]);
                  return;
                }

                const filtered = fornitoriList.filter((f) =>
                  f.toLowerCase().includes(val.toLowerCase())
                );
                setSuggestions(filtered.slice(0, 5));
              }}
              placeholder="Es. EDILCOM SA"
            />

            {suggestions.length > 0 && (
              <div className="inventario-suggestions">
                {suggestions.map((s) => (
                  <div
                    key={s}
                    className="inventario-suggestion-item"
                    onClick={() => {
                      setFornitore(s);
                      setSuggestions([]);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </label>

          {/* FOTO */}
          <label className="inventario-label">
            Foto (opzionale)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFotoFile(file);
              }}
            />
          </label>

          {fotoFile && (
            <div className="inventario-preview">
              <img
                src={URL.createObjectURL(fotoFile)}
                className="inventario-thumb"
                alt="preview"
              />
            </div>
          )}

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
                  <div className="inventario-row-foto">
                    {item.fotoUrl ? (
                      <img src={item.fotoUrl} className="inventario-thumb" />
                    ) : (
                      <div className="inventario-thumb placeholder">FOTO</div>
                    )}
                  </div>

                  <div className="inventario-row-details">
                    <span className="inventario-row-descrizione">
                      {item.descrizione}
                      {item.fornitore && (
                        <span className="inventario-row-fornitore-inline">
                          {" — "} {item.fornitore}
                        </span>
                      )}
                    </span>

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
