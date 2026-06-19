import { useEffect, useMemo, useRef, useState } from "react";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import {
  updateNextListinoVoce,
  upsertListinoFromPreventivoManuale,
  type Preventivo,
  type Valuta,
} from "./nextPreventivoManualeWriter";
import {
  deleteNextPreventivo,
  deleteNextListinoVoce,
  cleanPreventiviIaAttachments,
  attachFotoToPreventivo,
} from "./nextProcurementWriters";
import NextPreventivoIaModal from "./NextPreventivoIaModal";
import NextPreventivoManualeModal from "./NextPreventivoManualeModal";
import type {
  NextProcurementListTab,
  NextProcurementListinoItem,
  NextProcurementPreventivoItem,
  NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import { toDisplay } from "./helpers/dateUnica";

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

function normalizeDescrizione(value: string | null | undefined) {
  return String(value ?? "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCanonicalText(value: string | null | undefined) {
  return normalizeDescrizione(value);
}

function normalizeUnita(value: string | null | undefined) {
  return String(value ?? "").toUpperCase().trim();
}

function extractValutaFromNote(note: string | null | undefined): "CHF" | "EUR" | null {
  const text = String(note ?? "").toUpperCase();
  if (!text) return null;
  if (/(^|\W)(EUR|EURO)(\W|$)/.test(text)) return "EUR";
  if (/(^|\W)(CHF|FR\.?\s*SVI|FRANCHI?\s*SVIZZERI?)(\W|$)/.test(text)) return "CHF";
  return null;
}

function extractArticleCodeFromNote(note: string | null | undefined) {
  const text = String(note ?? "");
  if (!text) return "";
  const match = text.match(/(?:\bcode\b|\bcodice\b)\s*[:=]\s*([A-Za-z0-9._/-]+)/i);
  return match ? String(match[1] ?? "").trim().toUpperCase() : "";
}

function formatTodayLabel() {
  return toDisplay(new Date());
}

function formatProcurementDateLabel(value: string | null | undefined): string {
  return toDisplay(value) || value || "-";
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
  return raw.replace(/Ã¢â‚¬â€/g, "-").replace(/Ã‚â‚¬/g, "EUR").replace(/â‚¬/g, "EUR").replace(/Ã‚Â°/g, ".").replace(/Ã‚Â·|Â·/g, " - ").replace(/\s+/g, " ").trim();
}

function hasAnyDocument(entry: {
  pdfUrl: string | null;
  pdfStoragePath?: string | null;
  imageUrls?: string[];
  imageStoragePaths?: string[];
}) {
  return Boolean(entry.pdfUrl || entry.pdfStoragePath || entry.imageUrls?.length || entry.imageStoragePaths?.length);
}

function renderPreventivoReceiptBadges(entry: {
  ricevutoDaWhatsapp?: boolean;
  ricevutoDaEmail?: boolean;
}) {
  if (!entry.ricevutoDaWhatsapp && !entry.ricevutoDaEmail) return null;
  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#2d7a3e",
    padding: "2px 6px",
    border: "1px solid rgba(45, 122, 62, 0.35)",
    borderRadius: 999,
    background: "rgba(45, 122, 62, 0.08)",
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {entry.ricevutoDaWhatsapp ? <span style={badgeStyle}>OK WhatsApp</span> : null}
      {entry.ricevutoDaEmail ? <span style={badgeStyle}>OK Email</span> : null}
    </div>
  );
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
  const rows = Array.isArray(item.rows) ? item.rows : [];
  const total = rows.length;

  if (total === 0) {
    return { imported: 0, total: 0, label: LABELS_IT.import.zeroRows, className: "neutral" };
  }

  const supplierId = String(item.supplierId ?? "").trim();
  const supplierName = normalizeDescrizione(item.supplierName);
  const scoped = listino.filter((entry) => {
    const entrySupplierId = String(entry.supplierId ?? "").trim();
    if (supplierId) return entrySupplierId === supplierId;
    if (entrySupplierId) return false;
    return normalizeDescrizione(entry.supplierName) === supplierName;
  });

  const preventivoHasSource = hasAnyDocument(item);
  const usedListinoIds = new Set<string>();
  const linkOnlyByListinoId = new Set<string>();
  let imported = 0;
  let missingCount = 0;
  let verifyCount = 0;

  rows.forEach((row) => {
    const descKey = normalizeCanonicalText(row.descrizione);
    const codeKey = extractArticleCodeFromNote(row.note);
    const rowUom = normalizeUnita(row.unita);
    const rowValuta = extractValutaFromNote(row.note);

    const getScore = (entry: NextProcurementListinoItem) => {
      const codice = String(entry.codiceArticolo ?? "").trim().toUpperCase();
      const desc = normalizeCanonicalText(entry.articoloCanonico);
      let score = 0;
      if (codeKey && codice === codeKey) score += 100;
      if (desc === descKey) score += 80;
      if (rowUom && normalizeUnita(entry.unita) === rowUom) score += 10;
      if (rowValuta && entry.valuta === rowValuta) score += 5;
      if (String(entry.fontePreventivoId ?? "").trim() === String(item.id ?? "").trim()) score += 3;
      return score;
    };

    const matchingPool = scoped.filter((entry) => {
      const codice = String(entry.codiceArticolo ?? "").trim().toUpperCase();
      const desc = normalizeCanonicalText(entry.articoloCanonico);
      if (codeKey && codice === codeKey) return true;
      return desc === descKey;
    });
    const availablePool = matchingPool.filter((entry) => !usedListinoIds.has(entry.id));

    if (matchingPool.length === 0) {
      missingCount += 1;
      return;
    }

    if (availablePool.length === 0) {
      imported += 1;
      return;
    }

    const matched = [...availablePool].sort((left, right) => getScore(right) - getScore(left))[0];
    if (!matched) {
      missingCount += 1;
      return;
    }

    usedListinoIds.add(matched.id);
    imported += 1;

    const listinoUom = normalizeUnita(matched.unita);
    if (rowUom && listinoUom && rowUom !== listinoUom) {
      verifyCount += 1;
    }
    if (rowValuta && matched.valuta !== rowValuta) {
      verifyCount += 1;
    }
    if (preventivoHasSource && !hasAnyDocument(matched)) {
      linkOnlyByListinoId.add(matched.id);
    }
  });

  const linkOnlyCount = linkOnlyByListinoId.size;
  const actionableCount = missingCount + linkOnlyCount;

  if (imported === 0) {
    return { imported, total, label: LABELS_IT.import.not, className: "not" };
  }
  if (actionableCount > 0) {
    return {
      imported,
      total,
      label: missingCount === 0 && linkOnlyCount > 0 ? "FONTE DA COLLEGARE" : LABELS_IT.import.partial,
      className: "partial",
    };
  }
  if (verifyCount > 0) {
    return {
      imported,
      total,
      label: `IMPORTATO (DA VERIFICARE ${verifyCount})`,
      className: "full",
    };
  }
  return { imported, total, label: LABELS_IT.import.full, className: "full" };
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
  onPreventivoSaved,
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
  onPreventivoSaved?: () => void | Promise<void>;
}) {
  const pricingView: PricingView = activeTab === "Listino Prezzi" ? "listino" : "preventivi";
  const [supplierFilter, setSupplierFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [soloNonImportati, setSoloNonImportati] = useState(false);
  const [showIaModal, setShowIaModal] = useState(false);
  const [showManualeModal, setShowManualeModal] = useState(false);
  const [openGroupKeys, setOpenGroupKeys] = useState<Record<string, boolean>>({});
  const [preventiviMenuKey, setPreventiviMenuKey] = useState<string | null>(null);
  const [preventiviMenuPosition, setPreventiviMenuPosition] = useState<MenuPosition | null>(null);
  const [listinoMenuId, setListinoMenuId] = useState<string | null>(null);
  const [listinoMenuPosition, setListinoMenuPosition] = useState<MenuPosition | null>(null);
  const [editingListinoItem, setEditingListinoItem] = useState<NextProcurementListinoItem | null>(null);
  const [listinoForm, setListinoForm] = useState({
    descrizione: "",
    codiceArticolo: "",
    unita: "",
    valuta: "CHF" as Valuta,
    prezzo: "",
    note: "",
  });
  const [salvandoListino, setSalvandoListino] = useState(false);

  useEffect(() => {
    if (!editingListinoItem) return;
    setListinoForm({
      descrizione: editingListinoItem.articoloCanonico || "",
      codiceArticolo: editingListinoItem.codiceArticolo || "",
      unita: editingListinoItem.unita || "",
      valuta: editingListinoItem.valuta === "EUR" ? "EUR" : "CHF",
      prezzo: editingListinoItem.prezzoAttuale !== null ? String(editingListinoItem.prezzoAttuale) : "",
      note: editingListinoItem.note || "",
    });
  }, [editingListinoItem]);

  const salvaListinoVoce = async () => {
    if (!editingListinoItem) return;
    const descrizione = listinoForm.descrizione.trim();
    if (!descrizione) {
      window.alert("Inserisci la descrizione dell'articolo.");
      return;
    }
    const prezzoNum = Number(String(listinoForm.prezzo).replace(",", ".").trim());
    if (!Number.isFinite(prezzoNum)) {
      window.alert("Prezzo non valido.");
      return;
    }
    setSalvandoListino(true);
    try {
      await updateNextListinoVoce({
        id: editingListinoItem.id,
        articoloCanonico: descrizione,
        codiceArticolo: listinoForm.codiceArticolo.trim() || null,
        unita: listinoForm.unita,
        valuta: listinoForm.valuta === "EUR" ? "EUR" : "CHF",
        prezzoAttuale: prezzoNum,
        note: listinoForm.note.trim() || null,
      });
      setEditingListinoItem(null);
      if (onPreventivoSaved) {
        await onPreventivoSaved();
      }
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Errore durante il salvataggio della voce di listino.",
      );
    } finally {
      setSalvandoListino(false);
    }
  };

  const refreshProcurement = async () => {
    if (onPreventivoSaved) {
      await onPreventivoSaved();
    }
  };

  const handleEliminaVoceListino = async (id: string) => {
    if (!window.confirm("Eliminare questa voce di listino?")) return;
    try {
      await deleteNextListinoVoce(id);
      await refreshProcurement();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
    }
  };

  const handleEliminaPreventivo = async (id: string) => {
    if (!window.confirm("Eliminare questo preventivo?")) return;
    try {
      await deleteNextPreventivo(id);
      await refreshProcurement();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
    }
  };

  const handlePulisciAllegati = async () => {
    if (!window.confirm("Rimuovere tutti gli allegati IA (immagini) dai preventivi?")) return;
    try {
      const puliti = await cleanPreventiviIaAttachments();
      await refreshProcurement();
      window.alert(puliti > 0 ? `Allegati rimossi da ${puliti} preventivi.` : "Nessun allegato da rimuovere.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Errore durante la pulizia.");
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [collegaFotoId, setCollegaFotoId] = useState<string | null>(null);
  const [editingPreventivoItem, setEditingPreventivoItem] = useState<NextProcurementPreventivoItem | null>(null);

  const itemToPreventivo = (item: NextProcurementPreventivoItem): Preventivo => ({
    id: item.id,
    fornitoreId: item.supplierId || "",
    fornitoreNome: item.supplierName,
    numeroPreventivo: item.numeroPreventivo,
    dataPreventivo: item.dataPreventivoTimestamp
      ? new Date(item.dataPreventivoTimestamp).toISOString().slice(0, 10)
      : "",
    pdfUrl: item.pdfUrl,
    pdfStoragePath: item.pdfStoragePath,
    ricevutoDaWhatsapp: item.ricevutoDaWhatsapp,
    ricevutoDaEmail: item.ricevutoDaEmail,
    imageStoragePaths: item.imageStoragePaths,
    imageUrls: item.imageUrls,
    righe: item.rows.map((row) => ({
      id: row.id,
      descrizione: row.descrizione,
      unita: row.unita || "",
      prezzoUnitario: row.prezzoUnitario ?? 0,
      note: row.note || undefined,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const apriCollegaFoto = (id: string) => {
    setCollegaFotoId(id);
    fileInputRef.current?.click();
  };

  const onFotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const id = collegaFotoId;
    setCollegaFotoId(null);
    if (!files.length || !id) return;
    try {
      await attachFotoToPreventivo(id, files);
      await refreshProcurement();
      window.alert(`${files.length} foto collegate al preventivo.`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Errore durante il collegamento foto.");
    }
  };

  const handleImportaListino = async (item: NextProcurementPreventivoItem) => {
    const valuta: Valuta = item.currency === "EUR" ? "EUR" : "CHF";
    const righe = item.rows
      .filter((row) => row.prezzoUnitario != null)
      .map((row) => ({
        id: row.id,
        descrizione: row.descrizione,
        unita: row.unita || "",
        prezzoUnitario: row.prezzoUnitario as number,
        note: row.note || undefined,
      }));
    if (!righe.length) {
      window.alert("Nessuna riga con prezzo valido da importare nel listino.");
      return;
    }
    const preventivo: Preventivo = {
      id: item.id,
      fornitoreId: item.supplierId || "",
      fornitoreNome: item.supplierName,
      numeroPreventivo: item.numeroPreventivo,
      dataPreventivo: item.dataPreventivoLabel || "",
      pdfUrl: item.pdfUrl,
      pdfStoragePath: item.pdfStoragePath,
      imageStoragePaths: item.imageStoragePaths,
      imageUrls: item.imageUrls,
      righe,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await upsertListinoFromPreventivoManuale(preventivo, valuta, [], {
        pdfStoragePath: item.pdfStoragePath,
        pdfUrl: item.pdfUrl,
      });
      await refreshProcurement();
      window.alert(`${righe.length} righe importate nel listino.`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Errore durante l'import nel listino.");
    }
  };

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
        <div className="acq-prev-topbar"><h2>Registro Preventivi</h2><div className="acq-prev-actions"><button type="button" className="acq-btn acq-btn--primary" onClick={() => setShowManualeModal(true)}>PREVENTIVO MANUALE</button><button type="button" className="acq-btn acq-btn--primary" onClick={() => setShowIaModal(true)}>CARICA PREVENTIVO IA</button></div></div>
        {showIaModal ? <NextPreventivoIaModal open={showIaModal} onClose={() => setShowIaModal(false)} onPreventivoSaved={async () => { if (onPreventivoSaved) { await onPreventivoSaved(); } }} /> : null}
        {showManualeModal ? <NextPreventivoManualeModal onClose={() => setShowManualeModal(false)} onSaved={onPreventivoSaved} /> : null}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(event) => void onFotoSelected(event)} />
        {editingPreventivoItem ? (
          <NextPreventivoManualeModal
            onClose={() => setEditingPreventivoItem(null)}
            onSaved={onPreventivoSaved}
            preventivoIniziale={itemToPreventivo(editingPreventivoItem)}
            valutaIniziale={editingPreventivoItem.currency === "EUR" ? "EUR" : "CHF"}
          />
        ) : null}

        <div className="acq-prev-card">
          <div className="acq-prev-groups-head"><h3>Elenco preventivi</h3><div className="acq-prev-groups-tools"><button type="button" className="acq-btn" onClick={() => void handlePulisciAllegati()}>PULISCI ALLEGATI IA</button><button type="button" className="acq-btn" onClick={() => setOpenGroupKeys((prev) => { const next = { ...prev }; groupedPreventivi.forEach((group) => { next[group.key] = true; }); return next; })}>Apri tutti</button><button type="button" className="acq-btn" onClick={() => setOpenGroupKeys((prev) => { const next = { ...prev }; groupedPreventivi.forEach((group) => { next[group.key] = false; }); return next; })}>Chiudi tutti</button></div></div>
          <div className="acq-prev-groups-filters"><label className="acq-prev-field"><span>Fornitore</span><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Tutti</option>{preventiviSupplierOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="acq-prev-field"><span>Cerca</span><input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Numero, data, fornitore" /></label><label className="acq-prev-filter-check"><input type="checkbox" checked={soloNonImportati} onChange={(event) => setSoloNonImportati(event.target.checked)} />{LABELS_IT.menu.onlyNotImported}</label><button type="button" className="acq-btn" onClick={() => { setSupplierFilter(""); setCurrencyFilter(""); setSoloNonImportati(false); onSearchQueryChange(""); }}>{LABELS_IT.menu.resetFilters}</button></div>
          {groupedPreventivi.length === 0 ? <div className="acq-prev-empty"><div>{snapshot.preventivi.length === 0 ? "Nessun preventivo registrato." : "Nessun preventivo con questi filtri."}</div>{snapshot.preventivi.length > 0 ? <button type="button" className="acq-btn" onClick={() => { setSupplierFilter(""); setCurrencyFilter(""); setSoloNonImportati(false); onSearchQueryChange(""); }}>{LABELS_IT.menu.resetFilters}</button> : null}</div> : <div className="acq-prev-groups">{groupedPreventivi.map((group) => { const groupOpen = openGroupKeys[group.key] ?? true; const nonImportati = group.items.filter((item) => preventiviStatusById.get(item.id)?.className === "not").length; return <section key={group.key} className="acq-prev-group"><button type="button" className="acq-prev-group-summary" onClick={() => setOpenGroupKeys((prev) => ({ ...prev, [group.key]: !groupOpen }))}><span className={`acq-prev-group-caret${groupOpen ? " is-open" : ""}`}>{groupOpen ? "v" : ">"}</span><span className="acq-prev-group-title">{group.fornitoreNome}</span><span className="acq-prev-group-counters"><span>Preventivi: {group.items.length}</span><span>Non importati: {nonImportati}</span></span></button>{groupOpen ? <div className="acq-prev-table-wrap"><table className="acq-prev-table"><thead><tr><th>Data</th><th>N. preventivo</th><th># righe</th><th>Stato import</th><th>Azioni</th></tr></thead><tbody>{group.items.map((item) => { const status = preventiviStatusById.get(item.id) || { imported: 0, total: 0, label: LABELS_IT.import.zeroRows, className: "neutral" as const }; const canOpenDocument = hasAnyDocument(item); const missingRows = status.total - status.imported; return <tr key={item.id}><td>{formatProcurementDateLabel(item.dataPreventivoLabel)}</td><td><div style={{ display: "grid", gap: 4 }}><span>{item.numeroPreventivo}</span>{renderPreventivoReceiptBadges(item)}</div></td><td>{item.righeCount}</td><td><div className="acq-import-status-wrap"><button type="button" className={`acq-import-status acq-import-status--${status.className}`}>{status.label}</button><span className="acq-import-ratio">{status.imported}/{status.total}</span></div></td><td><div className="acq-prev-list-actions acq-prev-list-actions--compact"><button type="button" className="acq-btn" onClick={() => openFirstDocument(item)} disabled={!canOpenDocument} title={canOpenDocument ? LABELS_IT.menu.openDocument : "Nessun documento collegato"}>APRI DOCUMENTO</button><div className="acq-kebab" data-menu-root="preventivi"><button type="button" className="acq-btn acq-kebab-trigger acq-kebab-trigger--icon" aria-label="Altre azioni" onClick={(event) => { const key = `preventivo:${item.id}`; if (preventiviMenuKey === key) { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); return; } const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect(); setPreventiviMenuKey(key); setPreventiviMenuPosition(buildMenuPosition(rect, 220, 290)); }}>...</button>{preventiviMenuKey === `preventivo:${item.id}` && preventiviMenuPosition ? <div className={`acq-kebab-menu acq-kebab-menu--fixed${preventiviMenuPosition.openUp ? " is-up" : ""}`} style={{ top: `${preventiviMenuPosition.top}px`, left: `${preventiviMenuPosition.left}px` }}><button type="button" className="acq-kebab-item" onClick={() => { openFirstDocument(item); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>Apri documento</button><button type="button" className="acq-kebab-item" onClick={() => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); apriCollegaFoto(item.id); }}>Collega foto</button>{status.total > 0 && status.className !== "full" ? <button type="button" className="acq-kebab-item" onClick={() => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); void handleImportaListino(item); }}>{status.className === "partial" ? "Importa mancanti" : LABELS_IT.menu.import}</button> : null}{status.className === "partial" ? <button type="button" className="acq-kebab-item" onClick={() => { window.alert(`Righe mancanti da verificare: ${missingRows}.`); setPreventiviMenuKey(null); setPreventiviMenuPosition(null); }}>Vedi mancanti</button> : null}<button type="button" className="acq-kebab-item" onClick={() => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); setEditingPreventivoItem(item); }}>{LABELS_IT.menu.open}</button><button type="button" className="acq-kebab-item" onClick={() => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); setEditingPreventivoItem(item); }}>{LABELS_IT.menu.edit}</button><button type="button" className="acq-kebab-item acq-kebab-item--danger" onClick={() => { setPreventiviMenuKey(null); setPreventiviMenuPosition(null); void handleEliminaPreventivo(item.id); }}>{LABELS_IT.menu.delete}</button></div> : null}</div></div></td></tr>; })}</tbody></table></div> : null}</section>; })}</div>}
        </div>
      </div></div></section>
    );
  }

  return (
    <section className="acq-content"><div className="acq-tab-panel"><div className="acq-listino-shell">
      <div className="acq-listino-filters"><label className="acq-prev-field"><span>Fornitore</span><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="">Tutti</option>{listinoSupplierOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="acq-prev-field"><span>Valuta</span><select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)}><option value="">Tutte</option><option value="CHF">CHF</option><option value="EUR">EUR</option></select></label><label className="acq-prev-field"><span>Cerca</span><input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Articolo o codice" /></label></div>
      <div className="acq-prev-table-wrap"><table className="acq-prev-table"><thead><tr><th>Fornitore</th><th>Articolo</th><th>Unita</th><th>Valuta</th><th>Prezzo</th><th>Trend</th><th>Preventivo</th><th>Data</th><th>Azioni</th></tr></thead><tbody>{filteredListino.length === 0 ? <tr><td colSpan={9}>{snapshot.listino.length === 0 ? "Listino vuoto." : "Nessuna voce con questi filtri."}</td></tr> : filteredListino.map((item) => { const hasDocument = hasAnyDocument(item); return <tr key={item.id}><td>{renderSafeText(item.supplierName)}</td><td>{renderSafeText(item.articoloCanonico)}</td><td>{renderSafeText(item.unita)}</td><td>{renderSafeText(item.valuta)}</td><td>{item.prezzoAttuale !== null ? item.prezzoAttuale.toFixed(2) : "-"}</td><td><span className={`acq-pill ${formatTrendClassName(item.trend)}`}>{formatTrendLabel(item.trend)}</span></td><td>{item.fonteNumeroPreventivo ? `N. ${renderSafeText(item.fonteNumeroPreventivo)}` : "-"}</td><td>{formatProcurementDateLabel(item.fonteDataPreventivo || item.updatedAtLabel)}</td><td><div className="acq-prev-list-actions acq-prev-list-actions--compact"><button type="button" className="acq-btn acq-btn--primary" onClick={() => openFirstDocument(item)} disabled={!hasDocument} title={hasDocument ? "Apri documento" : "Nessun documento collegato"}>APRI DOCUMENTO</button><div className="acq-kebab" data-menu-root="listino"><button type="button" className="acq-btn acq-kebab-trigger acq-kebab-trigger--icon" aria-label="Altre azioni" onClick={(event) => { if (listinoMenuId === item.id) { setListinoMenuId(null); setListinoMenuPosition(null); return; } const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect(); setListinoMenuId(item.id); setListinoMenuPosition(buildMenuPosition(rect, 210, 180)); }}>...</button>{listinoMenuId === item.id && listinoMenuPosition ? <div className={`acq-kebab-menu acq-kebab-menu--fixed${listinoMenuPosition.openUp ? " is-up" : ""}`} style={{ top: `${listinoMenuPosition.top}px`, left: `${listinoMenuPosition.left}px` }}><button type="button" className="acq-kebab-item" onClick={() => { openFirstDocument(item); setListinoMenuId(null); setListinoMenuPosition(null); }}>Apri documento</button><button type="button" className="acq-kebab-item" onClick={() => { setEditingListinoItem(item); setListinoMenuId(null); setListinoMenuPosition(null); }}>{LABELS_IT.menu.edit}</button><button type="button" className="acq-kebab-item acq-kebab-item--danger" onClick={() => { setListinoMenuId(null); setListinoMenuPosition(null); void handleEliminaVoceListino(item.id); }}>{LABELS_IT.menu.delete}</button></div> : null}</div></div></td></tr>; })}</tbody></table></div>
      {editingListinoItem ? <div className="acq-modal-backdrop" role="dialog" aria-modal="true" aria-label="Modifica voce listino" onClick={(event) => { if (event.target === event.currentTarget) setEditingListinoItem(null); }}><div className="acq-modal-card acq-listino-edit-modal"><div className="acq-link-foto-head"><div><h4>Modifica voce listino</h4><p className="acq-prev-draft-meta">{editingListinoItem.supplierName}</p></div><button type="button" className="acq-btn acq-btn--small" onClick={() => setEditingListinoItem(null)} aria-label="Chiudi">X</button></div><div className="acq-modal-grid"><label className="acq-prev-field"><span>Descrizione</span><input type="text" value={listinoForm.descrizione} onChange={(event) => setListinoForm((prev) => ({ ...prev, descrizione: event.target.value }))} /></label><label className="acq-prev-field"><span>Codice articolo (opzionale)</span><input type="text" value={listinoForm.codiceArticolo} onChange={(event) => setListinoForm((prev) => ({ ...prev, codiceArticolo: event.target.value }))} /></label><label className="acq-prev-field"><span>Unita</span><input type="text" value={listinoForm.unita} onChange={(event) => setListinoForm((prev) => ({ ...prev, unita: event.target.value }))} /></label><label className="acq-prev-field"><span>Valuta</span><select value={listinoForm.valuta} onChange={(event) => setListinoForm((prev) => ({ ...prev, valuta: event.target.value === "EUR" ? "EUR" : "CHF" }))}><option value="CHF">CHF</option><option value="EUR">EUR</option></select></label><label className="acq-prev-field"><span>Prezzo</span><input type="text" inputMode="decimal" value={listinoForm.prezzo} onChange={(event) => setListinoForm((prev) => ({ ...prev, prezzo: event.target.value }))} /></label><label className="acq-prev-field"><span>Data</span><input type="text" readOnly value={formatProcurementDateLabel(editingListinoItem.fonteDataPreventivo || editingListinoItem.updatedAtLabel || formatTodayLabel())} /></label></div><label className="acq-prev-field"><span>Note</span><textarea value={listinoForm.note} onChange={(event) => setListinoForm((prev) => ({ ...prev, note: event.target.value }))} /></label><div className="acq-listino-edit-doc">{hasAnyDocument(editingListinoItem) ? <button type="button" className="acq-btn" onClick={() => openFirstDocument(editingListinoItem)}>APRI DOCUMENTO</button> : <span className="acq-prev-draft-meta">Nessun documento collegato</span>}</div><div className="acq-prev-actions"><button type="button" className="acq-btn" onClick={() => setEditingListinoItem(null)} disabled={salvandoListino}>Annulla</button><button type="button" className="acq-btn acq-btn--primary" onClick={() => void salvaListinoVoce()} disabled={salvandoListino}>{salvandoListino ? "Salvataggio..." : "Salva"}</button></div></div></div> : null}
    </div></div></section>
  );
}
