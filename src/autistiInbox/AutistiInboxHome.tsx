import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiInboxHome.css";

import { loadHomeEvents, loadRimorchiStatus } from "../utils/homeEvents";
import type { HomeEvent, RimorchioStatus } from "../utils/homeEvents";

export default function AutistiInboxHome() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [day, setDay] = useState<Date>(new Date());
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [rimorchi, setRimorchi] = useState<RimorchioStatus[]>([]);

  // ===== LOAD DATI =====
  useEffect(() => {
    loadHomeEvents(day).then(setEvents);
    loadRimorchiStatus().then(setRimorchi);
  }, [day]);

  // ===== FILTRI EVENTI =====
  const rifornimenti = useMemo(
    () => events.filter((e) => e.tipo === "rifornimento"),
    [events]
  );

  const segnalazioni = useMemo(
    () => events.filter((e) => e.tipo === "segnalazione"),
    [events]
  );

  const controlli = useMemo(
    () => events.filter((e) => e.tipo === "controllo"),
    [events]
  );

  const cambiMezzo = useMemo(
    () => events.filter((e) => e.tipo === "cambio_mezzo"),
    [events]
  );

  // ===== UTILS =====
  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ===== RENDER =====
  return (
    <div className="autisti-home">
      {/* HEADER */}
      <div className="autisti-header">
        <div className="autisti-header-left">
          <img
            src="/logo.png"
            alt="Logo azienda"
            onClick={() => navigate("/")}
          />
          <h1>Centro di controllo mezzi</h1>
        </div>

        <div className="autisti-header-actions">
          <button onClick={() => navigate("/autisti-inbox/rifornimenti")}>
            Rifornimenti
          </button>
          <button onClick={() => navigate("/autisti-inbox/segnalazioni")}>
            Segnalazioni
          </button>
          <button onClick={() => navigate("/autisti-inbox/controlli")}>
            Controllo mezzo
          </button>
          <button onClick={() => navigate("/autisti-inbox/cambio-mezzo")}>
            Cambio mezzo
          </button>
        </div>
      </div>

      {/* DATA */}
      <div className="autisti-date-bar">
        <button onClick={() => setDay(new Date(day.getTime() - 86400000))}>
          ◀
        </button>

        <span>
          {day.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>

        <button onClick={() => setDay(new Date(day.getTime() + 86400000))}>
          ▶
        </button>
      </div>

      {/* CONTENUTO */}
      <div className="autisti-layout">
        {/* CARD */}
        <div className="autisti-cards">
          <div className="daily-card">
            <h2>Rifornimenti</h2>
            {rifornimenti.length === 0 && (
              <div className="daily-item empty">Nessun rifornimento</div>
            )}
            {rifornimenti.slice(0, 5).map((r) => (
              <div key={r.id} className="daily-item">
                {formatTime(r.timestamp)} · {r.targa ?? "-"} ·{" "}
                {r.payload?.litri ?? "-"} lt
              </div>
            ))}
          </div>

          <div className="daily-card alert">
            <h2>Segnalazioni</h2>
            {segnalazioni.length === 0 && (
              <div className="daily-item empty">Nessuna segnalazione</div>
            )}
            {segnalazioni.slice(0, 5).map((s) => (
              <div key={s.id} className="daily-item">
                {formatTime(s.timestamp)} · {s.targa ?? "-"} ·{" "}
                {s.autista ?? "-"}
              </div>
            ))}
          </div>

          <div className="daily-card">
            <h2>Controllo mezzo</h2>
            {controlli.length === 0 && (
              <div className="daily-item empty">Nessun controllo</div>
            )}
            {controlli.slice(0, 5).map((c) => (
              <div key={c.id} className="daily-item">
                {formatTime(c.timestamp)} · {c.targa ?? "-"} · OK
              </div>
            ))}
          </div>

          <div className="daily-card">
            <h2>Cambio mezzo</h2>
            {cambiMezzo.length === 0 && (
              <div className="daily-item empty">Nessun cambio</div>
            )}
            {cambiMezzo.slice(0, 5).map((c) => (
              <div key={c.id} className="daily-item">
                {formatTime(c.timestamp)} · {c.targa ?? "-"} ·{" "}
                {c.autista ?? "-"}
              </div>
            ))}
          </div>
        </div>

        {/* STATO RIMORCHI */}
        <aside className="rimorchi-panel">
          <h2>Stato rimorchi</h2>

          {rimorchi.length === 0 && (
            <div className="rimorchio-row">Nessun rimorchio</div>
          )}

          {rimorchi.map((r) => (
            <div
              key={r.targa}
              className="rimorchio-row"
              data-stato={r.stato}
            >
              <strong>{r.targa}</strong>
              <div>{r.stato}</div>
              {r.stato === "LIBERO" && <div>{r.luogo ?? "-"}</div>}
              {r.stato === "AGGANCIATO" && (
                <small>{r.autista ?? "-"}</small>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
