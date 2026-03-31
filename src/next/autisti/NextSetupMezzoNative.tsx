/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import "../../autisti/SetupMezzo.css";
import { getItemSync } from "./nextAutistiStorageSync";
import { NEXT_AUTISTI_BASE_PATH } from "./nextAutistiCloneRuntime";
import {
  getAutistaLocal,
  getMezzoLocal,
  saveMezzoLocal,
} from "./nextAutistiSessionStorage";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";

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

function norm(value: string) {
  return (value || "").trim().toLowerCase();
}

function fmtTarga(value: string) {
  return (value || "").trim().toUpperCase();
}

function fmtText(value: unknown) {
  return String(value ?? "").trim();
}

function getCategoriaLabel(mezzo: Mezzo) {
  return fmtText(mezzo?.categoria) || "-";
}

function getAutistaSolito(mezzo: Mezzo) {
  return fmtText(mezzo?.autistaNome) || "-";
}

export default function SetupMezzo() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = (params.get("mode") as Mode) || "none";

  const autista = useMemo(() => {
    const current: any = getAutistaLocal();
    if (!current?.badge || !current?.nome) {
      return null;
    }

    return {
      badge: String(current.badge),
      nome: String(current.nome),
    };
  }, []);

  const mezzoLocale = useMemo(() => {
    const current: any = getMezzoLocal();
    if (!current) {
      return null;
    }

    return {
      targaCamion: current?.targaCamion ? String(current.targaCamion) : null,
      targaCamionPrima: current?.targaCamionPrima ? String(current.targaCamionPrima) : null,
      targaRimorchio: current?.targaRimorchio ? String(current.targaRimorchio) : null,
      timestamp: typeof current?.timestamp === "number" ? current.timestamp : null,
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [mezziAll, setMezziAll] = useState<Mezzo[]>([]);
  const [sessioni, setSessioni] = useState<SessioneAttiva[]>([]);
  const [sessioneAttiva, setSessioneAttiva] = useState<SessioneAttiva | null>(null);
  const [targaCamion, setTargaCamion] = useState("");
  const [targaRimorchio, setTargaRimorchio] = useState<string | null>(null);

  const lockMotrice = mode === "rimorchio" && !!mezzoLocale?.targaCamion;
  const lockRimorchio = mode === "motrice" && !!mezzoLocale?.targaRimorchio;

  const motriciAll = useMemo(() => {
    return mezziAll.filter((mezzo) => {
      const categoria = norm(String(mezzo.categoria || ""));
      return categoria.includes("motrice") || categoria.includes("trattore");
    });
  }, [mezziAll]);

  const rimorchiAll = useMemo(() => {
    return mezziAll.filter((mezzo) => {
      const categoria = norm(String(mezzo.categoria || ""));
      return (
        categoria.includes("semirimorchio")
        || categoria.includes("rimorchio")
        || categoria.includes("porta silo container")
        || categoria.includes("pianale")
        || categoria.includes("biga")
        || categoria.includes("centina")
        || categoria.includes("vasca")
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
        const mezzi = Array.isArray(rawMezzi)
          ? rawMezzi.map((item: any) => ({
              id: String(item?.id ?? ""),
              targa: fmtTarga(String(item?.targa ?? "")),
              categoria: item?.categoria,
              autistaNome: item?.autistaNome ?? null,
            }))
          : [];
        const rawSessioni = (await getItemSync(SESSIONI_KEY)) || [];
        const liveSessioni = Array.isArray(rawSessioni) ? rawSessioni : [];
        const currentSession =
          liveSessioni.find((item: SessioneAttiva) => item?.badgeAutista === autista.badge) || null;

        if (!alive) {
          return;
        }

        setMezziAll(mezzi);
        setSessioni(liveSessioni);
        setSessioneAttiva(currentSession);

        const motricePredefinita = fmtTarga(
          currentSession?.targaMotrice
            || mezzoLocale?.targaCamion
            || mezzoLocale?.targaCamionPrima
            || "",
        );
        const rimorchioPredefinito = fmtTarga(
          currentSession?.targaRimorchio || mezzoLocale?.targaRimorchio || "",
        );

        if (motricePredefinita) {
          setTargaCamion(motricePredefinita);
        }
        if (rimorchioPredefinito) {
          setTargaRimorchio(rimorchioPredefinito);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      alive = false;
    };
  }, [autista?.badge, mezzoLocale?.targaCamion, mezzoLocale?.targaCamionPrima, mezzoLocale?.targaRimorchio]);

  function statoUso(targa: string) {
    const sessione = sessioni.find(
      (item) => item.targaMotrice === targa || item.targaRimorchio === targa,
    );
    if (!sessione) {
      return null;
    }
    if (sessione.badgeAutista === autista?.badge) {
      return null;
    }
    return `IN USO da ${sessione.nomeAutista}`;
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

    if (!sessioneAttiva?.targaMotrice) {
      setErrore(
        "Clone NEXT in sola lettura: l'assetto si legge solo da una sessione madre gia attiva.",
      );
      return;
    }

    const motriceSelezionata = fmtTarga(targaCamion);
    const rimorchioSelezionato = targaRimorchio ? fmtTarga(targaRimorchio) : null;
    const motriceMadre = fmtTarga(sessioneAttiva.targaMotrice || "");
    const rimorchioMadre = sessioneAttiva.targaRimorchio
      ? fmtTarga(sessioneAttiva.targaRimorchio)
      : null;

    if (motriceSelezionata !== motriceMadre || rimorchioSelezionato !== rimorchioMadre) {
      setErrore(
        "Clone NEXT in sola lettura: l'assetto visibile resta quello gia presente nella sessione madre.",
      );
      return;
    }

    saveMezzoLocal({
      targaCamion: motriceMadre,
      targaCamionPrima: null,
      targaRimorchio: rimorchioMadre,
      timestamp: sessioneAttiva.timestamp || Date.now(),
    });

    navigate(NEXT_AUTISTI_BASE_PATH, { replace: true });
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

      {lockMotrice ? (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Motrice bloccata: stai facendo CAMBIO RIMORCHIO
        </div>
      ) : null}

      <div className="targhe-list">
        {motriciAll.map((mezzo) => {
          const warning = statoUso(mezzo.targa);
          return (
            <div
              key={mezzo.id}
              className={`targa-card ${targaCamion === mezzo.targa ? "selected" : ""} ${
                warning ? "warn" : ""
              }`}
              onClick={() => {
                if (!lockMotrice) {
                  setTargaCamion(mezzo.targa);
                }
              }}
              style={lockMotrice ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warning ?? undefined}
            >
              <div className="targa-text">{mezzo.targa}</div>
              <div className="mezzo-meta">
                <span className="mezzo-badge">{getCategoriaLabel(mezzo)}</span>
                <span className="mezzo-autista">
                  Autista solito: {getAutistaSolito(mezzo)}
                </span>
              </div>
              {warning ? <div className="targa-warn">{warning}</div> : null}
            </div>
          );
        })}
      </div>

      <h2 className="setup-subtitle" style={{ marginTop: 18 }}>
        Rimorchio / Semirimorchio (opzionale)
      </h2>

      {lockRimorchio ? (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Rimorchio bloccato: stai facendo CAMBIO MOTRICE
        </div>
      ) : null}

      <div className="targhe-list">
        <div
          className={`targa-card ${!targaRimorchio ? "selected" : ""}`}
          onClick={() => {
            if (!lockRimorchio) {
              setTargaRimorchio(null);
            }
          }}
          style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
        >
          <div className="targa-text">NESSUN RIMORCHIO</div>
          <div className="mezzo-meta">
            <span className="mezzo-badge">-</span>
            <span className="mezzo-autista">Autista solito: -</span>
          </div>
        </div>

        {rimorchiAll.map((mezzo) => {
          const warning = statoUso(mezzo.targa);
          return (
            <div
              key={mezzo.id}
              className={`targa-card ${targaRimorchio === mezzo.targa ? "selected" : ""} ${
                warning ? "warn" : ""
              }`}
              onClick={() => {
                if (!lockRimorchio) {
                  setTargaRimorchio(mezzo.targa);
                }
              }}
              style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warning ?? undefined}
            >
              <div className="targa-text">{mezzo.targa}</div>
              <div className="mezzo-meta">
                <span className="mezzo-badge">{getCategoriaLabel(mezzo)}</span>
                <span className="mezzo-autista">
                  Autista solito: {getAutistaSolito(mezzo)}
                </span>
              </div>
              {warning ? <div className="targa-warn">{warning}</div> : null}
            </div>
          );
        })}
      </div>

      {errore ? <div className="setup-error">{errore}</div> : null}

      <div className="setup-actions">
        <button className="setup-confirm" onClick={handleConfirm}>
          CONFERMA
        </button>
      </div>
    </div>
  );
}
