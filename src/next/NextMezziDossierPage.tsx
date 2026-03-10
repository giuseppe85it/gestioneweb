import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  type NextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
  readNextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";

const dossierHighlights = [
  "Identita mezzo e dati principali",
  "Storico tecnico e manutenzioni",
  "Rifornimenti recenti",
  "Documenti e costi utili",
];

const entryTips = [
  "Cerca per targa o autista",
  "Filtra per categoria",
  "Apri il Dossier dalla scheda del mezzo",
];

function NextMezziDossierPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["mezzi-dossier"];
  const [snapshot, setSnapshot] = useState<NextAnagraficheFlottaSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutte");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setStatus("loading");
        setError(null);
        const nextSnapshot = await readNextAnagraficheFlottaSnapshot();
        if (!active) return;
        setSnapshot(nextSnapshot);
        setStatus("success");
      } catch {
        if (!active) return;
        setSnapshot(null);
        setStatus("error");
        setError("Impossibile leggere l'elenco mezzi.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const mezzi = snapshot?.items ?? [];
  const normalizedQuery = query.trim().toUpperCase();
  const categories = Array.from(new Set(mezzi.map((item) => item.categoria))).sort((left, right) =>
    left.localeCompare(right, "it", { sensitivity: "base" })
  );
  const filterCategories = ["Tutte", ...categories];
  const filteredMezzi = mezzi.filter((item) => {
    const matchesCategory =
      selectedCategory === "Tutte" || item.categoria === selectedCategory;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      item.targa,
      item.categoria,
      item.marca,
      item.modello,
      item.autistaNome ?? "",
    ]
      .join(" ")
      .toUpperCase();

    return haystack.includes(normalizedQuery);
  });

  const mezziConAutista = mezzi.filter((item) => item.autistaNome).length;
  const mezziSenzaMarcaModello = mezzi.filter(
    (item) => !item.marca.trim() && !item.modello.trim()
  ).length;
  const categoryBreakdown = Array.from(
    mezzi.reduce<Map<string, number>>((accumulator, item) => {
      accumulator.set(item.categoria, (accumulator.get(item.categoria) ?? 0) + 1);
      return accumulator;
    }, new Map())
  )
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 4);

  const renderVehicleTitle = (item: NextMezzoListItem) => {
    const title = [item.marca, item.modello].filter(Boolean).join(" ");
    return title || "Marca / modello non valorizzati";
  };

  const buildDossierPath = (item: NextMezzoListItem) =>
    buildNextPathWithRole(
      `/next/mezzi-dossier/${encodeURIComponent(item.targa)}`,
      role,
      location.search
    );

  const firstDossierPath =
    filteredMezzi.length > 0 ? buildDossierPath(filteredMezzi[0]) : null;

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Cerca il mezzo, apri il Dossier giusto e vai subito al contesto che serve senza
            passaggi intermedi.
          </p>
        </div>

        <div className="next-page__hero-actions">
          <div className="next-access-page__actions">
            {firstDossierPath ? (
              <Link className="next-action-link next-action-link--primary" to={firstDossierPath}>
                Apri primo Dossier
              </Link>
            ) : null}
            <Link
              className="next-action-link"
              to={buildNextPathWithRole("/next/centro-controllo", role, location.search)}
            >
              Torna alla Home
            </Link>
            <Link
              className="next-action-link"
              to={buildNextPathWithRole("/next/ia-gestionale", role, location.search)}
            >
              Apri IA Gestionale
            </Link>
          </div>
        </div>
      </header>

      <section className="next-home-ia-band next-tone next-tone--accent">
        <div className="next-home-ia-band__main">
          <p className="next-summary-card__label">Area mezzi</p>
          <h2>Apri il Dossier corretto senza perdere il contesto del mezzo</h2>
          <p className="next-panel__description">
            Da qui la ricerca e semplice: targa, categoria, marca, modello o autista. Il passo
            successivo e sempre il Dossier del mezzo selezionato.
          </p>
        </div>

        <div className="next-home-ia-band__side">
          <div className="next-control-list">
            {entryTips.map((item) => (
              <div key={item} className="next-control-list__item next-control-list__item--soft">
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="next-summary-grid next-summary-grid--compact">
        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Mezzi trovati</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezzi.length : "--"}
          </strong>
          <p className="next-summary-card__meta">
            Mezzi pronti da aprire direttamente in Dossier.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Con autista</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezziConAutista : "--"}
          </strong>
          <p className="next-summary-card__meta">
            Mezzi con riferimento autista visibile in scheda.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Schede incomplete</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezziSenzaMarcaModello : "--"}
          </strong>
          <p className="next-summary-card__meta">
            Dati da completare prima di una lettura piena del mezzo.
          </p>
        </article>
      </section>

      <section className="next-dossier-layout">
        <article className="next-panel next-dossier-main next-tone">
          <div className="next-panel__header">
            <h2>Flotta</h2>
          </div>
          <p className="next-panel__description">
            Cerca il mezzo e apri il suo Dossier dalla scheda senza passare da pagine intermedie.
          </p>

          <div className="next-data-toolbar">
            <label className="next-data-search">
              <span className="next-search__label">Ricerca locale mezzi</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca targa, categoria, marca, modello, autista"
                aria-label="Ricerca mezzi NEXT"
              />
            </label>

            <div className="next-filter-pills" aria-label="Filtro categoria mezzi">
              {filterCategories.map((category) => {
                const isActive = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    className={
                      isActive
                        ? "next-filter-pill next-filter-pill--active"
                        : "next-filter-pill"
                    }
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {status === "loading" ? (
            <div className="next-data-state next-tone next-tone--accent">
              <strong>Caricamento flotta</strong>
              <span>Sto leggendo l'elenco mezzi disponibile.</span>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="next-data-state next-tone next-tone--warning">
              <strong>Elenco non disponibile</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {status === "success" ? (
            filteredMezzi.length === 0 ? (
              <div className="next-data-state">
                <strong>Nessun mezzo trovato</strong>
                <span>Modifica ricerca o filtro categoria per continuare.</span>
              </div>
            ) : (
              <div className="next-vehicle-grid">
                {filteredMezzi.map((item) => (
                  <article key={item.id} className="next-vehicle-card">
                    <div className="next-vehicle-card__header">
                      <div>
                        <p className="next-summary-card__label">Targa</p>
                        <h3>{item.targa}</h3>
                      </div>
                      <span className="next-chip next-chip--accent">{item.categoria}</span>
                    </div>

                    <p className="next-vehicle-card__title">{renderVehicleTitle(item)}</p>

                    <dl className="next-vehicle-card__meta">
                      <div>
                        <dt>Autista</dt>
                        <dd>{item.autistaNome ?? "Non valorizzato"}</dd>
                      </div>
                      <div>
                        <dt>Stato scheda</dt>
                        <dd>
                          {!item.marca.trim() && !item.modello.trim()
                            ? "Da completare"
                            : "Pronta"}
                        </dd>
                      </div>
                    </dl>

                    <div className="next-vehicle-card__footer">
                      <Link className="next-inline-link" to={buildDossierPath(item)}>
                        Apri Dossier
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : null}
        </article>

        <div className="next-dossier-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Nel Dossier trovi</h2>
            </div>
            <p className="next-panel__description">
              Una volta aperta la scheda del mezzo, queste sono le letture principali gia utili.
            </p>
            <ul className="next-panel__list">
              {dossierHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Portfolio flotta</h2>
            </div>
            <p className="next-panel__description">
              Supporto laterale per capire da quali categorie arriva la maggior parte dei mezzi.
            </p>
            <div className="next-control-list">
              {categoryBreakdown.map((entry) => (
                <div
                  key={entry.categoria}
                  className="next-control-list__item next-control-list__item--soft"
                >
                  <strong>{entry.categoria}</strong>
                  <span>{entry.total} mezzi presenti in elenco.</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}

export default NextMezziDossierPage;
