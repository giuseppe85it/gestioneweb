// src/autisti/CambioMezzoAutista.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CambioMezzoAutista.css"; 
import { getItemSync, setItemSync } from "../utils/storageSync";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAutistaLocal, getMezzoLocal, saveMezzoLocal } from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";
const MEZZO_SYNC_KEY = "@mezzo_attivo_autista";
const STORICO_RIMORCHI_KEY = "@storico_sganci_rimorchi";
const STORICO_MOTRICI_KEY = "@storico_cambi_motrice";

type Modalita = "motrice" | "rimorchio";

type Luogo = "MEV" | "CANTIERE" | "ALTRO";

type StatoCarico = "PIENO" | "VUOTO" | "PARZIALE";

type Condizioni = {
  generali: {
    freni: boolean;
    gomme: boolean;
    perdite: boolean;
  };
  specifiche: {
    botole: boolean;
    cinghie: boolean;
    stecche: boolean;
    tubi: boolean;
  };
};

interface SessioneAttiva {
  targaMotrice: string | null;
  targaRimorchio: string | null;
  badgeAutista: string;
  nomeAutista: string;
  timestamp: number;
}

function genId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function CambioMezzoAutista() {
  const navigate = useNavigate();

  const [modalita, setModalita] = useState<Modalita>("rimorchio");
  const [errore, setErrore] = useState("");

  const [sessione, setSessione] = useState<SessioneAttiva | null>(null);

  const [luogo, setLuogo] = useState<Luogo | "">("");
  const [luogoAltro, setLuogoAltro] = useState("");

  const [statoCarico, setStatoCarico] = useState<StatoCarico>("VUOTO");

  const [condizioni, setCondizioni] = useState<Condizioni>({
    generali: { freni: true, gomme: true, perdite: true },
    specifiche: { botole: true, cinghie: true, stecche: true, tubi: true },
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      const a: any = getAutistaLocal();
      if (!a?.badge) return;

      const raw = (await getItemSync(SESSIONI_KEY)) || [];
      const arr: SessioneAttiva[] = Array.isArray(raw) ? raw : [];
      const s = arr.find((x) => x.badgeAutista === String(a.badge)) || null;

      if (!alive) return;
      setSessione(s);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const titolo = useMemo(() => {
    return modalita === "rimorchio" ? "Cambio Rimorchio" : "Cambio Motrice";
  }, [modalita]);

  function toggle(path: "generali.freni" | "generali.gomme" | "generali.perdite" | "specifiche.botole" | "specifiche.cinghie" | "specifiche.stecche" | "specifiche.tubi") {
    setCondizioni((prev) => {
      const copy: any = JSON.parse(JSON.stringify(prev));
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

      const nomeAutista =
        ((cur.nomeAutista as any) || (cur as any).autistaNome || (cur as any).nome || "").trim() || null;

      // Chiudi l'ultimo aggancio aperto (timestampSgancio null) per questo rimorchio
      let closed = false;
      for (let i = storico.length - 1; i >= 0; i--) {
        const r: any = storico[i];
        if (r && r.targaRimorchio === cur.targaRimorchio && !r.timestampSgancio) {
          storico[i] = {
            ...r,
            targaMotrice: cur.targaMotrice || r.targaMotrice || null,
            autista: nomeAutista,
            badgeAutista: cur.badgeAutista,
            luogo: luogoFinale,
            statoCarico,
            condizioni,
            timestampSgancio: now,
          };
          closed = true;
          break;
        }
      }

      // Fallback: se non esiste un aggancio aperto, registra SOLO lo sgancio (senza timestampAggancio)
      if (!closed) {
        storico.push({
          id: genId(),
          targaRimorchio: cur.targaRimorchio,
          targaMotrice: cur.targaMotrice || null,
          autista: nomeAutista,
          badgeAutista: cur.badgeAutista,
          luogo: luogoFinale,
          statoCarico,
          condizioni,
          timestampAggancio: null,
          timestampSgancio: now,
        });
      }

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
        id: genId(),
        targaMotrice: cur.targaMotrice,
        autista: (cur.nomeAutista ?? "").trim() || null,
        badgeAutista: cur.badgeAutista,
        luogo: luogoFinale,
        condizioni,
        timestampCambio: now,
      });

      await setItemSync(STORICO_MOTRICI_KEY, storico);

      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "CAMBIO_MOTRICE",
        autistaNome: cur.nomeAutista,
        badgeAutista: cur.badgeAutista,
        targaMotrice: cur.targaMotrice,
        luogo: luogoFinale,
        condizioni,
        timestamp: now,
        createdAt: serverTimestamp(),
      });

      // aggiorna sessioni attive: motrice -> null (rimorchio resta se c'è)
      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const aggiornate = sessioni.map((s) => {
        if (s.badgeAutista !== cur.badgeAutista) return s;
        return { ...s, targaMotrice: null };
      });
      await setItemSync(SESSIONI_KEY, aggiornate);

      // aggiorna locale: azzera motrice, mantieni rimorchio
      saveMezzoLocal({
        targaCamion: null,
        targaRimorchio: cur.targaRimorchio,
        timestamp: now,
      });

      // compat
      await setItemSync(MEZZO_SYNC_KEY, {
        targaCamion: null,
        targaRimorchio: cur.targaRimorchio,
        timestamp: now,
      });

      // vai a setup SOLO motrice (rimorchio bloccato)
      navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
      return;
    }
  }

  return (
    <div className="autisti-page">
      <div className="autisti-card">
        <h1 className="autisti-title">{titolo}</h1>

        <div className="autisti-row">
          <button
            className={`autisti-chip ${modalita === "rimorchio" ? "active" : ""}`}
            onClick={() => setModalita("rimorchio")}
          >
            RIMORCHIO
          </button>
          <button
            className={`autisti-chip ${modalita === "motrice" ? "active" : ""}`}
            onClick={() => setModalita("motrice")}
          >
            MOTRICE
          </button>
        </div>

        <div className="autisti-section">
          <div className="autisti-label">Luogo</div>
          <div className="autisti-row">
            {(["MEV", "CANTIERE", "ALTRO"] as Luogo[]).map((l) => (
              <button
                key={l}
                className={`autisti-chip ${luogo === l ? "active" : ""}`}
                onClick={() => setLuogo(l)}
              >
                {l}
              </button>
            ))}
          </div>
          {luogo === "ALTRO" && (
            <input
              className="autisti-input"
              value={luogoAltro}
              onChange={(e) => setLuogoAltro(e.target.value)}
              placeholder="Specifica luogo"
            />
          )}
        </div>

        {modalita === "rimorchio" && (
          <div className="autisti-section">
            <div className="autisti-label">Stato carico</div>
            <div className="autisti-row">
              {(["PIENO", "PARZIALE", "VUOTO"] as StatoCarico[]).map((s) => (
                <button
                  key={s}
                  className={`autisti-chip ${statoCarico === s ? "active" : ""}`}
                  onClick={() => setStatoCarico(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="autisti-section">
          <div className="autisti-label">Condizioni generali</div>
          <div className="autisti-row autisti-row-wrap">
            <button className={`autisti-chip ${condizioni.generali.freni ? "ok" : "bad"}`} onClick={() => toggle("generali.freni")}>
              FRENI
            </button>
            <button className={`autisti-chip ${condizioni.generali.gomme ? "ok" : "bad"}`} onClick={() => toggle("generali.gomme")}>
              GOMME
            </button>
            <button className={`autisti-chip ${condizioni.generali.perdite ? "ok" : "bad"}`} onClick={() => toggle("generali.perdite")}>
              PERDITE
            </button>
          </div>

          {modalita === "rimorchio" && (
            <>
              <div className="autisti-label" style={{ marginTop: 10 }}>
                Condizioni specifiche
              </div>
              <div className="autisti-row autisti-row-wrap">
                <button className={`autisti-chip ${condizioni.specifiche.botole ? "ok" : "bad"}`} onClick={() => toggle("specifiche.botole")}>
                  BOTOLE
                </button>
                <button className={`autisti-chip ${condizioni.specifiche.cinghie ? "ok" : "bad"}`} onClick={() => toggle("specifiche.cinghie")}>
                  CINGHIE
                </button>
                <button className={`autisti-chip ${condizioni.specifiche.stecche ? "ok" : "bad"}`} onClick={() => toggle("specifiche.stecche")}>
                  STECCHE
                </button>
                <button className={`autisti-chip ${condizioni.specifiche.tubi ? "ok" : "bad"}`} onClick={() => toggle("specifiche.tubi")}>
                  TUBI
                </button>
              </div>
            </>
          )}
        </div>

        {errore && <div className="autisti-error">{errore}</div>}

        <button className="autisti-btn" onClick={conferma}>
          CONFERMA
        </button>
      </div>
    </div>
  );
}
