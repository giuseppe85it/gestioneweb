import { useLocation } from "react-router-dom";
import { NEXT_AREA_ACCESS, NEXT_ROLE_PRESETS, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS, type NextAreaId, type NextAreaTone } from "./nextData";

type NextAreaPageProps = {
  areaId: NextAreaId;
};

const toneClassName = (tone?: NextAreaTone) => {
  switch (tone) {
    case "accent":
      return "next-tone next-tone--accent";
    case "warning":
      return "next-tone next-tone--warning";
    case "success":
      return "next-tone next-tone--success";
    default:
      return "next-tone";
  }
};

function NextAreaPage({ areaId }: NextAreaPageProps) {
  const location = useLocation();
  const area = NEXT_AREAS[areaId];
  const access = NEXT_AREA_ACCESS[areaId];
  const role = getNextRoleFromSearch(location.search);
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);

  return (
    <section className="next-page">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">{area.description}</p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--accent">{area.phase}</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--subtle">Nessuna scrittura dati</span>
        </div>
      </header>

      <section className="next-summary-grid">
        {area.cards.map((card) => (
          <article key={card.label} className={`next-summary-card ${toneClassName(card.tone)}`}>
            <p className="next-summary-card__label">{card.label}</p>
            <strong className="next-summary-card__value">{card.value}</strong>
            <p className="next-summary-card__meta">{card.meta}</p>
          </article>
        ))}
      </section>

      <section className="next-section-grid">
        {area.sections.map((section) => (
          <article
            key={section.title}
            className={`next-panel ${toneClassName(section.tone)}`}
          >
            <div className="next-panel__header">
              <h2>{section.title}</h2>
            </div>
            <p className="next-panel__description">{section.description}</p>
            {section.items?.length ? (
              <ul className="next-panel__list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className="next-inline-grid">
        <article className="next-inline-panel">
          <h3>Visibilita e accesso</h3>
          <p>
            Permission key: <code>{access.permissionKey}</code>. Questa macro-area e
            gia pronta per una futura matrice piu granulare per singola utenza, senza
            dipendere da una sola sidebar fissa uguale per tutti.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Stato runtime della shell</h3>
          <p>
            Questa pagina e navigabile dentro l&apos;app reale ma usa solo contenuti
            statici e placeholder coerenti con il blueprint. Non legge dataset e non
            modifica il comportamento della legacy.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Prossimo step previsto</h3>
          <p>
            Importare in modo progressivo le prime superfici `read-only` dentro questa
            shell, partendo da `Centro di Controllo` e `Dossier Mezzo`, mantenendo il
            gating frontend pronto per una futura permission matrix reale.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextAreaPage;
