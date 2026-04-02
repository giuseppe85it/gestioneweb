import { useMemo } from "react";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import type {
  NextProcurementListTab,
  NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";

type ProcurementHomeTab = "Ordini" | "Arrivi" | "Prezzi & Preventivi";
type PricingView = "preventivi" | "listino";

type HandoffPrefill = {
  handoffId: string;
  fornitore: string | null;
  materiale: string | null;
  documentoNome: string | null;
  note: string;
  statusLabel: string;
  missingFields: string[];
  verifyFields: string[];
} | null;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export default function NextProcurementConvergedSection({
  snapshot,
  activeTab,
  orderId,
  detailBackTab,
  pricingView,
  searchQuery,
  iaPrefill,
  procurementError,
  procurementLoading,
  onOpenOrder,
  onCloseOrder,
  onGoOrdini,
  onGoArrivi,
  onPricingViewChange,
}: {
  snapshot: NextProcurementSnapshot | null;
  activeTab: ProcurementHomeTab;
  orderId: string | null;
  detailBackTab: NextProcurementListTab;
  pricingView: PricingView;
  searchQuery: string;
  iaPrefill: HandoffPrefill;
  procurementError: string | null;
  procurementLoading: boolean;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
  onGoOrdini: () => void;
  onGoArrivi: () => void;
  onPricingViewChange: (view: PricingView) => void;
}) {
  const filteredPreventivi = useMemo(() => {
    if (!snapshot) return [];

    const normalizedSearch = normalizeText(searchQuery);

    return snapshot.preventivi.filter((item) => {
      const supplierMatches = iaPrefill?.fornitore
        ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
        : true;
      const materialMatches = iaPrefill?.materiale
        ? item.materialsPreview.some((entry) =>
            normalizeText(entry).includes(normalizeText(iaPrefill.materiale)),
          )
        : true;
      const searchMatches = normalizedSearch
        ? normalizeText(item.numeroPreventivo).includes(normalizedSearch) ||
          normalizeText(item.supplierName).includes(normalizedSearch) ||
          item.materialsPreview.some((entry) =>
            normalizeText(entry).includes(normalizedSearch),
          )
        : true;
      return supplierMatches && materialMatches && searchMatches;
    });
  }, [iaPrefill, searchQuery, snapshot]);

  const filteredListino = useMemo(() => {
    if (!snapshot) return [];

    const normalizedSearch = normalizeText(searchQuery);

    return snapshot.listino.filter((item) => {
      const supplierMatches = iaPrefill?.fornitore
        ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
        : true;
      const materialMatches = iaPrefill?.materiale
        ? normalizeText(item.articoloCanonico).includes(normalizeText(iaPrefill.materiale))
        : true;
      const searchMatches = normalizedSearch
        ? normalizeText(item.articoloCanonico).includes(normalizedSearch) ||
          normalizeText(item.supplierName).includes(normalizedSearch) ||
          normalizeText(item.codiceArticolo).includes(normalizedSearch) ||
          normalizeText(item.note).includes(normalizedSearch)
        : true;
      return supplierMatches && materialMatches && searchMatches;
    });
  }, [iaPrefill, searchQuery, snapshot]);

  if (procurementLoading) {
    return (
      <section className="mdo-panel mdo-table-panel">
        <div className="mdo-empty mdo-empty-state">
          Caricamento snapshot procurement del clone...
        </div>
      </section>
    );
  }

  if (procurementError || !snapshot) {
    return (
      <section className="mdo-panel mdo-table-panel">
        <div className="mdo-empty mdo-empty-state">
          {procurementError || "Snapshot procurement non disponibile."}
        </div>
      </section>
    );
  }

  if (activeTab === "Ordini" || activeTab === "Arrivi") {
    return (
      <section className="mdo-panel mdo-table-panel">
        <NextProcurementReadOnlyPanel
          snapshot={snapshot}
          activeTab={activeTab === "Arrivi" ? "arrivi" : "ordini"}
          orderId={orderId}
          detailBackTab={detailBackTab}
          searchQuery={searchQuery}
          iaPrefill={iaPrefill}
          embedded
          onTabChange={(tab) => {
            if (tab === "arrivi") {
              onGoArrivi();
              return;
            }
            onGoOrdini();
          }}
          onOpenOrder={onOpenOrder}
          onCloseOrder={onCloseOrder}
        />
      </section>
    );
  }

  return (
    <section className="mdo-panel mdo-table-panel">
      <div className="acq-tab-panel">
        <div className="acq-section-header">
          <h2>Prezzi &amp; Preventivi</h2>
          <p>
            Preview clone-safe di preventivi e listino prezzi consolidati nel procurement
            convergente.
          </p>
        </div>

        <div className="acq-detail-summary" style={{ marginBottom: 16 }}>
          <div className="acq-detail-summary-left">
            <span className="acq-pill">Preventivi: {snapshot.counts.preventiviTotali}</span>
            <span className="acq-pill">Con PDF: {snapshot.counts.preventiviConPdf}</span>
            <span className="acq-pill">Approvati: {snapshot.counts.preventiviApprovati}</span>
            <span className="acq-pill">Listino: {snapshot.counts.listinoVoci}</span>
          </div>
          <div className="acq-detail-head-actions">
            <button
              type="button"
              className={`acq-btn${pricingView === "preventivi" ? " acq-btn--primary" : ""}`}
              onClick={() => onPricingViewChange("preventivi")}
            >
              Preventivi
            </button>
            <button
              type="button"
              className={`acq-btn${pricingView === "listino" ? " acq-btn--primary" : ""}`}
              onClick={() => onPricingViewChange("listino")}
            >
              Listino prezzi
            </button>
          </div>
        </div>

        {pricingView === "preventivi" ? (
          filteredPreventivi.length === 0 ? (
            <div className="acq-list-empty">Nessun preventivo leggibile nel clone.</div>
          ) : (
            <div className="acq-orders-table-wrap">
              <table className="acq-orders-table">
                <thead>
                  <tr>
                    <th>Preventivo</th>
                    <th>Data</th>
                    <th>Fornitore</th>
                    <th>Righe</th>
                    <th>Totale</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreventivi.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="acq-orders-cell-main">
                          <strong>{item.numeroPreventivo}</strong>
                          <small>{item.materialsPreview.join(", ") || "Nessuna riga preview"}</small>
                        </div>
                      </td>
                      <td>{item.dataPreventivoLabel ?? "-"}</td>
                      <td>{item.supplierName}</td>
                      <td>{item.righeCount}</td>
                      <td>
                        {item.totalAmount !== null && item.currency
                          ? `${item.currency} ${item.totalAmount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td>
                        <span className="acq-pill">
                          {item.approvalStatus === "approved"
                            ? "Approvato"
                            : item.approvalStatus === "rejected"
                              ? "Rifiutato"
                              : "In attesa"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredListino.length === 0 ? (
          <div className="acq-list-empty">Nessuna voce di listino leggibile nel clone.</div>
        ) : (
          <div className="acq-orders-table-wrap">
            <table className="acq-orders-table">
              <thead>
                <tr>
                  <th>Articolo</th>
                  <th>Fornitore</th>
                  <th>Prezzo attuale</th>
                  <th>Valuta</th>
                  <th>Trend</th>
                  <th>Aggiornato</th>
                </tr>
              </thead>
              <tbody>
                {filteredListino.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="acq-orders-cell-main">
                        <strong>{item.articoloCanonico}</strong>
                        <small>{item.codiceArticolo ?? item.note ?? "Nessun codice"}</small>
                      </div>
                    </td>
                    <td>{item.supplierName}</td>
                    <td>
                      {item.prezzoAttuale !== null
                        ? item.prezzoAttuale.toFixed(2)
                        : "-"}
                    </td>
                    <td>{item.valuta ?? "-"}</td>
                    <td>
                      <span className="acq-pill">
                        {item.trend === "up"
                          ? "In aumento"
                          : item.trend === "down"
                            ? "In calo"
                            : item.trend === "new"
                              ? "Nuovo"
                              : "Stabile"}
                      </span>
                    </td>
                    <td>{item.updatedAtLabel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
