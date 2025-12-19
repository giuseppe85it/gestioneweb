// ======================================================
// CambioMezzoAutista.tsx
// APP AUTISTI
// - SGANCIO RIMORCHIO
// - CAMBIO MOTRICE
// - TRANSIZIONE GUIDATA A SETUP MEZZO (mode)
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CambioMezzoAutista.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAutistaLocal, getMezzoLocal, saveMezzoLocal } from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";
const STORICO_RIMORCHI_KEY = "@storico_sganci_rimorchi";
const STORICO_MOTRICI_KEY = "@storico_cambi_motrice";
const MEZZO_SYNC_KEY = "@mezzo_attivo_autista";

const LUOGHI = ["STABIO", "MEV", "ALTRO"] as const;
type Luogo = typeof LUOGHI[number];
type Modalita = "rimorchio" | "motrice";

interface SessioneAttiva {
  targaMotrice: string | null;
  targaRimorchio: string | null;
  badgeAutista: string;
  nomeAutista: string;
  timestamp: number;
}

export default function CambioMezzoAutista() {
  const navigate = useNavigate();

  const [modalita, setModalita] = useState<Modalita>("rimorchio");
  const [sessione, setSessione] = useState<SessioneAttiva | null>(null);

  const [luogo, setLuogo] = useState<Luogo | "">("");
  const [luogoAltro, setLuogoAltro] = useState("");
  const [statoCarico, setStatoCarico] = useState<"PIENO" | "SCARICO">("SCARICO");

  const [condizioni, setCondizioni] = useState({
    specifiche: { cinghie: true, stecche: true, botole: true, tubi: true },
    generali: { gomme: true, freni: true, perdite: true },
  });

  const [errore, setErrore] = useState("");

  useEffect(() => {
    // reset campi quando cambi tab
    setErrore("");
    setLuogo("");
    setLuogoAltro("");
    setStatoCarico("SCARICO");
    setCondizioni({
      specifiche: { cinghie: true, stecche: true, botole: true, tubi: true },
      generali: { gomme: true, freni: true, perdite: true },
    });

    caricaSessione();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalita]);

  async function caricaSessione() {
    const a: any = getAutistaLocal();
    const mezzoLocal: any = getMezzoLocal();

    const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
    const sessioni: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];

    // prova: sessione su Firestore per quel badge
    let trovata = sessioni.find((s) => s.badgeAutista === a?.badge) || null;

    // fallback: costruisci da locale (per evitare stati “sporchi”)
    if (!trovata && a?.badge) {
      trovata = {
        targaMotrice: mezzoLocal?.targaCamion || null,
        targaRimorchio: mezzoLocal?.targaRimorchio || null,
        badgeAutista: a.badge,
        nomeAutista: a.nome || "",
        timestamp: mezzoLocal?.timestamp || Date.now(),
      };
    }

    // per la tab selezionata, serve che esista il mezzo relativo
    if (modalita === "rimorchio" && !trovata?.targaRimorchio) {
      setSessione(null);
      return;
    }
    if (modalita === "motrice" && !trovata?.targaMotrice) {
      setSessione(null);
      return;
    }

    setSessione(trovata);
  }

  function toggle(path: string) {
    setCondizioni((prev) => {
      const copy = structuredClone(prev) as any;
      const [group, key] = path.split(".");
      copy[group][key] = !copy[group][key];
      return copy;
    });
  }

  async function conferma() {
    setErrore("");

    const a: any = getAutistaLocal();
    const mezzoLocal: any = getMezzoLocal();

    if (!a?.badge) {
      setErrore("Autista non valido. Fai login.");
      return;
    }

    // sessione coerente: preferisci quella calcolata
    const cur: SessioneAttiva = sessione || {
      targaMotrice: mezzoLocal?.targaCamion || null,
      targaRimorchio: mezzoLocal?.targaRimorchio || null,
      badgeAutista: a.badge,
      nomeAutista: a.nome || "",
      timestamp: mezzoLocal?.timestamp || Date.now(),
    };

    if (modalita === "rimorchio" && !cur.targaRimorchio) {
      setErrore("Nessun rimorchio agganciato");
      return;
    }
    if (modalita === "motrice" && !cur.targaMotrice) {
      setErrore("Nessuna motrice attiva");
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
    const luogoFinale = luogo === "ALTRO" ? luogoAltro.trim() : luogo;

    // =======================
    // SGANCIO RIMORCHIO
    // =======================
    if (modalita === "rimorchio" && cur.targaRimorchio) {
      const storicoRaw = (await getItemSync(STORICO_RIMORCHI_KEY)) || [];
      const storico = Array.isArray(storicoRaw) ? storicoRaw : [];

      storico.push({
        targaRimorchio: cur.targaRimorchio,
        autista: cur.nomeAutista,
        badgeAutista: cur.badgeAutista,
        luogo: luogoFinale,
        statoCarico,
        condizioni,
        timestampAggancio: cur.timestamp,
        timestampSgancio: now,
      });

      await setItemSync(STORICO_RIMORCHI_KEY, storico);

      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "SGANCIO_RIMORCHIO",
        autistaNome: cur.nomeAutista,
        badgeAutista: cur.badgeAutista,
        targaMotrice: cur.targaMotrice || null,
        targaRimorchio: cur.targaRimorchio,
        luogo: luogoFinale,
        statoCarico,
        condizioni,
        timestamp: now,
        createdAt: serverTimestamp(),
      });

      // aggiorna sessioni attive: rimorchio -> null
      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const aggiornate = sessioni.map((s) => {
        if (s.badgeAutista !== cur.badgeAutista) return s;
        return { ...s, targaRimorchio: null };
      });
      await setItemSync(SESSIONI_KEY, aggiornate);

      // aggiorna locale: mantieni motrice, azzera rimorchio
      saveMezzoLocal({
        targaCamion: cur.targaMotrice,
        targaRimorchio: null,
        timestamp: now,
      });

      // compat: aggiorna anche la chiave sync (non usarla per gating)
      await setItemSync(MEZZO_SYNC_KEY, {
        targaCamion: cur.targaMotrice,
        targaRimorchio: null,
        timestamp: now,
      });

      // vai a setup SOLO rimorchio (motrice bloccata)
      navigate("/autisti/setup-mezzo?mode=rimorchio", { replace: true });
      return;
    }

    // =======================
    // CAMBIO MOTRICE
    // =======================
    if (modalita === "motrice" && cur.targaMotrice) {
      const storicoRaw = (await getItemSync(STORICO_MOTRICI_KEY)) || [];
      const storico = Array.isArray(storicoRaw) ? storicoRaw : [];

      storico.push({
        targaMotrice: cur.targaMotrice,
        autista: cur.nomeAutista,
        badgeAutista: cur.badgeAutista,
        luogo: luogoFinale,
        condizioni: condizioni.generali,
        timestampCambio: now,
      });

      await setItemSync(STORICO_MOTRICI_KEY, storico);

      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "CAMBIO_MOTRICE",
        autistaNome: cur.nomeAutista,
        badgeAutista: cur.badgeAutista,
        targaMotrice: cur.targaMotrice,
        luogo: luogoFinale,
        condizioni: condizioni.generali,
        timestamp: now,
        createdAt: serverTimestamp(),
      });

      // aggiorna sessioni attive: motrice -> null (rimorchio lo lasciamo invariato)
      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const aggiornate = sessioni.map((s) => {
        if (s.badgeAutista !== cur.badgeAutista) return s;
        return { ...s, targaMotrice: null };
      });
      await setItemSync(SESSIONI_KEY, aggiornate);

      // aggiorna locale: azzera motrice, rimorchio resta com’è
      saveMezzoLocal({
        targaCamion: null,
        targaRimorchio: cur.targaRimorchio || null,
        timestamp: now,
      });

      await setItemSync(MEZZO_SYNC_KEY, {
        targaCamion: null,
        targaRimorchio: cur.targaRimorchio || null,
        timestamp: now,
      });

      // vai a setup motrice (scelta completa)
      navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
      return;
    }

    setErrore("Operazione non valida");
  }

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
          <div className="cm-targa">
            {modalita === "rimorchio" ? sessione.targaRimorchio : sessione.targaMotrice}
          </div>

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
