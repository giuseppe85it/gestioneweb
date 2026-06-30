// src/autisti/SetupMezzo.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./autisti.css";
import "./SetupMezzo.css";
import { getItemSync, setItemSync, updateSessioniAtomic } from "../utils/storageSync";
import {
  clearLastHandledRevokedAt,
  getAutistaLocal,
  getMezzoLocal,
  removeAutistaLocal,
  removeMezzoLocal,
  saveMezzoLocal,
} from "./autistiStorage";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";
const KEY_PERMESSI_AUTISTI = "@permessi_autisti";

type Mode = "rimorchio" | "motrice" | "none";

type MezzoCategoria =
  | "motrice 2 assi"
  | "motrice 3 assi"
  | "motrice 4 assi"
  | "trattore stradale"
  | "semirimorchio asse fisso"
  | "semirimorchio asse sterzante"
  | "pianale"
  | "biga"
  | "centina"
  | "vasca"
  | string;

interface Mezzo {
  id: string;
  targa: string;
  categoria?: MezzoCategoria;
  autistaNome?: string | null;
}

interface SessioneAttiva {
  targaMotrice: string | null;
  targaRimorchio: string | null;
  badgeAutista: string;
  nomeAutista: string;
  autistaNome?: string | null;
  autista?: string | null;
  revoked?: {
    at: number;
    scope: "MOTRICE" | "RIMORCHIO" | "TUTTO";
    by?: string;
    reason?: string;
  };
  timestamp: number;
}

type EventoOperativo = {
  id: string;
  tipo: string;
  timestamp: number;
  badgeAutista: string;
  nomeAutista: string;
  autista?: string;
  autistaNome?: string;
  prima: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  dopo: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  luogo: string | null;
  statoCarico: string | null;
  condizioni: any;
  source: string;
};

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

// Regola aggancio: una MOTRICE a 2/3/4 assi può trainare SOLO un rimorchio
// di categoria "biga". Il "trattore stradale" NON è una motrice 2/3/4 assi
// (traina semirimorchi) e quindi non è soggetto al vincolo.
function isMotriceVincolata(categoria?: string) {
  const cat = norm(String(categoria || ""));
  if (!cat.includes("motrice")) return false;
  return cat.includes("2 ass") || cat.includes("3 ass") || cat.includes("4 ass");
}

function isCategoriaBiga(categoria?: string) {
  return norm(String(categoria || "")).includes("biga");
}

const fmtTarga = (t: string) => (t || "").trim().toUpperCase();
const fmtText = (t: any) => String(t ?? "").trim();

function getCategoriaLabel(mezzo: any) {
  const value =
    mezzo?.categoria ?? mezzo?.categoriaMezzo ?? mezzo?.tipoMezzo ?? mezzo?.tipo ?? "";
  return fmtText(value) || "-";
}

function getAutistaSolito(mezzo: any) {
  const value = mezzo?.autistaNome ?? mezzo?.driverName ?? "";
  return fmtText(value) || "-";
}

async function appendEventoOperativo(evt: EventoOperativo) {
  const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
  const list: EventoOperativo[] = Array.isArray(raw) ? raw : [];
  if (list.some((e) => e?.id === evt.id)) return;
  list.push(evt);
  await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, list);
}

// Visibilità "Oggi non guido": stesso criterio della Home per il modulo "orari-note"
// (AUTISTI_MODULI in HomeAutista.tsx). orari-note ha defaultOn=false: se il badge non
// ha un permesso esplicito a true, il pulsante resta nascosto.
function isOrariNoteAttivo(raw: unknown, badge: string): boolean {
  const badgeKey = String(badge ?? "").trim();
  if (!badgeKey || !raw || typeof raw !== "object") return false;
  const permessi = (raw as { permessi?: unknown }).permessi;
  if (!permessi || typeof permessi !== "object" || Array.isArray(permessi)) return false;
  const perBadge = (permessi as Record<string, unknown>)[badgeKey];
  if (!perBadge || typeof perBadge !== "object" || Array.isArray(perBadge)) return false;
  const value = (perBadge as Record<string, unknown>)["orari-note"];
  return typeof value === "boolean" ? value : false;
}

export default function SetupMezzo() {
  const nav = useNavigate();
  const loc = useLocation();

  const qs = new URLSearchParams(loc.search);
  const mode = (qs.get("mode") as Mode) || "none";

  const autista = useMemo(() => {
    const a: any = getAutistaLocal();
    if (!a?.badge || !a?.nome) return null;
    return { badge: String(a.badge), nome: String(a.nome) };
  }, []);

  const mezzoLocal = useMemo(() => {
    const m: any = getMezzoLocal();
    if (!m) return null;
    return {
      targaCamion: m?.targaCamion ? String(m.targaCamion) : null,
      targaCamionPrima: m?.targaCamionPrima ? String(m.targaCamionPrima) : null,
      targaRimorchio: m?.targaRimorchio ? String(m.targaRimorchio) : null,
      timestamp: typeof m?.timestamp === "number" ? m.timestamp : null,
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [orariAttivo, setOrariAttivo] = useState(false);

  const [mezziAll, setMezziAll] = useState<Mezzo[]>([]);
  const [sessioni, setSessioni] = useState<SessioneAttiva[]>([]);

  const [targaCamion, setTargaCamion] = useState("");
  const [targaRimorchio, setTargaRimorchio] = useState<string | null>(null);

  const lockMotrice = mode === "rimorchio" && !!mezzoLocal?.targaCamion;
  const lockRimorchio = mode === "motrice" && !!mezzoLocal?.targaRimorchio;

  const motriciAll = useMemo(() => {
    return mezziAll.filter((m) => {
      const cat = norm(String(m.categoria || ""));
      return cat.includes("motrice") || cat.includes("trattore");
    });
  }, [mezziAll]);

  const rimorchiAll = useMemo(() => {
    return mezziAll.filter((m) => {
      const cat = norm(String(m.categoria || ""));
      return (
        cat.includes("semirimorchio") ||
        cat.includes("rimorchio") ||
        cat.includes("porta silo container") ||
        cat.includes("pianale") ||
        cat.includes("biga") ||
        cat.includes("centina") ||
        cat.includes("vasca")
      );
    });
  }, [mezziAll]);

  const categoriaByTarga = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of mezziAll) {
      const key = fmtTarga(String(m.targa || ""));
      if (key) map.set(key, String(m.categoria || ""));
    }
    return map;
  }, [mezziAll]);

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        setLoading(true);
        setErrore("");

        if (!autista?.badge) {
          setErrore("Autista non valido. Fai login.");
          return;
        }

        const rawMezzi = (await getItemSync(MEZZI_KEY)) || [];
        const mezzi: Mezzo[] = Array.isArray(rawMezzi) ? rawMezzi : [];
        const fixed = mezzi.map((m: any) => ({
          id: String(m?.id ?? ""),
          targa: fmtTarga(String(m?.targa ?? "")),
          categoria: m?.categoria,
          autistaNome: m?.autistaNome ?? null,
        }));
        if (!alive) return;
        setMezziAll(fixed);

        const rawSess = (await getItemSync(SESSIONI_KEY)) || [];
        const sessArr: SessioneAttiva[] = Array.isArray(rawSess) ? rawSess : [];
        if (!alive) return;
        setSessioni(sessArr);

        // Permesso modulo orari per il badge: decide se mostrare "Oggi non guido".
        // Letto qui (insieme a mezzi/sessioni) così il pulsante è già pronto quando
        // la schermata appare, senza lampeggi.
        const rawPermessi = await getItemSync(KEY_PERMESSI_AUTISTI);
        if (!alive) return;
        setOrariAttivo(isOrariNoteAttivo(rawPermessi, autista?.badge ?? ""));

        // preselect coerente
        const preCamion = fmtTarga(
          (mode === "rimorchio" ? mezzoLocal?.targaCamion : mezzoLocal?.targaCamion) || ""
        );
        const preRimorchio = fmtTarga(mezzoLocal?.targaRimorchio || "");

        if (preCamion) setTargaCamion(preCamion);

        if (lockRimorchio) {
          // cambio motrice: rimorchio bloccato sul locale se c'è
          setTargaRimorchio(preRimorchio || null);
        } else {
          // setup normale / cambio rimorchio: rimorchio selezionabile
          if (preRimorchio) {
            setTargaRimorchio(preRimorchio);
          } else if (autista?.nome) {
            const rimAssegnato = fixed
              .filter((m) => rimorchiAll.some((r) => r.targa === m.targa))
              .find((m) => norm(String(m.autistaNome || "")) === norm(autista.nome));
            if (rimAssegnato) setTargaRimorchio(rimAssegnato.targa);
            else setTargaRimorchio(null);
          } else {
            setTargaRimorchio(null);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    init();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function statoUso(targa: string) {
    const s = sessioni.find((x) => x.targaMotrice === targa || x.targaRimorchio === targa);
    if (!s) return null;
    if (s.badgeAutista === autista?.badge) return null;
    return `IN USO da ${s.nomeAutista}`;
  }

  // Verifica la compatibilità dell'aggancio motrice↔rimorchio.
  // Una motrice 2/3/4 assi può agganciare SOLO rimorchi "biga"; qualsiasi
  // altra categoria è vietata con messaggio esplicito.
  function verificaAggancio(
    targaMot: string,
    targaRim: string | null
  ): { ok: boolean; message?: string } {
    const catMot = categoriaByTarga.get(fmtTarga(String(targaMot || ""))) || "";
    if (!isMotriceVincolata(catMot)) return { ok: true };
    if (!targaRim) return { ok: true }; // nessun rimorchio: consentito
    const catRim = categoriaByTarga.get(fmtTarga(String(targaRim || ""))) || "";
    if (isCategoriaBiga(catRim)) return { ok: true };
    const message =
      `Aggancio non consentito.\n` +
      `La motrice ${fmtTarga(targaMot)} (${catMot || "categoria non specificata"}) ` +
      `è a 2/3/4 assi: può essere agganciata SOLO a un rimorchio di categoria «biga».\n` +
      `Il rimorchio ${fmtTarga(String(targaRim))} è di categoria ` +
      `«${catRim || "categoria non specificata"}».\n` +
      `Seleziona un rimorchio «biga» oppure «NESSUN RIMORCHIO».`;
    return { ok: false, message };
  }

  async function handleConfirm() {
    setErrore("");

    if (!autista?.badge || !autista?.nome) {
      setErrore("Autista non valido. Fai login.");
      return;
    }

    if (!targaCamion) {
      setErrore("Seleziona una motrice o trattore");
      return;
    }

    const aggancioCheck = verificaAggancio(targaCamion, targaRimorchio);
    if (!aggancioCheck.ok) {
      setErrore(aggancioCheck.message ?? "Aggancio non consentito.");
      return;
    }

    const now = Date.now();

    const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
    const prev: SessioneAttiva[] = Array.isArray(sessioniRaw) ? sessioniRaw : [];

    const prevSession = prev.find((s) => s.badgeAutista === autista.badge) || null;

    const motriceKey = targaCamion ? fmtTarga(String(targaCamion)) : "";
    const conflittiMotrice = motriceKey
      ? prev.filter(
          (s) =>
            s?.badgeAutista !== autista.badge &&
            fmtTarga(String(s?.targaMotrice ?? "")) === motriceKey
        )
      : [];
    if (conflittiMotrice.length > 0) {
      const elenco = conflittiMotrice
        .map((s) => {
          const badge = s?.badgeAutista ? `BADGE ${s.badgeAutista}` : "BADGE -";
          const nome = s?.nomeAutista ?? s?.autistaNome ?? s?.autista ?? "-";
          return `${nome} (${badge})`;
        })
        .join(", ");
      const ok = window.confirm(
        `MOTRICE gia in uso da ${elenco}. Vuoi continuare?`
      );
      if (!ok) return;
    }

    const rimorchioKey = targaRimorchio ? fmtTarga(String(targaRimorchio)) : "";
    const conflittiRimorchio = rimorchioKey
      ? prev.filter(
          (s) =>
            s?.badgeAutista !== autista.badge &&
            fmtTarga(String(s?.targaRimorchio ?? "")) === rimorchioKey
        )
      : [];
    if (conflittiRimorchio.length > 0) {
      const elenco = conflittiRimorchio
        .map((s) => {
          const badge = s?.badgeAutista ? `BADGE ${s.badgeAutista}` : "BADGE -";
          const nome = s?.nomeAutista ?? s?.autistaNome ?? s?.autista ?? "-";
          return `${nome} (${badge})`;
        })
        .join(", ");
      const ok = window.confirm(
        `RIMORCHIO gia in uso da ${elenco}. Vuoi continuare?`
      );
      if (!ok) return;
    }

    const prima = {
      targaMotrice:
        prevSession?.targaMotrice ??
        (mezzoLocal?.targaCamion ? String(mezzoLocal.targaCamion) : null) ??
        (mezzoLocal?.targaCamionPrima ? String(mezzoLocal.targaCamionPrima) : null),
      targaRimorchio:
        prevSession?.targaRimorchio ??
        (mezzoLocal?.targaRimorchio ? String(mezzoLocal.targaRimorchio) : null),
    };

    const dopo = {
      targaMotrice: targaCamion ? String(targaCamion) : null,
      targaRimorchio: targaRimorchio ? String(targaRimorchio) : null,
    };

    const sessione: SessioneAttiva = {
      targaMotrice: targaCamion,
      targaRimorchio: targaRimorchio || null,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      timestamp: now,
    };

    const tipoAssetto =
      prima.targaMotrice || prima.targaRimorchio ? "CAMBIO_ASSETTO" : "INIZIO_ASSETTO";
    const eventoAssetto: EventoOperativo = {
      id: `${tipoAssetto}-${autista.badge}-${now}-${dopo.targaMotrice || ""}-${dopo.targaRimorchio || ""}`,
      tipo: tipoAssetto,
      timestamp: now,
      badgeAutista: autista.badge,
      nomeAutista: autista.nome,
      autista: autista.nome,
      autistaNome: autista.nome,
      prima: {
        targaMotrice: prima.targaMotrice,
        targaRimorchio: prima.targaRimorchio,
        motrice: prima.targaMotrice,
        rimorchio: prima.targaRimorchio,
      },
      dopo: {
        targaMotrice: dopo.targaMotrice,
        targaRimorchio: dopo.targaRimorchio,
        motrice: dopo.targaMotrice,
        rimorchio: dopo.targaRimorchio,
      },
      luogo: null,
      statoCarico: null,
      condizioni: null,
      source: "setup_confirm",
    };

    const sessioniUpdated = await updateSessioniAtomic((currentValue) => {
      const current = currentValue as SessioneAttiva[];
      const nuove = current
        .filter((s) => s.badgeAutista !== autista.badge)
        .map((s) => {
          const motriceConflict =
            !!motriceKey && fmtTarga(String(s?.targaMotrice ?? "")) === motriceKey;
          const rimorchioConflict =
            !!rimorchioKey && fmtTarga(String(s?.targaRimorchio ?? "")) === rimorchioKey;
          if (!motriceConflict && !rimorchioConflict) return s;

          const scope = motriceConflict && rimorchioConflict
            ? "TUTTO"
            : motriceConflict
            ? "MOTRICE"
            : "RIMORCHIO";
          const reason =
            scope === "MOTRICE"
              ? `Motrice assegnata a ${autista.badge}`
              : scope === "RIMORCHIO"
              ? `Rimorchio assegnato a ${autista.badge}`
              : `Assetto assegnato a ${autista.badge}`;
          return {
            ...s,
            targaMotrice: motriceConflict ? null : s?.targaMotrice ?? null,
            targaRimorchio: rimorchioConflict ? null : s?.targaRimorchio ?? null,
            revoked: {
              ...(s?.revoked || {}),
              by: "AUTO",
              at: now,
              scope,
              reason,
            },
          };
        });

      nuove.push(sessione);
      return nuove;
    });

    if (!sessioniUpdated) {
      setErrore("Impossibile aggiornare la sessione. Riprova.");
      return;
    }

    await appendEventoOperativo(eventoAssetto);

    // locale per dispositivo
    saveMezzoLocal({
      targaCamion,
      targaCamionPrima: null,
      targaRimorchio: targaRimorchio || null,
      timestamp: now,
    });

    const target =
      mode === "rimorchio"
        ? "rimorchio"
        : mode === "motrice"
        ? "motrice"
        : targaRimorchio
        ? "entrambi"
        : "motrice";

    nav(`/autisti/controllo?target=${encodeURIComponent(target)}`, { replace: true });
  }

  // Logout dalla "Selezione mezzo": un autista senza assetto (es. a casa/ferie) deve
  // poter uscire senza scegliere un mezzo. Replica il logout della Home (rimuove la
  // sessione del badge e pulisce il locale), ma procede SEMPRE fino a /autisti/login:
  // qui di norma non c'è un mezzo attivo da liberare, quindi non blocco l'uscita su un
  // eventuale errore di aggiornamento sessione.
  async function handleLogout() {
    const a = getAutistaLocal();
    if (a?.badge) {
      await updateSessioniAtomic((currentValue) => {
        const current = currentValue as SessioneAttiva[];
        return current.filter((s) => s?.badgeAutista !== a.badge);
      });
      clearLastHandledRevokedAt(a.badge);
    }
    removeAutistaLocal();
    removeMezzoLocal();
    nav("/autisti/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="setup-container">
        <div className="setup-card">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="setup-container">
      {autista && (
        <div className="autisti-header">
          <div>
            <div className="autisti-sub">
              {autista.nome} - Badge {autista.badge}
            </div>
          </div>
          <button className="autisti-logout" onClick={handleLogout}>
            Esci
          </button>
        </div>
      )}

      <h1 className="setup-title">Selezione Mezzo</h1>

      {orariAttivo && (
        <div style={{ marginBottom: 18 }}>
          <button
            className="autisti-button secondary"
            onClick={() => nav("/autisti/orari-note")}
          >
            Oggi non guido
          </button>
          <div className="targa-note">
            Sei a casa, in ferie o in malattia? Vai al registro orari senza scegliere un mezzo.
          </div>
        </div>
      )}

      <h2 className="setup-subtitle">Motrice / Trattore</h2>

      {lockMotrice && (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Motrice bloccata: stai facendo CAMBIO RIMORCHIO
        </div>
      )}

      <div className="targhe-list">
        {motriciAll.map((m) => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaCamion === m.targa ? "selected" : ""} ${
                warn ? "warn" : ""
              }`}
              onClick={() => {
                if (lockMotrice) return;
                const check = verificaAggancio(m.targa, targaRimorchio);
                if (!check.ok) {
                  if (lockRimorchio) {
                    // Cambio motrice: il rimorchio è bloccato, non posso
                    // risolvere l'incompatibilità. Blocco la selezione.
                    window.alert(
                      check.message +
                        "\n\nIl rimorchio è bloccato (CAMBIO MOTRICE): non puoi " +
                        "agganciare questa motrice. Annulla e cambia prima il rimorchio."
                    );
                    return;
                  }
                  // Rimorchio modificabile: rimuovo quello incompatibile.
                  window.alert(
                    check.message +
                      "\n\nIl rimorchio selezionato è stato rimosso perché incompatibile."
                  );
                  setTargaCamion(m.targa);
                  setTargaRimorchio(null);
                  return;
                }
                setTargaCamion(m.targa);
              }}
              style={lockMotrice ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warn ?? undefined}
            >
              <div className="targa-text">{m.targa}</div>
              <div className="mezzo-meta">
                <span className="mezzo-badge">{getCategoriaLabel(m)}</span>
                <span className="mezzo-autista">
                  Autista solito: {getAutistaSolito(m)}
                </span>
              </div>
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      <h2 className="setup-subtitle" style={{ marginTop: 18 }}>
        Rimorchio / Semirimorchio (opzionale)
      </h2>

      {lockRimorchio && (
        <div className="setup-error" style={{ marginBottom: 12 }}>
          Rimorchio bloccato: stai facendo CAMBIO MOTRICE
        </div>
      )}

      <div className="targhe-list">
        <div
          className={`targa-card ${!targaRimorchio ? "selected" : ""}`}
          onClick={() => {
            if (!lockRimorchio) setTargaRimorchio(null);
          }}
          style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
        >
          <div className="targa-text">NESSUN RIMORCHIO</div>
          <div className="mezzo-meta">
            <span className="mezzo-badge">-</span>
            <span className="mezzo-autista">Autista solito: -</span>
          </div>
        </div>

        {rimorchiAll.map((m) => {
          const warn = statoUso(m.targa);
          return (
            <div
              key={m.id}
              className={`targa-card ${targaRimorchio === m.targa ? "selected" : ""} ${
                warn ? "warn" : ""
              }`}
              onClick={() => {
                if (lockRimorchio) return;
                const check = verificaAggancio(targaCamion, m.targa);
                if (!check.ok) {
                  window.alert(check.message);
                  return;
                }
                setTargaRimorchio(m.targa);
              }}
              style={lockRimorchio ? { cursor: "not-allowed", opacity: 0.85 } : undefined}
              title={warn ?? undefined}
            >
              <div className="targa-text">{m.targa}</div>
              <div className="mezzo-meta">
                <span className="mezzo-badge">{getCategoriaLabel(m)}</span>
                <span className="mezzo-autista">
                  Autista solito: {getAutistaSolito(m)}
                </span>
              </div>
              {warn && <div className="targa-warn">{warn}</div>}
            </div>
          );
        })}
      </div>

      {errore && (
        <div className="setup-error" style={{ whiteSpace: "pre-line" }}>
          {errore}
        </div>
      )}

      <div className="setup-actions">
        <button className="setup-confirm" onClick={handleConfirm}>
          CONFERMA
        </button>
      </div>
    </div>
  );
}
