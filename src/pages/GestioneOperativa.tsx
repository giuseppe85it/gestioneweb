// ======================================================
// GESTIONE OPERATIVA — SCHERMATA HUB
// Percorso: src/pages/GestioneOperativa.tsx
// ------------------------------------------------------
// Questa schermata NON implementa logica di business.
// Serve solo a orchestrare:
// - Inventario
// - Materiali Consegnati
// - Manutenzioni
//
// Vincoli progettuali:
// - Nessuna modifica alle chiavi di lettura/scrittura dei moduli
// - Nessuna duplicazione di logica (solo preview + link)
// - Stile premium coerente con Dossier (CSS dedicato)
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import "./GestioneOperativa.css";

// ------------------------------------------------------
// Chiavi STORAGE (SOLO LETTURA)
// Nota: non cambiamo le chiavi esistenti dei moduli.
// ------------------------------------------------------
const KEY_INVENTARIO = "@inventario";
const KEY_CONSEGNATI = "@materialiconsegnati";
const KEY_MANUTENZIONI = "@manutenzioni";

// ------------------------------------------------------
// Tipi MINIMI per preview (solo campi usati qui)
// ------------------------------------------------------
interface InventarioPreview {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
}

interface ConsegnaPreview {
  id: string;
  descrizione: string;
  quantita: number;
  data: string;
}

interface ManutenzionePreview {
  id: string;
  targa: string;
  descrizione: string;
  data: string;
}

const GestioneOperativa: React.FC = () => {
  const navigate = useNavigate();

  // Stato locale SOLO per preview
  const [inventario, setInventario] = useState<InventarioPreview[]>([]);
  const [consegne, setConsegne] = useState<ConsegnaPreview[]>([]);
  const [manutenzioni, setManutenzioni] = useState<ManutenzionePreview[]>([]);

  // Caricamento iniziale (solo snapshot per dashboard)
  useEffect(() => {
    const load = async () => {
      try {
        const invRaw = await getItemSync(KEY_INVENTARIO);
        const consRaw = await getItemSync(KEY_CONSEGNATI);
        const manRaw = await getItemSync(KEY_MANUTENZIONI);

        const invArr = Array.isArray(invRaw) ? invRaw : invRaw?.value || [];
        const consArr = Array.isArray(consRaw) ? consRaw : consRaw?.value || [];
        const manArr = Array.isArray(manRaw) ? manRaw : manRaw?.value || [];

        // Preview inventario: pochi elementi (alto valore informativo)
        setInventario(invArr.slice(0, 6));

        // Preview consegne: ultime (per badge/contesto)
        setConsegne(consArr.slice(-5).reverse());

        // Preview manutenzioni: ultime
        setManutenzioni(manArr.slice(0, 5));
      } catch (err) {
        console.error("Errore caricamento Gestione Operativa:", err);
      }
    };

    load();
  }, []);

  // Indicatori sintetici (badge header)
  const materialiCritici = useMemo(() => {
    return inventario.filter((i) => i.quantita <= 0).length;
  }, [inventario]);

  // Uso minimo consegne (evita warning e dà info utile)
  const numeroConsegne = consegne.length;

  return (
    <div className="go-page">
      <div className="go-card">
        {/* ================= HEADER ================= */}
        <div className="go-header">
          <div className="go-logo-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="go-logo"
              onClick={() => navigate("/")}
            />
            <div>
              <h1 className="go-title">Gestione Operativa</h1>
              <p className="go-subtitle">
                Centro di controllo magazzino e manutenzioni
              </p>
            </div>
          </div>

          <div className="go-badges">
            {materialiCritici > 0 && (
              <span className="go-badge danger">
                {materialiCritici} materiali critici
              </span>
            )}

            {numeroConsegne > 0 && (
              <span className="go-badge">{numeroConsegne} consegne registrate</span>
            )}
          </div>
        </div>

        {/* ================= STATO MAGAZZINO ================= */}
        <div className="go-section">
          <h2 className="go-section-title">Stato magazzino</h2>

          <div className="go-inventario-preview">
            {inventario.map((i) => (
              <div key={i.id} className="go-inventario-row">
                <span className="go-inv-desc">{i.descrizione}</span>
                <span className="go-inv-qty">
                  {i.quantita} {i.unita}
                </span>
              </div>
            ))}
          </div>

          <button className="go-link-btn" onClick={() => navigate("/inventario")}>
            Apri inventario completo
          </button>
        </div>

        {/* ================= AZIONI OPERATIVE (SEZIONE DEDICATA) ================= */}
        <div className="go-actions-section">
          <div className="go-actions-title">AZIONI OPERATIVE</div>

          <div className="go-actions">
            {/* Usa materiale */}
           <div className="go-action-card use-materiale">
              <h3>Usa materiale</h3>
              <p>Registra un’uscita dal magazzino</p>
              <button
                className="go-primary-btn"
                onClick={() => navigate("/materiali-consegnati")}
              >
                Vai a materiali consegnati
              </button>
            </div>

            {/* Registra manutenzione */}
           <div className="go-action-card manutenzione">
              <h3>Registra manutenzione</h3>
              <p>Inserisci un intervento su mezzo</p>
              <button
                className="go-primary-btn"
                onClick={() => navigate("/manutenzioni")}
              >
                Vai a manutenzioni
              </button>
            </div>
          </div>
        </div>

        {/* ================= STORICO ================= */}
        <div className="go-section">
          <h2 className="go-section-title">Ultime attività</h2>

          <div className="go-storico">
            {manutenzioni.map((m) => (
              <div key={m.id} className="go-storico-row">
                <span>{m.data}</span>
                <span>{m.targa}</span>
                <span>{m.descrizione}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestioneOperativa;
