import { useMemo } from "react";
import {
  buildNextProcurementListView,
  findNextProcurementOrder,
  type NextProcurementCloneTab,
  type NextProcurementListTab,
  type NextProcurementOrderItem,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import "../pages/Acquisti.css";
import "./next-shell.css";

type NextProcurementReadOnlyPanelProps = {
  snapshot: NextProcurementSnapshot;
  activeTab: NextProcurementCloneTab;
  orderId: string | null;
  detailBackTab: NextProcurementListTab;
  onTabChange: (tab: NextProcurementCloneTab) => void;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
  iaPrefill?: {
    handoffId: string;
    fornitore: string | null;
    materiale: string | null;
    documentoNome: string | null;
    note: string;
    statusLabel: string;
    missingFields: string[];
    verifyFields: string[];
  } | null;
};

const EMBEDDED_PAGE_STYLE = {
  minHeight: "auto",
  padding: 0,
  background: "transparent",
} as const;

const HEADER_ACTIONS_STYLE = {
  minWidth: 0,
  marginLeft: "auto",
} as const;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function formatStrictState(
  order: NextProcurementOrderItem,
): { label: string; className: string } {
  if (order.state === "arrivato") {
    return { label: "Arrivato", className: "is-ok" };
  }
  if (order.state === "parziale") {
    return { label: "Parziale", className: "is-warn" };
  }
  return { label: "In attesa", className: "is-danger" };
}

function buildRawPricingLabel(
  order: NextProcurementOrderItem,
): { summary: string; missingRows: number } {
  const pricedRows = order.materials.filter(
    (material) => material.lineTotal !== null && material.currency,
  );
  const missingRows = Math.max(order.materials.length - pricedRows.length, 0);

  if (pricedRows.length === 0) {
    return {
      summary: "Prezzi raw non disponibili nel clone",
      missingRows,
    };
  }

  const currencies = Array.from(
    new Set(
      pricedRows
        .map((material) => material.currency)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (currencies.length !== 1) {
    return {
      summary: "Totale raw non affidabile: valute miste",
      missingRows,
    };
  }

  const total = pricedRows.reduce(
    (accumulator, material) => accumulator + (material.lineTotal ?? 0),
    0,
  );
  const labelPrefix = missingRows > 0 ? "Totale raw parziale" : "Totale raw";

  return {
    summary: `${labelPrefix}: ${currencies[0]} ${total.toFixed(2)}`,
    missingRows,
  };
}

function renderListTable(props: {
  title: string;
  subtitle: string;
  items: NextProcurementOrderItem[];
  fromTab: NextProcurementListTab;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
}) {
  const { title, subtitle, items, fromTab, onOpenOrder } = props;

  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="acq-list-empty">
          {fromTab === "ordini"
            ? "Nessun ordine in attesa."
            : "Nessun ordine arrivato."}
        </div>
      ) : (
        <div className="acq-orders-table-wrap">
          <table className="acq-orders-table">
            <thead>
              <tr>
                <th>Ordine</th>
                <th>Data</th>
                <th>Fornitore</th>
                <th>Stato</th>
                <th>Materiali</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const state = formatStrictState(order);
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="acq-orders-cell-main" title={order.id}>
                        <strong>{order.orderReference}</strong>
                      </div>
                    </td>
                    <td>{order.orderDateLabel ?? "-"}</td>
                    <td>{order.supplierName}</td>
                    <td>
                      <span className={`acq-pill ${state.className}`}>
                        {state.label}
                      </span>
                    </td>
                    <td>
                      <div className="acq-orders-stats-inline">
                        <span>Tot {order.totalRows}</span>
                        <span>Arr {order.arrivedRows}</span>
                        <span>Att {order.pendingRows}</span>
                      </div>
                      {order.materialPreview.length > 0 ? (
                        <div
                          className="acq-orders-cell-main"
                          style={{ marginTop: 4 }}
                        >
                          <small>{order.materialPreview.join(", ")}</small>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div className="acq-orders-actions-inline">
                        <button
                          type="button"
                          className="acq-btn acq-btn--primary"
                          onClick={() => onOpenOrder(order.id, fromTab)}
                        >
                          Apri dettaglio read-only
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderBlockedTab(props: {
  title: string;
  subtitle: string;
  reason: string;
  onGoOrdini: () => void;
  onGoArrivi: () => void;
}) {
  const { title, subtitle, reason, onGoOrdini, onGoArrivi } = props;

  return (
    <div className="acq-tab-panel">
      <div className="acq-placeholder" style={{ display: "grid", gap: 12 }}>
        <div className="acq-section-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="acq-pill is-warn" style={{ width: "fit-content" }}>
          Bloccato o solo preview nel clone
        </div>
        <p>{reason}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="acq-btn acq-btn--primary"
            onClick={onGoOrdini}
          >
            Vai a ordini read-only
          </button>
          <button type="button" className="acq-btn" onClick={onGoArrivi}>
            Vai a arrivi read-only
          </button>
        </div>
      </div>
    </div>
  );
}

function renderOrderDetail(props: {
  order: NextProcurementOrderItem;
  backTab: NextProcurementListTab;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
  detailDisabledReason: string;
}) {
  const { order, backTab, onCloseOrder, detailDisabledReason } = props;
  const state = formatStrictState(order);
  const pricing = buildRawPricingLabel(order);

  return (
    <div className="acq-tab-panel acq-tab-panel--detail">
      <div className="acq-detail">
        <div className="acq-detail-head">
          <div>
            <p className="acq-section-kicker">Dettaglio ordine read-only</p>
            <h3>{order.supplierName}</h3>
            <p className="acq-detail-meta">
              {order.orderReference}
              {order.orderDateLabel
                ? ` - Ordine del ${order.orderDateLabel}`
                : ""}
            </p>
          </div>
          <div className="acq-detail-head-actions">
            <button
              type="button"
              className="acq-btn"
              onClick={() => onCloseOrder(backTab)}
            >
              Indietro
            </button>
            <button
              type="button"
              className="acq-btn"
              disabled
              title={detailDisabledReason}
            >
              {order.state === "arrivato"
                ? "Segna non arrivato (bloccato)"
                : "Segna arrivato (bloccato)"}
            </button>
            <button
              type="button"
              className="acq-btn acq-btn--primary"
              disabled
              title={detailDisabledReason}
            >
              Modifica (bloccata)
            </button>
          </div>
        </div>

        <div className="acq-detail-summary">
          <div className="acq-detail-summary-left">
            <span className={`acq-pill ${state.className}`}>{state.label}</span>
            <span className="acq-pill">Materiali: {order.totalRows}</span>
            <span className="acq-pill">Arrivati: {order.arrivedRows}</span>
            {order.latestArrivalLabel ? (
              <span className="acq-pill">
                Ultimo arrivo: {order.latestArrivalLabel}
              </span>
            ) : null}
          </div>
          <div className="acq-detail-totals">
            <div className="acq-detail-pdf-actions">
              <button
                type="button"
                className="acq-btn"
                disabled
                title={detailDisabledReason}
              >
                PDF fornitori (bloccato)
              </button>
              <button
                type="button"
                className="acq-btn"
                disabled
                title={detailDisabledReason}
              >
                Anteprima PDF (bloccata)
              </button>
              <button
                type="button"
                className="acq-btn acq-btn--primary"
                disabled
                title={detailDisabledReason}
              >
                PDF interno (bloccato)
              </button>
            </div>
            <strong>{pricing.summary}</strong>
            {pricing.missingRows > 0 ? (
              <span className="acq-pill">
                Righe senza prezzo: {pricing.missingRows}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="acq-btn"
          disabled
          title={detailDisabledReason}
        >
          + Aggiungi materiale (bloccato)
        </button>

        <label className="acq-order-note acq-order-note--detail">
          <span>Note ordine (sola lettura)</span>
          <textarea
            readOnly
            value={order.orderNote ?? ""}
            placeholder="Nessuna nota ordine disponibile"
          />
        </label>

        <div className="acq-detail-table-wrap">
          <table className="acq-detail-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Descrizione</th>
                <th>Q.ta</th>
                <th>Unita</th>
                <th>Arrivato</th>
                <th>Data arrivo</th>
                <th>Note</th>
                <th>Totale riga</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {order.materials.length > 0 ? (
                order.materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div className="acq-detail-photo-cell">
                        {material.photoUrl ? (
                          <img
                            src={material.photoUrl}
                            alt={material.descrizione}
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="acq-detail-desc-cell">
                        <strong title={material.id}>
                          {material.descrizione}
                        </strong>
                        {material.quality !== "certo" ? (
                          <small>{material.flags.join(", ")}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>{material.quantita ?? "-"}</td>
                    <td>{material.unita ?? "-"}</td>
                    <td>
                      <span
                        className={`acq-pill ${
                          material.arrived ? "is-ok" : "is-danger"
                        }`}
                      >
                        {material.arrived ? "Si" : "No"}
                      </span>
                    </td>
                    <td>{material.arrivalDateLabel ?? "-"}</td>
                    <td>{material.note ?? "-"}</td>
                    <td>
                      {material.lineTotal !== null && material.currency
                        ? `${material.currency} ${material.lineTotal.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="acq-detail-state">
                    Nessun materiale leggibile su questo ordine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function NextProcurementReadOnlyPanel({
  snapshot,
  activeTab,
  orderId,
  detailBackTab,
  onTabChange,
  onOpenOrder,
  onCloseOrder,
  iaPrefill = null,
}: NextProcurementReadOnlyPanelProps) {
  const activeOrder = findNextProcurementOrder(snapshot, orderId);
  const requestedDetailMissing = Boolean(orderId) && !activeOrder;

  const visibleOrders = useMemo(
    () =>
      buildNextProcurementListView(
        snapshot,
        activeTab === "arrivi" ? "arrivi" : "ordini",
      ).filter((order) => {
        if (!iaPrefill?.fornitore && !iaPrefill?.materiale) {
          return true;
        }

        const supplierMatches = iaPrefill.fornitore
          ? normalizeText(order.supplierName).includes(
              normalizeText(iaPrefill.fornitore),
            )
          : true;
        const materialMatches = iaPrefill.materiale
          ? order.materialPreview.some((entry) =>
              normalizeText(entry).includes(
                normalizeText(iaPrefill.materiale),
              ),
            )
          : true;

        return supplierMatches && materialMatches;
      }),
    [activeTab, iaPrefill, snapshot],
  );

  return (
    <div
      className={`acq-page${activeOrder ? " is-detail" : ""}`}
      style={EMBEDDED_PAGE_STYLE}
    >
      <div className="acq-shell">
        <header className="acq-header">
          <div className="acq-header-brand">
            <img src="/logo.png" alt="Logo" className="acq-header-logo" />
            <div className="acq-header-copy">
              <p className="acq-eyebrow">Gestione Acquisti</p>
              <h1 className="acq-title">Acquisti</h1>
              <p className="acq-subtitle">
                Modulo clone in sola lettura: ordini, arrivi e dettaglio ordine
                restano navigabili; preventivi sono solo preview prudenziale,
                listino solo contesto e le azioni operative non sono importate
                davvero.
              </p>
            </div>
          </div>
          <div className="acq-header-actions" style={HEADER_ACTIONS_STYLE}>
            <span className="next-clone-readonly-badge">SOLA LETTURA</span>
          </div>
        </header>

        <div className="acq-tabs" role="tablist" aria-label="Schede acquisti clone">
          {[
            ["ordine-materiali", "Ordine materiali | bloccato"],
            ["ordini", "Ordini | read-only"],
            ["arrivi", "Arrivi | read-only"],
            ["preventivi", "Prezzi & Preventivi | preview"],
            ["listino", "Listino Prezzi | contesto"],
          ].map(([tabId, label]) => {
            const isActive = !activeOrder && activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`acq-tab ${isActive ? "is-active" : ""}`}
                onClick={() => onTabChange(tabId as NextProcurementCloneTab)}
              >
                <span>{label}</span>
                {tabId === "ordini" ? (
                  <span className="acq-badge">
                    {snapshot.counts.ordiniTabOrders}
                  </span>
                ) : null}
                {tabId === "arrivi" ? (
                  <span className="acq-badge">
                    {snapshot.counts.arriviTabOrders}
                  </span>
                ) : null}
              </button>
            );
          })}
          {activeOrder ? (
            <div className="acq-tab acq-tab--detail-live">
              <span>Dettaglio ordine</span>
            </div>
          ) : null}
        </div>

        <section className="acq-content">
          {activeOrder ? (
            renderOrderDetail({
              order: activeOrder,
              backTab: detailBackTab,
              onCloseOrder,
              detailDisabledReason:
                snapshot.navigability.dettaglioOrdine.reason,
            })
          ) : requestedDetailMissing ? (
            <div className="acq-tab-panel acq-tab-panel--detail">
              <div className="acq-detail-state">
                Ordine non trovato nel dataset in sola lettura del clone.
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="acq-btn"
                  onClick={() => onCloseOrder(detailBackTab)}
                >
                  Indietro
                </button>
              </div>
            </div>
          ) : activeTab === "ordini" ? (
            renderListTable({
              title: "Ordini in attesa",
              subtitle:
                "Vista in sola lettura degli ordini con righe ancora pendenti.",
              items: visibleOrders,
              fromTab: "ordini",
              onOpenOrder,
            })
          ) : activeTab === "arrivi" ? (
            renderListTable({
              title: "Ordini arrivati",
              subtitle:
                "Vista in sola lettura degli ordini con almeno una riga arrivata.",
              items: visibleOrders,
              fromTab: "arrivi",
              onOpenOrder,
            })
          ) : activeTab === "ordine-materiali" ? (
            renderBlockedTab({
              title: "Ordine materiali",
              subtitle:
                "La bozza ordine della madre resta fuori perimetro nel clone.",
              reason: snapshot.navigability.ordineMateriali.reason,
              onGoOrdini: () => onTabChange("ordini"),
              onGoArrivi: () => onTabChange("arrivi"),
            })
          ) : activeTab === "preventivi" ? (
            renderBlockedTab({
              title: "Prezzi e preventivi",
              subtitle:
                "Preventivi e allegati restano solo preview prudenziale nel clone.",
              reason: snapshot.navigability.preventivi.reason,
              onGoOrdini: () => onTabChange("ordini"),
              onGoArrivi: () => onTabChange("arrivi"),
            })
          ) : (
            renderBlockedTab({
              title: "Listino prezzi",
              subtitle:
                "Listino e fornitori restano consultabili solo come contesto, senza edit o consolidamento.",
              reason: snapshot.navigability.listino.reason,
              onGoOrdini: () => onTabChange("ordini"),
              onGoArrivi: () => onTabChange("arrivi"),
            })
          )}
        </section>
      </div>
    </div>
  );
}
