import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiInboxHome.css";

import { loadActiveSessions, loadHomeEvents, loadRimorchiStatus } from "../utils/homeEvents";
import type { ActiveSession, HomeEvent, RimorchioStatus } from "../utils/homeEvents";
import { getItemSync } from "../utils/storageSync";
import SessioniAttiveCard from "./components/SessioniAttiveCard";

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
  const [rimorchi, setRimorchi] = useState<RimorchioStatus[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("rifornimenti");
  const [selectedEvent, setSelectedEvent] = useState<HomeEvent | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [mezziByTarga, setMezziByTarga] = useState<Record<string, string>>({});

  const rifornimentiRef = useRef<HTMLDivElement | null>(null);
  const segnalazioniRef = useRef<HTMLDivElement | null>(null);
  const controlliRef = useRef<HTMLDivElement | null>(null);
  const cambiRef = useRef<HTMLDivElement | null>(null);
  const attrezzatureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadHomeEvents(day).then(setEvents);
    loadRimorchiStatus().then(setRimorchi);
    loadActiveSessions().then(setActiveSessions).catch(() => setActiveSessions([]));
  }, [day]);

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await getItemSync("@mezzi_aziendali");
      const list = Array.isArray(raw)
        ? raw
        : raw?.value && Array.isArray(raw.value)
        ? raw.value
        : [];
      const map: Record<string, string> = {};
      for (const m of list) {
        const targa =
          m?.targa ??
          m?.targaCamion ??
          m?.targaMotrice ??
          m?.targaRimorchio ??
          null;
        const categoria =
          m?.categoria ??
          m?.categoriaMezzo ??
          m?.tipoMezzo ??
          m?.tipo ??
          null;
        if (targa && categoria && !map[String(targa)]) {
          map[String(targa)] = String(categoria);
        }
      }
      if (active) setMezziByTarga(map);
    })();
    return () => {
      active = false;
    };
  }, []);

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

  function closeDetails() {
    setSelectedEvent(null);
  }

  useEffect(() => {
    setShowJson(false);
  }, [selectedEvent]);

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

  function getTipoLabel(tipo: HomeEvent["tipo"]) {
    switch (tipo) {
      case "rifornimento":
        return "RIFORNIMENTO";
      case "segnalazione":
        return "SEGNALAZIONE";
      case "controllo":
        return "CONTROLLO MEZZO";
      case "cambio_mezzo":
        return "CAMBIO MEZZO";
      case "richiesta_attrezzature":
        return "RICHIESTA ATTREZZATURE";
      default:
        return "EVENTO";
    }
  }

  function formatDateTime(ts?: number) {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getAutistaInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const nome = p.autista ?? p.autistaNome ?? p.nomeAutista ?? e.autista ?? "-";
    const badge = p.badgeAutista ?? p.badge ?? null;
    return {
      nome: String(nome || "-"),
      badge: badge ? String(badge) : null,
    };
  }

  function getCambioInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const tipoLabel = String(p.tipoOperativo ?? p.tipo ?? p.fsTipo ?? "CAMBIO MEZZO");
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
    const source =
      p?.source ??
      (p?.primaMotrice || p?.dopoMotrice || p?.primaRimorchio || p?.dopoRimorchio
        ? "storico"
        : p?.prima && p?.dopo
        ? "storico"
        : "legacy");
    return {
      tipoLabel,
      nomeAutista: autista.nome || "-",
      badgeAutista: autista.badge,
      prima,
      dopo,
      source,
      luogo: p?.luogo ?? null,
      condizioni: p?.condizioni ?? null,
      statoCarico: p?.statoCarico ?? null,
    };
  }

  function getCategoria(targa?: string | null) {
    if (!targa) return null;
    return mezziByTarga[String(targa)] ?? null;
  }

  function buildMezzoRows(e: HomeEvent) {
    const p: any = e.payload || {};
    const rows: Array<{ label: string; targa: string; categoria?: string | null }> = [];
    if (e.tipo === "segnalazione") {
      const ambito = String(p.ambito ?? "").toLowerCase();
      if (ambito === "rimorchio") {
        const t = p.targaRimorchio ?? null;
        if (t) rows.push({ label: "Rimorchio", targa: String(t), categoria: getCategoria(t) });
      } else {
        const t = p.targaCamion ?? p.targaMotrice ?? null;
        if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
      }
    } else if (e.tipo === "rifornimento") {
      const t = p.targaCamion ?? p.targaMotrice ?? null;
      if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
    } else if (e.tipo === "controllo") {
      const tm = p.targaCamion ?? p.targaMotrice ?? null;
      const tr = p.targaRimorchio ?? null;
      if (tm) rows.push({ label: "Motrice", targa: String(tm), categoria: getCategoria(tm) });
      if (tr) rows.push({ label: "Rimorchio", targa: String(tr), categoria: getCategoria(tr) });
    } else if (e.tipo === "cambio_mezzo") {
      const t = p.targaMotrice ?? p.targaCamion ?? e.targa ?? null;
      if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
    }
    return rows;
  }

  function formatValue(v: any) {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v === "boolean") return v ? "OK" : "KO";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }

  function formatCambioSide(value: string | null) {
    return value ? String(value) : "(non registrato)";
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
    if ((info.prima.motrice || info.dopo.motrice) && !isSameCambioValue(info.prima.motrice, info.dopo.motrice)) {
      lines.push(
        `MOTRICE: ${formatCambioSide(info.prima.motrice)} -> ${formatCambioSide(info.dopo.motrice)}`
      );
    }
    if ((info.prima.rimorchio || info.dopo.rimorchio) && !isSameCambioValue(info.prima.rimorchio, info.dopo.rimorchio)) {
      lines.push(
        `RIMORCHIO: ${formatCambioSide(info.prima.rimorchio)} -> ${formatCambioSide(info.dopo.rimorchio)}`
      );
    }
    return lines;
  }

  function formatCambioSnapshotBlock(snapshot: { motrice: string | null; rimorchio: string | null }) {
    const motrice = formatCambioSide(snapshot.motrice);
    const rimorchio = formatCambioSide(snapshot.rimorchio);
    return `Motrice: ${motrice}\nRimorchio: ${rimorchio}`;
  }

  function buildDetailsRows(e: HomeEvent) {
    const p: any = e.payload || {};
    const rows: Array<{ label: string; value: string }> = [];

    if (e.tipo === "segnalazione") {
      const tipoProblema = formatValue(p.tipoProblema);
      const descrizione = formatValue(p.descrizione);
      const note = formatValue(p.note);
      const stato = formatValue(p.stato);
      if (tipoProblema) rows.push({ label: "Tipo problema", value: tipoProblema });
      if (descrizione) rows.push({ label: "Descrizione", value: descrizione });
      if (note) rows.push({ label: "Note", value: note });
      if (stato) rows.push({ label: "Stato", value: stato });
    } else if (e.tipo === "rifornimento") {
      const litri = formatValue(p.litri ?? p.quantita);
      const km = formatValue(p.km);
      const importo = formatValue(p.importo);
      const paese = formatValue(p.paese);
      const metodoPagamento = formatValue(p.metodoPagamento);
      const tipo = formatValue(p.tipo);
      const note = formatValue(p.note);
      if (litri) rows.push({ label: "Litri", value: litri });
      if (km) rows.push({ label: "Km", value: km });
      if (importo) rows.push({ label: "Importo", value: importo });
      if (paese) rows.push({ label: "Paese", value: paese });
      if (metodoPagamento) rows.push({ label: "Metodo pagamento", value: metodoPagamento });
      if (tipo) rows.push({ label: "Tipo", value: tipo });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "controllo") {
      const esito = formatValue(p.esito ?? p.tuttoOk ?? p.ok);
      const condizioni = formatValue(p.condizioni);
      const statoCarico = formatValue(p.statoCarico);
      const luogo = formatValue(p.luogo);
      const note = formatValue(p.note);
      if (esito) rows.push({ label: "Esito", value: esito });
      if (condizioni) rows.push({ label: "Condizioni", value: condizioni });
      if (statoCarico) rows.push({ label: "Stato carico", value: statoCarico });
      if (luogo) rows.push({ label: "Luogo", value: luogo });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "cambio_mezzo") {
      const luogo = formatValue(p.luogo);
      const statoCarico = formatValue(p.statoCarico);
      const condizioni = formatValue(p.condizioni);
      const note = formatValue(p.note);
      if (luogo) rows.push({ label: "Luogo", value: luogo });
      if (statoCarico) rows.push({ label: "Stato carico", value: statoCarico });
      if (condizioni) rows.push({ label: "Condizioni", value: condizioni });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "richiesta_attrezzature") {
      const testo = formatValue(p.testo ?? p.richiesta ?? p.messaggio);
      if (testo) rows.push({ label: "Testo", value: testo });
    }

    return rows;
  }

  function getFotoList(p: any) {
    const list: string[] = [];
    if (Array.isArray(p?.foto)) {
      for (const f of p.foto) {
        if (typeof f === "string") list.push(f);
        else if (f?.dataUrl) list.push(String(f.dataUrl));
      }
    }
    if (p?.fotoDataUrl) list.push(String(p.fotoDataUrl));
    if (p?.fotoUrl) list.push(String(p.fotoUrl));
    if (Array.isArray(p?.fotoUrls)) {
      for (const u of p.fotoUrls) {
        if (u) list.push(String(u));
      }
    }
    return list;
  }

  const detailsTitle = useMemo(() => {
    if (!selectedEvent) return "";
    return getTipoLabel(selectedEvent.tipo);
  }, [selectedEvent]);

  function renderDetailsRows(e: HomeEvent) {
    const rows = buildDetailsRows(e);
    return rows.map((row, index) => (
      <div key={`${row.label}-${index}`} className="aix-row">
        <div className="aix-row-top">
          <strong>{row.label}</strong>
          <span>{row.value}</span>
        </div>
      </div>
    ));
  }

  return (
    <div className="autisti-home">
      <div className="autisti-inbox-wrap">
        {/* HEADER */}
        <div className="autisti-header">
          <div className="autisti-header-left">
            <img src="/logo.png" alt="Logo" onClick={() => navigate("/")} />
          <div className="autisti-title-row">
  <h1>Centro di controllo mezzi</h1>

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
  Centro rettifica dati
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
              onClick={() => handleTabClick("segnalazioni")}
              style={
                activeTab === "segnalazioni"
                  ? { background: "#2e7d32", color: "#fff" }
                  : undefined
              }
            >
              Segnalazioni
            </button>
            <button
              onClick={() => handleTabClick("controlli")}
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
              onClick={() => handleTabClick("attrezzature")}
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

          <span>
            {day.toLocaleDateString("it-IT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>

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
            <div className="daily-card" ref={rifornimentiRef}>
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
                rifornimenti.slice(0, 5).map((r, index) => {
                  const p: any = r.payload || {};
                  const litri = p.litri ?? p.quantita ?? "-";
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
                      {formatTime(r.timestamp)} - {r.targa ?? "-"} - {litri} lt
                    </div>
                  );
                })
              )}
            </div>

            {/* SEGNALAZIONI */}
            <div className="daily-card alert" ref={segnalazioniRef}>
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
                controlli.slice(0, 5).map((c, index) => (
                  <div
                    key={
                      c.id ??
                      `${c.tipo ?? "x"}-${c.timestamp ?? 0}-${c.targa ?? ""}-${index}`
                    }
                    className="daily-item"
                    onClick={() => setSelectedEvent(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedEvent(c);
                    }}
                  >
                    {formatTime(c.timestamp)} - {c.targa ?? "-"} - OK
                  </div>
                ))
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
                    : "BADGE non registrato";
                  const nomeLabel = info.nomeAutista || "Autista non registrato";
                  const topLine = `${info.tipoLabel} · ${nomeLabel} (${badgeLabel}) · ${formatTime(
                    c.timestamp
                  )}`;
                  const changeLines = buildCambioLines(info);
                  const tag = info.source === "legacy" ? "LEGACY" : null;
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
                        {tag ? (
                          <span
                            className={`cambio-tag ${
                              tag === "LEGACY" ? "legacy" : "operativo"
                            }`}
                          >
                            {tag}
                          </span>
                        ) : null}
                      </div>
                      {changeLines.length === 0 ? (
                        <div className="cambio-line cambio-line-bot">
                          Dati non registrati
                        </div>
                      ) : (
                        changeLines.map((line, lineIndex) => (
                          <div
                            key={`cambio-${c.id ?? "x"}-${lineIndex}`}
                            className="cambio-line cambio-line-bot"
                          >
                            {line}
                          </div>
                        ))
                      )}
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

          {/* STATO RIMORCHI */}
          <aside className="rimorchi-panel">
            <h2>Stato rimorchi</h2>

            {rimorchi.length === 0 ? (
              <div className="rimorchio-row">Nessun rimorchio</div>
            ) : (
              rimorchi.map((r, index) => (
                <div
                  key={`${r.targa}-${r.stato}-${r.motrice ?? ""}-${index}`}
                  className="rimorchio-row"
                  data-stato={r.stato}
                >
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
        {selectedEvent &&
          (() => {
            const p: any = selectedEvent.payload || {};
            const { nome, badge } = getAutistaInfo(selectedEvent);
            const autistaLabel = badge ? `${nome} (${badge})` : nome;
            const mezzoRows = buildMezzoRows(selectedEvent);
            const detailRows = buildDetailsRows(selectedEvent);
            const fotoList = getFotoList(p);
            const isCambioMezzo = selectedEvent.tipo === "cambio_mezzo";
            const cambioInfo = isCambioMezzo ? getCambioInfo(selectedEvent) : null;
            return (
              <div className="aix-backdrop" onClick={closeDetails}>
                <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="aix-head">
                    <div>
                      <h3>{detailsTitle}</h3>
                      <div style={{ fontSize: "13px", opacity: 0.8 }}>
                        {autistaLabel}
                      </div>
                    </div>
                    <button className="aix-close" onClick={closeDetails} aria-label="Chiudi">
                      X
                    </button>
                  </div>
                  <div className="aix-body">
                    <div className="aix-row">
                      <div className="aix-row-top">
                        <strong>DATA/ORA</strong>
                        <span>{formatDateTime(selectedEvent.timestamp)}</span>
                      </div>
                    </div>

                    {isCambioMezzo && cambioInfo ? (
                      <>
                        <div className="aix-row">
                          <div className="aix-row-top">
                            <strong>PRIMA</strong>
                          </div>
                          <div className="aix-row-bot">
                            {formatCambioSnapshotBlock(cambioInfo.prima)}
                          </div>
                        </div>
                        <div className="aix-row">
                          <div className="aix-row-top">
                            <strong>DOPO</strong>
                          </div>
                          <div className="aix-row-bot">
                            {formatCambioSnapshotBlock(cambioInfo.dopo)}
                          </div>
                        </div>
                      </>
                    ) : null}

                    {mezzoRows.length > 0 && (
                      <>
                        <div className="aix-row">
                          <div className="aix-row-top">
                            <strong>MEZZO</strong>
                          </div>
                        </div>
                        {mezzoRows.map((row, index) => (
                          <div key={`mezzo-${index}`} className="aix-row">
                            <div className="aix-row-top">
                              <strong>{row.label}</strong>
                              <span>{row.targa}</span>
                            </div>
                            {row.categoria ? (
                              <div className="aix-row-bot">
                                Categoria: {row.categoria}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </>
                    )}

                    {detailRows.length > 0 && (
                      <>
                        <div className="aix-row">
                          <div className="aix-row-top">
                            <strong>DETTAGLI</strong>
                          </div>
                        </div>
                        {renderDetailsRows(selectedEvent)}
                      </>
                    )}

                    {fotoList.length > 0 && (
                      <>
                        <div className="aix-row">
                          <div className="aix-row-top">
                            <strong>ALLEGATI/FOTO</strong>
                          </div>
                        </div>
                        <div className="aix-row">
                          <div className="aix-row-bot">
                            {fotoList.map((src, index) => (
                              <img
                                key={`foto-${index}`}
                                src={src}
                                alt="Foto"
                                style={{
                                  maxWidth: "100%",
                                  borderRadius: 8,
                                  marginTop: 8,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="aix-row">
                      <div className="aix-row-top">
                        <strong>JSON</strong>
                        <button
                          type="button"
                          className="daily-more"
                          onClick={() => setShowJson((v) => !v)}
                        >
                          {showJson ? "Nascondi JSON" : "Mostra JSON"}
                        </button>
                      </div>
                    </div>
                    {showJson ? (
                      <pre className="aix-json">
                        {JSON.stringify(p ?? {}, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}



