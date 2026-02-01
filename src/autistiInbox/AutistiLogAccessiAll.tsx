import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import { formatDateTimeUI } from "../utils/dateFormat";
import "./AutistiSegnalazioniAll.css";

const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";
const LOG_TYPES = new Set([
  "LOGIN_AUTISTA",
  "LOGOUT_AUTISTA",
  "INIZIO_ASSETTO",
  "CAMBIO_ASSETTO",
]);

type EventoOperativo = {
  id?: string | number;
  tipo?: string;
  timestamp?: number | string;
  badgeAutista?: string | null;
  badge?: string | null;
  nomeAutista?: string | null;
  autistaNome?: string | null;
  autista?: string | null;
};

type LogItem = {
  id: string;
  tipo: string;
  ts: number | null;
  badge: string;
  nome: string;
};

function toTs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && typeof (value as any).toMillis === "function") {
    const parsed = (value as any).toMillis();
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatDateTime(ts: number | null) {
  return formatDateTimeUI(ts ?? null);
}

function buildBadgeLabel(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function buildNameLabel(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

export default function AutistiLogAccessiAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EventoOperativo[]>([]);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LOGIN" | "LOGOUT" | "INIZIO" | "CAMBIO">(
    "ALL"
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync(KEY_STORICO_EVENTI_OPERATIVI);
      const list = Array.isArray(raw)
        ? raw
        : raw?.value && Array.isArray(raw.value)
        ? raw.value
        : [];
      if (!alive) return;
      setRecords(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const items: LogItem[] = [];
    for (const r of records) {
      const tipo = String(r?.tipo ?? "").trim().toUpperCase();
      if (!LOG_TYPES.has(tipo)) continue;
      const ts = toTs(r?.timestamp ?? null);
      const badge = buildBadgeLabel(r?.badgeAutista ?? r?.badge ?? "—");
      const nome = buildNameLabel(r?.nomeAutista ?? r?.autistaNome ?? r?.autista ?? "—");
      const id = String(r?.id ?? `${tipo}-${ts ?? 0}-${badge}-${nome}`);
      items.push({ id, tipo, ts, badge, nome });
    }
    const ordered = items.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    const suppressInizio = (list: LogItem[]) => {
      const loginByBadge = new Map<string, number[]>();
      for (const item of list) {
        if (item.tipo !== "LOGIN_AUTISTA") continue;
        if (item.ts == null) continue;
        if (!item.badge || item.badge === "—") continue;
        const prev = loginByBadge.get(item.badge) ?? [];
        prev.push(item.ts);
        loginByBadge.set(item.badge, prev);
      }
      const tenMinutes = 10 * 60 * 1000;
      return list.filter((item) => {
        if (item.tipo !== "INIZIO_ASSETTO") return true;
        if (item.ts == null) return true;
        if (!item.badge || item.badge === "—") return true;
        const logins = loginByBadge.get(item.badge);
        if (!logins || logins.length === 0) return true;
        return !logins.some((loginTs) => loginTs <= item.ts! && item.ts! - loginTs <= tenMinutes);
      });
    };

    if (typeFilter === "ALL") return suppressInizio(ordered);
    if (typeFilter === "LOGIN") return ordered.filter((r) => r.tipo === "LOGIN_AUTISTA");
    if (typeFilter === "LOGOUT") return ordered.filter((r) => r.tipo === "LOGOUT_AUTISTA");
    if (typeFilter === "INIZIO") {
      return suppressInizio(ordered).filter((r) => r.tipo === "INIZIO_ASSETTO");
    }
    if (typeFilter === "CAMBIO") return ordered.filter((r) => r.tipo === "CAMBIO_ASSETTO");
    return ordered;
  }, [records, typeFilter]);

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
            <h1>Log accessi</h1>
          </div>
          <button className="aix-back" onClick={() => navigate("/autisti-inbox")}>
            INDIETRO
          </button>
        </div>

        <div className="aix-card">
          <div className="aix-filters" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="aix-select"
              style={{
                background: typeFilter === "ALL" ? "#2e7d32" : "#fff",
                color: typeFilter === "ALL" ? "#fff" : "#111",
                cursor: "pointer",
              }}
              onClick={() => setTypeFilter("ALL")}
            >
              Tutti
            </button>
            <button
              type="button"
              className="aix-select"
              style={{
                background: typeFilter === "LOGIN" ? "#2e7d32" : "#fff",
                color: typeFilter === "LOGIN" ? "#fff" : "#111",
                cursor: "pointer",
              }}
              onClick={() => setTypeFilter("LOGIN")}
            >
              Login
            </button>
            <button
              type="button"
              className="aix-select"
              style={{
                background: typeFilter === "LOGOUT" ? "#2e7d32" : "#fff",
                color: typeFilter === "LOGOUT" ? "#fff" : "#111",
                cursor: "pointer",
              }}
              onClick={() => setTypeFilter("LOGOUT")}
            >
              Logout
            </button>
            <button
              type="button"
              className="aix-select"
              style={{
                background: typeFilter === "INIZIO" ? "#2e7d32" : "#fff",
                color: typeFilter === "INIZIO" ? "#fff" : "#111",
                cursor: "pointer",
              }}
              onClick={() => setTypeFilter("INIZIO")}
            >
              Inizio assetto
            </button>
            <button
              type="button"
              className="aix-select"
              style={{
                background: typeFilter === "CAMBIO" ? "#2e7d32" : "#fff",
                color: typeFilter === "CAMBIO" ? "#fff" : "#111",
                cursor: "pointer",
              }}
              onClick={() => setTypeFilter("CAMBIO")}
            >
              Cambio assetto
            </button>
          </div>

          <div className="aix-row" style={{ background: "#f8fafc", cursor: "default" }}>
            <div
              className="aix-row-top"
              style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}
            >
              <span>Data/Ora</span>
              <span>Tipo</span>
              <span>Badge</span>
              <span>Nome</span>
            </div>
          </div>

          <div className="aix-list">
            {filtered.length === 0 ? (
              <div className="aix-empty">Nessun log disponibile.</div>
            ) : (
              filtered.map((r) => (
                <div className="aix-row" key={r.id}>
                  <div className="aix-row-top" style={{ fontSize: 15, gap: 16 }}>
                    <strong>{formatDateTime(r.ts)}</strong>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#eef2ff",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {r.tipo}
                    </span>
                    <span>{r.badge}</span>
                    <span>{r.nome}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
