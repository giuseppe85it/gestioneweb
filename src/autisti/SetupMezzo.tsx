// ======================================================
// SetupMezzo.tsx — DEFINITIVO
// - categorie REALI da Firestore (categoria)
// - separazione MOTRICI / RIMORCHI
// - preselezione solo coerente
// - BLOCCO MORBIDO (solo avviso)
// - scrittura sessione in @autisti_sessione_attive
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SetupMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { saveMezzoLocal } from "./autistiStorage";

const MEZZI_KEY = "@mezzi_aziendali";
const AUTISTA_KEY = "@autista_attivo";
const SESSIONI_KEY = "@autisti_sessione_attive";

// CATEGORIE REALI (contratto dati)
const MOTRICI = [
  "motrice 2 assi",
  "motrice 3 assi",
  "motrice 4 assi",
  "trattore stradale",
];

const RIMORCHI = [
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
  "pianale",
  "biga",
  "centina",
  "vasca",
];

interface Mezzo {
  id: string;
  targa: string;
  categoria: string;
  autistaNome?: string;
}

interface SessioneAttiva {
  targa: string;
  badgeAutista: string;
  nomeAutista: string;
  tipo: "motrice" | "rimorchio";
  timestamp: number;
}

const norm = (v?: string) => (v || "").trim().toLowerCase();
const fmtTarga = (t: string) => t.replace(/([A-Z]{2})(\d+)/, "$1 $2");

export default function SetupMezzo() {
  const navigate = useNavigate();

  const [motrici, setMotrici] = useState<Mezzo[]>([]);
  const [rimorchi, setRimorchi] = useState<Mezzo[]>([]);
  const [sessioni, setSessioni] = useState<SessioneAttiva[]>([]);

  const [targaCamion, setTargaCamion] = useState<string | null>(null);
  const [targaRimorchio, setTargaRimorchio] = useState<string | null>(null);
  const [errore, setErrore] = useState("");

  const [autista, setAutista] = useState<{ badge: string; nome: string } | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const a = await getItemSync(AUTISTA_KEY);
    setAutista(a);

    const mezzi: Mezzo[] = (await getItemSync(MEZZI_KEY)) || [];
    const sess: SessioneAttiva[] = (await getItemSync(SESSIONI_KEY)) || [];
    setSessioni(sess);

    const mot = mezzi.filter(m => MOTRICI.includes(norm(m.categoria)));
    const rim = mezzi.filter(m => RIMORCHI.includes(norm(m.categoria)));

    // preselezione SOLO coerente
    if (a?.nome) {
      const motAssegnata = mot.find(m => norm(m.autistaNome) === norm(a.nome));
      if (motAssegnata) {
        setTargaCamion(motAssegnata.targa);
        setMotrici([motAssegnata, ...mot.filter(x => x.id !== motAssegnata.id)]);
      } else {
        setMotrici(mot);
      }

      const rimAssegnato = rim.find(m => norm(m.autistaNome) === norm(a.nome));
      if (rimAssegnato) {
        setTargaRimorchio(rimAssegnato.targa);
        setRimorchi([rimAssegnato, ...rim.filter(x => x.id !== rimAssegnato.id)]);
      } else {
        setRimorchi(rim);
      }
    } else {
      setMotrici(mot);
      setRimorchi(rim);
    }
  }

  function statoUso(targa: string) {
    const s = sessioni.find(x => x.targa === targa);
    if (!s) return null;
    if (s.badgeAutista === autista?.badge) return null;
    return `IN USO da ${s.nomeAutista}`;
  }

  async function handleConfirm() {
    setErrore("");
    if (!targaCamion) {
      setErrore("Seleziona una motrice o trattore");
      return;
    }

    const now = Date.now();
    let nuove = sessioni.filter(
      s => !(s.badgeAutista === autista?.badge && (s.tipo === "motrice" || s.tipo === "rimorchio"))
    );

    nuove.push({
      targa: targaCamion,
      badgeAutista: autista!.badge,
      nomeAutista: autista!.nome,
      tipo: "motrice",
      timestamp: now,
    });

    if (targaRimorchio) {
      nuove.push({
        targa: targaRimorchio,
        badgeAutista: autista!.badge,
        nomeAutista: autista!.nome,
        tipo: "rimorchio",
        timestamp: now,
      });
    }

    await setItemSync(SESSIONI_KEY, nuove);
    await setItemSync("@mezzo_attivo_autista", {
      targaCamion,
      targaRimorchio,
      timestamp: now,
    });
saveMezzoLocal({
  targaCamion,
  targaRimorchio,
  timestamp: now,
});


    navigate("/autisti/home");
  }

  return (
    <div className="setup-container">
      <h1 className="setup-title">Selezione Mezzo</h1>

      <h2 className="setup-subtitle">Motrice / Trattore</h2>
      <div className="targhe-list">
        {motrici.map(m => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaCamion === m.targa ? "selected" : ""} ${warn ? "warn" : ""}`}
              onClick={() => setTargaCamion(m.targa)}
            >
              <div className="targa-text">{fmtTarga(m.targa)}</div>
              {m.autistaNome && <div className="targa-note">Autista abituale: {m.autistaNome}</div>}
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      <h2 className="setup-subtitle">Rimorchio (opzionale)</h2>
      <div className="targhe-list">
        <div
          className={`targa-card ${!targaRimorchio ? "selected" : ""}`}
          onClick={() => setTargaRimorchio(null)}
        >
          <div className="targa-text">NESSUN RIMORCHIO</div>
        </div>

        {rimorchi.map(m => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaRimorchio === m.targa ? "selected" : ""} ${warn ? "warn" : ""}`}
              onClick={() => setTargaRimorchio(m.targa)}
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
