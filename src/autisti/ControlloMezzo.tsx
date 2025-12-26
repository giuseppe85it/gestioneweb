import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./autisti.css";
import "./ControlloMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";

type TargetControllo = "motrice" | "rimorchio" | "entrambi";

function genId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ControlloMezzo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [autista, setAutista] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mezzo, setMezzo] = useState<any>(null);

  const [note, setNote] = useState("");
  const [targetSelezionato, setTargetSelezionato] = useState<TargetControllo>("motrice");
  const [targetLocked, setTargetLocked] = useState(false);
  const [targetInitialized, setTargetInitialized] = useState(false);

  const [check, setCheck] = useState({
    gomme: true,
    freni: true,
    luci: true,
    perdite: true,
  });

  useEffect(() => {
    const a = getAutistaLocal();
    const m = getMezzoLocal();

    if (!a || !a.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }
    if (!m || !m.targaCamion) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    setAutista(a);
    setMezzo(m);
  }, [navigate]);

  useEffect(() => {
    if (!mezzo || targetInitialized) return;
    const raw = (searchParams.get("target") || "").toLowerCase();
    const hasMotrice = !!mezzo?.targaCamion;
    const hasRimorchio = !!mezzo?.targaRimorchio;
    let t: TargetControllo = hasMotrice ? "motrice" : "rimorchio";
    if (raw === "motrice" || raw === "rimorchio" || raw === "entrambi") {
      t = raw as TargetControllo;
      setTargetLocked(true);
    }
    if (t === "rimorchio" && !hasRimorchio) t = "motrice";
    if (t === "entrambi" && !(hasMotrice && hasRimorchio)) {
      t = hasRimorchio ? "rimorchio" : "motrice";
    }
    setTargetSelezionato(t);
    setTargetInitialized(true);
  }, [mezzo, searchParams, targetInitialized]);

  function toggle(key: keyof typeof check) {
    setCheck((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function salva() {
    if (!autista || !mezzo) return;
    if (targetSelezionato === "rimorchio" && !mezzo.targaRimorchio) {
      alert("Seleziona un rimorchio valido.");
      return;
    }
    if (
      targetSelezionato === "entrambi" &&
      (!mezzo.targaCamion || !mezzo.targaRimorchio)
    ) {
      alert("Per 'entrambi' servono motrice e rimorchio.");
      return;
    }

    const storicoRaw = (await getItemSync(CONTROLLI_KEY)) || [];
    const storico = Array.isArray(storicoRaw) ? storicoRaw : [];

    storico.push({
      id: genId(),
      autistaNome: autista.nome || null,
      badgeAutista: autista.badge || null,

      targaCamion: mezzo.targaCamion || null,
      targaRimorchio: mezzo.targaRimorchio || null,

      // fondamentale per capire cosa hai controllato
      target: targetSelezionato,

      check,
      note: note || null,

      obbligatorio: true,
      timestamp: Date.now(),
    });

    await setItemSync(CONTROLLI_KEY, storico);
    navigate("/autisti/home", { replace: true });
  }

  return (
    <div className="cmz-container">
      <h1>CONTROLLO MEZZO</h1>
      <p className="cmz-subtitle">Verifica iniziale obbligatoria prima di iniziare il lavoro</p>

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


      {mezzo && (
        <div className="cmz-targhe">
          {mezzo.targaCamion && <div className="cmz-targa">{mezzo.targaCamion}</div>}
          {mezzo.targaRimorchio && <div className="cmz-targa secondaria">{mezzo.targaRimorchio}</div>}
          <div className="cmz-target-summary">
            {targetSelezionato === "rimorchio"
              ? `Target: RIMORCHIO (TARGA ${mezzo.targaRimorchio || "-"})`
              : targetSelezionato === "entrambi"
              ? `Target: ENTRAMBI (MOTRICE ${mezzo.targaCamion || "-"}, RIMORCHIO ${mezzo.targaRimorchio || "-"})`
              : `Target: MOTRICE (TARGA ${mezzo.targaCamion || "-"})`}
          </div>
        </div>
      )}

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
        onChange={(e) => setNote(e.target.value)}
        placeholder="Scrivi solo se serve..."
      />

      <button className="cmz-confirm" onClick={salva}>
        CONFERMA CONTROLLO
      </button>
    </div>
  );
}
