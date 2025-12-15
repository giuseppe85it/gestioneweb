// ======================================================
// ControlloMezzo.tsx
// APP AUTISTI – Controllo rapido mezzo
// ======================================================

import { useEffect, useState } from "react";
import "./ControlloMezzo.css";
import { getItemSync, setItemSync } from "../utils/storageSync";

const AUTISTA_KEY = "@autista_attivo";
const MEZZO_ATTIVO_KEY = "@mezzo_attivo_autista";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

export default function ControlloMezzo() {
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
      setAutista(await getItemSync(AUTISTA_KEY));
      setMezzo(await getItemSync(MEZZO_ATTIVO_KEY));
    }
    load();
  }, []);

  function toggle(key: string) {
    setCheck((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
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
      note,
      timestamp: Date.now(),
    });

    await setItemSync(CONTROLLI_KEY, storico);

    alert("Controllo mezzo registrato");
    setNote("");
  }

  return (
    <div className="cmz-container">
      <h1>CONTROLLO MEZZO</h1>

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
        {[
          ["gomme", "GOMME"],
          ["freni", "FRENI"],
          ["luci", "LUCI"],
          ["perdite", "PERDITE"],
        ].map(([key, label]) => (
          <label key={key} className="cmz-check">
            <input
              type="checkbox"
              checked={check[key as keyof typeof check]}
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
        REGISTRA CONTROLLO
      </button>
    </div>
  );
}
