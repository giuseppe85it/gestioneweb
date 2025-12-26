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
  fotoUrl?: string | null;
  fotoUrls?: string[] | null;
  foto?: Array<{ dataUrl?: string; url?: string } | string> | null;
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

function getFotoList(r: RichiestaAttrezzatureRecord) {
  const list: string[] = [];
  if (Array.isArray(r?.foto)) {
    for (const f of r.foto) {
      if (typeof f === "string") list.push(f);
      else if (f?.dataUrl) list.push(String(f.dataUrl));
      else if (f?.url) list.push(String(f.url));
    }
  }
  if (r?.fotoDataUrl) list.push(String(r.fotoDataUrl));
  if (r?.fotoUrl) list.push(String(r.fotoUrl));
  if (Array.isArray(r?.fotoUrls)) {
    for (const u of r.fotoUrls) {
      if (u) list.push(String(u));
    }
  }
  return list;
}

export default function RichiestaAttrezzatureAll() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RichiestaAttrezzatureRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
      const fotoList = getFotoList(r);
      return {
        key: String(r.id ?? `${ts}-${index}`),
        ts,
        autista: r.autistaNome ?? "-",
        badge: r.badgeAutista ?? "-",
        testo: r.testo ?? "-",
        stato: statoRaw || "-",
        isNuova,
        fotoList,
        fotoCount: fotoList.length,
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
                      {item.fotoCount > 0 ? (
                        <span className="richiesta-badge badge-foto">FOTO</span>
                      ) : null}
                    </div>
                    <div className="richiesta-row-mid">
                      Autista: {item.autista} (BADGE {item.badge})
                    </div>
                    <div className="richiesta-row-text">{item.testo}</div>
                  </button>
                  {item.fotoCount > 0 ? (
                    <div className="richiesta-photo-grid">
                      {item.fotoList.slice(0, 3).map((src, idx) => (
                        <button
                          key={`foto_${item.key}_${idx}`}
                          type="button"
                          className="richiesta-photo-thumb"
                          onClick={() => setLightboxSrc(src)}
                        >
                          <img src={src} alt="Foto richiesta" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {isOpen ? (
                    <div className="richiesta-row-detail">
                      <div>
                        <strong>Stato:</strong> {item.isNuova ? "NUOVA" : item.stato}
                      </div>
                      <div>
                        <strong>Testo:</strong> {item.testo}
                      </div>
                      <div>
                        <strong>Foto:</strong>{" "}
                        {item.fotoCount > 0 ? `${item.fotoCount} presenti` : "nessuna"}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {lightboxSrc ? (
        <div className="richiesta-lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            type="button"
            className="richiesta-lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Chiudi"
          >
            X
          </button>
          <img
            src={lightboxSrc}
            alt="Foto richiesta"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
