import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiInboxHome.css";

import { loadActiveSessions, loadHomeEvents } from "../utils/homeEvents";
import type { ActiveSession, HomeEvent } from "../utils/homeEvents";
import RifornimentiCard from "./components/RifornimentiCard";
import SessioniAttiveCard from "./components/SessioniAttiveCard";
import AutistiEventoModal from "../components/AutistiEventoModal";

type ModalKind =
  | null
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "cambi"
  | "attrezzature";

type ActiveTab =
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "cambi"
  | "attrezzature";

export default function AutistiInboxHome() {
  const navigate = useNavigate();
 
  const [menuOpen, setMenuOpen] = useState(false);
const menuRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  function onDown(e: MouseEvent) {
    if (!menuRef.current) return;
    if (menuRef.current.contains(e.target as Node)) return;
    setMenuOpen(false);
  }
  if (menuOpen) document.addEventListener("mousedown", onDown);
  return () => document.removeEventListener("mousedown", onDown);
}, [menuOpen]);


  const [day, setDay] = useState<Date>(new Date());
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("rifornimenti");
  const [selectedEvent, setSelectedEvent] = useState<HomeEvent | null>(null);

  const rifornimentiRef = useRef<HTMLDivElement | null>(null);
  const segnalazioniRef = useRef<HTMLDivElement | null>(null);
  const controlliRef = useRef<HTMLDivElement | null>(null);
  const cambiRef = useRef<HTMLDivElement | null>(null);
  const attrezzatureRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHomeEvents(day).then(setEvents);
    loadActiveSessions().then(setActiveSessions).catch(() => setActiveSessions([]));
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
  const gomme = useMemo(() => {
    const withExtras = events as HomeEvent[] & { gomme?: HomeEvent[] };
    const list = withExtras.gomme ?? events.filter((e) => e.tipo === "gomme");
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  }, [events]);
  const gommePreview = useMemo(() => gomme.slice(0, 5), [gomme]);
  const gommeNuoveCount = useMemo(
    () =>
      gomme.filter((g) => {
        const p: any = g.payload || {};
        return String(p?.stato ?? "").toLowerCase() === "nuovo" && p?.letta === false;
      }).length,
    [gomme]
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

  function closeDetails() {
    setSelectedEvent(null);
  }

  function scrollToTab(tab: ActiveTab) {
    const refMap = {
      rifornimenti: rifornimentiRef,
      segnalazioni: segnalazioniRef,
      controlli: controlliRef,
      cambi: cambiRef,
      attrezzature: attrezzatureRef,
    };
    refMap[tab].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleTabClick(tab: ActiveTab) {
    setActiveTab(tab);
    scrollToTab(tab);
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
    // Se nel payload c'e testo richiesta, lo mettiamo come riga 2.
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

  function formatDateInputValue(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const dayValue = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayValue}`;
  }

  function openDatePicker() {
    const input = datePickerRef.current;
    if (!input) return;
    const picker = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (picker) {
      picker.call(input);
    } else {
      input.click();
    }
  }

  function handleDatePickerChange(value: string) {
    if (!value) return;
    const [year, month, dayValue] = value.split("-").map(Number);
    if (!year || !month || !dayValue) return;
    const next = new Date(year, month - 1, dayValue);
    if (Number.isNaN(next.getTime())) return;
    setDay(next);
  }

  function getAutistaInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const autistaObj =
      p.autista && typeof p.autista === "object" ? p.autista : null;
    const nome =
      autistaObj?.nome ??
      p.autista ??
      p.autistaNome ??
      p.nomeAutista ??
      e.autista ??
      "-";
    const badge = autistaObj?.badge ?? p.badgeAutista ?? p.badge ?? null;
    return {
      nome: String(nome || "-"),
      badge: badge ? String(badge) : null,
    };
  }

  function getCambioInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const tipo = String(p.tipo ?? p.tipoOperativo ?? p.fsTipo ?? "CAMBIO_ASSETTO");
    const tipoLabel = tipo.replace(/_/g, " ");
    const autista = getAutistaInfo(e);
    const prima = {
      motrice:
        p?.primaMotrice ??
        p?.prima?.motrice ??
        p?.prima?.targaMotrice ??
        p?.prima?.targaCamion ??
        null,
      rimorchio:
        p?.primaRimorchio ??
        p?.prima?.rimorchio ??
        p?.prima?.targaRimorchio ??
        null,
    };
    const dopo = {
      motrice:
        p?.dopoMotrice ??
        p?.dopo?.motrice ??
        p?.dopo?.targaMotrice ??
        p?.dopo?.targaCamion ??
        p?.targaMotrice ??
        p?.targaCamion ??
        null,
      rimorchio:
        p?.dopoRimorchio ??
        p?.dopo?.rimorchio ??
        p?.dopo?.targaRimorchio ??
        p?.targaRimorchio ??
        null,
    };
    const isInizio = tipo === "INIZIO_ASSETTO";
    return {
      tipo,
      tipoLabel,
      isInizio,
      nomeAutista: autista.nome || "-",
      badgeAutista: autista.badge,
      prima,
      dopo,
      luogo: p?.luogo ?? null,
      condizioni: p?.condizioni ?? null,
      statoCarico: p?.statoCarico ?? null,
    };
  }

  function formatCambioSide(value: string | null) {
    return value ? String(value) : "INIZIO";
  }

  function isSameCambioValue(a: string | null, b: string | null) {
    const aa = (a ?? "").trim().toUpperCase();
    const bb = (b ?? "").trim().toUpperCase();
    if (!aa && !bb) return true;
    return aa === bb;
  }

  function buildCambioLines(info: {
    prima: { motrice: string | null; rimorchio: string | null };
    dopo: { motrice: string | null; rimorchio: string | null };
  }) {
    const lines: string[] = [];
    if (
      (info.prima.motrice || info.dopo.motrice) &&
      !isSameCambioValue(info.prima.motrice, info.dopo.motrice)
    ) {
      lines.push(
        `MOTRICE: ${formatCambioSide(info.prima.motrice)} -> ${formatCambioSide(info.dopo.motrice)}`
      );
    }
    if (
      (info.prima.rimorchio || info.dopo.rimorchio) &&
      !isSameCambioValue(info.prima.rimorchio, info.dopo.rimorchio)
    ) {
      lines.push(
        `RIMORCHIO: ${formatCambioSide(info.prima.rimorchio)} -> ${formatCambioSide(info.dopo.rimorchio)}`
      );
    }
    return lines;
  }

  return (
    <div className="autisti-home">
      <div className="autisti-inbox-wrap">
        {/* HEADER */}
        <div className="autisti-header">
          <div className="autisti-header-left">
            <img src="/logo.png" alt="Logo" onClick={() => navigate("/")} />
          <div className="autisti-title-row">
  <h1>Autisti Inbox (admin)</h1>

  <div className="autisti-menu-wrap" ref={menuRef}>
    <button
      type="button"
      className="autisti-menu-btn"
      onClick={() => setMenuOpen((v) => !v)}
      aria-label="Menu"
      title="Menu"
    >
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </button>

    {menuOpen && (
      <div className="autisti-menu">
     <button
  type="button"
  className="autisti-menu-item"
  onClick={() => {
    setMenuOpen(false);
    navigate("/autisti-admin");
  }}
>
  Centro rettifica dati (admin)
</button>

      </div>
    )}
  </div>
</div>

          </div>

          <div className="autisti-header-actions">
            <button
              onClick={() => handleTabClick("rifornimenti")}
              style={
                activeTab === "rifornimenti"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Rifornimenti
            </button>
            <button
              onClick={() => navigate("/autisti-inbox/segnalazioni")}
              style={
                activeTab === "segnalazioni"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Segnalazioni
              {segnalazioni.some((s) => {
                const p: any = s.payload || {};
                return p?.stato === "nuova" || p?.letta === false;
              }) && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#d32f2f",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "2px 6px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  NUOVE
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/autisti-inbox/controlli")}
              style={
                activeTab === "controlli"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Controllo mezzo
            </button>
            <button
              onClick={() => handleTabClick("cambi")}
              style={
                activeTab === "cambi"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Cambio mezzo
            </button>
            <button
              onClick={() => navigate("/autisti-inbox/richiesta-attrezzature")}
              style={
                activeTab === "attrezzature"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Richiesta attrezzature
            </button>
          </div>
        </div>

        {/* DATA */}
        <div className="autisti-date-bar">
          <button onClick={() => setDay(new Date(day.getTime() - 86400000))}>
            {"<"}
          </button>

          <div className="autisti-date-picker">
            <button
              type="button"
              className="autisti-date-label"
              onClick={openDatePicker}
              aria-label="Seleziona data"
            >
              {day.toLocaleDateString("it-IT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </button>
            <input
              ref={datePickerRef}
              className="autisti-date-input"
              type="date"
              value={formatDateInputValue(day)}
              onChange={(e) => handleDatePickerChange(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          <button onClick={() => setDay(new Date(day.getTime() + 86400000))}>
            {">"}
          </button>
        </div>

        {/* LAYOUT */}
        <div className="autisti-layout">
          <aside className="sessioni-panel">
            <SessioniAttiveCard sessions={activeSessions} />
          </aside>
          {/* CARD GRID */}
          <div className="autisti-cards">
            {/* RIFORNIMENTI */}
            <RifornimentiCard
              events={rifornimenti}
              cardRef={rifornimentiRef}
              onOpenAll={() => openModal("rifornimenti")}
              onOpenDetail={(event) => setSelectedEvent(event)}
            />

            {/* SEGNALAZIONI */}
            <div className="daily-card alert" ref={segnalazioniRef}>
              <div className="daily-card-head">
                <h2>Segnalazioni</h2>
                <button
                  className="daily-more"
                  onClick={() => navigate("/autisti-inbox/segnalazioni")}
                  title="Vedi tutto"
                >
                  Vedi tutto
                </button>
              </div>

              {segnalazioni.length === 0 ? (
                <div className="daily-item empty">Nessuna segnalazione</div>
              ) : (
                segnalazioni.slice(0, 5).map((s, index) => (
                  <div
                    key={
                      s.id ??
                      `${s.tipo ?? "x"}-${s.timestamp ?? 0}-${s.targa ?? ""}-${index}`
                    }
                    className="daily-item"
                    onClick={() => setSelectedEvent(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedEvent(s);
                    }}
                  >
                    {formatTime(s.timestamp)} - {s.targa ?? "-"} - {s.autista ?? "-"}
                  </div>
                ))
              )}
            </div>

            {/* CONTROLLO */}
            <div className="daily-card" ref={controlliRef}>
              <div className="daily-card-head">
                <h2>Controllo mezzo</h2>
                <button
                  className="daily-more"
                  onClick={() => navigate("/autisti-inbox/controlli")}
                  title="Vedi tutto"
                >
                  Vedi tutto
                </button>
              </div>

              {controlli.length === 0 ? (
                <div className="daily-item empty">Nessun controllo</div>
              ) : (
                (() => {
                  const preview = controlli.slice(0, 5).map((c, index) => {
                    const p: any = c.payload || {};
                    const check = p?.check;
                    const koList =
                      check && typeof check === "object"
                        ? Object.entries(check)
                            .filter(([, v]) => v === false)
                            .map(([k]) => String(k).toUpperCase())
                        : [];
                    const isKO = koList.length > 0;
                    const key =
                      c.id ??
                      `${c.tipo ?? "x"}-${c.timestamp ?? 0}-${c.targa ?? ""}-${index}`;
                    return { c, key, isKO };
                  });

                  const itemsKO = preview.filter((x) => x.isKO);
                  const itemsOK = preview.filter((x) => !x.isKO);

                  const renderItem = (x: { c: HomeEvent; key: string; isKO: boolean }) => (
                    <div
                      key={x.key}
                      className="daily-item"
                      onClick={() => setSelectedEvent(x.c)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedEvent(x.c);
                      }}
                    >
                      {formatTime(x.c.timestamp)} - {x.c.targa ?? "-"} -{" "}
                      <span style={x.isKO ? { color: "#d32f2f", fontWeight: 700 } : undefined}>
                        {x.isKO ? "KO" : "OK"}
                      </span>
                    </div>
                  );

                  return (
                    <div className="daily-two-col">
                      <div className="daily-col">
                        <div className="daily-col-title ko">ESITI KO</div>
                        {itemsKO.length === 0 ? (
                          <div className="daily-item empty">Nessun KO</div>
                        ) : (
                          itemsKO.map(renderItem)
                        )}
                      </div>
                      <div className="daily-col">
                        <div className="daily-col-title ok">ESITI OK</div>
                        {itemsOK.length === 0 ? (
                          <div className="daily-item empty">Nessun OK</div>
                        ) : (
                          itemsOK.map(renderItem)
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* CAMBIO MEZZO */}
            <div className="daily-card" ref={cambiRef}>
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
                cambiMezzo.slice(0, 5).map((c, index) => {
                  const info = getCambioInfo(c);
                  const badgeLabel = info.badgeAutista
                    ? `BADGE ${info.badgeAutista}`
                    : "BADGE -";
                  const nomeLabel = info.nomeAutista || "-";
                  const topLine = `${info.tipoLabel} · ${nomeLabel} (${badgeLabel}) · ${formatTime(
                    c.timestamp
                  )}`;
                  const changeLines = buildCambioLines(info);
                  return (
                    <div
                      key={
                        c.id ??
                        `${c.tipo ?? "x"}-${c.timestamp ?? 0}-${c.targa ?? ""}-${index}`
                      }
                      className="daily-item cambio-item"
                      onClick={() => setSelectedEvent(c)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedEvent(c);
                      }}
                    >
                      <div className="cambio-line cambio-line-top">
                        <span className="cambio-main">{topLine}</span>
                      </div>
                      {changeLines.map((line, lineIndex) => (
                        <div
                          key={`cambio-${c.id ?? "x"}-${lineIndex}`}
                          className="cambio-line cambio-line-bot"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* GOMME */}
            <div className="daily-card">
              <div className="daily-card-head">
                <h2>
                  Gomme
                  {gommeNuoveCount > 0 ? (
                    <span
                      style={{
                        marginLeft: 8,
                        background: "#d32f2f",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "2px 6px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      NUOVE {gommeNuoveCount}
                    </span>
                  ) : null}
                </h2>
                <button
                  className="daily-more"
                  type="button"
                  onClick={() => navigate("/autisti-inbox/gomme")}
                  title="Vedi tutto"
                >
                  Vedi tutto
                </button>
              </div>
              <div className="daily-item empty">Cambio / Rotazione</div>
              {gommePreview.length === 0 ? (
                <div className="daily-item empty">Nessun evento gomme</div>
              ) : (
                gommePreview.map((g, index) => {
                  const p: any = g.payload || {};
                  const ts = Number(g?.timestamp ?? p?.data ?? p?.timestamp ?? 0);
                  const time = ts ? formatTime(ts) : "--";
                  const targa = g?.targa ?? p?.targetTarga ?? "-";
                  const tipo = String(p?.tipo ?? "-").toUpperCase();
                  const km = p?.km ?? "-";
                  return (
                    <div
                      key={String(g?.id ?? `${targa}-${ts}-${index}`)}
                      className="daily-item"
                      onClick={() => setSelectedEvent(g)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedEvent(g);
                      }}
                    >
                      {time} - {targa} - {tipo} - KM {km}
                    </div>
                  );
                })
              )}
            </div>

            {/* RICHIESTA ATTREZZATURE (5a CARD) */}
            <div className="daily-card info wide" ref={attrezzatureRef}>
              <div className="daily-card-head">
                <h2>Richiesta attrezzature</h2>
                <button
                  className="daily-more"
                  type="button"
                  onClick={() => navigate("/autisti-inbox/richiesta-attrezzature")}
                  title={richiesteAttrezzature.length <= 5 ? "Niente altro" : "Vedi tutto"}
                >
                  Vedi tutto
                </button>
              </div>

              {richiesteAttrezzature.length === 0 ? (
                <div className="daily-item empty">Nessuna richiesta</div>
              ) : (
                richiesteAttrezzature.slice(0, 5).map((r, index) => {
                  const p: any = r.payload || {};
                  const extra =
                    p.testo ?? p.richiesta ?? p.descrizione ?? p.note ?? null;

                  return (
                    <div
                      key={
                        r.id ??
                        `${r.tipo ?? "x"}-${r.timestamp ?? 0}-${r.targa ?? ""}-${index}`
                      }
                      className="daily-item"
                      onClick={() => setSelectedEvent(r)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedEvent(r);
                      }}
                    >
                      {formatTime(r.timestamp)} - {r.targa ?? "-"} - {r.autista ?? "-"}
                      {extra ? <div className="daily-sub">{String(extra)}</div> : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* MODALE */}
        {modal && (
          <div className="aix-backdrop" onClick={closeModal}>
            <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>{modalTitle}</h3>
                <button className="aix-close" onClick={closeModal} aria-label="Chiudi">
                  X
                </button>
              </div>

              <div className="aix-body">
                {modalList.length === 0 ? (
                  <div className="aix-empty">Nessun elemento</div>
                ) : (
                  modalList.map((e, index) => (
                    <div
                      key={
                        e.id ??
                        `${e.tipo ?? "x"}-${e.timestamp ?? 0}-${e.targa ?? ""}-${index}`
                      }
                      className="aix-row"
                      onClick={() => setSelectedEvent(e)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") setSelectedEvent(e);
                      }}
                    >
                      {renderModalRow(e)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        <AutistiEventoModal
          event={selectedEvent}
          onClose={closeDetails}
          onAfterGommeImport={async () => {
            const updatedEvents = await loadHomeEvents(day);
            setEvents(updatedEvents);
          }}
        />
      </div>
    </div>
  );
}



