// ======================================================
// CambioMezzoAutista.tsx
// APP AUTISTI
// - Cambio Rimorchio (SGANCIO)
// - Cambio Motrice
// Scrive:
// - storageSync (come prima)
// - Firestore (EVENTI OPERATIVI)
// ======================================================

import { useEffect, useState } from "react";
import "./CambioMezzoAutista.css";
import { getItemSync, setItemSync } from "../utils/storageSync";

// 🔥 Firestore diretto per eventi
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const AUTISTA_KEY = "@autista_attivo";
const SESSIONI_KEY = "@autisti_sessione_attive";
const STORICO_RIMORCHI_KEY = "@storico_sganci_rimorchi";
const STORICO_MOTRICI_KEY = "@storico_cambi_motrice";

const LUOGHI = ["STABIO", "MEV", "ALTRO"];

type Modalita = "rimorchio" | "motrice";

interface Sessione {
  targa: string;
  tipo: "motrice" | "rimorchio";
  categoria?: string;
  badgeAutista: string;
  nomeAutista: string;
  timestamp: number;
}

export default function CambioMezzoAutista() {
  const [modalita, setModalita] = useState<Modalita>("rimorchio");
  const [sessione, setSessione] = useState<Sessione | null>(null);

  const [luogo, setLuogo] = useState("");
  const [luogoAltro, setLuogoAltro] = useState("");
  const [statoCarico, setStatoCarico] =
    useState<"PIENO" | "SCARICO">("SCARICO");

  const [condizioni, setCondizioni] = useState({
    specifiche: {
      cinghie: true,
      stecche: true,
      botole: true,
      tubi: true,
    },
    generali: {
      gomme: true,
      freni: true,
      perdite: true,
    },
  });

  const [errore, setErrore] = useState("");

  // ======================================================
  // LOAD SESSIONE ATTIVA
  // ======================================================
  useEffect(() => {
    caricaSessione();
  }, [modalita]);

  async function caricaSessione() {
    const autista = await getItemSync(AUTISTA_KEY);
    const sessioni: Sessione[] = (await getItemSync(SESSIONI_KEY)) || [];

    const trovata = sessioni.find(
      (s) => s.tipo === modalita && s.badgeAutista === autista?.badge
    );

    setSessione(trovata || null);
  }

  function toggle(path: string) {
    setCondizioni((prev) => {
      const copy = structuredClone(prev) as any;
      const [group, key] = path.split(".");
      copy[group][key] = !copy[group][key];
      return copy;
    });
  }

  // ======================================================
  // CONFERMA CAMBIO
  // ======================================================
  async function conferma() {
    setErrore("");

    if (!sessione) {
      setErrore("Nessun mezzo attivo");
      return;
    }
    if (!luogo) {
      setErrore("Seleziona il luogo");
      return;
    }
    if (luogo === "ALTRO" && !luogoAltro.trim()) {
      setErrore("Specifica il luogo");
      return;
    }

    const now = Date.now();
    const luogoFinale = luogo === "ALTRO" ? luogoAltro : luogo;

    // =======================
    // SGANCIO RIMORCHIO
    // =======================
    if (modalita === "rimorchio") {
      const storico = (await getItemSync(STORICO_RIMORCHI_KEY)) || [];

      storico.push({
        targaRimorchio: sessione.targa,
        categoria: sessione.categoria,
        autista: sessione.nomeAutista,
        badgeAutista: sessione.badgeAutista,
        luogo: luogoFinale,
        statoCarico,
        condizioni,
        timestampAggancio: sessione.timestamp,
        timestampSgancio: now,
      });

      await setItemSync(STORICO_RIMORCHI_KEY, storico);

      // 🔥 EVENTO FIRESTORE
      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "SGANCIO_RIMORCHIO",
        autistaNome: sessione.nomeAutista,
        badgeAutista: sessione.badgeAutista,
        targaRimorchio: sessione.targa,
        luogo: luogoFinale,
        statoCarico,
        condizioni,
        timestamp: now,
        createdAt: serverTimestamp(),
      });
    }

    // =======================
    // CAMBIO MOTRICE
    // =======================
    if (modalita === "motrice") {
      const storico = (await getItemSync(STORICO_MOTRICI_KEY)) || [];

      storico.push({
        targaMotrice: sessione.targa,
        autista: sessione.nomeAutista,
        badgeAutista: sessione.badgeAutista,
        luogo: luogoFinale,
        condizioni: condizioni.generali,
        timestampCambio: now,
      });

      await setItemSync(STORICO_MOTRICI_KEY, storico);

      // 🔥 EVENTO FIRESTORE
      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "CAMBIO_MOTRICE",
        autistaNome: sessione.nomeAutista,
        badgeAutista: sessione.badgeAutista,
        targaMotrice: sessione.targa,
        luogo: luogoFinale,
        condizioni: condizioni.generali,
        timestamp: now,
        createdAt: serverTimestamp(),
      });
    }

    // =======================
    // RIMOZIONE SESSIONE
    // =======================
    const sessioni: Sessione[] = (await getItemSync(SESSIONI_KEY)) || [];
    const aggiornate = sessioni.filter(
      (s) =>
        !(
          s.tipo === modalita &&
          s.badgeAutista === sessione.badgeAutista
        )
    );

    await setItemSync(SESSIONI_KEY, aggiornate);

    alert("Cambio registrato correttamente");
    setSessione(null);
  }

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="cm-container">
      <h1>CAMBIO MEZZO</h1>
      <p className="cm-subtitle">Seleziona cosa stai cambiando</p>

      <div className="cm-switch">
        <button
          className={modalita === "rimorchio" ? "active" : ""}
          onClick={() => setModalita("rimorchio")}
        >
          CAMBIO RIMORCHIO
        </button>
        <button
          className={modalita === "motrice" ? "active" : ""}
          onClick={() => setModalita("motrice")}
        >
          CAMBIO MOTRICE
        </button>
      </div>

      {!sessione && (
        <div className="cm-empty">Nessun {modalita} attivo</div>
      )}

      {sessione && (
        <>
          <div className="cm-targa">{sessione.targa}</div>

          <h2>Luogo</h2>
          <div className="cm-luoghi">
            {LUOGHI.map((l) => (
              <button
                key={l}
                className={luogo === l ? "active" : ""}
                onClick={() => setLuogo(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {luogo === "ALTRO" && (
            <input
              className="cm-input"
              value={luogoAltro}
              onChange={(e) => setLuogoAltro(e.target.value)}
              placeholder="Scrivi il luogo"
            />
          )}

          {modalita === "rimorchio" && (
            <>
              <h2>Stato carico</h2>
              <div className="cm-switch">
                <button
                  className={statoCarico === "SCARICO" ? "active" : ""}
                  onClick={() => setStatoCarico("SCARICO")}
                >
                  SCARICO
                </button>
                <button
                  className={statoCarico === "PIENO" ? "active" : ""}
                  onClick={() => setStatoCarico("PIENO")}
                >
                  PIENO
                </button>
              </div>
            </>
          )}

          <h2>Condizioni generali</h2>
          <div className="cm-checklist">
            {["gomme", "freni", "perdite"].map((k) => (
              <label key={k} className="cm-check">
                <input
                  type="checkbox"
                  checked={(condizioni.generali as any)[k]}
                  onChange={() => toggle(`generali.${k}`)}
                />
                <span>{k.toUpperCase()}</span>
              </label>
            ))}
          </div>

          {errore && <div className="cm-error">{errore}</div>}

          <button className="cm-confirm" onClick={conferma}>
            CONFERMA CAMBIO
          </button>
        </>
      )}
    </div>
  );
}
