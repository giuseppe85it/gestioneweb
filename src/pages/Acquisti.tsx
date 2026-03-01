import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, WheelEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { MaterialeOrdine, Ordine, UnitaMisura } from "../types/ordini";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";
import { generateSmartPDF } from "../utils/pdfEngine";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, functions, storage } from "../firebase";
import "./Acquisti.css";
import "./MaterialiDaOrdinare.css";

interface Fornitore {
  id: string;
  nome: string;
}

type PreventivoRiga = {
  id: string;
  descrizione: string;
  unita: string;
  prezzoUnitario: number;
  note?: string;
};

type Preventivo = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  imageStoragePaths?: string[];
  imageUrls?: string[];
  righe: PreventivoRiga[];
  createdAt: number;
  updatedAt: number;
};

type Valuta = "CHF" | "EUR";

type ListinoVoce = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  unita: string;
  valuta: Valuta;
  prezzoAttuale: number;
  fonteAttuale: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  prezzoPrecedente?: number;
  fontePrecedente?: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  trend: "down" | "up" | "same" | "new";
  deltaAbs?: number;
  deltaPct?: number;
  updatedAt: number;
};

type ImportBozzaRiga = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  unita: string;
  valuta: Valuta;
  prezzoNuovo: number;
  prezzoPrecedente?: number;
  trend: "down" | "up" | "same" | "new";
  fonte: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
    imageStoragePaths?: string[];
    imageUrls?: string[];
  };
  daVerificare: boolean;
  note?: string;
};

type PreventivoMatch = {
  prezzoUnitario: number;
  valuta?: Valuta | null;
  unita: string;
  preventivoId: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  pdfStoragePath?: string | null;
  imageUrls?: string[];
  imageStoragePaths?: string[];
  rank: number;
};

type ExtractWarningCode =
  | "MISSING_CURRENCY"
  | "MISSING_UNIT_PRICE"
  | "LIKELY_TOTAL_PRICE"
  | "PARTIAL_TABLE"
  | "LOW_CONFIDENCE";

type ExtractWarning = {
  code: ExtractWarningCode;
  severity: "info" | "warn" | "error";
  message: string;
};

type ExtractItem = {
  description: string | null;
  articleCode: string | null;
  uom: string | null;
  unitPrice: number | null;
  currency: "CHF" | "EUR" | null;
  confidence: number;
};

type PreventivoExtractResult = {
  schemaVersion: "preventivo_price_extract_v1";
  document: {
    number: string | null;
    date: string | null;
    currency: "CHF" | "EUR" | null;
    confidence: number;
  };
  supplier: {
    name: string | null;
    confidence: number;
  };
  items: ExtractItem[];
  warnings: ExtractWarning[];
};

type PreventivoExtractPayload =
  | { pdfStoragePath: string; originalFileName?: string | null }
  | { imageStoragePaths: string[]; originalFileName?: string | null };

type AcquistiTab = "Ordine materiali" | "Ordini" | "Arrivi" | "Prezzi & Preventivi" | "Listino Prezzi";
type ListKind = "attesa" | "arrivi";

const TABS: AcquistiTab[] = ["Ordine materiali", "Ordini", "Arrivi", "Prezzi & Preventivi", "Listino Prezzi"];
const UNITA_OPTIONS = ["PZ", "NR", "MT", "LT", "KG", "GR", "CF", "SC", "PA", "H", "ALTRO"] as const;
const UNITA_OPTIONS_SET = new Set<string>(UNITA_OPTIONS);
const ORDINI_DOC_ID = "@ordini";
const PREVENTIVI_DOC_ID = "@preventivi";
const LISTINO_DOC_ID = "@listino_prezzi";
const ORDER_DRAFT_STORAGE_KEY = "acquisti_draft_ordine_materiali_v1";
const LABELS_IT = {
  trend: {
    down: "IN CALO",
    up: "IN AUMENTO",
    same: "STABILE",
    new: "NUOVO",
  },
  import: {
    not: "NON IMPORTATO",
    partial: "IMPORTATO PARZIALE",
    full: "IMPORTATO COMPLETO",
    zeroRows: "0 RIGHE",
  },
  menu: {
    trigger: "AZIONI",
    open: "Apri",
    openDocument: "Apri documento",
    edit: "Modifica",
    delete: "Elimina",
    import: "Importa",
    resetFilters: "Reset filtri",
    onlyNotImported: "Solo non importati",
  },
} as const;

const TAB_KEYS: Record<AcquistiTab, string> = {
  "Ordine materiali": "ordine",
  Ordini: "ordini",
  Arrivi: "arrivi",
  "Prezzi & Preventivi": "preventivi",
  "Listino Prezzi": "listino",
};

const TAB_VALUES = Object.entries(TAB_KEYS).reduce((acc, [label, key]) => {
  acc[key] = label as AcquistiTab;
  return acc;
}, {} as Record<string, AcquistiTab>);

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const oggi = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
};

const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function trovaImmagineAutomatica(desc: string): string | null {
  for (const m of immaginiAutomatiche) {
    if (m.pattern.test(desc)) return m.url;
  }
  return null;
}

function getOptionalText(m: MaterialeOrdine, keys: string[]) {
  for (const key of keys) {
    const value = (m as any)?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "-";
}

function tabToKey(tab: AcquistiTab) {
  return TAB_KEYS[tab];
}

function keyToTab(key: string | null, fallback: AcquistiTab): AcquistiTab {
  if (!key) return fallback;
  return TAB_VALUES[key] || fallback;
}

function normalizeDescrizione(v: string) {
  return String(v || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeUnita(v: string) {
  return String(v || "").toUpperCase().trim();
}

function parseConversionFactor(note: string | null | undefined): number | null {
  const raw = String(note || "");
  if (!raw.trim()) return null;
  const match = raw.match(/(?:^|[\s|;,])conv\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (!match) return null;
  const parsed = Number(String(match[1]).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function upsertConversionFactorInNote(note: string | null | undefined, factorRaw: string): string {
  const cleanNote = String(note || "").trim();
  const cleanFactor = String(factorRaw || "").trim();
  const withoutToken = cleanNote
    .replace(/(?:^|[\s|;,])conv\s*:\s*[0-9]+(?:[.,][0-9]+)?/gi, " ")
    .replace(/\s+\|\s+\|/g, " | ")
    .replace(/\s+/g, " ")
    .replace(/(^[|;,]\s*|\s*[|;,]$)/g, "")
    .trim();

  const factor = Number(cleanFactor.replace(",", "."));
  if (!Number.isFinite(factor) || factor <= 0) {
    return withoutToken;
  }
  const token = `conv:${factor.toString().replace(".", ",")}`;
  if (!withoutToken) return token;
  return `${withoutToken} | ${token}`.trim();
}

function computeLineTotal(params: {
  qty: number;
  unitPrice: number;
  selectedUom: string | null | undefined;
  priceUom: string | null | undefined;
  note?: string | null;
}) {
  const qty = Number(params.qty);
  const unitPrice = Number(params.unitPrice);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { total: null as number | null, status: "ok" as const, factor: null as number | null };
  }

  const selected = normalizeUnita(String(params.selectedUom || ""));
  const source = normalizeUnita(String(params.priceUom || selected));
  if (!selected || !source || selected === source) {
    return { total: qty * unitPrice, status: "ok" as const, factor: null as number | null };
  }

  const factor = parseConversionFactor(params.note);
  if (!factor) {
    return { total: null as number | null, status: "needs_factor" as const, factor: null as number | null };
  }

  return { total: qty * factor * unitPrice, status: "ok" as const, factor };
}

function normalizeUom(uom: string): "PZ" | "NR" | "MT" | "LT" | "KG" | "M" {
  const v = normalizeUnita(uom);
  if (v === "PZ" || v === "PEZZO" || v === "PEZZI") return "PZ";
  if (v === "NR" || v === "N" || v === "NUMERO") return "NR";
  if (v === "MT" || v === "METRO" || v === "METRI") return "MT";
  if (v === "M") return "M";
  if (v === "LT" || v === "L" || v === "LITRO" || v === "LITRI") return "LT";
  if (v === "KG" || v === "KILO" || v === "KILOGRAMMO" || v === "KILOGRAMMI") return "KG";
  return "PZ";
}

function trendLabelIt(trend: "down" | "up" | "same" | "new") {
  return LABELS_IT.trend[trend];
}

function getUnitaChoice(value: string | undefined | null) {
  const normalized = normalizeUnita(value || "");
  if (normalized && UNITA_OPTIONS_SET.has(normalized) && normalized !== "ALTRO") {
    return { selected: normalized, custom: "" };
  }
  return { selected: "ALTRO", custom: normalized };
}

function normalizeArticoloCanonico(v: string) {
  return normalizeDescrizione(v);
}

function inferValuta(input: { descrizione?: string; note?: string; numeroPreventivo?: string }): Valuta {
  const text = `${input.descrizione || ""} ${input.note || ""} ${input.numeroPreventivo || ""}`.toUpperCase();
  if (text.includes("EUR") || text.includes("EURO")) return "EUR";
  return "CHF";
}

function listinoKey(input: {
  fornitoreId: string;
  articoloCanonico: string;
  unita: string;
  valuta: Valuta;
}) {
  return [
    String(input.fornitoreId || "").trim(),
    normalizeArticoloCanonico(input.articoloCanonico),
    normalizeUnita(input.unita),
    input.valuta,
  ].join("|");
}

function computeTrend(prezzoNuovo: number, prezzoPrecedente?: number) {
  if (prezzoPrecedente === undefined || prezzoPrecedente === null || !Number.isFinite(prezzoPrecedente)) {
    return { trend: "new" as const, deltaAbs: undefined as number | undefined, deltaPct: undefined as number | undefined };
  }
  const deltaAbs = prezzoNuovo - prezzoPrecedente;
  const deltaPct = prezzoPrecedente === 0 ? undefined : (deltaAbs / prezzoPrecedente) * 100;
  if (deltaAbs < 0) return { trend: "down" as const, deltaAbs, deltaPct };
  if (deltaAbs > 0) return { trend: "up" as const, deltaAbs, deltaPct };
  return { trend: "same" as const, deltaAbs, deltaPct: 0 };
}

function parseDataPreventivoToTs(v: string) {
  const raw = String(v || "").trim();
  const match = raw.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/);
  if (!match) return 0;
  const gg = Number(match[1]);
  const mm = Number(match[2]) - 1;
  const aa = Number(match[3]);
  const ts = new Date(aa, mm, gg).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function sanitizeUndefinedToNull<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUndefinedToNull(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = item === undefined ? null : sanitizeUndefinedToNull(item);
    });
    return out as T;
  }
  return value;
}

function formatExtractDateForInput(dateValue: string | null | undefined) {
  const raw = String(dateValue || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return raw;
  const gg = match[1].padStart(2, "0");
  const mm = match[2].padStart(2, "0");
  return `${gg} ${mm} ${match[3]}`;
}

function normalizeExtractCurrency(currency: string | null | undefined): Valuta | null {
  const c = String(currency || "").toUpperCase().trim();
  if (c === "CHF" || c === "EUR") return c;
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}

function extractDocumentRefs(source: unknown) {
  const s = (source || {}) as Record<string, unknown>;
  const pdfUrl = String(s.pdfUrl || "").trim() || null;
  const pdfStoragePath = String(s.pdfStoragePath || "").trim() || null;
  const imageUrls = asStringArray(s.imageUrls);
  const imageStoragePaths = asStringArray(s.imageStoragePaths);
  return { pdfUrl, pdfStoragePath, imageUrls, imageStoragePaths };
}

function hasAnyDocumentRef(source: unknown) {
  const refs = extractDocumentRefs(source);
  return !!(refs.pdfUrl || refs.pdfStoragePath || refs.imageUrls.length > 0 || refs.imageStoragePaths.length > 0);
}

async function openDocumentRef(source: unknown) {
  const refs = extractDocumentRefs(source);
  if (refs.pdfUrl) {
    window.open(refs.pdfUrl, "_blank", "noopener,noreferrer");
    return true;
  }
  if (refs.pdfStoragePath) {
    const url = await getDownloadURL(ref(storage, refs.pdfStoragePath));
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  if (refs.imageUrls.length > 0) {
    window.open(refs.imageUrls[0], "_blank", "noopener,noreferrer");
    if (refs.imageUrls.length > 1 && window.confirm(`Sono presenti ${refs.imageUrls.length} immagini. Aprire anche le altre?`)) {
      refs.imageUrls.slice(1).forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
    }
    return true;
  }
  if (refs.imageStoragePaths.length > 0) {
    const urls = await Promise.all(refs.imageStoragePaths.map((path) => getDownloadURL(ref(storage, path))));
    if (urls.length === 0) return false;
    window.open(urls[0], "_blank", "noopener,noreferrer");
    if (urls.length > 1 && window.confirm(`Sono presenti ${urls.length} immagini. Aprire anche le altre?`)) {
      urls.slice(1).forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
    }
    return true;
  }
  return false;
}

function OrdineMaterialiView(props: {
  onOpenPreventivo: (payload: {
    preventivoId: string;
    pdfUrl: string | null;
    pdfStoragePath?: string | null;
    imageUrls?: string[];
    imageStoragePaths?: string[];
  }) => void;
  onOpenManualListino: (row: ImportBozzaRiga) => void;
}) {
  const { onOpenPreventivo, onOpenManualListino } = props;

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [preventivi, setPreventivi] = useState<Preventivo[]>([]);
  const [listinoVoci, setListinoVoci] = useState<ListinoVoce[]>([]);
  const [fornitoreId, setFornitoreId] = useState<string>("");
  const [fornitoreNome, setFornitoreNome] = useState<string>("");
  const [isNuovoFornitore, setIsNuovoFornitore] = useState<boolean>(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] = useState<string>("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");
  const [conversionFactorInput, setConversionFactorInput] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const descrizioneInputRef = useRef<HTMLInputElement | null>(null);
  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const [materiali, setMateriali] = useState<MaterialeOrdine[]>([]);
  const [noteByMaterialeId, setNoteByMaterialeId] = useState<Record<string, string>>({});
  const [ordineNote, setOrdineNote] = useState("");
  const [newMaterialeNota, setNewMaterialeNota] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestDirection, setSuggestDirection] = useState<"up" | "down">("down");
  const [suggestPanelStyle, setSuggestPanelStyle] = useState<CSSProperties | null>(null);
  const [selectedListinoVoce, setSelectedListinoVoce] = useState<ListinoVoce | null>(null);
  const [fornitoreByMaterialeId, setFornitoreByMaterialeId] = useState<
    Record<string, { fornitoreId: string; fornitoreNome: string }>
  >({});
  const [listinoSourceByMaterialeId, setListinoSourceByMaterialeId] = useState<Record<string, PreventivoMatch>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const fornitoriSnap = await getDoc(doc(db, "storage", "@fornitori"));
        if (fornitoriSnap.exists()) {
          const arr = (fornitoriSnap.data()?.value || []) as any[];
          const conv: Fornitore[] = arr.map((f) => ({
            id: f.id || generaId(),
            nome: f.nome || f.ragioneSociale || "",
          }));
          setFornitori(conv);
        }

        const preventiviSnap = await getDoc(doc(db, "storage", PREVENTIVI_DOC_ID));
        if (preventiviSnap.exists()) {
          const list = (preventiviSnap.data()?.preventivi || []) as Preventivo[];
          setPreventivi(Array.isArray(list) ? list : []);
        } else {
          setPreventivi([]);
        }

        const listinoSnap = await getDoc(doc(db, "storage", LISTINO_DOC_ID));
        if (listinoSnap.exists()) {
          const voci = (listinoSnap.data()?.voci || []) as ListinoVoce[];
          setListinoVoci(Array.isArray(voci) ? voci : []);
        } else {
          setListinoVoci([]);
        }
      } catch (err) {
        console.error("Errore caricamento fornitori/preventivi:", err);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        fornitoreId?: string;
        fornitoreNome?: string;
        isNuovoFornitore?: boolean;
        nomeFornitorePersonalizzato?: string;
        materiali?: MaterialeOrdine[];
        fornitoreByMaterialeId?: Record<string, { fornitoreId: string; fornitoreNome: string }>;
        listinoSourceByMaterialeId?: Record<string, PreventivoMatch>;
        noteByMaterialeId?: Record<string, string>;
        ordineNote?: string;
        descrizione?: string;
        quantita?: string;
        unita?: UnitaMisura;
        newMaterialeNota?: string;
        conversionFactorInput?: string;
      };
      if (draft.fornitoreId) setFornitoreId(draft.fornitoreId);
      if (typeof draft.fornitoreNome === "string") setFornitoreNome(draft.fornitoreNome);
      if (typeof draft.isNuovoFornitore === "boolean") setIsNuovoFornitore(draft.isNuovoFornitore);
      if (typeof draft.nomeFornitorePersonalizzato === "string") setNomeFornitorePersonalizzato(draft.nomeFornitorePersonalizzato);
      if (Array.isArray(draft.materiali)) setMateriali(draft.materiali);
      if (draft.fornitoreByMaterialeId && typeof draft.fornitoreByMaterialeId === "object") setFornitoreByMaterialeId(draft.fornitoreByMaterialeId);
      if (draft.listinoSourceByMaterialeId && typeof draft.listinoSourceByMaterialeId === "object") setListinoSourceByMaterialeId(draft.listinoSourceByMaterialeId);
      if (draft.noteByMaterialeId && typeof draft.noteByMaterialeId === "object") setNoteByMaterialeId(draft.noteByMaterialeId);
      if (typeof draft.ordineNote === "string") setOrdineNote(draft.ordineNote);
      if (typeof draft.descrizione === "string") setDescrizione(draft.descrizione);
      if (typeof draft.quantita === "string") setQuantita(draft.quantita);
      if (typeof draft.unita === "string") setUnita(draft.unita as UnitaMisura);
      if (typeof draft.newMaterialeNota === "string") setNewMaterialeNota(draft.newMaterialeNota);
      if (typeof draft.conversionFactorInput === "string") setConversionFactorInput(draft.conversionFactorInput);
    } catch (err) {
      console.error("Errore ripristino bozza ordine:", err);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const payload = {
          fornitoreId,
          fornitoreNome,
          isNuovoFornitore,
          nomeFornitorePersonalizzato,
          materiali,
          fornitoreByMaterialeId,
          listinoSourceByMaterialeId,
          noteByMaterialeId,
          ordineNote,
          descrizione,
          quantita,
          unita,
          newMaterialeNota,
          conversionFactorInput,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        setDraftSavedAt(Date.now());
      } catch (err) {
        console.error("Errore salvataggio bozza ordine:", err);
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [
    fornitoreId,
    fornitoreNome,
    isNuovoFornitore,
    nomeFornitorePersonalizzato,
    materiali,
    fornitoreByMaterialeId,
    listinoSourceByMaterialeId,
    noteByMaterialeId,
    ordineNote,
    descrizione,
    quantita,
    unita,
    newMaterialeNota,
    conversionFactorInput,
  ]);

  const handleSelectFornitore = (id: string) => {
    if (id === "nuovo") {
      setIsNuovoFornitore(true);
      setFornitoreId("nuovo");
      setFornitoreNome("");
      setSelectedListinoVoce(null);
      return;
    }
    setIsNuovoFornitore(false);
    setFornitoreId(id);
    const f = fornitori.find((x) => x.id === id);
    setFornitoreNome(f?.nome || "");
    setSelectedListinoVoce(null);
  };

  const updateSuggestDirection = () => {
    const input = descrizioneInputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    const panelH = viewportW <= 760 ? 240 : 320;
    const gap = 8;
    const below = viewportH - rect.bottom - gap;
    const above = rect.top - gap;
    const shouldOpenUp = below < panelH && above > below;
    if (shouldOpenUp) {
      setSuggestDirection("up");
    } else {
      setSuggestDirection("down");
    }

    const preferredWidth = Math.min(720, viewportW * 0.7);
    const panelWidth = Math.max(rect.width, preferredWidth);
    const maxLeft = Math.max(8, viewportW - panelWidth - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);
    const top = shouldOpenUp ? Math.max(8, rect.top - panelH - gap) : rect.bottom + gap;
    setSuggestPanelStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
    });
  };

  const handleDescrizioneChange = (value: string) => {
    setDescrizione(value);
    setShowSuggest(true);
    updateSuggestDirection();
    if (
      selectedListinoVoce &&
      normalizeArticoloCanonico(value) !== normalizeArticoloCanonico(selectedListinoVoce.articoloCanonico)
    ) {
      setSelectedListinoVoce(null);
    }
  };

  useEffect(() => {
    if (!showSuggest) return;
    const onLayoutChange = () => updateSuggestDirection();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    return () => {
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [showSuggest]);

  const handleDescrizioneBlur = () => {
    setTimeout(() => {
      setShowSuggest(false);
      setSuggestPanelStyle(null);
    }, 120);
    if (fotoFile || fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const fornitoreAttivoNome = isNuovoFornitore
    ? nomeFornitorePersonalizzato.trim().toUpperCase()
    : fornitoreNome;
  const fornitoreAttivoId = !isNuovoFornitore ? fornitoreId : "";
  const canAddMateriale = !!descrizione.trim() && !!quantita.trim() && !!fornitoreAttivoNome;

  const suggestListino = useMemo(() => {
    if (!showSuggest) return [];
    const q = descrizione.trim().toLowerCase();
    if (!q) return [];
    if (!fornitoreAttivoId) return [];

    return listinoVoci
      .filter((v) => v.fornitoreId === fornitoreAttivoId)
      .filter((v) => {
        const articolo = String(v.articoloCanonico || "").toLowerCase();
        const codice = String(v.codiceArticolo || "").toLowerCase();
        return articolo.includes(q) || codice.includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8);
  }, [showSuggest, descrizione, fornitoreAttivoId, listinoVoci]);

  const selectListinoSuggestion = (voce: ListinoVoce) => {
    setDescrizione(voce.articoloCanonico);
    const autoUnita = normalizeUom(String(voce.unita || ""));
    setUnita(autoUnita.toLowerCase() as UnitaMisura);
    setConversionFactorInput("");
    setSelectedListinoVoce(voce);
    setShowSuggest(false);
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
    setSelectedListinoVoce(null);
    setShowSuggest(false);
    setNewMaterialeNota("");
    setConversionFactorInput("");
  };

  const clearDraftStorage = () => {
    try {
      sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    } catch (err) {
      console.error("Errore pulizia bozza ordine:", err);
    }
  };

  const clearAllDraftState = () => {
    setMateriali([]);
    setFornitoreByMaterialeId({});
    setListinoSourceByMaterialeId({});
    setNoteByMaterialeId({});
    setOrdineNote("");
    setFornitoreId("");
    setFornitoreNome("");
    setNomeFornitorePersonalizzato("");
    setIsNuovoFornitore(false);
    resetMateriale();
    clearDraftStorage();
  };

  const aggiungiMateriale = async () => {
    if (!descrizione.trim() || !quantita.trim()) return;
    if (!fornitoreAttivoNome) {
      window.alert("Seleziona fornitore prima di aggiungere il materiale.");
      return;
    }
    const id = generaId();
    let fotoUrl: string | null = fotoPreview || null;
    let fotoStoragePath: string | null = null;
    if (fotoFile) {
      try {
        const uploaded = await uploadMaterialImage(fotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      } catch (err) {
        console.error("Errore upload immagine:", err);
      }
    }
    const nuovo: MaterialeOrdine = {
      id,
      descrizione: descrizione.trim().toUpperCase(),
      quantita: parseFloat(quantita),
      unita,
      arrivato: false,
      fotoUrl,
      fotoStoragePath,
    };
    const noteConFattore = upsertConversionFactorInNote(newMaterialeNota, conversionFactorInput);
    setMateriali((p) => [...p, nuovo]);
    if (noteConFattore.trim()) {
      setNoteByMaterialeId((prev) => ({ ...prev, [id]: noteConFattore.trim() }));
    }
    setFornitoreByMaterialeId((prev) => ({
      ...prev,
      [id]: {
        fornitoreId: fornitoreAttivoId || "SENZA_FORNITORE",
        fornitoreNome: fornitoreAttivoNome,
      },
    }));
    if (selectedListinoVoce) {
      const listinoImageStoragePaths = asStringArray((selectedListinoVoce.fonteAttuale as any)?.imageStoragePaths);
      const listinoImageUrls = asStringArray((selectedListinoVoce.fonteAttuale as any)?.imageUrls);
      const info: PreventivoMatch = {
        prezzoUnitario: selectedListinoVoce.prezzoAttuale,
        valuta: selectedListinoVoce.valuta,
        unita: selectedListinoVoce.unita,
        preventivoId: selectedListinoVoce.fonteAttuale.preventivoId,
        numeroPreventivo: selectedListinoVoce.fonteAttuale.numeroPreventivo,
        dataPreventivo: selectedListinoVoce.fonteAttuale.dataPreventivo,
        pdfUrl: selectedListinoVoce.fonteAttuale.pdfUrl,
        pdfStoragePath: selectedListinoVoce.fonteAttuale.pdfStoragePath,
        imageStoragePaths: listinoImageStoragePaths,
        imageUrls: listinoImageUrls,
        rank: selectedListinoVoce.updatedAt,
      };
      setListinoSourceByMaterialeId((prev) => ({ ...prev, [id]: info }));
    }
    resetMateriale();
  };

  const eliminaMateriale = async (id: string) => {
    const mat = materiali.find((m) => m.id === id);
    if (mat?.fotoStoragePath) await deleteMaterialImage(mat.fotoStoragePath);
    setMateriali((p) => p.filter((m) => m.id !== id));
    setFornitoreByMaterialeId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setListinoSourceByMaterialeId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNoteByMaterialeId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const salvaOrdine = async () => {
    if (!materiali.length) return;
    let nomeFinale = fornitoreNome;
    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim() !== "") {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }
    if (!nomeFinale) return;
    setLoading(true);
    try {
      const ref = doc(collection(db, "storage"), ORDINI_DOC_ID);
      const snap = await getDoc(ref);
      const existing: Ordine[] = snap.exists() ? ((snap.data()?.value as Ordine[]) || []) : [];
      const nuovoOrdine: Ordine = {
        id: generaId(),
        idFornitore: fornitoreId === "nuovo" ? generaId() : fornitoreId,
        nomeFornitore: nomeFinale,
        dataOrdine: oggi(),
        materiali,
        arrivato: false,
      };
      const updated = [...existing, nuovoOrdine];
      await setDoc(ref, { value: updated }, { merge: true });
      clearAllDraftState();
    } catch (err) {
      console.error("Errore salvataggio ordine:", err);
    } finally {
      setLoading(false);
    }
  };

  const materialiFiltrati = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return materiali;
    return materiali.filter((m) => {
      const fornitoreRiga = String((m as any)?.fornitore ?? "").toLowerCase();
      return m.descrizione.toLowerCase().includes(q) || fornitoreRiga.includes(q) || String(m.id).toLowerCase().includes(q);
    });
  }, [materiali, searchText]);

  const matchByMaterialeId = useMemo(() => {
    const map = new Map<string, PreventivoMatch | null>();

    materiali.forEach((m) => {
      const fromLocal = fornitoreByMaterialeId[m.id];
      const rowFornitoreId = String(
        fromLocal?.fornitoreId ?? (m as any)?.fornitoreId ?? (m as any)?.idFornitore ?? fornitoreId ?? ""
      ).trim();
      if (!rowFornitoreId || rowFornitoreId === "nuovo") {
        map.set(m.id, null);
        return;
      }

      const descNorm = normalizeDescrizione(m.descrizione);
      const unitaNorm = normalizeUnita(m.unita);
      let best: PreventivoMatch | null = null;

      preventivi.forEach((p) => {
        if (String(p.fornitoreId || "").trim() !== rowFornitoreId) return;
        const righe = Array.isArray(p.righe) ? p.righe : [];
        righe.forEach((r) => {
          if (
            normalizeDescrizione(r.descrizione) === descNorm &&
            normalizeUnita(r.unita) === unitaNorm
          ) {
            const rank = Number(
              p.updatedAt || p.createdAt || parseDataPreventivoToTs(p.dataPreventivo) || 0
            );
            const candidate: PreventivoMatch = {
              prezzoUnitario: Number(r.prezzoUnitario || 0),
              valuta: inferValuta({
                descrizione: r.descrizione,
                note: r.note,
                numeroPreventivo: p.numeroPreventivo,
              }),
              unita: r.unita,
              preventivoId: p.id,
              numeroPreventivo: p.numeroPreventivo,
              dataPreventivo: p.dataPreventivo,
              pdfUrl: p.pdfUrl || null,
              pdfStoragePath: (p as any)?.pdfStoragePath || null,
              imageUrls: asStringArray((p as any)?.imageUrls),
              imageStoragePaths: asStringArray((p as any)?.imageStoragePaths),
              rank,
            };
            if (!best || candidate.rank > best.rank) {
              best = candidate;
            }
          }
        });
      });

      map.set(m.id, best);
    });

    return map;
  }, [materiali, fornitoreByMaterialeId, fornitoreId, preventivi]);

  const prezzoSourceByMaterialeId = useMemo(() => {
    const map = new Map<string, PreventivoMatch | null>();
    materiali.forEach((m) => {
      const fromListino = listinoSourceByMaterialeId[m.id];
      if (fromListino) {
        map.set(m.id, fromListino);
        return;
      }
      map.set(m.id, matchByMaterialeId.get(m.id) || null);
    });
    return map;
  }, [materiali, listinoSourceByMaterialeId, matchByMaterialeId]);

  const calcoloTotaliOrdine = useMemo(() => {
    const totalsByValuta: Record<Valuta, number> = { CHF: 0, EUR: 0 };
    let totaleSenzaValuta = 0;
    let prezziMancanti = 0;
    let udmDaVerificare = 0;

    materiali.forEach((m) => {
      const match = prezzoSourceByMaterialeId.get(m.id);
      if (!match || !Number.isFinite(match.prezzoUnitario) || match.prezzoUnitario <= 0) {
        prezziMancanti += 1;
        return;
      }
      const note = noteByMaterialeId[m.id] || String((m as any)?.note || "");
      const line = computeLineTotal({
        qty: m.quantita,
        unitPrice: match.prezzoUnitario,
        selectedUom: m.unita,
        priceUom: match.unita,
        note,
      });
      if (line.status === "needs_factor") {
        udmDaVerificare += 1;
        return;
      }
      if (line.total === null) return;
      const valuta = normalizeExtractCurrency((match as any)?.valuta ?? null);
      if (!valuta) {
        totaleSenzaValuta += line.total;
        return;
      }
      totalsByValuta[valuta] += line.total;
    });

    const usedValute = (["CHF", "EUR"] as Valuta[]).filter((v) => totalsByValuta[v] > 0);
    return {
      totale: totalsByValuta.CHF + totalsByValuta.EUR + totaleSenzaValuta,
      totalsByValuta,
      totaleSenzaValuta,
      usedValute,
      mixedValute: usedValute.length > 1,
      prezziMancanti,
      udmDaVerificare,
    };
  }, [materiali, prezzoSourceByMaterialeId, noteByMaterialeId]);

  const totaleStimato = calcoloTotaliOrdine.totale;
  const totalsByValuta = calcoloTotaliOrdine.totalsByValuta;
  const usedValute = calcoloTotaliOrdine.usedValute;
  const mixedValute = calcoloTotaliOrdine.mixedValute;
  const totaleSenzaValuta = calcoloTotaliOrdine.totaleSenzaValuta;
  const prezziMancanti = calcoloTotaliOrdine.prezziMancanti;
  const udmDaVerificare = calcoloTotaliOrdine.udmDaVerificare;

  const readNumberFromAny = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getPrezzoManuale = (m: MaterialeOrdine): number | null => {
    const anyM = m as any;
    const candidates: unknown[] = [
      anyM?.prezzoManuale,
      anyM?.prezzo,
      anyM?.prezzoUnitario,
      anyM?.costoUnitario,
    ];
    for (const candidate of candidates) {
      const val = readNumberFromAny(candidate);
      if (val !== null && val > 0) return val;
    }
    return null;
  };

  const openBozzaListinoManuale = (m: MaterialeOrdine) => {
    const localFornitore = fornitoreByMaterialeId[m.id];
    const rowFornitoreId = String(
      localFornitore?.fornitoreId ?? (m as any)?.fornitoreId ?? (m as any)?.idFornitore ?? fornitoreId ?? ""
    ).trim();
    const rowFornitoreNome = String(
      localFornitore?.fornitoreNome ??
      (m as any)?.fornitoreScelto ??
      (m as any)?.fornitore ??
      (m as any)?.nomeFornitore ??
      fornitoreNome ??
      ""
    ).trim();

    if (!rowFornitoreId || rowFornitoreId === "nuovo" || rowFornitoreId === "SENZA_FORNITORE" || !rowFornitoreNome) {
      window.alert("Seleziona/associa un fornitore valido alla riga prima di importare nel listino.");
      return;
    }

    const prezzoManuale = getPrezzoManuale(m);
    const row: ImportBozzaRiga = {
      id: generaId(),
      fornitoreId: rowFornitoreId,
      fornitoreNome: rowFornitoreNome,
      articoloCanonico: normalizeArticoloCanonico(m.descrizione),
      codiceArticolo: "",
      unita: normalizeUnita(m.unita),
      valuta: inferValuta({
        descrizione: m.descrizione,
        note: String((m as any)?.note ?? ""),
        numeroPreventivo: "MANUALE",
      }),
      prezzoNuovo: prezzoManuale ?? 0,
      trend: "new",
      fonte: {
        preventivoId: `MANUALE-${m.id}`,
        numeroPreventivo: "MANUALE",
        dataPreventivo: oggi(),
        pdfUrl: null,
        pdfStoragePath: null,
      },
      daVerificare: true,
      note: prezzoManuale ? undefined : "Prezzo da completare",
    };

    onOpenManualListino(row);
  };

  const selectedUomNorm = normalizeUom(String(unita || ""));
  const selectedPriceUom = selectedListinoVoce ? normalizeUom(String(selectedListinoVoce.unita || "")) : null;
  const needsConversionFactorInput = !!selectedListinoVoce && !!selectedPriceUom && selectedUomNorm !== selectedPriceUom;
  const parsedConversionFactorInput = Number(String(conversionFactorInput || "").replace(",", "."));
  const hasValidConversionFactorInput =
    Number.isFinite(parsedConversionFactorInput) && parsedConversionFactorInput > 0;

  const canSaveOrdine = !loading && materiali.length > 0 && (!!fornitoreNome || !!nomeFornitorePersonalizzato.trim());

  const handleSuggestWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const delta = e.deltaY;
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="mdo-page mdo-page--embedded mdo-page--single">
      <div className="mdo-card mdo-card--embedded mdo-card--single">
        <section className="mdo-single-card">
          <div className="mdo-single-toolbar">
            <div className="mdo-single-toolbar-main">
              <div className="mdo-field">
                <label>Fornitore</label>
                <select value={fornitoreId} onChange={(e) => handleSelectFornitore(e.target.value)}>
                  <option value="">Seleziona</option>
                  {fornitori.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                  <option value="nuovo">+ Nuovo fornitore</option>
                </select>
              </div>

              {isNuovoFornitore && (
                <div className="mdo-field">
                  <label>Nome nuovo fornitore</label>
                  <input
                    type="text"
                    value={nomeFornitorePersonalizzato}
                    onChange={(e) => setNomeFornitorePersonalizzato(e.target.value)}
                  />
                </div>
              )}

              <label className="mdo-search mdo-search--embedded">
                <span>Cerca</span>
                <input
                  type="search"
                  placeholder="Descrizione o fornitore"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </label>
            </div>

            <div className="mdo-single-toolbar-side" />
          </div>

          <div className="mdo-table-wrap mdo-table-wrap--single">
            <table className="mdo-table">
              <colgroup>
                <col className="mdo-col-descrizione" />
                <col className="mdo-col-qty" />
                <col className="mdo-col-unita" />
                <col className="mdo-col-fornitore" />
                <col className="mdo-col-prezzo" />
                <col className="mdo-col-preventivo" />
                <col className="mdo-col-azioni" />
              </colgroup>
              <thead>
                <tr>
                  <th>Descrizione</th>
                  <th>Q.ta</th>
                  <th>Unita</th>
                  <th>Fornitore</th>
                  <th>Prezzo</th>
                  <th>Preventivo</th>
                  <th className="mdo-col-actions">Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr className="mdo-insert-row">
                  <td className="mdo-insert-cell mdo-insert-cell--desc">
                    <div className="mdo-insert-desc">
                      <div className="mdo-item-photo mdo-item-photo--insert">
                        {fotoPreview ? <img src={fotoPreview} alt="Anteprima materiale" /> : <div className="mdo-photo-placeholder small">Foto</div>}
                      </div>
                      <input
                        ref={descrizioneInputRef}
                        className="mdo-table-input"
                        type="text"
                        placeholder="Descrizione materiale"
                        value={descrizione}
                        onChange={(e) => handleDescrizioneChange(e.target.value)}
                        onFocus={() => {
                          setShowSuggest(true);
                          updateSuggestDirection();
                        }}
                        onBlur={handleDescrizioneBlur}
                      />
                      <input
                        className="mdo-table-input"
                        type="text"
                        placeholder="Nota riga (opzionale)"
                        value={newMaterialeNota}
                        onChange={(e) => setNewMaterialeNota(e.target.value)}
                      />
                      {!fornitoreAttivoId && descrizione.trim() !== "" && (
                        <div className="acq-suggest-empty">Seleziona fornitore per vedere i suggerimenti listino.</div>
                      )}
                      {fornitoreAttivoId && showSuggest && suggestListino.length > 0 && (
                        <div
                          className={`acq-suggest-panel acq-suggest-panel--fixed ${suggestDirection === "up" ? "openUp" : "openDown"}`}
                          style={suggestPanelStyle || undefined}
                          onWheel={handleSuggestWheel}
                        >
                          {suggestListino.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              className="acq-suggest-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectListinoSuggestion(v)}
                            >
                              <span className="acq-suggest-main">{v.articoloCanonico}</span>
                              <span className="acq-suggest-meta">
                                {v.codiceArticolo ? `Codice ${v.codiceArticolo} - ` : ""}
                                {v.prezzoAttuale.toFixed(2)} {v.valuta}/{String(v.unita || "").toLowerCase()} - N. {v.fonteAttuale.numeroPreventivo} del {v.fonteAttuale.dataPreventivo}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="mdo-insert-cell mdo-insert-cell--qty">
                    <div className="mdo-qty-stack">
                      <input className="mdo-table-input mdo-table-input--qty" type="number" placeholder="0" value={quantita} onChange={(e) => setQuantita(e.target.value)} />
                      {needsConversionFactorInput && (
                        <input
                          className="mdo-table-input mdo-table-input--factor"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="Fattore"
                          value={conversionFactorInput}
                          onChange={(e) => setConversionFactorInput(e.target.value)}
                          title={`UDM prezzo ${selectedPriceUom} diversa da UDM ordine ${selectedUomNorm}. Inserisci fattore conv:n`}
                        />
                      )}
                    </div>
                  </td>
                  <td className="mdo-insert-cell mdo-insert-cell--unita">
                    <select
                      className="mdo-table-input"
                      value={normalizeUom(String(unita || ""))}
                      onChange={(e) => {
                        const next = normalizeUom(e.target.value);
                        setUnita(next.toLowerCase() as UnitaMisura);
                      }}
                    >
                      <option value="PZ">PZ</option>
                      <option value="NR">NR</option>
                      <option value="MT">MT</option>
                      <option value="M">M</option>
                      <option value="KG">KG</option>
                      <option value="LT">LT</option>
                    </select>
                  </td>
                  <td className="mdo-insert-cell mdo-insert-cell--fornitore">
                    <div className="mdo-table-muted">{isNuovoFornitore ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore" : fornitoreNome || "Seleziona sopra"}</div>
                  </td>
                  <td className="mdo-insert-cell mdo-insert-cell--prezzo">
                    <span className="mdo-table-muted">
                      {selectedListinoVoce
                        ? `${selectedListinoVoce.prezzoAttuale.toFixed(2)} ${selectedListinoVoce.valuta}/${normalizeUom(String(selectedListinoVoce.unita || ""))}`
                        : "-"}
                    </span>
                    {needsConversionFactorInput && !hasValidConversionFactorInput && (
                      <div className="mdo-row-warning">UDM diverse: totale bloccato finche non inserisci fattore.</div>
                    )}
                  </td>
                  <td className="mdo-insert-cell mdo-insert-cell--preventivo">
                    <span className="mdo-table-muted">
                      {selectedListinoVoce
                        ? `N. ${selectedListinoVoce.fonteAttuale.numeroPreventivo} del ${selectedListinoVoce.fonteAttuale.dataPreventivo}`
                        : "-"}
                    </span>
                  </td>
                  <td className="mdo-insert-cell mdo-col-actions">
                    <div className="mdo-row-actions mdo-row-actions--insert">
                      {selectedListinoVoce && hasAnyDocumentRef({
                        pdfUrl: selectedListinoVoce.fonteAttuale.pdfUrl,
                        pdfStoragePath: selectedListinoVoce.fonteAttuale.pdfStoragePath,
                        imageUrls: asStringArray((selectedListinoVoce as any)?.fonteAttuale?.imageUrls),
                        imageStoragePaths: asStringArray((selectedListinoVoce as any)?.fonteAttuale?.imageStoragePaths),
                      }) && (
                        <button
                          type="button"
                          className="mdo-chip-button"
                          onClick={() =>
                            onOpenPreventivo({
                              preventivoId: selectedListinoVoce.fonteAttuale.preventivoId,
                              pdfUrl: selectedListinoVoce.fonteAttuale.pdfUrl,
                              pdfStoragePath: selectedListinoVoce.fonteAttuale.pdfStoragePath,
                              imageUrls: asStringArray((selectedListinoVoce as any)?.fonteAttuale?.imageUrls),
                              imageStoragePaths: asStringArray((selectedListinoVoce as any)?.fonteAttuale?.imageStoragePaths),
                            })
                          }
                        >
                          DOCUMENTO
                        </button>
                      )}
                      <button type="button" className="mdo-chip-button mdo-chip-upload" onClick={() => fotoInputRef.current?.click()}>Foto</button>
                      <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="mdo-hidden-file" onChange={handleFileChange} />
                      <button type="button" className="mdo-chip-button" onClick={() => { setFotoFile(null); setFotoPreview(null); }}>Pulisci</button>
                      <button type="button" className="mdo-add-button" onClick={aggiungiMateriale} disabled={!canAddMateriale}>Aggiungi</button>
                    </div>
                  </td>
                </tr>

                {materialiFiltrati.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="mdo-empty mdo-empty-state mdo-empty-state--table">Nessun materiale inserito.</div>
                    </td>
                  </tr>
                ) : (
                  materialiFiltrati.map((m) => {
                    const prezzoInfo = prezzoSourceByMaterialeId.get(m.id);
                    const fornitoreLocale = fornitoreByMaterialeId[m.id];
                    const fornitoreDisplay = fornitoreLocale?.fornitoreNome || getOptionalText(m, ["fornitoreScelto", "fornitore", "nomeFornitore"]);
                    return (
                    <tr key={m.id}>
                      <td>
                        <div className="mdo-desc-cell">
                          <div className="mdo-item-photo">
                            {m.fotoUrl ? <img src={m.fotoUrl} alt={m.descrizione} /> : <div className="mdo-photo-placeholder small">Foto</div>}
                          </div>
                          <div>
                            <div className="mdo-item-desc">{m.descrizione}</div>
                            <div className="mdo-item-meta">ID: {m.id}</div>
                            {noteByMaterialeId[m.id] && <div className="mdo-item-meta">Nota: {noteByMaterialeId[m.id]}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{m.quantita}</td>
                      <td>{m.unita}</td>
                      <td>{fornitoreDisplay}</td>
                      <td>
                        {prezzoInfo
                          ? `${prezzoInfo.prezzoUnitario.toFixed(2)} ${normalizeExtractCurrency(prezzoInfo.valuta ?? null) || "-"}/${String(prezzoInfo.unita || m.unita).toLowerCase()}`
                          : "-"}
                      </td>
                      <td>
                        {prezzoInfo
                          ? `N. ${prezzoInfo.numeroPreventivo} del ${prezzoInfo.dataPreventivo}`
                          : "-"}
                      </td>
                      <td className="mdo-col-actions">
                        <div className="mdo-row-actions">
                          {prezzoInfo && hasAnyDocumentRef(prezzoInfo) && (
                            <button
                              type="button"
                              className="mdo-chip-button"
                              onClick={() =>
                                onOpenPreventivo({
                                  preventivoId: prezzoInfo.preventivoId,
                                  pdfUrl: prezzoInfo.pdfUrl,
                                  pdfStoragePath: prezzoInfo.pdfStoragePath || null,
                                  imageUrls: prezzoInfo.imageUrls || [],
                                  imageStoragePaths: prezzoInfo.imageStoragePaths || [],
                                })
                              }
                            >
                              DOCUMENTO
                            </button>
                          )}
                          <button
                            type="button"
                            className="mdo-chip-button"
                            onClick={() => {
                              const current = noteByMaterialeId[m.id] || "";
                              const next = window.prompt("Nota materiale", current);
                              if (next === null) return;
                              const trimmed = next.trim();
                              setNoteByMaterialeId((prev) => ({ ...prev, [m.id]: trimmed }));
                            }}
                          >
                            Note
                          </button>
                          {!prezzoInfo && (
                            <button
                              type="button"
                              className="mdo-chip-button mdo-chip-button--listino"
                              onClick={() => openBozzaListinoManuale(m)}
                            >
                              + LISTINO
                            </button>
                          )}
                          <button type="button" className="mdo-delete" onClick={() => eliminaMateriale(m.id)} aria-label={`Elimina ${m.descrizione}`}>Elimina</button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mdo-card-footer-bar">
            <div className="mdo-sticky-info"><span>Fornitore</span><strong>{isNuovoFornitore ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore" : fornitoreNome || "Non selezionato"}</strong></div>
            <div className="mdo-sticky-info"><span>Materiali temporanei</span><strong>{materiali.length}</strong></div>
            <div className="mdo-sticky-info">
              <span>{prezziMancanti > 0 || udmDaVerificare > 0 ? "Totale parziale" : "Totale stimato"}</span>
              <strong>
                {mixedValute
                  ? `CHF ${totalsByValuta.CHF.toFixed(2)} / EUR ${totalsByValuta.EUR.toFixed(2)}`
                  : usedValute.length === 1
                    ? `${usedValute[0]} ${totalsByValuta[usedValute[0]].toFixed(2)}`
                    : totaleSenzaValuta > 0
                      ? `${totaleStimato.toFixed(2)} -`
                      : "-"}
              </strong>
            </div>
            <div className="mdo-sticky-info"><span>Prezzi mancanti</span><strong>{prezziMancanti}</strong></div>
            <div className="mdo-sticky-info"><span>UDM da verificare</span><strong>{udmDaVerificare}</strong></div>
            <label className="acq-order-note">
              <span>Note ordine (solo bozza/PDF)</span>
              <textarea
                value={ordineNote}
                onChange={(e) => setOrdineNote(e.target.value)}
                placeholder="Inserisci note generali ordine"
              />
            </label>
            <div className="mdo-sticky-actions">
              <button type="button" className="mdo-header-button mdo-header-button--secondary" onClick={clearAllDraftState}>Pulisci bozza</button>
              <button type="button" className="mdo-header-button" onClick={salvaOrdine} disabled={!canSaveOrdine}>{loading ? "SALVO..." : "CONFERMA ORDINE"}</button>
            </div>
            {(prezziMancanti > 0 || udmDaVerificare > 0) && (
              <div className="mdo-footer-warning">
                Totale parziale: {prezziMancanti > 0 ? `${prezziMancanti} righe senza prezzo.` : ""}{" "}
                {udmDaVerificare > 0 ? `${udmDaVerificare} righe con UDM diverse da verificare.` : ""}
              </div>
            )}
            {draftSavedAt && <div className="acq-draft-indicator">Bozza salvata</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function OrdiniListView(props: { kind: ListKind; onOpenDettaglio: (id: string, fromTab: AcquistiTab) => void }) {
  const { kind, onOpenDettaglio } = props;
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatDataIt = (raw: string | undefined) => {
    const value = String(raw || "").trim();
    const matchSpaced = value.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
    if (matchSpaced) {
      const gg = matchSpaced[1].padStart(2, "0");
      const mm = matchSpaced[2].padStart(2, "0");
      const aaaa = matchSpaced[3];
      return `${gg} ${mm} ${aaaa}`;
    }

    const matchGeneric = value.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/);
    if (matchGeneric) {
      const gg = matchGeneric[1].padStart(2, "0");
      const mm = matchGeneric[2].padStart(2, "0");
      const aaaa = matchGeneric[3];
      return `${gg} ${mm} ${aaaa}`;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const gg = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const aaaa = String(date.getFullYear());
      return `${gg} ${mm} ${aaaa}`;
    }

    return "00 00 0000";
  };

  const formatOrderRef = (ordine: Ordine) => {
    const fromData =
      (ordine as any)?.numeroOrdine ??
      (ordine as any)?.progressivo ??
      (ordine as any)?.numero;

    if (fromData !== undefined && fromData !== null && String(fromData).trim() !== "") {
      return String(fromData).trim();
    }

    const dataIt = formatDataIt(ordine.dataOrdine);
    const idTail = String(ordine.id || "").slice(-5).toUpperCase();
    return `ORD DEL ${dataIt} - ${idTail || "0000"}`;
  };

  useEffect(() => {
    const loadOrdini = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordiniRaw = await getItemSync("@ordini");
        const arr = Array.isArray(ordiniRaw) ? (ordiniRaw as Ordine[]) : [];
        const filtered = kind === "attesa"
          ? arr.filter((ordine) => ordine.materiali.some((m) => !m.arrivato))
          : arr.filter((ordine) => ordine.materiali.some((m) => m.arrivato));
        setOrdini(filtered);
      } catch (err) {
        console.error(kind === "attesa" ? "Errore caricamento ordini:" : "Errore caricamento ordini arrivati:", err);
        setError(kind === "attesa" ? "Errore durante il caricamento degli ordini." : "Errore durante il caricamento degli ordini arrivati.");
      } finally {
        setLoading(false);
      }
    };
    void loadOrdini();
  }, [kind]);

  const fromTab: AcquistiTab = kind === "attesa" ? "Ordini" : "Arrivi";

  const eliminaOrdine = async (ordine: Ordine) => {
    const arrivati = ordine.materiali.filter((m) => m.arrivato).length;
    if (arrivati > 0) {
      window.alert("Eliminazione bloccata: l'ordine contiene materiali arrivati.");
      return;
    }

    const conferma = window.confirm("Confermi eliminazione ordine?");
    if (!conferma) return;

    try {
      const raw = await getItemSync("@ordini");
      const arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
      const updated = arr.filter((o) => o.id !== ordine.id);
      await setItemSync("@ordini", updated);
      setOrdini((prev) => prev.filter((o) => o.id !== ordine.id));
    } catch (err) {
      console.error("Errore eliminazione ordine:", err);
      setError("Errore durante l'eliminazione dell'ordine.");
    }
  };

  if (loading) return <div className="acq-list-empty">Caricamento ordini...</div>;

  return (
    <div className="acq-list-shell">
      {error && <div className="acq-list-error">{error}</div>}
      {ordini.length === 0 ? (
        <div className="acq-list-empty">{kind === "attesa" ? "Nessun ordine in attesa." : "Nessun ordine arrivato."}</div>
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
              {ordini.map((ordine) => {
                const tot = ordine.materiali.length;
                const arr = ordine.materiali.filter((m) => m.arrivato).length;
                const nonArr = tot - arr;
                const canDelete = arr === 0;
                return (
                  <tr key={ordine.id}>
                    <td>
                      <div className="acq-orders-cell-main" title={ordine.id}>
                        <strong>{formatOrderRef(ordine)}</strong>
                      </div>
                    </td>
                    <td>{formatDataIt(ordine.dataOrdine)}</td>
                    <td>{ordine.nomeFornitore}</td>
                    <td>
                      <span className={`acq-pill ${kind === "attesa" ? "is-warn" : "is-ok"}`}>
                        {kind === "attesa" ? "In attesa" : "Arrivato"}
                      </span>
                    </td>
                    <td>
                      <div className="acq-orders-stats-inline">
                        <span>Tot {tot}</span>
                        <span>Arr {arr}</span>
                        <span>Att {nonArr}</span>
                      </div>
                    </td>
                    <td>
                      <div className="acq-orders-actions-inline">
                        <button type="button" className="acq-btn acq-btn--primary" onClick={() => onOpenDettaglio(ordine.id, fromTab)}>Apri</button>
                        <details className="acq-kebab">
                          <summary className="acq-btn acq-kebab-trigger" aria-label="Altre azioni">{LABELS_IT.menu.trigger}</summary>
                          <div className="acq-kebab-menu">
                            <button type="button" className="acq-kebab-item" onClick={() => onOpenDettaglio(ordine.id, fromTab)}>{LABELS_IT.menu.edit}</button>
                            <button
                              type="button"
                              className="acq-kebab-item acq-kebab-item--danger"
                              onClick={() => eliminaOrdine(ordine)}
                              disabled={!canDelete}
                              title={!canDelete ? "Non eliminabile: presenti materiali arrivati" : "Elimina ordine"}
                            >
                              Elimina
                            </button>
                          </div>
                        </details>
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

function PreventiviView(props: {
  focusPreventivoId?: string | null;
  onFocusHandled?: () => void;
  manualImportRequest?: { requestId: string; row: ImportBozzaRiga } | null;
  onManualImportHandled?: () => void;
}) {
  const { focusPreventivoId, onFocusHandled, manualImportRequest, onManualImportHandled } = props;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preventivi, setPreventivi] = useState<Preventivo[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [listinoVoci, setListinoVoci] = useState<ListinoVoce[]>([]);
  const [bozzaImportRows, setBozzaImportRows] = useState<ImportBozzaRiga[] | null>(null);
  const [bozzaSourcePreventivo, setBozzaSourcePreventivo] = useState<Preventivo | null>(null);

  const [fornitoreId, setFornitoreId] = useState("");
  const [numeroPreventivo, setNumeroPreventivo] = useState("");
  const [dataPreventivo, setDataPreventivo] = useState(oggi());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [nuoveRighe, setNuoveRighe] = useState<PreventivoRiga[]>([]);
  const [newDesc, setNewDesc] = useState("");
  const [newUnita, setNewUnita] = useState("pz");
  const [newPrezzo, setNewPrezzo] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNewRigaId, setEditingNewRigaId] = useState<string | null>(null);
  const [editingNewRigaDesc, setEditingNewRigaDesc] = useState("");
  const [editingNewRigaUnitaSelected, setEditingNewRigaUnitaSelected] = useState<(typeof UNITA_OPTIONS)[number]>("PZ");
  const [editingNewRigaUnitaCustom, setEditingNewRigaUnitaCustom] = useState("");
  const [editingNewRigaPrezzo, setEditingNewRigaPrezzo] = useState("");
  const [editingNewRigaNote, setEditingNewRigaNote] = useState("");
  const [editingNewRigaError, setEditingNewRigaError] = useState<string | null>(null);
  const [iaPdfFile, setIaPdfFile] = useState<File | null>(null);
  const [iaImageFiles, setIaImageFiles] = useState<File[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaPreview, setIaPreview] = useState<PreventivoExtractResult | null>(null);
  const [iaUploadedRefs, setIaUploadedRefs] = useState<{
    pdfStoragePath: string | null;
    imageStoragePaths: string[];
  }>({ pdfStoragePath: null, imageStoragePaths: [] });

  const [draft, setDraft] = useState<Preventivo | null>(null);
  const [draftPdfFile, setDraftPdfFile] = useState<File | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editUnita, setEditUnita] = useState("pz");
  const [editPrezzo, setEditPrezzo] = useState("");
  const [editNote, setEditNote] = useState("");
  const [soloNonImportati, setSoloNonImportati] = useState(false);
  const [fornitoreListFilter, setFornitoreListFilter] = useState("");
  const [searchPreventivi, setSearchPreventivi] = useState("");
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [openMenuPosition, setOpenMenuPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [openGroupKeys, setOpenGroupKeys] = useState<Record<string, boolean>>({});
  const [missingRowsForPreventivoId, setMissingRowsForPreventivoId] = useState<string | null>(null);

  const getPreventivoDocumentSource = (p: Preventivo | null | undefined) => {
    if (!p) return { pdfUrl: null, pdfStoragePath: null, imageUrls: [], imageStoragePaths: [] as string[] };
    return {
      pdfUrl: p.pdfUrl || null,
      pdfStoragePath: (p as any)?.pdfStoragePath || null,
      imageUrls: asStringArray((p as any)?.imageUrls),
      imageStoragePaths: asStringArray((p as any)?.imageStoragePaths),
    };
  };

  const hasDocumentForPreventivo = (p: Preventivo | null | undefined) => hasAnyDocumentRef(getPreventivoDocumentSource(p));

  const openPreventivoDocumento = async (p: Preventivo | null | undefined) => {
    if (!p) return;
    try {
      const opened = await openDocumentRef(getPreventivoDocumentSource(p));
      if (!opened) {
        setError("Documento non disponibile per questo preventivo.");
      }
    } catch (err) {
      console.error("Errore apertura documento preventivo:", err);
      setError("Impossibile aprire il documento del preventivo.");
    }
  };

  const openModificaFromList = (p: Preventivo) => {
    setShowNew(false);
    setSelectedId(p.id);
    setDraft(JSON.parse(JSON.stringify(p)));
    setDraftPdfFile(null);
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
    setEditing(true);
  };

  const selected = useMemo(
    () => preventivi.find((p) => p.id === selectedId) || null,
    [preventivi, selectedId]
  );

  const importedCountByPreventivoId = useMemo(() => {
    const map = new Map<string, number>();
    listinoVoci.forEach((v) => {
      const id = String((v as any)?.fonteAttuale?.preventivoId || "").trim();
      if (!id) return;
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [listinoVoci]);

  const missingRowsByPreventivoId = useMemo(() => {
    const result = new Map<string, { rows: PreventivoRiga[]; fallback: boolean }>();

    preventivi.forEach((p) => {
      const importedVoci = listinoVoci.filter((v) => String(v.fonteAttuale?.preventivoId || "").trim() === String(p.id || "").trim());
      const countByKey = new Map<string, number>();
      const countByKeyNoVal = new Map<string, number>();

      importedVoci.forEach((v) => {
        const noValKey = `${normalizeDescrizione(String(v.articoloCanonico || ""))}|${normalizeUnita(String(v.unita || ""))}`;
        const fullKey = `${noValKey}|${String(v.valuta || "").toUpperCase().trim()}`;
        countByKey.set(fullKey, (countByKey.get(fullKey) || 0) + 1);
        countByKeyNoVal.set(noValKey, (countByKeyNoVal.get(noValKey) || 0) + 1);
      });

      const missingRows: PreventivoRiga[] = [];
      const righe = Array.isArray(p.righe) ? p.righe : [];
      righe.forEach((r) => {
        const noValKey = `${normalizeDescrizione(String(r.descrizione || ""))}|${normalizeUnita(String(r.unita || ""))}`;
        const noteVal = String(r.note || "").toUpperCase();
        const valuta = noteVal.includes("EUR") ? "EUR" : noteVal.includes("CHF") ? "CHF" : "";
        const fullKey = valuta ? `${noValKey}|${valuta}` : "";

        if (fullKey) {
          const availableFull = countByKey.get(fullKey) || 0;
          if (availableFull > 0) {
            countByKey.set(fullKey, availableFull - 1);
            countByKeyNoVal.set(noValKey, Math.max(0, (countByKeyNoVal.get(noValKey) || 0) - 1));
            return;
          }
        }

        const availableNoVal = countByKeyNoVal.get(noValKey) || 0;
        if (availableNoVal > 0) {
          countByKeyNoVal.set(noValKey, availableNoVal - 1);
          return;
        }

        missingRows.push(r);
      });

      const imported = importedCountByPreventivoId.get(p.id) || 0;
      const total = righe.length;
      const fallback = imported > 0 && imported < total && missingRows.length === 0;
      result.set(p.id, { rows: missingRows, fallback });
    });

    return result;
  }, [preventivi, listinoVoci, importedCountByPreventivoId]);

  const getImportStatus = (p: Preventivo) => {
    const total = Array.isArray(p.righe) ? p.righe.length : 0;
    const imported = importedCountByPreventivoId.get(p.id) || 0;
    if (total === 0) return { imported, total, label: LABELS_IT.import.zeroRows, className: "neutral" as const };
    if (imported === 0) return { imported, total, label: LABELS_IT.import.not, className: "not" as const };
    if (imported < total) return { imported, total, label: LABELS_IT.import.partial, className: "partial" as const };
    return { imported, total, label: LABELS_IT.import.full, className: "full" as const };
  };

  const groupedPreventivi = useMemo(() => {
    const groups = new Map<string, { key: string; fornitoreNome: string; items: Preventivo[] }>();
    preventivi.forEach((p) => {
      if (fornitoreListFilter && String(p.fornitoreId || "").trim() !== fornitoreListFilter) return;
      const q = searchPreventivi.trim().toLowerCase();
      if (q) {
        const hay = `${p.fornitoreNome || ""} ${p.numeroPreventivo || ""} ${p.dataPreventivo || ""}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      const key = String(p.fornitoreId || "").trim() || `nome:${String(p.fornitoreNome || "").trim().toUpperCase() || "SENZA_FORNITORE"}`;
      const fornitoreNome = String(p.fornitoreNome || "").trim() || "Senza fornitore";
      if (!groups.has(key)) {
        groups.set(key, { key, fornitoreNome, items: [] });
      }
      groups.get(key)!.items.push(p);
    });
    const arr = Array.from(groups.values()).map((g) => ({
      ...g,
      items: g.items
        .filter((p) => (soloNonImportati ? getImportStatus(p).className === "not" : true))
        .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)),
    }));
    return arr.filter((g) => g.items.length > 0).sort((a, b) => a.fornitoreNome.localeCompare(b.fornitoreNome, "it"));
  }, [preventivi, soloNonImportati, importedCountByPreventivoId, fornitoreListFilter, searchPreventivi]);

  const fornitoriPreventiviOptions = useMemo(() => {
    const map = new Map<string, string>();
    preventivi.forEach((p) => {
      const id = String(p.fornitoreId || "").trim();
      const nome = String(p.fornitoreNome || "").trim();
      if (id && nome && !map.has(id)) map.set(id, nome);
    });
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  }, [preventivi]);

  useEffect(() => {
    setOpenGroupKeys((prev) => {
      const next: Record<string, boolean> = { ...prev };
      groupedPreventivi.forEach((g) => {
        if (next[g.key] === undefined) next[g.key] = true;
      });
      return next;
    });
  }, [groupedPreventivi]);

  useEffect(() => {
    if (!openMenuKey) return;
    const closeMenu = () => {
      setOpenMenuKey(null);
      setOpenMenuPosition(null);
    };
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-menu-root="preventivi"]')) return;
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
  }, [openMenuKey]);

  const estraiPreventivoIA = useMemo(
    () => httpsCallable<PreventivoExtractPayload, PreventivoExtractResult>(functions, "estraiPreventivoIA"),
    []
  );

  useEffect(() => {
    if (!focusPreventivoId) return;
    setSelectedId(focusPreventivoId);
    setShowNew(false);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
    onFocusHandled?.();
  }, [focusPreventivoId, onFocusHandled]);

  useEffect(() => {
    if (!manualImportRequest) return;
    setShowNew(false);
    setSelectedId(null);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
    setBozzaSourcePreventivo(null);
    setError(null);
    setBozzaImportRows([rehydrateBozzaRow({ ...manualImportRequest.row, daVerificare: true })]);
    onManualImportHandled?.();
  }, [manualImportRequest, onManualImportHandled]);

  const fornitoreNomeById = (id: string) => {
    const f = fornitori.find((x) => x.id === id);
    return f?.nome || "";
  };

  const persistPreventivi = async (next: Preventivo[]) => {
    const refDoc = doc(collection(db, "storage"), PREVENTIVI_DOC_ID);
    const sanitizedDoc = sanitizeUndefinedToNull({ preventivi: next });
    try {
      await setDoc(refDoc, sanitizedDoc, { merge: true });
    } catch (err) {
      console.error("Errore salvataggio preventivo (persistPreventivi):", err);
      throw err;
    }
  };

  const persistListino = async (next: ListinoVoce[]) => {
    const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
    const sanitizedDoc = sanitizeUndefinedToNull({ voci: next });
    try {
      await setDoc(refDoc, sanitizedDoc, { merge: true });
    } catch (err) {
      console.error("Errore salvataggio listino (persistListino):", err);
      throw err;
    }
  };

  const findListinoMatch = (r: {
    fornitoreId: string;
    articoloCanonico: string;
    unita: string;
    valuta: Valuta;
  }) => {
    const key = listinoKey(r);
    return listinoVoci.find((v) => listinoKey({
      fornitoreId: v.fornitoreId,
      articoloCanonico: v.articoloCanonico,
      unita: v.unita,
      valuta: v.valuta,
    }) === key);
  };

  const rehydrateBozzaRow = (row: ImportBozzaRiga): ImportBozzaRiga => {
    const match = findListinoMatch({
      fornitoreId: row.fornitoreId,
      articoloCanonico: row.articoloCanonico,
      unita: row.unita,
      valuta: row.valuta,
    });
    const prezzoPrecedente = match?.prezzoAttuale;
    const trendData = computeTrend(row.prezzoNuovo, prezzoPrecedente);
    return {
      ...row,
      prezzoPrecedente,
      trend: trendData.trend,
      daVerificare: true,
    };
  };

  const updateBozzaRow = (id: string, patch: Partial<ImportBozzaRiga>) => {
    setBozzaImportRows((prev) => {
      if (!prev) return prev;
      return prev.map((r) => {
        if (r.id !== id) return r;
        const prezzoNuovoRaw = patch.prezzoNuovo ?? r.prezzoNuovo;
        const prezzoNuovo = Number.isFinite(prezzoNuovoRaw) ? Number(prezzoNuovoRaw) : r.prezzoNuovo;
        const merged: ImportBozzaRiga = {
          ...r,
          ...patch,
          prezzoNuovo,
        };
        return rehydrateBozzaRow(merged);
      });
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const forRef = doc(db, "storage", "@fornitori");
        const forSnap = await getDoc(forRef);
        if (forSnap.exists()) {
          const arr = (forSnap.data()?.value || []) as any[];
          setFornitori(
            arr.map((f) => ({
              id: f.id || generaId(),
              nome: f.nome || f.ragioneSociale || "",
            }))
          );
        }

        const prevRef = doc(collection(db, "storage"), PREVENTIVI_DOC_ID);
        const prevSnap = await getDoc(prevRef);
        const list = prevSnap.exists()
          ? ((prevSnap.data()?.preventivi as Preventivo[]) || [])
          : [];
        const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        setPreventivi(sorted);

        const listinoRef = doc(collection(db, "storage"), LISTINO_DOC_ID);
        const listinoSnap = await getDoc(listinoRef);
        const voci = listinoSnap.exists()
          ? ((listinoSnap.data()?.voci as ListinoVoce[]) || [])
          : [];
        setListinoVoci(Array.isArray(voci) ? voci : []);
      } catch (err) {
        console.error("Errore caricamento preventivi:", err);
        setError("Errore caricamento registro preventivi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!bozzaImportRows || bozzaImportRows.length === 0) return;
    setBozzaImportRows((prev) => {
      if (!prev) return prev;
      return prev.map((r) => rehydrateBozzaRow(r));
    });
  }, [listinoVoci]);

  const resetNuovoForm = () => {
    setFornitoreId("");
    setNumeroPreventivo("");
    setDataPreventivo(oggi());
    setPdfFile(null);
    setNuoveRighe([]);
    setNewDesc("");
    setNewUnita("pz");
    setNewPrezzo("");
    setNewNote("");
    setEditingNewRigaId(null);
    setEditingNewRigaDesc("");
    setEditingNewRigaUnitaSelected("PZ");
    setEditingNewRigaUnitaCustom("");
    setEditingNewRigaPrezzo("");
    setEditingNewRigaNote("");
    setEditingNewRigaError(null);
    setIaPdfFile(null);
    setIaImageFiles([]);
    setIaPreview(null);
    setIaUploadedRefs({
      pdfStoragePath: null,
      imageStoragePaths: [],
    });
  };

  const resolveDownloadUrlSafe = async (path: string | null | undefined): Promise<string | null> => {
    const normalized = String(path || "").trim();
    if (!normalized) return null;
    try {
      return await getDownloadURL(ref(storage, normalized));
    } catch {
      return null;
    }
  };

  const resolveDownloadUrlsSafe = async (paths: string[] | null | undefined): Promise<string[]> => {
    const list = asStringArray(paths || []);
    if (list.length === 0) return [];
    const settled = await Promise.allSettled(
      list.map((path) => getDownloadURL(ref(storage, path)))
    );
    return settled
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((url) => String(url || "").trim().length > 0);
  };

  const resolveFornitoreFromExtract = (supplierName: string | null) => {
    const normalized = normalizeDescrizione(String(supplierName || ""));
    if (!normalized) return null;
    const exact = fornitori.find((f) => normalizeDescrizione(f.nome) === normalized);
    if (exact) return exact;
    return fornitori.find((f) => {
      const target = normalizeDescrizione(f.nome);
      return target.includes(normalized) || normalized.includes(target);
    }) || null;
  };

  const getExtractCode = (item: ExtractItem) => {
    const direct = String(item.articleCode || "").trim().toUpperCase();
    if (direct) return direct;
    const desc = String(item.description || "");
    const codeMatch = desc.match(/\bCODE[:\s-]*([A-Z0-9/_-]+)\b/i);
    return codeMatch?.[1]?.trim().toUpperCase() || null;
  };

  const iaRowsAnalysis = useMemo(() => {
    if (!iaPreview) return [];
    const resolvedFornitore = resolveFornitoreFromExtract(iaPreview.supplier?.name || null);
    const supplierTargetId = String(fornitoreId || resolvedFornitore?.id || "").trim();
    return (iaPreview.items || []).map((item, idx) => {
      const rowCode = getExtractCode(item);
      const rowDescNorm = normalizeArticoloCanonico(String(item.description || ""));
      const candidateBySupplier = supplierTargetId
        ? listinoVoci.filter((v) => String(v.fornitoreId || "").trim() === supplierTargetId)
        : [];
      const codeMatch = rowCode
        ? candidateBySupplier.find((v) => String(v.codiceArticolo || "").trim().toUpperCase() === rowCode)
        : undefined;
      const descMatch = !codeMatch
        ? candidateBySupplier.find((v) => normalizeArticoloCanonico(v.articoloCanonico) === rowDescNorm)
        : undefined;
      const match = codeMatch || descMatch || null;
      const matchType: "CODE" | "DESC" | "NONE" = codeMatch ? "CODE" : descMatch ? "DESC" : "NONE";
      const refData = match
        ? {
            prezzoAttuale: Number(match.prezzoAttuale || 0),
            valuta: match.valuta,
            numeroPreventivo: match.fonteAttuale?.numeroPreventivo || "",
            dataPreventivo: match.fonteAttuale?.dataPreventivo || "",
            pdfUrl: match.fonteAttuale?.pdfUrl || null,
            pdfStoragePath: match.fonteAttuale?.pdfStoragePath || null,
          }
        : null;
      const estrattoPrezzo = Number(item.unitPrice);
      const prezzoValido = Number.isFinite(estrattoPrezzo) && estrattoPrezzo > 0;
      const estrattoValuta = normalizeExtractCurrency(item.currency) || normalizeExtractCurrency(iaPreview.document?.currency);
      const compareByValuta = !estrattoValuta || !refData?.valuta || estrattoValuta === refData.valuta;
      let compare: "UP" | "DOWN" | "SAME" | "NONE" = "NONE";
      let delta: number | null = null;
      let compareMessage: string | null = null;

      if (refData && prezzoValido && compareByValuta) {
        delta = estrattoPrezzo - refData.prezzoAttuale;
        if (delta > 0.00001) {
          compare = "UP";
          compareMessage = `Prezzo piu alto rispetto al preventivo N. ${refData.numeroPreventivo}${refData.dataPreventivo ? ` del ${refData.dataPreventivo}` : ""}`;
        } else if (delta < -0.00001) {
          compare = "DOWN";
          compareMessage = `Prezzo piu basso rispetto al preventivo N. ${refData.numeroPreventivo}${refData.dataPreventivo ? ` del ${refData.dataPreventivo}` : ""}`;
        } else {
          compare = "SAME";
          compareMessage = `Prezzo uguale al preventivo N. ${refData.numeroPreventivo}${refData.dataPreventivo ? ` del ${refData.dataPreventivo}` : ""}`;
        }
      }

      return {
        key: `${item.description || "row"}-${idx}`,
        item,
        matchType,
        refData,
        compare,
        delta,
        compareMessage,
      };
    });
  }, [iaPreview, fornitoreId, listinoVoci, fornitori]);

  const openUrlInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openRefPreventivo = async (row: (typeof iaRowsAnalysis)[number]) => {
    if (!row.refData) return;
    try {
      if (row.refData.pdfUrl) {
        openUrlInNewTab(row.refData.pdfUrl);
        return;
      }
      if (row.refData.pdfStoragePath) {
        const downloadUrl = await getDownloadURL(ref(storage, row.refData.pdfStoragePath));
        openUrlInNewTab(downloadUrl);
        return;
      }
      setIaError("Preventivo di riferimento senza PDF disponibile.");
    } catch (err) {
      console.error("Errore apertura preventivo di riferimento:", err);
      setIaError("Impossibile aprire il preventivo di riferimento.");
    }
  };

  const openIADocument = async () => {
    try {
      if (iaUploadedRefs.pdfStoragePath) {
        const downloadUrl = await getDownloadURL(ref(storage, iaUploadedRefs.pdfStoragePath));
        openUrlInNewTab(downloadUrl);
        return;
      }
      if (iaUploadedRefs.imageStoragePaths.length > 0) {
        const first = iaUploadedRefs.imageStoragePaths[0];
        const downloadUrl = await getDownloadURL(ref(storage, first));
        openUrlInNewTab(downloadUrl);
        return;
      }
      setIaError("Nessun documento IA disponibile da aprire.");
    } catch (err) {
      console.error("Errore apertura documento IA:", err);
      setIaError("Impossibile aprire il documento IA.");
    }
  };

  const openAllIADocuments = async () => {
    if (iaUploadedRefs.imageStoragePaths.length <= 1) {
      await openIADocument();
      return;
    }
    try {
      const urls = await Promise.all(
        iaUploadedRefs.imageStoragePaths.map((path) => getDownloadURL(ref(storage, path)))
      );
      urls.forEach((url) => openUrlInNewTab(url));
    } catch (err) {
      console.error("Errore apertura immagini IA:", err);
      setIaError("Impossibile aprire le immagini IA.");
    }
  };

  const mapExtractedRowsToPreventivo = (extract: PreventivoExtractResult): PreventivoRiga[] => {
    return (extract.items || [])
      .filter((item) => {
        const desc = String(item.description || "").trim();
        const price = Number(item.unitPrice);
        return desc && Number.isFinite(price) && price > 0;
      })
      .map((item) => {
        const noteParts: string[] = [];
        if (item.articleCode) noteParts.push(`code:${item.articleCode}`);
        if (item.currency) noteParts.push(`valuta:${item.currency}`);
        const price = Number(item.unitPrice);
        return {
          id: generaId(),
          descrizione: String(item.description || "").trim().toUpperCase(),
          unita: normalizeUnita(item.uom || ""),
          prezzoUnitario: Number.isFinite(price) ? price : 0,
          note: noteParts.length > 0 ? noteParts.join(" | ") : undefined,
        };
      });
  };

  const mapExtractedRowsToBozzaListino = (
    extract: PreventivoExtractResult,
    fornitoreTargetId: string
  ): ImportBozzaRiga[] => {
    const nome = fornitoreNomeById(fornitoreTargetId) || String(extract.supplier?.name || "").trim();
    const dataDoc = formatExtractDateForInput(extract.document?.date) || oggi();
    const numeroDoc = String(extract.document?.number || "").trim() || "MANUALE";
    const fallbackValuta = normalizeExtractCurrency(extract.document?.currency) || "CHF";
    return (extract.items || [])
      .filter((item) => {
        const desc = String(item.description || "").trim();
        const price = Number(item.unitPrice);
        return desc && Number.isFinite(price) && price > 0;
      })
      .map((item) => {
        const valuta = normalizeExtractCurrency(item.currency) || fallbackValuta;
        const prezzo = Number(item.unitPrice);
        const sourceImageStoragePaths = asStringArray(iaUploadedRefs.imageStoragePaths);
        const row: ImportBozzaRiga = {
          id: generaId(),
          fornitoreId: fornitoreTargetId,
          fornitoreNome: nome,
          articoloCanonico: normalizeArticoloCanonico(String(item.description || "")),
          codiceArticolo: String(item.articleCode || "").trim() || undefined,
          unita: normalizeUnita(item.uom || ""),
          valuta,
          prezzoNuovo: Number.isFinite(prezzo) ? prezzo : 0,
          trend: "new",
          fonte: {
            preventivoId: `IA-${generaId()}`,
            numeroPreventivo: numeroDoc,
            dataPreventivo: dataDoc,
            pdfUrl: null,
            pdfStoragePath: iaUploadedRefs.pdfStoragePath,
            imageStoragePaths: sourceImageStoragePaths,
            imageUrls: [],
          },
          daVerificare: true,
        };
        return rehydrateBozzaRow(row);
      });
  };

  const onIaPdfSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIaPdfFile(file);
    setIaImageFiles([]);
    setIaError(null);
  };

  const onIaImagesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      setIaError("Massimo 10 foto per estrazione IA.");
    }
    setIaImageFiles(files.slice(0, 10));
    setIaPdfFile(null);
    if (files.length <= 10) setIaError(null);
  };

  const runEstrazioneIA = async () => {
    const hasPdf = !!iaPdfFile;
    const hasImages = iaImageFiles.length > 0;
    if (hasPdf === hasImages) {
      setIaError("Seleziona un PDF oppure foto (non entrambi).");
      return;
    }

    setIaLoading(true);
    setIaError(null);
    try {
      let payload: PreventivoExtractPayload;
      let uploadedPdfPath: string | null = null;
      let uploadedImagePaths: string[] = [];
      const extractionId = generaId();

      if (iaPdfFile) {
        const pdfPath = `preventivi/ia/${extractionId}.pdf`;
        await uploadBytes(ref(storage, pdfPath), iaPdfFile, {
          contentType: iaPdfFile.type || "application/pdf",
        });
        uploadedPdfPath = pdfPath;
        payload = {
          pdfStoragePath: pdfPath,
          originalFileName: iaPdfFile.name || null,
        };
      } else {
        const paths: string[] = [];
        for (let idx = 0; idx < iaImageFiles.length; idx += 1) {
          const file = iaImageFiles[idx];
          if (!file) continue;
          const fileName = String(file.name || "");
          const dotIndex = fileName.lastIndexOf(".");
          const extFromName = dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
          const extFromMime =
            file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : file.type === "image/jpeg" || file.type === "image/jpg"
                  ? "jpg"
                  : "";
          const ext =
            extFromName === "png" || extFromName === "jpg" || extFromName === "jpeg" || extFromName === "webp"
              ? extFromName
              : extFromMime || "jpg";
          const imagePath = `preventivi/ia/${extractionId}_${idx + 1}.${ext}`;
          try {
            await uploadBytes(ref(storage, imagePath), file, {
              contentType: file.type || "image/jpeg",
            });
            if (imagePath.trim()) {
              paths.push(imagePath);
            }
          } catch {
            // prosegue con eventuali altri file selezionati
          }
        }
        if (paths.length === 0) {
          setIaError("Nessuna foto valida caricata. Verifica i file selezionati.");
          return;
        }
        uploadedImagePaths = paths;
        payload = {
          imageStoragePaths: paths,
          originalFileName: iaImageFiles[0]?.name || null,
        };
      }

      const result = await estraiPreventivoIA(payload);
      const extracted = result.data as PreventivoExtractResult;
      if (!extracted || extracted.schemaVersion !== "preventivo_price_extract_v1") {
        throw new Error("Risposta IA non conforme allo schema preventivo_price_extract_v1");
      }

      setIaPreview(extracted);
      setIaUploadedRefs({
        pdfStoragePath: uploadedPdfPath,
        imageStoragePaths: uploadedImagePaths,
      });
      setShowNew(true);

      if (extracted.document?.number) {
        setNumeroPreventivo(extracted.document.number);
      }
      if (extracted.document?.date) {
        setDataPreventivo(formatExtractDateForInput(extracted.document.date));
      }

      const match = resolveFornitoreFromExtract(extracted.supplier?.name || null);
      if (!fornitoreId && match) {
        setFornitoreId(match.id);
      }

      const rows = mapExtractedRowsToPreventivo(extracted);
      if (rows.length > 0) {
        setNuoveRighe(rows);
      } else {
        setIaError("Nessuna riga valida estratta (serve descrizione + prezzo unitario > 0).");
      }
    } catch (err) {
      console.error("Errore estrazione IA preventivo:", err);
      setIaError("Estrazione IA non riuscita. Verifica file e riprova.");
    } finally {
      setIaLoading(false);
    }
  };

  const prefillBozzaListinoFromIA = () => {
    if (!iaPreview) {
      setIaError("Esegui prima l'estrazione IA.");
      return;
    }
    const matched = resolveFornitoreFromExtract(iaPreview.supplier?.name || null);
    const fornitoreTargetId = fornitoreId || matched?.id || "";
    if (!fornitoreTargetId) {
      setIaError("Seleziona un fornitore nel form prima di creare la bozza listino.");
      return;
    }
    const rows = mapExtractedRowsToBozzaListino(iaPreview, fornitoreTargetId);
    if (rows.length === 0) {
      setIaError("Nessuna riga con prezzo valida per la bozza listino.");
      return;
    }
    setBozzaSourcePreventivo(null);
    setBozzaImportRows(rows);
    setIaError(null);
  };

  const addNewRiga = () => {
    const prezzo = Number(String(newPrezzo).replace(",", "."));
    if (!newDesc.trim() || !Number.isFinite(prezzo) || prezzo < 0) return;
    const riga: PreventivoRiga = {
      id: generaId(),
      descrizione: newDesc.trim().toUpperCase(),
      unita: newUnita,
      prezzoUnitario: prezzo,
      note: newNote.trim() || undefined,
    };
    setNuoveRighe((p) => [...p, riga]);
    setNewDesc("");
    setNewUnita("pz");
    setNewPrezzo("");
    setNewNote("");
  };

  const removeNewRiga = (id: string) => {
    setNuoveRighe((p) => p.filter((r) => r.id !== id));
  };

  const apriModificaNewRiga = (row: PreventivoRiga) => {
    setEditingNewRigaId(row.id);
    setEditingNewRigaDesc(row.descrizione || "");
    const unitaChoice = getUnitaChoice(row.unita || "");
    setEditingNewRigaUnitaSelected(unitaChoice.selected as (typeof UNITA_OPTIONS)[number]);
    setEditingNewRigaUnitaCustom(unitaChoice.custom);
    setEditingNewRigaPrezzo(String(row.prezzoUnitario ?? ""));
    setEditingNewRigaNote(row.note || "");
    setEditingNewRigaError(null);
  };

  const annullaModificaNewRiga = () => {
    setEditingNewRigaId(null);
    setEditingNewRigaDesc("");
    setEditingNewRigaUnitaSelected("PZ");
    setEditingNewRigaUnitaCustom("");
    setEditingNewRigaPrezzo("");
    setEditingNewRigaNote("");
    setEditingNewRigaError(null);
  };

  const salvaModificaNewRiga = () => {
    if (!editingNewRigaId) return;
    const descrizione = editingNewRigaDesc.trim();
    if (!descrizione) {
      setEditingNewRigaError("La descrizione e obbligatoria.");
      return;
    }
    if (!String(editingNewRigaPrezzo).trim()) {
      setEditingNewRigaError("Il prezzo unitario e obbligatorio.");
      return;
    }
    const prezzo = Number(String(editingNewRigaPrezzo).replace(",", "."));
    if (!Number.isFinite(prezzo) || prezzo < 0) {
      setEditingNewRigaError("Il prezzo unitario deve essere un numero >= 0.");
      return;
    }

    setNuoveRighe((prev) =>
      prev.map((r) =>
        r.id === editingNewRigaId
          ? {
              ...r,
              descrizione: descrizione.toUpperCase(),
              unita:
                editingNewRigaUnitaSelected === "ALTRO"
                  ? normalizeUnita(editingNewRigaUnitaCustom)
                  : editingNewRigaUnitaSelected,
              prezzoUnitario: prezzo,
              note: editingNewRigaNote.trim() || undefined,
            }
          : r
      )
    );
    annullaModificaNewRiga();
  };

  const salvaNuovoPreventivo = async () => {
    const nomeFornitore = fornitoreNomeById(fornitoreId);
    if (!fornitoreId || !nomeFornitore || !numeroPreventivo.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const id = generaId();
      let pdfUrl: string | null = null;
      let pdfStoragePath: string | null = null;
      let imageStoragePaths: string[] = [];
      let imageUrls: string[] = [];
      const hasIaDocumentRefs =
        !!iaPreview &&
        (!!iaUploadedRefs.pdfStoragePath || iaUploadedRefs.imageStoragePaths.length > 0);

      if (pdfFile) {
        pdfStoragePath = `preventivi/${id}.pdf`;
        const r = ref(storage, pdfStoragePath);
        await uploadBytes(r, pdfFile, { contentType: "application/pdf" });
        pdfUrl = await getDownloadURL(r);
      } else if (hasIaDocumentRefs && iaUploadedRefs.pdfStoragePath) {
        pdfStoragePath = iaUploadedRefs.pdfStoragePath;
      }

      if (hasIaDocumentRefs) {
        imageStoragePaths = asStringArray(iaUploadedRefs.imageStoragePaths);
      }

      if (!pdfUrl && pdfStoragePath) {
        pdfUrl = await resolveDownloadUrlSafe(pdfStoragePath);
      }
      if (imageStoragePaths.length > 0) {
        imageUrls = await resolveDownloadUrlsSafe(imageStoragePaths);
      }

      const now = Date.now();
      const nuovo: Preventivo = {
        id,
        fornitoreId,
        fornitoreNome: nomeFornitore,
        numeroPreventivo: numeroPreventivo.trim(),
        dataPreventivo: dataPreventivo.trim() || oggi(),
        pdfUrl,
        pdfStoragePath,
        imageStoragePaths,
        imageUrls,
        righe: nuoveRighe,
        createdAt: now,
        updatedAt: now,
      };

      const next = [nuovo, ...preventivi].sort((a, b) => b.updatedAt - a.updatedAt);
      await persistPreventivi(next);
      setPreventivi(next);
      setSelectedId(nuovo.id);
      setShowNew(false);
      resetNuovoForm();
    } catch (err) {
      console.error("Errore salvataggio preventivo (persistPreventivi):", err);
      setError("Errore salvataggio preventivo.");
    } finally {
      setSaving(false);
    }
  };

  const eliminaPreventivo = async (p: Preventivo) => {
    const ok = window.confirm(`Eliminare il preventivo ${p.numeroPreventivo}?`);
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      if (p.pdfStoragePath) {
        try {
          await deleteObject(ref(storage, p.pdfStoragePath));
        } catch (err) {
          console.warn("Impossibile eliminare PDF da storage:", err);
        }
      }

      const next = preventivi.filter((x) => x.id !== p.id);
      await persistPreventivi(next);
      setPreventivi(next);
      if (selectedId === p.id) {
        setSelectedId(null);
        setEditing(false);
        setDraft(null);
        setDraftPdfFile(null);
      }
    } catch (err) {
      console.error("Errore eliminazione preventivo (persistPreventivi):", err);
      setError("Errore eliminazione preventivo.");
    } finally {
      setSaving(false);
    }
  };

  const startImportListino = (p: Preventivo) => {
      const rows: ImportBozzaRiga[] = (p.righe || []).map((r) => {
      const valuta = inferValuta({
        descrizione: r.descrizione,
        note: r.note,
        numeroPreventivo: p.numeroPreventivo,
      });
        const base: ImportBozzaRiga = {
        id: generaId(),
        fornitoreId: p.fornitoreId,
        fornitoreNome: p.fornitoreNome,
        articoloCanonico: normalizeArticoloCanonico(r.descrizione),
        codiceArticolo: "",
        unita: normalizeUnita(r.unita),
        valuta,
        prezzoNuovo: Number(r.prezzoUnitario || 0),
        trend: "new",
          fonte: {
            preventivoId: p.id,
            numeroPreventivo: p.numeroPreventivo,
            dataPreventivo: p.dataPreventivo,
            pdfUrl: p.pdfUrl || null,
            pdfStoragePath: p.pdfStoragePath || null,
            imageStoragePaths: asStringArray((p as any)?.imageStoragePaths),
            imageUrls: asStringArray((p as any)?.imageUrls),
          },
          daVerificare: true,
          note: r.note,
        };
      return rehydrateBozzaRow(base);
    });

    setBozzaSourcePreventivo(p);
    setBozzaImportRows(rows);
  };

  const annullaBozzaImport = () => {
    setBozzaImportRows(null);
    setBozzaSourcePreventivo(null);
  };

  const confermaImportBozza = async () => {
    if (!bozzaImportRows || bozzaImportRows.length === 0) return;
    const invalid = bozzaImportRows.find(
      (r) =>
        !String(r.articoloCanonico || "").trim() ||
        !String(r.unita || "").trim() ||
        !String(r.valuta || "").trim() ||
        !Number.isFinite(r.prezzoNuovo) ||
        Number(r.prezzoNuovo) <= 0
    );
    if (invalid) {
      setError("Bozza incompleta: compila Articolo, Unita, Valuta e Prezzo (> 0) prima della conferma.");
      return;
    }

    const ok = window.confirm(`Confermare import nel listino di ${bozzaImportRows.length} voci?`);
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const listinoRef = doc(collection(db, "storage"), LISTINO_DOC_ID);
      const listinoSnap = await getDoc(listinoRef);
      const current: ListinoVoce[] = listinoSnap.exists()
        ? ((listinoSnap.data()?.voci as ListinoVoce[]) || [])
        : [];

      let next = [...current];
      const now = Date.now();

      bozzaImportRows.forEach((r) => {
        const key = listinoKey({
          fornitoreId: r.fornitoreId,
          articoloCanonico: r.articoloCanonico,
          unita: r.unita,
          valuta: r.valuta,
        });

        const idx = next.findIndex((v) => listinoKey({
          fornitoreId: v.fornitoreId,
          articoloCanonico: v.articoloCanonico,
          unita: v.unita,
          valuta: v.valuta,
        }) === key);

        if (idx >= 0) {
          const prev = next[idx];
          const trendData = computeTrend(r.prezzoNuovo, prev.prezzoAttuale);
          const sourceImageStoragePaths = asStringArray(r.fonte.imageStoragePaths);
          const sourceImageUrls = asStringArray(r.fonte.imageUrls);
          next[idx] = {
            ...prev,
            articoloCanonico: r.articoloCanonico,
            codiceArticolo: r.codiceArticolo || undefined,
            unita: normalizeUnita(r.unita),
            valuta: r.valuta,
            prezzoPrecedente: prev.prezzoAttuale,
            fontePrecedente: {
              preventivoId: prev.fonteAttuale.preventivoId,
              numeroPreventivo: prev.fonteAttuale.numeroPreventivo,
              dataPreventivo: prev.fonteAttuale.dataPreventivo,
              imageStoragePaths: asStringArray(prev.fonteAttuale.imageStoragePaths),
              imageUrls: asStringArray(prev.fonteAttuale.imageUrls),
            },
            prezzoAttuale: r.prezzoNuovo,
            fonteAttuale: {
              preventivoId: r.fonte.preventivoId,
              numeroPreventivo: r.fonte.numeroPreventivo,
              dataPreventivo: r.fonte.dataPreventivo,
              pdfUrl: r.fonte.pdfUrl,
              pdfStoragePath: r.fonte.pdfStoragePath,
              imageStoragePaths: sourceImageStoragePaths,
              imageUrls: sourceImageUrls,
            },
            trend: trendData.trend,
            deltaAbs: trendData.deltaAbs,
            deltaPct: trendData.deltaPct,
            updatedAt: now,
          };
        } else {
          const sourceImageStoragePaths = asStringArray(r.fonte.imageStoragePaths);
          const sourceImageUrls = asStringArray(r.fonte.imageUrls);
          next.push({
            id: generaId(),
            fornitoreId: r.fornitoreId,
            fornitoreNome: r.fornitoreNome,
            articoloCanonico: r.articoloCanonico,
            codiceArticolo: r.codiceArticolo || undefined,
            unita: normalizeUnita(r.unita),
            valuta: r.valuta,
            prezzoAttuale: r.prezzoNuovo,
            fonteAttuale: {
              preventivoId: r.fonte.preventivoId,
              numeroPreventivo: r.fonte.numeroPreventivo,
              dataPreventivo: r.fonte.dataPreventivo,
              pdfUrl: r.fonte.pdfUrl,
              pdfStoragePath: r.fonte.pdfStoragePath,
              imageStoragePaths: sourceImageStoragePaths,
              imageUrls: sourceImageUrls,
            },
            trend: "new",
            updatedAt: now,
          });
        }
      });

      next = next.sort((a, b) => b.updatedAt - a.updatedAt);
      await persistListino(next);
      setListinoVoci(next);
      setBozzaImportRows(null);
      setBozzaSourcePreventivo(null);
      window.alert("Import completato");
    } catch (err) {
      console.error("Errore import listino (persistListino):", err);
      setError("Errore durante import nel listino.");
    } finally {
      setSaving(false);
    }
  };

  const openDettaglio = (p: Preventivo) => {
    setSelectedId(p.id);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft(JSON.parse(JSON.stringify(selected)));
    setDraftPdfFile(null);
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
  };

  const removeDraftRiga = (id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, righe: prev.righe.filter((r) => r.id !== id) };
    });
  };

  const addDraftRiga = () => {
    const prezzo = Number(String(editPrezzo).replace(",", "."));
    if (!editDesc.trim() || !Number.isFinite(prezzo) || prezzo < 0) return;
    const riga: PreventivoRiga = {
      id: generaId(),
      descrizione: editDesc.trim().toUpperCase(),
      unita: editUnita,
      prezzoUnitario: prezzo,
      note: editNote.trim() || undefined,
    };
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, righe: [...prev.righe, riga] };
    });
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
  };

  const salvaModifiche = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);
    try {
      let pdfUrl = draft.pdfUrl;
      let pdfStoragePath = draft.pdfStoragePath;

      if (draftPdfFile) {
        const path = draft.pdfStoragePath || `preventivi/${draft.id}.pdf`;
        const r = ref(storage, path);
        await uploadBytes(r, draftPdfFile, { contentType: "application/pdf" });
        pdfUrl = await getDownloadURL(r);
        pdfStoragePath = path;
      }

      const updated: Preventivo = {
        ...draft,
        pdfUrl,
        pdfStoragePath,
        updatedAt: Date.now(),
      };

      const next = preventivi
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      await persistPreventivi(next);
      setPreventivi(next);
      setEditing(false);
      setDraft(null);
      setDraftPdfFile(null);
    } catch (err) {
      console.error("Errore aggiornamento preventivo (persistPreventivi):", err);
      setError("Errore aggiornamento preventivo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="acq-list-empty">Caricamento preventivi...</div>;

  return (
    <div className="acq-prev-shell">
      {error && <div className="acq-list-error">{error}</div>}

      <div className="acq-prev-topbar">
        <h2>Registro Preventivi</h2>
        <button
          type="button"
          className="acq-btn acq-btn--primary"
          onClick={() => setShowNew((v) => !v)}
        >
          {showNew ? "Chiudi" : "Carica preventivo"}
        </button>
      </div>

      {bozzaImportRows && (
        <div className="acq-prev-card acq-prev-card--draft">
          <h3>Bozza import (da verificare)</h3>
          {bozzaSourcePreventivo && (
            <p className="acq-prev-draft-meta">
              Fornitore: <strong>{bozzaSourcePreventivo.fornitoreNome}</strong> - Preventivo n.{" "}
              <strong>{bozzaSourcePreventivo.numeroPreventivo}</strong> del {bozzaSourcePreventivo.dataPreventivo}
            </p>
          )}
          {!bozzaSourcePreventivo && (
            <p className="acq-prev-draft-meta">
              Fonte bozza: <span className="acq-pill is-warn">MANUALE</span>
            </p>
          )}
          <div className="acq-prev-table-wrap">
            <table className="acq-prev-table">
              <thead>
                <tr>
                  <th>Fornitore</th>
                  <th>Articolo</th>
                  <th>Codice</th>
                  <th>Unita</th>
                  <th>Valuta</th>
                  <th>Prezzo</th>
                  <th>Trend</th>
                  <th>Prezzo prec.</th>
                  <th>Fonte</th>
                </tr>
              </thead>
              <tbody>
                {bozzaImportRows.map((r) => (
                  <tr key={r.id} className={r.daVerificare ? "acq-prev-draft-row" : ""}>
                    <td>{r.fornitoreNome}</td>
                    <td>
                      <input className="acq-prev-table-input" value={r.articoloCanonico} onChange={(e) => updateBozzaRow(r.id, { articoloCanonico: e.target.value })} />
                    </td>
                    <td>
                      <input className="acq-prev-table-input" value={r.codiceArticolo || ""} onChange={(e) => updateBozzaRow(r.id, { codiceArticolo: e.target.value })} />
                    </td>
                    <td>
                      <input className="acq-prev-table-input" value={r.unita} onChange={(e) => updateBozzaRow(r.id, { unita: e.target.value })} />
                    </td>
                    <td>
                      <select className="acq-prev-table-input" value={r.valuta} onChange={(e) => updateBozzaRow(r.id, { valuta: e.target.value as Valuta })}>
                        <option value="CHF">CHF</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </td>
                    <td>
                      <input className="acq-prev-table-input" type="number" min="0" step="0.01" value={r.prezzoNuovo} onChange={(e) => updateBozzaRow(r.id, { prezzoNuovo: Number(e.target.value) || 0 })} />
                    </td>
                    <td>
                      <span className={`acq-pill ${r.trend === "down" ? "is-ok" : r.trend === "up" ? "is-danger" : "is-warn"}`}>{trendLabelIt(r.trend)}</span>
                    </td>
                    <td>{r.prezzoPrecedente !== undefined ? r.prezzoPrecedente.toFixed(2) : "-"}</td>
                    <td>
                      {r.fonte.numeroPreventivo === "MANUALE" ? <span className="acq-pill is-warn">MANUALE</span> : `N. ${r.fonte.numeroPreventivo} del ${r.fonte.dataPreventivo}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="acq-prev-actions">
            <button type="button" className="acq-btn" onClick={annullaBozzaImport}>Annulla</button>
            <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={confermaImportBozza}>
              {saving ? "Import in corso..." : "Conferma import"}
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <div className="acq-prev-card">
          <h3>Nuovo preventivo</h3>
          <div className="acq-ia-box">
            <div className="acq-ia-box-head">
              <h4>Estrazione IA (PDF/FOTO)</h4>
              <button
                type="button"
                className="acq-btn"
                disabled={iaLoading || (!iaPdfFile && iaImageFiles.length === 0)}
                onClick={runEstrazioneIA}
              >
                {iaLoading ? "Estrazione..." : "Esegui estrazione IA"}
              </button>
            </div>
            <div className="acq-ia-input-grid">
              <label className="acq-prev-field">
                <span>Seleziona PDF</span>
                <input type="file" accept="application/pdf" onChange={onIaPdfSelected} />
                {iaPdfFile && <small>{iaPdfFile.name}</small>}
              </label>
              <label className="acq-prev-field">
                <span>Seleziona FOTO (max 10)</span>
                <input type="file" accept="image/*" multiple onChange={onIaImagesSelected} />
                {iaImageFiles.length > 0 && <small>{iaImageFiles.length} file selezionati</small>}
              </label>
            </div>
            {iaError && <div className="acq-list-error">{iaError}</div>}
            {iaPreview && (
              <div className="acq-ia-preview">
                <p className="acq-prev-draft-meta">
                  Documento: <strong>{iaPreview.document.number || "-"}</strong> - Data:{" "}
                  <strong>{iaPreview.document.date || "-"}</strong> - Fornitore:{" "}
                  <strong>{iaPreview.supplier.name || "-"}</strong>
                </p>
                {iaPreview.warnings.length > 0 && (
                  <div className="acq-ia-warnings">
                    {iaPreview.warnings.map((w, idx) => (
                      <span key={`${w.code}-${idx}`} className={`acq-pill ${w.severity === "error" ? "is-danger" : "is-warn"}`}>
                        {w.code}
                      </span>
                    ))}
                  </div>
                )}
                                <div className="acq-prev-table-wrap">
                  <table className="acq-prev-table">
                    <thead>
                      <tr>
                        <th>Descrizione</th>
                        <th>Unita</th>
                        <th>Prezzo</th>
                        <th>Valuta</th>
                        <th>Conf.</th>
                        <th>Match</th>
                        <th>Variazione</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {iaRowsAnalysis.length === 0 ? (
                        <tr><td colSpan={8}>Nessuna riga estratta.</td></tr>
                      ) : (
                        iaRowsAnalysis.map((row) => (
                          <tr key={row.key}>
                            <td>{row.item.description || "-"}</td>
                            <td>{row.item.uom || "-"}</td>
                            <td>{row.item.unitPrice !== null ? row.item.unitPrice.toFixed(2) : "-"}</td>
                            <td>{row.item.currency || "-"}</td>
                            <td>{Number(row.item.confidence || 0).toFixed(2)}</td>
                            <td>
                              {row.matchType === "CODE" && <span className="acq-pill is-ok">GIA ESISTE (codice)</span>}
                              {row.matchType === "DESC" && <span className="acq-pill is-ok">GIA ESISTE (descrizione)</span>}
                              {row.matchType === "NONE" && <span className="acq-pill">NUOVO</span>}
                            </td>
                            <td>
                              {row.compare === "UP" && (
                                <div className="acq-ia-compare acq-ia-compare--up">
                                  <span className="acq-pill is-danger">+{row.delta?.toFixed(2)}</span>
                                  <small>{row.compareMessage}</small>
                                </div>
                              )}
                              {row.compare === "DOWN" && (
                                <div className="acq-ia-compare acq-ia-compare--down">
                                  <span className="acq-pill is-ok">{row.delta?.toFixed(2)}</span>
                                  <small>{row.compareMessage}</small>
                                </div>
                              )}
                              {row.compare === "SAME" && (
                                <div className="acq-ia-compare">
                                  <span className="acq-pill">= 0.00</span>
                                  <small>{row.compareMessage}</small>
                                </div>
                              )}
                              {row.compare === "NONE" && <span className="mdo-table-muted">-</span>}
                            </td>
                            <td>
                              <div className="acq-prev-list-actions">
                                <button
                                  type="button"
                                  className="acq-btn acq-btn--small"
                                  disabled={!row.refData}
                                  onClick={() => void openRefPreventivo(row)}
                                  title={row.refData ? "Apri PDF preventivo di riferimento" : "Nessun riferimento disponibile"}
                                >
                                  Vedi preventivo
                                </button>
                                <button
                                  type="button"
                                  className="acq-btn acq-btn--small"
                                  onClick={() => void openIADocument()}
                                  disabled={!iaUploadedRefs.pdfStoragePath && iaUploadedRefs.imageStoragePaths.length === 0}
                                  title="Apri documento usato dall'estrazione IA"
                                >
                                  Vedi documento IA
                                </button>
                                {iaUploadedRefs.imageStoragePaths.length > 1 && (
                                  <button
                                    type="button"
                                    className="acq-btn acq-btn--small"
                                    onClick={() => void openAllIADocuments()}
                                  >
                                    Apri tutte foto
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="acq-prev-actions">
                  <button type="button" className="acq-btn" onClick={prefillBozzaListinoFromIA}>
                    Prefill bozza listino
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="acq-prev-form-grid">
            <label className="acq-prev-field">
              <span>Fornitore</span>
              <select value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)}>
                <option value="">Seleziona fornitore</option>
                {fornitori.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </label>
            <label className="acq-prev-field">
              <span>N. preventivo</span>
              <input
                type="text"
                value={numeroPreventivo}
                onChange={(e) => setNumeroPreventivo(e.target.value)}
              />
            </label>
            <label className="acq-prev-field">
              <span>Data preventivo</span>
              <input
                type="text"
                placeholder="gg mm aaaa"
                value={dataPreventivo}
                onChange={(e) => setDataPreventivo(e.target.value)}
              />
            </label>
            <label className="acq-prev-field">
              <span>PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="acq-prev-righe-box">
            <h4>Righe prezzo</h4>
            <div className="acq-prev-riga-insert">
              <input
                type="text"
                placeholder="Descrizione"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <input
                type="text"
                placeholder="Unita"
                value={newUnita}
                onChange={(e) => setNewUnita(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Prezzo unitario"
                value={newPrezzo}
                onChange={(e) => setNewPrezzo(e.target.value)}
              />
              <input
                type="text"
                placeholder="Note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button type="button" className="acq-btn" onClick={addNewRiga}>Aggiungi riga</button>
            </div>
            <div className="acq-prev-table-wrap">
              <table className="acq-prev-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Unita</th>
                    <th>Prezzo unitario</th>
                    <th>Note</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {nuoveRighe.length === 0 ? (
                    <tr><td colSpan={5}>Nessuna riga aggiunta.</td></tr>
                  ) : (
                    nuoveRighe.map((r) => (
                      <tr key={r.id}>
                        <td>{r.descrizione}</td>
                        <td>{r.unita || "-"}</td>
                        <td>{Number(r.prezzoUnitario || 0).toFixed(2)}</td>
                        <td>{r.note || "-"}</td>
                        <td>
                          <div className="acq-prev-row-actions">
                            <button type="button" className="acq-btn" onClick={() => apriModificaNewRiga(r)}>Modifica</button>
                            <button type="button" className="acq-btn acq-btn--danger" onClick={() => removeNewRiga(r.id)}>Elimina</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="acq-prev-actions">
            <button type="button" className="acq-btn" onClick={() => { setShowNew(false); resetNuovoForm(); }}>Annulla</button>
            <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={salvaNuovoPreventivo}>
              {saving ? "Salvataggio..." : "Salva preventivo"}
            </button>
          </div>

          {editingNewRigaId && (
            <div className="acq-modal-backdrop" role="dialog" aria-modal="true" aria-label="Modifica riga preventivo">
              <div className="acq-modal-card">
                <h4>Modifica riga</h4>
                <div className="acq-modal-grid">
                  <label className="acq-prev-field">
                    <span>Descrizione</span>
                    <input
                      type="text"
                      value={editingNewRigaDesc}
                      onChange={(e) => setEditingNewRigaDesc(e.target.value)}
                    />
                  </label>
                  <label className="acq-prev-field">
                    <span>Unita</span>
                    <select
                      value={editingNewRigaUnitaSelected}
                      onChange={(e) => setEditingNewRigaUnitaSelected(e.target.value as (typeof UNITA_OPTIONS)[number])}
                    >
                      {UNITA_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {editingNewRigaUnitaSelected === "ALTRO" && (
                      <input
                        type="text"
                        value={editingNewRigaUnitaCustom}
                        onChange={(e) => setEditingNewRigaUnitaCustom(e.target.value)}
                placeholder="Unita personalizzata"
                      />
                    )}
                  </label>
                  <label className="acq-prev-field">
                    <span>Prezzo unitario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingNewRigaPrezzo}
                      onChange={(e) => setEditingNewRigaPrezzo(e.target.value)}
                    />
                  </label>
                  <label className="acq-prev-field">
                    <span>Note</span>
                    <input
                      type="text"
                      value={editingNewRigaNote}
                      onChange={(e) => setEditingNewRigaNote(e.target.value)}
                    />
                  </label>
                </div>
                {editingNewRigaError && <div className="acq-list-error">{editingNewRigaError}</div>}
                <div className="acq-prev-actions">
                  <button type="button" className="acq-btn" onClick={annullaModificaNewRiga}>Annulla</button>
                  <button type="button" className="acq-btn acq-btn--primary" onClick={salvaModificaNewRiga}>Salva modifica</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="acq-prev-card">
        <div className="acq-prev-groups-head">
          <h3>Elenco preventivi</h3>
          <div className="acq-prev-groups-tools">
            <button
              type="button"
              className="acq-btn"
              onClick={() =>
                setOpenGroupKeys((prev) => {
                  const next: Record<string, boolean> = { ...prev };
                  groupedPreventivi.forEach((g) => { next[g.key] = true; });
                  return next;
                })
              }
            >
              Apri tutti
            </button>
            <button
              type="button"
              className="acq-btn"
              onClick={() =>
                setOpenGroupKeys((prev) => {
                  const next: Record<string, boolean> = { ...prev };
                  groupedPreventivi.forEach((g) => { next[g.key] = false; });
                  return next;
                })
              }
            >
              Chiudi tutti
            </button>
          </div>
        </div>
        <div className="acq-prev-groups-filters">
          <label className="acq-prev-field">
            <span>Fornitore</span>
            <select value={fornitoreListFilter} onChange={(e) => setFornitoreListFilter(e.target.value)}>
              <option value="">Tutti</option>
              {fornitoriPreventiviOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </label>
          <label className="acq-prev-field">
            <span>Cerca</span>
            <input
              type="text"
              value={searchPreventivi}
              onChange={(e) => setSearchPreventivi(e.target.value)}
              placeholder="Numero, data, fornitore"
            />
          </label>
          <label className="acq-prev-filter-check">
            <input
              type="checkbox"
              checked={soloNonImportati}
              onChange={(e) => setSoloNonImportati(e.target.checked)}
            />
            {LABELS_IT.menu.onlyNotImported}
          </label>
          <button
            type="button"
            className="acq-btn"
            onClick={() => {
              setFornitoreListFilter("");
              setSearchPreventivi("");
              setSoloNonImportati(false);
            }}
          >
            {LABELS_IT.menu.resetFilters}
          </button>
        </div>
        {groupedPreventivi.length === 0 ? (
          <div className="acq-prev-empty">
            <div>{preventivi.length === 0 ? "Nessun preventivo registrato." : "Nessun preventivo con questi filtri."}</div>
            {preventivi.length > 0 && (
              <button
                type="button"
                className="acq-btn"
                onClick={() => {
                  setFornitoreListFilter("");
                  setSearchPreventivi("");
                  setSoloNonImportati(false);
                }}
              >
                {LABELS_IT.menu.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="acq-prev-groups">
            {groupedPreventivi.map((group) => {
              const nonImportati = group.items.filter((p) => getImportStatus(p).className === "not").length;
              const groupOpen = openGroupKeys[group.key] !== false;
              return (
                <section key={group.key} className="acq-prev-group">
                  <button
                    type="button"
                    className="acq-prev-group-summary"
                    onClick={() => setOpenGroupKeys((prev) => ({ ...prev, [group.key]: !groupOpen }))}
                  >
                    <span className={`acq-prev-group-caret${groupOpen ? " is-open" : ""}`}>{groupOpen ? "▼" : "▶"}</span>
                    <span className="acq-prev-group-title">{group.fornitoreNome}</span>
                    <span className="acq-prev-group-counters">
                      <span>Preventivi: {group.items.length}</span>
                      <span>Non importati: {nonImportati}</span>
                    </span>
                  </button>
                  {groupOpen && (
                  <div className="acq-prev-table-wrap">
                    <table className="acq-prev-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>N. preventivo</th>
                          <th># righe</th>
                          <th>Stato import</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p) => {
                          const status = getImportStatus(p);
                          return (
                            <tr key={p.id}>
                              <td>{p.dataPreventivo}</td>
                              <td>{p.numeroPreventivo}</td>
                              <td>{Array.isArray(p.righe) ? p.righe.length : 0}</td>
                              <td>
                                <div className="acq-import-status-wrap">
                                  <button
                                    type="button"
                                    className={`acq-import-status acq-import-status--${status.className}${status.className === "partial" ? " is-clickable" : ""}`}
                                    disabled={status.className !== "partial"}
                                    onClick={() => {
                                      if (status.className === "partial") setMissingRowsForPreventivoId(p.id);
                                    }}
                                  >
                                    {status.label}
                                  </button>
                                  <span className="acq-import-ratio">{status.imported}/{status.total}</span>
                                </div>
                              </td>
                              <td>
                                <div className="acq-prev-list-actions">
                                  {hasDocumentForPreventivo(p) && (
                                    <button type="button" className="acq-btn" onClick={() => void openPreventivoDocumento(p)}>
                                      {LABELS_IT.menu.openDocument}
                                    </button>
                                  )}
                                  <button type="button" className="acq-btn acq-btn--primary" onClick={() => startImportListino(p)}>
                                    {LABELS_IT.menu.import}
                                  </button>
                                  <button type="button" className="acq-btn" onClick={() => openDettaglio(p)}>
                                    {LABELS_IT.menu.open}
                                  </button>
                                  <div className="acq-kebab" data-menu-root="preventivi">
                                    <button
                                      type="button"
                                      className="acq-btn acq-kebab-trigger"
                                      aria-label="Altre azioni"
                                      onClick={(e) => {
                                        const key = `preventivo:${p.id}`;
                                        if (openMenuKey === key) {
                                          setOpenMenuKey(null);
                                          setOpenMenuPosition(null);
                                          return;
                                        }
                                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                        const menuWidth = 190;
                                        const menuHeight = 120;
                                        const left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
                                        const openUp = rect.bottom + menuHeight > window.innerHeight - 8;
                                        const top = openUp ? Math.max(8, rect.top - 8) : rect.bottom + 8;
                                        setOpenMenuKey(key);
                                        setOpenMenuPosition({ top, left, openUp });
                                      }}
                                    >
                                      {LABELS_IT.menu.trigger}
                                    </button>
                                    {openMenuKey === `preventivo:${p.id}` && openMenuPosition && (
                                      <div
                                        className={`acq-kebab-menu acq-kebab-menu--fixed${openMenuPosition.openUp ? " is-up" : ""}`}
                                        style={{ top: `${openMenuPosition.top}px`, left: `${openMenuPosition.left}px` }}
                                      >
                                        <button
                                          type="button"
                                          className="acq-kebab-item"
                                          onClick={() => {
                                            openModificaFromList(p);
                                            setOpenMenuKey(null);
                                            setOpenMenuPosition(null);
                                          }}
                                        >
                                          {LABELS_IT.menu.edit}
                                        </button>
                                        <button
                                          type="button"
                                          className="acq-kebab-item acq-kebab-item--danger"
                                          onClick={async () => {
                                            await eliminaPreventivo(p);
                                            setOpenMenuKey(null);
                                            setOpenMenuPosition(null);
                                          }}
                                        >
                                          {LABELS_IT.menu.delete}
                                        </button>
                                      </div>
                                    )}
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
                </section>
              );
            })}
          </div>
        )}
      </div>

      {missingRowsForPreventivoId && (
        <div className="acq-modal-backdrop" role="dialog" aria-modal="true" aria-label="Dettaglio righe non importate">
          <div className="acq-modal-card acq-missing-modal">
            {(() => {
              const selectedPreventivo = preventivi.find((p) => p.id === missingRowsForPreventivoId) || null;
              const info = selectedPreventivo ? (missingRowsByPreventivoId.get(selectedPreventivo.id) || { rows: [], fallback: true }) : { rows: [], fallback: true };
              return (
                <>
                  <h4>Righe non importate</h4>
                  <p className="acq-prev-draft-meta">
                    {selectedPreventivo
                      ? `${selectedPreventivo.fornitoreNome} - N. ${selectedPreventivo.numeroPreventivo} - ${selectedPreventivo.dataPreventivo}`
                      : "Preventivo non disponibile"}
                  </p>
                  {info.rows.length > 0 ? (
                    <div className="acq-prev-table-wrap">
                      <table className="acq-prev-table">
                        <thead>
                          <tr>
                            <th>Descrizione</th>
                            <th>Unita</th>
                            <th>Prezzo unitario</th>
                            <th>Nota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {info.rows.map((r) => {
                            const prezzo = Number(r.prezzoUnitario || 0);
                            const prezzoLabel = Number.isFinite(prezzo) && prezzo > 0 ? prezzo.toFixed(2) : "prezzo mancante/0";
                            return (
                              <tr key={r.id}>
                                <td>{r.descrizione || "-"}</td>
                                <td>{r.unita || "-"}</td>
                                <td>{prezzoLabel}</td>
                                <td>{r.note || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="acq-prev-empty">
                      <span>1 riga non importata (dettagli non determinabili).</span>
                    </div>
                  )}
                  {info.fallback && (
                    <div className="acq-list-error">Riconoscimento righe parziale: alcuni dettagli potrebbero non essere determinabili.</div>
                  )}
                  <div className="acq-prev-actions">
                    <button type="button" className="acq-btn" onClick={() => setMissingRowsForPreventivoId(null)}>Chiudi</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {selected && (
        <div className="acq-prev-card">
          <div className="acq-prev-detail-head">
            <div>
              <h3>Dettaglio preventivo</h3>
              <p>{selected.fornitoreNome} - {selected.numeroPreventivo} - {selected.dataPreventivo}</p>
            </div>
            <div className="acq-prev-list-actions">
              {hasDocumentForPreventivo(selected) && (
                <button
                  type="button"
                  className="acq-btn"
                  onClick={() => void openPreventivoDocumento(selected)}
                >
                  Apri documento
                </button>
              )}
              {!editing ? (
                <button type="button" className="acq-btn acq-btn--primary" onClick={startEdit}>Modifica</button>
              ) : (
                <>
                  <button type="button" className="acq-btn" onClick={cancelEdit}>Annulla</button>
                  <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={salvaModifiche}>Salva</button>
                </>
              )}
            </div>
          </div>

          {!editing || !draft ? (
            <div className="acq-prev-table-wrap">
              <table className="acq-prev-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Unita</th>
                    <th>Prezzo unitario</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.righe.length === 0 ? (
                    <tr><td colSpan={4}>Nessuna riga.</td></tr>
                  ) : (
                    selected.righe.map((r) => (
                      <tr key={r.id}>
                        <td>{r.descrizione}</td>
                        <td>{r.unita}</td>
                        <td>{r.prezzoUnitario}</td>
                        <td>{r.note || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="acq-prev-form-grid">
                <label className="acq-prev-field">
                  <span>Fornitore</span>
                  <select
                    value={draft.fornitoreId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const nome = fornitoreNomeById(id);
                      setDraft((prev) => prev ? { ...prev, fornitoreId: id, fornitoreNome: nome } : prev);
                    }}
                  >
                    <option value="">Seleziona fornitore</option>
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="acq-prev-field">
                  <span>N. preventivo</span>
                  <input
                    type="text"
                    value={draft.numeroPreventivo}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, numeroPreventivo: e.target.value } : prev)}
                  />
                </label>
                <label className="acq-prev-field">
                  <span>Data preventivo</span>
                  <input
                    type="text"
                    value={draft.dataPreventivo}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, dataPreventivo: e.target.value } : prev)}
                  />
                </label>
                <label className="acq-prev-field">
                  <span>Sostituisci PDF</span>
                  <input type="file" accept="application/pdf" onChange={(e) => setDraftPdfFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="acq-prev-righe-box">
                <h4>Righe prezzo</h4>
                <div className="acq-prev-riga-insert">
                  <input type="text" placeholder="Descrizione" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  <input type="text" placeholder="Unita" value={editUnita} onChange={(e) => setEditUnita(e.target.value)} />
                  <input type="number" min="0" step="0.01" placeholder="Prezzo unitario" value={editPrezzo} onChange={(e) => setEditPrezzo(e.target.value)} />
                  <input type="text" placeholder="Note" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                  <button type="button" className="acq-btn" onClick={addDraftRiga}>Aggiungi riga</button>
                </div>
                <div className="acq-prev-table-wrap">
                  <table className="acq-prev-table">
                    <thead>
                      <tr>
                        <th>Descrizione</th>
                        <th>Unita</th>
                        <th>Prezzo unitario</th>
                        <th>Note</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.righe.length === 0 ? (
                        <tr><td colSpan={5}>Nessuna riga.</td></tr>
                      ) : (
                        draft.righe.map((r) => (
                          <tr key={r.id}>
                            <td>{r.descrizione}</td>
                            <td>{r.unita}</td>
                            <td>{r.prezzoUnitario}</td>
                            <td>{r.note || "-"}</td>
                            <td>
                              <button type="button" className="acq-btn acq-btn--danger" onClick={() => removeDraftRiga(r.id)}>Elimina</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ListinoPrezziView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voci, setVoci] = useState<ListinoVoce[]>([]);
  const [fornitoreFilter, setFornitoreFilter] = useState("");
  const [valutaFilter, setValutaFilter] = useState<"" | Valuta>("");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuPosition, setOpenMenuPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  const apriVoceListino = async (v: ListinoVoce) => {
    const source = {
      pdfUrl: v.fonteAttuale.pdfUrl,
      pdfStoragePath: v.fonteAttuale.pdfStoragePath,
      imageUrls: asStringArray((v as any)?.fonteAttuale?.imageUrls),
      imageStoragePaths: asStringArray((v as any)?.fonteAttuale?.imageStoragePaths),
    };
    try {
      const opened = await openDocumentRef(source);
      if (!opened) {
        window.alert("Nessun documento disponibile");
      }
    } catch (err) {
      console.error("Errore apertura documento listino:", err);
      window.alert("Nessun documento disponibile");
    }
  };

  const persistListino = async (next: ListinoVoce[]) => {
    const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
    const sanitized = sanitizeUndefinedToNull({ voci: next });
    await setDoc(refDoc, sanitized, { merge: true });
  };

  const eliminaVoceListino = async (voce: ListinoVoce) => {
    const ok = window.confirm("Eliminare questa voce dal listino prezzi?");
    if (!ok) return;
    try {
      const next = voci.filter((x) => x.id !== voce.id);
      await persistListino(next);
      setVoci(next);
    } catch (err) {
      console.error("Errore eliminazione voce listino:", err);
      setError("Errore durante eliminazione voce listino.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
        const snap = await getDoc(refDoc);
        const list = snap.exists() ? ((snap.data()?.voci as ListinoVoce[]) || []) : [];
        const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        setVoci(sorted);
      } catch (err) {
        console.error("Errore caricamento listino:", err);
        setError("Errore caricamento listino prezzi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const formatDataIt = (ts: number) => {
    const d = new Date(ts || 0);
    if (Number.isNaN(d.getTime())) return "00 00 0000";
    const gg = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const aaaa = String(d.getFullYear());
    return `${gg} ${mm} ${aaaa}`;
  };

  const renderSafeText = (value: unknown, fallback = "-") => {
    const raw = String(value ?? "").trim();
    if (!raw) return fallback;
    return raw
      .replace(/â€”/g, "-")
      .replace(/Â€/g, "EUR")
      .replace(/€/g, "EUR")
      .replace(/Â°/g, ".")
      .replace(/Â·|·/g, " - ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const fornitori = useMemo(() => {
    const map = new Map<string, string>();
    voci.forEach((v) => {
      if (!map.has(v.fornitoreId)) map.set(v.fornitoreId, v.fornitoreNome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [voci]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voci.filter((v) => {
      if (fornitoreFilter && v.fornitoreId !== fornitoreFilter) return false;
      if (valutaFilter && v.valuta !== valutaFilter) return false;
      if (!q) return true;
      return (
        v.articoloCanonico.toLowerCase().includes(q) ||
        String(v.codiceArticolo || "").toLowerCase().includes(q)
      );
    });
  }, [voci, fornitoreFilter, valutaFilter, search]);

  useEffect(() => {
    const closeMenu = () => {
      setOpenMenuId(null);
      setOpenMenuPosition(null);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!openMenuId) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-menu-root="listino"]')) return;
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

  if (loading) return <div className="acq-list-empty">Caricamento listino prezzi...</div>;

  return (
    <div className="acq-listino-shell" ref={menuRootRef}>
      {error && <div className="acq-list-error">{error}</div>}
      <div className="acq-listino-filters">
        <label className="acq-prev-field">
          <span>Fornitore</span>
          <select value={fornitoreFilter} onChange={(e) => setFornitoreFilter(e.target.value)}>
            <option value="">Tutti</option>
            {fornitori.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </label>
        <label className="acq-prev-field">
          <span>Valuta</span>
          <select value={valutaFilter} onChange={(e) => setValutaFilter(e.target.value as "" | Valuta)}>
            <option value="">Tutte</option>
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className="acq-prev-field">
          <span>Cerca</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Articolo o codice" />
        </label>
      </div>

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
            {filtered.length === 0 ? (
              <tr><td colSpan={9}>Listino vuoto.</td></tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td>{renderSafeText(v.fornitoreNome)}</td>
                  <td>{renderSafeText(v.articoloCanonico)}</td>
                  <td>{renderSafeText(v.unita)}</td>
                  <td>{renderSafeText(v.valuta)}</td>
                  <td>{v.prezzoAttuale.toFixed(2)}</td>
                  <td>
                    <span className={`acq-pill ${v.trend === "down" ? "is-ok" : v.trend === "up" ? "is-danger" : "is-warn"}`}>
                      {trendLabelIt(v.trend)}
                    </span>
                  </td>
                  <td>{`N. ${renderSafeText(v.fonteAttuale.numeroPreventivo)}`}</td>
                  <td>{renderSafeText(v.fonteAttuale.dataPreventivo || formatDataIt(v.updatedAt))}</td>
                  <td>
                    <div className="acq-prev-list-actions">
                      <button
                        type="button"
                        className="acq-btn acq-btn--primary"
                        disabled={!hasAnyDocumentRef({
                          pdfUrl: v.fonteAttuale.pdfUrl,
                          pdfStoragePath: v.fonteAttuale.pdfStoragePath,
                          imageUrls: asStringArray((v as any)?.fonteAttuale?.imageUrls),
                          imageStoragePaths: asStringArray((v as any)?.fonteAttuale?.imageStoragePaths),
                        })}
                        onClick={() => void apriVoceListino(v)}
                        title={
                          !hasAnyDocumentRef({
                            pdfUrl: v.fonteAttuale.pdfUrl,
                            pdfStoragePath: v.fonteAttuale.pdfStoragePath,
                            imageUrls: asStringArray((v as any)?.fonteAttuale?.imageUrls),
                            imageStoragePaths: asStringArray((v as any)?.fonteAttuale?.imageStoragePaths),
                          })
                            ? "Documento non disponibile"
                            : "Apri documento"
                        }
                      >
                        {LABELS_IT.menu.openDocument.toUpperCase()}
                      </button>
                      <div className="acq-kebab" data-menu-root="listino">
                        <button
                          type="button"
                          className="acq-btn acq-kebab-trigger"
                          aria-label="Altre azioni"
                          onClick={(e) => {
                            if (openMenuId === v.id) {
                              setOpenMenuId(null);
                              setOpenMenuPosition(null);
                              return;
                            }
                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                            const menuWidth = 190;
                            const menuHeight = 120;
                            const left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.right - menuWidth));
                            const openUp = rect.bottom + menuHeight > window.innerHeight - 8;
                            const top = openUp ? Math.max(8, rect.top - 8) : rect.bottom + 8;
                            setOpenMenuId(v.id);
                            setOpenMenuPosition({ top, left, openUp });
                          }}
                        >
                          {LABELS_IT.menu.trigger}
                        </button>
                        {openMenuId === v.id && openMenuPosition && (
                          <div
                            className={`acq-kebab-menu acq-kebab-menu--fixed${openMenuPosition.openUp ? " is-up" : ""}`}
                            style={{ top: `${openMenuPosition.top}px`, left: `${openMenuPosition.left}px` }}
                          >
                            <button
                              type="button"
                              className="acq-kebab-item"
                              disabled={!hasAnyDocumentRef({
                                pdfUrl: v.fonteAttuale.pdfUrl,
                                pdfStoragePath: v.fonteAttuale.pdfStoragePath,
                                imageUrls: asStringArray((v as any)?.fonteAttuale?.imageUrls),
                                imageStoragePaths: asStringArray((v as any)?.fonteAttuale?.imageStoragePaths),
                              })}
                              onClick={async () => {
                                await apriVoceListino(v);
                                setOpenMenuId(null);
                                setOpenMenuPosition(null);
                              }}
                            >
                              {LABELS_IT.menu.openDocument}
                            </button>
                            <button
                              type="button"
                              className="acq-kebab-item acq-kebab-item--danger"
                              onClick={async () => {
                                await eliminaVoceListino(v);
                                setOpenMenuId(null);
                                setOpenMenuPosition(null);
                              }}
                            >
                              {LABELS_IT.menu.delete}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DettaglioOrdineView(props: { ordineId: string; onBack: () => void }) {
  const { ordineId, onBack } = props;

  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [ordineOriginale, setOrdineOriginale] = useState<Ordine | null>(null);
  const [preventiviRef, setPreventiviRef] = useState<Preventivo[]>([]);
  const [listinoRef, setListinoRef] = useState<ListinoVoce[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("pz");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteByMaterialeId, setNoteByMaterialeId] = useState<Record<string, string>>({});
  const [ordineNote, setOrdineNote] = useState("");
  const [detailSuggestOpen, setDetailSuggestOpen] = useState(false);
  const [selectedDetailListino, setSelectedDetailListino] = useState<ListinoVoce | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!ordineId) return;
      const raw = await getItemSync("@ordini");
      const arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
      const found = arr.find((o) => o.id === ordineId);
      if (!found) return;
      const a = JSON.parse(JSON.stringify(found));
      const b = JSON.parse(JSON.stringify(found));
      if (a.arrivato === undefined) a.arrivato = false;
      if (b.arrivato === undefined) b.arrivato = false;
      setOrdine(a);
      setOrdineOriginale(b);
      const noteMap: Record<string, string> = {};
      (a.materiali || []).forEach((m: MaterialeOrdine) => {
        const noteValue = String((m as any)?.note || "").trim();
        if (noteValue) noteMap[m.id] = noteValue;
      });
      setNoteByMaterialeId(noteMap);
      setOrdineNote(String((a as any)?.noteOrdine || "").trim());

      const [preventiviSnap, listinoSnap] = await Promise.all([
        getDoc(doc(db, "storage", PREVENTIVI_DOC_ID)),
        getDoc(doc(db, "storage", LISTINO_DOC_ID)),
      ]);
      setPreventiviRef(preventiviSnap.exists() ? ((preventiviSnap.data()?.preventivi as Preventivo[]) || []) : []);
      setListinoRef(listinoSnap.exists() ? ((listinoSnap.data()?.voci as ListinoVoce[]) || []) : []);
      setLoading(false);
    };
    void load();
  }, [ordineId]);

  const oggiDettaglio = () => {
    const n = new Date();
    const gg = String(n.getDate()).padStart(2, "0");
    const mm = String(n.getMonth() + 1).padStart(2, "0");
    const yy = n.getFullYear();
    return `${gg} ${mm} ${yy}`;
  };

  const materials = ordine ? [...ordine.materiali].sort((a, b) => (a.arrivato === b.arrivato ? 0 : a.arrivato ? 1 : -1)) : [];
  const detailSuggestList = useMemo(() => {
    const q = newDesc.trim().toLowerCase();
    if (!q || !ordine) return [];
    return listinoRef
      .filter((v) => String(v.fornitoreId || "").trim() === String(ordine.idFornitore || "").trim())
      .filter((v) => {
        const articolo = String(v.articoloCanonico || "").toLowerCase();
        const codice = String(v.codiceArticolo || "").toLowerCase();
        return articolo.includes(q) || codice.includes(q);
      })
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
      .slice(0, 8);
  }, [newDesc, ordine, listinoRef]);

  const readNumberFromAny = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const priceInfoByMaterialeId = useMemo(() => {
    const map = new Map<
      string,
      {
        prezzoUnitario: number;
        valuta: Valuta;
        unitaPrezzo: string;
        fonte: string;
        numeroPreventivo?: string;
        dataPreventivo?: string;
      } | null
    >();
    if (!ordine) return map;

    const fornitoreIdOrdine = String(ordine.idFornitore || "").trim();

    materials.forEach((m) => {
      const anyM = m as any;
      const manualCandidates = [anyM?.prezzoManuale, anyM?.prezzo, anyM?.prezzoUnitario, anyM?.costoUnitario];
      let manualPrice: number | null = null;
      for (const c of manualCandidates) {
        const parsed = readNumberFromAny(c);
        if (parsed !== null && parsed > 0) {
          manualPrice = parsed;
          break;
        }
      }
      if (manualPrice !== null) {
        const manualValRaw = String(anyM?.valuta || "").toUpperCase();
        const manualValuta: Valuta = manualValRaw === "EUR" ? "EUR" : "CHF";
        map.set(m.id, {
          prezzoUnitario: manualPrice,
          valuta: manualValuta,
          unitaPrezzo: String(m.unita || ""),
          fonte: "MANUALE",
          numeroPreventivo: "MANUALE",
          dataPreventivo: ordine.dataOrdine || oggiDettaglio(),
        });
        return;
      }

      const descNorm = normalizeDescrizione(m.descrizione);
      const unitaNorm = normalizeUnita(m.unita);

      let bestListino: ListinoVoce | null = null;
      for (const v of listinoRef) {
        if (fornitoreIdOrdine && String(v.fornitoreId || "").trim() !== fornitoreIdOrdine) continue;
        if (
          normalizeArticoloCanonico(v.articoloCanonico) === descNorm &&
          normalizeUnita(v.unita) === unitaNorm
        ) {
          if (!bestListino || Number(v.updatedAt || 0) > Number(bestListino.updatedAt || 0)) {
            bestListino = v;
          }
        }
      }
      if (bestListino) {
        map.set(m.id, {
          prezzoUnitario: Number(bestListino.prezzoAttuale || 0),
          valuta: bestListino.valuta,
          unitaPrezzo: String(bestListino.unita || m.unita || ""),
          fonte: `LISTINO ${bestListino.fonteAttuale.numeroPreventivo}`,
          numeroPreventivo: bestListino.fonteAttuale.numeroPreventivo,
          dataPreventivo: bestListino.fonteAttuale.dataPreventivo,
        });
        return;
      }

      let bestPreventivo: {
        prezzoUnitario: number;
        valuta: Valuta;
        unitaPrezzo: string;
        rank: number;
        numero: string;
        data: string;
      } | null = null;
      for (const p of preventiviRef) {
        if (fornitoreIdOrdine && String(p.fornitoreId || "").trim() !== fornitoreIdOrdine) continue;
        for (const r of p.righe || []) {
          if (
            normalizeDescrizione(r.descrizione) === descNorm &&
            normalizeUnita(r.unita) === unitaNorm
          ) {
            const rank = Number(p.updatedAt || p.createdAt || parseDataPreventivoToTs(p.dataPreventivo) || 0);
            const valuta = inferValuta({
              descrizione: r.descrizione,
              note: r.note,
              numeroPreventivo: p.numeroPreventivo,
            });
              const candidate = {
                prezzoUnitario: Number(r.prezzoUnitario || 0),
                valuta,
                unitaPrezzo: String(r.unita || m.unita || ""),
                rank,
                numero: p.numeroPreventivo,
                data: p.dataPreventivo,
              };
            if (!bestPreventivo || candidate.rank > bestPreventivo.rank) {
              bestPreventivo = candidate;
            }
          }
        }
      }
      if (bestPreventivo) {
        map.set(m.id, {
          prezzoUnitario: bestPreventivo.prezzoUnitario,
          valuta: bestPreventivo.valuta,
          unitaPrezzo: bestPreventivo.unitaPrezzo,
          fonte: `PREV ${bestPreventivo.numero}`,
          numeroPreventivo: bestPreventivo.numero,
          dataPreventivo: bestPreventivo.data,
        });
        return;
      }

      map.set(m.id, null);
    });

    return map;
  }, [materials, ordine, listinoRef, preventiviRef]);

  const riepilogoTotali = useMemo(() => {
    const totals: Record<Valuta, number> = { CHF: 0, EUR: 0 };
    let missing = 0;
    let udmDaVerificare = 0;
    materials.forEach((m) => {
      const info = priceInfoByMaterialeId.get(m.id);
      if (!info || !Number.isFinite(info.prezzoUnitario) || info.prezzoUnitario <= 0) {
        missing += 1;
        return;
      }
      const note = noteByMaterialeId[m.id] || String((m as any)?.note || "");
      const line = computeLineTotal({
        qty: m.quantita,
        unitPrice: info.prezzoUnitario,
        selectedUom: m.unita,
        priceUom: info.unitaPrezzo || m.unita,
        note,
      });
      if (line.status === "needs_factor") {
        udmDaVerificare += 1;
        return;
      }
      if (line.total !== null) {
        totals[info.valuta] += line.total;
      }
    });
    const usedValute = (["CHF", "EUR"] as Valuta[]).filter((v) => totals[v] > 0);
    return { totals, missing, udmDaVerificare, usedValute, mixed: usedValute.length > 1 };
  }, [materials, noteByMaterialeId, priceInfoByMaterialeId]);

  const handlePdfFornitoriDettaglio = async () => {
    if (!ordine) return;
    const rows = ordine.materiali.map((m) => ({
      descrizione: m.descrizione,
      quantita: String(m.quantita),
      unita: m.unita,
      note: String(noteByMaterialeId[m.id] ?? "").trim() || "-",
    }));
    if (ordineNote.trim()) {
      rows.push({ descrizione: "NOTE ORDINE", quantita: "", unita: "", note: ordineNote.trim() });
    }
    await generateSmartPDF({
      kind: "table",
      title: `FORNITORE ${ordine.nomeFornitore} - ORDINE ${ordine.dataOrdine}`,
      columns: ["descrizione", "quantita", "unita", "note"],
      rows,
    });
  };

  const handlePdfDirezioneDettaglio = async () => {
    if (!ordine) return;
    const rows: Array<Record<string, string>> = [];
    let missing = 0;
    let udmDaVerificare = 0;
    const totals: Record<Valuta, number> = { CHF: 0, EUR: 0 };

    ordine.materiali.forEach((m) => {
      const info = priceInfoByMaterialeId.get(m.id);
      const hasPriceInfo = !!info && Number.isFinite(info.prezzoUnitario) && info.prezzoUnitario > 0;
      const note = String(noteByMaterialeId[m.id] || "").trim() || "-";
      if (!hasPriceInfo) {
        missing += 1;
      }
      const line = hasPriceInfo
        ? computeLineTotal({
            qty: m.quantita,
            unitPrice: info.prezzoUnitario,
            selectedUom: m.unita,
            priceUom: info.unitaPrezzo || m.unita,
            note: noteByMaterialeId[m.id] || String((m as any)?.note || ""),
          })
        : { total: null as number | null, status: "ok" as const };
      if (hasPriceInfo && line.status === "needs_factor") {
        udmDaVerificare += 1;
      }
      const hasComputablePrice = hasPriceInfo && line.status !== "needs_factor" && line.total !== null;
      const valuta = hasPriceInfo ? info.valuta : null;
      if (hasComputablePrice && valuta) {
        totals[valuta] += line.total!;
      }
      const ref = info?.numeroPreventivo
        ? `N. ${info.numeroPreventivo}${info.dataPreventivo ? ` del ${info.dataPreventivo}` : ""}`
        : "-";

      rows.push({
        descrizione: m.descrizione,
        quantita: String(m.quantita),
        unita: m.unita,
        note,
        prezzoUnitario: hasPriceInfo ? `${info!.prezzoUnitario.toFixed(2)} ${valuta || "-"}` : "-",
        totaleRiga: hasComputablePrice ? `${line.total!.toFixed(2)} ${valuta || "-"}` : line.status === "needs_factor" ? "DA VERIFICARE UDM" : "-",
        preventivo: ref,
      });
    });

    const used = (["CHF", "EUR"] as Valuta[]).filter((v) => totals[v] > 0);
    if (used.length > 1) {
      rows.push({
        descrizione: "TOTALE CHF",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: `${totals.CHF.toFixed(2)} CHF`,
        preventivo: "",
      });
      rows.push({
        descrizione: "TOTALE EUR",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: `${totals.EUR.toFixed(2)} EUR`,
        preventivo: "",
      });
      rows.push({
        descrizione: "VALUTE",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: "MISTE",
        preventivo: "",
      });
    } else {
      const single = used[0];
      rows.push({
        descrizione: missing > 0 || udmDaVerificare > 0 ? "TOTALE PARZIALE" : "TOTALE ORDINE",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: single ? `${totals[single].toFixed(2)} ${single}` : "-",
        preventivo: "",
      });
    }
    rows.push({
      descrizione: "PREZZI MANCANTI",
      quantita: String(missing),
      unita: "",
      note: "",
      prezzoUnitario: "",
      totaleRiga: "",
      preventivo: "",
    });
    rows.push({
      descrizione: "UDM DA VERIFICARE",
      quantita: String(udmDaVerificare),
      unita: "",
      note: "",
      prezzoUnitario: "",
      totaleRiga: "",
      preventivo: "",
    });
    if (ordineNote.trim()) {
      rows.push({
        descrizione: "NOTE ORDINE",
        quantita: "",
        unita: "",
        note: ordineNote.trim(),
        prezzoUnitario: "",
        totaleRiga: "",
        preventivo: "",
      });
    }

    await generateSmartPDF({
      kind: "table",
      title: `DIREZIONE ${ordine.nomeFornitore} - ORDINE ${ordine.dataOrdine}`,
      columns: ["descrizione", "quantita", "unita", "note", "prezzoUnitario", "totaleRiga", "preventivo"],
      rows,
    });
  };

  const toggleArrivatoOrdine = async () => {
    if (!ordine) return;
    const nuovo = !ordine.arrivato;
    const updated: Ordine = {
      ...ordine,
      arrivato: nuovo,
      materiali: ordine.materiali.map((m) => ({ ...m, arrivato: nuovo, dataArrivo: nuovo ? oggiDettaglio() : "" })),
    };
    await salvaCompleto(updated);
  };

  const setField = (id: string, field: keyof MaterialeOrdine, value: any) => {
    setOrdine((prev) => {
      if (!prev) return prev;
      return { ...prev, materiali: prev.materiali.map((m) => (m.id === id ? { ...m, [field]: value } : m)) };
    });
  };

  const cambiaDescrizione = (id: string, v: string) => setField(id, "descrizione", v.toUpperCase());
  const cambiaQuantita = (id: string, v: string) => setField(id, "quantita", parseInt(v.replace(/\D/g, "").slice(0, 3)) || 0);
  const cambiaUnita = (id: string, v: string) => setField(id, "unita", v);
  const cambiaArrivato = (id: string, v: boolean) => setField(id, "arrivato", v);
  const cambiaData = (id: string, v: string) => setField(id, "dataArrivo", v);
  const cambiaNota = (id: string, v: string) => setNoteByMaterialeId((prev) => ({ ...prev, [id]: v }));

  const onDetailDescChange = (value: string) => {
    setNewDesc(value);
    setDetailSuggestOpen(true);
    if (
      selectedDetailListino &&
      normalizeArticoloCanonico(value) !== normalizeArticoloCanonico(selectedDetailListino.articoloCanonico)
    ) {
      setSelectedDetailListino(null);
    }
  };

  const selectDetailSuggestion = (voce: ListinoVoce) => {
    setNewDesc(voce.articoloCanonico);
    setNewUnit(String(voce.unita || "pz").toLowerCase());
    setSelectedDetailListino(voce);
    setDetailSuggestOpen(false);
  };

  const uploadFoto = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ordine) return;
    const target = ordine.materiali.find((m) => m.id === id);
    const old = target?.fotoStoragePath;
    if (old) await deleteMaterialImage(old);
    const { fotoUrl, fotoStoragePath } = await uploadMaterialImage(file, id);
    setField(id, "fotoUrl", fotoUrl);
    setField(id, "fotoStoragePath", fotoStoragePath);
    e.target.value = "";
  };

  const rimuoviFoto = async (id: string) => {
    const target = ordine?.materiali.find((m) => m.id === id);
    if (target?.fotoStoragePath) {
      await deleteMaterialImage(target.fotoStoragePath);
    }
    setField(id, "fotoUrl", null);
    setField(id, "fotoStoragePath", null);
  };

  const aggiornaInventario = async (oldO: Ordine, newO: Ordine) => {
    const raw = await getItemSync("@inventario");
    let inv: any[] = Array.isArray(raw) ? raw : [];

    const oldMap = new Map(oldO.materiali.map((m) => [m.id, m]));
    const newMap = new Map(newO.materiali.map((m) => [m.id, m]));
    const ids = new Set([...oldMap.keys(), ...newMap.keys()]);

    const applyDelta = (m: MaterialeOrdine, delta: number) => {
      const idx = inv.findIndex(
        (x: any) => x.descrizione === m.descrizione && x.unita === m.unita && x.fornitore === newO.nomeFornitore
      );
      if (idx >= 0) {
        const newQty = inv[idx].quantita + delta;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      } else if (delta > 0) {
        inv.push({
          id: `${Date.now()}_${Math.random()}`,
          descrizione: m.descrizione,
          unita: m.unita,
          quantita: delta,
          fornitore: newO.nomeFornitore || null,
          fotoUrl: m.fotoUrl || null,
          fotoStoragePath: m.fotoStoragePath || null,
        });
      }
    };

    ids.forEach((id) => {
      const old = oldMap.get(id);
      const now = newMap.get(id);
      if (old && !now) {
        if (old.arrivato) applyDelta(old, -old.quantita);
        return;
      }
      if (!old && now) {
        if (now.arrivato) applyDelta(now, now.quantita);
        return;
      }
      if (old && now) {
        if (!old.arrivato && now.arrivato) applyDelta(now, now.quantita);
        if (old.arrivato && !now.arrivato) applyDelta(old, -old.quantita);
        if (old.arrivato && now.arrivato) {
          const diff = now.quantita - old.quantita;
          if (diff !== 0) applyDelta(now, diff);
        }
      }
    });

    await setItemSync("@inventario", inv);
  };

  const salvaCompleto = async (nuovo: Ordine) => {
    const raw = await getItemSync("@ordini");
    let arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
    arr = arr.map((o) => (o.id === nuovo.id ? nuovo : o));
    await setItemSync("@ordini", arr);
    await aggiornaInventario(ordineOriginale!, nuovo);
    setOrdine(JSON.parse(JSON.stringify(nuovo)));
    setOrdineOriginale(JSON.parse(JSON.stringify(nuovo)));
    setEditing(false);
    setAddingMaterial(false);
  };

  const eliminaMateriale = async (id: string) => {
    if (!ordine) return;
    const target = ordine.materiali.find((m) => m.id === id);
    const updated: Ordine = { ...ordine, materiali: ordine.materiali.filter((m) => m.id !== id) };

    if (target?.arrivato) {
      const invRaw = await getItemSync("@inventario");
      let inv: any[] = Array.isArray(invRaw) ? invRaw : [];
      const idx = inv.findIndex(
        (i: any) => i.descrizione === target.descrizione && i.unita === target.unita && i.fornitore === ordine.nomeFornitore
      );
      if (idx >= 0) {
        const newQty = inv[idx].quantita - target.quantita;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      }
      await setItemSync("@inventario", inv);
    }

    await salvaCompleto(updated);
  };

  const salvaNuovoMateriale = async () => {
    if (!ordine) return;
    const id = `${Date.now()}_${Math.random()}`;
    let fotoUrl = null;
    let fotoStoragePath = null;
    if (newPhotoFile) {
      const up = await uploadMaterialImage(newPhotoFile, id);
      fotoUrl = up.fotoUrl;
      fotoStoragePath = up.fotoStoragePath;
    }
    const nuovo: MaterialeOrdine = {
      id,
      descrizione: newDesc.toUpperCase(),
      quantita: parseInt(newQty) || 0,
      unita: newUnit,
      arrivato: false,
      dataArrivo: "",
      fotoUrl,
      fotoStoragePath,
    };
    const updated: Ordine = { ...ordine, materiali: [...ordine.materiali, nuovo] };
    await salvaCompleto(updated);
    if (newNote.trim()) {
      setNoteByMaterialeId((prev) => ({ ...prev, [id]: newNote.trim() }));
    }
    setNewDesc("");
    setNewQty("");
    setNewUnit("pz");
    setNewPhotoFile(null);
    setNewNote("");
    setSelectedDetailListino(null);
    setDetailSuggestOpen(false);
  };

  if (loading) return <div className="acq-detail-state">Caricamento...</div>;
  if (!ordine) return <div className="acq-detail-state">Ordine non trovato.</div>;

  const tot = ordine.materiali.length;
  const arr = ordine.materiali.filter((m) => m.arrivato).length;
  const stato = arr === 0 ? "IN ATTESA" : arr < tot ? "PARZIALE" : "ARRIVATO";

  return (
    <div className="acq-detail">
      <div className="acq-detail-head">
        <div>
          <p className="acq-section-kicker">Dettaglio ordine</p>
          <h3>{ordine.nomeFornitore}</h3>
          <p className="acq-detail-meta">Ordine del {ordine.dataOrdine}</p>
        </div>
        <div className="acq-detail-head-actions">
          <button type="button" className="acq-btn" onClick={onBack}>Indietro</button>
          {!editing && (
            <button type="button" className="acq-btn" onClick={toggleArrivatoOrdine}>
              {ordine.arrivato ? "Segna NON Arrivato" : "Segna Arrivato"}
            </button>
          )}
          {!editing ? (
            <button type="button" className="acq-btn acq-btn--primary" onClick={() => setEditing(true)}>Modifica</button>
          ) : (
            <button type="button" className="acq-btn acq-btn--primary" onClick={() => salvaCompleto(ordine)}>Salva</button>
          )}
        </div>
      </div>

      <div className="acq-detail-summary">
        <div className="acq-detail-summary-left">
          <span className={`acq-pill ${stato === "ARRIVATO" ? "is-ok" : stato === "PARZIALE" ? "is-warn" : "is-danger"}`}>{stato}</span>
          <span className="acq-pill">Materiali: {tot}</span>
          <span className="acq-pill">Arrivati: {arr}</span>
        </div>
        <div className="acq-detail-totals">
          <div className="acq-detail-pdf-actions">
            <button
              type="button"
              className="acq-btn"
              onClick={handlePdfFornitoriDettaglio}
              disabled={!ordine}
              title={!ordine ? "Ordine non disponibile" : "PDF senza prezzi"}
            >
              PDF Fornitori
            </button>
            <button
              type="button"
              className="acq-btn acq-btn--primary"
              onClick={handlePdfDirezioneDettaglio}
              disabled={!ordine}
              title={!ordine ? "Ordine non disponibile" : "PDF con prezzi e riferimenti"}
            >
              PDF Direzione
            </button>
          </div>
          {riepilogoTotali.mixed ? (
            <>
              <span className="acq-pill is-warn">Valute miste</span>
              <strong>Totale CHF: CHF {riepilogoTotali.totals.CHF.toFixed(2)}</strong>
              <strong>Totale EUR: EUR {riepilogoTotali.totals.EUR.toFixed(2)}</strong>
            </>
          ) : (
            <strong>
              {riepilogoTotali.missing > 0 || riepilogoTotali.udmDaVerificare > 0 ? "Totale parziale: " : "Totale ordine: "}
              {riepilogoTotali.usedValute.length === 0
                ? "-"
                : `${riepilogoTotali.usedValute[0]} ${riepilogoTotali.totals[riepilogoTotali.usedValute[0]].toFixed(2)}`}
            </strong>
          )}
          {riepilogoTotali.missing > 0 && <span className="acq-pill">Prezzi mancanti: {riepilogoTotali.missing}</span>}
          {riepilogoTotali.udmDaVerificare > 0 && <span className="acq-pill is-warn">UDM da verificare: {riepilogoTotali.udmDaVerificare}</span>}
        </div>
      </div>

      {!editing && !addingMaterial && (
        <button type="button" className="acq-btn" onClick={() => setAddingMaterial(true)}>+ Aggiungi materiale</button>
      )}

      {addingMaterial && (
        <div className="acq-detail-addbox">
          <div className="acq-detail-add-desc">
            <input
              className="acq-input"
              placeholder="DESCRIZIONE"
              value={newDesc}
              onChange={(e) => onDetailDescChange(e.target.value)}
              onFocus={() => setDetailSuggestOpen(true)}
              onBlur={() => setTimeout(() => setDetailSuggestOpen(false), 120)}
            />
            {detailSuggestOpen && detailSuggestList.length > 0 && (
              <div className="acq-detail-suggest">
                {detailSuggestList.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="acq-detail-suggest-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectDetailSuggestion(v)}
                  >
                    <strong>{v.articoloCanonico}</strong>
                    <small>
                      {v.codiceArticolo ? `Codice ${v.codiceArticolo} - ` : ""}
                      {v.prezzoAttuale.toFixed(2)} {v.valuta}/{String(v.unita || "").toLowerCase()} - N. {v.fonteAttuale.numeroPreventivo}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="acq-detail-addrow">
            <input className="acq-input" placeholder="QTA" value={newQty} onChange={(e) => setNewQty(e.target.value.replace(/\D/g, "").slice(0, 3))} />
            <select className="acq-input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              <option value="pz">PZ</option><option value="kg">KG</option><option value="m">M</option><option value="lt">LT</option>
            </select>
          </div>
          <input className="acq-input" placeholder="Nota riga (opzionale)" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
          {selectedDetailListino && (
            <div className="acq-detail-match-hint">
              Prezzo suggerito: {selectedDetailListino.prezzoAttuale.toFixed(2)} {selectedDetailListino.valuta}/{String(selectedDetailListino.unita || "").toLowerCase()}
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)} />
          <div className="acq-detail-head-actions">
            <button type="button" className="acq-btn acq-btn--primary" onClick={salvaNuovoMateriale}>Salva</button>
            <button type="button" className="acq-btn" onClick={() => setAddingMaterial(false)}>Annulla</button>
          </div>
        </div>
      )}

      <label className="acq-order-note acq-order-note--detail">
        <span>Note ordine (solo PDF)</span>
        <textarea
          value={ordineNote}
          onChange={(e) => setOrdineNote(e.target.value)}
          placeholder="Inserisci note generali ordine"
        />
      </label>

      <div className="acq-detail-table-wrap">
        <table className="acq-detail-table">
          <thead>
            <tr>
              <th>Foto</th><th>Descrizione</th><th>Q.ta</th><th>Unita</th><th>Arrivato</th><th>Data arrivo</th><th>Note</th><th>Totale riga</th><th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="acq-detail-photo-cell">
                    {m.fotoUrl ? <img src={m.fotoUrl} alt={m.descrizione} /> : <span>-</span>}
                    {editing && (
                      <div className="acq-detail-photo-buttons">
                        <label className="acq-btn acq-btn--small">Foto<input type="file" accept="image/*" onChange={(e) => uploadFoto(m.id, e)} style={{ display: "none" }} /></label>
                        {m.fotoUrl && <button type="button" className="acq-btn acq-btn--danger acq-btn--small" onClick={() => rimuoviFoto(m.id)}>Rimuovi</button>}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {!editing ? (
                    <div className="acq-detail-desc-cell"><strong title={m.id}>{m.descrizione}</strong></div>
                  ) : (
                    <input className="acq-input" value={m.descrizione} onChange={(e) => cambiaDescrizione(m.id, e.target.value)} />
                  )}
                </td>
                <td>{!editing ? m.quantita : <input className="acq-input acq-input--sm" value={m.quantita} onChange={(e) => cambiaQuantita(m.id, e.target.value)} />}</td>
                <td>{!editing ? m.unita : <select className="acq-input acq-input--sm" value={m.unita} onChange={(e) => cambiaUnita(m.id, e.target.value)}><option value="pz">PZ</option><option value="kg">KG</option><option value="m">M</option><option value="lt">LT</option></select>}</td>
                <td>{!editing ? <span className={`acq-pill ${m.arrivato ? "is-ok" : "is-danger"}`}>{m.arrivato ? "Si" : "No"}</span> : <label className="acq-check-inline"><input type="checkbox" checked={m.arrivato} onChange={(e) => cambiaArrivato(m.id, e.target.checked)} /> Arrivato</label>}</td>
                <td>{!editing ? m.dataArrivo || "-" : <input className="acq-input acq-input--sm" value={m.dataArrivo || ""} onChange={(e) => cambiaData(m.id, e.target.value)} placeholder="gg mm aaaa" />}</td>
                <td>
                  {!editing ? (
                    noteByMaterialeId[m.id] || "-"
                  ) : (
                    <input className="acq-input acq-input--sm" value={noteByMaterialeId[m.id] || ""} onChange={(e) => cambiaNota(m.id, e.target.value)} />
                  )}
                </td>
                <td>
                  {(() => {
                    const info = priceInfoByMaterialeId.get(m.id);
                    if (!info) return "-";
                    const note = noteByMaterialeId[m.id] || String((m as any)?.note || "");
                    const line = computeLineTotal({
                      qty: m.quantita,
                      unitPrice: info.prezzoUnitario,
                      selectedUom: m.unita,
                      priceUom: info.unitaPrezzo || m.unita,
                      note,
                    });
                    if (line.status === "needs_factor") return "DA VERIFICARE UDM";
                    if (line.total === null) return "-";
                    return `${info.valuta} ${line.total.toFixed(2)}`;
                  })()}
                </td>
                <td>{editing && <button type="button" className="acq-btn acq-btn--danger acq-btn--small" onClick={() => eliminaMateriale(m.id)}>Elimina</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Acquisti = () => {
  const navigate = useNavigate();
  const { ordineId } = useParams<{ ordineId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const derivedTab = keyToTab(searchParams.get("tab"), ordineId ? "Ordini" : "Ordine materiali");
  const [activeTab, setActiveTab] = useState<AcquistiTab>(derivedTab);
  const [headerSearch, setHeaderSearch] = useState("");
  const [focusPreventivoId, setFocusPreventivoId] = useState<string | null>(null);
  const [manualImportRequest, setManualImportRequest] = useState<{ requestId: string; row: ImportBozzaRiga } | null>(null);

  useEffect(() => {
    setActiveTab(derivedTab);
  }, [derivedTab]);

  const setTab = (tab: AcquistiTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabToKey(tab));
    if (ordineId) {
      navigate(`/acquisti?${next.toString()}`);
      return;
    }
    setSearchParams(next, { replace: true });
  };

  const openDettaglio = (id: string, fromTab: AcquistiTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabToKey(fromTab));
    navigate(`/acquisti/dettaglio/${id}?${next.toString()}`);
  };

  const closeDettaglio = () => {
    const next = new URLSearchParams(searchParams);
    if (!next.get("tab")) next.set("tab", tabToKey(activeTab));
    navigate(`/acquisti?${next.toString()}`);
  };

  const openPreventivoFromOrdine = async (payload: {
    preventivoId: string;
    pdfUrl: string | null;
    pdfStoragePath?: string | null;
    imageUrls?: string[];
    imageStoragePaths?: string[];
  }) => {
    try {
      const opened = await openDocumentRef(payload);
      if (opened) return;
    } catch (err) {
      console.error("Errore apertura documento preventivo:", err);
    }
    setFocusPreventivoId(payload.preventivoId);
    setTab("Prezzi & Preventivi");
  };

  const openManualListinoFromOrdine = (row: ImportBozzaRiga) => {
    setManualImportRequest({
      requestId: generaId(),
      row,
    });
    setTab("Prezzi & Preventivi");
  };

  return (
    <div className={`acq-page${ordineId ? " is-detail" : ""}`}>
      <div className="acq-shell">
        <header className="acq-header">
          <div>
            <p className="acq-eyebrow">Gestione Acquisti</p>
            <h1 className="acq-title">Acquisti</h1>
            <p className="acq-subtitle">Modulo unico: ordine materiali, liste ordini e dettaglio ordine.</p>
          </div>
          <div className="acq-header-actions">
            <label className="acq-search">
              <span>Cerca</span>
              <input type="search" placeholder="Ricerca UI (placeholder)" value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} />
            </label>
          </div>
        </header>

        <div className="acq-tabs" role="tablist" aria-label="Schede acquisti">
          {TABS.map((tab) => {
            const isActive = !ordineId && activeTab === tab;
            return (
              <button key={tab} type="button" role="tab" aria-selected={isActive} className={`acq-tab ${isActive ? "is-active" : ""}`} onClick={() => setTab(tab)}>
                <span>{tab}</span>
              </button>
            );
          })}
          {ordineId && <div className="acq-tab acq-tab--detail-live"><span>Dettaglio ordine</span></div>}
        </div>

        <section className="acq-content">
          {ordineId ? (
            <div className="acq-tab-panel acq-tab-panel--detail">
              <DettaglioOrdineView ordineId={ordineId} onBack={closeDettaglio} />
            </div>
          ) : activeTab === "Ordine materiali" ? (
            <div className="acq-tab-panel acq-tab-panel--fabbisogni">
              <OrdineMaterialiView
                onOpenPreventivo={openPreventivoFromOrdine}
                onOpenManualListino={openManualListinoFromOrdine}
              />
            </div>
          ) : activeTab === "Ordini" ? (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Ordini in attesa</h2>
              </div>
              <OrdiniListView kind="attesa" onOpenDettaglio={openDettaglio} />
            </div>
          ) : activeTab === "Arrivi" ? (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Ordini arrivati</h2>
              </div>
              <OrdiniListView kind="arrivi" onOpenDettaglio={openDettaglio} />
            </div>
          ) : activeTab === "Prezzi & Preventivi" ? (
            <div className="acq-tab-panel">
              <PreventiviView
                focusPreventivoId={focusPreventivoId}
                onFocusHandled={() => setFocusPreventivoId(null)}
                manualImportRequest={manualImportRequest}
                onManualImportHandled={() => setManualImportRequest(null)}
              />
            </div>
          ) : activeTab === "Listino Prezzi" ? (
            <div className="acq-tab-panel">
              <ListinoPrezziView />
            </div>
          ) : (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Listino prezzi</h2>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Acquisti;

