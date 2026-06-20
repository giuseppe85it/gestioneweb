import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./internal-ai/internal-ai.css";
import { toDisplay } from "./helpers/dateUnica";
import {
  buildNextDossierPath,
  NEXT_LIBRETTI_EXPORT_PATH,
} from "./nextStructuralPaths";
import {
  deleteNextDocumentoCosto,
  readNextIADocumentiArchiveSnapshot,
  type NextDocumentiCostiCurrency,
  type NextDocumentiCostiLegacyViewItem,
  type NextIADocumentiArchiveItem,
  updateNextDocumentoCurrency,
} from "./domain/nextDocumentiCostiDomain";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import {
  readNextOfficineSnapshot,
  type NextOfficinaReadOnlyItem,
} from "./domain/nextOfficineDomain";
import {
  readNextFornitoriSnapshot,
  type NextFornitoreReadOnlyItem,
} from "./domain/nextFornitoriDomain";
import {
  readNextCentroControlloSnapshot,
  type D10MezzoItem,
  type D10SessionItem,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  buildAnagraficaMatchIndex,
  matchFornitoreText,
  type AnagraficaMatch,
  type AnagraficaMatchIndex,
} from "./domain/nextDocumentiAnagraficaMatch";

const NEXT_IA_ARCHIVISTA_PATH = "/next/ia/archivista";

type DocumentiCostiFilter =
  | "tutti"
  | "fatture"
  | "ddt"
  | "preventivi"
  | "da_verificare"
  | "libretti";

type DocumentiGroupKind = "officina" | "fornitore" | "libretto" | "nessuno";

type SupplierGroup = {
  key: string;
  groupKind: DocumentiGroupKind;
  displayName: string;
  anagraficaNome: string | null;
  items: NextIADocumentiArchiveItem[];
  total: number;
  totals: CurrencyTotals;
};

type ArchivistaPresetPayload = {
  tipo: "fattura_ddt" | "preventivo" | "documento_mezzo";
  contesto: "magazzino" | "manutenzione" | "documento_mezzo";
  fileUrl?: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: Record<string, unknown> | null;
};

const FILTERS: Array<{ id: DocumentiCostiFilter; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "fatture", label: "Fatture" },
  { id: "ddt", label: "DDT" },
  { id: "preventivi", label: "Preventivi" },
  { id: "da_verificare", label: "Da verificare" },
  { id: "libretti", label: "Libretti" },
];

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeType(item: NextIADocumentiArchiveItem) {
  return normalizeText(item.tipoDocumento).toUpperCase();
}

function parseAmount(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  let normalized = raw.toUpperCase();
  normalized = normalized.replace(/EUR|CHF|EURO/g, "");
  normalized = normalized.replace(/[\s'\u00A0]/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(
  value: string | number | null | undefined,
  currency: NextIADocumentiArchiveItem["currency"] = "EUR",
) {
  const parsed = parseAmount(value);
  if (parsed === null) {
    return "-";
  }

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency === "CHF" ? "CHF" : "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatMoneyCompact(value: number, currency: "EUR" | "CHF" = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

type CurrencyTotals = { eur: number; chf: number; unknown: number };

// Somma gli importi tenendo separate le valute (CHF/EUR) invece di sommarle
// in un unico totale "€". Gli importi senza valuta certa finiscono in "unknown".
function buildCurrencyTotals(items: NextIADocumentiArchiveItem[]): CurrencyTotals {
  const totals: CurrencyTotals = { eur: 0, chf: 0, unknown: 0 };
  for (const item of items) {
    const amount = parseAmount(item.totaleDocumento);
    if (amount === null) {
      continue;
    }
    const currency = normalizeText(item.currency).toUpperCase();
    if (currency === "CHF") {
      totals.chf += amount;
    } else if (currency === "EUR") {
      totals.eur += amount;
    } else {
      totals.unknown += amount;
    }
  }
  return totals;
}

// Mostra i totali per valuta: es. "1.200 CHF + 350 €", oppure il solo importo
// da verificare se manca la valuta. Non somma mai valute diverse insieme.
function formatCurrencyTotals(totals: CurrencyTotals): string {
  const parts: string[] = [];
  if (totals.chf > 0) {
    parts.push(formatMoneyCompact(totals.chf, "CHF"));
  }
  if (totals.eur > 0) {
    parts.push(formatMoneyCompact(totals.eur, "EUR"));
  }
  if (totals.unknown > 0) {
    parts.push(`${formatMoneyCompact(totals.unknown, "EUR")} da verificare`);
  }
  if (parts.length === 0) {
    return formatMoneyCompact(0, "EUR");
  }
  return parts.join(" + ");
}

function formatDate(item: NextIADocumentiArchiveItem) {
  if (typeof item.sortTimestamp === "number" && Number.isFinite(item.sortTimestamp)) {
    return toDisplay(item.sortTimestamp) || "-";
  }

  return toDisplay(item.dataDocumento) || normalizeText(item.dataDocumento) || "-";
}

function truncateText(value: string, maxLength: number) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildDescription(item: NextIADocumentiArchiveItem) {
  const fromCategory = normalizeText(item.categoriaArchivio);
  if (fromCategory) {
    return truncateText(fromCategory, 70);
  }

  const fromText = normalizeText(item.testo).replace(/\s+/g, " ");
  if (fromText) {
    return truncateText(fromText, 70);
  }

  return "Documento senza descrizione";
}

function isPreventivo(item: NextIADocumentiArchiveItem) {
  return normalizeType(item) === "PREVENTIVO";
}

function isDdt(item: NextIADocumentiArchiveItem) {
  const type = normalizeType(item);
  const archiveCategory = normalizeText(item.categoriaArchivio).toUpperCase();
  const numeroDocumento = normalizeText(item.numeroDocumento).toUpperCase();
  const testo = normalizeText(item.testo).toUpperCase();

  return (
    type === "DDT" ||
    archiveCategory.includes("DDT") ||
    numeroDocumento.includes("DDT") ||
    testo.includes("DDT")
  );
}

function isFattura(item: NextIADocumentiArchiveItem) {
  const type = normalizeType(item);
  return type === "FATTURA" || (item.sourceKey === "@documenti_magazzino" && !isPreventivo(item));
}

function isLibretto(item: NextIADocumentiArchiveItem) {
  return normalizeType(item) === "LIBRETTO";
}

function getItemKindLabel(item: NextIADocumentiArchiveItem) {
  if (isPreventivo(item)) return "PREVENTIVO";
  if (isDdt(item)) return "DDT";
  if (isFattura(item)) return "FATTURA";
  return normalizeType(item) || "DOCUMENTO";
}

function getItemBadgeClass(item: NextIADocumentiArchiveItem) {
  if (isPreventivo(item)) return "is-preventivo";
  if (isDdt(item)) return "is-ddt";
  return "is-fattura";
}

function buildSupplierLabel(item: NextIADocumentiArchiveItem) {
  return normalizeText(item.fornitore) || "Fornitore non specificato";
}

function mapArchiveItemToLegacyDocument(item: NextIADocumentiArchiveItem): NextDocumentiCostiLegacyViewItem {
  return {
    id: item.id,
    mezzoTarga: normalizeText(item.targa),
    targa: normalizeText(item.targa),
    tipo: isPreventivo(item) ? "PREVENTIVO" : "FATTURA",
    data: normalizeText(item.dataDocumento),
    timestamp: item.sortTimestamp,
    descrizione: buildDescription(item),
    importo: parseAmount(item.totaleDocumento) ?? undefined,
    valuta: item.currency ?? item.valuta ?? "UNKNOWN",
    currency: item.currency ?? item.valuta ?? "UNKNOWN",
    fornitoreLabel: buildSupplierLabel(item),
    fileUrl: item.fileUrl,
    sourceKey: item.sourceKey,
    sourceDocId: item.sourceDocId,
    quality: "certo",
    flags: [],
    dedupGroup: null,
  };
}

function buildReviewPath(item: NextIADocumentiArchiveItem) {
  void item;
  return NEXT_IA_ARCHIVISTA_PATH;
}

function buildArchivistaPresetDocumentFields(
  item: NextIADocumentiArchiveItem,
): Pick<
  ArchivistaPresetPayload,
  "fileUrl" | "sourceDocId" | "sourceKey" | "tipoDocumento" | "targa" | "archivistaAnalysis"
> {
  const fileUrl = normalizeText(item.fileUrl);
  const sourceDocId = normalizeText(item.sourceDocId);
  const sourceKey = normalizeText(item.sourceKey);
  const tipoDocumento = normalizeText(item.tipoDocumento);
  const targa = normalizeText(item.targa);

  return {
    ...(fileUrl ? { fileUrl } : {}),
    ...(sourceDocId ? { sourceDocId } : {}),
    ...(sourceKey ? { sourceKey } : {}),
    ...(tipoDocumento ? { tipoDocumento } : {}),
    ...(targa ? { targa } : {}),
    ...(item.archivistaAnalysis ? { archivistaAnalysis: item.archivistaAnalysis } : {}),
  };
}

function buildArchivistaPreset(item: NextIADocumentiArchiveItem): ArchivistaPresetPayload {
  const documentFields = buildArchivistaPresetDocumentFields(item);
  const famigliaArchivista = normalizeText(item.famigliaArchivista).toLowerCase();

  if (isLibretto(item)) {
    return { tipo: "documento_mezzo", contesto: "documento_mezzo", ...documentFields };
  }

  if (item.sourceKey === "@documenti_mezzi") {
    return { tipo: "fattura_ddt", contesto: "manutenzione", ...documentFields };
  }

  if (
    isPreventivo(item) &&
    (item.ambitoPreventivo === "manutenzione" ||
      famigliaArchivista === "preventivo_manutenzione")
  ) {
    return { tipo: "preventivo", contesto: "manutenzione", ...documentFields };
  }

  if (
    isPreventivo(item) &&
    (item.ambitoPreventivo === "magazzino" || famigliaArchivista === "preventivo_magazzino")
  ) {
    return { tipo: "preventivo", contesto: "magazzino", ...documentFields };
  }

  if (item.sourceKey === "@documenti_magazzino") {
    return { tipo: "fattura_ddt", contesto: "magazzino", ...documentFields };
  }

  if (isPreventivo(item)) {
    return { tipo: "preventivo", contesto: "magazzino", ...documentFields };
  }

  return { tipo: "fattura_ddt", contesto: "magazzino", ...documentFields };
}

function matchesSearch(item: NextIADocumentiArchiveItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (
    buildSupplierLabel(item).toLowerCase().includes(normalizedQuery) ||
    normalizeText(item.targa).toLowerCase().includes(normalizedQuery) ||
    normalizeText(item.totaleDocumento).toLowerCase().includes(normalizedQuery)
  );
}

function sortItems(items: NextIADocumentiArchiveItem[]) {
  return [...items].sort((left, right) => {
    const timestampDelta = (right.sortTimestamp ?? -1) - (left.sortTimestamp ?? -1);
    if (timestampDelta !== 0) {
      return timestampDelta;
    }

    const dateDelta = normalizeText(right.dataDocumento).localeCompare(
      normalizeText(left.dataDocumento),
      "it",
      { sensitivity: "base" },
    );
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return normalizeText(left.numeroDocumento).localeCompare(
      normalizeText(right.numeroDocumento),
      "it",
      { sensitivity: "base" },
    );
  });
}

function buildMezziByTarga(snapshot: D10Snapshot | null): Map<string, D10MezzoItem> {
  const result = new Map<string, D10MezzoItem>();
  snapshot?.mezzi.forEach((mezzo) => {
    if (mezzo.targa) {
      result.set(mezzo.targa, mezzo);
    }
  });
  return result;
}

function buildSessioniByTarga(snapshot: D10Snapshot | null): Map<string, D10SessionItem> {
  const result = new Map<string, D10SessionItem>();
  snapshot?.sessioni.forEach((sessione) => {
    if (sessione.targaMotrice) {
      result.set(sessione.targaMotrice, sessione);
    }
    if (sessione.targaRimorchio) {
      result.set(sessione.targaRimorchio, sessione);
    }
  });
  return result;
}

export default function NextIADocumentiPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NextIADocumentiArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filtroAttivo, setFiltroAttivo] = useState<DocumentiCostiFilter>("tutti");
  const [searchQuery, setSearchQuery] = useState("");
  const [sezioniAperte, setSezioniAperte] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem] = useState<NextIADocumentiArchiveItem | null>(null);
  const [localDaVerificareIds, setLocalDaVerificareIds] = useState<Set<string>>(new Set());
  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null);
  const [editingCurrencyValue, setEditingCurrencyValue] = useState<NextDocumentiCostiCurrency>("EUR");
  const [savingCurrencyId, setSavingCurrencyId] = useState<string | null>(null);
  const [currencyErrorMessage, setCurrencyErrorMessage] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [officine, setOfficine] = useState<NextOfficinaReadOnlyItem[]>([]);
  const [fornitori, setFornitori] = useState<NextFornitoreReadOnlyItem[]>([]);
  const [centroSnapshot, setCentroSnapshot] = useState<D10Snapshot | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadArchive = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const snapshot = await readNextIADocumentiArchiveSnapshot({
          includeCloneDocuments: false,
        });
        if (cancelled) {
          return;
        }

        setItems(snapshot.items);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Errore durante il caricamento dei documenti.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadArchive();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAnagrafiche = async () => {
      try {
        const [officineSnapshot, fornitoriSnapshot, centro] = await Promise.all([
          readNextOfficineSnapshot(),
          readNextFornitoriSnapshot(),
          readNextCentroControlloSnapshot(),
        ]);
        if (cancelled) {
          return;
        }
        setOfficine(officineSnapshot.items);
        setFornitori(fornitoriSnapshot.items);
        setCentroSnapshot(centro);
      } catch {
        // Abbinamento anagrafica e tooltip mezzo sono opzionali: in caso di errore
        // i documenti restano "Non in anagrafica" e il tooltip non viene mostrato.
      }
    };

    void loadAnagrafiche();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const closeMenu = () => setOpenMenuId(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!modalItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalItem]);

  const matchIndex = useMemo<AnagraficaMatchIndex>(
    () => buildAnagraficaMatchIndex(officine, fornitori),
    [officine, fornitori],
  );

  const matchByItemId = useMemo(() => {
    const map = new Map<string, AnagraficaMatch>();
    for (const item of items) {
      map.set(item.id, matchFornitoreText(item.fornitore, matchIndex));
    }
    return map;
  }, [items, matchIndex]);

  const mezziByTarga = useMemo(() => buildMezziByTarga(centroSnapshot), [centroSnapshot]);
  const sessioniByTarga = useMemo(() => buildSessioniByTarga(centroSnapshot), [centroSnapshot]);

  const itemsFiltrati = useMemo(() => {
    return items
      .filter((item) => {
        const isLocallyMarked = localDaVerificareIds.has(item.id);
        const isReviewItem = item.daVerificare || isLocallyMarked;

        if (filtroAttivo === "fatture") return isFattura(item) && !isDdt(item);
        if (filtroAttivo === "ddt") return isDdt(item);
        if (filtroAttivo === "preventivi") return isPreventivo(item);
        if (filtroAttivo === "da_verificare") return isReviewItem;
        if (filtroAttivo === "libretti") return isLibretto(item);
        return true;
      })
      .filter((item) => matchesSearch(item, searchQuery));
  }, [items, filtroAttivo, localDaVerificareIds, searchQuery]);

  const perFornitore = useMemo<SupplierGroup[]>(() => {
    // Nel filtro "Libretti" i documenti si raggruppano per TARGA (non per fornitore).
    // Negli altri filtri la chiave è l'ENTITÀ anagrafica abbinata (officina/fornitore),
    // così grafie diverse dello stesso nome confluiscono nello stesso gruppo; in assenza
    // di match si raggruppa per testo del campo fornitore.
    const raggruppaPerTarga = filtroAttivo === "libretti";
    const grouped = new Map<string, NextIADocumentiArchiveItem[]>();

    for (const item of itemsFiltrati) {
      let key: string;
      if (raggruppaPerTarga) {
        key = `targa:${normalizeText(item.targa) || "Senza targa"}`;
      } else {
        const match = matchByItemId.get(item.id);
        if (match?.kind === "officina") {
          key = `officina:${match.id}`;
        } else if (match?.kind === "fornitore") {
          key = `fornitore:${match.id}`;
        } else {
          key = `testo:${buildSupplierLabel(item)}`;
        }
      }
      const group = grouped.get(key) ?? [];
      group.push(item);
      grouped.set(key, group);
    }

    return Array.from(grouped.entries())
      .map(([key, supplierItems]) => {
        const first = supplierItems[0];
        const match = first ? matchByItemId.get(first.id) : undefined;
        let groupKind: DocumentiGroupKind;
        let displayName: string;
        let anagraficaNome: string | null;

        if (raggruppaPerTarga) {
          groupKind = "libretto";
          displayName = normalizeText(first?.targa) || "Senza targa";
          anagraficaNome = null;
        } else if (match?.kind === "officina") {
          groupKind = "officina";
          displayName = match.nome;
          anagraficaNome = match.nome;
        } else if (match?.kind === "fornitore") {
          groupKind = "fornitore";
          displayName = match.nome;
          anagraficaNome = match.nome;
        } else {
          groupKind = "nessuno";
          displayName = first ? buildSupplierLabel(first) : "Fornitore non specificato";
          anagraficaNome = null;
        }

        return {
          key,
          groupKind,
          displayName,
          anagraficaNome,
          items: sortItems(supplierItems),
          total: supplierItems.reduce((sum, item) => sum + (parseAmount(item.totaleDocumento) ?? 0), 0),
          totals: buildCurrencyTotals(supplierItems),
        };
      })
      .sort((left, right) => {
        if (raggruppaPerTarga) {
          return left.displayName.localeCompare(right.displayName, "it", {
            numeric: true,
            sensitivity: "base",
          });
        }

        if (right.total !== left.total) {
          return right.total - left.total;
        }

        return left.displayName.localeCompare(right.displayName, "it", {
          sensitivity: "base",
        });
      });
  }, [itemsFiltrati, filtroAttivo, matchByItemId]);

  useEffect(() => {
    if (perFornitore.length === 0) {
      return;
    }

    setSezioniAperte((prev) => {
      const next = new Set(prev);
      for (const group of perFornitore) {
        next.add(group.key);
      }
      return next;
    });
  }, [perFornitore]);

  const { nOfficine, nFornitori } = useMemo(() => {
    const officineIds = new Set<string>();
    const fornitoriIds = new Set<string>();
    for (const item of itemsFiltrati) {
      const match = matchByItemId.get(item.id);
      if (match?.kind === "officina") {
        officineIds.add(match.id);
      } else if (match?.kind === "fornitore") {
        fornitoriIds.add(match.id);
      }
    }
    return { nOfficine: officineIds.size, nFornitori: fornitoriIds.size };
  }, [itemsFiltrati, matchByItemId]);

  const modalIsMarkedDaVerificare = modalItem
    ? modalItem.daVerificare || localDaVerificareIds.has(modalItem.id)
    : false;

  const modalMatch = modalItem ? matchByItemId.get(modalItem.id) : undefined;

  const toggleFornitore = (supplier: string) => {
    setSezioniAperte((prev) => {
      const next = new Set(prev);
      if (next.has(supplier)) {
        next.delete(supplier);
      } else {
        next.add(supplier);
      }
      return next;
    });
  };

  const handleOpenPdf = (event: React.MouseEvent, item: NextIADocumentiArchiveItem) => {
    event.stopPropagation();
    if (!item.fileUrl) {
      return;
    }
    window.open(item.fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleReopenReview = (event: React.MouseEvent, item: NextIADocumentiArchiveItem) => {
    event.stopPropagation();
    navigate(buildReviewPath(item), {
      state: {
        archivistaPreset: buildArchivistaPreset(item),
      },
    });
  };

  const handleDeleteDocumento = async (
    event: React.MouseEvent,
    item: NextIADocumentiArchiveItem,
  ) => {
    event.stopPropagation();
    try {
      setDeletingDocumentId(item.id);
      await runWithCloneWriteScopedAllowance(
        "internal_ai_magazzino_inline_magazzino",
        async () => deleteNextDocumentoCosto(mapArchiveItemToLegacyDocument(item)),
      );
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Eliminazione documento non completata.",
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const toggleLocalReviewById = (id: string) => {
    setLocalDaVerificareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleLocalReview = () => {
    if (!modalItem) {
      return;
    }
    toggleLocalReviewById(modalItem.id);
  };

  const openCurrencyEditor = (
    event: React.MouseEvent,
    item: NextIADocumentiArchiveItem,
    forcedCurrency?: NextDocumentiCostiCurrency,
  ) => {
    event.stopPropagation();
    setCurrencyErrorMessage(null);
    setEditingCurrencyId(item.id);
    setEditingCurrencyValue(
      forcedCurrency ?? (item.currency === "UNKNOWN" ? "EUR" : item.currency ?? item.valuta ?? "EUR"),
    );
  };

  const cancelCurrencyEditor = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingCurrencyId(null);
    setSavingCurrencyId(null);
    setCurrencyErrorMessage(null);
  };

  const handleSaveCurrency = async (event: React.MouseEvent, item: NextIADocumentiArchiveItem) => {
    event.stopPropagation();
    try {
      setSavingCurrencyId(item.id);
      setCurrencyErrorMessage(null);
      await runWithCloneWriteScopedAllowance(
        "internal_ai_magazzino_inline_magazzino",
        async () => updateNextDocumentoCurrency(mapArchiveItemToLegacyDocument(item), editingCurrencyValue),
      );
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, currency: editingCurrencyValue, valuta: editingCurrencyValue }
            : entry,
        ),
      );
      setEditingCurrencyId(null);
    } catch (error) {
      setCurrencyErrorMessage(
        error instanceof Error ? error.message : "Aggiornamento valuta non completato.",
      );
    } finally {
      setSavingCurrencyId(null);
    }
  };

  const renderMiniDossier = (targa: string) => {
    const mezzo = mezziByTarga.get(targa) ?? null;
    const sessione = sessioniByTarga.get(targa) ?? null;
    if (!mezzo && !sessione) {
      return null;
    }
    const sessLabel = sessione
      ? `${sessione.nomeAutista ?? "Autista non indicato"}${
          sessione.badgeAutista ? ` (${sessione.badgeAutista})` : ""
        }`
      : "no";
    return (
      <div className="doc-costi-mini-dossier" role="tooltip">
        <div className="doc-costi-mini-photo">
          {mezzo?.fotoUrl ? (
            <img src={mezzo.fotoUrl} alt={`Foto mezzo ${targa}`} />
          ) : (
            <span>Nessuna foto</span>
          )}
        </div>
        <div className="doc-costi-mini-content">
          <div className="doc-costi-mini-title">{targa}</div>
          <div className="doc-costi-mini-row">
            <span>Categoria</span>
            <strong>{mezzo?.categoria ?? "Non indicata"}</strong>
          </div>
          <div className="doc-costi-mini-row">
            <span>Autista abituale</span>
            <strong>{mezzo?.autistaNome ?? "Non indicato"}</strong>
          </div>
          <div className="doc-costi-mini-row">
            <span>Sessione attiva</span>
            <strong>{sessLabel}</strong>
          </div>
          {sessione?.statoSessione ? (
            <div className="doc-costi-mini-row">
              <span>Stato</span>
              <strong>{sessione.statoSessione}</strong>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderVistaLibretti = () => {
    const libretti = itemsFiltrati;
    if (libretti.length === 0) {
      return (
        <div className="doc-costi-empty">
          {searchQuery ? "Nessun libretto corrisponde alla ricerca" : "Nessun libretto trovato"}
        </div>
      );
    }

    const perCategoria = new Map<string, NextIADocumentiArchiveItem[]>();
    for (const lib of libretti) {
      const targa = normalizeText(lib.targa);
      const categoria = mezziByTarga.get(targa)?.categoria || "Altro";
      const arr = perCategoria.get(categoria) ?? [];
      arr.push(lib);
      perCategoria.set(categoria, arr);
    }
    const categorie = [...perCategoria.keys()].sort((a, b) => a.localeCompare(b, "it"));

    return (
      <div className="doc-costi-libretti">
        <div className="doc-costi-libretti-bar">
          <span className="doc-costi-libretti-title">Libretti per categoria</span>
          <span className="doc-costi-libretti-sub">{libretti.length} libretti</span>
          <button
            type="button"
            className="doc-costi-libretti-export"
            onClick={() => navigate(NEXT_LIBRETTI_EXPORT_PATH)}
          >
            ⤓ Export libretti
          </button>
        </div>

        {categorie.map((categoria) => (
          <div key={categoria} className="doc-costi-libretti-cat">
            <div className="doc-costi-libretti-cat-head">{categoria.toUpperCase()}</div>
            <div className="doc-costi-libretti-grid">
              {(perCategoria.get(categoria) ?? [])
                .slice()
                .sort((a, b) =>
                  normalizeText(a.targa).localeCompare(normalizeText(b.targa), "it", {
                    numeric: true,
                    sensitivity: "base",
                  }),
                )
                .map((lib) => (
                  <button
                    type="button"
                    key={lib.id}
                    className="doc-costi-libretto-card"
                    onClick={() => setModalItem(lib)}
                  >
                    <span className="doc-costi-libretto-thumb">Libretto</span>
                    <span className="doc-costi-libretto-ft">
                      <strong>{normalizeText(lib.targa) || "—"}</strong>
                      <span className="doc-costi-libretto-ok">✓ Libretto</span>
                    </span>
                    <span className="doc-costi-libretto-catlabel">
                      {mezziByTarga.get(normalizeText(lib.targa))?.categoria || "Altro"}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="next-page doc-costi-page">
      <header className="doc-costi-header">
        <h1 className="doc-costi-title">Documenti e costi</h1>
        {filtroAttivo === "libretti" ? (
          <span className="doc-costi-stat">
            <b>{itemsFiltrati.length}</b> libretti
          </span>
        ) : (
          <>
            <span className="doc-costi-stat">
              <b>{itemsFiltrati.length}</b> doc
            </span>
            <span className="doc-costi-stat">
              <b>{nOfficine}</b> officine
            </span>
            <span className="doc-costi-stat">
              <b>{nFornitori}</b> fornitori
            </span>
          </>
        )}
      </header>

      <div className="doc-costi-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`doc-costi-filter ${filtroAttivo === filter.id ? "is-active" : ""}`}
            onClick={() => setFiltroAttivo(filter.id)}
          >
            {filter.label}
          </button>
        ))}

        <input
          type="search"
          className="doc-costi-search"
          placeholder="Cerca fornitore, targa, importo"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {loading ? <div className="doc-costi-loading">Caricamento documenti...</div> : null}

      {!loading && errorMessage ? <div className="doc-costi-empty">{errorMessage}</div> : null}

      {!loading && !errorMessage && filtroAttivo === "libretti" ? renderVistaLibretti() : null}

      {!loading && !errorMessage && filtroAttivo !== "libretti" && perFornitore.length === 0 ? (
        <div className="doc-costi-empty">
          {filtroAttivo === "tutti" && !searchQuery
            ? "Nessun documento trovato"
            : "Nessun documento corrisponde al filtro selezionato"}
        </div>
      ) : null}

      {!loading &&
        !errorMessage &&
        filtroAttivo !== "libretti" &&
        perFornitore.map((group) => {
          const isOpen = sezioniAperte.has(group.key);

          return (
            <section key={group.key} className="doc-costi-fornitore">
              <button
                type="button"
                className="doc-costi-fornitore-header"
                onClick={() => toggleFornitore(group.key)}
              >
                <span
                  className={`doc-costi-fornitore-chevron ${isOpen ? "is-open" : ""}`}
                  aria-hidden="true"
                >
                  &gt;
                </span>
                <span className="doc-costi-fornitore-name">{group.displayName}</span>
                <span className={`doc-costi-group-badge is-${group.groupKind}`}>
                  {group.groupKind === "officina"
                    ? "🔧 Officina · anagrafica"
                    : group.groupKind === "fornitore"
                      ? "🏢 Fornitore · anagrafica"
                      : group.groupKind === "libretto"
                        ? "📋 Libretto"
                        : "Non in anagrafica"}
                </span>
                <span className="doc-costi-stat">
                  <b>{group.items.length}</b> doc
                </span>
                <span className="doc-costi-fornitore-total">
                  Totale {formatCurrencyTotals(group.totals)}
                </span>
              </button>

              {isOpen ? (
                <>
                  <table className="doc-costi-table">
                    <thead>
                      <tr>
                        <th>Origine</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>N. doc.</th>
                        <th>Descrizione</th>
                        <th className="is-right">EUR</th>
                        <th aria-label="Azioni"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => {
                        const isMarkedDaVerificare =
                          item.daVerificare || localDaVerificareIds.has(item.id);

                        return (
                          <tr key={item.id} onClick={() => setModalItem(item)}>
                            <td>
                              {normalizeText(item.targa) ? (
                                <span className="doc-costi-origine-wrap">
                                  <a
                                    href={buildNextDossierPath(normalizeText(item.targa))}
                                    className="doc-costi-targa"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      navigate(buildNextDossierPath(normalizeText(item.targa)));
                                    }}
                                  >
                                    {normalizeText(item.targa)}
                                  </a>
                                  {renderMiniDossier(normalizeText(item.targa))}
                                </span>
                              ) : item.sourceKey === "@documenti_magazzino" ? (
                                <span className="doc-costi-origine-badge is-magazzino">
                                  📦 Magazzino
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              <span className={`doc-costi-badge ${getItemBadgeClass(item)}`}>
                                {getItemKindLabel(item)}
                              </span>
                            </td>
                            <td>{formatDate(item)}</td>
                            <td>{normalizeText(item.numeroDocumento) || "-"}</td>
                            <td>{buildDescription(item)}</td>
                            <td className="doc-costi-importo">
                              {formatMoney(item.totaleDocumento, item.currency)}
                              {editingCurrencyId === item.id ? (
                                <span
                                  style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 8 }}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <select
                                    value={editingCurrencyValue}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      setEditingCurrencyValue(
                                        event.target.value as NextDocumentiCostiCurrency,
                                      )
                                    }
                                  >
                                    <option value="EUR">EUR</option>
                                    <option value="CHF">CHF</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="doc-costi-btn"
                                    onClick={(event) => void handleSaveCurrency(event, item)}
                                    disabled={savingCurrencyId === item.id}
                                  >
                                    {savingCurrencyId === item.id ? "Salvataggio..." : "Salva"}
                                  </button>
                                  <button
                                    type="button"
                                    className="doc-costi-btn"
                                    onClick={cancelCurrencyEditor}
                                    disabled={savingCurrencyId === item.id}
                                  >
                                    Annulla
                                  </button>
                                </span>
                              ) : normalizeText(item.currency) === "UNKNOWN" ? (
                                <button
                                  type="button"
                                  className="doc-costi-row-flag"
                                  style={{ marginLeft: 8 }}
                                  onClick={(event) => openCurrencyEditor(event, item, "EUR")}
                                >
                                  Valuta da verificare
                                </button>
                              ) : normalizeText(item.currency) &&
                                normalizeText(item.currency) !== "EUR" ? (
                                <span
                                  className="doc-costi-valuta"
                                  title={
                                    item.valutaEreditata
                                      ? "Valuta dedotta dalla valuta predefinita del fornitore"
                                      : undefined
                                  }
                                >
                                  {item.currency}
                                  {item.valutaEreditata ? " (dedotta)" : ""}
                                </span>
                              ) : item.valutaEreditata ? (
                                <span
                                  className="doc-costi-valuta"
                                  title="Valuta dedotta dalla valuta predefinita del fornitore"
                                >
                                  EUR (dedotta)
                                </span>
                              ) : null}
                            </td>
                            <td
                              className="doc-costi-menu-cell"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="doc-costi-menu-trigger"
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === item.id}
                                aria-label="Azioni documento"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenMenuId((current) => (current === item.id ? null : item.id));
                                }}
                              >
                                ⋮
                              </button>
                              {openMenuId === item.id ? (
                                <div
                                  className="doc-costi-menu"
                                  role="menu"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="doc-costi-menu-item"
                                    onClick={(event) => {
                                      handleOpenPdf(event, item);
                                      setOpenMenuId(null);
                                    }}
                                    disabled={!item.fileUrl}
                                  >
                                    Apri PDF
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="doc-costi-menu-item"
                                    onClick={(event) => {
                                      handleReopenReview(event, item);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Riapri review
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="doc-costi-menu-item"
                                    onClick={(event) => {
                                      openCurrencyEditor(event, item);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Modifica valuta
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    className="doc-costi-menu-item"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleLocalReviewById(item.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    {isMarkedDaVerificare ? "Togli da verificare" : "Da verificare"}
                                  </button>
                                </div>
                              ) : null}
                              {isMarkedDaVerificare ? (
                                <span className="doc-costi-row-flag">Da verificare</span>
                              ) : null}
                              {currencyErrorMessage && editingCurrencyId === item.id ? (
                                <span className="doc-costi-row-flag">{currencyErrorMessage}</span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="doc-costi-section-total">
                    <span className="doc-costi-stat">
                      Totale {group.displayName}: <b>{formatCurrencyTotals(group.totals)}</b>
                    </span>
                  </div>
                </>
              ) : null}
            </section>
          );
        })}

      <div
        className={`doc-costi-modal-overlay ${modalItem ? "is-open" : ""}`}
        onClick={() => setModalItem(null)}
      >
        {modalItem ? (
          <div className="doc-costi-modal" onClick={(event) => event.stopPropagation()}>
            <div className="doc-costi-modal-header">
              <div className="doc-costi-modal-title">
                [{getItemKindLabel(modalItem)}]{" "}
                {modalMatch && modalMatch.kind !== "nessuno"
                  ? modalMatch.nome
                  : buildSupplierLabel(modalItem)}{" "}
                - {normalizeText(modalItem.numeroDocumento) || "Numero non disponibile"}
              </div>
              <button
                type="button"
                className="doc-costi-modal-close"
                onClick={() => setModalItem(null)}
              >
                Chiudi
              </button>
            </div>

            <div className="doc-costi-modal-body">
              <div className="doc-costi-modal-fields">
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">
                    {modalMatch?.kind === "officina" ? "Officina" : "Fornitore"}
                  </span>
                  <span className="doc-costi-modal-field-val">
                    {modalMatch && modalMatch.kind !== "nessuno" ? (
                      <>
                        {modalMatch.nome}{" "}
                        <span className="doc-costi-anagrafica-pill">da anagrafica</span>
                      </>
                    ) : (
                      buildSupplierLabel(modalItem)
                    )}
                  </span>
                </div>
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">Data</span>
                  <span className="doc-costi-modal-field-val">{formatDate(modalItem)}</span>
                </div>
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">Numero</span>
                  <span className="doc-costi-modal-field-val">
                    {normalizeText(modalItem.numeroDocumento) || "-"}
                  </span>
                </div>
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">Targa</span>
                  <span className="doc-costi-modal-field-val">
                    {normalizeText(modalItem.targa) || "-"}
                  </span>
                </div>
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">Importo</span>
                  <span className="doc-costi-modal-field-val">
                    {formatMoney(modalItem.totaleDocumento, modalItem.currency)}
                  </span>
                </div>
                <div className="doc-costi-modal-field">
                  <span className="doc-costi-modal-field-label">Valuta</span>
                  <span className="doc-costi-modal-field-val">
                    {normalizeText(modalItem.currency) || "—"}
                  </span>
                </div>
              </div>

              {isLibretto(modalItem) ? (
                <div className="doc-costi-modal-preview">
                  {modalItem.fileUrl ? (
                    <iframe
                      className="doc-costi-modal-preview-frame"
                      src={modalItem.fileUrl}
                      title="Anteprima libretto"
                    />
                  ) : (
                    <p className="doc-costi-modal-empty">Anteprima non disponibile</p>
                  )}
                </div>
              ) : null}

              <div className="doc-costi-modal-actions">
                <button
                  type="button"
                  className="doc-costi-modal-btn-primary"
                  onClick={() => {
                    if (!modalItem.fileUrl) {
                      return;
                    }
                    window.open(modalItem.fileUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!modalItem.fileUrl}
                >
                  Apri PDF originale
                </button>
                <button
                  type="button"
                  className="doc-costi-modal-btn-secondary"
                  aria-pressed={modalIsMarkedDaVerificare}
                  onClick={handleToggleLocalReview}
                >
                  Da verificare
                </button>
                <button
                  type="button"
                  className="doc-costi-modal-btn-secondary"
                  onClick={() =>
                    navigate(buildReviewPath(modalItem), {
                      state: {
                        archivistaPreset: buildArchivistaPreset(modalItem),
                      },
                    })
                  }
                >
                  Riapri review
                </button>
                {isLibretto(modalItem) ? (
                  <button
                    type="button"
                    className="doc-costi-modal-btn-secondary"
                    onClick={(event) => {
                      if (!window.confirm("Eliminare questo libretto?")) {
                        return;
                      }
                      void handleDeleteDocumento(event, modalItem).then(() => setModalItem(null));
                    }}
                    disabled={deletingDocumentId === modalItem.id}
                  >
                    {deletingDocumentId === modalItem.id ? "Elimino..." : "Elimina libretto"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
