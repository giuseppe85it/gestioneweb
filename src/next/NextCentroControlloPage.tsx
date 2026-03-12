import "../pages/Home.css";
import "./next-shell.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HomeEvent } from "../utils/homeEvents";
import AutistiImportantEventsModal from "../components/AutistiImportantEventsModal";
import { formatDateInput, formatDateTimeUI, formatDateUI } from "../utils/dateFormat";
import {
  readNextCentroControlloSnapshot,
  type D10MezzoItem,
  type D10MissingMezzoItem,
  type D10PrenotazioneCollaudo,
  type D10PreCollaudo,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  buildNextDossierPath,
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_CISTERNA_IA_PATH,
  NEXT_CISTERNA_PATH,
  NEXT_CISTERNA_SCHEDE_TEST_PATH,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_IA_PATH,
  NEXT_INVENTARIO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
  NEXT_LAVORI_DA_ESEGUIRE_PATH,
  NEXT_LAVORI_ESEGUITI_PATH,
  NEXT_LAVORI_IN_ATTESA_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
  NEXT_MEZZI_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";

const QUICKLINKS_STORAGE_KEY = "gm_quicklinks_favs_v1";
const DOSSIER_MISSING_ALERT_KEY = "gm_dossier_missing_alert_v1";

const CLONE_ACTION_BLOCKED_TITLE = "Clone read-only: azione bloccata";

function resolveCloneSafeRoute(path: string): string | null {
  if (path.startsWith("/next/")) return path;
  if (path === "/autisti-inbox" || path.startsWith("/autisti-inbox/")) {
    return `/next${path}`;
  }
  if (path === "/autisti-admin") return NEXT_AUTISTI_ADMIN_PATH;
  if (path === "/autisti" || path.startsWith("/autisti/")) return `/next${path}`;
  if (path === "/ia") return NEXT_IA_PATH;
  if (path === "/ia/apikey") return NEXT_IA_APIKEY_PATH;
  if (path === "/ia/libretto") return NEXT_IA_LIBRETTO_PATH;
  if (path === "/ia/documenti") return NEXT_IA_DOCUMENTI_PATH;
  if (path === "/ia/copertura-libretti") return NEXT_IA_COPERTURA_LIBRETTI_PATH;
  if (path === "/libretti-export") return NEXT_LIBRETTI_EXPORT_PATH;
  if (path === "/centro-controllo") return NEXT_CENTRO_CONTROLLO_PATH;
  if (path === "/gestione-operativa") return NEXT_GESTIONE_OPERATIVA_PATH;
  if (path === "/inventario") return NEXT_INVENTARIO_PATH;
  if (path === "/materiali-consegnati") return NEXT_MATERIALI_CONSEGNATI_PATH;
  if (path === "/attrezzature-cantieri") return "/next/attrezzature-cantieri";
  if (path === "/manutenzioni") return NEXT_MANUTENZIONI_PATH;
  if (path === "/acquisti") return "/next/acquisti";
  if (path === "/materiali-da-ordinare") return NEXT_MATERIALI_DA_ORDINARE_PATH;
  if (path === "/ordini-in-attesa") return NEXT_ORDINI_IN_ATTESA_PATH;
  if (path === "/ordini-arrivati") return NEXT_ORDINI_ARRIVATI_PATH;
  if (path === "/lavori-da-eseguire") return NEXT_LAVORI_DA_ESEGUIRE_PATH;
  if (path === "/lavori-in-attesa") return NEXT_LAVORI_IN_ATTESA_PATH;
  if (path === "/lavori-eseguiti") return NEXT_LAVORI_ESEGUITI_PATH;
  if (path === "/cisterna") return NEXT_CISTERNA_PATH;
  if (path === "/cisterna/ia") return NEXT_CISTERNA_IA_PATH;
  if (path === "/cisterna/schede-test") return NEXT_CISTERNA_SCHEDE_TEST_PATH;
  if (path === "/mezzi") return NEXT_MEZZI_PATH;
  if (path === "/dossiermezzi") return NEXT_DOSSIER_LISTA_PATH;
  if (path === "/colleghi") return "/next/colleghi";
  if (path === "/fornitori") return "/next/fornitori";
  if (path === "/capo/mezzi") return "/next/capo/mezzi";
  if (path.startsWith("/capo/costi/")) {
    const targa = path.split("/").pop();
    return targa ? `/next/capo/costi/${encodeURIComponent(targa)}` : "/next/capo/mezzi";
  }
  return null;
}

type AutistaSuggestion = {
  name: string;
  badge?: string;
  targa?: string;
  priority: number;
};

type QuickLink = {
  id: string;
  to: string;
  label: string;
  description?: string;
};

type QuickLinkUsage = {
  count: number;
  lastUsedAt: number;
};

type QuickLinksStore = {
  pins: string[];
  usage: Record<string, QuickLinkUsage>;
};

type QuickSectionId = "autisti" | "lavori" | "materiali" | "ia";

type MissingAlertState = {
  nextRemindAt: number;
};

type RimorchioEditState = {
  targa: string;
  luogo: string;
  eventId: string | null;
  eventIndex: number | null;
};

type MezzoRecord = D10MezzoItem;
type MissingMezzo = D10MissingMezzoItem;
type PrenotazioneCollaudo = D10PrenotazioneCollaudo;
type PreCollaudo = D10PreCollaudo;

function createQuickLinkId(item: { id?: string; to?: string; label: string }): string {
  if (item.id) return item.id;
  const toValue = String(item.to || "").trim();
  if (toValue) return `route:${toValue}`;
  const labelValue = String(item.label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `label:${labelValue || "link"}`;
}

function buildQuickLinks(
  items: Array<{ to: string; label: string; id?: string; description?: string }>
): QuickLink[] {
  return items.map((item) => ({
    ...item,
    id: createQuickLinkId(item),
  }));
}

function normalizeQuickLinksStore(value: unknown): QuickLinksStore {
  const rawPins =
    value && typeof value === "object" && "pins" in value
      ? (value as { pins?: unknown }).pins
      : undefined;
  const pinsRaw = Array.isArray(rawPins) ? rawPins : [];
  const pins = Array.from(
    new Set(pinsRaw.filter((pin: unknown): pin is string => typeof pin === "string"))
  ).slice(0, 3);

  const rawUsage =
    value && typeof value === "object" && "usage" in value
      ? (value as { usage?: unknown }).usage
      : undefined;
  const usageSource =
    rawUsage && typeof rawUsage === "object" && !Array.isArray(rawUsage)
      ? (rawUsage as Record<string, unknown>)
      : {};
  const usage: Record<string, QuickLinkUsage> = {};
  Object.entries(usageSource).forEach(([id, entry]) => {
    if (!entry || typeof entry !== "object") return;
    const count = (entry as { count?: unknown }).count;
    const lastUsedAt = (entry as { lastUsedAt?: unknown }).lastUsedAt;
    if (typeof count !== "number" || typeof lastUsedAt !== "number") return;
    usage[id] = {
      count: Number.isFinite(count) && count > 0 ? count : 0,
      lastUsedAt: Number.isFinite(lastUsedAt) && lastUsedAt > 0 ? lastUsedAt : 0,
    };
  });
  return { pins, usage };
}

function readQuickLinksStore(): QuickLinksStore {
  if (typeof window === "undefined") return { pins: [], usage: {} };
  try {
    const raw = window.localStorage.getItem(QUICKLINKS_STORAGE_KEY);
    if (!raw) return { pins: [], usage: {} };
    const parsed: unknown = JSON.parse(raw);
    return normalizeQuickLinksStore(parsed);
  } catch {
    return { pins: [], usage: {} };
  }
}

function normalizeMissingAlertState(value: unknown): MissingAlertState {
  if (!value || typeof value !== "object") {
    return { nextRemindAt: 0 };
  }
  const raw = (value as { nextRemindAt?: unknown }).nextRemindAt;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { nextRemindAt: Math.max(0, raw) };
  }
  return { nextRemindAt: 0 };
}

function readMissingAlertState(): MissingAlertState {
  if (typeof window === "undefined") return { nextRemindAt: 0 };
  try {
    const raw = window.localStorage.getItem(DOSSIER_MISSING_ALERT_KEY);
    if (!raw) return { nextRemindAt: 0 };
    const parsed: unknown = JSON.parse(raw);
    return normalizeMissingAlertState(parsed);
  } catch {
    return { nextRemindAt: 0 };
  }
}

function writeMissingAlertState(next: MissingAlertState) {
  void next;
}

function getQuickLinkRecencyBonus(lastUsedAt: number, now: number): number {
  if (!lastUsedAt) return 0;
  const delta = now - lastUsedAt;
  if (delta <= 86_400_000) return 3;
  if (delta <= 604_800_000) return 1;
  return 0;
}

const QUICK_LINKS_OPERATIVO = buildQuickLinks([
  { to: "/gestione-operativa", label: "Gestione Operativa" },
  { to: "/attrezzature-cantieri", label: "Attrezzature Cantieri" },
  {
    to: "/autisti-admin",
    label: "Centro rettifica dati (admin)",
    description: "Correggi dati e risolvi anomalie operative.",
  },
  {
    to: "/autisti-inbox",
    label: "Autisti Inbox (admin)",
    description: "Vedi e gestisci cio che arriva dagli autisti.",
  },
  { to: "/manutenzioni", label: "Manutenzioni" },
  { to: "/lavori-da-eseguire", label: "Lavori Da Eseguire" },
  { to: "/lavori-eseguiti", label: "Lavori Eseguiti" },
  { to: "/lavori-in-attesa", label: "Lavori In Attesa" },
  { to: "/materiali-da-ordinare", label: "Materiali Da Ordinare" },
  { to: "/materiali-consegnati", label: "Materiali Consegnati" },
  { to: "/inventario", label: "Inventario" },
  { to: "/ordini-arrivati", label: "Ordini Arrivati" },
  { to: "/ordini-in-attesa", label: "Ordini In Attesa" },
  { to: "/ia", label: "Intelligenza Artificiale" },
  { to: "/libretti-export", label: "Libretti Export" },
  { to: "/ia/documenti", label: "IA Documenti" },
  { to: "/cisterna", label: "Cisterna Caravate" },
]);

const QUICK_LINKS_ANAGRAFICHE = buildQuickLinks([
  { to: "/mezzi", label: "Mezzi" },
  { to: "/dossiermezzi", label: "Dossier Mezzi" },
  { to: "/colleghi", label: "Colleghi" },
  { to: "/fornitori", label: "Fornitori" },
  {
    to: "/autisti",
    label: "Autisti App (telefono)",
    description: "Usata dagli autisti per inviare rifornimenti, segnalazioni e controlli.",
  },
]);

const QUICK_LINKS_ALL = [...QUICK_LINKS_OPERATIVO, ...QUICK_LINKS_ANAGRAFICHE];
const QUICK_LINKS_BY_ID = new Map(
  QUICK_LINKS_ALL.map((link) => [link.id, link])
);

function fmtTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

function normalizeName(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNameKey(value: string | null | undefined): string {
  return normalizeName(value).toLowerCase();
}

function normalizeBadge(value: string | null | undefined): string {
  return String(value || "").trim();
}

function normalizeBadgeKey(value: string | null | undefined): string {
  return normalizeBadge(value).toLowerCase();
}

function buildDate(yyyyStr: string, mmStr: string, ddStr: string): Date | null {
  const yyyy = Number(yyyyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }
  return date;
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const dmyMatch = /(\d{2})[./\s](\d{2})[./\s](\d{4})/.exec(text);

  const candidates: Array<{ index: number; date: Date }> = [];
  if (isoMatch) {
    const date = buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (date) candidates.push({ index: isoMatch.index, date });
  }
  if (dmyMatch) {
    const date = buildDate(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (date) candidates.push({ index: dmyMatch.index, date });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0].date;
}

function formatDateForDisplay(date: Date | null): string {
  return formatDateUI(date);
}

function formatDateForInput(date: Date | null): string {
  return formatDateInput(date);
}

function formatDateTimeForDisplay(ts?: number | null): string {
  return formatDateTimeUI(ts ?? null);
}

function normalizeFreeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeBookingText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

void truncateText;

function truncateAsciiText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  const sliceLen = Math.max(0, maxLen - 3);
  return `${value.slice(0, sliceLen).trimEnd()}...`;
}

function formatGiorniLabel(giorni: number): string {
  if (giorni === 0) return "oggi";
  const abs = Math.abs(giorni);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return giorni < 0 ? `${base} fa` : `tra ${base}`;
}

function Home() {
  const navigate = useNavigate();
  const nameSuggestRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const preCollaudoDatePickerRef = useRef<HTMLInputElement | null>(null);
  const revisioneDatePickerRef = useRef<HTMLInputElement | null>(null);
  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [alertsNow, setAlertsNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeQuery, setBadgeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [nameSuggestOpen, setNameSuggestOpen] = useState(false);
  const [rimorchioEdit, setRimorchioEdit] = useState<RimorchioEditState | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickLinksStore] = useState<QuickLinksStore>(() => readQuickLinksStore());
  const [missingAlertState, setMissingAlertState] = useState<MissingAlertState>(() =>
    readMissingAlertState()
  );
  const [quickSectionsOpen, setQuickSectionsOpen] = useState({
    autisti: true,
    lavori: false,
    materiali: false,
    ia: false,
  });
  const [quickSectionsExpanded, setQuickSectionsExpanded] = useState({
    autisti: false,
    lavori: false,
    materiali: false,
    ia: false,
  });
  const [prenotazioneModalOpen, setPrenotazioneModalOpen] = useState(false);
  const [prenotazioneTargetTarga, setPrenotazioneTargetTarga] = useState<string | null>(null);
  const [prenotazioneForm, setPrenotazioneForm] = useState({
    data: "",
    ora: "",
    luogo: "",
    note: "",
  });
  const [preCollaudoModalOpen, setPreCollaudoModalOpen] = useState(false);
  const [preCollaudoTargetTarga, setPreCollaudoTargetTarga] = useState<string | null>(null);
  const [preCollaudoForm, setPreCollaudoForm] = useState({
    data: "",
    officina: "",
  });
  const [revisioneModalOpen, setRevisioneModalOpen] = useState(false);
  const [revisioneTargetTarga, setRevisioneTargetTarga] = useState<string | null>(null);
  const [revisioneForm, setRevisioneForm] = useState({
    data: "",
    esito: "",
    note: "",
  });
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [, setSelectedEvent] = useState<HomeEvent | null>(null);
  const [importantEventsOpen, setImportantEventsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async (now: number) => {
      try {
        const nextSnapshot = await readNextCentroControlloSnapshot(now);
        if (!mounted) return;
        setSnapshot(nextSnapshot);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSnapshot(Date.now());
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshSnapshot = async () => {
      try {
        const nextSnapshot = await readNextCentroControlloSnapshot(Date.now());
        if (!active) return;
        setSnapshot(nextSnapshot);
      } catch {
      }
    };

    void refreshSnapshot();
    return () => {
      active = false;
    };
  }, [location.key]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setAlertsNow(now);
      void readNextCentroControlloSnapshot(now)
        .then((nextSnapshot) => {
          setSnapshot(nextSnapshot);
        })
        .catch(() => {
        });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const mezzi = snapshot?.mezzi ?? [];
  const sessioni = snapshot?.sessioni ?? [];
  const visibleAlerts = snapshot?.alerts ?? [];
  const importantAutistiItems = snapshot?.importantAutistiItems ?? [];
  const rimorchiDaMostrare = snapshot?.rimorchiDaMostrare ?? [];
  const motriciTrattoriDaMostrare = snapshot?.motriciTrattoriDaMostrare ?? [];
  const revisioniUrgenti = snapshot?.revisioniUrgenti ?? [];
  const mezziIncompleti = snapshot?.missingMezzi ?? [];
  const revCounts = {
    scadute: snapshot?.counters.revisioniScadute ?? 0,
    inScadenza: snapshot?.counters.revisioniInScadenza ?? 0,
  };
  const sessioniAttive = sessioni;

  const handleAutistaSearch = () => {
    return;
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    const normalized = normalizeNameKey(value);
    if (normalized.length >= 2) {
      setNameSuggestOpen(true);
    } else {
      setNameSuggestOpen(false);
    }
  };

  const handleNameSuggestion = (suggestion: AutistaSuggestion) => {
    setNameQuery(suggestion.name);
    setBadgeQuery(suggestion.badge || "");
    setNameSuggestOpen(false);
  };

  const startRimorchioEdit = (rimorchio: {
    targa: string;
    luogoRaw: string;
    luogoEventId: string | null;
    luogoEventIndex: number | null;
  }) => {
    void rimorchio;
  };

  const cancelRimorchioEdit = () => {
    setRimorchioEdit(null);
  };

  const saveRimorchioEdit = async () => {
    return;
  };

  const closePrenotazioneModal = () => {
    setPrenotazioneModalOpen(false);
    setPrenotazioneTargetTarga(null);
  };

  const closePreCollaudoModal = () => {
    setPreCollaudoModalOpen(false);
    setPreCollaudoTargetTarga(null);
  };

  const closeRevisioneModal = () => {
    setRevisioneModalOpen(false);
    setRevisioneTargetTarga(null);
  };

  const openRevisioneModal = (targa: string, current?: PrenotazioneCollaudo | null) => {
    void targa;
    void current;
  };

  const openPreCollaudoModal = (targa: string, current?: PreCollaudo | null) => {
    void targa;
    void current;
  };

  const openPrenotazioneModal = (
    targa: string,
    current?: PrenotazioneCollaudo | null
  ) => {
    void targa;
    void current;
  };

  const persistPrenotazioneCollaudo = (
    targa: string,
    prenotazione: PrenotazioneCollaudo | null
  ) => {
    void targa;
    void prenotazione;
  };
  void persistPrenotazioneCollaudo;

  const handlePrenotazioneSave = () => {
  };

  const handlePreCollaudoSave = () => {
  };

  const handleRevisioneSave = () => {
  };

  const openDatePicker = () => {
    const input =
      datePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const openPreCollaudoDatePicker = () => {
    const input =
      preCollaudoDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const openRevisioneDatePicker = () => {
    const input =
      revisioneDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const handleDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setPrenotazioneForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handlePreCollaudoDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setPreCollaudoForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handleRevisioneDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setRevisioneForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handlePrenotazioneDelete = (targa: string) => {
    void targa;
  };

  const recordQuickLinkUse = (id: string) => {
    void id;
  };

  const toggleQuickSectionOpen = (sectionId: QuickSectionId) => {
    setQuickSectionsOpen((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleQuickSectionExpanded = (sectionId: QuickSectionId) => {
    setQuickSectionsExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  useEffect(() => {
    if (!nameSuggestOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !nameSuggestRef.current) return;
      if (nameSuggestRef.current.contains(target)) return;
      setNameSuggestOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [nameSuggestOpen]);

  const mezzoByTarga = useMemo(() => {
    const map = new Map<string, MezzoRecord>();
    mezzi.forEach((m) => {
      const targa = fmtTarga(m.targa);
      if (targa) map.set(targa, m);
    });
    return map;
  }, [mezzi]);

  const getTargaTooltip = (targa: string | null | undefined) => {
    const key = fmtTarga(targa);
    if (!key) return "";
    const mezzo = mezzoByTarga.get(key);
    if (!mezzo) return "";
    const categoria = mezzo.categoria ? String(mezzo.categoria) : "-";
    const autista = mezzo.autistaNome ? String(mezzo.autistaNome) : "-";
    return `Categoria: ${categoria}\nAutista: ${autista}`;
  };

  const searchResults = useMemo(() => {
    const queryRaw = searchQuery.trim();
    if (!queryRaw) return [];
    const queryLower = queryRaw.toLowerCase();
    const queryUpper = queryRaw.toUpperCase();
    return mezzi
      .map((m) => {
        const targa = fmtTarga(m.targa);
        return {
          targa,
          autistaNome: m.autistaNome || "",
          categoria: m.categoria || "",
          marca: m.marca || "",
          modello: m.modello || "",
        };
      })
      .filter((m) => {
        if (!m.targa) return false;
        const targaMatch = m.targa.includes(queryUpper);
        const autistaMatch = String(m.autistaNome || "")
          .toLowerCase()
          .includes(queryLower);
        return targaMatch || autistaMatch;
      })
      .slice(0, 8);
  }, [mezzi, searchQuery]);

  const allAutistaSuggestions = useMemo(() => {
    const map = new Map<string, AutistaSuggestion>();
    const addCandidate = (
      nameRaw: string | null | undefined,
      badgeRaw: string | null | undefined,
      targaRaw: string | null | undefined,
      priority: number
    ) => {
      const nameLabel = normalizeName(nameRaw);
      if (!nameLabel) return;
      const badgeLabel = normalizeBadge(badgeRaw);
      const badgeKey = normalizeBadgeKey(badgeLabel);
      const nameKey = normalizeNameKey(nameLabel);
      const key = badgeKey ? `${nameKey}|${badgeKey}` : nameKey;
      const targaLabel = targaRaw ? fmtTarga(targaRaw) : "";
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: nameLabel,
          badge: badgeLabel || undefined,
          targa: targaLabel || undefined,
          priority,
        });
        return;
      }
      if (priority > existing.priority && nameLabel) {
        existing.name = nameLabel;
        existing.priority = priority;
      }
      if (!existing.badge && badgeLabel) {
        existing.badge = badgeLabel;
      }
      if (targaLabel && (!existing.targa || priority > existing.priority)) {
        existing.targa = targaLabel;
      }
    };

    sessioni.forEach((s) => {
      addCandidate(
        s.nomeAutista,
        s.badgeAutista,
        s.targaMotrice || s.targaRimorchio,
        2
      );
    });

    mezzi.forEach((m) => {
      const mezzoBadge =
        (m as any)?.badgeAutista || (m as any)?.badge || (m as any)?.autistaBadge;
      addCandidate(m.autistaNome, mezzoBadge, m.targa, 1);
    });

    return Array.from(map.values());
  }, [sessioni, mezzi]);

  const nameQueryKey = useMemo(() => normalizeNameKey(nameQuery), [nameQuery]);

  const nameSuggestions = useMemo(() => {
    if (nameQueryKey.length < 2) return [];
    return allAutistaSuggestions
      .filter((s) => normalizeNameKey(s.name).includes(nameQueryKey))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [allAutistaSuggestions, nameQueryKey]);

  const showNameSuggestions = nameSuggestOpen && nameSuggestions.length > 0;

  const prenotazioneDateValue = formatDateForInput(
    parseDateFlexible(prenotazioneForm.data)
  );
  const preCollaudoDateValue = formatDateForInput(
    parseDateFlexible(preCollaudoForm.data)
  );
  const revisioneDateValue = formatDateForInput(
    parseDateFlexible(revisioneForm.data)
  );

  const quickSearchValue = quickSearch.trim();
  const quickSearchActive = quickSearchValue.length > 0;
  const quickSearchResults = quickSearchActive
    ? [...QUICK_LINKS_ALL]
        .filter((link) =>
          link.label.toLowerCase().includes(quickSearchValue.toLowerCase())
        )
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const quickPinnedIds = quickLinksStore.pins.filter((id) =>
    QUICK_LINKS_BY_ID.has(id)
  );
  const quickPinnedSet = new Set(quickPinnedIds);
  const quickFavorites = (() => {
    const now = Date.now();
    const pinnedLinks = quickPinnedIds
      .map((id) => QUICK_LINKS_BY_ID.get(id))
      .filter((link): link is QuickLink => Boolean(link));
    const scoredLinks = QUICK_LINKS_ALL
      .filter((link) => !quickPinnedSet.has(link.id))
      .map((link) => {
        const usage = quickLinksStore.usage[link.id];
        const count = usage?.count ?? 0;
        const lastUsedAt = usage?.lastUsedAt ?? 0;
        return {
          link,
          score: count + getQuickLinkRecencyBonus(lastUsedAt, now),
          lastUsedAt,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.lastUsedAt !== a.lastUsedAt) return b.lastUsedAt - a.lastUsedAt;
        return a.link.label.localeCompare(b.link.label);
      })
      .map((item) => item.link);
    return [...pinnedLinks, ...scoredLinks].slice(0, 6);
  })();

  const quickCategories: Array<{ id: QuickSectionId; title: string; links: QuickLink[] }> =
    (() => {
      const autisti: QuickLink[] = [];
      const lavori: QuickLink[] = [];
      const materiali: QuickLink[] = [];
      const ia: QuickLink[] = [];

      QUICK_LINKS_OPERATIVO.forEach((link) => {
        if (
          link.to === "/autisti" ||
          link.to.startsWith("/autisti/") ||
          link.to.startsWith("/autisti-inbox") ||
          link.to.startsWith("/autisti-admin") ||
          link.to.startsWith("/next/autisti-admin")
        ) {
          autisti.push(link);
          return;
        }
        if (
          link.to.startsWith("/lavori-") ||
          link.to.startsWith("/manutenzioni") ||
          link.to === "/gestione-operativa"
        ) {
          lavori.push(link);
          return;
        }
        if (
          link.to.startsWith("/materiali-") ||
          link.to.startsWith("/inventario") ||
          link.to.startsWith("/ordini-") ||
          link.to.startsWith("/attrezzature-cantieri")
        ) {
          materiali.push(link);
          return;
        }
        if (
          link.to.startsWith("/ia") ||
          link.to.startsWith("/libretti-export") ||
          link.to.startsWith("/cisterna")
        ) {
          ia.push(link);
          return;
        }
        lavori.push(link);
      });

      return [
        { id: "autisti", title: "Autisti (app + admin)", links: autisti },
        { id: "lavori", title: "Lavori e Manutenzioni", links: lavori },
        { id: "materiali", title: "Materiali e Magazzino", links: materiali },
        { id: "ia", title: "IA", links: ia },
      ];
    })();

  const quickSectionPills: Record<QuickSectionId, string> = {
    autisti: "AUTISTI",
    lavori: "OPERATIVO",
    materiali: "MAGAZZINO",
    ia: "IA",
  };

  const renderQuickLink = (link: QuickLink) => {
    const isPinned = quickPinnedSet.has(link.id);
    const safeTo = resolveCloneSafeRoute(link.to);
    return (
      <div key={link.id} className="quick-link-item">
        {safeTo ? (
          <Link
            to={safeTo}
            className={`quick-link ${isPinned ? "pinned" : ""}`}
            onClick={() => recordQuickLinkUse(link.id)}
          >
            <span className="quick-link-label">{link.label}</span>
            {link.description ? (
              <span className="quick-link-desc">{link.description}</span>
            ) : null}
            {isPinned ? <span className="quick-link-badge">PIN</span> : null}
          </Link>
        ) : (
          <div
            className={`quick-link quick-link--disabled ${isPinned ? "pinned" : ""} next-clone-link-disabled`}
            aria-disabled="true"
            title={CLONE_ACTION_BLOCKED_TITLE}
          >
            <span className="quick-link-label">{link.label}</span>
            {link.description ? (
              <span className="quick-link-desc">{link.description}</span>
            ) : null}
            {isPinned ? <span className="quick-link-badge">PIN</span> : null}
          </div>
        )}
        <button
          type="button"
          className={`quick-pin-toggle ${isPinned ? "active" : ""}`}
          disabled
          aria-pressed={isPinned}
          title={CLONE_ACTION_BLOCKED_TITLE}
        >
          PIN
        </button>
      </div>
    );
  };

  const missingAlertVisible =
    mezziIncompleti.length > 0 &&
    alertsNow >= missingAlertState.nextRemindAt;

  const updateMissingAlertState = (nextRemindAt: number) => {
    const next = { nextRemindAt };
    setMissingAlertState(next);
    writeMissingAlertState(next);
  };
  void updateMissingAlertState;

  const handleMissingNow = () => {
    setMissingModalOpen(true);
  };

  const closeMissingModal = () => {
    setMissingModalOpen(false);
    void readNextCentroControlloSnapshot(Date.now())
      .then((nextSnapshot) => {
        setSnapshot(nextSnapshot);
      })
      .catch(() => {
      });
  };

  const handleMissingSelect = (item: MissingMezzo) => {
    const params = new URLSearchParams();
    if (item.id) {
      params.set("mezzoId", item.id);
    } else if (item.targa) {
      params.set("targa", item.targa);
    }
    params.set("highlightMissing", "1");
    setMissingModalOpen(false);
    const query = params.toString();
    navigate(NEXT_DOSSIER_LISTA_PATH + (query ? `?${query}` : ""));
  };

  const canExportAlerts = false;

  const handleExportAlertsPdf = () => {
    return;
  };

  return (
    <div className="home-container">
      <div className="home-shell">
        <header className="home-hero">
          <div className="homeTopGrid">
            <div className="homeTopLeft">
              <div className="home-hero-logo">
                <img src="/logo.png" alt="Logo" />
              </div>
              <div className="home-hero-left homeTopLeftTexts">
                <div className="home-kicker">Centrale Operativa</div>
                <h1 className="home-title">Dashboard Admin</h1>
                <p className="home-subtitle">
                  Panoramica rapida su rimorchi, sessioni attive e revisioni. Tutti i pannelli
                  portano alle sezioni operative.
                </p>
              </div>
            </div>
            <div className="home-hero-right homeTopRight">
              <Link to={NEXT_AUTISTI_ADMIN_PATH} className="hero-card">
                <div className="hero-card-title">Centro rettifica dati (admin)</div>
                <div className="hero-card-value hero-card-subtext">
                  Correggi dati e risolvi anomalie operative.
                </div>
              </Link>
              <Link to={NEXT_MEZZI_PATH} className="hero-card">
                <div className="hero-card-title">Mezzi</div>
                <div className="hero-card-value">Anagrafiche</div>
              </Link>
              <Link to="/next/capo/mezzi" className="hero-card">
                <div className="hero-card-title">Area Capo</div>
                <div className="hero-card-value hero-card-subtext">
                  Costi mezzi, fatture e riepiloghi.
                </div>
              </Link>
              <Link to={NEXT_MANUTENZIONI_PATH} className="hero-card">
                <div className="hero-card-title">Manutenzioni</div>
                <div className="hero-card-value">Registro</div>
              </Link>
              <Link to={NEXT_AUTISTI_INBOX_PATH} className="hero-card">
                <div className="hero-card-title">Autisti Inbox (admin)</div>
                <div className="hero-card-value hero-card-subtext">
                  Vedi e gestisci cio che arriva dagli autisti.
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="home-dashboard">
          <div className="home-grid">
            <section className="home-span2">
              <section className="panel panel-search home-card home-full" style={{ animationDelay: "40ms" }}>
                <div className="panel-head home-card__head">
                  <div>
                    <h2 className="home-card__title">Ricerca 360</h2>
                    <span className="home-card__subtitle">
                      Cerca targa o autista e apri la Vista Mezzo 360
                    </span>
                  </div>
                </div>
                <div className="home-card__body">
                  <div className="search-field">
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Cerca targa o autista"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="search-results">
                    {loading ? (
                      <div className="search-empty">Caricamento dati...</div>
                    ) : !searchQuery.trim() ? (
                      <div className="search-empty">Digita per cercare</div>
                    ) : searchResults.length === 0 ? (
                      <div className="search-empty">Nessun risultato</div>
                    ) : (
                      searchResults.map((r, idx) => {
                        const tooltip = getTargaTooltip(r.targa);
                        return (
                          <Link
                            key={`${r.targa}-${idx}`}
                            to={buildNextDossierPath(r.targa)}
                            className="search-item"
                          >
                            <div className="search-item-main">
                              <span className="targa" title={tooltip || undefined}>
                                {r.targa}
                              </span>
                              <span className="search-meta">
                                {r.autistaNome ? `Autista: ${r.autistaNome}` : "Autista: -"}
                              </span>
                            </div>
                            <span className="row-arrow">-&gt;</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  <div className="badge-search">
                    <div className="badge-search-label">Cerca badge</div>
                    <div className="badge-search-form">
                      <div className="homeBadgeRowGrid">
                        <div className="badge-search-field homeBadgeCol">
                          <input
                            className="badge-search-input"
                            type="text"
                            placeholder="Inserisci badge"
                            value={badgeQuery}
                            onChange={(e) => setBadgeQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAutistaSearch();
                              }
                            }}
                          />
                        </div>
                        <div className="badge-search-field homeNomeCol">
                          <div className="homeSuggestWrap" ref={nameSuggestRef}>
                            <input
                              className="badge-search-input"
                              type="text"
                              placeholder="Nome autista..."
                              value={nameQuery}
                              onChange={(e) => handleNameChange(e.target.value)}
                              onFocus={() => {
                                if (nameQueryKey.length >= 2) setNameSuggestOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  setNameSuggestOpen(false);
                                  return;
                                }
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAutistaSearch();
                                }
                              }}
                            />
                            {showNameSuggestions ? (
                              <div className="badge-suggest homeSuggestList">
                                {nameSuggestions.map((suggestion) => (
                                  <button
                                    key={`${suggestion.name}-${suggestion.badge || "no-badge"}`}
                                    type="button"
                                    className="badge-suggest-item"
                                    onClick={() => handleNameSuggestion(suggestion)}
                                  >
                                    <div className="badge-suggest-main">
                                      <span className="badge-suggest-name">{suggestion.name}</span>
                                      <span className="badge-suggest-meta">
                                        {suggestion.badge ? `Badge ${suggestion.badge}` : "Badge -"}
                                      </span>
                                      {suggestion.targa ? (
                                        <span className="badge-suggest-meta">
                                          Targa {suggestion.targa}
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="homeApriCol">
                          <button
                            type="button"
                            className="badge-search-button"
                            disabled
                            title={CLONE_ACTION_BLOCKED_TITLE}
                            onClick={handleAutistaSearch}
                          >
                            Apri
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </section>
            <div className="home-col">
                <section className="panel panel-alerts home-card" style={{ animationDelay: "20ms" }}>
                  <div className="panel-head home-card__head">
                    <div>
                      <h2 className="home-card__title">ALERT</h2>
                      <span className="home-card__subtitle">
                        Revisioni, segnalazioni non lette, conflitti agganci e dati mancanti
                      </span>
                    </div>
                    <button
                      type="button"
                      className="alert-action"
                      onClick={handleExportAlertsPdf}
                      disabled={!canExportAlerts}
                      title={CLONE_ACTION_BLOCKED_TITLE}
                    >
                      ESPORTA PDF
                    </button>
                  </div>
                  <div className="panel-body alerts-list home-card__body">
                    {loading || !snapshot ? (
                      <div className="panel-row panel-row-empty">Caricamento alert...</div>
                    ) : visibleAlerts.length === 0 && !missingAlertVisible ? (
                      <div className="panel-row panel-row-empty">Nessun alert attivo</div>
                    ) : (
                      <>
                        {missingAlertVisible ? (
                          <div className="alert-row alert-warning alert-missing">
                            <div className="alert-main">
                              <div className="alert-title">
                                <span className="alert-title-text">Dati mancanti nel Dossier</span>
                                <span className="status deadline-medium">ATTENZIONE</span>
                              </div>
                              <div className="alert-detail">
                                Alcuni mezzi hanno dati incompleti: completa per evitare problemi nel dossier.
                              </div>
                            </div>
                            <div className="alert-actions">
                              <button
                                type="button"
                                className="alert-action"
                                disabled
                                title={CLONE_ACTION_BLOCKED_TITLE}
                              >
                                Ignora
                              </button>
                              <button
                                type="button"
                                className="alert-action"
                                disabled
                                title={CLONE_ACTION_BLOCKED_TITLE}
                              >
                                In seguito
                              </button>
                              <button
                                type="button"
                                className="alert-action primary"
                                onClick={handleMissingNow}
                              >
                                Adesso
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {visibleAlerts.map((alert) => {
                          const badgeClass =
                            alert.severity === "danger"
                              ? "deadline-danger"
                              : alert.severity === "warning"
                              ? "deadline-medium"
                              : "deadline-low";
                          const badgeLabel =
                            alert.severity === "danger"
                              ? "URGENTE"
                              : alert.severity === "warning"
                              ? "ATTENZIONE"
                              : "INFO";
                          const alertTarga = fmtTarga(alert.mezzoTarga);
                          const isTargaAlert = Boolean(alertTarga);
                          const isImportantEventsAlert =
                            alert.kind === "eventi_importanti_autisti";
                          const topImportantItems = isImportantEventsAlert
                            ? importantAutistiItems.slice(0, 5)
                            : [];
                          const remainingImportantItems = isImportantEventsAlert
                            ? Math.max(0, importantAutistiItems.length - topImportantItems.length)
                            : 0;
                          return (
                            <div
                              key={alert.id}
                              className={`alert-row alert-${alert.severity}`}
                            >
                              <div className="alert-main">
                                {isTargaAlert ? (
                                  <>
                                    <div className="row-title">
                                      <span
                                        className="targa"
                                        style={{ fontSize: "18px", fontWeight: 700 }}
                                      >
                                        {alertTarga}
                                      </span>
                                      <span
                                        className={`status ${badgeClass}`}
                                        style={{ fontSize: "12px", fontWeight: 600 }}
                                      >
                                        {badgeLabel}
                                      </span>
                                    </div>
                                    <div className="row-meta row-meta-stack">
                                      <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                        <span className="label">Stato:</span>{" "}
                                        <strong>{alert.title}</strong>
                                      </div>
                                      <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                        <span className="label">Dettaglio:</span>{" "}
                                        <span>{alert.detailText}</span>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="alert-title">
                                      <span className="alert-title-text">{alert.title}</span>
                                      <span className={`status ${badgeClass}`}>{badgeLabel}</span>
                                    </div>
                                    {isImportantEventsAlert ? (
                                      <div className="alert-detail">
                                        {topImportantItems.map((item) => (
                                          <div
                                            key={item.id}
                                            className="alert-detail-row"
                                            role="button"
                                            tabIndex={0}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedEvent(item.event)}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setSelectedEvent(item.event);
                                              }
                                            }}
                                          >
                                            <span className="targa">{item.targa || "-"}</span>
                                            <span className="alert-detail">
                                              {formatDateTimeForDisplay(item.ts)}
                                            </span>
                                            <span className="alert-detail">{item.tipo}</span>
                                            <span className="alert-detail">{item.preview || "-"}</span>
                                          </div>
                                        ))}
                                        {remainingImportantItems > 0 ? (
                                          <div className="alert-detail-row">
                                            <span className="alert-detail">
                                              +{remainingImportantItems} altri eventi
                                            </span>
                                          </div>
                                        ) : null}
                                        {importantAutistiItems.length > 5 ? (
                                          <div className="alert-detail-row">
                                            <button
                                              type="button"
                                              className="alert-action"
                                              onClick={() => setImportantEventsOpen(true)}
                                            >
                                              Vedi tutto
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <div className="alert-detail">{alert.detailText}</div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className={`alert-actions ${isTargaAlert ? "booking-actions" : ""}`}>
                                <button
                                  type="button"
                                  className={isTargaAlert ? "booking-action" : "alert-action"}
                                  disabled
                                  title={CLONE_ACTION_BLOCKED_TITLE}
                                >
                                  Ignora
                                </button>
                                <button
                                  type="button"
                                  className={isTargaAlert ? "booking-action" : "alert-action"}
                                  disabled
                                  title={CLONE_ACTION_BLOCKED_TITLE}
                                >
                                  In seguito
                                </button>
                                <button
                                  type="button"
                                  className={
                                    isTargaAlert ? "booking-action primary" : "alert-action primary"
                                  }
                                  disabled
                                  title={CLONE_ACTION_BLOCKED_TITLE}
                                >
                                  Letto
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </section>

                <section className="panel panel-sessioni home-card" style={{ animationDelay: "120ms" }}>
                  <div className="panel-head home-card__head">
                    <div>
                      <h2 className="home-card__title">Sessioni attive</h2>
                      <span className="home-card__subtitle">Sessioni live</span>
                    </div>
                  </div>
                  <div className="panel-body home-card__body">
                    {loading ? (
                      <div className="panel-row panel-row-empty">
                        Caricamento dati...
                      </div>
                    ) : sessioniAttive.length === 0 ? (
                      <div className="panel-row panel-row-empty">
                        Nessuna sessione attiva
                      </div>
                    ) : (
                      sessioniAttive.map((s, idx) => {
                        const motrice = fmtTarga(s.targaMotrice);
                        const rimorchio = fmtTarga(s.targaRimorchio);
                        const badgeValue = String(s.badgeAutista || "").trim();
                        return (
                          <div
                            key={`${s.badgeAutista || "s"}-${idx}`}
                            className="panel-row next-clone-row-disabled"
                            title={CLONE_ACTION_BLOCKED_TITLE}
                          >
                            <div className="row-main">
                              <div className="row-title">
                                <span>{s.nomeAutista || "Autista"}</span>
                                <span className="badge">badge {s.badgeAutista || "-"}</span>
                                {badgeValue ? (
                                  <button
                                    type="button"
                                    className="session-profile-link"
                                    disabled
                                    title={CLONE_ACTION_BLOCKED_TITLE}
                                  >
                                    Profilo
                                  </button>
                                ) : null}
                              </div>
                              <div className="row-meta">
                                <span className="label">Motrice:</span>{" "}
                                <span className="targa" title={getTargaTooltip(motrice) || undefined}>
                                  {motrice || "-"}
                                </span>{" "}
                                <span className="label">Rimorchio:</span>{" "}
                                <span className="targa" title={getTargaTooltip(rimorchio) || undefined}>
                                  {rimorchio || "-"}
                                </span>
                              </div>
                            </div>
                            <span className="row-arrow">-&gt;</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
              <div className="home-col">
                <section className="panel panel-revisioni home-card" style={{ animationDelay: "180ms" }}>
                  <div className="panel-head home-card__head">
                    <div>
                      <h2 className="home-card__title">Revisioni</h2>
                      <span className="home-card__subtitle">
                        Allarmi basati su immatricolazione e ultimo collaudo
                      </span>
                    </div>
                  </div>
                  <div className="home-card__body">
                    <div className="panel-stats">
                      <div className="stat-chip">
                        <span className="stat-label">Scadute</span>
                        <span className="stat-value">{revCounts.scadute}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="stat-label">In scadenza</span>
                        <span className="stat-value">{revCounts.inScadenza}</span>
                      </div>
                    </div>
                    <div className="panel-body">
                    {loading ? (
                      <div className="panel-row panel-row-empty">
                        Caricamento dati...
                      </div>
                    ) : revisioniUrgenti.length === 0 ? (
                      <div className="panel-row panel-row-empty">
                        Nessuna revisione imminente
                      </div>
                    ) : (
                      revisioniUrgenti.map((r, idx) => {
                        const tooltip = getTargaTooltip(r.targa);
                        const scadenzaDate =
                          typeof r.scadenzaTs === "number" ? new Date(r.scadenzaTs) : null;
                        const giorniLabel =
                          r.giorni === null
                            ? "-"
                            : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                        const dossierPath = r.targa
                          ? buildNextDossierPath(r.targa)
                          : NEXT_DOSSIER_LISTA_PATH;
                        const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                        const prenotazione = mezzo?.prenotazioneCollaudo ?? null;
                        const preCollaudo = mezzo?.preCollaudo ?? null;
                        const hasPreCollaudo = Boolean(preCollaudo);
                        const prenCompletata = prenotazione?.completata === true;
                        const prenData = prenotazione?.data ? String(prenotazione.data).trim() : "";
                        const prenDate = prenData ? parseDateFlexible(prenData) : null;
                        let prenDateLabel = prenDate ? formatDateForDisplay(prenDate) : prenData;
                        let prenOra = prenotazione?.ora ? String(prenotazione.ora).trim() : "";
                        prenOra = prenOra ? sanitizeBookingText(prenOra) : "";
                        const prenLuogo = prenotazione?.luogo
                          ? sanitizeBookingText(normalizeFreeText(prenotazione.luogo))
                          : "";
                        const prenNote = prenotazione?.note
                          ? sanitizeBookingText(normalizeFreeText(prenotazione.note))
                          : "";
                        const prenCompletataRaw = prenotazione?.completataIl
                          ? String(prenotazione.completataIl).trim()
                          : "";
                        const prenCompletataDate = prenCompletataRaw
                          ? parseDateFlexible(prenCompletataRaw)
                          : null;
                        const prenCompletataLabel = prenCompletataDate
                          ? formatDateForDisplay(prenCompletataDate)
                          : prenCompletataRaw;
                        let prenLuogoShort = prenLuogo ? truncateAsciiText(prenLuogo, 40) : "";
                        const prenNoteShort = prenNote ? truncateAsciiText(prenNote, 70) : "";
                        if (prenotazione) {
                          if (prenCompletata) {
                            prenDateLabel = `COMPLETATA${prenCompletataLabel ? ` il ${prenCompletataLabel}` : ""}`;
                            prenOra = "";
                            prenLuogoShort = "";
                          } else {
                            prenDateLabel = `PRENOTATA per ${prenDateLabel}`;
                          }
                        }
                        const prenSummary = prenotazione
                          ? `${prenDateLabel}${prenOra ? ` ${prenOra}` : ""}${
                              prenLuogoShort ? ` - ${prenLuogoShort}` : ""
                            }`
                          : "";
                        const showMissingDanger = !prenotazione && r.giorni !== null && (r.giorni ?? 0) <= 30;
                        const scadenzaExtra =
                          r.giorni === null ? "" : ` (${formatGiorniLabel(r.giorni)})`;
                        const statusLabel =
                          r.giorni == null
                            ? "REVISIONE"
                            : r.giorni < 0
                            ? "REVISIONE SCADUTA"
                            : "REVISIONE IN SCADENZA";
                        const mezzoLabel = [r.marca, r.modello].filter(Boolean).join(" ");
                        const canEditPrenotazione = false;
                        return (
                          <div
                            key={r.targa || `rev-${idx}`}
                            className="panel-row panel-row-link"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate(dossierPath)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(dossierPath);
                              }
                            }}
                          >
                            <div className="row-main">
                              <div className="row-title">
                                <span
                                  className="targa"
                                  title={tooltip || undefined}
                                  style={{ fontSize: "18px", fontWeight: 700 }}
                                >
                                  {r.targa || "-"}
                                </span>
                                <span
                                  className={`status ${r.classe}`}
                                  style={{ fontSize: "12px", fontWeight: 600 }}
                                >
                                  {giorniLabel}
                                </span>
                              </div>
                              <div className="row-meta row-meta-stack">
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Stato:</span>{" "}
                                  <strong>{statusLabel}</strong>
                                </div>
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Scadenza:</span>{" "}
                                  <span>
                                    {formatDateForDisplay(scadenzaDate)}
                                    {scadenzaExtra}
                                  </span>
                                </div>
                                <div className="row-meta-line" style={{ fontSize: "14px" }}>
                                  <span className="label">Mezzo:</span>{" "}
                                  <span>{mezzoLabel || "-"}</span>
                                </div>
                                <div className="row-meta-line row-meta-booking">
                                  <span className="label">Prenotazione collaudo:</span>
                                  {prenotazione ? (
                                    <span className="booking-value">
                                      {prenSummary}
                                      {!prenCompletata && prenNoteShort ? (
                                        <span className="booking-note"> - {prenNoteShort}</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className={`booking-missing ${showMissingDanger ? "danger" : ""}`}>
                                      NON PRENOTATO
                                    </span>
                                  )}
                                </div>
                                {canEditPrenotazione ? (
                                  <div className="row-meta-line row-meta-booking">
                                    <span className="booking-actions">
                                      {!prenCompletata ? (
                                        <button
                                          type="button"
                                          className="booking-action primary"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openRevisioneModal(r.targa as string, prenotazione);
                                          }}
                                        >
                                          SEGNA REVISIONE FATTA
                                        </button>
                                      ) : null}
                                      {prenotazione && !prenCompletata ? (
                                        <>
                                          <button
                                            type="button"
                                            className="booking-action"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openPrenotazioneModal(r.targa as string, prenotazione);
                                            }}
                                          >
                                            MODIFICA
                                          </button>
                                          <button
                                            type="button"
                                            className="booking-action danger"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handlePrenotazioneDelete(r.targa as string);
                                            }}
                                          >
                                            CANCELLA
                                          </button>
                                        </>
                                      ) : !prenotazione ? (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPrenotazioneModal(r.targa as string, null);
                                          }}
                                        >
                                          PRENOTA
                                        </button>
                                      ) : null}
                                    </span>
                                  </div>
                                ) : null}
                                <div className="row-meta-line row-meta-booking">
                                  <span className="label">Pre-collaudo:</span>
                                  {hasPreCollaudo ? (
                                    <span className="booking-value">
                                      <span className="badge">Pre-collaudo programmato</span>
                                    </span>
                                  ) : null}
                                  {canEditPrenotazione ? (
                                    <span className="booking-actions">
                                      {hasPreCollaudo ? (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPreCollaudoModal(r.targa as string, preCollaudo);
                                          }}
                                        >
                                          MODIFICA
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="booking-action"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openPreCollaudoModal(r.targa as string, null);
                                          }}
                                        >
                                          PRE-COLLAUDO
                                        </button>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <span className="row-arrow">-&gt;</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  </div>
                </section>
              </div>
            <div className="home-col">
                <section className="panel panel-rimorchi home-card" style={{ animationDelay: "60ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Rimorchi: dove sono</h2>
                <span className="home-card__subtitle">Ultimo luogo da storico eventi</span>
              </div>
            </div>
            <div className="panel-body home-card__body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : rimorchiDaMostrare.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun rimorchio trovato
                </div>
              ) : (
                rimorchiDaMostrare.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const labelMarca = mezzo?.marca ? String(mezzo.marca).trim() : "";
                  const labelModello = mezzo?.modello ? String(mezzo.modello).trim() : "";
                  const rimorchioLabel = [labelMarca, labelModello].filter(Boolean).join(" ");
                  const isEditing = rimorchioEdit?.targa === r.targa;
                  const canEdit = false;

                  if (isEditing) {
                    return (
                      <div
                        key={r.targa || `rim-${idx}`}
                        className="panel-row panel-row-edit"
                      >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {rimorchioLabel ? (
                            <span className="rimorchi-model">— {rimorchioLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                          <div className="rimorchi-edit">
                            <input
                              className="rimorchi-edit-input"
                              value={rimorchioEdit?.luogo ?? ""}
                              onChange={(event) =>
                                setRimorchioEdit((prev) =>
                                  prev ? { ...prev, luogo: event.target.value } : prev
                                )
                              }
                              placeholder="Inserisci luogo..."
                            />
                            <div className="rimorchi-edit-actions">
                              <button
                                type="button"
                                className="rimorchi-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  cancelRimorchioEdit();
                                }}
                              >
                                Annulla
                              </button>
                              <button
                                type="button"
                                className="rimorchi-edit-btn primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void saveRimorchioEdit();
                                }}
                              >
                                Salva
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={r.targa || `rim-${idx}`}
                      className="panel-row next-clone-row-disabled"
                      title={CLONE_ACTION_BLOCKED_TITLE}
                    >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {rimorchioLabel ? (
                            <span className="rimorchi-model">— {rimorchioLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                        <div className="row-meta">
                          <span className="rimorchi-luogo">{r.luogo}</span>
                          {canEdit ? (
                            <button
                              type="button"
                              className="rimorchi-edit-btn"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startRimorchioEdit(r);
                              }}
                            >
                              Modifica
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </div>
                  );
                })
              )}
            </div>
                </section>
              </div>
              <div className="home-col">
                <section className="panel panel-motrici home-card" style={{ animationDelay: "90ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Motrici e trattori: dove sono</h2>
                <span className="home-card__subtitle">Ultimo luogo da storico eventi</span>
              </div>
            </div>
            <div className="panel-body home-card__body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : motriciTrattoriDaMostrare.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun mezzo trovato
                </div>
              ) : (
                motriciTrattoriDaMostrare.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const labelMarca = mezzo?.marca ? String(mezzo.marca).trim() : "";
                  const labelModello = mezzo?.modello ? String(mezzo.modello).trim() : "";
                  const mezzoLabel = [labelMarca, labelModello].filter(Boolean).join(" ");
                  const isEditing = rimorchioEdit?.targa === r.targa;
                  const canEdit = false;

                  if (isEditing) {
                    return (
                      <div
                        key={r.targa || `mot-${idx}`}
                        className="panel-row panel-row-edit"
                      >
                        <div className="row-main">
                          <div className="row-title rimorchi-title">
                            <span className="targa" title={tooltip || undefined}>
                              {r.targa || "-"}
                            </span>
                            {mezzoLabel ? (
                              <span className="rimorchi-model">— {mezzoLabel}</span>
                            ) : null}
                            <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                              {r.inUso ? "IN USO" : r.statusLabel}
                            </span>
                          </div>
                          <div className="rimorchi-edit">
                            <input
                              className="rimorchi-edit-input"
                              value={rimorchioEdit?.luogo ?? ""}
                              onChange={(event) =>
                                setRimorchioEdit((prev) =>
                                  prev ? { ...prev, luogo: event.target.value } : prev
                                )
                              }
                              placeholder="Inserisci luogo..."
                            />
                            <div className="rimorchi-edit-actions">
                              <button
                                type="button"
                                className="rimorchi-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  cancelRimorchioEdit();
                                }}
                              >
                                Annulla
                              </button>
                              <button
                                type="button"
                                className="rimorchi-edit-btn primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void saveRimorchioEdit();
                                }}
                              >
                                Salva
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={r.targa || `mot-${idx}`}
                      className="panel-row next-clone-row-disabled"
                      title={CLONE_ACTION_BLOCKED_TITLE}
                    >
                      <div className="row-main">
                        <div className="row-title rimorchi-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          {mezzoLabel ? (
                            <span className="rimorchi-model">— {mezzoLabel}</span>
                          ) : null}
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : r.statusLabel}
                          </span>
                        </div>
                        <div className="row-meta">
                          <span className="rimorchi-luogo">{r.luogo}</span>
                          {canEdit ? (
                            <button
                              type="button"
                              className="rimorchi-edit-btn"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                startRimorchioEdit(r);
                              }}
                            >
                              Modifica
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </div>
                  );
                })
              )}
            </div>
                </section>
              </div>

          {/*
          <section className="panel panel-revisioni home-card" style={{ animationDelay: "180ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Revisioni</h2>
                <span className="home-card__subtitle">
                  Allarmi basati su immatricolazione e ultimo collaudo
                </span>
              </div>
            </div>
            <div className="home-card__body">
              <div className="panel-stats">
                <div className="stat-chip">
                  <span className="stat-label">Scadute</span>
                  <span className="stat-value">{revCounts.scadute}</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-label">In scadenza</span>
                  <span className="stat-value">{revCounts.inScadenza}</span>
                </div>
              </div>
              <div className="panel-body">
              {loading ? (
                <div className="panel-row panel-row-empty">
                  Caricamento dati...
                </div>
              ) : revisioniUrgenti.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessuna revisione imminente
                </div>
              ) : (
                revisioniUrgenti.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const giorniLabel =
                    r.giorni === null
                      ? "-"
                      : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                  const dossierPath = r.targa
                    ? buildNextDossierPath(r.targa)
                    : NEXT_DOSSIER_LISTA_PATH;
                  const mezzo = mezzoByTarga.get(fmtTarga(r.targa));
                  const prenotazione = mezzo?.prenotazioneCollaudo ?? null;
                  const prenData = prenotazione?.data ? String(prenotazione.data).trim() : "";
                  const prenDate = prenData ? parseDateFlexible(prenData) : null;
                  const prenDateLabel = prenDate ? formatDateForDisplay(prenDate) : prenData;
                  const prenOra = prenotazione?.ora ? String(prenotazione.ora).trim() : "";
                  const prenLuogo = prenotazione?.luogo ? normalizeFreeText(prenotazione.luogo) : "";
                  const prenNote = prenotazione?.note ? normalizeFreeText(prenotazione.note) : "";
                  const prenLuogoShort = prenLuogo ? truncateText(prenLuogo, 40) : "";
                  const prenNoteShort = prenNote ? truncateText(prenNote, 70) : "";
                  const prenSummary = prenotazione
                    ? `${prenDateLabel}${prenOra ? ` ${prenOra}` : ""}${
                        prenLuogoShort ? ` — ${prenLuogoShort}` : ""
                      }`
                    : "";
                  const showMissingDanger = !prenotazione && r.giorni !== null && (r.giorni ?? 0) <= 30;
                  const scadenzaExtra =
                    r.giorni === null ? "" : ` (${formatGiorniLabel(r.giorni)})`;
                  const canEditPrenotazione = false;
                  return (
                    <div
                      key={r.targa || `rev-${idx}`}
                      className="panel-row panel-row-link"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(dossierPath)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(dossierPath);
                        }
                      }}
                    >
                      <div className="row-main">
                        <div className="row-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          <span className={`status ${r.classe}`}>{giorniLabel}</span>
                        </div>
                        <div className="row-meta row-meta-stack">
                          <div className="row-meta-line">
                            <span>
                              Scadenza {formatDateForDisplay(r.scadenza)}
                              {scadenzaExtra}{" "}
                              {r.marca || r.modello
                                ? `- ${r.marca} ${r.modello}`.trim()
                                : ""}
                            </span>
                          </div>
                          <div className="row-meta-line row-meta-booking">
                            <span className="label">Prenotazione collaudo:</span>
                            {prenotazione ? (
                              <span className="booking-value">
                                {prenSummary}
                                {prenNoteShort ? (
                                  <span className="booking-note"> — {prenNoteShort}</span>
                                ) : null}
                              </span>
                            ) : (
                              <span className={`booking-missing ${showMissingDanger ? "danger" : ""}`}>
                                NON PRENOTATO
                              </span>
                            )}
                            {canEditPrenotazione ? (
                              <span className="booking-actions">
                                {prenotazione ? (
                                  <>
                                    <button
                                      type="button"
                                      className="booking-action"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openPrenotazioneModal(r.targa as string, prenotazione);
                                      }}
                                    >
                                      MODIFICA
                                    </button>
                                    <button
                                      type="button"
                                      className="booking-action danger"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handlePrenotazioneDelete(r.targa as string);
                                      }}
                                    >
                                      CANCELLA
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="booking-action primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openPrenotazioneModal(r.targa as string, null);
                                    }}
                                  >
                                    PRENOTA
                                  </button>
                                )}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </section>
          */}

            <section className="home-span2">
              <section className="panel panel-quick home-card home-full" style={{ animationDelay: "240ms" }}>
            <div className="panel-head home-card__head">
              <div>
                <h2 className="home-card__title">Collegamenti rapidi</h2>
                <span className="home-card__subtitle">Tutte le sezioni in un click</span>
              </div>
            </div>
            <div className="home-card__body">
              <div className="quick-toolbar">
                <input
                  className="quick-search-input"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Cerca sezione..."
                  aria-label="Cerca sezione"
                />
              </div>
              {quickSearchActive ? (
                <div className="quick-search-results">
                  {quickSearchResults.length > 0 ? (
                    <div className="quick-grid quick-search-grid">
                      {quickSearchResults.map(renderQuickLink)}
                    </div>
                  ) : (
                    <div className="quick-empty">Nessun risultato</div>
                  )}
                </div>
              ) : (
                <div className="quick-sections">
                  <div className="quick-section quick-favorites">
                    <div className="quick-title">
                      <span>Preferiti</span>
                      <span className="quick-pill quick-pill-favorites">TOP 6</span>
                    </div>
                    <div className="quick-grid quick-favorites-grid">
                      {quickFavorites.map(renderQuickLink)}
                    </div>
                  </div>

                  <div className="quick-accordion">
                    {quickCategories.map((section) => {
                      const isOpen = quickSectionsOpen[section.id];
                      const isExpanded = quickSectionsExpanded[section.id];
                      const visibleLinks = isExpanded
                        ? section.links
                        : section.links.slice(0, 4);
                      const hasMore = section.links.length > 4;
                      return (
                        <div key={section.id} className="quick-accordion-item">
                          <button
                            type="button"
                            className="quick-accordion-toggle"
                            onClick={() => toggleQuickSectionOpen(section.id)}
                            aria-expanded={isOpen}
                          >
                            <span className="quick-accordion-title">
                              <span>{section.title}</span>
                              <span className={`quick-pill quick-pill-${section.id}`}>
                                {quickSectionPills[section.id]}
                              </span>
                            </span>
                            <span className="quick-accordion-meta">
                              {section.links.length}
                            </span>
                            <span className={`quick-accordion-arrow ${isOpen ? "open" : ""}`}>
                              &gt;
                            </span>
                          </button>
                          {isOpen ? (
                            <div className="quick-accordion-body">
                              <div className="quick-grid quick-category-grid">
                                {visibleLinks.map(renderQuickLink)}
                              </div>
                              {hasMore ? (
                                <button
                                  type="button"
                                  className="quick-more-btn"
                                  onClick={() => toggleQuickSectionExpanded(section.id)}
                                >
                                  {isExpanded ? "Mostra meno" : "Mostra tutti"}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="quick-section quick-anagrafiche">
                    <div className="quick-title">
                      <span>Anagrafiche</span>
                      <span className="quick-pill quick-pill-anagrafiche">ANAGRAFICHE</span>
                    </div>
                    <div className="quick-grid quick-anagrafiche-grid">
                      {QUICK_LINKS_ANAGRAFICHE.map(renderQuickLink)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
          </div>
        </div>
      </div>

      <AutistiImportantEventsModal
        open={importantEventsOpen}
        items={importantAutistiItems}
        onClose={() => setImportantEventsOpen(false)}
        onSelect={(event) => {
          setSelectedEvent(event);
          setImportantEventsOpen(false);
        }}
      />

      {prenotazioneModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closePrenotazioneModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Prenotazione collaudo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Prenotazione collaudo</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{prenotazioneTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={prenotazioneForm.data}
                    onChange={(e) =>
                      setPrenotazioneForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={datePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={prenotazioneDateValue}
                    onChange={(e) => handleDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Ora (opzionale)</span>
                <input
                  className="home-modal-input"
                  type="time"
                  value={prenotazioneForm.ora}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, ora: e.target.value }))
                  }
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Luogo (opzionale)</span>
                <input
                  className="home-modal-input"
                  value={prenotazioneForm.luogo}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, luogo: e.target.value }))
                  }
                  placeholder="Motorizzazione / officina / ..."
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Note (opzionale)</span>
                <textarea
                  className="home-modal-textarea"
                  value={prenotazioneForm.note}
                  onChange={(e) =>
                    setPrenotazioneForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Note brevi..."
                  rows={3}
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closePrenotazioneModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handlePrenotazioneSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preCollaudoModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closePreCollaudoModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Programmazione Pre-collaudo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Programmazione Pre-collaudo</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{preCollaudoTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={preCollaudoForm.data}
                    onChange={(e) =>
                      setPreCollaudoForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openPreCollaudoDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={preCollaudoDatePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={preCollaudoDateValue}
                    onChange={(e) => handlePreCollaudoDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Officina</span>
                <input
                  className="home-modal-input"
                  value={preCollaudoForm.officina}
                  onChange={(e) =>
                    setPreCollaudoForm((prev) => ({ ...prev, officina: e.target.value }))
                  }
                  placeholder="Officina / luogo..."
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closePreCollaudoModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handlePreCollaudoSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {revisioneModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closeRevisioneModal}
          role="presentation"
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Segna revisione fatta"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Segna revisione fatta</div>
              <div className="home-modal-subtitle">
                Targa <span className="targa">{revisioneTargetTarga || "-"}</span>
              </div>
            </div>

            <div className="home-modal-body">
              <label className="home-modal-field">
                <span className="home-modal-label">Data</span>
                <div className="home-modal-date-row">
                  <input
                    className="home-modal-input"
                    value={revisioneForm.data}
                    onChange={(e) =>
                      setRevisioneForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    placeholder="gg mm aaaa oppure YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="home-modal-date-btn"
                    onClick={openRevisioneDatePicker}
                    aria-label="Apri calendario"
                    title="Apri calendario"
                  >
                    CALENDARIO
                  </button>
                  <input
                    ref={revisioneDatePickerRef}
                    className="home-modal-date-input"
                    type="date"
                    value={revisioneDateValue}
                    onChange={(e) => handleRevisioneDatePickerChange(e.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Esito</span>
                <input
                  className="home-modal-input"
                  value={revisioneForm.esito}
                  onChange={(e) =>
                    setRevisioneForm((prev) => ({ ...prev, esito: e.target.value }))
                  }
                  placeholder="Es. OK / Respinta / ..."
                />
              </label>

              <label className="home-modal-field">
                <span className="home-modal-label">Note (opzionale)</span>
                <textarea
                  className="home-modal-textarea"
                  value={revisioneForm.note}
                  onChange={(e) =>
                    setRevisioneForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Note brevi..."
                  rows={3}
                />
              </label>
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closeRevisioneModal}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className="home-modal-btn primary"
                onClick={handleRevisioneSave}
              >
                SALVA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {missingModalOpen ? (
        <div
          className="home-modal-backdrop"
          onClick={closeMissingModal}
          role="presentation"
        >
          <div
            className="home-modal missing-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Mezzi con dati mancanti"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-modal-head">
              <div className="home-modal-title">Mezzi con dati mancanti</div>
              <div className="home-modal-subtitle">
                {mezziIncompleti.length} mezzi da completare
              </div>
            </div>

            <div className="home-modal-body missing-modal-body">
              {mezziIncompleti.length === 0 ? (
                <div className="panel-row panel-row-empty">
                  Nessun mezzo incompleto
                </div>
              ) : (
                <div className="missing-list">
                  {mezziIncompleti.map((mezzo) => {
                    const targaLabel = mezzo.targa || "TARGA MANCANTE";
                    const categoriaLabel = mezzo.categoria || "MANCANTE";
                    const autistaLabel = mezzo.autistaNome || "MANCANTE";
                    return (
                      <button
                        key={mezzo.id || mezzo.targa || targaLabel}
                        type="button"
                        className="missing-item"
                        onClick={() => handleMissingSelect(mezzo)}
                      >
                        <div className="missing-item-main">
                          <div className="missing-item-title">
                            <span
                              className={`missing-item-targa ${
                                mezzo.missing.targa ? "is-missing" : ""
                              }`}
                            >
                              {targaLabel}
                            </span>
                            {mezzo.missing.targa ? (
                              <span className="missing-chip">MANCANTE</span>
                            ) : null}
                          </div>
                          <div className="missing-item-meta">
                            <span className="missing-label">Categoria:</span>
                            <span
                              className={`missing-value ${
                                mezzo.missing.categoria ? "is-missing" : ""
                              }`}
                            >
                              {categoriaLabel}
                            </span>
                            <span className="missing-sep">•</span>
                            <span className="missing-label">Autista:</span>
                            <span
                              className={`missing-value ${
                                mezzo.missing.autista ? "is-missing" : ""
                              }`}
                            >
                              {autistaLabel}
                            </span>
                          </div>
                        </div>
                        <span className="row-arrow">-&gt;</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="home-modal-actions">
              <button
                type="button"
                className="home-modal-btn"
                onClick={closeMissingModal}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Home;

