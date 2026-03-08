import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  NEXT_ANAGRAFICHE_FLOTTA_DOMAIN,
  type NextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
  readNextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";

function NextMezziDossierPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["mezzi-dossier"];
  const access = NEXT_AREA_ACCESS["mezzi-dossier"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
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
        setError("Impossibile leggere il dataset canonico dei mezzi.");
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

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Primo ingresso dati reale della NEXT sul dominio `Anagrafiche flotta e persone`.
            L&apos;elenco mezzi legge solo `storage/@mezzi_aziendali`, usa un mapping minimo,
            apre il primo Dossier NEXT iniziale per targa e resta interamente `read-only`.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--success">IMPORTATO READ-ONLY</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">Fonte legacy normalizzata</span>
          <span className="next-chip next-chip--warning">Nessuna scrittura</span>
        </div>
      </header>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Dataset attivo</p>
          <strong className="next-summary-card__value">
            {NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset}
          </strong>
          <p className="next-summary-card__meta">
            Primo reader canonico NEXT. `@colleghi` resta nel dominio ma non viene letto finche
            una vista futura non ne ha bisogno davvero.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Mezzi letti</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezzi.length : "--"}
          </strong>
          <p className="next-summary-card__meta">
            Ordinati per categoria e targa, senza importare altri domini mezzo-centrici.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Autista valorizzato</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezziConAutista : "--"}
          </strong>
          <p className="next-summary-card__meta">
            Campo usato solo come orientamento anagrafico. Nessuna sessione live, nessun feed autisti.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Campi incompleti</p>
          <strong className="next-summary-card__value">
            {status === "success" ? mezziSenzaMarcaModello : "--"}
          </strong>
          <p className="next-summary-card__meta">
            I dati mancanti restano visibili. La NEXT non inventa e non corregge il dataset.
          </p>
        </article>
      </section>

      <section className="next-dossier-layout">
        <article className="next-panel next-dossier-main next-tone">
          <div className="next-panel__header">
            <h2>Elenco mezzi NEXT read-only</h2>
          </div>
          <p className="next-panel__description">
            La lista usa solo i campi stabili dichiarati per questa fase:
            <code> {NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.nextListFields.join(", ")}</code>.
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
              <strong>Caricamento reader canonico</strong>
              <span>Sto leggendo `storage/@mezzi_aziendali` in sola lettura.</span>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="next-data-state next-tone next-tone--warning">
              <strong>Reader non disponibile</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {status === "success" ? (
            filteredMezzi.length === 0 ? (
              <div className="next-data-state">
                <strong>Nessun mezzo trovato</strong>
                <span>Modifica ricerca o filtro categoria per rileggere il dominio.</span>
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
                        <dt>Dominio</dt>
                        <dd>{NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code}</dd>
                      </div>
                      <div>
                        <dt>Fonte</dt>
                        <dd>
                          {item.sourceCollection}/{item.sourceKey}
                        </dd>
                      </div>
                      <div>
                        <dt>Autista</dt>
                        <dd>{item.autistaNome ?? "Non valorizzato"}</dd>
                      </div>
                    </dl>

                    <div className="next-vehicle-card__footer">
                      <span className="next-chip next-chip--success">Read-only</span>
                      <Link className="next-inline-link" to={buildDossierPath(item)}>
                        Apri Dossier iniziale
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
              <h2>Reader canonico NEXT</h2>
            </div>
            <p className="next-panel__description">
              La pagina non usa `Mezzi.tsx` come sorgente funzionale. La lettura passa da
              un reader dedicato al dominio `D01`, separato dalla UI legacy e senza writer.
            </p>
            <ul className="next-panel__list">
              <li>Dominio logico: `Anagrafiche flotta e persone`</li>
              <li>Dataset fisico attivo: `storage/@mezzi_aziendali`</li>
              <li>Dataset mappato ma non letto ora: `@colleghi`</li>
            </ul>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Perimetro escluso</h2>
            </div>
            <p className="next-panel__description">
              La lista usa solo `D01`, mentre il dettaglio ha ora un primo blocco tecnico `D02`
              minimale. Restano fuori colleghi, sessioni live, writer e i domini ancora
              sensibili o bloccanti oltre questo ingresso controllato.
            </p>
          </article>
        </div>
      </section>

      <section className="next-section-grid">
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Che cosa cambia davvero</h2>
          </div>
          <p className="next-panel__description">
            `/next/mezzi-dossier` non e piu solo shell: ora legge dati reali e apre un primo
            Dossier NEXT pulito, ma resta nel punto piu stabile e controllabile del dominio.
          </p>
          <ul className="next-panel__list">
            <li>ingresso flotta reale</li>
            <li>ricerca, filtro e accesso al dettaglio</li>
            <li>nessuna azione scrivente</li>
          </ul>
        </article>

        <article className="next-panel next-tone next-tone--success">
          <div className="next-panel__header">
            <h2>Dossier iniziale attivo</h2>
          </div>
          <p className="next-panel__description">
            La targa e gia letta in modo pulito e stabile. Il dettaglio ora combina il nucleo
            anagrafico `D01` con un primo blocco tecnico `D02` minimale, sempre in `read-only`.
          </p>
          <ul className="next-panel__list">
            <li>targa come pivot forte</li>
            <li>lista separata dal Dossier</li>
            <li>primo blocco tecnico reale nel dettaglio mezzo</li>
          </ul>
        </article>

        <article className="next-panel next-tone next-tone--warning">
          <div className="next-panel__header">
            <h2>Non ancora incluso</h2>
          </div>
          <p className="next-panel__description">
            Il Dossier non e completo: dopo il primo ingresso di `D02`, i prossimi blocchi
            dovranno arrivare dominio per dominio e con reader separati.
          </p>
          <ul className="next-panel__list">
            <li>rifornimenti, documenti, costi, PDF e IA contestuale ancora fuori</li>
            <li>no clone della legacy</li>
            <li>no scorciatoie sporche</li>
          </ul>
        </article>
      </section>
    </section>
  );
}

export default NextMezziDossierPage;
