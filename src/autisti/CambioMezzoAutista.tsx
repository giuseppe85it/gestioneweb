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
    <div className="cm-container">
      <h1>{titolo}</h1>
      {sessione && (
        <div className="cm-subtitle">
          Attuale:{" "}
          {modalita === "rimorchio"
            ? sessione.targaRimorchio || "NESSUN RIMORCHIO"
            : sessione.targaMotrice || "NESSUNA MOTRICE"}
        </div>
      )}

      <div className="cm-switch">
        <button
          className={modalita === "rimorchio" ? "active" : ""}
          onClick={() => setModalita("rimorchio")}
          type="button"
        >
          RIMORCHIO
        </button>
        <button
          className={modalita === "motrice" ? "active" : ""}
          onClick={() => setModalita("motrice")}
          type="button"
        >
          MOTRICE
        </button>
      </div>

      <div className="cm-subtitle">Luogo</div>
      <div className="cm-switch cm-luoghi">
        {(["MEV", "CANTIERE", "ALTRO"] as Luogo[]).map((l) => (
          <button
            key={l}
            className={luogo === l ? "active" : ""}
            onClick={() => setLuogo(l)}
            type="button"
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
          placeholder="Specifica luogo"
        />
      )}

      {modalita === "rimorchio" && (
        <>
          <div className="cm-subtitle" style={{ marginTop: 16 }}>
            Stato carico
          </div>
          <div className="cm-switch">
            {(["PIENO", "PARZIALE", "VUOTO"] as StatoCarico[]).map((s) => (
              <button
                key={s}
                className={statoCarico === s ? "active" : ""}
                onClick={() => setStatoCarico(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="cm-subtitle" style={{ marginTop: 18 }}>
        Condizioni generali
      </div>
      <div className="cm-checklist">
        <label className="cm-check">
          <input
            type="checkbox"
            checked={condizioni.generali.freni}
            onChange={() => toggle("generali.freni")}
          />
          FRENI OK
        </label>
        <label className="cm-check">
          <input
            type="checkbox"
            checked={condizioni.generali.gomme}
            onChange={() => toggle("generali.gomme")}
          />
          GOMME OK
        </label>
        <label className="cm-check">
          <input
            type="checkbox"
            checked={condizioni.generali.perdite}
            onChange={() => toggle("generali.perdite")}
          />
          NESSUNA PERDITA
        </label>
      </div>

      {modalita === "rimorchio" && (
        <>
          <div className="cm-subtitle" style={{ marginTop: 18 }}>
            Condizioni specifiche
          </div>
          <div className="cm-checklist">
            <label className="cm-check">
              <input
                type="checkbox"
                checked={condizioni.specifiche.botole}
                onChange={() => toggle("specifiche.botole")}
              />
              BOTOLE OK
            </label>
            <label className="cm-check">
              <input
                type="checkbox"
                checked={condizioni.specifiche.cinghie}
                onChange={() => toggle("specifiche.cinghie")}
              />
              CINGHIE OK
            </label>
            <label className="cm-check">
              <input
                type="checkbox"
                checked={condizioni.specifiche.stecche}
                onChange={() => toggle("specifiche.stecche")}
              />
              STECCHE OK
            </label>
            <label className="cm-check">
              <input
                type="checkbox"
                checked={condizioni.specifiche.tubi}
                onChange={() => toggle("specifiche.tubi")}
              />
              TUBI OK
            </label>
          </div>
        </>
      )}

      {errore && <div className="cm-error">{errore}</div>}

      <button className="cm-confirm" onClick={conferma} type="button">
        CONFERMA
      </button>
    </div>
  );

}
