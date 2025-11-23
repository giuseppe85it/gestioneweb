// src/pages/MaterialiConsegnati.tsx
import  { useEffect, useMemo, useState } from "react";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import type { InventarioItem } from "./Inventario";
import "./MaterialiConsegnati.css";

export interface MaterialeConsegnato {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  destinatario: string; // collega / targa / magazzino
  motivo?: string;
  data: string; // gg mm aaaa
}

const KEY_INVENTARIO = "@inventario";
const KEY_CONSEGNATI = "@materialiconsegnati";

const generateId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const oggi = () => {
  const n = new Date();
  const gg = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const yy = n.getFullYear();
  return `${gg} ${mm} ${yy}`;
};

const MaterialiConsegnati: React.FC = () => {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [consegne, setConsegne] = useState<MaterialeConsegnato[]>([]);

  const [destinatario, setDestinatario] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState("pz");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(oggi());

  const [loading, setLoading] = useState(true);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  // Carica inventario + consegne
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const invRaw = await getItemSync(KEY_INVENTARIO);
        const consRaw = await getItemSync(KEY_CONSEGNATI);

        const invArr = Array.isArray(invRaw)
          ? (invRaw as InventarioItem[])
          : invRaw?.value && Array.isArray(invRaw.value)
          ? (invRaw.value as InventarioItem[])
          : [];

        const consArr = Array.isArray(consRaw)
          ? (consRaw as MaterialeConsegnato[])
          : consRaw?.value && Array.isArray(consRaw.value)
          ? (consRaw.value as MaterialeConsegnato[])
          : [];

        setInventario(invArr);
        setConsegne(consArr);
      } finally {
        setLoading(false);
      }
    };

    void loadAll();
  }, []);

  const persistInventario = async (items: InventarioItem[]) => {
    setInventario(items);
    await setItemSync(KEY_INVENTARIO, items);
  };

  const persistConsegne = async (items: MaterialeConsegnato[]) => {
    setConsegne(items);
    await setItemSync(KEY_CONSEGNATI, items);
  };

  // Scala inventario quando consegni materiale
  const scalaInventarioPerConsegna = async (c: MaterialeConsegnato) => {
    let inv = [...inventario];
    let rest = c.quantita;

    for (let i = 0; i < inv.length && rest > 0; i++) {
      const item = inv[i];
      if (item.descrizione === c.descrizione && item.unita === c.unita) {
        const consumabile = Math.min(item.quantita, rest);
        item.quantita -= consumabile;
        rest -= consumabile;
        if (item.quantita <= 0) {
          inv.splice(i, 1);
          i--;
        }
      }
    }

    await persistInventario(inv);
  };

  // Ripristina inventario se cancelli una consegna
  const ripristinaInventarioPerCancellazione = async (c: MaterialeConsegnato) => {
    let inv = [...inventario];
    let rest = c.quantita;

    // prova ad aggiungere su voci già presenti (stessa descrizione + unita)
    let idx = inv.findIndex(
      (x) => x.descrizione === c.descrizione && x.unita === c.unita
    );

    if (idx >= 0) {
      inv[idx] = { ...inv[idx], quantita: inv[idx].quantita + rest };
    } else {
      // se non esiste, crea una nuova voce generica (senza fornitore)
      inv.push({
        id: generateId(),
        descrizione: c.descrizione,
        quantita: rest,
        unita: c.unita,
        fornitore: null,
        fotoUrl: null,
        fotoStoragePath: null,
      });
    }

    await persistInventario(inv);
  };

  // Aggiungi consegna
  const handleAdd = async () => {
    if (!destinatario.trim() || !descrizione.trim() || !quantita.trim()) {
      alert("Compila destinatario, descrizione e quantità.");
      return;
    }

    const q = Number(quantita.replace(",", "."));
    if (Number.isNaN(q) || q <= 0) {
      alert("La quantità deve essere un numero valido.");
      return;
    }

    const nuovo: MaterialeConsegnato = {
      id: generateId(),
      descrizione: descrizione.trim().toUpperCase(),
      quantita: q,
      unita,
      destinatario: destinatario.trim(),
      motivo: motivo.trim() || "",
      data: data.trim() || oggi(),
    };

    const nuoveConsegne = [...consegne, nuovo];
    await persistConsegne(nuoveConsegne);
    await scalaInventarioPerConsegna(nuovo);

    setDescrizione("");
    setQuantita("");
    setMotivo("");
    setData(oggi());
  };

  // Elimina singola consegna
  const handleDeleteConsegna = async (id: string) => {
    const record = consegne.find((c) => c.id === id);
    if (!record) return;

    if (!confirm("Vuoi eliminare questa consegna e ripristinare il magazzino?")) {
      return;
    }

    const nuove = consegne.filter((c) => c.id !== id);
    await persistConsegne(nuove);
    await ripristinaInventarioPerCancellazione(record);
  };

  // Destinatari unici
  const destinatari = useMemo(
    () => Array.from(new Set(consegne.map((c) => c.destinatario))).sort(),
    [consegne]
  );

  // Consegne del destinatario selezionato
  const consegneSelezionate = useMemo(
    () =>
      selectedDest
        ? consegne
            .filter((c) => c.destinatario === selectedDest)
            .sort((a, b) => a.data.localeCompare(b.data))
        : [],
    [selectedDest, consegne]
  );

  // Totale per un destinatario
  const getTotalePerDestinatario = (dest: string) => {
    const list = consegne.filter((c) => c.destinatario === dest);
    return list.reduce((sum, c) => sum + c.quantita, 0);
  };

  // PDF per destinatario
  const exportPDFPerDestinatario = async (dest: string) => {
    const list = consegne
      .filter((c) => c.destinatario === dest)
      .sort((a, b) => a.data.localeCompare(b.data));

    if (!list.length) {
      alert("Nessun materiale consegnato per questo destinatario.");
      return;
    }

    const rows = list.map((c) => ({
      data: c.data,
      descrizione: c.descrizione,
      quantita: String(c.quantita),
      unita: c.unita,
      motivo: c.motivo || "",
    }));

    await generateSmartPDF({
      kind: "table",
      title: `Materiali consegnati a ${dest}`,
      columns: ["data", "descrizione", "quantita", "unita", "motivo"],
      rows,
    });
  };

  // PDF globale (tutti i destinatari)
  const exportPDFGlobale = async () => {
    if (!consegne.length) {
      alert("Nessun materiale consegnato.");
      return;
    }

    const rows = consegne
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((c) => ({
        data: c.data,
        destinatario: c.destinatario,
        descrizione: c.descrizione,
        quantita: String(c.quantita),
        unita: c.unita,
        motivo: c.motivo || "",
      }));

    await generateSmartPDF({
      kind: "table",
      title: "Storico materiali consegnati",
      columns: ["data", "destinatario", "descrizione", "quantita", "unita", "motivo"],
      rows,
    });
  };

  return (
    <div className="mc-page">
      <div className="mc-card">
        {/* HEADER */}
        <div className="mc-header">
          <div className="mc-logo-title">
            <img src="/logo.png" alt="logo" className="mc-logo" />
            <div>
              <h1 className="mc-title">Materiali consegnati</h1>
              <p className="mc-subtitle">
                Movimentazioni in uscita da magazzino (colleghi / mezzi)
              </p>
            </div>
          </div>

          <button className="mc-pdf-global-btn" onClick={exportPDFGlobale}>
            PDF Storico
          </button>
        </div>

        {/* FORM NUOVA CONSEGNA */}
        <div className="mc-form">
          <label className="mc-label">
            Destinatario (collega / targa)
            <input
              type="text"
              className="mc-input"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="Es. MARIO ROSSI / TI 315407"
            />
          </label>

          <label className="mc-label">
            Descrizione materiale
            <input
              type="text"
              className="mc-input"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Es. TUBO 40MM"
            />
          </label>

          <div className="mc-row-inline">
            <label className="mc-label flex1">
              Quantità
              <input
                type="number"
                className="mc-input"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
              />
            </label>

            <label className="mc-label flex1">
              Unità
              <select
                className="mc-input"
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

          <label className="mc-label">
            Motivo consegna (opzionale)
            <input
              type="text"
              className="mc-input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Es. Intervento manutenzione cisterna"
            />
          </label>

          <label className="mc-label">
            Data consegna
            <input
              type="text"
              className="mc-input"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="gg mm aaaa"
            />
          </label>

          <button className="mc-add-btn" onClick={handleAdd}>
            Registra consegna
          </button>
        </div>

        {/* LISTA DESTINATARI */}
        <div className="mc-list-wrapper">
          {loading ? (
            <div className="mc-empty">Caricamento...</div>
          ) : !consegne.length ? (
            <div className="mc-empty">
              Nessuna consegna registrata. Registra una nuova uscita dal magazzino.
            </div>
          ) : (
            <>
              <div className="mc-dest-list">
                {destinatari.map((dest) => (
                  <button
                    key={dest}
                    className={
                      "mc-dest-row" + (selectedDest === dest ? " mc-dest-row-active" : "")
                    }
                    onClick={() =>
                      setSelectedDest((prev) => (prev === dest ? null : dest))
                    }
                  >
                    <div className="mc-dest-main">
                      <span className="mc-dest-name">{dest}</span>
                      <span className="mc-dest-badge">
                        Tot: {getTotalePerDestinatario(dest)}
                      </span>
                    </div>
                    <div className="mc-dest-meta">
                      <span className="mc-dest-meta-text">
                        Movimenti:{" "}
                        {consegne.filter((c) => c.destinatario === dest).length}
                      </span>
                      <span className="mc-dest-meta-link">Dettaglio ▾</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* DETTAGLIO DESTINATARIO */}
              {selectedDest && (
                <div className="mc-detail-panel">
                  <div className="mc-detail-header">
                    <div>
                      <h2 className="mc-detail-title">{selectedDest}</h2>
                      <p className="mc-detail-subtitle">
                        Storico materiali consegnati
                      </p>
                    </div>
                    <button
                      className="mc-pdf-btn"
                      onClick={() => exportPDFPerDestinatario(selectedDest)}
                    >
                      PDF
                    </button>
                  </div>

                  <div className="mc-detail-list">
                    {consegneSelezionate.map((c) => (
                      <div key={c.id} className="mc-detail-row">
                        <div className="mc-detail-main">
                          <span className="mc-detail-date">{c.data}</span>
                          <span className="mc-detail-desc">
                            {c.descrizione} — {c.quantita} {c.unita}
                          </span>
                          {c.motivo && (
                            <span className="mc-detail-motivo">{c.motivo}</span>
                          )}
                        </div>
                        <button
                          className="mc-delete-btn"
                          onClick={() => handleDeleteConsegna(c.id)}
                        >
                          Elimina
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialiConsegnati;
