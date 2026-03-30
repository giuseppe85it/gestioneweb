import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateSmartPDF } from "../utils/pdfEngine";
import "../pages/Fornitori.css";
import {
  readNextFornitoriSnapshot,
  type NextFornitoreReadOnlyItem,
} from "./domain/nextFornitoriDomain";
import {
  markNextFornitoreCloneDeleted,
  upsertNextFornitoreCloneRecord,
} from "./nextAnagraficheCloneState";

type Fornitore = {
  id: string;
  nome: string;
  telefono?: string;
  badge?: string;
  codice?: string;
  descrizione?: string;
};

function mapFornitore(item: NextFornitoreReadOnlyItem): Fornitore {
  return {
    id: item.id,
    nome: item.nome,
    telefono: item.telefono ?? "",
    badge: item.badge ?? "",
    codice: item.codice ?? "",
    descrizione: item.descrizione ?? "",
  };
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Errore durante il caricamento dei fornitori.";
}

export default function NextFornitoriPage() {
  const navigate = useNavigate();
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [badge, setBadge] = useState("");
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextFornitoriSnapshot();
        if (cancelled) return;
        setFornitori(snapshot.items.map(mapFornitore));
      } catch (loadError: unknown) {
        if (cancelled) return;
        console.error("Errore caricamento fornitori clone:", loadError);
        setError(readErrorMessage(loadError));
        setFornitori([]);
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

  const resetForm = () => {
    setNome("");
    setTelefono("");
    setBadge("");
    setCodice("");
    setDescrizione("");
    setEditId(null);
  };

  const handleSubmit = () => {
    const normalizedName = nome.trim().toUpperCase();
    if (!normalizedName) return;

    const targetId = editId ?? `next-fornitore:${Date.now()}`;
    const nextFornitore: Fornitore = {
      id: targetId,
      nome: normalizedName,
      telefono: telefono.trim() || "",
      badge: badge.trim() || "",
      codice: codice.trim() || "",
      descrizione: descrizione.trim() || "",
    };

    upsertNextFornitoreCloneRecord({
      id: targetId,
      nome: nextFornitore.nome,
      telefono: nextFornitore.telefono || null,
      badge: nextFornitore.badge || null,
      codice: nextFornitore.codice || null,
      descrizione: nextFornitore.descrizione || null,
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });

    setFornitori((current) => {
      const next = current.filter((entry) => entry.id !== targetId);
      return [...next, nextFornitore].sort((left, right) =>
        left.nome.localeCompare(right.nome, "it", { sensitivity: "base" }),
      );
    });
    setNotice(editId ? "Fornitore aggiornato nel clone NEXT." : "Fornitore aggiunto nel clone NEXT.");
    resetForm();
  };

  const handleEdit = (fornitore: Fornitore) => {
    setEditId(fornitore.id);
    setNome(fornitore.nome || "");
    setTelefono(fornitore.telefono || "");
    setBadge(fornitore.badge || "");
    setCodice(fornitore.codice || "");
    setDescrizione(fornitore.descrizione || "");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Eliminare questo fornitore?")) return;
    if (editId === id) {
      resetForm();
    }
    markNextFornitoreCloneDeleted(id);
    setFornitori((current) => current.filter((entry) => entry.id !== id));
    setNotice("Fornitore eliminato dal clone NEXT.");
  };

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
      title: `Fornitore - ${fornitore.nome}`,
      columns: ["nome", "telefono", "badge", "codice", "descrizione"],
      rows: [row],
    });
  };

  return (
    <div className="forn-page">
      <div className="forn-card">
        <header className="forn-header">
          <div className="forn-header-left">
            <img
              src="/logo.png"
              className="forn-logo"
              alt="logo"
              onClick={() => navigate("/next")}
            />
            <h1 className="forn-title">Fornitori</h1>
          </div>
        </header>

        {error && <div className="forn-error">{error}</div>}
        {notice ? (
          <div className="forn-error" style={{ background: "#ecfccb", color: "#365314" }}>
            {notice}
          </div>
        ) : null}

        <div className="forn-form">
          <div className="forn-field">
            <label>Nome fornitore</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="NOME"
            />
          </div>

          <div className="forn-grid">
            <div className="forn-field">
              <label>Telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Telefono"
              />
            </div>
            <div className="forn-field">
              <label>Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                placeholder="Badge"
              />
            </div>
            <div className="forn-field">
              <label>Codice</label>
              <input
                type="text"
                value={codice}
                onChange={(event) => setCodice(event.target.value)}
                placeholder="Codice"
              />
            </div>
          </div>

          <div className="forn-field">
            <label>Descrizione / Note</label>
            <textarea
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              rows={2}
              placeholder="Note aggiuntive"
            />
          </div>

          <div className="forn-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={!nome.trim()}>
              {editId ? "SALVA MODIFICHE" : "AGGIUNGI FORNITORE"}
            </button>
            {editId && (
              <button className="btn-secondary" onClick={resetForm}>
                ANNULLA
              </button>
            )}
          </div>
        </div>

        <div className="forn-list">
          <div className="forn-list-header">
            <span>Fornitori</span>
            <span>{fornitori.length}</span>
          </div>

          {loading ? (
            <div className="forn-empty">Caricamento fornitori...</div>
          ) : fornitori.length === 0 ? (
            <div className="forn-empty">Nessun fornitore inserito.</div>
          ) : (
            <div className="forn-list-scroll">
              {fornitori.map((fornitore) => (
                <div key={fornitore.id} className="forn-item">
                  <div className="forn-item-main">
                    <div className="forn-item-name">{fornitore.nome}</div>
                    <div className="forn-item-line">
                      {fornitore.telefono && (
                        <span className="forn-tag">
                          Tel: <strong>{fornitore.telefono}</strong>
                        </span>
                      )}
                      {fornitore.badge && (
                        <span className="forn-tag">
                          Badge: <strong>{fornitore.badge}</strong>
                        </span>
                      )}
                      {fornitore.codice && (
                        <span className="forn-tag">
                          Codice: <strong>{fornitore.codice}</strong>
                        </span>
                      )}
                    </div>
                    {fornitore.descrizione && (
                      <div className="forn-item-desc">{fornitore.descrizione}</div>
                    )}
                  </div>

                  <div className="forn-item-actions">
                    <button className="btn-secondary" onClick={() => handleEdit(fornitore)}>
                      Modifica
                    </button>
                    <button className="btn-secondary" onClick={() => void esportaPDF(fornitore)}>
                      PDF
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(fornitore.id)}>
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
}
