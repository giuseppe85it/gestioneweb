import "./Home.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  applyAlertAction,
  createEmptyAlertsState,
  isMetaChanged,
  normalizeTargaForAlertId,
  parseAlertsState,
  pruneAlertsState,
  stableHash32,
  type AlertAction,
  type AlertMeta,
  type AlertsState,
} from "../utils/alertsState";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const EVENTI_KEY = "@storico_eventi_operativi";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const ALERTS_STATE_KEY = "@alerts_state";
const QUICKLINKS_STORAGE_KEY = "gm_quicklinks_favs_v1";
const DOSSIER_MISSING_ALERT_KEY = "gm_dossier_missing_alert_v1";
const CATEGORIE_RIMORCHI_HOME = [
  "biga",
  "vasca",
  "centina",
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
];
const CATEGORIE_RIMORCHI_HOME_SET = new Set(
  CATEGORIE_RIMORCHI_HOME.map((value) => value.trim().toLowerCase())
);

type MezzoRecord = {
  id?: string;
  targa?: string;
  categoria?: string;
  autistaNome?: string | null;
  marca?: string;
  modello?: string;
  dataImmatricolazione?: string;
  dataUltimoCollaudo?: string;
  dataScadenzaRevisione?: string;
  prenotazioneCollaudo?: PrenotazioneCollaudo | null;
  manutenzioneProgrammata?: boolean;
  manutenzioneDataFine?: string;
};

type PrenotazioneCollaudo = {
  data: string;
  ora?: string;
  luogo?: string;
  note?: string;
};

type SessioneRecord = {
  targaMotrice?: string | null;
  targaRimorchio?: string | null;
  nomeAutista?: string;
  badgeAutista?: string;
  timestamp?: number;
};

type SegnalazioneRecord = {
  id?: string | null;
  data?: number | null;
  timestamp?: number | null;
  stato?: string | null;
  letta?: boolean | null;
  ambito?: string | null;
  targa?: string | null;
  targaCamion?: string | null;
  targaRimorchio?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  tipoProblema?: string | null;
  descrizione?: string | null;
};

type AutistaSuggestion = {
  name: string;
  badge?: string;
  targa?: string;
  priority: number;
};

type EventoOperativo = {
  id?: string | number;
  tipo?: string;
  timestamp?: number;
  luogo?: string | null;
  badgeAutista?: string | null;
  nomeAutista?: string | null;
  autista?: string | null;
  autistaNome?: string | null;
  statoCarico?: string | null;
  condizioni?: unknown;
  source?: string;
  prima?: {
    targaRimorchio?: string | null;
    rimorchio?: string | null;
    targaMotrice?: string | null;
    motrice?: string | null;
    targaCamion?: string | null;
  };
  dopo?: {
    targaRimorchio?: string | null;
    rimorchio?: string | null;
    targaMotrice?: string | null;
    motrice?: string | null;
    targaCamion?: string | null;
  };
  primaRimorchio?: string | null;
  dopoRimorchio?: string | null;
  primaMotrice?: string | null;
  dopoMotrice?: string | null;
};

type HomeAlertSeverity = "danger" | "warning" | "info";

type HomeAlertCandidate = {
  id: string;
  meta: AlertMeta;
  title: string;
  detail: ReactNode;
  severity: HomeAlertSeverity;
  sortBucket: number;
  sortValue: number;
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

type MissingMezzo = {
  id?: string;
  targa: string;
  categoria: string;
  autistaNome: string;
  missing: {
    targa: boolean;
    categoria: boolean;
    autista: boolean;
  };
};

type RimorchioEditState = {
  targa: string;
  luogo: string;
  eventId: string | null;
  eventIndex: number | null;
};

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

function writeQuickLinksStore(next: QuickLinksStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUICKLINKS_STORAGE_KEY, JSON.stringify(next));
  } catch {
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
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DOSSIER_MISSING_ALERT_KEY,
      JSON.stringify(next)
    );
  } catch {
  }
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
  { to: "/ia", label: "IA" },
  { to: "/ia/libretto", label: "IA Libretto" },
  { to: "/ia/documenti", label: "IA Documenti" },
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

function unwrapList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

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

function isMissing(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
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
  if (!date) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTimeForDisplay(ts?: number | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSegnalazioneTarga(r: SegnalazioneRecord): string {
  const targa = r.targa ?? r.targaCamion ?? r.targaRimorchio ?? "";
  return fmtTarga(targa);
}

function normalizeFreeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function formatGiorniLabel(giorni: number): string {
  if (giorni === 0) return "oggi";
  const abs = Math.abs(giorni);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return giorni < 0 ? `${base} fa` : `tra ${base}`;
}

// Revisione automatica (copiata da Mezzi.tsx)
function calculaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) {
      return firstRevision;
    }

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(
      nextFromImmatricolazione.getFullYear() + 2
    );
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

function giorniDaOggi(target: Date | null): number | null {
  if (!target) return null;
  const today = new Date();
  const utcToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const utcTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.round((utcTarget - utcToday) / 86400000);
}

function normalizeCategoria(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function isRimorchioCategoria(categoria?: string | null): boolean {
  const key = normalizeCategoria(categoria);
  if (!key) return false;
  return CATEGORIE_RIMORCHI_HOME_SET.has(key);
}

function Home() {
  const navigate = useNavigate();
  const nameSuggestRef = useRef<HTMLDivElement | null>(null);
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const alertsStateRef = useRef<AlertsState | null>(null);
  const [mezzi, setMezzi] = useState<MezzoRecord[]>([]);
  const [sessioni, setSessioni] = useState<SessioneRecord[]>([]);
  const [eventi, setEventi] = useState<EventoOperativo[]>([]);
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneRecord[]>([]);
  const [alertsState, setAlertsState] = useState<AlertsState | null>(null);
  const [alertsNow, setAlertsNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeQuery, setBadgeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [nameSuggestOpen, setNameSuggestOpen] = useState(false);
  const [rimorchioEdit, setRimorchioEdit] = useState<RimorchioEditState | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickLinksStore, setQuickLinksStore] = useState<QuickLinksStore>(() =>
    readQuickLinksStore()
  );
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
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [mezziRaw, sessioniRaw, eventiRaw, segnalazioniRaw, alertsRaw] = await Promise.all([
          getItemSync(MEZZI_KEY),
          getItemSync(SESSIONI_KEY),
          getItemSync(EVENTI_KEY),
          getItemSync(SEGNALAZIONI_KEY),
          getItemSync(ALERTS_STATE_KEY),
        ]);
        if (!mounted) return;
        setMezzi(unwrapList(mezziRaw));
        setSessioni(unwrapList(sessioniRaw));
        setEventi(unwrapList(eventiRaw));
        setSegnalazioni(unwrapList(segnalazioniRaw));

        const parsedAlerts = parseAlertsState(alertsRaw);
        const pruned = pruneAlertsState(parsedAlerts, Date.now());
        setAlertsState(pruned.state);
        alertsStateRef.current = pruned.state;
        if (pruned.didChange) {
          void setItemSync(ALERTS_STATE_KEY, pruned.state);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshMezzi = async () => {
    try {
      const mezziRaw = await getItemSync(MEZZI_KEY);
      setMezzi(unwrapList(mezziRaw));
    } catch {
    }
  };

  useEffect(() => {
    void refreshMezzi();
  }, [location.key]);

  useEffect(() => {
    const timer = window.setInterval(() => setAlertsNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleAutistaSearch = () => {
    const badgeValue = badgeQuery.trim();
    if (badgeValue) {
      navigate(`/autista-360/${encodeURIComponent(badgeValue)}`);
      return;
    }
    const nameValue = nameQuery.trim();
    if (!nameValue) return;
    navigate(`/autista-360?nome=${encodeURIComponent(nameValue)}`);
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
    setRimorchioEdit({
      targa: rimorchio.targa,
      luogo: rimorchio.luogoRaw || "",
      eventId: rimorchio.luogoEventId,
      eventIndex: rimorchio.luogoEventIndex,
    });
  };

  const cancelRimorchioEdit = () => {
    setRimorchioEdit(null);
  };

  const saveRimorchioEdit = async () => {
    if (!rimorchioEdit) return;
    try {
      const raw = await getItemSync(EVENTI_KEY);
      const list = unwrapList(raw);
      const updated = list.slice();
      let idx = -1;
      if (rimorchioEdit.eventId) {
        idx = updated.findIndex(
          (evt) => String((evt as { id?: unknown }).id ?? "") === rimorchioEdit.eventId
        );
      }
      if (idx < 0 && rimorchioEdit.eventIndex != null && rimorchioEdit.eventIndex >= 0) {
        idx = rimorchioEdit.eventIndex;
      }
      const luogoValue = rimorchioEdit.luogo.trim();
      if (idx >= 0 && idx < updated.length) {
        const original = updated[idx] || {};
        updated[idx] = {
          ...original,
          luogo: luogoValue || null,
        };
      } else {
        const targaKey = fmtTarga(rimorchioEdit.targa);
        if (!targaKey) {
          setRimorchioEdit(null);
          return;
        }
        const mezzo = mezzoByTarga.get(targaKey);
        const isRimorchio = isRimorchioCategoria(mezzo?.categoria);
        const now = Date.now();
        const id = `CAMBIO_ASSETTO-ADMIN-${now}-${targaKey}`;
        const assetto = isRimorchio
          ? {
              targaRimorchio: targaKey,
              rimorchio: targaKey,
              targaMotrice: null,
              motrice: null,
              targaCamion: null,
            }
          : {
              targaRimorchio: null,
              rimorchio: null,
              targaMotrice: targaKey,
              motrice: targaKey,
              targaCamion: targaKey,
            };
        const newEvent: EventoOperativo = {
          id,
          tipo: "CAMBIO_ASSETTO",
          timestamp: now,
          luogo: luogoValue || null,
          prima: { ...assetto },
          dopo: { ...assetto },
          source: "Home",
        };
        updated.push(newEvent);
      }

      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const rawObj = raw as Record<string, unknown>;
        if (Array.isArray(rawObj.value)) {
          await setItemSync(EVENTI_KEY, { ...rawObj, value: updated });
        } else if (Array.isArray(rawObj.items)) {
          await setItemSync(EVENTI_KEY, { ...rawObj, items: updated });
        } else {
          await setItemSync(EVENTI_KEY, updated);
        }
      } else {
        await setItemSync(EVENTI_KEY, updated);
      }

      setEventi(updated as EventoOperativo[]);
      setRimorchioEdit(null);
    } catch {
      setRimorchioEdit(null);
    }
  };

  const closePrenotazioneModal = () => {
    setPrenotazioneModalOpen(false);
    setPrenotazioneTargetTarga(null);
  };

  const openPrenotazioneModal = (
    targa: string,
    current?: PrenotazioneCollaudo | null
  ) => {
    setPrenotazioneTargetTarga(targa);
    const luogoValue = current ? String(current?.luogo ?? "") : "Camorino";
    setPrenotazioneForm({
      data: String(current?.data ?? ""),
      ora: String(current?.ora ?? ""),
      luogo: luogoValue,
      note: String(current?.note ?? ""),
    });
    setPrenotazioneModalOpen(true);
  };

  const persistPrenotazioneCollaudo = (
    targa: string,
    prenotazione: PrenotazioneCollaudo | null
  ) => {
    const key = fmtTarga(targa);
    if (!key) return;
    const idx = mezzi.findIndex((m) => fmtTarga(m.targa) === key);
    if (idx < 0) {
      window.alert("Mezzo non trovato.");
      return;
    }
    const updated = [...mezzi];
    updated[idx] = { ...updated[idx], prenotazioneCollaudo: prenotazione };
    setMezzi(updated);
    void setItemSync(MEZZI_KEY, updated);
  };

  const handlePrenotazioneSave = () => {
    if (!prenotazioneTargetTarga) return;
    const data = prenotazioneForm.data.trim();
    if (!data) {
      window.alert("Inserisci la data della prenotazione collaudo.");
      return;
    }
    if (!parseDateFlexible(data)) {
      window.alert("Data non valida. Usa formato gg mm aaaa oppure YYYY-MM-DD.");
      return;
    }

    const ora = prenotazioneForm.ora.trim();
    if (ora && !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(ora)) {
      window.alert("Ora non valida. Usa formato HH:mm.");
      return;
    }

    const luogo = prenotazioneForm.luogo.trim();
    const note = prenotazioneForm.note.trim();

    const next: PrenotazioneCollaudo = {
      data,
      ...(ora ? { ora } : {}),
      ...(luogo ? { luogo } : {}),
      ...(note ? { note } : {}),
    };

    persistPrenotazioneCollaudo(prenotazioneTargetTarga, next);
    closePrenotazioneModal();
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

  const handleDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split("-");
    const picked = buildDate(year, month, day);
    if (!picked) return;
    setPrenotazioneForm((prev) => ({ ...prev, data: formatDateForDisplay(picked) }));
  };

  const handlePrenotazioneDelete = (targa: string) => {
    if (!window.confirm("Cancellare la prenotazione collaudo per questo mezzo?")) {
      return;
    }
    persistPrenotazioneCollaudo(targa, null);
  };

  const recordQuickLinkUse = (id: string) => {
    const now = Date.now();
    setQuickLinksStore((prev) => {
      const current = prev.usage[id] ?? { count: 0, lastUsedAt: 0 };
      const nextUsage = {
        ...prev.usage,
        [id]: { count: current.count + 1, lastUsedAt: now },
      };
      const next = { ...prev, usage: nextUsage };
      writeQuickLinksStore(next);
      return next;
    });
  };

  const toggleQuickLinkPin = (id: string) => {
    setQuickLinksStore((prev) => {
      const isPinned = prev.pins.includes(id);
      if (isPinned) {
        const next = {
          ...prev,
          pins: prev.pins.filter((pinId: string) => pinId !== id),
        };
        writeQuickLinksStore(next);
        return next;
      }
      const trimmedPins = prev.pins.slice(0, 2);
      const next = { ...prev, pins: [id, ...trimmedPins] };
      writeQuickLinksStore(next);
      return next;
    });
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
          link.to.startsWith("/autisti-inbox") ||
          link.to.startsWith("/autisti-admin")
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
        if (link.to.startsWith("/ia")) {
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
    return (
      <div key={link.id} className="quick-link-item">
        <Link
          to={link.to}
          className={`quick-link ${isPinned ? "pinned" : ""}`}
          onClick={() => recordQuickLinkUse(link.id)}
        >
          <span className="quick-link-label">{link.label}</span>
          {link.description ? (
            <span className="quick-link-desc">{link.description}</span>
          ) : null}
          {isPinned ? <span className="quick-link-badge">PIN</span> : null}
        </Link>
        <button
          type="button"
          className={`quick-pin-toggle ${isPinned ? "active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleQuickLinkPin(link.id);
          }}
          aria-pressed={isPinned}
          title={isPinned ? "Rimuovi pin" : "Fissa nei preferiti"}
        >
          PIN
        </button>
      </div>
    );
  };

  // NOTE (audit):
  // - La lista rimorchi nasce da mezzi filtrati per categoria (isRimorchioCategoria).
  // - Il luogo deriva dall'ultimo evento operativo associato alla targa.
  // - Le sessioni attive marcano l'inUso tramite targaRimorchio.
  // - In UI veniva applicato rimorchi.slice(0, 6) nel render.
  // - Quel cap e' la causa diretta del limite a 6 elementi mostrati.
  // - I filtri/ordinamenti non riducevano stabilmente a 6 da soli.
  // - Ora il rendering non limita e si separano rimorchi vs altri mezzi.
  const { rimorchiDaMostrare, motriciTrattoriDaMostrare } = useMemo(() => {
    const inUsoRimorchio = new Set(
      sessioni
        .map((s) => fmtTarga(s.targaRimorchio))
        .filter((t) => t.length > 0)
    );
    const inUsoMotrice = new Set(
      sessioni
        .map((s) => fmtTarga(s.targaMotrice))
        .filter((t) => t.length > 0)
    );
    const rimorchiAgganciati = new Set(inUsoRimorchio);

    const ultimoLuogo = new Map<
      string,
      { timestamp: number; luogo: string | null; eventId: string | null; eventIndex: number | null }
    >();
    eventi.forEach((evt, index) => {
      const ts = typeof evt?.timestamp === "number" ? evt.timestamp : 0;
      const rawLuogo = typeof evt?.luogo === "string" ? evt.luogo.trim() : "";
      const luogo = rawLuogo || null;
      const rawEventId = (evt as { id?: unknown }).id;
      const eventId = rawEventId != null ? String(rawEventId) : null;

      const targas = new Set<string>();
      const rimorchioPrima = fmtTarga(
        evt?.prima?.targaRimorchio ?? evt?.prima?.rimorchio ?? evt?.primaRimorchio
      );
      const rimorchioDopo = fmtTarga(
        evt?.dopo?.targaRimorchio ?? evt?.dopo?.rimorchio ?? evt?.dopoRimorchio
      );
      const motricePrima = fmtTarga(
        evt?.prima?.targaMotrice ??
          evt?.prima?.motrice ??
          evt?.prima?.targaCamion ??
          evt?.primaMotrice
      );
      const motriceDopo = fmtTarga(
        evt?.dopo?.targaMotrice ??
          evt?.dopo?.motrice ??
          evt?.dopo?.targaCamion ??
          evt?.dopoMotrice
      );
      if (rimorchioPrima) targas.add(rimorchioPrima);
      if (rimorchioDopo) targas.add(rimorchioDopo);
      if (motricePrima) targas.add(motricePrima);
      if (motriceDopo) targas.add(motriceDopo);

      targas.forEach((targa) => {
        const prev = ultimoLuogo.get(targa);
        if (
          !prev ||
          ts > prev.timestamp ||
          (ts === prev.timestamp && index > (prev.eventIndex ?? -1))
        ) {
          ultimoLuogo.set(targa, {
            timestamp: ts,
            luogo,
            eventId,
            eventIndex: index,
          });
        }
      });
    });

    const rimorchiDaMostrare: Array<{
      targa: string;
      categoria: string;
      autistaNome: string | null;
      inUso: boolean;
      luogo: string;
      luogoRaw: string;
      luogoEventId: string | null;
      luogoEventIndex: number | null;
      statusLabel: string;
    }> = [];
    const motriciTrattoriDaMostrare: Array<{
      targa: string;
      categoria: string;
      autistaNome: string | null;
      inUso: boolean;
      luogo: string;
      luogoRaw: string;
      luogoEventId: string | null;
      luogoEventIndex: number | null;
      statusLabel: string;
    }> = [];

    mezzi.forEach((m) => {
      const targa = fmtTarga(m.targa);
      if (!targa) return;
      const isRimorchio = isRimorchioCategoria(m.categoria);
      const inUso = isRimorchio ? inUsoRimorchio.has(targa) : inUsoMotrice.has(targa);
      if (inUso) return;
      if (isRimorchio && rimorchiAgganciati.has(targa)) return;
      const luogoInfo = ultimoLuogo.get(targa);
      const luogoRaw = luogoInfo?.luogo || "";
      const luogo = luogoRaw || "Luogo non impostato";
      const entry = {
        targa,
        categoria: m.categoria || "-",
        autistaNome: m.autistaNome || null,
        inUso,
        luogo,
        luogoRaw,
        luogoEventId: luogoInfo?.eventId ?? null,
        luogoEventIndex: luogoInfo?.eventIndex ?? null,
        statusLabel: isRimorchio ? "SGANCIATO" : "LIBERO",
      };
      if (isRimorchio) {
        rimorchiDaMostrare.push(entry);
      } else {
        motriciTrattoriDaMostrare.push(entry);
      }
    });

    rimorchiDaMostrare.sort((a, b) => a.targa.localeCompare(b.targa));
    motriciTrattoriDaMostrare.sort((a, b) => a.targa.localeCompare(b.targa));
    return { rimorchiDaMostrare, motriciTrattoriDaMostrare };
  }, [mezzi, sessioni, eventi]);

  const sessioniAttive = useMemo(() => sessioni.slice(0, 6), [sessioni]);

  const revisioni = useMemo(() => {
    return mezzi.map((m) => {
      const scadenzaPrimaria = parseDateFlexible(m.dataScadenzaRevisione || "");
      const immDate = parseDateFlexible(m.dataImmatricolazione || "");
      const collaudoDate = parseDateFlexible(m.dataUltimoCollaudo || "");
      const computed = calculaProssimaRevisione(immDate, collaudoDate);
      const scadenza = scadenzaPrimaria ?? computed;
      const giorni = giorniDaOggi(scadenza);
      let classe = "";
      if (giorni !== null && giorni <= 30) {
        classe = "deadline-danger";
      }
      return {
        targa: fmtTarga(m.targa),
        marca: m.marca || "",
        modello: m.modello || "",
        scadenza,
        giorni,
        classe,
      };
    });
  }, [mezzi]);

  const revisioniUrgenti = useMemo(() => {
    return revisioni
      .filter((r) => r.giorni !== null)
      .sort((a, b) => (a.giorni ?? 0) - (b.giorni ?? 0))
      .slice(0, 6);
  }, [revisioni]);

  const revCounts = useMemo(() => {
    const valid = revisioni.filter((r) => r.giorni !== null);
    const scadute = valid.filter((r) => (r.giorni ?? 0) < 0).length;
    const inScadenza = valid.filter(
      (r) => (r.giorni ?? 0) >= 0 && (r.giorni ?? 0) <= 30
    ).length;
    return { scadute, inScadenza };
  }, [revisioni]);

  const mezziIncompleti = useMemo<MissingMezzo[]>(() => {
    return mezzi
      .map((m) => {
        const targaValue = fmtTarga(m.targa);
        const categoriaValue = normalizeName(m.categoria);
        const autistaValue = normalizeName(m.autistaNome);
        const missing = {
          targa: isMissing(m.targa),
          categoria: isMissing(m.categoria),
          autista: isMissing(m.autistaNome),
        };
        return {
          id: m.id ? String(m.id) : undefined,
          targa: targaValue,
          categoria: categoriaValue,
          autistaNome: autistaValue,
          missing,
        };
      })
      .filter((m) => m.missing.targa || m.missing.categoria || m.missing.autista)
      .sort((a, b) => {
        if (a.missing.targa !== b.missing.targa) {
          return a.missing.targa ? -1 : 1;
        }
        return a.targa.localeCompare(b.targa);
      });
  }, [mezzi]);

  const missingAlertVisible =
    mezziIncompleti.length > 0 &&
    alertsNow >= missingAlertState.nextRemindAt;

  const updateMissingAlertState = (nextRemindAt: number) => {
    const next = { nextRemindAt };
    setMissingAlertState(next);
    writeMissingAlertState(next);
  };

  const handleMissingIgnore = () => {
    updateMissingAlertState(Date.now() + 86_400_000);
  };

  const handleMissingLater = () => {
    updateMissingAlertState(Date.now() + 259_200_000);
  };

  const handleMissingNow = () => {
    setMissingModalOpen(true);
  };

  const closeMissingModal = () => {
    setMissingModalOpen(false);
    void refreshMezzi();
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
    navigate(`/mezzi${query ? `?${query}` : ""}`);
  };

  const alertCandidates = useMemo<HomeAlertCandidate[]>(() => {
    const candidates: HomeAlertCandidate[] = [];

    revisioni
      .filter((r) => r.giorni !== null && (r.giorni ?? 0) <= 30)
      .sort((a, b) => (a.giorni ?? 0) - (b.giorni ?? 0))
      .forEach((r) => {
        const targaId = normalizeTargaForAlertId(r.targa);
        if (!targaId) return;
        const scadenzaMs = r.scadenza ? r.scadenza.getTime() : 0;
        const giorni = r.giorni ?? 0;
        const meta: AlertMeta = { type: "revisione", ref: String(scadenzaMs || "") };
        candidates.push({
          id: `revisione:${targaId}`,
          meta,
          title: giorni < 0 ? "Revisione scaduta" : "Revisione in scadenza",
          detail: (
            <div className="alert-detail-row">
              <span className="targa">{r.targa || "-"}</span>
              <span className="alert-detail">
                {giorni < 0 ? "Scaduta" : "Scade"} {formatGiorniLabel(giorni)}
              </span>
              <span className="alert-detail">({formatDateForDisplay(r.scadenza)})</span>
            </div>
          ),
          severity: "danger",
          sortBucket: 0,
          sortValue: giorni,
        });
      });

    const segnalazioniNuove = segnalazioni
      .map((s) => {
        const ts =
          typeof s.data === "number"
            ? s.data
            : typeof s.timestamp === "number"
            ? s.timestamp
            : 0;
        const isNuova = s.stato === "nuova" || s.letta === false;
        return { src: s, ts, isNuova };
      })
      .filter((s) => s.isNuova)
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

    segnalazioniNuove.forEach(({ src, ts }) => {
      const targa = buildSegnalazioneTarga(src);
      const targaId = normalizeTargaForAlertId(targa);
      const idBase =
        src.id && String(src.id).trim()
          ? String(src.id).trim()
          : stableHash32(
              [
                String(ts || 0),
                targaId,
                String(src.badgeAutista || ""),
                normalizeFreeText(src.tipoProblema),
                normalizeFreeText(src.descrizione),
              ].join("|")
            );

      const contentSig = stableHash32(
        [
          String(ts || 0),
          targaId,
          String(src.badgeAutista || ""),
          normalizeFreeText(src.ambito),
          normalizeFreeText(src.tipoProblema),
          normalizeFreeText(src.descrizione),
        ].join("|")
      );

      const meta: AlertMeta = { type: "segnalazione", ref: `v1:${ts || 0}:${contentSig}` };
      const tipo = truncateText(normalizeFreeText(src.tipoProblema) || "-", 48);
      const desc = truncateText(normalizeFreeText(src.descrizione) || "-", 90);
      candidates.push({
        id: `segnalazione:${idBase}`,
        meta,
        title: "Segnalazione non letta",
        detail: (
          <div className="alert-detail-row">
            <span className="targa">{targa || "-"}</span>
            <span className="alert-detail">{formatDateTimeForDisplay(ts)}</span>
            <span className="alert-detail">{tipo}</span>
            <span className="alert-detail">{desc}</span>
          </div>
        ),
        severity: "warning",
        sortBucket: 1,
        sortValue: -(ts || 0),
      });
    });

    const motrici = new Map<string, Array<{ badgeAutista: string | null; nomeAutista: string | null }>>();
    const rimorchi = new Map<string, Array<{ badgeAutista: string | null; nomeAutista: string | null }>>();
    sessioni.forEach((s) => {
      const badgeAutista = s?.badgeAutista ? String(s.badgeAutista) : null;
      const nomeAutista = s?.nomeAutista ? String(s.nomeAutista) : null;
      const targaMotrice = normalizeTargaForAlertId(s?.targaMotrice ?? null);
      const targaRimorchio = normalizeTargaForAlertId(s?.targaRimorchio ?? null);

      if (targaMotrice) {
        const list = motrici.get(targaMotrice) || [];
        list.push({ badgeAutista, nomeAutista });
        motrici.set(targaMotrice, list);
      }

      if (targaRimorchio) {
        const list = rimorchi.get(targaRimorchio) || [];
        list.push({ badgeAutista, nomeAutista });
        rimorchi.set(targaRimorchio, list);
      }
    });

    const pushConflictAlert = (scope: "motrice" | "rimorchio", targaId: string, list: Array<{ badgeAutista: string | null; nomeAutista: string | null }>) => {
      const seen = new Set<string>();
      const labels = list
        .map((c) => {
          const badge = c.badgeAutista ? `badge ${c.badgeAutista}` : "badge -";
          const nome = c.nomeAutista ?? "-";
          return `${badge} (${nome})`;
        })
        .filter((label) => {
          if (seen.has(label)) return false;
          seen.add(label);
          return true;
        })
        .sort((a, b) => a.localeCompare(b));

      const meta: AlertMeta = {
        type: "conflitto",
        ref: `v1:${stableHash32([scope, targaId, String(labels.length), labels.join("|")].join("|"))}`,
      };

      const labelText = truncateText(labels.join(", "), 120);
      candidates.push({
        id: `conflitto:${scope}:${targaId}`,
        meta,
        title: scope === "motrice" ? "Conflitto agganci (motrice)" : "Conflitto agganci (rimorchio)",
        detail: (
          <div className="alert-detail-row">
            <span className="targa">{targaId}</span>
            <span className="alert-detail">
              In uso da {labels.length} sessioni
            </span>
            {labelText ? <span className="alert-detail">{labelText}</span> : null}
          </div>
        ),
        severity: "danger",
        sortBucket: 0,
        sortValue: -1,
      });
    };

    Array.from(motrici.entries())
      .filter(([, list]) => list.length > 1)
      .forEach(([targaId, list]) => pushConflictAlert("motrice", targaId, list));

    Array.from(rimorchi.entries())
      .filter(([, list]) => list.length > 1)
      .forEach(([targaId, list]) => pushConflictAlert("rimorchio", targaId, list));

    return candidates.sort((a, b) => {
      if (a.sortBucket !== b.sortBucket) return a.sortBucket - b.sortBucket;
      if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue;
      return a.title.localeCompare(b.title);
    });
  }, [revisioni, segnalazioni, sessioni]);

  const candidateAlertIds = useMemo(() => new Set(alertCandidates.map((a) => a.id)), [alertCandidates]);

  useEffect(() => {
    if (!alertsState) return;
    const now = Date.now();

    let didChange = false;
    let next = alertsState;
    const nextItems: AlertsState["items"] = { ...next.items };

    alertCandidates.forEach((candidate) => {
      const item = nextItems[candidate.id];
      if (!item) return;
      if (isMetaChanged(item.meta, candidate.meta)) {
        delete nextItems[candidate.id];
        didChange = true;
      }
    });

    if (didChange) {
      next = { ...next, items: nextItems };
    }

    const pruned = pruneAlertsState(next, now, candidateAlertIds);
    if (pruned.didChange) {
      next = pruned.state;
      didChange = true;
    }

    if (!didChange) return;
    setAlertsState(next);
    alertsStateRef.current = next;
    void setItemSync(ALERTS_STATE_KEY, next);
  }, [alertCandidates, alertsState, candidateAlertIds]);

  const visibleAlerts = useMemo(() => {
    const state = alertsState ?? createEmptyAlertsState();
    return alertCandidates.filter((candidate) => {
      const item = state.items[candidate.id];
      if (!item) return true;
      if (isMetaChanged(item.meta, candidate.meta)) return true;
      if (item.ackAt !== null) return false;
      if (item.snoozeUntil !== null && alertsNow < item.snoozeUntil) return false;
      return true;
    });
  }, [alertCandidates, alertsNow, alertsState]);

  const handleAlertAction = (candidate: HomeAlertCandidate, action: AlertAction) => {
    const now = Date.now();
    const base = alertsStateRef.current ?? alertsState ?? createEmptyAlertsState();
    const next = applyAlertAction(base, candidate.id, candidate.meta, action, now);
    setAlertsState(next);
    alertsStateRef.current = next;
    void setItemSync(ALERTS_STATE_KEY, next);
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
              <Link to="/autisti-admin" className="hero-card">
                <div className="hero-card-title">Centro rettifica dati (admin)</div>
                <div className="hero-card-value hero-card-subtext">
                  Correggi dati e risolvi anomalie operative.
                </div>
              </Link>
              <Link to="/mezzi" className="hero-card">
                <div className="hero-card-title">Mezzi</div>
                <div className="hero-card-value">Anagrafiche</div>
              </Link>
              <Link to="/manutenzioni" className="hero-card">
                <div className="hero-card-title">Manutenzioni</div>
                <div className="hero-card-value">Registro</div>
              </Link>
              <Link to="/autisti-inbox" className="hero-card">
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
                            to={`/mezzo-360/${encodeURIComponent(r.targa)}`}
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
                  </div>
                  <div className="panel-body alerts-list home-card__body">
                    {loading || !alertsState ? (
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
                                onClick={handleMissingIgnore}
                              >
                                Ignora
                              </button>
                              <button
                                type="button"
                                className="alert-action"
                                onClick={handleMissingLater}
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
                          return (
                            <div
                              key={alert.id}
                              className={`alert-row alert-${alert.severity}`}
                            >
                              <div className="alert-main">
                                <div className="alert-title">
                                  <span className="alert-title-text">{alert.title}</span>
                                  <span className={`status ${badgeClass}`}>{badgeLabel}</span>
                                </div>
                                <div className="alert-detail">{alert.detail}</div>
                              </div>
                              <div className="alert-actions">
                                <button
                                  type="button"
                                  className="alert-action"
                                  onClick={() => handleAlertAction(alert, "snooze_1d")}
                                >
                                  Ignora
                                </button>
                                <button
                                  type="button"
                                  className="alert-action"
                                  onClick={() => handleAlertAction(alert, "snooze_3d")}
                                >
                                  In seguito
                                </button>
                                <button
                                  type="button"
                                  className="alert-action primary"
                                  onClick={() => handleAlertAction(alert, "ack")}
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
                      <span className="home-card__subtitle">Ultime 6 sessioni live</span>
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
                        const profilePath = badgeValue
                          ? `/autista-360/${encodeURIComponent(badgeValue)}`
                          : "";
                        return (
                          <div
                            key={`${s.badgeAutista || "s"}-${idx}`}
                            className="panel-row panel-row-link"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/autisti-inbox")}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate("/autisti-inbox");
                              }
                            }}
                          >
                            <div className="row-main">
                              <div className="row-title">
                                <span>{s.nomeAutista || "Autista"}</span>
                                <span className="badge">badge {s.badgeAutista || "-"}</span>
                                {badgeValue ? (
                                  <button
                                    type="button"
                                    className="session-profile-link"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      navigate(profilePath);
                                    }}
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
                        const giorniLabel =
                          r.giorni === null
                            ? "-"
                            : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                        const dossierPath = r.targa
                          ? `/dossiermezzi/${encodeURIComponent(r.targa)}`
                          : "/dossiermezzi";
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
                              prenLuogoShort ? ` ƒ?" ${prenLuogoShort}` : ""
                            }`
                          : "";
                        const showMissingDanger = !prenotazione && r.giorni !== null && (r.giorni ?? 0) <= 30;
                        const scadenzaExtra =
                          r.giorni === null ? "" : ` (${formatGiorniLabel(r.giorni)})`;
                        const canEditPrenotazione = Boolean(r.targa);
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
                                        <span className="booking-note"> ƒ?" {prenNoteShort}</span>
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
                  const canEdit = !r.inUso;

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
                    <Link
                      key={r.targa || `rim-${idx}`}
                      to="/autisti-admin"
                      className="panel-row"
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
                    </Link>
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
                  const canEdit = !r.inUso;

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
                    <Link
                      key={r.targa || `mot-${idx}`}
                      to="/autisti-admin"
                      className="panel-row"
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
                    </Link>
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
                    ? `/dossiermezzi/${encodeURIComponent(r.targa)}`
                    : "/dossiermezzi";
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
                  const canEditPrenotazione = Boolean(r.targa);
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
                    📅
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
