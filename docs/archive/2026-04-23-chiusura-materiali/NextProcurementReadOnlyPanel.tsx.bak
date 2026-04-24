import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { generateSmartPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText as buildPdfShareMessage,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import {
  buildNextProcurementListView,
  findNextProcurementOrder,
  type NextProcurementCloneTab,
  type NextProcurementListTab,
  type NextProcurementListinoItem,
  type NextProcurementOrderItem,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import { buildNextMagazzinoPath } from "./nextStructuralPaths";
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
  searchQuery?: string;
  embedded?: boolean;
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

const LABELS_IT = {
  menu: {
    trigger: "AZIONI",
    open: "Apri",
    edit: "Modifica",
    delete: "Elimina",
  },
} as const;

type FloatingMenuPosition = {
  top: number;
  left: number;
  openUp: boolean;
};

type DetailWorkingMaterial = NextProcurementOrderItem["materials"][number] & {
  sourceUnitPrice: number | null;
  sourceCurrency: string | null;
  sourceUnitPriceUnit: string | null;
  sourcePreventivoNumero: string | null;
  sourcePreventivoData: string | null;
};

type DetailWorkingOrder = Omit<NextProcurementOrderItem, "materials"> & {
  materials: DetailWorkingMaterial[];
};

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCanonicalText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeUnit(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function formatTodayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day} ${month} ${year}`;
}

function parseConversionFactor(note: string | null | undefined): number | null {
  const raw = String(note ?? "");
  if (!raw.trim()) return null;
  const match = raw.match(/(?:^|[\s|;,])conv\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (!match) return null;
  const parsed = Number(String(match[1]).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function computeLineTotal(params: {
  qty: number | null;
  unitPrice: number | null;
  selectedUom: string | null | undefined;
  priceUom: string | null | undefined;
  note?: string | null;
}) {
  const qty = Number(params.qty);
  const unitPrice = Number(params.unitPrice);

  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { total: null as number | null, status: "missing_price" as const };
  }

  const selected = normalizeUnit(params.selectedUom);
  const source = normalizeUnit(params.priceUom || params.selectedUom);
  if (!selected || !source || selected === source) {
    return { total: qty * unitPrice, status: "ok" as const };
  }

  const factor = parseConversionFactor(params.note);
  if (!factor) {
    return { total: null as number | null, status: "needs_factor" as const };
  }

  return { total: qty * factor * unitPrice, status: "ok" as const };
}

function findListinoMatch(
  snapshot: NextProcurementSnapshot,
  order: NextProcurementOrderItem,
  descrizione: string,
): NextProcurementListinoItem | null {
  const target = normalizeCanonicalText(descrizione);
  if (!target) return null;

  const supplierId = String(order.supplierId ?? "").trim();
  const supplierName = normalizeText(order.supplierName);

  const matches = snapshot.listino
    .filter((entry) => {
      const supplierMatches = supplierId
        ? entry.supplierId === supplierId
        : normalizeText(entry.supplierName) === supplierName;
      return (
        supplierMatches &&
        normalizeCanonicalText(entry.articoloCanonico) === target
      );
    })
    .sort((left, right) => (right.updatedAtTimestamp ?? 0) - (left.updatedAtTimestamp ?? 0));

  return matches[0] ?? null;
}

function decorateWorkingMaterial(
  snapshot: NextProcurementSnapshot,
  order: NextProcurementOrderItem,
  material: NextProcurementOrderItem["materials"][number],
): DetailWorkingMaterial {
  const match = findListinoMatch(snapshot, order, material.descrizione);
  return {
    ...material,
    sourceUnitPrice: material.unitPrice ?? match?.prezzoAttuale ?? null,
    sourceCurrency: material.currency ?? match?.valuta ?? null,
    sourceUnitPriceUnit: material.unitPriceUnit ?? match?.unita ?? null,
    sourcePreventivoNumero: match?.fonteNumeroPreventivo ?? null,
    sourcePreventivoData: match?.fonteDataPreventivo ?? null,
  };
}

function buildWorkingOrder(
  snapshot: NextProcurementSnapshot,
  order: NextProcurementOrderItem,
): DetailWorkingOrder {
  return {
    ...order,
    materials: order.materials.map((material) =>
      decorateWorkingMaterial(snapshot, order, material),
    ),
  };
}

function formatListState(fromTab: NextProcurementListTab) {
  return fromTab === "ordini"
    ? { label: "In attesa", className: "is-warn" }
    : { label: "Arrivato", className: "is-ok" };
}

function OrderListTable(props: {
  title: string;
  subtitle?: string;
  items: NextProcurementOrderItem[];
  fromTab: NextProcurementListTab;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
}) {
  const { title, subtitle, items, fromTab, onOpenOrder } = props;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuPosition, setOpenMenuPosition] =
    useState<FloatingMenuPosition | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => {
      setOpenMenuId(null);
      setOpenMenuPosition(null);
    };
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-menu-root="ordini"]')) return;
      closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openMenuId]);

  const handleDeleteOrder = (order: NextProcurementOrderItem) => {
    if (order.arrivedRows > 0) {
      window.alert("Eliminazione bloccata: l'ordine contiene materiali arrivati.");
      return;
    }
    window.alert("Clone read-only: eliminazione ordine non disponibile.");
  };

  return (
    <div className="acq-tab-panel">
      <div className="acq-section-header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
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
                const state = formatListState(fromTab);
                const canDelete = order.arrivedRows === 0;
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
                    </td>
                    <td>
                      <div className="acq-orders-actions-inline">
                        <button
                          type="button"
                          className="acq-btn acq-btn--primary"
                          onClick={() => onOpenOrder(order.id, fromTab)}
                        >
                          {LABELS_IT.menu.open}
                        </button>
                        <div className="acq-kebab" data-menu-root="ordini">
                          <button
                            type="button"
                            className="acq-btn acq-kebab-trigger"
                            aria-label="Altre azioni"
                            onClick={(event) => {
                              if (openMenuId === order.id) {
                                setOpenMenuId(null);
                                setOpenMenuPosition(null);
                                return;
                              }
                              const rect = (
                                event.currentTarget as HTMLButtonElement
                              ).getBoundingClientRect();
                              const menuWidth = 190;
                              const menuHeight = 120;
                              const left = Math.min(
                                window.innerWidth - menuWidth - 8,
                                Math.max(8, rect.right - menuWidth),
                              );
                              const openUp =
                                rect.bottom + menuHeight > window.innerHeight - 8;
                              const top = openUp
                                ? Math.max(8, rect.top - 8)
                                : rect.bottom + 8;
                              setOpenMenuId(order.id);
                              setOpenMenuPosition({ top, left, openUp });
                            }}
                          >
                            {LABELS_IT.menu.trigger}
                          </button>
                          {openMenuId === order.id && openMenuPosition ? (
                            <div
                              className={`acq-kebab-menu acq-kebab-menu--fixed${
                                openMenuPosition.openUp ? " is-up" : ""
                              }`}
                              style={{
                                top: `${openMenuPosition.top}px`,
                                left: `${openMenuPosition.left}px`,
                              }}
                            >
                              <button
                                type="button"
                                className="acq-kebab-item"
                                onClick={() => {
                                  onOpenOrder(order.id, fromTab);
                                  setOpenMenuId(null);
                                  setOpenMenuPosition(null);
                                }}
                              >
                                {LABELS_IT.menu.edit}
                              </button>
                              <button
                                type="button"
                                className="acq-kebab-item acq-kebab-item--danger"
                                onClick={() => {
                                  handleDeleteOrder(order);
                                  setOpenMenuId(null);
                                  setOpenMenuPosition(null);
                                }}
                                disabled={!canDelete}
                                title={
                                  !canDelete
                                    ? "Non eliminabile: presenti materiali arrivati"
                                    : "Elimina ordine"
                                }
                              >
                                {LABELS_IT.menu.delete}
                              </button>
                            </div>
                          ) : null}
                        </div>
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

function OrderDetailPanel(props: {
  snapshot: NextProcurementSnapshot;
  order: NextProcurementOrderItem;
  backTab: NextProcurementListTab;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
}) {
  const { snapshot, order, backTab, onCloseOrder } = props;
  const [workingOrder, setWorkingOrder] = useState<DetailWorkingOrder>(() =>
    buildWorkingOrder(snapshot, order),
  );
  const [editing, setEditing] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("pz");
  const [newNote, setNewNote] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [detailSuggestOpen, setDetailSuggestOpen] = useState(false);
  const [selectedDetailListino, setSelectedDetailListino] =
    useState<NextProcurementListinoItem | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF interno");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("ordine.pdf");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  const sortedMaterials = useMemo(
    () =>
      [...workingOrder.materials].sort((left, right) =>
        left.arrived === right.arrived ? 0 : left.arrived ? 1 : -1,
      ),
    [workingOrder.materials],
  );

  const detailSuggestList = useMemo(() => {
    const query = normalizeText(newDesc);
    if (!query) return [];

    return snapshot.listino
      .filter((entry) => {
        const supplierMatches = workingOrder.supplierId
          ? entry.supplierId === workingOrder.supplierId
          : normalizeText(entry.supplierName) === normalizeText(workingOrder.supplierName);
        return (
          supplierMatches &&
          (normalizeText(entry.articoloCanonico).includes(query) ||
            normalizeText(entry.codiceArticolo).includes(query))
        );
      })
      .sort((left, right) => (right.updatedAtTimestamp ?? 0) - (left.updatedAtTimestamp ?? 0))
      .slice(0, 8);
  }, [newDesc, snapshot.listino, workingOrder.supplierId, workingOrder.supplierName]);

  const totals = useMemo(() => {
    const totalsByCurrency = { CHF: 0, EUR: 0 };
    let missing = 0;
    let udm = 0;

    workingOrder.materials.forEach((material) => {
      const line = computeLineTotal({
        qty: material.quantita,
        unitPrice: material.sourceUnitPrice,
        selectedUom: material.unita,
        priceUom: material.sourceUnitPriceUnit || material.unita,
        note: material.note,
      });

      if (line.status === "needs_factor") {
        udm += 1;
        return;
      }
      if (line.total === null || !material.sourceCurrency) {
        missing += 1;
        return;
      }
      if (material.sourceCurrency === "CHF" || material.sourceCurrency === "EUR") {
        totalsByCurrency[material.sourceCurrency] += line.total;
      } else {
        missing += 1;
      }
    });

    const used = (["CHF", "EUR"] as const).filter((currency) => totalsByCurrency[currency] > 0);
    return { totalsByCurrency, used, mixed: used.length > 1, missing, udm };
  }, [workingOrder.materials]);

  const localState = useMemo(() => {
    const totalRows = workingOrder.materials.length;
    const arrivedRows = workingOrder.materials.filter((material) => material.arrived).length;
    if (arrivedRows === 0) return { label: "IN ATTESA", className: "is-danger" };
    if (arrivedRows < totalRows) return { label: "PARZIALE", className: "is-warn" };
    return { label: "ARRIVATO", className: "is-ok" };
  }, [workingOrder.materials]);

  const setMaterial = (
    materialId: string,
    updater: (material: DetailWorkingMaterial) => DetailWorkingMaterial,
  ) => {
    setWorkingOrder((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === materialId ? updater(material) : material,
      ),
    }));
  };

  const toggleOrderArrived = () => {
    const nextArrived = workingOrder.materials.some((material) => !material.arrived);
    setWorkingOrder((current) => ({
      ...current,
      materials: current.materials.map((material) => ({
        ...material,
        arrived: nextArrived,
        arrivalDateLabel: nextArrived ? material.arrivalDateLabel || formatTodayLabel() : null,
      })),
    }));
  };

  const saveDetail = () => {
    setEditing(false);
    setAddingMaterial(false);
  };

  const onDetailDescChange = (value: string) => {
    setNewDesc(value);
    setDetailSuggestOpen(true);
    if (
      selectedDetailListino &&
      normalizeCanonicalText(value) !==
        normalizeCanonicalText(selectedDetailListino.articoloCanonico)
    ) {
      setSelectedDetailListino(null);
    }
  };

  const selectDetailSuggestion = (entry: NextProcurementListinoItem) => {
    setNewDesc(entry.articoloCanonico);
    setNewUnit(String(entry.unita || "pz").toLowerCase());
    setSelectedDetailListino(entry);
    setDetailSuggestOpen(false);
  };

  const deleteMaterial = (materialId: string) => {
    setWorkingOrder((current) => ({
      ...current,
      materials: current.materials.filter((material) => material.id !== materialId),
    }));
  };

  const uploadPhoto = (materialId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setMaterial(materialId, (material) => ({
      ...material,
      photoUrl: preview,
      photoStoragePath: null,
    }));
    event.currentTarget.value = "";
  };

  const removePhoto = (materialId: string) => {
    setMaterial(materialId, (material) => ({
      ...material,
      photoUrl: null,
      photoStoragePath: null,
    }));
  };

  const saveNewMaterial = () => {
    if (!newDesc.trim() || !newQty.trim()) return;
    const quantity = Number.parseInt(newQty, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      window.alert("Inserisci una quantita valida.");
      return;
    }

    const nextMaterial: DetailWorkingMaterial = {
      id: `detail-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      descrizione: newDesc.trim().toUpperCase(),
      quantita: quantity,
      unita: newUnit,
      arrived: false,
      arrivalDateLabel: null,
      arrivalTimestamp: null,
      note: newNote.trim() || null,
      photoUrl: newPhotoFile ? URL.createObjectURL(newPhotoFile) : null,
      photoStoragePath: null,
      unitPrice: selectedDetailListino?.prezzoAttuale ?? null,
      currency: selectedDetailListino?.valuta ?? null,
      unitPriceUnit: selectedDetailListino?.unita ?? null,
      lineTotal: null,
      sourceCollection: order.sourceCollection,
      sourceKey: order.sourceKey,
      quality: "parziale",
      flags: ["clone_readonly_local"],
      sourceUnitPrice: selectedDetailListino?.prezzoAttuale ?? null,
      sourceCurrency: selectedDetailListino?.valuta ?? null,
      sourceUnitPriceUnit: selectedDetailListino?.unita ?? null,
      sourcePreventivoNumero: selectedDetailListino?.fonteNumeroPreventivo ?? null,
      sourcePreventivoData: selectedDetailListino?.fonteDataPreventivo ?? null,
    };

    setWorkingOrder((current) => ({
      ...current,
      materials: [...current.materials, nextMaterial],
    }));
    setAddingMaterial(false);
    setNewDesc("");
    setNewQty("");
    setNewUnit("pz");
    setNewNote("");
    setNewPhotoFile(null);
    setSelectedDetailListino(null);
    setDetailSuggestOpen(false);
  };

  const buildPdfPayload = (mode: "fornitori" | "interno") => ({
    kind: "table" as const,
    title:
      mode === "fornitori"
        ? `Ordine Fornitore - ${workingOrder.supplierName}`
        : `Ordine Interno - ${workingOrder.supplierName}`,
    columns:
      mode === "fornitori"
        ? ["descrizione", "quantita", "unita", "stato", "dataArrivo", "note"]
        : ["descrizione", "quantita", "unita", "stato", "dataArrivo", "note", "totaleRiga"],
    rows: sortedMaterials.map((material) => {
      const line = computeLineTotal({
        qty: material.quantita,
        unitPrice: material.sourceUnitPrice,
        selectedUom: material.unita,
        priceUom: material.sourceUnitPriceUnit || material.unita,
        note: material.note,
      });

      return {
        descrizione: material.descrizione,
        quantita: material.quantita != null ? String(material.quantita) : "",
        unita: material.unita || "",
        stato: material.arrived ? "ARRIVATO" : "IN ATTESA",
        dataArrivo: material.arrivalDateLabel || "",
        note: material.note || "",
        totaleRiga:
          line.status === "needs_factor"
            ? "DA VERIFICARE UDM"
            : line.total !== null && material.sourceCurrency
              ? `${line.total.toFixed(2)} ${material.sourceCurrency}`
              : "-",
      };
    }),
  });

  const ensurePdfPreviewReady = async (mode: "fornitori" | "interno") => {
    try {
      const preview = await openPreview({
        source: async () => generateSmartPDFBlob(buildPdfPayload(mode)),
        fileName:
          mode === "fornitori"
            ? `ordine-fornitori-${workingOrder.id}.pdf`
            : `ordine-interno-${workingOrder.id}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewTitle(
        mode === "fornitori" ? "Anteprima PDF fornitori" : "Anteprima PDF interno",
      );
      return preview;
    } catch (error) {
      console.error("Errore anteprima PDF procurement NEXT:", error);
      window.alert("Impossibile generare l'anteprima PDF.");
      return null;
    }
  };

  const openPdf = async (mode: "fornitori" | "interno") => {
    const preview = await ensurePdfPreviewReady(mode);
    if (!preview) return;
    setPdfShareHint(null);
    setPdfPreviewOpen(true);
  };

  const buildPreviewShareText = () =>
    buildPdfShareMessage({
      contextLabel: pdfPreviewTitle,
      dateLabel: workingOrder.orderDateLabel,
      fileName: pdfPreviewFileName,
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPreviewShareText());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima l'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName,
      title: pdfPreviewTitle,
      text: buildPreviewShareText(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;
    const copied = await copyTextToClipboard(buildPreviewShareText());
    setPdfShareHint(
      copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.",
    );
  };

  const handleCopyPdfLink = async () => {
    const copied = await copyTextToClipboard(buildPreviewShareText());
    setPdfShareHint(copied ? "Testo copiato negli appunti." : "Impossibile copiare automaticamente.");
  };

  const handleOpenWhatsApp = () => {
    const text = buildPreviewShareText();
    const url = buildWhatsAppShareUrl(text);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  return (
    <div className="acq-tab-panel acq-tab-panel--detail">
      <div className="acq-detail">
        <div className="acq-detail-head">
          <div>
            <p className="acq-section-kicker">Dettaglio ordine</p>
            <h3>{workingOrder.supplierName}</h3>
            <p className="acq-detail-meta">Ordine del {workingOrder.orderDateLabel ?? "-"}</p>
          </div>
          <div className="acq-detail-head-actions">
            <button type="button" className="acq-btn" onClick={() => onCloseOrder(backTab)}>
              Indietro
            </button>
            {!editing ? (
              <button type="button" className="acq-btn" onClick={toggleOrderArrived}>
                {localState.label === "ARRIVATO" ? "Segna NON Arrivato" : "Segna Arrivato"}
              </button>
            ) : null}
            {!editing ? (
              <button type="button" className="acq-btn acq-btn--primary" onClick={() => setEditing(true)}>
                Modifica
              </button>
            ) : (
              <button type="button" className="acq-btn acq-btn--primary" onClick={saveDetail}>
                Salva
              </button>
            )}
          </div>
        </div>

        <div className="acq-detail-summary">
          <div className="acq-detail-summary-left">
            <span className={`acq-pill ${localState.className}`}>{localState.label}</span>
            <span className="acq-pill">Materiali: {workingOrder.materials.length}</span>
            <span className="acq-pill">
              Arrivati: {workingOrder.materials.filter((material) => material.arrived).length}
            </span>
          </div>
          <div className="acq-detail-totals">
            <div className="acq-detail-pdf-actions">
              <button type="button" className="acq-btn" onClick={() => void openPdf("fornitori")}>
                PDF Fornitori
              </button>
              <button type="button" className="acq-btn" onClick={() => void openPdf("interno")}>
                ANTEPRIMA PDF
              </button>
              <button
                type="button"
                className="acq-btn acq-btn--primary"
                onClick={() => void openPdf("interno")}
              >
                PDF Interno
              </button>
            </div>
            {totals.mixed ? (
              <>
                <span className="acq-pill is-warn">Valute miste</span>
                <strong>Totale CHF: CHF {totals.totalsByCurrency.CHF.toFixed(2)}</strong>
                <strong>Totale EUR: EUR {totals.totalsByCurrency.EUR.toFixed(2)}</strong>
              </>
            ) : (
              <strong>
                {totals.missing > 0 || totals.udm > 0 ? "Totale parziale: " : "Totale ordine: "}
                {totals.used.length === 0
                  ? "-"
                  : `${totals.used[0]} ${totals.totalsByCurrency[totals.used[0]].toFixed(2)}`}
              </strong>
            )}
            {totals.missing > 0 ? <span className="acq-pill">Prezzi mancanti: {totals.missing}</span> : null}
            {totals.udm > 0 ? <span className="acq-pill is-warn">UDM da verificare: {totals.udm}</span> : null}
          </div>
        </div>

        {!editing && !addingMaterial ? (
          <button type="button" className="acq-btn" onClick={() => setAddingMaterial(true)}>
            + Aggiungi materiale
          </button>
        ) : null}

        {addingMaterial ? (
          <div className="acq-detail-addbox">
            <div className="acq-detail-add-desc">
              <input
                className="acq-input"
                placeholder="DESCRIZIONE"
                value={newDesc}
                onChange={(event) => onDetailDescChange(event.target.value)}
                onFocus={() => setDetailSuggestOpen(true)}
                onBlur={() => window.setTimeout(() => setDetailSuggestOpen(false), 120)}
              />
              {detailSuggestOpen && detailSuggestList.length > 0 ? (
                <div className="acq-detail-suggest">
                  {detailSuggestList.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="acq-detail-suggest-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectDetailSuggestion(entry)}
                    >
                      <strong>{entry.articoloCanonico}</strong>
                      <small>
                        {entry.codiceArticolo ? `Codice ${entry.codiceArticolo} - ` : ""}
                        {entry.prezzoAttuale !== null ? entry.prezzoAttuale.toFixed(2) : "-"} {entry.valuta}/
                        {String(entry.unita || "").toLowerCase()}
                        {entry.fonteNumeroPreventivo ? ` - N. ${entry.fonteNumeroPreventivo}` : ""}
                      </small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="acq-detail-addrow">
              <input
                className="acq-input"
                placeholder="QTA"
                value={newQty}
                onChange={(event) => setNewQty(event.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <select className="acq-input" value={newUnit} onChange={(event) => setNewUnit(event.target.value)}>
                <option value="pz">PZ</option>
                <option value="kg">KG</option>
                <option value="m">M</option>
                <option value="lt">LT</option>
              </select>
            </div>
            <input
              className="acq-input"
              placeholder="Nota riga (opzionale)"
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
            />
            {selectedDetailListino ? (
              <div className="acq-detail-match-hint">
                Prezzo suggerito: {selectedDetailListino.prezzoAttuale?.toFixed(2) ?? "-"}{" "}
                {selectedDetailListino.valuta}/{String(selectedDetailListino.unita || "").toLowerCase()}
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setNewPhotoFile(event.target.files?.[0] || null)}
            />
            <div className="acq-detail-head-actions">
              <button type="button" className="acq-btn acq-btn--primary" onClick={saveNewMaterial}>
                Salva
              </button>
              <button type="button" className="acq-btn" onClick={() => setAddingMaterial(false)}>
                Annulla
              </button>
            </div>
          </div>
        ) : null}

        <label className="acq-order-note acq-order-note--detail">
          <span>Note ordine (solo PDF)</span>
          <textarea
            value={workingOrder.orderNote ?? ""}
            onChange={(event) =>
              setWorkingOrder((current) => ({
                ...current,
                orderNote: event.target.value,
              }))
            }
            placeholder="Inserisci note generali ordine"
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
              {sortedMaterials.length > 0 ? (
                sortedMaterials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div className="acq-detail-photo-cell">
                        {material.photoUrl ? <img src={material.photoUrl} alt={material.descrizione} /> : <span>-</span>}
                        {editing ? (
                          <div className="acq-detail-photo-buttons">
                            <label className="acq-btn acq-btn--small">
                              Foto
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(event) => uploadPhoto(material.id, event)}
                              />
                            </label>
                            {material.photoUrl ? (
                              <button
                                type="button"
                                className="acq-btn acq-btn--danger acq-btn--small"
                                onClick={() => removePhoto(material.id)}
                              >
                                Rimuovi
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {!editing ? (
                        <div className="acq-detail-desc-cell">
                          <strong title={material.id}>{material.descrizione}</strong>
                        </div>
                      ) : (
                        <input
                          className="acq-input"
                          value={material.descrizione}
                          onChange={(event) =>
                            setMaterial(material.id, (current) => ({
                              ...current,
                              descrizione: event.target.value.toUpperCase(),
                            }))
                          }
                        />
                      )}
                    </td>
                    <td>
                      {!editing ? (
                        material.quantita ?? "-"
                      ) : (
                        <input
                          className="acq-input acq-input--sm"
                          value={String(material.quantita ?? "")}
                          onChange={(event) =>
                            setMaterial(material.id, (current) => ({
                              ...current,
                              quantita:
                                Number.parseInt(event.target.value.replace(/\D/g, "").slice(0, 3), 10) || 0,
                            }))
                          }
                        />
                      )}
                    </td>
                    <td>
                      {!editing ? (
                        material.unita ?? "-"
                      ) : (
                        <select
                          className="acq-input acq-input--sm"
                          value={material.unita ?? "pz"}
                          onChange={(event) =>
                            setMaterial(material.id, (current) => ({
                              ...current,
                              unita: event.target.value,
                            }))
                          }
                        >
                          <option value="pz">PZ</option>
                          <option value="kg">KG</option>
                          <option value="m">M</option>
                          <option value="lt">LT</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {!editing ? (
                        <span className={`acq-pill ${material.arrived ? "is-ok" : "is-danger"}`}>
                          {material.arrived ? "Si" : "No"}
                        </span>
                      ) : (
                        <label className="acq-check-inline">
                          <input
                            type="checkbox"
                            checked={material.arrived}
                            onChange={(event) =>
                              setMaterial(material.id, (current) => ({
                                ...current,
                                arrived: event.target.checked,
                                arrivalDateLabel: event.target.checked
                                  ? current.arrivalDateLabel || formatTodayLabel()
                                  : null,
                              }))
                            }
                          />
                          Arrivato
                        </label>
                      )}
                    </td>
                    <td>
                      {!editing ? (
                        material.arrivalDateLabel ?? "-"
                      ) : (
                        <input
                          className="acq-input acq-input--sm"
                          value={material.arrivalDateLabel ?? ""}
                          placeholder="gg mm aaaa"
                          onChange={(event) =>
                            setMaterial(material.id, (current) => ({
                              ...current,
                              arrivalDateLabel: event.target.value,
                            }))
                          }
                        />
                      )}
                    </td>
                    <td>
                      {!editing ? (
                        material.note ?? "-"
                      ) : (
                        <input
                          className="acq-input acq-input--sm"
                          value={material.note ?? ""}
                          onChange={(event) =>
                            setMaterial(material.id, (current) => ({
                              ...current,
                              note: event.target.value,
                            }))
                          }
                        />
                      )}
                    </td>
                    <td>
                      {(() => {
                        const line = computeLineTotal({
                          qty: material.quantita,
                          unitPrice: material.sourceUnitPrice,
                          selectedUom: material.unita,
                          priceUom: material.sourceUnitPriceUnit || material.unita,
                          note: material.note,
                        });
                        if (line.status === "needs_factor") return "DA VERIFICARE UDM";
                        if (line.total === null || !material.sourceCurrency) return "-";
                        return `${material.sourceCurrency} ${line.total.toFixed(2)}`;
                      })()}
                    </td>
                    <td>
                      {editing ? (
                        <button
                          type="button"
                          className="acq-btn acq-btn--danger acq-btn--small"
                          onClick={() => deleteMaterial(material.id)}
                        >
                          Elimina
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
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

        <PdfPreviewModal
          open={pdfPreviewOpen}
          title={pdfPreviewTitle}
          pdfUrl={pdfPreviewUrl}
          fileName={pdfPreviewFileName}
          hint={pdfShareHint}
          onClose={closePdfPreview}
          onShare={handleSharePDF}
          onCopyLink={handleCopyPdfLink}
          onWhatsApp={handleOpenWhatsApp}
        />
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
  searchQuery = "",
  embedded = false,
}: NextProcurementReadOnlyPanelProps) {
  const navigate = useNavigate();
  const activeOrder = findNextProcurementOrder(snapshot, orderId);
  const requestedDetailMissing = Boolean(orderId) && !activeOrder;

  const visibleOrders = useMemo(
    () =>
      buildNextProcurementListView(
        snapshot,
        activeTab === "arrivi" ? "arrivi" : "ordini",
      ).filter((order) => {
        const normalizedSearch = normalizeText(searchQuery);
        if (!iaPrefill?.fornitore && !iaPrefill?.materiale) {
          return normalizedSearch
            ? normalizeText(order.orderReference).includes(normalizedSearch) ||
                normalizeText(order.supplierName).includes(normalizedSearch) ||
                normalizeText(order.id).includes(normalizedSearch) ||
                order.materialPreview.some((entry) =>
                  normalizeText(entry).includes(normalizedSearch),
                )
            : true;
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
        const searchMatches = normalizedSearch
          ? normalizeText(order.orderReference).includes(normalizedSearch) ||
            normalizeText(order.supplierName).includes(normalizedSearch) ||
            normalizeText(order.id).includes(normalizedSearch) ||
            order.materialPreview.some((entry) =>
              normalizeText(entry).includes(normalizedSearch),
            )
          : true;

        return supplierMatches && materialMatches && searchMatches;
      }),
    [activeTab, iaPrefill, searchQuery, snapshot],
  );

  const content = (
    <section className={`acq-content${embedded ? " acq-content--embedded" : ""}`}>
      {activeOrder ? (
        <OrderDetailPanel
          key={`${activeOrder.id}:${activeOrder.arrivedRows}:${activeOrder.pendingRows}:${activeOrder.materials.length}`}
          snapshot={snapshot}
          order={activeOrder}
          backTab={detailBackTab}
          onCloseOrder={onCloseOrder}
        />
      ) : requestedDetailMissing ? (
        <div className="acq-tab-panel acq-tab-panel--detail">
          <div className="acq-detail-state">Ordine non trovato.</div>
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
        <OrderListTable
          title="Ordini in attesa"
          subtitle="Vista di supporto read-only. Per caricare o scaricare davvero lo stock usa `/next/magazzino`."
          items={visibleOrders}
          fromTab="ordini"
          onOpenOrder={onOpenOrder}
        />
      ) : activeTab === "arrivi" ? (
        <OrderListTable
          title="Ordini arrivati"
          subtitle="Vista di supporto read-only. Gli arrivi si consolidano in stock da `/next/magazzino?tab=documenti-costi`."
          items={visibleOrders}
          fromTab="arrivi"
          onOpenOrder={onOpenOrder}
        />
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
  );

  if (embedded) {
    return content;
  }

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
                Modulo NEXT di supporto: ordini, arrivi e dettaglio ordine
                restano navigabili in sola lettura; preventivi sono preview
                prudenziale, listino solo contesto e il writer stock canonico
                del dominio resta `/next/magazzino`.
              </p>
            </div>
          </div>
          <div className="acq-header-actions" style={HEADER_ACTIONS_STYLE}>
            <button
              type="button"
              className="acq-cta acq-cta--primary"
              onClick={() => navigate(buildNextMagazzinoPath("documenti-costi"))}
            >
              Apri Magazzino stock
            </button>
            <span className="next-clone-readonly-badge">SUPPORTO READ-ONLY</span>
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

        {content}
      </div>
    </div>
  );
}
