import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  type NextProcurementOrderItem,
  type NextProcurementOrderState,
  type NextProcurementSnapshot,
  readNextProcurementSnapshot,
} from "./domain/nextProcurementDomain";

function renderOrderStateLabel(value: NextProcurementOrderState): string {
  switch (value) {
    case "arrivato":
      return "Arrivato";
    case "parziale":
      return "Parziale";
    default:
      return "In attesa";
  }
}

function renderOrderStateClassName(value: NextProcurementOrderState): string {
  switch (value) {
    case "arrivato":
      return "next-chip next-chip--success";
    case "parziale":
      return "next-chip next-chip--accent";
    default:
      return "next-chip next-chip--warning";
  }
}

function renderOrderMeta(item: NextProcurementOrderItem): string {
  const parts = [
    item.orderDateLabel ? `Ordine ${item.orderDateLabel}` : "Data ordine non disponibile",
    `${item.totalRows} righe`,
    `${item.arrivedRows} arrivate`,
    item.latestArrivalLabel ? `Ultimo arrivo ${item.latestArrivalLabel}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderOrderCard(item: NextProcurementOrderItem) {
  return (
    <div key={item.id} className="next-order-card">
      <div className="next-global-pillbar">
        <span className={renderOrderStateClassName(item.state)}>
          {renderOrderStateLabel(item.state)}
        </span>
      </div>
      <strong>{item.supplierName}</strong>
      <span>{renderOrderMeta(item)}</span>
      <span>
        Materiali:{" "}
        {item.materialPreview.length > 0
          ? item.materialPreview.join(", ")
          : "anteprima non disponibile"}
      </span>
    </div>
  );
}

function NextOperativitaGlobalePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["operativita-globale"];
  const [snapshot, setSnapshot] = useState<NextProcurementSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setStatus("loading");
        setError(null);
        const nextSnapshot = await readNextProcurementSnapshot();
        if (!active) return;
        setSnapshot(nextSnapshot);
        setStatus("success");
      } catch {
        if (!active) return;
        setSnapshot(null);
        setStatus("error");
        setError("Impossibile leggere il banco ordini.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const counts = snapshot?.counts;

  return (
    <section className="next-page next-operations-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Banco operativo degli ordini: vedi cosa e fermo, cosa e parziale e cosa puo essere
            chiuso senza confondere questa area con il Dossier mezzo.
          </p>
        </div>

        <div className="next-page__hero-actions">
          <div className="next-access-page__actions">
            <Link
              className="next-action-link next-action-link--primary"
              to={buildNextPathWithRole("/next/centro-controllo", role, location.search)}
            >
              Torna alla Home
            </Link>
            <Link
              className="next-action-link"
              to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
            >
              Vai ai Dossier
            </Link>
          </div>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento ordini</strong>
          <span>Sto preparando il banco operativo.</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="next-data-state next-tone next-tone--warning">
          <strong>Operativita non disponibile</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === "success" && snapshot ? (
        <>
          <section className="next-home-ia-band next-tone next-tone--accent">
            <div className="next-home-ia-band__main">
              <p className="next-summary-card__label">Ordini</p>
              <h2>Vedi subito cosa sollecitare, completare o chiudere</h2>
              <p className="next-panel__description">
                La pagina e impostata come workbench: colonne chiare, stati leggibili e azioni
                rapide per spostarti dove serve davvero.
              </p>
            </div>

            <div className="next-home-ia-band__side">
              <div className="next-control-list">
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>In attesa</strong>
                  <span>Ordini da sbloccare o sollecitare.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Parziali</strong>
                  <span>Consegne aperte da completare.</span>
                </div>
                <div className="next-control-list__item next-control-list__item--soft">
                  <strong>Arrivati</strong>
                  <span>Ordini pronti da chiudere e archiviare.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="next-summary-grid next-summary-grid--compact">
            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Ordini in attesa</p>
              <strong className="next-summary-card__value">
                {counts?.pendingOrders ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Ordini con arrivi ancora tutti da ricevere.
              </p>
            </article>

            <article className="next-summary-card next-tone">
              <p className="next-summary-card__label">Ordini parziali</p>
              <strong className="next-summary-card__value">
                {counts?.partialOrders ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Flusso aperto che richiede completamento.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Ordini arrivati</p>
              <strong className="next-summary-card__value">
                {counts?.arrivedOrders ?? 0}
              </strong>
              <p className="next-summary-card__meta">
                Pratiche completate e pronte da chiudere.
              </p>
            </article>
          </section>

          <section className="next-global-layout">
            <article className="next-panel next-global-main next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Workbench ordini</h2>
              </div>
              <p className="next-panel__description">
                Le colonne restano semplici: stato del flusso, fornitore, materiali principali e
                avanzamento.
              </p>

              <div className="next-workbench-grid">
                <div className="next-workbench-column">
                  <div className="next-panel__header">
                    <h3>In attesa</h3>
                    <span className="next-chip next-chip--warning">
                      {snapshot.groups.pending.length}
                    </span>
                  </div>
                  {snapshot.groups.pending.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun ordine in attesa</strong>
                      <span>Non risultano ordini completamente pendenti.</span>
                    </div>
                  ) : (
                    <div className="next-status-board">
                      {snapshot.groups.pending.slice(0, 4).map((item) => renderOrderCard(item))}
                    </div>
                  )}
                </div>

                <div className="next-workbench-column">
                  <div className="next-panel__header">
                    <h3>Parziali</h3>
                    <span className="next-chip next-chip--accent">
                      {snapshot.groups.partial.length}
                    </span>
                  </div>
                  {snapshot.groups.partial.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun ordine parziale</strong>
                      <span>Non risultano pratiche in stato intermedio.</span>
                    </div>
                  ) : (
                    <div className="next-status-board">
                      {snapshot.groups.partial.slice(0, 4).map((item) => renderOrderCard(item))}
                    </div>
                  )}
                </div>

                <div className="next-workbench-column">
                  <div className="next-panel__header">
                    <h3>Arrivati</h3>
                    <span className="next-chip next-chip--success">
                      {snapshot.groups.arrived.length}
                    </span>
                  </div>
                  {snapshot.groups.arrived.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun ordine arrivato</strong>
                      <span>Non risultano ordini completamente completati.</span>
                    </div>
                  ) : (
                    <div className="next-status-board">
                      {snapshot.groups.arrived.slice(0, 4).map((item) => renderOrderCard(item))}
                    </div>
                  )}
                </div>
              </div>
            </article>

            <div className="next-global-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Accessi rapidi</h2>
                </div>
                <p className="next-panel__description">
                  Usa la home per il quadro generale e il Dossier quando un ordine porta a un
                  mezzo preciso.
                </p>
                <div className="next-access-page__actions">
                  <Link
                    className="next-action-link next-action-link--primary"
                    to={buildNextPathWithRole("/next/centro-controllo", role, location.search)}
                  >
                    Centro di Controllo
                  </Link>
                  <Link
                    className="next-action-link"
                    to={buildNextPathWithRole("/next/mezzi-dossier", role, location.search)}
                  >
                    Mezzi / Dossier
                  </Link>
                  <Link
                    className="next-action-link"
                    to={buildNextPathWithRole("/next/strumenti-trasversali", role, location.search)}
                  >
                    Strumenti
                  </Link>
                </div>
              </article>

              <article className="next-panel next-tone">
                <div className="next-panel__header">
                  <h2>Quando passare al Dossier</h2>
                </div>
                <p className="next-panel__description">
                  Tieni qui la regia globale. Scendi nel Dossier solo quando l'ordine richiede un
                  approfondimento sul singolo mezzo.
                </p>
                <ul className="next-panel__list">
                  <li>mezzo identificato e da verificare</li>
                  <li>documento o costo collegato alla targa</li>
                  <li>storico tecnico da consultare prima di decidere</li>
                </ul>
              </article>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextOperativitaGlobalePage;
