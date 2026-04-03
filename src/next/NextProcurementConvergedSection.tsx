import { useEffect, useMemo, useState } from "react";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import type {
  NextProcurementListTab,
  NextProcurementListinoItem,
  NextProcurementPreventivoItem,
  NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";

type ProcurementHomeTab =
  | "Ordini"
  | "Arrivi"
  | "Prezzi & Preventivi"
  | "Listino Prezzi";
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
type MenuPosition = { top: number; left: number; openUp: boolean };
type PreventivoImportStatus = {
  imported: number;
  total: number;
  label: string;
  className: "not" | "partial" | "full" | "neutral";
};

const LABELS_IT = {
  trend: { down: "IN CALO", up: "IN AUMENTO", same: "STABILE", new: "NUOVO" },
  import: {
    not: "NON IMPORTATO",
    partial: "IMPORTATO PARZIALE",
    full: "IMPORTATO COMPLETO",
    zeroRows: "0 RIGHE",
  },
  menu: {
    open: "Apri",
    openDocument: "Apri documento",
    edit: "Modifica",
    delete: "Elimina",
    import: "Importa",
    resetFilters: "Reset filtri",
    onlyNotImported: "Solo non importati",
  },
} as const;

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCanonicalText(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase().replace(/[.\-_/]/g, " ").replace(/\s+/g, " ");
}

function formatTodayLabel() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")} ${String(now.getMonth() + 1).padStart(2, "0")} ${now.getFullYear()}`;
}

function formatTrendLabel(value: string | null | undefined) {
  if (value === "down") return LABELS_IT.trend.down;
  if (value === "up") return LABELS_IT.trend.up;
  if (value === "new") return LABELS_IT.trend.new;
  return LABELS_IT.trend.same;
}

function formatTrendClassName(value: string | null | undefined) {
  if (value === "down") return "is-ok";
  if (value === "up") return "is-danger";
  return "is-warn";
}

function renderSafeText(value: unknown, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  return raw.replace(/â€”/g, "-").replace(/Â€/g, "EUR").replace(/€/g, "EUR").replace(/Â°/g, ".").replace(/Â·|·/g, " - ").replace(/\s+/g, " ").trim();
}

function hasAnyDocument(entry: {
  pdfUrl: string | null;
  pdfStoragePath?: string | null;
  imageUrls?: string[];
  imageStoragePaths?: string[];
}) {
  return Boolean(entry.pdfUrl || entry.pdfStoragePath || entry.imageUrls?.length || entry.imageStoragePaths?.length);
}

function openFirstDocument(entry: { pdfUrl: string | null; imageUrls?: string[] }) {
  const first = entry.pdfUrl || entry.imageUrls?.[0];
  if (!first) {
    window.alert("Nessun documento collegato.");
    return;
  }
  window.open(first, "_blank", "noopener,noreferrer");
}

function buildMenuPosition(rect: DOMRect, width: number, height: number): MenuPosition {
  const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width));
  const openUp = rect.bottom + height > window.innerHeight - 8;
  return { top: openUp ? Math.max(8, rect.top - 8) : rect.bottom + 8, left, openUp };
}

function buildPreventivoImportStatus(item: NextProcurementPreventivoItem, listino: NextProcurementListinoItem[]): PreventivoImportStatus {
  if (item.righeCount === 0) return { imported: 0, total: 0, label: LABELS_IT.import.zeroRows, className: "neutral" };
  const supplierId = String(item.supplierId || "").trim();
  const supplierName = normalizeText(item.supplierName);
  const scoped = listino.filter((entry) => supplierId ? entry.supplierId === supplierId : normalizeText(entry.supplierName) === supplierName);
  const sourceMatches = scoped.filter((entry) => normalizeText(entry.fonteNumeroPreventivo) === normalizeText(item.numeroPreventivo));
  const previewSet = new Set(item.materialsPreview.map((entry) => normalizeCanonicalText(entry)).filter(Boolean));
  const previewMatches = scoped.filter((entry) => previewSet.has(normalizeCanonicalText(entry.articoloCanonico)));
  const imported = Math.min(item.righeCount, Math.max(sourceMatches.length, previewMatches.length));
  if (imported === 0) return { imported, total: item.righeCount, label: LABELS_IT.import.not, className: "not" };
  if (imported < item.righeCount) return { imported, total: item.righeCount, label: LABELS_IT.import.partial, className: "partial" };
  return { imported, total: item.righeCount, label: LABELS_IT.import.full, className: "full" };
}

export default function NextProcurementConvergedSection({
  snapshot,
  activeTab,
  orderId,
  detailBackTab,
  searchQuery,
  onSearchQueryChange,
  iaPrefill,
  procurementError,
  procurementLoading,
  onOpenOrder,
  onCloseOrder,
  onGoOrdini,
  onGoArrivi,
}: {
  snapshot: NextProcurementSnapshot | null;
  activeTab: ProcurementHomeTab;
  orderId: string | null;
  detailBackTab: NextProcurementListTab;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  iaPrefill: HandoffPrefill;
  procurementError: string | null;
  procurementLoading: boolean;
  onOpenOrder: (orderId: string, fromTab: NextProcurementListTab) => void;
  onCloseOrder: (backTab: NextProcurementListTab) => void;
  onGoOrdini: () => void;
  onGoArrivi: () => void;
}) {
  const pricingView: PricingView = activeTab === "Listino Prezzi" ? "listino" : "preventivi";
  const [supplierFilter, setSupplierFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [soloNonImportati, setSoloNonImportati] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [openGroupKeys, setOpenGroupKeys] = useState<Record<string, boolean>>({});
  const [preventiviMenuKey, setPreventiviMenuKey] = useState<string | null>(null);
  const [preventiviMenuPosition, setPreventiviMenuPosition] = useState<MenuPosition | null>(null);
  const [listinoMenuId, setListinoMenuId] = useState<string | null>(null);
  const [listinoMenuPosition, setListinoMenuPosition] = useState<MenuPosition | null>(null);
  const [editingListinoItem, setEditingListinoItem] = useState<NextProcurementListinoItem | null>(null);

  const preventiviSupplierOptions = useMemo(() => {
    if (!snapshot) return [];
    const map = new Map<string, string>();
    snapshot.preventivi.forEach((item) => {
      const id = String(item.supplierId || "").trim();
      const name = String(item.supplierName || "").trim();
      if (id && name && !map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));
  }, [snapshot]);

  const listinoSupplierOptions = useMemo(() => {
    if (!snapshot) return [];
    const map = new Map<string, string>();
    snapshot.listino.forEach((item) => {
      const id = String(item.supplierId || "").trim();
      const name = String(item.supplierName || "").trim();
      if (id && name && !map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));
  }, [snapshot]);

  const preventiviStatusById = useMemo(() => {
    const map = new Map<string, PreventivoImportStatus>();
    if (!snapshot) return map;
    snapshot.preventivi.forEach((item) => map.set(item.id, buildPreventivoImportStatus(item, snapshot.listino)));
    return map;
  }, [snapshot]);

  const groupedPreventivi = useMemo(() => {
    if (!snapshot) return [];
    const groups = new Map<string, { key: string; fornitoreNome: string; items: NextProcurementPreventivoItem[] }>();
    snapshot.preventivi.forEach((item) => {
      if (supplierFilter && String(item.supplierId || "").trim() !== supplierFilter) return;
      const q = normalizeText(searchQuery);
      if (q) {
        const hay = `${item.supplierName} ${item.numeroPreventivo} ${item.dataPreventivoLabel ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      if (soloNonImportati && preventiviStatusById.get(item.id)?.className !== "not") return;
      const key = String(item.supplierId || "").trim() || `nome:${String(item.supplierName || "").trim().toUpperCase() || "SENZA_FORNITORE"}`;
      const fornitoreNome = String(item.supplierName || "").trim() || "Senza fornitore";
      if (!groups.has(key)) groups.set(key, { key, fornitoreNome, items: [] });
      groups.get(key)?.items.push(item);
    });
    return Array.from(groups.values()).map((group) => ({ ...group, items: [...group.items].sort((a, b) => (b.dataPreventivoTimestamp ?? 0) - (a.dataPreventivoTimestamp ?? 0)) })).sort((a, b) => a.fornitoreNome.localeCompare(b.fornitoreNome, "it", { sensitivity: "base" }));
  }, [preventiviStatusById, searchQuery, snapshot, soloNonImportati, supplierFilter]);

  const filteredListino = useMemo(() => {
    if (!snapshot) return [];
    const q = normalizeText(searchQuery);
    return snapshot.listino.filter((item) => {
      if (supplierFilter && String(item.supplierId || "").trim() !== supplierFilter) return false;
      if (currencyFilter && item.valuta !== currencyFilter) return false;
      if (iaPrefill?.fornitore && !normalizeText(item.supplierName).includes(normalizeText(iaPrefill.fornitore))) return false;
      if (iaPrefill?.materiale && !normalizeText(item.articoloCanonico).includes(normalizeText(iaPrefill.materiale))) return false;
      return !q || normalizeText(item.articoloCanonico).includes(q) || normalizeText(item.codiceArticolo).includes(q);
    });
  }, [currencyFilter, iaPrefill, searchQuery, snapshot, supplierFilter]);

  useEffect(() => {
    if (!preventiviMenuKey) return;
    const closeMenu = () => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); };
    const onMouseDown = (event: MouseEvent) => { const target = event.target as HTMLElement | null; if (target?.closest('[data-menu-root="preventivi"]')) return; closeMenu(); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeMenu(); };
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
  }, [preventiviMenuKey]);

  useEffect(() => {
    if (!listinoMenuId) return;
    const closeMenu = () => { setListinoMenuId(null); setListinoMenuPosition(null); };
    const onMouseDown = (event: MouseEvent) => { const target = event.target as HTMLElement | null; if (target?.closest('[data-menu-root="listino"]')) return; closeMenu(); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeMenu(); };
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
  }, [listinoMenuId]);

  if (procurementLoading) return <section className="acq-content"><div className="acq-tab-panel"><div className="acq-list-empty">Caricamento snapshot procurement del clone...</div></div></section>;
  if (procurementError || !snapshot) return <section className="acq-content"><div className="acq-tab-panel"><div className="acq-list-error">{procurementError || "Snapshot procurement non disponibile."}</div></div></section>;

  if (activeTab === "Ordini" || activeTab === "Arrivi") {
    return (
      <NextProcurementReadOnlyPanel
        snapshot={snapshot}
        activeTab={activeTab === "Arrivi" ? "arrivi" : "ordini"}
        orderId={orderId}
        detailBackTab={detailBackTab}
        searchQuery={searchQuery}
        iaPrefill={iaPrefill}
        embedded
        onTabChange={(tab) => { if (tab === "arrivi") { onGoArrivi(); return; } onGoOrdini(); }}
        onOpenOrder={onOpenOrder}
        onCloseOrder={onCloseOrder}
      />
    );
  }

  if (pricingView === "preventivi") {
    return (
      <section className="acq-content"><div className="acq-tab-panel"><div className="acq-prev-shell">
        <div className="acq-prev-topbar"><h2>Registro Preventivi</h2><button type="button" className="acq-btn acq-btn--primary" onClick={() => setShowNew((current) => !current)}>{showNew ? "Chiudi" : "Carica preventivo"}</button></div>
        {showNew ? <div className="acq-prev-card"><h3>Nuovo preventivo</h3><p className="acq-prev-draft-meta">Clone-safe: la form resta visibile ma il salvataggio business reale non viene riaperto.</p><div className="acq-prev-form-grid"><label className="acq-prev-field"><span>Fornitore</span><select><option value="">Seleziona</option>{preventiviSupplierOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="acq-prev-field"><span>N. preventivo</span><input type="text" placeholder="Numero preventivo" /></label><label className="acq-prev-field"><span>Data preventivo</span><input type="text" defaultValue={formatTodayLabel()} /></label><label className="acq-prev-field"><span>Documento</span><input type="file" accept="application/pdf,image/*" /></label></div><div className="acq-prev-actions"><button type="button" className="acq-btn" onClick={() => setShowNew(false)}>Annulla</button><button type="button" className="acq-btn acq-btn--primary" onClick={() => window.alert("Clone read-only: caricamento preventivo non disponibile.")}>Salva preventivo</button></div></div> : null}
        <div className="acq-prev-card">
          <div className="acq-prev-groups-head"><h3>Elenco preventivi</h3><div className="acq-prev-groups-tools"><button type="button" className="acq-btn" onClick={() => window.alert("Clone read-only: pulizia allegati IA non disponibile.")}>PULISCI ALLEGATI IA</button><button type="button" className="acq-btn" onClick={() => setOpenGroupKeys((prev) => { const next = { ...prev }; groupedPreventivi.forEach((group) => { next[group.key] = true; }); return next; })}>Apri tutti</button><button type="button" className="acq-btn" onClick={() => setOpenGroupKeys((prev) => { const next = { ...prev }; groupedPreventivi.forEach((group) => { next[group.key] = false; }); return next; })}>Chiudi tutti</button></div></div>
          <div className="acq-prev-groups-filters"><label className="acq-prev-field"><span>Fornitore</span><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Tutti</option>{preventiviSupplierOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="acq-prev-field"><span>Cerca</span><input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Numero, data, fornitore" /></label><label className="acq-prev-filter-check"><input type="checkbox" checked={soloNonImportati} onChange={(event) => setSoloNonImportati(event.target.checked)} />{LABELS_IT.menu.onlyNotImported}</label><button type="button" className="acq-btn" onClick={() => { setSupplierFilter(""); setCurrencyFilter(""); setSoloNonImportati(false); onSearchQueryChange(""); }}>{LABELS_IT.menu.resetFilters}</button></div>
          {groupedPreventivi.length === 0 ? <div className="acq-prev-empty"><div>{snapshot.preventivi.length === 0 ? "Nessun preventivo registrato." : "Nessun preventivo con questi filtri."}</div>{snapshot.preventivi.length > 0 ? <button type="button" className="acq-btn" onClick={() => { setSupplierFilter(""); setCurrencyFilter(""); setSoloNonImportati(false); onSearchQueryChange(""); }}>{LABELS_IT.menu.resetFilters}</button> : null}</div> : <div className="acq-prev-groups">{groupedPreventivi.map((group) => { const groupOpen = openGroupKeys[group.key] ?? true; const nonImportati = group.items.filter((item) => preventiviStatusById.get(item.id)?.className === "not").length; return <section key={group.key} className="acq-prev-group"><button type="button" className="acq-prev-group-summary" onClick={() => setOpenGroupKeys((prev) => ({ ...prev, [group.key]: !groupOpen }))}><span className={`acq-prev-group-caret${groupOpen ? " is-open" : ""}`}>{groupOpen ? "▼" : "▶"}</span><span className="acq-prev-group-title">{group.fornitoreNome}</span><span className="acq-prev-group-counters"><span>Preventivi: {group.items.length}</span><span>Non importati: {nonImportati}</span></span></button>{groupOpen ? <div className="acq-prev-table-wrap"><table className="acq-prev-table"><thead><tr><th>Data</th><th>N. preventivo</th><th># righe</th><th>Stato import</th><th>Azioni</th></tr></thead><tbody>{group.items.map((item) => { const status = preventiviStatusById.get(item.id) || { imported: 0, total: 0, label: LABELS_IT.import.zeroRows, className: "neutral" as const }; const canOpenDocument = hasAnyDocument(item); const missingRows = status.total - status.imported; return <tr key={item.id}><td>{item.dataPreventivoLabel ?? "-"}</td><td>{item.numeroPreventivo}</td><td>{item.righeCount}</td><td><div className="acq-import-status-wrap"><button type="button" className={`acq-import-status acq-import-status--${status.className}`}>{status.label}</button><span className="acq-import-ratio">{status.imported}/{status.total}</span></div></td><td><div className="acq-prev-list-actions acq-prev-list-actions--compact"><button type="button" className="acq-btn" onClick={() => openFirstDocument(item)} disabled={!canOpenDocument} title={canOpenDocument ? LABELS_IT.menu.openDocument : "Nessun documento collegato"}>APRI DOCUMENTO</button><div className="acq-kebab" data-menu-root="preventivi"><button type="button" className="acq-btn acq-kebab-trigger acq-kebab-trigger--icon" aria-label="Altre azioni" onClick={(event) => { const key = `preventivo:${item.id}`; if (preventiviMenuKey === key) { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); return; } const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect(); setPreventiviMenuKey(key); setPreventiviMenuPosition(buildMenuPosition(rect, 220, 290)); }}>⋮</button>{preventiviMenuKey === `preventivo:${item.id}` && preventiviMenuPosition ? <div className={`acq-kebab-menu acq-kebab-menu--fixed${preventiviMenuPosition.openUp ? " is-up" : ""}`} style={{ top: `${preventiviMenuPosition.top}px`, left: `${preventiviMenuPosition.left}px` }}><button type="button" className="acq-kebab-item" onClick={() => { openFirstDocument(item); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>Apri documento</button><button type="button" className="acq-kebab-item" onClick={() => { window.alert("Clone read-only: collegamento foto non disponibile."); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>Collega foto</button>{status.total > 0 && status.className !== "full" ? <button type="button" className="acq-kebab-item" onClick={() => { window.alert(status.className === "partial" ? `Clone read-only: import listino da preventivo non disponibile. Mancano ${missingRows} righe.` : "Clone read-only: import listino da preventivo non disponibile."); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>{status.className === "partial" ? "Importa mancanti" : LABELS_IT.menu.import}</button> : null}{status.className === "partial" ? <button type="button" className="acq-kebab-item" onClick={() => { window.alert(`Righe mancanti da verificare: ${missingRows}.`); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>Vedi mancanti</button> : null}<button type="button" className="acq-kebab-item" onClick={() => { window.alert("Clone read-only: dettaglio preventivo non disponibile."); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>{LABELS_IT.menu.open}</button><button type="button" className="acq-kebab-item" onClick={() => { window.alert("Clone read-only: modifica preventivo non disponibile."); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>{LABELS_IT.menu.edit}</button><button type="button" className="acq-kebab-item acq-kebab-item--danger" onClick={() => { window.alert("Clone read-only: eliminazione preventivo non disponibile."); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>{LABELS_IT.menu.delete}</button></div> : null}</div></div></td></tr>; })}</tbody></table></div> : null}</section>; })}</div>}
        </div>
      </div></div></section>
    );
  }

  return (
    <section className="acq-content"><div className="acq-tab-panel"><div className="acq-listino-shell">
      <div className="acq-listino-filters"><label className="acq-prev-field"><span>Fornitore</span><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Tutti</option>{listinoSupplierOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="acq-prev-field"><span>Valuta</span><select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)}><option value="">Tutte</option><option value="CHF">CHF</option><option value="EUR">EUR</option></select></label><label className="acq-prev-field"><span>Cerca</span><input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Articolo o codice" /></label></div>
      <div className="acq-prev-table-wrap"><table className="acq-prev-table"><thead><tr><th>Fornitore</th><th>Articolo</th><th>Unita</th><th>Valuta</th><th>Prezzo</th><th>Trend</th><th>Preventivo</th><th>Data</th><th>Azioni</th></tr></thead><tbody>{filteredListino.length === 0 ? <tr><td colSpan={9}>{snapshot.listino.length === 0 ? "Listino vuoto." : "Nessuna voce con questi filtri."}</td></tr> : filteredListino.map((item) => { const hasDocument = hasAnyDocument(item); return <tr key={item.id}><td>{renderSafeText(item.supplierName)}</td><td>{renderSafeText(item.articoloCanonico)}</td><td>{renderSafeText(item.unita)}</td><td>{renderSafeText(item.valuta)}</td><td>{item.prezzoAttuale !== null ? item.prezzoAttuale.toFixed(2) : "-"}</td><td><span className={`acq-pill ${formatTrendClassName(item.trend)}`}>{formatTrendLabel(item.trend)}</span></td><td>{item.fonteNumeroPreventivo ? `N. ${renderSafeText(item.fonteNumeroPreventivo)}` : "-"}</td><td>{renderSafeText(item.fonteDataPreventivo || item.updatedAtLabel)}</td><td><div className="acq-prev-list-actions acq-prev-list-actions--compact"><button type="button" className="acq-btn acq-btn--primary" onClick={() => openFirstDocument(item)} disabled={!hasDocument} title={hasDocument ? "Apri documento" : "Nessun documento collegato"}>APRI DOCUMENTO</button><div className="acq-kebab" data-menu-root="listino"><button type="button" className="acq-btn acq-kebab-trigger acq-kebab-trigger--icon" aria-label="Altre azioni" onClick={(event) => { if (listinoMenuId === item.id) { setListinoMenuId(null); setListinoMenuPosition(null); return; } const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect(); setListinoMenuId(item.id); setListinoMenuPosition(buildMenuPosition(rect, 210, 180)); }}>⋮</button>{listinoMenuId === item.id && listinoMenuPosition ? <div className={`acq-kebab-menu acq-kebab-menu--fixed${listinoMenuPosition.openUp ? " is-up" : ""}`} style={{ top: `${listinoMenuPosition.top}px`, left: `${listinoMenuPosition.left}px` }}><button type="button" className="acq-kebab-item" onClick={() => { openFirstDocument(item); setListinoMenuId(null); setListinoMenuPosition(null); }}>Apri documento</button><button type="button" className="acq-kebab-item" onClick={() => { setEditingListinoItem(item); setListinoMenuId(null); setListinoMenuPosition(null); }}>{LABELS_IT.menu.edit}</button><button type="button" className="acq-kebab-item acq-kebab-item--danger" onClick={() => { window.alert("Clone read-only: eliminazione voce listino non disponibile."); setListinoMenuId(null); setListinoMenuPosition(null); }}>{LABELS_IT.menu.delete}</button></div> : null}</div></div></td></tr>; })}</tbody></table></div>
      {editingListinoItem ? <div className="acq-modal-backdrop" role="dialog" aria-modal="true" aria-label="Modifica voce listino" onClick={(event) => { if (event.target === event.currentTarget) setEditingListinoItem(null); }}><div className="acq-modal-card acq-listino-edit-modal"><div className="acq-link-foto-head"><div><h4>Modifica voce listino</h4><p className="acq-prev-draft-meta">{editingListinoItem.supplierName}</p></div><button type="button" className="acq-btn acq-btn--small" onClick={() => setEditingListinoItem(null)} aria-label="Chiudi">X</button></div><div className="acq-modal-grid"><label className="acq-prev-field"><span>Descrizione</span><input type="text" defaultValue={editingListinoItem.articoloCanonico} /></label><label className="acq-prev-field"><span>Codice articolo (opzionale)</span><input type="text" defaultValue={editingListinoItem.codiceArticolo || ""} /></label><label className="acq-prev-field"><span>Unita</span><input type="text" defaultValue={editingListinoItem.unita || ""} /></label><label className="acq-prev-field"><span>Valuta</span><select defaultValue={editingListinoItem.valuta || "CHF"}><option value="CHF">CHF</option><option value="EUR">EUR</option></select></label><label className="acq-prev-field"><span>Prezzo</span><input type="text" defaultValue={editingListinoItem.prezzoAttuale !== null ? editingListinoItem.prezzoAttuale.toFixed(2) : ""} /></label><label className="acq-prev-field"><span>Data</span><input type="text" defaultValue={editingListinoItem.fonteDataPreventivo || editingListinoItem.updatedAtLabel || formatTodayLabel()} /></label></div><label className="acq-prev-field"><span>Note</span><textarea defaultValue={editingListinoItem.note || ""} /></label><div className="acq-listino-edit-doc">{hasAnyDocument(editingListinoItem) ? <button type="button" className="acq-btn" onClick={() => openFirstDocument(editingListinoItem)}>APRI DOCUMENTO</button> : <span className="acq-prev-draft-meta">Nessun documento collegato</span>}</div><div className="acq-prev-actions"><button type="button" className="acq-btn" onClick={() => setEditingListinoItem(null)}>Annulla</button><button type="button" className="acq-btn acq-btn--primary" onClick={() => window.alert("Clone read-only: modifica listino non disponibile.")}>Salva</button></div></div></div> : null}
    </div></div></section>
  );
}
