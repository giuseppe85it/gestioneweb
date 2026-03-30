import { useEffect, useMemo, useState } from "react";
import { generateSmartPDF } from "../utils/pdfEngine";
import {
  buildNextProcurementListView,
  findNextProcurementOrder,
  readNextProcurementSnapshot,
  type NextProcurementApprovalStatus,
  type NextProcurementCloneTab,
  type NextProcurementListTab,
  type NextProcurementListinoItem,
  type NextProcurementMaterialItem,
  type NextProcurementOrderItem,
  type NextProcurementPreventivoItem,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import {
  upsertNextProcurementCloneOrder,
  type NextProcurementCloneOrderRecord,
} from "./nextProcurementCloneState";
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

type OrderEditorState = {
  id: string;
  supplierName: string;
  orderDateLabel: string;
  orderNote: string;
};

type MaterialEditorState = {
  orderId: string;
  descrizione: string;
  quantita: string;
  unita: string;
  note: string;
  prezzoUnitario: string;
  valuta: string;
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

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function formatStrictState(order: NextProcurementOrderItem): { label: string; className: string } {
  if (order.state === "arrivato") return { label: "Arrivato", className: "is-ok" };
  if (order.state === "parziale") return { label: "Parziale", className: "is-warn" };
  return { label: "In attesa", className: "is-danger" };
}

function formatApprovalStatus(status: NextProcurementApprovalStatus) {
  if (status === "approved") return { label: "APPROVATO", className: "is-ok" };
  if (status === "rejected") return { label: "RIFIUTATO", className: "is-danger" };
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
  if (!target) return;
  window.open(target, "_blank", "noopener,noreferrer");
}

function formatTodayLabel() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  return `${dd} ${mm} ${yyyy}`;
}

function parseLegacyDateLabel(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const match = normalized.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
  if (!match) return null;
  const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function toCloneOrderRecord(order: NextProcurementOrderItem): NextProcurementCloneOrderRecord {
  return {
    id: order.id,
    idFornitore: order.supplierId ?? order.id,
    nomeFornitore: order.supplierName,
    dataOrdine: order.orderDateLabel ?? formatTodayLabel(),
    materiali: order.materials.map((material) => ({
      id: material.id,
      descrizione: material.descrizione,
      quantita: material.quantita ?? 0,
      unita: material.unita ?? "pz",
      arrivato: material.arrived,
      dataArrivo: material.arrivalDateLabel ?? undefined,
      note: material.note,
      fotoUrl: material.photoUrl,
      fotoStoragePath: material.photoStoragePath,
      prezzoUnitario: material.unitPrice,
      valuta: material.currency,
    })),
    arrivato: order.state === "arrivato",
    ordineNote: order.orderNote ?? undefined,
    __nextCloneOnly: true,
    __nextCloneSavedAt: Date.now(),
  };
}

async function exportOrderPdf(order: NextProcurementOrderItem, kind: "fornitori" | "anteprima" | "interno") {
  await generateSmartPDF({
    kind: "table",
    title:
      kind === "fornitori"
        ? `PDF Fornitori ${order.orderReference}`
        : kind === "interno"
        ? `PDF Interno ${order.orderReference}`
        : `Anteprima PDF ${order.orderReference}`,
    columns: ["descrizione", "quantita", "unita", "arrivato", "note", "totale"],
    rows: order.materials.map((material) => ({
      descrizione: material.descrizione,
      quantita: material.quantita ?? "-",
      unita: material.unita ?? "-",
      arrivato: material.arrived ? "SI" : "NO",
      note: material.note ?? "-",
      totale:
        material.lineTotal !== null && material.currency
          ? `${material.currency} ${material.lineTotal.toFixed(2)}`
          : "-",
    })),
  });
}

function ProcurementOrderDetail(props: {
  order: NextProcurementOrderItem;
  backTab: NextProcurementListTab;
  busy: boolean;
  notice: string | null;
  orderEditor: OrderEditorState | null;
  materialEditor: MaterialEditorState | null;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
  onToggleArrival: () => void;
  onOpenOrderEditor: () => void;
  onOpenMaterialEditor: () => void;
  onOrderEditorChange: (patch: Partial<OrderEditorState>) => void;
  onSaveOrderEditor: () => void;
  onCloseOrderEditor: () => void;
  onMaterialEditorChange: (patch: Partial<MaterialEditorState>) => void;
  onSaveMaterialEditor: () => void;
  onCloseMaterialEditor: () => void;
  onExportPdf: (kind: "fornitori" | "anteprima" | "interno") => void;
}) {
  const {
    order,
    backTab,
    busy,
    notice,
    orderEditor,
    materialEditor,
    onCloseOrder,
    onToggleArrival,
    onOpenOrderEditor,
    onOpenMaterialEditor,
    onOrderEditorChange,
    onSaveOrderEditor,
    onCloseOrderEditor,
    onMaterialEditorChange,
    onSaveMaterialEditor,
    onCloseMaterialEditor,
    onExportPdf,
  } = props;
  const state = formatStrictState(order);

  return (
    <div className="acq-tab-panel acq-tab-panel--detail">
      {notice ? <div className="acq-placeholder" style={{ marginBottom: 12 }}>{notice}</div> : null}
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
            <button type="button" className="acq-btn" onClick={onToggleArrival} disabled={busy}>
              {order.state === "arrivato" ? "Segna NON Arrivato" : "Segna Arrivato"}
            </button>
            <button type="button" className="acq-btn acq-btn--primary" onClick={onOpenOrderEditor} disabled={busy}>
              Modifica
            </button>
          </div>
        </div>

        <div className="acq-detail-summary">
          <div className="acq-detail-summary-left">
            <span className={`acq-pill ${state.className}`}>{state.label}</span>
            <span className="acq-pill">Materiali: {order.totalRows}</span>
            <span className="acq-pill">Arrivati: {order.arrivedRows}</span>
            {order.latestArrivalLabel ? <span className="acq-pill">Ultimo arrivo: {order.latestArrivalLabel}</span> : null}
          </div>
          <div className="acq-detail-totals">
            <div className="acq-detail-pdf-actions">
              <button type="button" className="acq-btn" onClick={() => onExportPdf("fornitori")} disabled={busy}>
                PDF Fornitori
              </button>
              <button type="button" className="acq-btn" onClick={() => onExportPdf("anteprima")} disabled={busy}>
                ANTEPRIMA PDF
              </button>
              <button type="button" className="acq-btn acq-btn--primary" onClick={() => onExportPdf("interno")} disabled={busy}>
                PDF Interno
              </button>
            </div>
            <strong>Totale righe: {order.totalRows}</strong>
          </div>
        </div>

        <button type="button" className="acq-btn" onClick={onOpenMaterialEditor} disabled={busy}>
          + Aggiungi materiale
        </button>

        <label className="acq-order-note acq-order-note--detail">
          <span>Note ordine</span>
          <textarea readOnly value={order.orderNote ?? ""} placeholder="Nessuna nota ordine disponibile" />
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
              </tr>
            </thead>
            <tbody>
              {order.materials.length > 0 ? (
                order.materials.map((material) => (
                  <tr key={material.id}>
                    <td><div className="acq-detail-photo-cell">{material.photoUrl ? <img src={material.photoUrl} alt={material.descrizione} /> : <span>-</span>}</div></td>
                    <td><div className="acq-detail-desc-cell"><strong title={material.id}>{material.descrizione}</strong>{material.quality !== "certo" ? <small>{material.flags.join(", ")}</small> : null}</div></td>
                    <td>{material.quantita ?? "-"}</td>
                    <td>{material.unita ?? "-"}</td>
                    <td><span className={`acq-pill ${material.arrived ? "is-ok" : "is-danger"}`}>{material.arrived ? "Si" : "No"}</span></td>
                    <td>{material.arrivalDateLabel ?? "-"}</td>
                    <td>{material.note ?? "-"}</td>
                    <td>{material.lineTotal !== null && material.currency ? `${material.currency} ${material.lineTotal.toFixed(2)}` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="acq-detail-state">Nessun materiale leggibile su questo ordine.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {orderEditor ? (
        <div className="mdo-modal-backdrop" role="presentation" onClick={onCloseOrderEditor}>
          <div className="mdo-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Modifica ordine clone</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <input type="text" value={orderEditor.supplierName} placeholder="Fornitore" onChange={(event) => onOrderEditorChange({ supplierName: event.target.value })} />
              <input type="text" value={orderEditor.orderDateLabel} placeholder="Data ordine (gg mm aaaa)" onChange={(event) => onOrderEditorChange({ orderDateLabel: event.target.value })} />
              <textarea rows={4} value={orderEditor.orderNote} placeholder="Note ordine" onChange={(event) => onOrderEditorChange({ orderNote: event.target.value })} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="mdo-header-button" onClick={onSaveOrderEditor}>Salva nel clone</button>
                <button type="button" className="mdo-secondary-button" onClick={onCloseOrderEditor}>Chiudi</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {materialEditor ? (
        <div className="mdo-modal-backdrop" role="presentation" onClick={onCloseMaterialEditor}>
          <div className="mdo-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Nuovo materiale clone</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <input type="text" value={materialEditor.descrizione} placeholder="Descrizione" onChange={(event) => onMaterialEditorChange({ descrizione: event.target.value })} />
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <input type="number" value={materialEditor.quantita} placeholder="Quantita" onChange={(event) => onMaterialEditorChange({ quantita: event.target.value })} />
                <input type="text" value={materialEditor.unita} placeholder="Unita" onChange={(event) => onMaterialEditorChange({ unita: event.target.value })} />
                <input type="number" value={materialEditor.prezzoUnitario} placeholder="Prezzo unitario" onChange={(event) => onMaterialEditorChange({ prezzoUnitario: event.target.value })} />
                <input type="text" value={materialEditor.valuta} placeholder="Valuta" onChange={(event) => onMaterialEditorChange({ valuta: event.target.value.toUpperCase() })} />
              </div>
              <textarea rows={3} value={materialEditor.note} placeholder="Note riga" onChange={(event) => onMaterialEditorChange({ note: event.target.value })} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="mdo-header-button" onClick={onSaveMaterialEditor}>Aggiungi nel clone</button>
                <button type="button" className="mdo-secondary-button" onClick={onCloseMaterialEditor}>Chiudi</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderPreventiviTable(items: NextProcurementPreventivoItem[]) {
  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>Prezzi & Preventivi</h2>
        <p>Elenco clone-safe dei preventivi leggibili e dei documenti locali gia agganciati.</p>
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
                    <td>{item.supplierName}</td>
                    <td>{item.numeroPreventivo}</td>
                    <td>{item.dataPreventivoLabel ?? "-"}</td>
                    <td>{item.totalAmount !== null && item.currency ? `${item.currency} ${item.totalAmount.toFixed(2)}` : "-"}</td>
                    <td><span className={`acq-pill ${approval.className}`}>{approval.label}</span></td>
                    <td>
                      <button type="button" className="acq-btn acq-btn--primary" onClick={() => openDocumentAsset(item.pdfUrl, item.imageUrls)}>
                        APRI DOCUMENTO
                      </button>
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

function renderListinoTable(items: NextProcurementListinoItem[]) {
  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>Listino prezzi</h2>
        <p>Contesto prezzi clone-safe con apertura documento sorgente.</p>
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
                <th>Prezzo</th>
                <th>Trend</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const trend = formatTrendLabel(item.trend);
                return (
                  <tr key={item.id}>
                    <td>{item.supplierName}</td>
                    <td>{item.articoloCanonico}</td>
                    <td>{item.prezzoAttuale !== null ? item.prezzoAttuale.toFixed(2) : "-"}</td>
                    <td><span className={`acq-pill ${trend.className}`}>{trend.label}</span></td>
                    <td>
                      <button type="button" className="acq-btn acq-btn--primary" onClick={() => openDocumentAsset(item.pdfUrl, item.imageUrls)}>
                        APRI DOCUMENTO
                      </button>
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

function renderListTable(_props: {
  title: string;
  subtitle: string;
  items: NextProcurementOrderItem[];
  fromTab: NextProcurementListTab;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
}) {
  const { title, subtitle, items, fromTab, onOpenOrder } = _props;
  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className="acq-list-empty">{fromTab === "ordini" ? "Nessun ordine in attesa." : "Nessun ordine arrivato."}</div>
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
                    <td><strong>{order.orderReference}</strong></td>
                    <td>{order.orderDateLabel ?? "-"}</td>
                    <td>{order.supplierName}</td>
                    <td><span className={`acq-pill ${state.className}`}>{state.label}</span></td>
                    <td>{order.materialPreview.join(", ") || "-"}</td>
                    <td>
                      <button type="button" className="acq-btn acq-btn--primary" onClick={() => onOpenOrder(order.id, fromTab)}>
                        Apri
                      </button>
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
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(snapshot);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderEditor, setOrderEditor] = useState<OrderEditorState | null>(null);
  const [materialEditor, setMaterialEditor] = useState<MaterialEditorState | null>(null);

  useEffect(() => {
    setRuntimeSnapshot(snapshot);
  }, [snapshot]);

  const activeOrder = findNextProcurementOrder(runtimeSnapshot, orderId);
  const requestedDetailMissing = Boolean(orderId) && !activeOrder;

  const visibleOrders = useMemo(
    () =>
      buildNextProcurementListView(runtimeSnapshot, activeTab === "arrivi" ? "arrivi" : "ordini").filter((order) => {
        if (!iaPrefill?.fornitore && !iaPrefill?.materiale) return true;
        const supplierMatches = iaPrefill.fornitore
          ? normalizeText(order.supplierName).includes(normalizeText(iaPrefill.fornitore))
          : true;
        const materialMatches = iaPrefill.materiale
          ? order.materialPreview.some((entry) => normalizeText(entry).includes(normalizeText(iaPrefill.materiale)))
          : true;
        return supplierMatches && materialMatches;
      }),
    [activeTab, iaPrefill, runtimeSnapshot],
  );

  const visiblePreventivi = useMemo(
    () =>
      runtimeSnapshot.preventivi.filter((item) => {
        if (!iaPrefill?.fornitore && !iaPrefill?.materiale && !iaPrefill?.documentoNome) return true;
        const supplierMatches = iaPrefill?.fornitore
          ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
          : true;
        const materialMatches = iaPrefill?.materiale
          ? item.materialsPreview.some((entry) => normalizeText(entry).includes(normalizeText(iaPrefill.materiale)))
          : true;
        const documentMatches = iaPrefill?.documentoNome
          ? normalizeText(item.numeroPreventivo).includes(normalizeText(iaPrefill.documentoNome))
          : true;
        return supplierMatches && materialMatches && documentMatches;
      }),
    [iaPrefill, runtimeSnapshot.preventivi],
  );

  const visibleListino = useMemo(
    () =>
      runtimeSnapshot.listino.filter((item) => {
        if (!iaPrefill?.fornitore && !iaPrefill?.materiale) return true;
        const supplierMatches = iaPrefill?.fornitore
          ? normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))
          : true;
        const materialMatches = iaPrefill?.materiale
          ? normalizeText(item.articoloCanonico).includes(normalizeText(iaPrefill.materiale))
          : true;
        return supplierMatches && materialMatches;
      }),
    [iaPrefill, runtimeSnapshot.listino],
  );

  const persistOrder = async (order: NextProcurementOrderItem, successNotice: string) => {
    setBusy(true);
    try {
      upsertNextProcurementCloneOrder(toCloneOrderRecord(order));
      const nextSnapshot = await readNextProcurementSnapshot();
      setRuntimeSnapshot(nextSnapshot);
      setNotice(successNotice);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleArrival = async () => {
    if (!activeOrder) return;
    const nextArrived = activeOrder.state !== "arrivato";
    const today = formatTodayLabel();
    const nextOrder: NextProcurementOrderItem = {
      ...activeOrder,
      materials: activeOrder.materials.map((material) => ({
        ...material,
        arrived: nextArrived,
        arrivalDateLabel: nextArrived ? material.arrivalDateLabel ?? today : null,
        arrivalTimestamp: nextArrived ? material.arrivalTimestamp ?? Date.now() : null,
      })),
      latestArrivalLabel: nextArrived ? today : null,
      pendingRows: nextArrived ? 0 : activeOrder.materials.length,
      arrivedRows: nextArrived ? activeOrder.materials.length : 0,
      state: nextArrived ? "arrivato" : "in_attesa",
    };
    await persistOrder(
      nextOrder,
      nextArrived
        ? `Ordine ${activeOrder.orderReference} segnato come arrivato nel clone.`
        : `Ordine ${activeOrder.orderReference} riportato in attesa nel clone.`,
    );
  };

  const handleSaveOrderEditor = async () => {
    if (!activeOrder || !orderEditor) return;
    const nextOrder: NextProcurementOrderItem = {
      ...activeOrder,
      supplierName: orderEditor.supplierName.trim() || activeOrder.supplierName,
      orderDateLabel: orderEditor.orderDateLabel.trim() || activeOrder.orderDateLabel,
      orderTimestamp: parseLegacyDateLabel(orderEditor.orderDateLabel) ?? activeOrder.orderTimestamp,
      orderNote: orderEditor.orderNote.trim() || null,
    };
    setOrderEditor(null);
    await persistOrder(nextOrder, `Ordine ${activeOrder.orderReference} aggiornato nel clone.`);
  };

  const handleSaveMaterialEditor = async () => {
    if (!activeOrder || !materialEditor) return;
    const quantity = Number(materialEditor.quantita);
    const unitPrice = materialEditor.prezzoUnitario.trim() ? Number(materialEditor.prezzoUnitario) : null;
    const nextMaterial: NextProcurementMaterialItem = {
      id: `next-clone-material:${Date.now()}`,
      descrizione: materialEditor.descrizione.trim(),
      quantita: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unita: materialEditor.unita.trim() || "pz",
      arrived: false,
      arrivalDateLabel: null,
      arrivalTimestamp: null,
      note: materialEditor.note.trim() || null,
      photoUrl: null,
      photoStoragePath: null,
      unitPrice: unitPrice !== null && Number.isFinite(unitPrice) ? unitPrice : null,
      currency: materialEditor.valuta.trim() || null,
      unitPriceUnit: materialEditor.unita.trim() || "pz",
      lineTotal:
        unitPrice !== null && Number.isFinite(unitPrice)
          ? (Number.isFinite(quantity) && quantity > 0 ? quantity : 1) * unitPrice
          : null,
      sourceCollection: "storage",
      sourceKey: "@ordini",
      quality: "certo",
      flags: ["clone_materiale_locale"],
    };
    const nextOrder: NextProcurementOrderItem = {
      ...activeOrder,
      materials: [...activeOrder.materials, nextMaterial],
      totalRows: activeOrder.totalRows + 1,
      pendingRows: activeOrder.pendingRows + 1,
      materialPreview: [...activeOrder.materialPreview, nextMaterial.descrizione].slice(0, 3),
    };
    setMaterialEditor(null);
    await persistOrder(nextOrder, `Nuovo materiale aggiunto all'ordine ${activeOrder.orderReference} nel clone.`);
  };

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
                Modulo NEXT clone-safe: ordini, arrivi, dettaglio, PDF e materiali aggiunti qui restano locali al clone.
              </p>
            </div>
          </div>
          <div className="acq-header-actions" style={HEADER_ACTIONS_STYLE}>
            <span className="next-clone-readonly-badge">CLONE-ONLY</span>
          </div>
        </header>

        <div className="acq-tabs" role="tablist" aria-label="Schede acquisti clone">
          <button type="button" role="tab" aria-selected={!activeOrder && activeTab === "ordine-materiali"} className={`acq-tab ${!activeOrder && activeTab === "ordine-materiali" ? "is-active" : ""}`} onClick={() => onTabChange("ordine-materiali")}>
            <span>Ordine materiali</span>
          </button>
          <button type="button" role="tab" aria-selected={!activeOrder && activeTab === "ordini"} className={`acq-tab ${!activeOrder && activeTab === "ordini" ? "is-active" : ""}`} onClick={() => onTabChange("ordini")}>
            <span>Ordini</span>
            <span className="acq-badge">{runtimeSnapshot.counts.ordiniTabOrders}</span>
          </button>
          <button type="button" role="tab" aria-selected={!activeOrder && activeTab === "arrivi"} className={`acq-tab ${!activeOrder && activeTab === "arrivi" ? "is-active" : ""}`} onClick={() => onTabChange("arrivi")}>
            <span>Arrivi</span>
            <span className="acq-badge">{runtimeSnapshot.counts.arriviTabOrders}</span>
          </button>
          <button type="button" role="tab" aria-selected={!activeOrder && activeTab === "preventivi"} className={`acq-tab ${!activeOrder && activeTab === "preventivi" ? "is-active" : ""}`} onClick={() => onTabChange("preventivi")}>
            <span>Prezzi & Preventivi</span>
          </button>
          <button type="button" role="tab" aria-selected={!activeOrder && activeTab === "listino"} className={`acq-tab ${!activeOrder && activeTab === "listino" ? "is-active" : ""}`} onClick={() => onTabChange("listino")}>
            <span>Listino Prezzi</span>
          </button>
          {activeOrder ? <div className="acq-tab acq-tab--detail-live"><span>Dettaglio ordine</span></div> : null}
        </div>

        <section className="acq-content">
          {activeOrder ? (
            <ProcurementOrderDetail
              order={activeOrder}
              backTab={detailBackTab}
              busy={busy}
              notice={notice}
              orderEditor={orderEditor}
              materialEditor={materialEditor}
              onCloseOrder={onCloseOrder}
              onToggleArrival={() => void handleToggleArrival()}
              onOpenOrderEditor={() => setOrderEditor({ id: activeOrder.id, supplierName: activeOrder.supplierName, orderDateLabel: activeOrder.orderDateLabel ?? "", orderNote: activeOrder.orderNote ?? "" })}
              onOpenMaterialEditor={() => setMaterialEditor({ orderId: activeOrder.id, descrizione: "", quantita: "1", unita: "pz", note: "", prezzoUnitario: "", valuta: "EUR" })}
              onOrderEditorChange={(patch) => setOrderEditor((current) => (current ? { ...current, ...patch } : current))}
              onSaveOrderEditor={() => void handleSaveOrderEditor()}
              onCloseOrderEditor={() => setOrderEditor(null)}
              onMaterialEditorChange={(patch) => setMaterialEditor((current) => (current ? { ...current, ...patch } : current))}
              onSaveMaterialEditor={() => void handleSaveMaterialEditor()}
              onCloseMaterialEditor={() => setMaterialEditor(null)}
              onExportPdf={(kind) => void exportOrderPdf(activeOrder, kind).then(() => setNotice(`PDF clone generato per ${activeOrder.orderReference}.`))}
            />
          ) : requestedDetailMissing ? (
            <div className="acq-tab-panel acq-tab-panel--detail">
              <div className="acq-detail-state">Ordine non trovato nel dataset clone-safe.</div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="acq-btn" onClick={() => onCloseOrder(detailBackTab)}>Indietro</button>
              </div>
            </div>
          ) : activeTab === "ordini" ? (
            renderListTable({ title: "Ordini in attesa", subtitle: "Lista clone-safe degli ordini con apertura del dettaglio nativo NEXT.", items: visibleOrders, fromTab: "ordini", onOpenOrder })
          ) : activeTab === "arrivi" ? (
            renderListTable({ title: "Ordini arrivati", subtitle: "Lista clone-safe degli ordini arrivati o parziali con dettaglio aggiornabile solo nel clone.", items: visibleOrders, fromTab: "arrivi", onOpenOrder })
          ) : activeTab === "preventivi" ? (
            renderPreventiviTable(visiblePreventivi)
          ) : activeTab === "listino" ? (
            renderListinoTable(visibleListino)
          ) : (
            <div className="acq-tab-panel">
              <div className="acq-placeholder" style={{ display: "grid", gap: 12 }}>
                <div className="acq-section-header">
                  <h2>Ordine materiali</h2>
                  <p>Il workbench NEXT clone-only gestisce nuovi ordini, allegati locali e PDF senza toccare la madre.</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="acq-btn acq-btn--primary" onClick={() => onTabChange("ordini")}>Vai a ordini</button>
                  <button type="button" className="acq-btn" onClick={() => onTabChange("arrivi")}>Vai a arrivi</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
