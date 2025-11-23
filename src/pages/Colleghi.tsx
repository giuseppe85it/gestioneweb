// src/pages/Colleghi.tsx

import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Colleghi.css";

interface Collega {
  id: string;
  nome: string;
  telefono?: string;
  badge?: string;
  codice?: string;
  descrizione?: string;
}

const COLLEGHI_DOC_ID = "@colleghi";

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const Colleghi: React.FC = () => {
  const [colleghi, setColleghi] = useState<Collega[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [badge, setBadge] = useState("");
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");

  const [editId, setEditId] = useState<string | null>(null);

  // ---------------------------------------------------
  // Caricamento colleghi da Firestore
  // ---------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const ref = doc(collection(db, "storage"), COLLEGHI_DOC_ID);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const raw = (snap.data().value || []) as any[];

          const conv: Collega[] = raw.map((c) => ({
            id: c.id || generaId(),
            nome: (c.nome || "").toString(),
            telefono: c.telefono || "",
            badge: c.badge || "",
            codice: c.codice || "",
            descrizione: c.descrizione || "",
          }));

          setColleghi(conv);
        } else {
          setColleghi([]);
        }
      } catch (err) {
        console.error("Errore caricamento colleghi:", err);
        setError("Errore durante il caricamento dei colleghi.");
      }
    };

    void load();
  }, []);

  const salvaSuFirestore = async (lista: Collega[]) => {
    const ref = doc(collection(db, "storage"), COLLEGHI_DOC_ID);
    await setDoc(ref, { value: lista }, { merge: true });
    setColleghi(lista);
  };

  const resetForm = () => {
    setNome("");
    setTelefono("");
    setBadge("");
    setCodice("");
    setDescrizione("");
    setEditId(null);
  };

  // ---------------------------------------------------
  // Aggiungi / Modifica collega
  // ---------------------------------------------------
  const handleSubmit = async () => {
    const nomeTrim = nome.trim();
    if (!nomeTrim) return;

    setLoading(true);
    try {
      const lista = [...colleghi];

      if (!editId) {
        const nuovo: Collega = {
          id: generaId(),
          nome: nomeTrim.toUpperCase(),
          telefono: telefono.trim() || "",
          badge: badge.trim() || "",
          codice: codice.trim() || "",
          descrizione: descrizione.trim(),
        };
        lista.push(nuovo);
        await salvaSuFirestore(lista);
      } else {
        const aggiornato = lista.map((c) =>
          c.id === editId
            ? {
                ...c,
                nome: nomeTrim.toUpperCase(),
                telefono: telefono.trim() || "",
                badge: badge.trim() || "",
                codice: codice.trim() || "",
                descrizione: descrizione.trim(),
              }
            : c
        );
        await salvaSuFirestore(aggiornato);
      }

      resetForm();
    } catch (err) {
      console.error("Errore salvataggio collega:", err);
      setError("Errore durante il salvataggio del collega.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: Collega) => {
    setEditId(c.id);
    setNome(c.nome || "");
    setTelefono(c.telefono || "");
    setBadge(c.badge || "");
    setCodice(c.codice || "");
    setDescrizione(c.descrizione || "");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questo collega?")) return;

    setLoading(true);
    try {
      const nuovaLista = colleghi.filter((c) => c.id !== id);
      await salvaSuFirestore(nuovaLista);
      if (editId === id) resetForm();
    } catch (err) {
      console.error("Errore eliminazione collega:", err);
      setError("Errore durante l'eliminazione del collega.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // PDF singolo collega
  // ---------------------------------------------------
  const esportaPDF = async (collega: Collega) => {
    const row = {
      nome: collega.nome,
      telefono: collega.telefono || "",
      badge: collega.badge || "",
      codice: collega.codice || "",
      descrizione: collega.descrizione || "",
    };

    await generateSmartPDF({
      kind: "table",
      title: `Collega – ${collega.nome}`,
      columns: ["nome", "telefono", "badge", "codice", "descrizione"],
      rows: [row],
    });
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="coll-page">
      <div className="coll-card">
        <header className="coll-header">
          <div className="coll-header-left">
            <img src="/logo.png" className="coll-logo" alt="logo" />
            <h1 className="coll-title">Colleghi</h1>
          </div>
        </header>

        {error && <div className="coll-error">{error}</div>}

        {/* FORM */}
        <div className="coll-form">
          <div className="coll-field">
            <label>Nome collega</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="NOME"
            />
          </div>

          <div className="coll-grid">
            <div className="coll-field">
              <label>Telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Telefono"
              />
            </div>
            <div className="coll-field">
              <label>Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Badge"
              />
            </div>
            <div className="coll-field">
              <label>Codice</label>
              <input
                type="text"
                value={codice}
                onChange={(e) => setCodice(e.target.value)}
                placeholder="Codice"
              />
            </div>
          </div>

          <div className="coll-field">
            <label>Descrizione / Note</label>
            <textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              rows={2}
              placeholder="Note aggiuntive"
            />
          </div>

          <div className="coll-actions">
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !nome.trim()}
            >
              {editId ? "SALVA MODIFICHE" : "AGGIUNGI COLLEGA"}
            </button>
            {editId && (
              <button className="btn-secondary" onClick={resetForm}>
                ANNULLA
              </button>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className="coll-list">
          <div className="coll-list-header">
            <span>Colleghi</span>
            <span>{colleghi.length}</span>
          </div>

          {colleghi.length === 0 ? (
            <div className="coll-empty">Nessun collega inserito.</div>
          ) : (
            <div className="coll-list-scroll">
              {colleghi.map((c) => (
                <div key={c.id} className="coll-item">
                  <div className="coll-item-main">
                    <div className="coll-item-name">{c.nome}</div>
                    <div className="coll-item-line">
                      {c.telefono && (
                        <span className="coll-tag">
                          Tel: <strong>{c.telefono}</strong>
                        </span>
                      )}
                      {c.badge && (
                        <span className="coll-tag">
                          Badge: <strong>{c.badge}</strong>
                        </span>
                      )}
                      {c.codice && (
                        <span className="coll-tag">
                          Codice: <strong>{c.codice}</strong>
                        </span>
                      )}
                    </div>
                    {c.descrizione && (
                      <div className="coll-item-desc">{c.descrizione}</div>
                    )}
                  </div>

                  <div className="coll-item-actions">
                    <button className="btn-secondary" onClick={() => handleEdit(c)}>
                      Modifica
                    </button>
                    <button className="btn-secondary" onClick={() => esportaPDF(c)}>
                      PDF
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(c.id)}
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

export default Colleghi;
