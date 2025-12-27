// ======================================================
// INVENTARIO — VERSIONE COMPLETA + MODIFICA ARTICOLO
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Inventario.css";
import { storage, db } from "../firebase";

import { collection, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const navigate = useNavigate();
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [fornitore, setFornitore] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [fornitoriList, setFornitoriList] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  // ---------------------------
  // MODIFICA ARTICOLO (UNICA AGGIUNTA)
  // ---------------------------
  const [editItem, setEditItem] = useState<InventarioItem | null>(null);
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);

  // ---------------------------
  // CARICAMENTO
  // ---------------------------
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getItemSync(INVENTARIO_KEY);
        if (Array.isArray(data)) setInventario(data);
        else if (data?.value && Array.isArray(data.value)) setInventario(data.value);

        try {
          const refF = doc(collection(db, "storage"), "@fornitori");
          const snap = await getDoc(refF);
          if (snap.exists()) {
            const raw = snap.data().value || [];
            const nomi = raw.map((f: any) =>
              (f.nome || f.ragioneSociale || "").toString().toUpperCase()
            );
            setFornitoriList(nomi);
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  // ---------------------------
  // SALVA
  // ---------------------------
  const persist = async (items: InventarioItem[]) => {
    setInventario(items);
    await setItemSync(INVENTARIO_KEY, items);
  };

  // ---------------------------
  // UPLOAD FOTO
  // ---------------------------
  const uploadFoto = async (id: string, file: File | null) => {
    if (!file) return { url: null, path: null };
    const path = `inventario/${id}/foto.jpg`;
    const storageRef = ref(storage, path);
    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);
    return { url, path };
  };

  // ---------------------------
  // AGGIUNGI
  // ---------------------------
  const handleAdd = async () => {
    if (!descrizione.trim() || !quantita.trim()) {
      alert("Inserisci descrizione e quantità.");
      return;
    }

    const q = Number(quantita.replace(",", "."));
    if (Number.isNaN(q) || q <= 0) {
      alert("Quantità non valida.");
      return;
    }

    const id = generateId();
    const foto = await uploadFoto(id, fotoFile);

    const nuovo: InventarioItem = {
      id,
      descrizione: descrizione.trim(),
      quantita: q,
      unita,
      fornitore: fornitore.trim() || null,
      fotoUrl: foto.url,
      fotoStoragePath: foto.path,
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

  // ---------------------------
  // QUANTITÀ +/-
  // ---------------------------
  const changeQty = async (id: string, delta: number) => {
    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: Math.max(0, i.quantita + delta) } : i
    );
    await persist(nuovi);
  };

  const inputQty = async (id: string, value: string) => {
    const num = Number(value.replace(",", "."));
    if (Number.isNaN(num) || num < 0) return;

    const nuovi = inventario.map((i) =>
      i.id === id ? { ...i, quantita: num } : i
    );
    await persist(nuovi);
  };

  // ---------------------------
  // ELIMINA
  // ---------------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare materiale?")) return;
    await persist(inventario.filter((i) => i.id !== id));
  };

  // ---------------------------
  // SALVA MODIFICA (UNICA AGGIUNTA)
  // ---------------------------
  const handleSaveEdit = async () => {
    if (!editItem) return;

    const q = Number(editItem.quantita);
    if (Number.isNaN(q) || q < 0) {
      alert("Quantità non valida.");
      return;
    }

    let fotoUrl = editItem.fotoUrl;
    let fotoStoragePath = editItem.fotoStoragePath;

    if (editFotoFile) {
      const uploaded = await uploadFoto(editItem.id, editFotoFile);
      fotoUrl = uploaded.url;
      fotoStoragePath = uploaded.path;
    }

    const nuovi = inventario.map((i) =>
      i.id === editItem.id
        ? {
            ...i,
            descrizione: editItem.descrizione,
            quantita: Number(editItem.quantita),
            unita: editItem.unita,
            fornitore: editItem.fornitore || null,
            fotoUrl,
            fotoStoragePath,
          }
        : i
    );

    await persist(nuovi);
    setEditItem(null);
    setEditFotoFile(null);
  };

  // ---------------------------
  // PDF
  // ---------------------------
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

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="inventario-page">
      <div className="inventario-card">
        {/* HEADER */}
        <div className="inventario-header">
          <div className="inventario-logo-title">
            <img
              src="/logo.png"
              className="inventario-logo"
              onClick={() => navigate("/")}
            />
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
            />
          </label>

          <label className="inventario-label">
            Fornitore
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

          <label className="inventario-label">
            Foto
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
            />
          </label>

          {fotoFile && (
            <div className="inventario-preview">
              <img
                src={URL.createObjectURL(fotoFile)}
                className="inventario-thumb"
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
                          {" — "}
                          {item.fornitore}
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

                    {/* AGGIUNTA MODIFICA */}
                    <button
                      className="inventario-edit-button"
                      onClick={() => {
                        setEditItem({ ...item });
                        setEditFotoFile(null);
                      }}
                    >
                      Modifica
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODALE MODIFICA — UNICA AGGIUNTA */}
        {editItem && (
          <div className="inventario-edit-modal">
            <div className="inventario-edit-box">
              <h3>Modifica materiale</h3>

              <label className="inventario-label">
                Descrizione
                <input
                  className="inventario-input"
                  value={editItem.descrizione}
                  onChange={(e) =>
                    setEditItem({ ...editItem, descrizione: e.target.value })
                  }
                />
              </label>

              <label className="inventario-label">
                Fornitore
                <input
                  className="inventario-input"
                  value={editItem.fornitore || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, fornitore: e.target.value })
                  }
                />
              </label>

              <label className="inventario-label">
                Quantità
                <input
                  className="inventario-input"
                  type="number"
                  value={editItem.quantita}
             onChange={(e) =>
  setEditItem({ 
    ...editItem, 
    quantita: Number(e.target.value) 
  })
}

                />
              </label>

              <label className="inventario-label">
                Unità
                <select
                  className="inventario-input"
                  value={editItem.unita}
                  onChange={(e) =>
                    setEditItem({ ...editItem, unita: e.target.value })
                  }
                >
                  <option value="pz">pz</option>
                  <option value="mt">mt</option>
                  <option value="kg">kg</option>
                  <option value="lt">lt</option>
                </select>
              </label>

              {/* NUOVA FOTO */}
              <label className="inventario-label">
                Nuova foto (opzionale)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditFotoFile(e.target.files?.[0] || null)
                  }
                />
              </label>

              <div className="inventario-edit-actions">
                <button
                  className="inventario-edit-cancel"
                  onClick={() => setEditItem(null)}
                >
                  Annulla
                </button>

                <button
                  className="inventario-edit-save"
                  onClick={handleSaveEdit}
                >
                  Salva modifiche
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventario;
