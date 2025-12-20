import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiInboxHome.css";

import { loadHomeEvents, loadRimorchiStatus } from "../utils/homeEvents";
import type { HomeEvent, RimorchioStatus } from "../utils/homeEvents";

type ModalKind =
  | null
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "cambi"
  | "attrezzature";

export default function AutistiInboxHome() {
  const navigate = useNavigate();

  const [day, setDay] = useState<Date>(new Date());
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [rimorchi, setRimorchi] = useState<RimorchioStatus[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);

  useEffect(() => {
    loadHomeEvents(day).then(setEvents);
    loadRimorchiStatus().then(setRimorchi);
  }, [day]);

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
  const richiesteAttrezzature = useMemo(
    () => events.filter((e) => e.tipo === "richiesta_attrezzature"),
    [events]
  );

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openModal(kind: Exclude<ModalKind, null>) {
    setModal(kind);
  }
  function closeModal() {
    setModal(null);
  }

  const modalTitle = useMemo(() => {
    switch (modal) {
      case "rifornimenti":
        return "Rifornimenti";
      case "segnalazioni":
        return "Segnalazioni";
      case "controlli":
        return "Controllo mezzo";
      case "cambi":
        return "Cambio mezzo";
      case "attrezzature":
        return "Richiesta attrezzature";
      default:
        return "";
    }
  }, [modal]);

  const modalList = useMemo(() => {
    switch (modal) {
      case "rifornimenti":
        return rifornimenti;
      case "segnalazioni":
        return segnalazioni;
      case "controlli":
        return controlli;
      case "cambi":
        return cambiMezzo;
      case "attrezzature":
        return richiesteAttrezzature;
      default:
        return [];
    }
  }, [modal, rifornimenti, segnalazioni, controlli, cambiMezzo, richiesteAttrezzature]);

  function renderModalRow(e: HomeEvent) {
    // Mostra info reali senza inventare campi.
    // Se nel payload c'è testo richiesta, lo mettiamo come riga 2.
    const p: any = e.payload || {};
    const extra =
      p.testo ??
      p.richiesta ??
      p.descrizione ??
      p.note ??
      p.messaggio ??
      null;

    if (e.tipo === "rifornimento") {
      const litri = p.litri ?? p.quantita ?? "-";
      return (
        <>
          <div className="aix-row-top">
            <strong>{formatTime(e.timestamp)}</strong>
            <span>{e.targa ?? "-"}</span>
            <span>{litri} lt</span>
          </div>
          <div className="aix-row-bot">{e.autista ?? "-"}</div>
        </>
      );
    }

    return (
      <>
        <div className="aix-row-top">
          <strong>{formatTime(e.timestamp)}</strong>
          <span>{e.targa ?? "-"}</span>
          <span>{e.autista ?? "-"}</span>
        </div>
        {extra ? <div className="aix-row-bot">{String(extra)}</div> : null}
      </>
    );
  }

  return (
    <div className="autisti-home">
      <div className="autisti-inbox-wrap">
        {/* HEADER */}
        <div className="autisti-header">
          <div className="autisti-header-left">
            <img src="/logo.png" alt="Logo" onClick={() => navigate("/")} />
            <h1>Centro di controllo mezzi</h1>
          </div>

          <div className="autisti-header-actions">
            {/* Per ora le pagine non esistono: le teniamo ma non rompono la navigazione */}
            <button disabled title="In arrivo">
              Rifornimenti
            </button>
            <button disabled title="In arrivo">
              Segnalazioni
            </button>
            <button disabled title="In arrivo">
              Controllo mezzo
            </button>
            <button onClick={() => navigate("/autisti-inbox/cambio-mezzo")}>
              Cambio mezzo
            </button>
            <button disabled title="In arrivo">
  Richiesta attrezzature
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

        {/* LAYOUT */}
        <div className="autisti-layout">
          {/* CARD GRID */}
          <div className="autisti-cards">
            {/* RIFORNIMENTI */}
            <div className="daily-card">
              <div className="daily-card-head">
                <h2>Rifornimenti</h2>
                <button
                  className="daily-more"
                  disabled={rifornimenti.length <= 5}
                  onClick={() => openModal("rifornimenti")}
                  title={rifornimenti.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {rifornimenti.length === 0 ? (
                <div className="daily-item empty">Nessun rifornimento</div>
              ) : (
                rifornimenti.slice(0, 5).map((r) => {
                  const p: any = r.payload || {};
                  const litri = p.litri ?? p.quantita ?? "-";
                  return (
                    <div key={r.id} className="daily-item">
                      {formatTime(r.timestamp)} · {r.targa ?? "-"} · {litri} lt
                    </div>
                  );
                })
              )}
            </div>

            {/* SEGNALAZIONI */}
            <div className="daily-card alert">
              <div className="daily-card-head">
                <h2>Segnalazioni</h2>
                <button
                  className="daily-more"
                  disabled={segnalazioni.length <= 5}
                  onClick={() => openModal("segnalazioni")}
                  title={segnalazioni.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {segnalazioni.length === 0 ? (
                <div className="daily-item empty">Nessuna segnalazione</div>
              ) : (
                segnalazioni.slice(0, 5).map((s) => (
                  <div key={s.id} className="daily-item">
                    {formatTime(s.timestamp)} · {s.targa ?? "-"} · {s.autista ?? "-"}
                  </div>
                ))
              )}
            </div>

            {/* CONTROLLO */}
            <div className="daily-card">
              <div className="daily-card-head">
                <h2>Controllo mezzo</h2>
                <button
                  className="daily-more"
                  disabled={controlli.length <= 5}
                  onClick={() => openModal("controlli")}
                  title={controlli.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {controlli.length === 0 ? (
                <div className="daily-item empty">Nessun controllo</div>
              ) : (
                controlli.slice(0, 5).map((c) => (
                  <div key={c.id} className="daily-item">
                    {formatTime(c.timestamp)} · {c.targa ?? "-"} · OK
                  </div>
                ))
              )}
            </div>

            {/* CAMBIO MEZZO */}
            <div className="daily-card">
              <div className="daily-card-head">
                <h2>Cambio mezzo</h2>
                <button
                  className="daily-more"
                  disabled={cambiMezzo.length <= 5}
                  onClick={() => openModal("cambi")}
                  title={cambiMezzo.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {cambiMezzo.length === 0 ? (
                <div className="daily-item empty">Nessun cambio</div>
              ) : (
                cambiMezzo.slice(0, 5).map((c) => (
                  <div key={c.id} className="daily-item">
                    {formatTime(c.timestamp)} · {c.targa ?? "-"} · {c.autista ?? "-"}
                  </div>
                ))
              )}
            </div>

            {/* RICHIESTA ATTREZZATURE (5ª CARD) */}
            <div className="daily-card info wide">
              <div className="daily-card-head">
                <h2>Richiesta attrezzature</h2>
                <button
                  className="daily-more"
                  disabled={richiesteAttrezzature.length <= 5}
                  onClick={() => openModal("attrezzature")}
                  title={richiesteAttrezzature.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {richiesteAttrezzature.length === 0 ? (
                <div className="daily-item empty">Nessuna richiesta</div>
              ) : (
                richiesteAttrezzature.slice(0, 5).map((r) => {
                  const p: any = r.payload || {};
                  const extra =
                    p.testo ?? p.richiesta ?? p.descrizione ?? p.note ?? null;

                  return (
                    <div key={r.id} className="daily-item">
                      {formatTime(r.timestamp)} · {r.targa ?? "-"} · {r.autista ?? "-"}
                      {extra ? <div className="daily-sub">{String(extra)}</div> : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STATO RIMORCHI */}
          <aside className="rimorchi-panel">
            <h2>Stato rimorchi</h2>

            {rimorchi.length === 0 ? (
              <div className="rimorchio-row">Nessun rimorchio</div>
            ) : (
              rimorchi.map((r) => (
                <div key={r.targa} className="rimorchio-row" data-stato={r.stato}>
                  <strong>{r.targa}</strong>
                  <div>{r.stato}</div>

                  {r.stato === "LIBERO" && <div>{r.luogo ?? "-"}</div>}

                  {r.stato === "AGGANCIATO" && (
                    <>
                      <small>{r.autista ?? "-"}</small>
                      {r.motrice ? <small>Motrice: {r.motrice}</small> : null}
                      {r.statoCarico ? <small>Carico: {r.statoCarico}</small> : null}
                    </>
                  )}
                </div>
              ))
            )}
          </aside>
        </div>

        {/* MODALE */}
        {modal && (
          <div className="aix-backdrop" onClick={closeModal}>
            <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>{modalTitle}</h3>
                <button className="aix-close" onClick={closeModal} aria-label="Chiudi">
                  ✕
                </button>
              </div>

              <div className="aix-body">
                {modalList.length === 0 ? (
                  <div className="aix-empty">Nessun elemento</div>
                ) : (
                  modalList.map((e) => (
                    <div key={e.id} className="aix-row">
                      {renderModalRow(e)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
