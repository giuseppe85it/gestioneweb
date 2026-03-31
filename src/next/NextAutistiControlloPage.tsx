/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../autisti/autisti.css";
import "../autisti/ControlloMezzo.css";
import { getAutistaLocal, getMezzoLocal } from "./autisti/nextAutistiSessionStorage";
import { NEXT_AUTISTI_BASE_PATH } from "./autisti/nextAutistiCloneRuntime";
import { type NextAutistiCloneTargetControllo } from "./autisti/nextAutistiCloneState";

export default function NextAutistiControlloPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

  const [note, setNote] = useState("");
  const [targetSelezionato, setTargetSelezionato] =
    useState<NextAutistiCloneTargetControllo>("motrice");
  const [targetLocked, setTargetLocked] = useState(false);
  const [targetInitialized, setTargetInitialized] = useState(false);

  const [check, setCheck] = useState({
    gomme: true,
    freni: true,
    luci: true,
    perdite: true,
  });

  useEffect(() => {
    const autistaLocale = getAutistaLocal();
    const mezzoLocale = getMezzoLocal();

    if (!autistaLocale || !autistaLocale.badge) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
      return;
    }

    if (!mezzoLocale || !mezzoLocale.targaCamion) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
      return;
    }

    setAutista(autistaLocale);
    setMezzo(mezzoLocale);
  }, [navigate]);

  useEffect(() => {
    if (!mezzo || targetInitialized) {
      return;
    }

    const raw = (searchParams.get("target") || "").toLowerCase();
    const hasMotrice = !!mezzo?.targaCamion;
    const hasRimorchio = !!mezzo?.targaRimorchio;
    let target: NextAutistiCloneTargetControllo = hasMotrice ? "motrice" : "rimorchio";

    if (raw === "motrice" || raw === "rimorchio") {
      target = raw as NextAutistiCloneTargetControllo;
      setTargetLocked(true);
    } else if (raw === "entrambi") {
      target = "entrambi";
      setTargetLocked(false);
    } else {
      setTargetLocked(false);
    }

    if (target === "rimorchio" && !hasRimorchio) {
      target = "motrice";
    }

    if (target === "entrambi" && !(hasMotrice && hasRimorchio)) {
      target = hasRimorchio ? "rimorchio" : "motrice";
    }

    setTargetSelezionato(target);
    setTargetInitialized(true);
  }, [mezzo, searchParams, targetInitialized]);

  function toggle(key: keyof typeof check) {
    setCheck((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function salva() {
    if (!autista || !mezzo) {
      return;
    }

    if (targetSelezionato === "rimorchio" && !mezzo.targaRimorchio) {
      window.alert("Seleziona un rimorchio valido.");
      return;
    }

    if (
      targetSelezionato === "entrambi" &&
      (!mezzo.targaCamion || !mezzo.targaRimorchio)
    ) {
      window.alert("Per 'entrambi' servono motrice e rimorchio.");
      return;
    }

    void check;
    void note;
    window.alert("Clone NEXT in sola lettura: il controllo mezzo non viene salvato.");
  }

  return (
    <div className="cmz-container">
      <h1>CONTROLLO MEZZO</h1>
      <p className="cmz-subtitle">
        Verifica iniziale obbligatoria prima di iniziare il lavoro
      </p>

      <div className="cmz-target">
        <div className="cmz-target-question">
          Stai controllando: MOTRICE o RIMORCHIO?
        </div>
        <div className="cmz-target-row">
          <button
            type="button"
            className={`cmz-target-btn ${targetSelezionato === "motrice" ? "active" : ""}`}
            onClick={() => setTargetSelezionato("motrice")}
            disabled={targetLocked}
          >
            MOTRICE
          </button>
          {mezzo?.targaRimorchio ? (
            <button
              type="button"
              className={`cmz-target-btn ${targetSelezionato === "rimorchio" ? "active" : ""}`}
              onClick={() => setTargetSelezionato("rimorchio")}
              disabled={targetLocked}
            >
              RIMORCHIO
            </button>
          ) : null}
        </div>
        {mezzo?.targaCamion && mezzo?.targaRimorchio ? (
          <button
            type="button"
            className={`cmz-target-btn cmz-target-btn-small ${
              targetSelezionato === "entrambi" ? "active" : ""
            }`}
            onClick={() => setTargetSelezionato("entrambi")}
            disabled={targetLocked}
          >
            ENTRAMBI
          </button>
        ) : null}
      </div>

      {mezzo ? (
        <div className="cmz-targhe">
          {mezzo.targaCamion ? <div className="cmz-targa">{mezzo.targaCamion}</div> : null}
          {mezzo.targaRimorchio ? (
            <div className="cmz-targa secondaria">{mezzo.targaRimorchio}</div>
          ) : null}
          <div className="cmz-target-summary">
            {targetSelezionato === "rimorchio"
              ? `Target: RIMORCHIO (TARGA ${mezzo.targaRimorchio || "-"})`
              : targetSelezionato === "entrambi"
                ? `Target: ENTRAMBI (MOTRICE ${mezzo.targaCamion || "-"}, RIMORCHIO ${mezzo.targaRimorchio || "-"})`
                : `Target: MOTRICE (TARGA ${mezzo.targaCamion || "-"})`}
          </div>
        </div>
      ) : null}

      <h2>Verifica rapida</h2>

      <div className="cmz-checklist">
        {(
          [
            ["gomme", "GOMME"],
            ["freni", "FRENI"],
            ["luci", "LUCI"],
            ["perdite", "PERDITE"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="cmz-check">
            <input type="checkbox" checked={check[key]} onChange={() => toggle(key)} />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <h2>Note (opzionale)</h2>
      <textarea
        className="cmz-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Scrivi solo se serve..."
      />

      <button className="cmz-confirm" onClick={salva} type="button">
        CONFERMA CONTROLLO
      </button>
    </div>
  );
}
