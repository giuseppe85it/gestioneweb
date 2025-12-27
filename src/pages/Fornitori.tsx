// src/pages/Fornitori.tsx

import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Fornitori.css";

interface Fornitore {
  id: string;
  nome: string;
  telefono?: string;
  badge?: string;
  codice?: string;
  descrizione?: string;
}

const FORNITORI_DOC_ID = "@fornitori";

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const Fornitori: React.FC = () => {
  const navigate = useNavigate();
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [badge, setBadge] = useState("");
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");

  const [editId, setEditId] = useState<string | null>(null);

  // ---------------------------------------------------
  // Caricamento fornitori da Firestore
  // ---------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const ref = doc(collection(db, "storage"), FORNITORI_DOC_ID);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const raw = (snap.data().value || []) as any[];

          const conv: Fornitore[] = raw.map((f) => ({
            id: f.id || generaId(),
            nome: (f.nome || f.ragioneSociale || "").toString(),
            telefono: f.telefono || "",
            badge: f.badge || "",
            codice: f.codice || "",
            descrizione: f.descrizione || "",
          }));

          setFornitori(conv);
        } else {
          setFornitori([]);
        }
      } catch (err) {
        console.error("Errore caricamento fornitori:", err);
        setError("Errore durante il caricamento dei fornitori.");
      }
    };

    void load();
  }, []);

  const salvaSuFirestore = async (lista: Fornitore[]) => {
    const ref = doc(collection(db, "storage"), FORNITORI_DOC_ID);
    await setDoc(ref, { value: lista }, { merge: true });
    setFornitori(lista);
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
  // Aggiungi / Modifica fornitore
  // ---------------------------------------------------
  const handleSubmit = async () => {
    const nomeTrim = nome.trim();
    if (!nomeTrim) return;

    setLoading(true);
    try {
      const lista = [...fornitori];

      if (!editId) {
        // nuovo fornitore
        const nuovo: Fornitore = {
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
        // modifica esistente
        const aggiornato = lista.map((f) =>
          f.id === editId
            ? {
                ...f,
                nome: nomeTrim.toUpperCase(),
                telefono: telefono.trim() || "",
                badge: badge.trim() || "",
                codice: codice.trim() || "",
                descrizione: descrizione.trim(),
              }
            : f
        );
        await salvaSuFirestore(aggiornato);
      }

      resetForm();
    } catch (err) {
      console.error("Errore salvataggio fornitore:", err);
      setError("Errore durante il salvataggio del fornitore.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: Fornitore) => {
    setEditId(f.id);
    setNome(f.nome || "");
    setTelefono(f.telefono || "");
    setBadge(f.badge || "");
    setCodice(f.codice || "");
    setDescrizione(f.descrizione || "");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questo fornitore?")) return;

    setLoading(true);
    try {
      const nuovaLista = fornitori.filter((f) => f.id !== id);
      await salvaSuFirestore(nuovaLista);
      if (editId === id) resetForm();
    } catch (err) {
      console.error("Errore eliminazione fornitore:", err);
      setError("Errore durante l'eliminazione del fornitore.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // PDF singolo fornitore
  // ---------------------------------------------------
  const esportaPDF = async (fornitore: Fornitore) => {
    const row = {
      nome: fornitore.nome,
      telefono: fornitore.telefono || "",
      badge: fornitore.badge || "",
      codice: fornitore.codice || "",
      descrizione: fornitore.descrizione || "",
    };

    await generateSmartPDF({
      kind: "table",
      title: `Fornitore – ${fornitore.nome}`,
      columns: ["nome", "telefono", "badge", "codice", "descrizione"],
      rows: [row],
    });
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="forn-page">
      <div className="forn-card">
        <header className="forn-header">
          <div className="forn-header-left">
            <img
              src="/logo.png"
              className="forn-logo"
              alt="logo"
              onClick={() => navigate("/")}
            />
            <h1 className="forn-title">Fornitori</h1>
          </div>
        </header>

        {error && <div className="forn-error">{error}</div>}

        {/* FORM */}
        <div className="forn-form">
          <div className="forn-field">
            <label>Nome fornitore</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="NOME"
            />
          </div>

          <div className="forn-grid">
            <div className="forn-field">
              <label>Telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Telefono"
              />
            </div>
            <div className="forn-field">
              <label>Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Badge"
              />
            </div>
            <div className="forn-field">
              <label>Codice</label>
              <input
                type="text"
                value={codice}
                onChange={(e) => setCodice(e.target.value)}
                placeholder="Codice"
              />
            </div>
          </div>

          <div className="forn-field">
            <label>Descrizione / Note</label>
            <textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              rows={2}
              placeholder="Note aggiuntive"
            />
          </div>

          <div className="forn-actions">
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !nome.trim()}
            >
              {editId ? "SALVA MODIFICHE" : "AGGIUNGI FORNITORE"}
            </button>
            {editId && (
              <button className="btn-secondary" onClick={resetForm}>
                ANNULLA
              </button>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className="forn-list">
          <div className="forn-list-header">
            <span>Fornitori</span>
            <span>{fornitori.length}</span>
          </div>

          {fornitori.length === 0 ? (
            <div className="forn-empty">Nessun fornitore inserito.</div>
          ) : (
            <div className="forn-list-scroll">
              {fornitori.map((f) => (
                <div key={f.id} className="forn-item">
                  <div className="forn-item-main">
                    <div className="forn-item-name">{f.nome}</div>
                    <div className="forn-item-line">
                      {f.telefono && (
                        <span className="forn-tag">
                          Tel: <strong>{f.telefono}</strong>
                        </span>
                      )}
                      {f.badge && (
                        <span className="forn-tag">
                          Badge: <strong>{f.badge}</strong>
                        </span>
                      )}
                      {f.codice && (
                        <span className="forn-tag">
                          Codice: <strong>{f.codice}</strong>
                        </span>
                      )}
                    </div>
                    {f.descrizione && (
                      <div className="forn-item-desc">{f.descrizione}</div>
                    )}
                  </div>

                  <div className="forn-item-actions">
                    <button className="btn-secondary" onClick={() => handleEdit(f)}>
                      Modifica
                    </button>
                    <button className="btn-secondary" onClick={() => esportaPDF(f)}>
                      PDF
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(f.id)}
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

export default Fornitori;
