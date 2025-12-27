import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import { generateControlloPDF } from "../utils/pdfEngine";
import "./AutistiControlliAll.css";

type ControlloRecord = {
  id?: string;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  targaCamion?: string | null;
  targaRimorchio?: string | null;
  target?: string | null;
  check?: Record<string, boolean>;
  note?: string | null;
  timestamp?: number | null;
};

type ControlloView = ControlloRecord & {
  isKO: boolean;
  koList: string[];
  targetLabel: string;
  targaLabel: string;
};

function formatDateTime(ts?: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normTarga(value?: string | null) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function buildTargetLabel(record: ControlloRecord) {
  const target = String(record.target ?? "").toLowerCase();
  if (target === "rimorchio") return "RIMORCHIO";
  if (target === "motrice") return "MOTRICE";
  if (target === "entrambi") return "ENTRAMBI";
  return "MEZZO";
}

function buildTargaLabel(record: ControlloRecord) {
  const target = String(record.target ?? "").toLowerCase();
  const motrice = record.targaCamion ?? "-";
  const rimorchio = record.targaRimorchio ?? "-";
  if (target === "rimorchio") return `RIMORCHIO: ${rimorchio}`;
  if (target === "motrice") return `MOTRICE: ${motrice}`;
  if (target === "entrambi") return `MOTRICE: ${motrice} | RIMORCHIO: ${rimorchio}`;
  return `MOTRICE: ${motrice}${rimorchio ? ` | RIMORCHIO: ${rimorchio}` : ""}`;
}

export default function AutistiControlliAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ControlloRecord[]>([]);
  const [filterTarga, setFilterTarga] = useState("");
  const [onlyKo, setOnlyKo] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync("@controlli_mezzo_autisti");
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
    const key = normTarga(filterTarga);
    const items: ControlloView[] = records.map((r) => {
      const check = r.check && typeof r.check === "object" ? r.check : {};
      const koList = Object.entries(check)
        .filter(([, v]) => v === false)
        .map(([k]) => String(k).toUpperCase());
      const isKO = koList.length > 0;
      return {
        ...r,
        isKO,
        koList,
        targetLabel: buildTargetLabel(r),
        targaLabel: buildTargaLabel(r),
      };
    });

    const ordered = items.sort((a, b) => {
      const ak = a.isKO ? 0 : 1;
      const bk = b.isKO ? 0 : 1;
      if (ak !== bk) return ak - bk;
      const ta = typeof a.timestamp === "number" ? a.timestamp : 0;
      const tb = typeof b.timestamp === "number" ? b.timestamp : 0;
      return tb - ta;
    });

    const filteredByKo = onlyKo ? ordered.filter((r) => r.isKO) : ordered;
    if (!key) return filteredByKo;
    return filteredByKo.filter((r) => {
      const tm = normTarga(r.targaCamion);
      const tr = normTarga(r.targaRimorchio);
      return (tm && tm.includes(key)) || (tr && tr.includes(key));
    });
  }, [records, filterTarga, onlyKo]);

  return (
    <div className="aic-page">
      <div className="aic-wrap">
        <div className="aic-header">
          <div className="aic-header-left">
            <img
              src="/logo.png"
              alt="Logo"
              className="aic-logo"
              onClick={() => navigate("/")}
            />
            <h1>Tutti i controlli</h1>
          </div>
          <button className="aic-back" onClick={() => navigate("/autisti-inbox")}>
            INDIETRO
          </button>
        </div>

        <div className="aic-card">
          <div className="aic-filters">
            <input
              className="aic-input"
              value={filterTarga}
              onChange={(e) => setFilterTarga(e.target.value)}
              placeholder="Filtra per targa"
            />
            <label className="aic-toggle">
              <input
                type="checkbox"
                checked={onlyKo}
                onChange={(e) => setOnlyKo(e.target.checked)}
              />
              <span>Mostra solo KO</span>
            </label>
          </div>

          <div className="aic-list">
            {filtered.length === 0 ? (
              <div className="aic-empty">Nessun controllo disponibile.</div>
            ) : (
              filtered.map((r, index) => {
                const autista = r.autistaNome ?? "-";
                const badge = r.badgeAutista ? `(${r.badgeAutista})` : "";
                return (
                  <div className="aic-row" key={r.id ?? `ctrl_${index}`}>
                    <div className="aic-row-main">
                      <div className="aic-row-top">
                        <span className="aic-time">{formatDateTime(r.timestamp)}</span>
                        <span className="aic-target">{r.targetLabel}</span>
                      </div>
                      <div className="aic-row-mid">
                        <span className="aic-targa">{r.targaLabel}</span>
                        <span className="aic-autista">
                          {autista} {badge}
                        </span>
                      </div>
                      <div className="aic-row-bot">
                        <span className={r.isKO ? "aic-badge ko" : "aic-badge ok"}>
                          {r.isKO ? "KO" : "OK"}
                        </span>
                        {r.isKO && (
                          <span className="aic-ko-list">
                            KO: {r.koList.join(", ")}
                          </span>
                        )}
                        <button
                          type="button"
                          className="aic-back"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          onClick={() => {
                            void generateControlloPDF(r);
                          }}
                        >
                          PDF
                        </button>
                      </div>
                      {r.note ? <div className="aic-note">{r.note}</div> : null}
                    </div>
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
