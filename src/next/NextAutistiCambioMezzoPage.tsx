import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/CambioMezzoAutista.css";
import { getItemSync } from "../utils/storageSync";
import {
  getAutistaLocal,
  getMezzoLocal,
  saveMezzoLocal,
} from "../autisti/autistiStorage";
import {
  NEXT_AUTISTI_BASE_PATH,
  NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM,
} from "./autisti/nextAutistiCloneRuntime";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

type Modalita = "motrice" | "rimorchio";
type Luogo = "MEV" | "STABIO" | "ALTRO";
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

type AutistaLocale = {
  badge?: string | null;
  nome?: string | null;
};

type MezzoLocale = {
  targaCamion?: string | null;
  targaCamionPrima?: string | null;
  targaRimorchio?: string | null;
  timestamp?: number | null;
};

const SESSIONI_KEY = "@autisti_sessione_attive";

export default function NextAutistiCambioMezzoPage() {
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
      const autista = getAutistaLocal() as AutistaLocale | null;
      if (!autista?.badge) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
        return;
      }

      const raw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni = Array.isArray(raw) ? raw : [];
      const match =
        sessioni.find((item) => item?.badgeAutista === String(autista.badge)) || null;

      if (!alive) {
        return;
      }

      setSessione(match);
    }

    load();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const titolo = useMemo(
    () => (modalita === "rimorchio" ? "Cambio Rimorchio" : "Cambio Motrice"),
    [modalita],
  );

  function toggle(
    path:
      | "generali.freni"
      | "generali.gomme"
      | "generali.perdite"
      | "specifiche.botole"
      | "specifiche.cinghie"
      | "specifiche.stecche"
      | "specifiche.tubi",
  ) {
    setCondizioni((prev) => {
      switch (path) {
        case "generali.freni":
          return {
            ...prev,
            generali: { ...prev.generali, freni: !prev.generali.freni },
          };
        case "generali.gomme":
          return {
            ...prev,
            generali: { ...prev.generali, gomme: !prev.generali.gomme },
          };
        case "generali.perdite":
          return {
            ...prev,
            generali: { ...prev.generali, perdite: !prev.generali.perdite },
          };
        case "specifiche.botole":
          return {
            ...prev,
            specifiche: { ...prev.specifiche, botole: !prev.specifiche.botole },
          };
        case "specifiche.cinghie":
          return {
            ...prev,
            specifiche: { ...prev.specifiche, cinghie: !prev.specifiche.cinghie },
          };
        case "specifiche.stecche":
          return {
            ...prev,
            specifiche: { ...prev.specifiche, stecche: !prev.specifiche.stecche },
          };
        case "specifiche.tubi":
          return {
            ...prev,
            specifiche: { ...prev.specifiche, tubi: !prev.specifiche.tubi },
          };
      }
    });
  }

  function navigateWithNotice(pathname: string, search = "") {
    const params = new URLSearchParams(search);
    params.set(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM, "cambio-mezzo-locale");
    const nextSearch = params.toString();
    navigate(
      {
        pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }

  function conferma() {
    setErrore("");

    const autista = getAutistaLocal() as AutistaLocale | null;
    const mezzoLocale = getMezzoLocal() as MezzoLocale | null;

    if (!autista?.badge) {
      setErrore("Autista non valido. Fai login.");
      return;
    }

    const corrente: SessioneAttiva = sessione || {
      targaMotrice: mezzoLocale?.targaCamion || null,
      targaRimorchio: mezzoLocale?.targaRimorchio || null,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome || "",
      timestamp: mezzoLocale?.timestamp || Date.now(),
    };

    if (modalita === "rimorchio" && !corrente.targaRimorchio) {
      setErrore("Nessun rimorchio agganciato");
      return;
    }

    if (modalita === "motrice" && !corrente.targaMotrice) {
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

    if (modalita === "rimorchio") {
      saveMezzoLocal({
        targaCamion: corrente.targaMotrice || null,
        targaRimorchio: null,
        timestamp: now,
      });
      navigateWithNotice(`${NEXT_AUTISTI_BASE_PATH}/home`);
      return;
    }

    saveMezzoLocal({
      targaCamion: null,
      targaCamionPrima: corrente.targaMotrice || null,
      targaRimorchio: corrente.targaRimorchio || null,
      timestamp: now,
    });
    navigateWithNotice(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, "mode=motrice");
  }

  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <div className="cm-container">
        <button
          type="button"
          className="cm-back"
          onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/home`)}
        >
          {"<- INDIETRO"}
        </button>

      <h1>{titolo}</h1>
      {sessione ? (
        <div className="cm-subtitle">
          Attuale:{" "}
          {modalita === "rimorchio"
            ? (getMezzoLocal()?.targaRimorchio ?? sessione.targaRimorchio) ||
              "NESSUN RIMORCHIO"
            : (getMezzoLocal()?.targaCamion ?? sessione.targaMotrice) ||
              "NESSUNA MOTRICE"}
        </div>
      ) : null}

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
        {(["MEV", "STABIO", "ALTRO"] as Luogo[]).map((item) => (
          <button
            key={item}
            className={luogo === item ? "active" : ""}
            onClick={() => setLuogo(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {luogo === "ALTRO" ? (
        <input
          className="cm-input"
          value={luogoAltro}
          onChange={(event) => setLuogoAltro(event.target.value)}
          placeholder="Specifica luogo"
        />
      ) : null}

      {modalita === "rimorchio" ? (
        <>
          <div className="cm-subtitle" style={{ marginTop: 16 }}>
            Stato carico
          </div>
          <div className="cm-switch">
            {(["PIENO", "PARZIALE", "VUOTO"] as StatoCarico[]).map((item) => (
              <button
            key={item}
                className={statoCarico === item ? "active" : ""}
                onClick={() => setStatoCarico(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </>
      ) : null}

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

      {modalita === "rimorchio" ? (
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
      ) : null}

      {errore ? <div className="cm-error">{errore}</div> : null}

        <button className="cm-confirm" onClick={conferma} type="button">
          CONFERMA
        </button>
      </div>
    </NextLegacyStorageBoundary>
  );
}
