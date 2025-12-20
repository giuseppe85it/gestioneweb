import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiAdmin.css";

import {
  loadHomeEvents,
  loadRimorchiStatus,
  type HomeEvent,
  type RimorchioStatus,
} from "../utils/homeEvents";
import { getItemSync, setItemSync } from "../utils/storageSync";

const KEY_SGANCIO_RIMORCHI = "@storico_sganci_rimorchi";
const KEY_SESSIONI = "@autisti_sessione_attive";

type TabKey =
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "cambi"
  | "attrezzature";

function isSameDay(ts: number, day: Date) {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function formatDayLabel(d: Date) {
  const giorni = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
  const mesi = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  return `${giorni[d.getDay()]} ${String(d.getDate()).padStart(2,"0")} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
}

function formatHHMM(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function AutistiAdmin() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("rifornimenti");
  const [day, setDay] = useState<Date>(() => new Date());

  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [storicoRimorchi, setStoricoRimorchi] = useState<any[]>([]);
  const [rimorchiLive, setRimorchiLive] = useState<RimorchioStatus[]>([]);
  const [sessioniRaw, setSessioniRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modale modifica sessione
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetTarga, setEditTargetTarga] = useState<string | null>(null);
  const [editAutista, setEditAutista] = useState("");
  const [editMotrice, setEditMotrice] = useState("");
  const [editRimorchio, setEditRimorchio] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const e = await loadHomeEvents(day);

        const s = (await getItemSync(KEY_SGANCIO_RIMORCHI)) || [];
        const all = Array.isArray(s) ? s : [];

        const live = await loadRimorchiStatus();

        const sess = (await getItemSync(KEY_SESSIONI)) || [];
        const sessArr = Array.isArray(sess) ? sess : [];

        if (!alive) return;
        setEvents(e);
        setStoricoRimorchi(all);
        setRimorchiLive(live);
        setSessioniRaw(sessArr);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [day]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "rifornimenti":
        return events.filter((e) => e.tipo === "rifornimento");
      case "segnalazioni":
        return events.filter((e) => e.tipo === "segnalazione");
      case "controlli":
        return events.filter((e) => e.tipo === "controllo");
      case "cambi":
        return events.filter((e) => e.tipo === "cambio_mezzo");
      case "attrezzature":
        return events.filter((e) => (e as any).tipo === "richiesta_attrezzature");
      default:
        return [];
    }
  }, [events, tab]);

 const agganciRimorchi = useMemo(() => {
  // agganci da storico (solo quelli che esistono perché poi sganciati)
  const fromStorico = storicoRimorchi
    .filter((x) => x?.timestampAggancio && isSameDay(x.timestampAggancio, day))
    .map((x) => ({ ...x, _ts: x.timestampAggancio, _src: "storico" as const }));

  // agganci LIVE del giorno (anche se non ancora sganciati)
  const fromLive = rimorchiLive
    .filter((r) => r.stato === "AGGANCIATO" && r.timestamp && isSameDay(r.timestamp, day))
    .map((r) => ({
      id: `live_${r.targa}_${r.timestamp}`,
      targaRimorchio: r.targa,
      autista: r.autista ?? null,
      targaMotrice: r.motrice ?? null,
      _ts: r.timestamp,
      _src: "live" as const,
    }));

  // merge (evita duplicati: se esiste già da storico, non aggiungere live)
  const map = new Map<string, any>();
  for (const a of fromStorico) {
    const k = `${a.targaRimorchio ?? ""}_${a._ts ?? 0}`;
    map.set(k, a);
  }
  for (const a of fromLive) {
    const k = `${a.targaRimorchio ?? ""}_${a._ts ?? 0}`;
    if (!map.has(k)) map.set(k, a);
  }

  return Array.from(map.values()).sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0));
}, [storicoRimorchi, rimorchiLive, day]);


  const sganciRimorchi = useMemo(() => {
    return storicoRimorchi
      .filter((x) => x?.timestampSgancio && isSameDay(x.timestampSgancio, day))
      .map((x) => ({ ...x, _ts: x.timestampSgancio }))
      .sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0));
  }, [storicoRimorchi, day]);

  const rimorchiInUsoLive = useMemo(() => {
    return rimorchiLive
      .filter((r) => r.stato === "AGGANCIATO")
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [rimorchiLive]);

  async function forceLibero(targaRimorchio: string) {
    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const updated = sess.map((s) => {
      if (s?.targaRimorchio !== targaRimorchio) return s;
      return {
        ...s,
        targaRimorchio: null,
        adminEdit: {
          edited: true,
          editedAt: Date.now(),
          editedBy: "admin",
          note: "Forzato LIBERO da Centro rettifica",
        },
      };
    });

    await setItemSync(KEY_SESSIONI, updated);

    // refresh live
    const live = await loadRimorchiStatus();
    const sess2 = (await getItemSync(KEY_SESSIONI)) || [];
    setRimorchiLive(live);
    setSessioniRaw(Array.isArray(sess2) ? sess2 : []);
  }

  function openEditSession(targaRimorchio: string) {
    // trova la sessione che contiene quel rimorchio
    const s = sessioniRaw.find((x) => x?.targaRimorchio === targaRimorchio) || null;

    setEditTargetTarga(targaRimorchio);
    setEditAutista(String(s?.autistaNome ?? ""));
    setEditMotrice(String(s?.targaMotrice ?? ""));
    setEditRimorchio(String(s?.targaRimorchio ?? targaRimorchio));
    setEditOpen(true);
  }

  async function saveEditSession() {
    if (!editTargetTarga) return;

    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const updated = sess.map((s) => {
      if (s?.targaRimorchio !== editTargetTarga) return s;

      return {
        ...s,
        autistaNome: editAutista.trim() || null,
        targaMotrice: editMotrice.trim() || null,
        targaRimorchio: editRimorchio.trim() || null,
        adminEdit: {
          edited: true,
          editedAt: Date.now(),
          editedBy: "admin",
          note: "Modifica sessione attiva da Centro rettifica",
          patch: {
            autistaNome: editAutista.trim() || null,
            targaMotrice: editMotrice.trim() || null,
            targaRimorchio: editRimorchio.trim() || null,
          },
        },
      };
    });

    await setItemSync(KEY_SESSIONI, updated);

    const live = await loadRimorchiStatus();
    const sess2 = (await getItemSync(KEY_SESSIONI)) || [];
    setRimorchiLive(live);
    setSessioniRaw(Array.isArray(sess2) ? sess2 : []);

    setEditOpen(false);
    setEditTargetTarga(null);
  }

  return (
    <div className="autisti-admin-page">
      <div className="autisti-admin-wrap">
        <div className="autisti-admin-head">
          <button
            type="button"
            className="autisti-admin-back"
            onClick={() => navigate("/autisti-inbox")}
          >
            ← INBOX
          </button>

          <h1>Centro rettifica dati</h1>
        </div>

        {/* LIVE RIMORCHI */}
        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>Rimorchi attualmente in uso (LIVE)</h2>
            {loading && <span className="loading">Caricamento…</span>}
          </div>

          {!loading && rimorchiInUsoLive.length === 0 && (
            <div className="empty">Nessun rimorchio agganciato al momento.</div>
          )}

          {rimorchiInUsoLive.map((r) => (
            <div className="row" key={`live_${r.targa}_${r.timestamp}`}>
              <div className="row-left">
                <div className="time">{r.timestamp ? formatHHMM(r.timestamp) : "--:--"}</div>
                <div className="main">
                  <div className="line1">
                    <strong>{r.targa}</strong>
                    <span className="sep">•</span>
                    <span>{r.autista ?? "-"}</span>
                    <span className="sep">•</span>
                    <span>{r.motrice ?? "-"}</span>
                  </div>
                </div>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="edit"
                  onClick={() => openEditSession(r.targa)}
                >
                  MODIFICA
                </button>
                <button
                  type="button"
                  className="edit danger"
                  onClick={() => forceLibero(r.targa)}
                  title="Rimuove il rimorchio dalla sessione attiva"
                >
                  FORZA LIBERO
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* TABS + DATA */}
        <div className="autisti-admin-topbar">
          <div className="autisti-admin-tabs">
            <button
              className={tab === "rifornimenti" ? "tab active" : "tab"}
              onClick={() => setTab("rifornimenti")}
              type="button"
            >
              Rifornimenti
            </button>
            <button
              className={tab === "segnalazioni" ? "tab active" : "tab"}
              onClick={() => setTab("segnalazioni")}
              type="button"
            >
              Segnalazioni
            </button>
            <button
              className={tab === "controlli" ? "tab active" : "tab"}
              onClick={() => setTab("controlli")}
              type="button"
            >
              Controllo mezzo
            </button>
            <button
              className={tab === "cambi" ? "tab active" : "tab"}
              onClick={() => setTab("cambi")}
              type="button"
            >
              Cambio mezzo
            </button>
            <button
              className={tab === "attrezzature" ? "tab active" : "tab"}
              onClick={() => setTab("attrezzature")}
              type="button"
            >
              Richieste attrezzature
            </button>
          </div>

          <div className="autisti-admin-datebar">
            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))
              }
              title="Giorno precedente"
            >
              ◀
            </button>

            <span className="label">{formatDayLabel(day)}</span>

            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
              }
              title="Giorno successivo"
            >
              ▶
            </button>
          </div>
        </div>

        {/* LISTA PER CATEGORIA */}
        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>{tab === "cambi" ? "Cambio mezzo (motrice)" : tab.toUpperCase()}</h2>
            {loading && <span className="loading">Caricamento…</span>}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="empty">Nessun elemento per questa data.</div>
          )}

          {filtered.map((e) => (
            <div className="row" key={e.id}>
              <div className="row-left">
                <div className="time">{formatHHMM(e.timestamp)}</div>
                <div className="main">
                  <div className="line1">
                    <strong>{e.targa ?? "-"}</strong>
                    <span className="sep">•</span>
                    <span>{e.autista ?? "-"}</span>
                  </div>
                </div>
              </div>

              <button type="button" className="edit" disabled title="Step successivo">
                MODIFICA
              </button>
            </div>
          ))}
        </div>

        {tab === "cambi" && (
          <>
            <div className="autisti-admin-card">
              <div className="autisti-admin-card-head">
                <h2>Agganci rimorchi</h2>
                {loading && <span className="loading">Caricamento…</span>}
              </div>

              {!loading && agganciRimorchi.length === 0 && (
                <div className="empty">Nessun aggancio per questa data.</div>
              )}

              {agganciRimorchi.map((a) => (
                <div className="row" key={a.id ?? `${a._ts}_${a.targaRimorchio}`}>
                  <div className="row-left">
                    <div className="time">{a._ts ? formatHHMM(a._ts) : "--:--"}</div>
                    <div className="main">
                    <div className="line1">
  <strong>{a.targaRimorchio ?? "-"}</strong>

  {a._src === "storico" ? (
    <>
      <span className="sep">•</span>
      <span>{a.autista ?? "-"}</span>
      {a.targaMotrice ? (
        <>
          <span className="sep">•</span>
          <span>{a.targaMotrice}</span>
        </>
      ) : null}
    </>
  ) : (
    <>
      <span className="sep">•</span>
      <span className="muted">AGGANCIO</span>
    </>
  )}
</div>

                    </div>
                  </div>

                  <button type="button" className="edit" disabled title="Step successivo">
                    MODIFICA
                  </button>
                </div>
              ))}
            </div>

            <div className="autisti-admin-card">
              <div className="autisti-admin-card-head">
                <h2>Sganci rimorchi</h2>
                {loading && <span className="loading">Caricamento…</span>}
              </div>

              {!loading && sganciRimorchi.length === 0 && (
                <div className="empty">Nessuno sgancio per questa data.</div>
              )}

              {sganciRimorchi.map((s) => (
                <div className="row" key={s.id ?? `${s._ts}_${s.targaRimorchio}`}>
                  <div className="row-left">
                    <div className="time">{s._ts ? formatHHMM(s._ts) : "--:--"}</div>
                    <div className="main">
                      <div className="line1">
                        <strong>{s.targaRimorchio ?? "-"}</strong>
                        <span className="sep">•</span>
                        <span>{s.autista ?? "-"}</span>
                        {s.targaMotrice ? (
                          <>
                            <span className="sep">•</span>
                            <span>{s.targaMotrice}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button type="button" className="edit" disabled title="Step successivo">
                    MODIFICA
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MODALE EDIT SESSIONE LIVE */}
        {editOpen && (
          <div className="aix-backdrop" onMouseDown={() => setEditOpen(false)}>
            <div className="aix-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>Modifica sessione rimorchio LIVE</h3>
                <button className="aix-close" type="button" onClick={() => setEditOpen(false)}>
                  CHIUDI
                </button>
              </div>

              <div className="aix-body">
                <div className="aix-form">
                  <label>
                    Autista
                    <input value={editAutista} onChange={(e) => setEditAutista(e.target.value)} />
                  </label>
                  <label>
                    Motrice
                    <input value={editMotrice} onChange={(e) => setEditMotrice(e.target.value)} />
                  </label>
                  <label>
                    Rimorchio
                    <input value={editRimorchio} onChange={(e) => setEditRimorchio(e.target.value)} />
                  </label>
                </div>

                <div className="aix-actions">
                  <button className="edit" type="button" onClick={saveEditSession}>
                    SALVA
                  </button>
                  {editTargetTarga ? (
                    <button
                      className="edit danger"
                      type="button"
                      onClick={() => forceLibero(editTargetTarga)}
                    >
                      FORZA LIBERO
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
