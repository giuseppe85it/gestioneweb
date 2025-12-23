import { useMemo, useState } from "react";

import type { ActiveSession } from "../../utils/homeEvents";

type Props = {
  sessions: ActiveSession[];
};

const PREVIEW_LIMIT = 5;

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function toKey(session: ActiveSession) {
  const badge = normalize(session.badgeAutista);
  const motrice = normalizeTarga(session.targaMotrice);
  const rimorchio = normalizeTarga(session.targaRimorchio);
  return `${badge}|${motrice}|${rimorchio}`;
}

function compareByTimestampDesc(a: ActiveSession, b: ActiveSession) {
  if (a.timestamp == null && b.timestamp == null) return 0;
  if (a.timestamp == null) return 1;
  if (b.timestamp == null) return -1;
  return b.timestamp - a.timestamp;
}

function formatTime(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAutistaLabel(session: ActiveSession) {
  const nome = String(session.nomeAutista ?? "").trim();
  const badge = String(session.badgeAutista ?? "").trim();
  if (nome && badge) return `${nome} (badge ${badge})`;
  if (nome) return nome;
  if (badge) return `badge ${badge}`;
  return "-";
}

function getStatus(session: ActiveSession) {
  if (session.targaMotrice && session.targaRimorchio) return "ACCOPPIATO";
  if (session.targaMotrice && !session.targaRimorchio) return "SOLO MOTRICE";
  if (!session.targaMotrice && session.targaRimorchio) return "RIMORCHIO SENZA MOTRICE";
  return "SESSIONE INCOMPLETA";
}

export default function SessioniAttiveCard({ sessions }: Props) {
  const [badgeFilter, setBadgeFilter] = useState("");
  const [targaFilter, setTargaFilter] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<ActiveSession | null>(null);

  const conflictMap = useMemo(() => {
    const map = new Map<string, ActiveSession[]>();
    for (const s of sessions) {
      const key = normalizeTarga(s.targaMotrice);
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const badge = normalize(badgeFilter);
    const targa = normalizeTarga(targaFilter);
    const list = sessions.filter((s) => {
      const badgeValue = normalize(s.badgeAutista);
      const motrice = normalizeTarga(s.targaMotrice);
      const rimorchio = normalizeTarga(s.targaRimorchio);
      const badgeMatch = !badge || badgeValue.includes(badge);
      const targaMatch = !targa || motrice.includes(targa) || rimorchio.includes(targa);
      return badgeMatch && targaMatch;
    });
    list.sort(compareByTimestampDesc);
    return list;
  }, [sessions, badgeFilter, targaFilter]);

  const previewSessions = useMemo(
    () => filteredSessions.slice(0, PREVIEW_LIMIT),
    [filteredSessions]
  );

  const emptyText =
    sessions.length === 0 ? "Nessuna sessione attiva" : "Nessuna sessione trovata";

  function getConflictPeers(session: ActiveSession) {
    const key = normalizeTarga(session.targaMotrice);
    if (!key) return [];
    const list = conflictMap.get(key);
    if (!list || list.length < 2) return [];
    const selfKey = toKey(session);
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const s of list) {
      if (toKey(s) === selfKey) continue;
      const label = formatAutistaLabel(s);
      if (label === "-" || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
    }
    return labels;
  }

  function openDetail(session: ActiveSession) {
    setDetailSession(session);
    setListOpen(false);
  }

  function closeDetail() {
    setDetailSession(null);
  }

  function renderSessionRow(session: ActiveSession) {
    const conflictPeers = getConflictPeers(session);
    const hasConflict = conflictPeers.length > 0;
    return (
      <div
        key={toKey(session)}
        className={`sessione-row${hasConflict ? " conflict" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => openDetail(session)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(session);
          }
        }}
      >
        <div className="sessione-top">
          <div className="sessione-status">
            <strong>{getStatus(session)}</strong>
            {hasConflict ? (
              <span className="sessione-conflict-badge">CONFLITTO</span>
            ) : null}
          </div>
          <span className="sessione-time">{formatTime(session.timestamp)}</span>
        </div>
        <div className="sessione-line">
          <span className="sessione-label">Autista</span>
          <span className="sessione-value">{session.nomeAutista || "-"}</span>
          <span className="sessione-badge">badge {session.badgeAutista || "-"}</span>
        </div>
        <div className="sessione-line">
          <span className="sessione-label">Motrice</span>
          <span className="sessione-value">{session.targaMotrice ?? "-"}</span>
        </div>
        <div className="sessione-line">
          <span className="sessione-label">Rimorchio</span>
          <span className="sessione-value">{session.targaRimorchio ?? "-"}</span>
        </div>
        {hasConflict ? (
          <div className="sessione-conflict-text">
            In uso anche da: {conflictPeers.join(", ")}
          </div>
        ) : null}
      </div>
    );
  }

  const detailConflict = detailSession ? getConflictPeers(detailSession) : [];

  return (
    <div className="sessioni-card">
      <div className="sessioni-card-head">
        <h2>Sessioni attive</h2>
        <button
          type="button"
          className="daily-more"
          onClick={() => setListOpen(true)}
          disabled={filteredSessions.length <= PREVIEW_LIMIT}
        >
          Vedi tutto
        </button>
      </div>

      <div className="sessioni-filters">
        <input
          className="sessioni-filter-input"
          type="text"
          placeholder="Filtro badge"
          value={badgeFilter}
          onChange={(e) => setBadgeFilter(e.target.value)}
        />
        <input
          className="sessioni-filter-input"
          type="text"
          placeholder="Filtro targa"
          value={targaFilter}
          onChange={(e) => setTargaFilter(e.target.value)}
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="sessione-row empty">{emptyText}</div>
      ) : (
        previewSessions.map((s) => renderSessionRow(s))
      )}

      {listOpen && (
        <div className="aix-backdrop" onClick={() => setListOpen(false)}>
          <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aix-head">
              <h3>Sessioni attive</h3>
              <button
                className="aix-close"
                onClick={() => setListOpen(false)}
                aria-label="Chiudi"
              >
                X
              </button>
            </div>
            <div className="aix-body">
              <div className="sessioni-filters">
                <input
                  className="sessioni-filter-input"
                  type="text"
                  placeholder="Filtro badge"
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                />
                <input
                  className="sessioni-filter-input"
                  type="text"
                  placeholder="Filtro targa"
                  value={targaFilter}
                  onChange={(e) => setTargaFilter(e.target.value)}
                />
              </div>

              {filteredSessions.length === 0 ? (
                <div className="aix-empty">{emptyText}</div>
              ) : (
                filteredSessions.map((s) => renderSessionRow(s))
              )}
            </div>
          </div>
        </div>
      )}

      {detailSession && (
        <div className="aix-backdrop" onClick={closeDetail}>
          <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aix-head">
              <h3>Dettaglio sessione</h3>
              <button className="aix-close" onClick={closeDetail} aria-label="Chiudi">
                X
              </button>
            </div>
            <div className="aix-body">
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>Autista</strong>
                  <span>{detailSession.nomeAutista || "-"}</span>
                </div>
              </div>
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>Badge</strong>
                  <span className="sessione-badge">
                    badge {detailSession.badgeAutista || "-"}
                  </span>
                </div>
              </div>
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>Motrice</strong>
                  <span>{detailSession.targaMotrice ?? "-"}</span>
                </div>
              </div>
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>Rimorchio</strong>
                  <span>{detailSession.targaRimorchio ?? "-"}</span>
                </div>
              </div>
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>Ultimo update</strong>
                  <span>{formatDateTime(detailSession.timestamp)}</span>
                </div>
              </div>
              {detailConflict.length > 0 ? (
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>Conflitto</strong>
                    <span className="sessione-conflict-text">
                      In uso anche da: {detailConflict.join(", ")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
