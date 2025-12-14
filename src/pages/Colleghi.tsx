// src/pages/Colleghi.tsx

import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Colleghi.css";

interface SchedaCarburante {
  id: string;
  nomeCarta: string;
  pinCarta: string;
}

interface Collega {
  id: string;
  nome: string;
  telefono?: string;
  telefonoPrivato?: string;
  badge?: string;
  codice?: string;
  descrizione?: string;
  pinSim?: string;
  pukSim?: string;
  schedeCarburante?: SchedaCarburante[];
}

const COLLEGHI_DOC_ID = "@colleghi";

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const Colleghi: React.FC = () => {
  const [colleghi, setColleghi] = useState<Collega[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefonoPrivato, setTelefonoPrivato] = useState("");
  const [pinSim, setPinSim] = useState("");
  const [pukSim, setPukSim] = useState("");
  const [badge, setBadge] = useState("");
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");

  const [schedeCarburante, setSchedeCarburante] = useState<SchedaCarburante[]>(
    []
  );

  const [editId, setEditId] = useState<string | null>(null);

  // Modale dettagli
  const [selectedCollega, setSelectedCollega] = useState<Collega | null>(null);

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
            telefonoPrivato: c.telefonoPrivato || "",
            badge: c.badge || "",
            codice: c.codice || "",
            descrizione: c.descrizione || "",
            pinSim: c.pinSim || "",
            pukSim: c.pukSim || "",
            schedeCarburante: Array.isArray(c.schedeCarburante)
              ? c.schedeCarburante.map((s: any) => ({
                  id: s.id || generaId(),
                  nomeCarta: s.nomeCarta || "",
                  pinCarta: s.pinCarta || "",
                }))
              : [],
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
    setTelefonoPrivato("");
    setPinSim("");
    setPukSim("");
    setBadge("");
    setCodice("");
    setDescrizione("");
    setSchedeCarburante([]);
    setEditId(null);
  };

  // ---------------------------------------------------
  // Gestione schede carburante dinamiche
  // ---------------------------------------------------
  const handleAddScheda = () => {
    setSchedeCarburante((prev) => [
      ...prev,
      {
        id: generaId(),
        nomeCarta: "",
        pinCarta: "",
      },
    ]);
  };

  const handleChangeScheda = (
    id: string,
    field: "nomeCarta" | "pinCarta",
    value: string
  ) => {
    setSchedeCarburante((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]: value,
            }
          : s
      )
    );
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

      const cleanedSchede = schedeCarburante.map((s) => ({
        ...s,
        nomeCarta: s.nomeCarta.trim(),
        pinCarta: s.pinCarta.trim(),
      }));

      if (!editId) {
        const nuovo: Collega = {
          id: generaId(),
          nome: nomeTrim.toUpperCase(),
          telefono: telefono.trim() || "",
          telefonoPrivato: telefonoPrivato.trim() || "",
          badge: badge.trim() || "",
          codice: codice.trim() || "",
          descrizione: descrizione.trim(),
          pinSim: pinSim.trim() || "",
          pukSim: pukSim.trim() || "",
          schedeCarburante: cleanedSchede,
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
                telefonoPrivato: telefonoPrivato.trim() || "",
                badge: badge.trim() || "",
                codice: codice.trim() || "",
                descrizione: descrizione.trim(),
                pinSim: pinSim.trim() || "",
                pukSim: pukSim.trim() || "",
                schedeCarburante: cleanedSchede,
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
    setTelefonoPrivato(c.telefonoPrivato || "");
    setBadge(c.badge || "");
    setCodice(c.codice || "");
    setDescrizione(c.descrizione || "");
    setPinSim(c.pinSim || "");
    setPukSim(c.pukSim || "");
    setSchedeCarburante(c.schedeCarburante || []);
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
  // PDF singolo collega (mantengo come prima)
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
  // Modale dettagli
  // ---------------------------------------------------
  const openDettagli = (collega: Collega) => {
    setSelectedCollega(collega);
  };

  const closeDettagli = () => {
    setSelectedCollega(null);
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

          {/* Telefono + Badge + Codice (come prima) */}
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

          {/* Telefono privato */}
          <div className="coll-field">
            <label>Telefono privato</label>
            <input
              type="tel"
              value={telefonoPrivato}
              onChange={(e) => setTelefonoPrivato(e.target.value)}
              placeholder="Numero privato"
            />
          </div>

          {/* PIN SIM + PUK SIM */}
          <div className="coll-grid-2">
            <div className="coll-field">
              <label>PIN SIM</label>
              <input
                type="text"
                value={pinSim}
                onChange={(e) => setPinSim(e.target.value)}
                placeholder="PIN SIM"
              />
            </div>
            <div className="coll-field">
              <label>PUK SIM</label>
              <input
                type="text"
                value={pukSim}
                onChange={(e) => setPukSim(e.target.value)}
                placeholder="PUK SIM"
              />
            </div>
          </div>

          {/* Schede carburante */}
          <div className="coll-field">
            <label>Schede carburante</label>
          </div>
          <div className="coll-fuel-list">
            {schedeCarburante.map((s) => (
              <div key={s.id} className="coll-fuel-card">
                <div className="coll-field">
                  <label>Nome carta</label>
                  <input
                    type="text"
                    value={s.nomeCarta}
                    onChange={(e) =>
                      handleChangeScheda(s.id, "nomeCarta", e.target.value)
                    }
                    placeholder="Es. CARTA X, CARTA Y"
                  />
                </div>
                <div className="coll-field coll-fuel-pin">
                  <label>PIN carta</label>
                  <input
                    type="text"
                    value={s.pinCarta}
                    onChange={(e) =>
                      handleChangeScheda(s.id, "pinCarta", e.target.value)
                    }
                    placeholder="PIN"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="coll-btn-add-fuel"
              onClick={handleAddScheda}
            >
              + Aggiungi scheda carburante
            </button>
          </div>

          {/* Note */}
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
                <div
                  key={c.id}
                  className="coll-item"
                  onClick={() => openDettagli(c)}
                >
                  <div className="coll-item-main">
                    <div className="coll-item-name">{c.nome}</div>
                    <div className="coll-item-line">
                      {c.telefono && (
                        <span className="coll-tag">
                          Tel: <strong>{c.telefono}</strong>
                        </span>
                      )}
                      {c.telefonoPrivato && (
                        <span className="coll-tag">
                          Privato: <strong>{c.telefonoPrivato}</strong>
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
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(c);
                      }}
                    >
                      Modifica
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        esportaPDF(c);
                      }}
                    >
                      PDF
                    </button>
                    <button
                      className="btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
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

{/* MODALE DETTAGLI COLLEGA */}
{selectedCollega && (
  <div className="modal-overlay" onClick={closeDettagli}>
    <div
      className="modal-container"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="modal-header">
        <img src="/logo.png" alt="logo" className="modal-logo" />
        <h2 className="modal-title">Dettagli collega</h2>
      </div>

      {/* CONTENUTO */}
      <div className="modal-content">

        <div className="modal-card">
          {/* Nome */}
          <div className="modal-section">
            <label>Nome</label>
            <p>{selectedCollega.nome}</p>
          </div>

          {/* Telefono aziendale */}
          {selectedCollega.telefono && (
            <div className="modal-section">
              <label>Telefono aziendale</label>
              <p>{selectedCollega.telefono}</p>
            </div>
          )}

          {/* Telefono privato */}
          {selectedCollega.telefonoPrivato && (
            <div className="modal-section">
              <label>Telefono privato</label>
              <p>{selectedCollega.telefonoPrivato}</p>
            </div>
          )}

          {/* PIN SIM */}
          {selectedCollega.pinSim && (
            <div className="modal-section">
              <label>PIN SIM</label>
              <p>{selectedCollega.pinSim}</p>
            </div>
          )}

          {/* PUK SIM */}
          {selectedCollega.pukSim && (
            <div className="modal-section">
              <label>PUK SIM</label>
              <p>{selectedCollega.pukSim}</p>
            </div>
          )}

          {/* Badge */}
          {selectedCollega.badge && (
            <div className="modal-section">
              <label>Badge</label>
              <p>{selectedCollega.badge}</p>
            </div>
          )}

          {/* Codice */}
          {selectedCollega.codice && (
            <div className="modal-section">
              <label>Codice</label>
              <p>{selectedCollega.codice}</p>
            </div>
          )}

          {/* Note */}
          {selectedCollega.descrizione && (
            <div className="modal-section">
              <label>Note</label>
              <p>{selectedCollega.descrizione}</p>
            </div>
          )}

          {/* Schede carburante */}
          {selectedCollega.schedeCarburante &&
            selectedCollega.schedeCarburante.length > 0 && (
              <>
                <h3 className="modal-subtitle">Schede carburante</h3>

                {selectedCollega.schedeCarburante.map((sc, idx) => (
                  <div key={idx} className="modal-section fuel-card">
                    <label>Scheda {idx + 1}</label>
                    <p><strong>Carta:</strong> {sc.nomeCarta || "-"}</p>
                    <p><strong>PIN:</strong> {sc.pinCarta || "-"}</p>
                  </div>
                ))}
              </>
            )}
        </div>
      </div>

      {/* FOOTER */}
      <button
        className="modal-close-btn"
        onClick={closeDettagli}
      >
        CHIUDI
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default Colleghi;

