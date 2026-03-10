import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  type NextAnagraficheFlottaSnapshot,
  readNextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";
import {
  type D10AlertItem,
  type D10FocusItem,
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
  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [fleetSnapshot, setFleetSnapshot] = useState<NextAnagraficheFlottaSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setStatus("loading");
        setError(null);
        const [d10Snapshot, d01Snapshot] = await Promise.all([
          readNextStatoOperativoSnapshot(),
          readNextAnagraficheFlottaSnapshot(),
        ]);

        if (!active) return;

        setSnapshot(d10Snapshot);
        setFleetSnapshot(d01Snapshot);
        setStatus("success");
      } catch {
        if (!active) return;

        setSnapshot(null);
        setFleetSnapshot(null);
        setStatus("error");
        setError("Impossibile leggere i dati necessari al Centro di Controllo.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const counters = snapshot?.counters;
  const fleetItems = fleetSnapshot?.items ?? [];
  const focusItems = snapshot?.focusItems ?? [];
  const firstDossierPath =
    fleetItems.length > 0
      ? buildNextPathWithRole(
          `/next/mezzi-dossier/${encodeURIComponent(fleetItems[0].targa)}`,
          role,
          location.search
        )
      : null;

  const buildItemPath = (
    targetRouteKind: D10AlertItem["targetRouteKind"],
    mezzoTarga: string | null
  ) => {
    if (targetRouteKind === "dossier" && mezzoTarga) {
      return buildNextPathWithRole(
        `/next/mezzi-dossier/${encodeURIComponent(mezzoTarga)}`,
        role,
        location.search
      );
    }

    if (targetRouteKind === "mezzi") {
      return buildNextPathWithRole("/next/mezzi-dossier", role, location.search);
    }

    return null;
  };

  const renderAlertActionLabel = (item: D10AlertItem): string => {
    if (item.targetRouteKind === "dossier") {
      return "Apri Dossier";
    }

    if (item.targetRouteKind === "mezzi") {
      return "Apri Mezzi";
    }

    return "Apri dettaglio";
  };

  return (
    <section className="next-page next-control-center-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Qui vedi subito cosa richiede attenzione oggi, quali mezzi aprire e da dove entrare
            nelle aree operative della giornata.
          </p>
        </div>

        <div className="next-page__hero-actions">
          <div className="next-access-page__actions">
            <Link
              className="next-action-link next-action-link--primary"
              to={buildNextPathWithRole("/next/ia-gestionale", role, location.search)}
            >
              Apri IA Gestionale
            </Link>
            <Link
              className="next-action-link"
              to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
            >
              Apri Mezzi / Dossier
            </Link>
            <Link
              className="next-action-link"
              to={buildNextPathWithRole("/next/operativita-globale", role, location.search)}
            >
              Apri Operativita
            </Link>
          </div>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento home</strong>
          <span>Sto preparando priorita, flotta e accessi rapidi.</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="next-data-state next-tone next-tone--warning">
          <strong>Home non disponibile</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === "success" && snapshot && fleetSnapshot ? (
        <>
          <section className="next-home-ia-band next-tone next-tone--accent">
            <div className="next-home-ia-band__main">
              <p className="next-summary-card__label">IA in primo piano</p>
              <h2>Chiedi una sintesi della giornata prima di aprire i moduli</h2>
              <p className="next-panel__description">
                Parti da domande semplici e contestuali, poi apri subito la pagina corretta per
                agire.
              </p>
              <div className="next-control-list">
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Quali mezzi richiedono attenzione oggi?</strong>
                  <span>Usa la coda prioritaria del Centro di Controllo.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Quali revisioni sono piu urgenti?</strong>
                  <span>Parti dagli alert e apri direttamente il Dossier corretto.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Da dove conviene iniziare il lavoro di oggi?</strong>
                  <span>Ottieni una vista rapida delle priorita e dei collegamenti utili.</span>
                </div>
              </div>
            </div>

            <div className="next-home-ia-band__side">
              <div className="next-control-list">
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Parti dal Centro</strong>
                  <span>Alert, revisioni e segnalazioni della giornata.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Scendi nel Dossier</strong>
                  <span>Apri subito il mezzo coinvolto quando serve dettaglio.</span>
                </div>
              </div>

              <div className="next-access-page__actions">
                <Link
                  className="next-action-link next-action-link--primary"
                  to={buildNextPathWithRole("/next/ia-gestionale", role, location.search)}
                >
                  Apri IA Gestionale
                </Link>
                <Link
                  className="next-action-link"
                  to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
                >
                  Apri Mezzi / Dossier
                </Link>
                {firstDossierPath ? (
                  <Link className="next-action-link" to={firstDossierPath}>
                    Apri un Dossier
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="next-summary-grid next-summary-grid--compact">
            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Alert visibili</p>
              <strong className="next-summary-card__value">
                {counters?.alertsVisible ?? 0}
              </strong>
              <p className="next-summary-card__meta">Priorita da presidiare subito.</p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Revisioni vicine</p>
              <strong className="next-summary-card__value">
                {(counters?.revisioniScadute ?? 0) + (counters?.revisioniInScadenza ?? 0)}
              </strong>
              <p className="next-summary-card__meta">
                {counters?.revisioniScadute ?? 0} scadute, {counters?.revisioniInScadenza ?? 0} in
                scadenza.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--success">
              <p className="next-summary-card__label">Segnalazioni nuove</p>
              <strong className="next-summary-card__value">
                {counters?.segnalazioniNuove ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Nuovi elementi emersi da controllare.
              </p>
            </article>
          </section>

          <section className="next-cockpit-layout">
            <article className="next-panel next-cockpit-main next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Priorita di oggi</h2>
                <span className="next-chip next-chip--accent">
                  {snapshot.alerts.length} alert attivi
                </span>
              </div>
              <p className="next-panel__description">
                Qui trovi la coda di lavoro da aprire per prima. Ogni elemento porta subito al
                record corretto quando disponibile.
              </p>

              {snapshot.alerts.length === 0 ? (
                <div className="next-data-state">
                  <strong>Nessun alert attivo</strong>
                  <span>Non risultano priorita aperte in questo momento.</span>
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
                          {item.dateLabel ? (
                            <span className="next-chip next-chip--subtle">{item.dateLabel}</span>
                          ) : null}
                        </div>
                        <strong>{item.title}</strong>
                        <span>{item.detailText}</span>
                        {item.mezzoTarga ? <span>Targa: {item.mezzoTarga}</span> : null}
                        {itemPath ? (
                          <Link className="next-inline-link" to={itemPath}>
                            {renderAlertActionLabel(item)}
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
                  <h2>Da seguire oggi</h2>
                </div>
                <p className="next-panel__description">
                  Segnali secondari da tenere d'occhio dopo la coda prioritaria.
                </p>

                {focusItems.length === 0 ? (
                  <div className="next-data-state">
                    <strong>Nessun focus operativo</strong>
                    <span>Non risultano elementi secondari da seguire adesso.</span>
                  </div>
                ) : (
                  <div className="next-control-list">
                    {focusItems.slice(0, 4).map((item) => {
                      const itemPath = buildItemPath(item.targetRouteKind, item.mezzoTarga);

                      return (
                        <div
                          key={item.id}
                          className="next-control-list__item next-control-list__item--soft"
                        >
                          <div className="next-global-pillbar">
                            <span className={toneClassName(item.severity)}>
                              {renderSeverityLabel(item.severity)}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {renderFocusKindLabel(item)}
                            </span>
                          </div>
                          <strong>{item.title}</strong>
                          <span>{item.detailText}</span>
                          {itemPath ? (
                            <Link className="next-inline-link" to={itemPath}>
                              Apri dettaglio
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
                  <h2>Accessi operativi</h2>
                </div>
                <p className="next-panel__description">
                  Vai direttamente all'area che serve senza passare da pannelli tecnici o stati di
                  sistema.
                </p>
                <div className="next-access-page__actions">
                  <Link
                    className="next-action-link next-action-link--primary"
                    to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
                  >
                    Mezzi / Dossier
                  </Link>
                  <Link
                    className="next-action-link"
                    to={buildNextPathWithRole("/next/operativita-globale", role, location.search)}
                  >
                    Operativita
                  </Link>
                  <Link
                    className="next-action-link"
                    to={buildNextPathWithRole("/next/strumenti-trasversali", role, location.search)}
                  >
                    Strumenti
                  </Link>
                </div>
              </article>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextCentroControlloPage;
