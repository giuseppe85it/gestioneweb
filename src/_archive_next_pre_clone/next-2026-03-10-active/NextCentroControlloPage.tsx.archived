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
  const [searchQuery, setSearchQuery] = useState("");
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
  const normalizedQuery = searchQuery.trim().toUpperCase();
  const mezziTotali = fleetItems.length;
  const mezziConAutista = fleetItems.filter((item) => Boolean(item.autistaNome)).length;
  const dossierIncompleti = focusItems.filter((item) => item.kind === "mezzo_incompleto").length;
  const revisionAlerts = (snapshot?.alerts ?? []).filter((item) => item.kind === "revisione").slice(0, 4);
  const visibleAlerts = (snapshot?.alerts ?? []).slice(0, 6);
  const filteredFleet = fleetItems
    .filter((item) => {
      if (!normalizedQuery) return true;
      const haystack = [item.targa, item.categoria, item.marca, item.modello, item.autistaNome ?? ""]
        .join(" ")
        .toUpperCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 6);
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

  const buildDossierPath = (mezzoTarga: string) =>
    buildNextPathWithRole(
      `/next/mezzi-dossier/${encodeURIComponent(mezzoTarga)}`,
      role,
      location.search
    );

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
            Parti dalle priorita reali della giornata, apri il Dossier giusto e scendi nelle aree
            operative solo quando serve.
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
          <section className="next-mother-hero">
            <div className="next-mother-hero__main">
              <div className="next-mother-hero__logo">
                <img src="/logo.png" alt="Logo" />
              </div>
              <div>
                <p className="next-page__eyebrow">Centrale operativa</p>
                <h2>Dashboard Admin</h2>
                <p className="next-panel__description">
                  Panoramica rapida su mezzi, alert e revisioni. Tutti i pannelli portano alle
                  sezioni operative della NEXT.
                </p>
              </div>
            </div>

            <div className="next-hero-link-grid">
              <Link
                className="next-hero-link-card"
                to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
              >
                <strong>Mezzi</strong>
                <span>Anagrafiche e Dossier mezzo</span>
              </Link>
              <Link
                className="next-hero-link-card"
                to={buildNextPathWithRole("/next/operativita-globale", role, location.search)}
              >
                <strong>Operativita</strong>
                <span>Ordini e code globali</span>
              </Link>
              <Link
                className="next-hero-link-card"
                to={buildNextPathWithRole("/next/ia-gestionale", role, location.search)}
              >
                <strong>IA Gestionale</strong>
                <span>Sintesi e passaggio al record giusto</span>
              </Link>
              <Link
                className="next-hero-link-card"
                to={buildNextPathWithRole("/next/strumenti-trasversali", role, location.search)}
              >
                <strong>Strumenti</strong>
                <span>PDF e servizi condivisi</span>
              </Link>
              {firstDossierPath ? (
                <Link className="next-hero-link-card" to={firstDossierPath}>
                  <strong>Apri Dossier</strong>
                  <span>Entra subito su un mezzo gia disponibile</span>
                </Link>
              ) : null}
            </div>
          </section>

          <section className="next-home-dashboard-grid">
            <section className="next-panel next-home-search-card">
              <div className="next-panel__header">
                <div>
                  <h2>Ricerca mezzi</h2>
                  <span className="next-summary-card__label">
                    Cerca targa o autista e apri il Dossier
                  </span>
                </div>
              </div>
              <label className="next-data-search">
                <span className="next-search__label">Ricerca 360</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cerca targa, categoria, marca, modello o autista"
                  aria-label="Ricerca mezzi dal Centro di Controllo NEXT"
                />
              </label>
              <div className="next-control-list">
                {!normalizedQuery ? (
                  <div className="next-data-state">
                    <strong>Digita per cercare</strong>
                    <span>La ricerca apre direttamente il Dossier del mezzo selezionato.</span>
                  </div>
                ) : filteredFleet.length === 0 ? (
                  <div className="next-data-state">
                    <strong>Nessun risultato</strong>
                    <span>Nessun mezzo corrisponde alla ricerca inserita.</span>
                  </div>
                ) : (
                  filteredFleet.map((item) => (
                    <Link
                      key={item.id}
                      className="next-control-list__item next-control-list__item--link"
                      to={buildDossierPath(item.targa)}
                    >
                      <strong>{item.targa}</strong>
                      <span>
                        {[item.categoria, item.marca, item.modello].filter(Boolean).join(" | ") ||
                          "Scheda mezzo"}
                      </span>
                      <span>{item.autistaNome ? `Autista: ${item.autistaNome}` : "Autista: -"}</span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="next-panel next-tone next-tone--accent">
              <div className="next-panel__header">
                <div>
                  <h2>Alert</h2>
                  <span className="next-summary-card__label">
                    Revisioni, segnalazioni e conflitti da leggere subito
                  </span>
                </div>
                <span className="next-chip next-chip--accent">{counters?.alertsVisible ?? 0}</span>
              </div>
              {visibleAlerts.length === 0 ? (
                <div className="next-data-state">
                  <strong>Nessun alert attivo</strong>
                  <span>Non risultano priorita aperte in questo momento.</span>
                </div>
              ) : (
                <div className="next-control-list">
                  {visibleAlerts.map((item) => {
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
                        </div>
                        <strong>{item.mezzoTarga ?? item.title}</strong>
                        <span>{item.detailText}</span>
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
            </section>

            <section className="next-panel">
              <div className="next-panel__header">
                <div>
                  <h2>Sessioni e follow-up</h2>
                  <span className="next-summary-card__label">Focus operativi da seguire</span>
                </div>
              </div>
              {focusItems.length === 0 ? (
                <div className="next-data-state">
                  <strong>Nessun focus operativo</strong>
                  <span>Non risultano elementi secondari da seguire adesso.</span>
                </div>
              ) : (
                <div className="next-control-list">
                  {focusItems.slice(0, 5).map((item) => {
                    const itemPath = buildItemPath(item.targetRouteKind, item.mezzoTarga);
                    return (
                      <div key={item.id} className="next-control-list__item next-control-list__item--soft">
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
            </section>

            <section className="next-panel next-tone next-tone--warning">
              <div className="next-panel__header">
                <div>
                  <h2>Revisioni</h2>
                  <span className="next-summary-card__label">
                    Allarmi su scadenze e mezzi da aprire
                  </span>
                </div>
              </div>
              <div className="next-summary-grid next-summary-grid--compact">
                <article className="next-summary-card next-tone next-tone--warning">
                  <p className="next-summary-card__label">Scadute</p>
                  <strong className="next-summary-card__value">{counters?.revisioniScadute ?? 0}</strong>
                </article>
                <article className="next-summary-card next-tone next-tone--accent">
                  <p className="next-summary-card__label">In scadenza</p>
                  <strong className="next-summary-card__value">{counters?.revisioniInScadenza ?? 0}</strong>
                </article>
              </div>
              {revisionAlerts.length === 0 ? (
                <div className="next-data-state">
                  <strong>Nessuna revisione imminente</strong>
                  <span>Non risultano revisioni vicine nel perimetro attuale.</span>
                </div>
              ) : (
                <div className="next-control-list">
                  {revisionAlerts.map((item) => {
                    const itemPath = buildItemPath(item.targetRouteKind, item.mezzoTarga);
                    return (
                      <div key={item.id} className="next-control-list__item next-control-list__item--soft">
                        <strong>{item.mezzoTarga ?? item.title}</strong>
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
            </section>

            <section className="next-panel">
              <div className="next-panel__header">
                <div>
                  <h2>Flotta</h2>
                  <span className="next-summary-card__label">Situazione sintetica mezzi</span>
                </div>
              </div>
              <div className="next-control-list">
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Mezzi letti</strong>
                  <span>{mezziTotali} mezzi presenti in flotta.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Con autista</strong>
                  <span>{mezziConAutista} mezzi con autista anagrafico visibile.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Schede da completare</strong>
                  <span>{dossierIncompleti} mezzi con campi da completare nel Dossier.</span>
                </div>
              </div>
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextCentroControlloPage;
