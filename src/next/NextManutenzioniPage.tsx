import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextMappaStoricoPage from "./NextMappaStoricoPage";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import {
  readNextManutenzioniWorkspaceSnapshot,
  saveNextManutenzioneBusinessRecord,
  type NextManutenzioneGommeInterventoTipo,
  type NextManutenzioneGommePerAsseRecord,
  type NextManutenzioneGommeStraordinarioRecord,
  type NextManutenzioniLegacyDatasetRecord,
  type NextManutenzioniLegacyMaterialRecord,
  type NextManutenzioniMezzoOption,
} from "./domain/nextManutenzioniDomain";
import {
  buildNextGommeStraordinarieEvents,
  buildNextGommeStateByAsse,
  getNextAssiOptionsForCategoria,
  isNextCategoriaMotorizzata,
  normalizeNextAssiCoinvolti,
  type NextManutenzioneAsseCoinvoltoId,
} from "./domain/nextManutenzioniGommeDomain";
import { readNextLavoriInAttesaSnapshot } from "./domain/nextLavoriDomain";
import { readNextRifornimentiReadOnlySnapshot } from "./domain/nextRifornimentiDomain";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
} from "./nextAnagraficheFlottaDomain";
import { formatDateTimeUI } from "./nextDateFormat";
import { buildNextDossierPath } from "./nextStructuralPaths";
import "./next-mappa-storico.css";
import "../pages/Manutenzioni.css";

type TipoVoce = "mezzo" | "compressore" | "attrezzature";
type SottoTipo = "motrice" | "trattore";
type ViewTab = "dashboard" | "form" | "pdf" | "mappa";
type PdfPeriodFilter = "ultimo-mese" | "tutto" | `mese:${string}`;
type InterventoUiSubtype =
  | "tagliando"
  | "tagliando completo"
  | "gomme"
  | "gomme-straordinario"
  | "riparazione"
  | "altro";

type MaterialeManutenzione = NextManutenzioniLegacyMaterialRecord;
type AsseCoinvoltoId = NextManutenzioneAsseCoinvoltoId;

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

type PdfMetricInfo = {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  deltaLabel?: string;
  deltaValue?: string;
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

function toDateInputValue(value: string | null | undefined) {
  const parsed = parseLegacyDate(value);
  if (!parsed) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

function fromDateInputValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day} ${month} ${year}`;
}

function formatDateShort(value: string | null | undefined) {
  const parsed = parseLegacyDate(value);
  if (!parsed) return value || "Nessuna";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatNumberIt(value: number | null | undefined) {
  if (value == null) return "DA VERIFICARE";
  return new Intl.NumberFormat("it-IT").format(value);
}

function buildDescrizioneSnippet(value: string, limit = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3)}...`;
}

function formatMaintenanceImporto(
  item: Pick<
    NextManutenzioniLegacyDatasetRecord,
    "importo" | "sourceDocumentCurrency"
  >,
) {
  if (item.importo == null) return null;
  const amount = item.importo.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (item.sourceDocumentCurrency === "CHF") {
    return `CHF ${amount}`;
  }
  if (item.sourceDocumentCurrency === "EUR") {
    return `€ ${amount}`;
  }
  return amount;
}

function buildPdfFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${normalized || "quadro-manutenzioni"}.pdf`;
}

function formatPdfGenerationDate() {
  return formatDateTimeUI(new Date());
}

async function loadPdfImageData(url: string): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Errore lettura immagine PDF."));
      reader.readAsDataURL(blob);
    });

    return {
      dataUrl,
      format: blob.type.includes("png") ? "PNG" : "JPEG",
    };
  } catch {
    return null;
  }
}

function isGommeStraordinarieKeyword(value: string) {
  const normalized = value.toUpperCase();
  return (
    normalized.includes("FORAT") ||
    normalized.includes("DANN") ||
    normalized.includes("URGENT") ||
    normalized.includes("STRAORD") ||
    normalized.includes("SINGOL")
  );
}

function deriveUiSubtype(item: {
  descrizione: string;
  gommeInterventoTipo?: NextManutenzioneGommeInterventoTipo;
  gommePerAsse?: NextManutenzioneGommePerAsseRecord[];
  assiCoinvolti?: string[];
}): InterventoUiSubtype {
  if (item.gommeInterventoTipo === "straordinario") return "gomme-straordinario";
  if (
    item.gommeInterventoTipo === "ordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return "gomme";
  }

  const normalized = item.descrizione.toUpperCase();
  if ((normalized.includes("GOMME") || normalized.includes("PNEUM")) && isGommeStraordinarieKeyword(normalized)) {
    return "gomme-straordinario";
  }
  if (normalized.includes("CAMBIO GOMME")) return "gomme";
  if (normalized.includes("TAGLIANDO")) return "tagliando completo";
  if (normalized.includes("RIPARAZ")) return "riparazione";
  return "altro";
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
  const label = normalizeFreeText(item.descrizione || "");
  return {
    id: item.id,
    label: label || "MATERIALE SENZA DESCRIZIONE",
    quantitaTotale: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    fornitoreLabel: item.fornitore ?? null,
  };
}

function buildMisuraLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.tipo === "mezzo") {
    return item.km != null ? `${item.km} KM` : "-";
  }
  if (item.tipo === "compressore") {
    return item.ore != null ? `${item.ore} ORE` : "-";
  }
  if (item.ore != null) {
    return `${item.ore} ORE`;
  }
  if (item.km != null) {
    return `${item.km} KM`;
  }
  return "-";
}

function formatMetricValue(value: number | null | undefined, suffix: "KM" | "ORE") {
  if (value == null) return "DA VERIFICARE";
  return `${formatNumberIt(value)} ${suffix}`;
}

function buildPdfMetricInfo(args: {
  subjectType: TipoVoce;
  latestItem: NextManutenzioniLegacyDatasetRecord;
  currentKm: number | null;
  currentOre: number | null;
}): PdfMetricInfo | null {
  if (args.subjectType === "mezzo") {
    const currentKm = args.currentKm;
    const interventoKm = args.latestItem.km ?? null;
    const deltaKm =
      currentKm !== null && interventoKm !== null && currentKm >= interventoKm
        ? currentKm - interventoKm
        : null;

    return {
      primaryLabel: "Km attuali",
      primaryValue: formatMetricValue(currentKm, "KM"),
      secondaryLabel: "Km intervento",
      secondaryValue: formatMetricValue(interventoKm, "KM"),
      ...(deltaKm !== null
        ? {
            deltaLabel: "Δ km",
            deltaValue: formatMetricValue(deltaKm, "KM"),
          }
        : {}),
    };
  }

  if (args.subjectType === "compressore") {
    const currentOre = args.currentOre;
    const interventoOre = args.latestItem.ore ?? null;
    const deltaOre =
      currentOre !== null && interventoOre !== null && currentOre >= interventoOre
        ? currentOre - interventoOre
        : null;

    return {
      primaryLabel: "Ore attuali",
      primaryValue: formatMetricValue(currentOre, "ORE"),
      secondaryLabel: "Ore intervento",
      secondaryValue: formatMetricValue(interventoOre, "ORE"),
      ...(deltaOre !== null
        ? {
            deltaLabel: "Δ ore",
            deltaValue: formatMetricValue(deltaOre, "ORE"),
          }
        : {}),
    };
  }

  if (args.latestItem.ore != null) {
    return {
      primaryLabel: "Ore record",
      primaryValue: formatMetricValue(args.latestItem.ore, "ORE"),
    };
  }

  if (args.latestItem.km != null) {
    return {
      primaryLabel: "Km record",
      primaryValue: formatMetricValue(args.latestItem.km, "KM"),
    };
  }

  return null;
}

function resolvePdfMetricColumnLabel(items: NextManutenzioniLegacyDatasetRecord[]) {
  const types = Array.from(new Set(items.map((item) => item.tipo)));
  if (types.length === 1) {
    if (types[0] === "mezzo") return "Km";
    if (types[0] === "compressore") return "Ore";
    return "Misura";
  }
  return "Km/Ore";
}

function parseNullableNumberInput(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isUiSubtypeGommeOrdinario(value: InterventoUiSubtype) {
  return value === "gomme";
}

function isUiSubtypeGommeStraordinario(value: InterventoUiSubtype) {
  return value === "gomme-straordinario";
}

function isUiSubtypeGomme(value: InterventoUiSubtype) {
  return isUiSubtypeGommeOrdinario(value) || isUiSubtypeGommeStraordinario(value);
}

function buildGommePerAssePayload(args: {
  assiCoinvolti: AsseCoinvoltoId[];
  data: string;
  km: string;
  isMotorizzato: boolean;
}): NextManutenzioneGommePerAsseRecord[] {
  const dataCambio = normalizeFreeText(args.data) || null;
  const kmCambio = args.isMotorizzato ? parseNullableNumberInput(args.km) : null;

  return args.assiCoinvolti.map((asseId) => ({
    asseId,
    dataCambio,
    kmCambio,
  }));
}

function buildGommeStraordinarioPayload(args: {
  asseId: AsseCoinvoltoId | "";
  quantita: string;
  motivo: string;
}): NextManutenzioneGommeStraordinarioRecord | null {
  const asseId = args.asseId || null;
  const quantita = parseNullableNumberInput(args.quantita);
  const motivo = normalizeFreeText(args.motivo) || null;

  if (!asseId && quantita === null && !motivo) {
    return null;
  }

  return {
    asseId,
    quantita,
    motivo,
  };
}

function formatGommeInterventoPdfLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.gommeInterventoTipo === "straordinario") return "Gomme straordinarie";
  if (
    item.gommeInterventoTipo === "ordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return "Gomme ordinarie per asse";
  }
  return item.sottotipo || "-";
}

function buildPdfDescrizione(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.gommeInterventoTipo === "straordinario") {
    const motivo = item.gommeStraordinario?.motivo || "Evento gomme straordinario";
    return `[STRAORDINARIO] ${motivo} - ${item.descrizione}`;
  }
  if (
    item.gommeInterventoTipo === "ordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return `[ORDINARIO] ${item.descrizione}`;
  }
  return item.descrizione;
}

function mapLegacyRecordToGommeReadModel(item: NextManutenzioniLegacyDatasetRecord) {
  return {
    id: item.id,
    mezzoTarga: item.targa,
    targa: item.targa,
    data: item.data ?? null,
    dataLabel: item.data ?? null,
    timestamp: getLegacyDateTimestamp(item.data),
    descrizione: item.descrizione ?? null,
    tipo: item.tipo ?? null,
    km: item.km ?? null,
    ore: item.ore ?? null,
    fornitore: item.fornitore ?? null,
    materialiCount: item.materiali?.length ?? 0,
    assiCoinvolti: normalizeNextAssiCoinvolti(item.assiCoinvolti),
    gommePerAsse: item.gommePerAsse ?? [],
    gommeInterventoTipo: item.gommeInterventoTipo ?? null,
    gommeStraordinario: item.gommeStraordinario ?? null,
    isCambioGommeDerived:
      (item.gommePerAsse?.length ?? 0) > 0 ||
      item.descrizione.toUpperCase().includes("GOMME") ||
      item.descrizione.toUpperCase().includes("PNEUM"),
    sourceDataset: "@manutenzioni",
    sourceRecordId: item.id,
    sourceOrigin: "manuale",
    quality: "source_direct" as const,
    flags: [],
  };
}

function toMaterialiTemp(items: NextManutenzioniLegacyDatasetRecord["materiali"]): MaterialeManutenzione[] {
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
  const location = useLocation();
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
  const [selectedDetailRecordId, setSelectedDetailRecordId] = useState<string | null>(null);
  const [ricercaMezzo, setRicercaMezzo] = useState("");
  const [pdfQuickSearch, setPdfQuickSearch] = useState("");
  const [pdfSubjectType, setPdfSubjectType] = useState<TipoVoce>("mezzo");
  const [pdfPeriodFilter, setPdfPeriodFilter] = useState<PdfPeriodFilter>("ultimo-mese");

  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [uiSubtype, setUiSubtype] = useState<InterventoUiSubtype>("altro");
  const [fornitore, setFornitore] = useState("");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(todayLabel());
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [assiCoinvolti, setAssiCoinvolti] = useState<AsseCoinvoltoId[]>([]);
  const [gommeStraordinarioMotivo, setGommeStraordinarioMotivo] = useState("");
  const [gommeStraordinarioAsseId, setGommeStraordinarioAsseId] = useState<AsseCoinvoltoId | "">("");
  const [gommeStraordinarioQuantita, setGommeStraordinarioQuantita] = useState("");
  const [quantitaTemp, setQuantitaTemp] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const requestedTarga = useMemo(
    () => normalizeText(new URLSearchParams(location.search).get("targa") ?? ""),
    [location.search],
  );

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
  const mezzoPreviewByTarga = useMemo(
    () => new Map(mezzoPreview.map((mezzo) => [mezzo.targa, mezzo] as const)),
    [mezzoPreview],
  );
  const mezzoSelezionato = useMemo(
    () => mezzi.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzi],
  );
  const mezzoPreviewSelezionato = useMemo(
    () => mezzoPreview.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzoPreview],
  );
  const categoriaTecnica = mezzoPreviewSelezionato?.categoria ?? mezzoSelezionato?.categoria ?? null;
  const assiDisponibili = useMemo(
    () => getNextAssiOptionsForCategoria(categoriaTecnica),
    [categoriaTecnica],
  );
  const categoriaMotorizzata = useMemo(
    () => isNextCategoriaMotorizzata(categoriaTecnica),
    [categoriaTecnica],
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
  const lavoriApertiMezzo = lavoriInAttesaByTarga[activeTarga] ?? 0;
  const kmUltimoRifornimento = kmUltimoByTarga[activeTarga] ?? null;
  const latestRecord = storicoMezzoOrdinato[0] ?? null;
  const selectedDetailRecord = useMemo(
    () => storicoMezzoOrdinato.find((item) => item.id === selectedDetailRecordId) ?? null,
    [selectedDetailRecordId, storicoMezzoOrdinato],
  );
  const ultimiInterventi = useMemo(() => storicoMezzoOrdinato.slice(0, 5), [storicoMezzoOrdinato]);
  const ultimeManutenzioniMezzo = useMemo(
    () => storicoMezzoOrdinato.filter((item) => item.tipo === "mezzo").slice(0, 4),
    [storicoMezzoOrdinato],
  );
  const ultimeManutenzioniMezzoSenzaUltimo = useMemo(() => {
    const ultimoRecord = ultimeManutenzioniMezzo[0] ?? null;
    if (!ultimoRecord) return [];
    return ultimeManutenzioniMezzo.filter((item) => item.id !== ultimoRecord.id);
  }, [ultimeManutenzioniMezzo]);
  const ultimeManutenzioniCompressore = useMemo(
    () => storicoMezzoOrdinato.filter((item) => item.tipo === "compressore").slice(0, 4),
    [storicoMezzoOrdinato],
  );
  const ultimeManutenzioniCompressoreSenzaUltimo = useMemo(() => {
    const ultimoRecord = ultimeManutenzioniCompressore[0] ?? null;
    if (!ultimoRecord) return [];
    return ultimeManutenzioniCompressore.filter((item) => item.id !== ultimoRecord.id);
  }, [ultimeManutenzioniCompressore]);
  const latestGommeKmCambio = useMemo(() => {
    const record = storicoMezzoOrdinato.find(
      (item) =>
        item.gommeInterventoTipo !== "straordinario" &&
        ((item.gommePerAsse?.length ?? 0) > 0 || (item.assiCoinvolti?.length ?? 0) > 0),
    );
    if (!record) return null;
    return record.gommePerAsse?.[0]?.kmCambio ?? record.km ?? null;
  }, [storicoMezzoOrdinato]);
  const gommePerAsseDraft = useMemo(
    () =>
      isUiSubtypeGommeOrdinario(uiSubtype)
        ? buildGommePerAssePayload({
            assiCoinvolti,
            data,
            km,
            isMotorizzato: categoriaMotorizzata,
          })
        : [],
    [assiCoinvolti, categoriaMotorizzata, data, km, uiSubtype],
  );
  const gommeStraordinarioDraft = useMemo(
    () =>
      isUiSubtypeGommeStraordinario(uiSubtype)
        ? buildGommeStraordinarioPayload({
            asseId: gommeStraordinarioAsseId,
            quantita: gommeStraordinarioQuantita,
            motivo: gommeStraordinarioMotivo,
          })
        : null,
    [gommeStraordinarioAsseId, gommeStraordinarioMotivo, gommeStraordinarioQuantita, uiSubtype],
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
  const latestMetricByTargaAndTipo = useMemo(() => {
    const sortedItems = [...storico].sort(
      (left, right) => getLegacyDateTimestamp(right.data) - getLegacyDateTimestamp(left.data),
    );
    const byKey = new Map<string, { km: number | null; ore: number | null }>();

    sortedItems.forEach((item) => {
      const key = `${item.tipo}:${normalizeText(item.targa)}`;
      const current = byKey.get(key) ?? { km: null, ore: null };
      if (current.km === null && item.km != null) {
        current.km = item.km;
      }
      if (current.ore === null && item.ore != null) {
        current.ore = item.ore;
      }
      byKey.set(key, current);
    });

    return byKey;
  }, [storico]);
  const pdfGroupedResults = useMemo(() => {
    const grouped = new Map<string, NextManutenzioniLegacyDatasetRecord[]>();
    pdfFilteredItems.forEach((item) => {
      const key = normalizeText(item.targa);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    return [...grouped.entries()].map(([targaKey, items]) => {
      const maintenanceItems = items.map(mapLegacyRecordToGommeReadModel);
      const categoria = mezzoPreview.find((entry) => entry.targa === targaKey)?.categoria ?? null;
      const currentMetrics = latestMetricByTargaAndTipo.get(`${pdfSubjectType}:${targaKey}`) ?? {
        km: null,
        ore: null,
      };

      return {
        targa: targaKey,
        latest: items[0],
        mezzo: mezzoPreview.find((entry) => entry.targa === targaKey) ?? null,
        total: items.length,
        metricInfo: buildPdfMetricInfo({
          subjectType: pdfSubjectType,
          latestItem: items[0],
          currentKm: kmUltimoByTarga[targaKey] ?? null,
          currentOre: currentMetrics.ore,
        }),
        gommePerAsse: buildNextGommeStateByAsse({
          categoria,
          maintenanceItems,
          kmAttuali: kmUltimoByTarga[targaKey] ?? null,
        }),
        gommeStraordinarie: buildNextGommeStraordinarieEvents({
          categoria,
          maintenanceItems,
        }),
      };
    });
  }, [kmUltimoByTarga, latestMetricByTargaAndTipo, mezzoPreview, pdfFilteredItems, pdfSubjectType]);
  const ricercaRapida = normalizeFreeText(ricercaMezzo).toUpperCase();
  const pdfRicercaRapida = normalizeFreeText(pdfQuickSearch).toUpperCase();
  const mezziSelezionabili = useMemo(() => {
    if (!ricercaRapida) return mezzi;
    return mezzi.filter((mezzo) => {
      const preview = mezzoPreviewByTarga.get(normalizeText(mezzo.targa));
      const haystack = [
        mezzo.label,
        mezzo.targa,
        mezzo.categoria,
        preview?.marcaModello,
        preview?.autistaNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return haystack.includes(ricercaRapida);
    });
  }, [mezzi, mezzoPreviewByTarga, ricercaRapida]);
  const pdfVisibleResults = useMemo(() => {
    if (!ricercaRapida && !pdfRicercaRapida) return pdfGroupedResults;
    return pdfGroupedResults.filter((result) => {
      const pageHaystack = [
        result.targa,
        result.mezzo?.marcaModello,
        result.mezzo?.label,
        result.mezzo?.autistaNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();
      const pdfHaystack = [result.targa, result.mezzo?.autistaNome]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();
      const matchesPageSearch = !ricercaRapida || pageHaystack.includes(ricercaRapida);
      const matchesPdfSearch = !pdfRicercaRapida || pdfHaystack.includes(pdfRicercaRapida);
      return matchesPageSearch && matchesPdfSearch;
    });
  }, [pdfGroupedResults, pdfRicercaRapida, ricercaRapida]);
  const pdfVisibleItems = useMemo(() => {
    const visibleTarghe = new Set(pdfVisibleResults.map((result) => normalizeText(result.targa)));
    return pdfFilteredItems.filter((item) => visibleTarghe.has(normalizeText(item.targa)));
  }, [pdfFilteredItems, pdfVisibleResults]);
  const contextPlaceholder = !activeTarga && !mezzoPreviewSelezionato;

  useEffect(() => {
    if (!requestedTarga || mezzi.length === 0) {
      return;
    }

    const matchedMezzo = mezzi.find((mezzo) => normalizeText(mezzo.targa) === requestedTarga);
    if (!matchedMezzo) {
      return;
    }

    setSelectedTarga((current) => (current === requestedTarga ? current : requestedTarga));
    setTarga((current) => (current === requestedTarga ? current : requestedTarga));
    setSelectedDetailRecordId(null);
    setView("dashboard");
    setNotice(null);
  }, [mezzi, requestedTarga]);

  useEffect(() => {
    const validAssi = new Set(assiDisponibili.map((asse) => asse.id));
    setAssiCoinvolti((current) => {
      const next = current.filter((asseId) => validAssi.has(asseId));
      return next.length === current.length ? current : next;
    });
  }, [assiDisponibili]);

  useEffect(() => {
    if (!selectedDetailRecordId) return;
    if (!storicoMezzoOrdinato.some((item) => item.id === selectedDetailRecordId)) {
      setSelectedDetailRecordId(null);
    }
  }, [selectedDetailRecordId, storicoMezzoOrdinato]);

  function handleSelectContextTarga(value: string) {
    const normalized = normalizeText(value);
    setSelectedTarga(normalized);
    setTarga(normalized);
    setNotice(null);
  }

  function openDetailForRecord(item: NextManutenzioniLegacyDatasetRecord) {
    const normalized = normalizeText(item.targa);
    setSelectedTarga(normalized);
    setTarga(normalized);
    setSelectedDetailRecordId(item.id);
    setNotice(null);
    setView("mappa");
  }

  function resetForm(nextTarga?: string) {
    const currentTarga = nextTarga ?? activeTarga;
    setTipo("mezzo");
    setUiSubtype("altro");
    setFornitore("");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setData(todayLabel());
    setMaterialeSearch("");
    setMaterialiTemp([]);
    setAssiCoinvolti([]);
    setGommeStraordinarioMotivo("");
    setGommeStraordinarioAsseId("");
    setGommeStraordinarioQuantita("");
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
    setSelectedDetailRecordId(item.id);
    setTarga(item.targa);
    setTipo(item.tipo);
    setFornitore(item.fornitore ?? "");
    setKm(item.km != null ? String(item.km) : "");
    setOre(item.ore != null ? String(item.ore) : "");
    setSottotipo(item.sottotipo ?? "motrice");
    setUiSubtype(deriveUiSubtype(item));
    setDescrizione(item.descrizione);
    setEseguito(item.eseguito ?? "");
    setData(item.data);
    setMaterialiTemp(toMaterialiTemp(item.materiali));
    setAssiCoinvolti(
      normalizeNextAssiCoinvolti(
        item.gommeInterventoTipo !== "straordinario" && item.gommePerAsse?.length
          ? item.gommePerAsse.map((entry) => entry.asseId)
          : item.assiCoinvolti,
      ),
    );
    setGommeStraordinarioMotivo(item.gommeStraordinario?.motivo ?? "");
    setGommeStraordinarioAsseId(item.gommeStraordinario?.asseId ?? "");
    setGommeStraordinarioQuantita(
      item.gommeStraordinario?.quantita != null ? String(item.gommeStraordinario.quantita) : "",
    );
    setView("form");
    setNotice("Modifica caricata dal dataset reale.");
  }

  function handleUiSubtypeChange(nextSubtype: InterventoUiSubtype) {
    setUiSubtype(nextSubtype);
    if (nextSubtype === "tagliando completo" && !descrizione.trim()) {
      setDescrizione("TAGLIANDO - ");
    }
    if (!isUiSubtypeGommeOrdinario(nextSubtype)) {
      setAssiCoinvolti([]);
    }
    if (!isUiSubtypeGommeStraordinario(nextSubtype)) {
      setGommeStraordinarioMotivo("");
      setGommeStraordinarioAsseId("");
      setGommeStraordinarioQuantita("");
    }
  }

  function toggleAsseCoinvolto(asseId: AsseCoinvoltoId) {
    setAssiCoinvolti((current) =>
      current.includes(asseId)
        ? current.filter((entry) => entry !== asseId)
        : [...current, asseId],
    );
  }

  async function handleSave() {
    const normalizedTarga = normalizeText(targa);
    const normalizedDescrizione = normalizeFreeText(descrizione);
    const normalizedData = normalizeFreeText(data);

    if (!normalizedTarga || !normalizedDescrizione || !normalizedData) {
      window.alert("Compila almeno TARGA, DESCRIZIONE e DATA.");
      return;
    }

    if (tipo === "mezzo" && categoriaMotorizzata && !km) {
      const confirmed = window.confirm("Non hai inserito i KM. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (tipo !== "mezzo" && !ore) {
      const confirmed = window.confirm("Non hai inserito le ORE. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (isUiSubtypeGommeOrdinario(uiSubtype) && assiCoinvolti.length === 0) {
      window.alert("Per il cambio gomme ordinario devi selezionare almeno un asse.");
      return;
    }

    if (isUiSubtypeGommeStraordinario(uiSubtype) && !normalizeFreeText(gommeStraordinarioMotivo)) {
      window.alert("Per l'evento gomme straordinario seleziona un motivo esplicito.");
      return;
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
        assiCoinvolti: isUiSubtypeGommeOrdinario(uiSubtype) ? assiCoinvolti : [],
        gommePerAsse: isUiSubtypeGommeOrdinario(uiSubtype) ? gommePerAsseDraft : [],
        gommeInterventoTipo: isUiSubtypeGomme(uiSubtype)
          ? isUiSubtypeGommeStraordinario(uiSubtype)
            ? "straordinario"
            : "ordinario"
          : null,
        gommeStraordinario: isUiSubtypeGommeStraordinario(uiSubtype) ? gommeStraordinarioDraft : null,
      });
      await refreshData();
      setSelectedTarga(savedRecord.targa);
      setSelectedDetailRecordId(savedRecord.id);
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

  async function exportPdfForItems(items: NextManutenzioniLegacyDatasetRecord[], title: string) {
    if (!items.length) {
      window.alert("Non ci sono manutenzioni da esportare.");
      return;
    }

    const { default: JsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const misuraColumnLabel = resolvePdfMetricColumnLabel(items);
    let y = margin;

    const checkPage = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const uniqueTarghe = Array.from(new Set(items.map((item) => normalizeText(item.targa)).filter(Boolean)));
    const singleTarga = uniqueTarghe.length === 1 ? uniqueTarghe[0] : null;
    const mezzoPdf = singleTarga ? mezzoPreviewByTarga.get(singleTarga) ?? null : null;
    const photoData =
      singleTarga && mezzoPdf?.fotoUrl
        ? await loadPdfImageData(mezzoPdf.fotoUrl)
        : null;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(title, margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generato il ${formatPdfGenerationDate()}`, margin, y);
    y += 7;

    if (singleTarga) {
      checkPage(42);
      const headerTop = y;
      const photoWidth = 58;
      const photoHeight = 36;
      const photoX = pageWidth - margin - photoWidth;
      const textWidth = pageWidth - margin * 2 - photoWidth - 10;
      const headerLines = [
        `Targa: ${singleTarga}`,
        `Mezzo: ${mezzoPdf?.marcaModello ?? mezzoPdf?.label ?? "DA VERIFICARE"}`,
        `Autista: ${mezzoPdf?.autistaNome || "DA VERIFICARE"}`,
        `Record esportati: ${items.length}`,
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Mezzo selezionato", margin, headerTop);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      headerLines.forEach((line, index) => {
        doc.text(line, margin, headerTop + 7 + index * 5, { maxWidth: textWidth });
      });

      if (photoData) {
        doc.addImage(photoData.dataUrl, photoData.format, photoX, headerTop, photoWidth, photoHeight, undefined, "FAST");
      } else {
        doc.setDrawColor(200, 190, 176);
        doc.setFillColor(250, 246, 240);
        doc.roundedRect(photoX, headerTop, photoWidth, photoHeight, 3, 3, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Foto reale non disponibile", photoX + photoWidth / 2, headerTop + photoHeight / 2, {
          align: "center",
        });
      }

      y += 42;
    }

    checkPage(20);
    autoTable(doc as Parameters<typeof autoTable>[0], {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[
        "Targa",
        "Tipo",
        misuraColumnLabel,
        "Sottotipo",
        "Descrizione",
        "Fornitore",
        "Eseguito da",
        "Data",
      ]],
      body: items.map((item) => [
        item.targa,
        item.tipo === "mezzo" ? "MEZZO" : item.tipo === "compressore" ? "COMPRESSORE" : "ATTREZZATURE",
        buildMisuraLabel(item),
        formatGommeInterventoPdfLabel(item),
        buildPdfDescrizione(item),
        item.fornitore || "-",
        item.eseguito || "-",
        item.data,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2.4,
        lineColor: [222, 214, 203],
        lineWidth: 0.1,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [52, 50, 46],
        textColor: [245, 240, 230],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 245, 238],
      },
      bodyStyles: {
        textColor: [37, 35, 32],
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32 },
        4: { cellWidth: 92 },
        5: { cellWidth: 32 },
        6: { cellWidth: 30 },
        7: { cellWidth: 18 },
      },
    });

    doc.save(buildPdfFileName(title));
  }

  function renderContextBar() {
    const contextBlocks = [
      { label: "Targa", value: mezzoPreviewSelezionato?.targa || activeTarga || "-" },
      {
        label: "Modello",
        value: mezzoPreviewSelezionato?.marcaModello ?? mezzoPreviewSelezionato?.label ?? "-",
      },
      {
        label: "Autista solito",
        value: mezzoPreviewSelezionato?.autistaNome || "DA VERIFICARE",
      },
      {
        label: "KM attuali",
        value: activeTarga ? formatNumberIt(kmUltimoRifornimento) : "-",
      },
      {
        label: "Ultima manutenzione",
        value: activeTarga ? latestRecord?.data || "Nessuna" : "-",
      },
    ];

    if (contextPlaceholder) {
      return (
        <div className="man2-context-bar">
          {contextBlocks.map((item, index) => (
            <Fragment key={item.label}>
              <div className="man2-ctx-item">
                <span className="man2-ctx-label">{item.label}</span>
                <span className="man2-ctx-value">{item.value}</span>
              </div>
              {index < contextBlocks.length - 1 ? <div className="man2-ctx-divider" /> : null}
            </Fragment>
          ))}
        </div>
      );
    }

    return (
      <div className="man2-context-bar">
        {contextBlocks.map((item, index) => (
          <Fragment key={item.label}>
            <div className="man2-ctx-item">
              <span className="man2-ctx-label">{item.label}</span>
              <span className="man2-ctx-value">{item.value}</span>
            </div>
            {index < contextBlocks.length - 1 ? <div className="man2-ctx-divider" /> : null}
          </Fragment>
        ))}
      </div>
    );
  }

  function renderDashboard() {
    const interventiMezzo = storicoMezzo.filter((item) => item.tipo === "mezzo").length;
    const interventiCompressore = storicoMezzo.filter((item) => item.tipo === "compressore").length;

    return (
      <section className="man2-screen">
        <div className="man2-screen-head man2-screen-head--dashboard">
          <div>
            <h2 className="man2-screen-title">Dashboard</h2>
          </div>
        </div>

        <div className="man2-dash-kpis">
          <article className="man2-kpi">
            <div className="man2-kpi__label">Interventi mezzo</div>
            <div className="man2-kpi__value">{interventiMezzo}</div>
            <div className="man2-kpi__sub">su {activeTarga || "nessuna targa"}</div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Interventi compressore</div>
            <div className="man2-kpi__value">{interventiCompressore}</div>
            <div className="man2-kpi__sub">su {activeTarga || "nessuna targa"}</div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Ultimo intervento</div>
            <div className="man2-kpi__value">{latestRecord ? formatDateShort(latestRecord.data) : "Nessuno"}</div>
            <div className="man2-kpi__sub">
              {latestRecord ? buildDescrizioneSnippet(latestRecord.descrizione, 38) : "nessun dato"}
            </div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Segnalazioni aperte</div>
            <div className="man2-kpi__value">{lavoriApertiMezzo}</div>
            <div className="man2-kpi__sub">{lavoriApertiMezzo === 0 ? "nessuna" : "in attesa"}</div>
          </article>
        </div>

        <div className="man2-nav-veloce">
          <button type="button" className="man2-nav-btn man2-nav-btn--primary" onClick={() => setView("form")}>
            + Nuova manutenzione
          </button>
          <button type="button" className="man2-nav-btn" onClick={() => setView("mappa")} disabled={!activeTarga}>
            Dettaglio mezzo
          </button>
          <button type="button" className="man2-nav-btn" onClick={() => setView("pdf")}>
            Quadro PDF
          </button>
          <button
            type="button"
            className="man2-nav-btn"
            onClick={() => mezzoPreviewSelezionato && navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))}
            disabled={!mezzoPreviewSelezionato}
          >
            Dossier mezzo
          </button>
        </div>

        <div className="man2-section-title">Ultimi interventi</div>
        <div className="man2-last-list">
          {ultimiInterventi.length > 0 ? (
            ultimiInterventi.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`man2-last-item man2-last-item--button${selectedDetailRecordId === item.id ? " is-active" : ""}`}
                onClick={() => openDetailForRecord(item)}
              >
                <div className="man2-last-item__row1">
                  <div>
                    <span className="man2-last-item__title">{buildDescrizioneSnippet(item.descrizione, 40)}</span>
                    <div className="man2-last-item__meta">
                      {[
                        item.data,
                        buildMisuraLabel(item),
                        item.fornitore || null,
                        formatMaintenanceImporto(item),
                        item.sottotipo || "intervento programmato",
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </div>
                  </div>
                  <span className={`man2-badge man2-badge--${item.tipo}`}>{item.tipo}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="man-empty">Nessun intervento disponibile per il mezzo selezionato.</div>
          )}
        </div>
      </section>
    );
  }
  function renderForm() {
    const misuraValue = tipo === "mezzo" ? km : ore;

    return (
      <section className="man2-screen">
        <div className="man2-form-shell">
            <div className="man2-screen-head man2-screen-head--form">
            <div>
              <h2 className="man2-screen-title">{editingId ? "Modifica manutenzione" : "Nuova manutenzione"}</h2>
            </div>
            <div className="man2-screen-context">
              <span className="man2-screen-context__label">Mezzo attivo</span>
              <strong>{mezzoPreviewSelezionato?.targa || activeTarga || "Nessuno"}</strong>
              <span>{mezzoPreviewSelezionato?.marcaModello || "Seleziona un mezzo dalla testata superiore"}</span>
            </div>
          </div>

          <section className="man2-form-block">
            <div className="man2-section-title">Campi base</div>
            <div className="man2-field-row">
              <div className="man2-field">
                <label className="man2-field__label">Tipo</label>
                <select value={tipo} onChange={(event) => setTipo(event.target.value as TipoVoce)}>
                  <option value="mezzo">Mezzo</option>
                  <option value="compressore">Compressore</option>
                  <option value="attrezzature">Attrezzature</option>
                </select>
              </div>
              <div className="man2-field">
                <label className="man2-field__label">Sottotipo</label>
                <select
                  value={uiSubtype}
                  onChange={(event) => handleUiSubtypeChange(event.target.value as InterventoUiSubtype)}
                  title="Scegli il ramo operativo della manutenzione. Le gomme ordinarie aggiornano lo stato per asse, le straordinarie restano eventi separati."
                  aria-label="Sottotipo manutenzione"
                >
                  <option value="tagliando">Tagliando</option>
                  <option value="tagliando completo">Tagliando completo</option>
                  <option value="gomme">Gomme ordinarie per asse</option>
                  <option value="gomme-straordinario">Gomme straordinarie</option>
                  <option value="riparazione">Riparazione</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
            </div>

            <div className="man2-metric-row">
              <div className="man2-field man2-metric-group man2-metric-group--date">
                <label className="man2-field__label">Data</label>
                <input
                  type="date"
                  value={toDateInputValue(data)}
                  onChange={(event) => setData(fromDateInputValue(event.target.value))}
                />
              </div>
              <div className="man2-field man2-metric-group man2-metric-group--metric">
                <label className="man2-field__label">
                  {tipo === "mezzo"
                    ? isUiSubtypeGommeOrdinario(uiSubtype) && !categoriaMotorizzata
                      ? "KM (facoltativo)"
                      : isUiSubtypeGommeStraordinario(uiSubtype)
                        ? "KM mezzo (facoltativo)"
                      : "KM"
                    : "ORE"}
                </label>
                <input
                  type="number"
                  value={misuraValue}
                  onChange={(event) => {
                    if (tipo === "mezzo") {
                      setKm(event.target.value);
                      return;
                    }
                    setOre(event.target.value);
                  }}
                  inputMode="numeric"
                />
              </div>
              <div className="man2-field man2-metric-group man2-metric-group--supplier">
                <label className="man2-field__label">Fornitore</label>
                <input
                  value={fornitore}
                  onChange={(event) => setFornitore(event.target.value.toUpperCase())}
                  placeholder="Es. Officina Rossi"
                />
              </div>
            </div>

            {isUiSubtypeGommeOrdinario(uiSubtype) ? (
              <div className="man2-assi-section">
                <div
                  className="man2-section-title"
                  title="Aggiorna lo stato gomme ordinario del mezzo asse per asse."
                >
                  Cambio gomme ordinario per asse
                </div>
                {assiDisponibili.length > 0 ? (
                  <>
                    <div className="man2-assi-chip-row">
                      {assiDisponibili.map((asse) => {
                        const isActive = assiCoinvolti.includes(asse.id);
                        return (
                          <button
                            key={asse.id}
                            type="button"
                            className={`man2-assi-chip${isActive ? " is-active" : ""}`}
                            onClick={() => toggleAsseCoinvolto(asse.id)}
                            title={`Seleziona ${asse.label} per il cambio gomme ordinario.`}
                            aria-label={`Asse ${asse.label}, ${asse.wheelsCount} gomme`}
                          >
                            <span>{asse.label}</span>
                            <small>{asse.wheelsCount} gomme</small>
                          </button>
                        );
                      })}
                    </div>

                    {gommePerAsseDraft.length > 0 ? (
                      <div className="man2-gomme-asse-list">
                        {gommePerAsseDraft.map((entry) => (
                          <article key={entry.asseId} className="man2-gomme-asse-card">
                            <div className="man2-gomme-asse-card__head">
                              <strong>
                                {assiDisponibili.find((asse) => asse.id === entry.asseId)?.label ?? entry.asseId}
                              </strong>
                              <span>{categoriaMotorizzata ? "mezzo motorizzato" : "rimorchio / semirimorchio"}</span>
                            </div>
                            <div className="man2-gomme-asse-card__meta">
                              <div>
                                <span>Data cambio</span>
                                <strong>{entry.dataCambio || "DA INSERIRE"}</strong>
                              </div>
                              {categoriaMotorizzata ? (
                                <div>
                                  <span>Km cambio</span>
                                  <strong>
                                    {entry.kmCambio !== null ? formatNumberIt(entry.kmCambio) : "DA INSERIRE"}
                                  </strong>
                                </div>
                              ) : (
                                <div>
                                  <span>Nota</span>
                                  <strong>Per questa categoria fa fede soprattutto la data cambio.</strong>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="man2-assi-empty">
                        Seleziona almeno un asse per costruire lo stato gomme dell&apos;intervento.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="man2-assi-empty">
                    Nessuna tavola tecnica disponibile per la categoria del mezzo selezionato.
                  </div>
                )}
              </div>
            ) : null}

            {isUiSubtypeGommeStraordinario(uiSubtype) ? (
              <div className="man2-assi-section man2-assi-section--straordinario">
                <div
                  className="man2-section-title"
                  title="Registra un evento gomme puntuale senza aggiornare lo stato ordinario per asse."
                >
                  Evento gomme straordinario
                </div>
                <div className="man2-field-row3 man2-field-row3--gomme-straordinarie">
                  <div className="man2-field">
                    <label className="man2-field__label">Motivo straordinario</label>
                    <select
                      value={gommeStraordinarioMotivo}
                      onChange={(event) => setGommeStraordinarioMotivo(event.target.value)}
                      title="Spiega il motivo dell'intervento straordinario."
                      aria-label="Motivo intervento gomme straordinario"
                    >
                      <option value="">- Seleziona motivo -</option>
                      <option value="gomma singola">Gomma singola</option>
                      <option value="sostituzione urgente">Sostituzione urgente</option>
                      <option value="foratura / danno">Foratura / danno</option>
                      <option value="intervento non pianificato">Intervento non pianificato</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div className="man2-field">
                    <label className="man2-field__label">Asse coinvolto (facoltativo)</label>
                    <select
                      value={gommeStraordinarioAsseId}
                      onChange={(event) =>
                        setGommeStraordinarioAsseId(event.target.value as AsseCoinvoltoId | "")
                      }
                      title="Indica l'asse solo se l'intervento straordinario riguarda una zona precisa."
                      aria-label="Asse coinvolto evento gomme straordinario"
                    >
                      <option value="">Non specificato</option>
                      {assiDisponibili.map((asse) => (
                        <option key={asse.id} value={asse.id}>
                          {asse.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="man2-field">
                    <label className="man2-field__label">Numero gomme coinvolte (facoltativo)</label>
                    <input
                      type="number"
                      min="1"
                      value={gommeStraordinarioQuantita}
                      onChange={(event) => setGommeStraordinarioQuantita(event.target.value)}
                      inputMode="numeric"
                      placeholder="Es. 1"
                      title="Numero di gomme coinvolte nell'evento straordinario."
                      aria-label="Numero gomme coinvolte"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="man2-form-block">
            <div className="man2-section-title">Descrizione / note</div>
            <div className="man2-field">
              <label className="man2-field__label">Dettaglio intervento</label>
              <textarea
                rows={4}
                value={descrizione}
                onChange={(event) => setDescrizione(event.target.value)}
                placeholder="Es. Sostituzione pastiglie freno anteriori"
              />
            </div>
          </section>

          {uiSubtype === "tagliando completo" ? (
            <section className="man2-form-block man2-form-block--accent">
              <div className="man2-section-title">Tagliando completo</div>
              <div className="man2-tagliando-box">
                <div className="man2-chip-row">
                  {TAGLIANDO_COMPONENTI.map((item) => (
                    <span key={item} className="man2-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="man2-form-block man2-form-block--materials">
            <div className="man2-section-title">Componenti inclusi / materiali</div>
            <div className="man2-material-shell">
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
                          <div className="man-autosuggest-main man2-material-suggest-main">
                            <span className="man-autosuggest-label man2-material-suggest-label">{item.label}</span>
                            {item.fornitoreLabel ? (
                              <span className="man-autosuggest-supplier man2-material-suggest-supplier">
                                Fornitore: {item.fornitoreLabel}
                              </span>
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

                <div className="man-materiale-right man2-material-side">
                  <label className="man-label-inline">
                    <span className="man-label-text">Quantita</span>
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
                    className="man2-btn"
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
                <div className="man2-material-list">
                  {materialiTemp.map((item) => (
                    <div key={item.id} className="man2-material-row">
                      <span>
                        <strong>{item.label}</strong> - {item.quantita} {item.unita}
                        {item.fromInventario ? " (da inventario)" : ""}
                      </span>
                      <button type="button" className="man-delete-btn" onClick={() => handleRemoveMateriale(item.id)}>
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="man-empty">Nessun materiale associato alla manutenzione corrente.</div>
              )}
            </div>
          </section>

          <div className="man2-form-actions">
            <button type="button" className="man2-btn-full" onClick={() => void handleSave()} disabled={saving}>
              Salva manutenzione
            </button>
          </div>
        </div>
      </section>
    );
  }
  function renderPdfPanel() {
    return (
      <section className="man2-screen">
        <div className="man2-pdf-shell">
          <div className="man2-pdf-head">
            <div>
              <div className="man2-panel-kicker">Quadro manutenzioni PDF</div>
              <h2 className="man2-screen-title">Quadro manutenzioni PDF</h2>
            </div>
            <button
              type="button"
              className="man2-btn"
              title="Esporta il quadro corrente. Se il filtro riguarda una sola targa, il PDF usa la foto reale del mezzo."
              aria-label="Esporta il quadro manutenzioni"
              onClick={() =>
                void exportPdfForItems(
                  pdfVisibleItems,
                  `Quadro manutenzioni ${formatMonthFilterLabel(pdfPeriodFilter)}`,
                )
              }
            >
              PDF quadro generale
            </button>
          </div>

          <div className="man2-pdf-steps">
            <div className="man2-pdf-step">
              <span className="man2-pdf-step__index">Step 1</span>
              <div className="man2-form-title">Soggetto</div>
              <div className="man2-field">
                <label className="man2-field__label">Filtro soggetto</label>
                <select
                  value={pdfSubjectType}
                  onChange={(event) => setPdfSubjectType(event.target.value as TipoVoce)}
                  title="Scegli se leggere il quadro per mezzo, compressore o attrezzature."
                  aria-label="Filtro soggetto quadro manutenzioni"
                >
                  <option value="mezzo">Mezzo</option>
                  <option value="compressore">Compressore</option>
                  <option value="attrezzature">Attrezzature</option>
                </select>
              </div>
            </div>
            <div className="man2-pdf-step">
              <span className="man2-pdf-step__index">Step 2</span>
              <div className="man2-form-title">Periodo</div>
              <div className="man2-field">
                <label className="man2-field__label">Filtro periodo</label>
                <select
                  value={pdfPeriodFilter}
                  onChange={(event) => setPdfPeriodFilter(event.target.value as PdfPeriodFilter)}
                  title="Limita il quadro al periodo desiderato."
                  aria-label="Filtro periodo quadro manutenzioni"
                >
                  <option value="tutto">Tutto</option>
                  <option value="ultimo-mese">Ultimo mese</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatMonthFilterLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="man2-pdf-step">
              <span className="man2-pdf-step__index">Step 3</span>
              <div className="man2-form-title">Ricerca rapida</div>
              <div className="man2-field">
                <label className="man2-field__label">Filtra per targa o autista</label>
                <input
                  type="text"
                  value={pdfQuickSearch}
                  onChange={(event) => setPdfQuickSearch(event.target.value)}
                  placeholder="Es. AB123CD o Mario Rossi"
                  title="Filtra i risultati visibili per targa o autista."
                  aria-label="Ricerca rapida quadro manutenzioni"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="man2-section-title">Risultati esportabili</div>
        <div className="man2-pdf-results">
          {pdfVisibleResults.length > 0 ? (
            pdfVisibleResults.map((result) => (
              <article key={`${pdfSubjectType}:${result.targa}`} className="man2-pdf-row">
                <div className="man2-pdf-row__media">
                  {result.mezzo?.fotoUrl ? (
                    <img src={result.mezzo.fotoUrl} alt={`Mezzo ${result.targa}`} className="man2-pdf-thumb" />
                  ) : (
                    <div className="man2-pdf-thumb man2-pdf-thumb--placeholder">{result.targa}</div>
                  )}
                </div>
                <div className="man2-pdf-row__content">
                  <div className="man2-pdf-row__meta">
                    <div>
                      <span className="man2-pdf-row__label">Targa</span>
                      <strong>{result.targa}</strong>
                    </div>
                    <div>
                      <span className="man2-pdf-row__label">Mezzo / modello</span>
                      <strong>{result.mezzo?.marcaModello ?? result.mezzo?.label ?? "DA VERIFICARE"}</strong>
                    </div>
                    <div>
                      <span className="man2-pdf-row__label">Autista</span>
                      <strong>{result.mezzo?.autistaNome || "DA VERIFICARE"}</strong>
                    </div>
                    {result.metricInfo ? (
                      <div>
                        <span className="man2-pdf-row__label">{result.metricInfo.primaryLabel}</span>
                        <strong>{result.metricInfo.primaryValue}</strong>
                      </div>
                    ) : null}
                    {result.metricInfo?.secondaryLabel ? (
                      <div>
                        <span className="man2-pdf-row__label">{result.metricInfo.secondaryLabel}</span>
                        <strong>{result.metricInfo.secondaryValue}</strong>
                      </div>
                    ) : null}
                    {result.metricInfo?.deltaLabel ? (
                      <div>
                        <span className="man2-pdf-row__label">{result.metricInfo.deltaLabel}</span>
                        <strong>{result.metricInfo.deltaValue}</strong>
                      </div>
                    ) : null}
                    <div>
                      <span className="man2-pdf-row__label">Data</span>
                      <strong>{result.latest.data}</strong>
                    </div>
                    <div>
                      <span className="man2-pdf-row__label">Tipo</span>
                      <strong>{result.latest.tipo}</strong>
                    </div>
                  </div>
                  <div className="man2-pdf-row__actions">
                    <button
                      type="button"
                      className="man2-btn"
                      title="Esporta il PDF della targa selezionata con la foto reale del mezzo, se disponibile."
                      aria-label={`Esporta PDF ${result.targa}`}
                      onClick={() =>
                        void exportPdfForItems(
                          pdfFilteredItems.filter((item) => item.targa === result.targa),
                          `PDF ${pdfSubjectType} - ${result.targa}`,
                        )
                      }
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      className="man2-btn man2-btn--secondary"
                      onClick={() => openDetailForRecord(result.latest)}
                    >
                      Apri dettaglio
                    </button>
                  </div>
                  {pdfSubjectType === "mezzo" && (result.gommePerAsse.length > 0 || result.gommeStraordinarie.length > 0) ? (
                    <div className="man2-gomme-pdf-state">
                      {result.gommePerAsse.length > 0 ? (
                        <div className="man2-gomme-pdf-block">
                          <div className="man2-gomme-pdf-state__title">Stato gomme ordinario per asse</div>
                          <div className="man2-gomme-pdf-state__grid">
                            {result.gommePerAsse.map((entry) => (
                              <div key={`${result.targa}:${entry.asseId}`} className="man2-gomme-pdf-axis">
                                <strong>{entry.asseLabel}</strong>
                                <span>Data cambio: {entry.dataCambio || "DA VERIFICARE"}</span>
                                {entry.isMotorizzato ? (
                                  <>
                                    <span>
                                      Km cambio: {entry.kmCambio !== null ? formatNumberIt(entry.kmCambio) : "DA VERIFICARE"}
                                    </span>
                                    <span>
                                      Km attuali: {entry.kmAttuali !== null ? formatNumberIt(entry.kmAttuali) : "DA VERIFICARE"}
                                    </span>
                                    {entry.kmPercorsi !== null ? (
                                      <span>Km percorsi dal cambio: {formatNumberIt(entry.kmPercorsi)}</span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span>Per questa categoria fa fede soprattutto la data cambio.</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {result.gommeStraordinarie.length > 0 ? (
                        <div className="man2-gomme-pdf-block man2-gomme-pdf-block--straordinario">
                          <div className="man2-gomme-pdf-state__title">Eventi gomme straordinari</div>
                          <div className="man2-gomme-pdf-events">
                            {result.gommeStraordinarie.map((entry) => (
                              <div
                                key={`${result.targa}:${entry.sourceMaintenanceId}`}
                                className="man2-gomme-pdf-event"
                              >
                                <strong>{entry.motivo || "Evento gomme straordinario"}</strong>
                                <span>Data: {entry.dataLabel || "DA VERIFICARE"}</span>
                                <span>Asse: {entry.asseLabel || "Non specificato"}</span>
                                <span>
                                  Gomme coinvolte: {entry.quantita !== null ? formatNumberIt(entry.quantita) : "DA VERIFICARE"}
                                </span>
                                {entry.fornitore ? <span>Fornitore: {entry.fornitore}</span> : null}
                                {entry.descrizione ? <span>Nota: {buildDescrizioneSnippet(entry.descrizione, 120)}</span> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="man-empty">Nessun risultato disponibile con i filtri attuali.</div>
          )}
        </div>
      </section>
    );
  }
  function renderActiveSurface() {
    if (loading) {
      return <div className="man-empty">Caricamento manutenzioni in corso...</div>;
    }
    if (view === "dashboard") return renderDashboard();
    if (view === "form") return renderForm();
    if (view === "pdf") return renderPdfPanel();
    return null;
  }

  return (
    <div className="man2-page">
      <div className="man2-head">
        <div className="man2-head__left">
          <span className="man2-eyebrow">OPERATIVITÀ</span>
          <h1>Manutenzioni</h1>
        </div>
        <div className="man2-head__right">
          <select
            className="man2-select-mezzo"
            value={activeTarga}
            onChange={(event) => handleSelectContextTarga(event.target.value)}
          >
            <option value="">- Seleziona mezzo -</option>
            {(mezziSelezionabili.length > 0 ? mezziSelezionabili : mezzi).map((mezzo) => (
              <option key={mezzo.id} value={mezzo.targa}>
                {mezzo.label}
              </option>
            ))}
          </select>
          <input
            className="man2-search"
            value={ricercaMezzo}
            onChange={(event) => setRicercaMezzo(event.target.value)}
            placeholder="Cerca targa / modello / autista"
            title="Ricerca rapida generale per targa, modello o autista."
            aria-label="Ricerca rapida mezzi"
          />
        </div>
      </div>

      {renderContextBar()}

      <nav className="man2-tabs">
        {[
          { key: "dashboard", label: "Dashboard" },
          { key: "form", label: "Nuova / Modifica" },
          { key: "mappa", label: "Dettaglio" },
          { key: "pdf", label: "Quadro manutenzioni PDF" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`man2-tab${view === tab.key ? " active" : ""}`}
            onClick={() => setView(tab.key as ViewTab)}
            disabled={tab.key === "mappa" ? !activeTarga : false}
            title={
              tab.key === "mappa"
                ? "Apri il dettaglio visivo del mezzo selezionato."
                : tab.key === "pdf"
                  ? "Apri il quadro manutenzioni con ricerca ed export PDF."
                  : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {notice ? <div className="man2-feedback man2-feedback--notice">{notice}</div> : null}
      {error ? <div className="man2-feedback man2-feedback--error">{error}</div> : null}

      {view === "mappa" ? (
        <NextMappaStoricoPage
          targa={activeTarga}
          embedded={true}
          selectedMaintenance={
            selectedDetailRecord
              ? {
                  id: selectedDetailRecord.id,
                  data: selectedDetailRecord.data ?? null,
                  descrizione: selectedDetailRecord.descrizione ?? null,
                  assiCoinvolti: selectedDetailRecord.assiCoinvolti ?? [],
                  km: selectedDetailRecord.km ?? null,
                  tipo: selectedDetailRecord.tipo ?? null,
                  materiali: selectedDetailRecord.materiali ?? [],
                  importo: selectedDetailRecord.importo ?? null,
                  sourceDocumentId: selectedDetailRecord.sourceDocumentId ?? null,
                  sourceDocumentFileUrl: selectedDetailRecord.sourceDocumentFileUrl ?? null,
                  fornitore: selectedDetailRecord.fornitore ?? null,
                }
              : null
          }
          mezzoInfo={{
            targa: mezzoPreviewSelezionato?.targa || activeTarga,
            mezzoLabel: mezzoPreviewSelezionato?.marcaModello ?? mezzoPreviewSelezionato?.label ?? "DA VERIFICARE",
            autistaNome: mezzoPreviewSelezionato?.autistaNome ?? null,
            categoria: mezzoPreviewSelezionato?.categoria ?? null,
            kmAttuali: kmUltimoRifornimento,
            latestGommeKmCambio,
            ultimaManutenzione: latestRecord?.data ?? null,
            ultimoInterventoMezzo: ultimeManutenzioniMezzo[0]?.descrizione ?? null,
            ultimoInterventoCompressore: ultimeManutenzioniCompressore[0]?.descrizione ?? null,
            ultimeManutenzioniMezzo: ultimeManutenzioniMezzoSenzaUltimo.map((item) => ({
              id: item.id,
              data: item.data,
              title: buildDescrizioneSnippet(item.descrizione, 78),
            })),
            ultimeManutenzioniCompressore: ultimeManutenzioniCompressoreSenzaUltimo.map((item) => ({
              id: item.id,
              data: item.data,
              title: buildDescrizioneSnippet(item.descrizione, 78),
            })),
          }}
          onOpenPdf={() => setView("pdf")}
          onOpenDossier={() => {
            if (mezzoPreviewSelezionato) navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa));
          }}
          onSelectMaintenance={(recordId) => setSelectedDetailRecordId(recordId)}
          onEditLatest={() => {
            if (selectedDetailRecord) {
              handleEdit(selectedDetailRecord);
              return;
            }
            if (latestRecord) handleEdit(latestRecord);
          }}
        />
      ) : (
        renderActiveSurface()
      )}
    </div>
  );
}


