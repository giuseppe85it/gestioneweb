import type {
  NextProcurementApprovalStatus,
  NextProcurementCloneTab,
  NextProcurementListinoItem,
  NextProcurementListTab,
  NextProcurementOrderItem,
  NextProcurementPreventivoItem,
  NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import {
  buildNextProcurementListView,
  findNextProcurementOrder,
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
  alignItems: "flex-end",
  justifyContent: "center",
} as const;

const BLOCKED_CARD_STYLE = {
  display: "grid",
  gap: 12,
} as const;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function formatStrictState(order: NextProcurementOrderItem): { label: string; className: string } {
  if (order.state === "arrivato") {
    return { label: "Arrivato", className: "is-ok" };
  }
  if (order.state === "parziale") {
    return { label: "Parziale", className: "is-warn" };
  }
  return { label: "In attesa", className: "is-danger" };
}

function buildRawPricingLabel(order: NextProcurementOrderItem): {
  summary: string;
  missingRows: number;
  mixedCurrencies: boolean;
} {
  const pricedRows = order.materials.filter(
    (material) => material.lineTotal !== null && material.currency
  );
  const missingRows = Math.max(order.materials.length - pricedRows.length, 0);

  if (pricedRows.length === 0) {
    return {
      summary: "Prezzi raw non disponibili nel clone",
      missingRows,
      mixedCurrencies: false,
    };
  }

  const currencies = Array.from(
    new Set(pricedRows.map((material) => material.currency).filter((value): value is string => Boolean(value)))
  );

  if (currencies.length !== 1) {
    return {
      summary: "Totale raw non affidabile: valute miste",
      missingRows,
      mixedCurrencies: true,
    };
  }

  const total = pricedRows.reduce((accumulator, material) => accumulator + (material.lineTotal ?? 0), 0);
  const labelPrefix = missingRows > 0 ? "Totale raw parziale" : "Totale raw";
  return {
    summary: `${labelPrefix}: ${currencies[0]} ${total.toFixed(2)}`,
    missingRows,
    mixedCurrencies: false,
  };
}

function formatApprovalStatus(status: NextProcurementApprovalStatus) {
  if (status === "approved") {
    return { label: "APPROVATO", className: "is-ok" };
  }
  if (status === "rejected") {
    return { label: "RIFIUTATO", className: "is-danger" };
  }
  return { label: "DA VALUTARE", className: "is-warn" };
}

function formatTrendLabel(trend: NextProcurementListinoItem["trend"]) {
  if (trend === "down") return { label: "IN CALO", className: "is-ok" };
  if (trend === "up") return { label: "IN AUMENTO", className: "is-danger" };
  if (trend === "same") return { label: "STABILE", className: "is-warn" };
  return { label: "NUOVO", className: "is-warn" };
}

function openDocumentAsset(url: string | null, imageUrls: string[] = []) {
  const target = url ?? imageUrls[0] ?? null;
  if (!target) {
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}

function renderPreventiviTable(props: {
  items: NextProcurementPreventivoItem[];
  reason: string;
}) {
  const { items, reason } = props;

  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>Prezzi & Preventivi</h2>
        <p>
          Superficie NEXT nativa in sola lettura: elenco, allegati e stato approvativo restano
          leggibili senza riattivare upload, OCR IA o salvataggi business.
        </p>
      </div>

      <div className="acq-placeholder" style={{ marginBottom: 12 }}>
        <strong>Perimetro clone-safe</strong>
        <p style={{ margin: "6px 0 0" }}>{reason}</p>
      </div>

      {items.length === 0 ? (
        <div className="acq-list-empty">Nessun preventivo leggibile nel dataset clone-safe.</div>
      ) : (
        <div className="acq-prev-table-wrap">
          <table className="acq-prev-table">
            <thead>
              <tr>
                <th>Fornitore</th>
                <th>Numero</th>
                <th>Data</th>
                <th>Righe</th>
                <th>Totale</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const approval = formatApprovalStatus(item.approvalStatus);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="acq-orders-cell-main">
                        <strong>{item.supplierName}</strong>
                        {item.materialsPreview.length ? (
                          <small>{item.materialsPreview.join(", ")}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.numeroPreventivo}</td>
                    <td>{item.dataPreventivoLabel ?? "-"}</td>
                    <td>{item.righeCount}</td>
                    <td>
                      {item.totalAmount !== null && item.currency
                        ? `${item.currency} ${item.totalAmount.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      <div className="acq-orders-cell-main">
                        <span className={`acq-pill ${approval.className}`}>{approval.label}</span>
                        {item.approvalUpdatedAtLabel ? <small>{item.approvalUpdatedAtLabel}</small> : null}
                      </div>
                    </td>
                    <td>
                      <div className="acq-prev-list-actions acq-prev-list-actions--compact">
                        <button
                          type="button"
                          className="acq-btn acq-btn--primary"
                          onClick={() => openDocumentAsset(item.pdfUrl, item.imageUrls)}
                          disabled={!item.pdfUrl && item.imageUrls.length === 0}
                          title={!item.pdfUrl && item.imageUrls.length === 0 ? "Nessun documento collegato" : "Apri documento"}
                        >
                          APRI DOCUMENTO
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

function renderListinoTable(props: {
  items: NextProcurementListinoItem[];
  reason: string;
}) {
  const { items, reason } = props;

  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>Listino prezzi</h2>
        <p>
          Superficie NEXT nativa in sola lettura: voci, trend e fonte documento restano consultabili
          senza aprire edit, import o consolidamento.
        </p>
      </div>

      <div className="acq-placeholder" style={{ marginBottom: 12 }}>
        <strong>Perimetro clone-safe</strong>
        <p style={{ margin: "6px 0 0" }}>{reason}</p>
      </div>

      {items.length === 0 ? (
        <div className="acq-list-empty">Nessuna voce listino leggibile nel dataset clone-safe.</div>
      ) : (
        <div className="acq-prev-table-wrap">
          <table className="acq-prev-table">
            <thead>
              <tr>
                <th>Fornitore</th>
                <th>Articolo</th>
                <th>Unita</th>
                <th>Valuta</th>
                <th>Prezzo</th>
                <th>Trend</th>
                <th>Preventivo</th>
                <th>Data</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const trend = formatTrendLabel(item.trend);
                return (
                  <tr key={item.id}>
                    <td>{item.supplierName}</td>
                    <td>
                      <div className="acq-orders-cell-main">
                        <strong>{item.articoloCanonico}</strong>
                        {item.codiceArticolo ? <small>{item.codiceArticolo}</small> : null}
                      </div>
                    </td>
                    <td>{item.unita ?? "-"}</td>
                    <td>{item.valuta ?? "-"}</td>
                    <td>{item.prezzoAttuale !== null ? item.prezzoAttuale.toFixed(2) : "-"}</td>
                    <td>
                      <span className={`acq-pill ${trend.className}`}>{trend.label}</span>
                    </td>
                    <td>{item.fonteNumeroPreventivo ? `N. ${item.fonteNumeroPreventivo}` : "-"}</td>
                    <td>{item.fonteDataPreventivo ?? item.updatedAtLabel ?? "-"}</td>
                    <td>
                      <div className="acq-prev-list-actions acq-prev-list-actions--compact">
                        <button
                          type="button"
                          className="acq-btn acq-btn--primary"
                          onClick={() => openDocumentAsset(item.pdfUrl, item.imageUrls)}
                          disabled={!item.pdfUrl && item.imageUrls.length === 0}
                          title={!item.pdfUrl && item.imageUrls.length === 0 ? "Nessun documento collegato" : "Apri documento"}
                        >
                          APRI DOCUMENTO
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
          {fromTab === "ordini" ? "Nessun ordine in attesa." : "Nessun ordine arrivato."}
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
                      <span className={`acq-pill ${state.className}`}>{state.label}</span>
                    </td>
                    <td>
                      <div className="acq-orders-stats-inline">
                        <span>Tot {order.totalRows}</span>
                        <span>Arr {order.arrivedRows}</span>
                        <span>Att {order.pendingRows}</span>
                      </div>
                      {order.materialPreview.length > 0 ? (
                        <div className="acq-orders-cell-main" style={{ marginTop: 4 }}>
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
                          Apri
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
      <div className="acq-placeholder" style={BLOCKED_CARD_STYLE}>
        <div className="acq-section-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="acq-pill is-warn" style={{ width: "fit-content" }}>
          Bloccato nel clone read-only
        </div>
        <p>{reason}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="acq-btn acq-btn--primary" onClick={onGoOrdini}>
            Vai a ordini
          </button>
          <button type="button" className="acq-btn" onClick={onGoArrivi}>
            Vai a arrivi
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
            <p className="acq-section-kicker">Dettaglio ordine</p>
            <h3>{order.supplierName}</h3>
            <p className="acq-detail-meta">
              {order.orderReference}
              {order.orderDateLabel ? ` - Ordine del ${order.orderDateLabel}` : ""}
            </p>
          </div>
          <div className="acq-detail-head-actions">
            <button type="button" className="acq-btn" onClick={() => onCloseOrder(backTab)}>
              Indietro
            </button>
            <button type="button" className="acq-btn" disabled title={detailDisabledReason}>
              {order.state === "arrivato" ? "Segna NON Arrivato" : "Segna Arrivato"}
            </button>
            <button
              type="button"
              className="acq-btn acq-btn--primary"
              disabled
              title={detailDisabledReason}
            >
              Modifica
            </button>
          </div>
        </div>

        <div className="acq-detail-summary">
          <div className="acq-detail-summary-left">
            <span className={`acq-pill ${state.className}`}>{state.label}</span>
            <span className="acq-pill">Materiali: {order.totalRows}</span>
            <span className="acq-pill">Arrivati: {order.arrivedRows}</span>
            {order.latestArrivalLabel ? (
              <span className="acq-pill">Ultimo arrivo: {order.latestArrivalLabel}</span>
            ) : null}
          </div>
          <div className="acq-detail-totals">
            <div className="acq-detail-pdf-actions">
              <button type="button" className="acq-btn" disabled title={detailDisabledReason}>
                PDF Fornitori
              </button>
              <button type="button" className="acq-btn" disabled title={detailDisabledReason}>
                ANTEPRIMA PDF
              </button>
              <button
                type="button"
                className="acq-btn acq-btn--primary"
                disabled
                title={detailDisabledReason}
              >
                PDF Interno
              </button>
            </div>
            <strong>{pricing.summary}</strong>
            {pricing.missingRows > 0 ? (
              <span className="acq-pill">Righe senza prezzo: {pricing.missingRows}</span>
            ) : null}
          </div>
        </div>

        <button type="button" className="acq-btn" disabled title={detailDisabledReason}>
          + Aggiungi materiale
        </button>

        <label className="acq-order-note acq-order-note--detail">
          <span>Note ordine (solo lettura)</span>
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
                        {material.photoUrl ? <img src={material.photoUrl} alt={material.descrizione} /> : <span>-</span>}
                      </div>
                    </td>
                    <td>
                      <div className="acq-detail-desc-cell">
                        <strong title={material.id}>{material.descrizione}</strong>
                        {material.quality !== "certo" ? (
                          <small>{material.flags.join(", ")}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>{material.quantita ?? "-"}</td>
                    <td>{material.unita ?? "-"}</td>
                    <td>
                      <span className={`acq-pill ${material.arrived ? "is-ok" : "is-danger"}`}>
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

const NextProcurementReadOnlyPanel: React.FC<NextProcurementReadOnlyPanelProps> = ({
  snapshot,
  activeTab,
  orderId,
  detailBackTab,
  onTabChange,
  onOpenOrder,
  onCloseOrder,
  iaPrefill = null,
}) => {
  const activeOrder = findNextProcurementOrder(snapshot, orderId);
  const requestedDetailMissing = Boolean(orderId) && !activeOrder;
  const visibleOrders = buildNextProcurementListView(
    snapshot,
    activeTab === "arrivi" ? "arrivi" : "ordini"
  ).filter((order) => {
    if (!iaPrefill?.fornitore && !iaPrefill?.materiale) {
      return true;
    }

    const supplierMatches = iaPrefill.fornitore
      ? normalizeText(order.supplierName).includes(normalizeText(iaPrefill.fornitore))
      : true;
    const materialMatches = iaPrefill.materiale
      ? order.materialPreview.some((entry) =>
          normalizeText(entry).includes(normalizeText(iaPrefill.materiale)),
        )
      : true;

    return supplierMatches && materialMatches;
  });
  const visiblePreventivi = snapshot.preventivi.filter((item) => {
    if (!iaPrefill?.fornitore && !iaPrefill?.materiale && !iaPrefill?.documentoNome) {
      return true;
    }

    const supplierMatches = iaPrefill?.fornitore
      ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
      : true;
    const materialMatches = iaPrefill?.materiale
      ? item.materialsPreview.some((entry) =>
          normalizeText(entry).includes(normalizeText(iaPrefill.materiale)),
        )
      : true;
    const documentMatches = iaPrefill?.documentoNome
      ? normalizeText(item.numeroPreventivo).includes(normalizeText(iaPrefill.documentoNome))
      : true;

    return supplierMatches && materialMatches && documentMatches;
  });
  const visibleListino = snapshot.listino.filter((item) => {
    if (!iaPrefill?.fornitore && !iaPrefill?.materiale) {
      return true;
    }

    const supplierMatches = iaPrefill?.fornitore
      ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
      : true;
    const materialMatches = iaPrefill?.materiale
      ? normalizeText(item.articoloCanonico).includes(normalizeText(iaPrefill.materiale))
      : true;

    return supplierMatches && materialMatches;
  });

  return (
    <div className={`acq-page${activeOrder ? " is-detail" : ""}`} style={EMBEDDED_PAGE_STYLE}>
      <div className="acq-shell">
        <header className="acq-header">
          <div className="acq-header-brand">
            <img src="/logo.png" alt="Logo" className="acq-header-logo" />
            <div className="acq-header-copy">
              <p className="acq-eyebrow">Gestione Acquisti</p>
              <h1 className="acq-title">Acquisti</h1>
              <p className="acq-subtitle">
                Modulo clone-safe: ordini, arrivi, preventivi e listino restano navigabili in sola lettura.
              </p>
            </div>
          </div>
          <div className="acq-header-actions" style={HEADER_ACTIONS_STYLE}>
            <span className="next-clone-readonly-badge">READ ONLY</span>
          </div>
        </header>

        {iaPrefill ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              marginBottom: 12,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#1d4ed8",
            }}
          >
            <strong>Richiesta IA agganciata al procurement</strong>
            <p style={{ margin: 0 }}>{iaPrefill.note}</p>
            <p style={{ margin: 0 }}>
              Stato consumo: {iaPrefill.statusLabel} | Handoff {iaPrefill.handoffId}
            </p>
            <p style={{ margin: 0 }}>
              Fornitore: {iaPrefill.fornitore ?? "n/d"} | Materiale: {iaPrefill.materiale ?? "n/d"} |
              Documento: {iaPrefill.documentoNome ?? "n/d"}
            </p>
            {iaPrefill.missingFields.length ? (
              <p style={{ margin: 0 }}>
                Campi mancanti: {iaPrefill.missingFields.join(", ")}
              </p>
            ) : null}
            {iaPrefill.verifyFields.length ? (
              <p style={{ margin: 0 }}>
                Da verificare: {iaPrefill.verifyFields.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="acq-tabs" role="tablist" aria-label="Schede acquisti clone">
          <button
            type="button"
            role="tab"
            aria-selected={!activeOrder && activeTab === "ordine-materiali"}
            className={`acq-tab ${!activeOrder && activeTab === "ordine-materiali" ? "is-active" : ""}`}
            onClick={() => onTabChange("ordine-materiali")}
          >
            <span>Ordine materiali</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!activeOrder && activeTab === "ordini"}
            className={`acq-tab ${!activeOrder && activeTab === "ordini" ? "is-active" : ""}`}
            onClick={() => onTabChange("ordini")}
          >
            <span>Ordini</span>
            <span className="acq-badge">{snapshot.counts.ordiniTabOrders}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!activeOrder && activeTab === "arrivi"}
            className={`acq-tab ${!activeOrder && activeTab === "arrivi" ? "is-active" : ""}`}
            onClick={() => onTabChange("arrivi")}
          >
            <span>Arrivi</span>
            <span className="acq-badge">{snapshot.counts.arriviTabOrders}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!activeOrder && activeTab === "preventivi"}
            className={`acq-tab ${!activeOrder && activeTab === "preventivi" ? "is-active" : ""}`}
            onClick={() => onTabChange("preventivi")}
          >
            <span>Prezzi & Preventivi</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!activeOrder && activeTab === "listino"}
            className={`acq-tab ${!activeOrder && activeTab === "listino" ? "is-active" : ""}`}
            onClick={() => onTabChange("listino")}
          >
            <span>Listino Prezzi</span>
          </button>
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
              detailDisabledReason: snapshot.navigability.dettaglioOrdine.reason,
            })
          ) : requestedDetailMissing ? (
            <div className="acq-tab-panel acq-tab-panel--detail">
              <div className="acq-detail-state">Ordine non trovato nel dataset read-only del clone.</div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="acq-btn" onClick={() => onCloseOrder(detailBackTab)}>
                  Indietro
                </button>
              </div>
            </div>
          ) : activeTab === "ordini" ? (
            renderListTable({
              title: "Ordini in attesa",
              subtitle:
                "Vista clone-safe sulla lista ordini della madre: nessuna modifica, delete o PDF operativo viene riattivato.",
              items: visibleOrders,
              fromTab: "ordini",
              onOpenOrder,
            })
          ) : activeTab === "arrivi" ? (
            renderListTable({
              title: "Ordini arrivati",
              subtitle:
                "Vista clone-safe degli arrivi: il dettaglio resta leggibile ma non modifica stato, stock o allegati.",
              items: visibleOrders,
              fromTab: "arrivi",
              onOpenOrder,
            })
          ) : activeTab === "preventivi" ? (
            renderPreventiviTable({
              items: visiblePreventivi,
              reason: snapshot.navigability.preventivi.reason,
            })
          ) : activeTab === "listino" ? (
            renderListinoTable({
              items: visibleListino,
              reason: snapshot.navigability.listino.reason,
            })
          ) : (
            renderBlockedTab({
              title: "Ordine materiali",
              subtitle:
                "La scheda madre e mantenuta nel clone, ma il flusso resta esplicitamente bloccato finche non esiste un reader read-only dedicato alla bozza ordine.",
              reason: snapshot.navigability.ordineMateriali.reason,
              onGoOrdini: () => onTabChange("ordini"),
              onGoArrivi: () => onTabChange("arrivi"),
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default NextProcurementReadOnlyPanel;
