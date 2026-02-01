import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import { formatDateTimeUI } from "../utils/dateFormat";
import "./AutistiGommeAll.css";

type GommeRecord = {
  id?: string | null;
  targetType?: string | null;
  targetTarga?: string | null;
  categoria?: string | null;
  km?: number | null;
  data?: number | null;
  timestamp?: number | null;
  tipo?: string | null;
  stato?: string | null;
  letta?: boolean | null;
  gommeIds?: string[] | null;
  asseId?: string | null;
  asseLabel?: string | null;
  rotazioneSchema?: string | null;
  rotazioneText?: string | null;
  autista?: { nome?: string | null; badge?: string | null } | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
};

type GommeView = GommeRecord & {
  key: string;
  ts: number;
  isNuova: boolean;
  isImportato: boolean;
  targetLabel: string;
  autistaLabel: string;
};

function formatDateTime(ts?: number | null) {
  return formatDateTimeUI(ts ?? null);
}

function normTarga(value?: string | null) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function buildTargetLabel(record: GommeRecord) {
  const targa = record.targetTarga ?? "-";
  const target = String(record.targetType ?? "motrice").toLowerCase();
  if (target === "rimorchio") return `RIMORCHIO: ${targa}`;
  return `MOTRICE: ${targa}`;
}

function buildAutistaLabel(record: GommeRecord) {
  const nome = record.autista?.nome ?? record.autistaNome ?? "-";
  const badge = record.autista?.badge ?? record.badgeAutista ?? null;
  return badge ? `${nome} (${badge})` : String(nome || "-");
}

export default function AutistiGommeAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<GommeRecord[]>([]);
  const [filterTarga, setFilterTarga] = useState("");
  const [onlyNuove, setOnlyNuove] = useState(true);
  const [onlyNonImportati, setOnlyNonImportati] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync("@cambi_gomme_autisti_tmp");
      const list: GommeRecord[] = Array.isArray(raw)
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
    const key = normTarga(filterTarga);
    const items: GommeView[] = records.map((r, index) => {
      const ts =
        typeof r.data === "number"
          ? r.data
          : typeof r.timestamp === "number"
          ? r.timestamp
          : 0;
      const stato = String(r.stato ?? "").toLowerCase();
      const isNuova = stato === "nuova" || r.letta === false;
      const isImportato = stato === "importato";
      return {
        ...r,
        key: String(r.id ?? `${ts}-${index}`),
        ts,
        isNuova,
        isImportato,
        targetLabel: buildTargetLabel(r),
        autistaLabel: buildAutistaLabel(r),
      };
    });

    const ordered = items.sort((a, b) => {
      const ak = a.isNuova ? 0 : 1;
      const bk = b.isNuova ? 0 : 1;
      if (ak !== bk) return ak - bk;
      return (b.ts || 0) - (a.ts || 0);
    });

    let list = ordered;
    if (onlyNuove) list = list.filter((r) => r.isNuova);
    if (onlyNonImportati) list = list.filter((r) => !r.isImportato);
    if (!key) return list;
    return list.filter((r) => {
      const t = normTarga(r.targetTarga ?? null);
      return t && t.includes(key);
    });
  }, [records, filterTarga, onlyNuove, onlyNonImportati]);

  return (
    <div className="aig-page">
      <div className="aig-wrap">
        <div className="aig-header">
          <div className="aig-header-left">
            <img
              src="/logo.png"
              alt="Logo"
              className="aig-logo"
              onClick={() => navigate("/")}
            />
            <h1>Tutte le gomme</h1>
          </div>
          <button className="aig-back" onClick={() => navigate("/autisti-inbox")}>
            INDIETRO
          </button>
        </div>

        <div className="aig-card">
          <div className="aig-filters">
            <input
              className="aig-input"
              value={filterTarga}
              onChange={(e) => setFilterTarga(e.target.value)}
              placeholder="Filtra per targa"
            />
            <label className="aig-toggle">
              <input
                type="checkbox"
                checked={onlyNuove}
                onChange={(e) => setOnlyNuove(e.target.checked)}
              />
              <span>Solo nuove</span>
            </label>
            <label className="aig-toggle">
              <input
                type="checkbox"
                checked={onlyNonImportati}
                onChange={(e) => setOnlyNonImportati(e.target.checked)}
              />
              <span>Solo non importate</span>
            </label>
          </div>

          <div className="aig-list">
            {filtered.length === 0 ? (
              <div className="aig-empty">Nessun evento gomme trovato.</div>
            ) : (
              filtered.map((r) => {
                const isOpen = openId === r.key;
                const tipo = String(r.tipo ?? "-").toUpperCase();
                const statoLabel = r.isNuova ? "NUOVA" : String(r.stato ?? "-");
                const gommeCount = Array.isArray(r.gommeIds) ? r.gommeIds.length : 0;
                const rotazione = r.rotazioneSchema ?? r.rotazioneText ?? null;
                return (
                  <div
                    key={r.key}
                    className="aig-row"
                    onClick={() => setOpenId(isOpen ? null : r.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setOpenId(isOpen ? null : r.key);
                      }
                    }}
                  >
                    <div className="aig-row-top">
                      <span>{formatDateTime(r.ts)}</span>
                      <span>{r.targetLabel}</span>
                      <span>{tipo}</span>
                    </div>
                    <div className="aig-row-mid">
                      <span>KM: {r.km ?? "-"}</span>
                      <span>{r.autistaLabel}</span>
                      <span className={`aig-badge ${r.isNuova ? "nuova" : "stato"}`}>
                        {statoLabel}
                      </span>
                      {r.isImportato ? (
                        <span className="aig-badge importato">IMPORTATO</span>
                      ) : null}
                    </div>
                    {isOpen && (
                      <div className="aig-row-detail">
                        {r.categoria ? <div>Categoria: {r.categoria}</div> : null}
                        {r.asseLabel || r.asseId ? (
                          <div>Asse: {r.asseLabel ?? r.asseId}</div>
                        ) : null}
                        {gommeCount ? <div>Gomme: {gommeCount}</div> : null}
                        {rotazione ? <div>Rotazione: {rotazione}</div> : null}
                        <div>Stato: {statoLabel}</div>
                      </div>
                    )}
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
