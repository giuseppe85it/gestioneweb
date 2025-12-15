// ======================================================
// CambioMezzoInbox.tsx
// APP ADMIN – Centro di controllo eventi autisti
// LETTURA ONLY
// ======================================================

import { useEffect, useState } from "react";
import "./CambioMezzoInbox.css";
import { getItemSync } from "../utils/storageSync";

const SGANCI_RIMORCHI_KEY = "@storico_sganci_rimorchi";
const CAMBI_MOTRICE_KEY = "@storico_cambi_motrice";

type Evento =
  | {
      tipo: "rimorchio";
      targa: string;
      categoria?: string;
      autista: string;
      badgeAutista: string;
      luogo: string;
      statoCarico: string;
      condizioni: any;
      timestamp: number;
    }
  | {
      tipo: "motrice";
      targa: string;
      autista: string;
      badgeAutista: string;
      luogo: string;
      condizioni: any;
      timestamp: number;
    };

export default function CambioMezzoInbox() {
  const [eventi, setEventi] = useState<Evento[]>([]);

  useEffect(() => {
    caricaEventi();
  }, []);

  async function caricaEventi() {
    const rimorchi = (await getItemSync(SGANCI_RIMORCHI_KEY)) || [];
    const motrici = (await getItemSync(CAMBI_MOTRICE_KEY)) || [];

    const eventiRimorchi: Evento[] = rimorchi.map((r: any) => ({
      tipo: "rimorchio",
      targa: r.targaRimorchio,
      categoria: r.categoria,
      autista: r.autista,
      badgeAutista: r.badgeAutista,
      luogo: r.luogo,
      statoCarico: r.statoCarico,
      condizioni: r.condizioni,
      timestamp: r.timestampSgancio,
    }));

    const eventiMotrici: Evento[] = motrici.map((m: any) => ({
      tipo: "motrice",
      targa: m.targaMotrice,
      autista: m.autista,
      badgeAutista: m.badgeAutista,
      luogo: m.luogo,
      condizioni: m.condizioni,
      timestamp: m.timestampCambio,
    }));

    const tutti = [...eventiRimorchi, ...eventiMotrici].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setEventi(tutti);
  }

  return (
    <div className="cmi-container">
      <h1>CAMBIO MEZZO – AUTISTI</h1>
      <p className="cmi-subtitle">
        Centro di controllo eventi provenienti dall’app autisti
      </p>

      {eventi.length === 0 && (
        <div className="cmi-empty">Nessun evento registrato</div>
      )}

      <div className="cmi-list">
        {eventi.map((e, idx) => (
          <div key={idx} className="cmi-card">
            <div className="cmi-header">
              <span className={`cmi-badge ${e.tipo}`}>
                {e.tipo === "rimorchio" ? "RIMORCHIO" : "MOTRICE"}
              </span>
              <span className="cmi-time">
                {new Date(e.timestamp).toLocaleString("it-CH")}
              </span>
            </div>

            <div className="cmi-main">
              <div className="cmi-targa">{e.targa}</div>
              <div className="cmi-autista">
                {e.autista} ({e.badgeAutista})
              </div>
            </div>

            <div className="cmi-row">
              <strong>Luogo:</strong> {e.luogo}
            </div>

            {e.tipo === "rimorchio" && (
              <div className="cmi-row">
                <strong>Stato carico:</strong> {e.statoCarico}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
