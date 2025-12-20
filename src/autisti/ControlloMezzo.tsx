// ======================================================
// ControlloMezzo.tsx
// APP AUTISTI – STEP OBBLIGATORIO (SESSIONE SOLO LOCALE)
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ControlloMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
function genId() {
  // compatibile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}


export default function ControlloMezzo() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [note, setNote] = useState("");

  const [check, setCheck] = useState({
    gomme: true,
    freni: true,
    luci: true,
    perdite: true,
  });

  useEffect(() => {
    // SOLO LOCALE (per-dispositivo)
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

  function toggle(key: keyof typeof check) {
    setCheck((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function salva() {
    if (!autista || !mezzo) {
      alert("Mezzo o autista non disponibili");
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
      <p className="cmz-subtitle">
        Verifica iniziale obbligatoria prima di iniziare il lavoro
      </p>

      {mezzo && (
        <div className="cmz-targhe">
          {mezzo.targaCamion && (
            <div className="cmz-targa">{mezzo.targaCamion}</div>
          )}
          {mezzo.targaRimorchio && (
            <div className="cmz-targa secondaria">{mezzo.targaRimorchio}</div>
          )}
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
            <input
              type="checkbox"
              checked={check[key]}
              onChange={() => toggle(key)}
            />
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
