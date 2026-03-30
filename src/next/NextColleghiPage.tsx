import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateSmartPDF } from "../utils/pdfEngine";
import "../pages/Colleghi.css";
import {
  readNextColleghiSnapshot,
  type NextCollegaReadOnlyItem,
} from "./domain/nextColleghiDomain";
import {
  markNextCollegaCloneDeleted,
  upsertNextCollegaCloneRecord,
} from "./nextAnagraficheCloneState";

type SchedaCarburante = {
  id: string;
  nomeCarta: string;
  pinCarta: string;
};

type Collega = {
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
};

function mapCollega(item: NextCollegaReadOnlyItem): Collega {
  return {
    id: item.id,
    nome: item.nome,
    telefono: item.telefono ?? "",
    telefonoPrivato: item.telefonoPrivato ?? "",
    badge: item.badge ?? "",
    codice: item.codice ?? "",
    descrizione: item.descrizione ?? "",
    pinSim: item.pinSim ?? "",
    pukSim: item.pukSim ?? "",
    schedeCarburante: item.schedeCarburante.map((scheda) => ({
      id: scheda.id,
      nomeCarta: scheda.nomeCarta ?? "",
      pinCarta: scheda.pinCarta ?? "",
    })),
  };
}

function createSchedaId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Errore durante il caricamento dei colleghi.";
}

export default function NextColleghiPage() {
  const navigate = useNavigate();
  const [colleghi, setColleghi] = useState<Collega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefonoPrivato, setTelefonoPrivato] = useState("");
  const [pinSim, setPinSim] = useState("");
  const [pukSim, setPukSim] = useState("");
  const [badge, setBadge] = useState("");
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [schedeCarburante, setSchedeCarburante] = useState<SchedaCarburante[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedCollega, setSelectedCollega] = useState<Collega | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextColleghiSnapshot();
        if (cancelled) return;
        setColleghi(snapshot.items.map(mapCollega));
      } catch (loadError: unknown) {
        if (cancelled) return;
        console.error("Errore caricamento colleghi clone:", loadError);
        setError(readErrorMessage(loadError));
        setColleghi([]);
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
    setTelefonoPrivato("");
    setPinSim("");
    setPukSim("");
    setBadge("");
    setCodice("");
    setDescrizione("");
    setSchedeCarburante([]);
    setEditId(null);
  };

  const handleAddScheda = () => {
    setSchedeCarburante((current) => [
      ...current,
      { id: createSchedaId(), nomeCarta: "", pinCarta: "" },
    ]);
  };

  const handleChangeScheda = (
    id: string,
    field: "nomeCarta" | "pinCarta",
    value: string
  ) => {
    setSchedeCarburante((current) =>
      current.map((scheda) =>
        scheda.id === id
          ? {
              ...scheda,
              [field]: value,
            }
          : scheda
      )
    );
  };

  const handleSubmit = () => {
    const normalizedName = nome.trim().toUpperCase();
    if (!normalizedName) return;

    const targetId = editId ?? `next-collega:${Date.now()}`;
    const nextCollega: Collega = {
      id: targetId,
      nome: normalizedName,
      telefono: telefono.trim() || "",
      telefonoPrivato: telefonoPrivato.trim() || "",
      badge: badge.trim() || "",
      codice: codice.trim() || "",
      descrizione: descrizione.trim() || "",
      pinSim: pinSim.trim() || "",
      pukSim: pukSim.trim() || "",
      schedeCarburante: schedeCarburante.map((entry) => ({
        id: entry.id,
        nomeCarta: entry.nomeCarta.trim(),
        pinCarta: entry.pinCarta.trim(),
      })),
    };

    upsertNextCollegaCloneRecord({
      id: targetId,
      nome: nextCollega.nome,
      telefono: nextCollega.telefono || null,
      telefonoPrivato: nextCollega.telefonoPrivato || null,
      badge: nextCollega.badge || null,
      codice: nextCollega.codice || null,
      descrizione: nextCollega.descrizione || null,
      pinSim: nextCollega.pinSim || null,
      pukSim: nextCollega.pukSim || null,
      schedeCarburante: nextCollega.schedeCarburante ?? [],
      __nextCloneOnly: true,
      __nextCloneSavedAt: Date.now(),
    });

    setColleghi((current) => {
      const next = current.filter((entry) => entry.id !== targetId);
      return [...next, nextCollega].sort((left, right) =>
        left.nome.localeCompare(right.nome, "it", { sensitivity: "base" }),
      );
    });
    setNotice(editId ? "Collega aggiornato nel clone NEXT." : "Collega aggiunto nel clone NEXT.");
    resetForm();
  };

  const handleEdit = (collega: Collega) => {
    setEditId(collega.id);
    setNome(collega.nome || "");
    setTelefono(collega.telefono || "");
    setTelefonoPrivato(collega.telefonoPrivato || "");
    setBadge(collega.badge || "");
    setCodice(collega.codice || "");
    setDescrizione(collega.descrizione || "");
    setPinSim(collega.pinSim || "");
    setPukSim(collega.pukSim || "");
    setSchedeCarburante(collega.schedeCarburante || []);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Eliminare questo collega?")) return;
    if (editId === id) {
      resetForm();
    }
    markNextCollegaCloneDeleted(id);
    setColleghi((current) => current.filter((entry) => entry.id !== id));
    if (selectedCollega?.id === id) {
      setSelectedCollega(null);
    }
    setNotice("Collega eliminato dal clone NEXT.");
  };

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
      title: `Collega - ${collega.nome}`,
      columns: ["nome", "telefono", "badge", "codice", "descrizione"],
      rows: [row],
    });
  };

  return (
    <div className="coll-page">
      <div className="coll-card">
        <header className="coll-header">
          <div className="coll-header-left">
            <img
              src="/logo.png"
              className="coll-logo"
              alt="logo"
              onClick={() => navigate("/next")}
            />
            <h1 className="coll-title">Colleghi</h1>
          </div>
        </header>

        {error && <div className="coll-error">{error}</div>}
        {notice ? (
          <div className="coll-error" style={{ background: "#ecfccb", color: "#365314" }}>
            {notice}
          </div>
        ) : null}

        <div className="coll-form">
          <div className="coll-field">
            <label>Nome collega</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="NOME"
            />
          </div>

          <div className="coll-grid">
            <div className="coll-field">
              <label>Telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Telefono"
              />
            </div>
            <div className="coll-field">
              <label>Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                placeholder="Badge"
              />
            </div>
            <div className="coll-field">
              <label>Codice</label>
              <input
                type="text"
                value={codice}
                onChange={(event) => setCodice(event.target.value)}
                placeholder="Codice"
              />
            </div>
          </div>

          <div className="coll-field">
            <label>Telefono privato</label>
            <input
              type="tel"
              value={telefonoPrivato}
              onChange={(event) => setTelefonoPrivato(event.target.value)}
              placeholder="Numero privato"
            />
          </div>

          <div className="coll-grid-2">
            <div className="coll-field">
              <label>PIN SIM</label>
              <input
                type="text"
                value={pinSim}
                onChange={(event) => setPinSim(event.target.value)}
                placeholder="PIN SIM"
              />
            </div>
            <div className="coll-field">
              <label>PUK SIM</label>
              <input
                type="text"
                value={pukSim}
                onChange={(event) => setPukSim(event.target.value)}
                placeholder="PUK SIM"
              />
            </div>
          </div>

          <div className="coll-field">
            <label>Schede carburante</label>
          </div>
          <div className="coll-fuel-list">
            {schedeCarburante.map((scheda) => (
              <div key={scheda.id} className="coll-fuel-card">
                <div className="coll-field">
                  <label>Nome carta</label>
                  <input
                    type="text"
                    value={scheda.nomeCarta}
                    onChange={(event) =>
                      handleChangeScheda(scheda.id, "nomeCarta", event.target.value)
                    }
                    placeholder="Es. CARTA X, CARTA Y"
                  />
                </div>
                <div className="coll-field coll-fuel-pin">
                  <label>PIN carta</label>
                  <input
                    type="text"
                    value={scheda.pinCarta}
                    onChange={(event) =>
                      handleChangeScheda(scheda.id, "pinCarta", event.target.value)
                    }
                    placeholder="PIN"
                  />
                </div>
              </div>
            ))}

            <button type="button" className="coll-btn-add-fuel" onClick={handleAddScheda}>
              + Aggiungi scheda carburante
            </button>
          </div>

          <div className="coll-field">
            <label>Descrizione / Note</label>
            <textarea
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              rows={2}
              placeholder="Note aggiuntive"
            />
          </div>

          <div className="coll-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={!nome.trim()}>
              {editId ? "SALVA MODIFICHE" : "AGGIUNGI COLLEGA"}
            </button>
            {editId && (
              <button className="btn-secondary" onClick={resetForm}>
                ANNULLA
              </button>
            )}
          </div>
        </div>

        <div className="coll-list">
          <div className="coll-list-header">
            <span>Colleghi</span>
            <span>{colleghi.length}</span>
          </div>

          {loading ? (
            <div className="coll-empty">Caricamento colleghi...</div>
          ) : colleghi.length === 0 ? (
            <div className="coll-empty">Nessun collega inserito.</div>
          ) : (
            <div className="coll-list-scroll">
              {colleghi.map((collega) => (
                <div
                  key={collega.id}
                  className="coll-item"
                  onClick={() => setSelectedCollega(collega)}
                >
                  <div className="coll-item-main">
                    <div className="coll-item-name">{collega.nome}</div>
                    <div className="coll-item-line">
                      {collega.telefono && (
                        <span className="coll-tag">
                          Tel: <strong>{collega.telefono}</strong>
                        </span>
                      )}
                      {collega.telefonoPrivato && (
                        <span className="coll-tag">
                          Privato: <strong>{collega.telefonoPrivato}</strong>
                        </span>
                      )}
                      {collega.badge && (
                        <span className="coll-tag">
                          Badge: <strong>{collega.badge}</strong>
                        </span>
                      )}
                      {collega.codice && (
                        <span className="coll-tag">
                          Codice: <strong>{collega.codice}</strong>
                        </span>
                      )}
                    </div>
                    {collega.descrizione && (
                      <div className="coll-item-desc">{collega.descrizione}</div>
                    )}
                  </div>

                  <div className="coll-item-actions">
                    <button
                      className="btn-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(collega);
                      }}
                    >
                      Modifica
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        void esportaPDF(collega);
                      }}
                    >
                      PDF
                    </button>
                    <button
                      className="btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(collega.id);
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

      {selectedCollega && (
        <div className="modal-overlay" onClick={() => setSelectedCollega(null)}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <img
                src="/logo.png"
                alt="logo"
                className="modal-logo"
                onClick={() => navigate("/next")}
              />
              <h2 className="modal-title">Dettagli collega</h2>
            </div>

            <div className="modal-content">
              <div className="modal-card">
                <div className="modal-section">
                  <label>Nome</label>
                  <p>{selectedCollega.nome}</p>
                </div>

                {selectedCollega.telefono && (
                  <div className="modal-section">
                    <label>Telefono aziendale</label>
                    <p>{selectedCollega.telefono}</p>
                  </div>
                )}

                {selectedCollega.telefonoPrivato && (
                  <div className="modal-section">
                    <label>Telefono privato</label>
                    <p>{selectedCollega.telefonoPrivato}</p>
                  </div>
                )}

                {selectedCollega.pinSim && (
                  <div className="modal-section">
                    <label>PIN SIM</label>
                    <p>{selectedCollega.pinSim}</p>
                  </div>
                )}

                {selectedCollega.pukSim && (
                  <div className="modal-section">
                    <label>PUK SIM</label>
                    <p>{selectedCollega.pukSim}</p>
                  </div>
                )}

                {selectedCollega.badge && (
                  <div className="modal-section">
                    <label>Badge</label>
                    <p>{selectedCollega.badge}</p>
                  </div>
                )}

                {selectedCollega.codice && (
                  <div className="modal-section">
                    <label>Codice</label>
                    <p>{selectedCollega.codice}</p>
                  </div>
                )}

                {selectedCollega.descrizione && (
                  <div className="modal-section">
                    <label>Note</label>
                    <p>{selectedCollega.descrizione}</p>
                  </div>
                )}

                {selectedCollega.schedeCarburante &&
                  selectedCollega.schedeCarburante.length > 0 && (
                    <>
                      <h3 className="modal-subtitle">Schede carburante</h3>

                      {selectedCollega.schedeCarburante.map((scheda, index) => (
                        <div key={scheda.id} className="modal-section fuel-card">
                          <label>Scheda {index + 1}</label>
                          <p>
                            <strong>Carta:</strong> {scheda.nomeCarta || "-"}
                          </p>
                          <p>
                            <strong>PIN:</strong> {scheda.pinCarta || "-"}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
              </div>
            </div>

            <button className="modal-close-btn" onClick={() => setSelectedCollega(null)}>
              CHIUDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
