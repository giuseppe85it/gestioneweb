import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateTablePDF } from "../utils/pdfEngine";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";
import "./AttrezzatureCantieri.css";

const KEY_ATTREZZATURE = "@attrezzature_cantieri";

const TIPI_MOVIMENTO = ["CONSEGNATO", "SPOSTATO", "RITIRATO"] as const;
type MovimentoTipo = (typeof TIPI_MOVIMENTO)[number];

const CATEGORIE = ["TUBI", "MATERIALI", "ALTRO"];
const UNITA_BASE = ["m", "pz", "kg", "set"];
const UNITA_OPZIONI = [...UNITA_BASE, "altro"];

type Movimento = {
  id: string;
  tipo: MovimentoTipo;
  data: string;
  materialeCategoria: string;
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereId: string;
  cantiereLabel: string;
  note: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sourceCantiereId?: string | null;
  sourceCantiereLabel?: string | null;
};

type MovimentoForm = {
  id?: string;
  tipo: MovimentoTipo;
  data: string;
  materialeCategoria: string;
  descrizione: string;
  quantita: string;
  unita: string;
  unitaAltro: string;
  cantiereId: string;
  cantiereLabel: string;
  note: string;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sourceCantiereId: string;
  sourceCantiereLabel: string;
};

function unwrapList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function oggi() {
  const n = new Date();
  const gg = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const yy = n.getFullYear();
  return `${gg} ${mm} ${yy}`;
}

function dataToNumber(d: string) {
  if (!d) return 0;
  const trimmed = d.trim();
  const parts = trimmed.split(" ");
  if (parts.length === 3) {
    const [gg, mm, yy] = parts;
    const parsed = Date.parse(`${yy}-${mm}-${gg}T00:00:00`);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseNumero(value: string) {
  const raw = value.replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function buildId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildInitialForm(): MovimentoForm {
  return {
    tipo: "CONSEGNATO",
    data: oggi(),
    materialeCategoria: "TUBI",
    descrizione: "",
    quantita: "",
    unita: "m",
    unitaAltro: "",
    cantiereId: "",
    cantiereLabel: "",
    note: "",
    fotoUrl: null,
    fotoStoragePath: null,
    sourceCantiereId: "",
    sourceCantiereLabel: "",
  };
}

function splitUnita(value: string) {
  if (!value) return { unita: "m", unitaAltro: "" };
  if (UNITA_BASE.includes(value)) return { unita: value, unitaAltro: "" };
  return { unita: "altro", unitaAltro: value };
}

function formatQuantita(value: number) {
  if (Number.isNaN(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "");
}

export default function AttrezzatureCantieri() {
  const navigate = useNavigate();

  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MovimentoForm>(() => buildInitialForm());
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<MovimentoForm | null>(null);
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);
  const [editFotoPreview, setEditFotoPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [filterTipo, setFilterTipo] = useState("tutti");
  const [filterCategoria, setFilterCategoria] = useState("tutte");
  const [showAllStato, setShowAllStato] = useState(false);
  const [showAllRegistro, setShowAllRegistro] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await getItemSync(KEY_ATTREZZATURE);
        setMovimenti(unwrapList(raw));
      } catch (err) {
        console.error("Errore caricamento attrezzature:", err);
        setError("Errore caricamento movimenti.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleFotoSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (v: string | null) => void,
    currentPreview: string | null
  ) => {
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
    if (!file) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(file);
    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
  };

  const resetForm = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setForm(buildInitialForm());
    setFotoFile(null);
    setFotoPreview(null);
    setError(null);
  };
  const handleSave = async () => {
    setError(null);

    const descrizione = form.descrizione.trim();
    if (!descrizione) {
      setError("Inserisci una descrizione.");
      return;
    }

    const quantita = parseNumero(form.quantita);
    if (!Number.isFinite(quantita) || quantita <= 0) {
      setError("Inserisci una quantita valida.");
      return;
    }

    const unitaFinale =
      form.unita === "altro" ? form.unitaAltro.trim() : form.unita;
    if (!unitaFinale) {
      setError("Inserisci una unita valida.");
      return;
    }

    const cantiereId = form.cantiereId.trim();
    const cantiereLabel = form.cantiereLabel.trim() || cantiereId;
    if (!cantiereLabel) {
      setError("Inserisci un cantiere valido.");
      return;
    }

    const id = buildId();
    const data = form.data.trim() || oggi();

    let fotoUrl: string | null = null;
    let fotoStoragePath: string | null = null;

    try {
      setSaving(true);
      if (fotoFile) {
        const uploaded = await uploadMaterialImage(fotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      }

      const record: Movimento = {
        id,
        tipo: form.tipo,
        data,
        materialeCategoria: form.materialeCategoria || "TUBI",
        descrizione,
        quantita,
        unita: unitaFinale,
        cantiereId,
        cantiereLabel,
        note: form.note.trim() || null,
        fotoUrl,
        fotoStoragePath,
        sourceCantiereId:
          form.tipo === "SPOSTATO"
            ? form.sourceCantiereId.trim() || null
            : null,
        sourceCantiereLabel:
          form.tipo === "SPOSTATO"
            ? form.sourceCantiereLabel.trim() || form.sourceCantiereId.trim() || null
            : null,
      };

      const next = [...movimenti, record];
      await setItemSync(KEY_ATTREZZATURE, next);
      setMovimenti(next);
      resetForm();
    } catch (err) {
      console.error("Errore salvataggio movimento:", err);
      setError("Errore salvataggio movimento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: Movimento) => {
    if (!window.confirm("Eliminare questo movimento?")) return;

    try {
      const next = movimenti.filter((m) => m.id !== record.id);
      await setItemSync(KEY_ATTREZZATURE, next);
      setMovimenti(next);
    } catch (err) {
      console.error("Errore eliminazione movimento:", err);
      setError("Errore eliminazione movimento.");
    }
  };

  const openEdit = (record: Movimento) => {
    const unita = splitUnita(record.unita);
    setEditForm({
      id: record.id,
      tipo: record.tipo,
      data: record.data || oggi(),
      materialeCategoria: record.materialeCategoria || "TUBI",
      descrizione: record.descrizione || "",
      quantita: record.quantita ? String(record.quantita) : "",
      unita: unita.unita,
      unitaAltro: unita.unitaAltro,
      cantiereId: record.cantiereId || "",
      cantiereLabel: record.cantiereLabel || "",
      note: record.note || "",
      fotoUrl: record.fotoUrl || null,
      fotoStoragePath: record.fotoStoragePath || null,
      sourceCantiereId: record.sourceCantiereId || "",
      sourceCantiereLabel: record.sourceCantiereLabel || "",
    });
    setEditFotoFile(null);
    if (editFotoPreview) URL.revokeObjectURL(editFotoPreview);
    setEditFotoPreview(null);
  };

  const closeEdit = () => {
    if (editFotoPreview) URL.revokeObjectURL(editFotoPreview);
    setEditForm(null);
    setEditFotoFile(null);
    setEditFotoPreview(null);
  };

  const handleEditRemovePhoto = async () => {
    if (!editForm) return;
    try {
      if (editForm.fotoStoragePath) {
        await deleteMaterialImage(editForm.fotoStoragePath);
      }
    } catch {
      // ignore storage errors
    }
    setEditForm({
      ...editForm,
      fotoUrl: null,
      fotoStoragePath: null,
    });
    setEditFotoFile(null);
    if (editFotoPreview) URL.revokeObjectURL(editFotoPreview);
    setEditFotoPreview(null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;

    const descrizione = editForm.descrizione.trim();
    if (!descrizione) {
      setError("Inserisci una descrizione.");
      return;
    }

    const quantita = parseNumero(editForm.quantita);
    if (!Number.isFinite(quantita) || quantita <= 0) {
      setError("Inserisci una quantita valida.");
      return;
    }

    const unitaFinale =
      editForm.unita === "altro" ? editForm.unitaAltro.trim() : editForm.unita;
    if (!unitaFinale) {
      setError("Inserisci una unita valida.");
      return;
    }

    const cantiereId = editForm.cantiereId.trim();
    const cantiereLabel = editForm.cantiereLabel.trim() || cantiereId;
    if (!cantiereLabel) {
      setError("Inserisci un cantiere valido.");
      return;
    }

    setEditSaving(true);

    let fotoUrl = editForm.fotoUrl;
    let fotoStoragePath = editForm.fotoStoragePath;

    try {
      if (editFotoFile) {
        if (fotoStoragePath) {
          await deleteMaterialImage(fotoStoragePath);
        }
        const uploaded = await uploadMaterialImage(editFotoFile, editForm.id || buildId());
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      }

      const updated: Movimento = {
        id: editForm.id || buildId(),
        tipo: editForm.tipo,
        data: editForm.data.trim() || oggi(),
        materialeCategoria: editForm.materialeCategoria || "TUBI",
        descrizione,
        quantita,
        unita: unitaFinale,
        cantiereId,
        cantiereLabel,
        note: editForm.note.trim() || null,
        fotoUrl,
        fotoStoragePath,
        sourceCantiereId:
          editForm.tipo === "SPOSTATO"
            ? editForm.sourceCantiereId.trim() || null
            : null,
        sourceCantiereLabel:
          editForm.tipo === "SPOSTATO"
            ? editForm.sourceCantiereLabel.trim() || editForm.sourceCantiereId.trim() || null
            : null,
      };

      const next = movimenti.map((m) => (m.id === updated.id ? updated : m));
      await setItemSync(KEY_ATTREZZATURE, next);
      setMovimenti(next);
      closeEdit();
    } catch (err) {
      console.error("Errore modifica movimento:", err);
      setError("Errore modifica movimento.");
    } finally {
      setEditSaving(false);
    }
  };

  const categorieDisponibili = useMemo(() => {
    const set = new Set(
      movimenti
        .map((m) => String(m.materialeCategoria || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [movimenti]);

  const categorieFiltro = useMemo(() => {
    const set = new Set<string>([...CATEGORIE, ...categorieDisponibili]);
    return Array.from(set).sort();
  }, [categorieDisponibili]);

  const movimentiFiltrati = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    return movimenti.filter((m) => {
      if (filterTipo !== "tutti" && m.tipo !== filterTipo) return false;
      if (filterCategoria !== "tutte" && m.materialeCategoria !== filterCategoria)
        return false;
      if (!text) return true;
      const hay = `${m.cantiereId} ${m.cantiereLabel} ${m.descrizione}`
        .toLowerCase()
        .trim();
      return hay.includes(text);
    });
  }, [movimenti, filterText, filterTipo, filterCategoria]);

  const movimentiOrdinati = useMemo(() => {
    return [...movimentiFiltrati].sort(
      (a, b) => dataToNumber(b.data) - dataToNumber(a.data)
    );
  }, [movimentiFiltrati]);

  const statoAttuale = useMemo(() => {
    const cantieri = new Map<
      string,
      {
        id: string;
        label: string;
        materiali: Map<string, { descrizione: string; unita: string; quantita: number }>;
      }
    >();

    const resolveCantiere = (idRaw: string, labelRaw: string) => {
      const id = idRaw.trim() || labelRaw.trim() || "SENZA_CANTIERE";
      const label = labelRaw.trim() || idRaw.trim() || "Senza cantiere";
      const key = `${id}__${label}`.toUpperCase();
      if (!cantieri.has(key)) {
        cantieri.set(key, { id, label, materiali: new Map() });
      }
      return cantieri.get(key)!;
    };

    const addQty = (
      cantiereId: string,
      cantiereLabel: string,
      descrizione: string,
      unita: string,
      delta: number
    ) => {
      if (!descrizione || !unita || !Number.isFinite(delta) || delta === 0) return;
      const cantiere = resolveCantiere(cantiereId, cantiereLabel);
      const matKey = `${descrizione}__${unita}`.toLowerCase();
      const existing = cantiere.materiali.get(matKey);
      const nextQty = (existing?.quantita || 0) + delta;
      cantiere.materiali.set(matKey, {
        descrizione,
        unita,
        quantita: nextQty,
      });
    };

    movimenti.forEach((m) => {
      const qty = Number(m.quantita) || 0;
      const descrizione = String(m.descrizione || "").trim();
      const unita = String(m.unita || "").trim();
      if (!descrizione || !unita || !qty) return;

      if (m.tipo === "CONSEGNATO") {
        addQty(m.cantiereId, m.cantiereLabel, descrizione, unita, qty);
        return;
      }

      if (m.tipo === "SPOSTATO") {
        if (m.sourceCantiereId || m.sourceCantiereLabel) {
          addQty(
            m.sourceCantiereId || "",
            m.sourceCantiereLabel || "",
            descrizione,
            unita,
            -qty
          );
        }
        addQty(m.cantiereId, m.cantiereLabel, descrizione, unita, qty);
        return;
      }

      if (m.tipo === "RITIRATO") {
        addQty(m.cantiereId, m.cantiereLabel, descrizione, unita, -qty);
        addQty("MAGAZZINO", "MAGAZZINO", descrizione, unita, qty);
      }
    });

    const result = Array.from(cantieri.values()).map((c) => {
      const materiali = Array.from(c.materiali.values())
        .filter((m) => m.quantita !== 0)
        .sort((a, b) => a.descrizione.localeCompare(b.descrizione));
      return { ...c, materiali };
    });

    return result.filter((c) => c.materiali.length > 0);
  }, [movimenti]);

  const statoVisibile = useMemo(() => {
    return showAllStato ? statoAttuale : statoAttuale.slice(0, 5);
  }, [statoAttuale, showAllStato]);

  const movimentiVisibili = useMemo(() => {
    return showAllRegistro ? movimentiOrdinati : movimentiOrdinati.slice(0, 5);
  }, [movimentiOrdinati, showAllRegistro]);

  const handleExportPdf = async () => {
    const columns = [
      "Sezione",
      "Cantiere",
      "CantiereId",
      "Categoria",
      "Materiale",
      "Quantita",
      "Unita",
      "Tipo",
      "Data",
      "Note",
    ];

    const rows: Record<string, string>[] = [];

    statoAttuale.forEach((cantiere) => {
      cantiere.materiali.forEach((m) => {
        rows.push({
          Sezione: "STATO",
          Cantiere: cantiere.label,
          CantiereId: cantiere.id,
          Categoria: "-",
          Materiale: m.descrizione,
          Quantita: formatQuantita(m.quantita),
          Unita: m.unita,
          Tipo: "STATO",
          Data: "",
          Note: "",
        });
      });
    });

    movimentiOrdinati.forEach((m) => {
      rows.push({
        Sezione: "MOVIMENTO",
        Cantiere: m.cantiereLabel,
        CantiereId: m.cantiereId,
        Categoria: m.materialeCategoria || "-",
        Materiale: m.descrizione,
        Quantita: formatQuantita(m.quantita),
        Unita: m.unita,
        Tipo: m.tipo,
        Data: m.data,
        Note: m.note || "",
      });
    });

    try {
      await generateTablePDF("Attrezzature cantieri", rows, columns);
    } catch (err) {
      console.error("Errore export PDF:", err);
      setError("Errore durante export PDF.");
    }
  };

  return (
    <div className="ac-page">
      <div className="ac-card">
        <div className="ac-header">
          <div className="ac-logo-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="ac-logo"
              onClick={() => navigate("/")}
            />
            <div>
              <h1 className="ac-title">Attrezzature cantieri</h1>
              <p className="ac-subtitle">
                Registro movimenti e stato attuale dei cantieri
              </p>
            </div>
          </div>
          <div className="ac-header-actions">
            <button
              className="ac-secondary-btn"
              type="button"
              onClick={() => navigate("/gestione-operativa")}
            >
              Gestione Operativa
            </button>
            <button className="ac-primary-btn" type="button" onClick={handleExportPdf}>
              Esporta PDF
            </button>
          </div>
        </div>

        {error && <div className="ac-error">{error}</div>}

        <div className="ac-grid">
          <div className="ac-col">
            <section className="ac-section ac-form-section">
              <div className="ac-section-head">
                <div>
                  <h2>Nuovo movimento</h2>
                  <span>Consegna, spostamento o ritiro attrezzature</span>
                </div>
                <button
                  className="ac-link-btn"
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Reset
                </button>
              </div>

              <div className="ac-form">
                <label className="ac-label">
                  Tipo movimento
                  <select
                    className="ac-input"
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tipo: e.target.value as MovimentoTipo,
                      }))
                    }
                  >
                    {TIPI_MOVIMENTO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="ac-row">
                  <label className="ac-label flex1">
                    Data
                    <input
                      className="ac-input"
                      type="text"
                      placeholder="gg mm aaaa"
                      value={form.data}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, data: e.target.value }))
                      }
                    />
                  </label>

                  <label className="ac-label flex1">
                    Categoria
                    <select
                      className="ac-input"
                      value={form.materialeCategoria}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          materialeCategoria: e.target.value,
                        }))
                      }
                    >
                      {CATEGORIE.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="ac-label">
                  Descrizione materiale
                  <input
                    className="ac-input"
                    type="text"
                    placeholder="Es. TUBI 40MM"
                    value={form.descrizione}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, descrizione: e.target.value }))
                    }
                  />
                </label>

                <div className="ac-row">
                  <label className="ac-label flex1">
                    Quantita
                    <input
                      className="ac-input"
                      type="number"
                      value={form.quantita}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, quantita: e.target.value }))
                      }
                    />
                  </label>

                  <label className="ac-label flex1">
                    Unita
                    <select
                      className="ac-input"
                      value={form.unita}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          unita: e.target.value,
                          unitaAltro:
                            e.target.value === "altro" ? prev.unitaAltro : "",
                        }))
                      }
                    >
                      {UNITA_OPZIONI.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {form.unita === "altro" && (
                  <label className="ac-label">
                    Unita (specifica)
                    <input
                      className="ac-input"
                      type="text"
                      value={form.unitaAltro}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          unitaAltro: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}

                <div className="ac-row">
                  <label className="ac-label flex1">
                    Cantiere ID
                    <input
                      className="ac-input"
                      type="text"
                      placeholder="Es. CANT-12"
                      value={form.cantiereId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          cantiereId: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="ac-label flex1">
                    Cantiere (nome)
                    <input
                      className="ac-input"
                      type="text"
                      placeholder="Es. Via Roma"
                      value={form.cantiereLabel}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          cantiereLabel: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                {form.tipo === "SPOSTATO" && (
                  <>
                    <div className="ac-hint">
                      Compila il cantiere di origine per sottrarre le quantita.
                    </div>
                    <div className="ac-row">
                      <label className="ac-label flex1">
                        Da cantiere ID
                        <input
                          className="ac-input"
                          type="text"
                          value={form.sourceCantiereId}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              sourceCantiereId: e.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="ac-label flex1">
                        Da cantiere (nome)
                        <input
                          className="ac-input"
                          type="text"
                          value={form.sourceCantiereLabel}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              sourceCantiereLabel: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  </>
                )}

                <label className="ac-label">
                  Note (opzionale)
                  <textarea
                    className="ac-input ac-textarea"
                    value={form.note}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                  />
                </label>

                <div className="ac-photo">
                  <label className="ac-label">
                    Foto (opzionale)
                    <input
                      className="ac-file"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) =>
                        handleFotoSelect(
                          e.target.files?.[0] || null,
                          setFotoFile,
                          setFotoPreview,
                          fotoPreview
                        )
                      }
                    />
                  </label>
                  {fotoPreview && (
                    <div className="ac-photo-preview">
                      <img src={fotoPreview} alt="Anteprima foto" />
                      <button
                        type="button"
                        className="ac-link-btn"
                        onClick={() =>
                          handleFotoSelect(null, setFotoFile, setFotoPreview, fotoPreview)
                        }
                      >
                        Rimuovi foto
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className="ac-primary-btn"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Salvataggio..." : "Salva movimento"}
                </button>
              </div>
            </section>

            <section className="ac-section ac-stato-section">
              <div className="ac-section-head">
                <div>
                  <h2>Stato attuale</h2>
                  <span>Dove sono le attrezzature ora</span>
                </div>
                {statoAttuale.length > 5 && (
                  <button
                    className="ac-link-btn"
                    type="button"
                    onClick={() => setShowAllStato((prev) => !prev)}
                  >
                    {showAllStato ? "Mostra meno" : "Mostra tutto"}
                  </button>
                )}
              </div>

              {statoAttuale.length === 0 ? (
                <div className="ac-empty">Nessun movimento registrato.</div>
              ) : (
                <div className="ac-status-grid">
                  {statoVisibile.map((c) => (
                    <div className="ac-status-card" key={`${c.id}-${c.label}`}>
                      <div className="ac-status-head">
                        <div className="ac-status-title">{c.label}</div>
                        <div className="ac-status-sub">{c.id}</div>
                      </div>
                      <div className="ac-status-list">
                        {c.materiali.map((m) => (
                          <div
                            key={`${c.id}-${m.descrizione}-${m.unita}`}
                            className="ac-status-row"
                          >
                            <span>{m.descrizione}</span>
                            <span className="ac-qty">
                              {formatQuantita(m.quantita)} {m.unita}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="ac-col">
            <section className="ac-section ac-registro-section">
              <div className="ac-section-head">
                <div>
                  <h2>Registro movimenti</h2>
                  <span>{movimentiOrdinati.length} movimenti</span>
                </div>
                {movimentiOrdinati.length > 5 && (
                  <button
                    className="ac-link-btn"
                    type="button"
                    onClick={() => setShowAllRegistro((prev) => !prev)}
                  >
                    {showAllRegistro ? "Mostra meno" : "Mostra tutto"}
                  </button>
                )}
              </div>

              <div className="ac-filters">
                <label className="ac-label">
                  Ricerca
                  <input
                    className="ac-input"
                    type="text"
                    placeholder="cantiere, descrizione"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </label>

                <label className="ac-label">
                  Tipo
                  <select
                    className="ac-input"
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                  >
                    <option value="tutti">tutti</option>
                    {TIPI_MOVIMENTO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ac-label">
                  Categoria
                  <select
                    className="ac-input"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                  >
                    <option value="tutte">tutte</option>
                    {categorieFiltro.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="ac-registro-list">
                {loading ? (
                  <div className="ac-empty">Caricamento movimenti...</div>
                ) : movimentiOrdinati.length === 0 ? (
                  <div className="ac-empty">Nessun movimento registrato.</div>
                ) : (
                  movimentiVisibili.map((m) => (
                    <div key={m.id} className="ac-registro-row">
                      <div className="ac-registro-main">
                        <div className="ac-registro-head">
                          <span className="ac-date">{m.data}</span>
                          <span className={`ac-badge is-${m.tipo.toLowerCase()}`}>
                            {m.tipo}
                          </span>
                        </div>
                        <div className="ac-registro-title">{m.descrizione}</div>
                        <div className="ac-registro-meta">
                          <span className="ac-meta-item">
                            {m.materialeCategoria || "-"}
                          </span>
                          <span className="ac-meta-item">
                            {formatQuantita(m.quantita)} {m.unita}
                          </span>
                          <span className="ac-meta-item">
                            {m.cantiereLabel || m.cantiereId}
                          </span>
                        </div>
                        {m.tipo === "SPOSTATO" &&
                          (m.sourceCantiereId || m.sourceCantiereLabel) && (
                            <div className="ac-registro-meta">
                              <span className="ac-meta-item">
                                Da: {m.sourceCantiereLabel || m.sourceCantiereId}
                              </span>
                            </div>
                          )}
                        {m.note && <div className="ac-note">{m.note}</div>}
                        {m.fotoUrl && (
                          <div className="ac-photo-thumb">
                            <img src={m.fotoUrl} alt="Foto movimento" />
                          </div>
                        )}
                      </div>
                      <div className="ac-registro-actions">
                        <button
                          className="ac-secondary-btn"
                          type="button"
                          onClick={() => openEdit(m)}
                        >
                          Modifica
                        </button>
                        <button
                          className="ac-danger-btn"
                          type="button"
                          onClick={() => handleDelete(m)}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {editForm && (
        <div className="ac-modal">
          <div className="ac-modal-box">
            <div className="ac-modal-head">
              <div>
                <h3>Modifica movimento</h3>
                <span>ID: {editForm.id}</span>
              </div>
              <button className="ac-link-btn" type="button" onClick={closeEdit}>
                Chiudi
              </button>
            </div>

            <div className="ac-form">
              <label className="ac-label">
                Tipo movimento
                <select
                  className="ac-input"
                  value={editForm.tipo}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            tipo: e.target.value as MovimentoTipo,
                          }
                        : prev
                    )
                  }
                >
                  {TIPI_MOVIMENTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="ac-row">
                <label className="ac-label flex1">
                  Data
                  <input
                    className="ac-input"
                    type="text"
                    value={editForm.data}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, data: e.target.value } : prev
                      )
                    }
                  />
                </label>

                <label className="ac-label flex1">
                  Categoria
                  <select
                    className="ac-input"
                    value={editForm.materialeCategoria}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, materialeCategoria: e.target.value } : prev
                      )
                    }
                  >
                    {CATEGORIE.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="ac-label">
                Descrizione materiale
                <input
                  className="ac-input"
                  type="text"
                  value={editForm.descrizione}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, descrizione: e.target.value } : prev
                    )
                  }
                />
              </label>

              <div className="ac-row">
                <label className="ac-label flex1">
                  Quantita
                  <input
                    className="ac-input"
                    type="number"
                    value={editForm.quantita}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, quantita: e.target.value } : prev
                      )
                    }
                  />
                </label>
                <label className="ac-label flex1">
                  Unita
                  <select
                    className="ac-input"
                    value={editForm.unita}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              unita: e.target.value,
                              unitaAltro:
                                e.target.value === "altro" ? prev.unitaAltro : "",
                            }
                          : prev
                      )
                    }
                  >
                    {UNITA_OPZIONI.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {editForm.unita === "altro" && (
                <label className="ac-label">
                  Unita (specifica)
                  <input
                    className="ac-input"
                    type="text"
                    value={editForm.unitaAltro}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, unitaAltro: e.target.value } : prev
                      )
                    }
                  />
                </label>
              )}

              <div className="ac-row">
                <label className="ac-label flex1">
                  Cantiere ID
                  <input
                    className="ac-input"
                    type="text"
                    value={editForm.cantiereId}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, cantiereId: e.target.value } : prev
                      )
                    }
                  />
                </label>
                <label className="ac-label flex1">
                  Cantiere (nome)
                  <input
                    className="ac-input"
                    type="text"
                    value={editForm.cantiereLabel}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, cantiereLabel: e.target.value } : prev
                      )
                    }
                  />
                </label>
              </div>

              {editForm.tipo === "SPOSTATO" && (
                <>
                  <div className="ac-hint">
                    Compila il cantiere di origine per sottrarre le quantita.
                  </div>
                  <div className="ac-row">
                    <label className="ac-label flex1">
                      Da cantiere ID
                      <input
                        className="ac-input"
                        type="text"
                        value={editForm.sourceCantiereId}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, sourceCantiereId: e.target.value }
                              : prev
                          )
                        }
                      />
                    </label>
                    <label className="ac-label flex1">
                      Da cantiere (nome)
                      <input
                        className="ac-input"
                        type="text"
                        value={editForm.sourceCantiereLabel}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, sourceCantiereLabel: e.target.value }
                              : prev
                          )
                        }
                      />
                    </label>
                  </div>
                </>
              )}

              <label className="ac-label">
                Note
                <textarea
                  className="ac-input ac-textarea"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, note: e.target.value } : prev
                    )
                  }
                />
              </label>

              <div className="ac-photo">
                <label className="ac-label">
                  Foto
                  <input
                    className="ac-file"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) =>
                      handleFotoSelect(
                        e.target.files?.[0] || null,
                        setEditFotoFile,
                        setEditFotoPreview,
                        editFotoPreview
                      )
                    }
                  />
                </label>

                {(editFotoPreview || editForm.fotoUrl) && (
                  <div className="ac-photo-preview">
                    <img
                      src={editFotoPreview || editForm.fotoUrl || ""}
                      alt="Anteprima foto"
                    />
                    <div className="ac-photo-actions">
                      {editFotoPreview && (
                        <button
                          type="button"
                          className="ac-link-btn"
                          onClick={() =>
                            handleFotoSelect(
                              null,
                              setEditFotoFile,
                              setEditFotoPreview,
                              editFotoPreview
                            )
                          }
                        >
                          Annulla nuova foto
                        </button>
                      )}
                      {editForm.fotoUrl && (
                        <button
                          type="button"
                          className="ac-link-btn"
                          onClick={handleEditRemovePhoto}
                        >
                          Rimuovi foto
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="ac-modal-actions">
              <button className="ac-secondary-btn" type="button" onClick={closeEdit}>
                Annulla
              </button>
              <button
                className="ac-primary-btn"
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
