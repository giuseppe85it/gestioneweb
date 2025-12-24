// src/autisti/SetupMezzo.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./autisti.css";
import "./SetupMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAutistaLocal, getMezzoLocal, saveMezzoLocal } from "./autistiStorage";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const MEZZO_SYNC_KEY = "@mezzo_attivo_autista";
const STORICO_RIMORCHI_KEY = "@storico_sganci_rimorchi";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";

type Mode = "rimorchio" | "motrice" | "none";

type MezzoCategoria =
  | "motrice 2 assi"
  | "motrice 3 assi"
  | "motrice 4 assi"
  | "trattore stradale"
  | "semirimorchio asse fisso"
  | "semirimorchio asse sterzante"
  | "pianale"
  | "biga"
  | "centina"
  | "vasca"
  | string;

interface Mezzo {
  id: string;
  targa: string;
  categoria?: MezzoCategoria;
  autistaNome?: string | null;
}

interface SessioneAttiva {
  targaMotrice: string | null;
  targaRimorchio: string | null;
  badgeAutista: string;
  nomeAutista: string;
  timestamp: number;
}

type EventoOperativo = {
  id: string;
  tipo: string;
  timestamp: number;
  badgeAutista: string;
  nomeAutista: string;
  autistaNome?: string;
  prima: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  dopo: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  luogo: string | null;
  statoCarico: string | null;
  condizioni: any;
  source: string;
};

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

const fmtTarga = (t: string) => (t || "").trim().toUpperCase();

function genId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function appendEventoOperativo(evt: EventoOperativo) {
  const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
  const list: EventoOperativo[] = Array.isArray(raw) ? raw : [];
  if (list.some((e) => e?.id === evt.id)) return;
  list.push(evt);
  await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, list);
}

export default function SetupMezzo() {
  const nav = useNavigate();
  const loc = useLocation();

  const qs = new URLSearchParams(loc.search);
  const mode = (qs.get("mode") as Mode) || "none";

  const autista = useMemo(() => {
    const a: any = getAutistaLocal();
    if (!a?.badge || !a?.nome) return null;
    return { badge: String(a.badge), nome: String(a.nome) };
  }, []);

  const mezzoLocal = useMemo(() => {
    const m: any = getMezzoLocal();
    if (!m) return null;
    return {
      targaCamion: m?.targaCamion ? String(m.targaCamion) : null,
      targaRimorchio: m?.targaRimorchio ? String(m.targaRimorchio) : null,
      timestamp: typeof m?.timestamp === "number" ? m.timestamp : null,
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");

  const [mezziAll, setMezziAll] = useState<Mezzo[]>([]);
  const [sessioni, setSessioni] = useState<SessioneAttiva[]>([]);

  const [targaCamion, setTargaCamion] = useState("");
  const [targaRimorchio, setTargaRimorchio] = useState<string | null>(null);

  const lockMotrice = mode === "rimorchio";
  const lockRimorchio = mode === "motrice";

  const motriciAll = useMemo(() => {
    return mezziAll.filter((m) => {
      const cat = norm(String(m.categoria || ""));
      return cat.includes("motrice") || cat.includes("trattore");
    });
  }, [mezziAll]);

  const rimorchiAll = useMemo(() => {
    return mezziAll.filter((m) => {
      const cat = norm(String(m.categoria || ""));
      return (
        cat.includes("semirimorchio") ||
        cat.includes("rimorchio") ||
        cat.includes("pianale") ||
        cat.includes("biga") ||
        cat.includes("centina") ||
        cat.includes("vasca")
      );
    });
  }, [mezziAll]);

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        setLoading(true);
        setErrore("");

        if (!autista?.badge) {
          setErrore("Autista non valido. Fai login.");
          return;
        }

        const rawMezzi = (await getItemSync(MEZZI_KEY)) || [];
        const mezzi: Mezzo[] = Array.isArray(rawMezzi) ? rawMezzi : [];
        const fixed = mezzi.map((m: any) => ({
          id: String(m?.id ?? ""),
          targa: fmtTarga(String(m?.targa ?? "")),
          categoria: m?.categoria,
          autistaNome: m?.autistaNome ?? null,
        }));
        if (!alive) return;
        setMezziAll(fixed);

        const rawSess = (await getItemSync(SESSIONI_KEY)) || [];
        const sessArr: SessioneAttiva[] = Array.isArray(rawSess) ? rawSess : [];
        if (!alive) return;
        setSessioni(sessArr);

        // preselect coerente
        const preCamion = fmtTarga(
          (mode === "rimorchio" ? mezzoLocal?.targaCamion : mezzoLocal?.targaCamion) || ""
        );
        const preRimorchio = fmtTarga(mezzoLocal?.targaRimorchio || "");

        if (preCamion) setTargaCamion(preCamion);

        if (lockRimorchio) {
          // cambio motrice: rimorchio bloccato sul locale se c'è
          setTargaRimorchio(preRimorchio || null);
        } else {
          // setup normale / cambio rimorchio: rimorchio selezionabile
          if (preRimorchio) {
            setTargaRimorchio(preRimorchio);
          } else if (autista?.nome) {
            const rimAssegnato = fixed
              .filter((m) => rimorchiAll.some((r) => r.targa === m.targa))
              .find((m) => norm(String(m.autistaNome || "")) === norm(autista.nome));
            if (rimAssegnato) setTargaRimorchio(rimAssegnato.targa);
            else setTargaRimorchio(null);
          } else {
            setTargaRimorchio(null);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    init();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const prevSession = prev.find((s) => s.badgeAutista === autista.badge) || null;

    const prima = {
      targaMotrice:
        prevSession?.targaMotrice ??
        (mezzoLocal?.targaCamion ? String(mezzoLocal.targaCamion) : null),
      targaRimorchio:
        prevSession?.targaRimorchio ??
        (mezzoLocal?.targaRimorchio ? String(mezzoLocal.targaRimorchio) : null),
    };

    const dopo = {
      targaMotrice: targaCamion ? String(targaCamion) : null,
      targaRimorchio: targaRimorchio ? String(targaRimorchio) : null,
    };

    const sessione: SessioneAttiva = {
      targaMotrice: targaCamion,
      targaRimorchio: targaRimorchio || null,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      timestamp: now,
    };

    const eventoCambioMezzo: EventoOperativo = {
      id: `CAMBIO_MEZZO-${autista.badge}-${now}-${dopo.targaMotrice || ""}-${dopo.targaRimorchio || ""}`,
      tipo: "CAMBIO_MEZZO",
      timestamp: now,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      autistaNome: autista.nome,
      prima: {
        targaMotrice: prima.targaMotrice,
        targaRimorchio: prima.targaRimorchio,
        motrice: prima.targaMotrice,
        rimorchio: prima.targaRimorchio,
      },
      dopo: {
        targaMotrice: dopo.targaMotrice,
        targaRimorchio: dopo.targaRimorchio,
        motrice: dopo.targaMotrice,
        rimorchio: dopo.targaRimorchio,
      },
      luogo: null,
      statoCarico: null,
      condizioni: null,
      source: "setup_confirm",
    };
    await appendEventoOperativo(eventoCambioMezzo);

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

    // storico aggancio rimorchio (serve per la visualizzazione admin "Agganci Rimorchi")
    // - crea SOLO su aggancio reale
    // - evita duplicati se rimorchio già uguale a quello precedente
    const prevRimorchio = (mezzoLocal?.targaRimorchio ?? null) as string | null;
    if (targaRimorchio && targaRimorchio !== prevRimorchio) {
      const storicoRaw = await getItemSync(STORICO_RIMORCHI_KEY);
      const storico = Array.isArray(storicoRaw) ? storicoRaw : [];
      storico.push({
        id: genId(),
        targaRimorchio,
        targaMotrice: targaCamion || null,
        autista: autista.nome || null,
        badgeAutista: autista.badge || null,
        timestampAggancio: now,
        timestampSgancio: null,
        luogo: null,
        statoCarico: null,
        condizioni: null,
      });
      await setItemSync(STORICO_RIMORCHI_KEY, storico);
    }

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

    const baseEvento = {
      timestamp: now,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      prima,
      dopo,
      luogo: null,
      statoCarico: null,
      condizioni: null,
      source: "SetupMezzo",
    };

    const eventiOperativi: EventoOperativo[] = [];
    if (!prima.targaMotrice && dopo.targaMotrice) {
      const tipo = "SETUP_INIZIALE";
      eventiOperativi.push({
        id: `${tipo}-${autista.badge}-${now}-${dopo.targaMotrice || ""}-${dopo.targaRimorchio || ""}`,
        tipo,
        ...baseEvento,
      });
    }
    if (prima.targaMotrice !== dopo.targaMotrice) {
      const tipo = "AGGANCIO_MOTRICE";
      eventiOperativi.push({
        id: `${tipo}-${autista.badge}-${now}-${dopo.targaMotrice || ""}-${dopo.targaRimorchio || ""}`,
        tipo,
        ...baseEvento,
      });
    }
    if (dopo.targaRimorchio && prima.targaRimorchio !== dopo.targaRimorchio) {
      const tipo = "AGGANCIO_RIMORCHIO";
      eventiOperativi.push({
        id: `${tipo}-${autista.badge}-${now}-${dopo.targaMotrice || ""}-${dopo.targaRimorchio || ""}`,
        tipo,
        ...baseEvento,
      });
    }

    for (const evt of eventiOperativi) {
      await appendEventoOperativo(evt);
    }

    const target =
      mode === "rimorchio"
        ? "rimorchio"
        : mode === "motrice"
        ? "motrice"
        : targaRimorchio
        ? "entrambi"
        : "motrice";

    nav(`/autisti/controllo?target=${encodeURIComponent(target)}`, { replace: true });
  }

  if (loading) {
    return (
      <div className="setup-container">
        <div className="setup-card">Caricamento...</div>
      </div>
    );
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
              className={`targa-card ${targaCamion === m.targa ? "selected" : ""} ${
                warn ? "warn" : ""
              }`}
              onClick={() => {
                if (!lockMotrice) setTargaCamion(m.targa);
              }}
              style={lockMotrice ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warn ?? undefined}
            >
              <div className="targa-text">{m.targa}</div>
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      <h2 className="setup-subtitle" style={{ marginTop: 18 }}>
        Rimorchio / Semirimorchio (opzionale)
      </h2>

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
          style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
        >
          <div className="targa-text">NESSUN RIMORCHIO</div>
        </div>

        {rimorchiAll.map((m) => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaRimorchio === m.targa ? "selected" : ""} ${
                warn ? "warn" : ""
              }`}
              onClick={() => {
                if (!lockRimorchio) setTargaRimorchio(m.targa);
              }}
              style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warn ?? undefined}
            >
              <div className="targa-text">{m.targa}</div>
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      {errore && <div className="setup-error">{errore}</div>}

      <div className="setup-actions">
        <button className="setup-btn" onClick={handleConfirm}>
          CONFERMA
        </button>
      </div>
    </div>
  );
}
