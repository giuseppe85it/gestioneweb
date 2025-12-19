// ======================================================
// ControlloMezzo.tsx
// APP AUTISTI – STEP 3 OBBLIGATORIO
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ControlloMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";

const AUTISTA_KEY = "@autista_attivo";
const MEZZO_ATTIVO_KEY = "@mezzo_attivo_autista";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

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
    async function load() {
      const a = await getItemSync(AUTISTA_KEY);
      const m = await getItemSync(MEZZO_ATTIVO_KEY);

      if (!a || !m) {
        navigate("/autisti/login");
        return;
      }

      setAutista(a);
      setMezzo(m);
    }
    load();
  }, [navigate]);

  function toggle(key: keyof typeof check) {
    setCheck((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function salva() {
    if (!autista || !mezzo) {
      alert("Mezzo o autista non disponibili");
      return;
    }

    const storico = (await getItemSync(CONTROLLI_KEY)) || [];

    storico.push({
      autistaNome: autista.nome,
      badgeAutista: autista.badge,

      targaCamion: mezzo.targaCamion || null,
      targaRimorchio: mezzo.targaRimorchio || null,

      check,
      note: note || null,

      obbligatorio: true, // STEP 3
      timestamp: Date.now(),
    });

    await setItemSync(CONTROLLI_KEY, storico);

    navigate("/autisti/home");
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
            <div className="cmz-targa secondaria">
              {mezzo.targaRimorchio}
            </div>
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
