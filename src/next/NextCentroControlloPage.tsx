import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  NEXT_STATO_OPERATIVO_DOMAIN,
  type D10AlertItem,
  type D10FocusItem,
  type D10Quality,
  type D10Severity,
  type D10Snapshot,
  readNextStatoOperativoSnapshot,
} from "./domain/nextStatoOperativoDomain";

function toneClassName(value: D10Severity): string {
  switch (value) {
    case "danger":
      return "next-chip next-chip--warning";
    case "warning":
      return "next-chip next-chip--accent";
    default:
      return "next-chip next-chip--subtle";
  }
}

function renderSeverityLabel(value: D10Severity): string {
  switch (value) {
    case "danger":
      return "Critico";
    case "warning":
      return "Attenzione";
    default:
      return "Info";
  }
}

function renderQualityLabel(value: D10Quality): string {
  switch (value) {
    case "source_direct":
      return "Dato diretto";
    case "derived_acceptable":
      return "Dato derivato";
    default:
      return "Fuori v1";
  }
}

function renderAlertKindLabel(item: D10AlertItem): string {
  switch (item.kind) {
    case "revisione":
      return "Revisione";
    case "conflitto_sessione":
      return "Conflitto sessione";
    default:
      return "Segnalazione nuova";
  }
}

function renderFocusKindLabel(item: D10FocusItem): string {
  switch (item.kind) {
    case "controllo_ko":
      return "Controllo KO";
    default:
      return "Mezzo incompleto";
  }
}

function NextCentroControlloPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["centro-controllo"];
  const access = NEXT_AREA_ACCESS["centro-controllo"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setStatus("loading");
        setError(null);
        const result = await readNextStatoOperativoSnapshot();
        if (!active) return;
        setSnapshot(result);
        setStatus("success");
      } catch {
        if (!active) return;
        setSnapshot(null);
        setStatus("error");
        setError("Impossibile leggere il layer D10 read-only del Centro di Controllo.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const counters = snapshot?.counters;
  const focusStats = useMemo(() => {
    const items = snapshot?.focusItems ?? [];
    return {
      total: items.length,
      controlliKo: items.filter((item) => item.kind === "controllo_ko").length,
      mezziIncompleti: items.filter((item) => item.kind === "mezzo_incompleto").length,
    };
  }, [snapshot?.focusItems]);

  const buildItemPath = useMemo(() => {
    return (targetRouteKind: D10AlertItem["targetRouteKind"], mezzoTarga: string | null) => {
      if (targetRouteKind === "dossier" && mezzoTarga) {
        return buildNextPathWithRole(`/next/mezzi-dossier/${mezzoTarga}`, role, location.search);
      }

      if (targetRouteKind === "mezzi") {
        return buildNextPathWithRole("/next/mezzi-dossier", role, location.search);
      }

      return null;
    };
  }, [location.search, role]);

  return (
    <section className="next-page next-control-center-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Primo ingresso runtime reale del dominio {NEXT_STATO_OPERATIVO_DOMAIN.code} nella
            NEXT. La pagina legge uno snapshot read-only pulito del Centro di Controllo, senza
            copiare in React la logica sporca della Home legacy.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--success">D10 READ-ONLY</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">
            Layer pulito: {NEXT_STATO_OPERATIVO_DOMAIN.code}
          </span>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento Centro di Controllo</strong>
          <span>Sto leggendo il layer D10 read-only della NEXT.</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="next-data-state next-tone next-tone--warning">
          <strong>Centro di Controllo non disponibile</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === "success" && snapshot ? (
        <>
          <section className="next-summary-grid next-summary-grid--wide">
            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Alert visibili</p>
              <strong className="next-summary-card__value">
                {counters?.alertsVisible ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Alert attivi dopo il filtro read-only di ack e snooze del legacy.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Revisioni</p>
              <strong className="next-summary-card__value">
                {(counters?.revisioniScadute ?? 0) + (counters?.revisioniInScadenza ?? 0)}
              </strong>
              <p className="next-summary-card__meta">
                {counters?.revisioniScadute ?? 0} scadute, {counters?.revisioniInScadenza ?? 0} in
                scadenza.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Conflitti sessione</p>
              <strong className="next-summary-card__value">
                {counters?.conflittiSessione ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Sessioni multiple rilevate sulla stessa motrice o sullo stesso rimorchio.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--success">
              <p className="next-summary-card__label">Focus operativi</p>
              <strong className="next-summary-card__value">{focusStats.total}</strong>
              <p className="next-summary-card__meta">
                {focusStats.controlliKo} controlli KO, {focusStats.mezziIncompleti} mezzi
                incompleti.
              </p>
            </article>
          </section>

          <section className="next-cockpit-layout">
            <article className="next-panel next-cockpit-main next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Alert D10</h2>
                <span className="next-chip next-chip--accent">
                  {snapshot.alerts.length} attivi
                </span>
              </div>
              <p className="next-panel__description">
                Coda primaria del Centro di Controllo v1: revisioni, conflitti sessione e
                segnalazioni nuove normalizzate nel layer NEXT.
              </p>

              {snapshot.alerts.length === 0 ? (
                <div className="next-data-state">
                  <strong>Nessun alert attivo</strong>
                  <span>Il layer D10 non ha trovato alert visibili per questa lettura.</span>
                </div>
              ) : (
                <div className="next-control-list">
                  {snapshot.alerts.map((item) => {
                    const itemPath = buildItemPath(item.targetRouteKind, item.mezzoTarga);

                    return (
                      <div key={item.id} className="next-control-list__item">
                        <div className="next-global-pillbar">
                          <span className={toneClassName(item.severity)}>
                            {renderSeverityLabel(item.severity)}
                          </span>
                          <span className="next-chip next-chip--subtle">
                            {renderAlertKindLabel(item)}
                          </span>
                          <span className="next-chip next-chip--subtle">
                            {renderQualityLabel(item.quality)}
                          </span>
                          {item.dateLabel ? (
                            <span className="next-chip next-chip--subtle">{item.dateLabel}</span>
                          ) : null}
                        </div>
                        <strong>{item.title}</strong>
                        <span>{item.detailText}</span>
                        <span>
                          Dataset: {item.sourceDataset}
                          {item.sourceRecordId ? ` | Record: ${item.sourceRecordId}` : ""}
                          {item.mezzoTarga ? ` | Targa: ${item.mezzoTarga}` : ""}
                        </span>
                        {itemPath ? (
                          <Link className="next-inline-link" to={itemPath}>
                            Apri Dossier
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <div className="next-cockpit-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Focus operativi</h2>
                  <span className="next-chip next-chip--success">
                    {snapshot.focusItems.length} elementi
                  </span>
                </div>
                <p className="next-panel__description">
                  Elenco secondario read-only: controlli KO e mezzi incompleti.
                </p>

                {snapshot.focusItems.length === 0 ? (
                  <div className="next-data-state">
                    <strong>Nessun focus operativo</strong>
                    <span>Il layer D10 non ha trovato elementi focus per questa lettura.</span>
                  </div>
                ) : (
                  <div className="next-control-list">
                    {snapshot.focusItems.map((item) => {
                      const itemPath = buildItemPath(item.targetRouteKind, item.mezzoTarga);

                      return (
                        <div key={item.id} className="next-control-list__item">
                          <div className="next-global-pillbar">
                            <span className={toneClassName(item.severity)}>
                              {renderSeverityLabel(item.severity)}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {renderFocusKindLabel(item)}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {renderQualityLabel(item.quality)}
                            </span>
                          </div>
                          <strong>{item.title}</strong>
                          <span>{item.detailText}</span>
                          {itemPath ? (
                            <Link className="next-inline-link" to={itemPath}>
                              Apri Dossier
                            </Link>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="next-panel next-tone">
                <div className="next-panel__header">
                  <h2>Limiti dichiarati</h2>
                </div>
                <p className="next-panel__description">
                  Il Centro di Controllo v1 resta stretto: mostra solo cio che il layer D10 puo
                  ricostruire in modo prudente e spiegabile.
                </p>
                {(snapshot.limitations ?? []).length === 0 ? (
                  <div className="next-data-state">
                    <strong>Nessun limite dichiarato</strong>
                    <span>Il layer D10 non ha restituito limitazioni aggiuntive.</span>
                  </div>
                ) : (
                  <ul className="next-panel__list">
                    {(snapshot.limitations ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextCentroControlloPage;
