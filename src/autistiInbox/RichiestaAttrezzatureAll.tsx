import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import "./RichiestaAttrezzatureAll.css";
import { getItemSync } from "../utils/storageSync";

const KEY_RICHIESTE = "@richieste_attrezzature_autisti_tmp";

type RichiestaAttrezzatureRecord = {
  id?: string | null;
  testo?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  timestamp?: number | null;
  stato?: string | null;
  letta?: boolean | null;
  fotoDataUrl?: string | null;
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

export default function RichiestaAttrezzatureAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RichiestaAttrezzatureRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync(KEY_RICHIESTE);
      const list: RichiestaAttrezzatureRecord[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.value)
        ? raw.value
        : [];
      if (alive) setRecords(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    const mapped = records.map((r, index) => {
      const ts = typeof r.timestamp === "number" ? r.timestamp : 0;
      const statoRaw = typeof r.stato === "string" ? r.stato : "";
      const letta = typeof r.letta === "boolean" ? r.letta : true;
      const isNuova = statoRaw.toLowerCase() === "nuova" || letta === false;
      return {
        key: String(r.id ?? `${ts}-${index}`),
        ts,
        autista: r.autistaNome ?? "-",
        badge: r.badgeAutista ?? "-",
        testo: r.testo ?? "-",
        stato: statoRaw || "-",
        isNuova,
        foto: !!r.fotoDataUrl,
      };
    });

    mapped.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    return mapped;
  }, [records]);

  const counts = useMemo(() => {
    const totale = list.length;
    const nuove = list.filter((item) => item.isNuova).length;
    return { totale, nuove };
  }, [list]);

  return (
    <div className="richiesta-inbox-page">
      <div className="richiesta-inbox-card">
        <div className="richiesta-inbox-head">
          <button
            className="richiesta-back-btn"
            type="button"
            onClick={() => navigate("/autisti-inbox")}
          >
            INDIETRO
          </button>
          <h1 className="richiesta-title">Richieste attrezzature</h1>
          <div className="richiesta-head-spacer" aria-hidden="true" />
        </div>

        <div className="richiesta-counts">
          Totale: {counts.totale} - Nuove: {counts.nuove}
        </div>

        {list.length === 0 ? (
          <div className="richiesta-empty">Nessuna richiesta</div>
        ) : (
          <div className="richiesta-list">
            {list.map((item) => {
              const isOpen = openId === item.key;
              return (
                <div
                  className={`richiesta-row ${item.isNuova ? "is-nuova" : ""}`}
                  key={item.key}
                >
                  <button
                    type="button"
                    className="richiesta-row-main"
                    onClick={() => setOpenId(isOpen ? null : item.key)}
                    aria-expanded={isOpen}
                  >
                    <div className="richiesta-row-top">
                      <span className="richiesta-date">{formatDateTime(item.ts)}</span>
                      <span
                        className={`richiesta-badge ${
                          item.isNuova ? "badge-nuova" : "badge-stato"
                        }`}
                      >
                        {item.isNuova ? "NUOVA" : item.stato}
                      </span>
                      {item.foto ? (
                        <span className="richiesta-badge badge-foto">FOTO</span>
                      ) : null}
                    </div>
                    <div className="richiesta-row-mid">
                      Autista: {item.autista} (BADGE {item.badge})
                    </div>
                    <div className="richiesta-row-text">{item.testo}</div>
                  </button>
                  {isOpen ? (
                    <div className="richiesta-row-detail">
                      <div>
                        <strong>Stato:</strong> {item.isNuova ? "NUOVA" : item.stato}
                      </div>
                      <div>
                        <strong>Testo:</strong> {item.testo}
                      </div>
                      <div>
                        <strong>Foto:</strong> {item.foto ? "presente" : "nessuna"}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
