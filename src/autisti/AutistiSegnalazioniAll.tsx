import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import "./AutistiSegnalazioniAll.css";

type SegnalazioneRecord = {
  id?: string;
  data?: number | null;
  timestamp?: number | null;
  stato?: string | null;
  letta?: boolean | null;
  ambito?: string | null;
  targa?: string | null;
  targaCamion?: string | null;
  targaRimorchio?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  tipoProblema?: string | null;
  descrizione?: string | null;
  note?: string | null;
  foto?: Array<{ dataUrl?: string }> | null;
};

type SegnalazioneView = SegnalazioneRecord & {
  isNuova: boolean;
  ts: number;
  targaLabel: string;
  ambitoLabel: string;
  fotoCount: number;
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

function buildTargaLabel(r: SegnalazioneRecord) {
  const targa =
    r.targa ?? r.targaCamion ?? r.targaRimorchio ?? "-";
  return String(targa || "-");
}

export default function AutistiSegnalazioniAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SegnalazioneRecord[]>([]);
  const [filterTarga, setFilterTarga] = useState("");
  const [filterAmbito, setFilterAmbito] = useState<"tutti" | "motrice" | "rimorchio">("tutti");
  const [onlyNuove, setOnlyNuove] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync("@segnalazioni_autisti_tmp");
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
    const items: SegnalazioneView[] = records.map((r) => {
      const ts =
        typeof r.data === "number"
          ? r.data
          : typeof r.timestamp === "number"
          ? r.timestamp
          : 0;
      const isNuova = r.stato === "nuova" || r.letta === false;
      const fotoCount = Array.isArray(r.foto) ? r.foto.length : 0;
      const ambito = String(r.ambito ?? "").toLowerCase();
      return {
        ...r,
        isNuova,
        ts,
        targaLabel: buildTargaLabel(r),
        ambitoLabel: ambito ? ambito.toUpperCase() : "—",
        fotoCount,
      };
    });

    const ordered = items.sort((a, b) => {
      const ak = a.isNuova ? 0 : 1;
      const bk = b.isNuova ? 0 : 1;
      if (ak !== bk) return ak - bk;
      return (b.ts || 0) - (a.ts || 0);
    });

    const filteredByNuove = onlyNuove ? ordered.filter((r) => r.isNuova) : ordered;
    const filteredByAmbito =
      filterAmbito === "tutti"
        ? filteredByNuove
        : filteredByNuove.filter(
            (r) => String(r.ambito ?? "").toLowerCase() === filterAmbito
          );
    if (!key) return filteredByAmbito;
    return filteredByAmbito.filter((r) => {
      const t = normTarga(r.targaCamion ?? r.targaRimorchio ?? r.targa ?? null);
      return t && t.includes(key);
    });
  }, [records, filterTarga, filterAmbito, onlyNuove]);

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
            <h1>Tutte le segnalazioni</h1>
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
            <select
              className="aix-select"
              value={filterAmbito}
              onChange={(e) => setFilterAmbito(e.target.value as "tutti" | "motrice" | "rimorchio")}
            >
              <option value="tutti">Tutti gli ambiti</option>
              <option value="motrice">Motrice</option>
              <option value="rimorchio">Rimorchio</option>
            </select>
            <label className="aix-toggle">
              <input
                type="checkbox"
                checked={onlyNuove}
                onChange={(e) => setOnlyNuove(e.target.checked)}
              />
              <span>Solo nuove</span>
            </label>
          </div>

          <div className="aix-list">
            {filtered.length === 0 ? (
              <div className="aix-empty">Nessuna segnalazione disponibile.</div>
            ) : (
              filtered.map((r, index) => {
                const autista = r.autistaNome ?? "-";
                const badge = r.badgeAutista ? `(${r.badgeAutista})` : "";
                const isOpen = openId === String(r.id ?? `seg_${index}`);
                return (
                  <div
                    className="aix-row"
                    key={r.id ?? `seg_${index}`}
                    onClick={() =>
                      setOpenId(isOpen ? null : String(r.id ?? `seg_${index}`))
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setOpenId(isOpen ? null : String(r.id ?? `seg_${index}`));
                      }
                    }}
                  >
                    <div className="aix-row-top">
                      <span className="aix-time">{formatDateTime(r.ts)}</span>
                      <span className="aix-ambito">{r.ambitoLabel}</span>
                      <span className="aix-targa">{r.targaLabel}</span>
                    </div>
                    <div className="aix-row-mid">
                      <span className="aix-autista">
                        {autista} {badge}
                      </span>
                      {r.isNuova && <span className="aix-badge nuova">NUOVA</span>}
                      <span className="aix-foto">Foto: {r.fotoCount}</span>
                    </div>
                    <div className="aix-row-bot">
                      <span className="aix-tipo">{r.tipoProblema ?? "—"}</span>
                      <span className="aix-desc">{r.descrizione ?? "—"}</span>
                    </div>
                    {isOpen && (
                      <div className="aix-row-detail">
                        {r.note ? <div>Note: {r.note}</div> : null}
                        <div>Foto totali: {r.fotoCount}</div>
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
