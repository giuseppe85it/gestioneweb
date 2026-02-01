// ======================================================
// CambioMezzoInbox.tsx
// APP ADMIN - Centro di controllo eventi autisti
// LETTURA ONLY
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CambioMezzoInbox.css";
import { loadHomeEvents, type HomeEvent } from "../utils/homeEvents";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";

function formatDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const dayValue = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayValue}`;
}

function parseDayParam(value: string | null): Date | null {
  if (!value) return null;
  const [yy, mm, dd] = value.split("-").map(Number);
  if (!yy || !mm || !dd) return null;
  const next = new Date(yy, mm - 1, dd);
  if (Number.isNaN(next.getTime())) return null;
  return next;
}

function normTarga(value?: string | null) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function formatTime(ts: number) {
  return formatDateTimeUI(ts);
}

function formatDateTime(ts: number) {
  return formatDateTimeUI(ts);
}

function getAutistaInfo(e: HomeEvent) {
  const p: any = e.payload || {};
  const autistaObj = p.autista && typeof p.autista === "object" ? p.autista : null;
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
      p?.primaRimorchio ?? p?.prima?.rimorchio ?? p?.prima?.targaRimorchio ?? null,
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
  return {
    tipoLabel,
    nomeAutista: autista.nome || "-",
    badgeAutista: autista.badge,
    prima,
    dopo,
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
      `MOTRICE: ${formatCambioSide(info.prima.motrice)} -> ${formatCambioSide(
        info.dopo.motrice
      )}`
    );
  }
  if (
    (info.prima.rimorchio || info.dopo.rimorchio) &&
    !isSameCambioValue(info.prima.rimorchio, info.dopo.rimorchio)
  ) {
    lines.push(
      `RIMORCHIO: ${formatCambioSide(info.prima.rimorchio)} -> ${formatCambioSide(
        info.dopo.rimorchio
      )}`
    );
  }
  return lines;
}

export default function CambioMezzoInbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [day, setDay] = useState<Date>(new Date());
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [filterTarga, setFilterTarga] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const parsed = parseDayParam(params.get("day"));
    if (parsed) setDay(parsed);
  }, [location.search]);

  useEffect(() => {
    let alive = true;
    loadHomeEvents(day).then((list) => {
      if (!alive) return;
      setEvents(list);
    });
    return () => {
      alive = false;
    };
  }, [day]);

  const filtered = useMemo(() => {
    const base = events
      .filter((e) => e.tipo === "cambio_mezzo")
      .sort((a, b) => b.timestamp - a.timestamp);
    const key = normTarga(filterTarga);
    if (!key) return base;
    return base.filter((e) => {
      const t = normTarga(e.targa);
      return t && t.includes(key);
    });
  }, [events, filterTarga]);

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

  function setDayAndUrl(next: Date) {
    setDay(next);
    navigate(`/autisti-inbox/cambio-mezzo?day=${formatDateInputValue(next)}`, {
      replace: true,
    });
  }

  function handleDatePickerChange(value: string) {
    if (!value) return;
    const [year, month, dayValue] = value.split("-").map(Number);
    if (!year || !month || !dayValue) return;
    const next = new Date(year, month - 1, dayValue);
    if (Number.isNaN(next.getTime())) return;
    setDayAndUrl(next);
  }

  return (
    <div className="aix-page">
      <div className="aix-wrap">
        <div className="aix-header">
          <div className="aix-header-left">
            <img
              src="/logo.png"
              alt="Logo"
              className="aix-logo"
              onClick={() => navigate("/")}
            />
            <h1>Cambio mezzo</h1>
          </div>
          <button className="aix-back" onClick={() => navigate("/autisti-inbox")}>
            INDIETRO
          </button>
        </div>

        <div className="aix-card">
          <div className="aix-filters">
            <input
              className="aix-input"
              value={filterTarga}
              onChange={(e) => setFilterTarga(e.target.value)}
              placeholder="Filtra per targa"
            />
            <button
              type="button"
              className="aix-select"
              aria-label="Giorno precedente"
              onClick={() => setDayAndUrl(new Date(day.getTime() - 86400000))}
            >
              PRECEDENTE
            </button>
            <button
              type="button"
              className="aix-select"
              onClick={openDatePicker}
              aria-label="Seleziona data"
            >
              {formatDateUI(day)}
            </button>
            <input
              ref={datePickerRef}
              className="aix-input"
              type="date"
              value={formatDateInputValue(day)}
              onChange={(e) => handleDatePickerChange(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <button
              type="button"
              className="aix-select"
              aria-label="Giorno successivo"
              onClick={() => setDayAndUrl(new Date(day.getTime() + 86400000))}
            >
              SUCCESSIVO
            </button>
            <span className="aix-select">Eventi: {filtered.length}</span>
          </div>

          <div className="aix-list">
            {filtered.length === 0 ? (
              <div className="aix-empty">Nessun cambio per la giornata selezionata</div>
            ) : (
              filtered.map((e, idx) => {
                const info = getCambioInfo(e);
                const badgeLabel = info.badgeAutista
                  ? `BADGE ${info.badgeAutista}`
                  : "BADGE -";
                const nomeLabel = info.nomeAutista || "-";
                const topLine = `${info.tipoLabel} - ${nomeLabel} (${badgeLabel}) - ${formatTime(
                  e.timestamp
                )}`;
                const changeLines = buildCambioLines(info);
                return (
                  <div key={e.id ?? `cambio_${e.timestamp}_${idx}`} className="cmi-card">
                    <div className="cmi-header">
                      <span className="aix-time">{formatDateTime(e.timestamp)}</span>
                    </div>

                    <div className="cmi-main">
                      <div className="cmi-targa">{e.targa || "-"}</div>
                      <div className="cmi-autista">{topLine}</div>
                    </div>

                    {changeLines.map((line, lineIndex) => (
                      <div key={`cambio-${e.id ?? "x"}-${lineIndex}`} className="cmi-row">
                        {line}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
