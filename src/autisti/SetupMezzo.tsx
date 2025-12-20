// ======================================================
// SetupMezzo.tsx
// - mode=rimorchio: MOTRICE BLOCCATA, scegli solo rimorchio
// - mode=motrice: RIMORCHIO BLOCCATO, scegli solo motrice
// - mode vuoto: scelta completa
// - conferma -> SEMPRE /autisti/controllo
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SetupMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal, saveMezzoLocal } from "./autistiStorage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const MEZZO_SYNC_KEY = "@mezzo_attivo_autista";

const MOTRICI = ["motrice 2 assi", "motrice 3 assi", "motrice 4 assi", "trattore stradale"];
const RIMORCHI = ["semirimorchio asse fisso", "semirimorchio asse sterzante", "pianale", "biga", "centina", "vasca"];

interface Mezzo {
  id: string;
  targa: string;
  categoria: string;
  autistaNome?: string;
}

interface SessioneAttiva {
  targaMotrice: string | null;
  targaRimorchio: string | null;
  badgeAutista: string;
  nomeAutista: string;
  timestamp: number;
}

const norm = (v?: string) => (v || "").trim().toLowerCase();
const fmtTarga = (t: string) => t.replace(/([A-Z]{2})(\d+)/, "$1 $2");

export default function SetupMezzo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = (searchParams.get("mode") || "").toLowerCase(); // "rimorchio" | "motrice" | ""
  const lockMotrice = mode === "rimorchio";
  const lockRimorchio = mode === "motrice";

  const [motriciAll, setMotriciAll] = useState<Mezzo[]>([]);
  const [rimorchiAll, setRimorchiAll] = useState<Mezzo[]>([]);
  const [sessioni, setSessioni] = useState<SessioneAttiva[]>([]);

  const [targaCamion, setTargaCamion] = useState<string | null>(null);
  const [targaRimorchio, setTargaRimorchio] = useState<string | null>(null);
  const [errore, setErrore] = useState("");

  const autista: any = useMemo(() => getAutistaLocal(), []);
  const mezzoLocal: any = useMemo(() => getMezzoLocal(), []);

  useEffect(() => {
    if (!autista?.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const mezzi: Mezzo[] = (await getItemSync(MEZZI_KEY)) || [];
    const sess: SessioneAttiva[] = (await getItemSync(SESSIONI_KEY)) || [];
    setSessioni(Array.isArray(sess) ? sess : []);

    const mot = mezzi.filter((m) => MOTRICI.includes(norm(m.categoria)));
    const rim = mezzi.filter((m) => RIMORCHI.includes(norm(m.categoria)));

    // Preselezioni: preferisci locale (coerenza per-dispositivo)
    const preMotrice = mezzoLocal?.targaCamion || null;
    const preRimorchio = mezzoLocal?.targaRimorchio || null;

    // ----------------------------
    // MOTRICE
    // ----------------------------
    if (lockMotrice) {
      // Cambio RIMORCHIO: motrice bloccata
      if (!preMotrice) {
        navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
        return;
      }
      setTargaCamion(preMotrice);

      const attuale = mot.find((x) => x.targa === preMotrice);
      setMotriciAll(attuale ? [attuale] : []);
    } else {
      // scelta completa o cambio motrice: lista intera
      setMotriciAll(mot);

      if (!preMotrice && autista?.nome) {
        const motAssegnata = mot.find((m) => norm(m.autistaNome) === norm(autista.nome));
        if (motAssegnata) setTargaCamion(motAssegnata.targa);
        else setTargaCamion(null);
      } else {
        setTargaCamion(preMotrice);
      }
    }

    // ----------------------------
    // RIMORCHI
    // ----------------------------
    setRimorchiAll(rim);

    if (lockRimorchio) {
      // Cambio MOTRICE: rimorchio bloccato com’è (anche null)
      setTargaRimorchio(preRimorchio);
    } else {
      // setup normale / cambio rimorchio: rimorchio selezionabile
      if (preRimorchio) {
        setTargaRimorchio(preRimorchio);
      } else if (autista?.nome) {
        const rimAssegnato = rim.find((m) => norm(m.autistaNome) === norm(autista.nome));
        if (rimAssegnato) setTargaRimorchio(rimAssegnato.targa);
        else setTargaRimorchio(null);
      } else {
        setTargaRimorchio(null);
      }
    }
  }

  function statoUso(targa: string) {
    const s = sessioni.find((x) => x.targaMotrice === targa || x.targaRimorchio === targa);
    if (!s) return null;
    if (s.badgeAutista === autista?.badge) return null;
    return `IN USO da ${s.nomeAutista}`;
  }

  async function handleConfirm() {
    setErrore("");

    if (!autista?.badge || !autista?.nome) {
      setErrore("Autista non valido. Fai login.");
      return;
    }

    if (!targaCamion) {
      setErrore("Seleziona una motrice o trattore");
      return;
    }

    const now = Date.now();

    const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
    const prev: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];

    const nuove = prev.filter((s) => s.badgeAutista !== autista.badge);

    const sessione: SessioneAttiva = {
      targaMotrice: targaCamion,
      targaRimorchio: targaRimorchio || null,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      timestamp: now,
    };

    nuove.push(sessione);
    await setItemSync(SESSIONI_KEY, nuove);

    // compat: aggiorna anche la chiave sync (non usarla per gating)
    await setItemSync(MEZZO_SYNC_KEY, {
      targaCamion,
      targaRimorchio: targaRimorchio || null,
      timestamp: now,
    });

    // locale per dispositivo
    saveMezzoLocal({
      targaCamion,
      targaRimorchio: targaRimorchio || null,
      timestamp: now,
    });

    // evento aggancio rimorchio (solo se selezionato)
    if (targaRimorchio) {
      await addDoc(collection(db, "autisti_eventi"), {
        tipo: "AGGANCIO_RIMORCHIO",
        autistaNome: autista.nome,
        badgeAutista: autista.badge,
        targaMotrice: targaCamion,
        targaRimorchio,
        timestamp: now,
        createdAt: serverTimestamp(),
      });
    }
    

    const target =
      mode === "rimorchio"
        ? "rimorchio"
        : mode === "motrice"
        ? "motrice"
        : targaRimorchio
        ? "entrambi"
        : "motrice";

    navigate(`/autisti/controllo?target=${encodeURIComponent(target)}`, { replace: true });
  }


  

  return (
    <div className="setup-container">
      <h1 className="setup-title">Selezione Mezzo</h1>

      <h2 className="setup-subtitle">Motrice / Trattore</h2>

      {lockMotrice && (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Motrice bloccata: stai facendo CAMBIO RIMORCHIO
        </div>
      )}

      <div className="targhe-list">
        {motriciAll.map((m) => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaCamion === m.targa ? "selected" : ""} ${warn ? "warn" : ""}`}
              onClick={() => {
                if (!lockMotrice) setTargaCamion(m.targa);
              }}
              style={lockMotrice ? { cursor: "default", opacity: 0.85 } : undefined}
            >
              <div className="targa-text">{fmtTarga(m.targa)}</div>
              {m.autistaNome && <div className="targa-note">Autista abituale: {m.autistaNome}</div>}
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      <h2 className="setup-subtitle">Rimorchio (opzionale)</h2>

      {lockRimorchio && (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Rimorchio bloccato: stai facendo CAMBIO MOTRICE
        </div>
      )}

      <div className="targhe-list">
        <div
          className={`targa-card ${!targaRimorchio ? "selected" : ""}`}
          onClick={() => {
            if (!lockRimorchio) setTargaRimorchio(null);
          }}
          style={lockRimorchio ? { cursor: "default", opacity: 0.7 } : undefined}
        >
          <div className="targa-text">NESSUN RIMORCHIO</div>
        </div>

        {rimorchiAll.map((m) => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaRimorchio === m.targa ? "selected" : ""} ${warn ? "warn" : ""}`}
              onClick={() => {
                if (!lockRimorchio) setTargaRimorchio(m.targa);
              }}
              style={lockRimorchio ? { cursor: "default", opacity: 0.7 } : undefined}
            >
              <div className="targa-text">{fmtTarga(m.targa)}</div>
              {m.autistaNome && <div className="targa-note">Autista abituale: {m.autistaNome}</div>}
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      {errore && <div className="setup-error">{errore}</div>}

      <button className="setup-confirm" onClick={handleConfirm}>
        CONFERMA MEZZO
      </button>
    </div>
  );
}
