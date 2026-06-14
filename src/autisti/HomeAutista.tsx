// ======================================================
// HomeAutista.tsx
// HOME PRINCIPALE APP AUTISTI
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync, updateSessioniAtomic } from "../utils/storageSync";
import GommeAutistaModal from "./GommeAutistaModal";
import {
  clearLastHandledRevokedAt,
  getAutistaLocal,
  getLastHandledRevokedAt,
  getMezzoLocal,
  removeAutistaLocal,
  removeMezzoLocal,
  saveMezzoLocal,
  setLastHandledRevokedAt,
} from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";
const KEY_PERMESSI_AUTISTI = "@permessi_autisti";

// DEVE restare identico alla copia in src/autistiInbox/AutistiAdmin.tsx.
const AUTISTI_MODULI = [
  { id: "rifornimento", label: "Rifornimento", defaultOn: true },
  { id: "segnalazioni", label: "Segnalazioni", defaultOn: true },
  { id: "gomme", label: "Gomme", defaultOn: true },
  { id: "richiesta-attrezzature", label: "Richiesta attrezzature", defaultOn: true },
  { id: "cambio-mezzo", label: "Cambio mezzo", defaultOn: true },
] as const;

type AutistiModuloId = (typeof AUTISTI_MODULI)[number]["id"];

type PermessiAutisti = {
  permessi: Record<string, Partial<Record<AutistiModuloId, boolean>>>;
};

const DEFAULT_PERMESSI_AUTISTI: PermessiAutisti = {
  permessi: {},
};

type EventoOperativo = {
  id: string;
  tipo: string;
  timestamp: number;
  badgeAutista?: string;
  nomeAutista?: string;
  autistaNome?: string;
  autista?: string;
  prima?: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  dopo?: {
    targaMotrice: string | null;
    targaRimorchio: string | null;
    motrice?: string | null;
    rimorchio?: string | null;
  };
  luogo?: string | null;
  statoCarico?: string | null;
  condizioni?: unknown;
  source?: string;
};

async function appendEventoOperativo(evt: EventoOperativo) {
  const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
  const list: EventoOperativo[] = Array.isArray(raw)
    ? raw
    : raw?.value && Array.isArray(raw.value)
    ? raw.value
    : [];
  if (list.some((e) => e?.id === evt.id)) return;
  list.push(evt);
  await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, list);
}

function isAutistiModuloId(value: unknown): value is AutistiModuloId {
  return AUTISTI_MODULI.some((modulo) => modulo.id === value);
}

function getModuloDefaultOn(moduloId: AutistiModuloId) {
  return AUTISTI_MODULI.find((modulo) => modulo.id === moduloId)?.defaultOn === true;
}

function normalizePermessiAutisti(raw: unknown): PermessiAutisti {
  if (!raw || typeof raw !== "object") return DEFAULT_PERMESSI_AUTISTI;

  const source = raw as {
    permessi?: unknown;
  };
  const permessi: Record<string, Partial<Record<AutistiModuloId, boolean>>> = {};

  if (
    source.permessi &&
    typeof source.permessi === "object" &&
    !Array.isArray(source.permessi)
  ) {
    Object.entries(source.permessi as Record<string, unknown>).forEach(
      ([badge, moduliMap]) => {
        const badgeKey = String(badge).trim();
        if (!badgeKey) return;
        if (!moduliMap || typeof moduliMap !== "object" || Array.isArray(moduliMap)) return;

        Object.entries(moduliMap as Record<string, unknown>).forEach(
          ([moduloId, enabled]) => {
            if (!isAutistiModuloId(moduloId) || typeof enabled !== "boolean") return;
            if (!permessi[badgeKey]) permessi[badgeKey] = {};
            permessi[badgeKey][moduloId] = enabled;
          }
        );
      }
    );
  }

  return { permessi };
}

export default function HomeAutista() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [gommeOpen, setGommeOpen] = useState(false);
  const [sgancioOpen, setSgancioOpen] = useState(false);
  const [sgancioLuogoPreset, setSgancioLuogoPreset] = useState<
    "STABIO" | "MEV" | "ALTRO"
  >("STABIO");
  const [sgancioLuogoAltro, setSgancioLuogoAltro] = useState("");
  const [sgancioErrore, setSgancioErrore] = useState<string | null>(null);
  const [sgancioLoading, setSgancioLoading] = useState(false);
  const [permessiAutisti, setPermessiAutisti] = useState<PermessiAutisti>(
    DEFAULT_PERMESSI_AUTISTI
  );

  const isModuloVisible = (moduloId: AutistiModuloId) => {
    const badgeKey = String(autista?.badge ?? "").trim();
    const explicitValue = badgeKey ? permessiAutisti.permessi[badgeKey]?.[moduloId] : undefined;
    return typeof explicitValue === "boolean" ? explicitValue : getModuloDefaultOn(moduloId);
  };

  // ======================================================
  // REVOCHE + COERENZA LIVE/LOCALE
  // ======================================================
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function checkRevocaAndCoerenza() {
      if (cancelled) return;
      const a = getAutistaLocal();
      if (!a?.badge) return;
      const m = getMezzoLocal();

      const sessioniRaw = await getItemSync(SESSIONI_KEY);
      if (!Array.isArray(sessioniRaw)) return;
      const sessioni = sessioniRaw;
      const badgeKey = String(a.badge).trim();
      const sessioneLive = sessioni.find(
        (s: any) => String(s?.badgeAutista ?? s?.badge ?? "").trim() === badgeKey
      );
      if (!sessioneLive) {
        if (!m) return;

        clearLastHandledRevokedAt(badgeKey);
        removeMezzoLocal();
        setMezzo(null);
        window.alert("Sessione non piu attiva. Reimposta l'accesso autista.");
        navigate("/autisti/setup-mezzo", { replace: true });
        return;
      }

      const revokedAt =
        typeof sessioneLive?.revoked?.at === "number" ? sessioneLive.revoked.at : 0;
      const lastHandled = getLastHandledRevokedAt(badgeKey);
      if (revokedAt && revokedAt > lastHandled) {
        const scope = String(sessioneLive?.revoked?.scope ?? "TUTTO");
        const by = String(sessioneLive?.revoked?.by ?? "ADMIN");
        const reason = String(sessioneLive?.revoked?.reason ?? "");
        if (scope === "RIMORCHIO") {
          if (m?.targaCamion) {
            const updated = { ...m, targaRimorchio: null };
            saveMezzoLocal(updated);
            setMezzo(updated);
          } else {
            removeMezzoLocal();
            setMezzo(null);
          }
        } else if (scope === "MOTRICE") {
          if (m?.targaRimorchio) {
            const updated = { ...m, targaCamion: null };
            saveMezzoLocal(updated);
            setMezzo(updated);
          } else {
            removeMezzoLocal();
            setMezzo(null);
          }
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }

        setLastHandledRevokedAt(badgeKey, revokedAt);
        const scopeLabel =
          scope === "MOTRICE" ? "motrice" : scope === "RIMORCHIO" ? "rimorchio" : "tutto";
        const reasonText = reason ? ` Motivo: ${reason}` : "";
        window.alert(`Sessione revocata (${scopeLabel}) da ${by}.${reasonText}`);

        if (scope === "TUTTO") {
          navigate("/autisti/setup-mezzo", { replace: true });
          return;
        }

        const mode = scope === "MOTRICE" ? "motrice" : "rimorchio";
        navigate(`/autisti/setup-mezzo?mode=${encodeURIComponent(mode)}`, { replace: true });
        return;
      }

      const liveMotrice = sessioneLive?.targaMotrice ?? null;
      const liveRimorchio = sessioneLive?.targaRimorchio ?? null;

      if (!liveMotrice && m?.targaCamion) {
        const updated = { ...m, targaCamion: null };
        if (updated.targaRimorchio) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Motrice revocata da admin: reimposta la motrice.");
        navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
        return;
      }

      if (!liveRimorchio && m?.targaRimorchio) {
        const updated = { ...m, targaRimorchio: null };
        if (updated.targaCamion) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Rimorchio revocato da admin: reimposta il rimorchio.");
        navigate("/autisti/setup-mezzo?mode=rimorchio", { replace: true });
      }
    }

    checkRevocaAndCoerenza();
    const onFocus = () => {
      checkRevocaAndCoerenza();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkRevocaAndCoerenza();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    intervalId = window.setInterval(() => {
      checkRevocaAndCoerenza();
    }, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [navigate]);

  useEffect(() => {
    let alive = true;

    async function loadPermessiAutisti() {
      const raw = await getItemSync(KEY_PERMESSI_AUTISTI);
      if (!alive) return;
      setPermessiAutisti(normalizePermessiAutisti(raw));
    }

    loadPermessiAutisti();
    return () => {
      alive = false;
    };
  }, []);

  // ======================================================
  // LOAD SESSIONE (SOLO LOCALE)
  // ======================================================
  useEffect(() => {
    const a = getAutistaLocal();
    const m = getMezzoLocal();

    if (!a || !a.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }

    // autista ok ma mezzo non selezionato -> setup
    if (!m || !m.targaCamion) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    setAutista(a);
    setMezzo(m);
  }, [navigate]);

  // ======================================================
  // LOGOUT
  // ======================================================
  async function handleLogout() {
    const a = getAutistaLocal();
    if (!a?.badge) return;

    const sessioneAggiornata = await updateSessioniAtomic((sessioni) => {
      return sessioni.filter((s: any) => s?.badgeAutista !== a.badge);
    });
    if (!sessioneAggiornata) {
      window.alert("Impossibile aggiornare la sessione. Riprova.");
      return;
    }

    try {
      const now = Date.now();
      await appendEventoOperativo({
        id: `LOGOUT_AUTISTA-${a.badge}-${now}`,
        tipo: "LOGOUT_AUTISTA",
        timestamp: now,
        badgeAutista: a.badge,
        nomeAutista: a.nome ?? "",
        autistaNome: a.nome ?? "",
        autista: a.nome ?? "",
        source: "AUTISTI",
      });
    } catch (err) {
      console.warn("Logout autista: impossibile scrivere evento", err);
    }

    // pulizia locale (questa è quella che conta)
    clearLastHandledRevokedAt(a.badge);
    removeAutistaLocal();
    removeMezzoLocal();

    navigate("/autisti/login", { replace: true });
  }

  async function handleSgancioMotriceConfirm() {
    if (sgancioLoading) return;
    if (sgancioLuogoPreset === "ALTRO" && !sgancioLuogoAltro.trim()) {
      setSgancioErrore("Inserisci dove lasci la motrice.");
      return;
    }

    const a = getAutistaLocal();
    const m = getMezzoLocal();
    if (!a?.badge || !m?.targaCamion) {
      setSgancioErrore("Sessione non valida.");
      return;
    }

    setSgancioErrore(null);
    setSgancioLoading(true);

    const now = Date.now();
    const prima = {
      targaMotrice: m?.targaCamion ?? null,
      targaRimorchio: m?.targaRimorchio ?? null,
    };
    const dopo = {
      targaMotrice: null,
      targaRimorchio: m?.targaRimorchio ?? null,
    };
    const luogoFinale =
      sgancioLuogoPreset === "ALTRO"
        ? sgancioLuogoAltro.trim().toUpperCase()
        : sgancioLuogoPreset;

    try {
      const sessioneAggiornata = await updateSessioniAtomic((sessioni) => {
        return sessioni.map((s: any) => {
          if (s?.badgeAutista !== a.badge) return s;
          return { ...s, targaMotrice: null };
        });
      });
      if (!sessioneAggiornata) {
        setSgancioErrore("Impossibile aggiornare la sessione. Riprova.");
        return;
      }

      await appendEventoOperativo({
        id: `CAMBIO_ASSETTO-${a.badge}-${now}-${prima.targaMotrice || ""}-${prima.targaRimorchio || ""}`,
        tipo: "CAMBIO_ASSETTO",
        timestamp: now,
        badgeAutista: a.badge,
        nomeAutista: a.nome ?? "",
        autistaNome: a.nome ?? "",
        autista: a.nome ?? "",
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
        luogo: luogoFinale,
        statoCarico: null,
        condizioni: null,
        source: "AUTISTI",
      });

      const updatedLocal = {
        ...m,
        targaCamion: null,
        timestamp: now,
      };
      saveMezzoLocal(updatedLocal);
      setMezzo(updatedLocal);
      setSgancioOpen(false);
      setSgancioLuogoPreset("STABIO");
      setSgancioLuogoAltro("");
      navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
    } catch (err) {
      console.warn("Sgancio motrice: errore", err);
      setSgancioErrore("Errore durante lo sgancio. Riprova.");
    } finally {
      setSgancioLoading(false);
    }
  }

  if (!autista || !mezzo) return null;

  return (
    <div className="autisti-home">
      {/* HEADER */}
      <div className="autisti-header">
        <div>
          <h1>Area Autista</h1>
          <div className="autisti-sub">
            {autista.nome} - Badge {autista.badge}
          </div>
        </div>

        <button className="autisti-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* MEZZO ATTIVO */}
      <div className="autisti-mezzo-attivo">
        <h2>Mezzo attivo</h2>
        <div className="autisti-mezzo-card">
          <div>
            <strong>Motrice:</strong> {mezzo.targaCamion || "-"}
          </div>
          {mezzo.targaRimorchio && (
            <div>
              <strong>Rimorchio:</strong> {mezzo.targaRimorchio}
            </div>
          )}
        </div>
      </div>

      {/* AZIONI */}
      <div className="autisti-actions">
        {isModuloVisible("rifornimento") && (
          <button onClick={() => navigate("/autisti/rifornimento")}>
            Rifornimento
          </button>
        )}

        {isModuloVisible("segnalazioni") && (
          <button onClick={() => navigate("/autisti/segnalazioni")}>
            Segnalazioni
          </button>
        )}

        {isModuloVisible("gomme") && (
          <button onClick={() => setGommeOpen(true)}>
            Gomme
          </button>
        )}

        {isModuloVisible("richiesta-attrezzature") && (
          <button onClick={() => navigate("/autisti/richiesta-attrezzature")}>
            Richiesta attrezzature
          </button>
        )}

        {!mezzo.targaRimorchio && (
          <button onClick={() => navigate("/autisti/setup-mezzo?mode=rimorchio")}>
            AGGANCIA RIMORCHIO
          </button>
        )}

        {mezzo.targaCamion && (
          <button onClick={() => setSgancioOpen(true)}>
            SGANCIA MOTRICE
          </button>
        )}

        {isModuloVisible("cambio-mezzo") && (
          <button onClick={() => navigate("/autisti/cambio-mezzo")}>
            Cambio mezzo
          </button>
        )}
      </div>

      {sgancioOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
              textAlign: "left",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Sgancio motrice</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="autisti-label">Dove la lascio?</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {(["STABIO", "MEV", "ALTRO"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="autisti-button secondary"
                    style={{
                      width: "auto",
                      padding: "10px 14px",
                      fontSize: 14,
                      background: sgancioLuogoPreset === opt ? "#2e7d32" : undefined,
                      color: sgancioLuogoPreset === opt ? "#fff" : undefined,
                    }}
                    onClick={() => setSgancioLuogoPreset(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {sgancioLuogoPreset === "ALTRO" && (
                <input
                  className="autisti-input"
                  type="text"
                  placeholder="Inserisci luogo"
                  value={sgancioLuogoAltro}
                  onChange={(e) => setSgancioLuogoAltro(e.target.value)}
                />
              )}
            </div>
            {sgancioErrore && <div className="autisti-error">{sgancioErrore}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="autisti-button"
                onClick={handleSgancioMotriceConfirm}
                disabled={sgancioLoading}
              >
                {sgancioLoading ? "Salvataggio..." : "CONFERMA"}
              </button>
              <button
                className="autisti-button secondary"
                onClick={() => {
                  setSgancioOpen(false);
                  setSgancioLuogoPreset("STABIO");
                  setSgancioLuogoAltro("");
                  setSgancioErrore(null);
                }}
                disabled={sgancioLoading}
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      )}

      <GommeAutistaModal open={gommeOpen} onClose={() => setGommeOpen(false)} />
    </div>
  );
}
