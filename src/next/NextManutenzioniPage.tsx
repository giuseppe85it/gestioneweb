import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateSmartPDF } from "../utils/pdfEngine";
import NextMappaStoricoPage from "./NextMappaStoricoPage";
import NextModalGomme, { type CambioGommeData } from "./autisti/NextModalGomme";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import {
  deleteNextManutenzioneBusinessRecord,
  readNextManutenzioniWorkspaceSnapshot,
  saveNextManutenzioneBusinessRecord,
  type NextManutenzioniLegacyDatasetRecord,
  type NextManutenzioniLegacyMaterialRecord,
  type NextManutenzioniMezzoOption,
} from "./domain/nextManutenzioniDomain";
import { readNextLavoriInAttesaSnapshot } from "./domain/nextLavoriDomain";
import { readNextRifornimentiReadOnlySnapshot } from "./domain/nextRifornimentiDomain";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
} from "./nextAnagraficheFlottaDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";
import "./next-mappa-storico.css";
import "../pages/Manutenzioni.css";

type TipoVoce = "mezzo" | "compressore";
type SottoTipo = "motrice" | "trattore";
type ViewTab = "dashboard" | "form" | "pdf" | "mappa";
type PdfPeriodFilter = "ultimo-mese" | "tutto" | `mese:${string}`;
type StoricoVisualKind = "mezzo" | "compressore" | "tagliando" | "derivato";
type MappaPhotoView = "fronte" | "sinistra" | "destra" | "retro";

type MaterialeManutenzione = NextManutenzioniLegacyMaterialRecord;

type MaterialeInventario = {
  id: string;
  label: string;
  quantitaTotale: number;
  unita: string;
  fornitoreLabel?: string | null;
};

type MezzoPreview = {
  id: string;
  targa: string;
  label: string;
  categoria: string | null;
  marcaModello: string | null;
  autistaNome: string | null;
  fotoUrl: string | null;
};

type PageLoadData = {
  storico: NextManutenzioniLegacyDatasetRecord[];
  mezzi: NextManutenzioniMezzoOption[];
  materialiInventario: MaterialeInventario[];
  mezzoPreview: MezzoPreview[];
  kmUltimoByTarga: Record<string, number | null>;
  lavoriInAttesaByTarga: Record<string, number>;
};

const MESE_LABEL = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
});

const TAGLIANDO_COMPONENTI = [
  "olio motore",
  "olio idraulico",
  "filtri",
  "cinghie",
  "lubrificazione",
];

const MAPPA_FOTO_VIEWS: Array<{ key: MappaPhotoView; label: string }> = [
  { key: "fronte", label: "Fronte" },
  { key: "sinistra", label: "Sinistra" },
  { key: "destra", label: "Destra" },
  { key: "retro", label: "Retro" },
];

function todayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

function normalizeText(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeFreeText(value: string) {
  return value.trim();
}

function parseLegacyDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim().replace(/[./-]/g, " ");
  const match = normalized.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/);
  if (!match) return null;
  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const monthIndex = Number(monthRaw) - 1;
  let year = Number(yearRaw);
  if (!Number.isFinite(day) || !Number.isFinite(monthIndex) || !Number.isFinite(year)) return null;
  if (yearRaw.length === 2) year += year >= 70 ? 1900 : 2000;
  const parsed = new Date(year, monthIndex, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getLegacyDateTimestamp(value: string | null | undefined) {
  return parseLegacyDate(value)?.getTime() ?? 0;
}

function buildMonthFilterKey(value: string | null | undefined): PdfPeriodFilter | null {
  const parsed = parseLegacyDate(value);
  if (!parsed) return null;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `mese:${parsed.getFullYear()}-${month}`;
}

function formatMonthFilterLabel(filter: PdfPeriodFilter) {
  if (filter === "ultimo-mese") return "Ultimo mese";
  if (filter === "tutto") return "Tutto";
  const [, key] = filter.split(":");
  const [yearRaw, monthRaw] = key.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return key;
  return MESE_LABEL.format(new Date(year, monthIndex, 1));
}

function classifyStoricoRecord(item: NextManutenzioniLegacyDatasetRecord): StoricoVisualKind {
  const descrizione = item.descrizione.toUpperCase();
  if (descrizione.includes("TAGLIANDO")) return "tagliando";
  if (
    descrizione.includes("SEGNALAZ")
    || descrizione.includes("CONTROLLO KO")
    || descrizione.includes("CAMBIO GOMME")
  ) {
    return "derivato";
  }
  return item.tipo === "compressore" ? "compressore" : "mezzo";
}

function getVisualKindLabel(kind: StoricoVisualKind) {
  switch (kind) {
    case "compressore":
      return "Compressore";
    case "tagliando":
      return "Tagliando";
    case "derivato":
      return "Derivato";
    default:
      return "Mezzo";
  }
}

function buildDescrizioneSnippet(value: string, limit = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1)}…`;
}

function buildTagliandoHint(item: NextManutenzioniLegacyDatasetRecord) {
  if (!item.descrizione.toUpperCase().includes("TAGLIANDO")) return null;
  const materiali = item.materiali?.map((entry) => entry.label).filter(Boolean) ?? [];
  const componenti = [...new Set([...TAGLIANDO_COMPONENTI, ...materiali])].slice(0, 4);
  return componenti.length > 0 ? componenti.join(" · ") : "Componenti multipli inclusi";
}

function mapMezzoPreview(
  mezzo: NextMezzoListItem,
  fallbackByTarga: Map<string, NextManutenzioniMezzoOption>,
): MezzoPreview {
  const fallback = fallbackByTarga.get(normalizeText(mezzo.targa));
  const brandModel = normalizeFreeText(mezzo.marcaModello || [mezzo.marca, mezzo.modello].filter(Boolean).join(" "));

  return {
    id: mezzo.id,
    targa: normalizeText(mezzo.targa),
    label: fallback?.label || `${normalizeText(mezzo.targa)} - ${brandModel || "Mezzo"}`,
    categoria: normalizeFreeText(mezzo.categoria) || fallback?.categoria || null,
    marcaModello: brandModel || null,
    autistaNome: normalizeFreeText(mezzo.autistaNome || "") || null,
    fotoUrl: mezzo.fotoUrl ?? null,
  };
}

function mapInventoryItem(item: NextInventarioReadOnlyItem): MaterialeInventario {
  return {
    id: item.id,
    label: item.descrizione,
    quantitaTotale: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    fornitoreLabel: item.fornitore ?? null,
  };
}

function buildMisuraLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.tipo === "mezzo") {
    return item.km != null ? `${item.km} KM` : "-";
  }
  return item.ore != null ? `${item.ore} ORE` : "-";
}

function toMaterialiTemp(
  items: NextManutenzioniLegacyDatasetRecord["materiali"],
): MaterialeManutenzione[] {
  if (!items?.length) return [];
  return items.map((item, index) => ({
    id: item.id || `materiale:${index}`,
    label: item.label,
    quantita: item.quantita,
    unita: item.unita,
    fromInventario: item.fromInventario,
    refId: item.refId,
  }));
}

function integraDescrizioneConGomme(data: CambioGommeData, previous: string): string {
  const blocco = [
    `CAMBIO GOMME - ${data.modalita === "ordinario" ? "ordinario" : "straordinario"}`,
    data.categoria ? `Categoria mezzo: ${data.categoria}` : "",
    data.asseLabel ? `Asse: ${data.asseLabel}` : "",
    `Gomme cambiate: ${data.numeroGomme}`,
    data.marca ? `Marca: ${data.marca}` : "",
    data.km ? `Km mezzo: ${data.km}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return previous.trim() ? `${previous.trim()}\n\n${blocco}` : blocco;
}

async function readPageData(): Promise<PageLoadData> {
  const [workspace, inventorySnapshot, flottaSnapshot, rifornimentiSnapshot, lavoriSnapshot] = await Promise.all([
    readNextManutenzioniWorkspaceSnapshot(),
    readNextInventarioSnapshot({ includeCloneOverlays: false }),
    readNextAnagraficheFlottaSnapshot({ includeClonePatches: false }),
    readNextRifornimentiReadOnlySnapshot(),
    readNextLavoriInAttesaSnapshot({ includeCloneOverlays: false }),
  ]);

  const fallbackByTarga = new Map(
    workspace.mezzi.map((mezzo) => [normalizeText(mezzo.targa), mezzo] as const),
  );
  const mezzoPreview = flottaSnapshot.items.map((item) => mapMezzoPreview(item, fallbackByTarga));

  const kmUltimoByTarga = rifornimentiSnapshot.items.reduce<Record<string, number | null>>((acc, item) => {
    const targa = normalizeText(item.mezzoTarga || item.targa || "");
    if (!targa || item.km == null) return acc;
    const currentTimestamp = item.timestampRicostruito ?? item.timestamp ?? 0;
    const previousValue = acc[targa];
    if (previousValue == null) {
      acc[targa] = item.km;
      return acc;
    }
    const previousRow = rifornimentiSnapshot.items.find(
      (entry) =>
        normalizeText(entry.mezzoTarga || entry.targa || "") === targa
        && entry.km === previousValue,
    );
    const previousTimestamp = previousRow?.timestampRicostruito ?? previousRow?.timestamp ?? 0;
    if (currentTimestamp >= previousTimestamp) {
      acc[targa] = item.km;
    }
    return acc;
  }, {});

  const lavoriInAttesaByTarga = lavoriSnapshot.groups.reduce<Record<string, number>>((acc, group) => {
    const targa = normalizeText(group.mezzo?.targa || "");
    if (!targa) return acc;
    acc[targa] = group.counts.total;
    return acc;
  }, {});

  return {
    storico: workspace.storico,
    mezzi: workspace.mezzi,
    materialiInventario: inventorySnapshot.items.map(mapInventoryItem),
    mezzoPreview,
    kmUltimoByTarga,
    lavoriInAttesaByTarga,
  };
}

export default function NextManutenzioniPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<ViewTab>("dashboard");
  const [storico, setStorico] = useState<NextManutenzioniLegacyDatasetRecord[]>([]);
  const [mezzi, setMezzi] = useState<NextManutenzioniMezzoOption[]>([]);
  const [mezzoPreview, setMezzoPreview] = useState<MezzoPreview[]>([]);
  const [materialiInventario, setMaterialiInventario] = useState<MaterialeInventario[]>([]);
  const [kmUltimoByTarga, setKmUltimoByTarga] = useState<Record<string, number | null>>({});
  const [lavoriInAttesaByTarga, setLavoriInAttesaByTarga] = useState<Record<string, number>>({});

  const [selectedTarga, setSelectedTarga] = useState("");
  const [ricercaMezzo, setRicercaMezzo] = useState("");
  const [pdfSubjectType, setPdfSubjectType] = useState<TipoVoce>("mezzo");
  const [pdfPeriodFilter, setPdfPeriodFilter] = useState<PdfPeriodFilter>("ultimo-mese");

  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [fornitore, setFornitore] = useState("");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(todayLabel());
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [quantitaTemp, setQuantitaTemp] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalGommeOpen, setModalGommeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const pageData = await readPageData();
        if (cancelled) return;

        setStorico(pageData.storico);
        setMezzi(pageData.mezzi);
        setMezzoPreview(pageData.mezzoPreview);
        setMaterialiInventario(pageData.materialiInventario);
        setKmUltimoByTarga(pageData.kmUltimoByTarga);
        setLavoriInAttesaByTarga(pageData.lavoriInAttesaByTarga);

        const initialTarga = pageData.mezzi[0]?.targa ?? "";
        setSelectedTarga((current) => current || initialTarga);
        setTarga((current) => current || initialTarga);
        if (!cancelled && initialTarga) {
          const preview = pageData.mezzoPreview.find((item) => item.targa === initialTarga);
          setRicercaMezzo(preview ? `${preview.targa} · ${preview.marcaModello ?? preview.label}` : initialTarga);
        }
      } catch (loadError) {
        console.error("Errore caricamento Manutenzioni NEXT:", loadError);
        if (cancelled) return;
        setStorico([]);
        setMezzi([]);
        setMezzoPreview([]);
        setMaterialiInventario([]);
        setKmUltimoByTarga({});
        setLavoriInAttesaByTarga({});
        setError("Impossibile leggere il dataset reale di manutenzioni.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshData() {
    const pageData = await readPageData();
    setStorico(pageData.storico);
    setMezzi(pageData.mezzi);
    setMezzoPreview(pageData.mezzoPreview);
    setMaterialiInventario(pageData.materialiInventario);
    setKmUltimoByTarga(pageData.kmUltimoByTarga);
    setLavoriInAttesaByTarga(pageData.lavoriInAttesaByTarga);
  }

  const activeTarga = normalizeText(selectedTarga || targa);
  const mezzoSelezionato = useMemo(
    () => mezzi.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzi],
  );
  const mezzoPreviewSelezionato = useMemo(
    () => mezzoPreview.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzoPreview],
  );
  const storicoMezzo = useMemo(
    () => storico.filter((item) => item.targa === activeTarga),
    [activeTarga, storico],
  );
  const storicoMezzoOrdinato = useMemo(
    () =>
      [...storicoMezzo].sort(
        (left, right) => getLegacyDateTimestamp(right.data) - getLegacyDateTimestamp(left.data),
      ),
    [storicoMezzo],
  );
  const materialiSuggeriti = useMemo(() => {
    const query = normalizeFreeText(materialeSearch).toUpperCase();
    if (!query) return [];
    return materialiInventario
      .filter(
        (item) =>
          item.label.toUpperCase().includes(query)
          || (item.fornitoreLabel ?? "").toUpperCase().includes(query),
      )
      .slice(0, 5);
  }, [materialeSearch, materialiInventario]);
  const totalMaterialiMezzo = useMemo(
    () =>
      storicoMezzo.reduce(
        (sum, item) =>
          sum + (item.materiali?.reduce((inner, materiale) => inner + materiale.quantita, 0) ?? 0),
        0,
      ),
    [storicoMezzo],
  );
  const lavoriApertiMezzo = lavoriInAttesaByTarga[activeTarga] ?? 0;
  const kmUltimoRifornimento = kmUltimoByTarga[activeTarga] ?? null;
  const gommeCount = useMemo(
    () =>
      storicoMezzo.filter((item) => item.descrizione.toUpperCase().includes("CAMBIO GOMME")).length,
    [storicoMezzo],
  );
  const latestRecord = storicoMezzoOrdinato[0] ?? null;
  const isMappaView = view === "mappa";
  const ricercaMezzoRisultati = useMemo(() => {
    const query = normalizeFreeText(ricercaMezzo).toUpperCase();
    if (!query) return [];
    return mezzoPreview
      .filter((item) =>
        [
          item.targa,
          item.label,
          item.marcaModello ?? "",
          item.autistaNome ?? "",
        ]
          .join(" ")
          .toUpperCase()
          .includes(query),
      )
      .slice(0, 6);
  }, [mezzoPreview, ricercaMezzo]);
  const compressoreCount = useMemo(
    () => storicoMezzo.filter((item) => item.tipo === "compressore").length,
    [storicoMezzo],
  );
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const items: PdfPeriodFilter[] = [];
    [...storico]
      .sort((left, right) => getLegacyDateTimestamp(right.data) - getLegacyDateTimestamp(left.data))
      .forEach((item) => {
        const filter = buildMonthFilterKey(item.data);
        if (!filter || seen.has(filter)) return;
        seen.add(filter);
        items.push(filter);
      });
    return items;
  }, [storico]);
  const pdfFilteredItems = useMemo(() => {
    const now = new Date();
    const lastMonthThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();

    return [...storico]
      .filter((item) => item.tipo === pdfSubjectType)
      .filter((item) => {
        const timestamp = getLegacyDateTimestamp(item.data);
        if (pdfPeriodFilter === "tutto") return true;
        if (pdfPeriodFilter === "ultimo-mese") return timestamp >= lastMonthThreshold;
        return buildMonthFilterKey(item.data) === pdfPeriodFilter;
      })
      .sort((left, right) => getLegacyDateTimestamp(right.data) - getLegacyDateTimestamp(left.data));
  }, [pdfPeriodFilter, pdfSubjectType, storico]);
  const pdfGroupedResults = useMemo(() => {
    const grouped = new Map<string, NextManutenzioniLegacyDatasetRecord[]>();
    pdfFilteredItems.forEach((item) => {
      const key = normalizeText(item.targa);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    return [...grouped.entries()].map(([targaKey, items]) => {
      const latest = items[0];
      const mezzo = mezzoPreview.find((entry) => entry.targa === targaKey) ?? null;
      const materialiTotali = items.reduce(
        (sum, record) =>
          sum + (record.materiali?.reduce((inner, materiale) => inner + materiale.quantita, 0) ?? 0),
        0,
      );
      return {
        targa: targaKey,
        latest,
        mezzo,
        total: items.length,
        materialiTotali,
        kmUltimo: kmUltimoByTarga[targaKey] ?? null,
      };
    });
  }, [kmUltimoByTarga, mezzoPreview, pdfFilteredItems]);

  function handleSelectContextTarga(value: string) {
    const normalized = normalizeText(value);
    setSelectedTarga(normalized);
    setTarga(normalized);
    const preview = mezzoPreview.find((item) => item.targa === normalized);
    setRicercaMezzo(preview ? `${preview.targa} · ${preview.marcaModello ?? preview.label}` : normalized);
    setNotice(null);
  }

  function resetForm(nextTarga?: string) {
    const currentTarga = nextTarga ?? activeTarga;
    setTipo("mezzo");
    setFornitore("");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setData(todayLabel());
    setMaterialeSearch("");
    setMaterialiTemp([]);
    setQuantitaTemp("");
    setEditingId(null);
    setTarga(currentTarga);
  }

  function handleAddMateriale(
    label: string,
    quantitaValue: number,
    unitaValue: string,
    fromInventario: boolean,
    refId?: string,
  ) {
    if (!label.trim() || !quantitaValue) {
      window.alert("Inserisci almeno nome materiale e quantita.");
      return;
    }

    const nuovo: MaterialeManutenzione = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: label.trim().toUpperCase(),
      quantita: quantitaValue,
      unita: unitaValue || "pz",
      fromInventario,
      ...(refId ? { refId } : {}),
    };

    setMaterialiTemp((current) => [...current, nuovo]);
    setMaterialeSearch("");
    setQuantitaTemp("");
  }

  function handleRemoveMateriale(id: string) {
    setMaterialiTemp((current) => current.filter((item) => item.id !== id));
  }

  function handleEdit(item: NextManutenzioniLegacyDatasetRecord) {
    setEditingId(item.id);
    setSelectedTarga(item.targa);
    setTarga(item.targa);
    setTipo(item.tipo);
    setFornitore(item.fornitore ?? "");
    setKm(item.km != null ? String(item.km) : "");
    setOre(item.ore != null ? String(item.ore) : "");
    setSottotipo(item.sottotipo ?? "motrice");
    setDescrizione(item.descrizione);
    setEseguito(item.eseguito ?? "");
    setData(item.data);
    setMaterialiTemp(toMaterialiTemp(item.materiali));
    setView("form");
    setNotice("Modifica caricata dal dataset reale.");
  }

  async function handleSave() {
    const normalizedTarga = normalizeText(targa);
    const normalizedDescrizione = normalizeFreeText(descrizione);
    const normalizedData = normalizeFreeText(data);

    if (!normalizedTarga || !normalizedDescrizione || !normalizedData) {
      window.alert("Compila almeno TARGA, DESCRIZIONE e DATA.");
      return;
    }

    if (tipo === "mezzo" && !km) {
      const confirmed = window.confirm("Non hai inserito i KM. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (tipo === "compressore" && !ore) {
      const confirmed = window.confirm("Non hai inserito le ORE. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const savedRecord = await saveNextManutenzioneBusinessRecord({
        editingSourceId: editingId,
        targa: normalizedTarga,
        tipo,
        fornitore: normalizeFreeText(fornitore) || null,
        km: km ? Number(km) : null,
        ore: ore ? Number(ore) : null,
        sottotipo: tipo === "compressore" ? sottotipo : null,
        descrizione: normalizedDescrizione,
        eseguito: normalizeFreeText(eseguito) || null,
        data: normalizedData,
        materiali: materialiTemp,
      });
      await refreshData();
      setSelectedTarga(savedRecord.targa);
      resetForm(savedRecord.targa);
      setView("dashboard");
      setNotice(
        editingId
          ? "Manutenzione aggiornata in modo compatibile con il legacy."
          : "Manutenzione salvata in modo compatibile con il legacy.",
      );
    } catch (saveError) {
      console.error("Errore salvataggio manutenzione:", saveError);
      setError("Salvataggio manutenzione non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: NextManutenzioniLegacyDatasetRecord) {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa manutenzione?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const deleted = await deleteNextManutenzioneBusinessRecord(item.id);
      if (!deleted) {
        setError("Eliminazione non riuscita: record non trovato nel dataset reale.");
        return;
      }
      await refreshData();
      if (editingId === item.id) resetForm(item.targa);
      setNotice("Manutenzione eliminata e dataset riallineato.");
    } catch (deleteError) {
      console.error("Errore eliminazione manutenzione:", deleteError);
      setError("Eliminazione manutenzione non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  async function exportPdfForItems(
    items: NextManutenzioniLegacyDatasetRecord[],
    title: string,
  ) {
    if (!items.length) {
      window.alert("Non ci sono manutenzioni da esportare.");
      return;
    }

    await generateSmartPDF({
      kind: "table",
      title,
      orientation: "landscape",
      fontSize: 8,
      tableWidth: "auto",
      columns: [
        "Targa",
        "Tipo",
        "Km/Ore",
        "Sottotipo",
        "Descrizione",
        "Fornitore",
        "Eseguito da",
        "Data",
      ],
      rows: items.map((item) => [
        item.targa,
        item.tipo === "mezzo" ? "MEZZO" : "COMPRESSORE",
        buildMisuraLabel(item),
        item.sottotipo || "-",
        item.descrizione,
        item.fornitore || "-",
        item.eseguito || "-",
        item.data,
      ]),
    });
  }

  function handleGommeConfirm(dataGomme: CambioGommeData) {
    setDescrizione((current) => integraDescrizioneConGomme(dataGomme, current));
    if (dataGomme.km?.trim()) setKm(dataGomme.km.trim());
    setModalGommeOpen(false);
    setNotice("Dettaglio gomme integrato nella descrizione come nel legacy.");
  }

  function renderHeaderTools() {
    return (
      <div className="mx-header-tools">
        <label className="man-label-block mx-header-search">
          <span className="man-label-text">Ricerca rapida targa / modello / autista</span>
          <input
            className="man-input mx-search-input"
            value={ricercaMezzo}
            onChange={(event) => setRicercaMezzo(event.target.value)}
            placeholder="Es. TI178456, Renault, Cesare"
          />
        </label>

        {ricercaMezzoRisultati.length > 0 ? (
          <div className="mx-header-search-results">
            {ricercaMezzoRisultati.map((item) => (
              <button
                key={item.id}
                type="button"
                className="mx-search-preview-item"
                onClick={() => handleSelectContextTarga(item.targa)}
              >
                <span className="mx-search-preview-top">
                  <strong>{item.targa}</strong>
                  <span>{item.categoria || "DA VERIFICARE"}</span>
                </span>
                <span className="mx-search-preview-main">{item.marcaModello ?? item.label}</span>
                <span className="mx-search-preview-meta">Autista solito: {item.autistaNome || "DA VERIFICARE"}</span>
              </button>
            ))}
          </div>
        ) : null}

        {mezzoPreviewSelezionato ? (
          <div className="mx-header-context">
            <div className="mx-side-hero">
              <div className="mx-side-kicker">Mezzo selezionato</div>
              <div className="mx-side-title">{mezzoPreviewSelezionato.targa}</div>
              <div className="mx-side-subtitle">
                {mezzoPreviewSelezionato.marcaModello ?? mezzoPreviewSelezionato.label}
              </div>
            </div>

            <div className="mx-side-grid">
              <div className="mx-side-stat">
                <span>Categoria</span>
                <strong>{mezzoPreviewSelezionato.categoria || "DA VERIFICARE"}</strong>
              </div>
              <div className="mx-side-stat">
                <span>Autista solito</span>
                <strong>{mezzoPreviewSelezionato.autistaNome || "DA VERIFICARE"}</strong>
              </div>
              <div className="mx-side-stat">
                <span>Km ultimo rifornimento</span>
                <strong>{kmUltimoRifornimento != null ? `${kmUltimoRifornimento}` : "DA VERIFICARE"}</strong>
              </div>
              <div className="mx-side-stat">
                <span>Ultima manutenzione</span>
                <strong>{latestRecord?.data || "Nessuna"}</strong>
              </div>
            </div>

            <div className="mx-action-row">
              <button
                type="button"
                className="man-header-btn"
                onClick={() => navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))}
              >
                Apri dossier mezzo
              </button>
              <button
                type="button"
                className="man-header-btn man-header-btn-outline"
                onClick={() => setView("mappa")}
              >
                Vai a Mappa storico
              </button>
            </div>
          </div>
        ) : (
          <div className="man-empty mx-empty-panel mx-header-empty">
            Seleziona un mezzo o usa la ricerca rapida per vedere il contesto tecnico.
          </div>
        )}
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="man-card man-card-form mx-panel mx-panel--main mx-surface-card mx-surface-card--form">
        <div className="man-card-header">
          <div>
            <h2 className="man-title-small">{editingId ? "Modifica manutenzione" : "Nuova manutenzione"}</h2>
            <p className="man-subtitle">
              Form tecnico con blocchi separati per base, tagliando, materiali e viste mappa
            </p>
          </div>
          <span className="mx-form-badge">{editingId ? "Modalità modifica" : "Nuova registrazione"}</span>
        </div>

        <div className="man-card-body mx-stack mx-stack-lg">
          <div className="mx-form-grid">
            <section className="mx-form-section">
              <div className="mx-block-title">Campi base</div>

              <label className="man-label-block">
                <span className="man-label-text">Targa / Codice</span>
                <div className="man-row">
                  <select
                    className="man-input man-select-mezzo"
                    value={targa}
                    onChange={(event) => handleSelectContextTarga(event.target.value)}
                  >
                    <option value="">- Seleziona mezzo dall'elenco -</option>
                    {mezzi.map((mezzo) => (
                      <option key={mezzo.id} value={mezzo.targa}>
                        {mezzo.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="man-input man-input-targa"
                    value={targa}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();
                      setTarga(value);
                      setSelectedTarga(value);
                    }}
                    placeholder="Es. TI315407"
                  />
                </div>
              </label>

              <div className="man-row">
                <label className="man-label-inline">
                  <span className="man-label-text">Tipo</span>
                  <select
                    className="man-input"
                    value={tipo}
                    onChange={(event) => setTipo(event.target.value as TipoVoce)}
                  >
                    <option value="mezzo">Mezzo</option>
                    <option value="compressore">Compressore</option>
                  </select>
                </label>

                {tipo === "mezzo" ? (
                  <label className="man-label-inline">
                    <span className="man-label-text">Km attuali</span>
                    <input
                      className="man-input"
                      value={km}
                      onChange={(event) => setKm(event.target.value)}
                      placeholder="Es. 325000"
                      inputMode="numeric"
                    />
                  </label>
                ) : (
                  <label className="man-label-inline">
                    <span className="man-label-text">Ore</span>
                    <input
                      className="man-input"
                      value={ore}
                      onChange={(event) => setOre(event.target.value)}
                      placeholder="Es. 1200"
                      inputMode="numeric"
                    />
                  </label>
                )}

                <label className="man-label-inline">
                  <span className="man-label-text">Data intervento</span>
                  <input
                    className="man-input"
                    value={data}
                    onChange={(event) => setData(event.target.value)}
                    placeholder="gg mm aaaa"
                  />
                </label>
              </div>

              {tipo === "compressore" ? (
                <label className="man-label-block">
                  <span className="man-label-text">Sottotipo compressore</span>
                  <select
                    className="man-input"
                    value={sottotipo}
                    onChange={(event) => setSottotipo(event.target.value as SottoTipo)}
                  >
                    <option value="motrice">Motrice</option>
                    <option value="trattore">Trattore</option>
                  </select>
                </label>
              ) : null}
            </section>

            <section className="mx-form-section">
              <div className="mx-block-title">Tagliando completo</div>
              <div className="mx-tagliando-box">
                <p>
                  Il tagliando viene trattato come intervento composto: descrizione, materiali, componenti inclusi e
                  viste mappa devono restare coerenti.
                </p>
                <div className="mx-chip-row">
                  {TAGLIANDO_COMPONENTI.map((item) => (
                    <span key={item} className="mx-history-chip">
                      {item}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="man-header-btn man-header-btn-outline"
                  onClick={() => setModalGommeOpen(true)}
                  disabled={!activeTarga || !mezzoSelezionato}
                >
                  Gestione gomme
                </button>
              </div>
            </section>
          </div>

          <section className="mx-form-section">
            <div className="mx-block-title">Descrizione / note</div>

            <label className="man-label-block">
              <span className="man-label-text">Descrizione intervento</span>
              <textarea
                className="man-input man-textarea"
                value={descrizione}
                onChange={(event) => setDescrizione(event.target.value)}
                placeholder="Es. Sostituzione pastiglie freno anteriori"
              />
            </label>

            <div className="man-row">
              <label className="man-label-inline">
                <span className="man-label-text">Fornitore / officina</span>
                <input
                  className="man-input"
                  value={fornitore}
                  onChange={(event) => setFornitore(event.target.value.toUpperCase())}
                  placeholder="Es. OFFICINA INTERNA"
                />
              </label>

              <label className="man-label-inline">
                <span className="man-label-text">Eseguito da</span>
                <input
                  className="man-input"
                  value={eseguito}
                  onChange={(event) => setEseguito(event.target.value.toUpperCase())}
                  placeholder="Es. AGUSTONI CESARE"
                />
              </label>
            </div>
          </section>

          <section className="mx-form-section">
            <div className="mx-block-title">Componenti inclusi / materiali</div>

            <div className="man-row man-row-materiale">
              <div className="man-materiale-left" style={{ flex: 1 }}>
                <label className="man-label-block">
                  <span className="man-label-text">Cerca in inventario / inserisci materiale</span>
                  <input
                    className="man-input"
                    value={materialeSearch}
                    onChange={(event) => setMaterialeSearch(event.target.value)}
                    placeholder="Es. PASTIGLIE FRENO, OLIO MOTORE..."
                  />
                </label>

                {materialeSearch && materialiSuggeriti.length > 0 ? (
                  <div className="man-autosuggest">
                    {materialiSuggeriti.map((item) => (
                      <div
                        key={item.id}
                        className="man-autosuggest-item"
                        onClick={() => {
                          if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                            window.alert("Inserisci prima la quantita.");
                            return;
                          }
                          handleAddMateriale(item.label, Number(quantitaTemp), item.unita || "pz", true, item.id);
                        }}
                      >
                        <div className="man-autosuggest-main">
                          <span className="man-autosuggest-label">{item.label}</span>
                          {item.fornitoreLabel ? (
                            <span className="man-autosuggest-supplier">{item.fornitoreLabel}</span>
                          ) : null}
                        </div>
                        <div className="man-autosuggest-extra">
                          Disponibili: {item.quantitaTotale} {item.unita}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="man-materiale-right mx-materiale-side">
                <label className="man-label-inline">
                  <span className="man-label-text">Quantità</span>
                  <input
                    className="man-input man-input-small"
                    value={quantitaTemp}
                    onChange={(event) => setQuantitaTemp(event.target.value)}
                    placeholder="Es. 2"
                    inputMode="numeric"
                  />
                </label>
                <button
                  type="button"
                  className="man-header-btn"
                  onClick={() => {
                    if (!materialeSearch.trim()) {
                      window.alert("Inserisci il nome del materiale o selezionalo dall'inventario.");
                      return;
                    }
                    if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                      window.alert("Inserisci una quantita valida.");
                      return;
                    }
                    handleAddMateriale(materialeSearch.toUpperCase(), Number(quantitaTemp), "pz", false);
                  }}
                >
                  Aggiungi materiale
                </button>
              </div>
            </div>

            {materialiTemp.length > 0 ? (
              <div className="mx-material-list">
                {materialiTemp.map((item) => (
                  <div key={item.id} className="mx-material-row">
                    <span>
                      <strong>{item.label}</strong> - {item.quantita} {item.unita}
                      {item.fromInventario ? " (da inventario)" : ""}
                    </span>
                    <button
                      type="button"
                      className="man-delete-btn"
                      onClick={() => handleRemoveMateriale(item.id)}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="man-empty mx-empty-panel">Nessun materiale associato alla manutenzione corrente.</div>
            )}
          </section>

          <section className="mx-form-section">
            <div className="mx-block-title">4 foto mappa storico</div>
            <div className="mx-photo-grid">
              {MAPPA_FOTO_VIEWS.map((item) => (
                <button key={item.key} type="button" className="mx-photo-card" onClick={() => setView("mappa")}>
                  <span>{item.label}</span>
                  <strong>Vista {item.label.toLowerCase()}</strong>
                  <small>Caricabile dalla Mappa storico</small>
                </button>
              ))}
            </div>
          </section>

          <div className="man-actions" style={{ marginTop: 12 }}>
            <button type="button" className="man-primary-btn" onClick={() => void handleSave()} disabled={saving}>
              {editingId ? "Salva modifica" : "Salva manutenzione"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="man-delete-btn"
                onClick={() => {
                  const currentItem = storico.find((item) => item.id === editingId);
                  if (currentItem) void handleDelete(currentItem);
                }}
                disabled={saving}
              >
                Elimina manutenzione
              </button>
            ) : null}
            <button type="button" className="man-secondary-btn" onClick={() => resetForm()}>
              Pulisci campi
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDashboard() {
    const latestMezzoRecord = storicoMezzoOrdinato.find((item) => item.tipo === "mezzo") ?? null;
    const latestCompressoreRecord = storicoMezzoOrdinato.find((item) => item.tipo === "compressore") ?? null;
    const latestTagliandoHint = latestMezzoRecord ? buildTagliandoHint(latestMezzoRecord) : null;

    return (
      <div className="man-card man-card-form mx-panel mx-panel--main mx-surface-card mx-surface-card--dashboard">
        <div className="man-card-header">
          <div>
            <h2 className="man-title-small">Dashboard tecnico manutenzioni</h2>
            <p className="man-subtitle">
              Quadro sintetico e operativo del mezzo selezionato, senza pannelli laterali ripetuti.
            </p>
          </div>
        </div>

        <div className="man-card-body mx-stack mx-stack-lg">
          <div className="mx-kpi-grid mx-kpi-grid--dashboard">
            <div className="mx-kpi-card">
              <span>Ultimo intervento mezzo</span>
              <strong>{latestMezzoRecord?.data || "Nessuno"}</strong>
            </div>
            <div className="mx-kpi-card">
              <span>Ultimo intervento compressore</span>
              <strong>{latestCompressoreRecord?.data || "Nessuno"}</strong>
            </div>
            <div className="mx-kpi-card">
              <span>Segnalazioni aperte</span>
              <strong>{lavoriApertiMezzo}</strong>
            </div>
            <div className="mx-kpi-card">
              <span>Km ultimo rifornimento</span>
              <strong>{kmUltimoRifornimento != null ? kmUltimoRifornimento : "DA VERIFICARE"}</strong>
            </div>
          </div>

          <div className="mx-dashboard-grid">
            <section className="mx-panel mx-dashboard-block">
              <div className="mx-block-title">Accessi rapidi</div>
              <div className="mx-quick-actions">
                <button type="button" className="man-header-btn" onClick={() => setView("form")}>
                  Nuova manutenzione
                </button>
                <button type="button" className="man-header-btn man-header-btn-outline" onClick={() => setView("pdf")}>
                  Quadro manutenzioni PDF
                </button>
                <button type="button" className="man-header-btn man-header-btn-outline" onClick={() => setView("mappa")}>
                  Apri Mappa storico
                </button>
                <button
                  type="button"
                  className="man-header-btn man-header-btn-outline"
                  onClick={() => mezzoPreviewSelezionato && navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))}
                  disabled={!mezzoPreviewSelezionato}
                >
                  Apri dossier mezzo
                </button>
              </div>
            </section>

            <section className="mx-panel mx-dashboard-block">
              <div className="mx-block-title">Focus tecnico</div>
              <div className="mx-area-grid">
                <div className="mx-area-card">
                  <span>Interventi mezzo</span>
                  <strong>{storicoMezzo.filter((item) => item.tipo === "mezzo").length}</strong>
                  <p>{latestMezzoRecord ? buildDescrizioneSnippet(latestMezzoRecord.descrizione, 88) : "Nessun intervento mezzo"}</p>
                  {latestTagliandoHint ? <p>Tagliando: {latestTagliandoHint}</p> : null}
                </div>
                <div className="mx-area-card">
                  <span>Interventi compressore</span>
                  <strong>{compressoreCount}</strong>
                  <p>
                    {latestCompressoreRecord
                      ? buildDescrizioneSnippet(latestCompressoreRecord.descrizione, 88)
                      : "Nessun intervento compressore"}
                  </p>
                </div>
                <div className="mx-area-card">
                  <span>Pneumatici / assali</span>
                  <strong>{gommeCount}</strong>
                  <p>Interventi mappabili nella vista tecnica del mezzo.</p>
                </div>
                <div className="mx-area-card">
                  <span>Materiali tracciati</span>
                  <strong>{totalMaterialiMezzo}</strong>
                  <p>Componenti e materiali già registrati sul mezzo selezionato.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mx-timeline-block">
            <div className="mx-block-title">Ultimi interventi del mezzo</div>
            {storicoMezzoOrdinato.length === 0 ? (
              <div className="man-empty mx-empty-panel">Nessuna manutenzione presente per il mezzo selezionato.</div>
            ) : (
              <div className="mx-timeline-list">
                {storicoMezzoOrdinato.slice(0, 5).map((item) => {
                  const visualKind = classifyStoricoRecord(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="mx-timeline-item"
                      onClick={() => handleEdit(item)}
                    >
                      <div className="mx-timeline-head">
                        <span className={`mx-kind-pill mx-kind-pill--${visualKind}`}>
                          {getVisualKindLabel(visualKind)}
                        </span>
                        <span className="mx-timeline-date">{item.data}</span>
                      </div>
                      <strong>{buildDescrizioneSnippet(item.descrizione, 120)}</strong>
                      <span>{item.eseguito || item.fornitore || buildMisuraLabel(item)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderPdfPanel() {
    const summaryCards = [
      {
        label: "Mezzo",
        value: String(storico.filter((item) => item.tipo === "mezzo").length),
      },
      {
        label: "Compressore",
        value: String(storico.filter((item) => item.tipo === "compressore").length),
      },
      {
        label: "Segnalazioni / derivati",
        value: String(storico.filter((item) => classifyStoricoRecord(item) === "derivato").length),
      },
      {
        label: "Costi / materiali",
        value: `${storico.reduce((sum, item) => sum + (item.materiali?.length ?? 0), 0)} materiali`,
      },
    ];

    return (
      <div className="man-card man-card-form mx-panel mx-panel--main mx-surface-card mx-surface-card--pdf">
        <div className="man-card-header">
          <div>
            <h2 className="man-title-small">Quadro manutenzioni PDF</h2>
            <p className="man-subtitle">
              Prima filtra soggetto e periodo, poi esporta dall'elenco operativo dei risultati.
            </p>
          </div>
          <button
            type="button"
            className="man-header-btn"
            onClick={() =>
              void exportPdfForItems(
                pdfFilteredItems,
                `Quadro manutenzioni ${formatMonthFilterLabel(pdfPeriodFilter)}`,
              )
            }
          >
            PDF quadro generale
          </button>
        </div>

        <div className="man-card-body mx-stack mx-stack-lg">
          <div className="mx-pdf-steps">
            <div className="mx-step-card">
              <span>Step 1</span>
              <strong>Soggetto</strong>
              <div className="mx-step-actions">
                <button
                  type="button"
                  className={`man-header-btn${pdfSubjectType === "mezzo" ? "" : " man-header-btn-outline"}`}
                  onClick={() => setPdfSubjectType("mezzo")}
                >
                  Mezzo
                </button>
                <button
                  type="button"
                  className={`man-header-btn${pdfSubjectType === "compressore" ? "" : " man-header-btn-outline"}`}
                  onClick={() => setPdfSubjectType("compressore")}
                >
                  Compressore
                </button>
              </div>
            </div>

            <div className="mx-step-card">
              <span>Step 2</span>
              <strong>Periodo</strong>
              <div className="mx-step-actions mx-step-actions--wrap">
                <button
                  type="button"
                  className={`man-header-btn${pdfPeriodFilter === "ultimo-mese" ? "" : " man-header-btn-outline"}`}
                  onClick={() => setPdfPeriodFilter("ultimo-mese")}
                >
                  Ultimo mese
                </button>
                {monthOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`man-header-btn${pdfPeriodFilter === option ? "" : " man-header-btn-outline"}`}
                    onClick={() => setPdfPeriodFilter(option)}
                  >
                    {formatMonthFilterLabel(option)}
                  </button>
                ))}
                <button
                  type="button"
                  className={`man-header-btn${pdfPeriodFilter === "tutto" ? "" : " man-header-btn-outline"}`}
                  onClick={() => setPdfPeriodFilter("tutto")}
                >
                  Tutto
                </button>
              </div>
            </div>
          </div>

          <section className="mx-pdf-results-shell">
            <div className="mx-pdf-results-header">
              <div>
                <div className="mx-block-title">Elenco risultati</div>
                <strong className="mx-pdf-results-title">
                  Risultati esportabili per {pdfSubjectType === "mezzo" ? "mezzo" : "compressore"}
                </strong>
              </div>
              <div className="mx-chip-row">
                <span className="mx-history-chip">{formatMonthFilterLabel(pdfPeriodFilter)}</span>
                <span className="mx-history-chip">
                  {pdfGroupedResults.length} {pdfGroupedResults.length === 1 ? "soggetto" : "soggetti"}
                </span>
              </div>
            </div>

            {pdfGroupedResults.length === 0 ? (
              <div className="man-empty mx-empty-panel">Nessun risultato disponibile con i filtri attuali.</div>
            ) : (
              <div className="mx-pdf-list">
                {pdfGroupedResults.map((result) => (
                  <div key={`${pdfSubjectType}:${result.targa}`} className="mx-pdf-list-row">
                    <div className="mx-pdf-list-visual">
                      <div className="mx-pdf-list-photo-frame">
                        {result.mezzo?.fotoUrl ? (
                          <img src={result.mezzo.fotoUrl} alt={result.targa} className="mx-pdf-list-photo" />
                        ) : (
                          <div className="mx-pdf-list-photo mx-pdf-list-photo--placeholder">
                            <span>{result.targa}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mx-pdf-list-main">
                      <div className="mx-pdf-list-head">
                        <div className="mx-pdf-list-title-wrap">
                          <strong className="mx-pdf-list-title">{result.targa}</strong>
                          <span className="mx-pdf-list-subtitle">
                            {result.mezzo?.marcaModello ?? (pdfSubjectType === "mezzo" ? "Mezzo" : "Compressore")}
                          </span>
                        </div>
                        <span className="mx-history-chip">
                          {pdfSubjectType === "mezzo" ? "Soggetto: mezzo" : "Soggetto: compressore"}
                        </span>
                      </div>

                      <div className="mx-pdf-list-meta">
                        <div className="mx-pdf-list-meta-item">
                          <span>Autista solito</span>
                          <strong>{result.mezzo?.autistaNome || "DA VERIFICARE"}</strong>
                        </div>
                        <div className="mx-pdf-list-meta-item">
                          <span>Km ultimo rifornimento</span>
                          <strong>{result.kmUltimo != null ? result.kmUltimo : "DA VERIFICARE"}</strong>
                        </div>
                        <div className="mx-pdf-list-meta-item">
                          <span>Data manutenzione</span>
                          <strong>{result.latest.data}</strong>
                        </div>
                        <div className="mx-pdf-list-meta-item">
                          <span>Tipo / manutenzione</span>
                          <strong>{buildDescrizioneSnippet(result.latest.descrizione, 92)}</strong>
                        </div>
                      </div>

                      <div className="mx-pdf-list-footer">
                        <div className="mx-chip-row">
                          <span className="mx-history-chip">
                            {result.total} {result.total === 1 ? "intervento" : "interventi"}
                          </span>
                          <span className="mx-history-chip">
                            {result.materialiTotali} {result.materialiTotali === 1 ? "materiale" : "materiali"}
                          </span>
                        </div>

                        <div className="mx-pdf-list-actions">
                          <button
                            type="button"
                            className="man-header-btn"
                            onClick={() =>
                              void exportPdfForItems(
                                pdfFilteredItems.filter((item) => item.targa === result.targa),
                                `PDF ${pdfSubjectType} - ${result.targa}`,
                              )
                            }
                          >
                            {pdfSubjectType === "mezzo" ? "PDF mezzo" : "PDF compressore"}
                          </button>
                          <button
                            type="button"
                            className="man-header-btn man-header-btn-outline"
                            onClick={() => handleEdit(result.latest)}
                          >
                            Apri dettaglio
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mx-pdf-secondary">
            <div className="mx-pdf-secondary-panel">
              <div className="mx-list-header">
                <div>
                  <div className="mx-block-title">Riepilogo rapido</div>
                  <div className="mx-list-title">Indicatori del filtro attivo</div>
                </div>
              </div>
              <div className="mx-kpi-grid">
                {summaryCards.map((card) => (
                  <div key={card.label} className="mx-kpi-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-pdf-secondary-panel mx-timeline-block">
              <div className="mx-list-header">
                <div>
                  <div className="mx-block-title">Cronologia di supporto</div>
                  <div className="mx-list-title">Ultimi eventi del filtro selezionato</div>
                </div>
                <span className="mx-history-chip">
                  {pdfFilteredItems.length} {pdfFilteredItems.length === 1 ? "riga" : "righe"}
                </span>
              </div>
              {pdfFilteredItems.length === 0 ? (
                <div className="man-empty mx-empty-panel">La cronologia filtrata e vuota.</div>
              ) : (
                <div className="mx-history-list">
                  {pdfFilteredItems.map((item) => {
                    const visualKind = classifyStoricoRecord(item);
                    return (
                      <div key={item.id} className="mx-history-card">
                        <div className="mx-history-top">
                          <div className="mx-history-left">
                            <span className={`mx-kind-pill mx-kind-pill--${visualKind}`}>
                              {getVisualKindLabel(visualKind)}
                            </span>
                            <strong>{item.targa}</strong>
                          </div>
                          <span className="mx-history-date">{item.data}</span>
                        </div>
                        <div className="mx-history-body">
                          <div className="mx-history-title">{buildDescrizioneSnippet(item.descrizione, 160)}</div>
                          <div className="mx-history-meta">
                            <span>{buildMisuraLabel(item)}</span>
                            <span>{item.eseguito || item.fornitore || "Dato non disponibile"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderActiveSurface() {
    if (loading) {
      return <div className="man-empty mx-empty-panel">Caricamento manutenzioni in corso...</div>;
    }
    if (view === "dashboard") return renderDashboard();
    if (view === "form") return renderForm();
    if (view === "pdf") return renderPdfPanel();
    return null;
  }

  return (
    <div
      className={`man-page mx-page${isMappaView ? " mx-page--mappa" : ""}`}
      style={
        isMappaView
          ? {
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
            }
          : undefined
      }
    >
      <div
        className="man-card"
        style={{
          marginBottom: isMappaView ? 12 : 16,
          background: isMappaView ? "#f7f9fc" : undefined,
          gridColumn: "1 / -1",
        }}
      >
        <div
          className="man-card-header mx-module-header"
          style={{
            alignItems: isMappaView ? "center" : undefined,
            gap: isMappaView ? 12 : undefined,
            paddingBottom: isMappaView ? 4 : undefined,
          }}
        >
          <div className="mx-header-grid">
            <div className="man-logo-title">
              <img src="/logo.png" alt="logo" className="man-logo" onClick={() => navigate("/next")} />
              <div>
                <h1 className="man-title">MANUTENZIONI</h1>
                <p className="man-subtitle">
                  {isMappaView
                    ? "Vista tecnica focalizzata sullo storico visuale del mezzo"
                    : "Famiglia di schermate operative con dashboard, form, mappa storico e quadro PDF"}
                </p>
              </div>
            </div>

            <div className="mx-header-controls">
              <div className="mx-header-select" style={{ minWidth: isMappaView ? 280 : 260 }}>
                <label className="man-label-block">
                  <span className="man-label-text">Seleziona mezzo</span>
                  <select
                    className="man-input man-select-mezzo"
                    value={activeTarga}
                    onChange={(event) => handleSelectContextTarga(event.target.value)}
                  >
                    <option value="">- Seleziona mezzo -</option>
                    {mezzi.map((mezzo) => (
                      <option key={mezzo.id} value={mezzo.targa}>
                        {mezzo.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!isMappaView ? renderHeaderTools() : null}
            </div>
          </div>
        </div>

        <div className="mx-module-tabs" style={{ marginTop: isMappaView ? 10 : 14 }}>
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "form", label: "Nuova / Modifica" },
            { key: "pdf", label: "Quadro manutenzioni PDF" },
            { key: "mappa", label: "Mappa storico" },
          ].map((tab) => {
            const active = view === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`man-header-btn${active ? "" : " man-header-btn-outline"}`}
                onClick={() => setView(tab.key as ViewTab)}
                disabled={tab.key === "mappa" ? !activeTarga : false}
                style={
                  isMappaView
                    ? {
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        boxShadow: active ? "0 10px 20px rgba(22, 49, 77, 0.14)" : "none",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {notice ? (
          <div className="man-empty" style={{ marginTop: 12, background: "#eef6ef", borderStyle: "solid" }}>
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="man-empty" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}
      </div>

      {view === "mappa" ? (
        <div style={{ gridColumn: "1 / -1", width: "100%", minWidth: 0 }}>
          <NextMappaStoricoPage targa={activeTarga} />
        </div>
      ) : (
        <div className={`mx-surface-shell mx-surface-shell--${view}`}>
          {renderActiveSurface()}
        </div>
      )}

      {modalGommeOpen && mezzoSelezionato ? (
        <NextModalGomme
          open={modalGommeOpen}
          targa={mezzoSelezionato.targa}
          categoria={mezzoSelezionato.categoria ?? undefined}
          kmIniziale={km}
          enableCalibration={false}
          onClose={() => setModalGommeOpen(false)}
          onConfirm={handleGommeConfirm}
        />
      ) : null}
    </div>
  );
}
